// Idempotent migration for v9: product translations (diller ve çeviriler).
// Safe to run repeatedly; never drops or alters existing data. Take a DB backup first.
// Run: npm run db:migrate-v9
import "../env";
import mysql from "mysql2/promise";

async function columnExists(conn: mysql.Connection, table: string, column: string) {
  const [rows] = await conn.query<mysql.RowDataPacket[]>(
    "SELECT COUNT(*) n FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?",
    [table, column],
  );
  return Number((rows[0] as { n: number }).n) > 0;
}

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL!);
  if (!(await columnExists(conn, "products", "translations"))) {
    await conn.query("ALTER TABLE `products` ADD COLUMN `translations` JSON NULL");
  }
  await conn.end();
  console.log("v9 migration tamam");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
