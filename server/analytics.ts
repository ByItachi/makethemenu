import type { Express, Request, Response } from "express";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "./db";
import { menuEvents, products, restaurants } from "@shared/schema";
import { requireRestaurant, tenantId } from "./auth/middleware";

const EVENT_TYPES = new Set(["menu_view", "qr_scan", "product_view"]);

/**
 * Anonymous menu analytics. Events carry no IP, no user agent and no profile:
 * aggregate counts feed the business dashboard only.
 */
export function registerAnalyticsRoutes(app: Express) {
  // Public: the QR menu reports its own views. Invalid or foreign input is a silent 204,
  // so probing this endpoint reveals nothing and the menu never breaks on analytics.
  app.post("/api/track", async (req: Request, res: Response) => {
    try {
      const slug = String(req.body?.slug ?? "").toLowerCase();
      const type = String(req.body?.type ?? "");
      if (!EVENT_TYPES.has(type) || !slug) return res.status(204).end();

      const [r] = await db
        .select({ id: restaurants.id, published: restaurants.isPublished })
        .from(restaurants)
        .where(eq(restaurants.slug, slug))
        .limit(1);
      if (!r || !r.published) return res.status(204).end();

      if (type === "product_view") {
        const pid = Number(req.body?.productId);
        if (!Number.isInteger(pid) || pid <= 0) return res.status(204).end();
        const [p] = await db
          .select({ id: products.id })
          .from(products)
          .where(and(eq(products.id, pid), eq(products.restaurantId, r.id)))
          .limit(1);
        if (!p) return res.status(204).end();
        await db.insert(menuEvents).values({ restaurantId: r.id, type, productId: p.id });
        return res.status(204).end();
      }

      await db.insert(menuEvents).values({ restaurantId: r.id, type });
      res.status(204).end();
    } catch {
      res.status(204).end();
    }
  });

  // Owner dashboard: real counts from the events table, relative window anchored at DB NOW().
  app.get("/api/analytics/summary", requireRestaurant, async (req: Request, res: Response) => {
    const rid = tenantId(req);
    const days = Math.min(90, Math.max(1, Math.floor(Number(req.query.days) || 30)));

    const totals = await db
      .select({ type: menuEvents.type, count: sql<number>`COUNT(*)` })
      .from(menuEvents)
      .where(and(eq(menuEvents.restaurantId, rid), sql`${menuEvents.createdAt} >= DATE_SUB(NOW(), INTERVAL ${days} DAY)`))
      .groupBy(menuEvents.type);

    const daily = await db
      .select({
        d: sql<string>`DATE_FORMAT(${menuEvents.createdAt}, '%Y-%m-%d')`,
        type: menuEvents.type,
        count: sql<number>`COUNT(*)`,
      })
      .from(menuEvents)
      .where(and(eq(menuEvents.restaurantId, rid), sql`${menuEvents.createdAt} >= DATE_SUB(NOW(), INTERVAL ${days} DAY)`))
      .groupBy(sql`DATE_FORMAT(${menuEvents.createdAt}, '%Y-%m-%d')`, menuEvents.type)
      .orderBy(sql`DATE_FORMAT(${menuEvents.createdAt}, '%Y-%m-%d')`);

    const topProducts = await db
      .select({
        productId: menuEvents.productId,
        name: products.name,
        views: sql<number>`COUNT(*)`,
      })
      .from(menuEvents)
      .innerJoin(products, eq(products.id, menuEvents.productId))
      .where(and(eq(menuEvents.restaurantId, rid), eq(menuEvents.type, "product_view"), sql`${menuEvents.createdAt} >= DATE_SUB(NOW(), INTERVAL ${days} DAY)`))
      .groupBy(menuEvents.productId, products.name)
      .orderBy(desc(sql`COUNT(*)`))
      .limit(5);

    const byType = (t: string) => Number(totals.find((x) => x.type === t)?.count ?? 0);
    const series = new Map<string, { date: string; menuView: number; qrScan: number; productView: number }>();
    for (const row of daily) {
      const cur = series.get(row.d) ?? { date: row.d, menuView: 0, qrScan: 0, productView: 0 };
      if (row.type === "menu_view") cur.menuView += Number(row.count);
      else if (row.type === "qr_scan") cur.qrScan += Number(row.count);
      else if (row.type === "product_view") cur.productView += Number(row.count);
      series.set(row.d, cur);
    }

    res.json({
      days,
      totals: { menuView: byType("menu_view"), qrScan: byType("qr_scan"), productView: byType("product_view") },
      daily: Array.from(series.values()),
      topProducts: topProducts.map((p) => ({ productId: p.productId, name: p.name, views: Number(p.views) })),
    });
  });
}
