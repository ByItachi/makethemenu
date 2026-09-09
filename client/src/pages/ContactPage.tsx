import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
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
import { MapPin, Phone, Mail } from "lucide-react";

const contactSchema = z.object({
  name: z.string().min(2, "Ad en az 2 karakter olmalıdır"),
  email: z.string().email("Geçerli bir e-posta adresi giriniz"),
  subject: z.string().min(2, "Konu en az 2 karakter olmalıdır"),
  message: z.string().min(10, "Mesaj en az 10 karakter olmalıdır"),
});

type ContactForm = z.infer<typeof contactSchema>;

export default function ContactPage() {
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
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/20 to-white/0 dark:to-transparent pointer-events-none"></div>
        <div className="site-container text-center pt-32 relative z-10">
          <h1 className="text-5xl md:text-6xl font-display font-bold mb-6">İletişime <span className="text-primary">Geçin</span></h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Sorularınız, önerileriniz veya işbirliği talepleriniz için bize ulaşın.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="site-container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Contact Info */}
            <div className="space-y-8">
              <div className="bg-card p-8 rounded-3xl border border-border/50 shadow-sm">
                <h3 className="text-2xl font-bold mb-6">Ofisimiz</h3>
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                      <MapPin className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold mb-1">Adres</h4>
                      <p className="text-muted-foreground">Maslak Mah. Büyükdere Cad. No: 123<br/>Sarıyer, İstanbul</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                      <Phone className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold mb-1">Telefon</h4>
                      <p className="text-muted-foreground">+90 (212) 555 01 00</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                      <Mail className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold mb-1">E-posta</h4>
                      <p className="text-muted-foreground">info@makethemenu.com</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-card p-8 rounded-3xl border border-border/50 shadow-sm">
                <h3 className="text-2xl font-bold mb-4">Çalışma Saatleri</h3>
                <div className="space-y-2 text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Pazartesi - Cuma</span>
                    <span className="font-medium text-foreground">09:00 - 18:00</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cumartesi</span>
                    <span className="font-medium text-foreground">10:00 - 14:00</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pazar</span>
                    <span className="font-medium text-foreground">Kapalı</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Form */}
            <Card className="p-8 shadow-xl border-t-4 border-t-primary h-fit">
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
                            <Input placeholder="Adınızı giriniz" autoComplete="name" {...field} />
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
                            <Input type="email" placeholder="E-posta adresiniz" autoComplete="email" {...field} />
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
                          <Input placeholder="Mesaj konusu" autoComplete="off" {...field} />
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
                          <Textarea placeholder="Size nasıl yardımcı olabiliriz?" className="min-h-[150px]" autoComplete="off" {...field} />
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
        </div>
      </section>

      <Footer />
    </div>
  );
}
