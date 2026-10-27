// Idempotent migration for v16: prompt-4 — Su dağıtım, halı yıkama, filo/GPS tabloları.
// Run: npm run db:migrate-v16
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

  if (!(await tableExists(conn, "water_products"))) {
    await conn.query(`
      CREATE TABLE water_products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        restaurant_id INT NOT NULL,
        name VARCHAR(128) NOT NULL,
        kind VARCHAR(24) NOT NULL DEFAULT 'damacana',
        price DECIMAL(10,2) NOT NULL DEFAULT 0,
        deposit_fee DECIMAL(10,2) NOT NULL DEFAULT 0,
        is_active TINYINT(1) NOT NULL DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_water_products_restaurant (restaurant_id),
        CONSTRAINT fk_water_products_restaurant FOREIGN KEY (restaurant_id) REFERENCES restaurants(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log("v16: water_products oluşturuldu.");
  }

  if (!(await tableExists(conn, "water_orders"))) {
    await conn.query(`
      CREATE TABLE water_orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        restaurant_id INT NOT NULL,
        order_no VARCHAR(32) NOT NULL UNIQUE,
        idempotency_key VARCHAR(64) NOT NULL UNIQUE,
        customer_name VARCHAR(128) NOT NULL,
        phone VARCHAR(32) NOT NULL,
        address_text VARCHAR(512) NOT NULL,
        items JSON NOT NULL,
        total DECIMAL(10,2) NOT NULL DEFAULT 0,
        filled_delivered INT NOT NULL DEFAULT 0,
        empty_taken INT NOT NULL DEFAULT 0,
        scheduled_date VARCHAR(16) NOT NULL,
        time_slot VARCHAR(32) NOT NULL DEFAULT '10:00-13:00',
        note VARCHAR(512) NULL,
        payment_method VARCHAR(24) NOT NULL DEFAULT 'cash',
        paid_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
        status VARCHAR(24) NOT NULL DEFAULT 'new',
        fail_reason VARCHAR(256) NULL,
        vehicle_id INT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_water_orders_restaurant (restaurant_id),
        CONSTRAINT fk_water_orders_restaurant FOREIGN KEY (restaurant_id) REFERENCES restaurants(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log("v16: water_orders oluşturuldu.");
  }

  if (!(await tableExists(conn, "carpet_orders"))) {
    await conn.query(`
      CREATE TABLE carpet_orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        restaurant_id INT NOT NULL,
        order_no VARCHAR(32) NOT NULL UNIQUE,
        idempotency_key VARCHAR(64) NOT NULL UNIQUE,
        customer_name VARCHAR(128) NOT NULL,
        phone VARCHAR(32) NOT NULL,
        address_text VARCHAR(512) NOT NULL,
        service_type VARCHAR(32) NOT NULL DEFAULT 'pickup_delivery',
        estimated_price DECIMAL(10,2) NOT NULL DEFAULT 0,
        approved_price DECIMAL(10,2) NULL,
        paid_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
        pickup_date VARCHAR(16) NOT NULL,
        time_slot VARCHAR(32) NOT NULL DEFAULT '10:00-13:00',
        note VARCHAR(512) NULL,
        status VARCHAR(32) NOT NULL DEFAULT 'requested',
        fail_reason VARCHAR(256) NULL,
        vehicle_id INT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_carpet_orders_restaurant (restaurant_id),
        CONSTRAINT fk_carpet_orders_restaurant FOREIGN KEY (restaurant_id) REFERENCES restaurants(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log("v16: carpet_orders oluşturuldu.");
  }

  if (!(await tableExists(conn, "carpet_items"))) {
    await conn.query(`
      CREATE TABLE carpet_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT NOT NULL,
        restaurant_id INT NOT NULL,
        label_code VARCHAR(24) NOT NULL UNIQUE,
        carpet_type VARCHAR(48) NOT NULL DEFAULT 'yonasilmis',
        size_w INT NOT NULL DEFAULT 0,
        size_h INT NOT NULL DEFAULT 0,
        sqm DECIMAL(8,2) NOT NULL DEFAULT 0,
        color_desc VARCHAR(128) NULL,
        condition_note VARCHAR(512) NULL,
        status VARCHAR(32) NOT NULL DEFAULT 'requested',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_carpet_items_order (order_id),
        CONSTRAINT fk_carpet_items_order FOREIGN KEY (order_id) REFERENCES carpet_orders(id),
        CONSTRAINT fk_carpet_items_restaurant FOREIGN KEY (restaurant_id) REFERENCES restaurants(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log("v16: carpet_items oluşturuldu.");
  }

  if (!(await tableExists(conn, "carpet_events"))) {
    await conn.query(`
      CREATE TABLE carpet_events (
        id INT AUTO_INCREMENT PRIMARY KEY,
        item_id INT NULL,
        order_id INT NOT NULL,
        restaurant_id INT NOT NULL,
        from_status VARCHAR(32) NULL,
        to_status VARCHAR(32) NOT NULL,
        actor VARCHAR(128) NOT NULL DEFAULT 'sistem',
        note VARCHAR(512) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_carpet_events_item (item_id),
        INDEX idx_carpet_events_order (order_id),
        CONSTRAINT fk_carpet_events_item FOREIGN KEY (item_id) REFERENCES carpet_items(id),
        CONSTRAINT fk_carpet_events_order FOREIGN KEY (order_id) REFERENCES carpet_orders(id),
        CONSTRAINT fk_carpet_events_restaurant FOREIGN KEY (restaurant_id) REFERENCES restaurants(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log("v16: carpet_events oluşturuldu.");
  }

  if (!(await tableExists(conn, "vehicles"))) {
    await conn.query(`
      CREATE TABLE vehicles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        restaurant_id INT NOT NULL,
        internal_code VARCHAR(24) NOT NULL UNIQUE,
        plate VARCHAR(24) NOT NULL,
        name VARCHAR(96) NULL,
        brand VARCHAR(48) NULL,
        model_year INT NULL,
        capacity INT NOT NULL DEFAULT 0,
        driver_name VARCHAR(96) NULL,
        status VARCHAR(24) NOT NULL DEFAULT 'active',
        gps_method VARCHAR(24) NOT NULL DEFAULT 'none',
        gps_device_id VARCHAR(64) NULL,
        last_lat DECIMAL(10,6) NULL,
        last_lng DECIMAL(10,6) NULL,
        last_seen_at TIMESTAMP NULL,
        is_active TINYINT(1) NOT NULL DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uq_vehicle_restaurant_plate (restaurant_id, plate),
        CONSTRAINT fk_vehicles_restaurant FOREIGN KEY (restaurant_id) REFERENCES restaurants(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log("v16: vehicles oluşturuldu.");
  }

  if (!(await tableExists(conn, "vehicle_locations"))) {
    await conn.query(`
      CREATE TABLE vehicle_locations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        vehicle_id INT NOT NULL,
        restaurant_id INT NOT NULL,
        lat DECIMAL(10,6) NOT NULL,
        lng DECIMAL(10,6) NOT NULL,
        speed DECIMAL(6,2) NULL,
        source VARCHAR(24) NOT NULL DEFAULT 'driver_app',
        recorded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_vl_vehicle_time (vehicle_id, recorded_at),
        CONSTRAINT fk_vl_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
        CONSTRAINT fk_vl_restaurant FOREIGN KEY (restaurant_id) REFERENCES restaurants(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log("v16: vehicle_locations oluşturuldu.");
  }

  // Demo işletme (id 97) için su ürün kataloğu + 2 araç seed'i (yoksa, ve işletme mevcutsa).
  const [restaurant97] = await conn.query<mysql.RowDataPacket[]>(
    "SELECT id FROM restaurants WHERE id = 97",
  );
  const hasRestaurant97 = restaurant97.length > 0;

  const [prodCount] = await conn.query<mysql.RowDataPacket[]>(
    "SELECT COUNT(*) n FROM water_products WHERE restaurant_id = 97",
  );
  if (hasRestaurant97 && Number((prodCount[0] as { n: number }).n) === 0) {
    await conn.query(`
      INSERT INTO water_products (restaurant_id, name, kind, price, deposit_fee) VALUES
        (97, '19 L Damacana', 'damacana', 60.00, 45.00),
        (97, '12 L Damacana', 'damacana', 50.00, 45.00),
        (97, '5 L Pet Sise 6 Adet', 'pet_sise', 45.00, 0.00),
        (97, 'Su Kolisi (24 x 0.5 L)', 'koli', 55.00, 0.00);
    `);
    console.log("v16: demo su ürünleri seed'lendi (restaurant 97).");
  }

  const [vehCount] = await conn.query<mysql.RowDataPacket[]>(
    "SELECT COUNT(*) n FROM vehicles WHERE restaurant_id = 97",
  );
  if (hasRestaurant97 && Number((vehCount[0] as { n: number }).n) === 0) {
    await conn.query(`
      INSERT INTO vehicles (restaurant_id, internal_code, plate, name, capacity, driver_name, gps_method) VALUES
        (97, 'MMT-VEH-001', '34 ABC 123', 'Su Dağıtım Aracı 1', 60, 'Mehmet K.', 'driver_app'),
        (97, 'MMT-VEH-002', '06 DEF 456', 'Halı Teslim Aracı', 40, 'Ali Y.', 'none');
    `);
    console.log("v16: demo araçlar seed'lendi (restaurant 97).");
  }

  await conn.end();
  console.log("v16 migration tamamlandı.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
