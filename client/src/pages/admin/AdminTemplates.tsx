import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import AdminLayout from "./AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Search, Copy, Archive, Pencil, Eye, Sparkles } from "lucide-react";
import { CATEGORIES } from "@/lib/menu-presets";
import { SHOWCASE_TEMPLATES } from "@/lib/template-showcase";

// templates.slug veritabanda iç şablon kimliğiyle (menu-presets.ts "id") aynıdır,
// ama herkese açık demo sayfaları (/sablon-demo/:slug) vitrindeki İngilizce slug'ı kullanır.
// Önizleme linkini her zaman doğru genel slug'a yönlendir.
const PRESET_ID_TO_SHOWCASE_SLUG: Record<string, string> = Object.fromEntries(
  SHOWCASE_TEMPLATES.map((t) => [t.presetId, t.slug]),
);
function publicDemoSlug(templateSlug: string): string {
  return PRESET_ID_TO_SHOWCASE_SLUG[templateSlug] ?? templateSlug;
}

type Template = {
  id: number;
  slug: string;
  name: string;
  category: string;
  status: string;
  visibility: string;
  isFeatured: boolean;
  usageCount: number;
  viewCount: number;
  createdAt: string;
  coverImage?: string | null;
  data: any;
};

export default function AdminTemplates() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("Tümü");

  const { data: templates = [], isLoading } = useQuery<Template[]>({
    queryKey: ["/api/admin/templates"],
  });

  const duplicate = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("POST", `/api/admin/templates/${id}/duplicate`);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Şablon kopyalandı" });
      qc.invalidateQueries({ queryKey: ["/api/admin/templates"] });
    },
    onError: (e: Error) => toast({ title: "Hata", description: e.message, variant: "destructive" }),
  });

  const archive = useMutation({
    mutationFn: async (id: number) => apiRequest("DELETE", `/api/admin/templates/${id}`),
    onSuccess: () => {
      toast({ title: "Şablon arşivlendi" });
      qc.invalidateQueries({ queryKey: ["/api/admin/templates"] });
    },
    onError: (e: Error) => toast({ title: "Hata", description: e.message, variant: "destructive" }),
  });

  const filtered = templates.filter((t) => {
    const matchSearch = !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.slug.toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === "Tümü" || t.category === catFilter;
    return matchSearch && matchCat;
  });

  const statusBadge = (s: string) => {
    if (s === "published") return <Badge className="bg-green-500/15 text-green-700 border-green-200">Yayında</Badge>;
    if (s === "archived") return <Badge variant="secondary">Arşiv</Badge>;
    return <Badge variant="outline">Taslak</Badge>;
  };

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 md:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Şablonlar</h1>
            <p className="text-muted-foreground mt-1">Menü şablonlarını oluşturun, düzenleyin ve yayınlayın</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => navigate("/admin/templates/new")} className="gap-2">
              <Plus className="h-4 w-4" /> Yeni Şablon
            </Button>
            <Button variant="outline" onClick={() => navigate("/admin/ai-builder")} className="gap-2">
              <Sparkles className="h-4 w-4" /> AI ile Oluştur
            </Button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Şablon ara..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {CATEGORIES.map((c) => (
              <Button key={c} size="sm" variant={catFilter === c ? "default" : "outline"} onClick={() => setCatFilter(c)} className="text-xs">
                {c}
              </Button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4 space-y-3">
                  <div className="aspect-[9/14] rounded-lg bg-muted" />
                  <div className="h-4 rounded bg-muted w-3/4" />
                  <div className="h-3 rounded bg-muted w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">Şablon bulunamadı</p>
              <Button className="mt-4" onClick={() => navigate("/admin/templates/new")}>İlk Şablonu Oluştur</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((t) => {
              const bg = t.data?.style?.bg || "#ffffff";
              const accent = t.data?.style?.accent || "#000000";
              return (
                <Card key={t.id} className="group overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="aspect-[9/14] relative overflow-hidden" style={{ background: bg }}>
                    {t.coverImage || t.data?.logoImage ? (
                      <img
                        src={t.coverImage || t.data?.logoImage}
                        alt={t.name}
                        loading="lazy"
                        className="absolute inset-0 w-full h-full object-contain p-2"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display = "none";
                          const fallback = e.currentTarget.nextElementSibling as HTMLElement | null;
                          if (fallback) fallback.style.display = "flex";
                        }}
                      />
                    ) : null}
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center" style={t.coverImage || t.data?.logoImage ? { display: "none" } : undefined}>
                      <span className="text-lg font-bold" style={{ color: accent }}>{t.data?.logo || t.name}</span>
                      {t.data?.tagline && <span className="text-xs mt-1 opacity-60" style={{ color: t.data?.style?.text }}>{t.data.tagline}</span>}
                    </div>
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                      <Button size="sm" variant="secondary" onClick={() => navigate(`/admin/templates/${t.id}/edit`)} className="gap-1">
                        <Pencil className="h-3.5 w-3.5" /> Düzenle
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => navigate(`/sablon-demo/${publicDemoSlug(t.slug)}`)} className="gap-1">
                        <Eye className="h-3.5 w-3.5" /> Önizle
                      </Button>
                    </div>
                  </div>
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-semibold text-sm truncate">{t.name}</h3>
                        <p className="text-xs text-muted-foreground">{t.category}</p>
                      </div>
                      {statusBadge(t.status)}
                    </div>
                    <div className="flex items-center gap-1 mt-2">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => duplicate.mutate(t.id)} title="Kopyala">
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => archive.mutate(t.id)} title="Arşivle">
                        <Archive className="h-3.5 w-3.5" />
                      </Button>
                      <span className="ml-auto text-xs text-muted-foreground">{t.usageCount} kullanım</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
