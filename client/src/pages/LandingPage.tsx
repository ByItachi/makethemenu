import {
  Navbar
} from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { TrialPopup } from "@/components/TrialPopup";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { PRESETS, TemplatePreview } from "@/pages/restoran/online/ReadyTemplatesGallery";
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
  Smartphone,
  ArrowUp
} from "lucide-react";
import { useState, useEffect } from "react";
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
import { useLanguage } from "@/contexts/LanguageContext";

const contactSchema = z.object({
  name: z.string().min(2, "Ad en az 2 karakter olmalıdır"),
  email: z.string().email("Geçerli bir e-posta adresi giriniz"),
  subject: z.string().min(2, "Konu en az 2 karakter olmalıdır"),
  message: z.string().min(10, "Mesaj en az 10 karakter olmalıdır"),
});

type ContactForm = z.infer<typeof contactSchema>;

export default function LandingPage() {
  const { toast } = useToast();
  const { t, language } = useLanguage();
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

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
        title: t("landing.contact.successTitle"),
        description: t("landing.contact.successDesc"),
      });
      form.reset();
    } catch (error) {
      toast({
        variant: "destructive",
        title: t("landing.contact.errorTitle"),
        description: t("landing.contact.errorDesc"),
      });
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground scroll-smooth">
      <Navbar />
      <TrialPopup />

      {/* Hero Section */}
      <section id="home" className="relative pt-56 pb-20 overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-10">
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-blue-500 rounded-full blur-[120px]" />
        </div>

        <div className="site-container relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
            <div className="flex-1 min-w-0 text-center lg:text-left">
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-bold mb-6 animate-in leading-tight">
                {t("landing.hero.title1")}{" "}
                <span className="sm:whitespace-nowrap">
                  <span className="text-primary">{t("landing.hero.titleHighlight")}</span> {t("landing.hero.title2")}
                </span>
              </h1>
              <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto lg:mx-0 text-balance leading-relaxed">
                {t("landing.hero.subtitle")}
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <Button size="lg" className="h-14 px-8 text-lg font-medium group rounded-full" onClick={() => window.location.href = "/giris"}>
                  {t("landing.hero.ctaPrimary")}
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button size="lg" variant="outline" className="h-14 px-8 text-lg font-medium rounded-full">
                  {t("landing.hero.ctaSecondary")}
                </Button>
              </div>
              <div className="mt-8 flex items-center justify-center lg:justify-start gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary" /> {t("landing.hero.trial")}
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary" /> {t("landing.hero.noCard")}
                </div>
              </div>
            </div>

            <div className="flex-1 relative w-full max-w-[600px] lg:max-w-none">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-slate-200/50 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <img
                  src="https://images.unsplash.com/photo-1556740738-b6a63e27c4df?auto=format&fit=crop&w=800&q=80"
                  alt="POS Dashboard"
                  className="w-full h-auto object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
              </div>

              {/* Floating Element 1 */}
              <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-xl shadow-xl border border-slate-100 flex items-center gap-4 animate-bounce duration-[3000ms]">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                  <BarChart3 />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-semibold uppercase">{t("landing.hero.dailyRevenue")}</p>
                  <p className="text-lg font-bold text-slate-900">₺12,450</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-card/50">
        <div className="site-container">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-display font-bold mb-4">{t("landing.features.title")}</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              {t("landing.features.subtitle")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard
              icon={LayoutDashboard}
              title={t("landing.features.tableManagement")}
              description={t("landing.features.tableManagementDesc")}
            />
            <FeatureCard
              icon={UtensilsCrossed}
              title={t("landing.features.fastPos")}
              description={t("landing.features.fastPosDesc")}
            />
            <FeatureCard
              icon={BarChart3}
              title={t("landing.features.reports")}
              description={t("landing.features.reportsDesc")}
            />
            <FeatureCard
              icon={Users}
              title={t("landing.features.loyalty")}
              description={t("landing.features.loyaltyDesc")}
            />
          </div>
        </div>
      </section>

      {/* Templates Section */}
      <section id="templates" className="py-24 bg-secondary/10">
        <div className="site-container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-display font-bold mb-4">Ücretsiz Dijital Menü Şablonları</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Mutfak ve mekan türünüze uygun {PRESETS.length} hazır şablondan birini seçin, tamamı ücretsiz ve tek tıkla uygulanır.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            {PRESETS.slice(0, 4).map((p) => (
              <Card key={p.id}>
                <CardContent className="p-4 space-y-3">
                  <TemplatePreview preset={p} />
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-sm">{p.name}</p>
                    <Badge variant="secondary" className="shrink-0">Ücretsiz</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="text-center">
            <Link href="/sablonlar">
              <Button size="lg" variant="outline">Tüm Şablonları Gör</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Mobile App Section */}
      <section className="py-24 overflow-hidden">
        <div className="site-container">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="flex-1 lg:pr-12">
              <h2 className="text-3xl md:text-5xl font-display font-bold mb-6">
                {t("landing.mobile.title1")} <br /><span className="text-primary">{t("landing.mobile.titleHighlight")}</span>
              </h2>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                {t("landing.mobile.subtitle")}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold mb-1">{t("landing.mobile.mobileOrder")}</h4>
                    <p className="text-sm text-muted-foreground">{t("landing.mobile.mobileOrderDesc")}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <BarChart3 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold mb-1">{t("landing.mobile.instantReports")}</h4>
                    <p className="text-sm text-muted-foreground">{t("landing.mobile.instantReportsDesc")}</p>
                  </div>
                </div>
              </div>

              <Button size="lg" className="rounded-full px-8 h-12">
                {t("landing.mobile.download")}
              </Button>
            </div>

            <div className="flex-1 relative">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-100 rounded-full blur-[100px] -z-10" />
              <img
                src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80"
                alt="Mobile App Interface"
                className="rounded-3xl shadow-2xl border-8 border-white mx-auto w-[300px] md:w-[350px]"
              />

              {/* Floating Badge */}
              <div className="absolute bottom-10 right-10 md:right-20 bg-white p-4 rounded-2xl shadow-xl animate-bounce duration-[4000ms]">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                  <span className="font-bold text-sm">{t("landing.mobile.systemOnline")}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24">
        <div className="site-container">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-display font-bold mb-4">{t("landing.pricing.title")}</h2>
            <p className="text-muted-foreground">{t("landing.pricing.subtitle")}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <PricingCard
              title={t("landing.pricing.starter")}
              price="299"
              features={[t("landing.pricing.starterF1"), t("landing.pricing.starterF2"), t("landing.pricing.starterF3")]}
              t={t}
            />
            <PricingCard
              title={t("landing.pricing.pro")}
              price="599"
              highlighted={true}
              features={[t("landing.pricing.proF1"), t("landing.pricing.proF2"), t("landing.pricing.proF3"), t("landing.pricing.proF4")]}
              t={t}
            />
            <PricingCard
              title={t("landing.pricing.enterprise")}
              price="999"
              features={[t("landing.pricing.entF1"), t("landing.pricing.entF2"), t("landing.pricing.entF3"), t("landing.pricing.entF4")]}
              t={t}
            />
          </div>
        </div>
      </section>

      {/* Integrations Section */}
      <section id="integrations" className="py-24 bg-secondary/30">
        <div className="site-container text-center">
          <h2 className="text-3xl font-display font-bold mb-12">{t("landing.integrations.title")}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 items-center opacity-70">
            <IntegrationItem icon={Globe} name={t("landing.integrations.eInvoice")} />
            <IntegrationItem icon={Zap} name={t("landing.integrations.yemeksepeti")} />
            <IntegrationItem icon={Shield} name={t("landing.integrations.getir")} />
            <IntegrationItem icon={Smartphone} name={t("landing.integrations.trendyol")} />
            <IntegrationItem icon={Globe} name={t("landing.integrations.paymentSystems")} />
            <IntegrationItem icon={Shield} name={t("landing.integrations.cloudBackup")} />
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-24 bg-secondary/10">
        <div className="site-container flex flex-col md:flex-row items-center gap-16">
          <div className="flex-1 order-2 md:order-1">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl">
              <img
                src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80"
                alt="Restaurant Interior"
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
              />
            </div>
          </div>
          <div className="flex-1 order-1 md:order-2">
            <h2 className="text-3xl md:text-5xl font-display font-bold mb-6">{t("landing.about.title")}</h2>
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              {language === "tr" ? (
                <>makethemenu {t("landing.about.description")}</>
              ) : (
                <>At makethemenu, {t("landing.about.description")}</>
              )}
            </p>
            <div className="space-y-4">
              <AboutItem text={t("landing.about.exp")} />
              <AboutItem text={t("landing.about.happy")} />
              <AboutItem text={t("landing.about.sync")} />
              <AboutItem text={t("landing.about.support")} />
            </div>
          </div>
        </div>
      </section>

      {/* Blog Section */}
      <section id="blog" className="py-24 bg-card/30">
        <div className="site-container">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-display font-bold mb-4">{t("landing.blog.title")}</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              {t("landing.blog.subtitle")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <BlogCard
              title={t("landing.blog.post1Title")}
              description={t("landing.blog.post1Desc")}
              date={t("landing.blog.date1")}
              readTime={t("landing.blog.readTime5")}
              image="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&q=80"
              readMore={t("landing.blog.readMore")}
            />
            <BlogCard
              title={t("landing.blog.post2Title")}
              description={t("landing.blog.post2Desc")}
              date={t("landing.blog.date2")}
              readTime={t("landing.blog.readTime4")}
              image="https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=600&q=80"
              readMore={t("landing.blog.readMore")}
            />
            <BlogCard
              title={t("landing.blog.post3Title")}
              description={t("landing.blog.post3Desc")}
              date={t("landing.blog.date3")}
              readTime={t("landing.blog.readTime6")}
              image="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&q=80"
              readMore={t("landing.blog.readMore")}
            />
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-24">
        <div className="site-container">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-display font-bold mb-4">{t("landing.contact.title")}</h2>
              <p className="text-muted-foreground">{t("landing.contact.subtitle")}</p>
            </div>

            <Card className="p-8 shadow-xl border-t-4 border-t-primary">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("landing.contact.name")}</FormLabel>
                          <FormControl>
                            <Input placeholder={t("landing.contact.namePlaceholder")} autoComplete="name" {...field} />
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
                          <FormLabel>{t("landing.contact.email")}</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder={t("landing.contact.emailPlaceholder")} autoComplete="email" {...field} />
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
                        <FormLabel>{t("landing.contact.subject")}</FormLabel>
                        <FormControl>
                          <Input placeholder={t("landing.contact.subjectPlaceholder")} autoComplete="off" {...field} />
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
                        <FormLabel>{t("landing.contact.message")}</FormLabel>
                        <FormControl>
                          <Textarea placeholder={t("landing.contact.messagePlaceholder")} className="min-h-[120px]" autoComplete="off" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full h-12 text-lg">{t("landing.contact.send")}</Button>
                </form>
              </Form>
            </Card>
          </div>
        </div>
      </section>

      <Footer />

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 z-40 w-12 h-12 rounded-full bg-primary text-white shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300 flex items-center justify-center"
          aria-label="Yukarı çık"
          title="Yukarı çık"
        >
          <ArrowUp className="w-6 h-6" />
        </button>
      )}
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

function PricingCard({ title, price, features, highlighted, t }: any) {
  return (
    <Card className={`p-8 ${highlighted ? 'border-2 border-primary shadow-2xl scale-105' : 'border-border/50 shadow-lg'} relative bg-card`}>
      {highlighted && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-primary-foreground text-xs font-bold uppercase py-1 px-4 rounded-full">
          {t("landing.pricing.mostPopular")}
        </div>
      )}
      <div className="mb-8">
        <h3 className="text-xl font-bold mb-2">{title}</h3>
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-bold font-display">₺{price}</span>
          <span className="text-muted-foreground text-sm">{t("landing.pricing.month")}</span>
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
      <Button className="w-full h-11" variant={highlighted ? 'default' : 'outline'} onClick={() => window.location.href = "/iletisim"}>
        {t("landing.pricing.select")}
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

function BlogCard({ title, description, date, readTime, image, readMore }: any) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <div className="aspect-video overflow-hidden">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
        />
      </div>
      <div className="p-6">
        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
          <span>{date}</span>
          <span>•</span>
          <span>{readTime}</span>
        </div>
        <h3 className="text-xl font-bold mb-3 line-clamp-2">{title}</h3>
        <p className="text-muted-foreground mb-4 line-clamp-3">{description}</p>
        <Button variant="outline" className="w-full">
          {readMore}
        </Button>
      </div>
    </Card>
  );
}
