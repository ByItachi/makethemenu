import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ExternalLink, Palette, Image as ImageIcon, LayoutGrid, Globe, Check, Plus } from "lucide-react";

type Settings = {
  id: number;
  name: string;
  currency: string;
  isPublished: boolean;
  publicUrl: string | null;
  menuTheme: string;
  menuRadius: number;
  menuTemplate: string;
  showProductImages: boolean;
  menuLanguage: string;
  paymentTypes: PaymentType[] | null;
};

export type PaymentType = { id: string; name: string; group: "qrmenu" | "kiosk" | "kapida"; enabled: boolean };

function useSettings() {
  return useQuery<Settings>({
    queryKey: ["/api/restaurant"],
    queryFn: async () => (await apiRequest("GET", "/api/restaurant")).json(),
  });
}

function useUpdateSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (patch: Record<string, unknown>) => {
      const res = await apiRequest("PATCH", "/api/restaurant", patch);
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/restaurant"] }),
    onError: (e: Error) => toast({ title: "Kaydedilemedi", description: e.message, variant: "destructive" }),
  });
}

const THEMES: { key: string; name: string; hex: string }[] = [
  { key: "yesil", name: "Yeşil", hex: "#059669" },
  { key: "mavi", name: "Mavi", hex: "#2563eb" },
  { key: "kirmizi", name: "Kırmızı", hex: "#dc2626" },
  { key: "mor", name: "Mor", hex: "#9333ea" },
  { key: "turuncu", name: "Turuncu", hex: "#ea580c" },
  { key: "grafit", name: "Grafit", hex: "#334155" },
];

const TEMPLATES: { key: string; name: string; desc: string }[] = [
  { key: "liste", name: "Liste", desc: "Klasik, satır satır menü" },
  { key: "izgara", name: "Izgara", desc: "İki kolon, kompakt kartlar" },
  { key: "kart", name: "Kart", desc: "Büyük görselli kartlar" },
];

const LANGS: { key: string; name: string }[] = [
  { key: "tr", name: "Türkçe" },
  { key: "en", name: "English" },
  { key: "ar", name: "العربية" },
];

function MiniPreview({ theme, radius, template }: { theme: string; radius: number; template: string }) {
  const accent = THEMES.find((t) => t.key === theme)?.hex ?? THEMES[0].hex;
  const grid = template !== "liste";
  return (
    <div className="rounded-xl border bg-background p-3" data-testid="wizard-preview">
      <div className="mx-auto mb-2 h-1 w-10 rounded-full" style={{ backgroundColor: accent }} />
      <p className="text-center text-xs font-semibold">Menü Önizleme</p>
      <div className={`mt-2 ${grid ? "grid grid-cols-2 gap-2" : "space-y-2"}`}>
        {["Margherita", "Pepperoni"].map((n) => (
          <div key={n} className="border border-border p-2" style={{ borderRadius: radius }}>
            {grid && <div className="mb-1 h-10 w-full rounded bg-muted" style={{ borderRadius: Math.max(2, radius - 4) }} />}
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium">{n}</span>
              <span className="text-xs font-semibold" style={{ color: accent }}>120₺</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function MenuDesignWizard() {
  const { data: r, isLoading } = useSettings();
  const update = useUpdateSettings();
  const [step, setStep] = useState(1);

  if (isLoading || !r) return <Skeleton className="h-64 w-full" />;

  const save = (patch: Record<string, unknown>) => update.mutate(patch);
  const steps = ["Görünüm", "Görseller", "Düzen", "Dil & Yayın"];

  return (
    <div className="space-y-6">
      {/* Adım göstergesi */}
      <ol className="flex flex-wrap gap-2" aria-label="Sihirbaz adımları">
        {steps.map((s, i) => (
          <li key={s}>
            <Button
              variant={step === i + 1 ? "default" : "outline"}
              size="sm"
              onClick={() => setStep(i + 1)}
              aria-current={step === i + 1 ? "step" : undefined}
            >
              <span className="mr-1 text-xs opacity-70">{i + 1}.</span> {s}
            </Button>
          </li>
        ))}
      </ol>

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <div>
          {step === 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Palette className="h-5 w-5" /> QR Menü Sayfa Görünümü</CardTitle>
                <CardDescription>Tema rengi ve köşe yarıçapı anında kaydedilir.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div>
                  <p className="mb-2 text-sm font-medium">Renk Şeması</p>
                  <div className="flex flex-wrap gap-2">
                    {THEMES.map((t) => (
                      <button
                        key={t.key}
                        type="button"
                        onClick={() => save({ menuTheme: t.key })}
                        className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${r.menuTheme === t.key ? "border-primary ring-2 ring-primary/30" : ""}`}
                        aria-pressed={r.menuTheme === t.key}
                      >
                        <span className="h-4 w-4 rounded-full" style={{ backgroundColor: t.hex }} />
                        {t.name}
                        {r.menuTheme === t.key && <Check className="h-4 w-4 text-primary" />}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-sm font-medium">Kenar / Dolgu Yarıçapı</p>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={0}
                      max={32}
                      value={r.menuRadius}
                      onChange={(e) => save({ menuRadius: Number(e.target.value) })}
                      className="w-64"
                      aria-label="Köşe yarıçapı"
                    />
                    <span className="text-sm text-muted-foreground">{r.menuRadius} px</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 2 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><ImageIcon className="h-5 w-5" /> Ürün Görselleri</CardTitle>
                <CardDescription>Ürün kartlarında fotoğraf gösterimi. Görseller ürün kayıtlarından gelir.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium">Ürün görsellerini göster</p>
                    <p className="text-xs text-muted-foreground">{r.showProductImages ? "Görseller menüde görünüyor" : "Yalnızca isim ve fiyat listelenir"}</p>
                  </div>
                  <Switch checked={r.showProductImages} onCheckedChange={(v) => save({ showProductImages: v })} disabled={update.isPending} />
                </div>
              </CardContent>
            </Card>
          )}

          {step === 3 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><LayoutGrid className="h-5 w-5" /> Menü Düzeni</CardTitle>
                <CardDescription>Ürünlerin nasıl sıralanacağını seçin.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-3">
                {TEMPLATES.map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => save({ menuTemplate: t.key })}
                    className={`rounded-lg border p-4 text-left transition-colors ${r.menuTemplate === t.key ? "border-primary ring-2 ring-primary/30" : ""}`}
                    aria-pressed={r.menuTemplate === t.key}
                  >
                    <p className="text-sm font-medium flex items-center gap-1">{t.name} {r.menuTemplate === t.key && <Check className="h-4 w-4 text-primary" />}</p>
                    <p className="text-xs text-muted-foreground mt-1">{t.desc}</p>
                  </button>
                ))}
              </CardContent>
            </Card>
          )}

          {step === 4 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Globe className="h-5 w-5" /> Dil & Yayın</CardTitle>
                <CardDescription>Varsayılan menü dilini seçin ve menünüzü yayınlayın.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div>
                  <p className="mb-2 text-sm font-medium">Varsayılan dil</p>
                  <div className="flex flex-wrap gap-2">
                    {LANGS.map((l) => (
                      <Button
                        key={l.key}
                        variant={r.menuLanguage === l.key ? "default" : "outline"}
                        size="sm"
                        onClick={() => save({ menuLanguage: l.key })}
                        aria-pressed={r.menuLanguage === l.key}
                      >
                        {l.name}
                      </Button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-sm font-medium">Para birimi</p>
                  <Input value={r.currency} readOnly className="w-24" aria-label="Para birimi" />
                  <p className="mt-1 text-xs text-muted-foreground">Para birimini İşletme Ayarları'ndan değiştirin.</p>
                </div>
                <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
                  <div>
                    <p className="text-sm font-medium">Menü yayında</p>
                    <p className="text-xs text-muted-foreground">{r.isPublished ? "Menü herkese açık" : "Menü kapalı"}</p>
                  </div>
                  <Switch checked={r.isPublished} onCheckedChange={(v) => save({ isPublished: v })} disabled={update.isPending} />
                </div>
                {r.publicUrl && (
                  <a href={r.publicUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-primary underline">
                    Menüyü yeni sekmede önizle <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </CardContent>
            </Card>
          )}

          <div className="mt-4 flex justify-between">
            <Button variant="outline" onClick={() => setStep((s) => Math.max(1, s - 1))} disabled={step === 1}>Geri</Button>
            <Button onClick={() => setStep((s) => Math.min(steps.length, s + 1))} disabled={step === steps.length}>İleri</Button>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">CANLI ÖNİZLEME</p>
          <MiniPreview theme={r.menuTheme} radius={r.menuRadius} template={r.menuTemplate} />
        </div>
      </div>
    </div>
  );
}

// ─── Ödeme Tipleri sayfası ───────────────────────────────────────────────────
const GROUPS: { key: PaymentType["group"]; name: string; desc: string; defaults: { id: string; name: string }[] }[] = [
  {
    key: "qrmenu",
    name: "QR Menü",
    desc: "Misafirler karekoddan sipariş verirken sunulan online ödeme seçenekleri.",
    defaults: [
      { id: "kredi-karti", name: "Kredi Kartı" },
      { id: "banka-karti", name: "Banka Kartı" },
      { id: "yemek-karti", name: "Yemek Kartı" },
      { id: "multinet", name: "Multinet" },
      { id: "sodexo", name: "Sodexo" },
      { id: "setcard", name: "SetCard" },
      { id: "ticket", name: "Ticket" },
      { id: "kapida-odeme", name: "Kapıda Ödeme" },
    ],
  },
  {
    key: "kiosk",
    name: "Kiosk",
    desc: "Kendi kendine hizmet kiosklarında sunulan ödeme seçenekleri.",
    defaults: [
      { id: "nakit", name: "Nakit" },
      { id: "kredi-karti", name: "Kredi Kartı" },
      { id: "yemek-karti", name: "Yemek Kartı" },
      { id: "multinet", name: "Multinet" },
      { id: "sodexo", name: "Sodexo" },
    ],
  },
  {
    key: "kapida",
    name: "Kapıda Kredi",
    desc: "Kapıda ödeme yöntemleri ve taksit seçenekleri.",
    defaults: [
      { id: "nakit", name: "Kapıda Nakit" },
      { id: "kredi-karti-tek", name: "Kredi Kartı (Tek Çekim)" },
      { id: "kredi-karti-taksit", name: "Kredi Kartı (Taksitli)" },
    ],
  },
];

export function PaymentTypesSettings() {
  const { data: r, isLoading } = useSettings();
  const update = useUpdateSettings();
  const [newNames, setNewNames] = useState<Record<string, string>>({});
  const [showAdd, setShowAdd] = useState<Record<string, boolean>>({});

  if (isLoading || !r) return <Skeleton className="h-64 w-full" />;

  const current: PaymentType[] = Array.isArray(r.paymentTypes) && r.paymentTypes.length
    ? r.paymentTypes
    : GROUPS.flatMap((g) => g.defaults.map((d) => ({ ...d, group: g.key, enabled: false })));

  const persist = (next: PaymentType[]) => update.mutate({ paymentTypes: next });

  const toggle = (pt: PaymentType) => {
    persist(current.map((p) => (p.id === pt.id && p.group === pt.group ? { ...p, enabled: !p.enabled } : p)));
  };

  const add = (g: (typeof GROUPS)[number]) => {
    const name = (newNames[g.key] ?? "").trim();
    if (!name) return;
    const id = `${g.key}-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || Date.now()}`;
    if (current.some((p) => p.id === id)) return;
    persist([...current, { id, name, group: g.key, enabled: true }]);
    setNewNames((n) => ({ ...n, [g.key]: "" }));
    setShowAdd((s) => ({ ...s, [g.key]: false }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold">Ödeme Tipleri</h1>
        <p className="text-sm text-muted-foreground">Her kanalda sunmak istediğiniz ödeme yöntemlerini seçin. Değişiklikler anında kaydedilir.</p>
      </div>

      {GROUPS.map((g) => {
        const items = current.filter((p) => p.group === g.key);
        return (
          <Card key={g.key}>
            <CardHeader>
              <CardTitle>{g.name}</CardTitle>
              <CardDescription>{g.desc}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {items.length === 0 && <p className="text-sm text-muted-foreground">Bu kanal için henüz ödeme tipi eklenmedi.</p>}
              {items.map((pt) => (
                <div key={pt.id} className="flex items-center justify-between gap-4 rounded-lg border p-3">
                  <span className="text-sm font-medium">{pt.name}</span>
                  <Switch checked={pt.enabled} onCheckedChange={() => toggle(pt)} disabled={update.isPending} aria-label={`${pt.name} açık/kapalı`} />
                </div>
              ))}
              {showAdd[g.key] ? (
                <div className="flex items-center gap-2 pt-1">
                  <Input
                    value={newNames[g.key] ?? ""}
                    onChange={(e) => setNewNames((n) => ({ ...n, [g.key]: e.target.value }))}
                    placeholder="Ödeme tipi adı"
                    className="max-w-xs"
                    autoFocus
                  />
                  <Button size="sm" onClick={() => add(g)} disabled={update.isPending || !(newNames[g.key] ?? "").trim()}>Ekle</Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowAdd((s) => ({ ...s, [g.key]: false }))}>Vazgeç</Button>
                </div>
              ) : (
                <Button variant="outline" size="sm" className="gap-1" onClick={() => setShowAdd((s) => ({ ...s, [g.key]: true }))}>
                  <Plus className="h-4 w-4" /> Özel ödeme tipi ekle
                </Button>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
