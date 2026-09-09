import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Clock, Users, TrendingUp, Coffee, Tablet, Settings, Zap } from "lucide-react";

export default function CafeAutomationPage() {
  const features = [
    {
      icon: <Tablet className="h-8 w-8 text-primary" />,
      title: "Kolay Kullanımlı Arayüz",
      description: "Garsonlarınız için özel olarak tasarlanmış, eğitim gerektirmeyen kullanıcı dostu arayüz"
    },
    {
      icon: <Clock className="h-8 w-8 text-primary" />,
      title: "Hızlı Sipariş Alımı",
      description: "Sipariş sürecini %50'ye kadar hızlandırarak müşteri memnuniyetini artırın"
    },
    {
      icon: <Users className="h-8 w-8 text-primary" />,
      title: "Masa ve Kurye Yönetimi",
      description: "Tüm masa rezervasyonlarınızı ve kurye siparişlerinizi tek ekrandan yönetin"
    },
    {
      icon: <TrendingUp className="h-8 w-8 text-primary" />,
      title: "Satış Raporları",
      description: "Günlük, haftalık ve aylık detaylı satış raporları ile işletmenizi analiz edin"
    },
    {
      icon: <Settings className="h-8 w-8 text-primary" />,
      title: "Entegrasyonlar",
      description: "Getir Yemek, Trendyol Yemek ve diğer platformlarla entegre çalışma"
    },
    {
      icon: <Zap className="h-8 w-8 text-primary" />,
      title: "Anlık Senkronizasyon",
      description: "Kasa, mutfak ve servis ekranları arasında anlık veri senkronizasyonu"
    }
  ];

  const benefits = [
    "Sipariş süreçlerini %50'ye kadar hızlandırın",
    "Operasyonel karmaşayı ortadan kaldırın",
    "Kasa, garson, mutfak ve yönetim ekranlarını tek panelde birleştirin",
    "Müşteri memnuniyetini artırın",
    "Personel verimliliğini yükseltin",
    "Stok takibini otomatikleştirin",
    "Maliyetleri düşürün",
    "Geliri artırın"
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/20 to-white/0 dark:to-transparent pointer-events-none" />
        <div className="site-container text-center pt-32 relative z-10">
          <h1 className="text-5xl md:text-6xl font-display font-bold mb-6">
            Cafe <span className="text-primary">Otomasyon</span> Sistemi
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Kafenizde sipariş süreçlerini hızlandırın, operasyonel karmaşayı ortadan kaldırın. 
            Kasa, garson, mutfak ve yönetim ekranlarını tek panelde birleştirin.
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
              Cafe İşletmeniz İçin <span className="text-primary">Özellikler</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Modern cafe işletmeciliği için ihtiyacınız olan tüm araçlar tek platformda
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
                Cafe İşletmenizde <span className="text-primary">Başarıyı</span> Yakalayın
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Adisyo Cafe Otomasyon Sistemi ile tanışın, sipariş süreçlerinizi optimize edin ve müşteri memnuniyetini maksimum seviyeye çıkarın.
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
              <Coffee className="w-16 h-16 text-primary mb-6" />
              <h3 className="text-2xl font-bold mb-4">Neden Cafe Otomasyonu?</h3>
              <p className="text-muted-foreground mb-6">
                Kafelerde en sık yaşanan problem: siparişin alınmasından kasaya, oradan mutfağa ve son olarak servis sürecine kadar olan zincirin kopuk ilerlemesi.
              </p>
              <p className="text-muted-foreground">
                Adisyo, tüm bu sorunları tek platformda birleştiren cafe otomasyon sistemi ile çözüyor. Kasa, garson, mutfak ve yönetim ekranı ayrı ayrı değil tek panelde bir araya geliyor.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="site-container text-center">
          <h2 className="text-4xl font-display font-bold mb-6">
            Cafe İşletmenizi Dijitalleştirmeye Hazır mısınız?
          </h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Ücretsiz denemeye başlayın, 14 gün boyunca tüm özellikleri sınırsız kullanın. 
            Kredi kartı gerekmez, kurulum ücreti yoktur.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="text-lg px-8">
              Hemen Başla
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 border-white text-white hover:bg-white/10">
              Detaylı Bilgi Al
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}