import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { BookOpen, HelpCircle, Settings, Shield } from "lucide-react";

export default function KnowledgeBasePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/20 to-white/0 dark:to-transparent pointer-events-none" />
        <div className="site-container text-center pt-32 relative z-10">
          <h1 className="text-5xl md:text-6xl font-display font-bold mb-6">
            Bilgi <span className="text-primary">Merkezi</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Sık sorulan sorular, başlangıç kılavuzları ve sorun giderme makaleleri.
          </p>
        </div>
      </section>
      


      <section className="py-16">
        <div className="site-container">
          <div className="max-w-xl mx-auto mb-8">
            <Input id="kb-search" name="search" type="search" placeholder="Arayın: ödeme, yazıcı, kurulum..." autoComplete="off" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><BookOpen className="w-5 h-5 text-primary" /> Başlangıç</CardTitle></CardHeader>
              <CardContent className="text-muted-foreground">Kurulum, ilk adımlar ve temel yapılandırma.</CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Settings className="w-5 h-5 text-primary" /> Entegrasyonlar</CardTitle></CardHeader>
              <CardContent className="text-muted-foreground">Ödeme, yazıcı ve üçüncü parti bağlantılar.</CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Shield className="w-5 h-5 text-primary" /> Güvenlik</CardTitle></CardHeader>
              <CardContent className="text-muted-foreground">Yetkilendirme, yedekleme ve erişim kontrolleri.</CardContent>
            </Card>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { t: "Ödeme sağlayıcılarını bağlama", c: "Ödeme entegrasyon adımları ve test modları" },
              { t: "Yazıcı ayarları", c: "Mutfak ve masa yazıcılarının yapılandırılması" },
              { t: "POS kısayolları", c: "Hızlı kullanım için pratik kısayollar" },
              { t: "Stok reçeteleri", c: "Ürün reçetesi oluşturma ve maliyetlendirme" },
            ].map((a, i) => (
              <Card key={i}>
                <CardHeader><CardTitle className="flex items-center gap-2"><HelpCircle className="w-5 h-5 text-primary" /> {a.t}</CardTitle></CardHeader>
                <CardContent className="text-muted-foreground">{a.c}</CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
