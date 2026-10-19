// Idempotent migration for v3: e-mail send locks, billing (subscriptions, payments, webhook events).
// Safe to run repeatedly; never drops data. Take a DB backup first.
// Run: npm run db:migrate-v3
import "../env";
import mysql from "mysql2/promise";

export async function migrateV3(url: string): Promise<void> {
  const conn = await mysql.createConnection(url);
  try {
    await conn.query(`ALTER TABLE email_outbox ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP NULL`);
    await conn.query(`ALTER TABLE email_outbox MODIFY COLUMN status VARCHAR(16) NOT NULL DEFAULT 'queued'`);
  } finally {
    await conn.end();
  }
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, "/").split("/").pop()!)) {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL tanımlı değil");
  migrateV3(url)
    .then(() => console.log("v3 migration tamam"))
    .catch((e) => {
      console.error("migration hatası:", e?.code ?? e?.message);
      process.exit(1);
    });
}
