// Seed script: /sablonlar vitrinindeki SHOWCASE_TEMPLATES listesini demo_sites
// tablosuna aktarır. Her showcase kaydı, presetId üzerinden templates
// tablosundaki ilgili şablona bağlanır (templates tablosu daha önce
// db:seed-templates ile doldurulmuş olmalı).
// Idempotent: Aynı slug'a sahip demo kaydı varsa atlar.
// Run: npm run db:seed-demos
import "../env";
import mysql from "mysql2/promise";

const SHOWCASE_PATH = "../../client/src/lib/template-showcase";

async function main() {
  const { SHOWCASE_TEMPLATES } = await import(SHOWCASE_PATH);
  const conn = await mysql.createConnection(process.env.DATABASE_URL!);

  let inserted = 0;
  let skipped = 0;
  let missingTemplate = 0;

  for (const demo of SHOWCASE_TEMPLATES) {
    const [existing] = await conn.query<mysql.RowDataPacket[]>(
      "SELECT id FROM demo_sites WHERE slug = ?",
      [demo.slug],
    );
    if ((existing as any[]).length > 0) {
      skipped++;
      continue;
    }

    const [tplRows] = await conn.query<mysql.RowDataPacket[]>(
      "SELECT id FROM templates WHERE slug = ?",
      [demo.presetId],
    );
    const tpl = (tplRows as any[])[0];
    if (!tpl) {
      console.warn(`Şablon bulunamadı, demo atlandı: slug=${demo.slug} presetId=${demo.presetId}`);
      missingTemplate++;
      continue;
    }

    await conn.query(
      `INSERT INTO demo_sites (slug, template_id, title, seo_title, seo_description, og_image, status)
       VALUES (?, ?, ?, ?, ?, ?, 'published')`,
      [demo.slug, tpl.id, demo.name, demo.name, demo.desc, demo.image],
    );
    inserted++;
  }

  await conn.end();
  console.log(
    `Seed tamamlandı: ${inserted} eklendi, ${skipped} zaten mevcut, ${missingTemplate} eşleşmeyen şablon (toplam ${SHOWCASE_TEMPLATES.length})`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
