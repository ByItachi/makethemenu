import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Headset, Eye, EyeOff } from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "wouter";

const sliderImages = [
  "https://images.unsplash.com/photo-1528605248644-14dd04022da1?q=80&w=1600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1470337458703-46ad1756a187?q=80&w=1600&auto=format&fit=crop"
];

export default function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % sliderImages.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const [form, setForm] = useState({ firstName: "", lastName: "", businessName: "", email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          fullName: `${form.firstName} ${form.lastName}`.trim(),
          businessName: form.businessName,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.message ?? "Kayıt yapılamadı. Lütfen tekrar deneyin.");
        return;
      }
      const data = await res.json();
      window.location.href = data.restaurantSlug ? "/panel" : "/giris";
    } catch {
      setError("Sunucuya ulaşılamadı. Bağlantınızı kontrol edin.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-background">
      {/* Left Side - Image Slider */}
      <div className="hidden lg:block lg:w-1/2 relative overflow-hidden bg-slate-900">
        {sliderImages.map((img, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              currentSlide === index ? "opacity-100" : "opacity-0"
            }`}
          >
            <img 
              src={img} 
              alt={`Slide ${index + 1}`} 
              className="w-full h-full object-cover"
            />
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          </div>
        ))}

        {/* Slider Indicators */}
        <div className="absolute bottom-12 left-0 right-0 flex justify-center gap-2 z-10">
            {sliderImages.map((_, index) => (
              <div 
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-2.5 h-2.5 rounded-full cursor-pointer transition-all duration-300 ${
                  currentSlide === index ? "bg-white w-6" : "bg-white/40 hover:bg-white"
                }`}
              />
            ))}
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex flex-col p-6 md:p-12 lg:p-24 overflow-y-auto h-screen relative bg-background">
        {/* Background Decor */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-[20%] -right-[20%] w-[80%] h-[80%] rounded-full bg-primary/5 blur-[120px]" />
          <div className="absolute top-[40%] -left-[20%] w-[60%] h-[60%] rounded-full bg-blue-500/10 blur-[100px]" />
        </div>

        {/* Top Header */}
        <div className="flex items-center justify-between flex-wrap gap-y-3 mb-8 relative z-10">
          <Link href="/">
            <a className="flex items-center gap-2 group cursor-pointer">
              <img
                src="/makethemenu-header.png"
                alt="makethemenu"
                draggable={false}
                className="h-9 sm:h-11 md:h-14 w-auto max-w-[150px] sm:max-w-[190px] md:max-w-[220px] object-contain select-none group-hover:scale-105 transition-transform block dark:hidden"
              />
              <img
                src="/makethemenu-footer.png"
                alt="makethemenu"
                draggable={false}
                className="h-9 sm:h-11 md:h-14 w-auto max-w-[150px] sm:max-w-[190px] md:max-w-[220px] object-contain select-none group-hover:scale-105 transition-transform hidden dark:block"
              />
            </a>
          </Link>

          <Button variant="outline" className="gap-2 text-muted-foreground hover:text-primary rounded-full bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 px-3 sm:px-6 py-2 sm:py-5 h-auto font-medium">
            <span className="hidden sm:inline">Destek İste</span>
            <Headset className="h-5 w-5" />
          </Button>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col justify-center max-w-[480px] mx-auto w-full space-y-8 relative z-10">
          <div className="space-y-2 text-center lg:text-left">
            <h2 className="text-[28px] font-bold tracking-tight text-foreground">Hemen Kayıt Olun</h2>
            <p className="text-muted-foreground text-base">makethemenu ile işletmenizi büyütmeye başlayın</p>
          </div>

          <form className="space-y-5" onSubmit={handleRegister}>
            {error && <p role="alert" className="text-sm font-medium text-red-600 dark:text-red-400">{error}</p>}
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="relative group">
                    <Input
                    id="register-firstname"
                    value={form.firstName}
                    onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                    required
                    name="firstName"
                    placeholder="Ad"
                    className="h-[52px] pl-4 rounded-lg bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:bg-white dark:focus:bg-slate-800 focus:border-primary focus:ring-primary transition-all text-base placeholder:text-muted-foreground"
                    autoComplete="given-name"
                    />
                </div>
                <div className="relative group">
                    <Input
                    id="register-lastname"
                    value={form.lastName}
                    onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                    required
                    name="lastName"
                    placeholder="Soyad"
                    className="h-[52px] pl-4 rounded-lg bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:bg-white dark:focus:bg-slate-800 focus:border-primary focus:ring-primary transition-all text-base placeholder:text-muted-foreground"
                    autoComplete="family-name"
                    />
                </div>
              </div>

              <div className="relative group">
                <Input
                  id="register-company"
                  value={form.businessName}
                  onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                  required
                  name="organization"
                  placeholder="İşletme Adı"
                  className="h-[52px] pl-4 rounded-lg bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:bg-white dark:focus:bg-slate-800 focus:border-primary focus:ring-primary transition-all text-base placeholder:text-muted-foreground"
                  autoComplete="organization"
                />
              </div>

              <div className="relative group">
                <Input
                  id="register-email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                  name="email"
                  type="email"
                  placeholder="E-Posta Adresi"
                  className="h-[52px] pl-4 rounded-lg bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:bg-white dark:focus:bg-slate-800 focus:border-primary focus:ring-primary transition-all text-base placeholder:text-muted-foreground"
                  autoComplete="email"
                />
              </div>

              <div className="relative group">
                <Input
                  id="register-phone"
                  name="tel"
                  type="tel"
                  placeholder="Telefon Numarası"
                  className="h-[52px] pl-4 rounded-lg bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:bg-white dark:focus:bg-slate-800 focus:border-primary focus:ring-primary transition-all text-base placeholder:text-muted-foreground"
                  autoComplete="tel"
                />
              </div>

              <div className="relative group">
                <Input
                  id="register-password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  minLength={8}
                  required
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Şifre"
                  className="h-[52px] pl-4 pr-12 rounded-lg bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:bg-white dark:focus:bg-slate-800 focus:border-primary focus:ring-primary transition-all text-base placeholder:text-muted-foreground"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-2 pt-1">
                <Checkbox
                  id="terms"
                  name="acceptTerms"
                  className="w-5 h-5 border-2 border-slate-300 dark:border-slate-600 rounded-full data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                />
                <Label htmlFor="terms" className="text-[14px] font-medium text-muted-foreground cursor-pointer select-none">
                  <a href="#" className="text-primary hover:underline">Kullanım Koşullarını</a> ve <a href="#" className="text-primary hover:underline">Gizlilik Politikasını</a> kabul ediyorum.
                </Label>
            </div>

            <Button 
              className="w-full h-[52px] text-[16px] font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25 rounded-lg mt-2 transition-all" 
              size="lg"
              type="submit"
              disabled={submitting}
            >
              Kayıt Ol
            </Button>
          </form>

          <div className="pt-4 text-center lg:text-left">
             <p className="text-muted-foreground font-medium">
               Zaten üye misiniz? <Link href="/giris"><a className="text-primary font-bold hover:underline">Giriş Yapın</a></Link>
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}
