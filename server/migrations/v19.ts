// Idempotent migration for v19: Fason firmaları (B2B cari hesap) tablosu.
// Run: npm run db:migrate-v19
import "../env";
import mysql from "mysql2/promise";

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL gerekli");
  const conn = await mysql.createConnection({ uri: databaseUrl, multipleStatements: true });

  await conn.query(`
    CREATE TABLE IF NOT EXISTS fason_firms (
      id INT AUTO_INCREMENT PRIMARY KEY,
      restaurant_id INT NOT NULL,
      kind VARCHAR(16) NOT NULL,
      name VARCHAR(128) NOT NULL,
      phone VARCHAR(32) NOT NULL,
      address VARCHAR(512) NULL,
      discount_percent DECIMAL(5,2) NOT NULL DEFAULT 0,
      debt DECIMAL(10,2) NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_fason_firms_restaurant (restaurant_id),
      CONSTRAINT fk_fason_firms_restaurant FOREIGN KEY (restaurant_id) REFERENCES restaurants(id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log("v19: fason_firms hazır.");

  await conn.end();
  console.log("v19 tamam.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
