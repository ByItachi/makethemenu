import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.message ?? "İstek gönderilemedi.");
        return;
      }
      setMessage(data.message);
    } catch {
      setError("Sunucuya ulaşılamadı. Bağlantınızı kontrol edin.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <Link asChild href="/">
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
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Şifre Hatırlatma</h2>
          <p className="mt-2 text-muted-foreground">Kayıtlı e-posta adresinizi girin, sıfırlama bağlantısı gönderelim.</p>
        </div>

        {message ? (
          <p role="status" className="rounded-lg border border-border p-4 text-sm">{message}</p>
        ) : (
          <form className="space-y-6" onSubmit={onSubmit}>
            <Input
              id="forgot-email"
              name="email"
              type="email"
              placeholder="E-Posta Adresi"
              className="h-[52px] pl-4 rounded-lg bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-base"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            {error && <p role="alert" className="text-sm text-red-600 dark:text-red-400">{error}</p>}
            <Button
              type="submit"
              disabled={submitting}
              className="w-full h-[52px] text-lg font-bold bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-all"
            >
              {submitting ? "Gönderiliyor…" : "Gönder"}
            </Button>
          </form>
        )}

        <div className="text-sm text-muted-foreground">
          Şifrenizi Hatırladınız Mı?{" "}
          <Link href="/giris" className="font-medium text-primary hover:underline">
            Yeniden Giriş Yap
          </Link>
        </div>
      </div>
    </div>
  );
}
