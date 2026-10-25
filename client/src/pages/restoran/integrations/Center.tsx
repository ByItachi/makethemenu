import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Puzzle, RefreshCw, Trash2, ScrollText, ListChecks, Link2Off, ShieldCheck, Clock, ExternalLink } from "lucide-react";

// Durumlar (prompt-2 §1) — açıkça ayrıştırılmış
const STATUS_META: Record<string, { label: string; className: string }> = {
  connected: { label: "Bağlı", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" },
  pending_config: { label: "Yapılandırma Gerekli", className: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" },
  testing: { label: "Test Ediliyor", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" },
  connected_sync_pending: { label: "Senkronizasyon Bekliyor", className: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300" },
  error: { label: "Hata Oluştu", className: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300" },
  needs_api_access: { label: "API Erişimi Gerekli", className: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300" },
  not_implemented: { label: "Henüz Geliştirilmedi", className: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400" },
  not_available: { label: "Kullanıma Hazır Değil", className: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400" },
};

interface CredentialField { key: string; label: string; type: "text" | "password" | "select"; required: boolean; options?: string[]; help?: string }
interface ConnectionInfo {
  id: number; status: string; maskedCredentials: Record<string, string>;
  lastTestAt: string | null; lastTestOk: boolean | null; lastTestMessage: string | null;
  lastSyncAt: string | null; lastError: string | null; config: unknown;
}
interface ProviderInfo {
  key: string; name: string; category: string; implemented: boolean; capabilities: string[];
  credentialFields: CredentialField[];
  docs: { apiDocsUrl?: string; sandboxAvailable: boolean; requiresPartnerAgreement: boolean; notes: string };
  price: number; connection: ConnectionInfo | null; computedStatus: string;
}
interface LogRow { id: number; providerKey: string | null; level: string; event: string; message: string | null; createdAt: string | null }
interface JobRow { id: number; providerKey: string; jobType: string; status: string; attempts: number; error: string | null; createdAt: string | null }
interface ExternalOrderRow { id: number; providerKey: string; externalOrderId: string; internalOrderId: number | null; status: string; createdAt: string | null }
interface WebhookEndpointRow { id: number; url: string; description: string | null; events: string[] | null; isActive: boolean; secretMasked: string | null; createdAt: string | null }
interface WebhookDeliveryRow { id: number; endpointId: number; event: string; status: string; responseCode: number | null; attempts: number; error: string | null; createdAt: string | null }

const CATEGORY_LABELS: Record<string, string> = {
  pazaryeri: "Pazaryerleri", odeme: "Ödeme", edonusum: "E-Dönüşüm",
  kurye: "Kurye", operasyon: "Operasyon", muhasebe: "Muhasebe",
};

const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleString("tr-TR") : "—");

export default function IntegrationCenter() {
  const [providers, setProviders] = useState<ProviderInfo[] | null>(null);
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [externalOrders, setExternalOrders] = useState<ExternalOrderRow[]>([]);
  const [webhookEndpoints, setWebhookEndpoints] = useState<WebhookEndpointRow[]>([]);
  const [webhookDeliveries, setWebhookDeliveries] = useState<WebhookDeliveryRow[]>([]);
  const [tab, setTab] = useState<"connections" | "orders" | "webhooks">("connections");
  const [newHookUrl, setNewHookUrl] = useState("");
  const [newHookEvents, setNewHookEvents] = useState<string[]>(["order.created"]);
  const [newHookSecret, setNewHookSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [testingKey, setTestingKey] = useState<string | null>(null);
  const [configuring, setConfiguring] = useState<ProviderInfo | null>(null);
  const [credDraft, setCredDraft] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [syncingKey, setSyncingKey] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [pRes, lRes, jRes] = await Promise.all([
        fetch("/api/ic/providers", { credentials: "include" }),
        fetch("/api/ic/logs", { credentials: "include" }),
        fetch("/api/ic/jobs", { credentials: "include" }),
      ]);
      if (!pRes.ok) throw new Error((await pRes.json().catch(() => null))?.message ?? "Yüklenemedi");
      const pData = await pRes.json();
      setProviders(pData.providers);
      if (lRes.ok) setLogs((await lRes.json()).logs ?? []);
      if (jRes.ok) setJobs((await jRes.json()).jobs ?? []);
      const [eoRes, whRes] = await Promise.all([
        fetch("/api/ic/external-orders", { credentials: "include" }),
        fetch("/api/ic/webhook-endpoints", { credentials: "include" }),
      ]);
      if (eoRes.ok) setExternalOrders((await eoRes.json()).orders ?? []);
      if (whRes.ok) {
        const wd = await whRes.json();
        setWebhookEndpoints(wd.endpoints ?? []);
        setWebhookDeliveries(wd.deliveries ?? []);
      }
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Yüklenemedi");
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const testConnection = async (p: ProviderInfo) => {
    setTestingKey(p.key);
    try {
      const res = await fetch(`/api/ic/connections/${p.key}/test`, { method: "POST", credentials: "include" });
      const data = await res.json().catch(() => null);
      if (!res.ok) setError(data?.message ?? "Test başarısız.");
      else setError(data.ok ? null : data.message);
    } finally {
      setTestingKey(null);
      load();
    }
  };

  const disconnect = async (p: ProviderInfo) => {
    if (!confirm(`${p.name} bağlantısı kaldırılsın mı? Kimlik bilgileri silinir.`)) return;
    await fetch(`/api/ic/connections/${p.key}`, { method: "DELETE", credentials: "include" });
    load();
  };

  const runSync = async (p: ProviderInfo) => {
    const cap = p.capabilities.includes("fetchOrders") ? "fetch_orders" : "sync_inventory";
    setSyncingKey(p.key);
    try {
      const res = await fetch(`/api/ic/connections/${p.key}/sync/${cap}`, { method: "POST", credentials: "include" });
      const data = await res.json().catch(() => null);
      if (!res.ok) setError(data?.message ?? "Senkronizasyon başlatılamadı.");
    } finally {
      setSyncingKey(null);
      load();
    }
  };

  const createWebhook = async () => {
    if (!newHookUrl.trim()) { setError("Webhook URL gerekli."); return; }
    const res = await fetch("/api/ic/webhook-endpoints", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ url: newHookUrl.trim(), description: "", events: newHookEvents }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) { setError(data?.message ?? "Endpoint eklenemedi."); return; }
    setNewHookSecret(data.secret ?? null);
    setNewHookUrl("");
    load();
  };

  const deleteWebhook = async (id: number) => {
    if (!confirm("Bu webhook endpoint silinsin mi?")) return;
    await fetch(`/api/ic/webhook-endpoints/${id}`, { method: "DELETE", credentials: "include" });
    load();
  };

  const retryDelivery = async (id: number) => {
    await fetch(`/api/ic/webhook-deliveries/${id}/retry`, { method: "POST", credentials: "include" });
    load();
  };

  const saveCredentials = async () => {
    if (!configuring) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/ic/connections/${configuring.key}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ credentials: credDraft }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) { setError(data?.message ?? "Kaydedilemedi."); return; }
      setConfiguring(null);
      setCredDraft({});
      load();
    } finally {
      setSaving(false);
    }
  };

  const filtered = useMemo(() => (providers ?? []).filter((p) => {
    const c = CATEGORY_LABELS[p.category] ? p.category : p.category;
    const okCat = category === "all" || c === category;
    const okStatus = statusFilter === "all" || p.computedStatus === statusFilter;
    const q = query.trim().toLocaleLowerCase("tr");
    const okQuery = !q || p.name.toLocaleLowerCase("tr").includes(q) || (p.docs.notes ?? "").toLocaleLowerCase("tr").includes(q);
    return okCat && okStatus && okQuery;
  }), [providers, query, category, statusFilter]);

  const categories = useMemo(() => Array.from(new Set((providers ?? []).map((p) => p.category))), [providers]);
  const statuses = useMemo(() => Array.from(new Set((providers ?? []).map((p) => p.computedStatus))), [providers]);

  return (
    <div className="space-y-6" data-testid="integration-center">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Puzzle className="h-6 w-6 text-primary" /> Entegrasyon Merkezi
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Bağlantı durumları gerçek bağlantı testleri ve senkronizasyon sonuçlarıyla belirlenir. Uygulama Mağazası'ndan satın alınan ücretli entegrasyonların bağlantısı buradan yönetilir.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/40 px-3 py-2 text-sm text-red-700 dark:text-red-300" role="alert">
          {error}
        </div>
      )}

      {/* Sekmeler */}
      <div className="flex flex-wrap gap-2 border-b border-border pb-2">
        {([
          ["connections", "Bağlantılar"],
          ["orders", `Harici Siparişler (${externalOrders.length})`],
          ["webhooks", `Webhook'lar (${webhookEndpoints.length})`],
        ] as const).map(([key, label]) => (
          <Button key={key} variant={tab === key ? "default" : "ghost"} size="sm" onClick={() => setTab(key)}>
            {label}
          </Button>
        ))}
      </div>

      {tab === "connections" && (<>
      {/* Filtreler */}
      <div className="space-y-2">
        <Input placeholder="Sağlayıcı ara…" value={query} onChange={(e) => setQuery(e.target.value)} className="max-w-sm" />
        <div className="flex flex-wrap gap-2">
          <Button variant={category === "all" ? "default" : "outline"} size="sm" onClick={() => setCategory("all")}>Tümü</Button>
          {categories.map((c) => (
            <Button key={c} variant={category === c ? "default" : "outline"} size="sm" onClick={() => setCategory(c)}>{CATEGORY_LABELS[c] ?? c}</Button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400 uppercase tracking-wider">Durum:</span>
          <Button variant={statusFilter === "all" ? "default" : "outline"} size="sm" onClick={() => setStatusFilter("all")}>Tümü</Button>
          {statuses.map((s) => (
            <Button key={s} variant={statusFilter === s ? "default" : "outline"} size="sm" onClick={() => setStatusFilter(s)}>{STATUS_META[s]?.label ?? s}</Button>
          ))}
        </div>
      </div>

      {/* Sağlayıcı kartları */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((p) => {
          const meta = STATUS_META[p.computedStatus] ?? STATUS_META.pending_config;
          const conn = p.connection;
          const configured = Boolean(conn);
          return (
            <Card key={p.key} className="flex flex-col" data-testid={`provider-${p.key}`}>
              <CardContent className="p-4 flex flex-col gap-3 grow">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Puzzle className="h-4.5 w-4.5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-sm truncate">{p.name}</div>
                      <div className="text-xs text-muted-foreground">{CATEGORY_LABELS[p.category] ?? p.category}</div>
                    </div>
                  </div>
                  <Badge className={`shrink-0 text-[11px] border-0 ${meta.className}`} data-testid={`status-${p.key}`}>{meta.label}</Badge>
                </div>

                {/* Bağlantı durumu: gerçek test + senkronizasyon sonuçları */}
                <div className="text-xs space-y-1 text-muted-foreground border-t pt-2">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
                    <span>Son test: {fmt(conn?.lastTestAt ?? null)} {conn?.lastTestOk === true ? "✅" : conn?.lastTestOk === false ? "❌" : ""}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 shrink-0" />
                    <span>Son başarılı senkronizasyon: {fmt(conn?.lastSyncAt ?? null)}</span>
                  </div>
                  {conn?.lastTestMessage && (
                    <div className={conn.lastTestOk ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}>{conn.lastTestMessage}</div>
                  )}
                </div>

                <p className="text-xs text-muted-foreground grow">{p.docs.notes}</p>

                {/* Yetenekler */}
                {p.capabilities.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {p.capabilities.map((c) => (
                      <span key={c} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">{c}</span>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-2 pt-1">
                  {!p.implemented ? (
                    <Badge variant="outline" className="text-[11px]">Adapter geliştirme bekleniyor</Badge>
                  ) : !configured ? (
                    <Button size="sm" className="gap-1" onClick={() => { setConfiguring(p); setCredDraft({}); }} data-testid={`configure-${p.key}`}>
                      Bağlantıyı Yapılandır
                    </Button>
                  ) : (
                    <>
                      <Button size="sm" variant="outline" className="gap-1" onClick={() => testConnection(p)} disabled={testingKey === p.key} data-testid={`test-${p.key}`}>
                        {testingKey === p.key ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />} Test
                      </Button>
                      <Button size="sm" variant="outline" className="gap-1" onClick={() => runSync(p)} disabled={syncingKey === p.key}>
                        {syncingKey === p.key ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ListChecks className="h-3.5 w-3.5" />} Senkronize Et
                      </Button>
                      <Button size="sm" variant="ghost" className="gap-1 text-red-600" onClick={() => disconnect(p)} data-testid={`disconnect-${p.key}`}>
                        <Link2Off className="h-3.5 w-3.5" />
                      </Button>
                    </>
                  )}
                  {p.implemented && configured && (
                    <Button size="sm" variant="ghost" className="gap-1 ml-auto" onClick={() => { setConfiguring(p); setCredDraft({}); }}>
                      Kimlik Bilgisi
                    </Button>
                  )}
                </div>
                {p.docs.requiresPartnerAgreement && p.implemented && (
                  <div className="text-[10px] text-muted-foreground">İş ortağı anlaşması gerektirir.</div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Loglar + İşler */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <h2 className="text-sm font-semibold flex items-center gap-2 mb-3"><ScrollText className="h-4 w-4" /> Entegrasyon Geçmişi</h2>
            <div className="max-h-72 overflow-auto space-y-1.5 text-xs">
              {logs.length === 0 && <div className="text-muted-foreground">Henüz log yok.</div>}
              {logs.map((l) => (
                <div key={l.id} className="flex gap-2 border-b border-border/50 pb-1.5">
                  <span className={`shrink-0 font-mono ${l.level === "error" ? "text-red-500" : l.level === "warn" ? "text-amber-500" : "text-slate-400"}`}>
                    {fmt(l.createdAt)}
                  </span>
                  <span className="min-w-0"><strong>{l.event}</strong>{l.message ? ` — ${l.message}` : ""}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <h2 className="text-sm font-semibold flex items-center gap-2 mb-3"><ListChecks className="h-4 w-4" /> Senkronizasyon İşleri</h2>
            <div className="max-h-72 overflow-auto space-y-1.5 text-xs">
              {jobs.length === 0 && <div className="text-muted-foreground">Henüz iş yok.</div>}
              {jobs.map((j) => (
                <div key={j.id} className="flex items-center justify-between gap-2 border-b border-border/50 pb-1.5">
                  <span className="min-w-0"><strong>{j.providerKey}</strong> · {j.jobType} · deneme {j.attempts} · {fmt(j.createdAt)}</span>
                  <Badge variant="outline" className={`text-[10px] ${j.status === "succeeded" ? "text-emerald-600" : j.status === "failed" ? "text-red-600" : ""}`}>{j.status}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      </>)}

      {/* Sekme: Harici Siparişler */}
      {tab === "orders" && (
        <Card>
          <CardContent className="p-4">
            <h2 className="text-sm font-semibold mb-3">Harici Platformlardan Gelen Siparişler</h2>
            <p className="text-xs text-muted-foreground mb-3">Webhook ile gelen siparişler iç siparişe dönüştürülür; aynı harici sipariş kimliği ikinci kez işlenmez (idempotency).</p>
            <div className="max-h-96 overflow-auto text-xs space-y-1.5">
              {externalOrders.length === 0 && <div className="text-muted-foreground">Henüz harici sipariş yok. Webhook testi bekleniyor.</div>}
              {externalOrders.map((o) => (
                <div key={o.id} className="flex items-center justify-between gap-2 border-b border-border/50 pb-1.5">
                  <span className="min-w-0"><strong>{o.providerKey}</strong> · {o.externalOrderId} · {fmt(o.createdAt)}</span>
                  <span className="flex items-center gap-2 shrink-0">
                    {o.internalOrderId && <Badge variant="outline" className="text-[10px]">İç sipariş #{o.internalOrderId}</Badge>}
                    <Badge variant="outline" className="text-[10px]">{o.status}</Badge>
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sekme: Webhook'lar */}
      {tab === "webhooks" && (
        <div className="space-y-4">
          <Card>
            <CardContent className="p-4 space-y-3">
              <h2 className="text-sm font-semibold">Yeni Webhook Endpoint'i</h2>
              <p className="text-xs text-muted-foreground">Sipariş ve senkronizasyon olayları bu adrese HMAC-SHA256 imzalı POST ile gönderilir (X-MTM-Signature). Secret yalnızca oluşturma anında tam gösterilir.</p>
              <div className="flex flex-wrap gap-2">
                <Input placeholder="https://sizin-sunucunuz.com/webhook" value={newHookUrl} onChange={(e) => setNewHookUrl(e.target.value)} className="max-w-md" />
                <Button onClick={createWebhook} className="gap-1 shrink-0">Endpoint Ekle</Button>
              </div>
              <div className="flex flex-wrap gap-3 text-xs">
                {["order.created", "order.updated", "payment.completed", "integration.sync.completed"].map((ev) => (
                  <label key={ev} className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newHookEvents.includes(ev)}
                      onChange={(e) => setNewHookEvents((prev) => (e.target.checked ? [...prev, ev] : prev.filter((x) => x !== ev)))}
                      className="accent-primary"
                    />
                    <code>{ev}</code>
                  </label>
                ))}
              </div>
              {newHookSecret && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/40 p-3 text-sm">
                  <div className="font-medium text-emerald-700 dark:text-emerald-300 mb-1">Signing secret — bir kez gösterilir, şimdi kopyalayın:</div>
                  <code className="font-mono text-xs break-all">{newHookSecret}</code>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <h2 className="text-sm font-semibold mb-3">Kayıtlı Endpoint'ler</h2>
              <div className="max-h-64 overflow-auto text-xs space-y-1.5">
                {webhookEndpoints.length === 0 && <div className="text-muted-foreground">Endpoint yok.</div>}
                {webhookEndpoints.map((e) => (
                  <div key={e.id} className="flex items-center justify-between gap-2 border-b border-border/50 pb-1.5">
                    <div className="min-w-0">
                      <div className="truncate font-mono">{e.url}</div>
                      <div className="text-[10px] text-muted-foreground">{(e.events ?? []).join(", ")} · secret {e.secretMasked} · {fmt(e.createdAt)}</div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="outline" className={`text-[10px] ${e.isActive ? "text-emerald-600" : "text-slate-400"}`}>{e.isActive ? "aktif" : "pasif"}</Badge>
                      <Button size="sm" variant="ghost" className="text-red-600 h-7 px-2" onClick={() => deleteWebhook(e.id)} aria-label="Sil"><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <h2 className="text-sm font-semibold mb-3">Son Teslimatlar</h2>
              <div className="max-h-64 overflow-auto text-xs space-y-1.5">
                {webhookDeliveries.length === 0 && <div className="text-muted-foreground">Teslimat yok.</div>}
                {webhookDeliveries.map((d) => (
                  <div key={d.id} className="flex items-center justify-between gap-2 border-b border-border/50 pb-1.5">
                    <span className="min-w-0"><strong>{d.event}</strong> · deneme {d.attempts} · {fmt(d.createdAt)}{d.error ? ` · ${d.error}` : ""}</span>
                    <span className="flex items-center gap-2 shrink-0">
                      {d.responseCode != null && <span className={d.status === "delivered" ? "text-emerald-600" : "text-red-600"}>{d.responseCode}</span>}
                      <Badge variant="outline" className={`text-[10px] ${d.status === "delivered" ? "text-emerald-600" : d.status === "failed" ? "text-red-600" : ""}`}>{d.status}</Badge>
                      {d.status === "failed" && (
                        <Button size="sm" variant="outline" className="h-7 px-2 text-[11px]" onClick={() => retryDelivery(d.id)}>Tekrar dene</Button>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Yapılandırma diyaloğu */}
      {configuring && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-label={`${configuring.name} bağlantı ayarları`}>
          <Card className="w-full max-w-md">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{configuring.name} — Bağlantı Ayarları</h3>
                <Button variant="ghost" size="sm" onClick={() => setConfiguring(null)} aria-label="Kapat">✕</Button>
              </div>
              <p className="text-xs text-muted-foreground">{configuring.docs.notes}</p>
              {configuring.credentialFields.map((f) => (
                <div key={f.key} className="space-y-1">
                  <Label htmlFor={`cred-${f.key}`}>{f.label}{f.required && " *"}</Label>
                  <Input
                    id={`cred-${f.key}`}
                    type={f.type === "password" ? "password" : "text"}
                    autoComplete="off"
                    value={credDraft[f.key] ?? ""}
                    placeholder={configuring.connection?.maskedCredentials?.[f.key] || f.help || ""}
                    onChange={(e) => setCredDraft((d) => ({ ...d, [f.key]: e.target.value }))}
                  />
                  {f.help && <p className="text-[10px] text-muted-foreground">{f.help}</p>}
                </div>
              ))}
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setConfiguring(null)}>İptal</Button>
                <Button onClick={saveCredentials} disabled={saving} className="gap-1">
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />} Kaydet
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
