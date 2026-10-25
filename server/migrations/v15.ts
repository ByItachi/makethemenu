// Idempotent migration for v15: Fiyat sayfasından gelen abonelik satın alımları
// (subscription_orders). Kimliksiz (anonim) satın alma akışı için restaurant_id
// NULL olabilir; ödeme tamamlandığında işletme hesabına sonradan bağlanabilir.
// Run: npm run db:migrate-v15
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

  if (!(await tableExists(conn, "subscription_orders"))) {
    await conn.query(`
      CREATE TABLE subscription_orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        restaurant_id INT NULL,
        order_no VARCHAR(32) NOT NULL UNIQUE,
        plan_id VARCHAR(32) NOT NULL,
        billing_cycle VARCHAR(16) NOT NULL DEFAULT 'monthly',
        period_amount DECIMAL(10,2) NOT NULL,
        vat_amount DECIMAL(10,2) NOT NULL,
        total_amount DECIMAL(10,2) NOT NULL,
        payment_method VARCHAR(16) NOT NULL DEFAULT 'card',
        billing_info JSON NOT NULL,
        card_brand VARCHAR(16) NULL,
        card_last4 VARCHAR(4) NULL,
        status VARCHAR(16) NOT NULL DEFAULT 'succeeded',
        invoice_no VARCHAR(32) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_subscription_orders_restaurant (restaurant_id),
        CONSTRAINT fk_subscription_orders_restaurant FOREIGN KEY (restaurant_id) REFERENCES restaurants(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log("v15: subscription_orders tablosu oluşturuldu.");
  } else {
    console.log("v15: subscription_orders zaten mevcut, atlandı.");
  }

  await conn.end();
}

main().catch((err) => {
  console.error("v15 migration hatası:", err);
  process.exit(1);
});
