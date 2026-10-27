// Idempotent migration for v26: sms_outbox.scheduled_at (zamanlanmış SMS gönderimi).
// Run: npm run db:migrate-v26
import "../env";
import mysql from "mysql2/promise";

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL gerekli");
  const conn = await mysql.createConnection({ uri: databaseUrl, multipleStatements: true });

  const [cols]: any = await conn.query(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sms_outbox' AND COLUMN_NAME = 'scheduled_at'`
  );
  if (!cols.length) {
    await conn.query(`ALTER TABLE sms_outbox ADD COLUMN scheduled_at TIMESTAMP NULL AFTER locked_until`);
    await conn.query(`ALTER TABLE sms_outbox ADD INDEX idx_sms_outbox_scheduled (scheduled_at)`);
    console.log("v26: sms_outbox.scheduled_at eklendi.");
  } else {
    console.log("v26: sms_outbox.scheduled_at zaten mevcut, atlanıyor.");
  }

  await conn.end();
  console.log("v26 tamam.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
