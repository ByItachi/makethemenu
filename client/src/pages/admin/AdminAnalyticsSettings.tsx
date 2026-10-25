import AdminLayout from "./AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { BarChart3, ExternalLink, Save, ShieldCheck } from "lucide-react";

interface AdminSettingsShape {
  gtmContainerId: string;
  ga4MeasurementId: string;
  metaPixelId: string;
  gscVerificationToken: string;
  gtmEnabled: boolean;
  ga4Enabled: boolean;
  metaPixelEnabled: boolean;
  ga4ViaGtm: boolean;
  consentRequired: boolean;
  enableInDev: boolean;
}

const GTM_RE = /^GTM-[A-Z0-9]{4,10}$/;
const GA4_RE = /^G-[A-Z0-9]{6,12}$/;
const PIXEL_RE = /^\d{15,16}$/;

export default function AdminAnalyticsSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<AdminSettingsShape | null>(null);

  const { data, isLoading } = useQuery<AdminSettingsShape>({
    queryKey: ["admin-analytics-settings"],
    queryFn: async () => {
      const res = await fetch("/api/admin/analytics/settings", { credentials: "include" });
      if (!res.ok) throw new Error("Ayarlar okunamadı");
      return res.json();
    },
  });

  useEffect(() => {
    if (data && !form) setForm(data);
  }, [data, form]);

  const save = async () => {
    if (!form) return;
    try {
      const res = await fetch("/api/admin/analytics/settings", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.message ?? "Kaydedilemedi");
      toast({ title: "Başarılı", description: "Ölçümleme ayarları kaydedildi." });
      queryClient.invalidateQueries({ queryKey: ["admin-analytics-settings"] });
    } catch (err) {
      toast({
        title: "Hata",
        description: err instanceof Error ? err.message : "Ayarlar kaydedilirken bir sorun oluştu.",
        variant: "destructive",
      });
    }
  };

  const set = <K extends keyof AdminSettingsShape>(key: K, value: AdminSettingsShape[K]) =>
    setForm((f) => (f ? { ...f, [key]: value } : f));

  const idOk =
    (!form?.gtmEnabled || GTM_RE.test(form?.gtmContainerId ?? "")) &&
    (!form?.ga4Enabled || GA4_RE.test(form?.ga4MeasurementId ?? "")) &&
    (!form?.metaPixelEnabled || PIXEL_RE.test(form?.metaPixelId ?? ""));

  if (isLoading || !form) {
    return (
      <AdminLayout>
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">Yükleniyor…</CardContent>
        </Card>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="pt-4">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-primary" /> Ölçümleme ve SEO
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Ölçüm etiketleri, rıza yönetimi ve Search Console doğrulaması.
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" /> Ölçüm Etiketleri
            </CardTitle>
            <CardDescription>
              Etiket kimlikleri yalnızca etkinleştirildiğinde sitede yüklenir. Rıza yönetimi açıksa etiketler
              kullanıcının çerez onayı verilene kadar bekler.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* GTM */}
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="gtm-id">Google Tag Manager Container ID</Label>
                <div className="flex items-center gap-2">
                  {form.gtmContainerId && GTM_RE.test(form.gtmContainerId) ? (
                    <Badge variant="outline" className="text-xs">Biçim doğru</Badge>
                  ) : form.gtmContainerId ? (
                    <Badge variant="destructive" className="text-xs">GTM-XXXXXX bekleniyor</Badge>
                  ) : null}
                  <Switch checked={form.gtmEnabled} onCheckedChange={(v) => set("gtmEnabled", v)} aria-label="GTM'i etkinleştir" />
                </div>
              </div>
              <Input
                id="gtm-id"
                placeholder="GTM-ABC1234"
                value={form.gtmContainerId}
                onChange={(e) => set("gtmContainerId", e.target.value.toUpperCase())}
                className="font-mono"
              />
            </div>

            {/* GA4 */}
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="ga4-id">Google Analytics 4 Measurement ID</Label>
                <div className="flex items-center gap-2">
                  {form.ga4MeasurementId && GA4_RE.test(form.ga4MeasurementId) ? (
                    <Badge variant="outline" className="text-xs">Biçim doğru</Badge>
                  ) : form.ga4MeasurementId ? (
                    <Badge variant="destructive" className="text-xs">G-XXXXXXXXXX bekleniyor</Badge>
                  ) : null}
                  <Switch checked={form.ga4Enabled} onCheckedChange={(v) => set("ga4Enabled", v)} aria-label="GA4'ü etkinleştir" />
                </div>
              </div>
              <Input
                id="ga4-id"
                placeholder="G-XXXXXXXXXX"
                value={form.ga4MeasurementId}
                onChange={(e) => set("ga4MeasurementId", e.target.value.toUpperCase())}
                className="font-mono"
              />
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div>
                  <p className="text-sm font-medium">GA4 etiketi GTM üzerinden geliyor</p>
                  <p className="text-xs text-muted-foreground">
                    Doğruysa gtag.js ayrıca yüklenmez; çift page_view ölçümü engellenir.
                  </p>
                </div>
                <Switch
                  checked={form.ga4ViaGtm}
                  onCheckedChange={(v) => set("ga4ViaGtm", v)}
                  aria-label="GA4 GTM üzerinden"
                />
              </div>
            </div>

            {/* Meta Pixel */}
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="pixel-id">Meta Pixel ID</Label>
                <div className="flex items-center gap-2">
                  {form.metaPixelId && PIXEL_RE.test(form.metaPixelId) ? (
                    <Badge variant="outline" className="text-xs">Biçim doğru</Badge>
                  ) : form.metaPixelId ? (
                    <Badge variant="destructive" className="text-xs">15-16 haneli sayı bekleniyor</Badge>
                  ) : null}
                  <Switch checked={form.metaPixelEnabled} onCheckedChange={(v) => set("metaPixelEnabled", v)} aria-label="Meta Pixel'i etkinleştir" />
                </div>
              </div>
              <Input
                id="pixel-id"
                placeholder="1234567890123456"
                value={form.metaPixelId}
                onChange={(e) => set("metaPixelId", e.target.value.replace(/\D/g, ""))}
                className="font-mono"
              />
            </div>

            <div className="space-y-3 rounded-lg border border-border p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Rıza (consent) yönetimi zorunlu</p>
                  <p className="text-xs text-muted-foreground">
                    Açıkken ölçüm/pazarlama etiketleri çerez onayı verilene kadar yüklenmez (KVKK/GDPR uyumu).
                  </p>
                </div>
                <Switch checked={form.consentRequired} onCheckedChange={(v) => set("consentRequired", v)} aria-label="Rıza yönetimi" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Geliştirme ortamında da yükle</p>
                  <p className="text-xs text-muted-foreground">
                    Varsayılan olarak etiketler yalnızca üretim ortamında yüklenir.
                  </p>
                </div>
                <Switch checked={form.enableInDev} onCheckedChange={(v) => set("enableInDev", v)} aria-label="Dev ortamında yükle" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" /> Search Console Doğrulaması
            </CardTitle>
            <CardDescription>
              Google Search Console'dan aldığınız HTML meta doğrulama token'ını girin; tüm sayfaların
              <code className="mx-1 rounded bg-muted px-1 text-xs">&lt;head&gt;</code>bölümüne otomatik eklenir.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="gsc-token">Doğrulama token'ı (content değeri)</Label>
              <Input
                id="gsc-token"
                placeholder="ör. 9fK3..."
                value={form.gscVerificationToken}
                onChange={(e) => set("gscVerificationToken", e.target.value)}
                className="font-mono"
              />
            </div>
            <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground space-y-1">
              <p className="flex items-center gap-1 font-medium text-foreground">
                <ExternalLink className="w-3 h-3" /> Nasıl kullanılır?
              </p>
              <p>
                Search Console → "URL öneki" ile mülk ekleyin → "HTML etiketi" doğrulamasını seçin → content
                değerini buraya yapıştırın ve kaydedin. Doğrulamayı tamamladıktan sonra{" "}
                <code className="rounded bg-muted px-1">/sitemap.xml</code> adresini gönderin.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={save} disabled={!idOk} className="gap-2">
            <Save className="w-4 h-4" /> Ayarları Kaydet
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
}
