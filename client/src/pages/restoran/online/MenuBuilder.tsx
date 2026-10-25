import { useState, useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { MENU_PRESET_FONTS, type MenuPresetFontKey, type MenuPresetStyle } from "@/lib/menu-presets";
import { Save, GripVertical, Sparkles, Send, Bot, User, Loader2, Smartphone, Monitor, Palette, Undo2, Redo2 } from "lucide-react";

const FONT_OPTIONS: { key: MenuPresetFontKey; label: string }[] = [
  { key: "serif", label: "Serif" }, { key: "sans", label: "Sans-Serif" }, { key: "condensed", label: "Condensed" },
  { key: "badge", label: "Badge" }, { key: "round", label: "Round" }, { key: "script", label: "Script" },
  { key: "bebas", label: "Bebas Neue" }, { key: "poppins", label: "Poppins" }, { key: "manrope", label: "Manrope" },
  { key: "inter", label: "Inter" }, { key: "lora", label: "Lora" }, { key: "playfair", label: "Playfair" }, { key: "oswald", label: "Oswald" },
];

type CustomPreset = {
  bg: string; text: string; muted: string; accent: string;
  sectionTitleColor?: string; itemColor?: string;
  logoFont?: MenuPresetFontKey; headingFont?: MenuPresetFontKey;
  itemFont?: MenuPresetFontKey; descFont?: MenuPresetFontKey;
  logoSize?: number;
};

type RestaurantData = {
  name: string; menuTheme: string; menuTemplate: string; menuRadius: number;
  showProductImages: boolean; menuPreset?: string | null; customPreset?: CustomPreset | null;
};

type Category = { id: number; name: string; sortOrder: number };
type Product = { id: number; name: string; description?: string; price: string; image?: string; categoryId: number; sortOrder: number; isVegan?: boolean };

function SortableRow({ id, children }: { id: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }} {...attributes}>
      <div className="flex items-center gap-1">
        <button {...listeners} className="cursor-grab active:cursor-grabbing p-1 text-muted-foreground hover:text-foreground">
          <GripVertical className="h-3.5 w-3.5" />
        </button>
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  );
}

type ChatMsg = { role: "user" | "assistant"; content: string };

function AIPanel({ onApply }: { onApply: (colors: Partial<CustomPreset>) => void }) {
  const [msgs, setMsgs] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [pending, setPending] = useState<Partial<CustomPreset> | null>(null);

  const send = useCallback(async () => {
    if (!input.trim() || loading) return;
    const text = input.trim();
    setInput("");
    setMsgs((p) => [...p, { role: "user", content: text }]);
    setLoading(true);
    try {
      const res = await apiRequest("POST", "/api/restaurant/ai/suggest-theme", { description: text });
      const data = await res.json();
      const patch: Partial<CustomPreset> = {};
      if (data.colors?.bg) patch.bg = data.colors.bg;
      if (data.colors?.text) patch.text = data.colors.text;
      if (data.colors?.accent) patch.accent = data.colors.accent;
      if (data.colors?.muted) patch.muted = data.colors.muted;
      setPending(patch);
      setMsgs((p) => [...p, { role: "assistant", content: data.description || "Tema öneriniz hazır! 'Uygula' butonuyla onaylayın." }]);
    } catch {
      setMsgs((p) => [...p, { role: "assistant", content: "Bir hata oluştu. Tekrar deneyin." }]);
    } finally {
      setLoading(false);
    }
  }, [input, loading]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto space-y-2 p-3">
        {msgs.length === 0 && (
          <div className="text-center text-muted-foreground text-sm py-6">
            <Bot className="h-6 w-6 mx-auto mb-2 opacity-50" />
            <p>Menünüzün tarzını tarif edin.</p>
          </div>
        )}
        {msgs.map((m, i) => (
          <div key={i} className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            {m.role === "assistant" && <Bot className="h-4 w-4 mt-1 shrink-0 text-primary" />}
            <div className={`max-w-[80%] rounded-lg px-3 py-2 text-xs ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
              {m.content}
            </div>
            {m.role === "user" && <User className="h-4 w-4 mt-1 shrink-0 text-muted-foreground" />}
          </div>
        ))}
        {pending && (
          <div className="flex justify-center pt-1">
            <Button size="sm" onClick={() => { onApply(pending); setPending(null); setMsgs((p) => [...p, { role: "assistant", content: "✅ Uygulandı!" }]); }} className="gap-1 text-xs">
              <Sparkles className="h-3 w-3" /> Uygula
            </Button>
          </div>
        )}
      </div>
      <div className="border-t p-2 flex gap-2">
        <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Tarz tarif edin..." onKeyDown={(e) => e.key === "Enter" && send()} disabled={loading} className="text-xs h-8" />
        <Button size="icon" className="h-8 w-8" onClick={send} disabled={loading || !input.trim()}>
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
        </Button>
      </div>
    </div>
  );
}

export default function MenuBuilder() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [viewMode, setViewMode] = useState<"mobile" | "desktop">("mobile");
  const [aiOpen, setAiOpen] = useState(false);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const { data: restaurant } = useQuery<RestaurantData>({
    queryKey: ["/api/restaurant"],
    queryFn: async () => (await apiRequest("GET", "/api/restaurant")).json(),
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    queryFn: async () => (await apiRequest("GET", "/api/categories")).json(),
  });

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/products"],
    queryFn: async () => (await apiRequest("GET", "/api/products")).json(),
  });

  const [preset, setPreset] = useState<CustomPreset>({
    bg: "#ffffff", text: "#1a1a1a", muted: "#666666", accent: "#e63946",
    logoFont: "playfair", headingFont: "playfair",
  });
  const [loaded, setLoaded] = useState(false);

  if (restaurant && !loaded) {
    if (restaurant.customPreset) {
      setPreset({ ...preset, ...restaurant.customPreset });
    }
    setLoaded(true);
  }

  const updatePreset = useCallback((patch: Partial<CustomPreset>) => {
    setPreset((p) => ({ ...p, ...patch }));
  }, []);

  const saveMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PATCH", "/api/restaurant", {
        menuPreset: "custom",
        customPreset: preset,
      });
    },
    onSuccess: () => {
      toast({ title: "Tasarım kaydedildi!" });
      qc.invalidateQueries({ queryKey: ["/api/restaurant"] });
    },
    onError: (e: Error) => toast({ title: "Hata", description: e.message, variant: "destructive" }),
  });

  const reorderCats = useMutation({
    mutationFn: async (ids: number[]) => apiRequest("POST", "/api/categories/reorder", { orderedIds: ids }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/categories"] }),
  });

  const reorderProducts = useMutation({
    mutationFn: async (ids: number[]) => apiRequest("POST", "/api/products/reorder", { orderedIds: ids }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/products"] }),
  });

  const handleDragCats = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = categories.findIndex((c) => `cat-${c.id}` === active.id);
    const newIdx = categories.findIndex((c) => `cat-${c.id}` === over.id);
    if (oldIdx !== -1 && newIdx !== -1) {
      const reordered = arrayMove(categories, oldIdx, newIdx);
      reorderCats.mutate(reordered.map((c) => c.id));
    }
  }, [categories, reorderCats]);

  const sortedCats = useMemo(() => [...categories].sort((a, b) => a.sortOrder - b.sortOrder), [categories]);
  const productsByCategory = useMemo(() => {
    const map: Record<number, Product[]> = {};
    for (const p of products) {
      if (!map[p.categoryId]) map[p.categoryId] = [];
      map[p.categoryId].push(p);
    }
    for (const key of Object.keys(map)) {
      map[Number(key)].sort((a, b) => a.sortOrder - b.sortOrder);
    }
    return map;
  }, [products]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2"><Palette className="h-5 w-5 text-primary" /> Menü Builder</CardTitle>
              <CardDescription>Renkleri, fontları düzenleyin, bölümleri sürükleyerek sıralayın</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant={viewMode === "mobile" ? "default" : "ghost"} size="icon" onClick={() => setViewMode("mobile")} className="h-8 w-8">
                <Smartphone className="h-4 w-4" />
              </Button>
              <Button variant={viewMode === "desktop" ? "default" : "ghost"} size="icon" onClick={() => setViewMode("desktop")} className="h-8 w-8">
                <Monitor className="h-4 w-4" />
              </Button>
              <Sheet open={aiOpen} onOpenChange={setAiOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <Sparkles className="h-3.5 w-3.5" /> AI
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-80 p-0 flex flex-col">
                  <SheetTitle className="px-3 pt-3 pb-2 text-sm font-semibold border-b">AI Asistan</SheetTitle>
                  <AIPanel onApply={updatePreset} />
                </SheetContent>
              </Sheet>
              <Button size="sm" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="gap-1.5">
                <Save className="h-3.5 w-3.5" /> Kaydet
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        {/* Left: style controls + category order */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Renkler</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {([["bg", "Arka Plan"], ["text", "Metin"], ["accent", "Vurgu"], ["muted", "İkincil"]] as const).map(([key, label]) => (
                <div key={key} className="flex items-center gap-2">
                  <input type="color" value={(preset as any)[key] || "#000000"} onChange={(e) => updatePreset({ [key]: e.target.value })} className="w-7 h-7 rounded border cursor-pointer" />
                  <Label className="text-xs flex-1">{label}</Label>
                  <Input value={(preset as any)[key] || ""} onChange={(e) => updatePreset({ [key]: e.target.value })} className="h-7 text-xs w-24" />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Fontlar</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {([["logoFont", "Logo"], ["headingFont", "Başlık"], ["itemFont", "Ürün"], ["descFont", "Açıklama"]] as const).map(([key, label]) => (
                <div key={key}>
                  <Label className="text-xs">{label}</Label>
                  <Select value={(preset as any)[key] || ""} onValueChange={(v) => updatePreset({ [key]: v })}>
                    <SelectTrigger className="h-7 text-xs mt-0.5"><SelectValue placeholder="Varsayılan" /></SelectTrigger>
                    <SelectContent>
                      {FONT_OPTIONS.map((f) => <SelectItem key={f.key} value={f.key}>{f.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Kategori Sırası</CardTitle></CardHeader>
            <CardContent>
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragCats}>
                <SortableContext items={sortedCats.map((c) => `cat-${c.id}`)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-1">
                    {sortedCats.map((cat) => (
                      <SortableRow key={cat.id} id={`cat-${cat.id}`}>
                        <span className="text-xs font-medium">{cat.name}</span>
                      </SortableRow>
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </CardContent>
          </Card>
        </div>

        {/* Right: live preview */}
        <div className={`mx-auto w-full transition-all ${viewMode === "mobile" ? "max-w-sm" : "max-w-2xl"}`}>
          <div className="rounded-2xl border shadow-lg overflow-hidden" style={{ background: preset.bg, color: preset.text }}>
            <div className="flex flex-col items-center py-8 px-4 text-center">
              <h1 className="text-2xl font-bold" style={{
                fontFamily: preset.logoFont ? MENU_PRESET_FONTS[preset.logoFont] : undefined,
                color: preset.accent,
                fontSize: preset.logoSize || 28,
              }}>{restaurant?.name || "Restoran"}</h1>
            </div>
            {sortedCats.map((cat) => {
              const items = productsByCategory[cat.id] || [];
              if (items.length === 0) return null;
              return (
                <div key={cat.id} className="px-4 py-3">
                  <h2 className="font-semibold pb-2" style={{
                    fontFamily: preset.headingFont ? MENU_PRESET_FONTS[preset.headingFont] : undefined,
                    color: preset.sectionTitleColor || preset.accent,
                    fontSize: 22,
                  }}>{cat.name}</h2>
                  <div className="space-y-1">
                    {items.map((item) => (
                      <div key={item.id} className="flex justify-between items-start gap-3 py-2">
                        <div className="flex-1">
                          <h3 className="font-semibold text-sm" style={{
                            color: preset.itemColor || preset.text,
                            fontFamily: preset.itemFont ? MENU_PRESET_FONTS[preset.itemFont] : undefined,
                          }}>{item.name}</h3>
                          {item.description && <p className="text-xs opacity-60 mt-0.5" style={{
                            fontFamily: preset.descFont ? MENU_PRESET_FONTS[preset.descFont] : undefined,
                          }}>{item.description}</p>}
                          <span className="text-xs font-medium mt-0.5 block" style={{ color: preset.accent }}>
                            {item.price}₺
                          </span>
                        </div>
                        {item.image && restaurant?.showProductImages && (
                          <img src={item.image} alt={item.name} className="w-14 h-10 object-cover rounded" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
            <div className="h-6" />
          </div>
        </div>
      </div>
    </div>
  );
}
