import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";

export default function ForgotPassword() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <Link href="/">
            <a className="flex items-center justify-center gap-2 group cursor-pointer mb-6">
              <img
                src="/makethemenu-header.png"
                alt="makethemenu"
                draggable={false}
                className="h-10 w-auto max-w-[170px] object-contain select-none group-hover:scale-105 transition-transform block dark:hidden"
              />
              <img
                src="/makethemenu-footer.png"
                alt="makethemenu"
                draggable={false}
                className="h-10 w-auto max-w-[170px] object-contain select-none group-hover:scale-105 transition-transform hidden dark:block"
              />
            </a>
          </Link>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Şifre Hatırlatma
          </h2>
          <p className="mt-2 text-muted-foreground">
            Şifre hatırlatma için bilgilerinizi girin
          </p>
        </div>
        <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
          <div className="relative">
            <Input
              id="forgot-email"
              name="email"
              type="email"
              placeholder="E-Posta Adresi"
              className="h-[52px] pl-4 rounded-lg bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:bg-white dark:focus:bg-slate-800 focus:border-primary focus:ring-primary transition-all text-base"
              autoComplete="email"
              required
            />
          </div>
          <div>
            <Button
              type="submit"
              className="w-full h-[52px] text-lg font-bold bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-all"
            >
              Gönder
            </Button>
          </div>
        </form>
        <div className="text-sm text-muted-foreground">
          Şifrenizi Hatırladınız Mı?{" "}
          <Link
            href="/giris"
            className="font-medium text-primary hover:underline"
          >
            Yeniden Giriş Yap
          </Link>
        </div>
      </div>
    </div>
  );
}
