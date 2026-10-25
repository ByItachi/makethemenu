/**
 * Credential şifreleme: AES-256-GCM.
 * Anahtar: INTEGRATION_ENCRYPTION_KEY (64 hex karakter). Yoksa DATABASE_URL'den
 * türetilir — yalnızca geliştirme için; production'da env ile verilmelidir.
 * Şifreli değer asla API yanıtında döndürülmez; yalnızca maskelenmiş özeti gösterilir.
 */
import crypto from "crypto";

function getKey(): Buffer {
  const hex = process.env.INTEGRATION_ENCRYPTION_KEY;
  if (hex && /^[0-9a-fA-F]{64}$/.test(hex)) return Buffer.from(hex, "hex");
  const base = process.env.INTEGRATION_ENCRYPTION_SECRET || process.env.DATABASE_URL || "dev-only";
  if (!process.env.INTEGRATION_ENCRYPTION_KEY) {
    console.warn("[integrations] INTEGRATION_ENCRYPTION_KEY tanımlı değil; anahtar DATABASE_URL'den türetildi (yalnızca geliştirme için).");
  }
  return crypto.createHash("sha256").update(`mtm-integrations:${base}`).digest();
}

export function encryptJson(data: unknown): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", getKey(), iv);
  const plain = Buffer.from(JSON.stringify(data), "utf8");
  const enc = Buffer.concat([cipher.update(plain), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1.${iv.toString("base64")}.${tag.toString("base64")}.${enc.toString("base64")}`;
}

export function decryptJson<T>(payload: string | null | undefined): T | null {
  if (!payload) return null;
  const parts = payload.split(".");
  if (parts.length !== 4 || parts[0] !== "v1") return null;
  try {
    const iv = Buffer.from(parts[1], "base64");
    const tag = Buffer.from(parts[2], "base64");
    const enc = Buffer.from(parts[3], "base64");
    const decipher = crypto.createDecipheriv("aes-256-gcm", getKey(), iv);
    decipher.setAuthTag(tag);
    return JSON.parse(Buffer.concat([decipher.update(enc), decipher.final()]).toString("utf8")) as T;
  } catch {
    return null;
  }
}

const SENSITIVE_HINTS = ["key", "secret", "token", "password", "pass"];

/** Credential alanlarını maskeler: son 4 karakter korunur. */
export function maskCredentials(creds: Record<string, string> | null): Record<string, string> {
  if (!creds) return {};
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(creds)) {
    if (!v) { out[k] = ""; continue; }
    const sensitive = SENSITIVE_HINTS.some((h) => k.toLowerCase().includes(h));
    out[k] = sensitive ? (v.length <= 4 ? "••••" : `••••${v.slice(-4)}`) : v;
  }
  return out;
}

/** Webhook imzası: HMAC-SHA256, timestamp bağlama ile tekrar saldırısına karşı. */
export function signWebhook(secret: string, timestamp: string, body: string): string {
  return crypto.createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("hex");
}

export function randomSecret(): string {
  return crypto.randomBytes(24).toString("hex");
}
