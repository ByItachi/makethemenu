// Idempotent migration for v18: sektör sürücü havuzu (halı/su/tüp ayrı sürücü sistemleri).
// - sector_drivers tablosu: her sektör kendi sürücü listesini yönetir.
// - delivery_sessions.driver_id, water_orders.driver_id, carpet_orders.driver_id: siparişe atanan sürücü.
// - Demo işletme (97) için sektör başına sürücü seed'i (otomatik atama hazır olsun).
// Run: npm run db:migrate-v18
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

  await conn.query(`
    CREATE TABLE IF NOT EXISTS sector_drivers (
      id INT AUTO_INCREMENT PRIMARY KEY,
      restaurant_id INT NOT NULL,
      sector VARCHAR(16) NOT NULL,
      name VARCHAR(96) NOT NULL,
      phone VARCHAR(32) NULL,
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_sector_drivers_pool (restaurant_id, sector),
      CONSTRAINT fk_sector_drivers_restaurant FOREIGN KEY (restaurant_id) REFERENCES restaurants(id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log("v18: sector_drivers hazır.");

  for (const [table, fk] of [
    ["delivery_sessions", "fk_delivery_sessions_restaurant"],
    ["water_orders", null],
    ["carpet_orders", null],
  ] as const) {
    if (!(await columnExists(conn, table, "driver_id"))) {
      await conn.query(`ALTER TABLE ${table} ADD COLUMN driver_id INT NULL`);
      console.log(`v18: ${table}.driver_id eklendi.`);
    }
  }

  // Demo işletme (97): her sektörde 2 sürücü — işletme mevcutsa, havuzlar sektör bazında ayrıdır.
  const [restaurant97] = await conn.query<mysql.RowDataPacket[]>(
    "SELECT id FROM restaurants WHERE id = 97",
  );
  const [rows] = await conn.query<mysql.RowDataPacket[]>(
    "SELECT COUNT(*) n FROM sector_drivers WHERE restaurant_id = 97",
  );
  if (restaurant97.length > 0 && Number((rows[0] as { n: number }).n) === 0) {
    await conn.query(`
      INSERT INTO sector_drivers (restaurant_id, sector, name, phone, is_active) VALUES
        (97, 'carpet', 'Mehmet Yılmaz', '0532 111 22 33', 1),
        (97, 'carpet', 'Ahmet Kaya',    '0532 222 33 44', 1),
        (97, 'water',  'Hasan Demir',   '0533 333 44 55', 1),
        (97, 'water',  'Osman Çelik',   '0533 444 55 66', 1),
        (97, 'tube',   'Murat Şen',     '0534 555 66 77', 1),
        (97, 'tube',   'İbrahim Ay',    '0534 666 77 88', 1)
    `);
    console.log("v18: demo sürücüler seed'lendi (halı/su/tüp ayrı havuzlar).");
  }

  await conn.end();
  console.log("v18 tamam.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
