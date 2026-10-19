// Idempotent migration v7: Eklenti Merkezi tablosu (restoran bazlı modüller).
// Safe to run repeatedly. Never drops data. Take a DB backup first.
// Run: npm run db:migrate-v7
import "../env";
import mysql from "mysql2/promise";

export async function migrateV7(url: string): Promise<void> {
  const conn = await mysql.createConnection(url);
  try {
    await conn.query(`
      CREATE TABLE IF NOT EXISTS restaurant_plugins (
        id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        restaurant_id INT NOT NULL,
        plugin_key VARCHAR(64) NOT NULL,
        is_enabled TINYINT(1) NOT NULL DEFAULT 0,
        settings JSON NULL,
        created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uq_restaurant_plugin (restaurant_id, plugin_key),
        CONSTRAINT fk_restaurant_plugins_restaurant FOREIGN KEY (restaurant_id) REFERENCES restaurants(id)
      )`);
  } finally {
    await conn.end();
  }
}

// Direct execution support
if (process.argv[1] && process.argv[1].endsWith("v7.ts")) {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL gerekli.");
    process.exit(1);
  }
  migrateV7(url)
    .then(() => {
      console.log("v7 migration tamamlandı.");
      process.exit(0);
    })
    .catch((err) => {
      console.error("v7 migration hatası:", err);
      process.exit(1);
    });
}
