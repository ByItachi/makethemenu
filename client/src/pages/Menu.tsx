import { Sidebar } from "@/components/Sidebar";
import { useCategories, useProducts, useCreateCategory, useCreateProduct, useDeleteProduct } from "@/hooks/use-resto";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertCategorySchema, insertProductSchema } from "@shared/schema";
import { z } from "zod";
import { Plus, Trash2, Image as ImageIcon } from "lucide-react";
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

          <Button type="submit" className="w-full" disabled={createProduct.isPending}>
            {createProduct.isPending ? "Kaydediliyor..." : "Ürünü Kaydet"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
