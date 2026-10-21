import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Check, ExternalLink, Sparkles } from "lucide-react";
import { CATEGORIES, MENU_PRESETS, MENU_PRESET_FONTS, type MenuPreset } from "@/lib/menu-presets";

export { CATEGORIES };
export type Preset = MenuPreset;
export const PRESETS = MENU_PRESETS;

type Settings = {
  publicUrl: string | null;
  menuTheme: string;
  menuRadius: number;
  menuTemplate: string;
  menuPreset?: string | null;
  showProductImages: boolean;
};

export function logoTextStyle(preset: Preset): React.CSSProperties {
  const s = preset.style;
  return {
    fontFamily: MENU_PRESET_FONTS[s.logoFont],
    textTransform: s.logoUpper ? "uppercase" : "none",
    fontStyle: s.logoItalic ? "italic" : "normal",
    color: s.accent,
  };
}

export function TemplatePreview({ preset, attached = false }: { preset: Preset; attached?: boolean }) {
  const s = preset.style;
  const itemRadius = Math.min(preset.menuRadius, 14);
  const logoStyle = logoTextStyle(preset);
  const half = Math.ceil(preset.items.length / 2);
  const sections: [string, typeof preset.items][] = [
    [preset.sectionTitles[0], preset.items.slice(0, half)],
    [preset.sectionTitles[1], preset.items.slice(half)],
  ];

  return (
    <div
      className={
        attached
          ? "relative flex aspect-[9/16] w-full flex-col overflow-hidden rounded-t-2xl border border-b-0"
          : "relative flex aspect-[9/16] w-full flex-col overflow-hidden rounded-2xl border shadow-sm"
      }
      style={{ background: s.bg, color: s.text, borderColor: `${s.muted}55` }}
      data-testid={`template-preview-${preset.id}`}
    >
      {/* Marka / logo alanı */}
      <div className="flex shrink-0 flex-col items-center justify-center gap-1 px-3 pb-3 pt-6 text-center">
        <span className="text-xl leading-tight" style={{ ...logoStyle, fontWeight: 700 }}>
          {preset.logo}
        </span>
        {preset.tagline && (
          <span className="text-[7px] uppercase" style={{ color: s.muted, letterSpacing: "0.28em", fontFamily: MENU_PRESET_FONTS.sans }}>
            {preset.tagline}
          </span>
        )}
      </div>
      {/* Ürün listesi */}
      <div className="min-h-0 flex-1 space-y-3 overflow-hidden px-3 pb-3">
        {sections.map(([title, items]) =>
          items.length === 0 ? null : (
            <div key={title} className="space-y-1.5">
              <p className="text-[11px] font-bold" style={{ color: s.accent, fontFamily: MENU_PRESET_FONTS[`${s.headingFont}` as "serif" | "sans"] }}>
                {title}
              </p>
              {items.map((item, i) => (
                <div key={i} className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[9px] font-semibold leading-snug" style={{ color: s.text }}>
                      {item.name}
                    </p>
                    {item.desc && (
                      <p className="line-clamp-2 text-[7px] leading-snug" style={{ color: s.muted }}>
                        {item.desc}
                      </p>
                    )}
                    <p className="text-[8px] font-bold" style={{ color: s.accent }}>{item.price}₺</p>
                  </div>
                  {preset.showProductImages && (
                    <div
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded text-sm"
                      style={{ backgroundColor: `${s.accent}22`, border: `1px solid ${s.accent}33` }}
                    >
                      {preset.emoji}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ),
        )}
      </div>
      <div className="shrink-0 px-3 pb-2">
        <div className="mx-auto h-1 w-10 rounded-full" style={{ backgroundColor: `${s.muted}66` }} />
      </div>
      <span className="sr-only">{`borderRadius: ${itemRadius}px`}</span>
    </div>
  );
}

export function ReadyTemplatesGallery({ onApplied }: { onApplied?: () => void } = {}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [category, setCategory] = useState("Tümü");

  const { data: r, isLoading } = useQuery<Settings>({
    queryKey: ["/api/restaurant"],
    queryFn: async () => (await apiRequest("GET", "/api/restaurant")).json(),
  });

  const apply = useMutation({
    mutationFn: async (preset: Preset) => {
      const res = await apiRequest("PATCH", "/api/restaurant", {
        menuTheme: preset.menuTheme,
        menuTemplate: preset.menuTemplate,
        menuRadius: preset.menuRadius,
        menuPreset: preset.id,
        showProductImages: preset.showProductImages,
      });
      return res.json();
    },
    onSuccess: (_d, preset) => {
      queryClient.invalidateQueries({ queryKey: ["/api/restaurant"] });
      toast({ title: `"${preset.name}" şablonu uygulandı`, description: "Menünüz anında güncellendi." });
      onApplied?.();
    },
    onError: (e: Error) => toast({ title: "Uygulanamadı", description: e.message, variant: "destructive" }),
  });

  if (isLoading || !r) return <Skeleton className="h-64 w-full" />;

  const isActive = (p: Preset) => r.menuPreset ? r.menuPreset === p.id : (r.menuTheme === p.menuTheme && r.menuTemplate === p.menuTemplate && r.menuRadius === p.menuRadius && r.showProductImages === p.showProductImages);

  const visible = category === "Tümü" ? PRESETS : PRESETS.filter((p) => p.category === category);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" /> Hazır Şablonlar</CardTitle>
          <CardDescription>
            Mutfak ve mekan türünüze göre hazırlanmış {PRESETS.length} tasarım. Tamamı ücretsizdir, tek tıkla menünüze uygulanır ve istediğiniz zaman değiştirebilirsiniz.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <Button key={c} size="sm" variant={category === c ? "default" : "outline"} onClick={() => setCategory(c)}>
                {c}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((p) => {
          const active = isActive(p);
          return (
            <Card key={p.id} className={active ? "border-primary ring-2 ring-primary/30" : undefined} data-testid={`template-card-${p.id}`}>
              <CardContent className="p-4 space-y-3">
                <TemplatePreview preset={p} />
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-sm">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.category}</p>
                  </div>
                  <Badge variant="secondary" className="shrink-0">Ücretsiz</Badge>
                </div>
                <Button
                  size="sm"
                  className="w-full"
                  variant={active ? "secondary" : "default"}
                  disabled={active || apply.isPending}
                  onClick={() => apply.mutate(p)}
                >
                  {active ? (<><Check className="h-4 w-4" /> Kullanımda</>) : "Bu şablonu kullan"}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {r.publicUrl && (
        <Button variant="outline" size="sm" onClick={() => window.open(r.publicUrl!, "_blank")}>
          <ExternalLink className="h-4 w-4" /> Menüyü canlı gör
        </Button>
      )}
    </div>
  );
}

export default ReadyTemplatesGallery;
