import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function ApiDocsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/20 to-white/0 dark:to-transparent pointer-events-none" />
        <div className="site-container text-center pt-32 relative z-10">
          <h1 className="text-5xl md:text-6xl font-display font-bold mb-6">
            API <span className="text-primary">Dokümantasyonu</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Entegrasyonlarınız için endpoint örnekleri, kimlik doğrulama ve kullanım kılavuzları.
          </p>
        </div>
      </section>
      


      <section className="py-16">
        <div className="site-container">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader><CardTitle>Kimlik Doğrulama</CardTitle></CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Bearer token ile Authorization başlığı kullanın. Token’ı yönetim panelinden üretin.
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Ortamlar</CardTitle></CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Test: api.sandbox.restapos.com, Canlı: api.restopos.com. Her iki ortam için ayrı anahtar kullanın.
              </CardContent>
            </Card>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { m: "GET", p: "/api/orders", d: "Sipariş listesini döner" },
              { m: "POST", p: "/api/orders", d: "Yeni sipariş oluşturur" },
              { m: "GET", p: "/api/products", d: "Ürün listesini döner" },
              { m: "POST", p: "/api/payments", d: "Ödeme başlatır" }
            ].map((e, i) => (
              <Card key={i}>
                <CardHeader className="flex items-center justify-between">
                  <CardTitle className="text-base">{e.p}</CardTitle>
                  <Badge variant="outline">{e.m}</Badge>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">{e.d}</CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
