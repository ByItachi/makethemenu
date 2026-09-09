import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/20 to-white/0 dark:to-transparent pointer-events-none" />
        <div className="site-container text-center pt-32 relative z-10">
          <h1 className="text-5xl md:text-6xl font-display font-bold mb-6">
            Esnek <span className="text-primary">Fiyatlandırma</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Her ölçekteki işletmeye uygun paket seçenekleri. Gizli ücret yok, taahhüt yok.
          </p>
        </div>
      </section>
      
      <section className="site-container py-16">
        <div className="mb-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <PricingCard
              title="Başlangıç"
              price="299"
              features={[
                "5 Masa",
                "Temel Raporlar",
                "Mobil Destek",
                "E-posta Desteği",
                "Sipariş Yönetimi",
                "QR Menü",
                "Temel Stok Takibi",
                "Ücretsiz Güncellemeler"
              ]}
            />
            <PricingCard
              title="Profesyonel"
              price="599"
              highlighted={true}
              features={[
                "Sınırsız Masa",
                "Gelişmiş Analizler",
                "Stok Takibi",
                "7/24 Telefon Desteği",
                "Müşteri Yönetimi",
                "Personel Yönetimi",
                "Mutfak Ekranı Entegrasyonu",
                "Yemeksepeti / Getir Entegrasyonu",
                "Gerçek Zamanlı Raporlama",
                "Sadakat Programı"
              ]}
            />
            <PricingCard
              title="Kurumsal"
              price="999"
              features={[
                "Çoklu Şube Yönetimi",
                "API Erişimi",
                "Özel Entegrasyonlar",
                "Atanmış Müşteri Danışmanı",
                "Özel Raporlama",
                "Merkezi Stok Yönetimi",
                "Franchise Yönetimi",
                "Sınırsız Kullanıcı",
                "Özel SLA Garantisi",
                "Öncelikli Özellik Talepleri"
              ]}
            />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function PricingCard({ title, price, features, highlighted }: any) {
  return (
    <Card className={`p-8 ${highlighted ? 'border-2 border-primary shadow-2xl scale-105 z-10' : 'border-border/50 shadow-lg'} relative bg-card flex flex-col`}>
      {highlighted && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-primary-foreground text-xs font-bold uppercase py-1 px-4 rounded-full">
          En Popüler
        </div>
      )}
      <div className="mb-8 text-center">
        <h3 className="text-xl font-bold mb-2">{title}</h3>
        <div className="flex items-center justify-center gap-1">
          <span className="text-5xl font-bold font-display">₺{price}</span>
          <span className="text-muted-foreground text-sm">/aylık</span>
        </div>
      </div>
      <ul className="space-y-4 mb-8 text-sm flex-1">
        {features.map((f: string) => (
          <li key={f} className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <Button className="w-full h-12 text-lg" variant={highlighted ? 'default' : 'outline'} onClick={() => window.location.href = "/iletisim"}>
        Hemen Başla
      </Button>
    </Card>
  );
}
