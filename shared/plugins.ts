// Eklenti Merkezi kataloğu. Anahtarlar (key) kalıcıdır - değiştirmeyin,
// aksi halde restoranların etkinleştirilmiş eklenti kayıtları boşa düşer.

export type PluginCategory = "pazaryeri" | "odeme" | "edonusum" | "kurye" | "operasyon" | "muhasebe";

export interface PluginDef {
  key: string;
  name: string;
  description: string;
  category: PluginCategory;
  /** false ise Free planda da açılabilir; true ise plan sayfasına yönlendirilir */
  requiresPlan?: boolean;
}

export const PLUGIN_CATEGORY_LABELS: Record<PluginCategory, string> = {
  pazaryeri: "Pazaryerleri",
  odeme: "Ödeme",
  edonusum: "E-Dönüşüm",
  kurye: "Kurye",
  operasyon: "Operasyon",
  muhasebe: "Muhasebe",
};

export const PLUGIN_CATALOG: PluginDef[] = [
  { key: "yemeksepeti", name: "Yemeksepeti", description: "Yemeksepeti siparişlerini POS'unuza anında alın.", category: "pazaryeri" },
  { key: "getiryemek", name: "GetirYemek", description: "GetirYemek siparişlerini tek ekrandan yönetin.", category: "pazaryeri" },
  { key: "trendyol-yemek", name: "Trendyol Yemek", description: "Trendyol Yemek siparişlerini POS'unuzla eşitleyin.", category: "pazaryeri" },
  { key: "migros-yemek", name: "Migros Yemek", description: "Migros Yemek siparişlerini panonuzdan takip edin.", category: "pazaryeri" },
  { key: "iyzico", name: "iyzico", description: "Kredi kartı ile online tahsilat yapın (sanal POS).", category: "odeme" },
  { key: "paytr", name: "PayTR", description: "PayTR sanal POS ile taksitli ödeme alın.", category: "odeme" },
  { key: "stripe", name: "Stripe", description: "Uluslararası kartlarla online ödeme kabul edin.", category: "odeme", requiresPlan: true },
  { key: "e-fatura", name: "E-Fatura", description: "Siparişleriniz için e-fatura / e-arşiv oluşturun.", category: "edonusum" },
  { key: "e-arsiv", name: "E-Arşiv", description: "e-Arşiv fatura ve perakende satış fişi entegrasyonu.", category: "edonusum" },
  { key: "kurye-takip", name: "Kurye Takip", description: "Kuryelerinizi atayın, müşteri adım adım takip etsin.", category: "kurye" },
  { key: "getir-buyuk", name: "GetirBüyük", description: "Market/toptan siparişlerde hızlı teslimat.", category: "kurye", requiresPlan: true },
  { key: "qr-menu", name: "QR Menü", description: "Masalara koyduğunuz karekodla dijital menü ve sipariş.", category: "operasyon" },
  { key: "menu-3d", name: "3D Menü", description: "Ürünlerinizi 3D model ve artırılmış gerçeklikle gösterin.", category: "operasyon", requiresPlan: true },
  { key: "ai-menu", name: "AI Menü Üretici", description: "Yapay zeka ile ürün açıklaması ve menü metni üretin.", category: "operasyon", requiresPlan: true },
  { key: "stok-maliyet", name: "Stok ve Maliyet", description: "Reçeteli stok takibi, otomatik düşüm ve maliyet analizi.", category: "operasyon" },
  { key: "personel-vardiya", name: "Personel ve Vardiya", description: "Personel performansı, yetkilendirme ve vardiya planı.", category: "operasyon" },
  { key: "musteri-cari", name: "Cari Müşteri", description: "Müşteri kayıtları, borç/alacak ve sadakat puanı.", category: "operasyon" },
  { key: "logo-erp", name: "Logo Yazılım", description: "Logo GO/İKON ile muhasebe fişlerini otomatik aktarın.", category: "muhasebe", requiresPlan: true },
  { key: "parasut", name: "Paraşüt", description: "Ön muhasebe kayıtlarınızı Paraşüt'e gönderin.", category: "muhasebe", requiresPlan: true },
  { key: "mikro-erp", name: "Mikro Yazılım", description: "Mikro Jump ile çek/stok/muhasebe entegrasyonu.", category: "muhasebe", requiresPlan: true },
  { key: "restajet", name: "RestaJet", description: "Sipariş ve masa yönetimini tek ekranda birleştirin.", category: "operasyon" },
  { key: "caller-id", name: "Caller ID", description: "Gelen aramalarda müşteri bilgisi otomatik açılsın.", category: "operasyon" },
  { key: "android-callerid", name: "Android Caller ID", description: "Android cihazdan arayan müşteriyi tanıyın.", category: "operasyon" },
  { key: "yazar-kasa", name: "Yazar Kasa", description: "ÖKC fişlerini POS ile otomatik eşitleyin.", category: "operasyon" },
  { key: "kiosk", name: "Kiosk", description: "Kendi kendine hizmet kiosklarını tasarlayın ve yönetin.", category: "operasyon" },
  { key: "fuudy", name: "Fuudy", description: "Fuudy siparişlerini POS'unuza aktarın.", category: "pazaryeri" },
  { key: "paket-servisi", name: "Paket Servisi", description: "Telefonla gelen paket siparişlerini tek panelden yönetin.", category: "pazaryeri" },
  { key: "hemenyolda", name: "Hemenyolda", description: "Kurye filosunu Hemenyolda ile yönlendirin.", category: "kurye" },
  { key: "adisyo-harita", name: "Adisyo Harita", description: "Teslimat bölgelerini harita üzerinde yönetin.", category: "operasyon" },
  { key: "bizim-hesap", name: "Bizim Hesap", description: "Bizim Hesap ile online tahsilat alın.", category: "odeme" },
  { key: "e-adisyon", name: "E-Adisyon", description: "Dijital adisyon ile masalarda temassız sipariş.", category: "edonusum" },
  { key: "hotel-runner", name: "HotelRunner", description: "Oda servisi siparişlerini HotelRunner ile eşitleyin.", category: "operasyon" },
  { key: "hms-hotel", name: "HMS Hotel", description: "HMS Hotel POS entegrasyonu.", category: "operasyon" },
  { key: "hotelier-101", name: "Hotelier 101", description: "Hotelier 101 oda servisi entegrasyonu.", category: "operasyon" },
  { key: "butiksoft", name: "ButikSoft", description: "ButikSoft otel yönetimi ile entegrasyon.", category: "operasyon" },
  { key: "boostfeel", name: "BoostFeel", description: "Sadakat puanı ve kampanya motoru.", category: "operasyon" },
  { key: "veri-aktarimi", name: "Veri Aktarımı & API", description: "Verilerinizi dış sistemlere API ile aktarın.", category: "operasyon" },
];

export function findPlugin(key: string): PluginDef | undefined {
  return PLUGIN_CATALOG.find((p) => p.key === key);
}

/**
 * Aylık fiyatlar (TRY). 0 = ücretsiz modül (satın alma gerekmez).
 * Mağazadaki (Integrations.tsx) fiyatlarla eşleşir.
 */
export const PLUGIN_PRICES: Record<string, number> = {
  "menu-3d": 499,
  yemeksepeti: 299,
  getiryemek: 249,
  "trendyol-yemek": 199,
  "migros-yemek": 179,
  fuudy: 149,
  "paket-servisi": 99,
  hemenyolda: 129,
  restajet: 399,
  "e-fatura": 599,
  "e-adisyon": 249,
  "bizim-hesap": 199,
  "hotel-runner": 349,
  "hms-hotel": 379,
  "hotelier-101": 329,
  "caller-id": 149,
  "android-callerid": 99,
  "yazar-kasa": 199,
  boostfeel: 179,
  butiksoft: 159,
  "adisyo-harita": 89,
  "veri-aktarimi": 299,
  iyzico: 149,
  paytr: 149,
  stripe: 0,
  "e-arsiv": 0,
  "kurye-takip": 0,
  "getir-buyuk": 0,
  "qr-menu": 0,
  "ai-menu": 0,
  "stok-maliyet": 0,
  "personel-vardiya": 0,
  "musteri-cari": 0,
  "logo-erp": 0,
  parasut: 0,
  "mikro-erp": 0,
  kiosk: 0,
};

export function pluginPrice(key: string): number {
  return PLUGIN_PRICES[key] ?? 0;
}

/**
 * Uygulama Mağazası entegrasyon kimliği → Eklenti Merkezi katalog anahtarı.
 * İstemcideki INTEGRATION_PLUGIN_KEYS ile aynıdır; sunucu tarafı doğrulama için burada.
 */
const STORE_ID_TO_PLUGIN_KEY: Record<string, string> = {
  "urun-3d-gosterim": "menu-3d",
  getir: "getiryemek",
};

export function toPluginKey(storeId: string): string {
  return STORE_ID_TO_PLUGIN_KEY[storeId] ?? storeId;
}
