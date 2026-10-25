// Seed script: Mevcut 46 statik preset'i templates tablosuna ekler.
// Idempotent: Aynı slug'a sahip kayıt varsa atlar.
// Run: npm run db:seed-templates
import "../env";
import mysql from "mysql2/promise";

const PRESETS_PATH = "../../client/src/lib/menu-presets";

async function main() {
  const { MENU_PRESETS } = await import(PRESETS_PATH);
  const conn = await mysql.createConnection(process.env.DATABASE_URL!);

  let inserted = 0;
  let skipped = 0;

  for (const preset of MENU_PRESETS) {
    const [existing] = await conn.query<mysql.RowDataPacket[]>(
      "SELECT id FROM templates WHERE slug = ?",
      [preset.id],
    );
    if ((existing as any[]).length > 0) {
      skipped++;
      continue;
    }

    await conn.query(
      `INSERT INTO templates (slug, name, category, status, visibility, is_featured, data)
       VALUES (?, ?, ?, 'published', 'customer', FALSE, ?)`,
      [preset.id, preset.name, preset.category, JSON.stringify(preset)],
    );
    inserted++;
  }

  await conn.end();
  console.log(`Seed tamamlandı: ${inserted} eklendi, ${skipped} zaten mevcut (toplam ${MENU_PRESETS.length})`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
