import { useEffect } from "react";
import { Link, useRoute } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MENU_PRESET_BY_ID, MENU_PRESET_FONTS } from "@/lib/menu-presets";
import { SHOWCASE_BY_SLUG } from "@/lib/template-showcase";
import { demoItemImage } from "@/lib/demo-item-images";

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
      <div className="mx-auto max-w-2xl px-4 pt-12 pb-6 text-center sm:px-6 sm:pt-16">
        <p className="mb-2 text-[11px] uppercase" style={{ color: accent, letterSpacing: "0.3em", fontFamily: MENU_PRESET_FONTS.sans }}>
          {preset.emoji} {preset.name} · ÖRNEK MENÜ
        </p>
        <div className="mx-auto mb-3 h-1.5 w-16 rounded-full" style={{ backgroundColor: accent }} />
        <h1
          className="text-3xl font-bold break-words sm:text-5xl"
          style={{
            fontFamily: MENU_PRESET_FONTS[ps.logoFont],
            textTransform: ps.logoUpper ? "uppercase" : undefined,
            fontStyle: ps.logoItalic ? "italic" : undefined,
            color: accent,
          }}
        >
          {preset.logo}
        </h1>
        <p className="mt-2 text-sm sm:text-base" style={{ color: ps.muted, fontFamily: MENU_PRESET_FONTS[ps.headingFont] }}>
          {preset.tagline}
        </p>
      </div>

      <div className="mx-auto max-w-2xl px-4 pb-16 sm:px-6">
        {preset.sectionTitles.map((title, i) => {
          const section = preset.items.slice(i * 3, i * 3 + 3);
          return (
          <section key={i} className="mt-6" aria-labelledby={`demo-cat-${i}`}>
            <h2
              className="pb-2 text-2xl font-semibold"
              style={{
                color: accent,
                fontSize: 24,
                fontFamily: MENU_PRESET_FONTS[ps.headingFont],
                textTransform: "uppercase",
                letterSpacing: "0.02em",
              }}
            >
              {title}
            </h2>
            <div>
              {section.map((item, j) => (
                <div key={item.name} className="-mx-4 px-4 py-3.5 transition-colors hover:bg-black/[0.03]">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <h3 className="flex items-center gap-1.5 text-base font-semibold leading-5" style={{ color: ps.text }}>
                        {item.name}
                      </h3>
                      {item.desc && (
                        <p className="line-clamp-3 text-sm" style={{ color: ps.muted, opacity: 0.75 }}>
                          {item.desc}
                        </p>
                      )}
                      <p className="font-medium" style={{ color: ps.text }}>
                        {item.price}₺
                      </p>
                    </div>
                    <div
                      className="aspect-video w-2/5 shrink-0 overflow-hidden bg-neutral-100"
                      style={{ borderRadius: Math.max(2, Math.min(preset.menuRadius, 8)) }}
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
