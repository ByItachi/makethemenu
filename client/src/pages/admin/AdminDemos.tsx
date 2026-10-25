import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "./AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Trash2, ExternalLink, Pencil, Globe } from "lucide-react";

type Template = { id: number; slug: string; name: string };
type Demo = {
  id: number; slug: string; templateId: number; title: string;
  seoTitle?: string; seoDescription?: string; ogImage?: string;
  status: string; createdAt: string;
};

function DemoForm({ demo, templates, onSave, onCancel }: {
  demo?: Demo; templates: Template[];
  onSave: (data: any) => void; onCancel: () => void;
}) {
  const [form, setForm] = useState({
    slug: demo?.slug || "",
    templateId: demo?.templateId || (templates[0]?.id ?? 0),
    title: demo?.title || "",
    seoTitle: demo?.seoTitle || "",
    seoDescription: demo?.seoDescription || "",
    ogImage: demo?.ogImage || "",
    status: demo?.status || "draft",
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Slug</Label>
          <Input value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} className="h-8 text-sm" placeholder="demo-slug" />
        </div>
        <div>
          <Label className="text-xs">Başlık</Label>
          <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className="h-8 text-sm" />
        </div>
      </div>
      <div>
        <Label className="text-xs">Şablon</Label>
        <Select value={String(form.templateId)} onValueChange={(v) => setForm((f) => ({ ...f, templateId: Number(v) }))}>
          <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            {templates.map((t) => <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-xs">SEO Başlık</Label>
        <Input value={form.seoTitle} onChange={(e) => setForm((f) => ({ ...f, seoTitle: e.target.value }))} className="h-8 text-sm" />
      </div>
      <div>
        <Label className="text-xs">SEO Açıklama</Label>
        <Input value={form.seoDescription} onChange={(e) => setForm((f) => ({ ...f, seoDescription: e.target.value }))} className="h-8 text-sm" />
      </div>
      <div>
        <Label className="text-xs">OG Görsel URL</Label>
        <Input value={form.ogImage} onChange={(e) => setForm((f) => ({ ...f, ogImage: e.target.value }))} className="h-8 text-sm" placeholder="https://..." />
      </div>
      <div>
        <Label className="text-xs">Durum</Label>
        <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}>
          <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="draft">Taslak</SelectItem>
            <SelectItem value="published">Yayında</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <DialogFooter>
        <Button variant="outline" size="sm" onClick={onCancel}>İptal</Button>
        <Button size="sm" onClick={() => onSave(form)}>{demo ? "Güncelle" : "Oluştur"}</Button>
      </DialogFooter>
    </div>
  );
}

export default function AdminDemos() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [editDemo, setEditDemo] = useState<Demo | undefined>();
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: demos = [] } = useQuery<Demo[]>({
    queryKey: ["/api/admin/demos"],
  });

  const { data: templates = [] } = useQuery<Template[]>({
    queryKey: ["/api/admin/templates"],
  });

  const createMut = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/admin/demos", data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Demo oluşturuldu" });
      qc.invalidateQueries({ queryKey: ["/api/admin/demos"] });
      setDialogOpen(false);
    },
    onError: (e: Error) => toast({ title: "Hata", description: e.message, variant: "destructive" }),
  });

  const updateMut = useMutation({
    mutationFn: async ({ id, ...data }: any) => apiRequest("PATCH", `/api/admin/demos/${id}`, data),
    onSuccess: () => {
      toast({ title: "Demo güncellendi" });
      qc.invalidateQueries({ queryKey: ["/api/admin/demos"] });
      setDialogOpen(false);
      setEditDemo(undefined);
    },
    onError: (e: Error) => toast({ title: "Hata", description: e.message, variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: number) => apiRequest("DELETE", `/api/admin/demos/${id}`),
    onSuccess: () => {
      toast({ title: "Demo silindi" });
      qc.invalidateQueries({ queryKey: ["/api/admin/demos"] });
    },
    onError: (e: Error) => toast({ title: "Hata", description: e.message, variant: "destructive" }),
  });

  const handleSave = (data: any) => {
    if (editDemo) {
      updateMut.mutate({ id: editDemo.id, ...data });
    } else {
      createMut.mutate(data);
    }
  };

  const templateName = (id: number) => templates.find((t) => t.id === id)?.name || `#${id}`;

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 md:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Demo Sayfaları</h1>
            <p className="text-muted-foreground mt-1">Şablon demo bağlantıları oluşturun ve yönetin</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) setEditDemo(undefined); }}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="h-4 w-4" /> Yeni Demo</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editDemo ? "Demo Düzenle" : "Yeni Demo"}</DialogTitle>
              </DialogHeader>
              <DemoForm
                demo={editDemo}
                templates={templates}
                onSave={handleSave}
                onCancel={() => { setDialogOpen(false); setEditDemo(undefined); }}
              />
            </DialogContent>
          </Dialog>
        </div>

        {demos.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Globe className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground">Henüz demo sayfası yok</p>
              <Button className="mt-4" onClick={() => setDialogOpen(true)}>İlk Demo'yu Oluştur</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {demos.map((d) => (
              <Card key={d.id}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-sm truncate">{d.title}</h3>
                      <p className="text-xs text-muted-foreground truncate">/{d.slug}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Şablon: {templateName(d.templateId)}</p>
                    </div>
                    <Badge variant={d.status === "published" ? "default" : "outline"}>
                      {d.status === "published" ? "Yayında" : "Taslak"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditDemo(d); setDialogOpen(true); }}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => window.open(`/sablon-demo/${d.slug}`, "_blank")}>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteMut.mutate(d.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
