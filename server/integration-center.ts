/**
 * Entegrasyon Merkezi rotaları.
 * İşletme (tenant-izole): /api/ic/*
 * Platform yöneticisi:    /api/admin/integration-center/*
 *
 * Güvenlik: credential'lar yalnızca maskelenmiş döner; loglarda secret yok;
 * her sorgu restaurantId ile sınırlandırıdır (tenant izolasyonu).
 */
import type { Express, Request, Response } from "express";
import crypto from "crypto";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "./db";
import {
  integrationApiKeys,
  integrationConnections,
  integrationLogs,
  integrationSyncJobs,
  externalOrderMappings,
  webhookDeliveries,
  webhookEndpoints,
  orders,
} from "@shared/schema";
import { requirePlatformAdmin, requireRestaurant, tenantId } from "./auth/middleware";
import { PROVIDERS, getProvider } from "./integrations/registry";
import { decryptJson, encryptJson, maskCredentials, randomSecret } from "./integrations/crypto";
import { emitIntegrationEvent, logIntegration, runSyncJob } from "./integrations/runner";
import { pluginPrice } from "@shared/plugins";
import { writeAudit } from "./audit";

/** Bir sağlayıcının işletme görünümündeki durumunu hesaplar (prompt-2 durum listesi). */
function connectionStatus(conn: typeof integrationConnections.$inferSelect | undefined, implemented: boolean, planLocked: boolean) {
  if (!implemented) return "not_implemented"; // Henüz geliştirilmedi
  if (planLocked) return "not_available"; // Kullanıma hazır değil (plan kısıtı)
  if (!conn) return "pending_config"; // Yapılandırma gerekli
  if (conn.lastError && conn.lastTestOk === false) return "error"; // Hata oluştu
  if (conn.lastTestOk === true && conn.lastSyncAt === null) return "connected_sync_pending"; // Senkronizasyon bekliyor
  if (conn.lastTestOk === true) return "connected"; // Bağlı
  if (conn.lastTestOk === false) return "needs_api_access"; // API erişimi gerekli
  return "pending_config";
}

const credentialsSchema = z.record(z.string(), z.string().max(512)).refine(
  (o) => Object.keys(o).length <= 16,
  { message: "Çok fazla alan" },
);

export function registerIntegrationCenterRoutes(app: Express) {
  // === Sağlayıcı kataloğu + işletmenin bağlantı durumları ===
  app.get("/api/ic/providers", requireRestaurant, async (req: Request, res: Response) => {
    const rid = tenantId(req);
    const conns = await db.select().from(integrationConnections).where(eq(integrationConnections.restaurantId, rid));
    const byKey = new Map(conns.map((c) => [c.providerKey, c]));

    const providers = PROVIDERS.map((p) => {
      const conn = byKey.get(p.key);
      const creds = decryptJson<Record<string, string>>(conn?.credentials);
      return {
        key: p.key,
        name: p.name,
        category: p.category,
        implemented: p.adapter.implemented,
        capabilities: p.adapter.capabilities,
        credentialFields: p.adapter.credentialFields.map((f) => ({ ...f, options: f.options })),
        docs: p.adapter.docs,
        price: pluginPrice(p.key),
        connection: conn
          ? {
              id: conn.id,
              status: connectionStatus(conn, p.adapter.implemented, false),
              maskedCredentials: maskCredentials(creds),
              lastTestAt: conn.lastTestAt,
              lastTestOk: conn.lastTestOk,
              lastTestMessage: conn.lastTestMessage,
              lastSyncAt: conn.lastSyncAt,
              lastError: conn.lastError,
              config: conn.config ?? null,
            }
          : null,
        computedStatus: connectionStatus(conn, p.adapter.implemented, false),
      };
    });
    res.json({ providers });
  });

  // === Bağlantı oluştur/güncelle (credential'lar şifreli saklanır) ===
  app.put("/api/ic/connections/:provider", requireRestaurant, async (req: Request, res: Response) => {
    const rid = tenantId(req);
    const provider = getProvider(String(req.params.provider));
    if (!provider) return res.status(404).json({ message: "Sağlayıcı bulunamadı." });
    if (!provider.adapter.implemented) {
      return res.status(501).json({ message: "Bu entegrasyon henüz geliştirilmedi. Adapter, sağlayıcı API erişimi sağlandığında yazılacak." });
    }
    const parsed = credentialsSchema.safeParse(req.body?.credentials ?? {});
    if (!parsed.success) return res.status(400).json({ message: "Kimlik bilgileri geçersiz." });

    const existing = (await db
      .select()
      .from(integrationConnections)
      .where(and(eq(integrationConnections.restaurantId, rid), eq(integrationConnections.providerKey, provider.key)))
      .limit(1))[0];

    const encrypted = encryptJson(parsed.data);
    if (existing) {
      await db
        .update(integrationConnections)
        .set({ credentials: encrypted, lastTestOk: false, lastError: null, updatedAt: new Date() })
        .where(eq(integrationConnections.id, existing.id));
    } else {
      await db.insert(integrationConnections).values({ restaurantId: rid, providerKey: provider.key, credentials: encrypted });
    }
    await logIntegration(rid, provider.key, "info", "connection.updated", "Bağlantı kimlik bilgileri kaydedildi.");
    await writeAudit({ restaurantId: rid, actorUserId: req.auth!.userId, action: "integration.connection.updated", entity: "integration_connection", entityId: provider.key, req });
    res.json({ ok: true });
  });

  // === Bağlantı testi (gerçek istek) ===
  app.post("/api/ic/connections/:provider/test", requireRestaurant, async (req: Request, res: Response) => {
    const rid = tenantId(req);
    const provider = getProvider(String(req.params.provider));
    if (!provider) return res.status(404).json({ message: "Sağlayıcı bulunamadı." });
    if (!provider.adapter.implemented) {
      return res.status(501).json({ message: "Bu entegrasyon henüz geliştirilmedi; bağlantı testi yapılamaz." });
    }
    const row = (await db
      .select()
      .from(integrationConnections)
      .where(and(eq(integrationConnections.restaurantId, rid), eq(integrationConnections.providerKey, provider.key)))
      .limit(1))[0];
    const creds = decryptJson<Record<string, string>>(row?.credentials);
    if (!creds) return res.status(400).json({ message: "Önce kimlik bilgilerini kaydedin." });

    const result = await provider.adapter.testConnection!(rid, creds);
    if (row) {
      await db
        .update(integrationConnections)
        .set({
          lastTestAt: new Date(),
          lastTestOk: result.ok,
          lastTestMessage: result.message,
          lastError: result.ok ? null : result.message,
          status: result.ok ? "connected" : "error",
          updatedAt: new Date(),
        })
        .where(eq(integrationConnections.id, row.id));
    }
    await logIntegration(rid, provider.key, result.ok ? "info" : "error", "connection.tested", result.message);
    await emitIntegrationEvent(rid, "integration.connection.tested", { provider: provider.key, ok: result.ok, message: result.message });
    res.json(result);
  });

  // === Bağlantıyı kaldır ===
  app.delete("/api/ic/connections/:provider", requireRestaurant, async (req: Request, res: Response) => {
    const rid = tenantId(req);
    await db
      .delete(integrationConnections)
      .where(and(eq(integrationConnections.restaurantId, rid), eq(integrationConnections.providerKey, String(req.params.provider))));
    await logIntegration(rid, String(req.params.provider), "info", "connection.removed", "Bağlantı kaldırıldı.");
    await writeAudit({ restaurantId: rid, actorUserId: req.auth!.userId, action: "integration.connection.removed", entity: "integration_connection", entityId: String(req.params.provider), req });
    res.json({ ok: true });
  });

  // === Senkronizasyon çalıştır ===
  app.post("/api/ic/connections/:provider/sync/:jobType", requireRestaurant, async (req: Request, res: Response) => {
    const rid = tenantId(req);
    const provider = getProvider(String(req.params.provider));
    const jobType = String(req.params.jobType);
    if (!provider) return res.status(404).json({ message: "Sağlayıcı bulunamadı." });
    const fn = jobType === "fetch_orders" ? provider.adapter.fetchOrders : jobType === "sync_inventory" ? provider.adapter.syncInventory : undefined;
    if (!fn) return res.status(501).json({ message: `Sağlayıcı "${jobType}" işlemini desteklemiyor.` });

    const row = (await db
      .select()
      .from(integrationConnections)
      .where(and(eq(integrationConnections.restaurantId, rid), eq(integrationConnections.providerKey, provider.key)))
      .limit(1))[0];
    const creds = decryptJson<Record<string, string>>(row?.credentials);
    if (!creds) return res.status(400).json({ message: "Bağlantı yapılandırılmamış." });

    const result = await runSyncJob(rid, provider.key, jobType, async () => {
      const out = await fn(rid, creds);
      return { count: Array.isArray(out) ? out.length : Object.keys(out ?? {}).length };
    });
    if (result.status === "succeeded" && row) {
      await db.update(integrationConnections).set({ lastSyncAt: new Date(), updatedAt: new Date() }).where(eq(integrationConnections.id, row.id));
      await emitIntegrationEvent(rid, "integration.sync.completed", { provider: provider.key, jobType });
    }
    res.json(result);
  });

  // === Loglar / işler ===
  app.get("/api/ic/logs", requireRestaurant, async (req: Request, res: Response) => {
    const rows = await db
      .select()
      .from(integrationLogs)
      .where(eq(integrationLogs.restaurantId, tenantId(req)))
      .orderBy(desc(integrationLogs.id))
      .limit(200);
    res.json({ logs: rows });
  });

  app.get("/api/ic/jobs", requireRestaurant, async (req: Request, res: Response) => {
    const rows = await db
      .select()
      .from(integrationSyncJobs)
      .where(eq(integrationSyncJobs.restaurantId, tenantId(req)))
      .orderBy(desc(integrationSyncJobs.id))
      .limit(100);
    res.json({ jobs: rows });
  });

  // === Harici sipariş eşleştirmeleri ===
  app.get("/api/ic/external-orders", requireRestaurant, async (req: Request, res: Response) => {
    const rows = await db
      .select()
      .from(externalOrderMappings)
      .where(eq(externalOrderMappings.restaurantId, tenantId(req)))
      .orderBy(desc(externalOrderMappings.id))
      .limit(200);
    res.json({ orders: rows });
  });

  // === Giden webhook endpoint yönetimi ===
  app.get("/api/ic/webhook-endpoints", requireRestaurant, async (req: Request, res: Response) => {
    const rid = tenantId(req);
    const eps = await db.select().from(webhookEndpoints).where(eq(webhookEndpoints.restaurantId, rid)).orderBy(desc(webhookEndpoints.id));
    const deliveries = await db.select().from(webhookDeliveries).where(eq(webhookDeliveries.restaurantId, rid)).orderBy(desc(webhookDeliveries.id)).limit(100);
    res.json({
      endpoints: eps.map((e) => ({ id: e.id, url: e.url, description: e.description, events: e.events, isActive: e.isActive, secretMasked: e.secretMasked, createdAt: e.createdAt })),
      deliveries,
    });
  });

  app.post("/api/ic/webhook-endpoints", requireRestaurant, async (req: Request, res: Response) => {
    const rid = tenantId(req);
    const schema = z.object({
      url: z.string().url().max(512).refine((u) => u.startsWith("https://") || u.startsWith("http://127.0.0.1") || u.startsWith("http://localhost"), { message: "Yalnızca https veya yerel geliştirme adresi kabul edilir." }),
      description: z.string().max(200).default(""),
      events: z.array(z.string().max(64)).min(1).max(20),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Webhook endpoint verisi geçersiz.", errors: parsed.error.flatten().fieldErrors });

    const secret = randomSecret();
    const [ins] = await db
      .insert(webhookEndpoints)
      .values({
        restaurantId: rid,
        url: parsed.data.url,
        description: parsed.data.description,
        events: parsed.data.events,
        secretMasked: `••••${secret.slice(-4)}`,
        secretEncrypted: encryptJson({ secret }),
      });
    await logIntegration(rid, null, "info", "webhook.endpoint.created", `Webhook endpoint eklendi: ${parsed.data.url}`);
    // Secret yalnızca oluşturma anında tam gösterilir (prompt-2 §11)
    res.json({ id: ins.insertId, secret });
  });

  app.delete("/api/ic/webhook-endpoints/:id", requireRestaurant, async (req: Request, res: Response) => {
    const rid = tenantId(req);
    await db.delete(webhookEndpoints).where(and(eq(webhookEndpoints.restaurantId, rid), eq(webhookEndpoints.id, Number(req.params.id))));
    res.json({ ok: true });
  });

  app.post("/api/ic/webhook-deliveries/:id/retry", requireRestaurant, async (req: Request, res: Response) => {
    const rid = tenantId(req);
    const [d] = (await db
      .select()
      .from(webhookDeliveries)
      .where(and(eq(webhookDeliveries.restaurantId, rid), eq(webhookDeliveries.id, Number(req.params.id))))
      .limit(1));
    if (!d) return res.status(404).json({ message: "Teslimat bulunamadı." });
    if (d.attempts >= 5) return res.status(429).json({ message: "Maksimum deneme sayısına ulaşıldı." });
    const [ep] = (await db.select().from(webhookEndpoints).where(eq(webhookEndpoints.id, d.endpointId)).limit(1));
    if (!ep) return res.status(404).json({ message: "Endpoint kaldırılmış." });

    const secret = decryptJson<{ secret: string }>(ep.secretEncrypted)?.secret ?? "";
    const timestamp = String(Date.now());
    const body = JSON.stringify(d.payload);
    const { signWebhook: sign } = await import("./integrations/crypto");
    try {
      const r = await fetch(ep.url, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-MTM-Event": d.event, "X-MTM-Timestamp": timestamp, "X-MTM-Signature": sign(secret, timestamp, body), "X-MTM-Delivery": `retry-${d.id}` },
        body,
        signal: AbortSignal.timeout(8000),
      });
      await db
        .update(webhookDeliveries)
        .set({ status: r.ok ? "delivered" : "failed", responseCode: r.status, attempts: d.attempts + 1, deliveredAt: r.ok ? new Date() : null, error: r.ok ? null : `HTTP ${r.status}` })
        .where(eq(webhookDeliveries.id, d.id));
      res.json({ ok: r.ok, status: r.status });
    } catch (err) {
      await db.update(webhookDeliveries).set({ attempts: d.attempts + 1, error: err instanceof Error ? err.message : "hata" }).where(eq(webhookDeliveries.id, d.id));
      res.json({ ok: false, error: "Teslimat yine başarısız." });
    }
  });

  // === Gelen webhook alıcısı (sağlayıcı → MakeTheMenu) ===
  // İmza doğrulaması + idempotency: aynı (provider, externalOrderId) ikinci kez sipariş OLUŞTURMAZ.
  app.post("/api/ic/webhook/:provider/:restaurantId", async (req: Request, res: Response) => {
    const provider = getProvider(String(req.params.provider));
    const rid = Number(req.params.restaurantId);
    if (!provider || !Number.isInteger(rid) || rid <= 0) return res.status(404).json({ message: "Bilinmeyen webhook hedefi." });

    const row = (await db
      .select()
      .from(integrationConnections)
      .where(and(eq(integrationConnections.restaurantId, rid), eq(integrationConnections.providerKey, provider.key)))
      .limit(1))[0];
    const creds = decryptJson<Record<string, string>>(row?.credentials);
    if (!provider.adapter.verifyIncomingWebhook || !creds) {
      return res.status(501).json({ message: "Bu sağlayıcı için webhook alımı yapılandırılmadı." });
    }
    // rawBody express.json verify ile IncomingMessage üzerine yazılır (server/index.ts)
    const raw = (req as unknown as { rawBody?: unknown }).rawBody;
    const rawBody = typeof raw === "string" ? raw : Buffer.isBuffer(raw) ? raw.toString("utf8") : JSON.stringify(req.body ?? {});
    const verification = provider.adapter.verifyIncomingWebhook({ headers: req.headers as Record<string, string>, rawBody }, rid, creds);
    if (!verification.valid) {
      await logIntegration(rid, provider.key, "warn", "webhook.rejected", `Webhook reddedildi: ${verification.reason}`);
      return res.status(401).json({ message: verification.reason });
    }

    const parsedBody: Record<string, unknown> = req.body && typeof req.body === "object" ? (req.body as Record<string, unknown>) : {};
    let parsed: { event?: string; externalOrderId?: string; order?: Record<string, unknown> };
    try {
      parsed = parsedBody as { event?: string; externalOrderId?: string; order?: Record<string, unknown> };
      if (!parsed || typeof parsed !== "object") throw new Error("bad");
    } catch {
      return res.status(400).json({ message: "Geçersiz JSON." });
    }
    if (parsed.event !== "order.created" || !parsed.externalOrderId) {
      return res.json({ ok: true, ignored: true });
    }

    // Idempotency: harici sipariş ID'si zaten kayıtlıysa yeni sipariş oluşturulmaz.
    const [existing] = (await db
      .select()
      .from(externalOrderMappings)
      .where(and(eq(externalOrderMappings.providerKey, provider.key), eq(externalOrderMappings.externalOrderId, parsed.externalOrderId)))
      .limit(1));
    if (existing) {
      await logIntegration(rid, provider.key, "info", "order.duplicate", `Webhook tekrarı yoksayıldı (external=${parsed.externalOrderId}).`);
      return res.json({ ok: true, duplicate: true, internalOrderId: existing.internalOrderId });
    }

    // Harici siparişi iç sipariş modeline yaz (normalizasyon: ürün adları, miktarlar, tutar)
    const orderPayload = parsed.order ?? {};
    const items = Array.isArray(orderPayload.items) ? (orderPayload.items as Array<{ name?: string; quantity?: number }>) : [];
    const total = typeof orderPayload.total === "number" ? orderPayload.total : 0;
    const [created] = await db
      .insert(orders)
      .values({
        restaurantId: rid,
        status: "pending",
        totalAmount: total.toFixed(2),
        customerName: typeof orderPayload.customerName === "string" ? orderPayload.customerName.slice(0, 120) : null,
        phone: typeof orderPayload.customerPhone === "string" ? orderPayload.customerPhone.slice(0, 32) : null,
        note: `Harici sipariş (${provider.name}): ${parsed.externalOrderId}`,
      });
    await db.insert(externalOrderMappings).values({
      restaurantId: rid,
      providerKey: provider.key,
      externalOrderId: parsed.externalOrderId,
      internalOrderId: created.insertId,
      status: "received",
      providerMetadata: orderPayload,
    });
    await logIntegration(rid, provider.key, "info", "order.created", `Harici sipariş alındı: ${parsed.externalOrderId}`, { internalOrderId: created.insertId });
    await emitIntegrationEvent(rid, "order.created", { source: provider.key, externalOrderId: parsed.externalOrderId, internalOrderId: created.insertId });
    res.json({ ok: true, internalOrderId: created.insertId });
  });

  // === PLATFORM YÖNETİCİSİ: genel sağlık ve API anahtarı verme ===
  app.get("/api/admin/integration-center/overview", requirePlatformAdmin, async (_req: Request, res: Response) => {
    const conns = await db.select().from(integrationConnections);
    const jobs = await db.select().from(integrationSyncJobs).orderBy(desc(integrationSyncJobs.id)).limit(50);
    const logs = await db.select().from(integrationLogs).orderBy(desc(integrationLogs.id)).limit(100);
    res.json({
      providers: PROVIDERS.map((p) => ({
        key: p.key,
        name: p.name,
        category: p.category,
        implemented: p.adapter.implemented,
        capabilities: p.adapter.capabilities,
        docs: p.adapter.docs,
      })),
      connections: conns.map((c) => ({ restaurantId: c.restaurantId, providerKey: c.providerKey, status: c.status, lastTestOk: c.lastTestOk, lastTestAt: c.lastTestAt, lastSyncAt: c.lastSyncAt, lastError: c.lastError })),
      jobs,
      logs,
    });
  });

  // Veri Aktarımı API anahtarı ver (düz değer bir kez gösterilir)
  app.post("/api/admin/integration-center/api-keys", requirePlatformAdmin, async (req: Request, res: Response) => {
    const schema = z.object({ restaurantId: z.number().int().positive(), label: z.string().min(2).max(120) });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Geçersiz veri." });

    const raw = `mtm_live_${crypto.randomBytes(24).toString("hex")}`;
    const keyHash = crypto.createHash("sha256").update(raw).digest("hex");
    const [ins] = await db
      .insert(integrationApiKeys)
      .values({ restaurantId: parsed.data.restaurantId, label: parsed.data.label, keyHash, keyPrefix: raw.slice(0, 16) });
    await writeAudit({ restaurantId: parsed.data.restaurantId, actorUserId: req.auth!.userId, action: "integration.api_key.issued", entity: "integration_api_key", entityId: String(ins.insertId), req });
    res.json({ id: ins.insertId, key: raw }); // tam anahtar yalnızca bu yanıtta
  });

  app.get("/api/admin/integration-center/api-keys", requirePlatformAdmin, async (_req: Request, res: Response) => {
    const rows = await db.select().from(integrationApiKeys).orderBy(desc(integrationApiKeys.id)).limit(100);
    res.json({ keys: rows.map((k) => ({ id: k.id, restaurantId: k.restaurantId, label: k.label, keyPrefix: k.keyPrefix, isActive: k.isActive, lastUsedAt: k.lastUsedAt, createdAt: k.createdAt })) });
  });
}
