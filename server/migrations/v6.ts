// Idempotent migration v6: 3D menu models, plan 3D quotas, custom domains.
// Safe to run repeatedly. Never drops data. Take a DB backup first.
// Run: npm run db:migrate-v6
import "../env";
import mysql from "mysql2/promise";

// Free plans keep 3D but with a small quota; higher plans get more (null = unlimited).
const DEFAULT_3D_QUOTAS: Array<[string, number | null]> = [
  ["free", 2],
  ["starter", 5],
  ["pro", 25],
  ["business", null],
  ["enterprise", null],
];

export async function migrateV6(url: string): Promise<void> {
  const conn = await mysql.createConnection(url);
  try {
    await conn.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS model_3d_url TEXT NULL`);

    await conn.query(`ALTER TABLE plans ADD COLUMN IF NOT EXISTS max_3d_models INT NULL`);
    for (const [code, quota] of DEFAULT_3D_QUOTAS) {
      // Only fills values that are still NULL: an admin's edits are never overwritten.
      await conn.query(`UPDATE plans SET max_3d_models = ? WHERE code = ? AND max_3d_models IS NULL`, [quota, code]);
    }

    await conn.query(`
      CREATE TABLE IF NOT EXISTS restaurant_domains (
        id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        restaurant_id INT NOT NULL,
        domain VARCHAR(255) NOT NULL UNIQUE,
        status VARCHAR(16) NOT NULL DEFAULT 'pending',
        verification_token VARCHAR(64) NOT NULL,
        verified_at TIMESTAMP NULL,
        created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_domains_restaurant FOREIGN KEY (restaurant_id) REFERENCES restaurants(id)
      )`);
  } finally {
    await conn.end();
  }
}

// Direct execution support
if (process.argv[1] && process.argv[1].endsWith("v6.ts")) {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL gerekli.");
    process.exit(1);
  }
  migrateV6(url)
    .then(() => {
      console.log("v6 migration tamamlandı.");
      process.exit(0);
    })
    .catch((err) => {
      console.error("v6 migration hatası:", err);
      process.exit(1);
    });
}
