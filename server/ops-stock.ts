// Stok ve Maliyet: hammadde/ürün stoğu, hareket (giriş/çıkış/düzeltme) kaydı ve
// reçete bazlı maliyet hesaplama. Üçüncü taraf gerektirmeyen, platformun kendi (native) modülüdür.
import type { Express } from "express";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "./db";
import { stockItems, stockMovements, productRecipes, products } from "../shared/schema";
import { requireRestaurant, tenantId } from "./auth/middleware";
import { writeAudit } from "./audit";

const stockItemSchema = z.object({
  name: z.string().min(1, "Ad gerekli").max(128),
  unit: z.enum(["adet", "kg", "lt", "gr", "ml"]).default("adet"),
  minQuantity: z.number().min(0).default(0),
  unitCost: z.number().min(0).default(0),
});

const movementSchema = z.object({
  stockItemId: z.number().int().positive(),
  type: z.enum(["in", "out", "adjust"]),
  quantity: z.number(),
  unitCost: z.number().min(0).optional(),
  reason: z.string().max(255).optional(),
});

const recipeSchema = z.object({
  productId: z.number().int().positive(),
  stockItemId: z.number().int().positive(),
  quantityPerUnit: z.number().positive(),
});

export function registerStockRoutes(app: Express) {
  app.get("/api/ops/stock/items", requireRestaurant, async (req, res) => {
    const rid = tenantId(req);
    const rows = await db.select().from(stockItems).where(eq(stockItems.restaurantId, rid)).orderBy(stockItems.name);
    res.json({ items: rows });
  });

  app.post("/api/ops/stock/items", requireRestaurant, async (req, res) => {
    const rid = tenantId(req);
    const parsed = stockItemSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.issues[0]?.message ?? "Geçersiz istek" });
    const input = parsed.data;
    const [result] = await db.insert(stockItems).values({
      restaurantId: rid,
      name: input.name,
      unit: input.unit,
      minQuantity: input.minQuantity.toFixed(3),
      unitCost: input.unitCost.toFixed(4),
    }).$returningId();
    await writeAudit({ action: "stock.item.created", entity: "stock_items", entityId: String(result.id), restaurantId: rid, actorUserId: null, meta: {} });
    const [row] = await db.select().from(stockItems).where(eq(stockItems.id, result.id)).limit(1);
    res.status(201).json({ item: row });
  });

  app.delete("/api/ops/stock/items/:id", requireRestaurant, async (req, res) => {
    const rid = tenantId(req);
    const result = await db.update(stockItems).set({ isActive: false }).where(and(eq(stockItems.id, Number(req.params.id)), eq(stockItems.restaurantId, rid)));
    if (!result[0].affectedRows) return res.status(404).json({ message: "Stok kalemi bulunamadı" });
    res.json({ ok: true });
  });

  app.get("/api/ops/stock/movements", requireRestaurant, async (req, res) => {
    const rid = tenantId(req);
    const rows = await db.select().from(stockMovements).where(eq(stockMovements.restaurantId, rid)).orderBy(desc(stockMovements.createdAt)).limit(200);
    res.json({ movements: rows });
  });

  app.post("/api/ops/stock/movements", requireRestaurant, async (req, res) => {
    const rid = tenantId(req);
    const parsed = movementSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.issues[0]?.message ?? "Geçersiz istek" });
    const input = parsed.data;
    const [item] = await db.select().from(stockItems).where(and(eq(stockItems.id, input.stockItemId), eq(stockItems.restaurantId, rid))).limit(1);
    if (!item) return res.status(404).json({ message: "Stok kalemi bulunamadı" });

    const delta = input.type === "out" ? -Math.abs(input.quantity) : input.type === "in" ? Math.abs(input.quantity) : input.quantity;
    const newQty = Number(item.quantity) + delta;
    if (newQty < 0) return res.status(400).json({ message: "Stok miktarı negatif olamaz" });

    await db.insert(stockMovements).values({
      restaurantId: rid,
      stockItemId: input.stockItemId,
      type: input.type,
      quantity: input.quantity.toFixed(3),
      unitCost: input.unitCost?.toFixed(4),
      reason: input.reason,
    });
    await db.update(stockItems).set({
      quantity: newQty.toFixed(3),
      ...(input.unitCost !== undefined ? { unitCost: input.unitCost.toFixed(4) } : {}),
    }).where(eq(stockItems.id, input.stockItemId));

    await writeAudit({ action: "stock.movement.created", entity: "stock_movements", entityId: String(input.stockItemId), restaurantId: rid, actorUserId: null, meta: { type: input.type, quantity: input.quantity } });
    const [updated] = await db.select().from(stockItems).where(eq(stockItems.id, input.stockItemId)).limit(1);
    res.status(201).json({ item: updated });
  });

  app.get("/api/ops/stock/recipes/:productId", requireRestaurant, async (req, res) => {
    const rid = tenantId(req);
    const rows = await db.select({
      id: productRecipes.id,
      stockItemId: productRecipes.stockItemId,
      quantityPerUnit: productRecipes.quantityPerUnit,
      stockItemName: stockItems.name,
      unit: stockItems.unit,
      unitCost: stockItems.unitCost,
    }).from(productRecipes)
      .innerJoin(stockItems, eq(productRecipes.stockItemId, stockItems.id))
      .where(and(eq(productRecipes.productId, Number(req.params.productId)), eq(productRecipes.restaurantId, rid)));
    const totalCost = rows.reduce((sum, r) => sum + Number(r.quantityPerUnit) * Number(r.unitCost), 0);
    res.json({ recipe: rows, totalCost: Number(totalCost.toFixed(2)) });
  });

  app.post("/api/ops/stock/recipes", requireRestaurant, async (req, res) => {
    const rid = tenantId(req);
    const parsed = recipeSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.issues[0]?.message ?? "Geçersiz istek" });
    const input = parsed.data;
    const [product] = await db.select().from(products).where(eq(products.id, input.productId)).limit(1);
    if (!product) return res.status(404).json({ message: "Ürün bulunamadı" });
    const [stockItem] = await db.select().from(stockItems).where(and(eq(stockItems.id, input.stockItemId), eq(stockItems.restaurantId, rid))).limit(1);
    if (!stockItem) return res.status(404).json({ message: "Stok kalemi bulunamadı" });
    await db.insert(productRecipes).values({
      restaurantId: rid,
      productId: input.productId,
      stockItemId: input.stockItemId,
      quantityPerUnit: input.quantityPerUnit.toFixed(4),
    }).onDuplicateKeyUpdate({ set: { quantityPerUnit: input.quantityPerUnit.toFixed(4) } });
    res.status(201).json({ ok: true });
  });

  app.delete("/api/ops/stock/recipes/:id", requireRestaurant, async (req, res) => {
    const rid = tenantId(req);
    const result = await db.delete(productRecipes).where(and(eq(productRecipes.id, Number(req.params.id)), eq(productRecipes.restaurantId, rid)));
    if (!result[0].affectedRows) return res.status(404).json({ message: "Reçete satırı bulunamadı" });
    res.json({ ok: true });
  });
}
