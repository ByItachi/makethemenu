// MakeTheMenu kendi SMS gateway motoru.
// Aracı firma yok: SIM kartlı Android telefonlar / USB GSM modemler "gateway cihazı" olarak eşleştirilir,
// sms_outbox kuyruğundan kilitli şekilde iş çeker, SIM üzerinden gönderir ve sonucu bildirir.
import crypto from "crypto";
import { eq, sql } from "drizzle-orm";
import { db } from "../db";
import { smsGatewayDevices, smsInbound } from "@shared/schema";
import { MAX_SMS_ATTEMPTS } from "./outbox";

export const GATEWAY_CLAIM_SECONDS = 300;
export const GATEWAY_ONLINE_SECONDS = 120;
const MAX_CLAIM_BATCH = 50;

export type GatewayDevice = typeof smsGatewayDevices.$inferSelect;

export function sha256(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export function genGatewayPairingCode() {
  return String(crypto.randomInt(100000, 999999));
}

export function genGatewayToken() {
  return `mtmgw_${crypto.randomBytes(24).toString("hex")}`;
}

export async function gatewayDeviceFromToken(token: string | undefined): Promise<GatewayDevice | null> {
  if (!token || !token.startsWith("mtmgw_")) return null;
  const [row] = await db.select().from(smsGatewayDevices).where(eq(smsGatewayDevices.tokenHash, sha256(token))).limit(1);
  if (!row || row.status !== "active") return null;
  return row;
}

function firstRows(result: any): any[] {
  return Array.isArray(result) ? (Array.isArray(result[0]) ? result[0] : result) : [];
}

function affected(result: any): number {
  const header = Array.isArray(result) ? result[0] : result;
  return Number(header?.affectedRows ?? 0);
}

export async function deviceUsage(deviceId: number) {
  const rows = firstRows(await db.execute(sql`
    SELECT
      SUM(CASE WHEN status = 'sent' AND sent_at >= CURDATE() THEN 1 ELSE 0 END) AS sentToday,
      SUM(CASE WHEN status = 'sent' AND sent_at >= DATE_SUB(NOW(), INTERVAL 60 SECOND) THEN 1 ELSE 0 END) AS sentLastMinute,
      SUM(CASE WHEN status = 'dispatched' AND locked_until > NOW() THEN 1 ELSE 0 END) AS inFlight,
      SUM(CASE WHEN status = 'failed' AND created_at >= CURDATE() THEN 1 ELSE 0 END) AS failedToday,
      SUM(CASE WHEN delivered_at >= CURDATE() THEN 1 ELSE 0 END) AS deliveredToday
    FROM sms_outbox WHERE gateway_device_id = ${deviceId}
  `));
  const r = rows[0] ?? {};
  return {
    sentToday: Number(r.sentToday ?? 0),
    sentLastMinute: Number(r.sentLastMinute ?? 0),
    inFlight: Number(r.inFlight ?? 0),
    failedToday: Number(r.failedToday ?? 0),
    deliveredToday: Number(r.deliveredToday ?? 0),
  };
}

export type ClaimedJob = { id: number; to: string; text: string; attempt: number };

/**
 * Cihaza iş dağıtır. Tek bir UPDATE ... ORDER BY id LIMIT ile satırlar benzersiz bir claim token'ı ile
 * kilitlenir; böylece iki cihaz aynı mesajı asla aynı anda alamaz. Cihazın günlük ve dakikalık
 * limitleri aşılmaz. Kilit süresi (GATEWAY_CLAIM_SECONDS) içinde sonuç bildirilmezse mesaj yeniden dağıtılır.
 */
export async function claimJobs(device: GatewayDevice, requested: number): Promise<ClaimedJob[]> {
  if (!device.enabled) return [];
  const usage = await deviceUsage(device.id);
  const dailyRoom = device.dailyLimit - usage.sentToday - usage.inFlight;
  const minuteRoom = device.perMinuteLimit - usage.sentLastMinute - usage.inFlight;
  const limit = Math.max(0, Math.min(requested, MAX_CLAIM_BATCH, dailyRoom, minuteRoom));
  if (limit <= 0) return [];

  const claim = crypto.randomBytes(12).toString("hex");
  await db.execute(sql`
    UPDATE sms_outbox
    SET status = 'dispatched', gateway_device_id = ${device.id}, gateway_claim = ${claim},
        attempts = attempts + 1, locked_until = DATE_ADD(NOW(), INTERVAL ${GATEWAY_CLAIM_SECONDS} SECOND)
    WHERE status IN ('queued', 'retry', 'scheduled', 'sending', 'dispatched')
      AND (locked_until IS NULL OR locked_until <= NOW())
      AND (scheduled_at IS NULL OR scheduled_at <= NOW())
      AND attempts < ${MAX_SMS_ATTEMPTS}
    ORDER BY id ASC
    LIMIT ${limit}
  `);
  const rows = firstRows(await db.execute(sql`
    SELECT id, to_phone, body, attempts FROM sms_outbox WHERE gateway_claim = ${claim} ORDER BY id ASC
  `));
  return rows.map((r: any) => ({ id: Number(r.id), to: String(r.to_phone), text: String(r.body), attempt: Number(r.attempts) }));
}

export type GatewayResult = { status: "sent" | "delivered" | "failed"; error?: string; permanent?: boolean };

export async function reportJobResult(device: GatewayDevice, id: number, result: GatewayResult): Promise<boolean> {
  if (result.status === "sent") {
    return affected(await db.execute(sql`
      UPDATE sms_outbox
      SET status = 'sent', sent_at = COALESCE(sent_at, NOW()), last_error = NULL, locked_until = NULL, gateway_claim = NULL
      WHERE id = ${id} AND gateway_device_id = ${device.id} AND status IN ('dispatched', 'retry', 'sent')
    `)) > 0;
  }
  if (result.status === "delivered") {
    return affected(await db.execute(sql`
      UPDATE sms_outbox
      SET status = 'sent', sent_at = COALESCE(sent_at, NOW()), delivered_at = NOW(), last_error = NULL, locked_until = NULL, gateway_claim = NULL
      WHERE id = ${id} AND gateway_device_id = ${device.id}
    `)) > 0;
  }
  const message = (result.error ?? "Cihaz gönderimi başarısız").slice(0, 255);
  const rows = firstRows(await db.execute(sql`
    SELECT attempts FROM sms_outbox WHERE id = ${id} AND gateway_device_id = ${device.id} AND status = 'dispatched'
  `));
  if (!rows.length) return false;
  const attempts = Number(rows[0].attempts);
  if (result.permanent || attempts >= MAX_SMS_ATTEMPTS) {
    await db.execute(sql`
      UPDATE sms_outbox SET status = 'failed', last_error = ${message}, locked_until = NULL, gateway_claim = NULL WHERE id = ${id}
    `);
  } else {
    await db.execute(sql`
      UPDATE sms_outbox SET status = 'retry', last_error = ${message}, gateway_claim = NULL,
        locked_until = DATE_ADD(NOW(), INTERVAL ${attempts * 60} SECOND)
      WHERE id = ${id}
    `);
  }
  return true;
}

/** Kilidi dolmuş ve deneme hakkı bitmiş gateway işlerini 'failed' yapar; diğerleri claimJobs ile yeniden dağıtılır. */
export async function reapExpiredGatewayJobs(): Promise<number> {
  return affected(await db.execute(sql`
    UPDATE sms_outbox
    SET status = 'failed', last_error = 'Gateway cihazı zaman aşımı (sonuç bildirilmedi)', gateway_claim = NULL, locked_until = NULL
    WHERE status = 'dispatched' AND locked_until <= NOW() AND attempts >= ${MAX_SMS_ATTEMPTS}
  `));
}

export async function recordInboundSms(device: GatewayDevice, from: string, text: string, externalId?: string) {
  const [res] = await db.insert(smsInbound).values({
    restaurantId: null,
    fromPhone: from.slice(0, 32),
    body: text.slice(0, 640),
    externalId: (externalId ?? `gw${device.id}-${Date.now()}`).slice(0, 64),
  }).$returningId();
  return res.id;
}

export async function gatewayQueueStats() {
  const rows = firstRows(await db.execute(sql`
    SELECT
      SUM(CASE WHEN status IN ('queued', 'retry') THEN 1 ELSE 0 END) AS waiting,
      SUM(CASE WHEN status = 'scheduled' THEN 1 ELSE 0 END) AS scheduled,
      SUM(CASE WHEN status = 'dispatched' THEN 1 ELSE 0 END) AS dispatched,
      SUM(CASE WHEN status = 'sent' AND sent_at >= CURDATE() THEN 1 ELSE 0 END) AS sentToday,
      SUM(CASE WHEN status = 'failed' AND created_at >= CURDATE() THEN 1 ELSE 0 END) AS failedToday
    FROM sms_outbox
  `));
  const r = rows[0] ?? {};
  return {
    waiting: Number(r.waiting ?? 0),
    scheduled: Number(r.scheduled ?? 0),
    dispatched: Number(r.dispatched ?? 0),
    sentToday: Number(r.sentToday ?? 0),
    failedToday: Number(r.failedToday ?? 0),
  };
}
