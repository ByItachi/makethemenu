import { Link } from "wouter";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SHOWCASE_TEMPLATES } from "@/lib/template-showcase";
import { useSeo } from "@/lib/seo";

export default function TemplatesPage() {
  useSeo({
    title: "Ücretsiz Dijital Menü Şablonları",
    description: `Mekanınıza uygun ${SHOWCASE_TEMPLATES.length} hazır dijital menü şablonu. Tamamı ücretsiz; tek tıkla menünüze uygulanır, dilediğiniz an değiştirebilirsiniz.`,
    path: "/sablonlar",
    breadcrumbs: [
      { name: "Ana Sayfa", path: "/" },
      { name: "Menü Şablonları", path: "/sablonlar" },
    ],
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/20 to-white/0 dark:to-transparent pointer-events-none" />
        <div className="site-container relative z-10">
          <div className="text-center pt-32 mb-12">
            <h1 className="text-4xl md:text-6xl font-display font-bold mb-6"><span>Ücretsiz Dijital </span><span className="text-primary">Menü Şablonları</span></h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Mekanınıza uygun {SHOWCASE_TEMPLATES.length} hazır şablondan birini seçin. Tamamı ücretsizdir,
              tek tıkla menünüze uygulanır ve istediğiniz zaman değiştirebilirsiniz.
            </p>
            <div className="mt-8">
              <Link href="/kayit">
                <Button size="lg">Ücretsiz Dene</Button>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-3 xl:grid-cols-4">
            {SHOWCASE_TEMPLATES.map((t) => (
              <Link key={t.slug} href={`/sablonlar/${t.slug}`} data-testid={`showcase-card-${t.slug}`} className="group block">
                <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-lg">
                  <div className="aspect-[4/5] overflow-hidden">
                    <img
                      src={t.image}
                      alt={`${t.name} — dijital menü tasarım örneği`}
                      loading="lazy"
                      className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                  </div>
                  <div className="flex flex-col items-center gap-3 p-4">
                    <div className="flex w-full items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h2 className="truncate text-sm font-medium sm:text-base">{t.name}</h2>
                        <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{t.desc}</p>
                      </div>
                      <Badge variant="secondary" className="shrink-0">Ücretsiz</Badge>
                    </div>
                    <span className="inline-flex h-10 w-full items-center justify-center whitespace-nowrap rounded-full border border-black/10 bg-white px-5 text-sm font-medium text-black transition-colors group-hover:bg-black group-hover:text-white">
                      Şablonu Gör
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
