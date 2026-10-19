// Billing tests (test mode, mock provider). Runs in-process against the real database.
// Every webhook goes through the real HMAC verification path; no state is faked.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "crypto";
import "../server/env";
import mysql from "mysql2/promise";

// Test-mode configuration. Set BEFORE the billing modules are used (they read env lazily).
process.env.PAYMENT_PROVIDER = "mock";
process.env.PAYMENT_MODE = "test";
process.env.PAYMENT_WEBHOOK_SECRET = randomBytes(32).toString("hex");
process.env.PUBLIC_BASE_URL = "http://localhost:3002";

import { signPayload } from "../server/payments/provider";
import { loadPaymentConfig, PaymentNotConfiguredError } from "../server/payments/config";
import * as billing from "../server/payments/billing";
import { assertWithinPlanLimit, PlanLimitError } from "../server/plans";
import { pool } from "../server/db";

const RUN = Date.now().toString(36);
const email = (tag: string) => `${tag}-${RUN}@example.com`;
const url = process.env.DATABASE_URL!;
const SECRET = process.env.PAYMENT_WEBHOOK_SECRET!;
const eventIds: string[] = [];
const couponCodes: string[] = [];
let restA = 0;
let restB = 0;
let userA = 0;
let userB = 0;
let restC = 0;
let userC = 0;

async function q<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  const c = await mysql.createConnection(url);
  try {
    const [rows] = await c.query(sql, params);
    return rows as T[];
  } finally {
    await c.end();
  }
}

async function insertUser(tag: string): Promise<number> {
  const c = await mysql.createConnection(url);
  try {
    const [r] = await c.query<any>(
      "INSERT INTO users (username, email, password, full_name, is_active, email_verified_at) VALUES (?, ?, 'test-not-used', ?, 1, NOW())",
      [`bill-${tag}-${RUN}`, email(`bill-${tag}`), `Fatura ${tag}`],
    );
    return r.insertId;
  } finally {
    await c.end();
  }
}

async function insertRestaurant(tag: string, ownerId: number): Promise<number> {
  const c = await mysql.createConnection(url);
  try {
    const [r] = await c.query<any>(
      "INSERT INTO restaurants (name, address, owner_user_id, plan_code, currency) VALUES (?, 'Test adresi', ?, 'free', 'TRY')",
      [`Fatura Test ${tag} ${RUN}`, ownerId],
    );
    await c.query("UPDATE users SET restaurant_id = ? WHERE id = ?", [r.insertId, ownerId]);
    return r.insertId;
  } finally {
    await c.end();
  }
}

const eventBody = (type: string, providerRef: string, extra: Record<string, unknown> = {}) => {
  const id = `evt_${randomUUID()}`;
  eventIds.push(id);
  return Buffer.from(JSON.stringify({ id, type, providerRef, ...extra }));
};
const card = (last4 = "4242") => ({ card: { token: `mock_tok_${last4}_${randomBytes(6).toString("hex")}`, brand: "TEST VISA", last4 } });

/** Delivers a correctly signed webhook through the real verification path. */
async function deliver(type: "payment.succeeded" | "payment.failed", providerRef: string, extra: Record<string, unknown> = {}) {
  const raw = eventBody(type, providerRef, extra);
  return billing.handleWebhook(raw, signPayload(SECRET, raw, Math.floor(Date.now() / 1000)));
}

async function checkoutRef(restaurantId: number, userId: number, planCode: string, interval: "monthly" | "yearly", extra: Record<string, unknown> = {}) {
  const s = await billing.startCheckout({ restaurantId, userId, planCode, interval, kind: "subscription", ...extra });
  const [p] = await q<{ provider_ref: string }>("SELECT provider_ref FROM payments WHERE id = ?", [s.paymentId]);
  return { session: s, ref: p.provider_ref };
}

before(async () => {
  userA = await insertUser("a");
  restA = await insertRestaurant("A", userA);
  userB = await insertUser("b");
  restB = await insertRestaurant("B", userB);
});

after(async () => {
  const ids = [restA, restB, restC].filter(Boolean).join(",");
  if (ids) {
    await q(`DELETE FROM webhook_events WHERE event_id IN (${eventIds.map(() => "?").join(",") || "''"})`, eventIds);
    await q(`DELETE FROM payments WHERE restaurant_id IN (${ids})`);
    await q(`DELETE FROM payment_methods WHERE restaurant_id IN (${ids})`);
    await q(`DELETE FROM subscriptions WHERE restaurant_id IN (${ids})`);
    await q(`DELETE FROM tables WHERE restaurant_id IN (${ids})`);
    await q(`DELETE FROM audit_logs WHERE restaurant_id IN (${ids})`);
    await q(`UPDATE users SET restaurant_id = NULL WHERE restaurant_id IN (${ids})`);
    await q(`DELETE FROM restaurants WHERE id IN (${ids})`);
  }
  if (couponCodes.length) await q(`DELETE FROM coupons WHERE code IN (${couponCodes.map(() => "?").join(",")})`, couponCodes);
  await q("DELETE FROM users WHERE email LIKE ?", [`%-${RUN}@example.com`]);
  await pool.end();
});

// ---------- configuration safety ----------

test("ödeme yapılandırması: canlı modda mock ve kimliksiz gerçek sağlayıcılar başlatmayı reddeder", () => {
  assert.throws(() => loadPaymentConfig({ PAYMENT_PROVIDER: "mock", PAYMENT_MODE: "live" } as any), /PAYMENT_MODE=live/);
  // Canlı mod, gerçek sağlayıcının kimlik bilgilerini zorunlu kılar; bilgisiysen reddedilir.
  assert.throws(() => loadPaymentConfig({ PAYMENT_PROVIDER: "iyzico", PAYMENT_MODE: "live" } as any), /IYZICO_API_KEY/);
  assert.throws(() => loadPaymentConfig({ PAYMENT_PROVIDER: "stripe", PAYMENT_MODE: "live" } as any), /STRIPE_SECRET_KEY/);
  assert.throws(() => loadPaymentConfig({ PAYMENT_PROVIDER: "paytr", PAYMENT_MODE: "live" } as any), /PAYTR_MERCHANT_ID/);
  assert.throws(() => loadPaymentConfig({ PAYMENT_PROVIDER: "bilinmeyen" } as any), /geçersiz/);
  const none = loadPaymentConfig({} as any);
  assert.equal(none.provider, "none");
  assert.equal(loadPaymentConfig({ PAYMENT_PROVIDER: "mock", PAYMENT_WEBHOOK_SECRET: "kisa" } as any).webhookSecret, null);
});

test("sağlayıcı yapılandırılmadığında ödeme başlatılamaz (503, hiçbir kayıt oluşmaz)", async () => {
  const before = (await q("SELECT COUNT(*) n FROM payments WHERE restaurant_id = ?", [restA]))[0].n;
  await assert.rejects(
    billing.startCheckout({ restaurantId: restA, userId: userA, planCode: "starter", interval: "monthly", kind: "subscription", cfg: { provider: "none", mode: "test", webhookSecret: null } }),
    (e: any) => e instanceof PaymentNotConfiguredError && e.status === 503,
  );
  const after = (await q("SELECT COUNT(*) n FROM payments WHERE restaurant_id = ?", [restA]))[0].n;
  assert.equal(after, before);
});

// ---------- server-side pricing and coupons ----------

test("fiyat sunucudaki plan tablosundan hesaplanır; KDV ayrıştırılır", async () => {
  const q1 = await billing.quote({ planCode: "starter", interval: "monthly" });
  const [plan] = await q<{ price_monthly: string; price_yearly: string }>("SELECT price_monthly, price_yearly FROM plans WHERE code='starter'");
  assert.equal(q1.subtotal, Math.round(Number(plan.price_monthly) * 100));
  assert.equal(q1.amount, q1.subtotal);
  assert.equal(q1.taxAmount, q1.amount - Math.round(q1.amount / 1.2));
  const yearly = await billing.quote({ planCode: "starter", interval: "yearly" });
  assert.equal(yearly.subtotal, Math.round(Number(plan.price_yearly) * 100));
});

test("satın alınamaz plan (fiyat 0) ve geçersiz aralık reddedilir", async () => {
  await assert.rejects(billing.quote({ planCode: "enterprise", interval: "monthly" }), (e: any) => e.code === "NOT_PURCHASABLE");
  await assert.rejects(billing.quote({ planCode: "starter", interval: "weekly" }), (e: any) => e.code === "BAD_INTERVAL");
  await assert.rejects(billing.quote({ planCode: "yok", interval: "monthly" }), (e: any) => e.code === "PLAN_NOT_FOUND");
});

test("kupon: yüzde indirim uygulanır; süresi dolmuş, pasif ve limiti dolmuş kupon reddedilir", async () => {
  const code = `T${RUN.toUpperCase()}P10`;
  const code2 = `T${RUN.toUpperCase()}EXP`;
  const code3 = `T${RUN.toUpperCase()}LIM`;
  const code4 = `T${RUN.toUpperCase()}OFF`;
  couponCodes.push(code, code2, code3, code4);
  await q("INSERT INTO coupons (code, percent_off, is_active) VALUES (?, 10, 1)", [code]);
  await q("INSERT INTO coupons (code, percent_off, valid_until, is_active) VALUES (?, 10, DATE_SUB(NOW(), INTERVAL 1 DAY), 1)", [code2]);
  await q("INSERT INTO coupons (code, percent_off, max_redemptions, redemptions, is_active) VALUES (?, 10, 1, 1, 1)", [code3]);
  await q("INSERT INTO coupons (code, amount_off, is_active) VALUES (?, 50.00, 1)", [code4]);

  const base = await billing.quote({ planCode: "starter", interval: "monthly" });
  const disc = await billing.quote({ planCode: "starter", interval: "monthly", couponCode: code.toLowerCase() });
  assert.equal(disc.discount, Math.round(base.subtotal * 0.1));
  assert.equal(disc.amount, base.subtotal - disc.discount);
  const amt = await billing.quote({ planCode: "starter", interval: "monthly", couponCode: code4 });
  assert.equal(amt.discount, 5000);

  await assert.rejects(billing.quote({ planCode: "starter", interval: "monthly", couponCode: code2 }), (e: any) => e.code === "COUPON_INVALID");
  await assert.rejects(billing.quote({ planCode: "starter", interval: "monthly", couponCode: code3 }), (e: any) => e.code === "COUPON_EXHAUSTED");
  await assert.rejects(billing.quote({ planCode: "starter", interval: "monthly", couponCode: "YOKBOYLE" }), (e: any) => e.code === "COUPON_INVALID");
  await q("UPDATE coupons SET is_active = 0 WHERE code = ?", [code]);
  await assert.rejects(billing.quote({ planCode: "starter", interval: "monthly", couponCode: code }), (e: any) => e.code === "COUPON_INVALID");
  await q("UPDATE coupons SET is_active = 1 WHERE code = ?", [code]);
});

// ---------- checkout and ownership ----------

test("yalnızca işletme sahibi ödeme başlatabilir; başkasının işletmesi 403", async () => {
  await assert.rejects(
    billing.startCheckout({ restaurantId: restA, userId: userB, planCode: "starter", interval: "monthly", kind: "subscription" }),
    (e: any) => e.status === 403 && e.code === "NOT_OWNER",
  );
});

test("checkout oturumu bekleyen (pending) ödeme oluşturur ve yönlendirme adresi test sayfasını gösterir", async () => {
  const { session, ref } = await checkoutRef(restA, userA, "starter", "monthly", { idempotencyKey: `key-${RUN}-first` });
  assert.match(session.redirectUrl, /\/odeme\/test\?ref=mock_[a-f0-9]{24}$/);
  assert.equal(Number(session.amount), (await billing.quote({ planCode: "starter", interval: "monthly" })).amount / 100);
  const [p] = await q<{ status: string }>("SELECT status FROM payments WHERE id = ?", [session.paymentId]);
  assert.equal(p.status, "pending");
  assert.match(ref, /^mock_/);
});

test("Idempotency-Key: aynı anahtar aynı ödemeyi döndürür; farklı istek 409", async () => {
  const again = await billing.startCheckout({ restaurantId: restA, userId: userA, planCode: "starter", interval: "monthly", kind: "subscription", idempotencyKey: `key-${RUN}-first` });
  const first = (await q("SELECT id FROM payments WHERE idempotency_key = ?", [`${restA}:key-${RUN}-first`]))[0];
  assert.equal(again.paymentId, first.id);
  assert.equal(again.reused, true);
  await assert.rejects(
    billing.startCheckout({ restaurantId: restA, userId: userA, planCode: "pro", interval: "monthly", kind: "subscription", idempotencyKey: `key-${RUN}-first` }),
    (e: any) => e.code === "IDEMPOTENCY_CONFLICT",
  );
});

// ---------- webhooks: signature, replay, success, failure ----------

test("webhook: imzasız, yanlış imzalı ve eski zaman damgalı istekler 401", async () => {
  const { ref } = await checkoutRef(restA, userA, "starter", "monthly");
  const raw = eventBody("payment.succeeded", ref, card());
  await assert.rejects(billing.handleWebhook(raw, undefined), (e: any) => e.status === 401);
  await assert.rejects(billing.handleWebhook(raw, signPayload("baska-bir-gizli-anahtar-0000000000000000", raw, Math.floor(Date.now() / 1000))), (e: any) => e.status === 401);
  const oldT = Math.floor(Date.now() / 1000) - 3600;
  await assert.rejects(billing.handleWebhook(raw, signPayload(SECRET, raw, oldT)), (e: any) => e.status === 401);
  // Body tampered after signing
  const sig = signPayload(SECRET, raw, Math.floor(Date.now() / 1000));
  const tampered = Buffer.from(raw.toString().replace("payment.succeeded", "payment.failed"));
  await assert.rejects(billing.handleWebhook(tampered, sig), (e: any) => e.status === 401);
  const [p] = await q<{ status: string }>("SELECT status FROM payments WHERE provider_ref = ?", [ref]);
  assert.equal(p.status, "pending", "geçersiz webhook hiçbir durumu değiştirmemeli");
});

test("başarılı ödeme: abonelik açılır, plan güncellenir, fatura no ve kart (yalnızca son 4 hane) kaydedilir", async () => {
  const { session, ref } = await checkoutRef(restA, userA, "starter", "monthly");
  const res = await deliver("payment.succeeded", ref, card("4242"));
  assert.equal(res.duplicate, false);
  const [p] = await q<any>("SELECT status, invoice_no, subscription_id, paid_at FROM payments WHERE id = ?", [session.paymentId]);
  assert.equal(p.status, "succeeded");
  assert.match(p.invoice_no, /^F\d{4}\d{8}$/);
  assert.ok(p.paid_at);
  const [r] = await q<{ plan_code: string }>("SELECT plan_code FROM restaurants WHERE id = ?", [restA]);
  assert.equal(r.plan_code, "starter");
  const [s] = await q<any>("SELECT status, plan_code, `interval`, current_period_end > NOW() AS future FROM subscriptions WHERE id = ?", [p.subscription_id]);
  assert.equal(s.status, "active");
  assert.equal(s.plan_code, "starter");
  assert.equal(Number(s.future), 1);
  const [pm] = await q<any>("SELECT last4, brand, is_default FROM payment_methods WHERE restaurant_id = ? AND is_default = 1", [restA]);
  assert.equal(pm.last4, "4242");
  assert.equal(pm.brand, "TEST VISA");
  const [c] = await q<any>("SELECT COUNT(*) n FROM payment_methods WHERE restaurant_id = ?", [restA]);
  assert.ok(Number(c.n) >= 1);
});

test("aynı webhook olayı tekrar gelirse (replay) ikinci kez işlenmez", async () => {
  const { ref } = await checkoutRef(restB, userB, "starter", "monthly");
  const raw = eventBody("payment.succeeded", ref, card());
  const sig = signPayload(SECRET, raw, Math.floor(Date.now() / 1000));
  const first = await billing.handleWebhook(raw, sig);
  const second = await billing.handleWebhook(raw, sig);
  assert.equal(first.duplicate, false);
  assert.equal(second.duplicate, true);
  const subs = await q("SELECT id FROM subscriptions WHERE restaurant_id = ?", [restB]);
  assert.equal(subs.length, 1, "tek abonelik oluşmalı");
  const [pay] = await q<any>("SELECT invoice_no FROM payments WHERE provider_ref = ?", [ref]);
  assert.ok(pay.invoice_no);
});

test("başarısız yükseltme ödemesi: plan ve abonelik değişmez, ödeme failed olur", async () => {
  // Restaurant B is on starter (active). An upgrade to pro is attempted and the card is declined.
  const up = await billing.changePlan({ restaurantId: restB, userId: userB, planCode: "pro", interval: "monthly" });
  assert.equal(up.mode, "checkout");
  const [pay] = await q<{ provider_ref: string }>("SELECT provider_ref FROM payments WHERE id = ?", [up.paymentId]);
  await deliver("payment.failed", pay.provider_ref, { reason: "card_declined" });
  const [p] = await q<any>("SELECT status, failure_reason FROM payments WHERE id = ?", [up.paymentId]);
  assert.equal(p.status, "failed");
  assert.equal(p.failure_reason, "card_declined");
  const [r] = await q<{ plan_code: string }>("SELECT plan_code FROM restaurants WHERE id = ?", [restB]);
  assert.equal(r.plan_code, "starter");
  const [s] = await q<{ status: string; plan_code: string }>("SELECT status, plan_code FROM subscriptions WHERE restaurant_id = ? ORDER BY id DESC LIMIT 1", [restB]);
  assert.equal(s.status, "active");
  assert.equal(s.plan_code, "starter");
});

test("başarılı ödeme sonrası plan limiti güncellenir (Free 10 masa → yükseltme sonrası daha fazla masa)", async () => {
  // Restaurant A is on starter (see above). Fill it to the starter limit, then upgrade.
  const [starter] = await q<{ max_tables: number }>("SELECT max_tables FROM plans WHERE code='starter'");
  const [pro] = await q<{ max_tables: number }>("SELECT max_tables FROM plans WHERE code='pro'");
  const current = (await q("SELECT COUNT(*) n FROM tables WHERE restaurant_id = ?", [restA]))[0].n;
  for (let i = Number(current); i < starter.max_tables; i++) {
    await q("INSERT INTO tables (restaurant_id, name, capacity) VALUES (?, ?, 2)", [restA, `T${i}`]);
  }
  await assert.rejects(assertWithinPlanLimit(restA, "tables"), PlanLimitError);

  const up = await billing.changePlan({ restaurantId: restA, userId: userA, planCode: "pro", interval: "monthly" });
  assert.equal(up.mode, "checkout");
  const [pay] = await q<{ provider_ref: string }>("SELECT provider_ref FROM payments WHERE id = ?", [up.paymentId]);
  await deliver("payment.succeeded", pay.provider_ref, card());
  const [r] = await q<{ plan_code: string }>("SELECT plan_code FROM restaurants WHERE id = ?", [restA]);
  assert.equal(r.plan_code, "pro");
  await assertWithinPlanLimit(restA, "tables"); // no throw: pro allows more
  assert.ok(pro.max_tables > starter.max_tables);
});

test("düşürme dönem sonunda uygulanır; yenileme ücretlendirir ve planı değiştirir", async () => {
  const down = await billing.changePlan({ restaurantId: restA, userId: userA, planCode: "starter", interval: "monthly" });
  assert.equal(down.mode, "scheduled");
  const [r0] = await q<{ plan_code: string }>("SELECT plan_code FROM restaurants WHERE id = ?", [restA]);
  assert.equal(r0.plan_code, "pro", "dönem bitmeden plan düşmez");

  await q("UPDATE subscriptions SET current_period_end = DATE_SUB(NOW(), INTERVAL 1 MINUTE) WHERE restaurant_id = ? AND status = 'active'", [restA]);
  const stats = await billing.runBillingCycle();
  assert.ok(stats.renewed >= 1);
  const [r1] = await q<{ plan_code: string }>("SELECT plan_code FROM restaurants WHERE id = ?", [restA]);
  assert.equal(r1.plan_code, "starter");
  const [ren] = await q<any>("SELECT status, kind, plan_code FROM payments WHERE restaurant_id = ? AND kind = 'renewal' ORDER BY id DESC LIMIT 1", [restA]);
  assert.equal(ren.status, "succeeded");
  assert.equal(ren.plan_code, "starter");
  // Running again immediately must not charge twice (period already renewed)
  await billing.runBillingCycle();
  const n = (await q("SELECT COUNT(*) n FROM payments WHERE restaurant_id = ? AND kind = 'renewal'", [restA]))[0].n;
  assert.equal(Number(n), 1);
});

test("yenileme başarısız olursa: past_due, kontrollü yeniden deneme, son denemede abonelik iptal ve Free", async () => {
  // Make the default card a declining one, then let the period end.
  await q("UPDATE payment_methods SET token = CONCAT('mock_tok_0002_', id) WHERE restaurant_id = ? AND is_default = 1", [restB]);
  await q("UPDATE subscriptions SET current_period_end = DATE_SUB(NOW(), INTERVAL 1 MINUTE) WHERE restaurant_id = ? AND status = 'active'", [restB]);

  await billing.runBillingCycle();
  let [s] = await q<any>("SELECT status FROM subscriptions WHERE restaurant_id = ? ORDER BY id DESC LIMIT 1", [restB]);
  assert.equal(s.status, "past_due");
  let [p] = await q<any>("SELECT status, attempts, next_retry_at > NOW() AS later FROM payments WHERE restaurant_id = ? AND kind = 'renewal' ORDER BY id DESC LIMIT 1", [restB]);
  assert.equal(p.status, "failed");
  assert.equal(p.attempts, 1);
  assert.equal(Number(p.later), 1, "yeniden deneme ileri bir tarihe planlanmalı");

  // Retry #2 (time travel: move the retry time into the past)
  await q("UPDATE payments SET next_retry_at = DATE_SUB(NOW(), INTERVAL 1 MINUTE) WHERE restaurant_id = ? AND kind = 'renewal'", [restB]);
  await billing.runBillingCycle();
  [p] = await q<any>("SELECT status, attempts FROM payments WHERE restaurant_id = ? AND kind = 'renewal' ORDER BY id DESC LIMIT 1", [restB]);
  assert.equal(p.attempts, 2);
  assert.equal(p.status, "failed");

  // Retry #3 (last): subscription is cancelled and the business falls back to Free
  await q("UPDATE payments SET next_retry_at = DATE_SUB(NOW(), INTERVAL 1 MINUTE) WHERE restaurant_id = ? AND kind = 'renewal'", [restB]);
  await billing.runBillingCycle();
  [p] = await q<any>("SELECT attempts FROM payments WHERE restaurant_id = ? AND kind = 'renewal' ORDER BY id DESC LIMIT 1", [restB]);
  assert.equal(p.attempts, 3);
  [s] = await q<any>("SELECT status FROM subscriptions WHERE restaurant_id = ? ORDER BY id DESC LIMIT 1", [restB]);
  assert.equal(s.status, "canceled");
  const [r] = await q<{ plan_code: string }>("SELECT plan_code FROM restaurants WHERE id = ?", [restB]);
  assert.equal(r.plan_code, "free");
});

test("iptal: dönem sonunda abonelik kapanır ve plan Free olur; iptal geri alınabilir", async () => {
  // Restaurant A has an active subscription (starter, renewed above). Cancel at period end, then undo, then cancel for real.
  await billing.setCancelAtPeriodEnd(restA, userA, true);
  let [s] = await q<any>("SELECT cancel_at_period_end FROM subscriptions WHERE restaurant_id = ? AND status IN ('active','past_due')", [restA]);
  assert.equal(Number(s.cancel_at_period_end), 1);
  await billing.setCancelAtPeriodEnd(restA, userA, false);
  [s] = await q<any>("SELECT cancel_at_period_end FROM subscriptions WHERE restaurant_id = ? AND status IN ('active','past_due')", [restA]);
  assert.equal(Number(s.cancel_at_period_end), 0);

  await billing.setCancelAtPeriodEnd(restA, userA, true);
  await q("UPDATE subscriptions SET current_period_end = DATE_SUB(NOW(), INTERVAL 1 MINUTE) WHERE restaurant_id = ? AND status = 'active'", [restA]);
  await billing.runBillingCycle();
  [s] = await q<any>("SELECT status FROM subscriptions WHERE restaurant_id = ? ORDER BY id DESC LIMIT 1", [restA]);
  assert.equal(s.status, "canceled");
  const [r] = await q<{ plan_code: string }>("SELECT plan_code FROM restaurants WHERE id = ?", [restA]);
  assert.equal(r.plan_code, "free");
});

test("iade: yalnızca başarılı ödeme iade edilir; ikinci iade reddedilir", async () => {
  const [p] = await q<{ id: number }>("SELECT id FROM payments WHERE restaurant_id = ? AND status = 'succeeded' ORDER BY id LIMIT 1", [restA]);
  const r = await billing.refundPayment(p.id, userA);
  assert.equal(r.status, "refunded");
  await assert.rejects(billing.refundPayment(p.id, userA), (e: any) => e.code === "NOT_REFUNDABLE");
});

test("kiracı izolasyonu: B'nin geçmişinde A'nın ödemeleri görünmez", async () => {
  const hist = await billing.listPayments(restB);
  assert.ok(hist.length > 0);
  const [aRow] = await q<{ id: number }>("SELECT id FROM payments WHERE restaurant_id = ? LIMIT 1", [restA]);
  assert.ok(!hist.some((h) => h.id === aRow.id));
});

test("takılan pending ödeme kurtarılır: 24 saatten eski pending kayıt failed olur ve denemeye alınır", async () => {
  userC = await insertUser("c");
  restC = await insertRestaurant("C", userC);
  const ins = (await q<any>(
    "INSERT INTO subscriptions (restaurant_id, plan_code, `interval`, status, current_period_end) VALUES (?, 'starter', 'monthly', 'active', DATE_ADD(NOW(), INTERVAL 20 DAY))",
    [restC],
  )) as any;
  const subId = ins.insertId as number;
  await q(
    `INSERT INTO payments (restaurant_id, subscription_id, kind, plan_code, \`interval\`, subtotal, discount, amount, tax_amount, currency, status, provider, idempotency_key, attempts, created_at)
     VALUES (?, ?, 'renewal', 'starter', 'monthly', 299.00, 0, 299.00, 49.83, 'TRY', 'pending', 'mock', ?, 1, DATE_SUB(NOW(), INTERVAL 2 DAY))`,
    [restC, subId, `stuck:${restC}:${RUN}`],
  );
  const stats = await billing.runBillingCycle();
  assert.ok(stats.stuckClosed >= 1, `stuckClosed=${stats.stuckClosed}`);
  const [p] = await q<any>("SELECT status, failure_reason, next_retry_at FROM payments WHERE restaurant_id = ? ORDER BY id DESC LIMIT 1", [restC]);
  assert.equal(p.status, "failed");
  assert.equal(p.failure_reason, "stuck_timeout");
  assert.ok(p.next_retry_at, "yeniden deneme zamanı atanmalı");
  const [s] = await q<any>("SELECT status FROM subscriptions WHERE id = ?", [subId]);
  assert.equal(s.status, "past_due");
});
