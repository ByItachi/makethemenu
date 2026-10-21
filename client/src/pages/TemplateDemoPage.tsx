import { useEffect } from "react";
import { Link, useRoute } from "wouter";
import {
  ArrowLeft, Truck, Coffee, Pizza, Martini, Wine, Beer, Fish, CakeSlice, CupSoda,
  Croissant, Sandwich, Beef, Cookie, Soup, Salad, UtensilsCrossed, Hotel, PartyPopper,
  Cake, Sparkles, Wheat, Grape, Cherry, Candy, Flame, Leaf, GlassWater, Popcorn,
  Milk, Drumstick, Carrot, CookingPot, IceCreamBowl, Donut, Ham, Apple, Citrus,
  Egg as Egg_, type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { MENU_PRESET_BY_ID, MENU_PRESET_FONTS } from "@/lib/menu-presets";
import { SHOWCASE_BY_SLUG } from "@/lib/template-showcase";
import { demoItemImage } from "@/lib/demo-item-images";

/** Her temanın demo logosu: referanslardaki çizgi-tarz (line-art) illüstrasyon karşılığı. */
const PRESET_ICONS: Record<string, LucideIcon> = {
  "food-truck": Truck, "cin-restorani": Soup, kore: CookingPot, meksika: Flame,
  pizza: Pizza, ramen: Soup, sushi: Fish, hint: CookingPot, tay: Soup,
  italyan: Pizza, barbeku: Beef, kebapci: Drumstick, deniz: Fish, vegan: Leaf,
  cafe: Coffee, kahve: Coffee, cocktailbar: Martini, icecek: CupSoda, sarap: Wine,
  birahane: Beer, pub: Beer, "gastro-pub": Beef, nargile: Sparkles, firin: Croissant,
  dondurma: IceCreamBowl, "dondurma-kamyonu": Truck, otel: Hotel, dugun: Cake,
  burger: Sandwich, kahvalti: Egg_, tatli: CakeSlice, tatlici: Donut,
  yilbasi: PartyPopper, hasat: Wheat, "gunun-ozeli": Sparkles, modern: UtensilsCrossed,
  catering: Popcorn, // catering için sepet hissi
};

/**
 * Şablon vitrininin canlı örnek menüsü: /sablon-demo/:slug
 * Veritabanına yazmadan, şablonun marka stilleriyle örnek bir menü çizer.
 * Gerçek işletme menüsü /p/:restoran adresinde yayınlanır.
 */
export default function TemplateDemoPage() {
  const [, params] = useRoute("/sablon-demo/:slug");
  const t = params?.slug ? SHOWCASE_BY_SLUG[params.slug] : undefined;
  const preset = t ? MENU_PRESET_BY_ID[t.presetId] : undefined;
  const ps = preset?.style;

  useEffect(() => {
    if (t) document.title = `Örnek Menü · ${t.name} | MakeTheMenu`;
    return () => { document.title = "MakeTheMenu"; };
  }, [t]);

  if (!t || !preset || !ps) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Örnek menü bulunamadı</h1>
          <Link href="/sablonlar" className="mt-6 inline-block">
            <Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4" />Tüm şablonlar</Button>
          </Link>
        </div>
      </div>
    );
  }

  const accent = ps.accent;

  return (
    <div className="min-h-screen" style={{ backgroundColor: ps.bg, color: ps.text }} data-testid="template-demo">
      <div className="mx-auto max-w-2xl px-4 pt-14 pb-4 text-center sm:px-6 sm:pt-20">
        <div className="flex justify-center py-8">
          {(() => {
            const Icon = PRESET_ICONS[preset.id] || UtensilsCrossed;
            return <Icon size={150} strokeWidth={0.9} style={{ color: accent }} aria-hidden />;
          })()}
        </div>
        <h1
          className="break-words text-2xl font-bold tracking-wide sm:text-4xl"
          style={{
            fontFamily: MENU_PRESET_FONTS[ps.logoFont],
            textTransform: ps.logoUpper ? "uppercase" : undefined,
            fontStyle: ps.logoItalic ? "italic" : undefined,
            color: accent,
          }}
        >
          {preset.logo}
        </h1>
        <p className="mt-1 text-[11px] uppercase" style={{ color: ps.muted, letterSpacing: "0.25em", fontFamily: MENU_PRESET_FONTS.sans }}>
          {preset.tagline}
        </p>
      </div>

      <div className="mx-auto max-w-2xl px-4 pb-20 sm:px-6">
        {preset.sectionTitles.map((title, i) => {
          const section = preset.items.slice(i * 3, i * 3 + 3);
          return (
          <section key={i} className={i === 0 ? "mt-8" : "mt-16"} aria-labelledby={`demo-cat-${i}`}>
            <h2
              className="pb-3 text-[28px] font-bold leading-none"
              style={{
                color: ps.sectionTitleColor || accent,
                fontFamily: MENU_PRESET_FONTS[ps.headingFont],
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              <span className="inline-block" style={{ transform: "scaleX(1.22)", transformOrigin: "left" }}>
                {title}
              </span>
            </h2>
            <div>
              {section.map((item, j) => (
                <div key={item.name} className="-mx-4 px-4 py-6 transition-colors first:pt-4 hover:bg-black/[0.03]">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <h3 className="text-[15px] font-semibold leading-5" style={{ color: ps.itemColor || ps.text }}>
                        {item.name}
                      </h3>
                      {item.desc && (
                        <p className="line-clamp-3 text-[13px] leading-snug" style={{ color: ps.muted, opacity: 0.72 }}>
                          {item.desc}
                        </p>
                      )}
                      <p className="text-sm font-medium" style={{ color: ps.itemColor || ps.text }}>
                        {item.price}₺
                      </p>
                    </div>
                    <div
                      className="aspect-video w-2/5 shrink-0 overflow-hidden bg-neutral-100"
                      style={{ borderRadius: Math.min(preset.menuRadius, 6) }}
                    >
                      <img
                        src={demoItemImage(item.name, preset.category, j)}
                        alt={item.name}
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
          );
        })}

        <div className="mt-16 rounded-2xl border p-6 text-center" style={{ borderColor: `${ps.muted}44` }}>
          <p className="text-sm" style={{ color: ps.muted }}>
            Bu bir tasarım örneğidir. MakeTheMenu ile kendi menünüzü 2 dakikada oluşturun, QR koduyla masalara koyun.
          </p>
          <Link href="/kayit" className="mt-4 inline-block">
            <Button size="lg" className="h-12 text-base" style={{ backgroundColor: accent, color: "#fff" }} data-testid="demo-cta">
              Kendi Menünü Oluştur
            </Button>
          </Link>
          <div className="mt-4">
            <Link href={`/sablonlar/${t.slug}`} className="text-xs underline" style={{ color: ps.muted }}>
              Bu şablonun detayına dön
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
