import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Globe, QrCode, Copy, Check, ExternalLink, Rocket, Eye, EyeOff } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { PageHeader, FadeIn, TiltCard } from "@/components/ui/fx";

type RestaurantSettings = { name: string; slug: string | null; isPublished: boolean; publicUrl: string | null };

export default function OnlineMenuPreview() {
  const { data: r, isLoading } = useQuery<RestaurantSettings>({
    queryKey: ["/api/restaurant"],
    queryFn: async () => (await fetch("/api/restaurant", { credentials: "include" })).json(),
  });
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [preview, setPreview] = useState(true);

  if (isLoading || !r) return <Skeleton className="h-96 w-full rounded-xl" />;

  const copyLink = async () => {
    await navigator.clipboard.writeText(r.publicUrl ?? "");
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
    toast({ title: "Menü bağlantısı kopyalandı" });
  };

  return (
    <>
      <PageHeader
        icon={Globe}
        title="Online Menü"
        description="Misafirlerinizin gördüğü menünün canlı önizlemesi."
        actions={
          <>
            {r.isPublished ? (
              <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20 border-0">Yayında</Badge>
            ) : (
              <Badge variant="secondary">Yayında değil</Badge>
            )}
            {r.isPublished && (
              <Button size="sm" variant="outline" onClick={() => window.open(r.publicUrl!, "_blank")}>
                <ExternalLink className="h-4 w-4" /> Yeni sekmede aç
              </Button>
            )}
          </>
        }
      />

      {!r.slug || !r.isPublished ? (
        <FadeIn>
          <Card>
            <CardContent className="p-10 text-center">
              <Rocket className="h-10 w-10 mx-auto mb-3 text-primary" />
              <h2 className="font-semibold mb-1">Önce menünüzü yayına alın</h2>
              <p className="text-sm text-muted-foreground mb-4">Yayındaki menünün önizlemesi burada görünür.</p>
              <Button size="sm" onClick={() => (window.location.href = "/restoran/digital-menu")}>Dijital Menü'ye git</Button>
            </CardContent>
          </Card>
        </FadeIn>
      ) : (
        <div className="grid lg:grid-cols-[1fr_300px] gap-6 items-start">
          <FadeIn>
            <Card className="overflow-hidden">
              <div className="flex items-center gap-2 border-b bg-muted/50 px-4 py-2.5">
                <span className="flex gap-1.5">
                  <i className="h-3 w-3 rounded-full bg-red-400" /><i className="h-3 w-3 rounded-full bg-amber-400" /><i className="h-3 w-3 rounded-full bg-green-400" />
                </span>
                <span className="ml-2 flex-1 truncate rounded-md bg-background border px-3 py-1 text-xs text-muted-foreground">
                  {r.publicUrl}
                </span>
                <button
                  onClick={() => setPreview(!preview)}
                  className="p-1.5 rounded hover:bg-background text-muted-foreground hover:text-foreground transition-colors"
                  title={preview ? "Önizlemeyi duraklat" : "Önizlemeyi devam ettir"}
                >
                  {preview ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </button>
              </div>
              {preview && (
                <iframe
                  src={r.publicUrl!}
                  title="Menü önizleme"
                  className="w-full h-[560px] bg-white"
                  sandbox="allow-scripts allow-same-origin"
                />
              )}
            </Card>
          </FadeIn>

          <div className="space-y-4">
            <FadeIn delay={100}>
              <TiltCard>
                <Card className="fx-card-lift">
                  <CardContent className="p-5 text-center space-y-3">
                    <QrCode className="h-8 w-8 mx-auto text-primary" />
                    <h3 className="font-semibold">Karekod ve bağlantı</h3>
                    <img src="/api/restaurant/qr.png?size=384" alt="Menü karekodu" className="mx-auto h-36 w-36 rounded-lg border bg-white p-2" />
                    <Button size="sm" variant="outline" className="w-full" onClick={copyLink}>
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} Bağlantıyı kopyala
                    </Button>
                  </CardContent>
                </Card>
              </TiltCard>
            </FadeIn>
            <FadeIn delay={180}>
              <Card>
                <CardContent className="p-5 text-sm text-muted-foreground space-y-2">
                  <p className="font-medium text-foreground">Ne yapabilirim?</p>
                  <p>• Bağlantıyı Instagram, Google ve biyografi sayfalarınıza koyun.</p>
                  <p>• Karekodları masalara asın — taramalar analitiğe işlenir.</p>
                  <p>• Tasarımı Dijital Menü sayfasından yönetin.</p>
                </CardContent>
              </Card>
            </FadeIn>
          </div>
        </div>
      )}
    </>
  );
}
