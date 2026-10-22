import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function Prices() {
  const plans = [
    {
      name: "Başlangıç",
      price: "199",
      desc: "Küçük kafeler ve büfeler için ideal.",
      features: [
        "Tek Cihaz",
        "Sınırsız Ürün & Kategori",
        "Basit Raporlama",
        "E-posta Desteği"
      ],
      cta: "Hemen Başla",
      highlight: false
    },
    {
      name: "Profesyonel",
      price: "349",
      desc: "Büyüyen restoranlar için tam çözüm.",
      features: [
        "3 Cihaza Kadar",
        "Stok & Reçete Takibi",
        "Masa Yönetimi",
        "Gelişmiş Raporlar",
        "7/24 Telefon Desteği",
        "Mutfak Ekranı (KDS)"
      ],
      cta: "En Popüler Seçim",
      highlight: true
    },
    {
      name: "Kurumsal",
      price: "Özel",
      desc: "Zincir işletmeler ve büyük restoranlar.",
      features: [
        "Sınırsız Cihaz",
        "Şube Yönetimi",
        "API Erişimi",
        "Özel Entegrasyonlar",
        "Özel Müşteri Temsilcisi",
        "ERP Entegrasyonu"
      ],
      cta: "İletişime Geç",
      highlight: false
    }
  ];

  return (
    <div className="pt-56 pb-24 bg-slate-50 min-h-screen">
      <div className="site-container text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-display font-bold mb-6 text-slate-900">
          Şeffaf ve Uygun <span className="text-primary">Fiyatlar</span>
        </h1>
        <p className="text-xl text-slate-600 max-w-2xl mx-auto">
          Gizli ücret yok. Taahhüt yok. İster aylık, ister yıllık ödeyin.
        </p>
      </div>

      <div className="site-container">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, i) => (
            <div 
              key={i} 
              className={`relative bg-white rounded-3xl p-8 border ${plan.highlight ? 'border-primary shadow-2xl shadow-primary/10 scale-105 z-10' : 'border-border shadow-lg'} flex flex-col`}
            >
              {plan.highlight && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-primary to-blue-600 text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg">
                  En Çok Tercih Edilen
                </div>
              )}
              
              <div className="mb-8">
                <h3 className="text-2xl font-bold text-slate-900 mb-2">{plan.name}</h3>
                <p className="text-slate-500 text-sm h-10">{plan.desc}</p>
              </div>

              <div className="mb-8">
                <div className="flex items-end gap-1">
                  <span className="text-4xl font-bold text-slate-900">
                    {plan.price === "Özel" ? "Teklif" : `₺${plan.price}`}
                  </span>
                  {plan.price !== "Özel" && <span className="text-slate-500 mb-1">/ay</span>}
                </div>
                {plan.price !== "Özel" && <p className="text-xs text-green-600 font-medium mt-2">Yıllık ödemede %20 indirim</p>}
              </div>

              <ul className="space-y-4 mb-8 flex-1">
                {plan.features.map((feature, fIdx) => (
                  <li key={fIdx} className="flex items-center gap-3 text-sm text-slate-700">
                    <div className="w-5 h-5 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3" />
                    </div>
                    {feature}
                  </li>
                ))}
              </ul>

              <Link href={plan.name === 'Kurumsal' ? '/iletisim' : `/purchase?plan=${plan.name.toLowerCase()}`}>
                <Button 
                  className={`w-full py-6 rounded-xl font-bold text-base ${plan.highlight ? 'bg-primary hover:bg-primary/90' : 'bg-slate-900 hover:bg-slate-800'}`}
                >
                  {plan.cta}
                </Button>
              </Link>
            </div>
          ))}
        </div>
        
        <div className="mt-16 text-center">
          <p className="text-slate-500">
            Fiyatlara KDV dahil değildir. 14 gün ücretsiz deneme süresi sonunda kartınızdan çekim yapılmaz.
          </p>
        </div>
      </div>
    </div>
  );
}
