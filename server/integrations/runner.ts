/**
 * Entegrasyon Merkezi çalıştırıcısı:
 * - emitIntegrationEvent: giden webhook teslimatı (HMAC imzalı, retry'lı, log'lu)
 * - sync job runner: sınırlı retry, durum makinesi, log
 * - logIntegration: işletmeye özel entegrasyon logları
 */
import { and, eq } from "drizzle-orm";
import { db } from "../db";
import { integrationLogs, integrationSyncJobs, webhookDeliveries, webhookEndpoints } from "@shared/schema";
import { signWebhook, decryptJson } from "./crypto";
import type { IntegrationEventType } from "./types";

const DELIVERY_TIMEOUT_MS = 8000;
const MAX_DELIVERY_ATTEMPTS = 5;

export async function logIntegration(
  restaurantId: number,
  providerKey: string | null,
  level: "info" | "warn" | "error",
  event: string,
  message: string,
  meta?: Record<string, unknown>,
): Promise<void> {
  try {
    await db.insert(integrationLogs).values({ restaurantId, providerKey, level, event, message, meta });
  } catch (err) {
    console.error("[integrations] log yazılamadı:", event, err);
  }
}

/** Sıradaki deneme sayısı için gecikme (sn): 30 * 2^n, üst sınır 15 dk */
export function retryDelaySeconds(attempts: number): number {
  return Math.min(30 * Math.pow(2, attempts), 900);
}

/**
 * Olay yayınla: olaya abone tüm aktif endpoint'lere imzalı POST atılır.
 * Secret hiçbir loga yazılmaz; payload içinde hassas alan bulunmaz.
 * Başarısız teslimatlar `failed` olarak loglanır ve retry endpoint'i ile tetiklenebilir.
 */
export async function emitIntegrationEvent(
  restaurantId: number,
  event: IntegrationEventType,
  payload: Record<string, unknown>,
): Promise<number> {
  const endpoints = await db
    .select()
    .from(webhookEndpoints)
    .where(and(eq(webhookEndpoints.restaurantId, restaurantId), eq(webhookEndpoints.isActive, true)));

  const subscribed = endpoints.filter((ep) => {
    const events = (ep.events as string[] | null) ?? [];
    return events.includes(event);
  });
  if (subscribed.length === 0) return 0;

  const body = JSON.stringify({ event, restaurantId, payload, sentAt: new Date().toISOString() });
  let delivered = 0;

  for (const ep of subscribed) {
    const [deliveryRes] = await db
      .insert(webhookDeliveries)
      .values({ endpointId: ep.id, restaurantId, event, payload: body, status: "pending" });
    const deliveryId = deliveryRes.insertId;

    const secret = decryptJson<{ secret: string }>(ep.secretEncrypted)?.secret ?? "";
    const timestamp = String(Date.now());
    const signature = signWebhook(secret, timestamp, body);

    try {
      const res = await fetch(ep.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-MTM-Event": event,
          "X-MTM-Timestamp": timestamp,
          "X-MTM-Signature": signature,
          "X-MTM-Delivery": String(deliveryId),
        },
        body,
        signal: AbortSignal.timeout(DELIVERY_TIMEOUT_MS),
      });
      const ok = res.ok;
      await db
        .update(webhookDeliveries)
        .set({
          status: ok ? "delivered" : "failed",
          responseCode: res.status,
          attempts: 1,
          deliveredAt: ok ? new Date() : null,
          error: ok ? null : `HTTP ${res.status}`,
        })
        .where(eq(webhookDeliveries.id, deliveryId));
      if (ok) delivered++;
      await logIntegration(restaurantId, null, ok ? "info" : "warn", `webhook.${event}`, ok ? `Teslim edildi: ${ep.url}` : `Teslimat başarısız (HTTP ${res.status}): ${ep.url}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "bilinmeyen hata";
      await db
        .update(webhookDeliveries)
        .set({ status: "failed", attempts: 1, error: msg })
        .where(eq(webhookDeliveries.id, deliveryId));
      await logIntegration(restaurantId, null, "error", `webhook.${event}`, `Teslimat hatası: ${ep.url} — ${msg}`);
    }
  }
  return delivered;
}

/** Sync job'ı çalıştır: retry sınırlı, sonuç/hata loglanır. fn sağlayıcıya özeldir. */
export async function runSyncJob(
  restaurantId: number,
  providerKey: string,
  jobType: string,
  fn: () => Promise<Record<string, unknown>>,
  payload?: Record<string, unknown>,
): Promise<{ id: number; status: string; error?: string }> {
  const [jobRes] = await db
    .insert(integrationSyncJobs)
    .values({ restaurantId, providerKey, jobType, status: "running", startedAt: new Date(), attempts: 1, payload });
  const jobId = jobRes.insertId;

  try {
    const result = await fn();
    await db
      .update(integrationSyncJobs)
      .set({ status: "succeeded", result, finishedAt: new Date() })
      .where(eq(integrationSyncJobs.id, jobId));
    await logIntegration(restaurantId, providerKey, "info", `sync.${jobType}`, "Senkronizasyon başarılı.", { jobId: jobId });
    return { id: jobId, status: "succeeded" };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "bilinmeyen hata";
    await db
      .update(integrationSyncJobs)
      .set({ status: "failed", error: msg, finishedAt: new Date() })
      .where(eq(integrationSyncJobs.id, jobId));
    await logIntegration(restaurantId, providerKey, "error", `sync.${jobType}`, `Senkronizasyon başarısız: ${msg}`, { jobId: jobId });
    return { id: jobId, status: "failed", error: msg };
  }
}
