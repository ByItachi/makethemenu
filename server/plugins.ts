import type { Express, Request, Response } from "express";
import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { db } from "./db";
import { integrationPurchases, restaurantPlugins } from "@shared/schema";
import { requireRestaurant, tenantId } from "./auth/middleware";
import { getRestaurantPlan } from "./plans";
import { PLUGIN_CATALOG, findPlugin, pluginPrice, toPluginKey } from "@shared/plugins";
import { writeAudit } from "./audit";

const settingsSchema = z.object({
  settings: z.record(z.string(), z.unknown()),
});

const SETTINGS_MAX_BYTES = 4096;

const purchaseSchema = z.object({
  items: z.array(z.object({
    storeId: z.string().min(1).max(64),
  })).min(1).max(20),
  billingCycle: z.enum(["monthly", "annual"]).default("monthly"),
  billing: z.object({
    companyName: z.string().min(2).max(160),
    taxNo: z.string().min(10).max(11).regex(/^\d+$/, "Vergi numarası yalnızca rakam olmalı"),
    taxOffice: z.string().max(120).default(""),
    address: z.string().min(5).max(400),
    email: z.string().email().max(160),
  }),
  // Kart verisi ASLA saklanmaz/iletilemez: yalnızca marka + son 4 hane (ödeme sağlayıcı referansı)
  card: z.object({
    brand: z.string().max(16).default(""),
    last4: z.string().regex(/^\d{4}$/),
  }).optional(),
});

function generateOrderNo(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const rnd = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `ENT-${y}${m}${d}-${rnd}`;
}

/**
 * Eklenti Merkezi: restoran, katalogdan modül açar/kapatır.
 * Anahtarlar shared/plugins.ts kataloğundan doğrulanır; bilinmeyen anahtar 404 döner.
 */
export function registerPluginRoutes(app: Express) {
  // Katalog + bu restoranın aç/kapat durumu
  app.get("/api/plugins", requireRestaurant, async (req: Request, res: Response) => {
    const rid = tenantId(req);
    const rows = await db
      .select()
      .from(restaurantPlugins)
      .where(eq(restaurantPlugins.restaurantId, rid));

    const byKey = new Map(rows.map((r) => [r.pluginKey, r]));
    const plan = await getRestaurantPlan(rid);
    const ownedKeys = new Set(
      (
        await db
          .select({ pluginKey: integrationPurchases.pluginKey })
          .from(integrationPurchases)
          .where(and(eq(integrationPurchases.restaurantId, rid), eq(integrationPurchases.status, "succeeded")))
      ).map((r) => r.pluginKey),
    );
    const plugins = PLUGIN_CATALOG.map((def) => {
      const row = byKey.get(def.key);
      return {
        ...def,
        isEnabled: row ? row.isEnabled : false,
        settings: row?.settings ?? null,
        planLocked: Boolean(def.requiresPlan) && !planAllowed(plan?.code),
        price: pluginPrice(def.key),
        owned: ownedKeys.has(def.key) || Boolean(row && row.settings && typeof row.settings === "object" && "purchase" in (row.settings as object)),
      };
    });
    res.json({ planCode: plan?.code ?? "free", plugins });
  });

  // Eklentiyi aç/kapat
  app.post("/api/plugins/:key/toggle", requireRestaurant, async (req: Request, res: Response) => {
    const def = findPlugin(String(req.params.key));
    if (!def) return res.status(404).json({ message: "Eklenti bulunamadı." });

    const enabled = Boolean(req.body?.enabled);
    if (def.requiresPlan && enabled) {
      const plan = await getRestaurantPlan(tenantId(req));
      if (!planAllowed(plan?.code)) {
        return res.status(403).json({ message: "Bu eklenti mevcut planda bulunmuyor. Planınızı yükseltin." });
      }
    }
    // Ücretli entegrasyonlar satın alınmadan açılamaz (ücretsizler serbest).
    if (enabled && pluginPrice(def.key) > 0) {
      const [owned] = await db
        .select({ id: integrationPurchases.id })
        .from(integrationPurchases)
        .where(and(eq(integrationPurchases.restaurantId, tenantId(req)), eq(integrationPurchases.pluginKey, def.key), eq(integrationPurchases.status, "succeeded")))
        .limit(1);
      const rid0 = tenantId(req);
      const [row0] = await db
        .select({ settings: restaurantPlugins.settings })
        .from(restaurantPlugins)
        .where(and(eq(restaurantPlugins.restaurantId, rid0), eq(restaurantPlugins.pluginKey, def.key)))
        .limit(1);
      const legacyOwned = Boolean(row0?.settings && typeof row0.settings === "object" && "purchase" in (row0.settings as object));
      if (!owned && !legacyOwned) {
        return res.status(403).json({ message: "Bu entegrasyon ücretlidir. Uygulama Mağazası'ndan satın alın." });
      }
    }

    const rid = tenantId(req);
    await db
      .insert(restaurantPlugins)
      .values({ restaurantId: rid, pluginKey: def.key, isEnabled: enabled, updatedAt: new Date() })
      .onDuplicateKeyUpdate({ set: { isEnabled: enabled, updatedAt: new Date() } });

    await writeAudit({
      restaurantId: rid,
      actorUserId: req.auth!.userId,
      action: enabled ? "plugin.enabled" : "plugin.disabled",
      entity: "restaurant_plugin",
      entityId: def.key,
      req,
    });

    res.json({ key: def.key, isEnabled: enabled });
  });

  // Eklenti ayarları (anahtar/değer, en fazla 4 KB)
  app.put("/api/plugins/:key/settings", requireRestaurant, async (req: Request, res: Response) => {
    const def = findPlugin(String(req.params.key));
    if (!def) return res.status(404).json({ message: "Eklenti bulunamadı." });

    const parsed = settingsSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Geçersiz ayar verisi." });
    const body = JSON.stringify(parsed.data.settings);
    if (body.length > SETTINGS_MAX_BYTES) {
      return res.status(400).json({ message: "Ayarlar çok büyük (en fazla 4 KB)." });
    }

    const rid = tenantId(req);
    const [existing] = await db
      .select({ id: restaurantPlugins.id })
      .from(restaurantPlugins)
      .where(and(eq(restaurantPlugins.restaurantId, rid), eq(restaurantPlugins.pluginKey, def.key)))
      .limit(1);

    if (!existing) {
      await db.insert(restaurantPlugins).values({
        restaurantId: rid,
        pluginKey: def.key,
        isEnabled: false,
        settings: parsed.data.settings,
        updatedAt: new Date(),
      });
    } else {
      await db
        .update(restaurantPlugins)
        .set({ settings: parsed.data.settings, updatedAt: new Date() })
        .where(eq(restaurantPlugins.id, existing.id));
    }

    res.json({ key: def.key, settings: parsed.data.settings });
  });

  // Uygulama Mağazası: sepetten satın alma. Ödeme mock akışında da gerçek kayıt oluşur:
  // integration_purchases satırı yazılır, eklentiler anında etkinleştirilir.
  // Not: /api/integrations/* platform-admin korumalı olduğundan burada /api/plugins altındayız.
  app.post("/api/plugins/purchase", requireRestaurant, async (req: Request, res: Response) => {
    const parsed = purchaseSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Satın alma verisi geçersiz.", errors: parsed.error.flatten().fieldErrors });
    }
    const { items, billingCycle, billing, card } = parsed.data;
    const rid = tenantId(req);

    // Mağaza kimliklerini katalog anahtarlarına çevir ve doğrula
    const pluginKeys: string[] = [];
    for (const it of items) {
      const key = toPluginKey(it.storeId);
      const def = findPlugin(key);
      if (!def) return res.status(404).json({ message: `Entegrasyon bulunamadı: ${it.storeId}` });
      if (!pluginKeys.includes(key)) pluginKeys.push(key);
    }

    // Ücretli kalemlerin toplamı (yıllıkta %20 indirim)
    const monthly = pluginKeys.reduce((sum, k) => sum + pluginPrice(k), 0);
    const total = billingCycle === "annual" ? Math.round(monthly * 12 * 0.8) : monthly;

    // Ücretli siparişte kart zorunlu (mock sağlayıcı: kart verisi alınmaz, yalnızca marka+last4)
    if (total > 0 && !card) {
      return res.status(400).json({ message: "Ödeme bilgileri eksik." });
    }

    const orderNo = generateOrderNo();
    const invoiceNo = `FTR-${orderNo.replace("ENT-", "")}`;

    for (const key of pluginKeys) {
      await db.insert(integrationPurchases).values({
        restaurantId: rid,
        orderNo: pluginKeys.length > 1 ? `${orderNo}-${pluginKeys.indexOf(key) + 1}` : orderNo,
        pluginKey: key,
        amount: String(billingCycle === "annual" ? Math.round(pluginPrice(key) * 12 * 0.8) : pluginPrice(key)),
        billingCycle,
        billingInfo: billing,
        cardBrand: card?.brand ?? null,
        cardLast4: card?.last4 ?? null,
        status: "succeeded",
        invoiceNo: pluginKeys.length > 1 ? `${invoiceNo}-${pluginKeys.indexOf(key) + 1}` : invoiceNo,
      });
      // Satın alınan entegrasyon anında etkinleşir (mevcut ayarlar korunur)
      await db
        .insert(restaurantPlugins)
        .values({
          restaurantId: rid,
          pluginKey: key,
          isEnabled: true,
          settings: { purchase: { orderNo, invoiceNo, billingCycle, purchasedAt: new Date().toISOString() } },
          updatedAt: new Date(),
        })
        .onDuplicateKeyUpdate({ set: { isEnabled: true, updatedAt: new Date() } });
    }

    await writeAudit({
      restaurantId: rid,
      actorUserId: req.auth!.userId,
      action: "integration.purchased",
      entity: "integration_purchase",
      entityId: orderNo,
      req,
    });

    res.json({
      orderNo,
      invoiceNo,
      total,
      billingCycle,
      items: pluginKeys.map((k) => ({ key: k, name: findPlugin(k)?.name ?? k, price: pluginPrice(k) })),
    });
  });
}

function planAllowed(code: string | undefined | null): boolean {
  return code === "pro" || code === "business" || code === "enterprise";
}
