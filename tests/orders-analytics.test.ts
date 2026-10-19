// Halka açık sipariş + menü analitiği uçları: gerçek çalışan sunucuya (BASE_URL) karşı.
// Önkoşul: sunucu çalışıyor olmalı; test verisi @example.com ile işaretlenir ve test sonunda silinir.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import "../server/env";
import mysql from "mysql2/promise";

const BASE = process.env.BASE_URL ?? "http://localhost:3002";
const RUN = Date.now().toString(36);
const email = `oa-${RUN}@example.com`;
const slug = `test-isletme-${RUN}`;
const pool: mysql.Connection[] = [];

type Resp = { status: number; json: any; text: string; sid?: string };

async function call(method: string, path: string, opts: { body?: unknown; cookie?: string } = {}): Promise<Resp> {
  const headers: Record<string, string> = {};
  if (opts.cookie) headers["cookie"] = opts.cookie;
  let body: string | undefined;
  if (opts.body !== undefined) {
    body = JSON.stringify(opts.body);
    headers["content-type"] = "application/json";
  }
  const res = await fetch(BASE + path, { method, headers, body });
  const sid = (res.headers.getSetCookie?.() ?? []).map((c) => c.split(";")[0]).find((c) => c.startsWith("mtm.sid="));
  const text = await res.text();
  let json: any;
  try { json = text ? JSON.parse(text) : undefined; } catch { /* non-json */ }
  return { status: res.status, json, text, sid };
}

let cookie = "";
let restaurantId = 0;
const productIds: number[] = [];

before(async () => {
  const reg = await call("POST", "/api/auth/register", { body: { email, password: "Test-Parola-123", fullName: "Sipariş Test", businessName: `Test İşletme ${RUN}` } });
  assert.equal(reg.status, 201, reg.text);
  cookie = reg.sid ?? "";
  if (!cookie) {
    const login = await call("POST", "/api/auth/login", { body: { identifier: email, password: "Test-Parola-123" } });
    cookie = login.sid ?? "";
    assert.ok(cookie, "oturum çerezi alınamadı");
  }
  // Yayına alma e-posta doğrulaması ister; test kullanıcısını doğrulanmış işaretle (yalnız test verisi).
  {
    const c = await mysql.createConnection(process.env.DATABASE_URL!);
    await c.query("UPDATE users SET email_verified_at = NOW() WHERE email = ?", [email]);
    await c.end();
  }
  const me = await call("GET", "/api/auth/user", { cookie });
  restaurantId = me.json.restaurant?.id ?? me.json.restaurantId;
  assert.ok(restaurantId, "işletme id alınamadı");

  // Menüyü yayına al, siparişi aç, kategori ve ürünleri ekle (mutation yolları ile)
  const patch = await fetch(BASE + "/api/restaurant", {
    method: "PATCH", headers: { "content-type": "application/json", cookie },
    body: JSON.stringify({ isPublished: true, ordersEnabled: true }),
  });
  const patchBody = await patch.json().catch(() => ({}));
  assert.equal(patch.status, 200, JSON.stringify(patchBody));

  const mkCat = await fetch(BASE + "/api/categories", {
    method: "POST", headers: { "content-type": "application/json", cookie },
    body: JSON.stringify({ name: `Kategori ${RUN}`, slug: `kategori-${RUN}` }),
  });
  const cat = await mkCat.json().catch(() => ({}));
  assert.equal(mkCat.status, 201, JSON.stringify(cat));

  for (const name of [`Çorba ${RUN}`, `Kebap ${RUN}`]) {
    const mk = await fetch(BASE + "/api/products", {
      method: "POST", headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({ name, categoryId: cat.id, price: "100.00", isAvailable: true }),
    });
    const prod = await mk.json().catch(() => ({}));
    assert.equal(mk.status, 201, JSON.stringify(prod));
    productIds.push(prod.id);
  }
});

test("izleme uç noktası: yayınlanmamış slug sessizce 204, olay yazılmaz", async () => {
  const r = await call("POST", "/api/track", { body: { slug: `yok-${RUN}`, type: "menu_view" } });
  assert.equal(r.status, 204);
  const c = await conn();
  const [rows] = await c.query("SELECT COUNT(*) n FROM menu_events WHERE restaurant_id = ?", [restaurantId]);
  assert.equal((rows as any)[0].n, 0);
  await c.end();
});

test("menu_view ve qr_scan olayları sayılır; analitik özeti gerçek veri döner", async () => {
  assert.equal((await call("POST", "/api/track", { body: { slug, type: "menu_view" } })).status, 204);
  assert.equal((await call("POST", "/api/track", { body: { slug, type: "qr_scan" } })).status, 204);
  assert.equal((await call("POST", "/api/track", { body: { slug, type: "qr_scan" } })).status, 204);
  // geçersiz tip ve yabancı ürün sessizce yok sayılır
  assert.equal((await call("POST", "/api/track", { body: { slug, type: "hack" } })).status, 204);
  assert.equal((await call("POST", "/api/track", { body: { slug, type: "product_view", productId: 999999 } })).status, 204);

  const sum = await call("GET", "/api/analytics/summary?days=7", { cookie });
  assert.equal(sum.status, 200, sum.text);
  assert.equal(sum.json.totals.menuView, 1);
  assert.equal(sum.json.totals.qrScan, 2);
  assert.ok(Array.isArray(sum.json.daily) && sum.json.daily.length >= 1);
  assert.equal(sum.json.topProducts.length, 0);

  const anon = await call("GET", "/api/analytics/summary");
  assert.equal(anon.status, 401);
});

test("ürün görüntüleme olayı yalnızca kendi işletmemin ürünü için yazılır", async () => {
  assert.equal((await call("POST", "/api/track", { body: { slug, type: "product_view", productId: productIds[0] } })).status, 204);
  const sum = await call("GET", "/api/analytics/summary?days=7", { cookie });
  assert.equal(sum.json.totals.productView, 1);
  assert.equal(sum.json.topProducts[0]?.name.includes("Çorba"), true);
});

test("halka açık sipariş: sunucu fiyatı hesaplar, istemci tutarı yok sayılır", async () => {
  const res = await fetch(`${BASE}/api/public/menu/${slug}/orders`, {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({
      customerName: "Misafir Test", phone: "05551112233", note: null,
      items: [{ productId: productIds[0], quantity: 2 }, { productId: productIds[1], quantity: 1 }],
      totalAmount: "0.01", // istemci tutarı yok sayılmalı
    }),
  });
  const body = await res.json().catch(() => ({}));
  assert.equal(res.status, 201, JSON.stringify(body));
  // 3 × 100 = 300 ara toplam, 1.1 vergi => 330.00
  assert.equal(Number(body.totalAmount), 330);
  assert.equal(body.status, "pending");

  const c = await conn();
  const [items] = await c.query("SELECT product_id, quantity, price FROM order_items WHERE order_id = ?", [body.id]);
  assert.equal(items.length, 2);
  assert.equal(Number(items[0].price), 100);
  await c.end();
});

test("sipariş doğrulama: boş sepet 400, olmayan ürün 400, kapatılmış işletme 403", async () => {
  const empty = await fetch(`${BASE}/api/public/menu/${slug}/orders`, {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ customerName: "Misafir Test", phone: "05551112233", items: [] }),
  });
  assert.equal(empty.status, 400);

  const missing = await fetch(`${BASE}/api/public/menu/${slug}/orders`, {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ customerName: "Misafir Test", phone: "05551112233", items: [{ productId: 999999, quantity: 1 }] }),
  });
  assert.equal(missing.status, 400);

  // Siparişi kapat: toggle devre dışı bırakma
  await fetch(BASE + "/api/restaurant", {
    method: "PATCH", headers: { "content-type": "application/json", cookie },
    body: JSON.stringify({ ordersEnabled: false }),
  });
  const disabled = await fetch(`${BASE}/api/public/menu/${slug}/orders`, {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ customerName: "Misafir Test", phone: "05551112233", items: [{ productId: productIds[0], quantity: 1 }] }),
  });
  const dBody = await disabled.json().catch(() => ({}));
  assert.equal(disabled.status, 403, JSON.stringify(dBody));
  assert.equal(dBody.code, "ORDERS_DISABLED");

  // Kiracı izolasyonu: yayından kalkan menü 404 döner
  await fetch(BASE + "/api/restaurant", {
    method: "PATCH", headers: { "content-type": "application/json", cookie },
    body: JSON.stringify({ isPublished: false }),
  });
  const unpublished = await fetch(`${BASE}/api/public/menu/${slug}/orders`, {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ customerName: "Misafir Test", phone: "05551112233", items: [{ productId: productIds[0], quantity: 1 }] }),
  });
  assert.equal(unpublished.status, 404);
});

after(async () => {
  const c = await conn();
  await c.query("DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE restaurant_id = ?)", [restaurantId]);
  await c.query("DELETE FROM orders WHERE restaurant_id = ?", [restaurantId]);
  await c.query("DELETE FROM menu_events WHERE restaurant_id = ?", [restaurantId]);
  await c.query("DELETE FROM products WHERE restaurant_id = ?", [restaurantId]);
  await c.query("DELETE FROM categories WHERE restaurant_id = ?", [restaurantId]);
  await c.query("DELETE FROM tables WHERE restaurant_id = ?", [restaurantId]);
  await c.query("DELETE FROM payments WHERE restaurant_id = ?", [restaurantId]);
  await c.query("DELETE FROM payment_methods WHERE restaurant_id = ?", [restaurantId]);
  await c.query("DELETE FROM subscriptions WHERE restaurant_id = ?", [restaurantId]);
  await c.query("DELETE FROM audit_logs WHERE restaurant_id = ?", [restaurantId]);
  await c.query("UPDATE users SET restaurant_id = NULL WHERE restaurant_id = ?", [restaurantId]);
  await c.query("DELETE FROM restaurants WHERE id = ?", [restaurantId]);
  await c.query("DELETE FROM email_outbox WHERE to_address LIKE '%@example.com'");
  await c.end();
});

async function conn(): Promise<mysql.Connection> {
  const c = await mysql.createConnection(process.env.DATABASE_URL!);
  pool.push(c);
  return c;
}
