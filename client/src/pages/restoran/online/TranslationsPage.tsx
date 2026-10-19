import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useProducts } from "@/hooks/use-resto";
import { apiRequest } from "@/lib/queryClient";
import { Globe, Coins, Languages, Save } from "lucide-react";

/**
 * Diller ve Çeviriler + Para Birimi sayfası (QRall referansı).
 * Ürün çevirileri products.translations JSON alanında saklanır:
 *   { en: { name, description }, ar: { name, description } }
 * Herkese açık menü, seçilen menü diline göre bu çevirileri kullanır.
 */

type Translation = { name?: string; description?: string };
type Translations = { en?: Translation; ar?: Translation };

function useRestaurantAny<T>(): { data: T | undefined; isLoading: boolean } {
  const q = useQuery<T>({
    queryKey: ["/api/restaurant"],
    queryFn: async () => (await apiRequest("GET", "/api/restaurant")).json(),
  });
  return { data: q.data, isLoading: q.isLoading };
}

export const TranslationsPage: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const restaurant = useRestaurantAny<{ menuLanguage: string; currency: string }>();
  const productsQuery = useProducts();
  const [editing, setEditing] = useState<Record<number, Translations>>({});

  const saveCurrency = useMutation({
    mutationFn: async (currency: string) => {
      const res = await apiRequest("PATCH", "/api/restaurant", { currency });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/restaurant"] });
      toast({ title: "Para birimi güncellendi" });
    },
    onError: (e: Error) => toast({ title: "Güncellenemedi", description: e.message, variant: "destructive" }),
  });

  const saveLanguage = useMutation({
    mutationFn: async (menuLanguage: string) => {
      const res = await apiRequest("PATCH", "/api/restaurant", { menuLanguage });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/restaurant"] });
      toast({ title: "Varsayılan menü dili güncellendi" });
    },
    onError: (e: Error) => toast({ title: "Güncellenemedi", description: e.message, variant: "destructive" }),
  });

  const saveProduct = useMutation({
    mutationFn: async ({ id, translations }: { id: number; translations: Translations }) => {
      const res = await apiRequest("PATCH", `/api/products/${id}`, { translations });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: "Çeviriler kaydedildi" });
    },
    onError: (e: Error) => toast({ title: "Kaydedilemedi", description: e.message, variant: "destructive" }),
  });

  if (restaurant.isLoading || productsQuery.isLoading) return <Skeleton className="h-64 w-full" />;

  const r = restaurant.data!;
  const products = productsQuery.data ?? [];
  const CURRENCIES = ["TRY", "USD", "EUR", "GBP"];
  const LANGS: { key: keyof Translations; name: string; flag: string }[] = [
    { key: "en", name: "İngilizce", flag: "EN" },
    { key: "ar", name: "Arapça", flag: "AR" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2"><Languages className="h-6 w-6" /> Diller ve Çeviriler</h1>
        <p className="text-sm text-muted-foreground">Menünüzün varsayılan dilini seçin, ürün adı ve açıklamalarını dile göre çevirin.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><Globe className="h-5 w-5" /> Varsayılan menü dili</CardTitle>
            <CardDescription>Herkese açık menü bu dilde açılır.</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-2">
            {[["tr", "Türkçe"], ["en", "English"], ["ar", "العربية"]].map(([k, n]) => (
              <Button key={k} variant={r?.menuLanguage === k ? "default" : "outline"} size="sm" onClick={() => saveLanguage.mutate(k)} aria-pressed={r?.menuLanguage === k}>{n}</Button>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><Coins className="h-5 w-5" /> Para birimi</CardTitle>
            <CardDescription>Menü fiyatları seçilen para biriminde gösterilir.</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-2">
            {CURRENCIES.map((c) => (
              <Button key={c} variant={r?.currency === c ? "default" : "outline"} size="sm" onClick={() => saveCurrency.mutate(c)} aria-pressed={r?.currency === c}>{c}</Button>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ürün çevirileri</CardTitle>
          <CardDescription>Ürün adı ve açıklamalarını İngilizce ve Arapça girin. Boş bırakılırsa Türkçe metin gösterilir.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {products.length === 0 && <p className="text-sm text-muted-foreground">Henüz ürün yok. Tanımlamalar altındaki Menü / Ürünler sayfasından ürün ekleyin.</p>}
          {products.map((p) => {
            const value = editing[p.id] ?? (p.translations as Translations | null) ?? {};
            const dirty = editing[p.id] != null;
            return (
              <div key={p.id} className="rounded-lg border p-3 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium">{p.name}</p>
                  <Button size="sm" className="gap-1" disabled={!dirty || saveProduct.isPending} onClick={() => saveProduct.mutate({ id: p.id, translations: value })}>
                    <Save className="h-4 w-4" /> Kaydet
                  </Button>
                </div>
                {LANGS.map((l) => (
                  <div key={l.key} className="grid gap-2 sm:grid-cols-[auto_1fr_1fr] items-center">
                    <span className="text-xs font-mono font-bold text-muted-foreground w-7">{l.flag}</span>
                    <div>
                      <Label className="text-xs text-muted-foreground">Ad ({l.name})</Label>
                      <Input
                        value={value[l.key]?.name ?? ""}
                        onChange={(e) => setEditing((m) => ({ ...m, [p.id]: { ...value, [l.key]: { ...value[l.key], name: e.target.value } } }))}
                        placeholder={p.name}
                        aria-label={`${p.name} ${l.name} ad çevirisi`}
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Açıklama ({l.name})</Label>
                      <Input
                        value={value[l.key]?.description ?? ""}
                        onChange={(e) => setEditing((m) => ({ ...m, [p.id]: { ...value, [l.key]: { ...value[l.key], description: e.target.value } } }))}
                        placeholder={p.description ?? ""}
                        aria-label={`${p.name} ${l.name} açıklama çevirisi`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
};
