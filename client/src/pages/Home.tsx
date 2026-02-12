import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { CheckCircle2, TrendingUp, ShieldCheck, Zap, BarChart3, Smartphone, ChevronRight } from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-primary/5 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-blue-400/5 rounded-full blur-3xl -z-10" />
        
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
            <motion.div 
              className="flex-1 text-center lg:text-left"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 text-blue-700 px-4 py-1.5 rounded-full text-sm font-semibold mb-6">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
                Yeni Nesil Bulut POS Sistemi
              </div>
              <h1 className="text-5xl lg:text-7xl font-display font-bold leading-[1.1] mb-6 text-slate-900">
                İşletmenizi <br />
                <span className="gradient-text">Geleceğe Taşıyın</span>
              </h1>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                Kafe, restoran ve mağazanız için en hızlı, güvenilir ve kolay kullanımlı POS çözümü. 
                Siparişleri yönetin, stokları takip edin, cironuzu artırın.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <Link href="/contact">
                  <Button size="lg" className="h-14 px-8 text-lg rounded-full shadow-xl shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-1 transition-all">
                    Hemen Başlayın
                  </Button>
                </Link>
                <Link href="/features">
                  <Button variant="outline" size="lg" className="h-14 px-8 text-lg rounded-full border-2 hover:bg-slate-50 text-slate-600">
                    Özellikleri İncele
                  </Button>
                </Link>
              </div>
              <div className="mt-8 flex items-center justify-center lg:justify-start gap-6 text-sm text-slate-500">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" /> 14 Gün Ücretsiz
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" /> Kredi Kartı Gerekmez
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" /> 7/24 Destek
                </div>
              </div>
            </motion.div>
            
            <motion.div 
              className="flex-1 relative"
              initial={{ opacity: 0, scale: 0.9, rotate: 2 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
            >
              {/* Dashboard abstract representation */}
              <div className="relative z-10 bg-white rounded-2xl shadow-2xl shadow-slate-200/50 border border-slate-100 p-2 overflow-hidden">
                 {/* Stock image for a dashboard/analytics view - abstract business tech */}
                 {/* dashboard analytics screen */}
                 <img 
                  src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop" 
                  alt="POS Dashboard Interface" 
                  className="rounded-xl w-full h-auto object-cover"
                />
                
                {/* Floating card 1 */}
                <motion.div 
                  className="absolute -bottom-6 -left-6 bg-white p-4 rounded-xl shadow-xl border border-slate-100 flex items-center gap-4"
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                >
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                    <TrendingUp />
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Günlük Ciro</div>
                    <div className="text-lg font-bold text-slate-900">₺24,500</div>
                  </div>
                </motion.div>

                {/* Floating card 2 */}
                <motion.div 
                  className="absolute -top-6 -right-6 bg-white p-4 rounded-xl shadow-xl border border-slate-100 flex items-center gap-4"
                  animate={{ y: [0, 10, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                >
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                    <Zap />
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Aktif Masa</div>
                    <div className="text-lg font-bold text-slate-900">12 / 15</div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-10 border-y border-slate-100 bg-slate-50/50">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm font-semibold text-slate-500 mb-6 uppercase tracking-wider">5000+ İşletme Tarafından Güvenle Kullanılıyor</p>
          <div className="flex flex-wrap justify-center items-center gap-12 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
            {/* Logo placeholders */}
            {["TechCorp", "Foodie", "CafeBar", "BistroX", "MarketPlus"].map((brand) => (
              <span key={brand} className="text-xl font-display font-bold text-slate-400">{brand}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Grid */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl font-display font-bold text-slate-900 mb-4">Neden PosSistem?</h2>
            <p className="text-lg text-slate-600">
              İşletmenizi yönetmek hiç bu kadar kolay olmamıştı. Tüm operasyonunuzu tek bir ekrandan kontrol edin.
            </p>
          </div>

          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
          >
            {[
              {
                icon: <Smartphone className="w-8 h-8 text-white" />,
                color: "bg-blue-500",
                title: "Bulut Tabanlı & Mobil",
                desc: "İnternet olan her yerden erişin. Tablet, telefon veya bilgisayar fark etmeksizin tüm cihazlarla uyumlu."
              },
              {
                icon: <BarChart3 className="w-8 h-8 text-white" />,
                color: "bg-purple-500",
                title: "Detaylı Raporlama",
                desc: "Satışlarınızı, stok durumunuzu ve personel performansınızı anlık grafiklerle analiz edin."
              },
              {
                icon: <ShieldCheck className="w-8 h-8 text-white" />,
                color: "bg-emerald-500",
                title: "Güvenli Altyapı",
                desc: "Verileriniz bulutta güvende. Otomatik yedekleme ve üst düzey şifreleme ile işiniz garanti altında."
              }
            ].map((feature, idx) => (
              <motion.div 
                key={idx} 
                variants={item}
                className="group p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:shadow-xl hover:shadow-slate-200/50 hover:-translate-y-1 transition-all duration-300"
              >
                <div className={`w-16 h-16 ${feature.color} rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-900/5 group-hover:scale-110 transition-transform duration-300`}>
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                <p className="text-slate-600 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="container mx-auto px-4 md:px-6 relative z-10 text-center">
          <h2 className="text-4xl md:text-5xl font-display font-bold mb-6">Denemeye Hazır mısınız?</h2>
          <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto">
            Kurulum ücreti yok, kredi kartı gerekmiyor. 14 gün boyunca tüm özellikleri ücretsiz deneyin.
          </p>
          <Link href="/contact">
            <Button size="lg" className="h-16 px-10 text-lg rounded-full bg-white text-slate-900 hover:bg-blue-50 hover:scale-105 transition-all shadow-xl font-bold">
              Ücretsiz Deneme Hesabı Oluştur
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
