import { useState } from "react";
import { Link } from "wouter";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CATEGORIES, PRESETS, TemplatePreview } from "@/pages/restoran/online/ReadyTemplatesGallery";

export default function TemplatesPage() {
  const [category, setCategory] = useState("Tümü");
  const visible = category === "Tümü" ? PRESETS : PRESETS.filter((p) => p.category === category);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/20 to-white/0 dark:to-transparent pointer-events-none" />
        <div className="site-container relative z-10">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-display font-bold mb-6">Ücretsiz Dijital Menü Şablonları</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Mutfak ve mekan türünüze uygun {PRESETS.length} hazır şablondan birini seçin. Tamamı ücretsizdir,
              tek tıkla menünüze uygulanır ve istediğiniz zaman değiştirebilirsiniz.
            </p>
            <div className="mt-8">
              <Link href="/kayit">
                <Button size="lg">Ücretsiz Dene</Button>
              </Link>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-2 mb-10">
            {CATEGORIES.map((c) => (
              <Button key={c} size="sm" variant={category === c ? "default" : "outline"} onClick={() => setCategory(c)}>
                {c}
              </Button>
            ))}
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((p) => (
              <Card key={p.id} data-testid={`public-template-card-${p.id}`}>
                <CardContent className="p-4 space-y-3">
                  <TemplatePreview preset={p} />
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-sm">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.category}</p>
                    </div>
                    <Badge variant="secondary" className="shrink-0">Ücretsiz</Badge>
                  </div>
                  <Link href="/kayit">
                    <Button size="sm" className="w-full">Bu şablonu kullan</Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
