import { and, asc, eq, inArray, isNull, lte, or, sql } from "drizzle-orm";
import { db } from "../db";
import { smsOutbox } from "@shared/schema";
import { sanitizeError, type SmsTransport } from "./transport";

export const MAX_SMS_ATTEMPTS = 5;
const lockFor = (seconds: number) => sql`DATE_ADD(NOW(), INTERVAL ${seconds} SECOND)`;

export type SmsOutboxResult = { sent: number; retried: number; failed: number };

/**
 * Queues an outgoing SMS. Until an adapter is configured, messages stay 'queued' — nothing is claimed as sent.
 * If scheduledAt is a future date, the message is stored as 'scheduled' and only becomes eligible for
 * sending once that time passes (checked by processSmsOutbox, no separate promotion step needed).
 */
export async function enqueueSms(
  restaurantId: number | null,
  toPhone: string,
  body: string,
  scheduledAt?: Date | null,
): Promise<number> {
  const isFuture = scheduledAt instanceof Date && scheduledAt.getTime() > Date.now();
  const [result] = await db.insert(smsOutbox).values({
    restaurantId,
    toPhone,
    body,
    scheduledAt: isFuture ? scheduledAt : null,
    status: isFuture ? "scheduled" : "queued",
  });
  return (result as any).insertId as number;
}

async function sendOne(transport: SmsTransport, id: number, result: SmsOutboxResult): Promise<void> {
  const [claim] = await db
    .update(smsOutbox)
    .set({ status: "sending", attempts: sql`${smsOutbox.attempts} + 1`, lockedUntil: lockFor(60) })
    .where(and(eq(smsOutbox.id, id), or(isNull(smsOutbox.lockedUntil), lte(smsOutbox.lockedUntil, sql`NOW()`))));
  if (!claim.affectedRows) return;

  const [row] = await db.select().from(smsOutbox).where(eq(smsOutbox.id, id));
  try {
    await transport.send({ to: row.toPhone, text: row.body });
    await db
      .update(smsOutbox)
      .set({ status: "sent", sentAt: new Date(), lastError: null, lockedUntil: null })
      .where(eq(smsOutbox.id, id));
    result.sent++;
  } catch (err: any) {
    const message = sanitizeError(String(err?.message ?? "Bilinmeyen hata"));
    if (row.attempts >= MAX_SMS_ATTEMPTS) {
      await db.update(smsOutbox).set({ status: "failed", lastError: message, lockedUntil: null }).where(eq(smsOutbox.id, id));
      result.failed++;
    } else {
      const backoffSec = row.attempts * 60;
      await db.update(smsOutbox).set({ status: "retry", lastError: message, lockedUntil: lockFor(backoffSec) }).where(eq(smsOutbox.id, id));
      result.retried++;
    }
  }
}

/**
 * Sends queued SMS messages. Each row is claimed with a time lock before sending, so two workers
 * never send the same message twice. Failed attempts retry with growing delay until MAX_SMS_ATTEMPTS.
 * Messages are sent in parallel batches (bounded by `concurrency`) so a large backlog drains in
 * seconds instead of one-by-one; the provider's own rate limit is still the real-world ceiling.
 */
export async function processSmsOutbox(transport: SmsTransport, limit = 200, concurrency = 10): Promise<SmsOutboxResult> {
  const result: SmsOutboxResult = { sent: 0, retried: 0, failed: 0 };
  const due = await db
    .select({ id: smsOutbox.id })
    .from(smsOutbox)
    .where(
      and(
        inArray(smsOutbox.status, ["queued", "retry", "sending", "scheduled"]),
        or(isNull(smsOutbox.lockedUntil), lte(smsOutbox.lockedUntil, sql`NOW()`)),
        or(isNull(smsOutbox.scheduledAt), lte(smsOutbox.scheduledAt, sql`NOW()`)),
      ),
    )
    .orderBy(asc(smsOutbox.id))
    .limit(limit);

  for (let i = 0; i < due.length; i += concurrency) {
    const batch = due.slice(i, i + concurrency);
    await Promise.all(batch.map(({ id }) => sendOne(transport, id, result)));
  }
  return result;
}
