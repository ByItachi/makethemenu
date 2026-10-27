// Idempotent migration for v27: Stok ve Maliyet, Personel ve Vardiya, Cari Müşteri
// native modülleri için tablolar.
// Run: npx tsx server/migrations/v27.ts
import "../env";
import mysql from "mysql2/promise";

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL gerekli");
  const conn = await mysql.createConnection({ uri: databaseUrl, multipleStatements: true });

  await conn.query(`
    CREATE TABLE IF NOT EXISTS stock_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      restaurant_id INT NOT NULL,
      name VARCHAR(128) NOT NULL,
      unit VARCHAR(16) NOT NULL DEFAULT 'adet',
      quantity DECIMAL(12,3) NOT NULL DEFAULT 0,
      min_quantity DECIMAL(12,3) NOT NULL DEFAULT 0,
      unit_cost DECIMAL(10,4) NOT NULL DEFAULT 0,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_stock_items_restaurant (restaurant_id),
      CONSTRAINT fk_stock_items_restaurant FOREIGN KEY (restaurant_id) REFERENCES restaurants(id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    CREATE TABLE IF NOT EXISTS stock_movements (
      id INT AUTO_INCREMENT PRIMARY KEY,
      restaurant_id INT NOT NULL,
      stock_item_id INT NOT NULL,
      type VARCHAR(16) NOT NULL,
      quantity DECIMAL(12,3) NOT NULL,
      unit_cost DECIMAL(10,4) NULL,
      reason VARCHAR(255) NULL,
      created_by INT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_stock_mov_item (stock_item_id),
      INDEX idx_stock_mov_restaurant (restaurant_id),
      CONSTRAINT fk_stock_mov_restaurant FOREIGN KEY (restaurant_id) REFERENCES restaurants(id),
      CONSTRAINT fk_stock_mov_item FOREIGN KEY (stock_item_id) REFERENCES stock_items(id),
      CONSTRAINT fk_stock_mov_user FOREIGN KEY (created_by) REFERENCES users(id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    CREATE TABLE IF NOT EXISTS product_recipes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      restaurant_id INT NOT NULL,
      product_id INT NOT NULL,
      stock_item_id INT NOT NULL,
      quantity_per_unit DECIMAL(12,4) NOT NULL,
      INDEX idx_recipe_product (product_id),
      UNIQUE KEY uq_recipe_product_stock (product_id, stock_item_id),
      CONSTRAINT fk_recipe_restaurant FOREIGN KEY (restaurant_id) REFERENCES restaurants(id),
      CONSTRAINT fk_recipe_product FOREIGN KEY (product_id) REFERENCES products(id),
      CONSTRAINT fk_recipe_stock_item FOREIGN KEY (stock_item_id) REFERENCES stock_items(id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    CREATE TABLE IF NOT EXISTS staff_members (
      id INT AUTO_INCREMENT PRIMARY KEY,
      restaurant_id INT NOT NULL,
      name VARCHAR(128) NOT NULL,
      phone VARCHAR(32) NULL,
      role VARCHAR(48) NOT NULL DEFAULT 'garson',
      hourly_wage DECIMAL(10,2) NULL,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_staff_restaurant (restaurant_id),
      CONSTRAINT fk_staff_restaurant FOREIGN KEY (restaurant_id) REFERENCES restaurants(id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    CREATE TABLE IF NOT EXISTS staff_shifts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      restaurant_id INT NOT NULL,
      staff_id INT NOT NULL,
      starts_at TIMESTAMP NOT NULL,
      ends_at TIMESTAMP NOT NULL,
      note VARCHAR(255) NULL,
      checked_in_at TIMESTAMP NULL,
      checked_out_at TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_shift_staff (staff_id),
      INDEX idx_shift_restaurant_time (restaurant_id, starts_at),
      CONSTRAINT fk_shift_restaurant FOREIGN KEY (restaurant_id) REFERENCES restaurants(id),
      CONSTRAINT fk_shift_staff FOREIGN KEY (staff_id) REFERENCES staff_members(id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    CREATE TABLE IF NOT EXISTS crm_customers (
      id INT AUTO_INCREMENT PRIMARY KEY,
      restaurant_id INT NOT NULL,
      name VARCHAR(128) NOT NULL,
      phone VARCHAR(32) NULL,
      email VARCHAR(160) NULL,
      balance DECIMAL(12,2) NOT NULL DEFAULT 0,
      loyalty_points INT NOT NULL DEFAULT 0,
      note VARCHAR(255) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_crm_customers_restaurant (restaurant_id),
      INDEX idx_crm_customers_phone (phone),
      CONSTRAINT fk_crm_customers_restaurant FOREIGN KEY (restaurant_id) REFERENCES restaurants(id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    CREATE TABLE IF NOT EXISTS crm_ledger_entries (
      id INT AUTO_INCREMENT PRIMARY KEY,
      restaurant_id INT NOT NULL,
      customer_id INT NOT NULL,
      type VARCHAR(16) NOT NULL,
      amount DECIMAL(12,2) NOT NULL,
      note VARCHAR(255) NULL,
      created_by INT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_crm_ledger_customer (customer_id),
      CONSTRAINT fk_crm_ledger_restaurant FOREIGN KEY (restaurant_id) REFERENCES restaurants(id),
      CONSTRAINT fk_crm_ledger_customer FOREIGN KEY (customer_id) REFERENCES crm_customers(id),
      CONSTRAINT fk_crm_ledger_user FOREIGN KEY (created_by) REFERENCES users(id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log("v27: stok/personel/cari tabloları hazır.");

  await conn.end();
  console.log("v27 tamam.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
