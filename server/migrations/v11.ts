// Idempotent migration for v11: Şablon Stüdyosu (templates + demo_sites tabloları).
// Safe to run repeatedly; never drops or alters existing data. Take a DB backup first.
// Run: npm run db:migrate-v11
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
  const conn = await mysql.createConnection(process.env.DATABASE_URL!);

  if (!(await tableExists(conn, "templates"))) {
    await conn.query(`
      CREATE TABLE \`templates\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`slug\` VARCHAR(120) NOT NULL UNIQUE,
        \`name\` VARCHAR(160) NOT NULL,
        \`category\` VARCHAR(80) NOT NULL DEFAULT 'Genel',
        \`cover_image\` TEXT NULL,
        \`status\` VARCHAR(16) NOT NULL DEFAULT 'draft',
        \`visibility\` VARCHAR(16) NOT NULL DEFAULT 'customer',
        \`is_featured\` BOOLEAN NOT NULL DEFAULT FALSE,
        \`is_default\` BOOLEAN NOT NULL DEFAULT FALSE,
        \`plan_restriction\` VARCHAR(40) NULL,
        \`data\` JSON NOT NULL,
        \`usage_count\` INT NOT NULL DEFAULT 0,
        \`view_count\` INT NOT NULL DEFAULT 0,
        \`created_by\` INT NULL,
        \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
  }

  if (!(await tableExists(conn, "demo_sites"))) {
    await conn.query(`
      CREATE TABLE \`demo_sites\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`slug\` VARCHAR(120) NOT NULL UNIQUE,
        \`template_id\` INT NOT NULL,
        \`title\` VARCHAR(160) NOT NULL,
        \`seo_title\` VARCHAR(160) NULL,
        \`seo_description\` VARCHAR(320) NULL,
        \`og_image\` TEXT NULL,
        \`status\` VARCHAR(16) NOT NULL DEFAULT 'draft',
        \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT \`demo_sites_template_fk\` FOREIGN KEY (\`template_id\`) REFERENCES \`templates\`(\`id\`)
      )
    `);
  }

  await conn.end();
  console.log("v11 migration tamam");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
