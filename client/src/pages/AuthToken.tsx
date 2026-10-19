import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { queryClient } from "@/lib/queryClient";

function readToken(): string {
  return new URLSearchParams(window.location.search).get("token") ?? "";
}

/** /dogrula?token=... — confirms the e-mail address of the signed-in or new user. */
export function VerifyEmailPage() {
  const [state, setState] = useState<"loading" | "ok" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = readToken();
    if (!token) {
      setState("error");
      setMessage("Doğrulama bağlantısı eksik.");
      return;
    }
    fetch("/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setState("error");
          setMessage(data.message ?? "Doğrulama başarısız.");
          return;
        }
        setState("ok");
        queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      })
      .catch(() => {
        setState("error");
        setMessage("Sunucuya ulaşılamadı.");
      });
  }, []);

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-background text-foreground">
      <div className="max-w-md w-full text-center space-y-4">
        <h1 className="text-2xl font-bold">E-posta doğrulama</h1>
        {state === "loading" && <p role="status">Doğrulanıyor…</p>}
        {state === "ok" && (
          <>
            <p role="status">E-posta adresiniz doğrulandı.</p>
            <Link href="/panel" className="text-primary underline">Panele git</Link>
          </>
        )}
        {state === "error" && (
          <>
            <p role="alert" className="text-red-600 dark:text-red-400">{message}</p>
            <Link href="/giris" className="text-primary underline">Giriş sayfasına dön</Link>
          </>
        )}
      </div>
    </main>
  );
}

/** /sifre-sifirla?token=... — sets a new password using a single-use reset link. */
export function ResetPasswordPage() {
  const [, navigate] = useLocation();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirm) return setError("Parolalar eşleşmiyor.");
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ token: readToken(), password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return setError(data.message ?? "Parola sıfırlanamadı.");
      setDone(true);
    } catch {
      setError("Sunucuya ulaşılamadı.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-background text-foreground">
      <div className="max-w-md w-full space-y-6">
        <h1 className="text-2xl font-bold text-center">Yeni parola belirleyin</h1>
        {done ? (
          <div className="space-y-4 text-center">
            <p role="status">Parolanız güncellendi. Yeni parolanızla giriş yapabilirsiniz.</p>
            <Button onClick={() => navigate("/giris")}>Giriş yap</Button>
          </div>
        ) : (
          <form className="space-y-4" onSubmit={onSubmit}>
            <Input type="password" placeholder="Yeni parola (en az 8 karakter)" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required autoComplete="new-password" />
            <Input type="password" placeholder="Yeni parola (tekrar)" value={confirm} onChange={(e) => setConfirm(e.target.value)} minLength={8} required autoComplete="new-password" />
            {error && <p role="alert" className="text-sm text-red-600 dark:text-red-400">{error}</p>}
            <Button type="submit" className="w-full" disabled={submitting}>{submitting ? "Kaydediliyor…" : "Parolayı kaydet"}</Button>
          </form>
        )}
      </div>
    </main>
  );
}
