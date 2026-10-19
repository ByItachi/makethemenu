// Idempotent migration: adds multi-tenant (restaurant_id), slug, auth and audit columns.
// Existing rows are attached to a default business so no data is lost.
// Run: npm run db:migrate-tenancy   (take a DB backup first)
import "../env";
import mysql from "mysql2/promise";
import { slugify, validateSlug } from "@shared/slug";

const TENANT_TABLES = ["tables", "categories", "products", "orders"] as const;

export async function migrateTenancy(url: string): Promise<{ defaultRestaurantId: number }> {
  const conn = await mysql.createConnection(url);
  try {
    // 1. Columns (MariaDB supports IF NOT EXISTS)
    for (const t of TENANT_TABLES) {
      await conn.query(`ALTER TABLE \`${t}\` ADD COLUMN IF NOT EXISTS restaurant_id INT NULL`);
    }
    await conn.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS restaurant_id INT NULL`);
    await conn.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_platform_admin TINYINT(1) NOT NULL DEFAULT 0`);
    await conn.query(`ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS slug VARCHAR(63) NULL`);
    await conn.query(`ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS owner_user_id INT NULL`);
    await conn.query(`ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS is_published TINYINT(1) NOT NULL DEFAULT 0`);
    await conn.query(`ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS description TEXT NULL`);
    await conn.query(`ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS phone VARCHAR(32) NULL`);
    await conn.query(`ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS currency VARCHAR(3) NOT NULL DEFAULT 'TRY'`);
    await conn.query(`CREATE UNIQUE INDEX IF NOT EXISTS slug ON restaurants (slug)`);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS restaurant_slug_redirects (
        old_slug VARCHAR(63) PRIMARY KEY,
        restaurant_id INT NOT NULL,
        created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_slug_redirect_restaurant FOREIGN KEY (restaurant_id) REFERENCES restaurants(id)
      )`);
    await conn.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        restaurant_id INT NULL,
        actor_user_id INT NULL,
        action VARCHAR(64) NOT NULL,
        entity VARCHAR(64) NULL,
        entity_id VARCHAR(64) NULL,
        ip VARCHAR(64) NULL,
        meta JSON NULL,
        created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_audit_restaurant (restaurant_id)
      )`);

    // 2. Default business for legacy (tenant-less) rows
    const [legacyCount] = await conn.query<mysql.RowDataPacket[]>(
      `SELECT (SELECT COUNT(*) FROM tables WHERE restaurant_id IS NULL)
            + (SELECT COUNT(*) FROM categories WHERE restaurant_id IS NULL)
            + (SELECT COUNT(*) FROM products WHERE restaurant_id IS NULL)
            + (SELECT COUNT(*) FROM orders WHERE restaurant_id IS NULL)
            + (SELECT COUNT(*) FROM users WHERE restaurant_id IS NULL) AS n`
    );
    const [existingDefault] = await conn.query<mysql.RowDataPacket[]>(
      `SELECT id FROM restaurants WHERE slug = 'varsayilan-isletme' LIMIT 1`
    );
    let defaultId: number;
    if (existingDefault.length) {
      defaultId = existingDefault[0].id;
    } else {
      const [ins] = await conn.query<mysql.ResultSetHeader>(
        `INSERT INTO restaurants (name, type, address, country, status, slug, currency)
         VALUES ('Varsayılan İşletme', 'Restoran', '-', 'Türkiye', 'active', 'varsayilan-isletme', 'TRY')`
      );
      defaultId = ins.insertId;
      console.log(`Created default business #${defaultId} (legacy rows: ${legacyCount[0].n})`);
    }

    // 3. Backfill legacy rows
    for (const t of TENANT_TABLES) {
      await conn.query(`UPDATE \`${t}\` SET restaurant_id = ? WHERE restaurant_id IS NULL`, [defaultId]);
    }
    await conn.query(`UPDATE users SET restaurant_id = ? WHERE restaurant_id IS NULL AND is_platform_admin = 0`, [defaultId]);
    // Existing demo admin account becomes the platform administrator
    await conn.query(`UPDATE users SET is_platform_admin = 1 WHERE username = 'admin'`);

    // 4. Slugs for businesses without one
    const [noSlug] = await conn.query<mysql.RowDataPacket[]>(`SELECT id, name FROM restaurants WHERE slug IS NULL ORDER BY id`);
    for (const r of noSlug) {
      let base = slugify(String(r.name));
      if (validateSlug(base) !== null) base = `isletme-${r.id}`;
      let candidate = base;
      for (let i = 2; ; i++) {
        const [taken] = await conn.query<mysql.RowDataPacket[]>(`SELECT id FROM restaurants WHERE slug = ? LIMIT 1`, [candidate]);
        if (!taken.length) break;
        candidate = `${base.slice(0, 55)}-${i}`;
      }
      await conn.query(`UPDATE restaurants SET slug = ? WHERE id = ?`, [candidate, r.id]);
    }

    // 5. Enforce tenant ownership on data rows
    for (const t of TENANT_TABLES) {
      await conn.query(`ALTER TABLE \`${t}\` MODIFY restaurant_id INT NOT NULL`);
      await conn.query(`CREATE INDEX IF NOT EXISTS idx_${t}_restaurant ON \`${t}\` (restaurant_id)`);
    }

    // 6. Foreign keys (added once)
    const fks: [string, string, string, string][] = [
      ["tables", "fk_tables_restaurant", "restaurant_id", "restaurants(id)"],
      ["categories", "fk_categories_restaurant", "restaurant_id", "restaurants(id)"],
      ["products", "fk_products_restaurant", "restaurant_id", "restaurants(id)"],
      ["orders", "fk_orders_restaurant", "restaurant_id", "restaurants(id)"],
      ["users", "fk_users_restaurant", "restaurant_id", "restaurants(id)"],
      ["restaurants", "fk_restaurants_owner", "owner_user_id", "users(id)"],
    ];
    for (const [table, name, col, ref] of fks) {
      const [exists] = await conn.query<mysql.RowDataPacket[]>(
        `SELECT 1 FROM information_schema.TABLE_CONSTRAINTS
         WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = ? AND CONSTRAINT_NAME = ?`,
        [table, name]
      );
      if (!exists.length) {
        await conn.query(`ALTER TABLE \`${table}\` ADD CONSTRAINT \`${name}\` FOREIGN KEY (\`${col}\`) REFERENCES ${ref}`);
      }
    }

    console.log("Tenancy migration completed.");
    return { defaultRestaurantId: defaultId };
  } finally {
    await conn.end();
  }
}

// CLI entry
if (process.argv[1] && process.argv[1].replace(/\\/g, "/").endsWith("migrations/tenancy.ts")) {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  migrateTenancy(url).then(
    () => process.exit(0),
    (err) => {
      console.error("Migration failed:", err.message);
      process.exit(1);
    }
  );
}
