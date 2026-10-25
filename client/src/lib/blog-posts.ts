export interface BlogPostSection {
  heading: string;
  paragraphs: string[];
  list?: string[];
}

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  /** Görüntülenen yayın tarihi (Türkçe biçim). */
  date: string;
  /** ISO yayın tarihi (YYYY-MM-DD): sitemap lastmod ve Article structured data için. */
  dateISO: string;
  readTime: string;
  image: string;
  sections: BlogPostSection[];
}

export const blogPosts: BlogPost[] = [
  {
    slug: "restoran-yonetiminde-dijital-donusum",
    title: "Restoran Yönetiminde Dijital Dönüşüm",
    description:
      "Geleneksel restoran yönetiminden modern dijital çözümlere geçiş süreci ve avantajları.",
    date: "15 Şubat 2024",
    dateISO: "2024-02-15",
    readTime: "5 dk okuma",
    image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&q=80",
    sections: [
      {
        heading: "Dijital dönüşüm neden artık bir seçenek değil?",
        paragraphs: [
          "Restoran sektöründe müşteri beklentileri hızla değişiyor. QR ile menü okuma, online sipariş, masa rezervasyonu ve temassız ödeme artık müşterilerin 'yeni normal'i haline geldi. Bu beklentileri karşılamayan işletmeler, rekabette geriye düşüyor.",
          "Dijital dönüşüm, yalnızca yeni teknoloji satın almak değil; işletmenin tüm operasyonunu — sipariş alımından mutfağa, stoktan raporlamaya — tek bir merkezden yönetilebilir hale getirmektir.",
        ],
      },
      {
        heading: "Geçiş süreci nasıl planlanmalı?",
        paragraphs: [
          "Başarılı bir geçiş, işletmenin mevcut süreçlerini doğru analiz etmekle başlar. Önce hangi işlemlerin elle yapıldığını, nerede zaman kaybedildiğini ve hangi verilere ihtiyaç duyulduğunu belirleyin.",
        ],
        list: [
          "Mevcut süreçleri haritalandırın: sipariş, mutfak, kasa ve stok akışını yazın.",
          "Öncelik sırası belirleyin: en çok zaman alan işlemden başlayın.",
          "Ekibinizi eğitin: teknoloji ancak doğru kullanılırsa değer üretir.",
          "Sonuçları ölçün: masa devir hızı, ortalama sepet tutarı ve hata oranını izleyin.",
        ],
      },
      {
        heading: "Makethemenu ile geçişin avantajı",
        paragraphs: [
          "Makethemenu, dijital menü, adisyon, POS ve stok yönetimini tek platformda birleştirir. Kurulum gerektirmeyen yapısı sayesinde işletmeniz aynı gün dijitalleşmeye başlar; şubelerinizi ve geliri tek panelden takip edersiniz.",
          "Sonuç: daha az manuel işlem, daha az hata, daha hızlı servis ve ölçülebilir kârlılık artışı.",
        ],
      },
    ],
  },
  {
    slug: "musteri-memnuniyetini-artirmanin-5-yolu",
    title: "Müşteri Memnuniyetini Artırmanın 5 Yolu",
    description:
      "Restoranınızda müşteri deneyimini iyileştirmek için uygulayabileceğiniz pratik ipuçları.",
    date: "10 Şubat 2024",
    dateISO: "2024-02-10",
    readTime: "4 dk okuma",
    image: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=600&q=80",
    sections: [
      {
        heading: "1. Bekleme süresini kısaltın",
        paragraphs: [
          "Müşterinin ilk deneyimi masaya oturmadan başlar. QR menü ile sipariş alma, garsonun masaya ulaşmasını bekleme süresini ortadan kaldırır; mutfak ekranına düşen sipariş hazırlığa daha erken geçer.",
        ],
      },
      {
        heading: "2. Menüyü görsel ve net tutun",
        paragraphs: [
          "Fotoğraflı, güncel ve okunabilir bir menü karar süresini kısaltır. Ürünün fotoğrafını gören müşteri daha hızlı ve daha güvenle sipariş verir; yanlış anlaşılmalar kaynaklı iade oranınız düşer.",
        ],
      },
      {
        heading: "3. Geri bildirimleri takip edin",
        paragraphs: [
          "Yorum platformlarındaki ve sosyal medyadaki geri bildirimleri düzenli okuyun, yanıtlayın. Negatif yorumlara hızlı ve çözüm odaklı dönmek, müşteriyi kaybetmek yerine sadık bir takipçiye dönüştürebilir.",
        ],
      },
      {
        heading: "4. Personel eğitimine yatırım yapın",
        paragraphs: [
          "Menüyi en iyi bilen, en güler yüzlü ekip en yüksek memnuniyeti getirir. Dönemsel ürünler ve kampanyalar hakkında ekibinizi mutlaka bilgilendirin.",
        ],
      },
      {
        heading: "5. Sadakat programları kurun",
        paragraphs: [
          "Basit bir 'her 10. kahve ücretsiz' uygulaması bile dönüş oranını artırır. POS verinizle sadakat programını birleştirdiğinizde, hangi kampanyanın gerçekten işe yaradığını ölçebilirsiniz.",
        ],
      },
    ],
  },
  {
    slug: "pos-sistemleri-ile-stok-takibi",
    title: "POS Sistemleri ile Stok Takibi",
    description:
      "Modern POS sistemlerinin stok yönetimindeki rolü ve işletme verimliliğine katkıları.",
    date: "5 Şubat 2024",
    dateISO: "2024-02-05",
    readTime: "6 dk okuma",
    image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&q=80",
    sections: [
      {
        heading: "Sipariş verildiği anda stok düşsün",
        paragraphs: [
          "Geleneksel işletmelerde stok sayımı ayda bir, elle yapılan yorucu bir işlemdir. Modern POS sistemlerinde ise her sipariş verildiği anda tarifi (reçete) üzerinden otomatik olarak stoktan düşer; elinizdeki miktar her zaman günceldir.",
        ],
      },
      {
        heading: "Fireyi görünür kılın",
        paragraphs: [
          "Satılan ürün sayısı ile tüketilen malzeme arasındaki fark fire'dir. POS raporları sayesinde hangi üründe ne kadar fire yaşandığını görmek, kayıpların kaynağını bulmayı kolaylaştırır.",
        ],
        list: [
          "Yanlış porsiyon ölçüleri",
          "Mutfağa ait unutulan/fire edilen üretimler",
          "Kasa ile mutfak arasındaki iletişim kopuklukları",
        ],
      },
      {
        heading: "Otomatik sipariş uyarıları",
        paragraphs: [
          "Kritik stok seviyesine düşen bir malzeme için sistem sizi uyarır; 'bitmiş ama menüde duran ürün' yüzünden yaşanan müşteri kaybını önlersiniz. Tedarikçi siparişleri planlı ve israfsız hale gelir.",
        ],
      },
      {
        heading: "Maliyet kontrolü raporları",
        paragraphs: [
          "Hangi ürünün yemek maliyeti (food cost) yükseldiğini haftalık görmek, menü mühendisliği yapmanızı sağlar: fiyatı güncelleyin, porsiyonu ayarlayın ya da ürünü menüden çıkarın — veriye dayalı karar verin.",
        ],
      },
    ],
  },
  {
    slug: "restoranda-verimlilik-ve-maliyet-kontrolu",
    title: "Restoranda Verimlilik ve Maliyet Kontrolü",
    description:
      "İşletme maliyetlerini düşürürken verimliliği artırmak için stratejiler ve çözümler.",
    date: "1 Şubat 2024",
    dateISO: "2024-02-01",
    readTime: "7 dk okuma",
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&q=80",
    sections: [
      {
        heading: "Maliyetin %60'ı üç kalemde",
        paragraphs: [
          "Bir restoranın en büyük gider kalemleri gıda maliyeti, personel ve kira'dır. Bu üç kalemi ölçmeden yapılan her 'tasarruf' denemesi, su taşırken kova tutmaya benzer.",
        ],
      },
      {
        heading: "Gıda maliyetini düşürmek",
        paragraphs: [
          "Yemek maliyeti oranını (food cost %) ürün bazında hesaplayın. Oranı yüksek ürünlerde porsiyon standardizasyonu, alternatif tedarikçi veya reçete güncellemesi değerlendirin.",
        ],
        list: [
          "Porsiyon kağıtları ile ölçü standardizasyonu",
          "Sezonluk menü ile mevsim malzemesine yönelme",
          "Haftalık maliyet raporu ile trend takibi",
        ],
      },
      {
        heading: "Personel verimliliği",
        paragraphs: [
          "Yoğun saatlerde fazla, sakin saatlerde eksik personel çalıştırmak hem müşteri deneyimini hem de maliyeti bozar. POS verinizden saatlik satış grafiği çıkarın; vardiya planını bu grafiğe göre kurun.",
        ],
      },
      {
        heading: "İsrafın küçük ama sürekli maliyeti",
        paragraphs: [
          "Gün sonu atılan ürünler, dökülen soslar, yanlış hazırlanan siparişler... Tek tek küçük görünen bu kalemler yılsonunda ciddi bir toplam oluşturur. Dijital kayıt, israfın nereden geldiğini haftalık gösterir.",
        ],
      },
    ],
  },
  {
    slug: "masa-rezervasyon-sistemlerinin-onemi",
    title: "Masa Rezervasyon Sistemlerinin Önemi",
    description:
      "Modern rezervasyon sistemleriyle müşteri memnuniyetini nasıl artırabilirsiniz?",
    date: "25 Ocak 2024",
    dateISO: "2024-01-25",
    readTime: "5 dk okuma",
    image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&q=80",
    sections: [
      {
        heading: "Telefonla rezervasyon çağı kapanıyor",
        paragraphs: [
          "Müşteri artık aramak yerine birkaç dokunuşla masa ayırmak istiyor. Online rezervasyon, işletmenize 7/24 açık bir ön büro kazandırır: mesai saatleri dışında bile masanız doluyor.",
        ],
      },
      {
        heading: "Kapasiteyi gerçekçi planlayın",
        paragraphs: [
          "Rezervasyon sistemi, hangi saatlerde kaç masanızın dolu olduğunu gösterir. Yoğun akşamlara göre personel planı yapmak, hem ekibin yorgunluğunu hem de müşteri bekleme süresini azaltır.",
        ],
      },
      {
        heading: "No-show'a karşı önlemler",
        paragraphs: [
          "Gelmeyen rezervasyonlar (no-show) ciro kaybının sessiz sebebidir. Sistem üzerinden hatırlatma mesajları göndermek ve kritik saatler için kısmi ön ödeme talep etmek, no-show oranını belirgin biçimde düşürür.",
        ],
      },
      {
        heading: "Misafir verisi = gelecek satış",
        paragraphs: [
          "Rezervasyon yapan her misafirin temas bilgisi, doğum günü kampanyalarından sezonluk davetlere kadar birçok fırsata dönüşür. CRM entegrasyonu ile bu veri doğrudan satışa çevrilir.",
        ],
      },
    ],
  },
  {
    slug: "restoran-analitigi-ve-raporlama",
    title: "Restoran Analitiği ve Raporlama",
    description:
      "Veri analizi ile restoran performansınızı nasıl optimize edebilirsiniz?",
    date: "20 Ocak 2024",
    dateISO: "2024-01-20",
    readTime: "8 dk okuma",
    image: "https://images.unsplash.com/photo-1556740738-b6a63e27c4df?w=600&q=80",
    sections: [
      {
        heading: "Ölçmediğinizi yönetemezsiniz",
        paragraphs: [
          "Restoran işletmeciliğinde kararların çoğu 'sanırım' üzerine verilir: sanırım bu yemek iyi satıyor, sanırım akşam servisi daha yoğun. Analitik, bu tahminleri rakamlarla değiştirir.",
        ],
      },
      {
        heading: "İzlenmesi gereken temel metrikler",
        paragraphs: [
          "Her işletme farklıdır ama aşağıdaki beş metrik, sağlıklı bir başlangıç setidir:",
        ],
        list: [
          "Ortalama sepet tutarı (check average)",
          "Masa devir hızı (table turnover)",
          "En çok / en az satan ürünler (menu engineering)",
          "Yemek maliyeti oranı (food cost %)",
          "Personel başına ciro",
        ],
      },
      {
        heading: "Raporu rapora bakmakla karıştırmayın",
        paragraphs: [
          "Kasa kapanışına bakıp gitmek, analiz değildir. Haftalık periyotlarla belirli bir soruyu yanıtlayacak şekilde rapor inceleyin: 'Geçen hafta hangi ürünlerin marjı düştü?' ya da 'Yeni kampanya sepet tutarını artırdı mı?'",
        ],
      },
      {
        heading: "Zincir işletmelerde karşılaştırmalı analiz",
        paragraphs: [
          "Birden fazla şubeniz varsa şubeler arası karşılaştırma, en güçlü yönetim aracınızdır. Aynı ürünün A şubesinde iyi, B şubesinde kötü satması çoğu zaman personel veya yerellik meselesidir; veri bunu net biçimde gösterir.",
        ],
      },
    ],
  },
];

export function getBlogPost(slug: string): BlogPost | undefined {
  return blogPosts.find((p) => p.slug === slug);
}
