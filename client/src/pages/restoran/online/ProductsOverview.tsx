import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Box, Search, Boxes, Rotate3d, PackageOpen, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { PageHeader, FadeIn, CountUp, TiltCard } from "@/components/ui/fx";
import { useProducts, useCategories } from "@/hooks/use-resto";

export default function ProductsOverview() {
  const { data: products, isLoading } = useProducts();
  const { data: categories } = useCategories();
  const [active, setActive] = useState<number | "all">("all");
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    if (!products) return [];
    return products.filter(
      (p: any) =>
        (active === "all" || p.categoryId === active) &&
        (!q || (p.name || "").toLowerCase().includes(q.toLowerCase()))
    );
  }, [products, active, q]);

  const with3d = products?.filter((p: any) => p.model3dUrl).length ?? 0;

  return (
    <>
      <PageHeader
        icon={Box}
        title="Ürünler"
        description="Menünüzdeki tüm ürünler tek bakışta. Düzenlemek için Tanımlar → Menü / Ürünler sayfasını kullanın."
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        {[
          { label: "Toplam ürün", value: products?.length ?? 0, icon: Boxes },
          { label: "Kategori", value: categories?.length ?? 0, icon: Boxes },
          { label: "3D'li ürün", value: with3d, icon: Rotate3d },
          { label: "Listelenen", value: filtered.length, icon: PackageOpen },
        ].map((s, i) => (
          <FadeIn key={s.label} delay={i * 70}>
            <Card className="fx-card-lift">
              <CardContent className="p-4 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                  <s.icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-2xl font-bold leading-none"><CountUp value={s.value} /></p>
                  <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          </FadeIn>
        ))}
      </div>

      <FadeIn delay={120}>
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ürün ara…" className="pl-9" />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setActive("all")}
              className={`shrink-0 rounded-full border px-4 py-1.5 text-sm transition-colors ${active === "all" ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:border-primary/50"}`}
            >
              Tümü
            </button>
            {categories?.map((c: any) => (
              <button
                key={c.id}
                onClick={() => setActive(c.id)}
                className={`shrink-0 rounded-full border px-4 py-1.5 text-sm transition-colors ${active === c.id ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:border-primary/50"}`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>
      </FadeIn>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-52 rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <FadeIn>
          <Card>
            <CardContent className="p-10 text-center text-muted-foreground">
              <Box className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
              Aramanıza uyan ürün yok.
            </CardContent>
          </Card>
        </FadeIn>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((p: any, i: number) => (
            <FadeIn key={p.id} delay={Math.min(i, 10) * 50}>
              <TiltCard>
                <Card className="fx-card-lift overflow-hidden h-full">
                  <div className="relative aspect-[4/3] bg-muted">
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt={p.name} className="h-full w-full object-cover" loading="lazy" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-muted-foreground/40"><Box className="h-10 w-10" /></div>
                    )}
                    {p.model3dUrl && (
                      <Badge className="absolute top-2 right-2 bg-primary text-primary-foreground gap-1"><Rotate3d className="h-3 w-3" /> 3D</Badge>
                    )}
                    {!p.isAvailable && (
                      <div className="absolute inset-0 bg-background/70 backdrop-blur-[2px] flex items-center justify-center">
                        <Badge variant="secondary">Tükendi</Badge>
                      </div>
                    )}
                  </div>
                  <CardContent className="p-3">
                    <p className="font-medium text-sm truncate" title={p.name}>{p.name}</p>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-primary font-semibold text-sm">{Number(p.price).toFixed(2)} ₺</p>
                      <a href="/restoran/definitions/products" className="text-xs text-muted-foreground hover:text-primary inline-flex items-center gap-1 transition-colors">
                        Düzenle <ArrowRight className="h-3 w-3" />
                      </a>
                    </div>
                  </CardContent>
                </Card>
              </TiltCard>
            </FadeIn>
          ))}
        </div>
      )}
    </>
  );
}
