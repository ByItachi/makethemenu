import { useQuery } from "@tanstack/react-query";
import { UserCog, Mail, Store, ShieldCheck, LogOut, BadgeCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { PageHeader, FadeIn, TiltCard } from "@/components/ui/fx";

export default function AccountPage() {
  const { user, logout, isLoggingOut } = useAuth() as any;
  const { data: profile } = useQuery<any>({
    queryKey: ["/api/settings/profile"],
    queryFn: async () => (await fetch("/api/settings/profile", { credentials: "include" })).json(),
  });

  if (!user) return <Skeleton className="h-96 w-full rounded-xl" />;

  return (
    <>
      <PageHeader icon={UserCog} title="Hesabım" description="Hesap bilgileriniz ve oturum yönetimi." />

      <div className="grid lg:grid-cols-2 gap-4 sm:gap-6 items-start">
        <FadeIn>
          <TiltCard>
            <Card className="fx-card-lift overflow-hidden">
              <div className="fx-header-band p-6 flex items-center gap-4">
                <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground text-2xl font-bold shadow-lg">
                  {(user.fullName || user.email || "?").slice(0, 1).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <p className="text-lg font-bold truncate">{user.fullName || "—"}</p>
                  <p className="text-sm text-muted-foreground truncate flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5" /> {user.email || user.username}
                    {user.emailVerified && <BadgeCheck className="h-4 w-4 text-green-600" />}
                  </p>
                </div>
              </div>
              <CardContent className="p-5 space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-2"><Store className="h-4 w-4" /> İşletme</span>
                  <span className="font-medium">{profile?.name ?? profile?.restaurantName ?? "—"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Rol</span>
                  <Badge variant="secondary">{user.isPlatformAdmin ? "Platform Yöneticisi" : "İşletme Yöneticisi"}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> E-posta</span>
                  <Badge className={user.emailVerified ? "bg-green-500/10 text-green-600 border-0 hover:bg-green-500/20" : "bg-amber-500/10 text-amber-600 border-0 hover:bg-amber-500/20"}>
                    {user.emailVerified ? "Doğrulanmış" : "Doğrulanmamış"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </TiltCard>
        </FadeIn>

        <div className="space-y-4">
          <FadeIn delay={100}>
            <Card>
              <CardContent className="p-5 space-y-3 text-sm">
                <h3 className="font-semibold">Güvenlik</h3>
                <p className="text-muted-foreground">Parola değişimi, doğrulama ve güvenlik etkinlikleriniz:</p>
                <Button size="sm" variant="outline" onClick={() => (window.location.href = "/restoran/security")}>
                  <ShieldCheck className="h-4 w-4" /> Güvenlik sayfasına git
                </Button>
                <p className="text-xs text-muted-foreground pt-2">
                  Parolanızı unuttuysanız çıkış yapıp giriş ekranındaki "Parolamı unuttum" bağlantısını kullanın.
                </p>
              </CardContent>
            </Card>
          </FadeIn>
          <FadeIn delay={180}>
            <Card>
              <CardContent className="p-5">
                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full"
                  disabled={isLoggingOut}
                  onClick={() => logout()}
                >
                  <LogOut className="h-4 w-4" /> {isLoggingOut ? "Çıkış yapılıyor…" : "Bu cihazdan çıkış yap"}
                </Button>
              </CardContent>
            </Card>
          </FadeIn>
        </div>
      </div>
    </>
  );
}
