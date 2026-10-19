import { and, eq, ne } from "drizzle-orm";
import { restaurants, restaurantSlugRedirects } from "@shared/schema";
import { slugify, validateSlug } from "@shared/slug";
import { db } from "../db";

type Tx = Pick<typeof db, "select">;

/** True when the slug is used by a business or still reserved as an old URL of any business. */
export async function isSlugTaken(slug: string, exceptRestaurantId?: number, tx: Tx = db): Promise<boolean> {
  const current = await tx
    .select({ id: restaurants.id })
    .from(restaurants)
    .where(exceptRestaurantId ? and(eq(restaurants.slug, slug), ne(restaurants.id, exceptRestaurantId)) : eq(restaurants.slug, slug))
    .limit(1);
  if (current.length) return true;
  const redirects = await tx
    .select({ restaurantId: restaurantSlugRedirects.restaurantId })
    .from(restaurantSlugRedirects)
    .where(eq(restaurantSlugRedirects.oldSlug, slug))
    .limit(1);
  if (!redirects.length) return false;
  // An old URL that still belongs to the same business is not a conflict.
  return exceptRestaurantId === undefined || redirects[0].restaurantId !== exceptRestaurantId;
}

/** Derives a free, valid slug from a business name. */
export async function generateSlug(name: string, tx: Tx = db): Promise<string> {
  let base = slugify(name);
  if (validateSlug(base) !== null) base = "isletme";
  let candidate = base;
  for (let i = 2; await isSlugTaken(candidate, undefined, tx) || validateSlug(candidate) !== null; i++) {
    candidate = `${base.slice(0, 55)}-${i}`;
  }
  return candidate;
}
