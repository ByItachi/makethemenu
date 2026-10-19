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
];

export function findPlugin(key: string): PluginDef | undefined {
  return PLUGIN_CATALOG.find((p) => p.key === key);
}
