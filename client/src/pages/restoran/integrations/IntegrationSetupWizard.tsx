import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { CheckCircle2, ChevronLeft, ChevronRight, ShieldCheck, Sparkles, Rocket } from "lucide-react";

/**
 * Adisyo tarzı 3 adımlı entegrasyon kurulum sihirbazı.
 * Kalıcılık Eklenti Merkezi uç noktaları üzerinden yapılır:
 *   POST /api/plugins/:key/settings  (kimlik bilgileri + çalışma tipi)
 *   POST /api/plugins/:key/toggle    { enabled: true }
 * Mağazadaki entegrasyon kimlikleri shared/plugins.ts kataloğuyla eşlenir.
 */

// Mağaza entegrasyon kimliği → Eklenti Merkezi katalog anahtarı
export const INTEGRATION_PLUGIN_KEYS: Record<string, string> = {
  "urun-3d-gosterim": "menu-3d",
  getir: "getiryemek",
};

export type IntegrationInfo = {
  id: string;
  name: string;
  description: string;
  category?: string;
};

const WORK_MODES: Record<string, { value: string; label: string; desc: string }[]> = {
  pazaryeri: [
    { value: "siparis", label: "Sadece Sipariş Çekimi", desc: "Pazaryerinden gelen siparişler POS ekranınıza düşer." },
    { value: "siparis-menu", label: "Sipariş + Menü Senkronizasyonu", desc: "Siparişleriniz ve menünüz iki yönlü eşitlenir." },
    { value: "siparis-stok", label: "Sipariş + Stok Senkronizasyonu", desc: "Siparişlerle birlikte stok adetleri otomatik düşer." },
  ],
  odeme: [
    { value: "hosted", label: "Yönlendirmeli Ödeme (3D)", desc: "Ödeme sayfası sağlayıcının güvenli sayfasında açılır." },
    { value: "direct", label: "Doğrudan Sanal POS", desc: "Kart bilgileri sizin alan adınız üzerinde toplanır." },
  ],
  default: [
    { value: "temel", label: "Temel Kurulum", desc: "Önerilen ayarlarla hızlı başlangıç." },
    { value: "ozel", label: "Özel Yapılandırma", desc: "Tüm seçenekleri kendiniz belirlersiniz." },
  ],
};

export const IntegrationSetupWizard: React.FC<{
  integration: IntegrationInfo;
  open: boolean;
  onClose: () => void;
}> = ({ integration, open, onClose }) => {
  const pluginKey = INTEGRATION_PLUGIN_KEYS[integration.id] ?? integration.id;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [workMode, setWorkMode] = useState("");
  const [credentials, setCredentials] = useState({ apiKey: "", apiSecret: "", restaurantCode: "" });
  const [autoAccept, setAutoAccept] = useState(true);
  const [done, setDone] = useState(false);

  const pluginsQuery = useQuery<{ plugins: { key: string; isEnabled: boolean; settings: unknown }[] }>({
    queryKey: ["/api/plugins"],
    queryFn: async () => (await apiRequest("GET", "/api/plugins")).json(),
    enabled: open,
  });

  const saveSettings = useMutation({
    mutationFn: async () => {
      const settings = { workMode: workMode || "temel", credentials, autoAcceptOrders: autoAccept, configuredAt: new Date().toISOString() };
      await apiRequest("PUT", `/api/plugins/${pluginKey}/settings`, { settings });
      return apiRequest("POST", `/api/plugins/${pluginKey}/toggle`, { enabled: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/plugins"] });
      setDone(true);
      setStep(4);
    },
    onError: (e: Error) => toast({ title: "Kurulum tamamlanamadı", description: e.message, variant: "destructive" }),
  });

  if (!open) return null;

  const current = pluginsQuery.data?.plugins?.find((p) => p.key === pluginKey);
  const modes = WORK_MODES[integration.category ?? "default"] ?? WORK_MODES.default;
  const progress = Math.round(((step - 1) / 3) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg bg-background text-foreground rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`${integration.name} kurulum sihirbazı`}
        data-testid="integration-wizard"
      >
        <div className="p-6 pb-0">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" /> {integration.name} Kurulumu
            </h2>
            <Button variant="ghost" size="sm" onClick={onClose}>Kapat</Button>
          </div>
          <div className="mt-3" aria-hidden="true">
            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
              <div className="h-full bg-primary transition-all" style={{ width: `${done ? 100 : progress}%` }} />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{done ? "Tamamlandı" : `İlerleme: %${progress}`}</p>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {step === 1 && (
            <div className="space-y-3">
              <p className="text-sm font-medium">Bu entegrasyon ne yapar?</p>
              <p className="text-sm text-muted-foreground">{integration.description}</p>
              <ul className="text-sm space-y-1 list-disc pl-5">
                <li>Siparişler anında panele düşer</li>
                <li>Menünüz isterseniz otomatik eşitlenir</li>
                <li>15 gün ücretsiz deneyin, dilediğinizde iptal edin</li>
              </ul>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-2" role="radiogroup" aria-label="Çalışma tipi seçimi">
              <p className="text-sm font-medium">Çalışma Tipi Seçimi</p>
              {modes.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  role="radio"
                  aria-checked={workMode === m.value}
                  onClick={() => setWorkMode(m.value)}
                  className={`w-full rounded-lg border p-3 text-left transition-colors ${workMode === m.value ? "border-primary ring-2 ring-primary/30" : ""}`}
                >
                  <p className="text-sm font-medium">{m.label}</p>
                  <p className="text-xs text-muted-foreground">{m.desc}</p>
                </button>
              ))}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              <p className="text-sm font-medium flex items-center gap-1"><ShieldCheck className="h-4 w-4 text-primary" /> API Bilgileri</p>
              <div className="space-y-1">
                <Label htmlFor="wiz-api-key">API Anahtarı / Kullanıcı Adı</Label>
                <Input id="wiz-api-key" value={credentials.apiKey} onChange={(e) => setCredentials((c) => ({ ...c, apiKey: e.target.value }))} placeholder="ör. 8f2b…-prod" autoComplete="off" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="wiz-api-secret">API Gizli Anahtarı / Şifre</Label>
                <Input id="wiz-api-secret" type="password" value={credentials.apiSecret} onChange={(e) => setCredentials((c) => ({ ...c, apiSecret: e.target.value }))} autoComplete="new-password" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="wiz-rest-code">Restoran / Şube Kodu</Label>
                <Input id="wiz-rest-code" value={credentials.restaurantCode} onChange={(e) => setCredentials((c) => ({ ...c, restaurantCode: e.target.value }))} placeholder="ör. 9-Demo" />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <span className="text-sm">Siparişleri otomatik kabul et</span>
                <Switch checked={autoAccept} onCheckedChange={setAutoAccept} aria-label="Otomatik kabul" />
              </div>
              <p className="text-xs text-muted-foreground">Bilgiler şifreli olarak yalnızca hesabınızda saklanır.</p>
            </div>
          )}

          {step === 4 && done && (
            <div className="space-y-3 text-center py-4">
              <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto" />
              <p className="text-lg font-bold">Entegrasyon etkinleştirildi</p>
              <p className="text-sm text-muted-foreground">{integration.name} artık hesabınızda çalışıyor. Ayarları daha sonra dilediğiniz zaman güncelleyebilirsiniz.</p>
            </div>
          )}
        </div>

        <div className="px-6 pb-6 flex items-center justify-between">
          <Button variant="outline" onClick={() => setStep((s) => Math.max(1, s - 1))} disabled={step === 1 || done}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Geri
          </Button>
          {step < 3 && (
            <Button onClick={() => setStep((s) => s + 1)} disabled={step === 2 && !workMode}>
              İleri <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
          {step === 3 && (
            <Button onClick={() => saveSettings.mutate()} disabled={saveSettings.isPending}>
              <Rocket className="h-4 w-4 mr-1" /> {saveSettings.isPending ? "Etkinleştiriliyor…" : "Kurulumu Tamamla"}
            </Button>
          )}
          {step === 4 && done && <Button onClick={onClose}>Kapat</Button>}
        </div>
      </div>
    </div>
  );
};

/** Mağaza sayfasında "+ Ekle" akışını yöneten yardımcı kancalar ve panel */
export function usePluginState() {
  return useQuery<{ plugins: { key: string; isEnabled: boolean; settings: unknown }[] }>({
    queryKey: ["/api/plugins"],
    queryFn: async () => (await apiRequest("GET", "/api/plugins")).json(),
  });
}
