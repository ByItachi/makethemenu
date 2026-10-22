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
    if (t && preset) document.title = `${preset.logo} • ${t.name.replace(/ Menü Şablonu$/, "")} • MakeTheMenu`;
    return () => { document.title = "MakeTheMenu"; };
  }, [t, preset]);

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
          const section = preset.items.slice(i * 3, i * 3 + 3);
          return (
          <section key={i} className="py-4" aria-labelledby={`demo-cat-${i}`}>
            <h2
              className="pb-2 font-semibold"
              style={{
                color: ps.sectionTitleColor || accent,
                fontFamily: MENU_PRESET_FONTS[ps.headingFont],
                fontSize: 24,
              }}
            >
              {title}
            </h2>
            <div>
              {section.map((item, j) => (
                <div key={item.name} className="-mx-4 px-4 py-3.5 transition-colors hover:bg-black/[0.02]">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <h3 className="text-base font-semibold leading-5" style={{ color: ps.itemColor || ps.text }}>
                        {item.name}
                      </h3>
                      {item.desc && (
                        <p className="line-clamp-3 whitespace-pre-line text-sm" style={{ color: ps.muted }}>
                          {item.desc}
                        </p>
                      )}
                      <div className="font-medium" style={{ color: ps.itemColor || ps.text }}>
                        {item.price}₺
                      </div>
                    </div>
                    <div className="aspect-video w-2/5 shrink-0 overflow-hidden rounded-sm bg-neutral-100">
                      <img
                        src={item.image || demoItemImage(item.name, preset.category, j)}
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

        <div className="mt-10 rounded-2xl border p-6 text-center" style={{ borderColor: `${ps.muted}44` }}>
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
    </main>
  );
}
