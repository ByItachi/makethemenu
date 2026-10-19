// E-posta: gerçek SMTP protokolü (yerel smtp-server) + kuyruk işçisi davranışı.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import "../server/env";
import mysql from "mysql2/promise";
import { SMTPServer } from "smtp-server";
import { createSmtpTransport, loadSmtpConfig, redact, type SmtpConfig, type MailTransport } from "../server/email/transport";
import { processOutbox, MAX_EMAIL_ATTEMPTS } from "../server/email/worker";
import { pool } from "../server/db";

const RUN = Date.now().toString(36);
const addr = (tag: string) => `${tag}-${RUN}@example.com`;
const received: Array<{ to: string[]; raw: string }> = [];
let smtp: SMTPServer;
let cfg: SmtpConfig;
const conn = () => mysql.createConnection(process.env.DATABASE_URL!);

async function enqueue(to: string, subject = "Test konusu"): Promise<number> {
  const c = await conn();
  try {
    const [r] = await c.query<any>("INSERT INTO email_outbox (to_address, subject, body) VALUES (?, ?, ?)", [to, subject, "Gövde"]);
    return r.insertId;
  } finally {
    await c.end();
  }
}
async function row(id: number) {
  const c = await conn();
  try {
    const [rows] = await c.query<any[]>("SELECT status, attempts, last_error, (locked_until > NOW()) AS locked_in_future FROM email_outbox WHERE id = ?", [id]);
    return rows[0];
  } finally {
    await c.end();
  }
}
async function releaseLock(id: number) {
  const c = await conn();
  try {
    await c.query("UPDATE email_outbox SET locked_until = NULL WHERE id = ?", [id]);
  } finally {
    await c.end();
  }
}

before(async () => {
  smtp = new SMTPServer({
    authOptional: true,
    disabledCommands: ["STARTTLS"],
    onData(stream, session, cb) {
      let data = "";
      stream.on("data", (c) => (data += c.toString()));
      stream.on("end", () => {
        received.push({ to: session.envelope.rcptTo.map((r) => r.address), raw: data });
        cb();
      });
    },
    logger: false,
  });
  await new Promise<void>((resolve) => smtp.listen(0, "127.0.0.1", () => resolve()));
  const port = (smtp.server.address() as { port: number }).port;
  cfg = { host: "127.0.0.1", port, secure: false, from: "MakeTheMenu <no-reply@example.com>" };
});

after(async () => {
  await new Promise<void>((resolve) => smtp.close(() => resolve()));
  const c = await conn();
  try {
    await c.query("DELETE FROM email_outbox WHERE to_address LIKE ?", [`%-${RUN}@example.com`]);
  } finally {
    await c.end();
  }
  await pool.end();
});

test("SMTP yapılandırması: outbox modunda null, eksik smtp ayarında hata", () => {
  assert.equal(loadSmtpConfig({ EMAIL_PROVIDER: "outbox" } as any), null);
  assert.equal(loadSmtpConfig({} as any), null);
  assert.throws(() => loadSmtpConfig({ EMAIL_PROVIDER: "smtp", SMTP_HOST: "h" } as any), /SMTP_FROM/);
  const ok = loadSmtpConfig({ SMTP_HOST: "mail.example.com", SMTP_PORT: "465", SMTP_FROM: "a@example.com" } as any);
  assert.equal(ok?.secure, true, "465 portu SSL kullanmalı");
});

test("kimlik bilgileri hata metninden temizlenir", () => {
  const out = redact("AUTH failed for hunter2-user with hunter2pw", ["hunter2pw", "hunter2-user"]);
  assert.ok(!out.includes("hunter2pw") && !out.includes("hunter2-user"));
  assert.match(out, /\*\*\*/);
});

test("nodemailer gerçek SMTP ile mesajı teslim eder", async () => {
  const t = createSmtpTransport(cfg);
  const to = addr("direct");
  await t.send({ to, subject: "Doğrulama bağlantısı", text: "merhaba" });
  const got = received.find((m) => m.to.includes(to));
  assert.ok(got, "SMTP sunucusu mesajı almalı");
  assert.match(got!.raw, /Subject: Doğrulama bağlantısı|Subject: =\?UTF-8/);
});

test("kuyruk: queued → sent; gönderilen satır tekrar gönderilmez", async () => {
  const t = createSmtpTransport(cfg);
  const to = addr("queue");
  const id = await enqueue(to);
  const r1 = await processOutbox(t, 100);
  assert.ok(r1.sent >= 1);
  assert.equal((await row(id)).status, "sent");
  const before = received.filter((m) => m.to.includes(to)).length;
  await processOutbox(t, 100);
  assert.equal(received.filter((m) => m.to.includes(to)).length, before, "ikinci çalıştırmada yeniden gönderilmemeli");
});

test("paralel işçiler aynı satırı iki kez göndermez", async () => {
  const t = createSmtpTransport(cfg);
  const to = addr("race");
  await enqueue(to);
  await Promise.all([processOutbox(t, 100), processOutbox(t, 100), processOutbox(t, 100)]);
  assert.equal(received.filter((m) => m.to.includes(to)).length, 1);
});

test("hata: retry, geri çekilme, sonunda failed; hata metni kayıtlı", async () => {
  const bad: MailTransport = {
    name: "bad",
    async send() {
      throw new Error("Sunucu reddetti parola=GIZLI123");
    },
  };
  const id = await enqueue(addr("fail"));
  await processOutbox(bad, 100);
  let r = await row(id);
  assert.equal(r.status, "retry");
  assert.equal(r.attempts, 1);
  assert.equal(Number(r.locked_in_future), 1, "geri çekilme süresi ileride olmalı");

  // Zaman beklemeden tekrar denemek için kilidi kaldır
  for (let i = 2; i <= MAX_EMAIL_ATTEMPTS; i++) {
    await releaseLock(id);
    await processOutbox(bad, 100);
  }
  r = await row(id);
  assert.equal(r.status, "failed");
  assert.equal(r.attempts, MAX_EMAIL_ATTEMPTS);
  assert.ok(!String(r.last_error).includes("GIZLI123"), "hata metninde gizli değer olmamalı");
});

test("kilitli satır (geri çekilme süresi dolmadan) yeniden alınmaz", async () => {
  const bad: MailTransport = { name: "bad", async send() { throw new Error("x"); } };
  const id = await enqueue(addr("locked"));
  await processOutbox(bad, 100);
  const before = (await row(id)).attempts;
  await processOutbox(bad, 100);
  assert.equal((await row(id)).attempts, before);
});
