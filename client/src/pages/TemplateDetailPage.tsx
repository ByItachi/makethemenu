import { useEffect } from "react";
import { Link, useRoute } from "wouter";
import { Check, ArrowLeft, QrCode } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SHOWCASE_BY_SLUG, SHOWCASE_TEMPLATES } from "@/lib/template-showcase";

export default function TemplateDetailPage() {
  const [, params] = useRoute("/sablonlar/:slug");
  const t = params?.slug ? SHOWCASE_BY_SLUG[params.slug] : undefined;

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

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <section className="relative py-24">
        <div className="site-container relative z-10 pt-32">
          <Link href="/sablonlar" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Tüm şablonlar
          </Link>

          <div className="mt-8 grid items-start gap-10 lg:grid-cols-2">
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
              <img src={t.image} alt={`${t.name} tasarım örneği`} className="w-full object-cover" />
            </div>

            <div>
              <Badge variant="secondary" className="mb-4">Ücretsiz Şablon</Badge>
              <h1 className="text-3xl font-display font-bold sm:text-4xl lg:text-5xl">{t.name}</h1>
              <p className="mt-5 text-lg leading-relaxed text-muted-foreground">{t.desc}</p>

              <ul className="mt-8 space-y-3">
                {[
                  "Kolayca özelleştirilir",
                  "Link, QR, web sitesi ve sosyal medya ile paylaşılır",
                  "Güncellemeler saniyeler içinde yayına girer",
                  "Kendi markanıza göre uyarlanır",
                ].map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm sm:text-base">
                    <Check className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                <Link href="/kayit" className="sm:flex-1">
                  <Button size="lg" className="h-12 w-full text-base" data-testid="button-create-menu">Menü Oluştur</Button>
                </Link>
                <Link href={`/sablon-demo/${t.slug}`} className="sm:flex-1">
                  <Button size="lg" variant="outline" className="h-12 w-full text-base" data-testid="button-see-live">
                    <QrCode className="mr-2 h-5 w-5" /> Menüyü Canlı Gör
                  </Button>
                </Link>
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                Kredi kartı gerekmez · 14 gün ücretsiz deneme · Dilediğiniz an değiştirin
              </p>
            </div>
          </div>

          <div className="mt-24">
            <h2 className="text-2xl font-bold">Diğer şablonlar</h2>
            <div className="mt-6 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
              {others.map((o) => (
                <Link key={o.slug} href={`/sablonlar/${o.slug}`} className="group block">
                  <div className="overflow-hidden rounded-xl border border-border bg-card transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-lg">
                    <div className="aspect-[4/5] overflow-hidden">
                      <img src={o.image} alt={`${o.name} örneği`} loading="lazy" className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]" />
                    </div>
                    <p className="truncate p-3 text-sm font-medium">{o.name}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
