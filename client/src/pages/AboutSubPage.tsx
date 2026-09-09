import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useRoute } from "wouter";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Award, Users, Target, Heart } from "lucide-react";

const ABOUT_TITLES: Record<string, string> = {
  "sirket": "Şirketimiz",
  "musteriler": "Müşterilerimiz",
};

export default function AboutSubPage() {
  const [, params] = useRoute("/hakkimizda/:slug");
  const slug = params?.slug || "";
  const title = ABOUT_TITLES[slug] || "Hakkımızda";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/20 to-white/0 dark:to-transparent pointer-events-none" />
        <div className="site-container text-center pt-32 relative z-10">
          <h1 className="text-5xl md:text-6xl font-display font-bold mb-6">
            {title.split(' ').map((word, i, arr) => 
              i === arr.length - 1 ? <span key={i} className="text-primary">{word}</span> : <span key={i}>{word} </span>
            )}
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {slug === "sirket" ? "Vizyonumuz, misyonumuz ve değerlerimiz." : "Gerçek işletmelerin deneyimleri ve logoları."}
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="site-container">
          {slug === "sirket" ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Target className="w-5 h-5 text-primary" /> Vizyon</CardTitle></CardHeader>
                <CardContent className="text-muted-foreground">Her ölçekte işletme için erişilebilir ve akıllı POS deneyimi.</CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Heart className="w-5 h-5 text-primary" /> Değerler</CardTitle></CardHeader>
                <CardContent className="text-muted-foreground">Şeffaflık, hız, güven ve kullanıcı odaklılık.</CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Award className="w-5 h-5 text-primary" /> Başarılar</CardTitle></CardHeader>
                <CardContent className="text-muted-foreground">Yüksek müşteri memnuniyeti ve hızlı kurulum süreleri.</CardContent>
              </Card>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-12">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="p-6 rounded-xl border border-border bg-card flex flex-col items-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <Users className="w-5 h-5" />
                  </div>
                  <div className="text-sm font-medium">İşletme #{i + 1}</div>
                  <div className="text-xs text-muted-foreground">Şehir</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
