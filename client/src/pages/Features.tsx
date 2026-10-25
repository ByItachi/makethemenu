import { LayoutGrid, FileSpreadsheet, Layers, UtensilsCrossed, CreditCard, Users, Settings } from "lucide-react";
import { motion } from "framer-motion";

export default function Features() {
  const features = [
    {
      icon: <UtensilsCrossed className="w-10 h-10" />,
      title: "Masa & Sipariş Yönetimi",
      desc: "Kat ve masa planınızı oluşturun, sürükle-bırak ile siparişleri taşıyın, birleştirin veya ayırın.",
      color: "text-orange-500",
      bg: "bg-orange-50"
    },
    {
      icon: <FileSpreadsheet className="w-10 h-10" />,
      title: "Stok & Reçete Takibi",
      desc: "Ürün reçetelerini girin, satış yapıldıkça stoktan otomatik düşsün. Kritik stok uyarıları alın.",
      color: "text-blue-500",
      bg: "bg-blue-50"
    },
    {
      icon: <CreditCard className="w-10 h-10" />,
      title: "Hızlı Ödeme Alma",
      desc: "Parçalı ödeme, nakit, kredi kartı veya yemek çeki. Tüm ödeme yöntemlerini kolayca yönetin.",
      color: "text-green-500",
      bg: "bg-green-50"
    },
    {
      icon: <Users className="w-10 h-10" />,
      title: "Personel Yönetimi",
      desc: "Garson ve kasiyer yetkilerini belirleyin, performanslarını raporlayın ve vardiya takibi yapın.",
      color: "text-purple-500",
      bg: "bg-purple-50"
    },
    {
      icon: <Layers className="w-10 h-10" />,
      title: "Mutfak Ekranı (KDS)",
      desc: "Siparişleri anlık olarak mutfağa iletin, hazırlanan ürünleri garsonlara bildirin.",
      color: "text-red-500",
      bg: "bg-red-50"
    },
    {
      icon: <LayoutGrid className="w-10 h-10" />,
      title: "Gelişmiş Raporlar",
      desc: "Günün sonu raporu, ürün bazlı satışlar, iptal ve iade raporlarıyla tam kontrol sağlayın.",
      color: "text-indigo-500",
      bg: "bg-indigo-50"
    }
  ];

  return (
    <div className="pt-56 pb-24">
      {/* Header */}
      <div className="site-container text-center mb-20">
        <h1 className="text-4xl md:text-5xl font-display font-bold mb-6 text-slate-900">
          İhtiyacınız Olan <span className="text-primary">Tüm Özellikler</span>
        </h1>
        <p className="text-xl text-slate-600 max-w-2xl mx-auto">
          İşletmenizi büyütmek için tasarlanmış güçlü araçlar. Karmaşadan uzak, sadece işinize odaklanın.
        </p>
      </div>

      {/* Grid */}
      <div className="site-container">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="p-8 rounded-3xl border border-border bg-card hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 group"
            >
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 ${feature.bg} ${feature.color} group-hover:scale-110 transition-transform duration-300`}>
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Integration Section */}
      <div className="mt-32 bg-slate-900 text-white py-24">
        <div className="site-container grid md:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-6">
              YemekSepeti, Getir ve Trendyol Entegrasyonları
            </h2>
            <p className="text-lg text-slate-300 mb-8 leading-relaxed">
              Tüm paket servis siparişleriniz tek ekranda! Farklı platformlardan gelen siparişleri POS sisteminizde otomatik görün, kurye atayın ve yönetin.
            </p>
            <ul className="space-y-4">
              {["Otomatik sipariş onayı", "Stok senkronizasyonu", "Tek merkezden menü yönetimi"].map((item, idx) => (
                <li key={idx} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center">
                    <Settings className="w-4 h-4" />
                  </div>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="relative">
             {/* business integration tech abstract */}
             <img 
              src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&h=600&q=80" 
              alt="Integrations" 
              className="rounded-2xl shadow-2xl border border-slate-700/50"
            />
            <div className="absolute -bottom-10 -left-10 bg-card p-6 rounded-xl shadow-xl text-foreground border border-border hidden md:block">
              <div className="font-bold text-lg mb-1">Entegrasyonlar</div>
              <div className="text-sm text-muted-foreground">Tek tıkla bağlantı</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
