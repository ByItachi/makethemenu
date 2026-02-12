import { 
  Navbar 
} from "@/components/Navbar";
import { 
  UtensilsCrossed, 
  BarChart3, 
  Users, 
  LayoutDashboard, 
  CheckCircle2, 
  ArrowRight,
  Globe,
  Zap,
  Shield,
  Smartphone
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const contactSchema = z.object({
  name: z.string().min(2, "Ad en az 2 karakter olmalıdır"),
  email: z.string().email("Geçerli bir e-posta adresi giriniz"),
  subject: z.string().min(2, "Konu en az 2 karakter olmalıdır"),
  message: z.string().min(10, "Mesaj en az 10 karakter olmalıdır"),
});

type ContactForm = z.infer<typeof contactSchema>;

export default function LandingPage() {
  const { toast } = useToast();
  const form = useForm<ContactForm>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      email: "",
      subject: "",
      message: "",
    },
  });

  const onSubmit = async (data: ContactForm) => {
    try {
      await apiRequest("POST", "/api/contact", data);
      toast({
        title: "Mesaj Gönderildi",
        description: "En kısa sürede size dönüş yapacağız.",
      });
      form.reset();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Mesaj gönderilirken bir hata oluştu.",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground scroll-smooth">
      <Navbar />
      
      {/* Hero Section */}
      <section id="home" className="relative pt-32 pb-20 px-6 overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-10">
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-blue-500 rounded-full blur-[120px]" />
        </div>

        <div className="container mx-auto text-center relative z-10">
          <h1 className="text-5xl md:text-7xl font-display font-bold mb-6 animate-in">
            Restoranınızı <span className="text-primary">Profesyonelce</span> Yönetin
          </h1>
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto text-balance">
            Modern POS sistemimizle siparişleri hızlandırın, masaları yönetin ve işletmenizi büyütün. 
            Her ölçekteki restoran için hepsi bir arada çözüm.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="h-12 px-8 text-lg font-medium group" onClick={() => window.location.href = "/login"}>
              Hemen Başlayın
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button size="lg" variant="outline" className="h-12 px-8 text-lg font-medium">
              Demo İzle
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-6 bg-card/50">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-display font-bold mb-4">Gelişmiş Özellikler</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              İşletmenizi dijitalleştirin ve verimliliğinizi artırın.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard 
              icon={LayoutDashboard}
              title="Masa Yönetimi"
              description="Kat planınızı oluşturun, masaların doluluk durumunu anlık takip edin."
            />
            <FeatureCard 
              icon={UtensilsCrossed}
              title="Hızlı POS"
              description="Saniyeler içinde sipariş alın, mutfakla anlık iletişim kurun."
            />
            <FeatureCard 
              icon={BarChart3}
              title="Gelişmiş Raporlar"
              description="Satışlarınızı, en çok tercih edilen ürünleri ve cironuzu analiz edin."
            />
            <FeatureCard 
              icon={Users}
              title="Müşteri Sadakati"
              description="Müşteri alışkanlıklarını öğrenin ve onlara özel teklifler sunun."
            />
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 px-6">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-display font-bold mb-4">Esnek Fiyatlandırma</h2>
            <p className="text-muted-foreground">Her işletmeye uygun paket seçenekleri.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <PricingCard 
              title="Başlangıç"
              price="299"
              features={["5 Masa", "Temel Raporlar", "Mobil Destek"]}
            />
            <PricingCard 
              title="Profesyonel"
              price="599"
              highlighted={true}
              features={["Sınırsız Masa", "Gelişmiş Analizler", "Stok Takibi", "7/24 Destek"]}
            />
            <PricingCard 
              title="Kurumsal"
              price="999"
              features={["Çoklu Şube", "API Erişimi", "Özel Entegrasyonlar", "Atanmış Danışman"]}
            />
          </div>
        </div>
      </section>

      {/* Integrations Section */}
      <section id="integrations" className="py-24 px-6 bg-secondary/30">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-display font-bold mb-12">Tam Entegrasyon</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 items-center opacity-70">
            <IntegrationItem icon={Globe} name="E-Fatura" />
            <IntegrationItem icon={Zap} name="YemekSepeti" />
            <IntegrationItem icon={Shield} name="Getir" />
            <IntegrationItem icon={Smartphone} name="Trendyol" />
            <IntegrationItem icon={Globe} name="Ödeme Sistemleri" />
            <IntegrationItem icon={Shield} name="Bulut Yedekleme" />
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-24 px-6">
        <div className="container mx-auto flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1">
            <h2 className="text-3xl md:text-5xl font-display font-bold mb-6">Biz Kimiz?</h2>
            <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
              RestoPOS olarak, yeme-içme sektöründeki işletmelerin dijital dönüşümüne öncülük ediyoruz. 
              Modern teknolojileri restoranların günlük operasyonlarına entegre ederek hem işletme sahiplerinin 
              yükünü hafifletiyor hem de müşteri memnuniyetini en üst düzeye çıkarıyoruz.
            </p>
            <div className="space-y-4">
              <AboutItem text="10+ Yıllık Sektör Tecrübesi" />
              <AboutItem text="500+ Mutlu İşletme" />
              <AboutItem text="Anlık Veri Senkronizasyonu" />
            </div>
          </div>
          <div className="flex-1 bg-primary/10 rounded-3xl h-[400px] w-full flex items-center justify-center">
            <UtensilsCrossed className="h-32 w-32 text-primary opacity-20" />
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-24 px-6 bg-card/50">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-display font-bold mb-4">İletişime Geçin</h2>
            <p className="text-muted-foreground">Sorularınız için form doldurabilir veya bizi arayabilirsiniz.</p>
          </div>

          <Card className="p-8 shadow-xl">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ad Soyad</FormLabel>
                        <FormControl>
                          <Input placeholder="Adınızı giriniz" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>E-posta</FormLabel>
                        <FormControl>
                          <Input placeholder="E-posta adresiniz" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Konu</FormLabel>
                      <FormControl>
                        <Input placeholder="Mesaj konusu" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mesaj</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Size nasıl yardımcı olabiliriz?" className="min-h-[120px]" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full h-12 text-lg">Gönder</Button>
              </form>
            </Form>
          </Card>
        </div>
      </section>

      <footer className="py-12 border-t bg-card text-center text-muted-foreground">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-center gap-2 mb-4 text-foreground">
            <UtensilsCrossed className="h-6 w-6 text-primary" />
            <span className="text-xl font-display font-bold">RestoPOS</span>
          </div>
          <p>© 2026 RestoPOS. Tüm hakları saklıdır.</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, description }: any) {
  return (
    <Card className="p-6 border-none shadow-sm hover:shadow-md transition-shadow bg-background">
      <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-6">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </Card>
  );
}

function PricingCard({ title, price, features, highlighted }: any) {
  return (
    <Card className={`p-8 ${highlighted ? 'border-2 border-primary shadow-2xl scale-105' : 'border-border/50 shadow-lg'} relative bg-card`}>
      {highlighted && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-primary-foreground text-xs font-bold uppercase py-1 px-4 rounded-full">
          En Popüler
        </div>
      )}
      <div className="mb-8">
        <h3 className="text-xl font-bold mb-2">{title}</h3>
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-bold font-display">₺{price}</span>
          <span className="text-muted-foreground text-sm">/aylık</span>
        </div>
      </div>
      <ul className="space-y-4 mb-8 text-sm">
        {features.map((f: string) => (
          <li key={f} className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            {f}
          </li>
        ))}
      </ul>
      <Button className="w-full h-11" variant={highlighted ? 'default' : 'outline'}>
        Seç
      </Button>
    </Card>
  );
}

function IntegrationItem({ icon: Icon, name }: any) {
  return (
    <div className="flex flex-col items-center gap-2">
      <Icon className="h-8 w-8 text-muted-foreground" />
      <span className="text-xs font-medium uppercase tracking-wider">{name}</span>
    </div>
  );
}

function AboutItem({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-2 w-2 rounded-full bg-primary" />
      <span className="text-foreground font-medium">{text}</span>
    </div>
  );
}
