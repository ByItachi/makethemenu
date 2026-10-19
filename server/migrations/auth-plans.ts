// Idempotent migration: e-mail verification, subscription plans, auth tokens, e-mail outbox.
// Safe to run repeatedly. Never drops data. Take a DB backup first.
// Run: npm run db:migrate-auth
import "../env";
import mysql from "mysql2/promise";

const DEFAULT_PLANS: Array<[string, string, string, string, number | null, number | null, number, number]> = [
  // code, name, monthly, yearly, maxProducts, maxTables, customDomain, sortOrder
  ["free", "Free", "0", "0", 50, 10, 0, 0],
  ["starter", "Starter", "299", "2990", 150, 25, 0, 1],
  ["pro", "Pro", "699", "6990", 500, 60, 1, 2],
  ["business", "Business", "1499", "14990", 2000, 200, 1, 3],
  ["enterprise", "Enterprise", "0", "0", null, null, 1, 4],
];

export async function migrateAuthPlans(url: string): Promise<{ backfilledUsers: number }> {
  const conn = await mysql.createConnection(url);
  try {
    const [cols] = await conn.query<any[]>(
      `SELECT COUNT(*) AS n FROM information_schema.columns
       WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'email_verified_at'`,
    );
    const columnExisted = Number(cols[0].n) > 0;

    await conn.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMP NULL`);
    let backfilledUsers = 0;
    if (!columnExisted) {
      // Accounts that existed before e-mail verification was introduced stay usable.
      const [res] = await conn.query<any>(
        `UPDATE users SET email_verified_at = COALESCE(created_at, NOW()) WHERE email_verified_at IS NULL`,
      );
      backfilledUsers = res.affectedRows;
    }

    await conn.query(`ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS plan_code VARCHAR(32) NOT NULL DEFAULT 'free'`);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS plans (
        code VARCHAR(32) PRIMARY KEY,
        name VARCHAR(64) NOT NULL,
        price_monthly DECIMAL(10,2) NOT NULL DEFAULT 0,
        price_yearly DECIMAL(10,2) NOT NULL DEFAULT 0,
        max_products INT NULL,
        max_tables INT NULL,
        custom_domain TINYINT(1) NOT NULL DEFAULT 0,
        is_active TINYINT(1) NOT NULL DEFAULT 1,
        sort_order INT NOT NULL DEFAULT 0,
        updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP
      )`);

    for (const p of DEFAULT_PLANS) {
      // INSERT IGNORE: an admin's later edits are never overwritten
      await conn.query(
        `INSERT IGNORE INTO plans (code, name, price_monthly, price_yearly, max_products, max_tables, custom_domain, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        p,
      );
    }

    await conn.query(`
      CREATE TABLE IF NOT EXISTS auth_tokens (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        purpose VARCHAR(32) NOT NULL,
        token_hash VARCHAR(64) NOT NULL UNIQUE,
        expires_at TIMESTAMP NOT NULL,
        used_at TIMESTAMP NULL,
        created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
        KEY idx_auth_tokens_user (user_id)
      )`);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS email_outbox (
        id INT AUTO_INCREMENT PRIMARY KEY,
        to_address VARCHAR(255) NOT NULL,
        subject VARCHAR(255) NOT NULL,
        body TEXT NOT NULL,
        status VARCHAR(16) NOT NULL DEFAULT 'queued',
        attempts INT NOT NULL DEFAULT 0,
        last_error VARCHAR(255) NULL,
        created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
        sent_at TIMESTAMP NULL,
        KEY idx_email_outbox_status (status)
      )`);

    return { backfilledUsers };
  } finally {
    await conn.end();
  }
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, "/").split("/").pop()!)) {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL tanımlı değil");
  migrateAuthPlans(url)
    .then((r) => console.log("auth-plans migration tamam:", r))
    .catch((e) => {
      console.error("migration hatası:", e?.code ?? e?.message);
      process.exit(1);
    });
}
