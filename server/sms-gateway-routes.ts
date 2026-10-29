// MakeTheMenu SMS Gateway: platform admin cihaz yönetimi + cihaz (Android/GSM modem bridge) uçları.
import type { Express, Request, Response } from "express";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "./db";
import { smsGatewayDevices } from "@shared/schema";
import { requirePlatformAdmin, rateLimit } from "./auth/middleware";
import { writeAudit } from "./audit";
import {
  GATEWAY_ONLINE_SECONDS,
  claimJobs,
  deviceUsage,
  gatewayDeviceFromToken,
  gatewayQueueStats,
  genGatewayPairingCode,
  genGatewayToken,
  recordInboundSms,
  reportJobResult,
  sha256,
} from "./sms/gateway";
import { getSmsTransport } from "./sms";

const PAIRING_TTL_MS = 15 * 60 * 1000;

const deviceLimiter = rateLimit({ windowMs: 60_000, max: 240, keyPrefix: "sms-gw" });

async function requireGatewayDevice(req: Request, res: Response) {
  const device = await gatewayDeviceFromToken(req.headers["x-device-token"] as string | undefined);
  if (!device) {
    res.status(401).json({ message: "Geçersiz veya iptal edilmiş gateway jetonu" });
    return null;
  }
  return device;
}

const deviceInfoSchema = z.object({
  simNumber: z.string().max(32).optional(),
  operator: z.string().max(64).optional(),
  appVersion: z.string().max(32).optional(),
  battery: z.number().int().min(0).max(100).optional(),
  signal: z.number().int().min(0).max(100).optional(),
});

export function registerSmsGatewayRoutes(app: Express) {
  // ── Platform admin: gateway cihazları ────────────────────────────────────
  app.get("/api/admin/sms/gateway", requirePlatformAdmin, async (_req, res) => {
    const rows = await db.select().from(smsGatewayDevices).orderBy(desc(smsGatewayDevices.createdAt));
    const now = Date.now();
    const devices = await Promise.all(rows.map(async (d) => ({
      id: d.id, name: d.name, kind: d.kind, status: d.status, enabled: d.enabled,
      pairingCode: d.status === "pending" ? d.pairingCode : null,
      pairingCodeExpiresAt: d.pairingCodeExpiresAt,
      simNumber: d.simNumber, operator: d.operator, battery: d.battery, signal: d.signal, appVersion: d.appVersion,
      dailyLimit: d.dailyLimit, perMinuteLimit: d.perMinuteLimit,
      lastSeenAt: d.lastSeenAt, createdAt: d.createdAt,
      online: d.status === "active" && !!d.lastSeenAt && now - d.lastSeenAt.getTime() < GATEWAY_ONLINE_SECONDS * 1000,
      usage: d.status === "revoked" ? null : await deviceUsage(d.id),
    })));
    const transport = getSmsTransport();
    res.json({
      gatewayActive: transport?.mode === "pull",
      queue: await gatewayQueueStats(),
      devices,
    });
  });

  app.post("/api/admin/sms/gateway/devices", requirePlatformAdmin, async (req, res) => {
    const parsed = z.object({
      name: z.string().min(2).max(128),
      kind: z.enum(["android", "modem"]).default("android"),
      dailyLimit: z.number().int().min(1).max(100000).optional(),
      perMinuteLimit: z.number().int().min(1).max(600).optional(),
    }).safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.issues[0]?.message ?? "Geçersiz istek" });
    const pairingCode = genGatewayPairingCode();
    const [row] = await db.insert(smsGatewayDevices).values({
      name: parsed.data.name,
      kind: parsed.data.kind,
      dailyLimit: parsed.data.dailyLimit ?? 300,
      perMinuteLimit: parsed.data.perMinuteLimit ?? 20,
      pairingCode,
      pairingCodeExpiresAt: new Date(Date.now() + PAIRING_TTL_MS),
      status: "pending",
    }).$returningId();
    await writeAudit({ action: "sms_gateway.device_created", entity: "sms_gateway_devices", entityId: String(row.id), restaurantId: null, actorUserId: req.auth?.userId ?? null, req, meta: { kind: parsed.data.kind } });
    res.status(201).json({ device: { id: row.id, name: parsed.data.name, kind: parsed.data.kind, status: "pending", pairingCode } });
  });

  app.patch("/api/admin/sms/gateway/devices/:id", requirePlatformAdmin, async (req, res) => {
    const parsed = z.object({
      name: z.string().min(2).max(128).optional(),
      enabled: z.boolean().optional(),
      dailyLimit: z.number().int().min(1).max(100000).optional(),
      perMinuteLimit: z.number().int().min(1).max(600).optional(),
    }).safeParse(req.body);
    if (!parsed.success || !Object.keys(parsed.data).length) return res.status(400).json({ message: "Geçersiz istek" });
    const result = await db.update(smsGatewayDevices).set(parsed.data).where(eq(smsGatewayDevices.id, Number(req.params.id)));
    if (!result[0].affectedRows) return res.status(404).json({ message: "Cihaz bulunamadı" });
    res.json({ ok: true });
  });

  app.post("/api/admin/sms/gateway/devices/:id/pairing-code", requirePlatformAdmin, async (req, res) => {
    const pairingCode = genGatewayPairingCode();
    const result = await db.update(smsGatewayDevices).set({
      status: "pending", tokenHash: null, pairingCode, pairingCodeExpiresAt: new Date(Date.now() + PAIRING_TTL_MS),
    }).where(eq(smsGatewayDevices.id, Number(req.params.id)));
    if (!result[0].affectedRows) return res.status(404).json({ message: "Cihaz bulunamadı" });
    res.json({ pairingCode });
  });

  app.delete("/api/admin/sms/gateway/devices/:id", requirePlatformAdmin, async (req, res) => {
    const result = await db.update(smsGatewayDevices).set({ status: "revoked", tokenHash: null, pairingCode: null, enabled: false })
      .where(eq(smsGatewayDevices.id, Number(req.params.id)));
    if (!result[0].affectedRows) return res.status(404).json({ message: "Cihaz bulunamadı" });
    await writeAudit({ action: "sms_gateway.device_revoked", entity: "sms_gateway_devices", entityId: String(req.params.id), restaurantId: null, actorUserId: req.auth?.userId ?? null, req });
    res.json({ ok: true });
  });

  // ── Cihaz tarafı (Android uygulaması / GSM modem bridge) ─────────────────
  app.post("/api/sms-gateway/pair", deviceLimiter, async (req, res) => {
    const parsed = deviceInfoSchema.extend({ pairingCode: z.string().length(6) }).safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Geçersiz eşleştirme kodu" });
    const { pairingCode, ...info } = parsed.data;
    const [device] = await db.select().from(smsGatewayDevices).where(eq(smsGatewayDevices.pairingCode, pairingCode)).limit(1);
    if (!device || device.status !== "pending") return res.status(404).json({ message: "Kod geçersiz veya zaten kullanılmış" });
    if (device.pairingCodeExpiresAt && device.pairingCodeExpiresAt.getTime() < Date.now()) {
      return res.status(410).json({ message: "Eşleştirme kodunun süresi doldu" });
    }
    const token = genGatewayToken();
    await db.update(smsGatewayDevices).set({
      ...info, status: "active", tokenHash: sha256(token), pairingCode: null, pairingCodeExpiresAt: null, lastSeenAt: new Date(),
    }).where(eq(smsGatewayDevices.id, device.id));
    res.status(201).json({
      deviceToken: token, deviceId: device.id, name: device.name,
      dailyLimit: device.dailyLimit, perMinuteLimit: device.perMinuteLimit, pollIntervalMs: 5000,
    });
  });

  app.post("/api/sms-gateway/heartbeat", deviceLimiter, async (req, res) => {
    const device = await requireGatewayDevice(req, res);
    if (!device) return;
    const parsed = deviceInfoSchema.safeParse(req.body ?? {});
    const info = parsed.success ? parsed.data : {};
    await db.update(smsGatewayDevices).set({ ...info, lastSeenAt: new Date() }).where(eq(smsGatewayDevices.id, device.id));
    res.json({ ok: true, enabled: device.enabled, usage: await deviceUsage(device.id) });
  });

  app.post("/api/sms-gateway/jobs/claim", deviceLimiter, async (req, res) => {
    const device = await requireGatewayDevice(req, res);
    if (!device) return;
    await db.update(smsGatewayDevices).set({ lastSeenAt: new Date() }).where(eq(smsGatewayDevices.id, device.id));
    if (getSmsTransport()?.mode !== "pull") {
      return res.json({ jobs: [], pollAfterMs: 30000, reason: "gateway_inactive" });
    }
    const max = Math.max(1, Math.min(50, Number(req.body?.max ?? 10) || 10));
    const jobs = await claimJobs(device, max);
    res.json({ jobs, pollAfterMs: jobs.length ? 1000 : 5000 });
  });

  app.post("/api/sms-gateway/jobs/:id/result", deviceLimiter, async (req, res) => {
    const device = await requireGatewayDevice(req, res);
    if (!device) return;
    const parsed = z.object({
      status: z.enum(["sent", "delivered", "failed"]),
      error: z.string().max(255).optional(),
      permanent: z.boolean().optional(),
    }).safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Geçersiz istek" });
    const ok = await reportJobResult(device, Number(req.params.id), parsed.data);
    if (!ok) return res.status(404).json({ message: "İş bulunamadı veya bu cihaza ait değil" });
    res.json({ ok: true });
  });

  app.post("/api/sms-gateway/inbound", deviceLimiter, async (req, res) => {
    const device = await requireGatewayDevice(req, res);
    if (!device) return;
    const parsed = z.object({
      from: z.string().min(3).max(32),
      text: z.string().min(1).max(640),
      externalId: z.string().max(64).optional(),
    }).safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Geçersiz istek" });
    const id = await recordInboundSms(device, parsed.data.from, parsed.data.text, parsed.data.externalId);
    res.status(201).json({ id });
  });
}
