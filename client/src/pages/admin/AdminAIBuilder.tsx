import { useState, useCallback, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import AdminLayout from "./AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { MENU_PRESET_FONTS, type MenuPresetStyle, type MenuPreset } from "@/lib/menu-presets";
import { Bot, User, Send, Loader2, Sparkles, Wand2, ArrowRight, Palette, Type, UtensilsCrossed } from "lucide-react";

type ChatMsg = { role: "user" | "assistant"; content: string; preview?: Partial<MenuPreset> };

const SUGGESTIONS = [
  { icon: UtensilsCrossed, label: "İtalyan restoranı, sıcak renkler" },
  { icon: Palette, label: "Minimalist sushi bar, koyu tema" },
  { icon: Type, label: "Modern kafe, pastel tonlar" },
  { icon: Wand2, label: "Lüks fine dining, altın detaylar" },
];

function MiniPreview({ data }: { data: Partial<MenuPreset> }) {
  const s = data.style || {} as MenuPresetStyle;
  return (
    <div className="rounded-xl border overflow-hidden max-w-xs" style={{ background: s.bg || "#fff", color: s.text || "#000" }}>
      <div className="p-4 text-center">
        <h3 className="text-lg font-bold" style={{
          fontFamily: s.logoFont ? MENU_PRESET_FONTS[s.logoFont] : undefined,
          color: s.accent || "#e63946",
        }}>{data.logo || "Restoran Adı"}</h3>
        {data.tagline && <p className="text-xs opacity-60 mt-0.5">{data.tagline}</p>}
      </div>
      {data.sectionTitles?.slice(0, 2).map((t, i) => (
        <div key={i} className="px-4 py-1">
          <h4 className="text-xs font-semibold" style={{
            fontFamily: s.headingFont ? MENU_PRESET_FONTS[s.headingFont] : undefined,
            color: s.sectionTitleColor || s.accent || "#e63946",
          }}>{t}</h4>
          {data.items?.slice(i * 2, i * 2 + 2).map((item, j) => (
            <div key={j} className="flex justify-between text-[10px] py-0.5 opacity-70">
              <span>{item.name}</span>
              {item.price > 0 && <span>{data.currency || ""}{item.price}</span>}
            </div>
          ))}
        </div>
      ))}
      <div className="h-3" />
    </div>
  );
}

export default function AdminAIBuilder() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [msgs, setMsgs] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingTemplate, setPendingTemplate] = useState<Partial<MenuPreset> | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs]);

  const send = useCallback(async (text?: string) => {
    const userMsg = (text || input).trim();
    if (!userMsg || loading) return;
    setInput("");
    setMsgs((p) => [...p, { role: "user", content: userMsg }]);
    setLoading(true);
    try {
      const [themeRes, menuRes] = await Promise.all([
        apiRequest("POST", "/api/restaurant/ai/suggest-theme", { description: userMsg }),
        apiRequest("POST", "/api/restaurant/ai/generate-menu", { businessType: userMsg.slice(0, 64), cuisineHint: userMsg.slice(0, 200) }).catch(() => null),
      ]);
      const themeData = await themeRes.json();
      const menuData = menuRes ? await menuRes.json() : null;

      const style: Partial<MenuPresetStyle> = {};
      if (themeData.colors) {
        if (themeData.colors.bg) style.bg = themeData.colors.bg;
        if (themeData.colors.text) style.text = themeData.colors.text;
        if (themeData.colors.accent) style.accent = themeData.colors.accent;
        if (themeData.colors.muted) style.muted = themeData.colors.muted;
      }
      if (themeData.font) (style as any).logoFont = themeData.font;

      const sections = menuData?.draft?.sections ?? [];
      const preview: Partial<MenuPreset> = {
        logo: "Restoran",
        tagline: "",
        style: { bg: "#ffffff", text: "#1a1a1a", muted: "#666666", accent: "#e63946", logoFont: "playfair", headingFont: "playfair", ...style } as MenuPresetStyle,
        sectionTitles: sections.length ? sections.map((s: any) => s.name) : ["Ana Yemekler"],
        items: sections.flatMap((s: any) => s.products?.map((p: any) => ({ name: p.name, desc: p.description || "", price: p.price || 0 })) || []),
        currency: "₺",
        menuTemplate: "liste" as any,
        menuRadius: 12,
        showProductImages: false,
        menuTheme: "grafit" as any,
        emoji: "🍽️",
      };

      setPendingTemplate(preview);
      const reply = themeData.description || "İşte önerdiğim tasarım! Beğenirseniz Builder'da açabilirsiniz.";
      setMsgs((p) => [...p, { role: "assistant", content: reply, preview }]);
    } catch {
      setMsgs((p) => [...p, { role: "assistant", content: "Üzgünüm, bir hata oluştu. Lütfen tekrar deneyin." }]);
    } finally {
      setLoading(false);
    }
  }, [input, loading]);

  const openInBuilder = useCallback(async () => {
    if (!pendingTemplate) return;
    try {
      const slug = (pendingTemplate.logo || "sablon").toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40) + "-" + Date.now();
      const body = {
        name: pendingTemplate.logo || "AI Şablon",
        slug,
        category: "Modern",
        status: "draft",
        visibility: "admin",
        data: {
          id: slug,
          name: pendingTemplate.logo || "AI Şablon",
          ...pendingTemplate,
        },
      };
      const res = await apiRequest("POST", "/api/admin/templates", body);
      const created = await res.json();
      toast({ title: "Şablon oluşturuldu, Builder açılıyor..." });
      navigate(`/admin/templates/${created.id}/edit`);
    } catch (e: any) {
      toast({ title: "Hata", description: e.message, variant: "destructive" });
    }
  }, [pendingTemplate, navigate, toast]);

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 md:p-8 h-[calc(100vh-56px)] md:h-screen flex flex-col">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" /> AI Şablon Oluşturucu
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Menünüzü tarif edin, AI sizin için tasarlasın</p>
        </div>

        <Card className="flex-1 flex flex-col overflow-hidden">
          <CardContent className="flex-1 flex flex-col p-0">
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
              {msgs.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <Bot className="h-16 w-16 text-muted-foreground/30 mb-4" />
                  <h2 className="text-lg font-semibold">Nasıl bir menü hayal ediyorsunuz?</h2>
                  <p className="text-sm text-muted-foreground mt-1 max-w-md">
                    Restoranınızın tarzını, mutfağını ve atmosferini tarif edin. AI sizin için renk paleti, fontlar ve menü içeriği önerecek.
                  </p>
                  <div className="grid grid-cols-2 gap-3 mt-6 max-w-lg w-full">
                    {SUGGESTIONS.map((s, i) => (
                      <Button key={i} variant="outline" className="h-auto py-3 px-4 text-left justify-start gap-2" onClick={() => send(s.label)}>
                        <s.icon className="h-4 w-4 shrink-0 text-primary" />
                        <span className="text-xs">{s.label}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {msgs.map((m, i) => (
                <div key={i} className={`flex gap-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  {m.role === "assistant" && (
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  <div className={`max-w-[70%] space-y-2 ${m.role === "user" ? "items-end" : "items-start"} flex flex-col`}>
                    <div className={`rounded-2xl px-4 py-2.5 text-sm ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                      {m.content}
                    </div>
                    {m.preview && (
                      <div className="space-y-2">
                        <MiniPreview data={m.preview} />
                        <Button size="sm" onClick={openInBuilder} className="gap-1.5">
                          <ArrowRight className="h-3.5 w-3.5" /> Builder'da Aç
                        </Button>
                      </div>
                    )}
                  </div>
                  {m.role === "user" && (
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <User className="h-4 w-4" />
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div className="flex gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                  <div className="bg-muted rounded-2xl px-4 py-3">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                </div>
              )}
            </div>

            <div className="border-t p-4 flex gap-3">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Menü tarzınızı tarif edin... (ör. 'Sahil kenarı balık restoranı')"
                onKeyDown={(e) => e.key === "Enter" && send()}
                disabled={loading}
                className="flex-1"
              />
              <Button onClick={() => send()} disabled={loading || !input.trim()} size="icon">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
