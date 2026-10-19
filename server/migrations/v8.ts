// Idempotent migration for v8: menu personalization + payment types.
// Safe to run repeatedly; never drops or alters existing data. Take a DB backup first.
// Run: npm run db:migrate-v8
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
  const cols: Array<[string, string]> = [
    ["menu_theme", `VARCHAR(32) NOT NULL DEFAULT 'yesil'`],
    ["menu_radius", "INT NOT NULL DEFAULT 12"],
    ["menu_template", `VARCHAR(32) NOT NULL DEFAULT 'liste'`],
    ["show_product_images", "BOOLEAN NOT NULL DEFAULT TRUE"],
    ["menu_language", `VARCHAR(8) NOT NULL DEFAULT 'tr'`],
    ["payment_types", "JSON NULL"],
  ];
  for (const [col, def] of cols) {
    if (!(await columnExists(conn, "restaurants", col))) {
      await conn.query(`ALTER TABLE restaurants ADD COLUMN \`${col}\` ${def}`);
    }
  }
  await conn.end();
  console.log("v8 migration tamam");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
