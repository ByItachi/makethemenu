// SMS API v1: müşterilerin kendi uygulamalarından (WHMCS, e-ticaret, özel yazılım) API anahtarıyla
// erişebileceği genel uç noktalar. Oturum çerezi gerektirmez; Authorization: Bearer <api-key> ile korunur.
import type { Express, NextFunction, Request, Response } from "express";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import swaggerUi from "swagger-ui-express";
import { db } from "./db";
import { smsOutbox, smsInbound } from "@shared/schema";
import { verifyApiKey } from "./sms/apiKey";
import { getBalance, applyLedgerEntry, SMS_COST_PER_MESSAGE } from "./sms/balance";
import { enqueueSms } from "./sms/outbox";
import { getSmsTransport } from "./sms";
import { rateLimit } from "./auth/middleware";
import { requestOtp, verifyOtp } from "./sms/otp";
import { smsOpenApiSpec } from "./sms/openapi";

declare global {
  namespace Express {
    interface Request {
      smsApiRestaurantId?: number;
    }
  }
}

async function requireApiKey(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization ?? "";
  const raw = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!raw) {
    return res.status(401).json({ error: "unauthorized", message: "Authorization: Bearer <api-key> başlığı gerekli." });
  }
  const result = await verifyApiKey(raw);
  if (!result) {
    return res.status(401).json({ error: "unauthorized", message: "Geçersiz veya iptal edilmiş API anahtarı." });
  }
  req.smsApiRestaurantId = result.restaurantId;
  next();
}

const apiRateLimit = rateLimit({ windowMs: 60_000, max: 120, keyPrefix: "sms-api", keyFn: (req) => String(req.smsApiRestaurantId ?? req.ip) });

const sendSchema = z.object({
  to: z.string().min(10).max(32),
  text: z.string().min(1).max(600),
  scheduledAt: z.string().datetime().optional(),
});

const bulkSchema = z.object({
  messages: z.array(sendSchema).min(1).max(1000),
  scheduledAt: z.string().datetime().optional(),
});

const otpRequestSchema = z.object({
  phone: z.string().min(10).max(32),
  purpose: z.string().min(1).max(32).default("generic"),
  template: z.string().min(1).max(300).optional(),
});

const otpVerifySchema = z.object({
  phone: z.string().min(10).max(32),
  purpose: z.string().min(1).max(32).default("generic"),
  code: z.string().min(4).max(10),
});

export function registerSmsPublicApi(app: Express) {
  app.get("/api/v1/health", (_req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  // İnteraktif API dokümantasyonu: API anahtarı gerektirmez, "Authorize" ile kendi anahtarınızı girip deneyebilirsiniz.
  app.get("/api/v1/openapi.json", (_req, res) => res.json(smsOpenApiSpec));
  app.use("/api/v1/docs", swaggerUi.serve, swaggerUi.setup(smsOpenApiSpec, { customSiteTitle: "Makethemenu SMS API" }));

  app.use("/api/v1", requireApiKey, apiRateLimit);

  app.post("/api/v1/sms/send", async (req: Request, res: Response) => {
    const parsed = sendSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    }
    const rid = req.smsApiRestaurantId!;
    const scheduledAt = parsed.data.scheduledAt ? new Date(parsed.data.scheduledAt) : null;
    if (scheduledAt && (Number.isNaN(scheduledAt.getTime()) || scheduledAt.getTime() <= Date.now())) {
      return res.status(400).json({ error: "invalid_request", message: "scheduledAt gelecekte olmalı." });
    }
    const ledger = await applyLedgerEntry(rid, -SMS_COST_PER_MESSAGE, "sms_send", { note: "API: tekli gönderim" });
    if (!ledger.ok) {
      return res.status(402).json({ error: "insufficient_balance", message: "Yetersiz kontör bakiyesi.", balance: ledger.balance });
    }
    const id = await enqueueSms(rid, parsed.data.to, parsed.data.text, scheduledAt);
    const transport = getSmsTransport();
    res.status(202).json({
      status: scheduledAt ? "scheduled" : "queued",
      id,
      scheduledAt: scheduledAt?.toISOString() ?? null,
      configured: Boolean(transport),
      balance: ledger.balance,
    });
  });

  app.post("/api/v1/sms/bulk", async (req: Request, res: Response) => {
    const parsed = bulkSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    }
    const rid = req.smsApiRestaurantId!;
    const scheduledAt = parsed.data.scheduledAt ? new Date(parsed.data.scheduledAt) : null;
    if (scheduledAt && (Number.isNaN(scheduledAt.getTime()) || scheduledAt.getTime() <= Date.now())) {
      return res.status(400).json({ error: "invalid_request", message: "scheduledAt gelecekte olmalı." });
    }
    const cost = parsed.data.messages.length * SMS_COST_PER_MESSAGE;
    const ledger = await applyLedgerEntry(rid, -cost, "sms_send", { note: `API: toplu gönderim (${parsed.data.messages.length} mesaj)` });
    if (!ledger.ok) {
      return res.status(402).json({ error: "insufficient_balance", message: "Yetersiz kontör bakiyesi.", balance: ledger.balance });
    }
    for (const m of parsed.data.messages) {
      await enqueueSms(rid, m.to, m.text, scheduledAt);
    }
    res.status(202).json({
      status: scheduledAt ? "scheduled" : "queued",
      count: parsed.data.messages.length,
      scheduledAt: scheduledAt?.toISOString() ?? null,
      balance: ledger.balance,
    });
  });

  app.get("/api/v1/sms/messages/:id", async (req: Request, res: Response) => {
    const rid = req.smsApiRestaurantId!;
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: "invalid_id" });
    const [row] = await db.select().from(smsOutbox).where(and(eq(smsOutbox.id, id), eq(smsOutbox.restaurantId, rid)));
    if (!row) return res.status(404).json({ error: "not_found" });
    res.json(row);
  });

  app.get("/api/v1/sms/messages", async (req: Request, res: Response) => {
    const rid = req.smsApiRestaurantId!;
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const rows = await db.select().from(smsOutbox).where(eq(smsOutbox.restaurantId, rid)).orderBy(desc(smsOutbox.id)).limit(limit);
    res.json({ data: rows });
  });

  app.get("/api/v1/sms/inbound", async (req: Request, res: Response) => {
    const rid = req.smsApiRestaurantId!;
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const rows = await db.select().from(smsInbound).where(eq(smsInbound.restaurantId, rid)).orderBy(desc(smsInbound.id)).limit(limit);
    res.json({ data: rows });
  });

  app.post("/api/v1/otp/request", async (req: Request, res: Response) => {
    const parsed = otpRequestSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    const rid = req.smsApiRestaurantId!;
    const ledger = await applyLedgerEntry(rid, -SMS_COST_PER_MESSAGE, "sms_send", { note: `API: OTP (${parsed.data.purpose})` });
    if (!ledger.ok) {
      return res.status(402).json({ error: "insufficient_balance", message: "Yetersiz kontör bakiyesi.", balance: ledger.balance });
    }
    const template = (code: string) => (parsed.data.template ? parsed.data.template.replace(/\{\{\s*verification_code\s*\}\}/g, code) : `Doğrulama kodunuz: ${code}. 5 dakika geçerlidir.`);
    const result = await requestOtp(rid, parsed.data.phone, parsed.data.purpose, template);
    if (!result.ok) {
      await applyLedgerEntry(rid, SMS_COST_PER_MESSAGE, "sms_refund", { note: "API: OTP cooldown nedeniyle gönderilmedi" });
      return res.status(429).json({ error: "cooldown", message: "Çok sık istek.", resendAvailableInSeconds: result.resendAvailableInSeconds });
    }
    res.status(202).json({ status: "queued", expiresInSeconds: result.expiresInSeconds, balance: ledger.balance });
  });

  app.post("/api/v1/otp/verify", async (req: Request, res: Response) => {
    const parsed = otpVerifySchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "invalid_request", issues: parsed.error.issues });
    const rid = req.smsApiRestaurantId!;
    const result = await verifyOtp(rid, parsed.data.phone, parsed.data.purpose, parsed.data.code);
    if (!result.ok) {
      return res.status(400).json({ error: result.reason, verified: false });
    }
    res.json({ verified: true });
  });

  app.get("/api/v1/account/balance", async (req: Request, res: Response) => {
    const rid = req.smsApiRestaurantId!;
    const balance = await getBalance(rid);
    res.json({ balance, unit: "kontör" });
  });

  app.get("/api/v1/account/usage", async (req: Request, res: Response) => {
    const rid = req.smsApiRestaurantId!;
    const rows = await db.select({ status: smsOutbox.status }).from(smsOutbox).where(eq(smsOutbox.restaurantId, rid));
    const usage = { queued: 0, sending: 0, sent: 0, failed: 0, retry: 0, total: rows.length } as Record<string, number>;
    for (const r of rows) {
      if (r.status in usage) usage[r.status] += 1;
    }
    res.json(usage);
  });
}
