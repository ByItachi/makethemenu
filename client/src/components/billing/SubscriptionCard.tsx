import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

type Overview = {
  planCode: string;
  subscription: {
    id: number;
    planCode: string;
    interval: "monthly" | "yearly";
    status: "active" | "past_due" | "canceled";
    currentPeriodEnd: string;
    cancelAtPeriodEnd: boolean;
    pendingPlanCode: string | null;
  } | null;
  paymentMethod: { brand: string; last4: string } | null;
};

type PlanRow = { code: string; name: string; priceMonthly: number; priceYearly: number };

type Payment = {
  id: number;
  kind: "subscription" | "upgrade" | "renewal";
  planCode: string;
  interval: string;
  amount: string | number;
  status: "pending" | "succeeded" | "failed" | "refunded";
  invoiceNo: string | null;
  createdAt: string;
};

type PaymentMethod = { id: number; brand: string | null; last4: string | null; isDefault: boolean };

const money = (v: number | string) => new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(Number(v));
const STATUS_LABEL: Record<string, string> = {
  active: "Aktif",
  past_due: "Ödeme bekliyor",
  canceled: "İptal edildi",
  pending: "Beklemede",
  succeeded: "Başarılı",
  failed: "Başarısız",
  refunded: "İade edildi",
};

export default function SubscriptionCard() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [interval, setInterval] = useState<"monthly" | "yearly">("monthly");
  const [coupon, setCoupon] = useState("");

  const overview = useQuery<Overview>({ queryKey: ["/api/billing/overview"] });
  const plans = useQuery<PlanRow[]>({ queryKey: ["/api/plans"] });
  const history = useQuery<Payment[]>({ queryKey: ["/api/billing/history"] });
  const methods = useQuery<PaymentMethod[]>({ queryKey: ["/api/billing/payment-methods"] });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["/api/billing/overview"] });
    qc.invalidateQueries({ queryKey: ["/api/billing/history"] });
    qc.invalidateQueries({ queryKey: ["/api/billing/payment-methods"] });
  };

  const choose = useMutation({
    mutationFn: async (planCode: string) => {
      const sub = overview.data?.subscription;
      if (!sub) {
        // İlk abonelik: sunucu fiyatı hesaplar; istemci tutar göndermez.
        const res = await fetch("/api/billing/checkout", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json", "Idempotency-Key": crypto.randomUUID() },
          body: JSON.stringify({ planCode, interval, couponCode: coupon.trim() || undefined }),
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body.message ?? "Ödeme başlatılamadı.");
        return { mode: "checkout" as const, redirectUrl: body.redirectUrl as string };
      }
      const res = await apiRequest("POST", "/api/billing/change-plan", { planCode, interval });
      return res.json();
    },
    onSuccess: (r: any) => {
      if (r.mode === "checkout" && r.redirectUrl) {
        window.location.href = r.redirectUrl;
        return;
      }
      if (r.mode === "scheduled") {
        toast({ title: "Plan değişikliği planlandı", description: "Yeni plan mevcut dönem sonunda geçerli olacak." });
      } else if (r.mode === "scheduled_cancel") {
        toast({ title: "Abonelik iptal edilecek", description: "Mevcut dönem sonunda plan ücretsiz plana döner." });
      }
      refresh();
    },
    onError: (e: Error) => toast({ title: "Hata", description: e.message, variant: "destructive" }),
  });

  const cancel = useMutation({
    mutationFn: async (cancelFlag: boolean) => {
      await apiRequest("POST", cancelFlag ? "/api/billing/cancel" : "/api/billing/resume", {});
    },
    onSuccess: (_d, flag) => {
      toast({ title: flag ? "İptal planlandı" : "Abonelik sürdürüldü" });
      refresh();
    },
    onError: (e: Error) => toast({ title: "Hata", description: e.message, variant: "destructive" }),
  });

  const setDefault = useMutation({
    mutationFn: async (id: number) => apiRequest("POST", `/api/billing/payment-methods/${id}/default`, {}),
    onSuccess: () => {
      toast({ title: "Varsayılan kart güncellendi" });
      refresh();
    },
    onError: (e: Error) => toast({ title: "Hata", description: e.message, variant: "destructive" }),
  });

  const removeMethod = useMutation({
    mutationFn: async (id: number) => apiRequest("DELETE", `/api/billing/payment-methods/${id}`),
    onSuccess: () => {
      toast({ title: "Kart silindi" });
      refresh();
    },
    onError: (e: Error) => toast({ title: "Hata", description: e.message, variant: "destructive" }),
  });

  const sub = overview.data?.subscription ?? null;
  const currentPlan = overview.data?.planCode ?? "free";
  const purchasable = (plans.data ?? []).filter((p) => (interval === "yearly" ? p.priceYearly : p.priceMonthly) > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Abonelik</CardTitle>
        <CardDescription>Planınız, yenileme tarihiniz, ödeme geçmişiniz ve plan değişiklikleri.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 text-sm">
        <div className="space-y-1">
          <p>
            Mevcut plan: <strong>{currentPlan}</strong>{" "}
            {sub && <Badge variant="secondary">{STATUS_LABEL[sub.status]}</Badge>}
          </p>
          {sub && (
            <>
              <p>Dönem sonu: {new Date(sub.currentPeriodEnd).toLocaleDateString("tr-TR")}</p>
              {sub.pendingPlanCode && <p>Dönem sonunda geçilecek plan: {sub.pendingPlanCode}</p>}
              {sub.cancelAtPeriodEnd && <p className="text-destructive">Dönem sonunda iptal edilecek.</p>}
              {overview.data?.paymentMethod && (
                <p>Kayıtlı kart: {overview.data.paymentMethod.brand} •••• {overview.data.paymentMethod.last4}</p>
              )}
              <div className="flex gap-2 pt-1">
                {sub.cancelAtPeriodEnd ? (
                  <Button size="sm" variant="outline" disabled={cancel.isPending} onClick={() => cancel.mutate(false)}>
                    İptali geri al
                  </Button>
                ) : (
                  <Button size="sm" variant="outline" disabled={cancel.isPending} onClick={() => cancel.mutate(true)}>
                    Dönem sonunda iptal et
                  </Button>
                )}
              </div>
            </>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span>Dönem:</span>
            <Button size="sm" variant={interval === "monthly" ? "default" : "outline"} onClick={() => setInterval("monthly")}>Aylık</Button>
            <Button size="sm" variant={interval === "yearly" ? "default" : "outline"} onClick={() => setInterval("yearly")}>Yıllık</Button>
          </div>
          {!sub && (
            <div className="flex flex-wrap items-center gap-2">
              <Input
                className="max-w-[200px]"
                placeholder="Kupon kodu"
                value={coupon}
                onChange={(e) => setCoupon(e.target.value)}
                maxLength={40}
                aria-label="Kupon kodu"
              />
            </div>
          )}
          <div className="grid gap-2 sm:grid-cols-3">
            {purchasable.map((p) => {
              const price = interval === "yearly" ? p.priceYearly : p.priceMonthly;
              const isCurrent = p.code === currentPlan && !!sub;
              return (
                <div key={p.code} className="rounded-md border p-3 space-y-2">
                  <div className="font-medium">{p.name}</div>
                  <div>{money(price)} <span className="text-muted-foreground">/ {interval === "yearly" ? "yıl" : "ay"} (KDV dahil)</span></div>
                  <Button size="sm" className="w-full" disabled={isCurrent || choose.isPending} onClick={() => choose.mutate(p.code)}>
                    {isCurrent ? "Mevcut plan" : sub ? "Bu plana geç" : "Seç ve öde"}
                  </Button>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground">
            Plan yükseltmesi hemen ödeme ister ve ödeme onaylanınca uygulanır. Düşürme dönem sonunda uygulanır. Fiyatlar varsayılan değerlerdir ve onay bekler.
          </p>
        </div>

        <div className="space-y-2">
          <h3 className="font-medium">Kayıtlı kartlar</h3>
          {methods.data && methods.data.length === 0 && <p className="text-muted-foreground">Kayıtlı kart yok; ödeme sırasında eklenir.</p>}
          <ul className="divide-y">
            {(methods.data ?? []).map((m) => (
              <li key={m.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <span>
                  {m.brand ?? "Kart"} •••• {m.last4} {m.isDefault && <Badge variant="secondary" className="ml-1">Varsayılan</Badge>}
                </span>
                <span className="flex gap-2">
                  {!m.isDefault && (
                    <Button size="sm" variant="outline" disabled={setDefault.isPending} onClick={() => setDefault.mutate(m.id)}>
                      Varsayılan yap
                    </Button>
                  )}
                  <Button size="sm" variant="destructive" disabled={removeMethod.isPending} onClick={() => removeMethod.mutate(m.id)}>
                    Sil
                  </Button>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-2">
          <h3 className="font-medium">Ödeme geçmişi</h3>
          {history.data && history.data.length === 0 && <p className="text-muted-foreground">Henüz ödeme yok.</p>}
          <ul className="divide-y">
            {(history.data ?? []).map((h) => (
              <li key={h.id} className="flex flex-wrap justify-between gap-2 py-2">
                <span>
                  {new Date(h.createdAt).toLocaleDateString("tr-TR")} · {h.planCode} · {h.interval === "yearly" ? "Yıllık" : "Aylık"}
                  {h.invoiceNo ? ` · ${h.invoiceNo}` : ""}
                </span>
                <span>
                  {money(h.amount)} · {STATUS_LABEL[h.status] ?? h.status}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
