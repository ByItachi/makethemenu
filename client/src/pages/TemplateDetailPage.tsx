import { useEffect } from "react";
import { Link, useRoute } from "wouter";
import {
  ArrowLeft, PencilLine, Share2, Globe, PencilRuler,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SHOWCASE_BY_SLUG, SHOWCASE_TEMPLATES } from "@/lib/template-showcase";
import { MENU_PRESET_BY_ID } from "@/lib/menu-presets";

/**
 * mmmmenu.app/templates/:slug tarzı şablon detay sayfası:
 * solda geri link + 48px başlık + açıklama + ikonlu özellik listesi +
 * "Menü Oluştur" (dolgu, yuvarlak) ve "Menüyü Canlı Gör" (nötr, yuvarlak) butonları;
 * sağda temanın zemin rengiyle çerçeveli telefon-long screenshot vitrini.
 */
export default function TemplateDetailPage() {
  const [, params] = useRoute("/sablonlar/:slug");
  const t = params?.slug ? SHOWCASE_BY_SLUG[params.slug] : undefined;
  const preset = t ? MENU_PRESET_BY_ID[t.presetId] : undefined;
  const accent = preset?.style.bg || "#171717";
  const frameBg = `color-mix(in oklab, ${accent} 86%, black)`;

  useEffect(() => {
    if (t) document.title = `${t.name} | MakeTheMenu`;
    return () => { document.title = "MakeTheMenu"; };
  }, [t]);

  if (!t) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        <div className="site-container py-40 text-center">
          <h1 className="text-3xl font-bold">Şablon bulunamadı</h1>
          <Link href="/sablonlar" className="mt-6 inline-block">
            <Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4" />Tüm şablonlar</Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const others = SHOWCASE_TEMPLATES.filter((x) => x.slug !== t.slug).slice(0, 8);

  const features = [
    { icon: PencilLine, text: "Kolayca özelleştirilir" },
    { icon: Share2, text: "Link, QR, web sitesi ve sosyal medya ile paylaşılır" },
    { icon: Globe, text: "Güncellemeler saniyeler içinde yayına girer" },
    { icon: PencilRuler, text: "Kendi markanıza göre uyarlanır" },
  ];

  return (
    <div className="min-h-screen bg-white text-black">
      <div className="bg-white text-black">
      <Navbar />
      <section className="pt-56 pb-20">
        <div className="site-container flex w-full flex-col">
          <div className="flex flex-row items-start gap-14 max-lg:flex-col">
            <div className="flex w-full flex-col items-start gap-8">
              <Link
                href="/sablonlar"
                className="inline-flex h-8 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl border border-black/5 bg-white px-4 text-sm font-medium text-black/60 transition-all hover:border-black/15 hover:bg-transparent hover:text-black"
              >
                <ArrowLeft className="h-4 w-4 opacity-50" /> Şablonlar
              </Link>

              <div className="flex max-w-[540px] flex-col gap-4">
                <h1 className="text-[36px] font-semibold leading-none tracking-[-0.05em] text-black sm:text-[48px]">
                  {t.name}
                </h1>
                <p className="max-w-[500px] text-base leading-relaxed tracking-[-0.025em] text-black/60 sm:text-[18px]">
                  {t.desc}
                </p>
              </div>

              <ul className="flex flex-col gap-5">
                {features.map((f) => (
                  <li key={f.text}>
                    <div className="flex items-center gap-2">
                      <f.icon className="h-[18px] w-[18px] shrink-0" aria-hidden />
                      <h3 className="text-base font-medium text-black">{f.text}</h3>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="flex items-center gap-2 max-md:w-full max-md:flex-col max-md:items-stretch">
                <Link href="/kayit" className="inline-flex" data-testid="button-create-menu">
                  <Button className="h-12 rounded-full px-7 text-base">Menü Oluştur</Button>
                </Link>
                <Link href={`/sablon-demo/${t.slug}`} className="inline-flex" data-testid="button-see-live">
                  <Button className="h-12 rounded-full bg-neutral-900/5 px-7 text-base text-black hover:bg-neutral-900/10">
                    Menüyü Canlı Gör
                  </Button>
                </Link>
              </div>
            </div>

            <div className="w-full">
              <div
                className="relative flex h-[480px] justify-center overflow-hidden rounded-2xl px-6 pt-8 ring-1 ring-black/5 md:h-[600px] md:px-10 md:pt-12"
                style={{ backgroundColor: frameBg }}
              >
                <img
                  src={t.image}
                  alt={`${t.name} tasarım örneği`}
                  className="h-auto w-full max-w-[312px] self-start rounded-t-2xl shadow-[0_24px_64px_-12px_rgb(0_0_0/0.35)] ring-1 ring-white/10"
                  loading="eager"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="overflow-hidden bg-white pb-20 pt-4">
        <div className="site-container flex w-full flex-col">
          <div className="flex flex-col items-center gap-5">
            <Badge className="rounded-full border-transparent bg-black/5 px-1.5 text-sm text-black hover:bg-black/5">
              Şablonlar
            </Badge>
            <h2 className="text-center text-[30px] font-semibold leading-[1.1] tracking-[-0.05em] sm:text-[36px]">
              Her işletme için restoran menü şablonları
            </h2>
            <p className="max-w-[540px] text-center text-base tracking-[-0.025em] text-black/60 sm:text-[18px]">
              Menünü çevrimiçi oluştur, markana göre uyarla ve link ya da QR kod ile paylaş.
            </p>
          </div>
          <div className="mt-12 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {others.map((o) => (
              <Link key={o.slug} href={`/sablonlar/${o.slug}`} className="group flex flex-1 flex-col items-center gap-3">
                <div className="relative flex flex-col items-center justify-end overflow-hidden rounded-xl bg-neutral-900/5 px-5 pt-5">
                  <div className="relative z-20 max-h-[450px] w-full max-w-[280px] overflow-hidden rounded-t-xl">
                    <img
                      src={o.image}
                      alt={`${o.name} örneği`}
                      loading="lazy"
                      className="h-[470px] w-full object-cover object-top ring-1 ring-black/5 transition-transform duration-300 group-hover:scale-[1.02]"
                    />
                  </div>
                </div>
                <h3 className="truncate text-base font-medium text-black">{o.name}</h3>
                <span className="inline-flex h-10 shrink-0 items-center justify-center whitespace-nowrap rounded-full border border-black/10 bg-white px-5 text-sm font-medium text-black transition-colors group-hover:bg-black group-hover:text-white">
                  Şablonu Gör
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>
      </div>
      <Footer />
    </div>
  );
}
