/**
 * Hazır menü şablonları: her şablon kendi marka kimliğiyle (arka plan, metin,
 * vurgu rengi, logo/başlık tipi) gelir. Hem şablon galerisi önizlemesi hem de
 * herkese açık menü (/p/:slug) bu stilleri kullanır.
 *
 * style.logoFont / style.headingFont anahtarları PublicMenu ve galeride aynı
 * CSS eşlemesiyle yorumlanır (bkz. MENU_PRESET_FONTS).
 */
export type MenuPresetFontKey = "serif" | "sans" | "condensed" | "badge" | "round" | "script";

export type MenuPresetStyle = {
  bg: string;
  text: string;
  muted: string;
  accent: string;
  logoFont: MenuPresetFontKey;
  headingFont: "serif" | "sans";
  logoUpper?: boolean;
  logoItalic?: boolean;
};

export type MenuPresetItem = { name: string; desc?: string; price: number };

export type MenuPreset = {
  id: string;
  name: string;
  category: string;
  logo: string;
  tagline?: string;
  emoji: string;
  menuTheme: "yesil" | "mavi" | "kirmizi" | "mor" | "turuncu" | "grafit";
  menuTemplate: "liste" | "izgara" | "kart";
  menuRadius: number;
  showProductImages: boolean;
  sectionTitles: [string, string];
  items: MenuPresetItem[];
  style: MenuPresetStyle;
};

export const CATEGORIES = ["Tümü", "Mutfağa Özel", "Mekan Türü", "Yemek & İçecek", "Özel Gün", "Modern"] as const;

export const MENU_PRESETS: MenuPreset[] = [
  // --- Mutfağa Özel ---
  { id: "food-truck", name: "Food Truck", category: "Mutfağa Özel", logo: "Roll & Eat", tagline: "FOOD TRUCK", emoji: "🚚", menuTheme: "turuncu", menuTemplate: "kart", menuRadius: 8, showProductImages: true, sectionTitles: ["Dürümler", "Yanında"], style: { bg: "#4a2416", text: "#fdf3e7", muted: "#e0b89a", accent: "#ff6b35", logoFont: "condensed", headingFont: "sans", logoUpper: true },
    items: [
      { name: "Dolmalık Wrap", desc: "Tavuklu falafel, taze salata, yoğurtlu sos", price: 95 },
      { name: "Burger", desc: "Dana köfte, turşu, karamelize soğan", price: 120 },
      { name: "Tatlı Patates Kızartması", desc: "Sarımsaklı mayonezle", price: 48 },
    ] },
  { id: "cin-restorani", name: "Çin Restoranı", category: "Mutfağa Özel", logo: "Fat Cat", tagline: "NO.88 · ASIAN KITCHEN", emoji: "🐱", menuTheme: "kirmizi", menuTemplate: "liste", menuRadius: 4, showProductImages: true, sectionTitles: ["Paylaşımlık", "Öneriler"], style: { bg: "#9e9e9e", text: "#26221e", muted: "#4d4740", accent: "#b71c1c", logoFont: "badge", headingFont: "sans" },
    items: [
      { name: "Kırmızı Yağlı Köfte", desc: "İpeksi köfte, yoğun kırmızı yağ sosu", price: 88 },
      { name: "Kavrulmuş Yeşil Fasulye", desc: "Soya, sarımsak, tuzlu zeytin", price: 62 },
      { name: "Haşlanmış Biber", desc: "Taze biber, hafif baharatlı", price: 74 },
    ] },
  { id: "kore", name: "Kore Mutfağı", category: "Mutfağa Özel", logo: "Kimchi", tagline: "MORE KIMCHI", emoji: "🍲", menuTheme: "kirmizi", menuTemplate: "liste", menuRadius: 6, showProductImages: true, sectionTitles: ["Ana Yemek", "Sıcak"], style: { bg: "#fde8d0", text: "#33241a", muted: "#7a6a5a", accent: "#e53935", logoFont: "condensed", headingFont: "sans" },
    items: [
      { name: "Bibimbap", desc: "Sebzeli pilav, yumurta ve gochujang", price: 129 },
      { name: "Bulgogi", desc: "Marine dana eti, soğan ve susam", price: 159 },
      { name: "Kimchi Jjigae", desc: "Acı kimchi güveç, domuz etiyle", price: 135 },
    ] },
  { id: "meksika", name: "Meksika & Taco", category: "Mutfağa Özel", logo: "Mexi Tacos", tagline: "CANTINA", emoji: "🌮", menuTheme: "kirmizi", menuTemplate: "kart", menuRadius: 12, showProductImages: true, sectionTitles: ["Tacos", "İçecekler"], style: { bg: "#e53935", text: "#ffffff", muted: "#ffd9d4", accent: "#fff3d6", logoFont: "round", headingFont: "serif" },
    items: [
      { name: "Carne Asada", desc: "Izgara dana, soğan, kişniş", price: 59 },
      { name: "Al Pastor", desc: "Ananaslı marine domuz", price: 55 },
      { name: "Pollo", desc: "Baharatlı ızgara tavuk", price: 55 },
    ] },
  { id: "pizza", name: "Pizza & İtalyan", category: "Mutfağa Özel", logo: "Casa Pizza", tagline: "FORNO A LEGNA", emoji: "🍕", menuTheme: "yesil", menuTemplate: "liste", menuRadius: 8, showProductImages: true, sectionTitles: ["Pizza", "Fırından"], style: { bg: "#0f2e1d", text: "#f2f7f0", muted: "#cfe0d2", accent: "#c8f542", logoFont: "round", headingFont: "sans" },
    items: [
      { name: "Margherita", desc: "Domates sosu, mozzarella, taze fesleğen", price: 85 },
      { name: "Pepperoni", desc: "Acılı pepperoni, ekstra mozzarella", price: 105 },
      { name: "Quattro Formaggi", desc: "Gorgonzola, parmesan, ricotta", price: 115 },
    ] },
  { id: "ramen", name: "Japon Ramen", category: "Mutfağa Özel", logo: "Slurp", tagline: "RAMEN BAR", emoji: "🍜", menuTheme: "grafit", menuTemplate: "liste", menuRadius: 6, showProductImages: true, sectionTitles: ["Ramenler", "Atıştırmalık"], style: { bg: "#0d0d0d", text: "#f5f0e8", muted: "#b8b0a2", accent: "#ff5a1f", logoFont: "round", headingFont: "sans" },
    items: [
      { name: "Tonkotsu Classic", desc: "12 saat kaynatılmış domuz suyu, chashu", price: 120 },
      { name: "Miso Butter Corn", desc: "Miso, tereyağı, tatlı mısır", price: 119 },
      { name: "Spicy Tantan", desc: "Susam-çili suyu, kıyma, bak choy", price: 119 },
    ] },
  { id: "sushi", name: "Sushi & Izakaya", category: "Mutfağa Özel", logo: "Kumo", tagline: "SUSHI · IZAKAYA", emoji: "🍣", menuTheme: "grafit", menuTemplate: "liste", menuRadius: 4, showProductImages: false, sectionTitles: ["Signature Rolls", "Klasikler"], style: { bg: "#111111", text: "#f5f5f5", muted: "#9e9e9e", accent: "#ef5350", logoFont: "badge", headingFont: "sans", logoUpper: true },
    items: [
      { name: "Dragon Roll", desc: "Karides tempura, salatalık, avokado, unagi sos. 8 parça", price: 160 },
      { name: "Rainbow Roll", desc: "Yengeç, avokado, salatalık. 8 parça", price: 170 },
      { name: "Spicy Tuna Crunch", desc: "Acılı ton balığı, tempura gevreği, sriracha mayo", price: 140 },
    ] },
  { id: "hint", name: "Hint Restoranı", category: "Mutfağa Özel", logo: "Saffron House", tagline: "INDIAN KITCHEN", emoji: "🍛", menuTheme: "mavi", menuTemplate: "liste", menuRadius: 4, showProductImages: false, sectionTitles: ["Başlangıçlar", "Ana Yemek"], style: { bg: "#212c4e", text: "#f5f0e4", muted: "#cfc6ae", accent: "#e0a458", logoFont: "serif", headingFont: "serif" },
    items: [
      { name: "Sebzeli Samosa", desc: "Baharatlı patates ve bezelyeli hamur, naneli chutney", price: 70 },
      { name: "Soğan Bhaji", desc: "Çıtır soğan kızartması, menta raita", price: 70 },
      { name: "Chicken Tikka", desc: "Tandırda baharatlı tavuk, yoğurt marine", price: 110 },
    ] },
  { id: "tay", name: "Tay Mutfağı", category: "Mutfağa Özel", logo: "Lemongrass", tagline: "THAI STREET KITCHEN", emoji: "🌿", menuTheme: "yesil", menuTemplate: "liste", menuRadius: 4, showProductImages: false, sectionTitles: ["Başlangıçlar", "Sokak Lezzetleri"], style: { bg: "#eef2dc", text: "#2c3a1e", muted: "#5c6b4a", accent: "#2e5319", logoFont: "badge", headingFont: "sans", logoUpper: true },
    items: [
      { name: "Chicken Satay", desc: "Izgara tavuk şiş, fıstıklı sos", price: 100 },
      { name: "Taze Spring Roll", desc: "Pirinç kağıdı, vermicelli, tofu, tatlı biber", price: 80 },
      { name: "Tom Yam Soup", desc: "Acı ve ekşi, limon otu, karides", price: 90 },
    ] },
  { id: "italyan", name: "İtalyan Restoranı", category: "Mutfağa Özel", logo: "Lumari", tagline: "OSTERIA · CUCINA ITALIANA", emoji: "🍝", menuTheme: "kirmizi", menuTemplate: "liste", menuRadius: 4, showProductImages: false, sectionTitles: ["Antipasti", "Primi"], style: { bg: "#f7f0e0", text: "#33261c", muted: "#6b5a4a", accent: "#b03a2e", logoFont: "script", headingFont: "serif", logoItalic: true },
    items: [
      { name: "Burrata", desc: "Kremalı burrata, domates, fesleğen, sızma zeytinyağı", price: 140 },
      { name: "Vitello Tonnato", desc: "İnce dilim dana, ton balıklı sos, roka", price: 150 },
      { name: "Arancini", desc: "Saffron risotto topları, mozzarella, domates sosu", price: 110 },
    ] },
  { id: "barbeku", name: "Barbekü & Smokehouse", category: "Mutfağa Özel", logo: "Brannick's", tagline: "SMOKEHOUSE", emoji: "🔥", menuTheme: "turuncu", menuTemplate: "liste", menuRadius: 4, showProductImages: false, sectionTitles: ["Tandırdan", "Yanında"], style: { bg: "#f5eede", text: "#2e2318", muted: "#6b5a48", accent: "#8b2020", logoFont: "condensed", headingFont: "sans" },
    items: [
      { name: "Dana Brisket", desc: "14 saat dumanlanmış, biber kabuğu, kilo başı", price: 280 },
      { name: "Domuz Kaburga", desc: "Kuru ovulmuş, ev yapımı BBQ sos", price: 320 },
      { name: "Pulled Pork", desc: "Karolina sirkeli sos, çekilmiş omuz", price: 130 },
    ] },
  { id: "kebapci", name: "Kebapçı & Izgara", category: "Mutfağa Özel", logo: "Mangal Evi", tagline: "KEBAP & IZGARA", emoji: "🍢", menuTheme: "turuncu", menuTemplate: "kart", menuRadius: 8, showProductImages: true, sectionTitles: ["Kebaplar", "Izgaradan"], style: { bg: "#1c1208", text: "#fdf3e7", muted: "#cfae8a", accent: "#e0a458", logoFont: "serif", headingFont: "serif" },
    items: [
      { name: "Adana Kebap", desc: "Zırhta çekilmiş kuzu, közlenmiş biber", price: 180 },
      { name: "Urfa Kebap", desc: "Acısız kıyma kebap, bulgur pilavı", price: 170 },
      { name: "Külbastı", desc: "Kuzu pirzola, mangal ateşinde", price: 195 },
    ] },
  { id: "deniz", name: "Balık & Deniz Ürünleri", category: "Mutfağa Özel", logo: "Mavi Sahil", tagline: "BALIK & MEZE", emoji: "🦐", menuTheme: "mavi", menuTemplate: "kart", menuRadius: 16, showProductImages: true, sectionTitles: ["Mezeler", "Izgaradan"], style: { bg: "#0e2233", text: "#eaf4fb", muted: "#a8c4d6", accent: "#62b0e0", logoFont: "serif", headingFont: "serif" },
    items: [
      { name: "Levrek Izgara", desc: "Tam levrek, zeytinyağlı sebzeler", price: 280 },
      { name: "Karides Güveç", desc: "Sarımsaklı tereyağı ve biber", price: 250 },
      { name: "Kalamar Tava", desc: "Çıtır un kızartması, tartar sos", price: 180 },
    ] },
  { id: "vegan", name: "Vegan & Sağlıklı", category: "Mutfağa Özel", logo: "Yeşil Kase", tagline: "PLANT BASED", emoji: "🥗", menuTheme: "yesil", menuTemplate: "izgara", menuRadius: 20, showProductImages: true, sectionTitles: ["Kaseler", "Salatalar"], style: { bg: "#e9f4e4", text: "#2c3a22", muted: "#5f7a52", accent: "#4c8c3f", logoFont: "round", headingFont: "sans" },
    items: [
      { name: "Falafel Tabağı", desc: "Nohut köftesi, tahin sos, turşu", price: 110 },
      { name: "Avokado Salata", desc: "Kinoa, ceviz, narenciye sosu", price: 90 },
      { name: "Vegan Burger", desc: "Nohut-mantar köfte, baharatlı mayo", price: 130 },
    ] },

  // --- Mekan Türü ---
  { id: "cafe", name: "Kafe & Fırın", category: "Mekan Türü", logo: "Wake Cup", tagline: "COFFEE & BAKERY", emoji: "☕", menuTheme: "mavi", menuTemplate: "kart", menuRadius: 12, showProductImages: true, sectionTitles: ["Pastries", "Sıcak"], style: { bg: "#16265c", text: "#f0f2fa", muted: "#c2c8de", accent: "#f5c86e", logoFont: "script", headingFont: "sans" },
    items: [
      { name: "Tereyağlı Kruvasan", desc: "Günlük kat kat açılmış hamur", price: 28 },
      { name: "Çikolatalı Kruvasan", desc: "Bitter çikolata dolgulu", price: 32 },
      { name: "Yaban Mersinli Muffin", desc: "Yumuşacık muffin, taze orman meyvesi", price: 35 },
    ] },
  { id: "kahve", name: "Kahve Dükkanı", category: "Mekan Türü", logo: "Bona", tagline: "CAFE", emoji: "🫘", menuTheme: "grafit", menuTemplate: "kart", menuRadius: 12, showProductImages: true, sectionTitles: ["Coffee", "Filtre"], style: { bg: "#101d18", text: "#f0ece4", muted: "#b5aa9a", accent: "#d4a24e", logoFont: "serif", headingFont: "sans", logoUpper: true },
    items: [
      { name: "Espresso", desc: "Koyu kavruluz tek çekim", price: 25 },
      { name: "Americano", desc: "Çift shot, sıcak su ile", price: 30 },
      { name: "Cappuccino", desc: "İpek sütle çift shot", price: 38 },
    ] },
  { id: "cocktailbar", name: "Kokteyl Bar", category: "Mekan Türü", logo: "Cocktails", tagline: "BAR & LOUNGE", emoji: "🍸", menuTheme: "mor", menuTemplate: "liste", menuRadius: 4, showProductImages: true, sectionTitles: ["Signature", "Klasikler"], style: { bg: "#f2a0c0", text: "#8e1230", muted: "#b04a68", accent: "#c2185b", logoFont: "condensed", headingFont: "sans" },
    items: [
      { name: "Spritz", desc: "Aperol, prosecco, soda — hafif ve ferah", price: 120 },
      { name: "Paloma", desc: "Grepfrut soda, taze limon, tequila", price: 130 },
      { name: "Frozen Daiquiri", desc: "Soğuk, keskin, doyurucu", price: 125 },
    ] },
  { id: "icecek", name: "İçecek Menüsü", category: "Mekan Türü", logo: "Sipsip", tagline: "COCKTAIL BAR", emoji: "🍹", menuTheme: "mor", menuTemplate: "liste", menuRadius: 0, showProductImages: true, sectionTitles: ["Signature", "Classic"], style: { bg: "#0a0a0a", text: "#f5f5f5", muted: "#9e9e9e", accent: "#e6c069", logoFont: "script", headingFont: "sans", logoItalic: true },
    items: [
      { name: "French 75", desc: "Gin, limon, şeker, şampanya", price: 120 },
      { name: "Kir Royal", desc: "Crème de cassis, şampanya", price: 120 },
      { name: "Sidecar", desc: "Konyak, portakal likörü, limon", price: 120 },
    ] },
  { id: "sarap", name: "Şarap Listesi", category: "Mekan Türü", logo: "Vellara", tagline: "WINE BAR", emoji: "🍷", menuTheme: "kirmizi", menuTemplate: "liste", menuRadius: 0, showProductImages: false, sectionTitles: ["Sparkling", "Kırmızılar"], style: { bg: "#3d0e22", text: "#f5e9e0", muted: "#d0a8b8", accent: "#d4af37", logoFont: "serif", headingFont: "serif", logoUpper: true },
    items: [
      { name: "Prosecco Superiore DOCG", desc: "Valdobbiadene, İtalya — yeşil elma, beyaz çiçekler", price: 420 },
      { name: "Crémant de Loire Brut", desc: "Chenin Blanc, Loire — ince kabarcıklı", price: 520 },
      { name: "Champagne Brut NV", desc: "Pinot Noir chardonnay — kavrulmuş badem", price: 840 },
    ] },
  { id: "birahane", name: "Bira & Taproom", category: "Mekan Türü", logo: "Halvard", tagline: "TAPROOM", emoji: "🍺", menuTheme: "grafit", menuTemplate: "liste", menuRadius: 4, showProductImages: false, sectionTitles: ["On Tap", "Konserve"], style: { bg: "#14100d", text: "#f0e8dc", muted: "#b0a290", accent: "#e0a458", logoFont: "badge", headingFont: "sans", logoUpper: true },
    items: [
      { name: "Halvard Pilsner", desc: "Çek usulü pilsner · %4.8 — çiçekten şerbetçiotu", price: 65 },
      { name: "Cloudie IPA", desc: "New England IPA · %6.5 — mango, narenciye", price: 75 },
      { name: "Copper Ale", desc: "Amber ale · %5.2 — karamel malt", price: 70 },
    ] },
  { id: "pub", name: "Pub Mutfağı", category: "Mekan Türü", logo: "The King's Pint", tagline: "PUB GRUB", emoji: "🍗", menuTheme: "turuncu", menuTemplate: "liste", menuRadius: 6, showProductImages: false, sectionTitles: ["Snacks", "Sıcak"], style: { bg: "#5d3a2a", text: "#f5ede2", muted: "#d8c2ae", accent: "#f0d5a8", logoFont: "serif", headingFont: "sans" },
    items: [
      { name: "Nachos", desc: "Erimiş peynir, salsa, jalapeño", price: 75 },
      { name: "Loaded Fries", desc: "Çıtır patates, peynir sos, bacon", price: 69 },
      { name: "Chicken Wings", desc: "BBQ veya acı soslu kanat", price: 85 },
    ] },
  { id: "gastro-pub", name: "Gastropub", category: "Mekan Türü", logo: "The Golden Fork", tagline: "GASTRO PUB", emoji: "🍽️", menuTheme: "mavi", menuTemplate: "liste", menuRadius: 6, showProductImages: true, sectionTitles: ["Main", "Favoriler"], style: { bg: "#102a43", text: "#eef2f6", muted: "#a4b6c8", accent: "#d4af37", logoFont: "serif", headingFont: "serif", logoUpper: true },
    items: [
      { name: "Gastro Burger", desc: "Dana eti, cheddar, briyoch, kızarmış patates", price: 159 },
      { name: "Beer-Battered Fish & Chips", desc: "Biralı levrek, tereyağlı bezelye, limon", price: 165 },
      { name: "Steak & Fries", desc: "Izgara bonfile, biber sosu", price: 220 },
    ] },
  { id: "nargile", name: "Nargile Lounge", category: "Mekan Türü", logo: "Shisha", tagline: "PREMIUM LOUNGE", emoji: "💨", menuTheme: "grafit", menuTemplate: "liste", menuRadius: 4, showProductImages: true, sectionTitles: ["Flavors", "Karışım"], style: { bg: "#0c0c0c", text: "#f2ede4", muted: "#9a938a", accent: "#cfd8dc", logoFont: "badge", headingFont: "serif", logoUpper: true },
    items: [
      { name: "Nane", desc: "Serin ve ferah", price: 200 },
      { name: "Çift Elma", desc: "Tatlı, anasonlu", price: 200 },
      { name: "Üzüm", desc: "Pürüzsüz ve meyveli", price: 200 },
    ] },
  { id: "firin", name: "Fırın & Pastane", category: "Mekan Türü", logo: "The Daily Dough", tagline: "FRESH BAKERY", emoji: "🥐", menuTheme: "mor", menuTemplate: "liste", menuRadius: 12, showProductImages: true, sectionTitles: ["Ekmekler", "Viyana"], style: { bg: "#f4f1fa", text: "#3a3050", muted: "#8a80a0", accent: "#7c6bb0", logoFont: "serif", headingFont: "serif" },
    items: [
      { name: "Ekşi Mayalı Ekmek", desc: "Her zaman iyi. Günün hamuru", price: 40 },
      { name: "Baget", desc: "Klasik baget, tartışmasız", price: 35 },
      { name: "Tereyağlı Kruvasan", desc: "Ekstra tereyağlı, pişmanlıksız", price: 30 },
    ] },
  { id: "dondurma", name: "Dondurma & Sorbet", category: "Mekan Türü", logo: "Melto", tagline: "GELATO & SORBET", emoji: "🍨", menuTheme: "mavi", menuTemplate: "kart", menuRadius: 20, showProductImages: true, sectionTitles: ["Classic", "Signature"], style: { bg: "#283593", text: "#f2f4ff", muted: "#c4c9ea", accent: "#ffffff", logoFont: "script", headingFont: "sans", logoItalic: true },
    items: [
      { name: "Vanilya", desc: "Kremalı Madagaskar vanilyası", price: 30 },
      { name: "Çikolata", desc: "Kakaolu, fudge kuşaklı", price: 30 },
      { name: "Çilek", desc: "Gerçek çilekli", price: 30 },
    ] },
  { id: "dondurma-kamyonu", name: "Dondurma Kamyonu", category: "Mekan Türü", logo: "Ice Cream Truck", tagline: "SOFT SERVE", emoji: "🍦", menuTheme: "kirmizi", menuTemplate: "kart", menuRadius: 24, showProductImages: true, sectionTitles: ["Küllah", "Serpme"], style: { bg: "#fdf3c9", text: "#4a3a1a", muted: "#a08a5a", accent: "#e53935", logoFont: "round", headingFont: "sans" },
    items: [
      { name: "Vanilya", desc: "Pürüzsüz ve kremsi, zengin vanilya", price: 45 },
      { name: "Çikolata", desc: "Derin kakao aroması, zengin ve lezzetli", price: 45 },
      { name: "Fıstıklı", desc: "Kavrulmuş fıstık, hafif tuzlu", price: 45 },
    ] },
  { id: "su-barı", name: "Su Barı & Sıkma Meyve", category: "Mekan Türü", logo: "Juice Bar", tagline: "FRESH · PRESSED · DAILY", emoji: "🍊", menuTheme: "yesil", menuTemplate: "liste", menuRadius: 8, showProductImages: false, sectionTitles: ["Cold-pressed", "Smoothie"], style: { bg: "#eef4e0", text: "#2c3a1e", muted: "#5c6b4a", accent: "#2e7d32", logoFont: "condensed", headingFont: "sans", logoUpper: true },
    items: [
      { name: "Green Glow", desc: "Ispanak, salatalık, kereviz, elma, limon", price: 75 },
      { name: "Sunrise", desc: "Portakal, havuç, zencefil, zerdeçal", price: 70 },
      { name: "Beet It", desc: "Pancar, elma, havuç, limon, zencefil", price: 70 },
    ] },
  { id: "otel", name: "Otel & Resort", category: "Mekan Türü", logo: "Ardena", tagline: "HOTEL & SUITES", emoji: "🏨", menuTheme: "mavi", menuTemplate: "liste", menuRadius: 4, showProductImages: false, sectionTitles: ["Kahvaltı", "Ana Yemek"], style: { bg: "#faf6ee", text: "#1a2456", muted: "#7a7a90", accent: "#1a2456", logoFont: "serif", headingFont: "serif", logoUpper: true },
    items: [
      { name: "Kıta Kahvaltısı", desc: "Kruvasan, katalog çikolata, tereyağ, reçel", price: 240 },
      { name: "Full English", desc: "İki yumurta, bacon, sosis, domates, fasulye", price: 260 },
      { name: "Eggs Benedict", desc: "Poşe yumurta, jambon, hollandaise, muffin", price: 190 },
    ] },
  { id: "dugun", name: "Düğün & Organizasyon", category: "Mekan Türü", logo: "Emma & James", tagline: "12 · 06 · 2027", emoji: "🥂", menuTheme: "turuncu", menuTemplate: "liste", menuRadius: 4, showProductImages: false, sectionTitles: ["Karşılama", "Başlangıç"], style: { bg: "#f5efe6", text: "#4a3a2a", muted: "#8a7a64", accent: "#b1946a", logoFont: "serif", headingFont: "serif", logoItalic: true },
    items: [
      { name: "Şampanya veya Süsen Spritz", desc: "Tören sonrası çimende ikram", price: 0 },
      { name: "Kanepeler", desc: "Füme somon blini, keçi peyniri ve incir", price: 0 },
      { name: "Domates & Burrata", desc: "Miris domates, fesleğen, ekstra sızma", price: 0 },
    ] },

  // --- Yemek & İçecek ---
  { id: "burger", name: "Burger & Fast Food", category: "Yemek & İçecek", logo: "Slam'd", tagline: "BURGER JOINT", emoji: "🍔", menuTheme: "kirmizi", menuTemplate: "izgara", menuRadius: 8, showProductImages: true, sectionTitles: ["Burgerler", "Yanında"], style: { bg: "#1a1208", text: "#f5ede0", muted: "#c0ac90", accent: "#ff8c42", logoFont: "condensed", headingFont: "sans" },
    items: [
      { name: "Klasik Burger", desc: "Dana köfte, cheddar, turşu, özel sos", price: 110 },
      { name: "Çift Peynirli", desc: "İki dana köfte, çift cheddar", price: 140 },
      { name: "Soğan Halkası", desc: "Çıtır soğan, barbekü mayo", price: 60 },
    ] },
  { id: "kahvalti", name: "Kahvaltı & Brunch", category: "Yemek & İçecek", logo: "Sunnyside", tagline: "BREAKFAST · BRUNCH", emoji: "🍳", menuTheme: "turuncu", menuTemplate: "izgara", menuRadius: 16, showProductImages: false, sectionTitles: ["Eggs & Classics", "Tostlar"], style: { bg: "#fdf3d1", text: "#4a3a1a", muted: "#a08a5a", accent: "#f2620f", logoFont: "round", headingFont: "sans" },
    items: [
      { name: "Sunny Kahvaltı", desc: "İki yumurta, bacon, sosis, hash brown", price: 150 },
      { name: "Eggs Benedict", desc: "Poşe yumurta, jambon, hollandaise", price: 160 },
      { name: "Avokado Tost", desc: "Ekşi mayalı, çıtlık biber, limon", price: 130 },
    ] },
  { id: "tatli", name: "Tatlı & Dessert Bar", category: "Yemek & İçecek", logo: "Sugar Bloom", tagline: "DESSERT BAR", emoji: "🧁", menuTheme: "mor", menuTemplate: "izgara", menuRadius: 24, showProductImages: false, sectionTitles: ["Signature", "Klasikler"], style: { bg: "#fce4ec", text: "#4a2c3a", muted: "#a0708a", accent: "#c2185b", logoFont: "script", headingFont: "serif", logoItalic: true },
    items: [
      { name: "Çikolatalı Fondan", desc: "Akışkan bitter çikolata, tuzlu karamel, vanilyalı dondurma", price: 120 },
      { name: "Crème Brûlée", desc: "Madagaskar vanilyalı muhallebi, karamelize şeker", price: 100 },
      { name: "Tiramisu", desc: "Esviyçli savoiardi, mascarpone, kakao", price: 110 },
    ] },
  { id: "tatlici", name: "Tatlıcı & Baklava", category: "Yemek & İçecek", logo: "Şerbet", tagline: "TATLI & BAKLAVA", emoji: "🍮", menuTheme: "turuncu", menuTemplate: "kart", menuRadius: 16, showProductImages: true, sectionTitles: ["Baklava", "Sütlü"], style: { bg: "#2b1a08", text: "#f8eeda", muted: "#c9ac7e", accent: "#e0a458", logoFont: "serif", headingFont: "serif" },
    items: [
      { name: "Fıstıklı Baklava", desc: "Antep fıstıklı, el açması 40 kat yufka", price: 95 },
      { name: "Künefe", desc: "Tel kadayıf, peynir, kaymak", price: 85 },
      { name: "Fırın Sütlaç", desc: "Kızarmış tarçınlı", price: 60 },
    ] },

  // --- Özel Gün ---
  { id: "yilbasi", name: "Yılbaşı & Noel", category: "Özel Gün", logo: "Holly & Hearth", tagline: "FESTIVE MENU", emoji: "🎄", menuTheme: "yesil", menuTemplate: "liste", menuRadius: 4, showProductImages: false, sectionTitles: ["Festive Set Menüler", "İçecekler"], style: { bg: "#1e4d2b", text: "#f2efe0", muted: "#b8c8b0", accent: "#e8c97a", logoFont: "serif", headingFont: "serif" },
    items: [
      { name: "Üç Çanağlı Noel Menüsü", desc: "Başlangıç, ana yemek ve tatlı — 1-24 Aralık", price: 550 },
      { name: "Yılbaşı Öğle Yemeği", desc: "Dört çanak, minik pastalar ve kahve", price: 950 },
      { name: "Çocuk Menüsü", desc: "İki çanak, sıcak çikolata", price: 220 },
    ] },
  { id: "hasat", name: "Hasat & Şükran", category: "Özel Gün", logo: "Harvest Table", tagline: "SEZONUN HASADI", emoji: "🎃", menuTheme: "turuncu", menuTemplate: "liste", menuRadius: 4, showProductImages: false, sectionTitles: ["Şükran Sofrası", "Paylaşımlık"], style: { bg: "#f6ead3", text: "#4a2e1a", muted: "#a0785a", accent: "#c05621", logoFont: "serif", headingFont: "serif" },
    items: [
      { name: "Şükran Ziyafeti", desc: "Kestane dolgulu hindi ve tüm yanları", price: 650 },
      { name: "Çocuk Tabağı", desc: "Hindi, püre, makarna ve dilim pasta", price: 240 },
      { name: "Aile Ziyafeti (Paket)", desc: "Tam hindi, dört garnitür", price: 2200 },
    ] },
  { id: "gunun-ozeli", name: "Günün Özel Menüsü", category: "Özel Gün", logo: "Ollo", tagline: "DAILY SPECIALS", emoji: "⭐", menuTheme: "yesil", menuTemplate: "liste", menuRadius: 4, showProductImages: false, sectionTitles: ["Günün Özel", "Bitmeden"], style: { bg: "#1b3a2a", text: "#f2f0e4", muted: "#b0c0a8", accent: "#fdd835", logoFont: "badge", headingFont: "sans", logoUpper: true },
    items: [
      { name: "Yavaş Pişmiş Kuzu Omuz", desc: "Biberiye jus, közlenmiş patates — bitince biter", price: 260 },
      { name: "Trüflü Mantar Risotto", desc: "Porcini, parmesan, trüf yağı — vejetaryen", price: 190 },
      { name: "Biftek Friteleri", desc: "250g bonfile, biberli sos, elma kızartması", price: 290 },
    ] },

  // --- Modern ---
  { id: "modern", name: "Modern Restoran", category: "Modern", logo: "Ember & Stone", tagline: "CONTEMPORARY KITCHEN", emoji: "✦", menuTheme: "grafit", menuTemplate: "liste", menuRadius: 4, showProductImages: false, sectionTitles: ["Start", "Main"], style: { bg: "#f0ede4", text: "#2b2b2b", muted: "#6b6b6b", accent: "#1a1a1a", logoFont: "badge", headingFont: "sans", logoUpper: true },
    items: [
      { name: "Burrata", desc: "Domates, fesleğen yağı", price: 95 },
      { name: "Dana Tartar", desc: "Hardal, yumurta sarısı", price: 125 },
      { name: "Kızarmış Karnabahar", desc: "Tahini, nar ekşisi", price: 89 },
    ] },
  { id: "catering", name: "Catering & Davet", category: "Modern", logo: "Le Petite Paris", tagline: "TRAITEUR", emoji: "🥘", menuTheme: "yesil", menuTemplate: "liste", menuRadius: 4, showProductImages: true, sectionTitles: ["Main", "Vejetaryen"], style: { bg: "#1d3d34", text: "#eef2ee", muted: "#a8c0b4", accent: "#d4af37", logoFont: "script", headingFont: "serif", logoItalic: true },
    items: [
      { name: "Coq au Vin", desc: "Şarapla sote tavuk", price: 149 },
      { name: "Beef Bourguignon", desc: "Yavaş pişmiş dana, mantarlar", price: 169 },
      { name: "Sebzeli Ratatouille", desc: "Provans usulü sebzeler", price: 119 },
    ] },
];

export const MENU_PRESET_BY_ID: Record<string, MenuPreset> = Object.fromEntries(
  MENU_PRESETS.map((p) => [p.id, p]),
);

/** Logo/başlık fontu anahtarlarının CSS eşlemesi (PublicMenu + galeri ortak). */
export const MENU_PRESET_FONTS: Record<MenuPresetFontKey, string> = {
  serif: 'Georgia, "Times New Roman", serif',
  sans: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  condensed: '"Arial Narrow", "Helvetica Neue", Arial, sans-serif',
  badge: '"Trebuchet MS", Verdana, sans-serif',
  round: '"Verdana", "Trebuchet MS", sans-serif',
  script: 'Georgia, "Times New Roman", serif',
};
