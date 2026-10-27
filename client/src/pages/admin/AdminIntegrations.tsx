import { useCallback, useEffect, useState } from "react";
import AdminLayout from "./AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, Puzzle, ShieldCheck, KeyRound, ScrollText, Activity } from "lucide-react";

const CATEGORY_LABELS: Record<string, string> = {
  pazaryeri: "Pazaryerleri", odeme: "Ödeme", edonusum: "E-Dönüşüm",
  kurye: "Kurye", operasyon: "Operasyon", muhasebe: "Muhasebe",
};

interface AdminProvider { key: string; name: string; category: string; implemented: boolean; capabilities: string[]; docs: { sandboxAvailable: boolean; requiresPartnerAgreement: boolean; notes: string } }
interface AdminConnection { restaurantId: number; providerKey: string; status: string; lastTestOk: boolean | null; lastTestAt: string | null; lastSyncAt: string | null; lastError: string | null }
interface ApiKeyRow { id: number; restaurantId: number; label: string; keyPrefix: string; isActive: boolean; lastUsedAt: string | null; createdAt: string | null }
interface LogRow { id: number; restaurantId: number; providerKey: string | null; level: string; event: string; message: string | null; createdAt: string | null }

export default function AdminIntegrations() {
  const [providers, setProviders] = useState<AdminProvider[] | null>(null);
  const [connections, setConnections] = useState<AdminConnection[]>([]);
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [keys, setKeys] = useState<ApiKeyRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [issueRestaurantId, setIssueRestaurantId] = useState("");
  const [issuedKey, setIssuedKey] = useState<string | null>(null);
  const [issuing, setIssuing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [oRes, kRes] = await Promise.all([
        fetch("/api/admin/integration-center/overview", { credentials: "include" }),
        fetch("/api/admin/integration-center/api-keys", { credentials: "include" }),
      ]);
      if (!oRes.ok) throw new Error("Yönetici verisi yüklenemedi.");
      const data = await oRes.json();
      setProviders(data.providers);
      setConnections(data.connections ?? []);
      setLogs(data.logs ?? []);
      if (kRes.ok) setKeys((await kRes.json()).keys ?? []);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Hata");
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const issueKey = async () => {
    const rid = Number(issueRestaurantId);
    if (!Number.isInteger(rid) || rid <= 0) { setError("Geçerli bir işletme ID girin."); return; }
    setIssuing(true);
    try {
      const res = await fetch("/api/admin/integration-center/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ restaurantId: rid, label: `Veri Aktarımı anahtarı #${rid}` }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) { setError(data?.message ?? "Anahtar verilemedi."); return; }
      setIssuedKey(data.key); // tam değer yalnızca bu kez gösterilir
      load();
    } finally {
      setIssuing(false);
    }
  };

  const implementedCount = (providers ?? []).filter((p) => p.implemented).length;
  const connectedCount = connections.filter((c) => c.lastTestOk === true).length;

  return (
    <AdminLayout>
    <div className="p-4 sm:p-6 md:p-8 space-y-6" data-testid="admin-integrations">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Puzzle className="h-6 w-6 text-primary" /> Entegrasyon Merkezi</h1>
        <p className="text-sm text-muted-foreground mt-1">Sistem genelindeki sağlayıcı kataloğu, adapter durumları, bağlantı sağlığı ve API anahtarı yönetimi.</p>
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{error}</div>}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold">{providers?.length ?? "…"}</div><div className="text-xs text-muted-foreground">Katalog Sağlayıcı</div></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-emerald-600">{implementedCount}</div><div className="text-xs text-muted-foreground">Geliştirilmiş Adapter</div></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold">{connections.length}</div><div className="text-xs text-muted-foreground">Toplam Bağlantı</div></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-emerald-600">{connectedCount}</div><div className="text-xs text-muted-foreground">Sağlıklı Bağlantı</div></CardContent></Card>
      </div>

      {/* Sağlayıcı kataloğu */}
      <Card>
        <CardContent className="p-4">
          <h2 className="text-sm font-semibold mb-3 flex items-center gap-2"><Activity className="h-4 w-4" /> Sağlayıcı Kataloğu ve Adapter Durumları</h2>
          <div className="max-h-96 overflow-auto grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2 text-xs">
            {(providers ?? []).map((p) => (
              <div key={p.key} className="border rounded-lg p-2.5 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <strong>{p.name}</strong>
                  <Badge variant="outline" className={`text-[10px] ${p.implemented ? "text-emerald-600" : "text-slate-400"}`}>
                    {p.implemented ? "Geliştirilmiş" : "İskelet"}
                  </Badge>
                </div>
                <div className="text-muted-foreground">{CATEGORY_LABELS[p.category] ?? p.category}</div>
                {p.implemented && <div className="text-[10px] text-slate-400">{p.capabilities.join(", ")}</div>}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Bağlantılar */}
      <Card>
        <CardContent className="p-4">
          <h2 className="text-sm font-semibold mb-3 flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> İşletme Bağlantıları</h2>
          <div className="max-h-72 overflow-auto text-xs space-y-1.5">
            {connections.length === 0 && <div className="text-muted-foreground">Henüz bağlantı yok.</div>}
            {connections.map((c, i) => (
              <div key={i} className="flex items-center justify-between border-b border-border/50 pb-1.5">
                <span>İşletme #{c.restaurantId} · <strong>{c.providerKey}</strong></span>
                <span className={c.lastTestOk ? "text-emerald-600" : "text-red-600"}>{c.lastTestOk ? "✅ bağlı" : c.lastTestOk === false ? "❌ hata" : "—"} {c.lastError ? `· ${c.lastError}` : ""}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* API anahtarı verme */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <h2 className="text-sm font-semibold flex items-center gap-2"><KeyRound className="h-4 w-4" /> Veri Aktarımı API Anahtarı Ver</h2>
          <p className="text-xs text-muted-foreground">Anahtar sha256 özeti olarak saklanır; tam değer yalnızca oluşturulduğu anda gösterilir.</p>
          <div className="flex gap-2 max-w-md">
            <Input placeholder="İşletme ID (örn. 97)" value={issueRestaurantId} onChange={(e) => setIssueRestaurantId(e.target.value)} inputMode="numeric" />
            <Button onClick={issueKey} disabled={issuing} className="gap-1 shrink-0">{issuing && <Loader2 className="h-4 w-4 animate-spin" />} Anahtar Ver</Button>
          </div>
          {issuedKey && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/40 p-3 text-sm">
              <div className="font-medium text-emerald-700 dark:text-emerald-300 mb-1">Anahtar bir kez gösterilir — şimdi kopyalayın:</div>
              <code className="font-mono text-xs break-all">{issuedKey}</code>
            </div>
          )}
          <div className="max-h-48 overflow-auto text-xs space-y-1">
            {keys.map((k) => (
              <div key={k.id} className="flex items-center justify-between border-b border-border/50 pb-1">
                <span>İşletme #{k.restaurantId} · {k.label} · <code>{k.keyPrefix}…</code></span>
                <span className="text-muted-foreground">son kullanım: {k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleString("tr-TR") : "—"}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Loglar */}
      <Card>
        <CardContent className="p-4">
          <h2 className="text-sm font-semibold flex items-center gap-2 mb-3"><ScrollText className="h-4 w-4" /> Son Entegrasyon Olayları (Tüm İşletmeler)</h2>
          <div className="max-h-72 overflow-auto space-y-1.5 text-xs">
            {logs.length === 0 && <div className="text-muted-foreground">Log yok.</div>}
            {logs.map((l) => (
              <div key={l.id} className="flex gap-2 border-b border-border/50 pb-1.5">
                <span className="shrink-0 text-slate-400 font-mono">{new Date(l.createdAt ?? "").toLocaleString("tr-TR")}</span>
                <span>#{l.restaurantId}</span>
                <span className="min-w-0"><strong>{l.event}</strong>{l.message ? ` — ${l.message}` : ""}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
    </AdminLayout>
  );
}
