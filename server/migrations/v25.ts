// Idempotent migration for v25: sms_notification_templates (sipariş/fatura bildirim şablonları).
// Run: npm run db:migrate-v25
import "../env";
import mysql from "mysql2/promise";

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL gerekli");
  const conn = await mysql.createConnection({ uri: databaseUrl, multipleStatements: true });

  const [tbl]: any = await conn.query(
    `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sms_notification_templates'`
  );
  if (!tbl.length) {
    await conn.query(`
      CREATE TABLE sms_notification_templates (
        id INT AUTO_INCREMENT PRIMARY KEY,
        restaurant_id INT NOT NULL,
        event_key VARCHAR(40) NOT NULL,
        body_template VARCHAR(480) NOT NULL,
        enabled TINYINT(1) NOT NULL DEFAULT 1,
        updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uniq_sms_tpl_restaurant_event (restaurant_id, event_key),
        CONSTRAINT fk_sms_tpl_restaurant FOREIGN KEY (restaurant_id) REFERENCES restaurants(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log("v25: sms_notification_templates tablosu oluşturuldu.");
  } else {
    console.log("v25: sms_notification_templates zaten mevcut, atlanıyor.");
  }

  await conn.end();
  console.log("v25 tamam.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
