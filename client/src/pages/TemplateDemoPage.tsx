import { useEffect, useState } from "react";
import { Link, useRoute } from "wouter";
import { ArrowLeft, X, Vegan } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MENU_PRESET_BY_ID, MENU_PRESET_FONTS } from "@/lib/menu-presets";
import { SHOWCASE_BY_SLUG } from "@/lib/template-showcase";

/**
 * Şablon vitrininin canlı örnek menüsü: /sablon-demo/:slug
 * Veritabanına yazmadan, şablonun marka stilleriyle örnek bir menü çizer.
 * Gerçek işletme menüsü /p/:restoran adresinde yayınlanır.
 */

/** Hex rengin brightness'ına göre beyaz ya da siyah yazı rengi döndür (WCAG contrast). */
function getContrastColor(hexColor: string): string {
  const hex = hexColor.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 128 ? "#000000" : "#ffffff";
}

export default function TemplateDemoPage() {
  const [, params] = useRoute("/sablon-demo/:slug");
  const t = params?.slug ? SHOWCASE_BY_SLUG[params.slug] : undefined;
  const preset = t ? MENU_PRESET_BY_ID[t.presetId] : undefined;
  const ps = preset?.style;
  const [selected, setSelected] = useState<any>(null);

  useEffect(() => {
    if (t && preset) document.title = `${preset.logo} • ${t.name.replace(/ Menü Şablonu$/, "")} • MakeTheMenu`;
    return () => { document.title = "MakeTheMenu"; };
  }, [t, preset]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelected(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

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

  const itemFont = ps.itemFont ? MENU_PRESET_FONTS[ps.itemFont] : undefined;
  return (
    <main className="min-h-screen p-4" style={{ backgroundColor: ps.bg, color: ps.text }} data-testid="template-demo">
      <div className="mx-auto flex min-h-screen max-w-2xl flex-col">
        <div className="flex justify-center py-10">
          {preset.logoImage ? (
            <img src={preset.logoImage} alt="Menu logo" className="h-auto" style={{ maxHeight: preset.logoHeight ?? 164 }} />
          ) : (
            <h1
              className="break-words text-center text-3xl font-bold tracking-wide"
              style={{
                fontFamily: MENU_PRESET_FONTS[ps.logoFont],
                textTransform: ps.logoUpper ? "uppercase" : undefined,
                fontStyle: ps.logoItalic ? "italic" : undefined,
                color: accent,
              }}
            >
              {preset.logo}
            </h1>
          )}
        </div>

        {preset.sectionTitles.map((title, i) => {
          const half = Math.ceil(preset.items.length / preset.sectionTitles.length);
          const start = preset.sectionCounts
            ? preset.sectionCounts.slice(0, i).reduce((a, b) => a + b, 0)
            : i * half;
          const count = preset.sectionCounts ? preset.sectionCounts[i] : half;
          const section = preset.items.slice(start, start + count);
          return (
          <section key={i} className="py-4" aria-labelledby={`demo-cat-${i}`}>
            <h2
              className="pb-2 font-semibold"
              style={{
                color: ps.sectionTitleColor || accent,
                fontFamily: MENU_PRESET_FONTS[ps.headingFont],
                fontSize: ps.sectionTitleSize ?? 24,
              }}
            >
              {title}
            </h2>
            <div>
              {section.map((item) => {
                const hasImage = Boolean(item.image);
                const priceNum = ps.priceDecimals ? item.price.toFixed(2) : item.price;
                const priceLabel = item.priceLabel !== undefined
                  ? item.priceLabel
                  : preset.currency
                  ? `${preset.currency}${item.price.toFixed(2)}`
                  : `${priceNum}${item.priceSuffix !== undefined ? item.priceSuffix : (ps.priceSuffix ?? "₺")}`;
                return (
                <div key={item.name} className="-mx-4 px-4 py-3.5 transition-colors hover:bg-black/[0.02] cursor-pointer" onClick={() => setSelected(item)}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <h3 className="flex items-center gap-1.5 text-base font-semibold leading-5" style={{ color: ps.itemColor || ps.text, fontFamily: itemFont }}>
                        {item.name}
                        {item.isVegan && <Vegan className="size-3.5 shrink-0 text-green-500" aria-hidden="true" />}
                      </h3>
                      {item.desc && (
                        <p className="line-clamp-3 whitespace-pre-line text-sm" style={{ color: ps.muted, fontFamily: itemFont }}>
                          {item.desc}
                        </p>
                      )}
                      {hasImage && (
                        <div className="font-medium" style={{ color: ps.itemColor || ps.text, fontFamily: itemFont }}>
                          {priceLabel}
                        </div>
                      )}
                    </div>
                    {hasImage ? (
                      <div className="aspect-video w-2/5 shrink-0 overflow-hidden rounded-sm bg-neutral-100">
                        <img src={item.image} alt={item.name} loading="lazy" className="h-full w-full object-cover" />
                      </div>
                    ) : (
                      <div className="ml-4 font-medium" style={{ color: ps.itemColor || ps.text, fontFamily: itemFont }}>
                        {priceLabel}
                      </div>
                    )}
                  </div>
                </div>
                );
              })}
            </div>
          </section>
          );
        })}

        <div className="mt-10 rounded-2xl border p-6 text-center" style={{ borderColor: `${ps.muted}44` }}>
          <p className="text-sm" style={{ color: ps.muted }}>
            Bu bir tasarım örneğidir. MakeTheMenu ile kendi menünüzü 2 dakikada oluşturun, QR koduyla masalara koyun.
          </p>
          <Link href="/kayit" className="mt-4 inline-block">
            <Button size="lg" className="h-12 text-base" style={{ backgroundColor: accent, color: getContrastColor(accent) }} data-testid="demo-cta">
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

      {/* Product Drawer Overlay */}
      {selected && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 transition-opacity"
            onClick={() => setSelected(null)}
            onKeyDown={(e) => e.key === "Escape" && setSelected(null)}
            role="button"
            tabIndex={0}
          />
          <div className="fixed bottom-0 left-0 right-0 z-50 max-h-[80vh] overflow-y-auto rounded-t-lg border-t bg-background p-6 shadow-lg">
            <button
              onClick={() => setSelected(null)}
              className="absolute right-4 top-4 p-2 hover:bg-accent rounded-md transition-colors"
              aria-label="Kapat"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="mx-auto max-w-md">
              <h2 className="mb-2 flex items-center gap-1.5 text-2xl font-bold" style={{ color: ps.itemColor || ps.text, fontFamily: itemFont }}>
                {selected.name}
                {selected.isVegan && <Vegan className="size-4 shrink-0 text-green-500" aria-hidden="true" />}
              </h2>
              {selected.desc && (
                <p className="text-sm mb-4 whitespace-pre-line" style={{ color: ps.muted, fontFamily: itemFont }}>
                  {selected.desc}
                </p>
              )}
              <div className="text-lg font-semibold" style={{ color: ps.itemColor || ps.text, fontFamily: itemFont }}>
                {selected.priceLabel !== undefined
                  ? selected.priceLabel
                  : preset.currency
                  ? `${preset.currency}${selected.price.toFixed(2)}`
                  : `${ps.priceDecimals ? selected.price.toFixed(2) : selected.price}${selected.priceSuffix !== undefined ? selected.priceSuffix : (ps.priceSuffix ?? "₺")}`}
              </div>
            </div>
          </div>
        </>
      )}
    </main>
  );
}
