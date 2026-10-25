import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useSeo } from "@/lib/seo";

type DocKind = "gizlilik" | "kvkk" | "kosullar";

const DOCS: Record<DocKind, { title: string; description: string; sections: Array<{ h: string; p: string[] }> }> = {
  gizlilik: {
    title: "Gizlilik Politikası",
    description:
      "Makethemenu kişisel verilerinizi nasıl işler, saklar ve korur? Çerezler, ölçümleme araçları ve veri güvenliği politikamız.",
    sections: [
      {
        h: "Topladığımız veriler",
        p: [
          "Hesap oluşturduğunuzda ad, e-posta ve telefon bilgisi; abonelik sürecinde fatura bilgileri; platformu kullanırken işletme adınıza girdiğiniz menü, ürün ve sipariş verileri işlenir.",
          "Menü görüntüleme ölçümleri (menu_view, qr_scan) kimlik bilgisi olmadan, yalnızca toplam sayım olarak tutulur. IP adresinden profil oluşturulmaz.",
        ],
      },
      {
        h: "Çerezler ve ölçümleme",
        p: [
          "Zorunlu çerezler oturum güvenliği için gereklidir ve her zaman etkilidir. Ölçümleme (Google Analytics 4, Google Tag Manager) ve pazarlama (Meta Pixel) çerezleri yalnızca açık rızanızla yüklenir.",
          "Tercihinizi her zaman alt bilgideki 'Çerez Tercihleri' bağlantısından değiştirebilirsiniz. Rıza vermediğinizde ölçüm etiketleri hiç yüklenmez; rıza verdiyseniz Google Consent Mode v2 ile sinyaller aktarılır.",
        ],
      },
      {
        h: "Veri güvenliği ve saklama",
        p: [
          "Veriler TLS ile şifrelenmiş bağlantı üzerinden işlenir; oturum çerezleri HttpOnly ve SameSite bayraklıdır. Ücretlendirme bilgileri ödeme sağlayıcısında saklanır, sistemimizde tam kart numarası tutulmaz.",
          "Veriler, yasal saklama süreleri boyunca; hesabınızı kapattığınızda ise silme talebinize istinaden kaldırılır.",
        ],
      },
      {
        h: "Haklarınız",
        p: [
          "KVKK m.11 kapsamında verilerinize erişme, düzeltme, silme ve işlemeye itiraz etme hakkınız vardır. Talepleriniz için info@makethemenu.com adresine yazabilirsiniz.",
        ],
      },
    ],
  },
  kvkk: {
    title: "KVKK Aydınlatma Metni",
    description:
      "6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında Makethemenu tarafından işlenen kişisel verilere ilişkin aydınlatma metni.",
    sections: [
      {
        h: "Veri sorumlusu",
        p: [
          "Veri sorumlusu, Makethemenu dijital menü ve işletme platformunu işleten kuruluştur. İletişim: info@makethemenu.com",
        ],
      },
      {
        h: "İşleme amacı ve hukuki sebep",
        p: [
          "Kimlik ve iletişim verileriniz, hizmet sözleşmesinin kurulması ve ifası (KVKK m.5/2-c), ölçümleme ve pazarlama verileriniz ise açık rızanıza (m.5/1) dayanarak; hesap yönetimi, abonelik faturalandırması, destek taleplerinin karşılanması ve ürün geliştirme amaçlarıyla işlenir.",
          "Yabancı ülkeye veri aktarımı yapılmaz. Ölçümleme sağlayıcıları (Google, Meta) ayarlarınız aktifse hizmet sağlayıcı olarak işlem yapar; bu durumda veriler tedarikçi altyapısında işlenir.",
        ],
      },
      {
        h: "Saklama süreleri ve haklarınız",
        p: [
          "Veriler, ilgili mevzuattaki yasal yükümlülük süreleri (ör. vergi mevzuatı için 10 yıl) boyunca saklanır; ölçümleme verileri en fazla 26 ay korunur.",
          "KVKK m.11'de sayılan haklarınızı info@makethemenu.com üzerinden kullanabilirsiniz. Başvurular en geç 30 gün içinde yanıtlanır.",
        ],
      },
    ],
  },
  kosullar: {
    title: "Kullanım Koşulları",
    description:
      "Makethemenu platformunu kullanımına ilişkin hizmet kapsamı, abonelik, ödeme ve sorumluluk koşulları.",
    sections: [
      {
        h: "Hizmet kapsamı",
        p: [
          "Makethemenu; dijital menü oluşturma, QR menü yayınlama, masa-sipariş ve işletme yönetimi modülleri sunan bir abonelik hizmetidir. Hizmet, seçtiğiniz plandaki sınırlar (şube, kullanıcı, menü sayısı) dahilinde kullanılır.",
        ],
      },
      {
        h: "Abonelik ve ödeme",
        p: [
          "Abonelikler dönemlik olarak faturalanır. Ücretsiz deneme süresi sonunda ödeme bilgisi istenir; iptal etmediğiniz takdirde dönem otomatik yenilenir. Fiyatlar ve plan içerikleri fiyat sayfasında yayımlanan güncel koşullara göre belirlenir.",
        ],
      },
      {
        h: "Kullanıcı sorumlulukları",
        p: [
          "Platformda yayınladığınız menü, fiyat ve içerik bilgilerinin doğruluğundan işletmeniz sorumludur. Hizmeti, mevzuata (ör. menü etiketleme ve fiyat görünürlüğü) aykırı biçimde kullanamazsınız.",
        ],
      },
      {
        h: "Hizmet değişiklikleri",
        p: [
          "Yeni modüller ekleyebilir ya da kusurlu özellikleri kaldırabiliriz. Önemli değişiklikleri e-posta ve panel duyurusu ile en az 30 gün önceden bildiririz.",
        ],
      },
    ],
  },
};

export function LegalPage({ kind }: { kind: DocKind }) {
  const doc = DOCS[kind];
  useSeo({
    title: doc.title,
    description: doc.description,
    path: `/${kind}`,
    breadcrumbs: [
      { name: "Ana Sayfa", path: "/" },
      { name: doc.title, path: `/${kind}` },
    ],
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/20 to-white/0 dark:to-transparent pointer-events-none" />
        <div className="site-container text-center pt-32 relative z-10">
          <h1 className="text-5xl md:text-6xl font-display font-bold mb-6">
            <span className="text-primary">{doc.title.split(" ")[0]}</span>{" "}
            {doc.title.split(" ").slice(1).join(" ")}
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">{doc.description}</p>
        </div>
      </section>

      <section className="py-16">
        <div className="site-container max-w-3xl space-y-10">
          {doc.sections.map((s) => (
            <article key={s.h} className="space-y-3">
              <h2 className="text-2xl font-bold">{s.h}</h2>
              {s.p.map((p, i) => (
                <p key={i} className="text-muted-foreground leading-relaxed">{p}</p>
              ))}
            </article>
          ))}
          <p className="text-sm text-muted-foreground pt-4 border-t border-border">
            Son güncelleme: {new Date().toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default LegalPage;
