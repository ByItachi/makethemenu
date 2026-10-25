// Sürücü teslimat servisi: "teslimata çıkar" → canlı konum ZORUNLU (sürücü kapatamaz) → QR/kod ile teslim.
// Dürüstlük: konum yalnızca gerçek geolocation ping'lerinden gelir; ping gelmeden oturum konumsuz açılır,
// panel "konum bekleniyor" der — sahte koordinat üretilmez.
import type { Express, Request, Response } from "express";
import QRCode from "qrcode";
import { and, desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { db } from "./db";
import {
  carpetEvents,
  carpetItems,
  carpetOrders,
  deliverySessions,
  waterOrders,
} from "../shared/schema";
import { requireRestaurant, tenantId } from "./auth/middleware";
import { autoAssignDriver, resolveDriver, type SectorDriverRow } from "./sector-drivers";

const DEMO_RESTAURANT_ID = 97;

const CARPET_FINAL = "delivered";
const WATER_FINAL = "delivered";

const SESSION_KINDS = ["carpet", "water", "tube"] as const;
type SessionKind = (typeof SESSION_KINDS)[number];

const kindParam = (raw: unknown): SessionKind | undefined =>
  SESSION_KINDS.includes(raw as SessionKind) ? (raw as SessionKind) : undefined;

// Oturum sektor bazında ayrıdır: halı sürücüsü yoldayken su/tüp sürücüsü de görev alabilir.
async function activeSession(rid: number, kind?: SessionKind) {
  const where = kind
    ? and(
        eq(deliverySessions.restaurantId, rid),
        eq(deliverySessions.status, "active"),
        eq(deliverySessions.kind, kind),
      )
    : and(eq(deliverySessions.restaurantId, rid), eq(deliverySessions.status, "active"));
  const [s] = await db
    .select()
    .from(deliverySessions)
    .where(where)
    .orderBy(desc(deliverySessions.id))
    .limit(1);
  return s ?? null;
}

async function sessionTarget(s: NonNullable<Awaited<ReturnType<typeof activeSession>>>) {
  if (s.kind === "carpet") {
    const [order] = await db.select().from(carpetOrders).where(eq(carpetOrders.orderNo, s.orderNo)).limit(1);
    if (!order) return null;
    const items = await db.select().from(carpetItems).where(eq(carpetItems.orderId, order.id));
    return {
      kind: s.kind,
      orderNo: order.orderNo,
      customerName: order.customerName,
      phone: order.phone,
      addressText: order.addressText,
      timeSlot: order.timeSlot,
      total: order.estimatedPrice,
      codes: items.filter((i) => i.status !== CARPET_FINAL).map((i) => i.labelCode),
    };
  }
  const [order] = await db.select().from(waterOrders).where(eq(waterOrders.orderNo, s.orderNo)).limit(1);
  if (!order) return null;
  return {
    kind: s.kind,
    orderNo: order.orderNo,
    customerName: order.customerName,
    phone: order.phone,
    addressText: order.addressText,
    timeSlot: order.timeSlot,
    total: order.total,
    codes: [order.orderNo],
  };
}

export function registerDeliveryService(app: Express) {
  // QR görseli: metinden SVG (harici servise bağımlı değil).
  app.get("/api/qr.svg", async (req: Request, res: Response) => {
    const text = String(req.query.text ?? "").slice(0, 512);
    if (!text) return res.status(400).json({ message: "text gerekli" });
    const svg = await QRCode.toString(text, { type: "svg", margin: 1, width: 240 });
    res.setHeader("Content-Type", "image/svg+xml");
    res.send(svg);
  });

  // Aktif oturum + hedef bilgisi (sürücü paneli 5 sn'de bir yoklar). ?kind= ile sektör bazlı sorgulanır —
  // her sektörün sürücü paneli yalnızca kendi sektörünün oturumunu görür.
  app.get("/api/driver/delivery/active", async (req, res) => {
    const s = await activeSession(DEMO_RESTAURANT_ID, kindParam(req.query.kind));
    if (!s) return res.json({ session: null });
    const target = await sessionTarget(s);
    res.json({
      session: {
        id: s.id,
        kind: s.kind,
        orderNo: s.orderNo,
        driverId: s.driverId,
        driverName: s.driverName,
        startedAt: s.startedAt,
        lastLat: s.lastLat,
        lastLng: s.lastLng,
        lastPingAt: s.lastPingAt,
      },
      target,
    });
  });

  // Görev kuyruğu: sektorunde sürücüye atanmış ama henüz yola çıkmamış siparişler.
  app.get("/api/driver/delivery/queue", async (req, res) => {
    const kind = kindParam(req.query.kind);
    if (!kind) return res.status(400).json({ message: "kind gerekli (carpet | water | tube)" });
    if (kind === "carpet") {
      const rows = await db
        .select()
        .from(carpetOrders)
        .where(and(
          eq(carpetOrders.restaurantId, DEMO_RESTAURANT_ID),
          inArray(carpetOrders.status, ["packing", "delivery_queue"]),
        ))
        .orderBy(desc(carpetOrders.id))
        .limit(20);
      return res.json({
        tasks: rows.map((o) => ({
          kind, orderNo: o.orderNo, customerName: o.customerName, addressText: o.addressText,
          timeSlot: o.timeSlot, total: o.estimatedPrice, driverId: o.driverId,
        })),
      });
    }
    const rows = await db
      .select()
      .from(waterOrders)
      .where(and(
        eq(waterOrders.restaurantId, DEMO_RESTAURANT_ID),
        eq(waterOrders.kind, kind === "tube" ? "tup" : "damacana"),
        inArray(waterOrders.status, ["new", "preparing"]),
      ))
      .orderBy(desc(waterOrders.id))
      .limit(20);
    res.json({
      tasks: rows.map((o) => ({
        kind, orderNo: o.orderNo, customerName: o.customerName, addressText: o.addressText,
        timeSlot: o.timeSlot, total: o.total, driverId: o.driverId,
      })),
    });
  });

  // "Teslimata çıkar" — atanan sürücüyle oturum açar. Sürücü verilmediyse OTOMATİK atanır
  // (en az yüklü aktif sürücü). Yalnızca aynı sektörün önceki oturumu kapanır; sektörler bağımsızdır.
  app.post("/api/driver/delivery/start", requireRestaurant, async (req, res) => {
    const rid = tenantId(req);
    const parsed = z
      .object({
        kind: z.enum(SESSION_KINDS),
        orderNo: z.string().min(4).max(32),
        driverId: z.number().int().positive().optional(),
        driverName: z.string().max(96).optional(),
      })
      .safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Geçersiz istek" });
    const { kind, orderNo } = parsed.data;

    // Sürücü: panelde atanmışsa o kullanılır; atanmamışsa otomatik atama yapılır.
    let driverId: number | null = null;
    let driverName: string | null = parsed.data.driverName ?? null;
    if (parsed.data.driverId) {
      const d = await resolveDriver(rid, kind, parsed.data.driverId);
      if (!d) return res.status(404).json({ message: "Sürücü bulunamadı (bu sektorün havuzunda değil)" });
      if (!d.isActive) return res.status(409).json({ message: "Bu sürücü pasif durumda — atama yapılamaz" });
      driverId = d.id;
      driverName = d.name;
    } else {
      const auto = await autoAssignDriver(rid, kind);
      if (auto) {
        driverId = auto.id;
        driverName = auto.name;
      }
    }

    const [prev] = await db
      .select()
      .from(deliverySessions)
      .where(and(
        eq(deliverySessions.restaurantId, rid),
        eq(deliverySessions.status, "active"),
        eq(deliverySessions.kind, kind),
      ))
      .limit(1);
    if (prev) {
      await db
        .update(deliverySessions)
        .set({ status: "completed", endedAt: new Date() })
        .where(eq(deliverySessions.id, prev.id));
    }

    if (kind === "carpet") {
      const [order] = await db.select().from(carpetOrders).where(eq(carpetOrders.orderNo, orderNo)).limit(1);
      if (!order || order.restaurantId !== rid) return res.status(404).json({ message: "Halı siparişi bulunamadı" });
      const items = await db.select().from(carpetItems).where(eq(carpetItems.orderId, order.id));
      for (const i of items.filter((x) => x.status !== CARPET_FINAL)) {
        await db.update(carpetItems).set({ status: "on_route" }).where(eq(carpetItems.id, i.id));
        await db.insert(carpetEvents).values({
          itemId: i.id,
          orderId: order.id,
          restaurantId: rid,
          toStatus: "on_route",
          actor: driverName || "sürücü",
          note: driverId ? `Sürücü teslimata çıktı: ${driverName}` : "Sürücü teslimata çıktı (canlı konum zorunlu)",
        });
      }
      await db.update(carpetOrders).set({ status: "on_route", driverId }).where(eq(carpetOrders.id, order.id));
    } else {
      const [order] = await db.select().from(waterOrders).where(eq(waterOrders.orderNo, orderNo)).limit(1);
      if (!order || order.restaurantId !== rid) return res.status(404).json({ message: "Sipariş bulunamadı" });
      await db.update(waterOrders).set({ status: "on_route", driverId }).where(eq(waterOrders.id, order.id));
    }

    const [row] = await db
      .insert(deliverySessions)
      .values({ restaurantId: rid, kind, orderNo, driverId, driverName: driverName ?? null })
      .$returningId();
    res.json({
      ok: true,
      sessionId: row.id,
      driver: driverId ? { id: driverId, name: driverName } : null,
      message: driverId
        ? `Teslimat başladı — sürücü: ${driverName}. Canlı konum servisi otomatik açıldı ve teslimat bitene kadar kapatılamaz.`
        : "Teslimat başladı. Canlı konum servisi otomatik açıldı ve teslimat bitene kadar kapatılamaz.",
    });
  });

  // Canlı konum ping'i — sürücü paneli otomatik gönderir (izole: oturum yoksa kayıt açılmaz).
  app.post("/api/driver/delivery/ping", requireRestaurant, async (req, res) => {
    const rid = tenantId(req);
    const parsed = z
      .object({
        kind: z.enum(SESSION_KINDS).optional(), // sektör paneli kendi oturumuna ping atar
        lat: z.number(),
        lng: z.number(),
        accuracy: z.number().min(0).max(10000).optional(),
      })
      .safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Geçersiz istek" });
    const s = await activeSession(rid, parsed.data.kind);
    if (!s) return res.status(404).json({ message: "Aktif teslimat yok" });
    await db
      .update(deliverySessions)
      .set({
        lastLat: parsed.data.lat,
        lastLng: parsed.data.lng,
        lastAccuracy: parsed.data.accuracy ?? null,
        lastPingAt: new Date(),
      })
      .where(eq(deliverySessions.id, s.id));
    res.json({ ok: true });
  });

  // Teslim tamamla: kod = halı etiketi (HL-…), halı sipariş no (HL-…) veya su/tüp sipariş no (SU-…).
  // Aktif oturumun hedefiyle eşleşmek zorunda — başka siparişin kodu teslim yapılamaz.
  app.post("/api/driver/delivery/complete", requireRestaurant, async (req, res) => {
    const rid = tenantId(req);
    const parsed = z.object({ code: z.string().min(4).max(32) }).safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Geçersiz istek" });
    const code = parsed.data.code.trim().toUpperCase();
    // Kod tüm aktif sektör oturumlarında aranır — hangi sektörün hedefiyse o oturum kapanır.
    const sessions = await db
      .select()
      .from(deliverySessions)
      .where(and(eq(deliverySessions.restaurantId, rid), eq(deliverySessions.status, "active")))
      .orderBy(desc(deliverySessions.id));
    if (!sessions.length) return res.status(404).json({ message: "Aktif teslimat yok — işletme panelinden 'Teslimata Çıkar' ile başlayın" });
    let s = sessions[0];
    let target = await sessionTarget(s);
    for (const candidate of sessions) {
      const t = await sessionTarget(candidate);
      if (t?.codes.includes(code)) {
        s = candidate;
        target = t;
        break;
      }
    }
    if (!target) return res.status(404).json({ message: "Teslimat hedefi bulunamadı" });
    if (!target.codes.includes(code)) {
      return res.status(400).json({ message: `Bu kod bu teslimata ait değil. Beklenen: ${target.codes.join(", ")}` });
    }

    if (s.kind === "carpet") {
      const [order] = await db.select().from(carpetOrders).where(eq(carpetOrders.orderNo, s.orderNo)).limit(1);
      if (!order) return res.status(404).json({ message: "Sipariş bulunamadı" });
      const items = await db.select().from(carpetItems).where(eq(carpetItems.orderId, order.id));
      const isItemCode = items.some((i) => i.labelCode === code);
      if (isItemCode) {
        const item = items.find((i) => i.labelCode === code)!;
        await db.update(carpetItems).set({ status: CARPET_FINAL }).where(eq(carpetItems.id, item.id));
        await db.insert(carpetEvents).values({ itemId: item.id, orderId: order.id, restaurantId: rid, toStatus: CARPET_FINAL, actor: "QR teslimat", note: "QR ile teslim alındı" });
      } else {
        for (const i of items.filter((x) => x.status !== CARPET_FINAL)) {
          await db.update(carpetItems).set({ status: CARPET_FINAL }).where(eq(carpetItems.id, i.id));
          await db.insert(carpetEvents).values({ itemId: i.id, orderId: order.id, restaurantId: rid, toStatus: CARPET_FINAL, actor: "QR teslimat", note: "QR ile teslim alındı" });
        }
      }
      const after = await db.select().from(carpetItems).where(eq(carpetItems.orderId, order.id));
      const allDone = after.every((i) => i.status === CARPET_FINAL);
      await db.update(carpetOrders).set({ status: allDone ? WATER_FINAL : order.status }).where(eq(carpetOrders.id, order.id));
      if (allDone) {
        await db
          .update(deliverySessions)
          .set({ status: "completed", endedAt: new Date() })
          .where(eq(deliverySessions.id, s.id));
        return res.json({ ok: true, completed: true, message: "Tüm parçalar teslim edildi. Canlı konum servisi kapatıldı." });
      }
      return res.json({ ok: true, completed: false, message: "Parça teslim edildi. Kalan parçalar: " + after.filter((i) => i.status !== CARPET_FINAL).length });
    }

    // water / tube
    const [order] = await db.select().from(waterOrders).where(eq(waterOrders.orderNo, s.orderNo)).limit(1);
    if (!order) return res.status(404).json({ message: "Sipariş bulunamadı" });
    await db.update(waterOrders).set({ status: WATER_FINAL }).where(eq(waterOrders.id, order.id));
    await db
      .update(deliverySessions)
      .set({ status: "completed", endedAt: new Date() })
      .where(eq(deliverySessions.id, s.id));
    res.json({ ok: true, completed: true, message: "Teslim edildi. Canlı konum servisi kapatıldı." });
  });

  // Panellerin QR basması için ödeme/kayıt gerektirmeyen halka uç: aktif oturumsuz da etiket basılabilir.
  app.get("/api/delivery/qr-target/:code", async (req, res) => {
    res.json({ url: `/teslimat/${encodeURIComponent(String(req.params.code))}` });
  });
}
