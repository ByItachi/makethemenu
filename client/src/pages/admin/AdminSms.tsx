import { useState } from "react";
import AdminLayout from "./AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { MessageSquare, RefreshCw, AlertTriangle, CheckCircle2, Clock } from "lucide-react";

interface TenantRow {
  restaurantId: number;
  name: string;
  balance: number;
  queue: { queued: number; sending: number; sent: number; failed: number; retry: number; scheduled: number };
}

interface Overview {
  configured: boolean;
  provider: string | null;
  totals: TenantRow["queue"];
  tenants: TenantRow[];
}

interface OutboxRow {
  id: number;
  restaurantId: number | null;
  toPhone: string;
  status: string;
  attempts: number;
  lastError: string | null;
  createdAt: string | null;
  scheduledAt: string | null;
  sentAt: string | null;
}

const STATUS_LABELS: Record<string, string> = {
  queued: "Kuyrukta", sending: "Gönderiliyor", sent: "Gönderildi",
  failed: "Başarısız", retry: "Yeniden Denenecek", scheduled: "Zamanlanmış",
};

export default function AdminSms() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("failed");

  const { data: overview, isLoading: loadingOverview } = useQuery<Overview>({
    queryKey: ["/api/admin/sms/overview"],
    refetchInterval: 15000,
  });

  const { data: outbox, isLoading: loadingOutbox } = useQuery<OutboxRow[]>({
    queryKey: ["/api/admin/sms/outbox", statusFilter],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/admin/sms/outbox?status=${statusFilter}`);
      return res.json();
    },
    refetchInterval: 15000,
  });

  const retry = async (id: number) => {
    try {
      await apiRequest("POST", `/api/admin/sms/outbox/${id}/retry`);
      toast({ title: "Mesaj yeniden kuyruğa alındı." });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sms/outbox"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sms/overview"] });
    } catch {
      toast({ title: "İşlem başarısız oldu.", variant: "destructive" });
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6" data-testid="admin-sms">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><MessageSquare className="h-6 w-6 text-primary" /> SMS Sistemi</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Platforma ait kendi SMS altyapısının (kuyruk, kontör, sağlayıcı) tüm işletmeler genelindeki durumu.
          </p>
        </div>

        {!loadingOverview && overview && (
          <Card className={overview.configured && overview.provider !== "mock" ? "border-emerald-200" : "border-amber-300"}>
            <CardContent className="p-4 flex items-center gap-3">
              {overview.configured && overview.provider !== "mock" ? <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" /> : <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />}
              <div className="text-sm">
                {!overview.configured ? (
                  <>Henüz bir SMS sağlayıcısı (İletiMerkezi / NetGSM / Twilio) yapılandırılmadı. Mesajlar kuyrukta bekliyor, gerçek telefona ulaşmıyor. <code>.env</code> içindeki <code>SMS_PROVIDER</code> ve ilgili API anahtarını tanımlayın.</>
                ) : overview.provider === "mock" ? (
                  <>Sağlayıcı test/mock modunda (<strong>SMS_PROVIDER=mock</strong>). Kuyruk, kontör ve API tamamen gerçek ve kendi altyapımız; yalnızca gerçek telefona gönderim simüle ediliyor. Gerçek SMS için <code>.env</code> içinde İletiMerkezi/NetGSM/Twilio anahtarını tanımlayıp <code>SMS_PROVIDER</code> değerini değiştirin.</>
                ) : (
                  <>Aktif sağlayıcı: <strong>{overview.provider}</strong>. Mesajlar gerçekten şebekeye iletiliyor.</>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          {(["queued", "sending", "sent", "failed", "retry", "scheduled"] as const).map((key) => (
            <Card key={key}>
              <CardContent className="p-4 text-center">
                <div className={`text-2xl font-bold ${key === "failed" ? "text-red-600" : key === "sent" ? "text-emerald-600" : ""}`}>
                  {loadingOverview ? <Skeleton className="h-7 w-10 mx-auto" /> : overview?.totals[key] ?? 0}
                </div>
                <div className="text-xs text-muted-foreground">{STATUS_LABELS[key]}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">İşletme Başına Kullanım</CardTitle>
            <CardDescription>Kontör bakiyesi ve kuyruk durumu (önce hatalı/bekleyeni en çok olanlar).</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingOverview ? (
              <Skeleton className="h-32 w-full" />
            ) : !overview || overview.tenants.length === 0 ? (
              <p className="text-sm text-muted-foreground">Henüz SMS kullanımı olan işletme yok.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-muted-foreground border-b border-border">
                      <th className="py-2 pr-4">İşletme</th>
                      <th className="py-2 pr-4">Bakiye</th>
                      <th className="py-2 pr-4">Kuyrukta</th>
                      <th className="py-2 pr-4">Gönderildi</th>
                      <th className="py-2 pr-4">Başarısız</th>
                      <th className="py-2 pr-4">Zamanlanmış</th>
                    </tr>
                  </thead>
                  <tbody>
                    {overview.tenants.map((t) => (
                      <tr key={t.restaurantId} className="border-b border-border/50">
                        <td className="py-2 pr-4 font-medium">{t.name} <span className="text-muted-foreground">#{t.restaurantId}</span></td>
                        <td className="py-2 pr-4">{t.balance} kontör</td>
                        <td className="py-2 pr-4">{t.queue.queued}</td>
                        <td className="py-2 pr-4 text-emerald-600">{t.queue.sent}</td>
                        <td className="py-2 pr-4 text-red-600">{t.queue.failed}</td>
                        <td className="py-2 pr-4">{t.queue.scheduled}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2"><Clock className="h-4 w-4" /> Mesaj Kuyruğu</CardTitle>
              <CardDescription>Tüm işletmelerden son 200 mesaj.</CardDescription>
            </div>
            <div className="flex gap-1">
              {["failed", "retry", "queued", "sent", "scheduled"].map((s) => (
                <Button key={s} size="sm" variant={statusFilter === s ? "default" : "outline"} onClick={() => setStatusFilter(s)}>
                  {STATUS_LABELS[s]}
                </Button>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            {loadingOutbox ? (
              <Skeleton className="h-32 w-full" />
            ) : !outbox || outbox.length === 0 ? (
              <p className="text-sm text-muted-foreground">Bu durumda mesaj yok.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-muted-foreground border-b border-border">
                      <th className="py-2 pr-4">İşletme</th>
                      <th className="py-2 pr-4">Telefon</th>
                      <th className="py-2 pr-4">Durum</th>
                      <th className="py-2 pr-4">Deneme</th>
                      <th className="py-2 pr-4">Hata</th>
                      <th className="py-2 pr-4" />
                    </tr>
                  </thead>
                  <tbody>
                    {outbox.map((row) => (
                      <tr key={row.id} className="border-b border-border/50">
                        <td className="py-2 pr-4">#{row.restaurantId ?? "-"}</td>
                        <td className="py-2 pr-4 font-mono">{row.toPhone}</td>
                        <td className="py-2 pr-4"><Badge variant={row.status === "failed" ? "destructive" : "secondary"}>{STATUS_LABELS[row.status] ?? row.status}</Badge></td>
                        <td className="py-2 pr-4">{row.attempts}</td>
                        <td className="py-2 pr-4 text-xs text-muted-foreground max-w-[240px] truncate">{row.lastError ?? "-"}</td>
                        <td className="py-2 pr-4">
                          {(row.status === "failed" || row.status === "retry") && (
                            <Button size="sm" variant="ghost" onClick={() => retry(row.id)}><RefreshCw className="h-3.5 w-3.5 mr-1" /> Yeniden dene</Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
