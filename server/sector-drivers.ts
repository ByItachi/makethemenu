// Sektör sürücü havuzu: halı / su / tüp sektörlerinin her biri KENDİ sürücü listesini yönetir.
// Atama: işletme paneli ister otomatik (en az yüklü aktif sürücü) ister manuel (listeden seçerek) atar.
// Sipariş, atandığı sürücünün sektorüne ait panelde görünür; sürücü paneli sadece kendi sektorunun görevini görür.
import type { Express, Request, Response } from "express";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "./db";
import {
  carpetOrders,
  deliverySessions,
  sectorDrivers,
  waterOrders,
} from "../shared/schema";
import { requireRestaurant, tenantId } from "./auth/middleware";
import { writeAudit } from "./audit";

export const DRIVER_SECTORS = ["carpet", "water", "tube"] as const;
export type DriverSector = (typeof DRIVER_SECTORS)[number];

const driverSchema = z.object({
  sector: z.enum(DRIVER_SECTORS),
  name: z.string().min(2, "Sürücü adı en az 2 karakter").max(96),
  phone: z.string().max(32).default(""),
});

export async function listDrivers(rid: number, sector: DriverSector) {
  return db
    .select()
    .from(sectorDrivers)
    .where(and(eq(sectorDrivers.restaurantId, rid), eq(sectorDrivers.sector, sector)))
    .orderBy(sectorDrivers.id);
}

/** Otomatik atama: sektorün AKTİF sürücüleri içinde en az yüklü olanı (aktif teslimat oturumu sayısı).
 *  Yük eşitse önce kaydedilen sürücü kazanır. Sürücü yoksa null döner — panel uyarır, sahte sürücü üretilmez. */
export async function autoAssignDriver(rid: number, sector: DriverSector) {
  const pool = (await listDrivers(rid, sector)).filter((d) => d.isActive);
  if (!pool.length) return null;
  const loads = await db
    .select({ driverId: deliverySessions.driverId, n: sql<number>`COUNT(*)` })
    .from(deliverySessions)
    .where(
      and(
        eq(deliverySessions.restaurantId, rid),
        eq(deliverySessions.kind, sector),
        eq(deliverySessions.status, "active"),
      ),
    )
    .groupBy(deliverySessions.driverId);
  const loadOf = new Map(loads.map((l) => [l.driverId, Number(l.n)]));
  return pool.reduce((best, d) =>
    (loadOf.get(d.id) ?? 0) < (loadOf.get(best.id) ?? 0) ? d : best,
  );
}

export type SectorDriverRow = typeof sectorDrivers.$inferSelect;

export async function resolveDriver(rid: number, sector: DriverSector, driverId: number): Promise<SectorDriverRow | null> {
  const [d] = await db
    .select()
    .from(sectorDrivers)
    .where(
      and(
        eq(sectorDrivers.id, driverId),
        eq(sectorDrivers.restaurantId, rid),
        eq(sectorDrivers.sector, sector),
      ),
    )
    .limit(1);
  return d ?? null;
}

const assignSchema = z.object({
  sector: z.enum(DRIVER_SECTORS),
  orderNo: z.string().min(4).max(32),
  driverId: z.number().int().positive().optional(), // yoksa otomatik atama
});

export type AssignResult =
  | { error: string; status: 404 | 409 }
  | { driver: { id: number; name: string }; auto: boolean };

/** Siparişe sürücü ata (otomatik/manuel). Yola çıkmış (on_route) siparişin sürücüsü değiştirilemez. */
export async function assignDriverToOrder(rid: number, input: z.infer<typeof assignSchema>): Promise<AssignResult> {
  const { sector, orderNo } = input;
  const driver = input.driverId
    ? await resolveDriver(rid, sector, input.driverId)
    : await autoAssignDriver(rid, sector);
  if (input.driverId && !driver) return { error: "Sürücü bulunamadı (bu sektorün havuzunda değil)", status: 404 as const };
  if (!driver) return { error: "Bu sektorde kayıtlı aktif sürücü yok — önce Sürücüler bölümünden ekleyin", status: 409 as const };

  if (sector === "carpet") {
    const [order] = await db
      .select()
      .from(carpetOrders)
      .where(and(eq(carpetOrders.orderNo, orderNo), eq(carpetOrders.restaurantId, rid)))
      .limit(1);
    if (!order) return { error: "Halı siparişi bulunamadı", status: 404 as const };
    if (order.status === "on_route") return { error: "Yola çıkmış teslimatın sürücüsü değiştirilemez", status: 409 as const };
    await db.update(carpetOrders).set({ driverId: driver.id }).where(eq(carpetOrders.id, order.id));
  } else {
    const [order] = await db
      .select()
      .from(waterOrders)
      .where(and(eq(waterOrders.orderNo, orderNo), eq(waterOrders.restaurantId, rid)))
      .limit(1);
    if (!order) return { error: "Sipariş bulunamadı", status: 404 as const };
    if (order.status === "on_route") return { error: "Yola çıkmış teslimatın sürücüsü değiştirilemez", status: 409 as const };
    await db.update(waterOrders).set({ driverId: driver.id }).where(eq(waterOrders.id, order.id));
  }
  return { driver: { id: driver.id, name: driver.name }, auto: !input.driverId };
}

const SECTOR_LABEL: Record<DriverSector, string> = { carpet: "Halı", water: "Su", tube: "Tüp" };

export function registerSectorDrivers(app: Express) {
  // Araç Takip / canlı sürücü konumu: TÜM sektörlerin sürücüleri + varsa aktif teslimat oturumunun son GPS'i.
  // Konum yalnızca gerçek şoför paneli GPS'inden (delivery_sessions) gelir; sahte konum üretilmez.
  app.get("/api/ops/drivers/live", requireRestaurant, async (req, res) => {
    const rid = tenantId(req);
    const allDrivers = await db.select().from(sectorDrivers).where(eq(sectorDrivers.restaurantId, rid)).orderBy(sectorDrivers.id);
    const activeSessions = await db
      .select()
      .from(deliverySessions)
      .where(and(eq(deliverySessions.restaurantId, rid), eq(deliverySessions.status, "active")));
    const sessionByDriver = new Map(activeSessions.filter((s) => s.driverId != null).map((s) => [s.driverId as number, s]));
    const drivers = allDrivers.map((d) => {
      const session = sessionByDriver.get(d.id);
      const lastPingAt = session?.lastPingAt ?? null;
      const online = !!lastPingAt && Date.now() - new Date(lastPingAt).getTime() < 60_000;
      return {
        id: d.id,
        sector: d.sector,
        sectorLabel: SECTOR_LABEL[d.sector as DriverSector] ?? d.sector,
        name: d.name,
        phone: d.phone,
        isActive: d.isActive,
        tracking: !!session,
        online,
        orderNo: session?.orderNo ?? null,
        lastLat: session?.lastLat ?? null,
        lastLng: session?.lastLng ?? null,
        lastPingAt,
      };
    });
    res.json({
      drivers,
      counts: {
        online: drivers.filter((d) => d.online).length,
        tracking: drivers.filter((d) => d.tracking).length,
        total: drivers.length,
      },
    });
  });

  // Sürücü listesi (sektor bazında ayrı havuz)
  app.get("/api/ops/drivers", requireRestaurant, async (req, res) => {
    const parsed = z.object({ sector: z.enum(DRIVER_SECTORS) }).safeParse(req.query);
    if (!parsed.success) return res.status(400).json({ message: "sector gerekli (carpet | water | tube)" });
    res.json({ drivers: await listDrivers(tenantId(req), parsed.data.sector) });
  });

  app.post("/api/ops/drivers", requireRestaurant, async (req, res) => {
    const rid = tenantId(req);
    const parsed = driverSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.issues[0]?.message ?? "Geçersiz istek" });
    const [row] = await db
      .insert(sectorDrivers)
      .values({ restaurantId: rid, sector: parsed.data.sector, name: parsed.data.name, phone: parsed.data.phone || null })
      .$returningId();
    await writeAudit({ action: "sector.driver.created", entity: "sector_drivers", entityId: String(row.id), restaurantId: rid, actorUserId: null, meta: { sector: parsed.data.sector } });
    const [d] = await db.select().from(sectorDrivers).where(eq(sectorDrivers.id, row.id)).limit(1);
    res.status(201).json({ driver: d });
  });

  app.patch("/api/ops/drivers/:id", requireRestaurant, async (req, res) => {
    const rid = tenantId(req);
    const parsed = z
      .object({
        name: z.string().min(2).max(96).optional(),
        phone: z.string().max(32).optional(),
        isActive: z.boolean().optional(),
      })
      .safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Geçersiz istek" });
    const result = await db
      .update(sectorDrivers)
      .set(parsed.data)
      .where(and(eq(sectorDrivers.id, Number(req.params.id)), eq(sectorDrivers.restaurantId, rid)));
    if (!result[0].affectedRows) return res.status(404).json({ message: "Sürücü bulunamadı" });
    const [d] = await db.select().from(sectorDrivers).where(eq(sectorDrivers.id, Number(req.params.id))).limit(1);
    res.json({ driver: d });
  });

  app.delete("/api/ops/drivers/:id", requireRestaurant, async (req, res) => {
    const rid = tenantId(req);
    const result = await db
      .delete(sectorDrivers)
      .where(and(eq(sectorDrivers.id, Number(req.params.id)), eq(sectorDrivers.restaurantId, rid)));
    if (!result[0].affectedRows) return res.status(404).json({ message: "Sürücü bulunamadı" });
    res.json({ ok: true });
  });

  // Atama: driverId verilirse manuel, verilmezse otomatik (en az yüklü sürücü).
  app.post("/api/ops/drivers/assign", requireRestaurant, async (req, res) => {
    const rid = tenantId(req);
    const parsed = assignSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Geçersiz istek" });
    const out = await assignDriverToOrder(rid, parsed.data);
    if ("error" in out) return res.status(out.status).json({ message: out.error });
    res.json({ ok: true, driver: out.driver, auto: out.auto });
  });
}
