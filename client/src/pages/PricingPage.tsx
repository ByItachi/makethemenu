import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import { PLANS, type PlanId } from "@shared/plans";

function PricingCard({ planId, features, highlighted }: { planId: PlanId; features: string[]; highlighted?: boolean }) {
  const plan = PLANS.find((p) => p.id === planId)!;
  return (
    <Card className={`p-8 ${highlighted ? 'border-2 border-primary shadow-2xl scale-105 z-10' : 'border-border/50 shadow-lg'} relative bg-card flex flex-col`}>
      {highlighted && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-primary-foreground text-xs font-bold uppercase py-1 px-4 rounded-full">
          En Popüler
        </div>
      )}
      <div className="mb-8 text-center">
        <h3 className="text-xl font-bold text-foreground mb-2">{plan.name}</h3>
        <div className="flex items-center justify-center gap-1">
          <span className="text-5xl font-bold font-display text-foreground">
            {plan.monthlyPrice == null ? "Özel" : `₺${plan.monthlyPrice}`}
          </span>
          {plan.monthlyPrice != null && <span className="text-muted-foreground text-sm">/aylık</span>}
        </div>
        {plan.monthlyPrice != null && (
          <p className="text-xs text-green-600 dark:text-green-400 font-medium mt-2">Yıllık ödemede %20 indirim</p>
        )}
        <p className="text-muted-foreground text-sm mt-2">{plan.desc}</p>
      </div>
      <ul className="space-y-3 mb-8 flex-1 text-sm">
        {features.map((f: string, i: number) => (
          <li key={i} className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <span className="text-foreground/90">{f}</span>
          </li>
        ))}
      </ul>
      <Button
        className={`w-full h-12 text-lg ${plan.highlight ? '' : ''}`}
        variant={highlighted ? 'default' : 'outline'}
        onClick={() => (window.location.href = plan.purchasable ? `/checkout?plan=${plan.id}&cycle=monthly` : "/iletisim")}
      >
        {plan.purchasable ? "Hemen Başla" : "İletişime Geç"}
      </Button>
    </Card>
  );
}

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <section className="relative pt-56 pb-8 overflow-hidden">
        <div className="site-container text-center">
          <h1 className="text-4xl md:text-5xl font-display font-bold mb-6 text-foreground">
            Esnek <span className="text-primary">Fiyatlandırma</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Her ölçekteki işletmeye uygun paket seçenekleri. Gizli ücret yok, taahhüt yok. Yıllık ödemede %20 indirim.
          </p>
        </div>
      </section>

      <section className="site-container py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <PricingCard
            planId="baslangic"
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
            planId="profesyonel"
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
            planId="kurumsal"
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
      </section>

      <Footer />
    </div>
  );
}
