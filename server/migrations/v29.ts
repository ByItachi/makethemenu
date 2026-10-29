// Idempotent migration for v29: MakeTheMenu kendi SMS gateway motoru
// (SIM kartlı Android telefon / USB GSM modem cihazları + kalıcı platform ayarları).
// Run: npx tsx server/migrations/v29.ts
import "../env";
import mysql from "mysql2/promise";

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL gerekli");
  const conn = await mysql.createConnection({ uri: databaseUrl, multipleStatements: true });

  await conn.query(`
    CREATE TABLE IF NOT EXISTS sms_gateway_devices (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(128) NOT NULL,
      kind VARCHAR(16) NOT NULL DEFAULT 'android',
      pairing_code VARCHAR(16) NULL,
      pairing_code_expires_at TIMESTAMP NULL,
      token_hash VARCHAR(128) NULL,
      status VARCHAR(16) NOT NULL DEFAULT 'pending',
      sim_number VARCHAR(32) NULL,
      operator VARCHAR(64) NULL,
      daily_limit INT NOT NULL DEFAULT 300,
      per_minute_limit INT NOT NULL DEFAULT 20,
      enabled TINYINT(1) NOT NULL DEFAULT 1,
      battery INT NULL,
      \`signal\` INT NULL,
      app_version VARCHAR(32) NULL,
      last_seen_at TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_sms_gateway_pairing (pairing_code)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    CREATE TABLE IF NOT EXISTS platform_settings (
      setting_key VARCHAR(64) NOT NULL PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    ALTER TABLE sms_outbox ADD COLUMN IF NOT EXISTS gateway_device_id INT NULL;
    ALTER TABLE sms_outbox ADD COLUMN IF NOT EXISTS gateway_claim VARCHAR(32) NULL;
    ALTER TABLE sms_outbox ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP NULL;
    CREATE INDEX IF NOT EXISTS idx_sms_outbox_status_lock ON sms_outbox (status, locked_until);
    CREATE INDEX IF NOT EXISTS idx_sms_outbox_gateway_sent ON sms_outbox (gateway_device_id, sent_at);
  `);
  console.log("v29: sms_gateway_devices/platform_settings + sms_outbox gateway sütunları hazır.");

  await conn.end();
  console.log("v29 tamam.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
