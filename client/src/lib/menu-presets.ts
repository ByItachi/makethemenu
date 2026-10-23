/**
 * Hazır menü şablonları: her şablon kendi marka kimliğiyle (arka plan, metin,
 * vurgu rengi, logo/başlık tipi) gelir. Hem şablon galerisi önizlemesi hem de
 * herkese açık menü (/p/:slug) bu stilleri kullanır.
 *
 * style.logoFont / style.headingFont anahtarları PublicMenu ve galeride aynı
 * CSS eşlemesiyle yorumlanır (bkz. MENU_PRESET_FONTS).
 */
export type MenuPresetFontKey = "serif" | "sans" | "condensed" | "badge" | "round" | "script" | "bbh" | "bebas" | "poppins" | "manrope" | "inter" | "lora" | "playfair" | "oswald";

export type MenuPresetStyle = {
  bg: string;
  text: string;
  muted: string;
  accent: string;
  /** Bolum basliklarinin rengi (varsayilan: accent). mmmmenu orneklerinde bazi temalarda beyazdir. */
  sectionTitleColor?: string;
  /** Urun adi/fiyat rengi (varsayilan: text). */
  itemColor?: string;
  /** Bolum basligi punto (varsayilan: 24). mmmmenu orneklerinde bazi temalarda 40. */
  sectionTitleSize?: number;
  /** Urun adi/açiklama/fiyat fontu (varsayilan: sistem sans). */
  itemFont?: MenuPresetFontKey;
  /** Fiyat son eki (orn. " / g"); fiyat "10 / g" biciminde gosterilir. */
  priceSuffix?: string;
  /** true ise fiyat her zaman 2 ondalikla gosterilir (orn. "14.90"), para birimi simgesi olmadan. */
  priceDecimals?: boolean;
  logoFont: MenuPresetFontKey;
  headingFont: MenuPresetFontKey;
  logoUpper?: boolean;
  logoItalic?: boolean;
};

export type MenuPresetItem = { name: string; desc?: string; price: number; image?: string; /** Urun bazli fiyat son eki (stildeki priceSuffix'i gecer). */ priceSuffix?: string; /** Tum fiyat formatlamasini gecersiz kilan sabit metin (referans HTML'deki ham fiyat gibi). */ priceLabel?: string };

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
  /** Fiyat on eki (orn. "$"); tanimliysa fiyat "$8.00" biciminde gosterilir. */
  currency?: string;
  menuTheme: "yesil" | "mavi" | "kirmizi" | "mor" | "turuncu" | "grafit";
  menuTemplate: "liste" | "izgara" | "kart";
  menuRadius: number;
  showProductImages: boolean;
  sectionTitles: string[];
  /** Bolum basina duesen urun sayisi (varsayilan: esit bolme). Ref HTML'de bolumler esit degilse kullanilir. */
  sectionCounts?: number[];
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
  { id: "cin-restorani", name: "Çin Restoranı", category: "Mutfağa Özel", logo: "Fat Cat", tagline: "NO.88 · ASIAN KITCHEN", emoji: "🐱", logoImage: "https://zxhnxmpqpqthesbaxtfh.supabase.co/storage/v1/object/public/menu-logos/a7c59a22-5be8-4ce2-a0cc-ba3e32f8b29c-1765999026510.png", logoHeight: 240, currency: "$", menuTheme: "kirmizi", menuTemplate: "liste", menuRadius: 4, showProductImages: true, sectionTitles: ["to share", "just for you"], style: { bg: "#929292", text: "#ffffff", muted: "#f6f3f399", accent: "#c70f15", sectionTitleColor: "#c70f15", itemColor: "#ffffff", sectionTitleSize: 40, logoFont: "badge", headingFont: "bebas" },
    items: [
      { name: "Red Oil Dumplings", desc: "Silky pork & chive dumplings drowned in chili oil, black vinegar, and just enough heat to make you slow down.", price: 8, image: "https://zxhnxmpqpqthesbaxtfh.supabase.co/storage/v1/object/public/product-images/a7c59a22-5be8-4ce2-a0cc-ba3e32f8b29c/1765999149266.png" },
      { name: "Charred Green Beans", desc: "Blistered hot, tossed with garlic, soy, and preserved olive greens. Salty. Smoky. Addictive.", price: 10, image: "https://zxhnxmpqpqthesbaxtfh.supabase.co/storage/v1/object/public/product-images/a7c59a22-5be8-4ce2-a0cc-ba3e32f8b29c/1765999166344.png" },
      { name: "Black Pepper Beef", desc: "Tender beef, cracked pepper, onions, and glossy soy. Rich, loud, and unapologetic.", price: 21, image: "https://zxhnxmpqpqthesbaxtfh.supabase.co/storage/v1/object/public/product-images/a7c59a22-5be8-4ce2-a0cc-ba3e32f8b29c/1765999237597.png" },
      { name: "Scallion Noodles", desc: "Hand-pulled wheat noodles slicked with scallion oil and soy. Simple, aromatic, impossible to stop eating.", price: 24, image: "https://zxhnxmpqpqthesbaxtfh.supabase.co/storage/v1/object/public/product-images/a7c59a22-5be8-4ce2-a0cc-ba3e32f8b29c/1765999795772.webp" },
    ] },
  { id: "kore", name: "Kore Mutfağı", category: "Mutfağa Özel", logo: "Kimchi", tagline: "MORE KIMCHI", emoji: "🍲", logoImage: "https://zxhnxmpqpqthesbaxtfh.supabase.co/storage/v1/object/public/menu-logos/d1e14f94-73e1-44eb-9cef-d35e50883ea3-1766051053430.png", logoHeight: 120, menuTheme: "kirmizi", menuTemplate: "liste", menuRadius: 6, showProductImages: true, sectionTitles: ["MAIN", "CHICKEN"], style: { bg: "#ffe9d6", text: "#000000", muted: "#000000", accent: "#fb1b17", sectionTitleColor: "#fb1b17", itemColor: "#000000", sectionTitleSize: 56, logoFont: "condensed", headingFont: "bebas", itemFont: "poppins" },
    items: [
      { name: "BIBIMBAP", desc: "Steamed rice with mixed vegetables, egg, and gochujang", price: 12.9, image: "https://zxhnxmpqpqthesbaxtfh.supabase.co/storage/v1/object/public/product-images/d1e14f94-73e1-44eb-9cef-d35e50883ea3/1766050183802.webp" },
      { name: "BULGOGI", desc: "Marinated beef grilled with onions and sesame", price: 15.9, image: "https://zxhnxmpqpqthesbaxtfh.supabase.co/storage/v1/object/public/product-images/d1e14f94-73e1-44eb-9cef-d35e50883ea3/1766050195821.webp" },
      { name: "KIMCHI JJIGAE", desc: "Spicy kimchi stew with pork and tofu", price: 13.5, image: "https://zxhnxmpqpqthesbaxtfh.supabase.co/storage/v1/object/public/product-images/d1e14f94-73e1-44eb-9cef-d35e50883ea3/1766050203364.webp" },
      { name: "JAPCHAE", desc: "Stir-fried glass noodles with vegetables", price: 12.5, image: "https://zxhnxmpqpqthesbaxtfh.supabase.co/storage/v1/object/public/product-images/d1e14f94-73e1-44eb-9cef-d35e50883ea3/1766050218425.webp" },
      { name: "SOY GARLIC", desc: "Crispy fried chicken glazed in soy garlic sauce", price: 14.9, image: "https://zxhnxmpqpqthesbaxtfh.supabase.co/storage/v1/object/public/product-images/d1e14f94-73e1-44eb-9cef-d35e50883ea3/1766050344272.webp" },
      { name: "SPICY GOCHUJANG", desc: "Fried chicken tossed in spicy gochujang sauce", price: 14.9, image: "https://zxhnxmpqpqthesbaxtfh.supabase.co/storage/v1/object/public/product-images/d1e14f94-73e1-44eb-9cef-d35e50883ea3/1766050434416.webp" },
      { name: "SWEET & CRISPY", desc: "Crunchy chicken with sweet chili glaze", price: 13.9, image: "https://zxhnxmpqpqthesbaxtfh.supabase.co/storage/v1/object/public/product-images/d1e14f94-73e1-44eb-9cef-d35e50883ea3/1766050512948.webp" },
    ] },
  { id: "meksika", name: "Meksika & Taco", category: "Mutfağa Özel", logo: "Mexi Tacos", tagline: "CANTINA", emoji: "🌮", logoImage: "https://zxhnxmpqpqthesbaxtfh.supabase.co/storage/v1/object/public/menu-logos/68b95579-2b1e-4d00-abd9-14cab218aa22-1766073075419.png", logoHeight: 146, menuTheme: "kirmizi", menuTemplate: "kart", menuRadius: 12, showProductImages: true, sectionTitles: ["Tacos", "Drinks"], sectionCounts: [4, 6], style: { bg: "#fd1717", text: "#fff2c2", muted: "#fff2c2", accent: "#fff2c2", sectionTitleColor: "#fff2c2", itemColor: "#fff2c2", sectionTitleSize: 40, itemFont: "inter", priceSuffix: "", logoFont: "round", headingFont: "lora" },
    items: [
      { name: "Carne Asada", desc: "Grilled beef, onion, cilantro", price: 5.9, image: "https://zxhnxmpqpqthesbaxtfh.supabase.co/storage/v1/object/public/product-images/68b95579-2b1e-4d00-abd9-14cab218aa22/1766072382651.webp" },
      { name: "Al Pastor", desc: "Marinated pork with pineapple", price: 5.9, image: "https://zxhnxmpqpqthesbaxtfh.supabase.co/storage/v1/object/public/product-images/68b95579-2b1e-4d00-abd9-14cab218aa22/1766072507288.webp" },
      { name: "Pollo", desc: "Seasoned grilled chicken", price: 5.5, image: "https://zxhnxmpqpqthesbaxtfh.supabase.co/storage/v1/object/public/product-images/68b95579-2b1e-4d00-abd9-14cab218aa22/1766072818494.webp" },
      { name: "Vegetariano", desc: "Grilled vegetables and salsa", price: 5.5, image: "https://zxhnxmpqpqthesbaxtfh.supabase.co/storage/v1/object/public/product-images/68b95579-2b1e-4d00-abd9-14cab218aa22/1766072837509.webp" },
      { name: "Fresh Lemonade", desc: "Homemade lemonade with fresh lemons and mint", price: 4 },
      { name: "Sparkling Water", desc: "Chilled sparkling mineral water", price: 2 },
      { name: "Horchata", desc: "Sweet rice milk with cinnamon", price: 3.9 },
      { name: "Jamaica", desc: "Hibiscus iced tea", price: 3.9 },
      { name: "Margarita", desc: "Tequila, lime, triple sec", price: 10 },
      { name: "Paloma", desc: "Tequila and grapefruit soda", price: 10 },
    ] },
  { id: "pizza", name: "Pizza & İtalyan", category: "Mutfağa Özel", logo: "Casa Pizza", tagline: "FORNO A LEGNA", emoji: "🍕", logoImage: "https://zxhnxmpqpqthesbaxtfh.supabase.co/storage/v1/object/public/menu-logos/69753e91-9cf9-4336-856b-b0444fe33fa8-1766155339866.png", logoHeight: 120, menuTheme: "yesil", menuTemplate: "liste", menuRadius: 8, showProductImages: true, sectionTitles: ["PIZZA", "SHARE", "DRINKS"], sectionCounts: [4, 3, 6], style: { bg: "#0f2418", text: "#ffffff", muted: "#63796c", accent: "#dfeb27", sectionTitleColor: "#dfeb27", itemColor: "#ffffff", sectionTitleSize: 40, itemFont: "inter", logoFont: "round", headingFont: "bebas" },
    items: [
      { name: "MARGHERITA", desc: "Tomato sauce, mozzarella, fresh basil", price: 8.5, priceLabel: "8.50", image: "https://zxhnxmpqpqthesbaxtfh.supabase.co/storage/v1/object/public/product-images/69753e91-9cf9-4336-856b-b0444fe33fa8/1766155108176.webp" },
      { name: "PEPPERONI", desc: "Tomato sauce, mozzarella, spicy pepperoni", price: 10.5, priceLabel: "10.50", image: "https://zxhnxmpqpqthesbaxtfh.supabase.co/storage/v1/object/public/product-images/69753e91-9cf9-4336-856b-b0444fe33fa8/1766154986219.webp" },
      { name: "QUATTRO FORMAGGI", desc: "Mozzarella, gorgonzola, parmesan, ricotta", price: 11.5, priceLabel: "11.50", image: "https://zxhnxmpqpqthesbaxtfh.supabase.co/storage/v1/object/public/product-images/69753e91-9cf9-4336-856b-b0444fe33fa8/1766155204902.webp" },
      { name: "PROSCIUTTO & MUSHROOMS", desc: "Tomato sauce, mozzarella, ham, mushrooms", price: 11, priceLabel: "11", image: "https://zxhnxmpqpqthesbaxtfh.supabase.co/storage/v1/object/public/product-images/69753e91-9cf9-4336-856b-b0444fe33fa8/1766155327501.webp" },
      { name: "GARLIC BREAD", desc: "Baked pizza bread with garlic butter", price: 4.5, priceLabel: "4.50" },
      { name: "BRUSCHETTA CLASSICA", desc: "Grilled bread, tomato, garlic, olive oil", price: 5.5, priceLabel: "5.50" },
      { name: "CAPRESE SALAD", desc: "Fresh mozzarella, tomatoes, basil", price: 7.5, priceLabel: "7.50" },
      { name: "Sparkling Water", price: 3, priceLabel: "3" },
      { name: "Still Water", price: 2.5, priceLabel: "2.50" },
      { name: "Cola", price: 3, priceLabel: "3" },
      { name: "Lemon Soda", price: 3.5, priceLabel: "3.50" },
      { name: "Orange Juice", price: 5, priceLabel: "5" },
      { name: "Espresso", price: 2.5, priceLabel: "2.50" },
    ] },
  { id: "ramen", name: "Japon Ramen", category: "Mutfağa Özel", logo: "Slurp", tagline: "RAMEN BAR", emoji: "🍜", logoImage: "https://zxhnxmpqpqthesbaxtfh.supabase.co/storage/v1/object/public/menu-logos/f267de04-399a-442b-ba83-59f15130cd49-1766163308408.png", logoHeight: 182, currency: "¥", menuTheme: "grafit", menuTemplate: "liste", menuRadius: 6, showProductImages: true, sectionTitles: ["RAMENS", "ADD-ON", "Drinks"], sectionCounts: [5, 1, 3], style: { bg: "#000000", text: "#969995", muted: "#fa4200", accent: "#fa4200", sectionTitleColor: "#fa4200", itemColor: "#969995", sectionTitleSize: 26, itemFont: "inter", logoFont: "round", headingFont: "oswald" },
    items: [
      { name: "Tonkotsu Classic", desc: "Pork bone broth, chashu pork, soft egg, scallions, nori\nRich, creamy, no shortcuts. The one you judge us by.", price: 20, priceLabel: "¥20", image: "https://zxhnxmpqpqthesbaxtfh.supabase.co/storage/v1/object/public/product-images/f267de04-399a-442b-ba83-59f15130cd49/1766163290246.webp" },
      { name: "Miso Butter Corn", desc: "Miso broth, butter, sweet corn, pork or tofu, scallions\nSavory, sweet, and addictive. Cold-weather favorite.", price: 19, priceLabel: "¥19", image: "https://zxhnxmpqpqthesbaxtfh.supabase.co/storage/v1/object/public/product-images/f267de04-399a-442b-ba83-59f15130cd49/1766163529956.webp" },
      { name: "Spicy Tantan", desc: "Sesame-chili broth, minced pork or soy, chili oil, bok choy\nNutty heat. Slow burn. Not polite. Very good.", price: 22, priceLabel: "¥22", image: "https://zxhnxmpqpqthesbaxtfh.supabase.co/storage/v1/object/public/product-images/f267de04-399a-442b-ba83-59f15130cd49/1766163675015.webp" },
      { name: "Veggie Umami", desc: "Mushroom dashi, roasted mushrooms, tofu, greens\nNo meat. No compromise. Deep, earthy, satisfying.", price: 18, priceLabel: "¥18", image: "https://zxhnxmpqpqthesbaxtfh.supabase.co/storage/v1/object/public/product-images/f267de04-399a-442b-ba83-59f15130cd49/1766163755731.webp" },
      { name: "Black Garlic Ramen", desc: "Tonkotsu broth, black garlic oil, pork belly, egg\nDark. Funky. Powerful. For garlic lovers only.", price: 26, priceLabel: "¥26", image: "https://zxhnxmpqpqthesbaxtfh.supabase.co/storage/v1/object/public/product-images/f267de04-399a-442b-ba83-59f15130cd49/1766163836440.webp" },
      { name: "Extras", desc: "Extra egg · Extra noodles · Chili oil · Black garlic oil", price: 2, priceLabel: "¥2" },
      { name: "Beer", desc: "Local tap beer", price: 4, priceLabel: "¥4" },
      { name: "Sparkling Water", desc: "Chilled sparkling mineral water", price: 2, priceLabel: "¥2" },
      { name: "Beverages", desc: "Coke, Sprite, Fanta", price: 5, priceLabel: "¥5" },
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
  { id: "hint", name: "Hint Restoranı", category: "Mutfağa Özel", logo: "Saffron House", tagline: "INDIAN KITCHEN", emoji: "🍛", logoImage: "https://zxhnxmpqpqthesbaxtfh.supabase.co/storage/v1/object/public/menu-logos/2ba8db58-6f47-4130-b7b8-e5ba3eb5c6c7-1766326751350.png", logoHeight: 20, menuTheme: "mavi", menuTemplate: "liste", menuRadius: 4, showProductImages: false, sectionTitles: ["START", "MAIN", "SIDE"], sectionCounts: [4, 5, 3], style: { bg: "#EEEDE8", text: "#4b4b4b", muted: "#707070", accent: "#4a4b4b", sectionTitleColor: "#4a4b4b", itemColor: "#4b4b4b", sectionTitleSize: 18, itemFont: "inter", priceSuffix: "", logoFont: "serif", headingFont: "inter" },
    items: [
      { name: "Burrata", desc: "Heirloom tomatoes, basil oil", price: 9.5, priceLabel: "9.5" },
      { name: "Beef Tartare", desc: "Capers, mustard, egg yolk", price: 12.5, priceLabel: "12.5" },
      { name: "Crispy Cauliflower", desc: "Tahini, pomegranate", price: 8.9, priceLabel: "8.9" },
      { name: "Tuna Crudo", desc: "Citrus, olive oil, sea salt", price: 13.9, priceLabel: "13.9" },
      { name: "Grilled Sea Bass", desc: "Lemon beurre blanc, greens", price: 21, priceLabel: "21" },
      { name: "Ribeye Steak", desc: "Pepper sauce, fries", price: 37, priceLabel: "37" },
      { name: "Roasted Chicken", desc: "Thyme jus, seasonal vegetables", price: 24, priceLabel: "24" },
      { name: "Mushroom Risotto", desc: "Parmesan, truffle oil", price: 17, priceLabel: "17" },
      { name: "Pasta al Limone", desc: "Lemon, cream, parmesan", price: 16, priceLabel: "16" },
      { name: "Roasted Potatoes", price: 4.5, priceLabel: "4.5" },
      { name: "Green Salad", price: 4.9, priceLabel: "4.9" },
      { name: "Grilled Broccolini", price: 5.5, priceLabel: "5.5" },
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
  { id: "vegan", name: "Vegan & Sağlıklı", category: "Mutfağa Özel", logo: "Yeşil Kase", tagline: "PLANT BASED", emoji: "🥗", logoImage: "https://zxhnxmpqpqthesbaxtfh.supabase.co/storage/v1/object/public/menu-logos/acbb0565-61ea-45a5-9171-b10a55395737-1766054364957.png", logoHeight: 180, menuTheme: "yesil", menuTemplate: "izgara", menuRadius: 20, showProductImages: false, sectionTitles: ["FLOWER", "EDIBLES"], style: { bg: "#263d29", text: "#ffffff", muted: "#86a289", accent: "#fefe93", sectionTitleColor: "#fefe93", itemColor: "#ffffff", sectionTitleSize: 26, logoFont: "round", headingFont: "manrope", itemFont: "manrope", priceSuffix: " / g" },
    items: [
      { name: "OG Kush", desc: "Earthy, pine aroma, balanced effects", price: 10 },
      { name: "Gelato", desc: "Sweet, creamy flavor, relaxing", price: 12 },
      { name: "Sour Diesel", desc: "Citrusy, energizing", price: 11 },
      { name: "Blue Dream", desc: "Smooth, berry notes", price: 11 },
      { name: "Gummies", desc: "Assorted flavors (10 pcs)", price: 18, priceSuffix: "" },
      { name: "Chocolate Bar", desc: "Milk or dark chocolate", price: 16, priceSuffix: "" },
      { name: "Hard Candies", desc: "Fruit flavors (20 pcs)", price: 15, priceSuffix: "" },
    ] },

  // --- Mekan Türü ---
  { id: "cafe", name: "Kafe & Fırın", category: "Mekan Türü", logo: "Wake Cup", tagline: "COFFEE & BAKERY", emoji: "☕", logoImage: "https://zxhnxmpqpqthesbaxtfh.supabase.co/storage/v1/object/public/menu-logos/14f71338-5bf7-4e5a-960a-02a468659dda-1765998813745.png", logoHeight: 160, menuTheme: "mavi", menuTemplate: "kart", menuRadius: 12, showProductImages: true, sectionTitles: ["PASTRIES", "HOT DRINKS"], style: { bg: "#123071", text: "#ffffff", muted: "#9fb1db", accent: "#f5c86e", sectionTitleColor: "#ffffff", itemColor: "#ffffff", sectionTitleSize: 28, logoFont: "script", headingFont: "poppins" },
    items: [
      { name: "Butter Croissant", desc: "Flaky, golden croissant baked fresh daily", price: 2.8, image: "https://zxhnxmpqpqthesbaxtfh.supabase.co/storage/v1/object/public/product-images/14f71338-5bf7-4e5a-960a-02a468659dda/1765999501798.png" },
      { name: "Chocolate Croissant", desc: "Croissant filled with dark chocolate", price: 3.2, image: "https://zxhnxmpqpqthesbaxtfh.supabase.co/storage/v1/object/public/product-images/14f71338-5bf7-4e5a-960a-02a468659dda/1765999778167.png" },
      { name: "Blueberry Muffin", desc: "Soft muffin packed with blueberries", price: 3.5, image: "https://zxhnxmpqpqthesbaxtfh.supabase.co/storage/v1/object/public/product-images/14f71338-5bf7-4e5a-960a-02a468659dda/1766000045559.png" },
      { name: "Cinnamon Roll", desc: "Warm roll with cinnamon sugar and glaze", price: 3.8, image: "https://zxhnxmpqpqthesbaxtfh.supabase.co/storage/v1/object/public/product-images/14f71338-5bf7-4e5a-960a-02a468659dda/1766000030497.png" },
      { name: "Banana Bread", desc: "Moist banana loaf, lightly sweetened", price: 3.6, image: "https://zxhnxmpqpqthesbaxtfh.supabase.co/storage/v1/object/public/product-images/14f71338-5bf7-4e5a-960a-02a468659dda/1766000148263.png" },
      { name: "Espresso", price: 2.5, image: "https://images.unsplash.com/photo-1510707577719-ae7c14805e3a?auto=format&fit=crop&w=240&q=70" },
      { name: "Americano", price: 3, image: "https://images.unsplash.com/photo-1551030173-122aabc4489c?auto=format&fit=crop&w=240&q=70" },
      { name: "Cappuccino", price: 3.8, image: "https://images.unsplash.com/photo-1572442388796-11668a67e53d?auto=format&fit=crop&w=240&q=70" },
    ] },
  { id: "kahve", name: "Kahve Dükkanı", category: "Mekan Türü", logo: "Bona", tagline: "CAFE", emoji: "🫘", logoImage: "https://zxhnxmpqpqthesbaxtfh.supabase.co/storage/v1/object/public/menu-logos/04781fe3-e050-4861-8c08-616977b57c72-1766328781161.png", logoHeight: 62, menuTheme: "grafit", menuTemplate: "liste", menuRadius: 12, showProductImages: true, sectionTitles: ["COFFEE", "ICED"], sectionCounts: [5, 4], style: { bg: "#0F1312", text: "#C9C3B5", muted: "#C9C3B5", accent: "#C9C3B5", sectionTitleColor: "#C9C3B5", itemColor: "#C9C3B5", sectionTitleSize: 24, itemFont: "manrope", priceSuffix: "", logoFont: "serif", headingFont: "poppins", logoUpper: true },
    items: [
      { name: "Espresso", price: 2.5, priceLabel: "2.5", image: "https://zxhnxmpqpqthesbaxtfh.supabase.co/storage/v1/object/public/product-images/04781fe3-e050-4861-8c08-616977b57c72/1766328951753.webp" },
      { name: "Americano", price: 3, priceLabel: "3", image: "https://zxhnxmpqpqthesbaxtfh.supabase.co/storage/v1/object/public/product-images/04781fe3-e050-4861-8c08-616977b57c72/1766329107283.webp" },
      { name: "Cappuccino", price: 3.8, priceLabel: "3.8", image: "https://zxhnxmpqpqthesbaxtfh.supabase.co/storage/v1/object/public/product-images/04781fe3-e050-4861-8c08-616977b57c72/1766329164808.webp" },
      { name: "Latte", price: 4.2, priceLabel: "4.2", image: "https://zxhnxmpqpqthesbaxtfh.supabase.co/storage/v1/object/public/product-images/04781fe3-e050-4861-8c08-616977b57c72/1766329300717.webp" },
      { name: "Flat White", price: 4.8, priceLabel: "4.8", image: "https://zxhnxmpqpqthesbaxtfh.supabase.co/storage/v1/object/public/product-images/04781fe3-e050-4861-8c08-616977b57c72/1766329397021.webp" },
      { name: "Iced Latte", price: 4.5, priceLabel: "4.5" },
      { name: "Iced Americano", price: 3.5, priceLabel: "3.5" },
      { name: "Vanilla Latte", price: 4.8, priceLabel: "4.8" },
      { name: "Caramel Latte", price: 4.8, priceLabel: "4.8" },
    ] },
  { id: "cocktailbar", name: "Kokteyl Bar", category: "Mekan Türü", logo: "Cocktails", tagline: "BAR & LOUNGE", emoji: "🍸", logoImage: "https://zxhnxmpqpqthesbaxtfh.supabase.co/storage/v1/object/public/menu-logos/e9fa19e0-5d6f-4549-93cd-617610f79f09-1765995876694.png", logoHeight: 184, menuTheme: "mor", menuTemplate: "liste", menuRadius: 4, showProductImages: true, sectionTitles: ["COCKTAILS"], style: { bg: "#f4a4c0", text: "#ffffff", muted: "#f6f3f3", accent: "#fe1e0b", sectionTitleColor: "#fe1e0b", itemColor: "#ffffff", logoFont: "condensed", headingFont: "bbh" },
    items: [
      { name: "Spritz (Aperol / Campari)", desc: "Aperitif, prosecco, soda\nLight bubbles, bitter smile.\nEasy drinking, hard to stop.", price: 12, image: "https://zxhnxmpqpqthesbaxtfh.supabase.co/storage/v1/object/public/product-images/e9fa19e0-5d6f-4549-93cd-617610f79f09/1765997146292.png" },
      { name: "Paloma", desc: "Tequila, grapefruit, soda\nFresh, bitter, and dangerously drinkable.\nSunshine with an edge.", price: 12, image: "https://zxhnxmpqpqthesbaxtfh.supabase.co/storage/v1/object/public/product-images/e9fa19e0-5d6f-4549-93cd-617610f79f09/1765997905612.png" },
      { name: "Frozen Daiquiri", desc: "Rum, lime, sugar\nCold, sharp, and straight to the point.\nSummer in a fist.", price: 12, image: "https://zxhnxmpqpqthesbaxtfh.supabase.co/storage/v1/object/public/product-images/e9fa19e0-5d6f-4549-93cd-617610f79f09/1765997786925.png" },
    ] },
  { id: "icecek", name: "İçecek Menüsü", category: "Mekan Türü", logo: "Sipsip", tagline: "COCKTAIL BAR", emoji: "🍹", logoImage: "https://zxhnxmpqpqthesbaxtfh.supabase.co/storage/v1/object/public/menu-logos/e3dd7737-9c8d-4801-97d8-c4de7585024e-1766092367600.png", logoHeight: 112, menuTheme: "mor", menuTemplate: "liste", menuRadius: 0, showProductImages: true, sectionTitles: ["SIGNATURE", "CLASSIC"], sectionCounts: [4, 3], style: { bg: "#000000", text: "#fcfcfc", muted: "#949494", accent: "#ffffff", sectionTitleColor: "#ffffff", itemColor: "#fcfcfc", sectionTitleSize: 20, itemFont: "inter", logoFont: "script", headingFont: "inter", logoItalic: true },
    items: [
      { name: "French 75", desc: "Gin, lemon, sugar, champagne", price: 12, image: "https://zxhnxmpqpqthesbaxtfh.supabase.co/storage/v1/object/public/product-images/e3dd7737-9c8d-4801-97d8-c4de7585024e/1766091336210.webp" },
      { name: "Kir Royal", desc: "Crème de cassis, champagne", price: 12, image: "https://zxhnxmpqpqthesbaxtfh.supabase.co/storage/v1/object/public/product-images/e3dd7737-9c8d-4801-97d8-c4de7585024e/1766091449364.webp" },
      { name: "Sidecar", desc: "Cognac, orange liqueur, lemon", price: 12, image: "https://zxhnxmpqpqthesbaxtfh.supabase.co/storage/v1/object/public/product-images/e3dd7737-9c8d-4801-97d8-c4de7585024e/1766091575708.webp" },
      { name: "Boulevardier", desc: "Bourbon, Campari, sweet vermouth", price: 12, image: "https://zxhnxmpqpqthesbaxtfh.supabase.co/storage/v1/object/public/product-images/e3dd7737-9c8d-4801-97d8-c4de7585024e/1766091668754.webp" },
      { name: "Martini", desc: "Gin or vodka, dry vermouth", price: 10, image: "https://zxhnxmpqpqthesbaxtfh.supabase.co/storage/v1/object/public/product-images/e3dd7737-9c8d-4801-97d8-c4de7585024e/1766091790705.webp" },
      { name: "Negroni", desc: "Gin, Campari, sweet vermouth", price: 10, image: "https://zxhnxmpqpqthesbaxtfh.supabase.co/storage/v1/object/public/product-images/e3dd7737-9c8d-4801-97d8-c4de7585024e/1766091799925.webp" },
      { name: "Old Fashioned", desc: "Bourbon, sugar, bitters", price: 10, image: "https://zxhnxmpqpqthesbaxtfh.supabase.co/storage/v1/object/public/product-images/e3dd7737-9c8d-4801-97d8-c4de7585024e/1766091965989.webp" },
    ] },
  { id: "sarap", name: "Şarap Listesi", category: "Mekan Türü", logo: "Vellara", tagline: "WINE BAR", emoji: "🍷", logoImage: "https://zxhnxmpqpqthesbaxtfh.supabase.co/storage/v1/object/public/menu-logos/83015f2f-6a55-45ee-9145-20304354a5e9-1790949563948.png", logoHeight: 130, menuTheme: "kirmizi", menuTemplate: "liste", menuRadius: 0, showProductImages: false, sectionTitles: ["Sparkling", "White", "Rosé", "Red", "Dessert & Fortified"], sectionCounts: [3, 4, 1, 5, 2], style: { bg: "#2a0b12", text: "#f6ece1", muted: "#c7a39f", accent: "#e8c98f", sectionTitleColor: "#e8c98f", itemColor: "#f6ece1", sectionTitleSize: 30, itemFont: "lora", priceSuffix: "", logoFont: "serif", headingFont: "playfair", logoUpper: true },
    items: [
      { name: "Prosecco Superiore DOCG", desc: "Glera · Valdobbiadene, Italy. Crisp green apple, pear and white flowers.", price: 9, priceLabel: "9 / 42" },
      { name: "Crémant de Loire Brut", desc: "Chenin Blanc, Chardonnay · Loire, France. Fine bubbles, citrus and brioche.", price: 11, priceLabel: "11 / 52" },
      { name: "Champagne Brut NV", desc: "Pinot Noir, Chardonnay, Meunier · Champagne, France. Toasted almond, lemon zest.", price: 16, priceLabel: "16 / 84" },
      { name: "Sauvignon Blanc", desc: "Marlborough, New Zealand. Passion fruit, lime and fresh-cut grass.", price: 9, priceLabel: "9 / 40" },
      { name: "Albariño", desc: "Rías Baixas, Spain. Saline, peach and lemon peel — great with seafood.", price: 10, priceLabel: "10 / 46" },
      { name: "Riesling Trocken", desc: "Mosel, Germany. Dry, racy acidity with green apple and slate.", price: 10, priceLabel: "10 / 48" },
      { name: "Chardonnay", desc: "Burgundy, France. Creamy, ripe citrus with a touch of oak.", price: 13, priceLabel: "13 / 62" },
      { name: "Côtes de Provence Rosé", desc: "Grenache, Cinsault · Provence, France. Pale, dry, strawberry and herbs.", price: 10, priceLabel: "10 / 46" },
      { name: "Pinot Noir", desc: "Central Otago, New Zealand. Silky cherry, raspberry and spice.", price: 12, priceLabel: "12 / 56" },
      { name: "Rioja Crianza", desc: "Tempranillo · Rioja, Spain. Red berries, vanilla and soft tannins.", price: 10, priceLabel: "10 / 44" },
      { name: "Chianti Classico", desc: "Sangiovese · Tuscany, Italy. Sour cherry, violet and savory herbs.", price: 11, priceLabel: "11 / 50" },
      { name: "Malbec", desc: "Mendoza, Argentina. Plum, blackberry and cocoa — bold and juicy.", price: 10, priceLabel: "10 / 46" },
      { name: "Cabernet Sauvignon", desc: "Napa Valley, USA. Blackcurrant, cedar and firm structure.", price: 15, priceLabel: "15 / 72" },
      { name: "Moscato d'Asti", desc: "Piedmont, Italy. Lightly sparkling, peach and orange blossom.", price: 8, priceLabel: "8 / 36" },
      { name: "Tawny Port 10 Year", desc: "Douro, Portugal. Caramel, dried fig and roasted nuts.", price: 9, priceLabel: "9" },
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
  { id: "pub", name: "Pub Mutfağı", category: "Mekan Türü", logo: "The King's Pint", tagline: "PUB GRUB", emoji: "🍗", logoImage: "https://zxhnxmpqpqthesbaxtfh.supabase.co/storage/v1/object/public/menu-logos/e6656f1d-eec5-4586-923c-128e4b807135-1766157997489.png", logoHeight: 132, menuTheme: "turuncu", menuTemplate: "liste", menuRadius: 6, showProductImages: false, sectionTitles: ["SNACKS"], style: { bg: "#71432a", text: "#feeac0", muted: "#bb927c", accent: "#feeac0", sectionTitleColor: "#feeac0", itemColor: "#feeac0", sectionTitleSize: 28, itemFont: "inter", priceSuffix: "", logoFont: "serif", headingFont: "oswald" },
    items: [
      { name: "NACHOS", desc: "Corn chips, melted cheese, salsa, jalapeños", price: 7.5, priceLabel: "7.50" },
      { name: "LOADED FRIES", desc: "Crispy fries, cheese sauce, bacon bits", price: 6.9, priceLabel: "6.90" },
      { name: "CHICKEN WINGS", desc: "Crispy wings with BBQ or spicy sauce", price: 8.5, priceLabel: "8.50" },
      { name: "ONION RINGS", desc: "Golden-fried onion rings with dip", price: 5.5, priceLabel: "5.50" },
      { name: "GARLIC BREAD", desc: "Toasted bread with garlic butter", price: 4.9, priceLabel: "4.90" },
      { name: "MOZZARELLA STICKS", desc: "Fried mozzarella with marinara sauce", price: 6.5, priceLabel: "6.50" },
      { name: "CHICKEN TENDERS", desc: "Breaded chicken strips with house dip", price: 7.9, priceLabel: "7.90" },
      { name: "PRETZEL", desc: "Warm salted pretzel with mustard", price: 4.7, priceLabel: "4.70" },
    ] },
  { id: "gastro-pub", name: "Gastropub", category: "Mekan Türü", logo: "The Golden Fork", tagline: "GASTRO PUB", emoji: "🍽️", logoImage: "https://zxhnxmpqpqthesbaxtfh.supabase.co/storage/v1/object/public/menu-logos/13849a1e-caba-4a7d-9cc3-0a53d36e6ce2-1766159684872.png", logoHeight: 62, menuTheme: "mavi", menuTemplate: "liste", menuRadius: 6, showProductImages: true, sectionTitles: ["Main", "Sides", "Deserts"], sectionCounts: [6, 4, 2], style: { bg: "#0a1729", text: "#ffffff", muted: "#626c7a", accent: "#cc9e61", sectionTitleColor: "#cc9e61", itemColor: "#ffffff", sectionTitleSize: 32, itemFont: "inter", priceSuffix: "", logoFont: "serif", headingFont: "playfair", logoUpper: true },
    items: [
      { name: "Gastro Burger", desc: "Aged beef, cheddar, brioche, fries", price: 15.9, priceLabel: "15.90", image: "https://zxhnxmpqpqthesbaxtfh.supabase.co/storage/v1/object/public/product-images/13849a1e-caba-4a7d-9cc3-0a53d36e6ce2/1766159285990.webp" },
      { name: "Beer-Battered Fish & Chips", desc: "Tartar sauce, lemon", price: 16.5, priceLabel: "16.50", image: "https://zxhnxmpqpqthesbaxtfh.supabase.co/storage/v1/object/public/product-images/13849a1e-caba-4a7d-9cc3-0a53d36e6ce2/1766159292530.webp" },
      { name: "Steak & Fries", desc: "Grilled sirloin, pepper sauce", price: 22, priceLabel: "22.00", image: "https://zxhnxmpqpqthesbaxtfh.supabase.co/storage/v1/object/public/product-images/13849a1e-caba-4a7d-9cc3-0a53d36e6ce2/1766159474400.webp" },
      { name: "Herb-Roasted Chicken", desc: "Seasonal vegetables, jus", price: 17.5, priceLabel: "17.50", image: "https://zxhnxmpqpqthesbaxtfh.supabase.co/storage/v1/object/public/product-images/13849a1e-caba-4a7d-9cc3-0a53d36e6ce2/1766159602858.webp" },
      { name: "Mushroom Risotto", desc: "Parmesan, truffle oil", price: 14.9, priceLabel: "14.90", image: "https://zxhnxmpqpqthesbaxtfh.supabase.co/storage/v1/object/public/product-images/13849a1e-caba-4a7d-9cc3-0a53d36e6ce2/1766159708573.webp" },
      { name: "Triple-Cooked Fries", price: 4.5, priceLabel: "4.50" },
      { name: "Truffle Fries", price: 5.9, priceLabel: "5.90" },
      { name: "Seasonal Greens", price: 4.9, priceLabel: "4.90" },
      { name: "House Slaw", price: 3.9, priceLabel: "3.90" },
      { name: "Sticky Toffee Pudding", desc: "Vanilla ice cream", price: 7.5, priceLabel: "7.50" },
      { name: "Chocolate Fondant", desc: "Molten center", price: 7.9, priceLabel: "7.90" },
    ] },
  { id: "nargile", name: "Nargile Lounge", category: "Mekan Türü", logo: "Shisha", tagline: "PREMIUM LOUNGE", emoji: "💨", logoImage: "https://zxhnxmpqpqthesbaxtfh.supabase.co/storage/v1/object/public/menu-logos/216f812b-e4cf-460b-b970-7631bb1277b6-1766324445474.png", logoHeight: 120, menuTheme: "grafit", menuTemplate: "liste", menuRadius: 4, showProductImages: true, sectionTitles: ["Flavors"], style: { bg: "#000000", text: "#fffafa", muted: "#666666", accent: "#ffffff", sectionTitleColor: "#ffffff", itemColor: "#fffafa", sectionTitleSize: 28, itemFont: "inter", logoFont: "badge", headingFont: "playfair", logoUpper: true },
    items: [
      { name: "Mint", desc: "Cool and refreshing", price: 20, priceLabel: "20", image: "https://zxhnxmpqpqthesbaxtfh.supabase.co/storage/v1/object/public/product-images/216f812b-e4cf-460b-b970-7631bb1277b6/1766324653548.webp" },
      { name: "Double Apple", desc: "Sweet with anise notes", price: 20, priceLabel: "20", image: "https://zxhnxmpqpqthesbaxtfh.supabase.co/storage/v1/object/public/product-images/216f812b-e4cf-460b-b970-7631bb1277b6/1766324920251.webp" },
      { name: "Grape", desc: "Smooth and fruity", price: 20, priceLabel: "20", image: "https://zxhnxmpqpqthesbaxtfh.supabase.co/storage/v1/object/public/product-images/216f812b-e4cf-460b-b970-7631bb1277b6/1766324983350.webp" },
      { name: "Lemon", desc: "Light and citrusy", price: 20, priceLabel: "20", image: "https://zxhnxmpqpqthesbaxtfh.supabase.co/storage/v1/object/public/product-images/216f812b-e4cf-460b-b970-7631bb1277b6/1766325052012.webp" },
      { name: "Watermelon", desc: "Fresh and sweet", price: 20, priceLabel: "20", image: "https://zxhnxmpqpqthesbaxtfh.supabase.co/storage/v1/object/public/product-images/216f812b-e4cf-460b-b970-7631bb1277b6/1766325128455.webp" },
      { name: "Blueberry Mint", desc: "Sweet with a cooling finish", price: 20, priceLabel: "20", image: "https://zxhnxmpqpqthesbaxtfh.supabase.co/storage/v1/object/public/product-images/216f812b-e4cf-460b-b970-7631bb1277b6/1766326167423.webp" },
    ] },
  { id: "firin", name: "Fırın & Pastane", category: "Mekan Türü", logo: "The Daily Dough", tagline: "FRESH BAKERY", emoji: "🥐", logoImage: "https://zxhnxmpqpqthesbaxtfh.supabase.co/storage/v1/object/public/menu-logos/79f74468-54ba-47cd-a79c-35ef581acce8-1766165617720.png", logoHeight: 122, menuTheme: "mor", menuTemplate: "liste", menuRadius: 12, showProductImages: true, sectionTitles: ["BREAD", "VIENNOISERIE", "SPREADS", "EXTRA"], sectionCounts: [2, 3, 2, 2], style: { bg: "#ffffff", text: "#000000", muted: "#666666", accent: "#998bcc", sectionTitleColor: "#000000", itemColor: "#998bcc", sectionTitleSize: 28, itemFont: "inter", logoFont: "serif", headingFont: "playfair" },
    items: [
      { name: "The Daily Quack", desc: "Sourdough loaf. Always good.", price: 10, priceLabel: "10", image: "https://zxhnxmpqpqthesbaxtfh.supabase.co/storage/v1/object/public/product-images/79f74468-54ba-47cd-a79c-35ef581acce8/1766165700019.webp" },
      { name: "Baguette Officiel", desc: "Classic baguette. No debate.", price: 8, priceLabel: "8", image: "https://zxhnxmpqpqthesbaxtfh.supabase.co/storage/v1/object/public/product-images/79f74468-54ba-47cd-a79c-35ef581acce8/1766166090290.webp" },
      { name: "Butter Baby", desc: "Croissant. Extra butter. No regrets.", price: 3, priceLabel: "3", image: "https://zxhnxmpqpqthesbaxtfh.supabase.co/storage/v1/object/public/product-images/79f74468-54ba-47cd-a79c-35ef581acce8/1766166165783.webp" },
      { name: "Flaky Business", desc: "Pain au chocolat. Serious layers.", price: 3, priceLabel: "3", image: "https://zxhnxmpqpqthesbaxtfh.supabase.co/storage/v1/object/public/product-images/79f74468-54ba-47cd-a79c-35ef581acce8/1766166388552.webp" },
      { name: "Duck Roll", desc: "Swirled pastry. Sweet, messy, gone fast.", price: 4, priceLabel: "4", image: "https://zxhnxmpqpqthesbaxtfh.supabase.co/storage/v1/object/public/product-images/79f74468-54ba-47cd-a79c-35ef581acce8/1766166508481.webp" },
      { name: "Butter, Obviously", desc: "Salted. The good one.", price: 1, priceLabel: "1" },
      { name: "Jam Session", desc: "House jam. Changes with the weather.", price: 2, priceLabel: "2" },
      { name: "Café Oui", desc: "Strong coffee. Says yes to everything.", price: 2, priceLabel: "2" },
      { name: "Milk & Chaos", desc: "Hot chocolate. Very comforting.", price: 2, priceLabel: "2" },
    ] },
  { id: "dondurma", name: "Dondurma & Sorbet", category: "Mekan Türü", logo: "Melto", tagline: "GELATO & SORBET", emoji: "🍨", logoImage: "https://zxhnxmpqpqthesbaxtfh.supabase.co/storage/v1/object/public/menu-logos/3a40c1fd-2f9a-48ab-af58-d745a9a6ba74-1766056104873.png", logoHeight: 112, menuTheme: "mavi", menuTemplate: "kart", menuRadius: 20, showProductImages: true, sectionTitles: ["CLASSIC", "SIGNATURE"], style: { bg: "#26368b", text: "#ffffff", muted: "#ffffff", accent: "#ffffff", sectionTitleColor: "#ffffff", itemColor: "#ffffff", sectionTitleSize: 20, logoFont: "script", headingFont: "inter" },
    items: [
      { name: "Vanilla", desc: "Creamy Madagascar vanilla", price: 3, image: "https://zxhnxmpqpqthesbaxtfh.supabase.co/storage/v1/object/public/product-images/3a40c1fd-2f9a-48ab-af58-d745a9a6ba74/1766056234915.webp" },
      { name: "Chocolate", desc: "Rich cocoa with fudge swirls", price: 3, image: "https://zxhnxmpqpqthesbaxtfh.supabase.co/storage/v1/object/public/product-images/3a40c1fd-2f9a-48ab-af58-d745a9a6ba74/1766056613869.webp" },
      { name: "Strawberry", desc: "Made with real strawberries", price: 3, image: "https://zxhnxmpqpqthesbaxtfh.supabase.co/storage/v1/object/public/product-images/3a40c1fd-2f9a-48ab-af58-d745a9a6ba74/1766056698775.webp" },
      { name: "Salted Caramel", desc: "Sweet caramel with sea salt", price: 4, image: "https://zxhnxmpqpqthesbaxtfh.supabase.co/storage/v1/object/public/product-images/3a40c1fd-2f9a-48ab-af58-d745a9a6ba74/1766056757045.webp" },
      { name: "Pistachio", desc: "Roasted pistachio ice cream", price: 4, image: "https://zxhnxmpqpqthesbaxtfh.supabase.co/storage/v1/object/public/product-images/3a40c1fd-2f9a-48ab-af58-d745a9a6ba74/1766056865951.webp" },
      { name: "Mango Sorbet", desc: "Dairy-free, refreshing", price: 4, image: "https://zxhnxmpqpqthesbaxtfh.supabase.co/storage/v1/object/public/product-images/3a40c1fd-2f9a-48ab-af58-d745a9a6ba74/1766056955798.webp" },
      { name: "Lemon Sorbet", desc: "Light and zesty", price: 4, image: "https://zxhnxmpqpqthesbaxtfh.supabase.co/storage/v1/object/public/product-images/3a40c1fd-2f9a-48ab-af58-d745a9a6ba74/1766057075666.webp" },
    ] },
  { id: "dondurma-kamyonu", name: "Dondurma Kamyonu", category: "Mekan Türü", logo: "Ice Cream Truck", tagline: "SOFT SERVE", emoji: "🍦", logoImage: "https://zxhnxmpqpqthesbaxtfh.supabase.co/storage/v1/object/public/menu-logos/2dc52594-5d9e-4368-8b8d-273c71a8fcb7-1766067972230.png", logoHeight: 144, menuTheme: "kirmizi", menuTemplate: "kart", menuRadius: 24, showProductImages: true, sectionTitles: ["ICE CREAM"], style: { bg: "#fff4cc", text: "#000000", muted: "#000000", accent: "#F43137", sectionTitleColor: "#F43137", itemColor: "#000000", sectionTitleSize: 25, logoFont: "round", headingFont: "manrope" },
    items: [
      { name: "Vanilla", desc: "Smooth and creamy with a rich vanilla aroma", price: 4, image: "https://zxhnxmpqpqthesbaxtfh.supabase.co/storage/v1/object/public/product-images/2dc52594-5d9e-4368-8b8d-273c71a8fcb7/1766068558746.webp" },
      { name: "Chocolate", desc: "Deep cocoa flavor, rich and indulgent", price: 4, image: "https://zxhnxmpqpqthesbaxtfh.supabase.co/storage/v1/object/public/product-images/2dc52594-5d9e-4368-8b8d-273c71a8fcb7/1766068664543.webp" },
      { name: "Strawberry", desc: "Sweet and fruity with real strawberry notes", price: 4, image: "https://zxhnxmpqpqthesbaxtfh.supabase.co/storage/v1/object/public/product-images/2dc52594-5d9e-4368-8b8d-273c71a8fcb7/1766068804589.webp" },
      { name: "Pistachio", desc: "Nutty, smooth, and lightly roasted", price: 4, image: "https://zxhnxmpqpqthesbaxtfh.supabase.co/storage/v1/object/public/product-images/2dc52594-5d9e-4368-8b8d-273c71a8fcb7/1766068933092.webp" },
      { name: "Coffee", desc: "Bold espresso flavor with a creamy finish", price: 4, image: "https://zxhnxmpqpqthesbaxtfh.supabase.co/storage/v1/object/public/product-images/2dc52594-5d9e-4368-8b8d-273c71a8fcb7/1766069350606.webp" },
    ] },
  { id: "su-barı", name: "Su Barı & Sıkma Meyve", category: "Mekan Türü", logo: "Juice Bar", tagline: "FRESH · PRESSED · DAILY", emoji: "🍊", logoImage: "https://zxhnxmpqpqthesbaxtfh.supabase.co/storage/v1/object/public/menu-logos/dc5533b8-6caf-4ad7-ad1a-e62891071194-1790947228666.png", logoHeight: 140, menuTheme: "yesil", menuTemplate: "liste", menuRadius: 8, showProductImages: false, sectionTitles: ["Cold-pressed juices", "Smoothies", "Smoothie bowls", "Shots & boosters", "Add-ons"], sectionCounts: [4, 4, 2, 3, 3], style: { bg: "#f4f7ea", text: "#1c2a17", muted: "#5f6e57", accent: "#1f6b35", sectionTitleColor: "#1f6b35", itemColor: "#1c2a17", sectionTitleSize: 28, itemFont: "poppins", priceSuffix: "", logoFont: "condensed", headingFont: "poppins", logoUpper: true },
    items: [
      { name: "Green Glow", desc: "Kale, spinach, cucumber, celery, green apple, lemon.", price: 7.5, priceLabel: "7.5" },
      { name: "Sunrise", desc: "Orange, carrot, ginger, turmeric.", price: 7, priceLabel: "7" },
      { name: "Beet It", desc: "Beetroot, apple, carrot, lemon, ginger.", price: 7, priceLabel: "7" },
      { name: "Watermelon Mint", desc: "Watermelon, lime, fresh mint.", price: 6.5, priceLabel: "6.5" },
      { name: "Berry Blast", desc: "Strawberry, blueberry, banana, oat milk.", price: 8, priceLabel: "8" },
      { name: "Tropical", desc: "Mango, pineapple, passion fruit, coconut water.", price: 8, priceLabel: "8" },
      { name: "Peanut Power", desc: "Banana, peanut butter, dates, cacao, almond milk.", price: 8.5, priceLabel: "8.5" },
      { name: "Green Machine", desc: "Spinach, avocado, banana, mango, apple juice.", price: 8.5, priceLabel: "8.5" },
      { name: "Açaí Bowl", desc: "Açaí, banana, berries, granola, coconut, honey.", price: 11, priceLabel: "11" },
      { name: "Pitaya Bowl", desc: "Dragon fruit, mango, kiwi, chia seeds, granola.", price: 11, priceLabel: "11" },
      { name: "Ginger Shot", desc: "Fresh ginger, lemon, a pinch of cayenne.", price: 3.5, priceLabel: "3.5" },
      { name: "Turmeric Shot", desc: "Turmeric, orange, black pepper.", price: 3.5, priceLabel: "3.5" },
      { name: "Wheatgrass Shot", desc: "Freshly juiced wheatgrass.", price: 4, priceLabel: "4" },
      { name: "Protein", desc: "Plant-based vanilla protein.", price: 1.5, priceLabel: "1.5" },
      { name: "Chia or flax seeds", desc: "Add to any smoothie.", price: 1, priceLabel: "1" },
      { name: "Spirulina", desc: "A spoonful of green goodness.", price: 1.5, priceLabel: "1.5" },
    ] },
  { id: "otel", name: "Otel & Resort", category: "Mekan Türü", logo: "Ardena", tagline: "HOTEL & SUITES", emoji: "🏨", logoImage: "https://zxhnxmpqpqthesbaxtfh.supabase.co/storage/v1/object/public/menu-logos/35db3f8d-aba3-42d2-b4fc-69ad6feec18a-1790949189966.png", logoHeight: 130, menuTheme: "mavi", menuTemplate: "liste", menuRadius: 4, showProductImages: false, sectionTitles: ["Breakfast", "All-day dining", "Light bites", "Desserts", "Drinks"], sectionCounts: [4, 5, 3, 2, 4], style: { bg: "#f8f5ef", text: "#1d2b4a", muted: "#6b6457", accent: "#1d2b4a", sectionTitleColor: "#1d2b4a", itemColor: "#1d2b4a", sectionTitleSize: 28, itemFont: "lora", priceSuffix: "", logoFont: "serif", headingFont: "playfair", logoUpper: true },
    items: [
      { name: "Continental Breakfast", desc: "Croissant, pain au chocolat, toast, butter and jam, fresh fruit, yogurt, juice and coffee or tea. Served 6:30–11:00.", price: 24, priceLabel: "24" },
      { name: "Full English", desc: "Two eggs any style, bacon, sausage, mushrooms, tomato, beans and toast.", price: 26, priceLabel: "26" },
      { name: "Eggs Benedict", desc: "Poached eggs, ham, hollandaise on a toasted English muffin.", price: 19, priceLabel: "19" },
      { name: "Avocado Toast", desc: "Sourdough, smashed avocado, poached egg, chili flakes.", price: 17, priceLabel: "17" },
      { name: "Club Sandwich", desc: "Chicken, bacon, egg, lettuce, tomato, mayonnaise. Served with fries.", price: 22, priceLabel: "22" },
      { name: "Classic Burger", desc: "Beef patty, cheddar, pickles, house sauce, brioche bun, fries.", price: 24, priceLabel: "24" },
      { name: "Caesar Salad", desc: "Romaine, parmesan, croutons, anchovy dressing. Add chicken +6.", price: 18, priceLabel: "18" },
      { name: "Grilled Salmon", desc: "Salmon fillet, seasonal greens, new potatoes, lemon butter.", price: 32, priceLabel: "32" },
      { name: "Penne Pomodoro", desc: "Tomato sauce, basil, parmesan. Vegetarian.", price: 19, priceLabel: "19" },
      { name: "Soup of the Day", desc: "Ask your in-room dining team, served with bread.", price: 12, priceLabel: "12" },
      { name: "Cheese Plate", desc: "Selection of three cheeses, crackers, chutney.", price: 18, priceLabel: "18" },
      { name: "Fries", desc: "With ketchup and mayonnaise.", price: 8, priceLabel: "8" },
      { name: "Chocolate Fondant", desc: "Warm chocolate cake, vanilla ice cream.", price: 12, priceLabel: "12" },
      { name: "Seasonal Fruit Plate", desc: "Freshly cut fruit.", price: 11, priceLabel: "11" },
      { name: "Coffee or Tea", desc: "Espresso, cappuccino, latte or a selection of teas.", price: 6, priceLabel: "6" },
      { name: "Fresh Orange Juice", desc: "Freshly squeezed.", price: 8, priceLabel: "8" },
      { name: "House Wine", desc: "Red or white, glass / bottle.", price: 12, priceLabel: "12 / 48" },
      { name: "Champagne", desc: "Glass / bottle.", price: 22, priceLabel: "22 / 110" },
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
  { id: "catering", name: "Catering & Davet", category: "Modern", logo: "Le Petite Paris", tagline: "TRAITEUR", emoji: "🥘", logoImage: "https://zxhnxmpqpqthesbaxtfh.supabase.co/storage/v1/object/public/menu-logos/33340ace-4747-4b10-9274-c587ff6735f2-1766075194009.png", logoHeight: 100, menuTheme: "yesil", menuTemplate: "liste", menuRadius: 4, showProductImages: true, sectionTitles: ["MAIN", "SIDES"], sectionCounts: [4, 4], style: { bg: "#0d2b2a", text: "#FBF0DA", muted: "#FBF0DA99", accent: "#eecb88", sectionTitleColor: "#eecb88", itemColor: "#FBF0DA", sectionTitleSize: 28, itemFont: "inter", priceSuffix: "", priceDecimals: true, logoFont: "script", headingFont: "playfair", logoItalic: true },
    items: [
      { name: "Coq au Vin", desc: "Chicken braised in red wine", price: 14.9, image: "https://zxhnxmpqpqthesbaxtfh.supabase.co/storage/v1/object/public/product-images/33340ace-4747-4b10-9274-c587ff6735f2/1766074794154.webp" },
      { name: "Beef Bourguignon", desc: "Slow-cooked beef, mushrooms", price: 16.9, image: "https://zxhnxmpqpqthesbaxtfh.supabase.co/storage/v1/object/public/product-images/33340ace-4747-4b10-9274-c587ff6735f2/1766074862342.webp" },
      { name: "Herb-Roasted Chicken", desc: "Garlic and thyme", price: 13.5, image: "https://zxhnxmpqpqthesbaxtfh.supabase.co/storage/v1/object/public/product-images/33340ace-4747-4b10-9274-c587ff6735f2/1766075065275.webp" },
      { name: "Vegetable Ratatouille", desc: "Provençal-style vegetables", price: 11.9, image: "https://zxhnxmpqpqthesbaxtfh.supabase.co/storage/v1/object/public/product-images/33340ace-4747-4b10-9274-c587ff6735f2/1766075089713.webp" },
      { name: "Gratin Dauphinois", desc: "Creamy potato gratin", price: 4.9 },
      { name: "Green Beans Amandine", desc: "Almond butter", price: 4.5 },
      { name: "Mixed Green Salad", desc: "French vinaigrette", price: 4.2 },
      { name: "Fresh Baguettes", desc: "Butter included", price: 2.5 },
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
  bebas: '"Bebas Neue", "Arial Narrow", sans-serif',
  manrope: '"Manrope", system-ui, sans-serif',
  inter: '"Inter", system-ui, sans-serif',
  poppins: '"Poppins", system-ui, sans-serif',
  lora: '"Lora", Georgia, serif',
  playfair: '"Playfair Display", Georgia, serif',
  oswald: '"Oswald", "Arial Narrow", sans-serif',
};
