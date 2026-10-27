// OTP (tek kullanımlık doğrulama kodu) modülü. Kodlar açık metin saklanmaz — yalnızca SHA-256
// hash'i tutulur. Telefon+amaç bazında yeniden gönderim bekleme süresi ve yanlış deneme sınırı uygulanır.
import { createHash, randomInt } from "crypto";
import { and, eq, gt, isNull, lt } from "drizzle-orm";
import { db } from "../db";
import { smsOtp } from "@shared/schema";
import { enqueueSms } from "./outbox";

export const OTP_TTL_SECONDS = 300; // 5 dakika
export const OTP_RESEND_COOLDOWN_SECONDS = 60; // yeniden gönderim bekleme süresi
export const OTP_MAX_ATTEMPTS = 5;
export const OTP_CODE_LENGTH = 6;

function hashCode(code: string, phone: string): string {
  // Telefon numarasını tuz olarak kullanmak, aynı kodun farklı numaralar için aynı hash'i üretmesini engeller.
  return createHash("sha256").update(`${phone}:${code}`).digest("hex");
}

function generateCode(): string {
  const min = 10 ** (OTP_CODE_LENGTH - 1);
  const max = 10 ** OTP_CODE_LENGTH - 1;
  return String(randomInt(min, max + 1));
}

export type OtpRequestResult =
  | { ok: true; expiresInSeconds: number; resendAvailableInSeconds: number }
  | { ok: false; reason: "cooldown"; resendAvailableInSeconds: number };

/**
 * Yeni bir OTP üretir, kuyruğa SMS olarak ekler ve hash'ini kaydeder. Aynı telefon+amaç için
 * son gönderim üzerinden OTP_RESEND_COOLDOWN_SECONDS geçmediyse yeni kod üretmez (spam/kontör israfını önler).
 */
export async function requestOtp(
  restaurantId: number,
  phone: string,
  purpose: string,
  template: (code: string) => string
): Promise<OtpRequestResult> {
  const [existing] = await db
    .select({ id: smsOtp.id, lastSentAt: smsOtp.lastSentAt, sendCount: smsOtp.sendCount })
    .from(smsOtp)
    .where(and(eq(smsOtp.restaurantId, restaurantId), eq(smsOtp.phone, phone), eq(smsOtp.purpose, purpose), isNull(smsOtp.consumedAt)))
    .orderBy(smsOtp.id)
    .limit(1);

  if (existing?.lastSentAt) {
    const elapsedSec = (Date.now() - existing.lastSentAt.getTime()) / 1000;
    if (elapsedSec < OTP_RESEND_COOLDOWN_SECONDS) {
      return { ok: false, reason: "cooldown", resendAvailableInSeconds: Math.ceil(OTP_RESEND_COOLDOWN_SECONDS - elapsedSec) };
    }
  }

  const code = generateCode();
  const codeHash = hashCode(code, phone);
  const expiresAt = new Date(Date.now() + OTP_TTL_SECONDS * 1000);

  // Önceki bekleyen kodu (varsa) geçersiz kıl, yenisini oluştur.
  if (existing) {
    await db.delete(smsOtp).where(eq(smsOtp.id, existing.id));
  }
  const [inserted] = await db.insert(smsOtp).values({ restaurantId, phone, purpose, codeHash, expiresAt, sendCount: (existing?.sendCount ?? 0) + 1 });
  const otpId = (inserted as any).insertId as number;
  const outboxId = await enqueueSms(restaurantId, phone, template(code));
  await db.update(smsOtp).set({ outboxId }).where(eq(smsOtp.id, otpId));

  return { ok: true, expiresInSeconds: OTP_TTL_SECONDS, resendAvailableInSeconds: OTP_RESEND_COOLDOWN_SECONDS };
}

export type OtpVerifyResult =
  | { ok: true }
  | { ok: false; reason: "not_found" | "expired" | "too_many_attempts" | "invalid_code" };

/** OTP kodunu doğrular. Doğruysa kaydı tüketilmiş olarak işaretler (tek kullanımlık). */
export async function verifyOtp(restaurantId: number, phone: string, purpose: string, code: string): Promise<OtpVerifyResult> {
  const [row] = await db
    .select()
    .from(smsOtp)
    .where(and(eq(smsOtp.restaurantId, restaurantId), eq(smsOtp.phone, phone), eq(smsOtp.purpose, purpose), isNull(smsOtp.consumedAt), gt(smsOtp.expiresAt, new Date())))
    .orderBy(smsOtp.id)
    .limit(1);

  if (!row) {
    // Süresi dolmuş veya hiç gönderilmemiş olabilir; ikisini ayırt etmek için süresi dolmuşu da kontrol et.
    const [expired] = await db
      .select({ id: smsOtp.id })
      .from(smsOtp)
      .where(and(eq(smsOtp.restaurantId, restaurantId), eq(smsOtp.phone, phone), eq(smsOtp.purpose, purpose), isNull(smsOtp.consumedAt)))
      .limit(1);
    return { ok: false, reason: expired ? "expired" : "not_found" };
  }

  if (row.attempts >= row.maxAttempts) {
    return { ok: false, reason: "too_many_attempts" };
  }

  if (row.codeHash !== hashCode(code, phone)) {
    await db.update(smsOtp).set({ attempts: row.attempts + 1 }).where(eq(smsOtp.id, row.id));
    return { ok: false, reason: "invalid_code" };
  }

  await db.update(smsOtp).set({ consumedAt: new Date() }).where(eq(smsOtp.id, row.id));
  return { ok: true };
}

/** Süresi dolmuş/tüketilmiş OTP kayıtlarını temizler. Worker tarafından periyodik çağrılır. */
export async function cleanupExpiredOtp(): Promise<number> {
  const result = await db.delete(smsOtp).where(lt(smsOtp.expiresAt, new Date()));
  return (result as any)[0]?.affectedRows ?? 0;
}
