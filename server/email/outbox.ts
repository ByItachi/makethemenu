import { db } from "../db";
import { emailOutbox } from "@shared/schema";

/**
 * Queues an outgoing e-mail. The queue is the single entry point; delivery adapters
 * (SMTP / provider API) consume 'queued' rows. Until an adapter is configured, mails stay
 * queued and are visible in the platform admin panel. Nothing is claimed as "sent" here.
 */
export async function enqueueEmail(to: string, subject: string, body: string): Promise<void> {
  await db.insert(emailOutbox).values({ toAddress: to, subject, body });
}
