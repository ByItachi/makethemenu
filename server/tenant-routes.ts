import type { Express, Request, Response } from "express";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import QRCode from "qrcode";
import { db } from "./db";
import { restaurants, restaurantSlugRedirects, users } from "@shared/schema";
import { validateSlug } from "@shared/slug";
import { requireRestaurant, tenantId } from "./auth/middleware";
import { isSlugTaken } from "./tenancy/slugs";
import { getRestaurantPlan, getUsage } from "./plans";
import { writeAudit } from "./audit";

const CURRENCIES = ["TRY", "USD", "EUR", "GBP"] as const;

const MENU_THEMES = ["yesil", "mavi", "kirmizi", "mor", "turuncu", "grafit"] as const;
const MENU_TEMPLATES = ["liste", "izgara", "kart"] as const;
const MENU_LANGUAGES = ["tr", "en", "ar"] as const;

const paymentTypeSchema = z.object({
  id: z.string().trim().min(1).max(40),
  name: z.string().trim().min(1).max(60),
  group: z.enum(["qrmenu", "kiosk", "kapida"]),
  enabled: z.boolean(),
});

const updateSettingsSchema = z
  .object({
    name: z.string().trim().min(2).max(120),
    description: z.string().trim().max(1000).nullable(),
    phone: z.string().trim().max(32).nullable(),
    address: z.string().trim().max(255),
    city: z.string().trim().max(128).nullable(),
    currency: z.enum(CURRENCIES),
    isPublished: z.boolean(),
    ordersEnabled: z.boolean(),
    slug: z.string().trim().toLowerCase(),
    menuTheme: z.enum(MENU_THEMES),
    menuRadius: z.number().int().min(0).max(32),
    menuTemplate: z.enum(MENU_TEMPLATES),
    showProductImages: z.boolean(),
    menuLanguage: z.enum(MENU_LANGUAGES),
    paymentTypes: z.array(paymentTypeSchema).max(60).nullable(),
  })
  .partial();

export function publicBaseUrl(): string {
  if (process.env.PUBLIC_BASE_URL) return process.env.PUBLIC_BASE_URL.replace(/\/$/, "");
  return process.env.NODE_ENV === "production" ? "https://makethemenu.com" : "http://localhost:3000";
}

function settingsDto(r: typeof restaurants.$inferSelect) {
  return {
    id: r.id,
    name: r.name,
    slug: r.slug,
    type: r.type,
    description: r.description,
    phone: r.phone,
    address: r.address,
    city: r.city,
    country: r.country,
    currency: r.currency,
    isPublished: r.isPublished,
    ordersEnabled: r.ordersEnabled,
    planCode: r.planCode,
    menuTheme: r.menuTheme,
    menuRadius: r.menuRadius,
    menuTemplate: r.menuTemplate,
    showProductImages: r.showProductImages,
    menuLanguage: r.menuLanguage,
    paymentTypes: r.paymentTypes ?? null,
    publicUrl: r.slug ? `${publicBaseUrl()}/p/${r.slug}` : null,
  };
}

export function registerTenantRoutes(app: Express) {
  app.get("/api/restaurant", requireRestaurant, async (req: Request, res: Response) => {
    const [r] = await db.select().from(restaurants).where(eq(restaurants.id, tenantId(req)));
    if (!r) return res.status(404).json({ message: "İşletme bulunamadı." });
    res.json(settingsDto(r));
  });

  app.patch("/api/restaurant", requireRestaurant, async (req: Request, res: Response) => {
    const parsed = updateSettingsSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.errors[0].message });
    const id = tenantId(req);
    const input = parsed.data;

    const [current] = await db.select().from(restaurants).where(eq(restaurants.id, id));
    if (!current) return res.status(404).json({ message: "İşletme bulunamadı." });

    if (input.isPublished === true && !current.isPublished) {
      const [owner] = await db.select({ verified: users.emailVerifiedAt }).from(users).where(eq(users.id, req.auth!.userId));
      if (!owner?.verified) {
        return res.status(403).json({ message: "Menüyü yayımlamadan önce e-posta adresinizi doğrulayın.", code: "EMAIL_NOT_VERIFIED" });
      }
    }

    const slugChanged = input.slug !== undefined && input.slug !== current.slug;
    if (slugChanged) {
      const problem = validateSlug(input.slug!);
      if (problem) return res.status(400).json({ message: problem });
      if (await isSlugTaken(input.slug!, id)) {
        return res.status(409).json({ message: "Bu adres başka bir işletme tarafından kullanılıyor." });
      }
    }

    const { slug, ...rest } = input;
    const update: Partial<typeof restaurants.$inferInsert> = { ...rest };
    if (slugChanged) update.slug = slug;

    await db.transaction(async (tx) => {
      if (slugChanged && current.slug) {
        // Keep the old address working; it is released from this business only.
        await tx.delete(restaurantSlugRedirects).where(eq(restaurantSlugRedirects.oldSlug, current.slug));
        await tx.insert(restaurantSlugRedirects).values({ oldSlug: current.slug, restaurantId: id });
      }
      if (slugChanged) {
        // Returning to an earlier address of this business removes its redirect.
        await tx.delete(restaurantSlugRedirects).where(and(eq(restaurantSlugRedirects.oldSlug, slug!), eq(restaurantSlugRedirects.restaurantId, id)));
      }
      if (Object.keys(update).length) {
        await tx.update(restaurants).set(update).where(eq(restaurants.id, id));
      }
    });

    const [updated] = await db.select().from(restaurants).where(eq(restaurants.id, id));
    if (slugChanged) {
      await writeAudit({ restaurantId: id, actorUserId: req.auth!.userId, action: "restaurant.slug_change", entity: "restaurant", entityId: String(id), req, meta: { from: current.slug, to: slug } });
    }
    if (input.isPublished !== undefined && input.isPublished !== current.isPublished) {
      await writeAudit({ restaurantId: id, actorUserId: req.auth!.userId, action: input.isPublished ? "menu.publish" : "menu.unpublish", entity: "restaurant", entityId: String(id), req });
    }
    res.json(settingsDto(updated));
  });

  // Plan, limits and current usage for the business dashboard
  app.get("/api/restaurant/usage", requireRestaurant, async (req: Request, res: Response) => {
    const id = tenantId(req);
    const plan = await getRestaurantPlan(id);
    if (!plan) return res.status(404).json({ message: "Abonelik planı bulunamadı." });
    const usage = await getUsage(id);
    res.json({
      plan: { code: plan.code, name: plan.name, customDomain: plan.customDomain },
      limits: { products: plan.maxProducts, tables: plan.maxTables, model3d: plan.max3dModels },
      usage,
    });
  });

  // QR code that points to the public menu. Only available for a published menu.
  // `?table=<name>` bakes a `?masa=` param into the QR link so scans count as qr_scan per table.
  const qrHandler = (format: "svg" | "png") => async (req: Request, res: Response) => {
    const [r] = await db.select().from(restaurants).where(eq(restaurants.id, tenantId(req)));
    if (!r?.slug) return res.status(409).json({ message: "Önce bir menü adresi belirleyin." });
    if (!r.isPublished) return res.status(409).json({ message: "QR kod için önce menüyü yayımlayın." });

    const tableName = typeof req.query.table === "string" ? req.query.table.trim().slice(0, 40) : "";
    const suffix = tableName ? `?masa=${encodeURIComponent(tableName)}` : "";
    const target = `${publicBaseUrl()}/p/${r.slug}${suffix}`;
    const size = Math.min(2048, Math.max(128, Number(req.query.size) || 512));
    res.setHeader("Cache-Control", "private, no-cache");
    if (format === "svg") {
      const svg = await QRCode.toString(target, { type: "svg", margin: 2, errorCorrectionLevel: "M" });
      res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename="${r.slug}-qr${tableName ? `-${tableName}` : ""}.svg"`);
      return res.send(svg);
    }
    const png = await QRCode.toBuffer(target, { type: "png", width: size, margin: 2, errorCorrectionLevel: "H" });
    res.setHeader("Content-Type", "image/png");
    res.setHeader("Content-Disposition", `attachment; filename="${r.slug}-qr${tableName ? `-${tableName}` : ""}-${size}.png"`);
    res.send(png);
  };
  app.get("/api/restaurant/qr.svg", requireRestaurant, qrHandler("svg"));
  app.get("/api/restaurant/qr.png", requireRestaurant, qrHandler("png"));
}
