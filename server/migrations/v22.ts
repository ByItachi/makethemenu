// Idempotent migration for v22: sms_inbound (gelen SMS) ve sms_webhook_log (webhook imza doğrulama logu).
// Run: npm run db:migrate-v22
import "../env";
import mysql from "mysql2/promise";

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL gerekli");
  const conn = await mysql.createConnection({ uri: databaseUrl, multipleStatements: true });

  // sms_inbound: gelen SMS mesajları (webhook'tan)
  const [inbound]: any = await conn.query(
    `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sms_inbound'`
  );
  if (!inbound.length) {
    await conn.query(`
      CREATE TABLE sms_inbound (
        id INT AUTO_INCREMENT PRIMARY KEY,
        restaurant_id INT NULL,
        from_phone VARCHAR(32) NOT NULL,
        body VARCHAR(640) NOT NULL,
        external_id VARCHAR(64) NULL,
        received_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_sms_inbound_restaurant (restaurant_id),
        INDEX idx_sms_inbound_from (from_phone)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log("v22: sms_inbound tablosu oluşturuldu.");
  } else {
    console.log("v22: sms_inbound zaten mevcut, atlanıyor.");
  }

  // sms_webhook_log: webhook imza doğrulama ve işleme logu
  const [webhookLog]: any = await conn.query(
    `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sms_webhook_log'`
  );
  if (!webhookLog.length) {
    await conn.query(`
      CREATE TABLE sms_webhook_log (
        id INT AUTO_INCREMENT PRIMARY KEY,
        provider VARCHAR(32) NOT NULL,
        signature_valid BOOLEAN NOT NULL DEFAULT FALSE,
        payload_hash VARCHAR(64) NULL,
        error_message VARCHAR(255) NULL,
        processed_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_sms_webhook_log_provider (provider),
        INDEX idx_sms_webhook_log_valid (signature_valid)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log("v22: sms_webhook_log tablosu oluşturuldu.");
  } else {
    console.log("v22: sms_webhook_log zaten mevcut, atlanıyor.");
  }

  await conn.end();
  console.log("v22 tamam.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
