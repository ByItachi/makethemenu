// SMS kontör/bakiye defteri. Değiştirilemez (immutable) ledger: her hareket ayrı bir satır olarak
// eklenir, bakiye hiçbir zaman doğrudan güncellenmez. Güncel bakiye = en son balanceAfter değeri.
import { desc, eq, sql } from "drizzle-orm";
import { db } from "../db";
import { smsBalanceLedger } from "@shared/schema";

export const SMS_COST_PER_MESSAGE = 1; // 1 kontör = 1 SMS (segment başına basitleştirilmiş model)

export async function getBalance(restaurantId: number): Promise<number> {
  const [row] = await db
    .select({ balanceAfter: smsBalanceLedger.balanceAfter })
    .from(smsBalanceLedger)
    .where(eq(smsBalanceLedger.restaurantId, restaurantId))
    .orderBy(desc(smsBalanceLedger.id))
    .limit(1);
  return row?.balanceAfter ?? 0;
}

/**
 * Bakiyeye kontör ekler veya düşer. Eşzamanlı işlemlerde yanlış hesaplamayı önlemek için
 * MySQL'in satır kilitleme davranışına güvenen bir transaction içinde çalışır.
 */
export async function applyLedgerEntry(
  restaurantId: number,
  delta: number,
  reason: "topup" | "sms_send" | "sms_refund" | "adjustment",
  opts: { referenceId?: number; note?: string } = {}
): Promise<{ ok: boolean; balance: number }> {
  return db.transaction(async (tx) => {
    const [row] = await tx
      .select({ balanceAfter: smsBalanceLedger.balanceAfter })
      .from(smsBalanceLedger)
      .where(eq(smsBalanceLedger.restaurantId, restaurantId))
      .orderBy(desc(smsBalanceLedger.id))
      .limit(1)
      .for("update");

    const current = row?.balanceAfter ?? 0;
    const next = current + delta;
    if (next < 0) {
      return { ok: false, balance: current };
    }

    await tx.insert(smsBalanceLedger).values({
      restaurantId,
      delta,
      balanceAfter: next,
      reason,
      referenceId: opts.referenceId,
      note: opts.note,
    });

    return { ok: true, balance: next };
  });
}

export async function getLedgerHistory(restaurantId: number, limit = 100) {
  return db
    .select()
    .from(smsBalanceLedger)
    .where(eq(smsBalanceLedger.restaurantId, restaurantId))
    .orderBy(desc(smsBalanceLedger.id))
    .limit(limit);
}
