import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "./AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard, TrendingUp, Clock, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

type PaymentRow = {
  id: number;
  restaurantId: number;
  kind: string;
  planCode: string;
  interval: string;
  amount: string;
  status: "pending" | "succeeded" | "failed" | "refunded";
  provider: string;
  invoiceNo: string | null;
  failureReason: string | null;
  createdAt: string;
};

const money = (v: number | string) => new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(Number(v));
const STATUS_LABEL: Record<string, string> = { pending: "Beklemede", succeeded: "Başarılı", failed: "Başarısız", refunded: "İade edildi" };
const KIND_LABEL: Record<string, string> = { subscription: "Abonelik", upgrade: "Yükseltme", renewal: "Yenileme" };

export default function AdminPayments() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const payments = useQuery<PaymentRow[]>({ queryKey: ["/api/admin/payments"] });

  const refund = useMutation({
    mutationFn: async (id: number) => apiRequest("POST", `/api/admin/payments/${id}/refund`, {}),
    onSuccess: () => {
      toast({ title: "Ödeme iade edildi" });
      qc.invalidateQueries({ queryKey: ["/api/admin/payments"] });
    },
    onError: (e: Error) => toast({ title: "Hata", description: e.message, variant: "destructive" }),
  });

  const rows = payments.data ?? [];
  const now = new Date();
  const inMonth = (r: PaymentRow) => new Date(r.createdAt).getMonth() === now.getMonth() && new Date(r.createdAt).getFullYear() === now.getFullYear();
  const monthTotal = rows.filter((r) => inMonth(r) && r.status === "succeeded").reduce((s, r) => s + Number(r.amount), 0);
  const pending = rows.filter((r) => r.status === "pending");
  const succeededCount = rows.filter((r) => r.status === "succeeded").length;

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 md:p-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Ödemeler</h1>
          <p className="text-muted-foreground mt-1">Abonelik ödemeleri, iadeler ve sağlayıcı durumu</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Bu Ay Tahsilat</CardTitle></CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{money(monthTotal)}</div>
              <div className="text-xs text-green-500 mt-1 flex items-center gap-1"><TrendingUp className="h-3 w-3" />başarılı ödemeler</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Bekleyen Ödemeler</CardTitle></CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{money(pending.reduce((s, r) => s + Number(r.amount), 0))}</div>
              <div className="text-xs text-orange-500 mt-1 flex items-center gap-1"><Clock className="h-3 w-3" />{pending.length} işlem</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Başarılı Ödemeler</CardTitle></CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{succeededCount}</div>
              <div className="text-xs text-blue-500 mt-1 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" />tüm zamanlar</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Sağlayıcı</CardTitle></CardHeader>
            <CardContent>
              <PaymentProviderBadge />
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5" />Ödeme Geçmişi (son 200)</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {rows.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p>Henüz işlem bulunamadı</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground border-b">
                    <th className="py-2 pr-3">Tarih</th><th className="py-2 pr-3">İşletme</th><th className="py-2 pr-3">Tür</th>
                    <th className="py-2 pr-3">Plan</th><th className="py-2 pr-3">Tutar</th><th className="py-2 pr-3">Fatura</th>
                    <th className="py-2 pr-3">Durum</th><th className="py-2">İşlem</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className="border-b last:border-0">
                      <td className="py-2 pr-3 whitespace-nowrap">{new Date(r.createdAt).toLocaleDateString("tr-TR")}</td>
                      <td className="py-2 pr-3">#{r.restaurantId}</td>
                      <td className="py-2 pr-3">{KIND_LABEL[r.kind] ?? r.kind}</td>
                      <td className="py-2 pr-3">{r.planCode} ({r.interval === "yearly" ? "yıllık" : "aylık"})</td>
                      <td className="py-2 pr-3">{money(r.amount)}</td>
                      <td className="py-2 pr-3">{r.invoiceNo ?? "—"}</td>
                      <td className="py-2 pr-3">
                        <Badge variant={r.status === "succeeded" ? "secondary" : r.status === "pending" ? "outline" : "destructive"}>
                          {STATUS_LABEL[r.status] ?? r.status}{r.status === "failed" && r.failureReason ? `: ${r.failureReason}` : ""}
                        </Badge>
                      </td>
                      <td className="py-2">
                        {r.status === "succeeded" && (
                          <Button size="sm" variant="outline" disabled={refund.isPending} onClick={() => refund.mutate(r.id)}>İade et</Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

function PaymentProviderBadge() {
  const cfg = useQuery<{ provider: string; mode: string }>({ queryKey: ["/api/billing/config"] });
  if (cfg.isLoading) return <div className="text-sm text-muted-foreground/70">Yükleniyor…</div>;
  const provider = cfg.data?.provider ?? "none";
  return (
    <div>
      <div className="text-2xl font-bold text-purple-600">{provider === "none" ? "0" : "1"}</div>
      <div className="text-xs text-purple-500 mt-1">{provider} · {cfg.data?.mode === "live" ? "canlı" : "test"} modu</div>
    </div>
  );
}
