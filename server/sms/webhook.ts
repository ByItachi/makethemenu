import { createHmac } from "crypto";
import { db } from "../db";
import { smsInbound, smsWebhookLog } from "@shared/schema";

/**
 * İletiMerkezi webhook imza doğrulama (HMAC-SHA256).
 * Webhook payload'ı: { from, to, text, timestamp, signature }
 * signature = HMAC-SHA256(key=ILETIMERKEZI_WEBHOOK_SECRET, msg=`${from}${to}${text}${timestamp}`)
 */
export async function verifyIletimerkeziWebhook(
  payload: Record<string, any>,
  secret: string
): Promise<{ valid: boolean; error?: string }> {
  const { from, to, text, timestamp, signature } = payload;
  if (!from || !to || !text || !timestamp || !signature) {
    return { valid: false, error: "Eksik payload alanları" };
  }

  const msg = `${from}${to}${text}${timestamp}`;
  const expected = createHmac("sha256", secret).update(msg).digest("hex");
  const valid = expected === signature;

  return { valid, error: valid ? undefined : "İmza uyuşmuyor" };
}

/**
 * NetGSM webhook imza doğrulama (HMAC-SHA256).
 * Webhook payload'ı: { from, to, text, timestamp, signature }
 */
export async function verifyNetgsmWebhook(
  payload: Record<string, any>,
  secret: string
): Promise<{ valid: boolean; error?: string }> {
  // NetGSM imza formatı: HMAC-SHA256(key=secret, msg=`${from}${to}${text}${timestamp}`)
  const { from, to, text, timestamp, signature } = payload;
  if (!from || !to || !text || !timestamp || !signature) {
    return { valid: false, error: "Eksik payload alanları" };
  }

  const msg = `${from}${to}${text}${timestamp}`;
  const expected = createHmac("sha256", secret).update(msg).digest("hex");
  const valid = expected === signature;

  return { valid, error: valid ? undefined : "İmza uyuşmuyor" };
}

/**
 * Webhook'tan gelen SMS'i işle ve veritabanına kaydet.
 */
export async function processSmsWebhook(
  provider: string,
  payload: Record<string, any>,
  restaurantId: number | null = null
): Promise<{ success: boolean; error?: string }> {
  const payloadHash = createHmac("sha256", "webhook-log").update(JSON.stringify(payload)).digest("hex");

  try {
    // Gelen SMS'i kaydet
    await db.insert(smsInbound).values({
      restaurantId,
      fromPhone: payload.from,
      body: payload.text,
      externalId: payload.messageId || payload.id,
    });

    // Webhook logu
    await db.insert(smsWebhookLog).values({
      provider,
      signatureValid: true,
      payloadHash,
      errorMessage: null,
    });

    return { success: true };
  } catch (err: any) {
    const errorMsg = String(err?.message ?? "Bilinmeyen hata");
    await db.insert(smsWebhookLog).values({
      provider,
      signatureValid: false,
      payloadHash,
      errorMessage: errorMsg.slice(0, 255),
    });
    return { success: false, error: errorMsg };
  }
}
