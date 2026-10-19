import { and, asc, eq, inArray, isNull, lte, or, sql } from "drizzle-orm";
import { db } from "../db";
import { emailOutbox } from "@shared/schema";
import { sanitizeError, type MailTransport } from "./transport";

export const MAX_EMAIL_ATTEMPTS = 5;
// All lock times are computed by the database clock (NOW()) to avoid app/DB time zone mismatches.
const lockFor = (seconds: number) => sql`DATE_ADD(NOW(), INTERVAL ${seconds} SECOND)`;

export type OutboxResult = { sent: number; retried: number; failed: number };

/**
 * Sends queued e-mails. Each row is claimed with a time lock before sending, so two workers
 * (or a manual run plus the timer) never send the same message twice.
 * Failed attempts are retried with a growing delay until MAX_EMAIL_ATTEMPTS, then marked 'failed'.
 */
export async function processOutbox(transport: MailTransport, limit = 20): Promise<OutboxResult> {
  const result: OutboxResult = { sent: 0, retried: 0, failed: 0 };
  const due = await db
    .select({ id: emailOutbox.id })
    .from(emailOutbox)
    .where(and(inArray(emailOutbox.status, ["queued", "retry", "sending"]), or(isNull(emailOutbox.lockedUntil), lte(emailOutbox.lockedUntil, sql`NOW()`))))
    .orderBy(asc(emailOutbox.id))
    .limit(limit);

  for (const { id } of due) {
    const [claim] = await db
      .update(emailOutbox)
      .set({ status: "sending", attempts: sql`${emailOutbox.attempts} + 1`, lockedUntil: lockFor(120) })
      .where(and(eq(emailOutbox.id, id), or(isNull(emailOutbox.lockedUntil), lte(emailOutbox.lockedUntil, sql`NOW()`))));
    if (!claim.affectedRows) continue; // another worker took it

    const [row] = await db.select().from(emailOutbox).where(eq(emailOutbox.id, id));
    try {
      await transport.send({ to: row.toAddress, subject: row.subject, text: row.body });
      await db
        .update(emailOutbox)
        .set({ status: "sent", sentAt: new Date(), lastError: null, lockedUntil: null })
        .where(eq(emailOutbox.id, id));
      result.sent++;
    } catch (err: any) {
      const message = sanitizeError(String(err?.message ?? "Bilinmeyen hata"));
      // row.attempts already includes this attempt (incremented during the claim).
      if (row.attempts >= MAX_EMAIL_ATTEMPTS) {
        await db.update(emailOutbox).set({ status: "failed", lastError: message, lockedUntil: null }).where(eq(emailOutbox.id, id));
        result.failed++;
      } else {
        const backoffSec = row.attempts * 60;
        await db
          .update(emailOutbox)
          .set({ status: "retry", lastError: message, lockedUntil: lockFor(backoffSec) })
          .where(eq(emailOutbox.id, id));
        result.retried++;
      }
    }
  }
  return result;
}
