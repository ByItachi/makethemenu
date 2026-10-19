import { useQuery } from "@tanstack/react-query";
import { LineChart, Eye, QrCode, TrendingUp, ArrowRight, FileDown, MoonStar, ClipboardList, PieChartIcon, Box, FileMinus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { PageHeader, FadeIn, CountUp } from "@/components/ui/fx";

type Summary = { totals: { menuView: number; qrScan: number; productView: number }; topProducts: { productId: number; name: string; views: number }[] };

const REPORT_LINKS = [
  { label: "Ürün Satış Raporu", href: "/restoran/reports/sales", icon: TrendingUp },
  { label: "Gün Sonu Raporu", href: "/restoran/reports/end-of-day", icon: MoonStar },
  { label: "Vardiya Satış Raporu", href: "/restoran/reports/shift", icon: ClipboardList },
  { label: "Restaurant İstatistikleri", href: "/restoran/reports/stats", icon: PieChartIcon },
  { label: "Stok Durum Raporu", href: "/restoran/reports/stock", icon: Box },
  { label: "Fire Raporu", href: "/restoran/reports/waste", icon: FileMinus },
];

export default function ReportsHub() {
  const { data, isLoading } = useQuery<Summary>({
    queryKey: ["/api/analytics/summary", 30],
    queryFn: async () => (await fetch("/api/analytics/summary?days=30", { credentials: "include" })).json(),
  });

  return (
    <>
      <PageHeader
        icon={LineChart}
        title="Raporlar"
        description="Menü performansı ve detaylı raporlar tek yerde."
        actions={
          <Button variant="outline" size="sm" asChild>
            <a href="/api/analytics/export.csv" download><FileDown className="h-4 w-4" /> CSV indir</a>
          </Button>
        }
      />

      <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6">
        {[
          { label: "Menü görüntüleme", value: data?.totals.menuView ?? 0, icon: Eye },
          { label: "Karekod taraması", value: data?.totals.qrScan ?? 0, icon: QrCode },
          { label: "Ürün inceleme", value: data?.totals.productView ?? 0, icon: TrendingUp },
        ].map((s, i) => (
          <FadeIn key={s.label} delay={i * 70}>
            <Card className="fx-card-lift">
              <CardContent className="p-4">
                <s.icon className="h-5 w-5 text-primary mb-2" />
                {isLoading ? <Skeleton className="h-8 w-16" /> : (
                  <p className="text-2xl sm:text-3xl font-bold"><CountUp value={s.value} /></p>
                )}
                <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
                <p className="text-[11px] text-muted-foreground/70">son 30 gün</p>
              </CardContent>
            </Card>
          </FadeIn>
        ))}
      </div>

      <FadeIn delay={100}>
        <Card className="mb-6">
          <CardContent className="p-4 sm:p-5">
            <h2 className="font-semibold mb-4">En çok incelenen ürünler</h2>
            {isLoading ? (
              <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-9" />)}</div>
            ) : !data?.topProducts?.length ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Henüz veri yok. Menünüz görüntülendikçe burada birikir.</p>
            ) : (
              <div className="space-y-2">
                {data.topProducts.slice(0, 5).map((p, i) => {
                  const max = data.topProducts[0].views || 1;
                  return (
                    <div key={p.productId} className="flex items-center gap-3">
                      <span className="w-5 text-xs text-muted-foreground shrink-0">{i + 1}.</span>
                      <span className="text-sm w-36 sm:w-48 truncate">{p.name}</span>
                      <div className="flex-1 h-2.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-primary to-orange-400 transition-all duration-700"
                          style={{ width: `${Math.round((p.views / max) * 100)}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium w-10 text-right shrink-0">{p.views}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </FadeIn>

      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {REPORT_LINKS.map((r, i) => (
          <FadeIn key={r.href} delay={120 + i * 50}>
            <a href={r.href} className="block group">
              <Card className="fx-card-lift h-full">
                <CardContent className="p-4 flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                    <r.icon className="h-5 w-5" />
                  </span>
                  <span className="font-medium text-sm">{r.label}</span>
                  <ArrowRight className="h-4 w-4 ml-auto text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </CardContent>
              </Card>
            </a>
          </FadeIn>
        ))}
      </div>
    </>
  );
}
