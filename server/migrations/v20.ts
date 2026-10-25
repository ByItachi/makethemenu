// Idempotent migration for v20: carpet_orders.category (hali | koltuk) — Halı Yıkama / Koltuk Yıkama ayrımı.
// Run: npm run db:migrate-v20
import "../env";
import mysql from "mysql2/promise";

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL gerekli");
  const conn = await mysql.createConnection({ uri: databaseUrl, multipleStatements: true });

  const [cols]: any = await conn.query(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'carpet_orders' AND COLUMN_NAME = 'category'`
  );
  if (!cols.length) {
    await conn.query(`ALTER TABLE carpet_orders ADD COLUMN category VARCHAR(16) NOT NULL DEFAULT 'hali' AFTER service_type`);
    console.log("v20: carpet_orders.category eklendi.");
  } else {
    console.log("v20: carpet_orders.category zaten mevcut, atlanıyor.");
  }

  await conn.end();
  console.log("v20 tamam.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
