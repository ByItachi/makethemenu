import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Tablet, Users, TrendingUp, Clock, Settings, Zap, Package } from "lucide-react";

export default function RestaurantAutomationPage() {
  const features = [
    {
      icon: <Tablet className="h-8 w-8 text-primary" />,
      title: "Tüm Siparişler Tek Ekranda",
      description: "Paket servis, masa siparişi ve gel-al siparişlerinizin tamamını tek bir ekran üzerinden yönetin"
    },
    {
      icon: <Users className="h-8 w-8 text-primary" />,
      title: "Masa ve Rezervasyon Yönetimi",
      description: "Masa rezervasyonlarınızı ve doluluk durumunuzu anlık olarak takip edin ve yönetin"
    },
    {
      icon: <Package className="h-8 w-8 text-primary" />,
      title: "Stok ve Maliyet Kontrolü",
      description: "Otomatik stok takibi ve maliyet analizi ile karlılığınızı artırın"
    },
    {
      icon: <TrendingUp className="h-8 w-8 text-primary" />,
      title: "Detaylı Raporlama",
      description: "Günlük, haftalık ve aylık detaylı satış, maliyet ve performans raporları"
    },
    {
      icon: <Clock className="h-8 w-8 text-primary" />,
      title: "Hızlı Servis",
      description: "Siparişten servise kadar olan süreyi optimize ederek müşteri memnuniyetini artırın"
    },
    {
      icon: <Settings className="h-8 w-8 text-primary" />,
      title: "Entegrasyonlar",
      description: "Yemeksepeti, Getir Yemek ve diğer platformlarla entegre çalışma"
    }
  ];

  const benefits = [
    "Farklı kanallardan gelen siparişleri tek ekranda yönetin",
    "Operasyonel hataları en aza indirin",
    "Zamandan kazanın",
    "Müşteri memnuniyetini artırın",
    "Personel verimliliğini yükseltin",
    "Stok maliyetlerini düşürün",
    "Geliri ve karlılığı artırın",
    "Rekabetçi avantaj yakalayın"
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/20 to-white/0 dark:to-transparent pointer-events-none" />
        <div className="site-container text-center pt-32 relative z-10">
          <h1 className="text-5xl md:text-6xl font-display font-bold mb-6">
            Restoran <span className="text-primary">Otomasyon</span> Sistemi
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Restoran işletmelerinin karşılaştığı en büyük sorunlardan biri, farklı kanallardan gelen siparişleri takip etmekte yaşanan zorluktur. 
            Restoran otomasyon programı ile bu sorunu ortadan kaldırın.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="text-lg px-8 w-full sm:w-64">
              Ücretsiz Denemeye Başla
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 w-full sm:w-64">
              Demo İzle
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="site-container">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-display font-bold mb-4">
              Restoranınız İçin <span className="text-primary">Özellikler</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Modern restoran işletmeciliği için ihtiyacınız olan tüm araçlar tek platformda
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="p-6 hover:shadow-lg transition-shadow duration-300">
                <div className="mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20">
        <div className="site-container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-display font-bold mb-6">
                Restoranınızda <span className="text-primary">Başarıyı</span> Yakalayın
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Adisyo Restoran Otomasyon Sistemi ile tanışın, tüm siparişlerinizi tek ekranda yönetin ve operasyonel süreçlerinizi optimize edin.
              </p>
              
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Check className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-lg">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-8">
              <Zap className="w-16 h-16 text-primary mb-6" />
              <h3 className="text-2xl font-bold mb-4">Neden Restoran Otomasyonu?</h3>
              <p className="text-muted-foreground mb-6">
                Restoran işletmelerinin karşılaştığı en büyük sorunlardan biri, farklı kanallardan gelen siparişleri takip etmekte yaşanan zorluktur.
              </p>
              <p className="text-muted-foreground">
                Restoran otomasyon programı Adisyo, bu sorunu ortadan kaldırmak için geliştirilmiş bulut tabanlı bir sistem sunar. Paket servis, masa siparişi ve gel-al siparişlerinizin tamamını tek bir ekran üzerinden yöneterek hem zamandan kazanırsınız hem de operasyonel hataları en aza indirirsiniz.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="site-container text-center">
          <h2 className="text-4xl font-display font-bold mb-6">
            Restoranınızı Dijitalleştirmeye Hazır mısınız?
          </h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Ücretsiz denemeye başlayın, 14 gün boyunca tüm özellikleri sınırsız kullanın. 
            Kredi kartı gerekmez, kurulum ücreti yoktur.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="text-lg px-8 w-full sm:w-64">
              Hemen Başla
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 w-full sm:w-64 border-white/20 text-white hover:bg-white/10">
              Detaylı Bilgi Al
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}