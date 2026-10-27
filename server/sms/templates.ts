// Sipariş/fatura bildirim şablonları: olay bazlı, değişkenli, işletme başına özelleştirilebilir SMS metinleri.
// Bir işletme şablonu düzenlemediyse DEFAULT_TEMPLATES içindeki varsayılan metin kullanılır.
import { and, eq } from "drizzle-orm";
import { db } from "../db";
import { smsNotificationTemplates } from "@shared/schema";
import { enqueueSms } from "./outbox";

export const EVENT_KEYS = [
  "order_created",
  "order_status_changed",
  "order_delivered",
  "payment_received",
] as const;
export type EventKey = typeof EVENT_KEYS[number];

export const EVENT_LABELS: Record<EventKey, string> = {
  order_created: "Sipariş Oluşturuldu",
  order_status_changed: "Sipariş Durumu Değişti",
  order_delivered: "Sipariş Teslim Edildi",
  payment_received: "Ödeme Alındı",
};

export const DEFAULT_TEMPLATES: Record<EventKey, string> = {
  order_created: "Sayın {{customer_name}}, {{order_number}} numaralı siparişiniz alındı. Teşekkür ederiz.",
  order_status_changed: "Sayın {{customer_name}}, {{order_number}} numaralı siparişinizin durumu: {{status}}.",
  order_delivered: "Sayın {{customer_name}}, {{order_number}} numaralı siparişiniz teslim edildi. İyi günler dileriz.",
  payment_received: "Sayın {{customer_name}}, {{amount}} TL tutarındaki ödemeniz alınmıştır. Teşekkür ederiz.",
};

/** Yalnızca tanımlı {{değişken}} alanlarını değiştirir; bilinmeyen alanları olduğu gibi bırakır. */
export function renderTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{\s*([a-z_]+)\s*\}\}/gi, (match, key: string) => {
    const v = vars[key];
    return v != null ? v : match;
  });
}

export async function getTemplates(restaurantId: number): Promise<Array<{ eventKey: EventKey; bodyTemplate: string; enabled: boolean; isDefault: boolean }>> {
  const rows = await db.select().from(smsNotificationTemplates).where(eq(smsNotificationTemplates.restaurantId, restaurantId));
  const byKey = new Map(rows.map((r) => [r.eventKey, r]));
  return EVENT_KEYS.map((key) => {
    const row = byKey.get(key);
    return row
      ? { eventKey: key, bodyTemplate: row.bodyTemplate, enabled: row.enabled, isDefault: false }
      : { eventKey: key, bodyTemplate: DEFAULT_TEMPLATES[key], enabled: true, isDefault: true };
  });
}

export async function upsertTemplate(restaurantId: number, eventKey: EventKey, bodyTemplate: string, enabled: boolean): Promise<void> {
  const [existing] = await db
    .select({ id: smsNotificationTemplates.id })
    .from(smsNotificationTemplates)
    .where(and(eq(smsNotificationTemplates.restaurantId, restaurantId), eq(smsNotificationTemplates.eventKey, eventKey)));
  if (existing) {
    await db
      .update(smsNotificationTemplates)
      .set({ bodyTemplate, enabled, updatedAt: new Date() })
      .where(eq(smsNotificationTemplates.id, existing.id));
  } else {
    await db.insert(smsNotificationTemplates).values({ restaurantId, eventKey, bodyTemplate, enabled });
  }
}

export async function resetTemplate(restaurantId: number, eventKey: EventKey): Promise<void> {
  await db
    .delete(smsNotificationTemplates)
    .where(and(eq(smsNotificationTemplates.restaurantId, restaurantId), eq(smsNotificationTemplates.eventKey, eventKey)));
}

/**
 * Bir olay gerçekleştiğinde ilgili şablonu bulur, değişkenleri doldurur ve kuyruğa ekler.
 * Telefon numarası yoksa veya şablon işletme tarafından kapatılmışsa sessizce atlanır (hata değildir).
 */
export async function sendEventNotification(
  restaurantId: number,
  eventKey: EventKey,
  phone: string | null | undefined,
  vars: Record<string, string>
): Promise<{ sent: boolean; reason?: string }> {
  if (!phone) return { sent: false, reason: "telefon yok" };
  const [row] = await db
    .select()
    .from(smsNotificationTemplates)
    .where(and(eq(smsNotificationTemplates.restaurantId, restaurantId), eq(smsNotificationTemplates.eventKey, eventKey)));
  if (row && !row.enabled) return { sent: false, reason: "şablon kapalı" };
  const template = row?.bodyTemplate ?? DEFAULT_TEMPLATES[eventKey];
  const body = renderTemplate(template, vars);
  await enqueueSms(restaurantId, phone, body);
  return { sent: true };
}
