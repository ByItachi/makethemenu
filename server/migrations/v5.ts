// Idempotent migration for v5: menu analytics events + per-tenant order toggle.
// Safe to run repeatedly; never drops or alters existing data. Take a DB backup first.
// Run: npm run db:migrate-v5
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
  await conn.query(`CREATE TABLE IF NOT EXISTS menu_events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    restaurant_id INT NOT NULL,
    type VARCHAR(32) NOT NULL,
    product_id INT NULL,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_menu_events_restaurant (restaurant_id, created_at),
    CONSTRAINT fk_menu_events_restaurant FOREIGN KEY (restaurant_id) REFERENCES restaurants(id),
    CONSTRAINT fk_menu_events_product FOREIGN KEY (product_id) REFERENCES products(id)
  )`);
  if (!(await columnExists(conn, "restaurants", "orders_enabled"))) {
    await conn.query("ALTER TABLE restaurants ADD COLUMN orders_enabled BOOLEAN NOT NULL DEFAULT FALSE");
  }
  const orderCols: Array<[string, string]> = [
    ["customer_name", "VARCHAR(120) NULL"],
    ["phone", "VARCHAR(32) NULL"],
    ["note", "TEXT NULL"],
  ];
  for (const [col, def] of orderCols) {
    if (!(await columnExists(conn, "orders", col))) {
      await conn.query(`ALTER TABLE orders ADD COLUMN \`${col}\` ${def}`);
    }
  }
  console.log("v5 migration tamam");
  await conn.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
