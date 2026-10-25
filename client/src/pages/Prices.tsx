import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { PLANS } from "@shared/plans";

export default function Prices() {
  const plans = PLANS.map((p) => ({
    name: p.name,
    price: p.monthlyPrice == null ? "Özel" : String(p.monthlyPrice),
    desc: p.desc,
    features: p.features,
    cta: p.cta,
    highlight: p.highlight,
    id: p.id,
    purchasable: p.purchasable,
  }));


  return (
    <div className="pt-56 pb-24 bg-background min-h-screen">
      <div className="site-container text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-display font-bold mb-6 text-foreground">
          Şeffaf ve Uygun <span className="text-primary">Fiyatlar</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Gizli ücret yok. Taahhüt yok. İster aylık, ister yıllık ödeyin.
        </p>
      </div>

      <div className="site-container">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, i) => (
            <div 
              key={i} 
              className={`relative bg-card rounded-3xl p-8 border ${plan.highlight ? 'border-primary shadow-2xl shadow-primary/10 scale-105 z-10' : 'border-border shadow-lg'} flex flex-col`}
            >
              {plan.highlight && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground px-4 py-1 rounded-full text-sm font-bold shadow-lg">
                  En Çok Tercih Edilen
                </div>
              )}
              
              <div className="mb-8">
                <h3 className="text-2xl font-bold text-foreground mb-2">{plan.name}</h3>
                <p className="text-muted-foreground text-sm h-10">{plan.desc}</p>
              </div>

              <div className="mb-8">
                <div className="flex items-end gap-1">
                  <span className="text-4xl font-bold text-foreground">
                    {plan.price === "Özel" ? "Teklif" : `₺${plan.price}`}
                  </span>
                  {plan.price !== "Özel" && <span className="text-muted-foreground mb-1">/ay</span>}
                </div>
                {plan.price !== "Özel" && <p className="text-xs text-green-600 font-medium mt-2">Yıllık ödemede %20 indirim</p>}
              </div>

              <ul className="space-y-4 mb-8 flex-1">
                {plan.features.map((feature, fIdx) => (
                  <li key={fIdx} className="flex items-center gap-3 text-sm text-foreground/90">
                    <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3" />
                    </div>
                    {feature}
                  </li>
                ))}
              </ul>

              <Link href={plan.purchasable ? `/checkout?plan=${plan.id}&cycle=monthly` : '/iletisim'}>
                <Button
                  className={`w-full py-6 rounded-xl font-bold text-base ${plan.highlight ? 'bg-primary hover:bg-primary/90' : 'bg-foreground text-background hover:bg-foreground/90'}`}
                >
                  {plan.cta}
                </Button>
              </Link>
            </div>
          ))}
        </div>
        
        <div className="mt-16 text-center">
          <p className="text-muted-foreground">
            Fiyatlara KDV dahil değildir. 14 gün ücretsiz deneme süresi sonunda kartınızdan çekim yapılmaz.
          </p>
        </div>
      </div>
    </div>
  );
}
