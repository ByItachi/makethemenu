// Toplu SMS altyapısı: her işletme kendi kuyruğuna mesaj ekler (requireRestaurant ile izole).
// Sağlayıcı (SMS_PROVIDER) yapılandırılmamışsa mesajlar yalnızca kuyrukta bekler; "gönderildi" iddiası yapılmaz.
import type { Express, Request, Response } from "express";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "./db";
import { smsOutbox, smsInbound } from "@shared/schema";
import { requireRestaurant, tenantId } from "./auth/middleware";
import { getSmsTransport } from "./sms";
import { enqueueSms } from "./sms/outbox";
import { verifyIletimerkeziWebhook, verifyNetgsmWebhook, processSmsWebhook } from "./sms/webhook";
import { createApiKey, listApiKeys, revokeApiKey } from "./sms/apiKey";
import { getBalance, getLedgerHistory, applyLedgerEntry } from "./sms/balance";
import { requestOtp, verifyOtp } from "./sms/otp";
import { getTemplates, upsertTemplate, resetTemplate, EVENT_KEYS, type EventKey } from "./sms/templates";
import { rateLimit } from "./auth/middleware";

const bulkSchema = z.object({
  messages: z.array(z.object({
    phone: z.string().min(10).max(32),
    text: z.string().min(1).max(600),
  })).min(1).max(500),
  // Belirtilirse ve gelecekte bir tarihse, mesajlar 'scheduled' olarak kuyruğa alınır ve
  // yalnızca o zaman geldiğinde işçi (worker) tarafından gönderilir.
  scheduledAt: z.string().datetime().optional(),
});

const otpRequestSchema = z.object({
  phone: z.string().min(10).max(32),
  purpose: z.string().min(1).max(32).default("generic"),
});

const otpVerifySchema = z.object({
  phone: z.string().min(10).max(32),
  purpose: z.string().min(1).max(32).default("generic"),
  code: z.string().min(4).max(10),
});

// IP bazlı hız sınırı: OTP isteği/doğrulaması kaba kuvvet veya SMS israfı için kötüye kullanılabilir.
const otpRequestLimit = rateLimit({ windowMs: 60_000, max: 10, keyPrefix: "otp-request" });
const otpVerifyLimit = rateLimit({ windowMs: 60_000, max: 20, keyPrefix: "otp-verify" });

export function registerSmsRoutes(app: Express) {
  app.get("/api/ops/sms/status", requireRestaurant, async (req: Request, res: Response) => {
    const rid = tenantId(req);
    const transport = getSmsTransport();

    // Kuyruk istatistikleri
    const rows = await db.select({ status: smsOutbox.status }).from(smsOutbox).where(eq(smsOutbox.restaurantId, rid));
    const queue = { queued: 0, sending: 0, sent: 0, failed: 0, retry: 0, scheduled: 0 } as Record<string, number>;
    for (const r of rows) {
      if (r.status in queue) queue[r.status] += 1;
    }

    res.json({
      configured: Boolean(transport),
      provider: transport?.name ?? null,
      queue,
    });
  });

  app.post("/api/ops/sms/bulk", requireRestaurant, async (req: Request, res: Response) => {
    const parsed = bulkSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Geçersiz istek.", issues: parsed.error.issues });
    const rid = tenantId(req);
    const scheduledAt = parsed.data.scheduledAt ? new Date(parsed.data.scheduledAt) : null;
    if (scheduledAt && (Number.isNaN(scheduledAt.getTime()) || scheduledAt.getTime() <= Date.now())) {
      return res.status(400).json({ message: "Zamanlama tarihi gelecekte olmalı." });
    }
    for (const m of parsed.data.messages) {
      await enqueueSms(rid, m.phone, m.text, scheduledAt);
    }
    const transport = getSmsTransport();
    res.json({
      queued: parsed.data.messages.length,
      scheduled: Boolean(scheduledAt),
      scheduledAt: scheduledAt?.toISOString() ?? null,
      configured: Boolean(transport),
      provider: transport?.name ?? null,
    });
  });

  // Zamanlanmış (henüz gönderilmemiş) bir mesajı iptal eder.
  app.delete("/api/ops/sms/outbox/:id", requireRestaurant, async (req: Request, res: Response) => {
    const rid = tenantId(req);
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ message: "Geçersiz kimlik." });
    const [row] = await db.select().from(smsOutbox).where(and(eq(smsOutbox.id, id), eq(smsOutbox.restaurantId, rid)));
    if (!row) return res.status(404).json({ message: "Bulunamadı." });
    if (row.status !== "scheduled" && row.status !== "queued") {
      return res.status(409).json({ message: "Yalnızca henüz gönderilmemiş mesajlar iptal edilebilir." });
    }
    await db.update(smsOutbox).set({ status: "failed", lastError: "Kullanıcı tarafından iptal edildi." }).where(eq(smsOutbox.id, id));
    res.json({ success: true });
  });

  app.get("/api/ops/sms/outbox", requireRestaurant, async (req: Request, res: Response) => {
    const rid = tenantId(req);
    const rows = await db
      .select({
        id: smsOutbox.id,
        toPhone: smsOutbox.toPhone,
        status: smsOutbox.status,
        attempts: smsOutbox.attempts,
        lastError: smsOutbox.lastError,
        createdAt: smsOutbox.createdAt,
        scheduledAt: smsOutbox.scheduledAt,
        sentAt: smsOutbox.sentAt,
      })
      .from(smsOutbox)
      .where(eq(smsOutbox.restaurantId, rid))
      .orderBy(desc(smsOutbox.id))
      .limit(100);
    res.json(rows);
  });

  // Gelen SMS'leri listele (webhook'tan işlenen)
  app.get("/api/ops/sms/inbound", requireRestaurant, async (req: Request, res: Response) => {
    const rid = tenantId(req);
    const rows = await db
      .select({
        id: smsInbound.id,
        fromPhone: smsInbound.fromPhone,
        body: smsInbound.body,
        receivedAt: smsInbound.receivedAt,
      })
      .from(smsInbound)
      .where(eq(smsInbound.restaurantId, rid))
      .orderBy(desc(smsInbound.id))
      .limit(100);
    res.json(rows);
  });

  // --- SMS API anahtarları (müşteri panelinden yönetim; /api/v1/sms/* uçları bu anahtarlarla korunur) ---
  app.get("/api/ops/sms/api-keys", requireRestaurant, async (req: Request, res: Response) => {
    const rid = tenantId(req);
    res.json(await listApiKeys(rid));
  });

  app.post("/api/ops/sms/api-keys", requireRestaurant, async (req: Request, res: Response) => {
    const parsed = z.object({ label: z.string().min(1).max(100) }).safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Geçersiz istek.", issues: parsed.error.issues });
    const rid = tenantId(req);
    const created = await createApiKey(rid, parsed.data.label);
    // Anahtar yalnızca bu yanıtta bir kez tam olarak gösterilir; sonrasında yalnızca önizlemesi (keyPrefix) görünür.
    res.status(201).json(created);
  });

  app.delete("/api/ops/sms/api-keys/:id", requireRestaurant, async (req: Request, res: Response) => {
    const rid = tenantId(req);
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ message: "Geçersiz kimlik." });
    await revokeApiKey(rid, id);
    res.json({ success: true });
  });

  // --- Kontör / bakiye ---
  app.get("/api/ops/sms/balance", requireRestaurant, async (req: Request, res: Response) => {
    const rid = tenantId(req);
    const balance = await getBalance(rid);
    const history = await getLedgerHistory(rid, 50);
    res.json({ balance, history });
  });

  // Not: Gerçek bir ödeme sağlayıcısı bağlanana kadar bu uç yalnızca test/demo amaçlıdır ve
  // "test modu" olarak işaretlenir; gerçek bir ödeme alındığını iddia etmez.
  app.post("/api/ops/sms/balance/topup-test", requireRestaurant, async (req: Request, res: Response) => {
    const parsed = z.object({ amount: z.number().int().positive().max(100000) }).safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Geçersiz istek.", issues: parsed.error.issues });
    if (process.env.NODE_ENV === "production" && process.env.SMS_ALLOW_TEST_TOPUP !== "true") {
      return res.status(403).json({ message: "Test yükleme üretimde devre dışı." });
    }
    const rid = tenantId(req);
    const result = await applyLedgerEntry(rid, parsed.data.amount, "topup", { note: "Test modu yükleme (gerçek ödeme değil)" });
    res.json({ testMode: true, balance: result.balance });
  });

  // --- Sipariş/fatura bildirim şablonları (olay bazlı, değişkenli, düzenlenebilir) ---
  app.get("/api/ops/sms/templates", requireRestaurant, async (req: Request, res: Response) => {
    const rid = tenantId(req);
    const templates = await getTemplates(rid);
    res.json({ templates, availableVariables: ["customer_name", "order_number", "status", "amount"] });
  });

  app.put("/api/ops/sms/templates/:eventKey", requireRestaurant, async (req: Request, res: Response) => {
    const eventKey = req.params.eventKey as EventKey;
    if (!EVENT_KEYS.includes(eventKey)) return res.status(404).json({ message: "Bilinmeyen bildirim olayı." });
    const parsed = z.object({ bodyTemplate: z.string().min(3).max(480), enabled: z.boolean() }).safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Geçersiz istek.", issues: parsed.error.issues });
    const rid = tenantId(req);
    await upsertTemplate(rid, eventKey, parsed.data.bodyTemplate, parsed.data.enabled);
    res.json({ ok: true });
  });

  app.delete("/api/ops/sms/templates/:eventKey", requireRestaurant, async (req: Request, res: Response) => {
    const eventKey = req.params.eventKey as EventKey;
    if (!EVENT_KEYS.includes(eventKey)) return res.status(404).json({ message: "Bilinmeyen bildirim olayı." });
    const rid = tenantId(req);
    await resetTemplate(rid, eventKey);
    res.json({ ok: true });
  });

  // --- OTP (tek kullanımlık doğrulama kodu) — işletmenin kendi müşterilerine, oturum üzerinden ---
  app.post("/api/ops/sms/otp/request", requireRestaurant, otpRequestLimit, async (req: Request, res: Response) => {
    const parsed = otpRequestSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Geçersiz istek.", issues: parsed.error.issues });
    const rid = tenantId(req);
    const ledger = await applyLedgerEntry(rid, -1, "sms_send", { note: `OTP gönderimi (${parsed.data.purpose})` });
    if (!ledger.ok) {
      return res.status(402).json({ message: "Yetersiz kontör bakiyesi.", balance: ledger.balance });
    }
    const result = await requestOtp(rid, parsed.data.phone, parsed.data.purpose, (code) => `Doğrulama kodunuz: ${code}. 5 dakika geçerlidir. Kimseyle paylaşmayın.`);
    if (!result.ok) {
      // Kod gönderilmedi; kontör iadesi yap.
      await applyLedgerEntry(rid, 1, "sms_refund", { note: "OTP cooldown nedeniyle gönderilmedi" });
      return res.status(429).json({ message: "Çok sık istek. Lütfen bekleyin.", resendAvailableInSeconds: result.resendAvailableInSeconds });
    }
    res.json({ success: true, expiresInSeconds: result.expiresInSeconds, resendAvailableInSeconds: result.resendAvailableInSeconds });
  });

  app.post("/api/ops/sms/otp/verify", requireRestaurant, otpVerifyLimit, async (req: Request, res: Response) => {
    const parsed = otpVerifySchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Geçersiz istek.", issues: parsed.error.issues });
    const rid = tenantId(req);
    const result = await verifyOtp(rid, parsed.data.phone, parsed.data.purpose, parsed.data.code);
    if (!result.ok) {
      const messages: Record<string, string> = {
        not_found: "Önce bir doğrulama kodu isteyin.",
        expired: "Kodun süresi dolmuş. Yeni kod isteyin.",
        too_many_attempts: "Çok fazla yanlış deneme. Yeni kod isteyin.",
        invalid_code: "Kod hatalı.",
      };
      return res.status(400).json({ success: false, message: messages[result.reason] });
    }
    res.json({ success: true });
  });

  // İletiMerkezi webhook: gelen SMS ve durum güncellemeleri
  app.post("/api/ops/sms/webhook/iletimerkezi", async (req: Request, res: Response) => {
    const secret = process.env.ILETIMERKEZI_WEBHOOK_SECRET;
    if (!secret) {
      console.warn("[sms] İletiMerkezi webhook secret tanımlanmadı; webhook işlenmedi.");
      return res.status(501).json({ message: "Webhook secret tanımlanmadı." });
    }

    const { valid, error } = await verifyIletimerkeziWebhook(req.body, secret);
    if (!valid) {
      console.warn(`[sms] İletiMerkezi webhook imza doğrulama başarısız: ${error}`);
      return res.status(401).json({ message: "İmza doğrulama başarısız." });
    }

    const result = await processSmsWebhook("iletimerkezi", req.body);
    if (!result.success) {
      console.error(`[sms] İletiMerkezi webhook işleme hatası: ${result.error}`);
      return res.status(500).json({ message: "Webhook işleme hatası." });
    }

    res.json({ success: true });
  });

  // NetGSM webhook: gelen SMS ve durum güncellemeleri
  app.post("/api/ops/sms/webhook/netgsm", async (req: Request, res: Response) => {
    const secret = process.env.NETGSM_WEBHOOK_SECRET;
    if (!secret) {
      console.warn("[sms] NetGSM webhook secret tanımlanmadı; webhook işlenmedi.");
      return res.status(501).json({ message: "Webhook secret tanımlanmadı." });
    }

    const { valid, error } = await verifyNetgsmWebhook(req.body, secret);
    if (!valid) {
      console.warn(`[sms] NetGSM webhook imza doğrulama başarısız: ${error}`);
      return res.status(401).json({ message: "İmza doğrulama başarısız." });
    }

    const result = await processSmsWebhook("netgsm", req.body);
    if (!result.success) {
      console.error(`[sms] NetGSM webhook işleme hatası: ${result.error}`);
      return res.status(500).json({ message: "Webhook işleme hatası." });
    }

    res.json({ success: true });
  });
}
