import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type Session = {
  planCode: string;
  interval: string;
  amount: number;
  taxAmount: number;
  currency: string;
  status: string;
};

const money = (v: number) => new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(v);

/**
 * Yalnızca test modu (PAYMENT_PROVIDER=mock, PAYMENT_MODE=test) için barındırılmış ödeme sayfası simülatörü.
 * Gerçek kart bilgisi alınmaz.
 */
export default function TestCheckoutPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const ref = new URLSearchParams(window.location.search).get("ref") ?? "";
  const validRef = /^mock_[a-f0-9]{24}$/.test(ref);
  const [busy, setBusy] = useState(false);

  const { data, isLoading, error } = useQuery<Session>({
    queryKey: ["/api/billing/test/session", ref],
    enabled: validRef,
    retry: false,
  });

  const complete = useMutation({
    mutationFn: async (outcome: "success" | "fail" | "success_declining_renewals") => {
      const res = await apiRequest("POST", "/api/billing/test/complete", { ref, outcome });
      return res.json() as Promise<{ outcome: string }>;
    },
    onSuccess: (r) => setLocation(r.outcome === "fail" ? "/odeme/basarisiz" : "/odeme/basarili"),
    onError: (e: Error) => {
      setBusy(false);
      toast({ title: "Hata", description: e.message.includes("401") ? "Devam etmek için giriş yapmalısınız." : e.message, variant: "destructive" });
    },
  });

  const run = (outcome: "success" | "fail" | "success_declining_renewals") => {
    setBusy(true);
    complete.mutate(outcome);
  };

  return (
    <div className="mx-auto max-w-lg p-6 space-y-4">
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-semibold">Test ödeme sayfası</h1>
        <Badge variant="secondary">TEST MODU</Badge>
      </div>
      <Alert>
        <AlertDescription>
          Bu sayfa geliştirme ve test amaçlıdır. Gerçek bir ödeme alınmaz ve kart bilgisi istenmez.
        </AlertDescription>
      </Alert>

      {!validRef && <p className="text-sm text-destructive">Geçersiz ödeme referansı.</p>}
      {validRef && isLoading && <p className="text-sm text-muted-foreground">Yükleniyor…</p>}
      {validRef && error && <p className="text-sm text-destructive">Ödeme oturumu bulunamadı.</p>}

      {data && (
        <Card>
          <CardHeader>
            <CardTitle>Ödenecek tutar</CardTitle>
            <CardDescription>
              Plan: {data.planCode} · {data.interval === "yearly" ? "Yıllık" : "Aylık"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-3xl font-bold">{money(data.amount)}</div>
            <p className="text-xs text-muted-foreground">KDV dahil: {money(data.taxAmount)}</p>
            {data.status !== "pending" ? (
              <p className="text-sm">Bu ödeme zaten sonuçlandı ({data.status}).</p>
            ) : (
              <div className="grid gap-2">
                <Button disabled={busy} onClick={() => run("success")} data-testid="button-test-success">
                  Test kartıyla öde (başarılı)
                </Button>
                <Button variant="destructive" disabled={busy} onClick={() => run("fail")} data-testid="button-test-fail">
                  Test kartıyla öde (reddedilir)
                </Button>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Giriş yapmadıysanız <Link href="/giris" className="underline">giriş yapın</Link>; ödeme ancak oturum açıkken tamamlanır.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
