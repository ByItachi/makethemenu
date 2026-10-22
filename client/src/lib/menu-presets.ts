/**
 * Hazır menü şablonları: her şablon kendi marka kimliğiyle (arka plan, metin,
 * vurgu rengi, logo/başlık tipi) gelir. Hem şablon galerisi önizlemesi hem de
 * herkese açık menü (/p/:slug) bu stilleri kullanır.
 *
 * style.logoFont / style.headingFont anahtarları PublicMenu ve galeride aynı
 * CSS eşlemesiyle yorumlanır (bkz. MENU_PRESET_FONTS).
 */
export type MenuPresetFontKey = "serif" | "sans" | "condensed" | "badge" | "round" | "script" | "bbh";

export type MenuPresetStyle = {
  bg: string;
  text: string;
  muted: string;
  accent: string;
  /** Bolum basliklarinin rengi (varsayilan: accent). mmmmenu orneklerinde bazi temalarda beyazdir. */
  sectionTitleColor?: string;
  /** Urun adi/fiyat rengi (varsayilan: text). */
  itemColor?: string;
  logoFont: MenuPresetFontKey;
  headingFont: MenuPresetFontKey;
  logoUpper?: boolean;
  logoItalic?: boolean;
};

export type MenuPresetItem = { name: string; desc?: string; price: number; image?: string };

export type MenuPreset = {
  id: string;
  name: string;
  category: string;
  logo: string;
  tagline?: string;
  emoji: string;
  /** Varsa, metin logosu yerine gosterilecek gercek logo gorseli (menu-logos). */
  logoImage?: string;
  /** Logo gorselinin azami yuksekligi (px) — orijinal orani korur. */
  logoHeight?: number;
  menuTheme: "yesil" | "mavi" | "kirmizi" | "mor" | "turuncu" | "grafit";
  menuTemplate: "liste" | "izgara" | "kart";
  menuRadius: number;
  showProductImages: boolean;
  sectionTitles: string[];
  items: MenuPresetItem[];
  style: MenuPresetStyle;
};

export const CATEGORIES = ["Tümü", "Mutfağa Özel", "Mekan Türü", "Yemek & İçecek", "Özel Gün", "Modern"] as const;

export const MENU_PRESETS: MenuPreset[] = [
  // --- Mutfağa Özel ---
  { id: "food-truck", name: "Food Truck", category: "Mutfağa Özel", logo: "Roll & Eat", tagline: "FOOD TRUCK", emoji: "🚚", logoImage: "https://zxhnxmpqpqthesbaxtfh.supabase.co/storage/v1/object/public/menu-logos/e9f60217-4b35-4faf-a2da-2dcd1db07a2c-1765985188849.png", logoHeight: 164, menuTheme: "turuncu", menuTemplate: "kart", menuRadius: 8, showProductImages: true, sectionTitles: ["Yemek", "Yanında"], style: { bg: "#482311", text: "#ff5c00", muted: "#fbf0da", accent: "#ff5c00", sectionTitleColor: "#feffff", itemColor: "#ff5c00", logoFont: "badge", headingFont: "badge", logoUpper: true },
    items: [
      { name: "Tavuk Dürüm", desc: "Izgara tavuk / falafel, taze salata, yoğurt veya tahin sosu", price: 85, image: "https://zxhnxmpqpqthesbaxtfh.supabase.co/storage/v1/object/public/product-images/e9f60217-4b35-4faf-a2da-2dcd1db07a2c/1765985649386.png" },
      { name: "Burger", desc: "Buttermilk tavuk veya bitkisel köfte, slaw, turşu, acılı mayonez", price: 120, image: "https://zxhnxmpqpqthesbaxtfh.supabase.co/storage/v1/object/public/product-images/e9f60217-4b35-4faf-a2da-2dcd1db07a2c/1765985741812.png" },
      { name: "Halloumi Dürüm", desc: "Izgara halloumi, humus, roka", price: 90 },
      { name: "Tatlı Patates Kızartması", desc: "Sarımsaklı mayonez veya acı sos ile", price: 48, image: "https://zxhnxmpqpqthesbaxtfh.supabase.co/storage/v1/object/public/product-images/e9f60217-4b35-4faf-a2da-2dcd1db07a2c/1765985917336.png" },
      { name: "Yüklü Kızartma", desc: "Peynir sosu, bacon veya vejetaryen sos, taze soğan", price: 55, image: "https://zxhnxmpqpqthesbaxtfh.supabase.co/storage/v1/object/public/product-images/e9f60217-4b35-4faf-a2da-2dcd1db07a2c/1765985994937.png" },
      { name: "Ev Limonatası", desc: "Taze naneli, buz gibi", price: 35 },
    ] },
  { id: "cin-restorani", name: "Çin Restoranı", category: "Mutfağa Özel", logo: "Fat Cat", tagline: "NO.88 · ASIAN KITCHEN", emoji: "🐱", menuTheme: "kirmizi", menuTemplate: "liste", menuRadius: 4, showProductImages: true, sectionTitles: ["Paylaşımlık", "Öneriler"], style: { bg: "#9e9e9e", text: "#26221e", muted: "#4d4740", accent: "#b71c1c", logoFont: "badge", headingFont: "sans" },
    items: [
      { name: "Kung Pao Tavuk", desc: "Fıstıklı, kurutulmuş biberli", price: 96 },
      { name: "Wok Noodle", desc: "Sebzeli, soya soslu", price: 78 },
      { name: "Buharda Mantı", desc: "Xiaolongbao, domuz dolgulu", price: 84 },
      { name: "Kırmızı Yağlı Köfte", desc: "İpeksi köfte, yoğun kırmızı yağ sosu", price: 88 },
      { name: "Kavrulmuş Yeşil Fasulye", desc: "Soya, sarımsak, tuzlu zeytin", price: 62 },
      { name: "Haşlanmış Biber", desc: "Taze biber, hafif baharatlı", price: 74 },
    ] },
  { id: "kore", name: "Kore Mutfağı", category: "Mutfağa Özel", logo: "Kimchi", tagline: "MORE KIMCHI", emoji: "🍲", menuTheme: "kirmizi", menuTemplate: "liste", menuRadius: 6, showProductImages: true, sectionTitles: ["Ana Yemek", "Sıcak"], style: { bg: "#fde8d0", text: "#33241a", muted: "#7a6a5a", accent: "#e53935", logoFont: "condensed", headingFont: "sans" },
    items: [
      { name: "Tteokbokki", desc: "Baharatlı pirinç erişte, mozzarella", price: 92 },
      { name: "Kore Tavuğu", desc: "Çıtır, acı soslu", price: 145 },
      { name: "Yuzu Soda", desc: "Yuzu şurubu, taze nane", price: 48 },
      { name: "Bibimbap", desc: "Sebzeli pilav, yumurta ve gochujang", price: 129 },
      { name: "Bulgogi", desc: "Marine dana eti, soğan ve susam", price: 159 },
      { name: "Kimchi Jjigae", desc: "Acı kimchi güveç, domuz etiyle", price: 135 },
    ] },
  { id: "meksika", name: "Meksika & Taco", category: "Mutfağa Özel", logo: "Mexi Tacos", tagline: "CANTINA", emoji: "🌮", menuTheme: "kirmizi", menuTemplate: "kart", menuRadius: 12, showProductImages: true, sectionTitles: ["Tacos", "İçecekler"], style: { bg: "#e53935", text: "#ffffff", muted: "#ffd9d4", accent: "#fff3d6", logoFont: "round", headingFont: "serif" },
    items: [
      { name: "Quesadilla", desc: "Cheddar, mozzarella, acı sos", price: 105 },
      { name: "Nacho Grande", desc: "Jalapeño, cheddar, salsa", price: 95 },
      { name: "Margarita", desc: "Tequila, lime, agave", price: 140 },
      { name: "Carne Asada", desc: "Izgara dana, soğan, kişniş", price: 59 },
      { name: "Al Pastor", desc: "Ananaslı marine domuz", price: 55 },
      { name: "Pollo", desc: "Baharatlı ızgara tavuk", price: 55 },
    ] },
  { id: "pizza", name: "Pizza & İtalyan", category: "Mutfağa Özel", logo: "Casa Pizza", tagline: "FORNO A LEGNA", emoji: "🍕", menuTheme: "yesil", menuTemplate: "liste", menuRadius: 8, showProductImages: true, sectionTitles: ["Pizza", "Fırından"], style: { bg: "#0f2e1d", text: "#f2f7f0", muted: "#cfe0d2", accent: "#c8f542", logoFont: "round", headingFont: "sans" },
    items: [
      { name: "Margherita", desc: "Fesleğen, mozzarella, San Marzano", price: 130 },
      { name: "Pepperoni", desc: "Bol pepperoni, jalapeño", price: 150 },
      { name: "Tiramisu", desc: "Mascarpone, espresso, kakao", price: 85 },
      { name: "Margherita", desc: "Domates sosu, mozzarella, taze fesleğen", price: 85 },
      { name: "Pepperoni", desc: "Acılı pepperoni, ekstra mozzarella", price: 105 },
      { name: "Quattro Formaggi", desc: "Gorgonzola, parmesan, ricotta", price: 115 },
    ] },
  { id: "ramen", name: "Japon Ramen", category: "Mutfağa Özel", logo: "Slurp", tagline: "RAMEN BAR", emoji: "🍜", menuTheme: "grafit", menuTemplate: "liste", menuRadius: 6, showProductImages: true, sectionTitles: ["Ramenler", "Atıştırmalık"], style: { bg: "#0d0d0d", text: "#f5f0e8", muted: "#b8b0a2", accent: "#ff5a1f", logoFont: "round", headingFont: "sans" },
    items: [
      { name: "Shoyu Ramen", desc: "Soya soslu, yumurtalı, nori", price: 135 },
      { name: "Spicy Miso Ramen", desc: "Acı miso, kıyma, mısır", price: 145 },
      { name: "Gyoza", desc: "5'li tavuklu", price: 75 },
      { name: "Tonkotsu Classic", desc: "12 saat kaynatılmış domuz suyu, chashu", price: 120 },
      { name: "Miso Butter Corn", desc: "Miso, tereyağı, tatlı mısır", price: 119 },
      { name: "Spicy Tantan", desc: "Susam-çili suyu, kıyma, bak choy", price: 119 },
    ] },
  { id: "sushi", name: "Sushi & Izakaya", category: "Mutfağa Özel", logo: "Kumo", tagline: "SUSHI · IZAKAYA", emoji: "🍣", menuTheme: "grafit", menuTemplate: "liste", menuRadius: 4, showProductImages: false, sectionTitles: ["Signature Rolls", "Klasikler"], style: { bg: "#111111", text: "#f5f5f5", muted: "#9e9e9e", accent: "#ef5350", logoFont: "badge", headingFont: "sans", logoUpper: true },
    items: [
      { name: "California Roll", desc: "8'li, yengeç, avokado", price: 165 },
      { name: "Salmon Nigiri", desc: "4'lü taze somon", price: 145 },
      { name: "Miso Çorbası", desc: "Tofu, wakame", price: 55 },
      { name: "Dragon Roll", desc: "Karides tempura, salatalık, avokado, unagi sos. 8 parça", price: 160 },
      { name: "Rainbow Roll", desc: "Yengeç, avokado, salatalık. 8 parça", price: 170 },
      { name: "Spicy Tuna Crunch", desc: "Acılı ton balığı, tempura gevreği, sriracha mayo", price: 140 },
    ] },
  { id: "hint", name: "Hint Restoranı", category: "Mutfağa Özel", logo: "Saffron House", tagline: "INDIAN KITCHEN", emoji: "🍛", menuTheme: "mavi", menuTemplate: "liste", menuRadius: 4, showProductImages: false, sectionTitles: ["Başlangıçlar", "Ana Yemek"], style: { bg: "#212c4e", text: "#f5f0e4", muted: "#cfc6ae", accent: "#e0a458", logoFont: "serif", headingFont: "serif" },
    items: [
      { name: "Butter Chicken", desc: "Tereyağlı tavuk, basmati pilav", price: 155 },
      { name: "Sarımsaklı Naan", desc: "Tandır ekmeği", price: 45 },
      { name: "Mango Lassi", desc: "Yoğurtlu, mangolu", price: 60 },
      { name: "Sebzeli Samosa", desc: "Baharatlı patates ve bezelyeli hamur, naneli chutney", price: 70 },
      { name: "Soğan Bhaji", desc: "Çıtır soğan kızartması, menta raita", price: 70 },
      { name: "Chicken Tikka", desc: "Tandırda baharatlı tavuk, yoğurt marine", price: 110 },
    ] },
  { id: "tay", name: "Tay Mutfağı", category: "Mutfağa Özel", logo: "Lemongrass", tagline: "THAI STREET KITCHEN", emoji: "🌿", menuTheme: "yesil", menuTemplate: "liste", menuRadius: 4, showProductImages: false, sectionTitles: ["Başlangıçlar", "Sokak Lezzetleri"], style: { bg: "#eef2dc", text: "#2c3a1e", muted: "#5c6b4a", accent: "#2e5319", logoFont: "badge", headingFont: "sans", logoUpper: true },
    items: [
      { name: "Pad Thai", desc: "Karides, fıstık, lime", price: 145 },
      { name: "Tom Yum", desc: "Acı-ekşi çorba, karidesli", price: 130 },
      { name: "Mango Sticky Rice", desc: "Tatlı mango, yapışkan pilav", price: 90 },
      { name: "Chicken Satay", desc: "Izgara tavuk şiş, fıstıklı sos", price: 100 },
      { name: "Taze Spring Roll", desc: "Pirinç kağıdı, vermicelli, tofu, tatlı biber", price: 80 },
      { name: "Tom Yam Soup", desc: "Acı ve ekşi, limon otu, karides", price: 90 },
    ] },
  { id: "italyan", name: "İtalyan Restoranı", category: "Mutfağa Özel", logo: "Lumari", tagline: "OSTERIA · CUCINA ITALIANA", emoji: "🍝", menuTheme: "kirmizi", menuTemplate: "liste", menuRadius: 4, showProductImages: false, sectionTitles: ["Antipasti", "Primi"], style: { bg: "#f7f0e0", text: "#33261c", muted: "#6b5a4a", accent: "#b03a2e", logoFont: "script", headingFont: "serif", logoItalic: true },
    items: [
      { name: "Tagliatelle", desc: "Trüflü, parmesanlı", price: 175 },
      { name: "Osso Buco", desc: "Dana incik, risotto ile", price: 210 },
      { name: "Panna Cotta", desc: "Vanilya, meyve sosu", price: 80 },
      { name: "Burrata", desc: "Kremalı burrata, domates, fesleğen, sızma zeytinyağı", price: 140 },
      { name: "Vitello Tonnato", desc: "İnce dilim dana, ton balıklı sos, roka", price: 150 },
      { name: "Arancini", desc: "Saffron risotto topları, mozzarella, domates sosu", price: 110 },
    ] },
  { id: "barbeku", name: "Barbekü & Smokehouse", category: "Mutfağa Özel", logo: "Brannick's", tagline: "SMOKEHOUSE", emoji: "🔥", menuTheme: "turuncu", menuTemplate: "liste", menuRadius: 4, showProductImages: false, sectionTitles: ["Tandırdan", "Yanında"], style: { bg: "#f5eede", text: "#2e2318", muted: "#6b5a48", accent: "#8b2020", logoFont: "condensed", headingFont: "sans" },
    items: [
      { name: "Smoked Brisket", desc: "12 saat dumanlı dana göğüs", price: 260 },
      { name: "BBQ Tavuk", desc: "Füme sos, coleslaw", price: 190 },
      { name: "Mac & Cheese", desc: "Fırında üç peynirli", price: 85 },
      { name: "Dana Brisket", desc: "14 saat dumanlanmış, biber kabuğu, kilo başı", price: 280 },
      { name: "Domuz Kaburga", desc: "Kuru ovulmuş, ev yapımı BBQ sos", price: 320 },
      { name: "Pulled Pork", desc: "Karolina sirkeli sos, çekilmiş omuz", price: 130 },
    ] },
  { id: "kebapci", name: "Kebapçı & Izgara", category: "Mutfağa Özel", logo: "Mangal Evi", tagline: "KEBAP & IZGARA", emoji: "🍢", menuTheme: "turuncu", menuTemplate: "kart", menuRadius: 8, showProductImages: true, sectionTitles: ["Kebaplar", "Izgaradan"], style: { bg: "#1c1208", text: "#fdf3e7", muted: "#cfae8a", accent: "#e0a458", logoFont: "serif", headingFont: "serif" },
    items: [
      { name: "Adana Kebap", desc: "Acılı, lavaş üstünde", price: 195 },
      { name: "Kuzu Şiş", desc: "Marine kuzu, pilavla", price: 225 },
      { name: "Künefe", desc: "Peynirli, kadayıflı", price: 95 },
      { name: "Adana Kebap", desc: "Zırhta çekilmiş kuzu, közlenmiş biber", price: 180 },
      { name: "Urfa Kebap", desc: "Acısız kıyma kebap, bulgur pilavı", price: 170 },
      { name: "Külbastı", desc: "Kuzu pirzola, mangal ateşinde", price: 195 },
    ] },
  { id: "deniz", name: "Balık & Deniz Ürünleri", category: "Mutfağa Özel", logo: "Mavi Sahil", tagline: "BALIK & MEZE", emoji: "🦐", menuTheme: "mavi", menuTemplate: "kart", menuRadius: 16, showProductImages: true, sectionTitles: ["Mezeler", "Izgaradan"], style: { bg: "#0e2233", text: "#eaf4fb", muted: "#a8c4d6", accent: "#62b0e0", logoFont: "serif", headingFont: "serif" },
    items: [
      { name: "Levrek Izgara", desc: "Tam levrek, mevsim yeşillikleri", price: 245 },
      { name: "Kalamar Tava", desc: "Tartar sos ile", price: 130 },
      { name: "Hamsi Tava", desc: "Karadeniz usulü", price: 140 },
      { name: "Levrek Izgara", desc: "Tam levrek, zeytinyağlı sebzeler", price: 280 },
      { name: "Karides Güveç", desc: "Sarımsaklı tereyağı ve biber", price: 250 },
      { name: "Kalamar Tava", desc: "Çıtır un kızartması, tartar sos", price: 180 },
    ] },
  { id: "vegan", name: "Vegan & Sağlıklı", category: "Mutfağa Özel", logo: "Yeşil Kase", tagline: "PLANT BASED", emoji: "🥗", menuTheme: "yesil", menuTemplate: "izgara", menuRadius: 20, showProductImages: true, sectionTitles: ["Kaseler", "Salatalar"], style: { bg: "#e9f4e4", text: "#2c3a22", muted: "#5f7a52", accent: "#4c8c3f", logoFont: "round", headingFont: "sans" },
    items: [
      { name: "Buddha Bowl", desc: "Kinoa, nohut, avokado", price: 115 },
      { name: "Vegan Wrap", desc: "Sebzeli, tahin soslu", price: 98 },
      { name: "Detoks Suyu", desc: "Yeşil elma, ıspanak, zencefil", price: 55 },
      { name: "Falafel Tabağı", desc: "Nohut köftesi, tahin sos, turşu", price: 110 },
      { name: "Avokado Salata", desc: "Kinoa, ceviz, narenciye sosu", price: 90 },
      { name: "Vegan Burger", desc: "Nohut-mantar köfte, baharatlı mayo", price: 130 },
    ] },

  // --- Mekan Türü ---
  { id: "cafe", name: "Kafe & Fırın", category: "Mekan Türü", logo: "Wake Cup", tagline: "COFFEE & BAKERY", emoji: "☕", menuTheme: "mavi", menuTemplate: "kart", menuRadius: 12, showProductImages: true, sectionTitles: ["Pastries", "Sıcak"], style: { bg: "#16265c", text: "#f0f2fa", muted: "#c2c8de", accent: "#f5c86e", logoFont: "script", headingFont: "sans" },
    items: [
      { name: "Cappuccino", desc: "İtalyan espresso, sütlü köpük", price: 55 },
      { name: "Cheesecake", desc: "Yaban mersini soslu", price: 85 },
      { name: "Kurabiye & Süt", desc: "Çikolatalı, günlük", price: 60 },
      { name: "Tereyağlı Kruvasan", desc: "Günlük kat kat açılmış hamur", price: 28 },
      { name: "Çikolatalı Kruvasan", desc: "Bitter çikolata dolgulu", price: 32 },
      { name: "Yaban Mersinli Muffin", desc: "Yumuşacık muffin, taze orman meyvesi", price: 35 },
    ] },
  { id: "kahve", name: "Kahve Dükkanı", category: "Mekan Türü", logo: "Bona", tagline: "CAFE", emoji: "🫘", menuTheme: "grafit", menuTemplate: "kart", menuRadius: 12, showProductImages: true, sectionTitles: ["Coffee", "Filtre"], style: { bg: "#101d18", text: "#f0ece4", muted: "#b5aa9a", accent: "#d4a24e", logoFont: "serif", headingFont: "sans", logoUpper: true },
    items: [
      { name: "Flat White", desc: "Çift shot ristretto", price: 60 },
      { name: "Cold Brew", desc: "16 saat demlenmiş", price: 65 },
      { name: "Muzlu Kek", desc: "Cevizli, tarçınlı", price: 58 },
      { name: "Espresso", desc: "Koyu kavruluz tek çekim", price: 25 },
      { name: "Americano", desc: "Çift shot, sıcak su ile", price: 30 },
      { name: "Cappuccino", desc: "İpek sütle çift shot", price: 38 },
    ] },
  { id: "cocktailbar", name: "Kokteyl Bar", category: "Mekan Türü", logo: "Cocktails", tagline: "BAR & LOUNGE", emoji: "🍸", logoImage: "https://zxhnxmpqpqthesbaxtfh.supabase.co/storage/v1/object/public/menu-logos/e9fa19e0-5d6f-4549-93cd-617610f79f09-1765995876694.png", logoHeight: 184, menuTheme: "mor", menuTemplate: "liste", menuRadius: 4, showProductImages: true, sectionTitles: ["COCKTAILS"], style: { bg: "#f4a4c0", text: "#ffffff", muted: "#f6f3f3", accent: "#fe1e0b", sectionTitleColor: "#fe1e0b", itemColor: "#ffffff", logoFont: "condensed", headingFont: "bbh" },
    items: [
      { name: "Spritz (Aperol / Campari)", desc: "Aperitif, prosecco, soda\nLight bubbles, bitter smile.\nEasy drinking, hard to stop.", price: 12, image: "https://zxhnxmpqpqthesbaxtfh.supabase.co/storage/v1/object/public/product-images/e9fa19e0-5d6f-4549-93cd-617610f79f09/1765997146292.png" },
      { name: "Paloma", desc: "Tequila, grapefruit, soda\nFresh, bitter, and dangerously drinkable.\nSunshine with an edge.", price: 12, image: "https://zxhnxmpqpqthesbaxtfh.supabase.co/storage/v1/object/public/product-images/e9fa19e0-5d6f-4549-93cd-617610f79f09/1765997905612.png" },
      { name: "Frozen Daiquiri", desc: "Rum, lime, sugar\nCold, sharp, and straight to the point.\nSummer in a fist.", price: 12, image: "https://zxhnxmpqpqthesbaxtfh.supabase.co/storage/v1/object/public/product-images/e9fa19e0-5d6f-4549-93cd-617610f79f09/1765997786925.png" },
    ] },
  { id: "icecek", name: "İçecek Menüsü", category: "Mekan Türü", logo: "Sipsip", tagline: "COCKTAIL BAR", emoji: "🍹", menuTheme: "mor", menuTemplate: "liste", menuRadius: 0, showProductImages: true, sectionTitles: ["Signature", "Classic"], style: { bg: "#0a0a0a", text: "#f5f5f5", muted: "#9e9e9e", accent: "#e6c069", logoFont: "script", headingFont: "sans", logoItalic: true },
    items: [
      { name: "Mojito", desc: "Nane, lime, beyaz rom", price: 135 },
      { name: "Piña Colada", desc: "Rom, ananas, hindistan cevizi", price: 145 },
      { name: "Gin Tonic", desc: "Fesleğenli, pink pepper", price: 130 },
      { name: "French 75", desc: "Gin, limon, şeker, şampanya", price: 120 },
      { name: "Kir Royal", desc: "Crème de cassis, şampanya", price: 120 },
      { name: "Sidecar", desc: "Konyak, portakal likörü, limon", price: 120 },
    ] },
  { id: "sarap", name: "Şarap Listesi", category: "Mekan Türü", logo: "Vellara", tagline: "WINE BAR", emoji: "🍷", menuTheme: "kirmizi", menuTemplate: "liste", menuRadius: 0, showProductImages: false, sectionTitles: ["Sparkling", "Kırmızılar"], style: { bg: "#3d0e22", text: "#f5e9e0", muted: "#d0a8b8", accent: "#d4af37", logoFont: "serif", headingFont: "serif", logoUpper: true },
    items: [
      { name: "Öküzgözü", desc: "Türk kırmızısı, 2019", price: 320 },
      { name: "Chardonnay", desc: "Beyaz, meyvemsi", price: 280 },
      { name: "Prosecco", desc: "Kadeh, İtalya", price: 190 },
      { name: "Prosecco Superiore DOCG", desc: "Valdobbiadene, İtalya — yeşil elma, beyaz çiçekler", price: 420 },
      { name: "Crémant de Loire Brut", desc: "Chenin Blanc, Loire — ince kabarcıklı", price: 520 },
      { name: "Champagne Brut NV", desc: "Pinot Noir chardonnay — kavrulmuş badem", price: 840 },
    ] },
  { id: "birahane", name: "Bira & Taproom", category: "Mekan Türü", logo: "Halvard", tagline: "TAPROOM", emoji: "🍺", menuTheme: "grafit", menuTemplate: "liste", menuRadius: 4, showProductImages: false, sectionTitles: ["On Tap", "Konserve"], style: { bg: "#14100d", text: "#f0e8dc", muted: "#b0a290", accent: "#e0a458", logoFont: "badge", headingFont: "sans", logoUpper: true },
    items: [
      { name: "Craft IPA", desc: "Yerel üretim, acımsı", price: 95 },
      { name: "Pilsner", desc: "Buz gibi kadeh", price: 75 },
      { name: "Jumbo Sosis", desc: "Karamelize soğanlı, hardallı", price: 110 },
      { name: "Halvard Pilsner", desc: "Çek usulü pilsner · %4.8 — çiçekten şerbetçiotu", price: 65 },
      { name: "Cloudie IPA", desc: "New England IPA · %6.5 — mango, narenciye", price: 75 },
      { name: "Copper Ale", desc: "Amber ale · %5.2 — karamel malt", price: 70 },
    ] },
  { id: "pub", name: "Pub Mutfağı", category: "Mekan Türü", logo: "The King's Pint", tagline: "PUB GRUB", emoji: "🍗", menuTheme: "turuncu", menuTemplate: "liste", menuRadius: 6, showProductImages: false, sectionTitles: ["Snacks", "Sıcak"], style: { bg: "#5d3a2a", text: "#f5ede2", muted: "#d8c2ae", accent: "#f0d5a8", logoFont: "serif", headingFont: "sans" },
    items: [
      { name: "Fish & Chips", desc: "Bira hamurunda, tartar sos", price: 165 },
      { name: "Bangers & Mash", desc: "Sosis, patates püresi", price: 150 },
      { name: "Shepherd's Pie", desc: "Kuzu kıymalı güveç", price: 160 },
      { name: "Nachos", desc: "Erimiş peynir, salsa, jalapeño", price: 75 },
      { name: "Loaded Fries", desc: "Çıtır patates, peynir sos, bacon", price: 69 },
      { name: "Chicken Wings", desc: "BBQ veya acı soslu kanat", price: 85 },
    ] },
  { id: "gastro-pub", name: "Gastropub", category: "Mekan Türü", logo: "The Golden Fork", tagline: "GASTRO PUB", emoji: "🍽️", menuTheme: "mavi", menuTemplate: "liste", menuRadius: 6, showProductImages: true, sectionTitles: ["Main", "Favoriler"], style: { bg: "#102a43", text: "#eef2f6", muted: "#a4b6c8", accent: "#d4af37", logoFont: "serif", headingFont: "serif", logoUpper: true },
    items: [
      { name: "Dana Yanak", desc: "12 saat yavaş pişmiş, trüflü püre", price: 240 },
      { name: "Gurme Burger", desc: "Wagyu, aged cheddar", price: 285 },
      { name: "Domuz Pirzola", desc: "Elmalı, ada çaylı", price: 220 },
      { name: "Gastro Burger", desc: "Dana eti, cheddar, briyoch, kızarmış patates", price: 159 },
      { name: "Beer-Battered Fish & Chips", desc: "Biralı levrek, tereyağlı bezelye, limon", price: 165 },
      { name: "Steak & Fries", desc: "Izgara bonfile, biber sosu", price: 220 },
    ] },
  { id: "nargile", name: "Nargile Lounge", category: "Mekan Türü", logo: "Shisha", tagline: "PREMIUM LOUNGE", emoji: "💨", menuTheme: "grafit", menuTemplate: "liste", menuRadius: 4, showProductImages: true, sectionTitles: ["Flavors", "Karışım"], style: { bg: "#0c0c0c", text: "#f2ede4", muted: "#9a938a", accent: "#cfd8dc", logoFont: "badge", headingFont: "serif", logoUpper: true },
    items: [
      { name: "Çift Elma", desc: "Klasik, yumuşak çekim", price: 180 },
      { name: "Nane Limon", desc: "Serinletici karışım", price: 175 },
      { name: "Karpuz-Mentol", desc: "Yaz karışımı", price: 185 },
      { name: "Nane", desc: "Serin ve ferah", price: 200 },
      { name: "Çift Elma", desc: "Tatlı, anasonlu", price: 200 },
      { name: "Üzüm", desc: "Pürüzsüz ve meyveli", price: 200 },
    ] },
  { id: "firin", name: "Fırın & Pastane", category: "Mekan Türü", logo: "The Daily Dough", tagline: "FRESH BAKERY", emoji: "🥐", menuTheme: "mor", menuTemplate: "liste", menuRadius: 12, showProductImages: true, sectionTitles: ["Ekmekler", "Viyana"], style: { bg: "#f4f1fa", text: "#3a3050", muted: "#8a80a0", accent: "#7c6bb0", logoFont: "serif", headingFont: "serif" },
    items: [
      { name: "Simit & Poğaça", desc: "Tereyağlı, susamlı", price: 35 },
      { name: "Su Böreği", desc: "Ev yapımı, beyaz peynirli", price: 70 },
      { name: "Tahinli Çörek", desc: "Akşam çıkımı", price: 45 },
      { name: "Ekşi Mayalı Ekmek", desc: "Her zaman iyi. Günün hamuru", price: 40 },
      { name: "Baget", desc: "Klasik baget, tartışmasız", price: 35 },
      { name: "Tereyağlı Kruvasan", desc: "Ekstra tereyağlı, pişmanlıksız", price: 30 },
    ] },
  { id: "dondurma", name: "Dondurma & Sorbet", category: "Mekan Türü", logo: "Melto", tagline: "GELATO & SORBET", emoji: "🍨", menuTheme: "mavi", menuTemplate: "kart", menuRadius: 20, showProductImages: true, sectionTitles: ["Classic", "Signature"], style: { bg: "#283593", text: "#f2f4ff", muted: "#c4c9ea", accent: "#ffffff", logoFont: "script", headingFont: "sans", logoItalic: true },
    items: [
      { name: "2 Top Külah", desc: "Fıstık ve çilek", price: 65 },
      { name: "Sundae", desc: "Sıcak çikolata, fındık", price: 95 },
      { name: "Affogato", desc: "Vanilyalı, espresso dökme", price: 85 },
      { name: "Vanilya", desc: "Kremalı Madagaskar vanilyası", price: 30 },
      { name: "Çikolata", desc: "Kakaolu, fudge kuşaklı", price: 30 },
      { name: "Çilek", desc: "Gerçek çilekli", price: 30 },
    ] },
  { id: "dondurma-kamyonu", name: "Dondurma Kamyonu", category: "Mekan Türü", logo: "Ice Cream Truck", tagline: "SOFT SERVE", emoji: "🍦", menuTheme: "kirmizi", menuTemplate: "kart", menuRadius: 24, showProductImages: true, sectionTitles: ["Küllah", "Serpme"], style: { bg: "#fdf3c9", text: "#4a3a1a", muted: "#a08a5a", accent: "#e53935", logoFont: "round", headingFont: "sans" },
    items: [
      { name: "Dondurma Sandviçi", desc: "Kurabiye arası", price: 55 },
      { name: "Gökkuşağı Konili", desc: "Renkli sprinkler", price: 60 },
      { name: "Banana Split", desc: "Klasik, fıstık ezmeli", price: 85 },
      { name: "Vanilya", desc: "Pürüzsüz ve kremsi, zengin vanilya", price: 45 },
      { name: "Çikolata", desc: "Derin kakao aroması, zengin ve lezzetli", price: 45 },
      { name: "Fıstıklı", desc: "Kavrulmuş fıstık, hafif tuzlu", price: 45 },
    ] },
  { id: "su-barı", name: "Su Barı & Sıkma Meyve", category: "Mekan Türü", logo: "Juice Bar", tagline: "FRESH · PRESSED · DAILY", emoji: "🍊", menuTheme: "yesil", menuTemplate: "liste", menuRadius: 8, showProductImages: false, sectionTitles: ["Cold-pressed", "Smoothie"], style: { bg: "#eef4e0", text: "#2c3a1e", muted: "#5c6b4a", accent: "#2e7d32", logoFont: "condensed", headingFont: "sans", logoUpper: true },
    items: [
      { name: "Yeşil Enerji", desc: "Ispanak, elma, zencefil", price: 68 },
      { name: "Gün Batımı", desc: "Havuç, portakal, zencefil", price: 66 },
      { name: "Acai Bowl", desc: "Muz, granola, dut", price: 95 },
      { name: "Green Glow", desc: "Ispanak, salatalık, kereviz, elma, limon", price: 75 },
      { name: "Sunrise", desc: "Portakal, havuç, zencefil, zerdeçal", price: 70 },
      { name: "Beet It", desc: "Pancar, elma, havuç, limon, zencefil", price: 70 },
    ] },
  { id: "otel", name: "Otel & Resort", category: "Mekan Türü", logo: "Ardena", tagline: "HOTEL & SUITES", emoji: "🏨", menuTheme: "mavi", menuTemplate: "liste", menuRadius: 4, showProductImages: false, sectionTitles: ["Kahvaltı", "Ana Yemek"], style: { bg: "#faf6ee", text: "#1a2456", muted: "#7a7a90", accent: "#1a2456", logoFont: "serif", headingFont: "serif", logoUpper: true },
    items: [
      { name: "Sezar Salata", desc: "Klasik, parmesan krokan", price: 145 },
      { name: "Dana Bonfile", desc: "Trüf sos, ızgara sebze", price: 385 },
      { name: "Crème Brûlée", desc: "Bourbon vanilyalı", price: 95 },
      { name: "Kıta Kahvaltısı", desc: "Kruvasan, katalog çikolata, tereyağ, reçel", price: 240 },
      { name: "Full English", desc: "İki yumurta, bacon, sosis, domates, fasulye", price: 260 },
      { name: "Eggs Benedict", desc: "Poşe yumurta, jambon, hollandaise, muffin", price: 190 },
    ] },
  { id: "dugun", name: "Düğün & Organizasyon", category: "Mekan Türü", logo: "Emma & James", tagline: "12 · 06 · 2027", emoji: "🥂", menuTheme: "turuncu", menuTemplate: "liste", menuRadius: 4, showProductImages: false, sectionTitles: ["Karşılama", "Başlangıç"], style: { bg: "#f5efe6", text: "#4a3a2a", muted: "#8a7a64", accent: "#b1946a", logoFont: "serif", headingFont: "serif", logoItalic: true },
    items: [
      { name: "Aperitif Tabağı", desc: "Mezeler, zeytinyağlılar", price: 220 },
      { name: "Kuzu Külbastı", desc: "Düğün pilavı ile", price: 340 },
      { name: "Düğün Pastası", desc: "Beyaz çikolatalı", price: 120 },
      { name: "Şampanya veya Süsen Spritz", desc: "Tören sonrası çimende ikram", price: 0 },
      { name: "Kanepeler", desc: "Füme somon blini, keçi peyniri ve incir", price: 0 },
      { name: "Domates & Burrata", desc: "Miris domates, fesleğen, ekstra sızma", price: 0 },
    ] },

  // --- Yemek & İçecek ---
  { id: "burger", name: "Burger & Fast Food", category: "Yemek & İçecek", logo: "Slam'd", tagline: "BURGER JOINT", emoji: "🍔", menuTheme: "kirmizi", menuTemplate: "izgara", menuRadius: 8, showProductImages: true, sectionTitles: ["Burgerler", "Yanında"], style: { bg: "#1a1208", text: "#f5ede0", muted: "#c0ac90", accent: "#ff8c42", logoFont: "condensed", headingFont: "sans" },
    items: [
      { name: "Double Smash", desc: "2 köfte, cheddar, turşu", price: 165 },
      { name: "Trüff Burger", desc: "Trüflü mayonez, mozzarella", price: 185 },
      { name: "Süslü Patates", desc: "Trüff yağı, parmesan", price: 75 },
      { name: "Klasik Burger", desc: "Dana köfte, cheddar, turşu, özel sos", price: 110 },
      { name: "Çift Peynirli", desc: "İki dana köfte, çift cheddar", price: 140 },
      { name: "Soğan Halkası", desc: "Çıtır soğan, barbekü mayo", price: 60 },
    ] },
  { id: "kahvalti", name: "Kahvaltı & Brunch", category: "Yemek & İçecek", logo: "Sunnyside", tagline: "BREAKFAST · BRUNCH", emoji: "🍳", menuTheme: "turuncu", menuTemplate: "izgara", menuRadius: 16, showProductImages: false, sectionTitles: ["Eggs & Classics", "Tostlar"], style: { bg: "#fdf3d1", text: "#4a3a1a", muted: "#a08a5a", accent: "#f2620f", logoFont: "round", headingFont: "sans" },
    items: [
      { name: "Serpme Kahvaltı", desc: "2 kişilik, 18 çeşit", price: 320 },
      { name: "Menemen", desc: "Domates, biber, beyaz peynir", price: 95 },
      { name: "Mıhlama", desc: "Rize usulü eritme", price: 110 },
      { name: "Sunny Kahvaltı", desc: "İki yumurta, bacon, sosis, hash brown", price: 150 },
      { name: "Eggs Benedict", desc: "Poşe yumurta, jambon, hollandaise", price: 160 },
      { name: "Avokado Tost", desc: "Ekşi mayalı, çıtlık biber, limon", price: 130 },
    ] },
  { id: "tatli", name: "Tatlı & Dessert Bar", category: "Yemek & İçecek", logo: "Sugar Bloom", tagline: "DESSERT BAR", emoji: "🧁", menuTheme: "mor", menuTemplate: "izgara", menuRadius: 24, showProductImages: false, sectionTitles: ["Signature", "Klasikler"], style: { bg: "#fce4ec", text: "#4a2c3a", muted: "#a0708a", accent: "#c2185b", logoFont: "script", headingFont: "serif", logoItalic: true },
    items: [
      { name: "San Sebastian", desc: "Yanık cheesecake", price: 120 },
      { name: "Fıstıklı Baklava", desc: "Antep fıstığı, şerbet", price: 105 },
      { name: "Profiterol", desc: "Sıcak çikolata soslu", price: 90 },
      { name: "Çikolatalı Fondan", desc: "Akışkan bitter çikolata, tuzlu karamel, vanilyalı dondurma", price: 120 },
      { name: "Crème Brûlée", desc: "Madagaskar vanilyalı muhallebi, karamelize şeker", price: 100 },
      { name: "Tiramisu", desc: "Esviyçli savoiardi, mascarpone, kakao", price: 110 },
    ] },
  { id: "tatlici", name: "Tatlıcı & Baklava", category: "Yemek & İçecek", logo: "Şerbet", tagline: "TATLI & BAKLAVA", emoji: "🍮", menuTheme: "turuncu", menuTemplate: "kart", menuRadius: 16, showProductImages: true, sectionTitles: ["Baklava", "Sütlü"], style: { bg: "#2b1a08", text: "#f8eeda", muted: "#c9ac7e", accent: "#e0a458", logoFont: "serif", headingFont: "serif" },
    items: [
      { name: "Şöbiyet", desc: "Antep fıstığı, kaymak", price: 115 },
      { name: "Trileçe", desc: "Üç sütlü, karamelli", price: 95 },
      { name: "Fıstıklı Kadayıf", desc: "Buz gibi", price: 100 },
      { name: "Fıstıklı Baklava", desc: "Antep fıstıklı, el açması 40 kat yufka", price: 95 },
      { name: "Künefe", desc: "Tel kadayıf, peynir, kaymak", price: 85 },
      { name: "Fırın Sütlaç", desc: "Kızarmış tarçınlı", price: 60 },
    ] },

  // --- Özel Gün ---
  { id: "yilbasi", name: "Yılbaşı & Noel", category: "Özel Gün", logo: "Holly & Hearth", tagline: "FESTIVE MENU", emoji: "🎄", menuTheme: "yesil", menuTemplate: "liste", menuRadius: 4, showProductImages: false, sectionTitles: ["Festive Set Menüler", "İçecekler"], style: { bg: "#1e4d2b", text: "#f2efe0", muted: "#b8c8b0", accent: "#e8c97a", logoFont: "serif", headingFont: "serif" },
    items: [
      { name: "Izgara Hindi", desc: "Kestaneli, cranberry soslu", price: 320 },
      { name: "Fırın Sebzeler", desc: "Balzamik, kekikli", price: 140 },
      { name: "Yule Log", desc: "Çikolatalı rulo pasta", price: 130 },
      { name: "Üç Çanağlı Noel Menüsü", desc: "Başlangıç, ana yemek ve tatlı — 1-24 Aralık", price: 550 },
      { name: "Yılbaşı Öğle Yemeği", desc: "Dört çanak, minik pastalar ve kahve", price: 950 },
      { name: "Çocuk Menüsü", desc: "İki çanak, sıcak çikolata", price: 220 },
    ] },
  { id: "hasat", name: "Hasat & Şükran", category: "Özel Gün", logo: "Harvest Table", tagline: "SEZONUN HASADI", emoji: "🎃", menuTheme: "turuncu", menuTemplate: "liste", menuRadius: 4, showProductImages: false, sectionTitles: ["Şükran Sofrası", "Paylaşımlık"], style: { bg: "#f6ead3", text: "#4a2e1a", muted: "#a0785a", accent: "#c05621", logoFont: "serif", headingFont: "serif" },
    items: [
      { name: "Kabak Çorbası", desc: "Kavrulmuş kabak, çekirdek", price: 75 },
      { name: "Mantar Risotto", desc: "Orman mantarları, parmesan", price: 165 },
      { name: "Elmalı Strudel", desc: "Tarçınlı, dondurmali", price: 85 },
      { name: "Şükran Ziyafeti", desc: "Kestane dolgulu hindi ve tüm yanları", price: 650 },
      { name: "Çocuk Tabağı", desc: "Hindi, püre, makarna ve dilim pasta", price: 240 },
      { name: "Aile Ziyafeti (Paket)", desc: "Tam hindi, dört garnitür", price: 2200 },
    ] },
  { id: "gunun-ozeli", name: "Günün Özel Menüsü", category: "Özel Gün", logo: "Ollo", tagline: "DAILY SPECIALS", emoji: "⭐", menuTheme: "yesil", menuTemplate: "liste", menuRadius: 4, showProductImages: false, sectionTitles: ["Günün Özel", "Bitmeden"], style: { bg: "#1b3a2a", text: "#f2f0e4", muted: "#b0c0a8", accent: "#fdd835", logoFont: "badge", headingFont: "sans", logoUpper: true },
    items: [
      { name: "Günün Çorbası", desc: "Mevsime göre değişir", price: 60 },
      { name: "Kasap Tabağı", desc: "Karışık ızgara, 2 kişilik", price: 420 },
      { name: "Ev Limonatası", desc: "Naneli, buz gibi", price: 40 },
      { name: "Yavaş Pişmiş Kuzu Omuz", desc: "Biberiye jus, közlenmiş patates — bitince biter", price: 260 },
      { name: "Trüflü Mantar Risotto", desc: "Porcini, parmesan, trüf yağı — vejetaryen", price: 190 },
      { name: "Biftek Friteleri", desc: "250g bonfile, biberli sos, elma kızartması", price: 290 },
    ] },

  // --- Modern ---
  { id: "modern", name: "Modern Restoran", category: "Modern", logo: "Ember & Stone", tagline: "CONTEMPORARY KITCHEN", emoji: "✦", menuTheme: "grafit", menuTemplate: "liste", menuRadius: 4, showProductImages: false, sectionTitles: ["Start", "Main"], style: { bg: "#f0ede4", text: "#2b2b2b", muted: "#6b6b6b", accent: "#1a1a1a", logoFont: "badge", headingFont: "sans", logoUpper: true },
    items: [
      { name: "Dana Tartar", desc: "Yumurta sarısı, ekşi maya", price: 225 },
      { name: "Balık Ceviche", desc: "Lime, turşu soğan", price: 185 },
      { name: "İncirli Tatlı", desc: "Aktif kömür, taze incir", price: 110 },
      { name: "Burrata", desc: "Domates, fesleğen yağı", price: 95 },
      { name: "Dana Tartar", desc: "Hardal, yumurta sarısı", price: 125 },
      { name: "Kızarmış Karnabahar", desc: "Tahini, nar ekşisi", price: 89 },
    ] },
  { id: "catering", name: "Catering & Davet", category: "Modern", logo: "Le Petite Paris", tagline: "TRAITEUR", emoji: "🥘", menuTheme: "yesil", menuTemplate: "liste", menuRadius: 4, showProductImages: true, sectionTitles: ["Main", "Vejetaryen"], style: { bg: "#1d3d34", text: "#eef2ee", muted: "#a8c0b4", accent: "#d4af37", logoFont: "script", headingFont: "serif", logoItalic: true },
    items: [
      { name: "Meze Tabağı", desc: "10-15 kişiye, karışık", price: 850 },
      { name: "Izgara Tabağı", desc: "20 kişilik, karışık et", price: 2400 },
      { name: "Tatlı Büfesi", desc: "Karışık, 30 kişilik", price: 1500 },
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
  script: '"Brush Script MT", "Segoe Script", cursive',
  bbh: '"BBH Bartle", "BBH Sans Bartle", "Trebuchet MS", Verdana, sans-serif',
};
