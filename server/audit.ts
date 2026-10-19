import type { Request } from "express";
import { db } from "./db";
import { auditLogs } from "@shared/schema";

export interface AuditEvent {
  restaurantId: number | null;
  actorUserId: number | null;
  action: string;
  entity?: string;
  entityId?: string;
  req?: Request;
  meta?: Record<string, unknown>;
}

/**
 * Writes an audit record. Failures are logged and never break the user's request,
 * but the error is visible in server logs so it can be investigated.
 */
export async function writeAudit(event: AuditEvent): Promise<void> {
  try {
    await db.insert(auditLogs).values({
      restaurantId: event.restaurantId,
      actorUserId: event.actorUserId,
      action: event.action,
      entity: event.entity ?? null,
      entityId: event.entityId ?? null,
      ip: event.req?.ip ? event.req.ip.slice(0, 64) : null,
      meta: event.meta ?? null,
    });
  } catch (err: any) {
    console.error("audit write failed:", event.action, err?.code ?? err?.message);
  }
}
