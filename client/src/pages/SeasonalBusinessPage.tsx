import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Sun, Clock, TrendingUp, Users, Settings, Zap, Smartphone } from "lucide-react";

export default function SeasonalBusinessPage() {
  const features = [
    {
      icon: <Sun className="h-8 w-8 text-primary" />,
      title: "Sezonluk Uyum",
      description: "Yaz sezonuna özel olarak tasarlanmış, hızlı kurulum özellikli sistem"
    },
    {
      icon: <Clock className="h-8 w-8 text-primary" />,
      title: "Dakikalar İçinde Açılış",
      description: "Üye olun, menünüzü tanımlayın ve dakikalar içinde sipariş almaya başlayın"
    },
    {
      icon: <Smartphone className="h-8 w-8 text-primary" />,
      title: "Mobil Yönetim",
      description: "Tüm operasyonlarınızı telefon veya tablet üzerinden kolayca yönetin"
    },
    {
      icon: <TrendingUp className="h-8 w-8 text-primary" />,
      title: "Sezon Analizi",
      description: "Sezonluk satış trendlerinizi analiz edin ve performansınızı optimize edin"
    },
    {
      icon: <Users className="h-8 w-8 text-primary" />,
      title: "Personel Takibi",
      description: "Sezonluk personelinizin çalışma saatlerini ve performansını takip edin"
    },
    {
      icon: <Settings className="h-8 w-8 text-primary" />,
      title: "Esnek Ayarlar",
      description: "Sezonluk ihtiyaçlarınıza göre sistem ayarlarınızı kolayca değiştirin"
    }
  ];

  const benefits = [
    "Herhangi bir eğitim veya kurulum gerekmez",
    "Dakikalar içinde sistemi açabilirsiniz",
    "Yaz sezonuna hızlıca hazır olun",
    "Mobil cihazlardan tam kontrol",
    "Sezonluk maliyetleri düşürün",
    "Esnek fiyatlandırma seçenekleri",
    "Mevsimsel taleplere hızlı cevap verin",
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
            Sezonluk <span className="text-primary">İşletmeler</span> İçin
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Sezonluk restoran, kafe ve beach gibi işletmeler için geliştirilmiş uygun fiyatlı adisyon programı. 
            Herhangi bir eğitim veya kurulum gerekmez.
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
              Sezonluk İşletmeniz İçin <span className="text-primary">Özellikler</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Yaz sezonuna hazır, pratik ve hızlı bir sistemle tanışın
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
                Sezonluk İşletmenizde <span className="text-primary">Başarıyı</span> Yakalayın
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Adisyo, sezonluk restoran, kafe ve beach gibi işletmeler için geliştirilen kolay kullanımlı bir sipariş sistemidir.
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
              <Sun className="w-16 h-16 text-primary mb-6" />
              <h3 className="text-2xl font-bold mb-4">Neden Sezonluk İşletme Sistemi?</h3>
              <p className="text-muted-foreground mb-6">
                Sezonluk işletmeler için hızlı ve kurulum gerektirmeyen adisyon sistemi.
              </p>
              <p className="text-muted-foreground">
                Üye olun, menünüzü tanımlayın ve dakikalar içinde sipariş almaya başlayın. Tüm operasyonlarınızı telefon veya tablet üzerinden kolayca yönetin. Yaz sezonuna hazır, pratik ve hızlı bir sistemle başlayın.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="site-container text-center">
          <h2 className="text-4xl font-display font-bold mb-6">
            Sezonluk İşletmenizi Dijitalleştirmeye Hazır mısınız?
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