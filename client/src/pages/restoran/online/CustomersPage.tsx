import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Users, UserRound, PhoneCall, ShoppingCart, UserPlus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { PageHeader, FadeIn, CountUp, TiltCard } from "@/components/ui/fx";

type Order = { id: number; customerName: string | null; phone: string | null; totalAmount: string; createdAt: string };

export default function CustomersPage() {
  const { data: orders, isLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
    queryFn: async () => (await fetch("/api/orders", { credentials: "include" })).json(),
  });

  const customers = useMemo(() => {
    if (!orders) return [];
    const map = new Map<string, { name: string; phone: string | null; count: number; total: number; last: string }>();
    for (const o of orders) {
      if (!o.customerName) continue;
      const key = o.phone || o.customerName;
      const cur = map.get(key) ?? { name: o.customerName, phone: o.phone, count: 0, total: 0, last: o.createdAt };
      cur.count += 1;
      cur.total += Number(o.totalAmount);
      if (new Date(o.createdAt) > new Date(cur.last)) cur.last = o.createdAt;
      map.set(key, cur);
    }
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [orders]);

  const repeat = customers.filter((c) => c.count > 1).length;

  return (
    <>
      <PageHeader
        icon={Users}
        title="Müşteriler"
        description="Sipariş bırakan misafirleriniz otomatik olarak burada birikir."
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        {[
          { label: "Toplam müşteri", value: customers.length, icon: UserRound },
          { label: "Tekrar gelen", value: repeat, icon: UserPlus },
          { label: "Toplam sipariş", value: orders?.length ?? 0, icon: ShoppingCart },
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

      {isLoading ? (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
      ) : customers.length === 0 ? (
        <FadeIn>
          <Card>
            <CardContent className="p-10 text-center text-muted-foreground">
              <Users className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
              Henüz isim bırakan müşteri yok. Online menüden gelen siparişler burada listelenir.
            </CardContent>
          </Card>
        </FadeIn>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {customers.map((c, i) => (
            <FadeIn key={c.phone || c.name} delay={Math.min(i, 8) * 50}>
              <TiltCard>
                <Card className="fx-card-lift h-full">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 border border-primary/20 text-primary font-semibold">
                        {c.name.slice(0, 1).toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{c.name}</p>
                        {c.phone && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <PhoneCall className="h-3 w-3" /> {c.phone}
                          </p>
                        )}
                      </div>
                      {c.count > 1 && (
                        <Badge className="ml-auto shrink-0 bg-green-500/10 text-green-600 hover:bg-green-500/20 border-0">
                          {c.count} sipariş
                        </Badge>
                      )}
                    </div>
                    <div className="mt-3 pt-3 border-t flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Toplam harcama</span>
                      <span className="font-semibold text-primary">{c.total.toFixed(2)} ₺</span>
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
