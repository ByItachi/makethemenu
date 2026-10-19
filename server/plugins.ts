import type { Express, Request, Response } from "express";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "./db";
import { restaurantPlugins } from "@shared/schema";
import { requireRestaurant, tenantId } from "./auth/middleware";
import { getRestaurantPlan } from "./plans";
import { PLUGIN_CATALOG, findPlugin } from "@shared/plugins";
import { writeAudit } from "./audit";

const settingsSchema = z.object({
  settings: z.record(z.string(), z.unknown()),
});

const SETTINGS_MAX_BYTES = 4096;

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
    const plugins = PLUGIN_CATALOG.map((def) => {
      const row = byKey.get(def.key);
      return {
        ...def,
        isEnabled: row ? row.isEnabled : false,
        settings: row?.settings ?? null,
        planLocked: Boolean(def.requiresPlan) && !planAllowed(plan?.code),
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
}

function planAllowed(code: string | undefined | null): boolean {
  return code === "pro" || code === "business" || code === "enterprise";
}
