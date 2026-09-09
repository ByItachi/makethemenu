import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Building2, TrendingUp, Users, BarChart3, Settings, Zap, MapPin } from "lucide-react";

export default function MultiBranchPage() {
  const features = [
    {
      icon: <Building2 className="h-8 w-8 text-primary" />,
      title: "Merkezi Yönetim",
      description: "Tüm şubelerinizi tek bir panelden yönetin, operasyonel süreçleri optimize edin"
    },
    {
      icon: <BarChart3 className="h-8 w-8 text-primary" />,
      title: "Şube Bazlı Raporlar",
      description: "Her şubenin günlük sipariş sayılarını, satış verilerini ve performansını anlık takip edin"
    },
    {
      icon: <TrendingUp className="h-8 w-8 text-primary" />,
      title: "Karşılaştırmalı Analiz",
      description: "Şubeler arası performans karşılaştırması yaparak en iyi uygulamaları belirleyin"
    },
    {
      icon: <Users className="h-8 w-8 text-primary" />,
      title: "Personel Yönetimi",
      description: "Tüm şubelerinizdeki personel performansını ve çalışma saatlerini merkezi olarak yönetin"
    },
    {
      icon: <Settings className="h-8 w-8 text-primary" />,
      title: "Standartlaştırma",
      description: "Menü, fiyat ve kampanyalarınızı tüm şubelerde senkronize olarak yönetin"
    },
    {
      icon: <MapPin className="h-8 w-8 text-primary" />,
      title: "Lokasyon Bazlı Yönetim",
      description: "Her şubenin lokasyonel özelliklerine göre özel ayarlar yapın ve yönetin"
    }
  ];

  const benefits = [
    "Tüm şubelerinizi tek bir noktadan yönetin",
    "Operasyonel süreçleri optimize edin",
    "Verimliliği artırın",
    "Maliyetleri düşürün",
    "Şubeler arası tutarlılığı sağlayın",
    "Merkezi kontrol ile hataları azaltın",
    "Performans karşılaştırmaları yapın",
    "Stratejik kararlar alın"
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/20 to-white/0 dark:to-transparent pointer-events-none" />
        <div className="site-container text-center pt-32 relative z-10">
          <h1 className="text-5xl md:text-6xl font-display font-bold mb-6">
            Çoklu <span className="text-primary">Şube</span> Yönetimi
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Adisyo Çoklu Şube Yönetimi ile tüm şubelerinizi tek bir noktadan yönetin, 
            operasyonel süreçleri optimize edin ve verimliliği artırın.
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
              Çoklu Şube İşletmeleri İçin <span className="text-primary">Özellikler</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Şubeli restaurantlar için geliştirilmiş kapsamlı yönetim araçları
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
                Şubelerinizi <span className="text-primary">Merkezi</span> Yönetin
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Adisyo Merkezi Yönetim Modülü ile işletmenizin şubelerini merkezi bir şekilde yönetebilir, operasyonel süreçleri optimize edebilir ve verimliliği artırabilirsiniz.
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
              <Building2 className="w-16 h-16 text-primary mb-6" />
              <h3 className="text-2xl font-bold mb-4">Neden Merkezi Yönetim?</h3>
              <p className="text-muted-foreground mb-6">
                Şubelerinizin günlük sipariş sayılarını, satış verilerini ve daha birçok önemli bilgiyi anlık takip edebilirsiniz.
              </p>
              <p className="text-muted-foreground">
                Adisyo ile dakikalar içinde pos sisteminizi açın ve tüm şubelerinizi tek bir noktadan yönetmeye başlayın.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="site-container text-center">
          <h2 className="text-4xl font-display font-bold mb-6">
            Tüm Şubelerinizi Tek Noktadan Yönetmeye Hazır mısınız?
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