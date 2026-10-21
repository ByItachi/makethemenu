import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Check, ExternalLink, Sparkles } from "lucide-react";

type Settings = {
  publicUrl: string | null;
  menuTheme: string;
  menuRadius: number;
  menuTemplate: string;
  showProductImages: boolean;
};

const THEME_HEX: Record<string, string> = {
  yesil: "#059669",
  mavi: "#2563eb",
  kirmizi: "#dc2626",
  mor: "#9333ea",
  turuncu: "#ea580c",
  grafit: "#334155",
};

type Preset = {
  id: string;
  name: string;
  category: string;
  menuTheme: string;
  menuTemplate: "liste" | "izgara" | "kart";
  menuRadius: number;
  showProductImages: boolean;
};

const CATEGORIES = ["Tümü", "Mutfağa Özel", "Mekan Türü", "Yemek & İçecek", "Modern"];

const PRESETS: Preset[] = [
  { id: "kebapci", name: "Kebapçı & Izgara", category: "Mutfağa Özel", menuTheme: "turuncu", menuTemplate: "kart", menuRadius: 8, showProductImages: true },
  { id: "pizza", name: "Pizza & İtalyan", category: "Mutfağa Özel", menuTheme: "kirmizi", menuTemplate: "kart", menuRadius: 16, showProductImages: true },
  { id: "sushi", name: "Sushi & Uzakdoğu", category: "Mutfağa Özel", menuTheme: "grafit", menuTemplate: "liste", menuRadius: 4, showProductImages: true },
  { id: "mexican", name: "Meksika & Taco", category: "Mutfağa Özel", menuTheme: "turuncu", menuTemplate: "kart", menuRadius: 24, showProductImages: true },
  { id: "kafe", name: "Kafe & Pastane", category: "Mekan Türü", menuTheme: "mor", menuTemplate: "kart", menuRadius: 24, showProductImages: true },
  { id: "kahve", name: "Kahve Dükkanı", category: "Mekan Türü", menuTheme: "grafit", menuTemplate: "liste", menuRadius: 12, showProductImages: false },
  { id: "bar", name: "Bar & Kokteyl", category: "Mekan Türü", menuTheme: "mor", menuTemplate: "liste", menuRadius: 4, showProductImages: false },
  { id: "sarap", name: "Şarap Evi", category: "Mekan Türü", menuTheme: "kirmizi", menuTemplate: "liste", menuRadius: 0, showProductImages: false },
  { id: "caybahcesi", name: "Çay Bahçesi", category: "Mekan Türü", menuTheme: "yesil", menuTemplate: "liste", menuRadius: 24, showProductImages: false },
  { id: "otel", name: "Otel & Resort", category: "Mekan Türü", menuTheme: "mavi", menuTemplate: "kart", menuRadius: 20, showProductImages: true },
  { id: "finedining", name: "Fine Dining", category: "Mekan Türü", menuTheme: "grafit", menuTemplate: "liste", menuRadius: 0, showProductImages: false },
  { id: "bistro", name: "Bistro & Pub", category: "Mekan Türü", menuTheme: "mavi", menuTemplate: "liste", menuRadius: 8, showProductImages: false },
  { id: "burger", name: "Burger & Fast Food", category: "Yemek & İçecek", menuTheme: "kirmizi", menuTemplate: "izgara", menuRadius: 8, showProductImages: true },
  { id: "deniz", name: "Deniz Ürünleri", category: "Yemek & İçecek", menuTheme: "mavi", menuTemplate: "kart", menuRadius: 16, showProductImages: true },
  { id: "vegan", name: "Vegan & Sağlıklı", category: "Yemek & İçecek", menuTheme: "yesil", menuTemplate: "izgara", menuRadius: 20, showProductImages: true },
  { id: "tatlici", name: "Tatlıcı & Dondurma", category: "Yemek & İçecek", menuTheme: "mor", menuTemplate: "izgara", menuRadius: 24, showProductImages: true },
  { id: "kahvalti", name: "Kahvaltı & Brunch", category: "Yemek & İçecek", menuTheme: "turuncu", menuTemplate: "izgara", menuRadius: 16, showProductImages: true },
  { id: "modern", name: "Modern Restoran", category: "Modern", menuTheme: "grafit", menuTemplate: "kart", menuRadius: 12, showProductImages: true },
];

function TemplatePreview({ preset }: { preset: Preset }) {
  const hex = THEME_HEX[preset.menuTheme] ?? THEME_HEX.yesil;
  const isGrid = preset.menuTemplate !== "liste";
  const items = preset.menuTemplate === "kart" ? 2 : 4;
  return (
    <div className="rounded-lg border bg-background p-3 h-32 flex flex-col gap-2" style={{ borderRadius: Math.min(preset.menuRadius, 16) }}>
      <div className="h-2 w-16 rounded-full" style={{ backgroundColor: hex }} />
      <div className={isGrid ? "grid grid-cols-2 gap-1.5 flex-1" : "flex flex-col gap-1.5 flex-1"}>
        {Array.from({ length: items }).map((_, i) => (
          <div
            key={i}
            className="flex-1 border bg-muted/40 flex items-center gap-1.5 px-1.5"
            style={{ borderRadius: `${Math.min(preset.menuRadius, 12)}px` }}
          >
            {preset.showProductImages && <div className="h-4 w-4 rounded" style={{ backgroundColor: `${hex}55` }} />}
            <div className="h-1 flex-1 rounded-full bg-muted-foreground/20" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ReadyTemplatesGallery() {
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
        showProductImages: preset.showProductImages,
      });
      return res.json();
    },
    onSuccess: (_d, preset) => {
      queryClient.invalidateQueries({ queryKey: ["/api/restaurant"] });
      toast({ title: `"${preset.name}" şablonu uygulandı`, description: "Menünüz anında güncellendi." });
    },
    onError: (e: Error) => toast({ title: "Uygulanamadı", description: e.message, variant: "destructive" }),
  });

  if (isLoading || !r) return <Skeleton className="h-64 w-full" />;

  const isActive = (p: Preset) =>
    r.menuTheme === p.menuTheme && r.menuTemplate === p.menuTemplate && r.menuRadius === p.menuRadius && r.showProductImages === p.showProductImages;

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
