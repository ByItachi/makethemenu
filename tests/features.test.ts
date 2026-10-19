// Yeni özellikler (v6): CSV dışa aktarma, AI menü üretici, 3D model kotası, özel alan adı.
// Gerçek çalışan sunucuya (BASE_URL) karşı; test verisi @example.com ile işaretlenir ve temizlenir.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import "../server/env";
import mysql from "mysql2/promise";

const BASE = process.env.BASE_URL ?? "http://localhost:3002";
const RUN = Date.now().toString(36);
const email = `feat-${RUN}@example.com`;
const slug = `test-isletme-${RUN}`;
let conn: mysql.Connection;

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
  conn = await mysql.createConnection(process.env.DATABASE_URL!);
  const reg = await call("POST", "/api/auth/register", { body: { email, password: "Test-Parola-123", fullName: "Özellik Test", businessName: `Test İşletme ${RUN}` } });
  assert.equal(reg.status, 201, reg.text);
  cookie = reg.sid ?? "";
  if (!cookie) {
    const login = await call("POST", "/api/auth/login", { body: { identifier: email, password: "Test-Parola-123" } });
    cookie = login.sid ?? "";
  }
  await conn.query("UPDATE users SET email_verified_at = NOW() WHERE email = ?", [email]);
  await conn.query("UPDATE restaurants SET plan_code = 'pro' WHERE slug = ?", [slug]);
  // Halka açık uçlar (public menu, track) yalnızca yayınlanmış menülerde çalışır.
  const pub = await call("PATCH", "/api/restaurant", { cookie, body: { isPublished: true } });
  assert.equal(pub.status, 200, pub.text);
  const me = await call("GET", "/api/auth/user", { cookie });
  restaurantId = me.json.restaurant?.id ?? me.json.restaurantId;
  assert.ok(restaurantId, "işletme id alınamadı");

  const mkCat = await call("POST", "/api/categories", { cookie, body: { name: `Özellik Kategori ${RUN}`, slug: `ozellik-${RUN}` } });
  assert.equal(mkCat.status, 201, mkCat.text);
  for (const name of [`Ürün A ${RUN}`, `Ürün B ${RUN}`]) {
    const mk = await call("POST", "/api/products", { cookie, body: { name, categoryId: mkCat.json.id, price: "50.00", isAvailable: true } });
    assert.equal(mk.status, 201, mk.text);
    productIds.push(mk.json.id);
  }
});

after(async () => {
  // Test verisini temizle: önce çocuğunu null'la, sonra işletmeyi ve kullanıcıyı sil.
  try {
    if (restaurantId) {
      await conn.query("DELETE FROM restaurant_domains WHERE restaurant_id = ?", [restaurantId]);
      await conn.query("DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE restaurant_id = ?)", [restaurantId]);
      await conn.query("DELETE FROM orders WHERE restaurant_id = ?", [restaurantId]);
      await conn.query("DELETE FROM products WHERE restaurant_id = ?", [restaurantId]);
      await conn.query("DELETE FROM categories WHERE restaurant_id = ?", [restaurantId]);
      await conn.query("DELETE FROM menu_events WHERE restaurant_id = ?", [restaurantId]);
      await conn.query("UPDATE users SET restaurant_id = NULL WHERE restaurant_id = ?", [restaurantId]);
      await conn.query("UPDATE restaurants SET owner_user_id = NULL WHERE id = ?", [restaurantId]);
      await conn.query("DELETE FROM restaurants WHERE id = ?", [restaurantId]);
      await conn.query("DELETE FROM users WHERE email = ?", [email]);
    }
  } finally {
    await conn.end();
  }
});

test("CSV sipariş ihracı: oturum gerektirir, text/csv döner", async () => {
  const anon = await call("GET", "/api/orders/export");
  assert.equal(anon.status, 401);

  const res = await fetch(BASE + "/api/orders/export", { headers: { cookie } });
  assert.equal(res.status, 200);
  assert.match(res.headers.get("content-type") ?? "", /text\/csv/);
  assert.match(res.headers.get("content-disposition") ?? "", /siparisler-/);
  // res.text() UTF-8 çözümlemesinde BOM'u soyar; ham baytlardan bakıyoruz.
  const bytes = new Uint8Array(await res.arrayBuffer());
  assert.deepEqual(Array.from(bytes.slice(0, 3)), [0xef, 0xbb, 0xbf], "UTF-8 BOM eksik");
  const text = new TextDecoder().decode(bytes);
  assert.ok(text.includes("SiparisID,Tarih,Masa,Musteri,Telefon,Not,Durum,Toplam,Urunler"));
});

test("CSV analitik ihracı: günlük satırlar ve en çok görüntülenen ürünler", async () => {
  // bir olay yazalım ki ihracın gerçekten veri içerdiği görülsün
  await call("POST", "/api/track", { body: { slug, type: "menu_view" } });
  const res = await fetch(BASE + "/api/analytics/export?days=7", { headers: { cookie } });
  assert.equal(res.status, 200);
  const text = await res.text();
  assert.ok(text.includes("Tarih,Menu Goruntuleme,QR Tarama,Urun Goruntuleme"));
  assert.ok(text.split("\n").length >= 2);
});

test("AI menü üretici: anahtar yokken şablondan tutarlı taslak döner", async () => {
  const r = await call("POST", "/api/restaurant/ai/generate-menu", { cookie, body: { businessType: "Kafe", sections: 4, productsPerSection: 5 } });
  assert.equal(r.status, 200, r.text);
  assert.equal(r.json.source, process.env.AI_API_KEY || process.env.ABACUS_API_KEY ? "ai" : "template");
  assert.ok(r.json.draft.sections.length >= 3);
  const first = r.json.draft.sections[0];
  assert.ok(first.name.length >= 2);
  assert.ok(first.products.length >= 3);
  assert.ok(first.products.every((p: any) => typeof p.price === "number" && p.price >= 0));
});

test("AI taslağı uygulanır: kategori ve ürünler oluşur, plan limiti aşılmaz", async () => {
  const gen = await call("POST", "/api/restaurant/ai/generate-menu", { cookie, body: { businessType: "Restoran", sections: 3, productsPerSection: 4 } });
  const r = await call("POST", "/api/restaurant/ai/apply-menu", { cookie, body: { draft: gen.json.draft } });
  assert.equal(r.status, 201, r.text);
  assert.ok(r.json.createdProducts >= 1);
  assert.ok(r.json.createdCategories >= 1);

  const bad = await call("POST", "/api/restaurant/ai/apply-menu", { cookie, body: { draft: { sections: [{ name: "X", products: [] }] } } });
  assert.equal(bad.status, 400);
});

test("3D model: geçersiz URL 400, geçerli glb kabul edilir", async () => {
  const bad = await call("PATCH", `/api/products/${productIds[0]}`, { cookie, body: { model3dUrl: "not-a-url" } });
  assert.equal(bad.status, 400, bad.text);

  const ok = await call("PATCH", `/api/products/${productIds[0]}`, { cookie, body: { model3dUrl: "https://cdn.example.com/model.glb" } });
  assert.equal(ok.status, 200, ok.text);
  assert.equal(ok.json.model3dUrl, "https://cdn.example.com/model.glb");

  // public menü artık modeli içeriyor
  const pub = await call("GET", `/api/public/menu/${slug}`);
  assert.equal(pub.status, 200);
  const found = (pub.json.categories ?? []).flatMap((c: any) => c.products).find((p: any) => p.id === productIds[0]);
  assert.equal(found?.model3dUrl, "https://cdn.example.com/model.glb");
});

test("3D model kotası: ücretsiz planda 2 model, 3. üründe 403", async () => {
  await conn.query("UPDATE restaurants SET plan_code = 'free' WHERE id = ?", [restaurantId]);
  const a = await call("PATCH", `/api/products/${productIds[1]}`, { cookie, body: { model3dUrl: "https://cdn.example.com/b.glb" } });
  assert.equal(a.status, 200, a.text);

  // üçüncü ürün: AI uygulamasından gelen ürünlerden biri
  const [rows] = await conn.query("SELECT id FROM products WHERE restaurant_id = ? AND id NOT IN (?, ?) LIMIT 1", [restaurantId, productIds[0], productIds[1]]);
  const third = (rows as any)[0]?.id;
  assert.ok(third, "üçüncü ürün yok");
  const c = await call("PATCH", `/api/products/${third}`, { cookie, body: { model3dUrl: "https://cdn.example.com/c.glb" } });
  assert.equal(c.status, 403, c.text);
  assert.equal(c.json.code, "MODEL_3D_LIMIT");

  // plan tekrar pro'ya alınıyor: aynı ürün artık kabul edilir
  await conn.query("UPDATE restaurants SET plan_code = 'pro' WHERE id = ?", [restaurantId]);
  const ok = await call("PATCH", `/api/products/${third}`, { cookie, body: { model3dUrl: "https://cdn.example.com/c.glb" } });
  assert.equal(ok.status, 200, ok.text);
});

test("özel alan adı: plan kısıtı, doğrulama akışı ve tenant izolasyonu", async () => {
  await conn.query("UPDATE restaurants SET plan_code = 'free' WHERE id = ?", [restaurantId]);
  const denied = await call("POST", "/api/restaurant/domains", { cookie, body: { domain: "menu.ornek.com" } });
  assert.equal(denied.status, 403, denied.text);
  assert.equal(denied.json.code, "PLAN_REQUIRED");

  await conn.query("UPDATE restaurants SET plan_code = 'pro' WHERE id = ?", [restaurantId]);

  const invalid = await call("POST", "/api/restaurant/domains", { cookie, body: { domain: "not valid" } });
  assert.equal(invalid.status, 400);

  const reserved = await call("POST", "/api/restaurant/domains", { cookie, body: { domain: "localhost" } });
  assert.equal(reserved.status, 400);

  const added = await call("POST", "/api/restaurant/domains", { cookie, body: { domain: `test-${RUN}.ornek.com` } });
  assert.equal(added.status, 201, added.text);
  assert.equal(added.json.status, "pending");
  assert.ok(added.json.dnsInstructions.txt.name.startsWith("_mtm-verify."));

  const dup = await call("POST", "/api/restaurant/domains", { cookie, body: { domain: `test-${RUN}.ornek.com` } });
  assert.equal(dup.status, 409);

  const list = await call("GET", "/api/restaurant/domains", { cookie });
  assert.equal(list.status, 200);
  assert.equal(list.json.planSupportsCustomDomain, true);
  assert.equal(list.json.domains.length, 1);

  // Doğrulama: DNS kaydı yoksa 400 döner (gerçek DNS'e gider, kayıt bulunamamalı)
  const verify = await call("POST", `/api/restaurant/domains/${added.json.id}/verify`, { cookie });
  assert.equal(verify.status, 400, verify.text);

  const del = await call("DELETE", `/api/restaurant/domains/${added.json.id}`, { cookie });
  assert.equal(del.status, 204);
});

test("sağlayıcı kimlik algılama: env yoksa gerçek adaptör devreye girmez", async () => {
  const { loadStripeCredentials } = await import("../server/payments/providers/stripe");
  const { loadIyzicoCredentials } = await import("../server/payments/providers/iyzico");
  const { loadPaytrCredentials } = await import("../server/payments/providers/paytr");
  const saved: Record<string, string | undefined> = {};
  for (const k of ["STRIPE_SECRET_KEY", "IYZICO_API_KEY", "IYZICO_SECRET_KEY", "PAYTR_MERCHANT_ID", "PAYTR_MERCHANT_KEY", "PAYTR_MERCHANT_SALT"]) {
    saved[k] = process.env[k];
    delete process.env[k];
  }
  try {
    assert.equal(loadStripeCredentials(), null);
    assert.equal(loadIyzicoCredentials(), null);
    assert.equal(loadPaytrCredentials(), null);

    process.env.STRIPE_SECRET_KEY = "sk_test_x";
    const s = loadStripeCredentials();
    assert.equal(s?.secretKey, "sk_test_x");
    delete process.env.STRIPE_SECRET_KEY;
  } finally {
    for (const [k, v] of Object.entries(saved)) {
      if (v !== undefined) process.env[k] = v;
    }
  }
});

test("domain doğrulama yardımcıları: normalize ve alan adı kuralları", async () => {
  const m = await import("../server/domains");
  assert.equal(m.normalizeDomain("https://Menu.Ornek.com:443/yz"), "menu.ornek.com");
  assert.equal(m.isValidDomain("menu.ornek.com"), true);
  assert.equal(m.isValidDomain("localhost"), false);
  assert.equal(m.isValidDomain("192.168.1.1"), false);
  assert.equal(m.isValidDomain("-bad.com"), false);
});
