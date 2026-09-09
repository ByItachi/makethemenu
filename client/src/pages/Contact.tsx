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
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

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
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/20 to-white/0 dark:to-transparent pointer-events-none" />
        <div className="site-container text-center pt-32 relative z-10">
          <h1 className="text-5xl md:text-6xl font-display font-bold mb-6">
            İletişime <span className="text-primary">Geçin</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Sorularınız, önerileriniz veya işbirliği talepleriniz için bize ulaşın.
          </p>
        </div>
      </section>

      <section className="py-24">
        <div className="site-container">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: <MapPin className="w-6 h-6" />, title: "Adres", text: "Büyükdere Cad. No:193 Levent, İstanbul" },
              { icon: <Phone className="w-6 h-6" />, title: "Telefon", text: "+90 (212) 555 00 00" },
              { icon: <Mail className="w-6 h-6" />, title: "E-posta", text: "info@possistem.com" }
            ].map((item, i) => (
              <div key={i} className="bg-white p-6 rounded-2xl shadow-lg border border-border hover:shadow-xl transition-shadow duration-300">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4 mx-auto">
                  {item.icon}
                </div>
                <h4 className="font-bold text-slate-900 text-lg text-center mb-2">{item.title}</h4>
                <p className="text-slate-600 text-center">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
