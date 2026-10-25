// Idempotent migration for v13: Uygulama Mağazası entegrasyon satın alımları
// (integration_purchases). Safe to run repeatedly; never drops or alters existing data.
// Run: npm run db:migrate-v13
import "../env";
import mysql from "mysql2/promise";

async function tableExists(conn: mysql.Connection, table: string) {
  const [rows] = await conn.query<mysql.RowDataPacket[]>(
    "SELECT COUNT(*) n FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?",
    [table],
  );
  return Number((rows[0] as { n: number }).n) > 0;
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL gerekli");
  const conn = await mysql.createConnection({
    uri: databaseUrl,
    multipleStatements: true,
  });

  if (!(await tableExists(conn, "integration_purchases"))) {
    await conn.query(`
      CREATE TABLE integration_purchases (
        id INT AUTOINCREMENT_PLACEHOLDER PRIMARY KEY,
        restaurant_id INT NOT NULL,
        order_no VARCHAR(32) NOT NULL UNIQUE,
        plugin_key VARCHAR(64) NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        billing_cycle VARCHAR(16) NOT NULL DEFAULT 'monthly',
        billing_info JSON NULL,
        card_brand VARCHAR(16) NULL,
        card_last4 VARCHAR(4) NULL,
        status VARCHAR(16) NOT NULL DEFAULT 'succeeded',
        invoice_no VARCHAR(32) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_integration_purchase_restaurant (restaurant_id),
        CONSTRAINT fk_integration_purchase_restaurant FOREIGN KEY (restaurant_id) REFERENCES restaurants(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `.replace("AUTOINCREMENT_PLACEHOLDER", "AUTO_INCREMENT"));
    console.log("v13: integration_purchases tablosu oluşturuldu.");
  } else {
    console.log("v13: integration_purchases zaten mevcut, atlandı.");
  }

  await conn.end();
}

main().catch((err) => {
  console.error("v13 migration hatası:", err);
  process.exit(1);
});
