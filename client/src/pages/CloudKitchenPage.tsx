import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Cloud, Package, TrendingUp, Users, Settings, Zap, Smartphone } from "lucide-react";

export default function CloudKitchenPage() {
  const features = [
    {
      icon: <Cloud className="h-8 w-8 text-primary" />,
      title: "Bulut Mutfak Yönetimi",
      description: "Tüm bulut mutfağınızı tek bir ekrandan kolayca yönetin ve kontrol edin"
    },
    {
      icon: <Package className="h-8 w-8 text-primary" />,
      title: "Teslimat Kanalı Entegrasyonu",
      description: "Tüm yemek sipariş platformları ile entegre çalışarak siparişleri toplayın"
    },
    {
      icon: <Users className="h-8 w-8 text-primary" />,
      title: "Kurye Yönetim Modülü",
      description: "Kurye performansını izleyin ve teslimat süreçlerini optimize edin"
    },
    {
      icon: <TrendingUp className="h-8 w-8 text-primary" />,
      title: "Performans Analizi",
      description: "Platform bazlı satış analizi yaparak en karlı kanallarınızı belirleyin"
    },
    {
      icon: <Settings className="h-8 w-8 text-primary" />,
      title: "Stok ve Üretim Yönetimi",
      description: "Malzeme stoklarınızı ve üretim süreçlerinizi optimize edin"
    },
    {
      icon: <Zap className="h-8 w-8 text-primary" />,
      title: "Anlık Senkronizasyon",
      description: "Tüm platformlar arasında anlık veri senkronizasyonu sağlayın"
    }
  ];

  const benefits = [
    "Birden fazla teslimat platformunu tek ekranda yönetin",
    "Kurye süreçlerini optimize edin",
    "Üretim verimliliğini artırın",
    "Platform bazlı performans analizi yapın",
    "Stok maliyetlerini düşürün",
    "Teslimat sürelerini kısaltın",
    "Müşteri memnuniyetini artırın",
    "Geliri maksimize edin"
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/20 to-white/0 dark:to-transparent pointer-events-none" />
        <div className="site-container text-center pt-32 relative z-10">
          <h1 className="text-5xl md:text-6xl font-display font-bold mb-6">
            Cloud Kitchen <span className="text-primary">(Bulut Mutfak)</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Cloud Kitchen & Bulut Mutfak iş modeli için geliştirilmiş hızlı ve kurulum gerektirmeyen POS sistemi. 
            Teslimat kanalı entegrasyonu ve kurye yönetim modülü ile verimliliğinizi artırın.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="text-lg px-8">
              Ücretsiz Denemeye Başla
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8">
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
              Bulut Mutfak İşletmeniz İçin <span className="text-primary">Özellikler</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Delivery-only mutfaklar için geliştirilmiş kapsamlı çözümler
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
                Bulut Mutfak <span className="text-primary">Verimliliğinizi</span> Artırın
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Adisyo, bulut mutfağınızı tek bir ekrandan kolayca yönetmenizi sağlayan bir dizi özellik sunar.
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
              <Cloud className="w-16 h-16 text-primary mb-6" />
              <h3 className="text-2xl font-bold mb-4">Neden Cloud Kitchen Sistemi?</h3>
              <p className="text-muted-foreground mb-6">
                Gelişmiş teslimat kanalı entegrasyonu ve kurye yönetim modülü ile işletmenizin verimliliğini arttırın.
              </p>
              <p className="text-muted-foreground">
                Sipariş süreçlerinizi optimize ederek, müşteri ilişkilerinizi güçlendirin ve gelirinizi maksimize edin.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="site-container text-center">
          <h2 className="text-4xl font-display font-bold mb-6">
            Bulut Mutfak İşletmenizi Dijitalleştirmeye Hazır mısınız?
          </h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Ücretsiz denemeye başlayın, 14 gün boyunca tüm özellikleri sınırsız kullanın. 
            Kredi kartı gerekmez, kurulum ücreti yoktur.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="text-lg px-8">
              Hemen Başla
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 border-white/20 text-white hover:bg-white/10">
              Detaylı Bilgi Al
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}