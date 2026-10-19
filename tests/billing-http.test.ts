// Faturalama HTTP uçları: gerçek çalışan sunucuya (BASE_URL) karşı.
// Önkoşul: sunucu PAYMENT_PROVIDER=mock, PAYMENT_MODE=test ve bu test süreciyle AYNI PAYMENT_WEBHOOK_SECRET ile başlatılmış olmalı.
// Tüm test verisi @example.com ile işaretlenir ve test sonunda silinir.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "crypto";
import "../server/env";
import mysql from "mysql2/promise";
import { signPayload } from "../server/payments/provider";

const BASE = process.env.BASE_URL ?? "http://localhost:3002";
const SECRET = process.env.PAYMENT_WEBHOOK_SECRET ?? "";
const RUN = Date.now().toString(36);
const emailA = `fh-a-${RUN}@example.com`;
const emailB = `fh-b-${RUN}@example.com`;
const emailAdmin = `fh-admin-${RUN}@example.com`;
const couponCode = `HT${RUN.toUpperCase()}`.slice(0, 20);
const eventIds: string[] = [];

type Resp = { status: number; json: any; text: string; sid?: string };

async function call(method: string, path: string, opts: { body?: unknown; cookie?: string; raw?: string; headers?: Record<string, string> } = {}): Promise<Resp> {
  const headers: Record<string, string> = { ...(opts.headers ?? {}) };
  if (opts.cookie) headers["cookie"] = opts.cookie;
  let body: string | undefined;
  if (opts.raw !== undefined) body = opts.raw;
  else if (opts.body !== undefined) {
    body = JSON.stringify(opts.body);
    headers["content-type"] = "application/json";
  }
  const res = await fetch(BASE + path, { method, headers, body, redirect: "manual" });
  const sid = (res.headers.getSetCookie?.() ?? []).map((c) => c.split(";")[0]).find((c) => c.startsWith("mtm.sid="));
  const text = await res.text();
  let json: any;
  try { json = text ? JSON.parse(text) : undefined; } catch { /* non-json */ }
  return { status: res.status, json, text, sid };
}

async function register(email: string, business: string): Promise<{ cookie: string; restaurantId: number }> {
  const r = await call("POST", "/api/auth/register", { body: { email, password: "Test-Parola-123", fullName: "Fatura Test", businessName: business } });
  assert.equal(r.status, 201, `register failed: ${r.text}`);
  const me = await call("GET", "/api/auth/user", { cookie: r.sid });
  return { cookie: r.sid!, restaurantId: me.json.restaurant?.id ?? me.json.restaurantId };
}

async function dbq<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  const c = await mysql.createConnection(process.env.DATABASE_URL!);
  try {
    const [rows] = await c.query(sql, params);
    return rows as T[];
  } finally {
    await c.end();
  }
}

let A: { cookie: string; restaurantId: number };
let B: { cookie: string; restaurantId: number };
let ADM: { cookie: string };

before(async () => {
  A = await register(emailA, `Fatura HTTP A ${RUN}`);
  B = await register(emailB, `Fatura HTTP B ${RUN}`);
  ADM = await register(emailAdmin, `Fatura HTTP Admin ${RUN}`);
  await dbq("UPDATE users SET is_platform_admin = 1 WHERE email = ?", [emailAdmin]);
});

after(async () => {
  const ids = [A?.restaurantId, B?.restaurantId, ADM?.restaurantId].filter(Boolean).join(",");
  if (ids) {
    await dbq(`DELETE FROM webhook_events WHERE event_id IN (${eventIds.map(() => "?").join(",") || "''"})`, eventIds);
    await dbq(`DELETE FROM payments WHERE restaurant_id IN (${ids})`);
    await dbq(`DELETE FROM payment_methods WHERE restaurant_id IN (${ids})`);
    await dbq(`DELETE FROM subscriptions WHERE restaurant_id IN (${ids})`);
    await dbq(`DELETE FROM audit_logs WHERE restaurant_id IN (${ids})`);
    await dbq(`UPDATE users SET restaurant_id = NULL WHERE restaurant_id IN (${ids})`);
    await dbq(`DELETE FROM restaurants WHERE id IN (${ids})`);
  }
  await dbq("DELETE FROM coupons WHERE code = ?", [couponCode]);
  await dbq("DELETE FROM users WHERE email LIKE ?", [`fh-%-${RUN}@example.com`]);
});

test("yapılandırma uçları test modunu ve sağlayıcıyı bildirir; anonim overview 401", async () => {
  const cfg = await call("GET", "/api/billing/config");
  assert.equal(cfg.status, 200);
  assert.equal(cfg.json.testMode, true);
  assert.equal(cfg.json.provider, "mock");
  assert.ok(!JSON.stringify(cfg.json).toLowerCase().includes("secret"), "gizli değer yanıtta olmamalı");
  const anon = await call("GET", "/api/billing/overview");
  assert.equal(anon.status, 401);
});

test("işletme sahibi plan seçer; JSON dışı gövde 415; satın alınamaz plan 400", async () => {
  const bad = await call("POST", "/api/billing/checkout", { cookie: A.cookie, raw: "planCode=starter", headers: { "content-type": "application/x-www-form-urlencoded" } });
  assert.equal(bad.status, 415);
  const enterprise = await call("POST", "/api/billing/checkout", { cookie: B.cookie, body: { planCode: "enterprise", interval: "monthly" } });
  assert.equal(enterprise.status, 400);
  assert.equal(enterprise.json.code, "NOT_PURCHASABLE");
});

test("checkout: istemci tutarı yok sayılır, Idempotency-Key ile tekrar aynı oturum döner", async () => {
  const key = `http-${RUN}-key1`;
  const r1 = await call("POST", "/api/billing/checkout", {
    cookie: A.cookie,
    body: { planCode: "starter", interval: "monthly", amount: 1 }, // client-sent amount must be ignored
    headers: { "Idempotency-Key": key },
  });
  assert.equal(r1.status, 200, r1.text);
  assert.equal(Number(r1.json.amount), 299);
  assert.match(r1.json.redirectUrl, /\/odeme\/test\?ref=mock_/);
  const r2 = await call("POST", "/api/billing/checkout", { cookie: A.cookie, body: { planCode: "starter", interval: "monthly" }, headers: { "Idempotency-Key": key } });
  assert.equal(r2.status, 200);
  assert.equal(r2.json.paymentId, r1.json.paymentId);
  assert.equal(r2.json.reused, true);
});

test("test sayfası oturumu okunur; imzasız webhook 401; imzalı webhook işlenir ve tekrarı duplicate döner", async () => {
  const [p] = await dbq<{ provider_ref: string }>("SELECT provider_ref FROM payments WHERE restaurant_id = ? AND status = 'pending' ORDER BY id DESC LIMIT 1", [A.restaurantId]);
  const sess = await call("GET", `/api/billing/test/session/${p.provider_ref}`);
  assert.equal(sess.status, 200);
  assert.equal(sess.json.planCode, "starter");

  const id = `evt_${randomUUID()}`;
  eventIds.push(id);
  const body = JSON.stringify({ id, type: "payment.succeeded", providerRef: p.provider_ref, card: { token: `mock_tok_4242_${RUN}`, brand: "TEST VISA", last4: "4242" } });

  const unsigned = await call("POST", "/api/billing/webhook", { raw: body, headers: { "content-type": "application/json" } });
  assert.equal(unsigned.status, 401);
  assert.equal(unsigned.json.code, "BAD_SIGNATURE");

  if (!SECRET) throw new Error("PAYMENT_WEBHOOK_SECRET bu test sürecinde tanımlı değil; sunucuyla aynı değer verilmeli.");
  const sig = signPayload(SECRET, Buffer.from(body), Math.floor(Date.now() / 1000));
  const signed = await call("POST", "/api/billing/webhook", { raw: body, headers: { "content-type": "application/json", "x-payment-signature": sig } });
  assert.equal(signed.status, 200, signed.text);
  assert.equal(signed.json.duplicate, false);
  const again = await call("POST", "/api/billing/webhook", { raw: body, headers: { "content-type": "application/json", "x-payment-signature": sig } });
  assert.equal(again.status, 200);
  assert.equal(again.json.duplicate, true);

  const ov = await call("GET", "/api/billing/overview", { cookie: A.cookie });
  assert.equal(ov.json.planCode, "starter");
  assert.equal(ov.json.subscription.status, "active");
  assert.equal(ov.json.paymentMethod.last4, "4242");
});

test("test modu tamamlama: başarısız yükseltme plan değiştirmez; başkasının oturumu 404", async () => {
  const up = await call("POST", "/api/billing/change-plan", { cookie: A.cookie, body: { planCode: "pro", interval: "monthly" } });
  assert.equal(up.status, 200, up.text);
  assert.equal(up.json.mode, "checkout");
  const ref = (await dbq<{ provider_ref: string }>("SELECT provider_ref FROM payments WHERE id = ?", [up.json.paymentId]))[0].provider_ref;

  const foreign = await call("POST", "/api/billing/test/complete", { cookie: B.cookie, body: { ref, outcome: "success" } });
  assert.equal(foreign.status, 404);

  const fail = await call("POST", "/api/billing/test/complete", { cookie: A.cookie, body: { ref, outcome: "fail" } });
  assert.equal(fail.status, 200, fail.text);
  const ov = await call("GET", "/api/billing/overview", { cookie: A.cookie });
  assert.equal(ov.json.planCode, "starter");

  const hist = await call("GET", "/api/billing/history", { cookie: A.cookie });
  assert.equal(hist.status, 200);
  assert.ok(hist.json.some((h: any) => h.status === "failed"));
  assert.ok(hist.json.some((h: any) => h.status === "succeeded"));
});

test("yönetici: kupon oluşturma (tekrar 409, çift indirim türü 400), kullanıcı 403", async () => {
  const notAdmin = await call("GET", "/api/admin/coupons", { cookie: A.cookie });
  assert.equal(notAdmin.status, 403);
  const both = await call("POST", "/api/admin/coupons", { cookie: ADM.cookie, body: { code: `${couponCode}X`, percentOff: 10, amountOff: 5 } });
  assert.equal(both.status, 400);
  const made = await call("POST", "/api/admin/coupons", { cookie: ADM.cookie, body: { code: couponCode, percentOff: 10, validDays: 30 } });
  assert.equal(made.status, 201, made.text);
  const dup = await call("POST", "/api/admin/coupons", { cookie: ADM.cookie, body: { code: couponCode, percentOff: 5 } });
  assert.equal(dup.status, 409);
  const prev = await call("POST", "/api/billing/quote", { cookie: B.cookie, body: { planCode: "starter", interval: "monthly", couponCode: couponCode.toLowerCase() } });
  assert.equal(prev.status, 200);
  assert.equal(Number(prev.json.discount), 29.9);
  assert.equal(Number(prev.json.amount), 269.1);
});

test("yönetici: başarılı ödeme iade edilir (mock), ikinci iade 409", async () => {
  const [p] = await dbq<{ id: number }>("SELECT id FROM payments WHERE restaurant_id = ? AND status = 'succeeded' LIMIT 1", [A.restaurantId]);
  const r1 = await call("POST", `/api/admin/payments/${p.id}/refund`, { cookie: ADM.cookie, body: {} });
  assert.equal(r1.status, 200, r1.text);
  assert.equal(r1.json.status, "refunded");
  const r2 = await call("POST", `/api/admin/payments/${p.id}/refund`, { cookie: ADM.cookie, body: {} });
  assert.equal(r2.status, 409);
});

test("kiracı izolasyonu: B'nin plan değişikliği ve iptali A'nın aboneliğine dokunmaz", async () => {
  const cancelB = await call("POST", "/api/billing/cancel", { cookie: B.cookie, body: {} });
  assert.equal(cancelB.status, 409); // B has no subscription
  const ovB = await call("GET", "/api/billing/overview", { cookie: B.cookie });
  assert.equal(ovB.json.planCode, "free");
  assert.equal(ovB.json.subscription, null);
});

test("yükseltmede proration: kalan dönem kredisi düşülür; ödeme sonrası plan değişir", async () => {
  const up = await call("POST", "/api/billing/change-plan", { cookie: A.cookie, body: { planCode: "business", interval: "monthly" } });
  assert.equal(up.status, 200, up.text);
  assert.equal(up.json.mode, "checkout");
  assert.equal(Number(up.json.subtotal), 1499);
  // Starter moments ago alındı: dönemin neredeyse tamamı kullanılmadı -> kredi ~299 TL
  assert.ok(Number(up.json.discount) >= 290, `kredi beklenenden az: ${up.json.discount}`);
  assert.ok(Number(up.json.amount) > 1190 && Number(up.json.amount) <= 1200, `net tutar: ${up.json.amount}`);

  const ref = (await dbq<{ provider_ref: string }>("SELECT provider_ref FROM payments WHERE id = ?", [up.json.paymentId]))[0].provider_ref;
  const done = await call("POST", "/api/billing/test/complete", { cookie: A.cookie, body: { ref, outcome: "success" } });
  assert.equal(done.status, 200, done.text);
  const ov = await call("GET", "/api/billing/overview", { cookie: A.cookie });
  assert.equal(ov.json.planCode, "business");
});

test("ödeme yöntemleri: listeleme, varsayılan yapma, silme; başkasının işletmesi 403", async () => {
  const list = await call("GET", "/api/billing/payment-methods", { cookie: A.cookie });
  assert.equal(list.status, 200);
  assert.ok(list.json.length >= 1);
  assert.ok(list.json.filter((m: any) => m.last4 === "4242").every((m: any) => m.brand === "TEST VISA"));

  await dbq(
    "INSERT INTO payment_methods (restaurant_id, provider, token, brand, last4, is_default) VALUES (?, 'mock', ?, 'TEST MC', '1111', 0)",
    [A.restaurantId, `mock_tok_1111_${RUN}`],
  );
  const list2 = await call("GET", "/api/billing/payment-methods", { cookie: A.cookie });
  const second = list2.json.find((m: any) => m.last4 === "1111");
  assert.ok(second, "eklenen kart listelenmeli");

  const foreign = await call("POST", `/api/billing/payment-methods/${second.id}/default`, { cookie: B.cookie, body: {} });
  assert.equal(foreign.status, 404, "başka kiracının kartı bulunamaz sayılmalı (kiracı izolasyonu)");

  const mk = await call("POST", `/api/billing/payment-methods/${second.id}/default`, { cookie: A.cookie, body: {} });
  assert.equal(mk.status, 200, mk.text);
  const list3 = await call("GET", "/api/billing/payment-methods", { cookie: A.cookie });
  assert.equal(list3.json.find((m: any) => m.last4 === "1111").isDefault, true);
  assert.ok(list3.json.filter((m: any) => m.last4 !== "1111").every((m: any) => m.isDefault === false));

  const del = await call("DELETE", `/api/billing/payment-methods/${second.id}`, { cookie: A.cookie });
  assert.equal(del.status, 200, del.text);
  const list4 = await call("GET", "/api/billing/payment-methods", { cookie: A.cookie });
  assert.equal(list4.json.filter((m: any) => m.last4 === "1111").length, 0);
  assert.ok(list4.json.some((m: any) => m.isDefault === true), "varsayılan silinince başka kart varsayılan olmalı");
});
