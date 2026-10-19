import type { Express, Request, Response } from "express";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "./db";
import { menuEvents, orderItems, orders, products, tables } from "@shared/schema";
import { requireRestaurant, tenantId } from "./auth/middleware";

/** CSV field escaping: quote anything special and double embedded quotes. */
function csvField(value: unknown): string {
  const s = value === null || value === undefined ? "" : String(value);
  return /[",;\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function csvResponse(res: Response, filename: string, header: string, rows: string[][]) {
  // UTF-8 BOM so Excel opens Turkish characters correctly.
  const body = "\uFEFF" + [header, ...rows.map((r) => r.map(csvField).join(","))].join("\r\n");
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.setHeader("Cache-Control", "private, no-cache");
  res.send(body);
}

const STATUS_TR: Record<string, string> = {
  pending: "Bekliyor",
  preparing: "Hazırlanıyor",
  completed: "Tamamlandı",
  cancelled: "İptal",
};

/**
 * CSV exports for the business dashboard (spec §9): full order history and menu analytics.
 * Both are tenant-scoped by the session; no cross-business data can be exported.
 */
export function registerCsvExportRoutes(app: Express) {
  app.get("/api/orders/export", requireRestaurant, async (req: Request, res: Response) => {
    const rid = tenantId(req);

    const rows = await db
      .select({
        id: orders.id,
        createdAt: orders.createdAt,
        tableName: tables.name,
        customerName: orders.customerName,
        phone: orders.phone,
        note: orders.note,
        status: orders.status,
        totalAmount: orders.totalAmount,
      })
      .from(orders)
      .leftJoin(tables, eq(tables.id, orders.tableId))
      .where(eq(orders.restaurantId, rid))
      .orderBy(desc(orders.id));

    const items = await db
      .select({
        orderId: orderItems.orderId,
        quantity: orderItems.quantity,
        productName: products.name,
      })
      .from(orderItems)
      .innerJoin(products, eq(products.id, orderItems.productId))
      .innerJoin(orders, eq(orders.id, orderItems.orderId))
      .where(eq(orders.restaurantId, rid));

    const byOrder = new Map<number, string[]>();
    for (const it of items) {
      if (it.orderId === null) continue;
      const list = byOrder.get(it.orderId) ?? [];
      list.push(`${it.quantity}x ${it.productName}`);
      byOrder.set(it.orderId, list);
    }

    const header = "SiparisID,Tarih,Masa,Musteri,Telefon,Not,Durum,Toplam,Urunler";
    const data = rows.map((r) => [
      String(r.id),
      r.createdAt ? new Date(r.createdAt).toISOString() : "",
      r.tableName ?? "Paket Servis",
      r.customerName ?? "",
      r.phone ?? "",
      r.note ?? "",
      STATUS_TR[r.status] ?? r.status,
      Number(r.totalAmount).toFixed(2),
      (byOrder.get(r.id) ?? []).join("; "),
    ]);

    const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    csvResponse(res, `siparisler-${stamp}.csv`, header, data);
  });

  app.get("/api/analytics/export", requireRestaurant, async (req: Request, res: Response) => {
    const rid = tenantId(req);
    const days = Math.min(90, Math.max(1, Math.floor(Number(req.query.days) || 30)));
    const since = sql`${menuEvents.createdAt} >= DATE_SUB(NOW(), INTERVAL ${days} DAY)`;

    const daily = await db
      .select({
        d: sql<string>`DATE_FORMAT(${menuEvents.createdAt}, '%Y-%m-%d')`,
        type: menuEvents.type,
        count: sql<number>`COUNT(*)`,
      })
      .from(menuEvents)
      .where(and(eq(menuEvents.restaurantId, rid), since))
      .groupBy(sql`DATE_FORMAT(${menuEvents.createdAt}, '%Y-%m-%d')`, menuEvents.type)
      .orderBy(sql`DATE_FORMAT(${menuEvents.createdAt}, '%Y-%m-%d')`);

    const series = new Map<string, { date: string; menuView: number; qrScan: number; productView: number }>();
    for (const row of daily) {
      const cur = series.get(row.d) ?? { date: row.d, menuView: 0, qrScan: 0, productView: 0 };
      if (row.type === "menu_view") cur.menuView += Number(row.count);
      else if (row.type === "qr_scan") cur.qrScan += Number(row.count);
      else if (row.type === "product_view") cur.productView += Number(row.count);
      series.set(row.d, cur);
    }

    const topProducts = await db
      .select({ name: products.name, views: sql<number>`COUNT(*)` })
      .from(menuEvents)
      .innerJoin(products, eq(products.id, menuEvents.productId))
      .where(and(eq(menuEvents.restaurantId, rid), eq(menuEvents.type, "product_view"), since))
      .groupBy(menuEvents.productId, products.name)
      .orderBy(desc(sql`COUNT(*)`))
      .limit(10);

    const header = "Tarih,Menu Goruntuleme,QR Tarama,Urun Goruntuleme";
    const data = Array.from(series.values()).map((d) => [d.date, String(d.menuView), String(d.qrScan), String(d.productView)]);
    // Top product rows follow the daily grid, prefixed with "#" so they read as a footer summary.
    for (const p of topProducts) data.push([`#${p.name}`, "", "", String(p.views)]);

    const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    csvResponse(res, `menü-analitik-${days}gun-${stamp}.csv`, header, data);
  });
}
