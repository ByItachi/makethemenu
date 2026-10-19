import { useQuery } from "@tanstack/react-query";
import { ShieldCheck, KeyRound, MailCheck, History, Smartphone } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader, FadeIn, EmptyState } from "@/components/ui/fx";

type SecEvent = { id: number; action: string; ip: string | null; userAgent: string | null; createdAt: string };

const EVENT_LABELS: Record<string, string> = {
  "auth.login": "Giriş yapıldı",
  "auth.login_failed": "Başarısız giriş denemesi",
  "auth.logout": "Çıkış yapıldı",
  "auth.password_changed": "Parola değiştirildi",
  "auth.password_reset": "Parola sıfırlandı",
  "auth.email_verified": "E-posta doğrulandı",
  "auth.email_verification_sent": "Doğrulama e-postası gönderildi",
  "auth.register": "Hesap oluşturuldu",
  "auth.impersonation_started": "Yönetici oturumu başlatıldı",
  "auth.impersonation_ended": "Yönetici oturumu sonlandırıldı",
};

const eventLabel = (action: string) =>
  EVENT_LABELS[action] ??
  (action.startsWith("auth.") ? action.replace("auth.", "").replace(/_/g, " ") : action);

export default function SecurityPage() {
  const { data: user } = useQuery<any>({
    queryKey: ["/api/auth/user"],
    queryFn: async () => (await fetch("/api/auth/user", { credentials: "include" })).json(),
  });
  const { data: events, isLoading } = useQuery<SecEvent[]>({
    queryKey: ["/api/auth/security-events"],
    queryFn: async () => (await fetch("/api/auth/security-events", { credentials: "include" })).json(),
    enabled: !!user,
  });

  if (!user) return <Skeleton className="h-96 w-full rounded-xl" />;

  return (
    <>
      <PageHeader
        icon={ShieldCheck}
        title="Güvenlik"
        description="Hesabınızın güvenlik durumu ve son etkinlikler."
      />

      <div className="grid sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
        {[
          {
            icon: MailCheck,
            label: "E-posta doğrulama",
            ok: !!user.emailVerified,
            text: user.emailVerified ? "E-posta adresiniz doğrulanmış" : "E-postanızı doğrulamadınız — doğrulama bağlantısına bakın",
          },
          {
            icon: KeyRound,
            label: "Parola",
            ok: true,
            text: "Parolanız şifreli saklanır. Değiştirmek için Hesabım sayfasını kullanın.",
            href: "/restoran/account",
          },
          {
            icon: Smartphone,
            label: "Oturum güvenliği",
            ok: true,
            text: "Oturumlarınız güvenli çerezle taşınır, 30 gün sonra yenilenir.",
          },
        ].map((s, i) => (
          <FadeIn key={s.label} delay={i * 70}>
            <Card className={`fx-card-lift h-full ${s.ok ? "" : "border-amber-500/40"}`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <s.icon className={`h-5 w-5 ${s.ok ? "text-primary" : "text-amber-500"}`} />
                  <span className="font-medium text-sm">{s.label}</span>
                  {s.ok ? (
                    <Badge className="ml-auto bg-green-500/10 text-green-600 hover:bg-green-500/20 border-0">Tamam</Badge>
                  ) : (
                    <Badge className="ml-auto bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 border-0">Bekliyor</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{s.text}</p>
              </CardContent>
            </Card>
          </FadeIn>
        ))}
      </div>

      <FadeIn delay={120}>
        <Card>
          <CardContent className="p-4 sm:p-5">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <History className="h-5 w-5 text-primary" /> Güvenlik etkinlikleri
            </h2>
            {isLoading ? (
              <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
            ) : !events?.length ? (
              <EmptyState
                icon={ShieldCheck}
                title="Kayıt yok"
                body="Giriş yaptıkça güvenlik etkinlikleriniz burada zaman çizelgesi hâlinde listelenir."
              />
            ) : (
              <ol className="relative space-y-4 border-l-2 border-primary/20 pl-5 ml-2">
                {events.slice(0, 12).map((e, i) => (
                  <li key={e.id} className="fx-fade-up relative" style={{ animationDelay: `${i * 60}ms` }}>
                    <span className="absolute -left-[27px] top-1 h-3 w-3 rounded-full bg-primary border-2 border-background" />
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                      <span className="text-sm font-medium">{eventLabel(e.action)}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(e.createdAt).toLocaleString("tr-TR", { dateStyle: "medium", timeStyle: "short" })}
                      </span>
                      {e.ip && <Badge variant="secondary" className="text-[10px] w-fit">{e.ip}</Badge>}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>
      </FadeIn>

      <FadeIn delay={160}>
        <Card className="mt-6 border-primary/30">
          <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="min-w-0">
              <h3 className="font-semibold text-sm">Parolanızı değiştirmek ister misiniz?</h3>
              <p className="text-xs text-muted-foreground mt-1">Hesabım sayfasından parolanızı her an güncelleyebilirsiniz.</p>
            </div>
            <Button size="sm" variant="outline" className="sm:ml-auto shrink-0" onClick={() => (window.location.href = "/restoran/account")}>
              Hesabıma git
            </Button>
          </CardContent>
        </Card>
      </FadeIn>
    </>
  );
}
