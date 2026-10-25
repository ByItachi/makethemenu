/**
 * Bilgi Merkezi içerik kaynağı.
 * Blog'un blog-posts.ts kalıbını izler: içerik tek yerde tutulur, sayfalar
 * bu kaynaktan filtreleyip arar. Arama sonuçları yalnızca bu veriden gelir.
 */

export interface KbSection {
  heading: string;
  paragraphs: string[];
  list?: string[];
}

export interface KbArticle {
  slug: string;
  title: string;
  description: string;
  /** kbCategories içindeki bir kategori kimliği */
  category: string;
  tags: string[];
  updated: string;
  sections: KbSection[];
}

export interface KbCategory {
  id: string;
  name: string;
  description: string;
}

export const kbCategories: KbCategory[] = [
  {
    id: "baslangic",
    name: "Başlangıç",
    description: "Kurulum, ilk adımlar ve temel yapılandırma.",
  },
  {
    id: "menu-ve-yayin",
    name: "Menü ve Yayınlama",
    description: "Kategoriler, ürünler, QR menü, siparişler ve alan adları.",
  },
  {
    id: "entegrasyonlar",
    name: "Entegrasyonlar",
    description: "Ödeme, yazıcı ve üçüncü parti bağlantılar.",
  },
  {
    id: "guvenlik",
    name: "Güvenlik",
    description: "Yetkilendirme, oturum ve erişim kontrolleri.",
  },
  {
    id: "faturalama",
    name: "Abonelik ve Faturalama",
    description: "Planlar, limitler ve ödeme işlemleri.",
  },
];

export const kbArticles: KbArticle[] = [
  {
    slug: "hizli-baslangic",
    title: "Hızlı Başlangıç: İlk Menünüzü Oluşturun",
    description:
      "Kayıt sonrası işletmenizi oluşturun, şablon seçin ve ilk dijital menünüzü dakikalar içinde hazır hale getirin.",
    category: "baslangic",
    tags: ["kayıt", "kurulum", "şablon", "ilk adımlar", "işletme"],
    updated: "12 Mart 2026",
    sections: [
      {
        heading: "1. İşletme hesabı oluşturun",
        paragraphs: [
          "Kayıt olduğunuzda işletme adınızdan otomatik bir menü adresi (slug) üretilir ve hesabınız Owner rolüyle tanımlanır. E-posta adresinizi doğruladıktan sonra menünüzü yayına alabilirsiniz.",
        ],
      },
      {
        heading: "2. Şablon seçin",
        paragraphs: [
          "Şablon oluşturucu; açıklamanızdan ve logonuzdan renk paleti önerir, yapay zekâ ile taslak menü üretir. Taslağı beğenmezseniz aynı ekranda düzenleyip uygulayabilirsiniz.",
        ],
      },
      {
        heading: "3. Yayına alın ve QR'ı basın",
        paragraphs: [
          "Menü adresinizi belirleyip yayına aldıktan sonra QR kodunuz hazır olur. QR kodu masa bazlı da oluşturabilirsiniz; böylece hangi masadan tarama yapıldığını raporlarda görürsünüz.",
        ],
        list: [
          "Panelden menü adresi (slug) belirleyin.",
          "Menüyü yayımlayın — QR kodu ancak yayımlanmış menü için üretilir.",
          "QR Kodları sayfasından SVG veya PNG olarak indirin.",
        ],
      },
    ],
  },
  {
    slug: "qr-menu-yayina-alma",
    title: "QR Menü Nasıl Yayına Alınır?",
    description:
      "Menü adresi belirleme, yayımlama koşulları ve QR kod üretiminin adım adım anlatımı.",
    category: "menu-ve-yayin",
    tags: ["qr", "menü adresi", "slug", "yayınlama", "yayına alma"],
    updated: "2 Nisan 2026",
    sections: [
      {
        heading: "Koşullar",
        paragraphs: [
          "QR kod yalnızca yayımlanmış bir menü için üretilir. Yayımlamadan önce menü adresinizi (örneğin /p/kahve-duragi) seçmiş olmanız ve e-posta doğrulamanızın tamamlanmış olması gerekir.",
        ],
        list: [
          "Menü adresi boşluksuz, küçük harf ve tire içerebilir.",
          "Adresi daha önce başka bir işletme aldıysa alternatif deneyin.",
          "Adresi değiştirirseniz eski adresiniz otomatik olarak yeni adrese yönlendirilir.",
        ],
      },
      {
        heading: "Masa bazlı QR kodlar",
        paragraphs: [
          "QR indirirken masa adı vererek (örneğin ?table=Masa%201) her masaya özel kod üretebilirsiniz. Tarama istatistikleri masa kırılımında raporlanır; misafir doğru masaya oturan kodu okutunca analitikte qr_scan olayı o masa için sayılır.",
        ],
      },
      {
        heading: "Sık karşılaşılan sorunlar",
        paragraphs: [
          "QR sayfası 'Önce menüyü yayımlayın' diyorsa menü hâlâ taslak demektir. 'Önce bir menü adresi belirleyin' diyorsa işletme ayarlarından slug alanını doldurun.",
        ],
      },
    ],
  },
  {
    slug: "kategori-ve-urun-ekleme",
    title: "Kategori ve Ürün Ekleme",
    description:
      "Menü kategorileri oluşturun, ürün ekleyin, sürükle-bırak ile sıralayın ve 3D ürün görünümü ekleyin.",
    category: "menu-ve-yayin",
    tags: ["kategori", "ürün", "sıralama", "3d", "fiyat"],
    updated: "18 Şubat 2026",
    sections: [
      {
        heading: "Kategori oluşturun",
        paragraphs: [
          "Her kategorinin bir adı ve otomatik üretilen bir adresi (slug) vardır. Kategorileri sürükleyerek sıralayabilirsiniz; sıralama doğrudan QR menüye yansır.",
        ],
      },
      {
        heading: "Ürün ekleyin",
        paragraphs: [
          "Ürünlerde fiyat, açıklama, görsel ve kategori alanları bulunur. Fiyat ondalıklı girilir (örneğin 49.90). Ürünü geçici olarak kaldırmak istiyorsanız silmek yerine 'Satışta değil' işaretini kullanın.",
        ],
        list: [
          "Ürün görselleri webp/jpeg/png olabilir.",
          "3D model bağlantısı http(s) üzerinden .glb veya .gltf dosyası olmalıdır.",
          "3D model kotası planınıza göre değişir; kotayı Kullanım sayfasından izleyin.",
        ],
      },
      {
        heading: "Plan limitleri",
        paragraphs: [
          "Ürün ve kategori sayısı plan limitine tabidir. Limite ulaştıysanız ürün eklemek yerine pasif ürünleri temizleyin veya planınızı yükseltin.",
        ],
      },
    ],
  },
  {
    slug: "masa-ve-siparis-yonetimi",
    title: "Masa ve Sipariş Yönetimi",
    description:
      "Masaları tanımlayın, QR menüden gelen siparişleri durumlarına göre yönetin ve CSV olarak dışa aktarın.",
    category: "menu-ve-yayin",
    tags: ["masa", "sipariş", "adisyon", "csv", "durum"],
    updated: "27 Ocak 2026",
    sections: [
      {
        heading: "Masalar",
        paragraphs: [
          "Masalar panelde tanımlanır ve her masa QR koduyla eşleştirilebilir. Sipariş oluşturulurken masa bağlanabilir; masa bilgisi adisyonda ve raporlarda görünür.",
        ],
      },
      {
        heading: "Sipariş akışı",
        paragraphs: [
          "QR menüden gelen siparişte ürün fiyatları, stok durumu ve toplam tutar sunucuda yeniden hesaplanır; istemciden gelen fiyat bilgisi yok sayılır. Sipariş durumunu panelde güncelleyebilirsiniz.",
        ],
        list: [
          "Sipariş en az bir ürün içermelidir.",
          "Satışta olmayan ürün siparişe eklenemez.",
          "Sipariş geçmişini CSV olarak dışa aktarabilirsiniz.",
        ],
      },
    ],
  },
  {
    slug: "alan-adi-baglama",
    title: "Özel Alan Adı Bağlama",
    description:
      "Kendi alan adınızı (örneğin menu.isletmeniz.com) dijital menünüze bağlayın ve doğrulayın.",
    category: "menu-ve-yayin",
    tags: ["alan adı", "domain", "dns", "özel adres"],
    updated: "9 Nisan 2026",
    sections: [
      {
        heading: "Plan desteği",
        paragraphs: [
          "Özel alan adı, planınıza dahil bir özellikse Alan Adları sayfasından ekleyebilirsiniz. Dahil değilse ekranda plan yükseltme bilgisi görürsünüz.",
        ],
      },
      {
        heading: "Doğrulama adımları",
        paragraphs: [
          "Alan adını eklediğinizde size mtm_ ile başlayan bir doğrulama kodu verilir. Bu kodu DNS sağlayıcınızda TXT kaydı olarak ekleyin ve doğrulamayı başlatın.",
        ],
        list: [
          "Alan adı en az 4 karakter olmalı ve geçerli bir alan adı biçiminde yazılmalıdır.",
          "Aynı alan adı başka bir işletmeye bağlıysa eklenemez.",
          "Doğrulama sonrası menünüz kendi alan adınızda yayına alınır.",
        ],
      },
    ],
  },
  {
    slug: "odeme-saglayicilarini-baglama",
    title: "Ödeme Sağlayıcılarını Bağlama",
    description:
      "Online ödeme sağlayıcınızı yapılandırın, test modunda doğrulayın ve canlıya alın.",
    category: "entegrasyonlar",
    tags: ["ödeme", "abonelik", "checkout", "test modu", "webhook"],
    updated: "21 Mart 2026",
    sections: [
      {
        heading: "Sağlayıcı yapılandırması",
        paragraphs: [
          "Ödeme sağlayıcısı sunucu tarafında ortam değişkenleriyle yapılandırılır. Panel, Faturalandırma sayfasında sağlayıcının bağlı olup olmadığını ve test modunda olup olmadığını gösterir.",
        ],
        list: [
          "Sağlayıcı bağlı değilse ödeme ekranı yerine plan bilgisi gösterilir.",
          "Test modunda ödemeler sağlayıcının test ortamında tamamlanır.",
        ],
      },
      {
        heading: "Webhook imzası",
        paragraphs: [
          "Ödeme sağlayıcısından gelen bildirimler, ham gövde üzerinden HMAC imzasıyla doğrulanır. İmza başlığı x-payment-signature'dır; imzasız veya bozuk istekler işleme alınmaz.",
        ],
      },
      {
        heading: "Abonelik işlemleri",
        paragraphs: [
          "Plan değişikliği, iptal ve devam ettirme işlemleri faturalandırma sayfasından yapılır. Dönem sonunda iptal seçeneğiyle mevcut dönemin sonuna kadar abonelik sürer.",
        ],
      },
    ],
  },
  {
    slug: "yazici-ayarlari",
    title: "Yazıcı Ayarları",
    description:
      "Mutfak ve masa yazıcılarının yapılandırılması, fiş çıktısı ve sık sorunların giderilmesi.",
    category: "entegrasyonlar",
    tags: ["yazıcı", "fiş", "mutfak", "donanım"],
    updated: "14 Şubat 2026",
    sections: [
      {
        heading: "Yazıcı eşleştirme",
        paragraphs: [
          "Adisyon kapanışında fiş çıktısı alınabilmesi için yazıcının işletme cihazıyla aynı ağda olması gerekir. Tarayıcı yazdırma iletişim kutusundan yazıcıyı seçip varsayılan yapabilirsiniz.",
        ],
      },
      {
        heading: "Sık sorunlar",
        paragraphs: [
          "Çıktı gelmiyorsa ağ bağlantısını, yazıcı kuyruğunu ve tarayıcı açılır pencere izinlerini kontrol edin. Mutfak ekranı ayrı bir cihazdaysa o cihazda da oturum açılmış olması gerekir.",
        ],
        list: [
          "Yazıcı kuyruğunda bekleyen iş olup olmadığını kontrol edin.",
          "Açılır pencere engelleyiciyi tarayıcı için devre dışı bırakın.",
          "Ağ değişikliğinden sonra yazıcıyı yeniden eşleştirin.",
        ],
      },
    ],
  },
  {
    slug: "pos-kisayollari",
    title: "POS Kısayolları",
    description: "Kasada hızlı çalışmak için pratik kısayollar ve öneriler.",
    category: "baslangic",
    tags: ["pos", "kasa", "kısayol", "adisyon"],
    updated: "5 Şubat 2026",
    sections: [
      {
        heading: "Günlük kullanım",
        paragraphs: [
          "POS ekranında sık kullandığınız işlemler tek dokunuşla yapılabilir. Adisyon açma, ürün ekleme ve masa aktarımı akışın temel adımlarıdır.",
        ],
        list: [
          "Masa haritasından masaya dokunarak adisyon açın.",
          "Ürün aramasını kullanarak menüde hızlıca gezinin.",
          "Adisyonu kapatırken ödeme tipini seçmeyi unutmayın.",
        ],
      },
      {
        heading: "Klavye ile kullanım",
        paragraphs: [
          "Masaüstünde klavye kısayolları ile menüler arasında gezinebilir, Enter ile seçiminizi onaylayabilir ve Escape ile açık pencereleri kapatabilirsiniz.",
        ],
      },
    ],
  },
  {
    slug: "parola-ve-hesap-guvenligi",
    title: "Parola ve Hesap Güvenliği",
    description:
      "Güçlü parola koşulları, e-posta doğrulama, oturum yönetimi ve parola sıfırlama.",
    category: "guvenlik",
    tags: ["parola", "güvenlik", "oturum", "e-posta doğrulama", "şifre sıfırlama"],
    updated: "30 Mart 2026",
    sections: [
      {
        heading: "Parola koşulları",
        paragraphs: [
          "Parolalar en az 8, en fazla 128 karakterdir ve salted hash olarak saklanır. Girişte art arda hatalı denemelerde hesap 15 dakikalık pencerede geçici olarak korunur; bu süre beklenmeden tekrar denemeler 429 yanıtı döner.",
        ],
      },
      {
        heading: "Oturum yönetimi",
        paragraphs: [
          "Oturumlar HttpOnly çerezle taşınır. Şüpheli bir durumda oturumu kapatmak yeterlidir; parolanızı da sıfırlamanız önerilir. Parola sıfırlama bağlantıları 1 saat geçerlidir ve tek kullanımlıktır.",
        ],
        list: [
          "Kayıt sonrası gelen doğrulama bağlantısı 24 saat geçerlidir.",
          "Doğrulama e-postasını yeniden gönderebilirsiniz.",
          "Menüyü yayımlamak için e-posta doğrulaması zorunludur.",
        ],
      },
    ],
  },
  {
    slug: "yetkilendirme-ve-roller",
    title: "Yetkilendirme ve Roller",
    description:
      "İşletme sahibi, personel ve platform yöneticisi rollerinin yetkileri ile denetim kayıtları.",
    category: "guvenlik",
    tags: ["rol", "yetki", "yönetici", "denetim", "audit"],
    updated: "25 Mart 2026",
    sections: [
      {
        heading: "Roller",
        paragraphs: [
          "Her kullanıcı bir işletmeye bağlıdır. İşletme sahibi kendi işletmesinde tam yetkilidir; işletmeye bağlı olmayan hesap işletme verilerine erişemez. Platform yöneticisi ise tüm işletmeleri yönetebilir.",
        ],
        list: [
          "İşletme verilerine erişim için hesabınıza bağlı bir işletme olmalıdır.",
          "Platform yöneticisi gerekirse işletme adına oturum açabilir (impersonation); bu işlem denetim kaydına yazılır.",
        ],
      },
      {
        heading: "Denetim kaydı",
        paragraphs: [
          "Giriş, çıkış, yayınlama ve eklenti işlemleri gibi önemli adımlar denetim günlüğüne yazılır. Son 50 güvenlik olayını Güvenlik sayfasında görebilirsiniz.",
        ],
      },
    ],
  },
  {
    slug: "plan-ve-limitler",
    title: "Plan ve Limitler",
    description:
      "Planınızın ürün, masa ve 3D model limitlerini görüntüleme ve kullanım takibi.",
    category: "faturalama",
    tags: ["plan", "limit", "kota", "kullanım"],
    updated: "16 Nisan 2026",
    sections: [
      {
        heading: "Kullanım sayfası",
        paragraphs: [
          "Kullanım sayfası planınızın adını, ürün/masa/3D model limitlerini ve anlık kullanımınızı gösterir. Limit dolduğunda ilgili ekranda yükseltme önerisi görürsünüz.",
        ],
      },
      {
        heading: "Limite ulaşıldığında",
        paragraphs: [
          "Ürün veya masa eklemek limit kontrolünden geçer; limit doluysa istek 403 ile reddedilir ve plan yükseltmesi önerilir. 3D model kotası da plan bazlıdır ve zaten bağlı olan modeli yeniden göndermek kota harcamaz.",
        ],
      },
    ],
  },
  {
    slug: "abonelik-islemleri",
    title: "Abonelik İşlemleri",
    description:
      "Plan satın alma, fiyat teklifi, kupon kullanımı, plan değiştirme ve iptal adımları.",
    category: "faturalama",
    tags: ["abonelik", "checkout", "kupon", "iptal", "plan değişikliği"],
    updated: "8 Nisan 2026",
    sections: [
      {
        heading: "Plan satın alma",
        paragraphs: [
          "Fiyat teklifi uç noktası plan kodu, dönem (monthly/yearly) ve isteğe bağlı kupon koduyla indirimli tutarı hesaplar. Ödeme, sağlayıcının ödeme sayfasında tamamlanır.",
        ],
        list: [
          "Tutarlar TRY olarak hesaplanır; indirim ve vergi teklif yanında ayrı gösterilir.",
          "Ödeme oturumu istek-idempotency (Idempotency-Key) başlığıyla tekrarlanabilir.",
        ],
      },
      {
        heading: "İptal ve devam ettirme",
        paragraphs: [
          "Aboneliği dönem sonunda iptale alabilirsiniz; mevcut dönem sonuna kadar erişiminiz sürer. İptali geri almak isterseniz devam ettirme seçeneğini kullanın.",
        ],
      },
    ],
  },
];

export function getKbCategory(id: string): KbCategory | undefined {
  return kbCategories.find((c) => c.id === id);
}

export function getKbArticle(slug: string): KbArticle | undefined {
  return kbArticles.find((a) => a.slug === slug);
}

export function getKbRelated(slug: string, limit = 3): KbArticle[] {
  const article = getKbArticle(slug);
  if (!article) return [];
  return kbArticles.filter((a) => a.slug !== slug && a.category === article.category).slice(0, limit);
}

/** Aramada Türkçe karakterleri esnek eşleştirmek için metni sadeleştirir. */
function fold(s: string): string {
  return s
    .toLocaleLowerCase("tr")
    .replaceAll("ı", "i")
    .replaceAll("İ", "i")
    .replaceAll("ş", "s")
    .replaceAll("ğ", "g")
    .replaceAll("ü", "u")
    .replaceAll("ö", "o")
    .replaceAll("ç", "c")
    .replaceAll("â", "a")
    .trim();
}

export interface KbSearchResult {
  article: KbArticle;
  /** Eşleşmenin nereden geldiği — sonuç listesinde rozet olarak gösterilir. */
  matchedIn: "başlık" | "açıklama" | "kategori" | "etiket" | "içerik";
}

/**
 * Makaleleri başlık, açıklama, kategori ve etiketlerine göre arar.
 * Sonuçlar yalnızca kbArticles verisinden gelir; boş sorguda tüm makaleler döner.
 */
export function searchKbArticles(query: string, categoryId?: string): KbArticle[] {
  const pool = categoryId ? kbArticles.filter((a) => a.category === categoryId) : kbArticles;
  const q = fold(query);
  if (!q) return pool;

  const scored: { article: KbArticle; score: number; matchedIn: KbSearchResult["matchedIn"] }[] = [];
  for (const article of pool) {
    const title = fold(article.title);
    const description = fold(article.description);
    const tags = article.tags.map(fold).join(" ");
    const categoryName = fold(getKbCategory(article.category)?.name ?? "");
    const body = fold(article.sections.map((s) => `${s.heading} ${s.paragraphs.join(" ")} ${(s.list ?? []).join(" ")}`).join(" "));

    let score = 0;
    let matchedIn: KbSearchResult["matchedIn"] = "içerik";
    if (title.includes(q)) {
      score += title.startsWith(q) ? 60 : 40;
      matchedIn = "başlık";
    }
    if (tags.includes(q)) {
      score += 30;
      matchedIn = matchedIn === "başlık" ? matchedIn : "etiket";
    }
    if (categoryName.includes(q)) {
      score += 20;
      matchedIn = matchedIn === "başlık" || matchedIn === "etiket" ? matchedIn : "kategori";
    }
    if (description.includes(q)) {
      score += 15;
      matchedIn = matchedIn === "başlık" || matchedIn === "etiket" || matchedIn === "kategori" ? matchedIn : "açıklama";
    }
    if (body.includes(q)) score += 5;

    if (score > 0) scored.push({ article, score, matchedIn });
  }

  return scored
    .sort((a, b) => b.score - a.score || a.article.title.localeCompare(b.article.title, "tr"))
    .map((s) => s.article);
}
