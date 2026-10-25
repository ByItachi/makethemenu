// v14 — Entegrasyon Merkezi tabloları (idempotent): integration_connections,
// integration_sync_jobs, integration_logs, external_order_mappings,
// webhook_endpoints, webhook_deliveries, integration_api_keys
// Run: npm run db:migrate-v14
import "../env";
import mysql from "mysql2/promise";

const TABLES: Array<{ name: string; ddl: string }> = [
  {
    name: "integration_connections",
    ddl: `CREATE TABLE IF NOT EXISTS integration_connections (
        id INT AUTO_INCREMENT PRIMARY KEY,
        restaurant_id INT NOT NULL,
        provider_key VARCHAR(64) NOT NULL,
        status VARCHAR(32) NOT NULL DEFAULT 'pending_config',
        credentials TEXT NULL,
        config JSON NULL,
        last_test_at TIMESTAMP NULL,
        last_test_ok BOOLEAN NULL,
        last_test_message TEXT NULL,
        last_sync_at TIMESTAMP NULL,
        last_error TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_integration_connection (restaurant_id, provider_key),
        CONSTRAINT fk_ic_connection_restaurant FOREIGN KEY (restaurant_id) REFERENCES restaurants(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  },
  {
    name: "integration_sync_jobs",
    ddl: `CREATE TABLE IF NOT EXISTS integration_sync_jobs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        restaurant_id INT NOT NULL,
        provider_key VARCHAR(64) NOT NULL,
        job_type VARCHAR(40) NOT NULL,
        status VARCHAR(16) NOT NULL DEFAULT 'queued',
        attempts INT NOT NULL DEFAULT 0,
        max_attempts INT NOT NULL DEFAULT 3,
        payload JSON NULL,
        result JSON NULL,
        error TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        started_at TIMESTAMP NULL,
        finished_at TIMESTAMP NULL,
        INDEX idx_sync_job_restaurant (restaurant_id),
        CONSTRAINT fk_ic_job_restaurant FOREIGN KEY (restaurant_id) REFERENCES restaurants(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  },
  {
    name: "integration_logs",
    ddl: `CREATE TABLE IF NOT EXISTS integration_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        restaurant_id INT NOT NULL,
        provider_key VARCHAR(64) NULL,
        level VARCHAR(16) NOT NULL DEFAULT 'info',
        event VARCHAR(64) NOT NULL,
        message TEXT NULL,
        meta JSON NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_integration_log_restaurant (restaurant_id),
        CONSTRAINT fk_ic_log_restaurant FOREIGN KEY (restaurant_id) REFERENCES restaurants(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  },
  {
    name: "external_order_mappings",
    ddl: `CREATE TABLE IF NOT EXISTS external_order_mappings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        restaurant_id INT NOT NULL,
        provider_key VARCHAR(64) NOT NULL,
        external_order_id VARCHAR(128) NOT NULL,
        internal_order_id INT NULL,
        status VARCHAR(32) NOT NULL DEFAULT 'received',
        metadata JSON NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NULL,
        UNIQUE KEY uq_external_order (provider_key, external_order_id),
        INDEX idx_external_order_restaurant (restaurant_id),
        CONSTRAINT fk_ext_order_restaurant FOREIGN KEY (restaurant_id) REFERENCES restaurants(id),
        CONSTRAINT fk_ext_order_internal FOREIGN KEY (internal_order_id) REFERENCES orders(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  },
  {
    name: "webhook_endpoints",
    ddl: `CREATE TABLE IF NOT EXISTS webhook_endpoints (
        id INT AUTO_INCREMENT PRIMARY KEY,
        restaurant_id INT NOT NULL,
        url VARCHAR(512) NOT NULL,
        description VARCHAR(200) NULL,
        events JSON NOT NULL,
        secret_masked VARCHAR(80) NULL,
        secret_encrypted TEXT NULL,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_webhook_endpoint_restaurant (restaurant_id),
        CONSTRAINT fk_webhook_endpoint_restaurant FOREIGN KEY (restaurant_id) REFERENCES restaurants(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  },
  {
    name: "webhook_deliveries",
    ddl: `CREATE TABLE IF NOT EXISTS webhook_deliveries (
        id INT AUTO_INCREMENT PRIMARY KEY,
        endpoint_id INT NOT NULL,
        restaurant_id INT NOT NULL,
        event VARCHAR(64) NOT NULL,
        payload JSON NULL,
        status VARCHAR(16) NOT NULL DEFAULT 'pending',
        response_code INT NULL,
        attempts INT NOT NULL DEFAULT 0,
        error TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        delivered_at TIMESTAMP NULL,
        INDEX idx_webhook_delivery_endpoint (endpoint_id),
        CONSTRAINT fk_webhook_delivery_endpoint FOREIGN KEY (endpoint_id) REFERENCES webhook_endpoints(id),
        CONSTRAINT fk_webhook_delivery_restaurant FOREIGN KEY (restaurant_id) REFERENCES restaurants(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  },
  {
    name: "integration_api_keys",
    ddl: `CREATE TABLE IF NOT EXISTS integration_api_keys (
        id INT AUTO_INCREMENT PRIMARY KEY,
        restaurant_id INT NOT NULL,
        label VARCHAR(120) NOT NULL,
        key_hash VARCHAR(64) NOT NULL UNIQUE,
        key_prefix VARCHAR(24) NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        last_used_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_api_key_restaurant (restaurant_id),
        CONSTRAINT fk_api_key_restaurant FOREIGN KEY (restaurant_id) REFERENCES restaurants(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  },
];

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
  const conn = await mysql.createConnection({ uri: databaseUrl, multipleStatements: true });

  for (const t of TABLES) {
    if (await tableExists(conn, t.name)) {
      console.log(`v14: ${t.name} zaten mevcut, atlandı.`);
    } else {
      await conn.query(t.ddl);
      console.log(`v14: ${t.name} oluşturuldu.`);
    }
  }
  await conn.end();
}

main().catch((err) => {
  console.error("v14 migration hatası:", err);
  process.exit(1);
});
