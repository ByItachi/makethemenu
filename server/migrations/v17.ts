// Idempotent migration for v17: teslimat oturumları + su siparişinde tür (damacana|tup) + tüp ürün seed'i.
// Run: npm run db:migrate-v17
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
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL gerekli");
  const conn = await mysql.createConnection({ uri: databaseUrl, multipleStatements: true });

  if (!(await columnExists(conn, "water_orders", "kind"))) {
    await conn.query("ALTER TABLE water_orders ADD COLUMN kind VARCHAR(16) NOT NULL DEFAULT 'damacana'");
    console.log("v17: water_orders.kind eklendi.");
  }

  await conn.query(`
    CREATE TABLE IF NOT EXISTS delivery_sessions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      restaurant_id INT NOT NULL,
      kind VARCHAR(16) NOT NULL,
      order_no VARCHAR(32) NOT NULL,
      driver_name VARCHAR(96) NULL,
      status VARCHAR(16) NOT NULL DEFAULT 'active',
      last_lat DOUBLE NULL,
      last_lng DOUBLE NULL,
      last_accuracy DOUBLE NULL,
      last_ping_at TIMESTAMP NULL,
      started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      ended_at TIMESTAMP NULL,
      INDEX idx_delivery_sessions_status (status),
      INDEX idx_delivery_sessions_restaurant (restaurant_id),
      CONSTRAINT fk_delivery_sessions_restaurant FOREIGN KEY (restaurant_id) REFERENCES restaurants(id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log("v17: delivery_sessions hazır.");

  // Demo işletme (97) için tüp ürünleri — işletme mevcutsa ve halihazırda tüp ürünü yoksa ekle.
  const [restaurant97] = await conn.query<mysql.RowDataPacket[]>(
    "SELECT id FROM restaurants WHERE id = 97",
  );
  const [rows] = await conn.query<mysql.RowDataPacket[]>(
    "SELECT COUNT(*) n FROM water_products WHERE restaurant_id = 97 AND kind = 'tup'",
  );
  if (restaurant97.length > 0 && Number((rows[0] as { n: number }).n) === 0) {
    await conn.query(`
      INSERT INTO water_products (restaurant_id, name, kind, price, deposit_fee, is_active) VALUES
        (97, '12,5 kg Tüp Dolum', 'tup', 350.00, 150.00, 1),
        (97, '45 kg Tüp Dolum', 'tup', 1150.00, 500.00, 1)
    `);
    console.log("v17: tüp ürünleri seed'lendi.");
  }

  await conn.end();
  console.log("v17 tamam.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
