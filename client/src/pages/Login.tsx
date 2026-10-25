import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Headset, Eye, EyeOff, Wifi } from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "wouter";
import { queryClient } from "@/lib/queryClient";
import { trackEvent } from "@/lib/analytics";

const testimonials = [
  {
    quote: "makethemenu, herkesin kolaylıkla anlayabileceği basit bir tasarıma sahip. İşletmelerin ihtiyaç duyduğu hemen her şeyi sunuyor. Bunun yanında, destek hizmeti de son derece önemli ve makethemenu ekibi bu konuda gerçekten ilgili ve hızlı bir şekilde yardımcı oluyor. Bize sağladıkları destek için makethemenu'ye teşekkür ediyorum.",
    author: "Berat Ayaz",
    role: "Cafe De Laf",
    avatar: "https://ui-avatars.com/api/?name=BA&background=random"
  },
  {
    quote: "Sipariş süreçlerimizi inanılmaz hızlandırdı. Mutfak ve servis arasındaki iletişim kopukluğu tamamen bitti. Raporlama özellikleri sayesinde maliyetlerimizi kontrol altına aldık.",
    author: "Ahmet Yılmaz",
    role: "Lezzet Durağı",
    avatar: "https://ui-avatars.com/api/?name=Ahmet+Yilmaz&background=random"
  },
  {
    quote: "Stok takibi ve maliyet analizi özellikleri tam aradığımız gibi. Kurulumu çok kolaydı ve ekip her sorumuza anında dönüş yaptı. Kesinlikle tavsiye ediyorum.",
    author: "Zeynep Kaya",
    role: "Coffee & More",
    avatar: "https://ui-avatars.com/api/?name=Zeynep+Kaya&background=random"
  }
];

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ identifier, password }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || data?.ok === false) {
        setError(data?.message ?? "Giriş yapılamadı. Lütfen tekrar deneyin.");
        return;
      }
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      trackEvent("login", { method: "password" });
      window.location.href = "/dashboard";
    } catch {
      setError("Sunucuya ulaşılamadı. Bağlantınızı kontrol edin.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-background">
      {/* Left Side - Image & Testimonial */}
      <div className="hidden lg:block lg:w-1/2 relative overflow-hidden bg-slate-900">
        <img 
          src="https://cdn.adisyo.com/pos-images/signup-1.png?quality-15" 
          alt="Login Background" 
          className="w-full h-full object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
        
        {/* Testimonial Content */}
        <div className="absolute bottom-0 left-0 p-12 text-white w-full max-w-2xl transition-all duration-500 ease-in-out">
          <div className="mb-6">
             <span className="text-6xl font-serif font-bold opacity-80 leading-none">“</span>
          </div>
          
          <div className="min-h-[160px]">
            <p className="text-lg md:text-xl font-medium leading-relaxed mb-8 opacity-90 animate-in fade-in slide-in-from-bottom-4 duration-500" key={currentSlide}>
              {testimonials[currentSlide].quote}
            </p>
          </div>

          <div className="flex items-center gap-4 mb-8">
            {testimonials[currentSlide].avatar && (
              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center border border-white/20 backdrop-blur-sm overflow-hidden">
                 <img src={testimonials[currentSlide].avatar} alt={`${testimonials[currentSlide].author} Logo`} className="w-full h-full object-cover" />
              </div>
            )}
            <div>
              <div className="font-bold text-lg">{testimonials[currentSlide].author}</div>
              <div className="text-sm opacity-70">{testimonials[currentSlide].role}</div>
            </div>
          </div>

          <div className="flex gap-2">
            {testimonials.map((_, index) => (
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
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex flex-col p-6 md:p-12 lg:p-24 overflow-y-auto h-screen relative bg-background">
        {/* Background Decor */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-[20%] -right-[20%] w-[80%] h-[80%] rounded-full bg-primary/5 blur-[120px]" />
          <div className="absolute top-[40%] -left-[20%] w-[60%] h-[60%] rounded-full bg-blue-500/10 blur-[100px]" />
          <div className="absolute bottom-[10%] -right-[10%] w-[40%] h-[40%] rounded-full bg-blue-400/10 blur-[80px]" />
        </div>

        {/* Top Header */}
        <div className="flex items-center justify-between flex-wrap gap-y-3 mb-8 relative z-10">
          <Link asChild href="/">
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

          <div className="flex items-center gap-3 sm:gap-4">
            <Link to="/demo" className="hidden sm:inline text-sm font-medium text-primary hover:underline">
              Demo Talep Et
            </Link>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="gap-2 text-muted-foreground hover:text-primary rounded-full bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 px-3 sm:px-6 py-2 sm:py-5 h-auto font-medium">
                  <span className="hidden sm:inline">Destek İste</span>
                  <Headset className="h-5 w-5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-4">
                <div className="space-y-4">
                  <a href="tel:+902167060624" className="flex items-center gap-3 text-sm hover:text-primary transition-colors">
                    <Headset className="h-5 w-5" />
                    <span>+90 (216) 706 06 24</span>
                  </a>
                  <a href="https://www.alpemix.com/site/Alpemix.exe" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm hover:text-primary transition-colors">
                    <Wifi className="h-5 w-5" />
                    <span>Uzak Bağlantı</span>
                  </a>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col justify-center max-w-[480px] w-full space-y-8 relative z-10 mx-0">
          <div className="space-y-2 text-center lg:text-left">
            <h2 className="text-[28px] font-bold tracking-tight text-foreground">Tekrar Hoş Geldiniz</h2>
            <p className="text-muted-foreground text-base">Lütfen üyelik bilgileriniz ile giriş yapınız</p>
          </div>

          <form className="space-y-5" onSubmit={handleLogin}>
            {error && <p role="alert" className="text-sm font-medium text-red-600 dark:text-red-400">{error}</p>}
            <div className="space-y-4">
              <div className="relative group">
                <Input
                  id="login-email"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                  name="email"
                  type="email"
                  placeholder="E-Posta Adresi veya Telefon Numarası"
                  className="h-[52px] pl-4 rounded-lg bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:bg-white dark:focus:bg-slate-800 focus:border-primary focus:ring-primary transition-all text-base placeholder:text-muted-foreground"
                  autoComplete="email"
                />
              </div>

              <div className="relative group">
                <Input
                  id="login-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Şifre"
                  className="h-[52px] pl-4 pr-12 rounded-lg bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:bg-white dark:focus:bg-slate-800 focus:border-primary focus:ring-primary transition-all text-base placeholder:text-muted-foreground"
                  autoComplete="current-password"
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

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember"
                  name="rememberMe"
                  className="w-5 h-5 border-2 border-slate-300 dark:border-slate-600 rounded-full data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  checked={rememberMe}
                  onCheckedChange={() => setRememberMe(!rememberMe)}
                />
                <Label htmlFor="remember" className="text-[15px] font-medium text-muted-foreground cursor-pointer select-none">
                  Beni hatırla
                </Label>
              </div>
              <Link to="/sifremi-unuttum" className="text-[15px] font-bold text-muted-foreground hover:text-primary transition-colors">
                Şifremi Unuttum?
              </Link>
            </div>

            <Button 
              className="w-full h-[52px] text-[16px] font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25 rounded-lg mt-2 transition-all" 
              size="lg"
              type="submit"
              disabled={submitting}
            >
              Giriş Yap
            </Button>

            {/* Demo Credentials Hint */}
            <div className="mt-4 p-4 bg-primary/5 border border-primary/10 rounded-lg text-sm">
              <p className="font-bold text-primary mb-2">Demo Giriş Bilgileri:</p>
              <div className="flex flex-col space-y-1 text-muted-foreground">
                <div className="flex justify-between">
                  <span>E-Posta:</span>
                  <span className="font-mono font-medium text-foreground">demo@makethemenu.com</span>
                </div>
                <div className="flex justify-between">
                  <span>Şifre:</span>
                  <span className="font-mono font-medium text-foreground">demo1234</span>
                </div>
              </div>
            </div>
          </form>

          <div className="pt-4 text-center lg:text-left">
             <p className="text-muted-foreground font-medium">
               Üye Değil Misiniz? <Link asChild href="/kayit"><a className="text-primary font-bold hover:underline">Şimdi Kaydolun</a></Link>
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}
