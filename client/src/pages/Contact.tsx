import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "@shared/routes";
import { insertContactMessageSchema, type InsertContactMessage } from "@shared/schema";
import { useSubmitContact } from "@/hooks/use-contact";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Mail, MapPin, Phone, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export default function Contact() {
  const mutation = useSubmitContact();
  
  const form = useForm<InsertContactMessage>({
    resolver: zodResolver(insertContactMessageSchema),
    defaultValues: {
      name: "",
      email: "",
      subject: "",
      message: ""
    }
  });

  const onSubmit = (data: InsertContactMessage) => {
    mutation.mutate(data, {
      onSuccess: () => form.reset()
    });
  };

  return (
    <div className="pt-32 pb-24 min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid md:grid-cols-2 gap-12 lg:gap-24 items-start">
          
          {/* Contact Info */}
          <div>
            <h1 className="text-4xl md:text-5xl font-display font-bold mb-6 text-slate-900">
              İletişime <span className="text-primary">Geç</span>
            </h1>
            <p className="text-xl text-slate-600 mb-12 leading-relaxed">
              Sorularınız mı var? Demo talebi oluşturmak mı istiyorsunuz? Formu doldurun, uzman ekibimiz en kısa sürede sizinle iletişime geçsin.
            </p>

            <div className="space-y-8">
              {[
                { icon: <MapPin className="w-6 h-6" />, title: "Adres", text: "Büyükdere Cad. No:193 Levent, İstanbul" },
                { icon: <Phone className="w-6 h-6" />, title: "Telefon", text: "+90 (212) 555 00 00" },
                { icon: <Mail className="w-6 h-6" />, title: "E-posta", text: "info@possistem.com" }
              ].map((item, i) => (
                <div key={i} className="flex gap-4 items-start">
                  <div className="w-12 h-12 rounded-full bg-white border border-border shadow-sm flex items-center justify-center text-primary shrink-0">
                    {item.icon}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-lg">{item.title}</h4>
                    <p className="text-slate-600">{item.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Form */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-8 md:p-10 rounded-3xl shadow-xl border border-border"
          >
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold text-slate-900">Ad Soyad</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} className="h-12 rounded-xl" />
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
                      <FormLabel className="font-semibold text-slate-900">E-posta Adresi</FormLabel>
                      <FormControl>
                        <Input placeholder="ornek@sirket.com" {...field} className="h-12 rounded-xl" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold text-slate-900">Konu</FormLabel>
                      <FormControl>
                        <Input placeholder="Demo Talebi / Bilgi" {...field} className="h-12 rounded-xl" />
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
                      <FormLabel className="font-semibold text-slate-900">Mesajınız</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Size nasıl yardımcı olabiliriz?" 
                          className="min-h-[120px] rounded-xl resize-none" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  disabled={mutation.isPending}
                  className="w-full h-14 text-lg font-bold rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all"
                >
                  {mutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Gönderiliyor...
                    </>
                  ) : (
                    "Mesajı Gönder"
                  )}
                </Button>
              </form>
            </Form>
          </motion.div>

        </div>
      </div>
    </div>
  );
}
