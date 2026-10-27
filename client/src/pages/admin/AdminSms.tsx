import { useState } from "react";
import AdminLayout from "./AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { MessageSquare, RefreshCw, AlertTriangle, CheckCircle2, Clock, Trash2, BarChart3, Settings, Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

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

interface ProviderInfo {
  active: boolean;
  name: string | null;
  config: {
    provider: string;
    iletimerkezi?: { apiKey: string; sender: string; sandbox?: boolean };
    netgsm?: { usercode: string; sender: string };
    twilio?: { accountSid: string; fromNumber: string };
  } | null;
  envProvider: string | null;
}

function ProviderConfigCard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [upstreamProvider, setUpstreamProvider] = useState("mock");
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [testPhone, setTestPhone] = useState("");
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);

  const { data: providerInfo } = useQuery<ProviderInfo>({
    queryKey: ["/api/admin/sms/provider"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/sms/provider");
      return res.json();
    },
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      const body: Record<string, any> = { provider: upstreamProvider };
      if (upstreamProvider === "iletimerkezi") {
        body.iletimerkezi = {
          apiKey: formData.imApiKey || "",
          apiHash: formData.imApiHash || "",
          sender: formData.imSender || "",
          sandbox: formData.imSandbox === "true",
        };
      } else if (upstreamProvider === "netgsm") {
        body.netgsm = {
          usercode: formData.ngUsercode || "",
          password: formData.ngPassword || "",
          sender: formData.ngSender || "",
        };
      } else if (upstreamProvider === "twilio") {
        body.twilio = {
          accountSid: formData.twSid || "",
          authToken: formData.twToken || "",
          fromNumber: formData.twFrom || "",
        };
      }
      await apiRequest("PUT", "/api/admin/sms/provider", body);
      toast({ title: "SMS sağlayıcısı güncellendi." });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sms/provider"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sms/overview"] });
    } catch {
      toast({ title: "Yapılandırma kaydedilemedi.", variant: "destructive" });
    }
    setSaving(false);
  };

  const handleTest = async () => {
    if (!testPhone) { toast({ title: "Telefon numarası girin.", variant: "destructive" }); return; }
    setTesting(true);
    try {
      const res = await apiRequest("POST", "/api/admin/sms/provider/test", { phone: testPhone });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Test SMS gönderildi." });
      } else {
        toast({ title: `Test başarısız: ${data.error}`, variant: "destructive" });
      }
    } catch {
      toast({ title: "Test SMS gönderilemedi.", variant: "destructive" });
    }
    setTesting(false);
  };

  const updateField = (key: string, value: string) => setFormData((prev) => ({ ...prev, [key]: value }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2"><Settings className="h-4 w-4" /> MakeTheMenu SMS Sağlayıcısı</CardTitle>
        <CardDescription>
          Platformunuz kendi SMS sağlayıcınızdır. Upstream bağlantıyı burada yapılandırın.
          {providerInfo && (
            <span className="ml-2">
              Durum: <Badge variant={providerInfo.active ? "default" : "secondary"}>{providerInfo.active ? providerInfo.name : "Pasif"}</Badge>
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Upstream Sağlayıcı</Label>
            <Select value={upstreamProvider} onValueChange={setUpstreamProvider}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="mock">Test Modu (Gerçek SMS gönderme)</SelectItem>
                <SelectItem value="iletimerkezi">İletiMerkezi</SelectItem>
                <SelectItem value="netgsm">NetGSM</SelectItem>
                <SelectItem value="twilio">Twilio</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {upstreamProvider === "iletimerkezi" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-md">
            <div>
              <Label>API Key</Label>
              <Input className="mt-1" value={formData.imApiKey || ""} onChange={(e) => updateField("imApiKey", e.target.value)} placeholder="İletiMerkezi API Key" />
            </div>
            <div>
              <Label>API Hash</Label>
              <Input className="mt-1" type="password" value={formData.imApiHash || ""} onChange={(e) => updateField("imApiHash", e.target.value)} placeholder="İletiMerkezi API Hash" />
            </div>
            <div>
              <Label>Gönderici Adı</Label>
              <Input className="mt-1" value={formData.imSender || ""} onChange={(e) => updateField("imSender", e.target.value)} placeholder="MAKETHEMENU" maxLength={11} />
            </div>
            <div className="flex items-end gap-2">
              <Label className="flex items-center gap-2">
                <input type="checkbox" checked={formData.imSandbox === "true"} onChange={(e) => updateField("imSandbox", e.target.checked ? "true" : "false")} />
                Sandbox (Test) Modu
              </Label>
            </div>
          </div>
        )}

        {upstreamProvider === "netgsm" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-md">
            <div>
              <Label>Kullanıcı Kodu</Label>
              <Input className="mt-1" value={formData.ngUsercode || ""} onChange={(e) => updateField("ngUsercode", e.target.value)} placeholder="NetGSM kullanıcı kodu" />
            </div>
            <div>
              <Label>Şifre</Label>
              <Input className="mt-1" type="password" value={formData.ngPassword || ""} onChange={(e) => updateField("ngPassword", e.target.value)} placeholder="NetGSM şifre" />
            </div>
            <div>
              <Label>Gönderici Adı</Label>
              <Input className="mt-1" value={formData.ngSender || ""} onChange={(e) => updateField("ngSender", e.target.value)} placeholder="MAKETHEMENU" maxLength={11} />
            </div>
          </div>
        )}

        {upstreamProvider === "twilio" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-md">
            <div>
              <Label>Account SID</Label>
              <Input className="mt-1" value={formData.twSid || ""} onChange={(e) => updateField("twSid", e.target.value)} placeholder="Twilio Account SID" />
            </div>
            <div>
              <Label>Auth Token</Label>
              <Input className="mt-1" type="password" value={formData.twToken || ""} onChange={(e) => updateField("twToken", e.target.value)} placeholder="Twilio Auth Token" />
            </div>
            <div>
              <Label>Gönderen Numara</Label>
              <Input className="mt-1" value={formData.twFrom || ""} onChange={(e) => updateField("twFrom", e.target.value)} placeholder="+1234567890" />
            </div>
          </div>
        )}

        <div className="flex items-center gap-3">
          <Button onClick={handleSave} disabled={saving}>{saving ? "Kaydediliyor..." : "Kaydet"}</Button>
          <div className="flex-1" />
          <Input value={testPhone} onChange={(e) => setTestPhone(e.target.value)} placeholder="+905551234567" className="max-w-[200px]" />
          <Button variant="outline" onClick={handleTest} disabled={testing}>
            <Send className="h-3.5 w-3.5 mr-1" /> {testing ? "Gönderiliyor..." : "Test SMS"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminSms() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("failed");
  const [restaurantFilter, setRestaurantFilter] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [page, setPage] = useState(1);

  const { data: overview, isLoading: loadingOverview } = useQuery<Overview>({
    queryKey: ["/api/admin/sms/overview"],
    refetchInterval: 15000,
  });

  const { data: outbox, isLoading: loadingOutbox } = useQuery<OutboxRow[]>({
    queryKey: ["/api/admin/sms/outbox", statusFilter, restaurantFilter, dateFrom, dateTo, page],
    queryFn: async () => {
      const params = new URLSearchParams({
        status: statusFilter,
        page: page.toString(),
        limit: "50",
      });
      if (restaurantFilter) params.append("restaurantId", restaurantFilter);
      if (dateFrom) params.append("dateFrom", dateFrom);
      if (dateTo) params.append("dateTo", dateTo);
      const res = await apiRequest("GET", `/api/admin/sms/outbox?${params}`);
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

  const bulkRetry = async () => {
    if (selectedIds.size === 0) {
      toast({ title: "Hiç mesaj seçilmedi.", variant: "destructive" });
      return;
    }
    try {
      await apiRequest("POST", `/api/admin/sms/outbox/bulk/retry`, {
        ids: Array.from(selectedIds),
      });
      toast({ title: `${selectedIds.size} mesaj yeniden kuyruğa alındı.` });
      setSelectedIds(new Set());
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sms/outbox"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sms/overview"] });
    } catch {
      toast({ title: "İşlem başarısız oldu.", variant: "destructive" });
    }
  };

  const bulkDelete = async () => {
    if (selectedIds.size === 0) {
      toast({ title: "Hiç mesaj seçilmedi.", variant: "destructive" });
      return;
    }
    if (!confirm(`${selectedIds.size} mesajı silmek istediğinize emin misiniz?`)) return;
    try {
      await apiRequest("POST", `/api/admin/sms/outbox/bulk/delete`, {
        ids: Array.from(selectedIds),
      });
      toast({ title: `${selectedIds.size} mesaj silindi.` });
      setSelectedIds(new Set());
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sms/outbox"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sms/overview"] });
    } catch {
      toast({ title: "İşlem başarısız oldu.", variant: "destructive" });
    }
  };

  const toggleSelect = (id: number) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const toggleSelectAll = (ids: number[]) => {
    if (selectedIds.size === ids.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(ids));
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
          <Card className={overview.configured && overview.provider === "makethemenu" ? "border-emerald-200" : overview.configured ? "border-blue-200" : "border-amber-300"}>
            <CardContent className="p-4 flex items-center gap-3">
              {overview.configured && overview.provider !== "mock" ? <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" /> : <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />}
              <div className="text-sm">
                {!overview.configured ? (
                  <>Henüz bir SMS sağlayıcısı yapılandırılmadı. Mesajlar kuyrukta bekliyor, gerçek telefona ulaşmıyor. Aşağıdan upstream sağlayıcıyı yapılandırın.</>
                ) : overview.provider === "makethemenu" ? (
                  <><strong>MakeTheMenu SMS</strong> aktif. Kendi SMS sağlayıcınız olarak hizmet veriyorsunuz. Upstream bağlantı aşağıdan yönetilir.</>
                ) : overview.provider === "mock" ? (
                  <>Test/mock modunda. Kuyruk, kontör ve API tamamen gerçek; yalnızca gerçek telefona gönderim simüle ediliyor.</>
                ) : (
                  <>Aktif sağlayıcı: <strong>{overview.provider}</strong>. Mesajlar gerçekten şebekeye iletiliyor.</>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <ProviderConfigCard />

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
          <CardHeader>
            <div className="flex flex-row items-center justify-between mb-4">
              <div>
                <CardTitle className="text-base flex items-center gap-2"><Clock className="h-4 w-4" /> Mesaj Kuyruğu</CardTitle>
                <CardDescription>Tüm işletmelerden mesajlar (sayfa başına 50).</CardDescription>
              </div>
              <div className="flex gap-1">
                {["failed", "retry", "queued", "sent", "scheduled"].map((s) => (
                  <Button key={s} size="sm" variant={statusFilter === s ? "default" : "outline"} onClick={() => { setStatusFilter(s); setPage(1); }}>
                    {STATUS_LABELS[s]}
                  </Button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground">İşletme</label>
                <Select value={restaurantFilter} onValueChange={(v) => { setRestaurantFilter(v); setPage(1); }}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Tümü" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Tümü</SelectItem>
                    {overview?.tenants.map((t) => (
                      <SelectItem key={t.restaurantId} value={t.restaurantId.toString()}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">Başlangıç Tarihi</label>
                <Input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} className="mt-1" />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">Bitiş Tarihi</label>
                <Input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} className="mt-1" />
              </div>

              <div className="flex items-end gap-2">
                <Button size="sm" variant="outline" onClick={() => { setRestaurantFilter(""); setDateFrom(""); setDateTo(""); setPage(1); }} className="w-full">
                  Sıfırla
                </Button>
              </div>
            </div>

            {selectedIds.size > 0 && (
              <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-md mb-4">
                <span className="text-sm font-medium">{selectedIds.size} mesaj seçildi</span>
                <Button size="sm" onClick={bulkRetry} className="ml-auto">
                  <RefreshCw className="h-3.5 w-3.5 mr-1" /> Yeniden Gönder
                </Button>
                <Button size="sm" variant="destructive" onClick={bulkDelete}>
                  <Trash2 className="h-3.5 w-3.5 mr-1" /> Sil
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {loadingOutbox ? (
              <Skeleton className="h-32 w-full" />
            ) : !outbox || outbox.length === 0 ? (
              <p className="text-sm text-muted-foreground">Bu durumda mesaj yok.</p>
            ) : (
              <div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-muted-foreground border-b border-border">
                        <th className="py-2 pr-4 w-8">
                          <Checkbox
                            checked={outbox && outbox.length > 0 && selectedIds.size === outbox.length}
                            onCheckedChange={() => toggleSelectAll(outbox?.map((r) => r.id) ?? [])}
                          />
                        </th>
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
                          <td className="py-2 pr-4">
                            <Checkbox checked={selectedIds.has(row.id)} onCheckedChange={() => toggleSelect(row.id)} />
                          </td>
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

                <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                  <div className="text-xs text-muted-foreground">
                    Sayfa <strong>{page}</strong>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}>
                      Önceki
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setPage(page + 1)} disabled={!outbox || outbox.length < 50}>
                      Sonraki
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
