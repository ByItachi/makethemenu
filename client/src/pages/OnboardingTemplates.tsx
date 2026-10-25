import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ReadyTemplatesGallery } from "@/pages/restoran/online/ReadyTemplatesGallery";
import { useAuth } from "@/hooks/use-auth";
import { SectorIcon, moduleLabel } from "@/lib/sector-icons";
import { CheckCircle2, ChevronLeft, Layers } from "lucide-react";

interface SectorProfile {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  icon: string;
  modules: string[];
  isFeatured: boolean;
}

/** Kayıt sonrası ilk giriş: önce sektör, sonra şablon seçtirir; seçilirse /dashboard'a gider. */
export default function OnboardingTemplates() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showSectors, setShowSectors] = useState(true);
  const [savingSlug, setSavingSlug] = useState<string | null>(null);

  // Onboarding adımı yalnızca işletmesi olan oturumlar içindir.
  useEffect(() => {
    if (user && !user.restaurantId) navigate("/dashboard");
  }, [user, navigate]);

  const sectors = useQuery<SectorProfile[]>({
    queryKey: ["/api/sectors"],
  });

  const restaurant = useQuery<{ sectorSlug: string | null }>({
    queryKey: ["/api/restaurant"],
    retry: false,
  });

  const sectorSlug = restaurant.data?.sectorSlug ?? null;
  // Sektörü daha önce seçmişse doğrudan şablon adımını göster.
  const step = showSectors && !sectorSlug ? "sector" : "template";

  const chooseSector = async (slug: string) => {
    setSavingSlug(slug);
    try {
      await apiRequest("PUT", "/api/restaurant/sector", { sectorSlug: slug });
      await queryClient.invalidateQueries({ queryKey: ["/api/restaurant"] });
      setShowSectors(false);
      toast({ title: "Sektör kaydedildi", description: "Şimdi menünüze bir tasarım seçin." });
    } catch (err) {
      toast({
        title: "Hata",
        description: err instanceof Error ? err.message : "Sektör seçilemedi.",
        variant: "destructive",
      });
    } finally {
      setSavingSlug(null);
    }
  };

  const featured = (sectors.data ?? []).filter((s) => s.isFeatured);
  const others = (sectors.data ?? []).filter((s) => !s.isFeatured);

  if (step === "sector") {
    return (
      <div className="min-h-screen bg-muted/40 py-10">
        <div className="site-container max-w-5xl space-y-8">
          <header className="space-y-2 text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary">
              <Layers className="w-3.5 h-3.5" /> 1. Adım — Sektörünüzü seçin
            </div>
            <h1 className="text-2xl font-bold sm:text-3xl">İşletmeniz hangi alanda faaliyet gösteriyor?</h1>
            <p className="mx-auto max-w-xl text-sm text-muted-foreground">
              Sektörünüze göre panel modülleri, sipariş akışı ve menü yapısı buna göre kurulur.
              Dilerseniz varsayılan (restoran/kafe) akışıyla devam edip bu adımı atlayabilirsiniz.
            </p>
          </header>

          {sectors.isLoading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-28 rounded-2xl" />
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              {featured.length > 0 && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {featured.map((s) => (
                    <SectorCard key={s.slug} sector={s} onClick={() => chooseSector(s.slug)} saving={savingSlug === s.slug} disabled={savingSlug !== null} />
                  ))}
                </div>
              )}
              {others.length > 0 && (
                <div>
                  <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Diğer sektörler
                  </p>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {others.map((s) => (
                      <SectorCard key={s.slug} sector={s} onClick={() => chooseSector(s.slug)} saving={savingSlug === s.slug} disabled={savingSlug !== null} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col items-center gap-2 pb-10">
            <Button variant="ghost" onClick={() => setShowSectors(false)}>
              Restoran / Kafe (varsayılan) ile devam et
            </Button>
            <p className="text-xs text-muted-foreground">Sektörü sonra işletme ayarlarından da seçebilirsiniz.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/40 py-10">
      <div className="site-container max-w-5xl space-y-6">
        <header className="space-y-2 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary">
            <Layers className="w-3.5 h-3.5" /> 2. Adım — Tasarım seçin
          </div>
          <h1 className="text-2xl font-bold sm:text-3xl">Menünüze bir tasarım seçin</h1>
          <p className="mx-auto max-w-xl text-sm text-muted-foreground">
            Aşağıdaki hazır şablonlardan birini seçtiğinizde dijital menünüz bu tasarımla yayınlanır.
            Seçimi sonra panelinizden dilediğiniz zaman değiştirebilirsiniz.
          </p>
          {sectorSlug && (
            <button
              type="button"
              onClick={() => setShowSectors(true)}
              className="mx-auto flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <ChevronLeft className="w-3 h-3" /> Sektörü değiştir
            </button>
          )}
        </header>

        <ReadyTemplatesGallery onApplied={() => navigate("/dashboard")} />

        <div className="flex justify-center pb-10">
          <Button variant="ghost" onClick={() => navigate("/dashboard")}>
            Şimdilik atla, sonra seçerim
          </Button>
        </div>
      </div>
    </div>
  );
}

function SectorCard({
  sector,
  onClick,
  saving,
  disabled,
}: {
  sector: SectorProfile;
  onClick: () => void;
  saving: boolean;
  disabled: boolean;
}) {
  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      className={`cursor-pointer border-border/60 transition-all hover:border-primary/40 hover:shadow-md ${
        saving ? "opacity-60" : ""
      } ${disabled && !saving ? "pointer-events-none opacity-50" : ""}`}
    >
      <CardContent className="flex h-full gap-3 p-4">
        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <SectorIcon name={sector.icon} className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-semibold">{sector.name}</span>
            {sector.isFeatured && <Badge variant="secondary" className="text-[10px]">Popüler</Badge>}
          </div>
          {sector.description && (
            <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{sector.description}</p>
          )}
          {sector.modules?.length > 0 && (
            <p className="mt-2 truncate text-[11px] text-muted-foreground">
              {sector.modules.slice(0, 4).map((m) => moduleLabel(m)).join(" · ")}
              {sector.modules.length > 4 ? ` +${sector.modules.length - 4}` : ""}
            </p>
          )}
        </div>
        <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-primary opacity-0 transition-opacity [.cursor-pointer:hover_&]:opacity-100" />
      </CardContent>
    </Card>
  );
}
