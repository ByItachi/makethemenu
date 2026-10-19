import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Search, Store, CreditCard, FileText, Truck, Settings, Wrench, Landmark, Loader2, Puzzle, Crown,
} from "lucide-react";
import type { PluginCategory } from "@shared/plugins";

interface PluginItem {
  key: string;
  name: string;
  description: string;
  category: PluginCategory;
  isEnabled: boolean;
  planLocked: boolean;
  settings: Record<string, unknown> | null;
}

const CATEGORY_LABELS: Record<PluginCategory, string> = {
  pazaryeri: "Pazaryerleri",
  odeme: "Ödeme",
  edonusum: "E-Dönüşüm",
  kurye: "Kurye",
  operasyon: "Operasyon",
  muhasebe: "Muhasebe",
};

const CATEGORY_ICONS: Record<PluginCategory, React.ComponentType<any>> = {
  pazaryeri: Store,
  odeme: CreditCard,
  edonusum: FileText,
  kurye: Truck,
  operasyon: Settings,
  muhasebe: Landmark,
};

export default function PluginCenter() {
  const [plugins, setPlugins] = useState<PluginItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<PluginCategory | "all">("all");
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [settingsDraft, setSettingsDraft] = useState("");

  const load = async () => {
    try {
      const res = await fetch("/api/plugins", { credentials: "include" });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setPlugins(data.plugins);
    } catch {
      setError("Eklentiler yüklenemedi. Sayfayı yenileyip tekrar deneyin.");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const toggle = async (p: PluginItem) => {
    setBusyKey(p.key);
    setError(null);
    try {
      const res = await fetch(`/api/plugins/${p.key}/toggle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ enabled: !p.isEnabled }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message ?? "Eklenti güncellenemedi.");
      setPlugins((cur) => (cur ?? []).map((x) => (x.key === p.key ? { ...x, isEnabled: data.isEnabled } : x)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Eklenti güncellenemedi.");
    } finally {
      setBusyKey(null);
    }
  };

  const openSettings = (p: PluginItem) => {
    setEditingKey(editingKey === p.key ? null : p.key);
    setSettingsDraft(p.settings ? JSON.stringify(p.settings, null, 2) : "{}");
  };

  const saveSettings = async (p: PluginItem) => {
    setBusyKey(p.key);
    setError(null);
    try {
      const settings = JSON.parse(settingsDraft);
      const res = await fetch(`/api/plugins/${p.key}/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ settings }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message ?? "Ayarlar kaydedilemedi.");
      setPlugins((cur) => (cur ?? []).map((x) => (x.key === p.key ? { ...x, settings: data.settings } : x)));
      setEditingKey(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ayarlar kaydedilemedi. Geçerli bir JSON girin.");
    } finally {
      setBusyKey(null);
    }
  };

  const categories = useMemo(() => {
    const set = new Set<(PluginCategory)>( (plugins ?? []).map((p) => p.category) );
    return Array.from(set);
  }, [plugins]);

  const filtered = (plugins ?? []).filter((p) => {
    const matchesCategory = category === "all" || p.category === category;
    const q = query.trim().toLocaleLowerCase("tr");
    const matchesQuery = !q || p.name.toLocaleLowerCase("tr").includes(q) || p.description.toLocaleLowerCase("tr").includes(q);
    return matchesCategory && matchesQuery;
  });

  if (!plugins && !error) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-500">
        <Loader2 className="h-6 w-6 animate-spin mr-2" /> Eklentiler yükleniyor...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2 text-slate-900 dark:text-white">
          <Puzzle className="h-6 w-6 text-primary" /> Eklenti Merkezi
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          İşletmenize özel modülleri ekleyin, kaldırın ve yapılandırın.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/40 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Eklenti ara..."
            className="pl-9 bg-white dark:bg-slate-900"
            aria-label="Eklenti ara"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant={category === "all" ? "default" : "outline"} size="sm" onClick={() => setCategory("all")}>
          Tümü
        </Button>
        {categories.map((c) => (
          <Button key={c} variant={category === c ? "default" : "outline"} size="sm" onClick={() => setCategory(c)}>
            {CATEGORY_LABELS[c]}
          </Button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((p) => {
          const Icon = CATEGORY_ICONS[p.category] ?? Wrench;
          return (
            <Card key={p.key} className={`bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 ${p.isEnabled ? "ring-2 ring-primary/40" : ""}`}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                        <span className="truncate">{p.name}</span>
                        {p.planLocked && <Crown className="h-3.5 w-3.5 text-amber-500 shrink-0" aria-label="Üst plan gerekli" />}
                      </div>
                      <Badge variant="secondary" className="mt-1 text-[11px]">
                        {CATEGORY_LABELS[p.category]}
                      </Badge>
                    </div>
                  </div>
                  <Switch
                    checked={p.isEnabled}
                    onCheckedChange={() => toggle(p)}
                    disabled={busyKey === p.key}
                    aria-label={`${p.name} eklentisini ${p.isEnabled ? "kapat" : "aç"}`}
                  />
                </div>

                <p className="text-sm text-slate-500 dark:text-slate-400 mt-3 min-h-[40px]">{p.description}</p>

                <div className="flex items-center justify-between mt-3">
                  <Badge variant={p.isEnabled ? "default" : "outline"} className="text-[11px]">
                    {p.isEnabled ? "Eklendi" : "Kapalı"}
                  </Badge>
                  <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => openSettings(p)} aria-expanded={editingKey === p.key}>
                    <Wrench className="h-3.5 w-3.5 mr-1" /> Ayarlar
                  </Button>
                </div>

                {editingKey === p.key && (
                  <div className="mt-3 space-y-2">
                    <Textarea
                      value={settingsDraft}
                      onChange={(e) => setSettingsDraft(e.target.value)}
                      rows={4}
                      className="font-mono text-xs bg-white dark:bg-slate-950"
                      aria-label={`${p.name} ayarları (JSON)`}
                    />
                    <div className="flex gap-2 justify-end">
                      <Button variant="ghost" size="sm" className="h-8" onClick={() => setEditingKey(null)}>
                        Vazgeç
                      </Button>
                      <Button size="sm" className="h-8" disabled={busyKey === p.key} onClick={() => saveSettings(p)}>
                        {busyKey === p.key ? <Loader2 className="h-4 w-4 animate-spin" /> : "Kaydet"}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <p className="text-sm text-slate-500 dark:text-slate-400 py-8 text-center">Aramanıza uyan eklenti bulunamadı.</p>
      )}
    </div>
  );
}
