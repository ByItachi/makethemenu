import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { LayoutDashboard, UtensilsCrossed, BarChart3, Users, CheckCircle2 } from "lucide-react";

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <section className="relative pt-56 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/20 to-white/0 dark:to-transparent pointer-events-none" />
        <div className="site-container relative z-10">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-6xl font-display font-bold mb-6"><span>Gelişmiş </span><span className="text-primary">Özellikler</span></h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              İşletmenizi dijitalleştirin, operasyonlarınızı hızlandırın ve verimliliğinizi artırın.
              MakeTheMenu size ihtiyacınız olan tüm araçları sunar.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard 
              icon={LayoutDashboard}
              title="Masa Yönetimi"
              description="Kat planınızı oluşturun, masaların doluluk durumunu anlık takip edin. Renk kodları ile masa durumlarını (boş, dolu, rezerve) kolayca ayırt edin."
            />
            <FeatureCard 
              icon={UtensilsCrossed}
              title="Hızlı POS"
              description="Saniyeler içinde sipariş alın, mutfakla anlık iletişim kurun. Dokunmatik ekran uyumlu arayüz ile hataları en aza indirin."
            />
            <FeatureCard 
              icon={BarChart3}
              title="Gelişmiş Raporlar"
              description="Satışlarınızı, en çok tercih edilen ürünleri ve cironuzu analiz edin. Günlük, haftalık ve aylık raporlarla işletmenizin nabzını tutun."
            />
            <FeatureCard 
              icon={Users}
              title="Müşteri Sadakati"
              description="Müşteri alışkanlıklarını öğrenin, veritabanı oluşturun ve onlara özel teklifler sunarak sadakati artırın."
            />
            <FeatureCard 
              icon={CheckCircle2}
              title="Stok Takibi"
              description="Ürün reçeteleri oluşturun, stoktan otomatik düşüm yapın. Kritik stok seviyelerinde uyarılar alın."
            />
             <FeatureCard 
              icon={CheckCircle2}
              title="Personel Yönetimi"
              description="Personel performansını ölçün, yetkilendirmeler yapın ve vardiya takibini kolaylaştırın."
            />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function FeatureCard({ icon: Icon, title, description }: any) {
  return (
    <Card className="p-8 border-border/50 shadow-sm hover:shadow-md transition-all bg-card hover:bg-card/80">
      <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6">
        <Icon className="h-7 w-7" />
      </div>
      <h3 className="text-2xl font-bold mb-4">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{description}</p>
    </Card>
  );
}
