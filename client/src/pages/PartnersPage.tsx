import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useRoute } from "wouter";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Handshake, Megaphone, CheckCircle2 } from "lucide-react";

const PARTNER_TITLES: Record<string, string> = {
  "bayilik": "Bayilik",
  "kampanyalar": "Kampanyalar",
};

export default function PartnersPage() {
  const [, params] = useRoute("/is-ortakligi/:slug");
  const slug = params?.slug || "";
  const title = PARTNER_TITLES[slug] || "İş Ortaklığı";

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
            {title === "Bayilik" ? "Büyüyen ağımıza katılın ve birlikte kazanalım." : "Güncel kampanyalar ve avantajlı paketler."}
          </p>
        </div>
      </section>
      
      <section className="site-container py-16">
        <div className="mb-12">
          {title === "Bayilik" ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <Card>
                  <CardHeader><CardTitle className="flex items-center gap-2"><Handshake className="w-5 h-5 text-primary" /> İş Birliği</CardTitle></CardHeader>
                  <CardContent className="text-muted-foreground">Yerel pazarınızı biliyorsanız, sahada birlikte güçlenelim.</CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle className="flex items-center gap-2"><Megaphone className="w-5 h-5 text-primary" /> Pazarlama</CardTitle></CardHeader>
                  <CardContent className="text-muted-foreground">Hazır içerikler, sunumlar ve satış materyalleri sağlanır.</CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-primary" /> Eğitim</CardTitle></CardHeader>
                  <CardContent className="text-muted-foreground">Satış ve kurulum eğitimleriyle hızlı başlangıç.</CardContent>
                </Card>
              </div>
              <div className="text-center">
                <Button size="lg" className="px-8">Bayilik Başvurusu</Button>
              </div>
            </>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { title: "Yıllık Paket İndirimi", desc: "Yıllık ödemede %20 indirim" },
                { title: "Yeni Şube Desteği", desc: "Yeni açılan şubelere kurulum hediyesi" },
                { title: "Yaz Kampanyası", desc: "Sezonluk işletmelere avantajlı fiyatlar" }
              ].map((c, i) => (
                <Card key={i}>
                  <CardHeader><CardTitle>{c.title}</CardTitle></CardHeader>
                  <CardContent className="text-muted-foreground">{c.desc}</CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
