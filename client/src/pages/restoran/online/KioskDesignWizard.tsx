import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Check, ChevronLeft, ChevronRight, Monitor, Palette, Image as ImageIcon, Type, LayoutGrid, Globe, CreditCard, Volume2, Rocket } from "lucide-react";

/**
 * QRall tarzı 8 adımlı Kiosk kişiselleştirme sihirbazı.
 * Kalıcılık: POST /api/plugins/kiosk/settings (JSON ayarlar, en fazla 4 KB).
 */

type KioskSettings = {
  theme: string;
  logoUrl: string;
  welcomeText: string;
  layout: string;
  language: string;
  paymentTypes: string[];
  orderSound: boolean;
};

const THEMES: { key: string; name: string; hex: string }[] = [
  { key: "yesil", name: "Yeşil", hex: "#059669" },
  { key: "mavi", name: "Mavi", hex: "#2563eb" },
  { key: "kirmizi", name: "Kırmızı", hex: "#dc2626" },
  { key: "mor", name: "Mor", hex: "#9333ea" },
  { key: "turuncu", name: "Turuncu", hex: "#ea580c" },
  { key: "grafit", name: "Grafit", hex: "#334155" },
];

const LAYOUTS: { key: string; name: string; desc: string }[] = [
  { key: "buyuk-gorsel", name: "Büyük Görsel", desc: "Tek sütun, dokunmatik dostu büyük kartlar" },
  { key: "iki-kolon", name: "İki Kolon", desc: "Hızlı seçim için yoğun ızgara" },
  { key: "kusak", name: "Kuşak Menü", desc: "Kategoriler üst kuşakta, ürünler altta" },
];

const PAYMENT_OPTIONS: { key: string; name: string }[] = [
  { key: "kredi-karti", name: "Kredi Kartı" },
  { key: "nakit", name: "Nakit" },
  { key: "yemek-karti", name: "Yemek Kartı" },
];

const STEPS = ["Tema", "Logo", "Karşılama", "Düzen", "Dil", "Ödeme", "Ses", "Özet"];

export const KioskDesignWizard: React.FC = () => {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [saved, setSaved] = useState(false);
  const [s, setS] = useState<KioskSettings>({
    theme: "yesil",
    logoUrl: "",
    welcomeText: "Siparişinizi seçmek için dokunun",
    layout: "buyuk-gorsel",
    language: "tr",
    paymentTypes: ["kredi-karti"],
    orderSound: true,
  });

  const save = useMutation({
    mutationFn: async () => {
      await apiRequest("PUT", "/api/plugins/kiosk/settings", { settings: s });
      return apiRequest("POST", "/api/plugins/kiosk/toggle", { enabled: true });
    },
    onSuccess: () => {
      setSaved(true);
      toast({ title: "Kiosk tasarımı kaydedildi" });
    },
    onError: (e: Error) => toast({ title: "Kaydedilemedi", description: e.message, variant: "destructive" }),
  });

  const accent = THEMES.find((t) => t.key === s.theme)?.hex ?? THEMES[0].hex;
  const togglePayment = (key: string) =>
    setS((p) => ({ ...p, paymentTypes: p.paymentTypes.includes(key) ? p.paymentTypes.filter((k) => k !== key) : [...p.paymentTypes, key] }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2"><Monitor className="h-6 w-6" /> Kiosk Tasarım Sihirbazı</h1>
        <p className="text-sm text-muted-foreground">Kendi kendine hizmet kiosğunuzu 8 adımda kişiselleştirin.</p>
      </div>

      <ol className="flex flex-wrap gap-2" aria-label="Sihirbaz adımları">
        {STEPS.map((label, i) => (
          <li key={label}>
            <Button variant={step === i + 1 ? "default" : "outline"} size="sm" onClick={() => setStep(i + 1)} aria-current={step === i + 1 ? "step" : undefined}>
              <span className="mr-1 text-xs opacity-70">{i + 1}.</span> {label}
            </Button>
          </li>
        ))}
      </ol>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div>
          {step === 1 && (
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Palette className="h-5 w-5" /> Tema rengi</CardTitle></CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {THEMES.map((t) => (
                  <button key={t.key} type="button" onClick={() => setS((p) => ({ ...p, theme: t.key }))}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${s.theme === t.key ? "border-primary ring-2 ring-primary/30" : ""}`} aria-pressed={s.theme === t.key}>
                    <span className="h-4 w-4 rounded-full" style={{ backgroundColor: t.hex }} /> {t.name}
                    {s.theme === t.key && <Check className="h-4 w-4 text-primary" />}
                  </button>
                ))}
              </CardContent>
            </Card>
          )}
          {step === 2 && (
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><ImageIcon className="h-5 w-5" /> Logo</CardTitle><CardDescription>Logo görselinizin bağlantısını girin.</CardDescription></CardHeader>
              <CardContent>
                <Input value={s.logoUrl} onChange={(e) => setS((p) => ({ ...p, logoUrl: e.target.value }))} placeholder="https://…/logo.png" aria-label="Logo bağlantısı" />
              </CardContent>
            </Card>
          )}
          {step === 3 && (
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Type className="h-5 w-5" /> Karşılama yazısı</CardTitle></CardHeader>
              <CardContent>
                <Input value={s.welcomeText} onChange={(e) => setS((p) => ({ ...p, welcomeText: e.target.value }))} maxLength={80} aria-label="Karşılama yazısı" />
              </CardContent>
            </Card>
          )}
          {step === 4 && (
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><LayoutGrid className="h-5 w-5" /> Düzen</CardTitle></CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-3">
                {LAYOUTS.map((l) => (
                  <button key={l.key} type="button" onClick={() => setS((p) => ({ ...p, layout: l.key }))}
                    className={`rounded-lg border p-4 text-left ${s.layout === l.key ? "border-primary ring-2 ring-primary/30" : ""}`} aria-pressed={s.layout === l.key}>
                    <p className="text-sm font-medium flex items-center gap-1">{l.name} {s.layout === l.key && <Check className="h-4 w-4 text-primary" />}</p>
                    <p className="text-xs text-muted-foreground mt-1">{l.desc}</p>
                  </button>
                ))}
              </CardContent>
            </Card>
          )}
          {step === 5 && (
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Globe className="h-5 w-5" /> Varsayılan dil</CardTitle></CardHeader>
              <CardContent className="flex gap-2">
                {[["tr", "Türkçe"], ["en", "English"], ["ar", "العربية"]].map(([k, n]) => (
                  <Button key={k} variant={s.language === k ? "default" : "outline"} size="sm" onClick={() => setS((p) => ({ ...p, language: k }))} aria-pressed={s.language === k}>{n}</Button>
                ))}
              </CardContent>
            </Card>
          )}
          {step === 6 && (
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5" /> Ödeme tipleri</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {PAYMENT_OPTIONS.map((p) => (
                  <div key={p.key} className="flex items-center justify-between rounded-lg border p-3">
                    <span className="text-sm">{p.name}</span>
                    <Switch checked={s.paymentTypes.includes(p.key)} onCheckedChange={() => togglePayment(p.key)} aria-label={p.name} />
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
          {step === 7 && (
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Volume2 className="h-5 w-5" /> Sipariş onay sesi</CardTitle></CardHeader>
              <CardContent>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <span className="text-sm">Sipariş alındığında sesli onay çalınsın</span>
                  <Switch checked={s.orderSound} onCheckedChange={(v) => setS((p) => ({ ...p, orderSound: v }))} aria-label="Sipariş sesi" />
                </div>
              </CardContent>
            </Card>
          )}
          {step === 8 && (
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Rocket className="h-5 w-5" /> Özet</CardTitle></CardHeader>
              <CardContent className="space-y-1 text-sm">
                <p>Tema: {THEMES.find((t) => t.key === s.theme)?.name}</p>
                <p>Logo: {s.logoUrl || "— (varsayılan)"}</p>
                <p>Karşılama: {s.welcomeText}</p>
                <p>Düzen: {LAYOUTS.find((l) => l.key === s.layout)?.name}</p>
                <p>Dil: {s.language.toUpperCase()}</p>
                <p>Ödeme: {s.paymentTypes.map((k) => PAYMENT_OPTIONS.find((p) => p.key === k)?.name ?? k).join(", ") || "—"}</p>
                <p>Sesli onay: {s.orderSound ? "Açık" : "Kapalı"}</p>
                {saved && <p className="text-green-600 font-medium pt-2">Kaydedildi — kiosklarınız bir sonraki açılışta bu tasarımı kullanır.</p>}
              </CardContent>
            </Card>
          )}

          <div className="mt-4 flex justify-between">
            <Button variant="outline" onClick={() => setStep((n) => Math.max(1, n - 1))} disabled={step === 1}><ChevronLeft className="h-4 w-4 mr-1" /> Geri</Button>
            {step < 8 ? (
              <Button onClick={() => setStep((n) => n + 1)}>İleri <ChevronRight className="h-4 w-4 ml-1" /></Button>
            ) : (
              <Button onClick={() => save.mutate()} disabled={save.isPending}>{save.isPending ? "Kaydediliyor…" : saved ? "Tekrar Kaydet" : "Kaydet ve Uygula"}</Button>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">CANLI ÖNİZLEME</p>
          <div className="rounded-xl border bg-background p-4" data-testid="kiosk-preview">
            {s.logoUrl && <img src={s.logoUrl} alt="Kiosk logosu" className="h-10 mx-auto mb-2 object-contain" />}
            <p className="text-center text-xs font-semibold">{s.welcomeText}</p>
            <div className={`mt-3 ${s.layout === "iki-kolon" ? "grid grid-cols-2 gap-2" : "space-y-2"}`}>
              {["Menü 1", "Menü 2"].map((n) => (
                <div key={n} className="border border-border p-3 rounded-lg">
                  {s.layout !== "kusak" && <div className="mb-2 h-12 w-full rounded bg-muted" />}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium">{n}</span>
                    <span className="text-xs font-bold" style={{ color: accent }}>120₺</span>
                  </div>
                </div>
              ))}
            </div>
            {s.paymentTypes.length > 0 && (
              <p className="mt-3 text-center text-[10px] text-muted-foreground">{s.paymentTypes.map((k) => PAYMENT_OPTIONS.find((p) => p.key === k)?.name).join(" · ")}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
