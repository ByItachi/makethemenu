// Cihaz eşleştirme altyapısı: Yazar Kasa (ÖKC), Kiosk, Caller ID, Android Caller ID.
//
// Dürüstlük notu: Bu modül fiziksel cihazlarla "kutudan çıkar çıkmaz" konuşmaz —
// ÖKC/Caller ID tarafında küçük bir "bridge" (yerel ajan/uygulama) cihaza özel
// protokolü bu API'nin genel JSON sözleşmesine çevirmelidir (bkz. docs/CIHAZ-ENTEGRASYONU.md).
// Eşleştirme, kimlik doğrulama, iş kuyruğu ve veri sözleşmesi tamamen gerçek ve
// canlıdır; cihaz geldiğinde yalnızca bridge'in bu uç noktalara bağlanması gerekir.
import type { Express } from "express";
import crypto from "crypto";
import { and, desc, eq, or } from "drizzle-orm";
import { z } from "zod";
import { db } from "./db";
import { devices, fiscalPrintJobs, callerIdEvents, crmCustomers } from "../shared/schema";
import { requireRestaurant, tenantId } from "./auth/middleware";
import { writeAudit } from "./audit";

const DEVICE_TYPES = ["yazar-kasa", "kiosk", "caller-id", "android-callerid"] as const;

function sha256(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function genPairingCode() {
  return String(crypto.randomInt(100000, 999999));
}

function genDeviceToken() {
  return `mtmdev_${crypto.randomBytes(24).toString("hex")}`;
}

async function deviceFromToken(req: any) {
  const token = (req.headers["x-device-token"] as string) || "";
  if (!token) return null;
  const [row] = await db.select().from(devices).where(eq(devices.tokenHash, sha256(token))).limit(1);
  if (!row || row.status !== "active") return null;
  return row;
}

export function registerDeviceRoutes(app: Express) {
  // ── Restoran paneli: cihaz yönetimi ──────────────────────────────────────
  app.get("/api/ops/devices", requireRestaurant, async (req, res) => {
    const rid = tenantId(req);
    const rows = await db.select().from(devices).where(eq(devices.restaurantId, rid)).orderBy(desc(devices.createdAt));
    res.json({
      devices: rows.map((d) => ({
        id: d.id, type: d.type, name: d.name, status: d.status,
        pairingCode: d.status === "pending" ? d.pairingCode : null,
        pairingCodeExpiresAt: d.pairingCodeExpiresAt,
        lastSeenAt: d.lastSeenAt, createdAt: d.createdAt,
      })),
    });
  });

  app.post("/api/ops/devices", requireRestaurant, async (req, res) => {
    const rid = tenantId(req);
    const schema = z.object({ type: z.enum(DEVICE_TYPES), name: z.string().min(2).max(128) });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.issues[0]?.message ?? "Geçersiz istek" });
    const pairingCode = genPairingCode();
    const [result] = await db.insert(devices).values({
      restaurantId: rid,
      type: parsed.data.type,
      name: parsed.data.name,
      pairingCode,
      pairingCodeExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
      status: "pending",
    }).$returningId();
    await writeAudit({ action: "device.created", entity: "devices", entityId: String(result.id), restaurantId: rid, actorUserId: null, meta: { type: parsed.data.type } });
    res.status(201).json({ device: { id: result.id, type: parsed.data.type, name: parsed.data.name, pairingCode, status: "pending" } });
  });

  app.delete("/api/ops/devices/:id", requireRestaurant, async (req, res) => {
    const rid = tenantId(req);
    const result = await db.update(devices).set({ status: "revoked", tokenHash: null })
      .where(and(eq(devices.id, Number(req.params.id)), eq(devices.restaurantId, rid)));
    if (!result[0].affectedRows) return res.status(404).json({ message: "Cihaz bulunamadı" });
    res.json({ ok: true });
  });

  // ── Yazar Kasa (ÖKC): fiş yazdırma kuyruğu ───────────────────────────────
  app.post("/api/ops/devices/fiscal/print", requireRestaurant, async (req, res) => {
    const rid = tenantId(req);
    const schema = z.object({
      deviceId: z.number().int().positive(),
      orderId: z.number().int().positive().optional(),
      items: z.array(z.object({ name: z.string(), quantity: z.number(), unitPrice: z.number(), vatRate: z.number().default(10) })).min(1),
      total: z.number().positive(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.issues[0]?.message ?? "Geçersiz istek" });
    const [device] = await db.select().from(devices).where(and(eq(devices.id, parsed.data.deviceId), eq(devices.restaurantId, rid), eq(devices.type, "yazar-kasa"))).limit(1);
    if (!device) return res.status(404).json({ message: "Yazar kasa cihazı bulunamadı" });
    const [result] = await db.insert(fiscalPrintJobs).values({
      restaurantId: rid, deviceId: device.id, orderId: parsed.data.orderId,
      payload: JSON.stringify({ items: parsed.data.items, total: parsed.data.total }),
      status: "queued",
    }).$returningId();
    res.status(201).json({ job: { id: result.id, status: "queued" } });
  });

  app.get("/api/ops/devices/fiscal/jobs", requireRestaurant, async (req, res) => {
    const rid = tenantId(req);
    const rows = await db.select().from(fiscalPrintJobs).where(eq(fiscalPrintJobs.restaurantId, rid)).orderBy(desc(fiscalPrintJobs.createdAt)).limit(100);
    res.json({ jobs: rows });
  });

  // ── Caller ID / Android Caller ID: gelen çağrı olayları ──────────────────
  app.get("/api/ops/devices/caller-events", requireRestaurant, async (req, res) => {
    const rid = tenantId(req);
    const rows = await db.select().from(callerIdEvents).where(eq(callerIdEvents.restaurantId, rid)).orderBy(desc(callerIdEvents.createdAt)).limit(50);
    res.json({ events: rows });
  });

  app.post("/api/ops/devices/caller-events/:id/ack", requireRestaurant, async (req, res) => {
    const rid = tenantId(req);
    const result = await db.update(callerIdEvents).set({ acknowledgedAt: new Date() })
      .where(and(eq(callerIdEvents.id, Number(req.params.id)), eq(callerIdEvents.restaurantId, rid)));
    if (!result[0].affectedRows) return res.status(404).json({ message: "Olay bulunamadı" });
    res.json({ ok: true });
  });

  // ── Cihaz tarafı: eşleştirme + kimlik doğrulama gerektiren uçlar ─────────
  app.post("/api/device/pair", async (req, res) => {
    const schema = z.object({ pairingCode: z.string().length(6) });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Geçersiz eşleştirme kodu" });
    const [device] = await db.select().from(devices).where(eq(devices.pairingCode, parsed.data.pairingCode)).limit(1);
    if (!device || device.status !== "pending") return res.status(404).json({ message: "Kod geçersiz veya zaten kullanılmış" });
    if (device.pairingCodeExpiresAt && device.pairingCodeExpiresAt.getTime() < Date.now()) {
      return res.status(410).json({ message: "Eşleştirme kodunun süresi doldu" });
    }
    const token = genDeviceToken();
    await db.update(devices).set({
      status: "active", tokenHash: sha256(token), pairingCode: null, pairingCodeExpiresAt: null, lastSeenAt: new Date(),
    }).where(eq(devices.id, device.id));
    res.status(201).json({ deviceToken: token, deviceId: device.id, restaurantId: device.restaurantId, type: device.type, name: device.name });
  });

  app.post("/api/device/ping", async (req, res) => {
    const device = await deviceFromToken(req);
    if (!device) return res.status(401).json({ message: "Geçersiz veya iptal edilmiş cihaz jetonu" });
    await db.update(devices).set({ lastSeenAt: new Date() }).where(eq(devices.id, device.id));
    res.json({ ok: true, restaurantId: device.restaurantId, type: device.type });
  });

  // ÖKC bridge: kuyruktaki fiş işlerini çeker.
  app.get("/api/device/fiscal/jobs", async (req, res) => {
    const device = await deviceFromToken(req);
    if (!device || device.type !== "yazar-kasa") return res.status(401).json({ message: "Yetkisiz" });
    const rows = await db.select().from(fiscalPrintJobs)
      .where(and(eq(fiscalPrintJobs.deviceId, device.id), or(eq(fiscalPrintJobs.status, "queued"), eq(fiscalPrintJobs.status, "printing"))))
      .orderBy(fiscalPrintJobs.createdAt).limit(20);
    res.json({ jobs: rows.map((j) => ({ id: j.id, payload: JSON.parse(j.payload), orderId: j.orderId })) });
  });

  // ÖKC bridge: bir fiş işinin sonucunu bildirir.
  app.post("/api/device/fiscal/jobs/:id/result", async (req, res) => {
    const device = await deviceFromToken(req);
    if (!device || device.type !== "yazar-kasa") return res.status(401).json({ message: "Yetkisiz" });
    const schema = z.object({ status: z.enum(["printed", "failed"]), fiscalNo: z.string().max(64).optional(), message: z.string().max(255).optional() });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Geçersiz istek" });
    const result = await db.update(fiscalPrintJobs).set({
      status: parsed.data.status, fiscalNo: parsed.data.fiscalNo, resultMessage: parsed.data.message, completedAt: new Date(),
    }).where(and(eq(fiscalPrintJobs.id, Number(req.params.id)), eq(fiscalPrintJobs.deviceId, device.id)));
    if (!result[0].affectedRows) return res.status(404).json({ message: "İş bulunamadı" });
    res.json({ ok: true });
  });

  // Caller ID cihazı/uygulaması: gelen çağrıyı bildirir, CRM eşleşmesi anında döner.
  app.post("/api/device/caller-id/event", async (req, res) => {
    const device = await deviceFromToken(req);
    if (!device || (device.type !== "caller-id" && device.type !== "android-callerid")) return res.status(401).json({ message: "Yetkisiz" });
    const schema = z.object({ phone: z.string().min(5).max(32), direction: z.enum(["incoming", "missed"]).default("incoming") });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Geçersiz istek" });
    const digits = parsed.data.phone.replace(/\D/g, "").slice(-10);
    const [customer] = await db.select().from(crmCustomers)
      .where(and(eq(crmCustomers.restaurantId, device.restaurantId), or(eq(crmCustomers.phone, parsed.data.phone), eq(crmCustomers.phone, digits))))
      .limit(1);
    const [result] = await db.insert(callerIdEvents).values({
      restaurantId: device.restaurantId, deviceId: device.id, phone: parsed.data.phone,
      direction: parsed.data.direction, customerId: customer?.id ?? null,
    }).$returningId();
    await db.update(devices).set({ lastSeenAt: new Date() }).where(eq(devices.id, device.id));
    res.status(201).json({
      eventId: result.id,
      customer: customer ? { id: customer.id, name: customer.name, balance: customer.balance, loyaltyPoints: customer.loyaltyPoints } : null,
    });
  });
}
