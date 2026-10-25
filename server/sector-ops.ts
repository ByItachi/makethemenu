// Sektör operasyonları (prompt-4): Su dağıtım + halı yıkama + filo/GPS.
// Tenant izolasyonu: tüm işletme uçları requireRestaurant ile kapsam kontrolünden geçer.
// GPS kuralı: konum yalnızca GERÇEK kaynaktan (şoför paneli veya GPS cihazı) gelir;
// sağlayıcı/cihaz yoksa sistem boş durumu dürüstçe gösterir, sahte canlı konum üretilmez.
import type { Express, Request, Response } from "express";
import { and, desc, eq, gte, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "./db";
import {
  carpetEvents,
  carpetItems,
  carpetOrders,
  vehicleLocations,
  vehicles,
  waterOrders,
  waterProducts,
} from "@shared/schema";
import { requireRestaurant, tenantId } from "./auth/middleware";
import { writeAudit } from "./audit";

/** Halı yıkama üretim akışı (işletme ayarlanabilir; varsayılan akış). */
export const CARPET_FLOW = [
  "requested", "pickup_planned", "picked_up", "at_factory", "measured",
  "wash_queue", "washing", "rinse", "drying", "quality_check",
  "packing", "delivery_queue", "on_route", "delivered",
] as const;

function orderNo(prefix: string): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const rnd = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${prefix}-${y}${m}${d}-${rnd}`;
}

function labelCode(): string {
  return `HL-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

const waterOrderSchema = z.object({
  idempotencyKey: z.string().min(8).max(64),
  kind: z.enum(["damacana", "tup"]).default("damacana"),
  customerName: z.string().min(2).max(128),
  phone: z.string().min(10).max(32),
  addressText: z.string().min(5).max(512),
  items: z.array(z.object({
    productId: z.number().int().positive(),
    qty: z.number().int().min(1).max(99),
    emptyReturn: z.number().int().min(0).max(99).default(0),
  })).min(1).max(20),
  scheduledDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  timeSlot: z.enum(["09:00-12:00", "10:00-13:00", "13:00-16:00", "16:00-19:00"]).default("10:00-13:00"),
  note: z.string().max(512).default(""),
  paymentMethod: z.enum(["cash", "card_on_delivery", "transfer"]).default("cash"),
});

const carpetOrderSchema = z.object({
  idempotencyKey: z.string().min(8).max(64),
  customerName: z.string().min(2).max(128),
  phone: z.string().min(10).max(32),
  addressText: z.string().min(5).max(512),
  serviceType: z.enum(["pickup_delivery", "factory_only"]).default("pickup_delivery"),
  category: z.enum(["hali", "koltuk"]).default("hali"),
  pieces: z.number().int().min(1).max(100),
  carpetType: z.string().min(2).max(48).default("yonasilmis"),
  sizeW: z.number().int().min(0).max(600).default(0),
  sizeH: z.number().int().min(0).max(1000).default(0),
  colorDesc: z.string().max(128).default(""),
  conditionNote: z.string().max(512).default(""),
  estimatedPrice: z.number().min(0).max(1_000_000).default(0), // bilgilendirme amaçlı; kesin fiyat işletme onayıyla
  pickupDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  timeSlot: z.enum(["09:00-12:00", "10:00-13:00", "13:00-16:00", "16:00-19:00"]).default("10:00-13:00"),
  note: z.string().max(512).default(""),
});

const vehicleSchema = z.object({
  plate: z.string().min(5).max(24).regex(/^[\dA-ZÇĞİÖŞÜ\s]+$/i, "Plaka yalnızca harf, rakam ve boşluk içerebilir"),
  name: z.string().max(96).default(""),
  brand: z.string().max(48).default(""),
  modelYear: z.number().int().min(1980).max(2100).optional(),
  capacity: z.number().int().min(0).max(999).default(0),
  driverName: z.string().max(96).default(""),
  gpsMethod: z.enum(["none", "driver_app", "gps_device"]).default("none"),
  gpsDeviceId: z.string().max(64).default(""),
  status: z.enum(["active", "maintenance", "passive"]).default("active"),
});

const gpsIngestSchema = z.object({
  vehicleId: z.number().int().positive(),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  speed: z.number().min(0).max(300).optional(),
  clientTime: z.string().max(40).optional(),
});

/** Demo işletme kapsamı: anonim müşteri uçları yalnızca bu işletmeye yazabilir. */
const DEMO_RESTAURANT_ID = 97;

export function registerSectorOpsRoutes(app: Express) {
  // --- SU: ürün kataloğu (public/demo — yalnızca demo işletmenin aktif ürünleri) ---
  app.get("/api/water/products", async (_req, res) => {
    const rows = await db
      .select()
      .from(waterProducts)
      .where(and(eq(waterProducts.restaurantId, DEMO_RESTAURANT_ID), eq(waterProducts.isActive, true)));
    res.json({ products: rows });
  });

  // --- SU: müşteri siparişi (idempotent) ---
  app.post("/api/water/orders", async (req, res) => {
    const parsed = waterOrderSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.issues[0]?.message ?? "Geçersiz istek" });
    const input = parsed.data;

    const [existing] = await db
      .select()
      .from(waterOrders)
      .where(eq(waterOrders.idempotencyKey, input.idempotencyKey))
      .limit(1);
    if (existing) return res.json({ orderNo: existing.orderNo, duplicate: true });

    const products = await db
      .select()
      .from(waterProducts)
      .where(eq(waterProducts.restaurantId, DEMO_RESTAURANT_ID));
    const byId = new Map(products.map((p) => [p.id, p]));

    let total = 0;
    let filled = 0;
    let emptyTotal = 0;
    const items = input.items.map((it) => {
      const p = byId.get(it.productId);
      if (!p) throw Object.assign(new Error("Ürün bulunamadı"), { status: 400 });
      const qty = it.qty;
      const line = Number(p.price) * qty;
      const dep = Number(p.depositFee) * qty;
      total += line + dep;
      if (p.kind === "damacana") {
        filled += qty;
        emptyTotal += it.emptyReturn;
      }
      return { productId: p.id, name: p.name, qty, unitPrice: Number(p.price), depositFee: Number(p.depositFee), emptyReturn: it.emptyReturn, line };
    });

    try {
      await db.insert(waterOrders).values({
        restaurantId: DEMO_RESTAURANT_ID,
        orderNo: orderNo(input.kind === "tup" ? "TP" : "SU"),
        kind: input.kind,
        idempotencyKey: input.idempotencyKey,
        customerName: input.customerName,
        phone: input.phone,
        addressText: input.addressText,
        items,
        total: total.toFixed(2),
        filledDelivered: filled,
        emptyTaken: emptyTotal,
        scheduledDate: input.scheduledDate,
        timeSlot: input.timeSlot,
        note: input.note || null,
        paymentMethod: input.paymentMethod,
      });
    } catch {
      // Aynı idempotencyKey ile ikinci istek: mevcut siparişi döndür, iki kez oluştur.
      const [dup] = await db
        .select()
        .from(waterOrders)
        .where(eq(waterOrders.idempotencyKey, input.idempotencyKey))
        .limit(1);
      if (dup) return res.json({ orderNo: dup.orderNo, duplicate: true });
      throw new Error("Sipariş kaydedilemedi");
    }
    const [row] = await db
      .select()
      .from(waterOrders)
      .where(eq(waterOrders.idempotencyKey, input.idempotencyKey))
      .limit(1);

    await writeAudit({
      action: "water.order.created",
      entity: "water_orders",
      entityId: String(row.id),
      restaurantId: DEMO_RESTAURANT_ID,
      actorUserId: null,
      meta: { orderNo: row.orderNo, total },
    });
    res.status(201).json({ orderNo: row.orderNo, total });
  });

  // --- SU: sipariş takibi (sipariş numarasıyla — müşteri yalnız kendi siparişini görür) ---
  app.get("/api/water/orders/:orderNo", async (req, res) => {
    const [order] = await db
      .select()
      .from(waterOrders)
      .where(eq(waterOrders.orderNo, String(req.params.orderNo)))
      .limit(1);
    if (!order) return res.status(404).json({ message: "Sipariş bulunamadı" });

    // Müşteriye araç konumu yalnızca işletme paylaşım politikası + gerçek GPS varsa verilir.
    let vehicle: Record<string, unknown> | null = null;
    if (order.vehicleId) {
      const [v] = await db.select().from(vehicles).where(eq(vehicles.id, order.vehicleId)).limit(1);
      if (v) {
        vehicle = {
          plate: v.plate,
          driverName: v.driverName,
          // GPS yöntemi yoksa konum bilinmiyor — sahte koordinat dönülmez.
          locationKnown: v.gpsMethod !== "none" && !!v.lastSeenAt,
          lastSeenAt: v.lastSeenAt,
          lat: v.gpsMethod !== "none" ? v.lastLat : null,
          lng: v.gpsMethod !== "none" ? v.lastLng : null,
        };
      }
    }
    res.json({
      order: {
        orderNo: order.orderNo,
        status: order.status,
        scheduledDate: order.scheduledDate,
        timeSlot: order.timeSlot,
        total: order.total,
        items: order.items,
        filledDelivered: order.filledDelivered,
        emptyTaken: order.emptyTaken,
        paidAmount: order.paidAmount,
      },
      vehicle,
    });
  });

  // --- HALI: müşteri talebi (idempotent; her halı için etiket kodu üretilir) ---
  app.post("/api/carpet/orders", async (req, res) => {
    const parsed = carpetOrderSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.issues[0]?.message ?? "Geçersiz istek" });
    const input = parsed.data;

    const [existing] = await db
      .select()
      .from(carpetOrders)
      .where(eq(carpetOrders.idempotencyKey, input.idempotencyKey))
      .limit(1);
    if (existing) {
      const items = await db.select().from(carpetItems).where(eq(carpetItems.orderId, existing.id));
      return res.json({ orderNo: existing.orderNo, labelCodes: items.map((i) => i.labelCode), duplicate: true });
    }

    const sqmPerPiece = input.sizeW && input.sizeH ? (input.sizeW * input.sizeH) / 10_000 : 0;
    await db.insert(carpetOrders).values({
      restaurantId: DEMO_RESTAURANT_ID,
      orderNo: orderNo("HL"),
      idempotencyKey: input.idempotencyKey,
      customerName: input.customerName,
      phone: input.phone,
      addressText: input.addressText,
      serviceType: input.serviceType,
      category: input.category,
      estimatedPrice: input.estimatedPrice.toFixed(2),
      pickupDate: input.pickupDate,
      timeSlot: input.timeSlot,
      note: input.note || null,
    });
    const [row] = await db
      .select()
      .from(carpetOrders)
      .where(eq(carpetOrders.idempotencyKey, input.idempotencyKey))
      .limit(1);
    const codes = Array.from({ length: input.pieces }, () => labelCode());
    for (const code of codes) {
      await db.insert(carpetItems).values({
        orderId: row.id,
        restaurantId: DEMO_RESTAURANT_ID,
        labelCode: code,
        carpetType: input.carpetType,
        sizeW: input.sizeW,
        sizeH: input.sizeH,
        sqm: sqmPerPiece.toFixed(2),
        colorDesc: input.colorDesc || null,
        conditionNote: input.conditionNote || null,
      });
    }
    const items = await db.select().from(carpetItems).where(eq(carpetItems.orderId, row.id));
    await db.insert(carpetEvents).values(
      items.map((it) => ({
        itemId: it.id,
        orderId: row.id,
        restaurantId: DEMO_RESTAURANT_ID,
        fromStatus: null,
        toStatus: "requested",
        actor: input.customerName,
        note: "Müşteri talebi oluşturuldu",
      })),
    );
    await writeAudit({
      action: "carpet.order.created",
      entity: "carpet_orders",
      entityId: String(row.id),
      restaurantId: DEMO_RESTAURANT_ID,
      actorUserId: null,
      meta: { orderNo: row.orderNo, pieces: input.pieces },
    });
    res.status(201).json({ orderNo: row.orderNo, labelCodes: items.map((i) => i.labelCode) });
  });

  // --- HALI: sipariş takibi ---
  app.get("/api/carpet/orders/:orderNo", async (req, res) => {
    const [order] = await db
      .select()
      .from(carpetOrders)
      .where(eq(carpetOrders.orderNo, String(req.params.orderNo)))
      .limit(1);
    if (!order) return res.status(404).json({ message: "Sipariş bulunamadı" });
    const items = await db.select().from(carpetItems).where(eq(carpetItems.orderId, order.id));
    const events = await db
      .select()
      .from(carpetEvents)
      .where(eq(carpetEvents.orderId, order.id))
      .orderBy(desc(carpetEvents.createdAt))
      .limit(20);
    res.json({
      order: {
        orderNo: order.orderNo,
        status: order.status,
        pickupDate: order.pickupDate,
        timeSlot: order.timeSlot,
        estimatedPrice: order.estimatedPrice,
        approvedPrice: order.approvedPrice,
      },
      items: items.map((i) => ({ labelCode: i.labelCode, status: i.status, sqm: i.sqm, carpetType: i.carpetType })),
      events,
    });
  });

  // --- İŞLETME PANELLERİ (oturum + tenant kapsamı) ---

  const statusCounts = async (table: typeof waterOrders | typeof carpetOrders, rid: number) => {
    const rows = await db
      .select({ status: table.status, n: sql<number>`COUNT(*)` })
      .from(table)
      .where(eq(table.restaurantId, rid))
      .groupBy(table.status);
    return Object.fromEntries(rows.map((r) => [r.status, Number(r.n)]));
  };

  app.get("/api/ops/water/summary", requireRestaurant, async (req, res) => {
    const rid = tenantId(req);
    const counts = await statusCounts(waterOrders, rid);
    const today = new Date().toISOString().slice(0, 10);
    const [todayRow] = await db
      .select({ n: sql<number>`COUNT(*)`, total: sql<number>`COALESCE(SUM(total),0)` })
      .from(waterOrders)
      .where(and(eq(waterOrders.restaurantId, rid), gte(waterOrders.createdAt, new Date(`${today}T00:00:00Z`))));
    const [paidRow] = await db
      .select({ collected: sql<number>`COALESCE(SUM(paid_amount),0)` })
      .from(waterOrders)
      .where(eq(waterOrders.restaurantId, rid));
    const [fleet] = await db
      .select({ n: sql<number>`COUNT(*)` })
      .from(vehicles)
      .where(and(eq(vehicles.restaurantId, rid), eq(vehicles.isActive, true)));
    const openBalance = Number(paidRow.collected) >= 0
      ? Math.max(0, Number(todayRow.total) - Number(paidRow.collected))
      : 0;
    res.json({
      counts,
      todayOrders: Number(todayRow.n),
      todayTotal: Number(todayRow.total),
      collected: Number(paidRow.collected),
      openBalance,
      activeVehicles: Number(fleet.n),
    });
  });

  app.get("/api/ops/water/orders", requireRestaurant, async (req, res) => {
    const rid = tenantId(req);
    const rows = await db
      .select()
      .from(waterOrders)
      .where(eq(waterOrders.restaurantId, rid))
      .orderBy(desc(waterOrders.createdAt))
      .limit(100);
    res.json({ orders: rows });
  });

  /** Su siparişi güncelleme: durum / araç ataması / tahsilat (tenant kapsamı). */
  app.patch("/api/ops/water/orders/:id", requireRestaurant, async (req, res) => {
    const rid = tenantId(req);
    const parsed = z
      .object({
        status: z.enum(["new", "preparing", "on_route", "delivered", "failed", "cancelled"]).optional(),
        vehicleId: z.number().int().positive().nullable().optional(),
        driverId: z.number().int().positive().nullable().optional(),
        paidAmount: z.number().min(0).max(1_000_000).optional(),
        failReason: z.string().max(256).optional(),
      })
      .safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Geçersiz istek" });
    const input = parsed.data;
    const [order] = await db
      .select()
      .from(waterOrders)
      .where(and(eq(waterOrders.id, Number(req.params.id)), eq(waterOrders.restaurantId, rid)))
      .limit(1);
    if (!order) return res.status(404).json({ message: "Sipariş bulunamadı" });
    const paid = input.paidAmount != null ? input.paidAmount.toFixed(2) : undefined;
    await db
      .update(waterOrders)
      .set({
        status: input.status,
        vehicleId: input.vehicleId,
        driverId: input.driverId,
        paidAmount: paid,
        failReason: input.failReason || null,
      })
      .where(eq(waterOrders.id, order.id));
    res.json({ ok: true });
  });

  app.get("/api/ops/carpet/summary", requireRestaurant, async (req, res) => {
    const rid = tenantId(req);
    const counts = await statusCounts(carpetOrders, rid);
    const [paidRow] = await db
      .select({ collected: sql<number>`COALESCE(SUM(paid_amount),0)` })
      .from(carpetOrders)
      .where(eq(carpetOrders.restaurantId, rid));
    const [pieceRow] = await db
      .select({ n: sql<number>`COUNT(*)` })
      .from(carpetItems)
      .where(eq(carpetItems.restaurantId, rid));
    res.json({ counts, collected: Number(paidRow.collected), totalPieces: Number(pieceRow.n) });
  });

  app.get("/api/ops/carpet/orders", requireRestaurant, async (req, res) => {
    const rid = tenantId(req);
    const rows = await db
      .select()
      .from(carpetOrders)
      .where(eq(carpetOrders.restaurantId, rid))
      .orderBy(desc(carpetOrders.createdAt))
      .limit(100);
    const items = await db.select().from(carpetItems).where(eq(carpetItems.restaurantId, rid));
    const byOrder = new Map<number, typeof items>();
    for (const it of items) {
      const list = byOrder.get(it.orderId) ?? [];
      list.push(it);
      byOrder.set(it.orderId, list);
    }
    res.json({ orders: rows.map((o) => ({ ...o, items: byOrder.get(o.id) ?? [] })) });
  });

  /** Halı durum güncellemesi — sürükle-bırak; her geçiş event'e yazılır. */
  app.patch("/api/ops/carpet/items/:id/status", requireRestaurant, async (req, res) => {
    const rid = tenantId(req);
    const parsed = z
      .object({ status: z.enum(CARPET_FLOW), note: z.string().max(512).default("") })
      .safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Geçersiz durum" });
    const [item] = await db
      .select()
      .from(carpetItems)
      .where(and(eq(carpetItems.id, Number(req.params.id)), eq(carpetItems.restaurantId, rid)))
      .limit(1);
    if (!item) return res.status(404).json({ message: "Halı kaydı bulunamadı" });
    if (item.status === parsed.data.status) return res.json({ ok: true, unchanged: true });
    await db.update(carpetItems).set({ status: parsed.data.status }).where(eq(carpetItems.id, item.id));
    await db.insert(carpetEvents).values({
      itemId: item.id,
      orderId: item.orderId,
      restaurantId: rid,
      fromStatus: item.status,
      toStatus: parsed.data.status,
      actor: "operasyon",
      note: parsed.data.note || null,
    });
    // Sipariş durumunu güncelle: en geride kalan halı sipariş durumunu belirler.
    const siblings = await db.select().from(carpetItems).where(eq(carpetItems.orderId, item.orderId));
    const minIdx = Math.min(...siblings.map((s) => CARPET_FLOW.indexOf(s.status as typeof CARPET_FLOW[number])));
    await db.update(carpetOrders).set({ status: CARPET_FLOW[minIdx] }).where(eq(carpetOrders.id, item.orderId));
    res.json({ ok: true });
  });

  // --- FİLO: araç listesi + ekleme (plaka işletme içinde benzersiz) ---
  app.get("/api/ops/vehicles", requireRestaurant, async (req, res) => {
    const rid = tenantId(req);
    const rows = await db.select().from(vehicles).where(eq(vehicles.restaurantId, rid)).orderBy(desc(vehicles.createdAt));
    res.json({ vehicles: rows });
  });

  app.post("/api/ops/vehicles", requireRestaurant, async (req, res) => {
    const rid = tenantId(req);
    const parsed = vehicleSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.issues[0]?.message ?? "Geçersiz istek" });
    const input = parsed.data;
    const internalCode = `MMT-VEH-${Date.now().toString(36).toUpperCase().slice(-6)}`;
    try {
      await db.insert(vehicles).values({
        restaurantId: rid,
        internalCode,
        plate: input.plate.toUpperCase(),
        name: input.name || null,
        brand: input.brand || null,
        modelYear: input.modelYear,
        capacity: input.capacity,
        driverName: input.driverName || null,
        gpsMethod: input.gpsMethod,
        gpsDeviceId: input.gpsDeviceId || null,
        status: input.status,
      });
      const [row] = await db.select().from(vehicles).where(eq(vehicles.internalCode, internalCode)).limit(1);
      await writeAudit({ action: "vehicle.created", entity: "vehicles", entityId: String(row.id), restaurantId: rid, actorUserId: null, meta: { plate: row.plate } });
      res.status(201).json({ vehicle: row });
    } catch (e: unknown) {
      if (String(e).includes("uq_vehicle_restaurant_plate")) {
        return res.status(409).json({ message: "Bu plaka işletmenizde zaten kayıtlı" });
      }
      throw e;
    }
  });

  app.patch("/api/ops/vehicles/:id", requireRestaurant, async (req, res) => {
    const rid = tenantId(req);
    const parsed = vehicleSchema.partial().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Geçersiz istek" });
    const input = parsed.data;
    const result = await db
      .update(vehicles)
      .set({
        ...input,
        plate: input.plate?.toUpperCase(),
        gpsDeviceId: input.gpsDeviceId === "" ? null : input.gpsDeviceId,
      })
      .where(and(eq(vehicles.id, Number(req.params.id)), eq(vehicles.restaurantId, rid)));
    if (!result[0].affectedRows) return res.status(404).json({ message: "Araç bulunamadı" });
    const [row] = await db.select().from(vehicles).where(eq(vehicles.id, Number(req.params.id))).limit(1);
    res.json({ vehicle: row });
  });

  // --- GPS: şoför panelinden gerçek konum gönderimi (idempotent değil — nokta bazlı, spam korumalı) ---
  app.post("/api/driver/location", requireRestaurant, async (req, res) => {
    const rid = tenantId(req);
    const parsed = gpsIngestSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Geçersiz konum verisi" });
    const input = parsed.data;
    const [vehicle] = await db
      .select()
      .from(vehicles)
      .where(and(eq(vehicles.id, input.vehicleId), eq(vehicles.restaurantId, rid)))
      .limit(1);
    if (!vehicle) return res.status(404).json({ message: "Araç bulunamadı" });
    if (vehicle.gpsMethod === "none") {
      return res.status(409).json({ message: "Bu araç için GPS paylaşımı etkin değil (yöntem: yok)" });
    }
    // Yinelenen nokta koruması: aynı aracın son 2 saniyedeki kaydını yoksay.
    const [recent] = await db
      .select()
      .from(vehicleLocations)
      .where(and(
        eq(vehicleLocations.vehicleId, vehicle.id),
        gte(vehicleLocations.recordedAt, new Date(Date.now() - 2_000)),
      ))
      .orderBy(desc(vehicleLocations.recordedAt))
      .limit(1);
    if (recent) return res.json({ ok: true, throttled: true });

    await db.insert(vehicleLocations).values({
      vehicleId: vehicle.id,
      restaurantId: rid,
      lat: input.lat.toFixed(6),
      lng: input.lng.toFixed(6),
      speed: input.speed != null ? input.speed.toFixed(2) : null,
      source: vehicle.gpsMethod === "gps_device" ? "gps_device" : "driver_app",
    });
    await db
      .update(vehicles)
      .set({ lastLat: input.lat.toFixed(6), lastLng: input.lng.toFixed(6), lastSeenAt: new Date() })
      .where(eq(vehicles.id, vehicle.id));
    res.json({ ok: true });
  });

  // --- GPS: son bilinen konum + iz (tenant kapsamı) ---
  app.get("/api/ops/vehicles/:id/track", requireRestaurant, async (req, res) => {
    const rid = tenantId(req);
    const [vehicle] = await db
      .select()
      .from(vehicles)
      .where(and(eq(vehicles.id, Number(req.params.id)), eq(vehicles.restaurantId, rid)))
      .limit(1);
    if (!vehicle) return res.status(404).json({ message: "Araç bulunamadı" });
    const trail = await db
      .select()
      .from(vehicleLocations)
      .where(eq(vehicleLocations.vehicleId, vehicle.id))
      .orderBy(desc(vehicleLocations.recordedAt))
      .limit(50);
    const ageSec = vehicle.lastSeenAt ? Math.floor((Date.now() - new Date(vehicle.lastSeenAt).getTime()) / 1000) : null;
    res.json({
      vehicle: {
        id: vehicle.id,
        plate: vehicle.plate,
        internalCode: vehicle.internalCode,
        driverName: vehicle.driverName,
        gpsMethod: vehicle.gpsMethod,
        status: vehicle.status,
      },
      last: trail[0] ?? null,
      // Dürüst durum: veri yaşı saniye cinsinden; 5 dk üstü "eski", hiç yoksa "bilinmiyor".
      dataAgeSeconds: ageSec,
      freshness: ageSec == null ? "unknown" : ageSec < 300 ? "fresh" : "stale",
      trail: trail.reverse(),
    });
  });
}
