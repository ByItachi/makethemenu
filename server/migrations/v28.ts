// Idempotent migration for v28: Cihaz eşleştirme altyapısı
// (Yazar Kasa / Kiosk / Caller ID / Android Caller ID).
// Run: npx tsx server/migrations/v28.ts
import "../env";
import mysql from "mysql2/promise";

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL gerekli");
  const conn = await mysql.createConnection({ uri: databaseUrl, multipleStatements: true });

  await conn.query(`
    CREATE TABLE IF NOT EXISTS devices (
      id INT AUTO_INCREMENT PRIMARY KEY,
      restaurant_id INT NOT NULL,
      type VARCHAR(32) NOT NULL,
      name VARCHAR(128) NOT NULL,
      pairing_code VARCHAR(16) NULL,
      pairing_code_expires_at TIMESTAMP NULL,
      token_hash VARCHAR(128) NULL,
      status VARCHAR(16) NOT NULL DEFAULT 'pending',
      meta TEXT NULL,
      last_seen_at TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_devices_pairing_code (pairing_code),
      INDEX idx_devices_restaurant (restaurant_id),
      INDEX idx_devices_type (type),
      CONSTRAINT fk_devices_restaurant FOREIGN KEY (restaurant_id) REFERENCES restaurants(id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    CREATE TABLE IF NOT EXISTS fiscal_print_jobs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      restaurant_id INT NOT NULL,
      device_id INT NOT NULL,
      order_id INT NULL,
      payload TEXT NOT NULL,
      status VARCHAR(16) NOT NULL DEFAULT 'queued',
      result_message VARCHAR(255) NULL,
      fiscal_no VARCHAR(64) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      completed_at TIMESTAMP NULL,
      INDEX idx_fiscal_jobs_device (device_id, status),
      INDEX idx_fiscal_jobs_restaurant (restaurant_id),
      CONSTRAINT fk_fiscal_jobs_restaurant FOREIGN KEY (restaurant_id) REFERENCES restaurants(id),
      CONSTRAINT fk_fiscal_jobs_device FOREIGN KEY (device_id) REFERENCES devices(id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    CREATE TABLE IF NOT EXISTS caller_id_events (
      id INT AUTO_INCREMENT PRIMARY KEY,
      restaurant_id INT NOT NULL,
      device_id INT NOT NULL,
      phone VARCHAR(32) NOT NULL,
      direction VARCHAR(16) NOT NULL DEFAULT 'incoming',
      customer_id INT NULL,
      acknowledged_at TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_caller_events_restaurant_time (restaurant_id, created_at),
      CONSTRAINT fk_caller_events_restaurant FOREIGN KEY (restaurant_id) REFERENCES restaurants(id),
      CONSTRAINT fk_caller_events_device FOREIGN KEY (device_id) REFERENCES devices(id),
      CONSTRAINT fk_caller_events_customer FOREIGN KEY (customer_id) REFERENCES crm_customers(id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log("v28: devices/fiscal_print_jobs/caller_id_events tabloları hazır.");

  await conn.end();
  console.log("v28 tamam.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
