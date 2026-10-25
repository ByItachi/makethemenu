import type { Express, Request, Response } from "express";
import { eq, desc, sql, and } from "drizzle-orm";
import { db } from "./db";
import { restaurants, templates } from "@shared/schema";
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
        "Allow: /",
        "Allow: /p/",
        "Disallow: /api/",
        "Disallow: /admin",
        "Disallow: /dashboard",
        "Disallow: /panel",
        "Disallow: /isletme",
        "Disallow: /restoran",
        "Disallow: /online",
        "Disallow: /patron",
        "Disallow: /desktop",
        "Disallow: /dogrula",
        "Disallow: /sifre-sifirla",
        "Disallow: /sifremi-unuttum",
        "Disallow: /giris",
        "Disallow: /kayit",
        "Disallow: /sablon-sec",
        "Disallow: /purchase",
        "Disallow: /integration-purchase",
        "Disallow: /fiyatlandirma",
        "",
        `Sitemap: ${base}/sitemap.xml`,
        "",
      ].join("\n"),
    );
  });

  const STATIC_PAGES = [
    // Ana gezinme
    "/", "/ozellikler", "/sablonlar", "/fiyatlar", "/indir", "/hakkimizda",
    "/hakkimizda/hakkimizda", "/iletisim", "/cozumler", "/basari-hikayeleri",
    // Kaynaklar
    "/kaynaklar/blog", "/kaynaklar/bilgi-merkezi", "/kaynaklar/api",
    // Sektör çözümleri (public landing'ler)
    "/cozumler/restoran-otomasyon", "/cozumler/kafe-otomasyon",
    "/restoran-otomasyon-sistemi", "/cafe-otomasyon-sistemi",
    "/coklu-sube-adisyon-pos-sistemi", "/fast-food-isletme-adisyon-programi",
    "/burger-cafe-restoran-adisyon-sistemi", "/sezonluk-isletmeler",
    "/cloud-kitchen-bulut-mutfak-adisyon-programi-pos-sistemi",
    "/pizza-restaurant-pos-otomasyon-sistemi", "/otel-restoran-yazilimi-otel-yazilim-programi",
    // Ortaklık
    "/is-ortakligi/bayilik",
  ];

  // Blog yazıları ve şablonlar her istekte kaynaklardan taze okunur: yayından
  // kaldırılan içerik sitemap'ten aynı anda düşer.
  const loadDynamicUrls = async (): Promise<Array<{ loc: string; lastmod?: string }>> => {
    const urls: Array<{ loc: string; lastmod?: string }> = [];
    try {
      const { blogPosts } = await import("../client/src/lib/blog-posts");
      for (const post of blogPosts) {
        urls.push({ loc: `/kaynaklar/blog/${post.slug}`, lastmod: post.dateISO });
      }
    } catch {
      // Blog kaynağı okunamazsa yalnızca statik sayfalarla devam et.
    }
    try {
      const rows = await db
        .select({ slug: templates.slug, updatedAt: templates.updatedAt })
        .from(templates)
        .where(and(eq(templates.status, "published"), eq(templates.visibility, "public")));
      for (const t of rows) {
        if (!t.slug) continue;
        const lastmod = t.updatedAt ? new Date(t.updatedAt).toISOString().slice(0, 10) : undefined;
        urls.push({ loc: `/sablonlar/${t.slug}`, lastmod });
      }
    } catch {
      // Şablon tablosu yoksa atla.
    }
    return urls;
  };

  app.get("/sitemap.xml", async (_req: Request, res: Response) => {
    const base = publicBaseUrl();
    const dynamicUrls = await loadDynamicUrls();
    const rows = await db
      .select({ slug: restaurants.slug, joinedAt: restaurants.joinedAt })
      .from(restaurants)
      .where(eq(restaurants.isPublished, true))
      .orderBy(desc(restaurants.id));
    const staticUrls = STATIC_PAGES.map((p) => `  <url><loc>${xmlEscape(`${base}${p}`)}</loc></url>`);
    const dynamicXml = dynamicUrls
      .filter((u) => u.loc && !u.loc.includes("..") && !u.loc.includes("?"))
      .map((u) => {
        const lastmod = u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : "";
        return `  <url><loc>${xmlEscape(`${base}${u.loc}`)}</loc>${lastmod}</url>`;
      });
    const urls = rows
      .filter((r) => r.slug)
      .map((r) => {
        const lastmod = r.joinedAt ? `<lastmod>${new Date(r.joinedAt).toISOString().slice(0, 10)}</lastmod>` : "";
        return `  <url><loc>${xmlEscape(`${base}/p/${r.slug}`)}</loc>${lastmod}</url>`;
      });
    const all = [...staticUrls, ...dynamicXml, ...urls];
    res.type("application/xml").setHeader("Cache-Control", "public, max-age=300");
    res.send(
      `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${all.join("\n")}\n</urlset>\n`,
    );
  });
}
