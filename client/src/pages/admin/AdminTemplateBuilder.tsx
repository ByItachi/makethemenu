import { useState, useCallback, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { CATEGORIES, MENU_PRESET_FONTS, type MenuPresetFontKey, type MenuPresetStyle, type MenuPresetItem, type MenuPreset } from "@/lib/menu-presets";
import { ArrowLeft, Save, Eye, Undo2, Redo2, GripVertical, Plus, Trash2, Sparkles, Send, Bot, User, Smartphone, Monitor, Loader2, Image as ImageIcon } from "lucide-react";

const FONT_OPTIONS: { key: MenuPresetFontKey; label: string }[] = [
  { key: "serif", label: "Serif" }, { key: "sans", label: "Sans-Serif" }, { key: "condensed", label: "Condensed" },
  { key: "badge", label: "Badge" }, { key: "round", label: "Round" }, { key: "script", label: "Script" },
  { key: "bebas", label: "Bebas Neue" }, { key: "poppins", label: "Poppins" }, { key: "manrope", label: "Manrope" },
  { key: "inter", label: "Inter" }, { key: "lora", label: "Lora" }, { key: "playfair", label: "Playfair" }, { key: "oswald", label: "Oswald" },
];

const TEMPLATE_OPTIONS = [
  { value: "liste", label: "Liste" }, { value: "izgara", label: "Izgara" }, { value: "kart", label: "Kart" },
];

const THEME_OPTIONS = [
  { value: "yesil", label: "Yeşil" }, { value: "mavi", label: "Mavi" }, { value: "kirmizi", label: "Kırmızı" },
  { value: "mor", label: "Mor" }, { value: "turuncu", label: "Turuncu" }, { value: "grafit", label: "Grafit" },
];

const DEFAULT_STYLE: MenuPresetStyle = {
  bg: "#ffffff", text: "#1a1a1a", muted: "#666666", accent: "#e63946",
  logoFont: "playfair", headingFont: "playfair",
};

const DEFAULT_DATA: MenuPreset = {
  id: "", name: "", category: "Modern", logo: "Restoran Adı", tagline: "Lezzetli Yemekler",
  emoji: "🍽️", menuTheme: "grafit" as any, menuTemplate: "liste" as any, menuRadius: 12,
  showProductImages: true, sectionTitles: ["Ana Yemekler", "İçecekler"],
  items: [
    { name: "Örnek Ürün 1", desc: "Leziz bir açıklama", price: 120 },
    { name: "Örnek Ürün 2", desc: "Başka bir açıklama", price: 85 },
    { name: "Örnek İçecek", desc: "Serinletici", price: 45 },
  ],
  style: DEFAULT_STYLE,
};

function SortableItem({ id, children }: { id: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }} {...attributes}>
      <div className="flex items-center gap-1">
        <button {...listeners} className="cursor-grab active:cursor-grabbing p-1 text-muted-foreground hover:text-foreground">
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  );
}

type ChatMsg = { role: "user" | "assistant"; content: string };

function AIChat({ onApply }: { onApply: (patch: Partial<MenuPreset>) => void }) {
  const [msgs, setMsgs] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const send = useCallback(async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setMsgs((p) => [...p, { role: "user", content: userMsg }]);
    setLoading(true);
    try {
      const res = await apiRequest("POST", "/api/restaurant/ai/suggest-theme", { description: userMsg });
      const data = await res.json();
      const style: Partial<MenuPresetStyle> = {};
      if (data.colors) {
        if (data.colors.bg) style.bg = data.colors.bg;
        if (data.colors.text) style.text = data.colors.text;
        if (data.colors.accent) style.accent = data.colors.accent;
        if (data.colors.muted) style.muted = data.colors.muted;
      }
      const patch: Partial<MenuPreset> = {};
      if (Object.keys(style).length > 0) (patch as any).style = style;
      if (data.font) (patch as any).suggestedFont = data.font;

      const reply = data.description || "İşte size önerdiğim tema! Beğenirseniz 'Uygula' butonuna tıklayın.";
      setMsgs((p) => [...p, { role: "assistant", content: reply }]);

      if (Object.keys(patch).length > 0) {
        setTimeout(() => {
          setMsgs((p) => [...p, { role: "assistant", content: "🎨 Tema önerisi hazır. Uygulamak ister misiniz?" }]);
        }, 300);
        (window as any).__aiPendingPatch = patch;
      }
    } catch {
      setMsgs((p) => [...p, { role: "assistant", content: "Üzgünüm, bir hata oluştu. Tekrar deneyin." }]);
    } finally {
      setLoading(false);
    }
  }, [input, loading]);

  const applyPending = useCallback(() => {
    const patch = (window as any).__aiPendingPatch;
    if (patch) {
      onApply(patch);
      delete (window as any).__aiPendingPatch;
      setMsgs((p) => [...p, { role: "assistant", content: "✅ Tema uygulandı!" }]);
    }
  }, [onApply]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto space-y-3 p-3">
        {msgs.length === 0 && (
          <div className="text-center text-muted-foreground text-sm py-8">
            <Bot className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>AI asistanına menünüzü tarif edin.</p>
            <p className="text-xs mt-1">Örn: "Şık bir İtalyan restoranı, koyu tema"</p>
          </div>
        )}
        {msgs.map((m, i) => (
          <div key={i} className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            {m.role === "assistant" && <Bot className="h-5 w-5 mt-1 shrink-0 text-primary" />}
            <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
              {m.content}
            </div>
            {m.role === "user" && <User className="h-5 w-5 mt-1 shrink-0 text-muted-foreground" />}
          </div>
        ))}
        {msgs.some((m) => m.content.includes("Uygulamak ister misiniz")) && (
          <div className="flex justify-center">
            <Button size="sm" onClick={applyPending} className="gap-1">
              <Sparkles className="h-3.5 w-3.5" /> Uygula
            </Button>
          </div>
        )}
      </div>
      <div className="border-t p-3 flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Menü tarzınızı tarif edin..."
          onKeyDown={(e) => e.key === "Enter" && send()}
          disabled={loading}
        />
        <Button size="icon" onClick={send} disabled={loading || !input.trim()}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}

function LivePreview({ data, viewMode }: { data: MenuPreset; viewMode: "mobile" | "desktop" }) {
  const s = data.style;
  const sections: { title: string; items: MenuPresetItem[] }[] = useMemo(() => {
    const result: { title: string; items: MenuPresetItem[] }[] = [];
    let idx = 0;
    for (let i = 0; i < data.sectionTitles.length; i++) {
      const count = data.sectionCounts?.[i] ?? Math.ceil((data.items.length - idx) / (data.sectionTitles.length - i));
      result.push({ title: data.sectionTitles[i], items: data.items.slice(idx, idx + count) });
      idx += count;
    }
    return result;
  }, [data]);

  return (
    <div className={`mx-auto transition-all ${viewMode === "mobile" ? "max-w-sm" : "max-w-2xl"}`}>
      <div className="rounded-2xl border shadow-lg overflow-hidden" style={{ background: s.bg, color: s.text }}>
        <div className="flex flex-col items-center py-8 px-4 text-center">
          {data.logoImage ? (
            <img src={data.logoImage} alt={data.logo} className="h-auto" style={{ maxHeight: data.logoHeight || 100 }} />
          ) : (
            <h1 className="text-3xl font-bold" style={{
              fontFamily: MENU_PRESET_FONTS[s.logoFont],
              color: s.accent,
              fontSize: s.logoSize || 30,
              textTransform: s.logoUpper ? "uppercase" : "none",
              fontStyle: s.logoItalic ? "italic" : "normal",
            }}>{data.logo}</h1>
          )}
          {data.tagline && <p className="text-sm mt-1 opacity-70">{data.tagline}</p>}
        </div>
        {sections.map((sec, si) => (
          <div key={si} className="px-4 py-3">
            <h2 className="font-semibold pb-2" style={{
              fontFamily: MENU_PRESET_FONTS[s.headingFont],
              color: s.sectionTitleColor || s.accent,
              fontSize: s.sectionTitleSize || 24,
            }}>{sec.title}</h2>
            {data.sectionDescriptions?.[si] && (
              <p className="text-sm mb-2 opacity-70">{data.sectionDescriptions[si]}</p>
            )}
            <div className={data.menuTemplate === "izgara" ? "grid grid-cols-2 gap-3" : "space-y-1"}>
              {sec.items.map((item, ii) => (
                <div key={ii} className={`py-2.5 px-1 ${data.menuTemplate === "kart" ? "rounded-lg border p-3" : ""}`}
                  style={data.menuTemplate === "kart" ? { borderColor: `${s.muted}33`, borderRadius: data.menuRadius } : undefined}>
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm" style={{
                        color: s.itemColor || s.text,
                        fontFamily: s.itemFont ? MENU_PRESET_FONTS[s.itemFont] : undefined,
                      }}>{item.name}</h3>
                      {item.desc && <p className="text-xs opacity-60 mt-0.5" style={{
                        fontFamily: s.descFont ? MENU_PRESET_FONTS[s.descFont] : undefined,
                      }}>{item.desc}</p>}
                      {item.price > 0 && (
                        <span className="text-xs font-medium mt-1 block" style={{ color: s.accent }}>
                          {data.currency || ""}{item.price}{s.priceSuffix || ""}
                        </span>
                      )}
                    </div>
                    {data.showProductImages && item.image && (
                      <img src={item.image} alt={item.name} className="w-16 h-12 object-cover rounded" style={{ borderRadius: Math.min(data.menuRadius, 10) }} />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        <div className="h-6" />
      </div>
    </div>
  );
}

export default function AdminTemplateBuilder() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [, navigate] = useLocation();
  const [, params] = useRoute("/admin/templates/:id/edit");
  const isNew = !params?.id || params.id === "new";
  const templateId = isNew ? null : Number(params!.id);

  const [data, setData] = useState<MenuPreset>({ ...DEFAULT_DATA });
  const [meta, setMeta] = useState({ name: "", slug: "", category: "Modern", status: "draft", visibility: "admin" });
  const [history, setHistory] = useState<MenuPreset[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const [viewMode, setViewMode] = useState<"mobile" | "desktop">("mobile");
  const [leftTab, setLeftTab] = useState("sections");
  const [selectedItem, setSelectedItem] = useState<number | null>(null);
  const [aiOpen, setAiOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }), useSensor(KeyboardSensor));

  const { data: templateData } = useQuery({
    queryKey: ["/api/admin/templates", templateId],
    queryFn: async () => {
      if (!templateId) return null;
      const res = await fetch(`/api/admin/templates/${templateId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Şablon yüklenemedi");
      return res.json();
    },
    enabled: !!templateId && !loaded,
  });

  useEffect(() => {
    if (templateData && !loaded) {
      setData(templateData.data || DEFAULT_DATA);
      setMeta({ name: templateData.name, slug: templateData.slug, category: templateData.category, status: templateData.status, visibility: templateData.visibility });
      setLoaded(true);
    }
  }, [templateData, loaded]);

  const pushHistory = useCallback((next: MenuPreset) => {
    setHistory((h) => [...h.slice(0, historyIdx + 1), data]);
    setHistoryIdx((i) => i + 1);
    setData(next);
  }, [data, historyIdx]);

  const undo = useCallback(() => {
    if (historyIdx < 0) return;
    setData(history[historyIdx]);
    setHistoryIdx((i) => i - 1);
  }, [history, historyIdx]);

  const redo = useCallback(() => {
    if (historyIdx >= history.length - 1) return;
    setHistoryIdx((i) => i + 1);
    setData(history[historyIdx + 1]);
  }, [history, historyIdx]);

  const updateStyle = useCallback((patch: Partial<MenuPresetStyle>) => {
    pushHistory({ ...data, style: { ...data.style, ...patch } });
  }, [data, pushHistory]);

  const updateData = useCallback((patch: Partial<MenuPreset>) => {
    pushHistory({ ...data, ...patch });
  }, [data, pushHistory]);

  const updateItem = useCallback((idx: number, patch: Partial<MenuPresetItem>) => {
    const items = [...data.items];
    items[idx] = { ...items[idx], ...patch };
    pushHistory({ ...data, items });
  }, [data, pushHistory]);

  const addItem = useCallback(() => {
    pushHistory({ ...data, items: [...data.items, { name: "Yeni Ürün", desc: "", price: 0 }] });
  }, [data, pushHistory]);

  const removeItem = useCallback((idx: number) => {
    const items = data.items.filter((_, i) => i !== idx);
    pushHistory({ ...data, items });
    if (selectedItem === idx) setSelectedItem(null);
  }, [data, pushHistory, selectedItem]);

  const addSection = useCallback(() => {
    pushHistory({
      ...data,
      sectionTitles: [...data.sectionTitles, "Yeni Bölüm"],
      sectionCounts: [...(data.sectionCounts || data.sectionTitles.map(() => Math.ceil(data.items.length / data.sectionTitles.length))), 0],
    });
  }, [data, pushHistory]);

  const removeSection = useCallback((idx: number) => {
    const titles = data.sectionTitles.filter((_, i) => i !== idx);
    const counts = (data.sectionCounts || []).filter((_, i) => i !== idx);
    pushHistory({ ...data, sectionTitles: titles, sectionCounts: counts.length ? counts : undefined });
  }, [data, pushHistory]);

  const handleDragEndItems = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = data.items.findIndex((_, i) => `item-${i}` === active.id);
    const newIdx = data.items.findIndex((_, i) => `item-${i}` === over.id);
    if (oldIdx !== -1 && newIdx !== -1) {
      pushHistory({ ...data, items: arrayMove(data.items, oldIdx, newIdx) });
    }
  }, [data, pushHistory]);

  const handleDragEndSections = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = data.sectionTitles.findIndex((_, i) => `sec-${i}` === active.id);
    const newIdx = data.sectionTitles.findIndex((_, i) => `sec-${i}` === over.id);
    if (oldIdx !== -1 && newIdx !== -1) {
      const titles = arrayMove(data.sectionTitles, oldIdx, newIdx);
      const counts = data.sectionCounts ? arrayMove(data.sectionCounts, oldIdx, newIdx) : undefined;
      const descs = data.sectionDescriptions ? arrayMove([...data.sectionDescriptions], oldIdx, newIdx) : undefined;
      pushHistory({ ...data, sectionTitles: titles, sectionCounts: counts, sectionDescriptions: descs });
    }
  }, [data, pushHistory]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const body = { ...meta, data };
      if (isNew) {
        const res = await apiRequest("POST", "/api/admin/templates", body);
        return res.json();
      } else {
        await apiRequest("PATCH", `/api/admin/templates/${templateId}`, body);
        return { id: templateId };
      }
    },
    onSuccess: (result: any) => {
      toast({ title: isNew ? "Şablon oluşturuldu" : "Şablon kaydedildi" });
      qc.invalidateQueries({ queryKey: ["/api/admin/templates"] });
      if (isNew && result?.id) navigate(`/admin/templates/${result.id}/edit`);
    },
    onError: (e: Error) => toast({ title: "Hata", description: e.message, variant: "destructive" }),
  });

  const publishMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PATCH", `/api/admin/templates/${templateId}`, { status: "published" });
    },
    onSuccess: () => {
      toast({ title: "Şablon yayınlandı!" });
      setMeta((m) => ({ ...m, status: "published" }));
      qc.invalidateQueries({ queryKey: ["/api/admin/templates"] });
    },
    onError: (e: Error) => toast({ title: "Hata", description: e.message, variant: "destructive" }),
  });

  const applyAIPatch = useCallback((patch: Partial<MenuPreset>) => {
    const next = { ...data };
    if ((patch as any).style) {
      next.style = { ...next.style, ...(patch as any).style };
    }
    pushHistory(next);
  }, [data, pushHistory]);

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Top toolbar */}
      <div className="h-14 border-b flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin/templates")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Input
            value={meta.name}
            onChange={(e) => setMeta((m) => ({ ...m, name: e.target.value }))}
            placeholder="Şablon adı..."
            className="w-48 h-8 text-sm font-medium"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={undo} disabled={historyIdx < 0} title="Geri al">
            <Undo2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={redo} disabled={historyIdx >= history.length - 1} title="İleri al">
            <Redo2 className="h-4 w-4" />
          </Button>
          <div className="h-6 w-px bg-border mx-1" />
          <Button variant={viewMode === "mobile" ? "default" : "ghost"} size="icon" onClick={() => setViewMode("mobile")} title="Mobil">
            <Smartphone className="h-4 w-4" />
          </Button>
          <Button variant={viewMode === "desktop" ? "default" : "ghost"} size="icon" onClick={() => setViewMode("desktop")} title="Masaüstü">
            <Monitor className="h-4 w-4" />
          </Button>
          <div className="h-6 w-px bg-border mx-1" />
          <Sheet open={aiOpen} onOpenChange={setAiOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5">
                <Sparkles className="h-3.5 w-3.5" /> AI Asistan
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-96 p-0 flex flex-col">
              <SheetTitle className="px-4 pt-4 pb-2 text-base font-semibold border-b">AI Tasarım Asistanı</SheetTitle>
              <AIChat onApply={applyAIPatch} />
            </SheetContent>
          </Sheet>
          <Button variant="outline" size="sm" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="gap-1.5">
            <Save className="h-3.5 w-3.5" /> Kaydet
          </Button>
          {!isNew && meta.status !== "published" && (
            <Button size="sm" onClick={() => publishMutation.mutate()} disabled={publishMutation.isPending} className="gap-1.5">
              <Eye className="h-3.5 w-3.5" /> Yayınla
            </Button>
          )}
        </div>
      </div>

      {/* Main content: 3-column */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT PANEL - Sections & Items */}
        <div className="w-72 border-r flex flex-col shrink-0 bg-background">
          <Tabs value={leftTab} onValueChange={setLeftTab} className="flex-1 flex flex-col">
            <TabsList className="mx-3 mt-3 grid grid-cols-2">
              <TabsTrigger value="sections">Bölümler</TabsTrigger>
              <TabsTrigger value="items">Ürünler</TabsTrigger>
            </TabsList>

            <TabsContent value="sections" className="flex-1 overflow-y-auto px-3 pb-3 mt-0">
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEndSections}>
                <SortableContext items={data.sectionTitles.map((_, i) => `sec-${i}`)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-2 mt-3">
                    {data.sectionTitles.map((title, i) => (
                      <SortableItem key={`sec-${i}`} id={`sec-${i}`}>
                        <div className="flex items-center gap-1">
                          <Input
                            value={title}
                            onChange={(e) => {
                              const titles = [...data.sectionTitles];
                              titles[i] = e.target.value;
                              updateData({ sectionTitles: titles });
                            }}
                            className="h-8 text-xs"
                          />
                          <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={() => removeSection(i)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </SortableItem>
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
              <Button variant="outline" size="sm" className="w-full mt-3 gap-1" onClick={addSection}>
                <Plus className="h-3 w-3" /> Bölüm Ekle
              </Button>
            </TabsContent>

            <TabsContent value="items" className="flex-1 overflow-y-auto px-3 pb-3 mt-0">
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEndItems}>
                <SortableContext items={data.items.map((_, i) => `item-${i}`)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-1.5 mt-3">
                    {data.items.map((item, i) => (
                      <SortableItem key={`item-${i}`} id={`item-${i}`}>
                        <div
                          className={`flex items-center gap-1 p-1.5 rounded-md cursor-pointer text-xs transition-colors ${selectedItem === i ? "bg-primary/10 ring-1 ring-primary" : "hover:bg-muted/50"}`}
                          onClick={() => setSelectedItem(i)}
                        >
                          <span className="truncate flex-1 font-medium">{item.name}</span>
                          <span className="text-muted-foreground shrink-0">{item.price > 0 ? `${data.currency || ""}${item.price}` : ""}</span>
                          <Button size="icon" variant="ghost" className="h-5 w-5 shrink-0" onClick={(e) => { e.stopPropagation(); removeItem(i); }}>
                            <Trash2 className="h-2.5 w-2.5" />
                          </Button>
                        </div>
                      </SortableItem>
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
              <Button variant="outline" size="sm" className="w-full mt-3 gap-1" onClick={addItem}>
                <Plus className="h-3 w-3" /> Ürün Ekle
              </Button>
            </TabsContent>
          </Tabs>
        </div>

        {/* CENTER - Live Preview */}
        <div className="flex-1 overflow-y-auto bg-muted/30 p-6">
          <LivePreview data={data} viewMode={viewMode} />
        </div>

        {/* RIGHT PANEL - Properties */}
        <div className="w-80 border-l shrink-0 overflow-y-auto bg-background">
          <Tabs defaultValue="style" className="flex flex-col">
            <TabsList className="mx-3 mt-3 grid grid-cols-3">
              <TabsTrigger value="style">Stil</TabsTrigger>
              <TabsTrigger value="layout">Düzen</TabsTrigger>
              <TabsTrigger value="detail">Detay</TabsTrigger>
            </TabsList>

            <TabsContent value="style" className="px-3 pb-4 space-y-4 mt-0">
              <div className="space-y-3 pt-3">
                <Label className="text-xs font-semibold uppercase text-muted-foreground">Renkler</Label>
                {([["bg", "Arka Plan"], ["text", "Metin"], ["accent", "Vurgu"], ["muted", "İkincil"]] as const).map(([key, label]) => (
                  <div key={key} className="flex items-center gap-2">
                    <input type="color" value={(data.style as any)[key]} onChange={(e) => updateStyle({ [key]: e.target.value })} className="w-8 h-8 rounded border cursor-pointer" />
                    <div className="flex-1">
                      <Label className="text-xs">{label}</Label>
                      <Input value={(data.style as any)[key]} onChange={(e) => updateStyle({ [key]: e.target.value })} className="h-7 text-xs mt-0.5" />
                    </div>
                  </div>
                ))}
                <div className="flex items-center gap-2">
                  <input type="color" value={data.style.sectionTitleColor || data.style.accent} onChange={(e) => updateStyle({ sectionTitleColor: e.target.value })} className="w-8 h-8 rounded border cursor-pointer" />
                  <div className="flex-1">
                    <Label className="text-xs">Bölüm Başlık</Label>
                    <Input value={data.style.sectionTitleColor || ""} onChange={(e) => updateStyle({ sectionTitleColor: e.target.value })} className="h-7 text-xs mt-0.5" placeholder="Varsayılan: vurgu" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input type="color" value={data.style.itemColor || data.style.text} onChange={(e) => updateStyle({ itemColor: e.target.value })} className="w-8 h-8 rounded border cursor-pointer" />
                  <div className="flex-1">
                    <Label className="text-xs">Ürün Adı</Label>
                    <Input value={data.style.itemColor || ""} onChange={(e) => updateStyle({ itemColor: e.target.value })} className="h-7 text-xs mt-0.5" placeholder="Varsayılan: metin" />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-xs font-semibold uppercase text-muted-foreground">Fontlar</Label>
                {([["logoFont", "Logo"], ["headingFont", "Başlık"], ["itemFont", "Ürün"], ["descFont", "Açıklama"]] as const).map(([key, label]) => (
                  <div key={key}>
                    <Label className="text-xs">{label} Fontu</Label>
                    <Select value={(data.style as any)[key] || ""} onValueChange={(v) => updateStyle({ [key]: v as MenuPresetFontKey })}>
                      <SelectTrigger className="h-8 text-xs mt-0.5"><SelectValue placeholder="Varsayılan" /></SelectTrigger>
                      <SelectContent>
                        {FONT_OPTIONS.map((f) => (
                          <SelectItem key={f.key} value={f.key}>{f.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="layout" className="px-3 pb-4 space-y-4 mt-0">
              <div className="space-y-3 pt-3">
                <div>
                  <Label className="text-xs">Şablon Tipi</Label>
                  <Select value={data.menuTemplate} onValueChange={(v) => updateData({ menuTemplate: v as any })}>
                    <SelectTrigger className="h-8 text-xs mt-0.5"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TEMPLATE_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Tema</Label>
                  <Select value={data.menuTheme} onValueChange={(v) => updateData({ menuTheme: v as any })}>
                    <SelectTrigger className="h-8 text-xs mt-0.5"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {THEME_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Köşe Yuvarlaklığı: {data.menuRadius}px</Label>
                  <Slider value={[data.menuRadius]} onValueChange={([v]) => updateData({ menuRadius: v })} min={0} max={24} step={1} className="mt-1" />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Ürün Görselleri</Label>
                  <Switch checked={data.showProductImages} onCheckedChange={(v) => updateData({ showProductImages: v })} />
                </div>
                <div>
                  <Label className="text-xs">Başlık Punto: {data.style.sectionTitleSize || 24}px</Label>
                  <Slider value={[data.style.sectionTitleSize || 24]} onValueChange={([v]) => updateStyle({ sectionTitleSize: v })} min={14} max={60} step={1} className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs">Logo Punto: {data.style.logoSize || 30}px</Label>
                  <Slider value={[data.style.logoSize || 30]} onValueChange={([v]) => updateStyle({ logoSize: v })} min={14} max={60} step={1} className="mt-1" />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Logo Büyük Harf</Label>
                  <Switch checked={!!data.style.logoUpper} onCheckedChange={(v) => updateStyle({ logoUpper: v })} />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Logo İtalik</Label>
                  <Switch checked={!!data.style.logoItalic} onCheckedChange={(v) => updateStyle({ logoItalic: v })} />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="detail" className="px-3 pb-4 space-y-4 mt-0">
              <div className="space-y-3 pt-3">
                <div>
                  <Label className="text-xs">Logo / Restoran Adı</Label>
                  <Input value={data.logo} onChange={(e) => updateData({ logo: e.target.value })} className="h-8 text-xs mt-0.5" />
                </div>
                <div>
                  <Label className="text-xs">Alt Başlık</Label>
                  <Input value={data.tagline || ""} onChange={(e) => updateData({ tagline: e.target.value })} className="h-8 text-xs mt-0.5" />
                </div>
                <div>
                  <Label className="text-xs">Logo Görsel URL</Label>
                  <Input value={data.logoImage || ""} onChange={(e) => updateData({ logoImage: e.target.value })} className="h-8 text-xs mt-0.5" placeholder="https://..." />
                </div>
                <div>
                  <Label className="text-xs">Para Birimi</Label>
                  <Input value={data.currency || ""} onChange={(e) => updateData({ currency: e.target.value })} className="h-8 text-xs mt-0.5" placeholder="$, ₺, €" />
                </div>
                <div>
                  <Label className="text-xs">Emoji</Label>
                  <Input value={data.emoji} onChange={(e) => updateData({ emoji: e.target.value })} className="h-8 text-xs mt-0.5" />
                </div>
                <div>
                  <Label className="text-xs">Slug</Label>
                  <Input value={meta.slug} onChange={(e) => setMeta((m) => ({ ...m, slug: e.target.value }))} className="h-8 text-xs mt-0.5" placeholder="sablon-adi" />
                </div>
                <div>
                  <Label className="text-xs">Kategori</Label>
                  <Select value={meta.category} onValueChange={(v) => setMeta((m) => ({ ...m, category: v }))}>
                    <SelectTrigger className="h-8 text-xs mt-0.5"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.filter((c) => c !== "Tümü").map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Görünürlük</Label>
                  <Select value={meta.visibility} onValueChange={(v) => setMeta((m) => ({ ...m, visibility: v }))}>
                    <SelectTrigger className="h-8 text-xs mt-0.5"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Sadece Admin</SelectItem>
                      <SelectItem value="customer">Müşteriler de Görsün</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Selected item editor */}
                {selectedItem !== null && data.items[selectedItem] && (
                  <div className="border-t pt-3 space-y-2">
                    <Label className="text-xs font-semibold uppercase text-muted-foreground">Seçili Ürün</Label>
                    <div>
                      <Label className="text-xs">Ürün Adı</Label>
                      <Input value={data.items[selectedItem].name} onChange={(e) => updateItem(selectedItem, { name: e.target.value })} className="h-8 text-xs mt-0.5" />
                    </div>
                    <div>
                      <Label className="text-xs">Açıklama</Label>
                      <Input value={data.items[selectedItem].desc || ""} onChange={(e) => updateItem(selectedItem, { desc: e.target.value })} className="h-8 text-xs mt-0.5" />
                    </div>
                    <div>
                      <Label className="text-xs">Fiyat</Label>
                      <Input type="number" value={data.items[selectedItem].price} onChange={(e) => updateItem(selectedItem, { price: Number(e.target.value) })} className="h-8 text-xs mt-0.5" />
                    </div>
                    <div>
                      <Label className="text-xs">Görsel URL</Label>
                      <Input value={data.items[selectedItem].image || ""} onChange={(e) => updateItem(selectedItem, { image: e.target.value })} className="h-8 text-xs mt-0.5" placeholder="https://..." />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Vegan</Label>
                      <Switch checked={!!data.items[selectedItem].isVegan} onCheckedChange={(v) => updateItem(selectedItem, { isVegan: v })} />
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
