import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function SuccessStoriesPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/20 to-white/0 dark:to-transparent pointer-events-none" />
        <div className="site-container text-center pt-32 relative z-10">
          <h1 className="text-5xl md:text-6xl font-display font-bold mb-6">
            Müşteri <span className="text-primary">Hikayeleri</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            makethemenu ile başarıya ulaşan işletmelerin gerçek deneyimleri ve sonuçları.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="site-container">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: "Lezzet Durağı", city: "İstanbul", result: "%32 daha hızlı servis", tag: "Restoran" },
              { name: "Kahve Zamanı", city: "İzmir", result: "%18 gelir artışı", tag: "Kafe" },
              { name: "Pizza Ustası", city: "Ankara", result: "%27 daha az hata", tag: "Fast Food" }
            ].map((s, i) => (
              <Card key={i}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{s.name}</CardTitle>
                    <Badge variant="outline">{s.tag}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  <div className="mb-2">{s.city}</div>
                  <div className="font-medium text-foreground">{s.result}</div>
                  <p className="mt-2">Siparişten mutfağa, kasadan rapora kadar uçtan uca akış ile operasyonel verimlilik artırıldı.</p>
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
