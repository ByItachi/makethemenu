import type { Express, Request, Response, NextFunction } from "express";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { randomBytes } from "crypto";
import { db } from "./db";
import { restaurantDomains, restaurants } from "@shared/schema";
import { requirePlatformAdmin, requireRestaurant, tenantId } from "./auth/middleware";
import { getRestaurantPlan } from "./plans";
import { writeAudit } from "./audit";

const DOMAIN_RE = /^(?=.{1,253}$)([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;
const TXT_PREFIX = "mtm-verify=";
// A domain also passes ownership when it points its traffic at the platform edge.
export const EDGE_CNAME = "menus.makethemenu.com";

export type DoHResolver = (domain: string) => Promise<{ txt: string[]; cname: string | null }>;

export function normalizeDomain(input: string): string {
  return input.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/:\d+$/, "");
}

export function isValidDomain(domain: string): boolean {
  return DOMAIN_RE.test(domain) && !domain.endsWith(".localhost") && !/^\d{1,3}(\.\d{1,3}){3}$/.test(domain);
}

/** DNS-over-HTTPS lookup (Google DNS). Returns TXT strings and the first CNAME target. */
export const dohResolver: DoHResolver = async (domain) => {
  const res = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=TXT`, {
    headers: { Accept: "application/dns-json" },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`DNS sorgusu başarısız (HTTP ${res.status}).`);
  const data: any = await res.json();
  const txt = Array.isArray(data?.Answer) ? data.Answer.filter((a: any) => a?.type === 16).map((a: any) => String(a.data).replace(/"/g, "")) : [];
  const cname = Array.isArray(data?.Answer) ? data.Answer.find((a: any) => a?.type === 5)?.data ?? null : null;
  return { txt, cname };
};

export async function verifyOwnership(domain: string, token: string, resolve: DoHResolver = dohResolver): Promise<{ ok: boolean; reason?: string }> {
  let result;
  try {
    result = await resolve(domain);
  } catch {
    return { ok: false, reason: "DNS sorgusu yapılamadı; kaydı oluşturduktan birkaç dakika sonra tekrar deneyin." };
  }
  const want = `${TXT_PREFIX}${token}`;
  if (result.txt.some((t) => t.replace(/\s+/g, "") === want || t.replace(/\s+/g, "").endsWith(want))) return { ok: true };
  if ((result.cname ?? "").toLowerCase().replace(/\.$/, "") === EDGE_CNAME) return { ok: true };
  return { ok: false, reason: `Doğrulama kaydı bulunamadı. TXT kaydını oluşturun: _mtm-verify.${domain} → ${want}` };
}

function domainDto(d: typeof restaurantDomains.$inferSelect) {
  const want = `${TXT_PREFIX}${d.verificationToken}`;
  return {
    id: d.id,
    domain: d.domain,
    status: d.status,
    verifiedAt: d.verifiedAt,
    createdAt: d.createdAt,
    dnsInstructions: {
      txt: { name: `_mtm-verify.${d.domain}`, value: want },
      cname: { name: d.domain, value: EDGE_CNAME, note: "Trafik için A/CNAME kaydı" },
      tls: d.status === "verified" ? "TLS sertifikası doğrulamadan sonra platform tarafından otomatik verilir." : null,
    },
  };
}

/**
 * Custom domains (extra feature): the free menu address is always
 * makethemenu.com/p/<slug>; connecting your own domain requires a plan with
 * customDomain enabled. Ownership is proven with a DNS TXT record.
 */
export function registerDomainRoutes(app: Express) {
  app.get("/api/restaurant/domains", requireRestaurant, async (req: Request, res: Response) => {
    const rid = tenantId(req);
    const plan = await getRestaurantPlan(rid);
    const rows = await db.select().from(restaurantDomains).where(eq(restaurantDomains.restaurantId, rid)).orderBy(desc(restaurantDomains.id));
    res.json({
      planSupportsCustomDomain: plan?.customDomain === true,
      planName: plan?.name ?? null,
      domains: rows.map(domainDto),
    });
  });

  app.post("/api/restaurant/domains", requireRestaurant, async (req: Request, res: Response) => {
    const rid = tenantId(req);
    const plan = await getRestaurantPlan(rid);
    if (!plan?.customDomain) {
      return res.status(403).json({
        message: "Özel alan adı bağlama ek bir özelliktir ve mevcut planınızda yer almıyor. Planınızı yükseltin.",
        code: "PLAN_REQUIRED",
      });
    }

    const parsed = z.object({ domain: z.string().min(4).max(255) }).safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Geçerli bir alan adı girin." });
    const domain = normalizeDomain(parsed.data.domain);
    if (!isValidDomain(domain)) return res.status(400).json({ message: "Geçerli bir alan adı girin." });

    const [existing] = await db.select({ id: restaurantDomains.id }).from(restaurantDomains).where(eq(restaurantDomains.domain, domain)).limit(1);
    if (existing) return res.status(409).json({ message: "Bu alan adı zaten bağlı veya doğrulama bekliyor." });

    const token = `mtm_${randomBytes(24).toString("hex")}`;
    const [ins] = await db.insert(restaurantDomains).values({ restaurantId: rid, domain, verificationToken: token });
    const [row] = await db.select().from(restaurantDomains).where(eq(restaurantDomains.id, Number(ins.insertId)));
    await writeAudit({ restaurantId: rid, actorUserId: req.auth!.userId, action: "domain.add", entity: "restaurant_domain", entityId: String(row.id), req, meta: { domain } });
    res.status(201).json(domainDto(row));
  });

  app.post("/api/restaurant/domains/:id/verify", requireRestaurant, async (req: Request, res: Response) => {
    const rid = tenantId(req);
    const [row] = await db
      .select()
      .from(restaurantDomains)
      .where(and(eq(restaurantDomains.id, Number(req.params.id)), eq(restaurantDomains.restaurantId, rid)))
      .limit(1);
    if (!row) return res.status(404).json({ message: "Alan adı kaydı bulunamadı." });
    if (row.status === "verified") return res.json(domainDto(row));

    const result = await verifyOwnership(row.domain, row.verificationToken);
    if (!result.ok) return res.status(400).json({ message: result.reason ?? "Doğrulanamadı.", verified: false });

    await db
      .update(restaurantDomains)
      .set({ status: "verified", verifiedAt: new Date() })
      .where(eq(restaurantDomains.id, row.id));
    row.status = "verified";
    row.verifiedAt = new Date();
    await writeAudit({ restaurantId: rid, actorUserId: req.auth!.userId, action: "domain.verify", entity: "restaurant_domain", entityId: String(row.id), req, meta: { domain: row.domain } });
    res.json(domainDto(row));
  });

  app.delete("/api/restaurant/domains/:id", requireRestaurant, async (req: Request, res: Response) => {
    const rid = tenantId(req);
    const [row] = await db
      .select({ id: restaurantDomains.id })
      .from(restaurantDomains)
      .where(and(eq(restaurantDomains.id, Number(req.params.id)), eq(restaurantDomains.restaurantId, rid)))
      .limit(1);
    if (!row) return res.status(404).json({ message: "Alan adı kaydı bulunamadı." });
    await db.delete(restaurantDomains).where(eq(restaurantDomains.id, row.id));
    await writeAudit({ restaurantId: rid, actorUserId: req.auth!.userId, action: "domain.remove", entity: "restaurant_domain", entityId: String(row.id), req });
    res.status(204).end();
  });

  // Platform admin overview of every connected domain (ops: TLS issuance, review).
  app.get("/api/admin/domains", requirePlatformAdmin, async (_req: Request, res: Response) => {
    const rows = await db
      .select({
        id: restaurantDomains.id,
        domain: restaurantDomains.domain,
        status: restaurantDomains.status,
        verifiedAt: restaurantDomains.verifiedAt,
        createdAt: restaurantDomains.createdAt,
        restaurantName: restaurants.name,
        restaurantId: restaurantDomains.restaurantId,
      })
      .from(restaurantDomains)
      .innerJoin(restaurants, eq(restaurants.id, restaurantDomains.restaurantId))
      .orderBy(desc(restaurantDomains.id));
    res.json({ domains: rows });
  });
}

const RESERVED_HOSTS = new Set(["localhost", "makethemenu.com", "www.makethemenu.com", "menus.makethemenu.com"]);

/**
 * Serves the public menu for verified custom domains: a document request arriving on a
 * connected domain is rewritten to /p/<slug> before the SPA/static middleware sees it.
 * Registered after all API routes, before vite/static — only rewrites the site root.
 */
export function registerCustomDomainHostRewrite(app: Express) {
  const rewrite = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (req.method !== "GET" && req.method !== "HEAD") return next();
      if (req.path !== "/") return next();
      const accept = String(req.headers.accept ?? "");
      if (!accept.includes("text/html")) return next();

      const host = (req.hostname || "").toLowerCase().replace(/:\d+$/, "");
      if (!host || RESERVED_HOSTS.has(host) || host.endsWith(".localhost")) return next();
      const publicHost = process.env.PUBLIC_BASE_URL ? new URL(process.env.PUBLIC_BASE_URL).hostname : null;
      if (publicHost && (host === publicHost || `www.${publicHost}` === host)) return next();

      const [row] = await db
        .select({ slug: restaurants.slug, published: restaurants.isPublished })
        .from(restaurantDomains)
        .innerJoin(restaurants, eq(restaurants.id, restaurantDomains.restaurantId))
        .where(and(eq(restaurantDomains.domain, host), eq(restaurantDomains.status, "verified")))
        .limit(1);
      if (!row?.slug || !row.published) return next();

      req.url = `/p/${row.slug}`;
      res.setHeader("X-Mtm-Custom-Domain", host);
      next();
    } catch {
      next();
    }
  };
  app.use(rewrite);
}
