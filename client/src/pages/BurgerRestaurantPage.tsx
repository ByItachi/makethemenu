import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, ChefHat, Clock, TrendingUp, Users, Settings, Zap, Package } from "lucide-react";

export default function BurgerRestaurantPage() {
  const features = [
    {
      icon: <ChefHat className="h-8 w-8 text-primary" />,
      title: "Özelleştirilebilir Menü",
      description: "Burger çeşitlerinizi, ekstra malzemeleri ve özel sosları kolayca yönetin"
    },
    {
      icon: <Clock className="h-8 w-8 text-primary" />,
      title: "Hazırlanma Süresi Takibi",
      description: "Her burger çeşidinin hazırlanma süresini optimize edin ve takip edin"
    },
    {
      icon: <Package className="h-8 w-8 text-primary" />,
      title: "Sipariş Paketleme",
      description: "Paket servis ve gel-al siparişlerinizi düzenli ve hızlı şekilde hazırlayın"
    },
    {
      icon: <TrendingUp className="h-8 w-8 text-primary" />,
      title: "Satış Analizi",
      description: "En popüler burgerlerinizi belirleyin ve menünüzü optimize edin"
    },
    {
      icon: <Users className="h-8 w-8 text-primary" />,
      title: "Personel Yönetimi",
      description: "Mutfak ve servis personelinizin verimliliğini artırın"
    },
    {
      icon: <Settings className="h-8 w-8 text-primary" />,
      title: "Entegrasyonlar",
      description: "Yemeksepeti, Getir Yemek ve diğer platformlarla entegre çalışma"
    }
  ];

  const benefits = [
    "Burger sipariş süreçlerini hızlandırın",
    "Müşteri bekleme süresini azaltın",
    "Özelleştirme seçeneklerini kolayca yönetin",
    "Personel verimliliğini artırın",
    "Sipariş hatalarını minimize edin",
    "Geliri artırın",
    "Müşteri memnuniyetini yükseltin",
    "Rekabet avantajı yakalayın"
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/20 to-white/0 dark:to-transparent pointer-events-none" />
        <div className="site-container text-center pt-32 relative z-10">
          <h1 className="text-5xl md:text-6xl font-display font-bold mb-6">
            Burger <span className="text-primary">Restoran</span> Sistemi
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Burger restoran işletmeniz için geliştirilmiş hızlı ve kurulum gerektirmeyen POS sistemi. 
            Kullanıcı dostu arayüzü ve pratik işlevleri ile rekabetçi avantaj yakalayın.
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
              Burger Restoranınız İçin <span className="text-primary">Özellikler</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Burger restoranları için özel olarak geliştirilmiş kapsamlı çözümler
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
                Burger Restoranınızda <span className="text-primary">Başarıyı</span> Yakalayın
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Adisyo'nun burger restoran işletmeler için geliştirdiği bir dizi özellik ile işleyişinizi kolaylaştırın ve operasyonlarınızı daha verimli hale getirin.
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
              <h3 className="text-2xl font-bold mb-4">Neden Burger Restoran Sistemi?</h3>
              <p className="text-muted-foreground mb-6">
                Burger restoran işletmeniz için hızlı ve kurulum gerektirmeyen restoran POS sistemi.
              </p>
              <p className="text-muted-foreground">
                Adisyo'nun kullanıcı dostu arayüzü ve pratik işlevleri, işletmenizin rekabetçi bir avantaj elde etmesine yardımcı olurken, müşterilerinize en iyi hizmeti sunmanızı sağlar.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="site-container text-center">
          <h2 className="text-4xl font-display font-bold mb-6">
            Burger Restoranınızı Dijitalleştirmeye Hazır mısınız?
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