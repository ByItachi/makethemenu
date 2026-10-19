// Gerçek çalışan sunucuya (BASE_URL) HTTP ile istek atan entegrasyon testleri.
// Önkoşul: sunucu çalışıyor ve DATABASE_URL .env içinde tanımlı.
// Tüm test verisi @example.com ile işaretlenir ve test sonunda silinir.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import "../server/env";
import mysql from "mysql2/promise";

const BASE = process.env.BASE_URL ?? "http://localhost:3002";
const RUN = Date.now().toString(36);
const emailA = `a-${RUN}@example.com`;
const emailB = `b-${RUN}@example.com`;
const slugA = `test-a-${RUN}`;
const slugB = `test-b-${RUN}`;

type Session = { cookie: string };

async function call(method: string, path: string, opts: { body?: unknown; cookie?: string; raw?: string; contentType?: string } = {}) {
  const headers: Record<string, string> = {};
  if (opts.cookie) headers["cookie"] = opts.cookie;
  let body: string | undefined;
  if (opts.raw !== undefined) {
    body = opts.raw;
    headers["content-type"] = opts.contentType ?? "text/plain";
  } else if (opts.body !== undefined) {
    body = JSON.stringify(opts.body);
    headers["content-type"] = "application/json";
  }
  const res = await fetch(BASE + path, { method, headers, body, redirect: "manual" });
  const setCookie = res.headers.getSetCookie?.() ?? [];
  const sid = setCookie.map((c) => c.split(";")[0]).find((c) => c.startsWith("mtm.sid="));
  const text = await res.text();
  let json: any = undefined;
  try { json = text ? JSON.parse(text) : undefined; } catch { /* non-json */ }
  return { status: res.status, json, text, headers: res.headers, sid };
}

async function register(email: string, businessName: string): Promise<Session & { slug: string }> {
  const r = await call("POST", "/api/auth/register", {
    body: { email, password: "Test-Parola-123", fullName: "Test Kullanıcı", businessName },
  });
  assert.equal(r.status, 201, `register failed: ${r.text}`);
  assert.ok(r.sid, "session cookie missing after register");
  return { cookie: r.sid!, slug: r.json.restaurantSlug };
}

async function outboxBody(to: string, subjectPart: string): Promise<string> {
  const conn = await mysql.createConnection(process.env.DATABASE_URL!);
  try {
    const [rows] = await conn.query<any[]>(
      "SELECT body FROM email_outbox WHERE to_address = ? AND subject LIKE ? ORDER BY id DESC LIMIT 1",
      [to, `%${subjectPart}%`],
    );
    if (!rows[0]) throw new Error("e-posta kuyrukta yok: " + to);
    return rows[0].body as string;
  } finally {
    await conn.end();
  }
}
const tokenFrom = (body: string) => body.match(/token=([A-Za-z0-9_-]+)/)![1];

let A: Session & { slug: string };
let B: Session & { slug: string };
let tableA: number;
let productA: number;
let categoryA: number;
let tableB: number;
let productB: number;

before(async () => {
  A = await register(emailA, `Test A ${RUN}`);
  B = await register(emailB, `Test B ${RUN}`);
});

after(async () => {
  const url = process.env.DATABASE_URL;
  if (!url) return;
  const conn = await mysql.createConnection(url);
  try {
    const like = `%-${RUN}@example.com`;
    const [users] = await conn.query<any[]>("SELECT id FROM users WHERE email LIKE ?", [like]);
    const userIds = users.map((u) => u.id);
    const [rests] = await conn.query<any[]>(
      "SELECT id FROM restaurants WHERE owner_user_id IN (?) OR slug IN (?, ?)",
      [userIds.length ? userIds : [0], slugA, slugB],
    );
    const restIds = rests.map((r) => r.id);
    if (restIds.length) {
      await conn.query("DELETE oi FROM order_items oi JOIN orders o ON oi.order_id=o.id WHERE o.restaurant_id IN (?)", [restIds]);
      await conn.query("DELETE FROM orders WHERE restaurant_id IN (?)", [restIds]);
      await conn.query("DELETE FROM products WHERE restaurant_id IN (?)", [restIds]);
      await conn.query("DELETE FROM categories WHERE restaurant_id IN (?)", [restIds]);
      await conn.query("DELETE FROM tables WHERE restaurant_id IN (?)", [restIds]);
      await conn.query("DELETE FROM restaurant_slug_redirects WHERE restaurant_id IN (?)", [restIds]);
      await conn.query("DELETE FROM audit_logs WHERE restaurant_id IN (?)", [restIds]);
    }
    await conn.query("UPDATE restaurants SET owner_user_id=NULL WHERE owner_user_id IN (?)", [userIds.length ? userIds : [0]]);
    await conn.query("DELETE FROM auth_tokens WHERE user_id IN (?)", [userIds.length ? userIds : [0]]);
    await conn.query("DELETE FROM email_outbox WHERE to_address LIKE ?", [like]);
    await conn.query("DELETE FROM users WHERE email LIKE ?", [like]);
    if (restIds.length) await conn.query("DELETE FROM restaurants WHERE id IN (?)", [restIds]);
  } finally {
    await conn.end();
  }
});

test("e-posta doğrulanmadan menü yayımlanamaz; doğrulama sonrası yayımlanır", async () => {
  const blocked = await call("PATCH", "/api/restaurant", { cookie: B.cookie, body: { isPublished: true } });
  assert.equal(blocked.status, 403);
  assert.equal(blocked.json.code, "EMAIL_NOT_VERIFIED");

  const bad = await call("POST", "/api/auth/verify-email", { body: { token: "x".repeat(30) } });
  assert.equal(bad.status, 400);

  const body = await outboxBody(emailA, "doğrulayın");
  assert.ok(!body.includes("$2") && !body.includes("scrypt"), "e-posta gövdesinde parola özeti olmamalı");
  const ok = await call("POST", "/api/auth/verify-email", { body: { token: tokenFrom(body) } });
  assert.equal(ok.status, 200, ok.text);
  const again = await call("POST", "/api/auth/verify-email", { body: { token: tokenFrom(body) } });
  assert.equal(again.status, 400, "tek kullanımlık token ikinci kez çalışmamalı");
  const me = await call("GET", "/api/auth/user", { cookie: A.cookie });
  assert.equal(me.json.emailVerified, true);
});

test("oturumsuz doğrulama tekrar gönderimi 401", async () => {
  const r = await call("POST", "/api/auth/resend-verification");
  assert.equal(r.status, 401);
});

test("parola sıfırlama: bilinmeyen ve bilinen e-posta aynı yanıtı verir; token ile parola değişir", async () => {
  const unknown = await call("POST", "/api/auth/forgot-password", { body: { email: `yok-${RUN}@example.com` } });
  const known = await call("POST", "/api/auth/forgot-password", { body: { email: emailB } });
  assert.equal(unknown.status, 200);
  assert.equal(known.status, 200);
  assert.equal(unknown.json.message, known.json.message, "hesap varlığı sızmamalı");

  const body = await outboxBody(emailB, "Parolanızı sıfırlayın");
  const token = tokenFrom(body);
  const weak = await call("POST", "/api/auth/reset-password", { body: { token, password: "kisa" } });
  assert.equal(weak.status, 400);
  const newPass = "Yeni-Parola-456";
  const done = await call("POST", "/api/auth/reset-password", { body: { token, password: newPass } });
  assert.equal(done.status, 200, done.text);
  const reuse = await call("POST", "/api/auth/reset-password", { body: { token, password: newPass } });
  assert.equal(reuse.status, 400);

  const oldLogin = await call("POST", "/api/auth/login", { body: { identifier: emailB, password: "Test-Parola-123" } });
  assert.equal(oldLogin.status, 401);
  const newLogin = await call("POST", "/api/auth/login", { body: { identifier: emailB, password: newPass } });
  assert.equal(newLogin.status, 200);
  B = { ...B, cookie: newLogin.sid! };
});

test("oturumsuz API 401 döner", async () => {
  const r = await call("GET", "/api/tables");
  assert.equal(r.status, 401);
});

test("kayıt sonrası /api/auth/user kullanıcıyı ve işletmeyi döner", async () => {
  const r = await call("GET", "/api/auth/user", { cookie: A.cookie });
  assert.equal(r.status, 200);
  assert.equal(r.json.email ?? emailA, emailA);
  assert.ok(!("passwordHash" in (r.json ?? {})), "parola özeti sızmamalı");
});

test("duplicate e-posta kaydı 409 döner", async () => {
  const r = await call("POST", "/api/auth/register", {
    body: { email: emailA, password: "Test-Parola-123", fullName: "Test Kullanıcı", businessName: "Başka" },
  });
  assert.equal(r.status, 409);
});

test("yanlış parola 401 ve genel mesaj döner", async () => {
  const r = await call("POST", "/api/auth/login", { body: { identifier: emailA, password: "yanlis-parola" } });
  assert.equal(r.status, 401);
  assert.match(r.json.message, /hatalı/);
});

test("doğru parola ile giriş yeni oturum açar", async () => {
  const r = await call("POST", "/api/auth/login", { body: { identifier: emailA, password: "Test-Parola-123" } });
  assert.equal(r.status, 200);
  assert.ok(r.sid);
});

test("JSON olmayan POST 415 döner", async () => {
  const r = await call("POST", "/api/tables", { cookie: A.cookie, raw: "abc", contentType: "text/plain" });
  assert.equal(r.status, 415);
});

test("kullanıcı A masa oluşturur; istemci restaurantId gönderse de yok sayılır", async () => {
  const r = await call("POST", "/api/tables", {
    cookie: A.cookie,
    body: { name: "A-Masa-1", capacity: 4, restaurantId: 999999 },
  });
  assert.equal(r.status, 201, r.text);
  tableA = r.json.id;
  const me = await call("GET", "/api/restaurant", { cookie: A.cookie });
  assert.equal(r.json.restaurantId, me.json.id, "masa A'nın işletmesine bağlanmalı");
});

test("kullanıcı B, A'nın masasını göremez/güncelleyemez/silemez", async () => {
  const list = await call("GET", "/api/tables", { cookie: B.cookie });
  assert.equal(list.status, 200);
  assert.ok(!list.json.some((t: any) => t.id === tableA), "B listesinde A masası olmamalı");
  const patch = await call("PATCH", `/api/tables/${tableA}`, { cookie: B.cookie, body: { name: "Hack" } });
  assert.equal(patch.status, 404);
  const del = await call("DELETE", `/api/tables/${tableA}`, { cookie: B.cookie });
  assert.equal(del.status, 404);
  const still = await call("GET", "/api/tables", { cookie: A.cookie });
  assert.ok(still.json.some((t: any) => t.id === tableA && t.name === "A-Masa-1"), "A masası değişmemiş olmalı");
});

test("kategori ve ürün oluşturma; B'nin A ürününü güncellemesi engellenir", async () => {
  const cat = await call("POST", "/api/categories", { cookie: A.cookie, body: { name: "Içecek", slug: "icecek" } });
  assert.equal(cat.status, 201, cat.text);
  categoryA = cat.json.id;
  const prod = await call("POST", "/api/products", {
    cookie: A.cookie,
    body: { name: "Çay", price: "12.50", categoryId: categoryA, isAvailable: true },
  });
  assert.equal(prod.status, 201, prod.text);
  productA = prod.json.id;
  const patch = await call("PATCH", `/api/products/${productA}`, { cookie: B.cookie, body: { price: "0.01" } });
  assert.equal(patch.status, 404);
});

test("B kendi ürünlerini oluşturur; B'nin B ürünü ile A'nın kategorisi karışmaz", async () => {
  const t = await call("POST", "/api/tables", { cookie: B.cookie, body: { name: "B-Masa-1", capacity: 2 } });
  assert.equal(t.status, 201);
  tableB = t.json.id;
  const p = await call("POST", "/api/products", { cookie: B.cookie, body: { name: "Kahve", price: "40.00" } });
  assert.equal(p.status, 201);
  productB = p.json.id;
  const crossCat = await call("POST", "/api/products", {
    cookie: B.cookie,
    body: { name: "Çapraz", price: "1.00", categoryId: categoryA },
  });
  assert.ok(crossCat.status >= 400, "B, A'nın kategorisine ürün ekleyememeli");
});

test("sipariş fiyatı istemciden değil DB'den alınır", async () => {
  const r = await call("POST", "/api/orders", {
    cookie: A.cookie,
    body: { tableId: tableA, items: [{ productId: productA, quantity: 2, notes: "" }] },
  });
  assert.equal(r.status, 201, r.text);
  // 2 x 12.50 = 25.00 ara toplam + %10 KDV = 27.50 (sunucu DB fiyatıyla hesaplar)
  assert.equal(Number(r.json.totalAmount), 27.5);
});

test("başka işletmenin tableId/productId ile sipariş verilemez", async () => {
  const r = await call("POST", "/api/orders", {
    cookie: A.cookie,
    body: { tableId: tableB, items: [{ productId: productA, quantity: 1 }] },
  });
  assert.ok(r.status >= 400, `masa sahipliği kontrolü başarısız: ${r.status}`);
  const r2 = await call("POST", "/api/orders", {
    cookie: A.cookie,
    body: { tableId: null, items: [{ productId: productB, quantity: 1 }] },
  });
  assert.ok(r2.status >= 400, `ürün sahipliği kontrolü başarısız: ${r2.status}`);
});

test("boş sipariş reddedilir", async () => {
  const r = await call("POST", "/api/orders", { cookie: A.cookie, body: { tableId: null, items: [] } });
  assert.equal(r.status, 400);
});

test("B, A'nın siparişini göremez", async () => {
  const listA = await call("GET", "/api/orders", { cookie: A.cookie });
  assert.ok(listA.json.length >= 1);
  const oid = listA.json[0].id;
  const r = await call("GET", `/api/orders/${oid}`, { cookie: B.cookie });
  assert.equal(r.status, 404);
});

test("public menü: yayımlanmamışken 404", async () => {
  const r = await call("GET", `/api/public/menu/${slugA}`);
  assert.equal(r.status, 404);
});

test("public menü: yayımlanınca yalnızca public alanlar döner", async () => {
  const p = await call("PATCH", "/api/restaurant", { cookie: A.cookie, body: { isPublished: true } });
  assert.equal(p.status, 200, p.text);
  const r = await call("GET", `/api/public/menu/${slugA}`);
  assert.equal(r.status, 200, r.text);
  const body = JSON.stringify(r.json);
  assert.ok(body.includes("Çay"));
  assert.ok(!body.includes(emailA), "e-posta public menüde olmamalı");
  assert.ok(!body.includes("A-Masa-1"), "masa bilgisi public menüde olmamalı");
  assert.ok(!body.includes("restaurantId"), "iç ID alanı public menüde olmamalı");
});

test("slug değişince eski slug yönlendirme kaydı oluşur", async () => {
  const newSlug = `test-a2-${RUN}`;
  const p = await call("PATCH", "/api/restaurant", { cookie: A.cookie, body: { slug: newSlug } });
  assert.equal(p.status, 200, p.text);
  const old = await call("GET", `/api/public/menu/${slugA}`);
  assert.equal(old.status, 301, old.text);
  assert.ok(String(old.json?.redirectTo ?? "").includes(newSlug));
  const fresh = await call("GET", `/api/public/menu/${newSlug}`);
  assert.equal(fresh.status, 200);
});

test("çakışan slug 409, rezerve slug 400 döner", async () => {
  const dup = await call("PATCH", "/api/restaurant", { cookie: B.cookie, body: { slug: `test-a2-${RUN}` } });
  assert.equal(dup.status, 409);
  const reserved = await call("PATCH", "/api/restaurant", { cookie: B.cookie, body: { slug: "admin" } });
  assert.equal(reserved.status, 400);
});

test("QR: yayımlı menü için svg/png 200, yayımsız için 409", async () => {
  const svg = await call("GET", "/api/restaurant/qr.svg", { cookie: A.cookie });
  assert.equal(svg.status, 200);
  assert.match(svg.text, /<svg/);
  const png = await fetch(BASE + "/api/restaurant/qr.png?size=256", { headers: { cookie: A.cookie } });
  assert.equal(png.status, 200);
  assert.equal(png.headers.get("content-type"), "image/png");
  const unpub = await call("GET", "/api/restaurant/qr.svg", { cookie: B.cookie });
  assert.equal(unpub.status, 409);
});

test("plan limiti: Free planda 10 masa sınırı sunucuda uygulanır", async () => {
  const usage0 = await call("GET", "/api/restaurant/usage", { cookie: B.cookie });
  assert.equal(usage0.status, 200, usage0.text);
  assert.equal(usage0.json.plan.code, "free");
  const have = usage0.json.usage.tables;
  for (let i = have; i < 10; i++) {
    const r = await call("POST", "/api/tables", { cookie: B.cookie, body: { name: `B-Limit-${i}`, capacity: 2 } });
    assert.equal(r.status, 201, r.text);
  }
  const over = await call("POST", "/api/tables", { cookie: B.cookie, body: { name: "Fazla", capacity: 2 } });
  assert.equal(over.status, 403);
  assert.equal(over.json.code, "PLAN_LIMIT");
});

test("sağlık ve SEO uç noktaları", async () => {
  const h = await call("GET", "/api/health");
  assert.equal(h.status, 200);
  assert.equal(h.json.database, "ok");
  const robots = await call("GET", "/robots.txt");
  assert.equal(robots.status, 200);
  assert.match(robots.text, /Disallow: \/api\//);
  const sm = await call("GET", "/sitemap.xml");
  assert.ok(sm.text.includes(`/p/test-a2-${RUN}`), "yayımlı menü sitemap'te olmalı");
  assert.ok(!sm.text.includes(`/p/${B.slug}`), "yayımsız menü sitemap'te olmamalı");
});

test("public plan listesi ve platform admin plan yönetimi", async () => {
  const pub = await call("GET", "/api/plans");
  assert.equal(pub.status, 200);
  assert.equal(pub.json.length, 5);

  const notAdmin = await call("GET", "/api/admin/plans", { cookie: A.cookie });
  assert.equal(notAdmin.status, 403);

  // Promote a dedicated test admin directly in the DB (no admin credentials are stored in code)
  const adminEmail = `admin-${RUN}@example.com`;
  const adm = await register(adminEmail, `Test Admin ${RUN}`);
  const conn = await mysql.createConnection(process.env.DATABASE_URL!);
  try {
    await conn.query("UPDATE users SET is_platform_admin = 1 WHERE email = ?", [adminEmail]);
  } finally {
    await conn.end();
  }
  const list = await call("GET", "/api/admin/plans", { cookie: adm.cookie });
  assert.equal(list.status, 200);
  assert.equal(list.json.length, 5);
  const out = await call("GET", "/api/admin/email-outbox", { cookie: adm.cookie });
  assert.equal(out.status, 200);
  assert.ok(Array.isArray(out.json) && out.json.length > 0);
  // Transport is not configured in the test server (EMAIL_PROVIDER unset) → manual send must refuse
  const proc = await call("POST", "/api/admin/email-outbox/process", { cookie: adm.cookie });
  assert.equal(proc.status, 409);
  assert.equal(proc.json.code, "MAIL_NOT_CONFIGURED");

  const upd = await call("PUT", "/api/admin/plans/free", { cookie: adm.cookie, body: { name: "Free" } });
  assert.equal(upd.status, 200);
  const badPlan = await call("PUT", "/api/admin/restaurants/999999999/plan", { cookie: adm.cookie, body: { planCode: "yok" } });
  assert.equal(badPlan.status, 400);
});

test("güvenlik başlıkları mevcut", async () => {
  const r = await call("GET", "/api/auth/user");
  assert.equal(r.headers.get("x-content-type-options"), "nosniff");
  assert.equal(r.headers.get("x-frame-options"), "DENY");
});

test("platform admin olmayan kullanıcı /api/admin 403 alır", async () => {
  const r = await call("GET", "/api/admin/restaurants", { cookie: A.cookie });
  assert.equal(r.status, 403);
});

test("oturumsuz /api/admin 401 alır", async () => {
  const r = await call("GET", "/api/admin/restaurants");
  assert.equal(r.status, 401);
});

test("çıkış sonrası oturum geçersiz olur", async () => {
  const tmp = await register(`c-${RUN}@example.com`, `Test C ${RUN}`);
  const out = await call("POST", "/api/auth/logout", { cookie: tmp.cookie });
  assert.equal(out.status, 200);
  const me = await call("GET", "/api/auth/user", { cookie: tmp.cookie });
  assert.equal(me.status, 401);
});

test("ayar formunun gönderdiği gövde (null alanlar, boş adres) kabul edilir", async () => {
  const r = await call("PATCH", "/api/restaurant", {
    cookie: B.cookie,
    body: { name: `Test B ${RUN}`, description: null, phone: null, address: "", city: null, currency: "TRY", isPublished: false },
  });
  assert.equal(r.status, 200, r.text);
  const g = await call("GET", "/api/restaurant", { cookie: B.cookie });
  assert.equal(g.json.isPublished, false);
});
