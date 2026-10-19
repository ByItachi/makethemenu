import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Home, QrCode, Settings, Copy, Check, Download, Globe, ExternalLink, UtensilsCrossed, Rocket, Info } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useTables, useProducts } from "@/hooks/use-resto";
import { apiRequest } from "@/lib/queryClient";

type RestaurantSettings = {
  id: number;
  name: string;
  slug: string | null;
  currency: string;
  isPublished: boolean;
  ordersEnabled: boolean;
  publicUrl: string | null;
};

function useRestaurant() {
  return useQuery<RestaurantSettings>({
    queryKey: ["/api/restaurant"],
    queryFn: async () => (await apiRequest("GET", "/api/restaurant")).json(),
  });
}

// ─── Giriş: Kurulum adımları ve canlı durum ─────────────────────────────────
function DigitalMenuHome({ goTables }: { goTables: () => void }) {
  const { data: r, isLoading } = useRestaurant();
  const { data: products } = useProducts();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const publish = useMutation({
    mutationFn: async (next: boolean) => {
      const res = await apiRequest("PATCH", "/api/restaurant", { isPublished: next });
      return res.json();
    },
    onSuccess: (_d, next) => {
      queryClient.invalidateQueries({ queryKey: ["/api/restaurant"] });
      toast({ title: next ? "Menü yayına alındı" : "Menü yayından kaldırıldı" });
    },
    onError: (e: Error) => toast({ title: "Yayımlanamadı", description: e.message, variant: "destructive" }),
  });

  if (isLoading || !r) {
    return <div className="space-y-4"><Skeleton className="h-24 w-full" /><Skeleton className="h-48 w-full" /></div>;
  }

  const productCount = products?.length ?? 0;
  const steps = [
    {
      icon: UtensilsCrossed,
      title: "1. Menünüze ürün ekleyin",
      body: productCount > 0 ? `${productCount} ürününüz var. Kategoriler ve ürünler menünüze otomatik yansır.` : "Henüz ürününüz yok. Kategori ve ürünlerinizi ekleyin; AI menü üreticisi de kullanabilirsiniz.",
      cta: { label: "Menüye git", href: "/menu" },
      done: productCount > 0,
    },
    {
      icon: Rocket,
      title: "2. Menünüzü yayına alın",
      body: r.isPublished
        ? "Menünüz yayında ve herkese açık."
        : "Yayına almadan önce e-posta adresinizin doğrulanmış olması gerekir.",
      cta: r.isPublished ? undefined : { label: "Yayına al", onClick: () => publish.mutate(true) },
      done: r.isPublished,
    },
    {
      icon: QrCode,
      title: "3. Karekodları indirin, masalara asın",
      body: "Yayındaki menünüz için genel karekod ve masa bazlı karekodlar indirilir.",
      cta: { label: "Karekod işlemleri", onClick: goTables },
      done: r.isPublished,
    },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div>
            <CardTitle>Dijital menü durumu</CardTitle>
            <CardDescription>MakeTheMenu işletmenizin menüsünü çevrimiçi yayınlamanızı sağlar.</CardDescription>
          </div>
          <div className="sm:ml-auto flex items-center gap-2">
            {r.isPublished ? <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20">Yayında</Badge> : <Badge variant="secondary">Yayında değil</Badge>}
            {r.isPublished && r.publicUrl && (
              <Button variant="outline" size="sm" onClick={() => window.open(r.publicUrl!, "_blank")}>
                <ExternalLink className="h-4 w-4" /> Menüyü gör
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-muted-foreground" />
            {r.slug ? (
              <>Menü adresi: <a className="text-primary underline" href={r.publicUrl ?? "#"} target="_blank" rel="noreferrer">{r.publicUrl}</a></>
            ) : (
              <>Menü adresi belirlenmemiş. <a className="text-primary underline" href="/isletme">İşletme ayarlarından</a> bir adres oluşturun.</>
            )}
          </p>
          <p className="flex items-center gap-2">
            <UtensilsCrossed className="h-4 w-4 text-muted-foreground" />
            {productCount} ürün, {(products ? new Set(products.map((p: any) => p.categoryId)).size : 0)} kategori
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        {steps.map((s) => (
          <Card key={s.title} className={s.done ? "border-green-500/40" : undefined}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <s.icon className="h-5 w-5 text-primary" />
                {s.title}
                {s.done && <Check className="h-4 w-4 text-green-600 ml-auto" />}
              </CardTitle>
              <CardDescription>{s.body}</CardDescription>
            </CardHeader>
            <CardContent>
              {s.cta?.href && (
                <Button variant="outline" size="sm" onClick={() => (window.location.href = s.cta!.href!)}>{s.cta.label}</Button>
              )}
              {s.cta?.onClick && (
                <Button size="sm" onClick={s.cta.onClick} disabled={publish.isPending}>{s.cta.label}</Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── Masa Karekod İşlemleri: genel + masa bazlı gerçek karekodlar ────────────
function TableQrCodes() {
  const { data: r, isLoading } = useRestaurant();
  const { data: tables } = useTables();
  const { toast } = useToast();
  const [copied, setCopied] = useState<string | null>(null);

  if (isLoading || !r) return <Skeleton className="h-64 w-full" />;

  if (!r.slug || !r.isPublished) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Info className="h-5 w-5 text-amber-500" /> Karekod için önce yayına alın</CardTitle>
          <CardDescription>
            Karekodlar yalnızca yayındaki menüler için üretilir. {!r.slug && "Önce işletme ayarlarından bir menü adresi belirleyin."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button size="sm" onClick={() => (window.location.href = "/isletme")}>İşletme ayarlarına git</Button>
        </CardContent>
      </Card>
    );
  }

  const copyLink = async (table?: string) => {
    const url = `${r.publicUrl}${table ? `?masa=${encodeURIComponent(table)}` : ""}`;
    await navigator.clipboard.writeText(url);
    setCopied(table ?? "genel");
    setTimeout(() => setCopied(null), 1500);
    toast({ title: "Bağlantı kopyalandı", description: url });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Genel menü karekodu</CardTitle>
          <CardDescription>Tezgah, vitrin ve giriş için tek karekod; tüm menüyü açar.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row items-start gap-6">
          <img src="/api/restaurant/qr.png?size=512" alt="Menü karekodu" className="h-40 w-40 rounded border bg-white p-2" />
          <div className="space-y-3">
            <Button variant="outline" size="sm" asChild><a href="/api/restaurant/qr.png?size=1024" download="menu-qr.png"><Download className="h-4 w-4" /> PNG indir (1024px)</a></Button>
            <Button variant="outline" size="sm" asChild><a href="/api/restaurant/qr.svg" download="menu-qr.svg"><Download className="h-4 w-4" /> SVG indir (baskı için)</a></Button>
            <Button variant="ghost" size="sm" onClick={() => copyLink()}>{copied === "genel" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} Bağlantıyı kopyala</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Masa karekodları</CardTitle>
          <CardDescription>
            Her masa için ayrı karekod. Okutulan karekod menünüzü açar ve analitiğinizde QR taraması olarak sayılır.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!tables || tables.length === 0 ? (
            <p className="text-sm text-muted-foreground">Henüz masa eklenmemiş. <a className="text-primary underline" href="/masalar">Masalar sayfasından</a> masa ekleyin.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {tables.map((t: any) => (
                <div key={t.id} className="rounded-lg border p-3 text-center space-y-2">
                  <p className="font-medium text-sm truncate" title={t.name}>{t.name}</p>
                  <img src={`/api/restaurant/qr.png?size=256&table=${encodeURIComponent(t.name)}`} alt={`${t.name} karekodu`} className="mx-auto h-24 w-24 rounded border bg-white p-1" />
                  <div className="flex justify-center gap-1">
                    <Button variant="ghost" size="sm" asChild><a href={`/api/restaurant/qr.png?size=512&table=${encodeURIComponent(t.name)}`} download={`${t.name}-qr.png`}><Download className="h-4 w-4" /></a></Button>
                    <Button variant="ghost" size="sm" onClick={() => copyLink(t.name)}>{copied === t.name ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Ayarlar: menüye özgü hızlı anahtarlar ───────────────────────────────────
function DigitalMenuSettings() {
  const { data: r, isLoading } = useRestaurant();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const update = useMutation({
    mutationFn: async (patch: Record<string, unknown>) => {
      const res = await apiRequest("PATCH", "/api/restaurant", patch);
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/restaurant"] }),
    onError: (e: Error) => toast({ title: "Kaydedilemedi", description: e.message, variant: "destructive" }),
  });

  if (isLoading || !r) return <Skeleton className="h-48 w-full" />;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Menü yayını</CardTitle>
          <CardDescription>Kapattığınızda menü bağlantısı ve karekodlar geçici olarak çalışmaz.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Menü yayında</p>
              <p className="text-xs text-muted-foreground">{r.isPublished ? "Menü herkese açık" : "Menü kapalı"}</p>
            </div>
            <Switch checked={r.isPublished} onCheckedChange={(v) => update.mutate({ isPublished: v })} disabled={update.isPending} />
          </div>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Çevrimiçi sipariş alımı</p>
              <p className="text-xs text-muted-foreground">{r.ordersEnabled ? "Misafirler menüden sipariş verebilir" : "Yalnızca görüntüleme"}</p>
            </div>
            <Switch checked={r.ordersEnabled} onCheckedChange={(v) => update.mutate({ ordersEnabled: v })} disabled={update.isPending} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Menü adresi</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>{r.publicUrl ?? "Adres belirlenmemiş."}</p>
          <p className="text-muted-foreground">
            Adresi değiştirmek, para birimini ve diğer işletme bilgilerini{" "}
            <a className="text-primary underline" href="/isletme">İşletme Ayarları</a>ndan yönetin.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function DigitalMenuLayout() {
  const [activePage, setActivePage] = useState("home");

  const tabs = [
    { key: "home", label: "Giriş", icon: Home },
    { key: "tables", label: "Masa Karekod İşlemleri", icon: QrCode },
    { key: "settings", label: "Ayarlar", icon: Settings },
  ];

  const renderContent = () => {
    switch (activePage) {
      case "tables":
        return <TableQrCodes />;
      case "settings":
        return <DigitalMenuSettings />;
      default:
        return <DigitalMenuHome goTables={() => setActivePage("tables")} />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold">Dijital Menü</h1>
        <p className="text-sm text-muted-foreground">
          Menünüzü çevrimiçi yayınlamak için kurulum adımları, karekodlar ve yayın ayarları.
        </p>
      </div>
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Dijital menü bölümleri">
        {tabs.map((t) => (
          <Button
            key={t.key}
            variant={activePage === t.key ? "default" : "outline"}
            size="sm"
            onClick={() => setActivePage(t.key)}
            role="tab"
            aria-selected={activePage === t.key}
          >
            <t.icon className="h-4 w-4" />
            <span className="hidden sm:inline">{t.label}</span>
            <span className="sm:hidden">{t.key === "tables" ? "Karekod" : t.label}</span>
          </Button>
        ))}
      </div>
      {renderContent()}
    </div>
  );
}
