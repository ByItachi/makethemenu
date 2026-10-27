// SMS API anahtarı üretimi ve doğrulaması. Anahtar yalnızca oluşturma anında düz metin olarak
// döndürülür; veritabanında SHA-256 hash'i ve ilk 8 karakterlik önizlemesi (keyPrefix) saklanır.
import { randomBytes, createHash } from "crypto";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "../db";
import { smsApiKeys } from "@shared/schema";

const KEY_PREFIX = "sms_live_";

export function hashApiKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

/** Yeni API anahtarı üretir, veritabanına hash'ini kaydeder ve düz metin anahtarı (bir kez) döndürür. */
export async function createApiKey(restaurantId: number, label: string) {
  const raw = KEY_PREFIX + randomBytes(24).toString("hex");
  const keyHash = hashApiKey(raw);
  const keyPrefix = raw.slice(0, 16);

  const [row] = await db
    .insert(smsApiKeys)
    .values({ restaurantId, label, keyPrefix, keyHash })
    .$returningId();

  return { id: row.id, key: raw, keyPrefix, label };
}

export async function listApiKeys(restaurantId: number) {
  return db
    .select({
      id: smsApiKeys.id,
      label: smsApiKeys.label,
      keyPrefix: smsApiKeys.keyPrefix,
      lastUsedAt: smsApiKeys.lastUsedAt,
      revokedAt: smsApiKeys.revokedAt,
      createdAt: smsApiKeys.createdAt,
    })
    .from(smsApiKeys)
    .where(eq(smsApiKeys.restaurantId, restaurantId));
}

export async function revokeApiKey(restaurantId: number, keyId: number) {
  const result = await db
    .update(smsApiKeys)
    .set({ revokedAt: new Date() })
    .where(and(eq(smsApiKeys.id, keyId), eq(smsApiKeys.restaurantId, restaurantId), isNull(smsApiKeys.revokedAt)));
  return result;
}

/** Ham API anahtarını doğrular; geçerliyse ilgili restaurantId'yi döndürür. */
export async function verifyApiKey(raw: string): Promise<{ restaurantId: number; keyId: number } | null> {
  if (!raw || !raw.startsWith(KEY_PREFIX)) return null;
  const keyHash = hashApiKey(raw);
  const [row] = await db
    .select({ id: smsApiKeys.id, restaurantId: smsApiKeys.restaurantId, revokedAt: smsApiKeys.revokedAt })
    .from(smsApiKeys)
    .where(eq(smsApiKeys.keyHash, keyHash))
    .limit(1);
  if (!row || row.revokedAt) return null;

  db.update(smsApiKeys).set({ lastUsedAt: new Date() }).where(eq(smsApiKeys.id, row.id)).catch(() => {});

  return { restaurantId: row.restaurantId, keyId: row.id };
}
