import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useRoute } from "wouter";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CheckCircle2, PlugZap, Shield, Zap, Layers, Settings2 } from "lucide-react";

const FEATURE_TITLES: Record<string, string> = {
  "dijital-menu": "Dijital Menü",
  "stok-yonetimi": "Stok ve Maliyet Yönetimi",
  "mutfak": "Mutfak Yönetimi",
  "entegrasyonlar": "Gelişmiş Entegrasyonlar",
  "e-fatura": "E-Dönüşüm Entegrasyonu",
  "zincir-yonetimi": "Zincir İşletme Yönetimi",
  "kurye": "Kurye Takip",
  "musteri-yonetimi": "Cari Müşteri Yönetimi",
  "raporlama": "Raporlama ve Analiz",
  "donanim": "Donanım",
  "su-dagitim": "Su Dağıtım ve Damacana Sistemi",
  "hali-yikama": "Halı Yıkama Sistemi",
};

export default function FeatureDetailPage() {
  const [, params] = useRoute("/ozellikler/:slug");
  const slug = params?.slug || "";
  const title = FEATURE_TITLES[slug] || "Özellik";

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
            {title} ile süreçlerinizi hızlandırın, maliyetleri düşürün ve ölçülebilir sonuçlar elde edin.
          </p>
        </div>
      </section>
      
      {slug === 'entegrasyonlar' && (
        <section className="site-container py-16 bg-muted/30">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-display font-bold mb-4">
              <span className="text-primary">Entegrasyon</span> Mağazamız
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Makethemenu, işinizi kolaylaştırmak için onlarca popüler platformla sorunsuz bir şekilde entegre çalışır.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            <Card className="flex items-center justify-center p-6"><h3 className="text-lg font-semibold text-center">Yemeksepeti</h3></Card>
            <Card className="flex items-center justify-center p-6"><h3 className="text-lg font-semibold text-center">GetirYemek</h3></Card>
            <Card className="flex items-center justify-center p-6"><h3 className="text-lg font-semibold text-center">Trendyol Yemek</h3></Card>
            <Card className="flex items-center justify-center p-6"><h3 className="text-lg font-semibold text-center">Migros Yemek</h3></Card>
            <Card className="flex items-center justify-center p-6"><h3 className="text-lg font-semibold text-center">iyzico</h3></Card>
            <Card className="flex items-center justify-center p-6"><h3 className="text-lg font-semibold text-center">PayTR</h3></Card>
            <Card className="flex items-center justify-center p-6"><h3 className="text-lg font-semibold text-center">Logo Yazılım</h3></Card>
            <Card className="flex items-center justify-center p-6"><h3 className="text-lg font-semibold text-center">Mikro Yazılım</h3></Card>
            <Card className="flex items-center justify-center p-6"><h3 className="text-lg font-semibold text-center">Paraşüt</h3></Card>
            <Card className="flex items-center justify-center p-6"><h3 className="text-lg font-semibold text-center">Vega Yazılım</h3></Card>
            <Card className="flex items-center justify-center p-6"><h3 className="text-lg font-semibold text-center">Ingenico</h3></Card>
            <Card className="flex items-center justify-center p-6"><h3 className="text-lg font-semibold text-center">Verifone</h3></Card>
          </div>
        </section>
      )}
      
      <section className="site-container py-16">
        <div className="mb-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Zap className="w-5 h-5 text-primary" /> Performans</CardTitle></CardHeader>
              <CardContent className="text-muted-foreground">Hafif arayüz ve optimize edilmiş akışlarla akıcı deneyim.</CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Shield className="w-5 h-5 text-primary" /> Güvenlik</CardTitle></CardHeader>
              <CardContent className="text-muted-foreground">Rol bazlı yetkilendirme ve kayıt izleme.</CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><PlugZap className="w-5 h-5 text-primary" /> Entegrasyon</CardTitle></CardHeader>
              <CardContent className="text-muted-foreground">Ödeme, yazıcı ve mutfak cihazı entegrasyonlarıyla tam uyum.</CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <Card>
              <CardHeader><CardTitle>Özellik Seti</CardTitle></CardHeader>
              <CardContent>
                <ul className="space-y-3 text-muted-foreground">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-600" /> Kullanıcı dostu arayüz</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-600" /> Esnek raporlama ve filtreler</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-600" /> Bulut yedekleme</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-600" /> Offline çalışma senaryoları</li>
                </ul>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Nasıl Çalışır?</CardTitle></CardHeader>
              <CardContent>
                <ol className="list-decimal pl-5 space-y-2 text-muted-foreground">
                  <li>Kurulum ve hızlı ayarlar</li>
                  <li>Yetkilendirme ve kullanıcı rolü tanımları</li>
                  <li>Operasyon akışlarının devreye alınması</li>
                  <li>Raporlama ve optimizasyon</li>
                </ol>
              </CardContent>
            </Card>
          </div>

          <Card className="mb-12">
            <CardHeader><CardTitle className="flex items-center gap-2"><Layers className="w-5 h-5 text-primary" /> Sık Sorulanlar</CardTitle></CardHeader>
            <CardContent>
              <Accordion type="single" collapsible>
                <AccordionItem value="a1">
                  <AccordionTrigger>Lisans modeliniz nedir?</AccordionTrigger>
                  <AccordionContent>Sabit aylık ücret ve isteğe bağlı eklentilerle ölçeklenebilir yapı.</AccordionContent>
                </AccordionItem>
                <AccordionItem value="a2">
                  <AccordionTrigger>Verilerim güvende mi?</AccordionTrigger>
                  <AccordionContent>Şifreli bağlantı, erişim logları ve yedeklemelerle koruma sağlanır.</AccordionContent>
                </AccordionItem>
                <AccordionItem value="a3">
                  <AccordionTrigger>Hangi cihazları destekliyor?</AccordionTrigger>
                  <AccordionContent>Modern tarayıcılar ve dokunmatik ekranlı cihazlarla uyumludur.</AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
}
