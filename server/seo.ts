import type { Express, Request, Response } from "express";
import { eq, desc, sql } from "drizzle-orm";
import { db } from "./db";
import { restaurants } from "@shared/schema";
import { publicBaseUrl } from "./tenant-routes";

const xmlEscape = (s: string) =>
  s.replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c]!);

/** Liveness + database check for load balancers and uptime monitors. */
export function registerHealthRoutes(app: Express) {
  app.get("/api/health", async (_req: Request, res: Response) => {
    res.setHeader("Cache-Control", "no-store");
    try {
      await db.execute(sql`SELECT 1`);
      res.json({ status: "ok", database: "ok", time: new Date().toISOString() });
    } catch {
      res.status(503).json({ status: "degraded", database: "error", time: new Date().toISOString() });
    }
  });
}

/**
 * robots.txt and sitemap.xml. Only published menus are listed; private areas are disallowed.
 * Sitemap is generated on each request from the database, so it reflects publish/unpublish at once.
 */
export function registerSeoRoutes(app: Express) {
  app.get("/robots.txt", (_req: Request, res: Response) => {
    const base = publicBaseUrl();
    res.type("text/plain").setHeader("Cache-Control", "public, max-age=3600");
    res.send(
      [
        "User-agent: *",
        "Allow: /p/",
        "Disallow: /api/",
        "Disallow: /admin",
        "Disallow: /dashboard",
        "Disallow: /panel",
        "Disallow: /isletme",
        "Disallow: /restoran",
        "Disallow: /patron",
        "Disallow: /dogrula",
        "Disallow: /sifre-sifirla",
        "",
        `Sitemap: ${base}/sitemap.xml`,
        "",
      ].join("\n"),
    );
  });

  app.get("/sitemap.xml", async (_req: Request, res: Response) => {
    const base = publicBaseUrl();
    const rows = await db
      .select({ slug: restaurants.slug, joinedAt: restaurants.joinedAt })
      .from(restaurants)
      .where(eq(restaurants.isPublished, true))
      .orderBy(desc(restaurants.id));
    const urls = rows
      .filter((r) => r.slug)
      .map((r) => {
        const lastmod = r.joinedAt ? `<lastmod>${new Date(r.joinedAt).toISOString().slice(0, 10)}</lastmod>` : "";
        return `  <url><loc>${xmlEscape(`${base}/p/${r.slug}`)}</loc>${lastmod}</url>`;
      });
    res.type("application/xml").setHeader("Cache-Control", "public, max-age=300");
    res.send(
      `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`,
    );
  });
}
