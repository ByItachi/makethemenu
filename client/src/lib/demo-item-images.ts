/**
 * Şablon demo menülerindeki örnek ürünlerin fotoğrafları.
 * /sablon-demo/:slug sayfası, gerçek menüdeki ürün görselleri gibi görünmesi
 * için ürün adına ve şablon kategorisine göre fotoğraf seçer.
 */

const K = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=240&q=70`;

/** Ürün adına göre fotoğraf (anahtar kelimeler). */
const BY_KEYWORD: [RegExp, string][] = [
  [/burger|hamburger/i, K("photo-1568901346375-23c9450c58cd")],
  [/pizza/i, K("photo-1513104890138-7c749659a591")],
  [/sushi|nigiri|sashimi|maki/i, K("photo-1579871494447-9811cf80d66c")],
  [/ramen|noodle|eriste|erişte|makarna|spaghetti|penne|pasta|lasan/i, K("photo-1621996346565-e3dbc646d9a9")],
  [/köfte|kofte|izgara|steak|biftek|bbq|barbek|kaburga|et/i, K("photo-1544025162-d76694265947")],
  [/kebap|döner|doner|şiş|sis|tavuk|chicken|kanat/i, K("photo-1562967914-608f82629710")],
  [/salata|salad|vegan|vejetal|sebze|falafel/i, K("photo-1512621776951-a57141f2eefd")],
  [/tatlı|tatli|dessert|pasta|cheesecake|chocolate|çikolat|baklava|sufle|mousse/i, K("photo-1551024506-0bccd828d307")],
  [/dondurma|ice.?cream|gelato|sundae/i, K("photo-1497034825429-c343d7c6a68f")],
  [/kahve|coffee|espresso|latte|cappuccino|mocha/i, K("photo-1495474472287-4d71bcdd2085")],
  [/kokteyl|cocktail|mojito|margarita/i, K("photo-1536935338788-846bb9981813")],
  [/şarap|sarap|wine|rose|beyaz şarap/i, K("photo-1510812431401-41d2bd2722f3")],
  [/bira|beer|ipa|lager|pint/i, K("photo-1535958636474-b021ee887b13")],
  [/kahvaltı|kahvalti|breakfast|omelet|menemen|pankek|pancake/i, K("photo-1533089860892-a7c6f0a88666")],
  [/taco|burrito|meksik|mexic/i, K("photo-1551504734-5ee1c4a1479b")],
  [/ekmek|bread|simit|kruvasan|croissant|fırın|firin|poc|lahmacun|pide/i, K("photo-1509440159596-0249088772ff")],
  [/balık|balik|fish|somon|salmon|karides|shrimp|deniz/i, K("photo-1467003909585-2f8a72700288")],
  [/curry|hint|indian|masala|tandoori/i, K("photo-1585937421612-70a008356fbe")],
  [/thai|tay|pad.?thai/i, K("photo-1559847844-5315695dadae")],
  [/meyve|fruit|smoothie|detoks/i, K("photo-1553530666-ba11a7da3888")],
  [/portakal|orange|elma|apple|limon|lemon|soda|gazoz/i, K("photo-1600271886742-f049cd451bba")],
  [/çay|cay|tea|ıhlamur/i, K("photo-1556881286-fc6915169721")],
  [/su|water|maden/i, K("photo-1548839140-29a749e1cf4d")],
  [/nargile|shisha|hookah/i, K("photo-1615478503562-ec2d8aa0e24e")],
  [/waffle|krep|crepe/i, K("photo-1562376552-0d160a2f238d")],
  [/çorba|corba|soup|güveç|guvec|stew/i, K("photo-1547592166-23ac45744acd")],
  [/pilav|rice|risotto|plov/i, K("photo-1516684732162-798a0062be99")],
  [/dumpling|gyoza|bao|mantı|manti|jiaozi/i, K("photo-1563245372-f21724e3856d")],
  [/sandviç|sandvic|sandwich|toast|panini|tost/i, K("photo-1553909489-cd47e0907980")],
  [/kumpir|patates|fries|kızartma|kizartma|nugget/i, K("photo-1573080496219-bb080dd4f877")],
  [/humus|hummus|mezze|meze|dip/i, K("photo-1541745537411-b8046dc6d66c")],
  [/hamsi|levrek|çipura|cipura|mezgit/i, K("photo-1580476262798-bddd9f4b7369")],
  [/sütlaç|sutlac|pudding|kadayıf|kup/i, K("photo-1488477181946-6428a0291777")],
  [/praline|bonbon|truff/i, K("photo-1549007994-cb92caebd54b")],
];

/** Kategoriye göre yedek havuz (anahtar kelime eşleşmezse). */
const POOL: Record<string, string[]> = {
  "Mutfağa Özel": [K("photo-1504674900247-0877df9cc836"), K("photo-1540189549336-e6e99c3679fe"), K("photo-1476224203421-9ac39bcb3327")],
  "Mekan Türü": [K("photo-1414235077428-338989a2e8c0"), K("photo-1552566626-52f8b828add9"), K("photo-1517248135467-4c7edcad34c4")],
  "Yemek & İçecek": [K("photo-1493770348161-369560ae357d"), K("photo-1476224203421-9ac39bcb3327"), K("photo-1467003909585-2f8a72700288")],
  "Özel Gün": [K("photo-1530103862676-de8c9debad1d"), K("photo-1555244162-803834f70033"), K("photo-1464366400600-7168b8af9bc3")],
  "Modern": [K("photo-1490645935967-10de6ba17061"), K("photo-1455619452474-d2be8b1e70cd"), K("photo-1414235077428-338989a2e8c0")],
};

const FALLBACK = POOL["Mutfağa Özel"];

/** Ürün adı + şablon kategorisinden deterministik fotoğraf URL'i döndürür. */
export function demoItemImage(name: string, category: string, seed = 0): string {
  for (const [re, url] of BY_KEYWORD) if (re.test(name)) return url;
  const pool = POOL[category] ?? FALLBACK;
  let h = seed;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return pool[h % pool.length];
}
