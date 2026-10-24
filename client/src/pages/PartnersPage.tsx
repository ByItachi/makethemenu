import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useRoute } from "wouter";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Handshake, Megaphone, CheckCircle2, Send } from "lucide-react";

const PARTNER_TITLES: Record<string, string> = {
  "bayilik": "Bayilik",
  "kampanyalar": "Kampanyalar",
};

const applicationSchema = z.object({
  name: z.string().min(2, "Ad soyad en az 2 karakter olmalıdır"),
  email: z.string().email("Geçerli bir e-posta adresi giriniz"),
  phone: z.string().min(10, "Geçerli bir telefon numarası giriniz"),
  city: z.string().min(2, "Şehir en az 2 karakter olmalıdır"),
  message: z.string().min(10, "Mesaj en az 10 karakter olmalıdır"),
});

type ApplicationForm = z.infer<typeof applicationSchema>;

export default function PartnersPage() {
  const [, params] = useRoute("/is-ortakligi/:slug");
  const { toast } = useToast();
  const slug = params?.slug || "";
  const title = PARTNER_TITLES[slug] || "İş Ortaklığı";
  const isBayilik = title === "Bayilik";

  const form = useForm<ApplicationForm>({
    resolver: zodResolver(applicationSchema),
    defaultValues: { name: "", email: "", phone: "", city: "", message: "" },
  });

  const onSubmit = async (data: ApplicationForm) => {
    try {
      await apiRequest("POST", "/api/contact", {
        name: data.name,
        email: data.email,
        subject: `Bayilik Başvurusu — ${data.city}`,
        message: `${data.message}\n\nTelefon: ${data.phone}\nŞehir: ${data.city}`,
      });
      toast({
        title: "Başvurunuz Alındı",
        description: "Bayilik başvurunuz ekibimize iletildi; en kısa sürede size dönüş yapacağız.",
      });
      form.reset();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Başvuru gönderilirken bir hata oluştu. Lütfen tekrar deneyin.",
      });
    }
  };

  const scrollToApplication = () => {
    document.getElementById("bayilik-basvuru")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

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
            {isBayilik ? "Büyüyen ağımıza katılın ve birlikte kazanalım." : "Güncel kampanyalar ve avantajlı paketler."}
          </p>
        </div>
      </section>

      <section className="site-container py-16">
        <div className="mb-12">
          {isBayilik ? (
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
                <Button size="lg" className="px-8 rounded-full" onClick={scrollToApplication}>
                  Bayilik Başvurusu
                </Button>
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

      {isBayilik && (
        <section id="bayilik-basvuru" className="py-16 bg-muted/30 scroll-mt-24">
          <div className="site-container max-w-2xl">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
                Bayilik <span className="text-primary">Başvuru Formu</span>
              </h2>
              <p className="text-lg text-muted-foreground">
                Formu doldurun; iş ortağı ekibimiz 24 saat içinde size dönüş yapsın.
              </p>
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
                          <FormLabel>Ad Soyad *</FormLabel>
                          <FormControl>
                            <Input placeholder="Adınız Soyadınız" {...field} />
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
                          <FormLabel>E-posta *</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="ornek@eposta.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Telefon *</FormLabel>
                          <FormControl>
                            <Input type="tel" placeholder="0 (5xx) xxx xx xx" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Şehir *</FormLabel>
                          <FormControl>
                            <Input placeholder="Çalışmak istediğiniz şehir" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mesajınız *</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Deneyiminiz, pazarınız ve neden bayimiz olmak istediğiniz hakkında kısaca bilgi verin."
                            className="min-h-[120px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" size="lg" className="w-full rounded-full" disabled={form.formState.isSubmitting}>
                    <Send className="w-4 h-4 mr-2" />
                    {form.formState.isSubmitting ? "Gönderiliyor..." : "Başvuruyu Gönder"}
                  </Button>
                </form>
              </Form>
            </Card>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}
