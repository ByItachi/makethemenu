import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useRoute } from "wouter";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Rocket, Clock, Shield, Users, Sparkles } from "lucide-react";

const SOLUTION_TITLES: Record<string, string> = {
  "restoran": "Restoran Çözümü",
  "kafe": "Cafe Çözümü",
  "zincir": "Şubeli Restaurant & Cafe",
  "bulut-mutfak": "Bulut Mutfak",
  "fast-food": "Fast Food",
  "pizza": "Pizza Restaurant",
  "burger": "Burger Cafe & Restaurant",
  "otel": "Hotel Cafe & Restaurant",
  "sezonluk": "Sezonluk İşletmeler",
};

export default function SolutionsPage() {
  const [, params] = useRoute("/cozumler/:slug");
  const slug = params?.slug || "";
  const title = SOLUTION_TITLES[slug] || "Çözüm";

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
            {title} için optimize edilmiş akışlar, hız ve güvenlik. Daha hızlı servis, daha mutlu misafirler.
          </p>
        </div>
      </section>
      
      <section className="site-container py-16">
        <div className="mb-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Rocket className="w-5 h-5 text-primary" /> Hızlı Başlangıç</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">Dakikalar içinde kurulur. Var olan işleyişe dokunmadan adım adım geçiş.</CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Shield className="w-5 h-5 text-primary" /> Güvenli</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">Yetkilendirme, kayıt altına alma ve yedekleme ile güvenli mimari.</CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Sparkles className="w-5 h-5 text-primary" /> Esnek</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">İşletme tipine göre özelleştirilebilir ekranlar ve raporlar.</CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <Card>
              <CardHeader>
                <CardTitle>Öne Çıkanlar</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-muted-foreground">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-600" /> İşletme tipine özel sipariş akışları</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-600" /> Menü ve masa yönetiminde hız</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-600" /> Mutfak ekranı ve yazıcı entegrasyonları</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-600" /> Gerçek zamanlı raporlar</li>
                </ul>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>İş Sonuçları</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-primary/5 text-center">
                    <div className="text-2xl font-bold text-primary">%35</div>
                    <div className="text-xs text-muted-foreground">Daha hızlı servis</div>
                  </div>
                  <div className="p-4 rounded-xl bg-primary/5 text-center">
                    <div className="text-2xl font-bold text-primary">%20</div>
                    <div className="text-xs text-muted-foreground">Daha az hata</div>
                  </div>
                  <div className="p-4 rounded-xl bg-primary/5 text-center">
                    <div className="text-2xl font-bold text-primary">%18</div>
                    <div className="text-xs text-muted-foreground">Gelir artışı</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Clock className="w-5 h-5 text-primary" /> Siparişten Çıkışa</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">POS, mutfak ve ödeme adımlarında uçtan uca kesintisiz akış.</CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Users className="w-5 h-5 text-primary" /> Eğitim Gerektirmez</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">Basit arayüz ve rol bazlı yetkilerle hemen kullanmaya başlayın.</CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Sparkles className="w-5 h-5 text-primary" /> Esnek Raporlar</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">Gün, şube, kategori ve ürün bazında performans görünürlüğü.</CardContent>
            </Card>
          </div>

          <div className="text-center">
            <Button size="lg" className="px-8">Demo Talep Et</Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
