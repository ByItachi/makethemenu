import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { trackEvent } from "@/lib/analytics";

type PlanRow = { code: string; name: string; priceMonthly: number; priceYearly: number; maxProducts: number; maxTables: number; customDomain: boolean };
type Overview = { planCode: string } | null;

const money = (v: number) => new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(v);

/** Public pricing page with plan checkout. Existing marketing page stays at /fiyatlar. */
export default function PlanCheckoutPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const [interval, setInterval] = useState<"monthly" | "yearly">("monthly");
  const [coupon, setCoupon] = useState("");

  const plans = useQuery<PlanRow[]>({ queryKey: ["/api/plans"] });
  const overview = useQuery<Overview>({
    queryKey: ["/api/billing/overview"],
    enabled: isAuthenticated,
    retry: false,
  });

  const startCheckout = useMutation({
    mutationFn: async (planCode: string) => {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", "Idempotency-Key": crypto.randomUUID() },
        body: JSON.stringify({ planCode, interval, couponCode: coupon.trim() || undefined }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.message ?? "Ödeme başlatılamadı.");
      return body as { redirectUrl: string };
    },
    onSuccess: (r) => {
      window.location.href = r.redirectUrl;
    },
    onError: (e: Error) => {
      if (e.message.includes("401")) {
        toast({ title: "Önce giriş yapın", description: "Abonelik başlatmak için giriş yapmalısınız." });
        setLocation("/giris");
        return;
      }
      toast({ title: "Hata", description: e.message, variant: "destructive" });
    },
  });

  const onChoose = (planCode: string) => {
    if (!isAuthenticated || !user) {
      setLocation("/kayit");
      return;
    }
    const plan = (plans.data ?? []).find((p) => p.code === planCode);
    const value = interval === "yearly" ? plan?.priceYearly : plan?.priceMonthly;
    trackEvent("begin_checkout", {
      plan: planCode,
      interval,
      value: value ?? 0,
      currency: "TRY",
      coupon: coupon.trim() || undefined,
    });
    startCheckout.mutate(planCode);
  };

  const currentPlan = overview.data?.planCode ?? null;
  const purchasable = (plans.data ?? []).filter((p) => (interval === "yearly" ? p.priceYearly : p.priceMonthly) > 0);
  const free = (plans.data ?? []).filter((p) => (interval === "yearly" ? p.priceYearly : p.priceMonthly) === 0 && p.code !== "free");

  return (
    <div className="mx-auto max-w-5xl p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Planlar</h1>
        <p className="text-muted-foreground">Restoranınız için uygun planı seçin. Tüm fiyatlar KDV dahildir.</p>
        <div className="flex justify-center gap-2 pt-2">
          <Button variant={interval === "monthly" ? "default" : "outline"} onClick={() => setInterval("monthly")}>Aylık</Button>
          <Button variant={interval === "yearly" ? "default" : "outline"} onClick={() => setInterval("yearly")}>Yıllık</Button>
        </div>
      </div>

      {plans.isLoading && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Skeleton className="h-48" /><Skeleton className="h-48" /><Skeleton className="h-48" />
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {purchasable.map((p) => {
          const price = interval === "yearly" ? p.priceYearly : p.priceMonthly;
          const isCurrent = p.code === currentPlan;
          return (
            <Card key={p.code} className={isCurrent ? "border-primary" : undefined}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {p.name}
                  {isCurrent && <Badge>Mevcut planınız</Badge>}
                </CardTitle>
                <CardDescription>
                  {p.maxProducts} ürüne kadar · {p.maxTables} masa{p.customDomain ? " · özel alan adı" : ""}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-2xl font-bold">
                  {money(price)}
                  <span className="text-sm font-normal text-muted-foreground"> / {interval === "yearly" ? "yıl" : "ay"}</span>
                </div>
                <Button
                  className="w-full"
                  disabled={isCurrent || startCheckout.isPending}
                  onClick={() => onChoose(p.code)}
                  data-testid={`button-plan-${p.code}`}
                >
                  {isCurrent ? "Mevcut planınız" : isAuthenticated ? "Seç ve öde" : "Başlamak için kaydolun"}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {!isAuthenticated && (
        <div className="flex justify-center gap-2">
          {free.map((p) => (
            <Button key={p.code} variant="ghost" onClick={() => setLocation("/kayit")}>
              {p.name} planla ücretsiz başla
            </Button>
          ))}
        </div>
      )}

      {isAuthenticated && !currentPlan && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Kupon kodunuz var mı?</CardTitle>
            <CardDescription>İndirim ödeme adımında uygulanır.</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Input className="max-w-[240px]" placeholder="Kupon kodu" value={coupon} maxLength={40} onChange={(e) => setCoupon(e.target.value)} aria-label="Kupon kodu" />
          </CardContent>
        </Card>
      )}

      {isAuthenticated && currentPlan && (
        <p className="text-center text-sm text-muted-foreground">
          Plan değişiklikleri ve abonelik yönetimi <Link href="/isletme" className="underline">işletme ayarlarından</Link> yapılır.
        </p>
      )}
    </div>
  );
}
