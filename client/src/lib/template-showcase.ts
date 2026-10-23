/**
 * Herkese açık şablon vitrini (/sablonlar): mmmmenu.app/templates tarzı
 * 35 şablon. Her kayıt bir detay sayfasına (/sablonlar/:slug) ve o temanın
 * marka stilleriyle çizilen canlı örnek menüye (/sablon-demo/:slug) bağlanır.
 *
 * presetId, client/src/lib/menu-presets.ts içindeki şablonun kimliğidir;
 * canlı demo sayfası bu stille örnek menüyü çizer.
 */
export type ShowcaseTemplate = {
  slug: string;
  presetId: string;
  name: string;
  desc: string;
  image: string;
};

export const SHOWCASE_TEMPLATES: ShowcaseTemplate[] = [
  { slug: "food-truck", presetId: "food-truck", name: "Food Truck Menü Şablonu", desc: "Sokak lezzetleri için sıcak ve iddialı tasarım. Menünü online oluştur, ürün ve fiyat ekledikçe QR kodlu menün anında güncellenir.", image: "/templates/food-truck.webp" },
  { slug: "cocktail-bar", presetId: "cocktailbar", name: "Kokteyl Bar Menü Şablonu", desc: "Kokteyl barınız için şık ve atmosferik dijital menü. İçecek listesini kolayca özelleştirin, link veya QR ile paylaşın.", image: "/templates/cocktail-bar.webp" },
  { slug: "chinese-restaurant", presetId: "cin-restorani", name: "Çin Restoranı Menü Şablonu", desc: "Uzak doğu mutfağı için otantik tasarım. Kategoriler, ürün açıklamaları ve fiyatlarla eksiksiz bir dijital menü.", image: "/templates/chinese-restaurant.webp" },
  { slug: "cafe", presetId: "cafe", name: "Kafe Menü Şablonu", desc: "Kafeniz için sıcak ve samimi dijital menü. Kahveler, tatlılar ve atıştırmalıklar tek sayfada, QR ile masada.", image: "/templates/cafe.webp" },
  { slug: "korean", presetId: "kore", name: "Kore Menü Şablonu", desc: "Kore mutfağı için modern ve renkli tasarım. Bibimbap'tan kimchiye tüm ürünlerinizi görsellerle sunun.", image: "/templates/korean.webp" },
  { slug: "dispensary", presetId: "vegan", name: "Bitkisel Ürün Menü Şablonu", desc: "Özel ürün kataloğunuzu sade ve okunabilir bir listeyle sunun. Stok ve fiyat güncellemeleri saniyeler içinde yayında.", image: "/templates/dispensary.webp" },
  { slug: "ice-cream", presetId: "dondurma", name: "Dondurma Menü Şablonu", desc: "Dondurmanız için taze ve neşeli tasarım. Lezzetleri görsellerle listeleyin, masaya QR ile ulaştırın.", image: "/templates/ice-cream.webp" },
  { slug: "ice-cream-truck", presetId: "dondurma-kamyonu", name: "Dondurma Kamyonu Menü Şablonu", desc: "Dondurma arabanız için eğlenceli dijital menü. Günün lezzetlerini anında güncelleyin, sosyal medyada paylaşın.", image: "/templates/ice-cream-truck.webp" },
  { slug: "mexican-restaurant", presetId: "meksika", name: "Meksika Restoranı Menü Şablonu", desc: "Taco ve Meksika mutfağı için iddialı, canlı renkli tasarım. Menünü oluştur, QR kodunu masalara yerleştir.", image: "/templates/mexican-restaurant.webp" },
  { slug: "catering", presetId: "catering", name: "Catering Menü Şablonu", desc: "Organizasyon ve toplu hizmet için profesyonel menü. Paketlerinizi fiyatlarıyla sunun, teklif linkini paylaşın.", image: "/templates/catering.webp" },
  { slug: "beverage-menu", presetId: "icecek", name: "İçecek Menü Şablonu", desc: "Şişe ve kutu içecekler için düzenli liste tasarımı. Fiyat güncellemeleri anında menüye yansır.", image: "/templates/beverage-menu.webp" },
  { slug: "drink-menu", presetId: "cocktailbar", name: "İçecek Kartı Menü Şablonu", desc: "Bar kartı için zarif tasarım. Kokteyller, sert içkiler ve meşrubatlar tek sayfada, link ile paylaşılır.", image: "/templates/drink-menu.webp" },
  { slug: "pizza-menu", presetId: "pizza", name: "Pizza Menü Şablonu", desc: "Pizzacılar için iştah açıcı tasarım. Pizzalarınızı görselleriyle listeleyin, sipariş telefonuyla birlikte sunun.", image: "/templates/pizza-menu.webp" },
  { slug: "pub-food-menu", presetId: "pub", name: "Pub Menü Şablonu", desc: "Pub mutfağı için rahat ve samimi tasarım. Burgerler, atıştırmalıklar ve içecekler tek karta sığar.", image: "/templates/pub-food-menu.webp" },
  { slug: "gastro-pub-menu", presetId: "gastro-pub", name: "Gastropub Menü Şablonu", desc: "Gurme pub mutfağı için rafine tasarım. Sezonluk menünüzü saniyeler içinde güncelleyip yayınlayın.", image: "/templates/gastro-pub-menu.webp" },
  { slug: "japanese-ramen-menu", presetId: "ramen", name: "Ramen Menü Şablonu", desc: "Ramen barı için atmosferik koyu tasarım. Çorbalarağınızı, aperatifleri ve içecekleri görsellerle sunun.", image: "/templates/japanese-ramen-menu.webp" },
  { slug: "bakery-menu", presetId: "firin", name: "Fırın & Pastane Menü Şablonu", desc: "Fırınınız için yumuşak ve davetkâr tasarım. Ekmekler, pastalar ve tuzlular günün ürünleriyle güncellenir.", image: "/templates/bakery-menu.webp" },
  { slug: "shisha-menu", presetId: "nargile", name: "Nargile Menü Şablonu", desc: "Nargile mekanınız için koyu ve atmosferik dijital menü. Tütün aromalarını, yenileme ve içecekleri kolayca özelleştirip güncelleyin; QR kodlu menünüzü link ile her yerde paylaşın.", image: "/templates/shisha-menu.webp" },
  { slug: "modern-restaurant-menu", presetId: "modern", name: "Modern Restoran Menü Şablonu", desc: "Fine-dining ve modern mutfaklar için zarif, sade tasarım. Menünüz her ekranda kusursuz görünür.", image: "/templates/modern-restaurant-menu.webp" },
  { slug: "coffee-shop-menu", presetId: "kahve", name: "Kahveci Menü Şablonu", desc: "Üçüncü nesil kahveciler için sade ve şık menü. Espresso bazlı içecekler ve tatlılar kolayca düzenlenir.", image: "/templates/coffee-shop-menu.webp" },
  { slug: "wine-list", presetId: "sarap", name: "Şarap Listesi Menü Şablonu", desc: "Şarap kartınız için sofistike tasarım. Bölge, yıl ve kadeh/bardak fiyatlarıyla düzenli liste.", image: "/templates/wine-list.webp" },
  { slug: "juice-bar", presetId: "su-barı", name: "Meyve Suyu Barı Menü Şablonu", desc: "Taze sıkma ve detoks barları için ferah tasarım. Menünü oluştur, QR ile salonda paylaş.", image: "/templates/juice-bar.webp" },
  { slug: "hotel-menu", presetId: "otel", name: "Otel Menü Şablonu", desc: "Otel restoran ve oda servisi için zarif tasarım. Kahvaltı, oda servisi ve bar menüleri ayrı linklerle paylaşılır.", image: "/templates/hotel-menu.webp" },
  { slug: "specials-menu", presetId: "gunun-ozeli", name: "Günün Menüsü Şablonu", desc: "Günün özelini her sabah birkaç saniyede yayınlayın. Sabit URL, her zaman güncel içerik.", image: "/templates/specials-menu.webp" },
  { slug: "italian-restaurant-menu", presetId: "italyan", name: "İtalyan Restoranı Menü Şablonu", desc: "İtalyan mutfağı için klasik ve sıcak tasarım. Antipastiden dolciye tüm kurslar zarif listelenir.", image: "/templates/italian-restaurant-menu.webp" },
  { slug: "beer-menu", presetId: "birahane", name: "Bira Menü Şablonu", desc: "Craft bira ve bira kartı için cesur tasarım. Yeni bira geldiğinde menüyü saniyeler içinde güncelleyin.", image: "/templates/beer-menu.webp" },
  { slug: "bbq-menu", presetId: "barbeku", name: "Barbekü Menü Şablonu", desc: "Izgara ve smokehouse için doyurucu tasarım. Etler, yanındaki lezzetler ve soslar net fiyatlarla listelenir.", image: "/templates/bbq-menu.webp" },
  { slug: "christmas-menu", presetId: "yilbasi", name: "Yılbaşı Menü Şablonu", desc: "Yılbaşı özel menünüz için atmosferik tasarım. Sezonluk menüyü tek tıkla yayınlayın, sezon bitince arşivleyin.", image: "/templates/christmas-menu.webp" },
  { slug: "thanksgiving-menu", presetId: "hasat", name: "Hasat & Özel Gün Menüsü Şablonu", desc: "Hasat ve şükran temalı özel günler için sıcak tasarım. Sınırlı süreli menüler için idealdir.", image: "/templates/thanksgiving-menu.webp" },
  { slug: "breakfast-menu", presetId: "kahvalti", name: "Kahvaltı Menü Şablonu", desc: "Kahvaltı ve brunch için aydınlık, davetkâr tasarım. Serpme içerikleri ve fiyatları kolayca düzenleyin.", image: "/templates/breakfast-menu.webp" },
  { slug: "dessert-menu", presetId: "tatli", name: "Tatlı Menü Şablonu", desc: "Tatlılarınız için tatlı pastel tasarım. Menünü oluştur, QR kodu masaya koy, tatlıyı görüp söyleyesinler.", image: "/templates/dessert-menu.webp" },
  { slug: "sushi-menu", presetId: "sushi", name: "Sushi Menü Şablonu", desc: "Sushi ve izakaya için minimalist koyu tasarım. Rollere, parça sayısına ve set menülere yer var.", image: "/templates/sushi-menu.webp" },
  { slug: "indian-restaurant-menu", presetId: "hint", name: "Hint Restoranı Menü Şablonu", desc: "Hint mutfağı için baharatlı ve iddialı tasarım. Acılık derecesi ve açıklamalarla zengin liste.", image: "/templates/indian-restaurant-menu.webp" },
  { slug: "thai-restaurant-menu", presetId: "tay", name: "Tay Restoranı Menü Şablonu", desc: "Tay mutfağı için taze ve doğal tasarım. Sokak lezzetlerinden çorbalara tüm menü düzenli listelenir.", image: "/templates/thai-restaurant-menu.webp" },
  { slug: "wedding-menu", presetId: "dugun", name: "Düğün Menü Şablonu", desc: "Düğün ve nişan için romantik, zarif tasarım. Davetliler QR ile menüyü telefonda görür, kağıt masrafsı yok.", image: "/templates/wedding-menu.webp" },
  { slug: "burger-menu", presetId: "burger", name: "Burger Menü Şablonu", desc: "Burger restoranı ve fast food için cesur tasarım. Burgerler, yanındaki lezzetler ve içecekler net fiyatlarla listelenir.", image: "/templates/burger-menu.webp" },
  { slug: "bar-menu", presetId: "bar", name: "Bar Menü Şablonu", desc: "Bar ve lounge için şık tasarım. Kokteyller, likörler ve meşrubatlar kategorize edilmiş listede.", image: "/templates/bar-menu.webp" },
  { slug: "kids-menu", presetId: "cocuk", name: "Çocuk Menü Şablonu", desc: "Çocuklar için eğlenceli ve renkli tasarım. Beslenme bilgileri ve alerjen uyarılarıyla güvenli menü.", image: "/templates/kids-menu.webp" },
  { slug: "steakhouse-menu", presetId: "biftek", name: "Steakhouse Menü Şablonu", desc: "Biftek ve ızgara restoranı için premium tasarım. Etler, pişirme dereceleri ve yanındaki lezzetler detaylı listelenir.", image: "/templates/steakhouse-menu.webp" },
  { slug: "seafood-menu", presetId: "deniz-urunu", name: "Deniz Ürünleri Menü Şablonu", desc: "Balık ve deniz ürünleri restoranı için zarif tasarım. Taze ürünler günlük güncellenir, mevsimsel öneriler sunulur.", image: "/templates/seafood-menu.webp" },
  { slug: "vegan-menu", presetId: "vegan-menu", name: "Vegan Menü Şablonu", desc: "Vegan ve bitkisel mutfak için ferah tasarım. Beslenme bilgileri ve ürün kaynakları detaylı listelenir.", image: "/templates/vegan-menu.webp" },
  { slug: "mediterranean-restaurant-menu", presetId: "akdeniz", name: "Akdeniz Restoranı Menü Şablonu", desc: "Akdeniz mutfağı için sıcak ve davetkâr tasarım. Zeytinyağlılar, salatalar ve balık yemekleri zarif listelenir.", image: "/templates/mediterranean-restaurant-menu.webp" },
  { slug: "bubble-tea-menu", presetId: "bubble-tea", name: "Bubble Tea Menü Şablonu", desc: "Bubble tea ve boba barı için modern tasarım. Çeşitli çay türleri, toppings ve özelleştirme seçenekleri sunulur.", image: "/templates/bubble-tea-menu.webp" },
  { slug: "lunch-menu", presetId: "ogle-yemegi", name: "Öğle Yemeği Menü Şablonu", desc: "Öğle yemeği ve set menüler için pratik tasarım. Günün menüsü hızlı güncellenir, fiyat avantajları vurgulanır.", image: "/templates/lunch-menu.webp" },
  { slug: "new-years-eve-menu", presetId: "yilbasi-gecesi", name: "Yılbaşı Gecesi Menü Şablonu", desc: "Yılbaşı partileri için şık ve kutlayıcı tasarım. Özel menüler, şampanya seçimleri ve gece boyunca sunulan lezzetler listelenir.", image: "/templates/new-years-eve-menu.webp" },
];

export const SHOWCASE_BY_SLUG: Record<string, ShowcaseTemplate> = Object.fromEntries(
  SHOWCASE_TEMPLATES.map((t) => [t.slug, t]),
);

/** Detay sayfasındaki ortak özellik listesi (mmmmenu tarzı). */
export const SHOWCASE_FEATURES = [
  { icon: "sliders", text: "Kolayca özelleştirilir" },
  { icon: "share", text: "Link, QR, web sitesi ve sosyal medya ile paylaşılır" },
  { icon: "zap", text: "Güncellemeler saniyeler içinde yayına girer" },
  { icon: "palette", text: "Kendi markanıza göre uyarlanır" },
];
