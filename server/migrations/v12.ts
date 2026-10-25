// Idempotent migration for v12: Ölçümleme ayarları (analytics_settings) + sektör profilleri
// (sector_profiles) ve restaurants.sector_slug kolonu. Safe to run repeatedly; never drops
// or alters existing data. Take a DB backup first. Run: npm run db:migrate-v12
import "../env";
import mysql from "mysql2/promise";

async function tableExists(conn: mysql.Connection, table: string) {
  const [rows] = await conn.query<mysql.RowDataPacket[]>(
    "SELECT COUNT(*) n FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?",
    [table],
  );
  return Number((rows[0] as { n: number }).n) > 0;
}

async function columnExists(conn: mysql.Connection, table: string, column: string) {
  const [rows] = await conn.query<mysql.RowDataPacket[]>(
    "SELECT COUNT(*) n FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?",
    [table, column],
  );
  return Number((rows[0] as { n: number }).n) > 0;
}

// Durum akışları sektör tipine göre değişir; ortak çekirdek + sektörel uzantılar.
type StatusStep = { key: string; label: string; sortOrder: number };

const STATUS: Record<string, StatusStep[]> = {
  servis: [
    { key: "yeni", label: "Yeni", sortOrder: 1 },
    { key: "hazirlaniyor", label: "Hazırlanıyor", sortOrder: 2 },
    { key: "yolda", label: "Yolda", sortOrder: 3 },
    { key: "teslim", label: "Teslim Edildi", sortOrder: 4 },
    { key: "iptal", label: "İptal", sortOrder: 5 },
  ],
  yikama: [
    { key: "alindi", label: "Alındı", sortOrder: 1 },
    { key: "islemede", label: "İşlemde", sortOrder: 2 },
    { key: "yikamada", label: "Yıkamada", sortOrder: 3 },
    { key: "hazir", label: "Hazır", sortOrder: 4 },
    { key: "teslim", label: "Teslim Edildi", sortOrder: 5 },
    { key: "iptal", label: "İptal", sortOrder: 6 },
  ],
  randevu: [
    { key: "randevu", label: "Randevu Alındı", sortOrder: 1 },
    { key: "serviste", label: "Serviste", sortOrder: 2 },
    { key: "tamamlandi", label: "Tamamlandı", sortOrder: 3 },
    { key: "iptal", label: "İptal / Gelmedi", sortOrder: 4 },
  ],
  satis: [
    { key: "yeni", label: "Yeni Sipariş", sortOrder: 1 },
    { key: "hazirlaniyor", label: "Hazırlanıyor", sortOrder: 2 },
    { key: "yolda", label: "Teslimatta", sortOrder: 3 },
    { key: "teslim", label: "Teslim Edildi", sortOrder: 4 },
    { key: "iptal", label: "İptal", sortOrder: 5 },
  ],
};

const MODULES = {
  menu: ["menu", "categories", "products", "tables", "orders", "payments", "qr", "reports"],
  perakende: ["catalog", "orders", "stock", "prices", "payments", "reports", "customers"],
  servis: ["customers", "orders", "statuses", "routes", "payments", "notifications", "reports", "qr"],
  randevu: ["customers", "appointments", "calendar", "staff", "services", "notifications", "reports"],
};

interface SectorSeed {
  slug: string;
  name: string;
  description: string;
  icon: string;
  modules: string[];
  orderFields: Array<{ key: string; label: string; type: string; unit?: string; required?: boolean }>;
  orderStatuses: Array<{ key: string; label: string; sortOrder: number }>;
  dashboardCards: string[];
  isFeatured?: boolean;
}

const SECTORS: SectorSeed[] = [
  {
    slug: "restoran-kafe",
    name: "Restoran, Kafe ve Lokanta",
    description: "QR dijital menü, masa ve sipariş yönetimi, paket servis ve gel-al, adisyon ve POS.",
    icon: "utensils",
    modules: MODULES.menu,
    orderFields: [
      { key: "masaNo", label: "Masa No", type: "number", required: false },
      { key: "porsiyon", label: "Porsiyon", type: "number", unit: "adet", required: false },
      { key: "not", label: "Sipariş Notu", type: "text", required: false },
    ],
    orderStatuses: STATUS.servis,
    dashboardCards: ["bugunkuSiparisler", "gunlukCiro", "acikMasalar", "populerUrunler"],
    isFeatured: true,
  },
  {
    slug: "pastane-firin",
    name: "Pastane, Fırın ve Tatlıcı",
    description: "Ürün kataloğu, günlük üretim, tazelik takibi ve vitrin satışları.",
    icon: "cake",
    modules: MODULES.menu,
    orderFields: [
      { key: "teslimTarihi", label: "Teslim Tarihi", type: "date", required: false },
      { key: "agirlik", label: "Ağırlık", type: "number", unit: "kg", required: false },
    ],
    orderStatuses: STATUS.satis,
    dashboardCards: ["bugunkuSiparisler", "gunlukCiro", "gununUrunleri"],
    isFeatured: true,
  },
  {
    slug: "su-damacanasi",
    name: "Su Damacanası Satışı ve Dağıtımı",
    description: "Damacana depozito ve bakiye hareketleri, tekrarlayan siparişler, rota ve tahsilat.",
    icon: "droplets",
    modules: [...MODULES.servis, "deposits", "recurringOrders"],
    orderFields: [
      { key: "doluDamacana", label: "Dolu Damacana", type: "number", unit: "adet", required: true },
      { key: "bosIade", label: "Boş İade", type: "number", unit: "adet", required: true },
      { key: "pompa", label: "Pompa / Ek Ürün", type: "number", unit: "adet", required: false },
    ],
    orderStatuses: STATUS.servis,
    dashboardCards: ["bugunkuTeslimatlar", "tahsilat", "depozitoBakiyeleri", "rotaDurumu"],
    isFeatured: true,
  },
  {
    slug: "tup-lpg",
    name: "Tüp / LPG Bayileri ve Dağıtımı",
    description: "Dolu/boş tüp hareketleri, depo takibi, teslimat ve cari hesap.",
    icon: "flame",
    modules: [...MODULES.servis, "deposits", "vehicles", "currentAccounts"],
    orderFields: [
      { key: "tupTipi", label: "Tüp Tipi", type: "select", required: true },
      { key: "doluAdet", label: "Dolu Tüp", type: "number", unit: "adet", required: true },
      { key: "bosIade", label: "Boş İade", type: "number", unit: "adet", required: true },
    ],
    orderStatuses: STATUS.servis,
    dashboardCards: ["bugunkuTeslimatlar", "tahsilat", "stokDurumu", "cariHesaplar"],
    isFeatured: true,
  },
  {
    slug: "hali-koltuk-yikama",
    name: "Halı ve Koltuk Yıkama",
    description: "Sipariş kartı, metrekare fiyatlandırma, QR etiket, atölye akışı ve teslimat.",
    icon: "spray-can",
    modules: [...MODULES.servis, "qrLabels", "photos"],
    orderFields: [
      { key: "haliTipi", label: "Halı Türü", type: "select", required: true },
      { key: "adet", label: "Adet", type: "number", unit: "adet", required: true },
      { key: "metrekare", label: "Metrekare", type: "number", unit: "m²", required: true },
      { key: "birimFiyat", label: "Birim Fiyat", type: "number", unit: "₺/m²", required: true },
      { key: "indirim", label: "İndirim", type: "number", unit: "%", required: false },
    ],
    orderStatuses: STATUS.yikama,
    dashboardCards: ["islemedekiSiparisler", "hazirUrunler", "tahsilat", "gunlukCiro"],
    isFeatured: true,
  },
  {
    slug: "kuru-temizleme",
    name: "Kuru Temizleme ve Çamaşırhane",
    description: "Ürün kabul ve barkod, işlem durumu, teslim fişi ve tahsilat.",
    icon: "shirt",
    modules: [...MODULES.servis, "qrLabels"],
    orderFields: [
      { key: "urunTipi", label: "Ürün Türü", type: "select", required: true },
      { key: "adet", label: "Adet", type: "number", unit: "adet", required: true },
      { key: "teslimTahmini", label: "Tahmini Teslim", type: "date", required: false },
    ],
    orderStatuses: STATUS.yikama,
    dashboardCards: ["islemedekiSiparisler", "hazirUrunler", "tahsilat"],
  },
  {
    slug: "oto-yikama-detailing",
    name: "Oto Yıkama ve Detailing",
    description: "Hizmet paketleri, randevu takvimi, personel ataması ve üyelik yönetimi.",
    icon: "car",
    modules: [...MODULES.randevu, "payments"],
    orderFields: [
      { key: "plaka", label: "Araç Plakası", type: "text", required: true },
      { key: "paket", label: "Hizmet Paketi", type: "select", required: true },
      { key: "randevuSaati", label: "Randevu Saati", type: "time", required: false },
    ],
    orderStatuses: STATUS.randevu,
    dashboardCards: ["bugunkuRandevular", "paketSatislari", "tahsilat", "personelPerformansi"],
    isFeatured: true,
  },
  {
    slug: "kuafor-berber",
    name: "Kuaför, Berber ve Güzellik Salonu",
    description: "Personel takvimi, randevu ve hizmet süresi, müşteri geçmişi ve paketler.",
    icon: "scissors",
    modules: MODULES.randevu,
    orderFields: [
      { key: "hizmet", label: "Hizmet", type: "select", required: true },
      { key: "personel", label: "Personel", type: "select", required: false },
      { key: "sure", label: "Süre", type: "number", unit: "dk", required: false },
    ],
    orderStatuses: STATUS.randevu,
    dashboardCards: ["bugunkuRandevular", "iptalOrani", "paketSatislari", "personelPerformansi"],
    isFeatured: true,
  },
  {
    slug: "teknik-servis",
    name: "Teknik Servis, Bakım ve Onarım",
    description: "İş emri ve arıza kaydı, seri numarası, parça kullanımı ve teslimat.",
    icon: "wrench",
    modules: [...MODULES.servis, "parts", "serials"],
    orderFields: [
      { key: "cihazTipi", label: "Cihaz / Ürün", type: "text", required: true },
      { key: "seriNo", label: "Seri Numarası", type: "text", required: false },
      { key: "arizaTanimi", label: "Arıza Tanımı", type: "text", required: true },
      { key: "teknisyen", label: "Teknisyen", type: "select", required: false },
    ],
    orderStatuses: STATUS.randevu,
    dashboardCards: ["acikIsEmirleri", "tamamlananlar", "tahsilat", "parcaStoku"],
  },
  {
    slug: "temizlik-sirketleri",
    name: "Temizlik Şirketleri",
    description: "Saha personeli, görev planı, sözleşmeli müşteriler ve raporlar.",
    icon: "sparkles",
    modules: [...MODULES.servis, "contracts", "staff"],
    orderFields: [
      { key: "gorevTipi", label: "Görev Tipi", type: "select", required: true },
      { key: "alan", label: "Alan / Bölüm", type: "text", required: false },
      { key: "personelSayisi", label: "Personel Sayısı", type: "number", unit: "kişi", required: false },
    ],
    orderStatuses: STATUS.randevu,
    dashboardCards: ["bugunkuGorevler", "sozlesmeler", "tahsilat", "personelDurumu"],
  },
  {
    slug: "market-perakende",
    name: "Market, Şarküteri ve Yerel Perakende",
    description: "Ürün ve varyantlar, stok ve depo, fiyat listeleri ve hızlı satış.",
    icon: "shopping-basket",
    modules: MODULES.perakende,
    orderFields: [
      { key: "miktar", label: "Miktar", type: "number", required: true },
      { key: "birim", label: "Birim", type: "select", required: true },
    ],
    orderStatuses: STATUS.satis,
    dashboardCards: ["bugunkuSatislar", "kritikStok", "gunlukCiro", "populerUrunler"],
  },
  {
    slug: "cicekci-hediyelik",
    name: "Çiçekçi ve Hediyelik Ürünler",
    description: "Ürün kataloğu, özel gün siparişleri, teslimat ve mesaj kartı.",
    icon: "flower",
    modules: [...MODULES.perakende, "routes"],
    orderFields: [
      { key: "teslimTarihi", label: "Teslim Tarihi", type: "date", required: true },
      { key: "mesajKarti", label: "Mesaj Kartı", type: "text", required: false },
    ],
    orderStatuses: STATUS.satis,
    dashboardCards: ["bugunkuSiparisler", "gunlukCiro", "ozelGunler"],
  },
  {
    slug: "catering-toplu-yemek",
    name: "Catering ve Toplu Yemek",
    description: "Toplu sipariş, kişi başı fiyatlandırma, teslimat planı ve sözleşmeler.",
    icon: "utensils-crossed",
    modules: [...MODULES.menu, "routes", "contracts"],
    orderFields: [
      { key: "kisiSayisi", label: "Kişi Sayısı", type: "number", unit: "kişi", required: true },
      { key: "teslimTarihi", label: "Teslim Tarihi", type: "date", required: true },
    ],
    orderStatuses: STATUS.satis,
    dashboardCards: ["bugunkuSiparisler", "gunlukCiro", "sozlesmeler"],
  },
  {
    slug: "kiralama-isletmeleri",
    name: "Kiralama İşletmeleri",
    description: "Ürün/envanter kiralama, rezervasyon takvimi, teminat ve teslim takibi.",
    icon: "calendar-clock",
    modules: [...MODULES.randevu, "stock", "payments", "deposits"],
    orderFields: [
      { key: "kiralamaBaslangic", label: "Kiralama Başlangıcı", type: "date", required: true },
      { key: "kiralamaBitis", label: "Kiralama Bitişi", type: "date", required: true },
      { key: "teminat", label: "Teminat", type: "number", unit: "₺", required: false },
    ],
    orderStatuses: STATUS.randevu,
    dashboardCards: ["aktifKiralamalar", "bugunkuIade", "tahsilat", "envanterDurumu"],
  },
  {
    slug: "toptan-b2b",
    name: "Toptan Satış ve B2B Sipariş",
    description: "Fiyat listeleri, minimum sipariş miktarı, cari hesap ve bayi grupları.",
    icon: "boxes",
    modules: [...MODULES.perakende, "priceLists", "minOrderQty", "customerGroups", "currentAccounts"],
    orderFields: [
      { key: "koliAdedi", label: "Koli Adedi", type: "number", unit: "koli", required: true },
      { key: "teslimTarihi", label: "Teslim Tarihi", type: "date", required: false },
    ],
    orderStatuses: STATUS.satis,
    dashboardCards: ["bugunkuSiparisler", "cariHesaplar", "aylikCiro", "bayiSiparisleri"],
  },
  {
    slug: "evcil-hayvan",
    name: "Evcil Hayvan Bakım ve Hizmet İşletmeleri",
    description: "Randevu, bakım kayıtları, aşılama hatırlatmaları ve paket yönetimi.",
    icon: "paw-print",
    modules: [...MODULES.randevu, "pets", "vaccines"],
    orderFields: [
      { key: "hizmetTipi", label: "Hizmet Tipi", type: "select", required: true },
      { key: "petAdi", label: "Evcil Hayvan Adı", type: "text", required: true },
      { key: "notlar", label: "Bakım Notları", type: "text", required: false },
    ],
    orderStatuses: STATUS.randevu,
    dashboardCards: ["bugunkuRandevular", "paketSatislari", "tahsilat", "asiHatirlaticilari"],
  },
];

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL!);

  if (!(await tableExists(conn, "analytics_settings"))) {
    await conn.query(`
      CREATE TABLE \`analytics_settings\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`gtm_container_id\` VARCHAR(32) NULL,
        \`ga4_measurement_id\` VARCHAR(32) NULL,
        \`meta_pixel_id\` VARCHAR(32) NULL,
        \`gsc_verification_token\` VARCHAR(255) NULL,
        \`gtm_enabled\` BOOLEAN NOT NULL DEFAULT FALSE,
        \`ga4_enabled\` BOOLEAN NOT NULL DEFAULT FALSE,
        \`meta_pixel_enabled\` BOOLEAN NOT NULL DEFAULT FALSE,
        \`ga4_via_gtm\` BOOLEAN NOT NULL DEFAULT TRUE,
        \`consent_required\` BOOLEAN NOT NULL DEFAULT TRUE,
        \`enable_in_dev\` BOOLEAN NOT NULL DEFAULT FALSE,
        \`updated_at\` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    await conn.query("INSERT INTO \`analytics_settings\` (\`id\`) VALUES (1)");
    console.log("v12: analytics_settings tablosu oluşturuldu");
  }

  if (!(await tableExists(conn, "sector_profiles"))) {
    await conn.query(`
      CREATE TABLE \`sector_profiles\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`slug\` VARCHAR(64) NOT NULL UNIQUE,
        \`name\` VARCHAR(128) NOT NULL,
        \`description\` TEXT NULL,
        \`icon\` VARCHAR(64) NOT NULL DEFAULT 'store',
        \`modules\` JSON NOT NULL,
        \`order_fields\` JSON NULL,
        \`order_statuses\` JSON NULL,
        \`dashboard_cards\` JSON NULL,
        \`is_active\` BOOLEAN NOT NULL DEFAULT TRUE,
        \`is_featured\` BOOLEAN NOT NULL DEFAULT FALSE,
        \`sort_order\` INT NOT NULL DEFAULT 100,
        \`created_at\` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log("v12: sector_profiles tablosu oluşturuldu");
  }

  if (!(await columnExists(conn, "restaurants", "sector_slug"))) {
    await conn.query("ALTER TABLE \`restaurants\` ADD COLUMN \`sector_slug\` VARCHAR(64) NULL");
    console.log("v12: restaurants.sector_slug kolonu eklendi");
  }

  // Sektör seed: mevcut kayıtların üzerine yazmadan ekle (INSERT IGNORE).
  for (let i = 0; i < SECTORS.length; i++) {
    const s = SECTORS[i];
    await conn.query(
      `INSERT IGNORE INTO \`sector_profiles\`
        (\`slug\`, \`name\`, \`description\`, \`icon\`, \`modules\`, \`order_fields\`, \`order_statuses\`, \`dashboard_cards\`, \`is_active\`, \`is_featured\`, \`sort_order\`)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, TRUE, ?, ?)`,
      [
        s.slug,
        s.name,
        s.description,
        s.icon.trim(),
        JSON.stringify(s.modules),
        JSON.stringify(s.orderFields),
        JSON.stringify(s.orderStatuses),
        JSON.stringify(s.dashboardCards),
        !!s.isFeatured,
        (i + 1) * 10,
      ],
    );
  }
  console.log(`v12: ${SECTORS.length} sektör profili kontrol edildi/eklendi`);

  await conn.end();
  console.log("v12 migration tamamlandı.");
}

main().catch((err) => {
  console.error("v12 migration hatası:", err);
  process.exit(1);
});
