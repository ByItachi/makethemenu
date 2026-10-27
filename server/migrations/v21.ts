// Idempotent migration for v21: sms_outbox tablosu (toplu SMS / bildirim kuyruğu).
// Run: npm run db:migrate-v21
import "../env";
import mysql from "mysql2/promise";

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL gerekli");
  const conn = await mysql.createConnection({ uri: databaseUrl, multipleStatements: true });

  const [tables]: any = await conn.query(
    `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sms_outbox'`
  );
  if (!tables.length) {
    await conn.query(`
      CREATE TABLE sms_outbox (
        id INT AUTO_INCREMENT PRIMARY KEY,
        restaurant_id INT NULL,
        to_phone VARCHAR(32) NOT NULL,
        body VARCHAR(640) NOT NULL,
        status VARCHAR(16) NOT NULL DEFAULT 'queued',
        attempts INT NOT NULL DEFAULT 0,
        last_error VARCHAR(255) NULL,
        locked_until TIMESTAMP NULL,
        created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
        sent_at TIMESTAMP NULL,
        INDEX idx_sms_outbox_restaurant (restaurant_id),
        INDEX idx_sms_outbox_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log("v21: sms_outbox tablosu oluşturuldu.");
  } else {
    console.log("v21: sms_outbox zaten mevcut, atlanıyor.");
  }

  await conn.end();
  console.log("v21 tamam.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
