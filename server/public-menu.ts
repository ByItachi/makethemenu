import type { Express, Request, Response } from "express";
import { asc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "./db";
import { restaurants, restaurantSlugRedirects, categories, products } from "@shared/schema";
import { validateSlug } from "@shared/slug";
import { storage } from "./storage";

const publicOrderSchema = z.object({
  customerName: z.string().trim().min(2, "Ad en az 2 karakter olmalı.").max(120),
  phone: z.string().trim().min(7, "Geçerli bir telefon numarası girin.").max(32),
  note: z.string().trim().max(500).nullable().optional(),
  items: z
    .array(
      z.object({
        productId: z.number().int().positive(),
        quantity: z.number().int().min(1).max(50),
      }),
    )
    .min(1, "Sipariş en az bir ürün içermeli.")
    .max(50),
});

/**
 * Public, unauthenticated menu API. Only publishable fields are returned:
 * no owner ids, licences, internal status or other tenants' data.
 */
export function registerPublicRoutes(app: Express) {
  app.get("/api/public/menu/:slug", async (req: Request, res: Response) => {
    const slug = String(req.params.slug ?? "").toLowerCase();
    res.setHeader("Cache-Control", "public, max-age=60");
    if (validateSlug(slug) !== null) return res.status(404).json({ message: "Menü bulunamadı." });

    const [r] = await db.select().from(restaurants).where(eq(restaurants.slug, slug)).limit(1);

    if (!r || !r.isPublished) {
      // Old slug of a renamed business: point the client to the new address
      const [moved] = await db
        .select({ newSlug: restaurants.slug, published: restaurants.isPublished })
        .from(restaurantSlugRedirects)
        .innerJoin(restaurants, eq(restaurants.id, restaurantSlugRedirects.restaurantId))
        .where(eq(restaurantSlugRedirects.oldSlug, slug))
        .limit(1);
      if (moved?.published && moved.newSlug) {
        res.setHeader("Cache-Control", "public, max-age=300");
        return res.status(301).json({ redirectTo: `/p/${moved.newSlug}` });
      }
      return res.status(404).json({ message: "Menü bulunamadı." });
    }

    const cats = await db
      .select({ id: categories.id, name: categories.name, slug: categories.slug, imageUrl: categories.imageUrl })
      .from(categories)
      .where(eq(categories.restaurantId, r.id))
      .orderBy(asc(categories.id));

    const items = await db
      .select({
        id: products.id,
        categoryId: products.categoryId,
        name: products.name,
        description: products.description,
        price: products.price,
        imageUrl: products.imageUrl,
        model3dUrl: products.model3dUrl,
        isAvailable: products.isAvailable,
        translations: products.translations,
      })
      .from(products)
      .where(eq(products.restaurantId, r.id))
      .orderBy(asc(products.id));

    res.json({
      restaurant: {
        name: r.name,
        slug: r.slug,
        type: r.type,
        description: r.description,
        phone: r.phone,
        address: r.address,
        city: r.city,
        country: r.country,
        currency: r.currency,
        menuTheme: r.menuTheme,
        menuRadius: r.menuRadius,
        menuTemplate: r.menuTemplate,
        menuPreset: r.menuPreset ?? null,
        showProductImages: r.showProductImages,
        menuLanguage: r.menuLanguage,
        lat: r.lat,
        lng: r.lng,
      },
      categories: cats.map((c) => ({
        ...c,
        products: items.filter((p) => p.categoryId === c.id).map(({ categoryId: _c, ...p }) => p),
      })),
    });
  });

  // Public guest checkout. Prices, availability, tax and the total are recomputed
  // from the database; anything the client sends about money is ignored.
  app.post("/api/public/menu/:slug/orders", async (req: Request, res: Response) => {
    const slug = String(req.params.slug ?? "").toLowerCase();
    const [r] = await db.select().from(restaurants).where(eq(restaurants.slug, slug)).limit(1);
    if (!r || !r.isPublished) return res.status(404).json({ message: "Menü bulunamadı." });
    if (!r.ordersEnabled) {
      return res.status(403).json({ message: "Bu işletme şu anda online sipariş kabul etmiyor.", code: "ORDERS_DISABLED" });
    }

    const parsed = publicOrderSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.errors[0]?.message ?? "Geçersiz istek.", code: "VALIDATION" });
    }
    const { items, customerName, phone, note } = parsed.data;

    const menuProducts = await db
      .select({ id: products.id, name: products.name, price: products.price, isAvailable: products.isAvailable })
      .from(products)
      .where(eq(products.restaurantId, r.id));
    const byId = new Map(menuProducts.map((p) => [p.id, p]));

    const lines = [];
    for (const item of items) {
      const p = byId.get(item.productId);
      if (!p) return res.status(400).json({ message: "Ürün bulunamadı.", code: "PRODUCT_NOT_FOUND" });
      if (p.isAvailable === false) return res.status(400).json({ message: `${p.name} şu anda tükenmiş.`, code: "PRODUCT_UNAVAILABLE" });
      lines.push({ productId: p.id, quantity: item.quantity, price: p.price });
    }

    const subtotal = lines.reduce((sum, l) => sum + Number(l.price) * l.quantity, 0);
    const totalAmount = (subtotal * 1.1).toFixed(2); // 10% tax, matches the in-panel order flow

    const order = await storage.createOrder(
      r.id,
      { status: "pending", totalAmount, customerName, phone, note: note ?? null },
      lines,
    );

    res.status(201).json({
      id: order.id,
      status: order.status,
      totalAmount,
      createdAt: order.createdAt,
    });
  });
}
