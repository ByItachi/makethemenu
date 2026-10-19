import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import SubscriptionCard from "@/components/billing/SubscriptionCard";

type RestaurantSettings = {
  id: number;
  name: string;
  slug: string | null;
  description: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  currency: string;
  isPublished: boolean;
  ordersEnabled: boolean;
  publicUrl: string | null;
};

const CURRENCIES = ["TRY", "USD", "EUR", "GBP"] as const;

// ─── Custom domains (extra feature) ─────────────────────────────────────────
type DomainRecord = {
  id: number;
  domain: string;
  status: "pending" | "verified";
  verifiedAt: string | null;
  dnsInstructions: { txt: { name: string; value: string }; cname: { name: string; value: string }; tls: string | null };
};

function DomainsCard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [domain, setDomain] = useState("");

  const domainsQuery = useQuery<{
    planSupportsCustomDomain: boolean;
    planName: string | null;
    domains: DomainRecord[];
  }>({
    queryKey: ["/api/restaurant/domains"],
    queryFn: async () => {
      const res = await fetch("/api/restaurant/domains", { credentials: "include" });
      if (!res.ok) throw new Error(String(res.status));
      return res.json();
    },
  });

  const call = async (url: string, method: string, body?: unknown) => {
    const res = await fetch(url, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      credentials: "include",
      body: body ? JSON.stringify(body) : undefined,
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.message ?? `İşlem başarısız (${res.status}).`);
    return json;
  };

  const addDomain = useMutation({
    mutationFn: () => call("/api/restaurant/domains", "POST", { domain }),
    onSuccess: () => {
      setDomain("");
      queryClient.invalidateQueries({ queryKey: ["/api/restaurant/domains"] });
      toast({ title: "Alan adı eklendi", description: "DNS kayıtlarını oluşturup doğrulayın." });
    },
    onError: (e: Error) => toast({ title: "Hata", description: e.message, variant: "destructive" }),
  });

  const verifyDomain = useMutation({
    mutationFn: (id: number) => call(`/api/restaurant/domains/${id}/verify`, "POST"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/restaurant/domains"] });
      toast({ title: "Doğrulandı", description: "Alan adı menünüze bağlandı." });
    },
    onError: (e: Error) => toast({ title: "Doğrulanamadı", description: e.message, variant: "destructive" }),
  });

  const removeDomain = useMutation({
    mutationFn: (id: number) => call(`/api/restaurant/domains/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/restaurant/domains"] });
      toast({ title: "Kaldırıldı", description: "Alan adı bağlantısı kaldırıldı." });
    },
    onError: (e: Error) => toast({ title: "Hata", description: e.message, variant: "destructive" }),
  });

  const data = domainsQuery.data;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Özel alan adı (ek özellik)</CardTitle>
        <CardDescription>
          Menünüz her planda ücretsiz olarak <strong>makethemenu.com/p/isletme-adi</strong> adresinde yayınlanır.
          Kendi alan adınızı (örn. <em>menu.sirketiniz.com</em>) bağlamak ek bir özelliktir.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {data && !data.planSupportsCustomDomain ? (
          <div className="rounded-md border border-dashed p-4 text-sm space-y-2">
            <p>
              <strong>{data.planName ?? "Mevcut"}</strong> planınızda özel alan adı bulunmuyor.
            </p>
            <p className="text-muted-foreground">Bu özelliği kullanmak için planınızı yükseltin.</p>
            <Button asChild size="sm">
              <a href="/fiyatlandirma">Planları Gör</a>
            </Button>
          </div>
        ) : (
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (domain.trim()) addDomain.mutate();
            }}
          >
            <Input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="menu.sirketiniz.com" required />
            <Button type="submit" disabled={addDomain.isPending}>{addDomain.isPending ? "Ekleniyor..." : "Ekle"}</Button>
          </form>
        )}

        <div className="space-y-3">
          {data?.domains.map((d) => (
            <div key={d.id} className="rounded-md border p-3 space-y-2 text-sm">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium break-all">{d.domain}</p>
                <span className={d.status === "verified" ? "text-xs text-green-600 font-medium" : "text-xs text-amber-600 font-medium"}>
                  {d.status === "verified" ? "Doğrulandı" : "Doğrulama bekliyor"}
                </span>
              </div>
              {d.status !== "verified" && (
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>TXT kaydı: <code className="bg-muted px-1 rounded">{d.dnsInstructions.txt.name}</code> → <code className="bg-muted px-1 rounded">{d.dnsInstructions.txt.value}</code></p>
                  <p>Trafik CNAME: <code className="bg-muted px-1 rounded">{d.dnsInstructions.cname.name}</code> → <code className="bg-muted px-1 rounded">{d.dnsInstructions.cname.value}</code></p>
                </div>
              )}
              <div className="flex gap-2">
                {d.status !== "verified" && (
                  <Button size="sm" variant="outline" onClick={() => verifyDomain.mutate(d.id)} disabled={verifyDomain.isPending}>
                    Doğrula
                  </Button>
                )}
                <Button size="sm" variant="ghost" className="text-destructive" onClick={() => removeDomain.mutate(d.id)} disabled={removeDomain.isPending}>
                  Kaldır
                </Button>
              </div>
            </div>
          ))}
          {data && data.domains.length === 0 && data.planSupportsCustomDomain && (
            <p className="text-sm text-muted-foreground">Henüz bağlı bir alan adı yok.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function RestaurantSettingsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery<RestaurantSettings>({
    queryKey: ["/api/restaurant"],
    queryFn: async () => {
      const res = await fetch("/api/restaurant", { credentials: "include" });
      if (!res.ok) throw new Error(`${res.status}`);
      return res.json();
    },
  });

  const usageQuery = useQuery<{
    plan: { code: string; name: string; customDomain: boolean };
    limits: { products: number | null; tables: number | null };
    usage: { products: number; tables: number };
  }>({
    queryKey: ["/api/restaurant/usage"],
    queryFn: async () => {
      const res = await fetch("/api/restaurant/usage", { credentials: "include" });
      if (!res.ok) throw new Error(String(res.status));
      return res.json();
    },
  });

  const resend = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/auth/resend-verification", { method: "POST", credentials: "include" });
      if (!res.ok) throw new Error("Doğrulama e-postası gönderilemedi.");
    },
    onSuccess: () => toast({ title: "Gönderildi", description: "Doğrulama bağlantısı e-posta kuyruğuna eklendi." }),
    onError: (e: Error) => toast({ title: "Hata", description: e.message, variant: "destructive" }),
  });

  const [form, setForm] = useState<Partial<RestaurantSettings>>({});
  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const save = useMutation({
    mutationFn: async (body: Partial<RestaurantSettings>) => {
      const res = await fetch("/api/restaurant", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: body.name,
          description: body.description ?? null,
          phone: body.phone ?? null,
          address: body.address ?? "",
          city: body.city ?? null,
          currency: body.currency,
          isPublished: body.isPublished,
          ordersEnabled: body.ordersEnabled,
          slug: body.slug ?? undefined,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.message ?? "Kaydedilemedi.");
      return json as RestaurantSettings;
    },
    onSuccess: (saved) => {
      queryClient.setQueryData(["/api/restaurant"], saved);
      toast({ title: "Kaydedildi", description: "İşletme ayarları güncellendi." });
    },
    onError: (e: Error) => toast({ title: "Hata", description: e.message, variant: "destructive" }),
  });

  if (isLoading) return <div className="p-8">Yükleniyor…</div>;
  if (error || !data) return <div className="p-8">İşletme bilgileri alınamadı.</div>;

  const set = (key: keyof RestaurantSettings, value: unknown) => setForm((f) => ({ ...f, [key]: value }));

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <h1 className="text-2xl font-bold">İşletme Ayarları</h1>

      <Card>
        <CardHeader>
          <CardTitle>Genel</CardTitle>
          <CardDescription>Müşterilerinizin gördüğü işletme bilgileri.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              save.mutate(form);
            }}
          >
            <div className="space-y-1">
              <Label htmlFor="rs-name">İşletme adı</Label>
              <Input id="rs-name" value={form.name ?? ""} onChange={(e) => set("name", e.target.value)} required minLength={2} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="rs-slug">Menü adresi (slug)</Label>
              <Input
                id="rs-slug"
                value={form.slug ?? ""}
                onChange={(e) => set("slug", e.target.value.toLowerCase())}
                pattern="[a-z0-9]([a-z0-9-]*[a-z0-9])?"
                minLength={3}
                maxLength={63}
              />
              <p className="text-xs text-muted-foreground">
                Değiştirirseniz eski adres yeni adrese yönlendirilir.
              </p>
            </div>
            <div className="space-y-1">
              <Label htmlFor="rs-desc">Açıklama</Label>
              <Input id="rs-desc" value={form.description ?? ""} onChange={(e) => set("description", e.target.value)} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="rs-phone">Telefon</Label>
                <Input id="rs-phone" value={form.phone ?? ""} onChange={(e) => set("phone", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="rs-city">Şehir</Label>
                <Input id="rs-city" value={form.city ?? ""} onChange={(e) => set("city", e.target.value)} />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="rs-address">Adres</Label>
              <Input id="rs-address" value={form.address ?? ""} onChange={(e) => set("address", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="rs-currency">Para birimi</Label>
              <select
                id="rs-currency"
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={form.currency ?? "TRY"}
                onChange={(e) => set("currency", e.target.value)}
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={!!form.isPublished} onChange={(e) => set("isPublished", e.target.checked)} />
              Menüm yayınlansın (herkes görebilir)
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={!!form.ordersEnabled} onChange={(e) => set("ordersEnabled", e.target.checked)} />
              Online sipariş kabul edilsin (QR menüde sepet görünsün)
            </label>
            <Button type="submit" disabled={save.isPending}>
              {save.isPending ? "Kaydediliyor…" : "Kaydet"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Plan ve kullanım</CardTitle>
          <CardDescription>Plan limitleriniz ve mevcut kullanımınız.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {usageQuery.data ? (
            <>
              <p>Plan: <strong>{usageQuery.data.plan.name}</strong></p>
              <p>Ürün: {usageQuery.data.usage.products} / {usageQuery.data.limits.products ?? "Sınırsız"}</p>
              <p>Masa: {usageQuery.data.usage.tables} / {usageQuery.data.limits.tables ?? "Sınırsız"}</p>
            </>
          ) : (
            <p className="text-muted-foreground">Kullanım bilgisi yüklenemedi.</p>
          )}
          <Button type="button" variant="outline" size="sm" onClick={() => resend.mutate()} disabled={resend.isPending}>
            Doğrulama e-postasını yeniden gönder
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Menü bağlantısı ve QR</CardTitle>
          <CardDescription>QR kodu yalnızca menü yayındayken üretilir.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.isPublished && data.publicUrl ? (
            <>
              <p className="text-sm">
                Menü adresi: <a className="text-primary underline" href={data.publicUrl} target="_blank" rel="noreferrer">{data.publicUrl}</a>
              </p>
              <img src="/api/restaurant/qr.png?size=256" alt="Menü QR kodu" className="h-48 w-48 border rounded" />
              <div className="flex gap-3">
                <a className="text-primary underline text-sm" href="/api/restaurant/qr.png?size=1024" download="menu-qr.png">PNG indir</a>
                <a className="text-primary underline text-sm" href="/api/restaurant/qr.svg" download="menu-qr.svg">SVG indir</a>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Menünüzü yayımladığınızda bağlantı ve QR kodu burada görünecek.</p>
          )}
        </CardContent>
      </Card>

      <DomainsCard />

      <SubscriptionCard />
    </div>
  );
}
