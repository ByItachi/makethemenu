// Idempotent migration for v23: sms_api_keys (API anahtarları) ve sms_balance_ledger (kontör/bakiye defteri).
// Run: npm run db:migrate-v23
import "../env";
import mysql from "mysql2/promise";

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL gerekli");
  const conn = await mysql.createConnection({ uri: databaseUrl, multipleStatements: true });

  const [apiKeys]: any = await conn.query(
    `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sms_api_keys'`
  );
  if (!apiKeys.length) {
    await conn.query(`
      CREATE TABLE sms_api_keys (
        id INT AUTO_INCREMENT PRIMARY KEY,
        restaurant_id INT NOT NULL,
        label VARCHAR(100) NOT NULL,
        key_prefix VARCHAR(16) NOT NULL,
        key_hash VARCHAR(64) NOT NULL,
        last_used_at TIMESTAMP NULL,
        revoked_at TIMESTAMP NULL,
        created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uniq_sms_api_keys_hash (key_hash),
        INDEX idx_sms_api_keys_restaurant (restaurant_id),
        CONSTRAINT fk_sms_api_keys_restaurant FOREIGN KEY (restaurant_id) REFERENCES restaurants(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log("v23: sms_api_keys tablosu oluşturuldu.");
  } else {
    console.log("v23: sms_api_keys zaten mevcut, atlanıyor.");
  }

  const [ledger]: any = await conn.query(
    `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sms_balance_ledger'`
  );
  if (!ledger.length) {
    await conn.query(`
      CREATE TABLE sms_balance_ledger (
        id INT AUTO_INCREMENT PRIMARY KEY,
        restaurant_id INT NOT NULL,
        delta INT NOT NULL,
        balance_after INT NOT NULL,
        reason VARCHAR(32) NOT NULL,
        reference_id INT NULL,
        note VARCHAR(255) NULL,
        created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_sms_ledger_restaurant (restaurant_id),
        CONSTRAINT fk_sms_ledger_restaurant FOREIGN KEY (restaurant_id) REFERENCES restaurants(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log("v23: sms_balance_ledger tablosu oluşturuldu.");
  } else {
    console.log("v23: sms_balance_ledger zaten mevcut, atlanıyor.");
  }

  await conn.end();
  console.log("v23 tamam.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
