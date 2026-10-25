// Idempotent migration for v10: şablon oluşturucu (özel tasarım + sürükle-bırak sıralama).
// Safe to run repeatedly; never drops or alters existing data. Take a DB backup first.
// Run: npm run db:migrate-v10
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
  if (!(await columnExists(conn, "restaurants", "custom_preset"))) {
    await conn.query("ALTER TABLE `restaurants` ADD COLUMN `custom_preset` JSON NULL");
  }
  if (!(await columnExists(conn, "categories", "sort_order"))) {
    await conn.query("ALTER TABLE `categories` ADD COLUMN `sort_order` INT NOT NULL DEFAULT 0");
  }
  if (!(await columnExists(conn, "products", "sort_order"))) {
    await conn.query("ALTER TABLE `products` ADD COLUMN `sort_order` INT NOT NULL DEFAULT 0");
  }
  await conn.end();
  console.log("v10 migration tamam");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
