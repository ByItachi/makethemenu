// Idempotent migration for v24: sms_otp (OTP doğrulama kodları).
// Run: npm run db:migrate-v24
import "../env";
import mysql from "mysql2/promise";

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL gerekli");
  const conn = await mysql.createConnection({ uri: databaseUrl, multipleStatements: true });

  const [otp]: any = await conn.query(
    `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sms_otp'`
  );
  if (!otp.length) {
    await conn.query(`
      CREATE TABLE sms_otp (
        id INT AUTO_INCREMENT PRIMARY KEY,
        restaurant_id INT NOT NULL,
        phone VARCHAR(32) NOT NULL,
        purpose VARCHAR(32) NOT NULL DEFAULT 'generic',
        code_hash VARCHAR(64) NOT NULL,
        attempts INT NOT NULL DEFAULT 0,
        max_attempts INT NOT NULL DEFAULT 5,
        consumed_at TIMESTAMP NULL,
        expires_at TIMESTAMP NOT NULL,
        last_sent_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
        send_count INT NOT NULL DEFAULT 1,
        outbox_id INT NULL,
        created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_sms_otp_phone (restaurant_id, phone, purpose),
        CONSTRAINT fk_sms_otp_restaurant FOREIGN KEY (restaurant_id) REFERENCES restaurants(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log("v24: sms_otp tablosu oluşturuldu.");
  } else {
    console.log("v24: sms_otp zaten mevcut, atlanıyor.");
  }

  await conn.end();
  console.log("v24 tamam.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
