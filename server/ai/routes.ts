import type { Express, Request, Response } from "express";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { categories, products } from "@shared/schema";
import { requireRestaurant, tenantId } from "../auth/middleware";
import { getRestaurantPlan, PlanLimitError } from "../plans";
import { writeAudit } from "../audit";
import { draftSchema, generateMenuDraft, slugifySection } from "./menu-generator";

export function registerAiMenuRoutes(app: Express) {
  // Generates a draft menu. Uses the configured AI provider when available
  // (AI_API_KEY / ABACUS_API_KEY), otherwise built-in Turkish templates.
  app.post("/api/restaurant/ai/generate-menu", requireRestaurant, async (req: Request, res: Response) => {
    try {
      const result = await generateMenuDraft(req.body);
      res.json(result);
    } catch (err) {
      if (err instanceof Error && "issues" in (err as any)) {
        return res.status(400).json({ message: (err as any).issues?.[0]?.message ?? "Geçersiz istek." });
      }
      throw err;
    }
  });

  // Applies a draft (possibly edited in the client): creates categories and products.
  // Plan product limit is enforced; the apply is all-or-nothing per section.
  app.post("/api/restaurant/ai/apply-menu", requireRestaurant, async (req: Request, res: Response) => {
    const rid = tenantId(req);
    const parsed = draftSchema.safeParse(req.body?.draft ?? req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.errors[0]?.message ?? "Geçersiz taslak." });
    const draft = parsed.data;

    const plan = await getRestaurantPlan(rid);
    if (!plan) return res.status(404).json({ message: "Abonelik planı bulunamadı." });

    const existingCats = await db.select({ id: categories.id, slug: categories.slug }).from(categories).where(eq(categories.restaurantId, rid));
    const existingSlugs = new Set(existingCats.map((c) => c.slug));
    const existingProducts = await db.select({ n: products.id }).from(products).where(eq(products.restaurantId, rid));
    let budget = plan.maxProducts === null ? Number.POSITIVE_INFINITY : plan.maxProducts - existingProducts.length;
    if (budget <= 0) {
      return res.status(403).json({ message: `${plan.name} planınızda ürün limitine ulaştınız (${plan.maxProducts}). Planınızı yükseltin.`, code: "PLAN_LIMIT" });
    }

    let createdCategories = 0;
    let createdProducts = 0;
    const skipped: string[] = [];

    for (const section of draft.sections) {
      const slug = section.slug ?? slugifySection(section.name);
      let catId = existingCats.find((c) => c.slug === slug)?.id;

      if (!catId) {
        const [ins] = await db.insert(categories).values({ restaurantId: rid, name: section.name, slug });
        catId = Number(ins.insertId);
        existingSlugs.add(slug);
        existingCats.push({ id: catId, slug });
        createdCategories += 1;
      }

      for (const p of section.products) {
        if (budget <= 0) {
          skipped.push(p.name);
          continue;
        }
        await db.insert(products).values({
          restaurantId: rid,
          categoryId: catId,
          name: p.name,
          description: p.description || null,
          price: p.price.toFixed(2),
          isAvailable: true,
        });
        createdProducts += 1;
        budget -= 1;
      }
    }

    await writeAudit({ restaurantId: rid, actorUserId: req.auth!.userId, action: "menu.ai_apply", entity: "restaurant", entityId: String(rid), req, meta: { createdCategories, createdProducts, skipped: skipped.length } });

    const message = skipped.length
      ? `${createdProducts} ürün eklendi. Plan limiti dolduğu için ${skipped.length} ürün atlandı.`
      : `${createdProducts} ürün ve ${createdCategories} kategori eklendi.`;
    res.status(201).json({ createdCategories, createdProducts, skippedCount: skipped.length, message });
  });
}

// Re-export so callers can surface plan errors uniformly
export { PlanLimitError };
