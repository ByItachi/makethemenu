// Eklenti Merkezi HTTP uçları: gerçek çalışan sunucuya (BASE_URL) karşı.
// Önkoşul: v7 migration çalıştırılmış olmalı (restaurant_plugins tablosu).
// Tüm test verisi @example.com ile işaretlenir ve test sonunda silinir.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "crypto";
import "../server/env";
import mysql from "mysql2/promise";

const BASE = process.env.BASE_URL ?? "http://localhost:3002";
const RUN = Date.now().toString(36);
const email = `pl-a-${RUN}@example.com`;

type Resp = { status: number; json: any; text: string; sid?: string };

async function call(method: string, path: string, opts: { body?: unknown; cookie?: string } = {}): Promise<Resp> {
  const headers: Record<string, string> = {};
  if (opts.cookie) headers["cookie"] = opts.cookie;
  let body: string | undefined;
  if (opts.body !== undefined) {
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

let cookie = "";

before(async () => {
  const r = await call("POST", "/api/auth/register", {
    body: { email, password: "Test-Parola-123", fullName: "Eklenti Test", businessName: `Eklenti Test ${RUN}` },
  });
  assert.equal(r.status, 201, `register failed: ${r.text}`);
  cookie = r.sid!;
});

after(async () => {
  const c = await mysql.createConnection(process.env.DATABASE_URL!);
  try {
    await c.query(`DELETE rp FROM restaurant_plugins rp JOIN restaurants r ON rp.restaurant_id = r.id WHERE r.slug LIKE 'eklenti-test-${RUN}%'`);
    // Kullanıcı + restoran temizliği (FK sırası: önce users.restaurant_id)
    const [rows]: any = await c.query(`SELECT id, restaurant_id FROM users WHERE email = ?`, [email]);
    for (const row of rows ?? []) {
      if (row.restaurant_id) {
        await c.query(`DELETE FROM subscriptions WHERE restaurant_id = ?`, [row.restaurant_id]);
        await c.query(`UPDATE users SET restaurant_id = NULL WHERE id = ?`, [row.id]);
        await c.query(`DELETE FROM restaurants WHERE id = ?`, [row.restaurant_id]);
      }
      await c.query(`DELETE FROM users WHERE id = ?`, [row.id]);
    }
  } finally {
    await c.end();
  }
});

test("eklenti listesi katalogdaki tüm modülleri döner", async () => {
  const r = await call("GET", "/api/plugins", { cookie });
  assert.equal(r.status, 200);
  assert.ok(Array.isArray(r.json.plugins) && r.json.plugins.length >= 15);
  const keys = r.json.plugins.map((p: any) => p.key);
  for (const expected of ["yemeksepeti", "getiryemek", "trendyol-yemek", "iyzico", "paytr", "e-fatura", "kurye-takip", "qr-menu"]) {
    assert.ok(keys.includes(expected), `katalogda ${expected} olmalı`);
  }
  assert.ok(r.json.plugins.every((p: any) => p.isEnabled === false), "yeni restoranda hiçbir eklenti açık olmamalı");
});

test("bilinmeyen eklenti anahtarı 404 döner", async () => {
  const r = await call("POST", "/api/plugins/olmayan-eklenti/toggle", { cookie, body: { enabled: true } });
  assert.equal(r.status, 404);
});

test("eklenti aç/kapat kalıcı olur ve audit'e yazılır", async () => {
  const on = await call("POST", "/api/plugins/qr-menu/toggle", { cookie, body: { enabled: true } });
  assert.equal(on.status, 200);
  assert.equal(on.json.isEnabled, true);

  const list = await call("GET", "/api/plugins", { cookie });
  const qr = list.json.plugins.find((p: any) => p.key === "qr-menu");
  assert.equal(qr.isEnabled, true);

  const off = await call("POST", "/api/plugins/qr-menu/toggle", { cookie, body: { enabled: false } });
  assert.equal(off.json.isEnabled, false);

  const c = await mysql.createConnection(process.env.DATABASE_URL!);
  try {
    const [rows]: any = await c.query(`SELECT COUNT(*) AS n FROM audit_logs WHERE action = 'plugin.enabled' AND entity_id = 'qr-menu'`);
    assert.ok(Number(rows[0].n) >= 1, "audit log kaydı olmalı");
  } finally {
    await c.end();
  }
});

test("üst plan eklentisi Free planda 403 ile reddedilir", async () => {
  const r = await call("POST", "/api/plugins/stripe/toggle", { cookie, body: { enabled: true } });
  assert.equal(r.status, 403);
  assert.match(r.json.message, /yükseltin/i);

  const list = await call("GET", "/api/plugins", { cookie });
  const stripe = list.json.plugins.find((p: any) => p.key === "stripe");
  assert.equal(stripe.planLocked, true);
  assert.equal(stripe.isEnabled, false);
});

test("ayarlar kaydedilir ve doğrulamasız veri reddedilir", async () => {
  const ok = await call("PUT", "/api/plugins/qr-menu/settings", { cookie, body: { settings: { masaSayisi: 6, temalar: ["koyu"] } } });
  assert.equal(ok.status, 200);
  assert.equal(ok.json.settings.masaSayisi, 6);

  const bad = await call("PUT", "/api/plugins/qr-menu/settings", { cookie, body: { settings: "dizi-degil" } });
  assert.equal(bad.status, 400);

  const big = await call("PUT", "/api/plugins/qr-menu/settings", { cookie, body: { settings: { blob: "x".repeat(5000) } } });
  assert.equal(big.status, 400);
});

test("girişsiz istek 401 döner", async () => {
  const r = await call("GET", "/api/plugins");
  assert.equal(r.status, 401);
});
