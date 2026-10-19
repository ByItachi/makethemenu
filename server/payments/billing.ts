// Billing core: server-side pricing, coupons, checkout, idempotent webhook processing, renewals and dunning.
// All prices come from the `plans` table. Client-sent amounts are never used.
import { and, desc, eq, inArray, isNull, or, sql } from "drizzle-orm";
import { randomUUID } from "crypto";
import { db } from "../db";
import { plans, restaurants, subscriptions, payments, paymentMethods, coupons, webhookEvents } from "@shared/schema";
import { writeAudit } from "../audit";
import { publicBaseUrl } from "../tenant-routes";
import { loadPaymentConfig, PaymentNotConfiguredError, type PaymentConfig } from "./config";
import { resolveProvider, type CardInfo, type PaymentProvider, type ProviderEvent } from "./provider";

export const TAX_RATE = 0.2; // Listed plan prices are KDV dahil; tax is extracted from the gross amount.
export const CURRENCY = "TRY";
export const MAX_RENEWAL_ATTEMPTS = 3;
const RETRY_DELAYS_SEC = [86400, 259200]; // after attempt 1: +1 day, after attempt 2: +3 days
const MIN_CHARGE_KURUS = 100;

export type Interval = "monthly" | "yearly";
const MONTHS: Record<Interval, number> = { monthly: 1, yearly: 12 };

export class BillingError extends Error {
  constructor(message: string, public status: number, public code: string) {
    super(message);
  }
}

type Plan = typeof plans.$inferSelect;
type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export const toKurus = (v: string | number) => Math.round(Number(v) * 100);
export const fromKurus = (k: number) => (k / 100).toFixed(2);

export function assertInterval(v: unknown): Interval {
  if (v === "monthly" || v === "yearly") return v;
  throw new BillingError("Geçersiz abonelik aralığı.", 400, "BAD_INTERVAL");
}

export function priceKurus(plan: Plan, interval: Interval): number {
  return toKurus(interval === "yearly" ? plan.priceYearly : plan.priceMonthly);
}

export function computeAmounts(subtotal: number, discount: number) {
  const amount = subtotal - discount;
  const taxAmount = amount - Math.round(amount / (1 + TAX_RATE));
  return { amount, taxAmount };
}

async function getActivePlan(code: string): Promise<Plan> {
  const [p] = await db.select().from(plans).where(and(eq(plans.code, code), eq(plans.isActive, true)));
  if (!p) throw new BillingError("Plan bulunamadı.", 404, "PLAN_NOT_FOUND");
  return p;
}

async function assertOwner(restaurantId: number, userId: number) {
  const [r] = await db.select().from(restaurants).where(eq(restaurants.id, restaurantId));
  if (!r) throw new BillingError("İşletme bulunamadı.", 404, "NOT_FOUND");
  if (r.ownerUserId !== userId) throw new BillingError("Bu işlem yalnızca işletme sahibi tarafından yapılabilir.", 403, "NOT_OWNER");
  return r;
}

export async function getCurrentSubscription(restaurantId: number) {
  const [s] = await db
    .select()
    .from(subscriptions)
    .where(and(eq(subscriptions.restaurantId, restaurantId), inArray(subscriptions.status, ["active", "past_due"])))
    .orderBy(desc(subscriptions.id))
    .limit(1);
  return s ?? null;
}

/** Validates a coupon against the database clock and returns the discount in kuruş (0 when no code given). */
export async function quoteCoupon(code: string | undefined | null, subtotal: number) {
  if (!code || !code.trim()) return { couponId: null as number | null, discount: 0 };
  const [c] = await db
    .select()
    .from(coupons)
    .where(
      and(
        eq(coupons.code, code.trim().toUpperCase()),
        eq(coupons.isActive, true),
        or(isNull(coupons.validUntil), sql`${coupons.validUntil} > NOW()`),
      ),
    );
  if (!c) throw new BillingError("Kupon geçersiz veya süresi dolmuş.", 400, "COUPON_INVALID");
  if (c.maxRedemptions !== null && c.redemptions >= c.maxRedemptions) {
    throw new BillingError("Kupon kullanım limitine ulaştı.", 400, "COUPON_EXHAUSTED");
  }
  const raw = c.percentOff ? Math.round((subtotal * c.percentOff) / 100) : toKurus(c.amountOff ?? 0);
  return { couponId: c.id, discount: Math.min(raw, subtotal) };
}

export async function quote(input: { planCode: string; interval: unknown; couponCode?: string | null }) {
  const plan = await getActivePlan(input.planCode);
  const interval = assertInterval(input.interval);
  const subtotal = priceKurus(plan, interval);
  if (subtotal <= 0) {
    throw new BillingError("Bu plan için ödeme gerekmiyor; satış ekibiyle iletişime geçin.", 400, "NOT_PURCHASABLE");
  }
  const { couponId, discount } = await quoteCoupon(input.couponCode, subtotal);
  const { amount, taxAmount } = computeAmounts(subtotal, discount);
  if (amount < MIN_CHARGE_KURUS) throw new BillingError("Ödenecek tutar en az 1,00 TL olmalı.", 400, "AMOUNT_TOO_LOW");
  return { plan, interval, subtotal, discount, amount, taxAmount, couponId };
}

function idempotencyKeyFor(restaurantId: number, header?: string | null): string {
  if (!header || !header.trim()) return `${restaurantId}:auto-${randomUUID()}`;
  const v = header.trim();
  if (!/^[A-Za-z0-9_-]{8,100}$/.test(v)) throw new BillingError("Idempotency-Key 8-100 karakter, harf/rakam/-/_ olmalı.", 400, "BAD_IDEMPOTENCY_KEY");
  return `${restaurantId}:${v}`;
}

function sessionView(p: typeof payments.$inferSelect, provider: PaymentProvider, reused: boolean) {
  return {
    paymentId: p.id,
    kind: p.kind,
    planCode: p.planCode,
    interval: p.interval,
    subtotal: Number(p.subtotal),
    discount: Number(p.discount),
    amount: Number(p.amount),
    taxAmount: Number(p.taxAmount),
    currency: p.currency,
    redirectUrl: p.providerRef ? provider.checkoutUrl(p.providerRef) : null,
    reused,
  };
}

export async function startCheckout(input: {
  restaurantId: number;
  userId: number;
  planCode: string;
  interval: unknown;
  couponCode?: string | null;
  kind: "subscription" | "upgrade";
  subscriptionId?: number | null;
  creditKurus?: number;
  idempotencyKey?: string | null;
  cfg?: PaymentConfig;
}) {
  const cfg = input.cfg ?? loadPaymentConfig();
  const provider = resolveProvider(cfg, publicBaseUrl());
  await assertOwner(input.restaurantId, input.userId);
  if (input.kind === "subscription" && (await getCurrentSubscription(input.restaurantId))) {
    throw new BillingError("Aktif aboneliğiniz var; plan değişikliği için planı değiştirin.", 409, "ALREADY_SUBSCRIBED");
  }
  const q = await quote(input);
  // Proration credit (upgrades): the unused share of the current period reduces what is charged.
  const discount = input.creditKurus && input.kind === "upgrade" ? Math.min(Math.max(0, input.creditKurus), q.subtotal) : q.discount;
  const { amount, taxAmount } = computeAmounts(q.subtotal, discount);
  if (amount < MIN_CHARGE_KURUS) throw new BillingError("Ödenecek tutar en az 1,00 TL olmalı.", 400, "AMOUNT_TOO_LOW");
  const key = idempotencyKeyFor(input.restaurantId, input.idempotencyKey);

  const [existing] = await db.select().from(payments).where(eq(payments.idempotencyKey, key));
  if (existing) {
    if (existing.planCode !== q.plan.code || existing.interval !== q.interval || existing.kind !== input.kind) {
      throw new BillingError("Bu Idempotency-Key farklı bir istekle kullanılmış.", 409, "IDEMPOTENCY_CONFLICT");
    }
    if (!existing.providerRef) {
      throw new BillingError("Önceki ödeme oturumu tamamlanmamış; yeni bir Idempotency-Key kullanın.", 409, "IDEMPOTENCY_INCOMPLETE");
    }
    return sessionView(existing, provider, true);
  }

  let paymentId: number;
  try {
    const [ins] = await db.insert(payments).values({
      restaurantId: input.restaurantId,
      subscriptionId: input.subscriptionId ?? null,
      kind: input.kind,
      planCode: q.plan.code,
      interval: q.interval,
      subtotal: fromKurus(q.subtotal),
      discount: fromKurus(discount),
      amount: fromKurus(amount),
      taxAmount: fromKurus(taxAmount),
      currency: CURRENCY,
      couponId: q.couponId,
      status: "pending",
      provider: provider.name,
      idempotencyKey: key,
    });
    paymentId = ins.insertId;
  } catch (err: any) {
    if (err?.code === "ER_DUP_ENTRY") throw new BillingError("Bu ödeme isteği zaten işleniyor.", 409, "IDEMPOTENCY_CONFLICT");
    throw err;
  }

  let ref;
  try {
    ref = await provider.createCheckout({
      paymentId,
      amount: fromKurus(q.amount),
      currency: CURRENCY,
      description: `${q.plan.name} (${q.interval === "yearly" ? "yıllık" : "aylık"})`,
      idempotencyKey: key,
    });
  } catch (err) {
    await db.update(payments).set({ status: "failed", failureReason: "provider_error" }).where(eq(payments.id, paymentId));
    throw err;
  }
  await db.update(payments).set({ providerRef: ref.providerRef }).where(eq(payments.id, paymentId));
  await writeAudit({
    restaurantId: input.restaurantId,
    actorUserId: input.userId,
    action: "billing.checkout_started",
    entity: "payment",
    entityId: String(paymentId),
    meta: { planCode: q.plan.code, interval: q.interval, kind: input.kind, amount: fromKurus(q.amount) },
  });
  return {
    paymentId,
    kind: input.kind,
    planCode: q.plan.code,
    interval: q.interval,
    subtotal: fromKurus(q.subtotal),
    discount: fromKurus(discount),
    amount: fromKurus(amount),
    taxAmount: fromKurus(taxAmount),
    currency: CURRENCY,
    redirectUrl: ref.checkoutUrl,
    reused: false,
  };
}

// ---------- Payment state transitions (run inside a transaction) ----------

async function upsertPaymentMethod(tx: Tx, restaurantId: number, provider: string, card: CardInfo) {
  const [ex] = await tx.select().from(paymentMethods).where(eq(paymentMethods.token, card.token));
  if (ex) return;
  await tx.update(paymentMethods).set({ isDefault: false }).where(eq(paymentMethods.restaurantId, restaurantId));
  await tx.insert(paymentMethods).values({
    restaurantId,
    provider,
    token: card.token.slice(0, 128),
    brand: card.brand.slice(0, 32),
    last4: card.last4.replace(/\D/g, "").slice(-4),
    isDefault: true,
  });
}

async function cancelSubscriptionNow(tx: Tx, subscriptionId: number, restaurantId: number, reason: string) {
  await tx
    .update(subscriptions)
    .set({ status: "canceled", cancelAtPeriodEnd: false, pendingPlanCode: null, updatedAt: sql`NOW()` })
    .where(eq(subscriptions.id, subscriptionId));
  await tx.update(restaurants).set({ planCode: "free" }).where(eq(restaurants.id, restaurantId));
  await writeAudit({ restaurantId, actorUserId: null, action: "billing.subscription_canceled", entity: "subscription", entityId: String(subscriptionId), meta: { reason } });
}

/** Marks a payment as succeeded exactly once and applies its effect (plan, period, card, coupon, invoice number). */
export async function markSucceeded(tx: Tx, paymentId: number, card?: CardInfo) {
  const [p] = await tx.select().from(payments).where(eq(payments.id, paymentId));
  if (!p || p.status === "succeeded" || p.status === "refunded") return;
  const [upd] = await tx
    .update(payments)
    .set({
      status: "succeeded",
      paidAt: sql`NOW()`,
      failureReason: null,
      nextRetryAt: null,
      invoiceNo: `F${new Date().getFullYear()}${String(p.id).padStart(8, "0")}`,
    })
    .where(and(eq(payments.id, p.id), inArray(payments.status, ["pending", "failed"])));
  if (!upd.affectedRows) return;

  const months = MONTHS[p.interval as Interval];
  const periodEnd = sql`DATE_ADD(NOW(), INTERVAL ${months} MONTH)`;

  if (p.kind === "renewal" && p.subscriptionId) {
    await tx
      .update(subscriptions)
      .set({ status: "active", currentPeriodEnd: periodEnd, updatedAt: sql`NOW()` })
      .where(eq(subscriptions.id, p.subscriptionId));
  } else if (p.kind === "upgrade" && p.subscriptionId) {
    await tx
      .update(subscriptions)
      .set({ planCode: p.planCode, interval: p.interval, status: "active", cancelAtPeriodEnd: false, pendingPlanCode: null, currentPeriodEnd: periodEnd, updatedAt: sql`NOW()` })
      .where(eq(subscriptions.id, p.subscriptionId));
    await tx.update(restaurants).set({ planCode: p.planCode }).where(eq(restaurants.id, p.restaurantId));
  } else if (p.kind === "subscription") {
    const [ins] = await tx.insert(subscriptions).values({
      restaurantId: p.restaurantId,
      planCode: p.planCode,
      interval: p.interval,
      status: "active",
      currentPeriodEnd: periodEnd,
    });
    await tx.update(payments).set({ subscriptionId: ins.insertId }).where(eq(payments.id, p.id));
    await tx.update(restaurants).set({ planCode: p.planCode }).where(eq(restaurants.id, p.restaurantId));
    if (p.couponId) {
      await tx.execute(
        sql`UPDATE coupons SET redemptions = redemptions + 1 WHERE id = ${p.couponId} AND (max_redemptions IS NULL OR redemptions < max_redemptions)`,
      );
    }
  }

  if (card) await upsertPaymentMethod(tx, p.restaurantId, p.provider, card);
  await writeAudit({ restaurantId: p.restaurantId, actorUserId: null, action: "billing.payment_succeeded", entity: "payment", entityId: String(p.id), meta: { kind: p.kind, planCode: p.planCode, amount: p.amount } });
}

/** Marks a payment as failed. Renewals enter dunning (past_due, scheduled retry) and are cancelled after the last attempt. */
export async function markFailed(tx: Tx, paymentId: number, reason: string) {
  const [p] = await tx.select().from(payments).where(eq(payments.id, paymentId));
  if (!p || p.status === "succeeded" || p.status === "refunded") return;
  await tx
    .update(payments)
    .set({ status: "failed", failureReason: reason.slice(0, 255), updatedAt: sql`NOW()` })
    .where(eq(payments.id, p.id));
  if (p.kind === "renewal" && p.subscriptionId) {
    if (p.attempts >= MAX_RENEWAL_ATTEMPTS) {
      await cancelSubscriptionNow(tx, p.subscriptionId, p.restaurantId, "dunning_exhausted");
    } else {
      const delay = RETRY_DELAYS_SEC[Math.max(0, p.attempts - 1)] ?? RETRY_DELAYS_SEC[RETRY_DELAYS_SEC.length - 1];
      await tx.update(subscriptions).set({ status: "past_due", updatedAt: sql`NOW()` }).where(eq(subscriptions.id, p.subscriptionId));
      await tx
        .update(payments)
        .set({ nextRetryAt: sql`DATE_ADD(NOW(), INTERVAL ${delay} SECOND)` })
        .where(eq(payments.id, p.id));
    }
  }
  await writeAudit({ restaurantId: p.restaurantId, actorUserId: null, action: "billing.payment_failed", entity: "payment", entityId: String(p.id), meta: { kind: p.kind, reason: reason.slice(0, 120) } });
}

// ---------- Webhooks ----------

/** Applies a verified provider event. Duplicate event ids are detected by a unique key in the same transaction. */
export async function processProviderEvent(providerName: string, event: ProviderEvent) {
  try {
    return await db.transaction(async (tx) => {
      await tx.insert(webhookEvents).values({ provider: providerName, eventId: event.id.slice(0, 128), type: event.type });
      const [p] = await tx.select().from(payments).where(eq(payments.providerRef, event.providerRef));
      if (!p) return { received: true as const, duplicate: false, ignored: true };
      if (event.type === "payment.succeeded") await markSucceeded(tx, p.id, event.card);
      else await markFailed(tx, p.id, event.reason);
      return { received: true as const, duplicate: false, ignored: false };
    });
  } catch (err: any) {
    if (err?.code === "ER_DUP_ENTRY") return { received: true as const, duplicate: true, ignored: false };
    throw err;
  }
}

export async function handleWebhook(rawBody: Buffer, signatureHeader: string | undefined, cfg: PaymentConfig = loadPaymentConfig()) {
  if (!cfg.webhookSecret) throw new PaymentNotConfiguredError("PAYMENT_WEBHOOK_SECRET tanımlı değil.");
  const provider = resolveProvider(cfg, publicBaseUrl());
  const event = provider.verifyWebhook(rawBody, signatureHeader, cfg.webhookSecret);
  return processProviderEvent(provider.name, event);
}

// ---------- Charging (renewals, retries) ----------

async function getDefaultMethod(restaurantId: number) {
  const [pm] = await db
    .select()
    .from(paymentMethods)
    .where(and(eq(paymentMethods.restaurantId, restaurantId), eq(paymentMethods.isDefault, true)))
    .orderBy(desc(paymentMethods.id))
    .limit(1);
  return pm ?? null;
}

async function chargePayment(paymentId: number, provider: PaymentProvider): Promise<void> {
  const [before] = await db.select().from(payments).where(eq(payments.id, paymentId));
  if (!before) return;
  const attempt = before.attempts + 1;
  await db.update(payments).set({ attempts: attempt, status: "pending", nextRetryAt: null, failureReason: null }).where(eq(payments.id, paymentId));

  const pm = await getDefaultMethod(before.restaurantId);
  if (!pm) {
    await db.transaction((tx) => markFailed(tx, paymentId, "no_payment_method"));
    return;
  }
  let res;
  try {
    res = await provider.charge({ token: pm.token, amount: before.amount, currency: before.currency, idempotencyKey: `${before.idempotencyKey}:a${attempt}` });
  } catch {
    await db.transaction((tx) => markFailed(tx, paymentId, "provider_error"));
    return;
  }
  await db.update(payments).set({ providerRef: res.providerRef }).where(eq(payments.id, paymentId));
  if (res.status === "succeeded") await db.transaction((tx) => markSucceeded(tx, paymentId));
  else await db.transaction((tx) => markFailed(tx, paymentId, res.reason ?? "declined"));
}

/**
 * Periodic billing job (also callable from tests):
 * 1) cancels subscriptions that were set to cancel at period end,
 * 2) applies scheduled downgrades and charges renewals that are due,
 * 3) retries failed renewals whose retry time has come (dunning).
 */
export async function runBillingCycle(cfg: PaymentConfig = loadPaymentConfig()) {
  const stats = { canceled: 0, renewed: 0, retried: 0, stuckClosed: 0 };
  let provider: PaymentProvider;
  try {
    provider = resolveProvider(cfg, publicBaseUrl());
  } catch {
    return stats; // billing not configured: nothing to do
  }

  const ending = await db
    .select()
    .from(subscriptions)
    .where(and(eq(subscriptions.cancelAtPeriodEnd, true), inArray(subscriptions.status, ["active", "past_due"]), sql`${subscriptions.currentPeriodEnd} <= NOW()`))
    .limit(50);
  for (const s of ending) {
    await db.transaction((tx) => cancelSubscriptionNow(tx, s.id, s.restaurantId, "period_end"));
    stats.canceled++;
  }

  const due = await db
    .select()
    .from(subscriptions)
    .where(and(eq(subscriptions.status, "active"), eq(subscriptions.cancelAtPeriodEnd, false), sql`${subscriptions.currentPeriodEnd} <= NOW()`))
    .limit(50);
  for (const s of due) {
    const paymentId = await db.transaction(async (tx) => {
      let planCode = s.planCode;
      if (s.pendingPlanCode) {
        planCode = s.pendingPlanCode;
        await tx.update(subscriptions).set({ planCode, pendingPlanCode: null }).where(eq(subscriptions.id, s.id));
        await tx.update(restaurants).set({ planCode }).where(eq(restaurants.id, s.restaurantId));
      }
      const [plan] = await tx.select().from(plans).where(eq(plans.code, planCode));
      const amount = plan ? priceKurus(plan, s.interval as Interval) : 0;
      if (!plan || amount <= 0) {
        await cancelSubscriptionNow(tx, s.id, s.restaurantId, "no_paid_plan");
        return null;
      }
      const tax = computeAmounts(amount, 0).taxAmount;
      try {
        const [ins] = await tx.insert(payments).values({
          restaurantId: s.restaurantId,
          subscriptionId: s.id,
          kind: "renewal",
          planCode,
          interval: s.interval,
          subtotal: fromKurus(amount),
          discount: "0",
          amount: fromKurus(amount),
          taxAmount: fromKurus(tax),
          currency: CURRENCY,
          status: "pending",
          provider: provider.name,
          // Deterministic per billing period: a second run cannot create a second charge for the same period.
          idempotencyKey: `renew:${s.id}:${s.currentPeriodEnd.getTime()}`,
        });
        return ins.insertId;
      } catch (err: any) {
        if (err?.code === "ER_DUP_ENTRY") return null;
        throw err;
      }
    });
    if (paymentId) {
      await chargePayment(paymentId, provider);
      stats.renewed++;
    }
  }

  // Payments stuck in `pending` (e.g. the process crashed mid-charge) for over a day are
  // closed as failed so dunning/retry logic can take over instead of blocking forever.
  const stuck = await db
    .select({ id: payments.id })
    .from(payments)
    .where(and(eq(payments.status, "pending"), sql`${payments.createdAt} <= DATE_SUB(NOW(), INTERVAL 24 HOUR)`))
    .limit(50);
  for (const { id } of stuck) {
    await db.transaction((tx) => markFailed(tx, id, "stuck_timeout"));
    stats.stuckClosed++;
  }

  const retries = await db
    .select({ id: payments.id })
    .from(payments)
    .where(and(eq(payments.kind, "renewal"), eq(payments.status, "failed"), sql`${payments.attempts} < ${MAX_RENEWAL_ATTEMPTS}`, sql`${payments.nextRetryAt} <= NOW()`))
    .limit(50);
  for (const { id } of retries) {
    await chargePayment(id, provider);
    stats.retried++;
  }
  return stats;
}

// ---------- Plan changes and cancellation (owner) ----------

export async function changePlan(input: { restaurantId: number; userId: number; planCode: string; interval: unknown; cfg?: PaymentConfig }) {
  await assertOwner(input.restaurantId, input.userId);
  const sub = await getCurrentSubscription(input.restaurantId);
  if (!sub) throw new BillingError("Aktif abonelik yok; önce bir plan satın alın.", 409, "NO_SUBSCRIPTION");
  if (sub.cancelAtPeriodEnd) throw new BillingError("Abonelik dönem sonunda iptal edilecek; önce iptali geri alın.", 409, "CANCEL_PENDING");

  const interval = assertInterval(input.interval);
  const target = await getActivePlan(input.planCode);
  const [current] = await db.select().from(plans).where(eq(plans.code, sub.planCode));
  if (target.code === sub.planCode && interval === sub.interval) {
    throw new BillingError("Zaten bu plandasınız.", 400, "SAME_PLAN");
  }

  const targetPrice = priceKurus(target, interval);
  if (targetPrice <= 0) {
    await db.update(subscriptions).set({ cancelAtPeriodEnd: true, pendingPlanCode: null }).where(eq(subscriptions.id, sub.id));
    await writeAudit({ restaurantId: input.restaurantId, actorUserId: input.userId, action: "billing.downgrade_to_free_scheduled", entity: "subscription", entityId: String(sub.id) });
    return { mode: "scheduled_cancel" as const, effectiveAt: sub.currentPeriodEnd };
  }

  const currentPrice = current ? priceKurus(current, sub.interval as Interval) : 0;
  if (targetPrice > currentPrice) {
    // Upgrade: charged now; the new period starts on successful payment. For same-interval
    // upgrades the unused portion of the current period is credited against the new price
    // (proration). Interval changes (e.g. monthly -> yearly) are charged in full.
    let credit = 0;
    if (interval === sub.interval) {
      const months = MONTHS[sub.interval as Interval];
      const [frac] = await db
        .select({
          total: sql<number>`TIMESTAMPDIFF(SECOND, DATE_SUB(${subscriptions.currentPeriodEnd}, INTERVAL ${months} MONTH), ${subscriptions.currentPeriodEnd})`,
          remaining: sql<number>`TIMESTAMPDIFF(SECOND, NOW(), ${subscriptions.currentPeriodEnd})`,
        })
        .from(subscriptions)
        .where(eq(subscriptions.id, sub.id));
      const total = Number(frac?.total ?? 0);
      const remaining = Math.max(0, Number(frac?.remaining ?? 0));
      credit = total > 0 ? Math.round(currentPrice * Math.min(1, remaining / total)) : 0;
    }
    const net = priceKurus(target, interval) - credit;
    if (net < MIN_CHARGE_KURUS) {
      // Difference below the minimum charge: apply immediately without a payment.
      await db.update(subscriptions).set({ planCode: target.code, updatedAt: sql`NOW()` }).where(eq(subscriptions.id, sub.id));
      await db.update(restaurants).set({ planCode: target.code }).where(eq(restaurants.id, input.restaurantId));
      await writeAudit({ restaurantId: input.restaurantId, actorUserId: input.userId, action: "billing.upgrade_applied_no_charge", entity: "subscription", entityId: String(sub.id), meta: { to: target.code } });
      return { mode: "applied" as const, planCode: target.code };
    }
    const session = await startCheckout({
      restaurantId: input.restaurantId,
      userId: input.userId,
      planCode: target.code,
      interval,
      kind: "upgrade",
      subscriptionId: sub.id,
      creditKurus: credit,
      cfg: input.cfg,
    });
    return { mode: "checkout" as const, ...session };
  }

  if (interval !== sub.interval) {
    throw new BillingError(
      "Yıllıktan aylığa (veya aylıktan yıllığa düşürme) dönem sonunda desteklenmiyor; mevcut aboneliği iptal edip yeni abonelik başlatın.",
      400,
      "INTERVAL_DOWNGRADE_UNSUPPORTED",
    );
  }
  await db.update(subscriptions).set({ pendingPlanCode: target.code }).where(eq(subscriptions.id, sub.id));
  await writeAudit({ restaurantId: input.restaurantId, actorUserId: input.userId, action: "billing.downgrade_scheduled", entity: "subscription", entityId: String(sub.id), meta: { to: target.code } });
  return { mode: "scheduled" as const, planCode: target.code, effectiveAt: sub.currentPeriodEnd };
}

export async function setCancelAtPeriodEnd(restaurantId: number, userId: number, cancel: boolean) {
  await assertOwner(restaurantId, userId);
  const sub = await getCurrentSubscription(restaurantId);
  if (!sub) throw new BillingError("Aktif abonelik yok.", 409, "NO_SUBSCRIPTION");
  await db.update(subscriptions).set({ cancelAtPeriodEnd: cancel }).where(eq(subscriptions.id, sub.id));
  await writeAudit({ restaurantId, actorUserId: userId, action: cancel ? "billing.subscription_cancel_requested" : "billing.subscription_resumed", entity: "subscription", entityId: String(sub.id) });
  return { cancelAtPeriodEnd: cancel, effectiveAt: sub.currentPeriodEnd };
}

// ---------- Views ----------

export async function getOverview(restaurantId: number) {
  const sub = await getCurrentSubscription(restaurantId);
  const [r] = await db.select({ planCode: restaurants.planCode }).from(restaurants).where(eq(restaurants.id, restaurantId));
  const pm = await getDefaultMethod(restaurantId);
  return {
    planCode: r?.planCode ?? "free",
    subscription: sub
      ? {
          id: sub.id,
          planCode: sub.planCode,
          interval: sub.interval,
          status: sub.status,
          currentPeriodEnd: sub.currentPeriodEnd,
          cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
          pendingPlanCode: sub.pendingPlanCode,
        }
      : null,
    paymentMethod: pm ? { brand: pm.brand, last4: pm.last4 } : null,
  };
}

export async function listPayments(restaurantId: number) {
  return db
    .select({
      id: payments.id,
      kind: payments.kind,
      planCode: payments.planCode,
      interval: payments.interval,
      amount: payments.amount,
      taxAmount: payments.taxAmount,
      discount: payments.discount,
      currency: payments.currency,
      status: payments.status,
      invoiceNo: payments.invoiceNo,
      failureReason: payments.failureReason,
      paidAt: payments.paidAt,
      createdAt: payments.createdAt,
    })
    .from(payments)
    .where(eq(payments.restaurantId, restaurantId))
    .orderBy(desc(payments.id))
    .limit(100);
}

export async function refundPayment(paymentId: number, actorUserId: number, cfg: PaymentConfig = loadPaymentConfig()) {
  const [p] = await db.select().from(payments).where(eq(payments.id, paymentId));
  if (!p) throw new BillingError("Ödeme bulunamadı.", 404, "NOT_FOUND");
  if (p.status !== "succeeded") throw new BillingError("Yalnızca başarılı ödemeler iade edilebilir.", 409, "NOT_REFUNDABLE");
  const provider = resolveProvider(cfg, publicBaseUrl());
  const res = await provider.refund(p.providerRef ?? "", p.amount);
  if (!res.ok) throw new BillingError("Sağlayıcı iadeyi reddetti.", 502, "REFUND_FAILED");
  await db.update(payments).set({ status: "refunded", updatedAt: sql`NOW()` }).where(eq(payments.id, p.id));
  await writeAudit({ restaurantId: p.restaurantId, actorUserId, action: "billing.refund", entity: "payment", entityId: String(p.id), meta: { amount: p.amount } });
  return { id: p.id, status: "refunded" as const };
}

// ---------- Payment methods (owner; only token, brand and last4 are stored) ----------

export async function listPaymentMethods(restaurantId: number, userId: number) {
  await assertOwner(restaurantId, userId);
  return db
    .select({
      id: paymentMethods.id,
      brand: paymentMethods.brand,
      last4: paymentMethods.last4,
      isDefault: paymentMethods.isDefault,
      createdAt: paymentMethods.createdAt,
    })
    .from(paymentMethods)
    .where(eq(paymentMethods.restaurantId, restaurantId))
    .orderBy(desc(paymentMethods.isDefault), desc(paymentMethods.id));
}

export async function setDefaultPaymentMethod(restaurantId: number, userId: number, methodId: number) {
  await assertOwner(restaurantId, userId);
  const [pm] = await db
    .select()
    .from(paymentMethods)
    .where(and(eq(paymentMethods.id, methodId), eq(paymentMethods.restaurantId, restaurantId)));
  if (!pm) throw new BillingError("Ödeme yöntemi bulunamadı.", 404, "NOT_FOUND");
  await db.transaction(async (tx) => {
    await tx.update(paymentMethods).set({ isDefault: false }).where(eq(paymentMethods.restaurantId, restaurantId));
    await tx.update(paymentMethods).set({ isDefault: true }).where(eq(paymentMethods.id, methodId));
  });
  await writeAudit({ restaurantId, actorUserId: userId, action: "billing.payment_method_default", entity: "payment_method", entityId: String(methodId) });
  return { id: methodId, isDefault: true };
}

export async function deletePaymentMethod(restaurantId: number, userId: number, methodId: number) {
  await assertOwner(restaurantId, userId);
  const [pm] = await db
    .select()
    .from(paymentMethods)
    .where(and(eq(paymentMethods.id, methodId), eq(paymentMethods.restaurantId, restaurantId)));
  if (!pm) throw new BillingError("Ödeme yöntemi bulunamadı.", 404, "NOT_FOUND");
  await db.transaction(async (tx) => {
    await tx.delete(paymentMethods).where(eq(paymentMethods.id, methodId));
    if (pm.isDefault) {
      const [next] = await tx
        .select({ id: paymentMethods.id })
        .from(paymentMethods)
        .where(eq(paymentMethods.restaurantId, restaurantId))
        .orderBy(desc(paymentMethods.id))
        .limit(1);
      if (next) await tx.update(paymentMethods).set({ isDefault: true }).where(eq(paymentMethods.id, next.id));
    }
  });
  await writeAudit({ restaurantId, actorUserId: userId, action: "billing.payment_method_deleted", entity: "payment_method", entityId: String(methodId) });
  return { deleted: true as const };
}
