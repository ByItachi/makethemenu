import { useCategories, useProducts, useCreateCategory, useCreateProduct, useDeleteProduct, useUpdateProduct } from "@/hooks/use-resto";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertCategorySchema, insertProductSchema } from "@shared/schema";
import { z } from "zod";
import { Plus, Trash2, Image as ImageIcon, Box, Sparkles, Loader2 } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export default function Menu() {
  const [activeTab, setActiveTab] = useState("products");
  const { data: products } = useProducts();
  const { data: categories } = useCategories();
  const deleteProduct = useDeleteProduct();

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden pt-14 md:pt-0">
        <header className="h-16 border-b flex items-center justify-between px-4 sm:px-6 bg-card/50 backdrop-blur-sm">
          <h1 className="text-xl sm:text-2xl font-display font-bold">Menü Yönetimi</h1>
          <AiMenuDialog />
        </header>

        <main className="flex-1 overflow-auto p-4 sm:p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <div className="flex flex-wrap gap-3 justify-between items-center">
              <TabsList>
                <TabsTrigger value="products">Ürünler</TabsTrigger>
                <TabsTrigger value="categories">Kategoriler</TabsTrigger>
              </TabsList>
              
              {activeTab === 'products' ? (
                <AddProductDialog categories={categories || []} />
              ) : (
                <AddCategoryDialog />
              )}
            </div>

            <TabsContent value="products" className="space-y-4">
              <div className="border rounded-lg overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Görsel</TableHead>
                      <TableHead>İsim</TableHead>
                      <TableHead>Kategori</TableHead>
                      <TableHead>Fiyat</TableHead>
                      <TableHead>3D</TableHead>
                      <TableHead className="text-right">İşlemler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products?.map((product) => {
                      const category = categories?.find(c => c.id === product.categoryId);
                      return (
                        <TableRow key={product.id}>
                          <TableCell>
                            {product.imageUrl ? (
                              <img src={product.imageUrl} alt={product.name} className="h-10 w-10 rounded-md object-cover" />
                            ) : (
                              <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center">
                                <ImageIcon className="h-5 w-5 text-muted-foreground" />
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="font-medium">{product.name}</TableCell>
                          <TableCell>
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
                              {category?.name || 'Bilinmiyor'}
                            </span>
                          </TableCell>
                          <TableCell>{Number(product.price).toFixed(2)} ₺</TableCell>
                          <TableCell>
                            <Model3dButton product={product} />
                          </TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => deleteProduct.mutate(product.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="categories">
              <div className="border rounded-lg overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>İsim</TableHead>
                      <TableHead>Bağlantı (Slug)</TableHead>
                      <TableHead className="text-right">Ürünler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories?.map((category) => (
                      <TableRow key={category.id}>
                        <TableCell className="font-medium">{category.name}</TableCell>
                        <TableCell className="text-muted-foreground">{category.slug}</TableCell>
                        <TableCell className="text-right">
                          {products?.filter(p => p.categoryId === category.id).length || 0} ürün
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}

function AddCategoryDialog() {
  const [open, setOpen] = useState(false);
  const createCategory = useCreateCategory();
  const formSchema = insertCategorySchema;
  const { register, handleSubmit, reset } = useForm<z.infer<typeof formSchema>>();

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    createCategory.mutate(data, {
      onSuccess: () => {
        setOpen(false);
        reset();
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" /> Kategori Ekle
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Kategori Oluştur</DialogTitle>
          <DialogDescription>Menünüze yeni bir ürün kategorisi ekleyin.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label>İsim</Label>
            <Input {...register("name")} placeholder="örn. İçecekler" required />
          </div>
          <div className="space-y-2">
            <Label>Bağlantı (Slug)</Label>
            <Input {...register("slug")} placeholder="örn. icecekler" required />
          </div>
          <div className="space-y-2">
            <Label>Görsel URL (İsteğe Bağlı)</Label>
            <Input {...register("imageUrl")} placeholder="https://..." />
          </div>
          <Button type="submit" className="w-full" disabled={createCategory.isPending}>
            {createCategory.isPending ? "Kaydediliyor..." : "Kategoriyi Kaydet"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AddProductDialog({ categories }: { categories: any[] }) {
  const [open, setOpen] = useState(false);
  const createProduct = useCreateProduct();
  const formSchema = insertProductSchema;
  const { register, handleSubmit, setValue, reset } = useForm<z.infer<typeof formSchema>>();

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    createProduct.mutate(data, {
      onSuccess: () => {
        setOpen(false);
        reset();
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" /> Ürün Ekle
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Ürün Oluştur</DialogTitle>
          <DialogDescription>Menünüze yeni bir ürün ekleyin.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label>İsim</Label>
            <Input {...register("name")} placeholder="örn. Cheeseburger" required />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Fiyat</Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-muted-foreground">₺</span>
                <Input type="number" step="0.01" className="pl-7" {...register("price")} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Kategori</Label>
              <Select onValueChange={(val) => setValue("categoryId", parseInt(val))} required>
                <SelectTrigger>
                  <SelectValue placeholder="Seçiniz..." />
                </SelectTrigger>
                <SelectContent>
                  {categories.filter(c => c.id).map(c => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Açıklama</Label>
            <Textarea {...register("description")} placeholder="İçindekiler, detaylar..." />
          </div>

          <div className="space-y-2">
            <Label>Görsel URL (Unsplash)</Label>
            <Input {...register("imageUrl")} placeholder="https://images.unsplash.com/..." />
            <p className="text-[10px] text-muted-foreground">En iyi sonuçlar için Unsplash URL'lerini kullanın</p>
          </div>

          <div className="space-y-2">
            <Label>3D Model URL (.glb / .gltf)</Label>
            <Input {...register("model3dUrl")} placeholder="https://cdn.example.com/model.glb" />
            <p className="text-[10px] text-muted-foreground">Plan kotası dahil; menüde 3D olarak görüntülenir</p>
          </div>

          <Button type="submit" className="w-full" disabled={createProduct.isPending}>
            {createProduct.isPending ? "Kaydediliyor..." : "Ürünü Kaydet"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── 3D model management per product (spec §6) ───────────────────────────────
type ProductRow = { id: number; name: string; model3dUrl?: string | null };

function Model3dButton({ product }: { product: ProductRow }) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState(product.model3dUrl ?? "");
  const update = useUpdateProduct();
  const { data: usage } = useQuery({
    queryKey: ["restaurant-usage"],
    queryFn: async () => {
      const res = await fetch("/api/restaurant/usage", { credentials: "include" });
      return res.ok ? res.json() : null;
    },
  });

  const save = () => {
    const value = url.trim() === "" ? null : url.trim();
    update.mutate(
      { id: product.id, model3dUrl: value },
      {
        onSuccess: () => setOpen(false),
        onError: async () => {
          // Surfaces the plan-quota message from the server.
          const res = await fetch("/api/restaurant/usage", { credentials: "include" });
          void res;
        },
      },
    );
  };

  const has3d = !!product.model3dUrl;
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={has3d ? "text-primary" : "text-muted-foreground"}
          aria-label={has3d ? "3D modeli düzenle" : "3D model ekle"}
        >
          <Box className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>3D Model · {product.name}</DialogTitle>
          <DialogDescription>Ürün için 3D model bağlantısını ekleyin veya güncelleyin.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor={`m3d-${product.id}`}>Model bağlantısı (.glb / .gltf)</Label>
            <Input id={`m3d-${product.id}`} value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://cdn.example.com/model.glb" />
          </div>
          {usage?.limits?.model3d !== null && usage?.limits?.model3d !== undefined && (
            <p className="text-xs text-muted-foreground">Kota: {usage.usage?.model3d ?? 0} / {usage.limits.model3d} ürün (null sınırsızdır)</p>
          )}
          <div className="flex gap-2">
            <Button className="flex-1" onClick={save} disabled={update.isPending}>
              {update.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Kaydet"}
            </Button>
            {has3d && (
              <Button variant="outline" onClick={() => { setUrl(""); update.mutate({ id: product.id, model3dUrl: null }, { onSuccess: () => setOpen(false) }); }}>
                Kaldır
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── AI menu generator (spec §5) ─────────────────────────────────────────────
type DraftProduct = { name: string; description: string; price: number };
type DraftSection = { name: string; products: DraftProduct[] };

function AiMenuDialog() {
  const [open, setOpen] = useState(false);
  const [businessType, setBusinessType] = useState("Restoran");
  const [cuisineHint, setCuisineHint] = useState("");
  const [draft, setDraft] = useState<{ source: string; draft: { sections: DraftSection[] } } | null>(null);
  const [generating, setGenerating] = useState(false);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const generate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/restaurant/ai/generate-menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ businessType, cuisineHint, sections: 4, productsPerSection: 5 }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.message ?? "Menü taslağı oluşturulamadı.");
      setDraft(body);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Bir hata oluştu.");
    } finally {
      setGenerating(false);
    }
  };

  const apply = async () => {
    if (!draft) return;
    setApplying(true);
    setError(null);
    try {
      const res = await fetch("/api/restaurant/ai/apply-menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ draft: draft.draft }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.message ?? "Taslak uygulanamadı.");
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setOpen(false);
      setDraft(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Bir hata oluştu.");
    } finally {
      setApplying(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setDraft(null); setError(null); } }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2" data-testid="button-ai-menu">
          <Sparkles className="h-4 w-4 text-primary" /> AI ile Menü Oluştur
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" /> AI ile Menü Oluştur
          </DialogTitle>
          <DialogDescription>Yapay zeka ile işletmenize uygun bir menü taslağı oluşturun.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>İşletme Türü</Label>
              <Select value={businessType} onValueChange={setBusinessType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Restoran">Restoran</SelectItem>
                  <SelectItem value="Kafe">Kafe</SelectItem>
                  <SelectItem value="Otel">Otel</SelectItem>
                  <SelectItem value="Fast Food">Fast Food</SelectItem>
                  <SelectItem value="Tatlı">Tatlı / Fırın</SelectItem>
                  <SelectItem value="Bar">Bar</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ai-hint">Mutfak / Tema notu</Label>
              <Input id="ai-hint" value={cuisineHint} onChange={(e) => setCuisineHint(e.target.value)} placeholder="örn. Ege mutfağı" />
            </div>
          </div>

          {!draft && (
            <Button className="w-full" onClick={generate} disabled={generating} data-testid="button-ai-generate">
              {generating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
              {generating ? "Oluşturuluyor..." : "Taslak Oluştur"}
            </Button>
          )}

          {draft && (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                {draft.source === "ai" ? "AI tarafından oluşturuldu" : "Hazır şablonlardan oluşturuldu (AI anahtarı yapılandırılmadı)"} · uygula öncesi düzenleyemezsiniz, ürünler menüye eklenir
              </p>
              <div className="max-h-64 overflow-y-auto space-y-3 border rounded-md p-3 bg-card">
                {draft.draft.sections.map((s, i) => (
                  <div key={i}>
                    <p className="font-semibold text-sm">{s.name}</p>
                    <ul className="text-xs text-muted-foreground mt-1 space-y-0.5">
                      {s.products.map((p, j) => (
                        <li key={j} className="flex justify-between gap-2">
                          <span>{p.name}</span>
                          <span>{Number(p.price).toFixed(2)} ₺</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Button className="flex-1" onClick={apply} disabled={applying} data-testid="button-ai-apply">
                  {applying ? "Uygulanıyor..." : "Menüye Uygula"}
                </Button>
                <Button variant="outline" onClick={() => setDraft(null)}>Yeniden Oluştur</Button>
              </div>
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
      </DialogContent>
    </Dialog>
  );
}
