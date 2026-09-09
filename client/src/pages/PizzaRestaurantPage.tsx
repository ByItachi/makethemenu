import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Pizza, Clock, TrendingUp, Users, Settings, Zap, Package } from "lucide-react";

export default function PizzaRestaurantPage() {
  const features = [
    {
      icon: <Pizza className="h-8 w-8 text-primary" />,
      title: "Pizza Özelleştirme",
      description: "Hamur kalınlığı, sos seçenekleri ve malzemeleri kolayca özelleştirin"
    },
    {
      icon: <Clock className="h-8 w-8 text-primary" />,
      title: "Pişirme Süresi Takibi",
      description: "Her pizza çeşidinin pişirme süresini optimize edin ve takip edin"
    },
    {
      icon: <Package className="h-8 w-8 text-primary" />,
      title: "Paketleme ve Kurye",
      description: "Sıcak tutma ve hızlı teslimat için optimize paketleme süreci"
    },
    {
      icon: <TrendingUp className="h-8 w-8 text-primary" />,
      title: "Satış Analizi",
      description: "En popüler pizzalarınızı belirleyin ve menünüzü optimize edin"
    },
    {
      icon: <Users className="h-8 w-8 text-primary" />,
      title: "Kurye Yönetimi",
      description: "Kurye rotalarını optimize edin ve teslimat sürelerini kısaltın"
    },
    {
      icon: <Settings className="h-8 w-8 text-primary" />,
      title: "Platform Entegrasyonu",
      description: "Yemeksepeti, Getir Yemek ve diğer platformlarla entegre çalışma"
    }
  ];

  const benefits = [
    "Pizza sipariş süreçlerini hızlandırın",
    "Müşteri bekleme süresini azaltın",
    "Özelleştirme seçeneklerini kolayca yönetin",
    "Kurye verimliliğini artırın",
    "Sipariş hatalarını minimize edin",
    "Geliri artırın",
    "Müşteri memnuniyetini yükseltin",
    "Teslimat sürelerini optimize edin"
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/20 to-white/0 dark:to-transparent pointer-events-none" />
        <div className="site-container text-center pt-32 relative z-10">
          <h1 className="text-5xl md:text-6xl font-display font-bold mb-6">
            Pizza <span className="text-primary">Restaurant</span> Sistemi
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Pizza restaurant işletmeniz için geliştirilmiş hızlı ve kurulum gerektirmeyen restoran otomasyonu. 
            Sipariş, kurye ve müşteri yönetimi operasyonlarınızı tek platformda birleştirin.
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
              Pizza Restaurantınız İçin <span className="text-primary">Özellikler</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Pizza restaurantları için özel olarak geliştirilmiş kapsamlı çözümler
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
                Pizza Restaurantınızda <span className="text-primary">Başarıyı</span> Yakalayın
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Adisyo ile sipariş, kurye ve müşteri yönetimi operasyonlarınızı tek platformda birleştirerek, verimliliği artırabilir ve müşterilerinize daha iyi hizmet sunabilirsiniz.
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
              <h3 className="text-2xl font-bold mb-4">Neden Pizza Restaurant Sistemi?</h3>
              <p className="text-muted-foreground mb-6">
                Pizza restaurant işletmeniz için hızlı ve kurulum gerektirmeyen restoran otomasyonu.
              </p>
              <p className="text-muted-foreground">
                Böylece rakiplerinizden ayrışabilir ve pizza restoranınızı daha etkili bir şekilde yönetebilirsiniz. Teslimat sürelerini optimize ederek müşteri memnuniyetini maksimum seviyeye çıkarın.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="site-container text-center">
          <h2 className="text-4xl font-display font-bold mb-6">
            Pizza Restaurantınızı Dijitalleştirmeye Hazır mısınız?
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