import type { Request, Response } from "express";
import { and, count, eq, isNotNull } from "drizzle-orm";
import { db } from "./db";
import { plans, products, tables, restaurants } from "@shared/schema";

export type PlanRow = typeof plans.$inferSelect;

export async function getRestaurantPlan(restaurantId: number): Promise<PlanRow | null> {
  const [r] = await db.select({ planCode: restaurants.planCode }).from(restaurants).where(eq(restaurants.id, restaurantId));
  if (!r) return null;
  const [p] = await db.select().from(plans).where(eq(plans.code, r.planCode));
  return p ?? null;
}

export async function getUsage(restaurantId: number) {
  const [p] = await db.select({ n: count() }).from(products).where(eq(products.restaurantId, restaurantId));
  const [t] = await db.select({ n: count() }).from(tables).where(eq(tables.restaurantId, restaurantId));
  const [m] = await db.select({ n: count() }).from(products).where(and(eq(products.restaurantId, restaurantId), isNotNull(products.model3dUrl)));
  return { products: Number(p?.n ?? 0), tables: Number(t?.n ?? 0), model3d: Number(m?.n ?? 0) };
}

export class PlanLimitError extends Error {
  status = 403;
  constructor(message: string) {
    super(message);
  }
}

/**
 * Throws PlanLimitError when adding one more item of `kind` would exceed the plan.
 * Null limit = unlimited. Called on the server only; the client is never trusted for limits.
 */
export async function assertWithinPlanLimit(restaurantId: number, kind: "products" | "tables"): Promise<void> {
  const plan = await getRestaurantPlan(restaurantId);
  if (!plan) throw new PlanLimitError("Abonelik planı bulunamadı.");
  const limit = kind === "products" ? plan.maxProducts : plan.maxTables;
  if (limit === null) return;
  const usage = await getUsage(restaurantId);
  if (usage[kind] >= limit) {
    const label = kind === "products" ? "ürün" : "masa";
    throw new PlanLimitError(`${plan.name} planında en fazla ${limit} ${label} ekleyebilirsiniz. Planınızı yükseltin.`);
  }
}

/** Express middleware-free helper used by routes: returns true when the request was answered with 403. */
export async function enforcePlanLimit(req: Request, res: Response, restaurantId: number, kind: "products" | "tables"): Promise<boolean> {
  try {
    await assertWithinPlanLimit(restaurantId, kind);
    return false;
  } catch (err) {
    if (err instanceof PlanLimitError) {
      res.status(403).json({ message: err.message, code: "PLAN_LIMIT" });
      return true;
    }
    throw err;
  }
}

// ─── 3D model quota (products with an attached .glb/.gltf) ────────────────────
export function isValid3dUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return (u.protocol === "https:" || u.protocol === "http:") && /\.(glb|gltf)(\?|#|$)/i.test(u.pathname + u.search);
  } catch {
    return false;
  }
}

export class Model3dLimitError extends Error {
  status = 403;
  code = "MODEL_3D_LIMIT";
  constructor(message: string) {
    super(message);
  }
}

/** Throws when attaching one more 3D model would exceed the plan quota (null = unlimited). */
export async function assertWithin3dLimit(restaurantId: number, nextUrl: string | null): Promise<void> {
  if (nextUrl === null) return;
  const plan = await getRestaurantPlan(restaurantId);
  if (!plan) throw new PlanLimitError("Abonelik planı bulunamadı.");
  if (plan.max3dModels === null) return;
  const [row] = await db
    .select({ n: count() })
    .from(products)
    .where(and(eq(products.restaurantId, restaurantId), isNotNull(products.model3dUrl)));
  if (Number(row?.n ?? 0) >= plan.max3dModels) {
    throw new Model3dLimitError(`${plan.name} planında en fazla ${plan.max3dModels} ürün 3D model içerebilir. Planınızı yükseltin.`);
  }
}

