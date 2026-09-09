import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/20 to-white/0 dark:to-transparent pointer-events-none" />
        <div className="site-container text-center pt-32 relative z-10">
          <h1 className="text-5xl md:text-6xl font-display font-bold mb-6">
            Biz <span className="text-primary">Kimiz?</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            makethemenu olarak, yeme-içme sektöründeki işletmelerin dijital dönüşümüne öncülük ediyoruz.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="site-container">
          <div className="flex flex-col md:flex-row items-center gap-16 mb-20">
            <div className="flex-1 order-2 md:order-1">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                <img 
                  src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80" 
                  alt="Restaurant Interior" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <div className="flex-1 order-1 md:order-2">
              <h2 className="text-4xl md:text-5xl font-display font-bold mb-8">Hikayemiz</h2>
              <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                makethemenu olarak, yeme-içme sektöründeki işletmelerin dijital dönüşümüne öncülük ediyoruz.
                2020 yılında kurulan şirketimiz, bugün Türkiye'nin 81 ilinde binlerce restorana hizmet veriyor.
              </p>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                Amacımız, karmaşık restoran operasyonlarını basitleştirmek ve işletme sahiplerinin asıl işlerine, 
                yani lezzetli yemekler sunmaya ve misafirlerini ağırlamaya odaklanmalarını sağlamaktır.
              </p>
              <div className="space-y-4">
                <AboutItem text="10+ Yıllık Sektör Tecrübesi" />
                <AboutItem text="500+ Mutlu İşletme" />
                <AboutItem text="Anlık Veri Senkronizasyonu" />
                <AboutItem text="7/24 Teknik Destek" />
              </div>
            </div>
          </div>

          {/* Mission & Vision */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mt-20">
            <div className="bg-card p-10 rounded-3xl border border-border/50">
              <h3 className="text-2xl font-bold mb-4">Misyonumuz</h3>
              <p className="text-muted-foreground leading-relaxed">
                Restoranların verimliliğini artıran, kullanımı kolay ve erişilebilir teknolojiler geliştirmek.
                Küçük işletmelerden büyük zincirlere kadar herkesin teknolojiye erişimini sağlamak.
              </p>
            </div>
            <div className="bg-card p-10 rounded-3xl border border-border/50">
              <h3 className="text-2xl font-bold mb-4">Vizyonumuz</h3>
              <p className="text-muted-foreground leading-relaxed">
                Global ölçekte en çok tercih edilen restoran yönetim sistemi olmak ve sektöre yön veren yeniliklere imza atmak.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function AboutItem({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-2 w-2 rounded-full bg-primary" />
      <span className="text-foreground font-medium text-lg">{text}</span>
    </div>
  );
}
