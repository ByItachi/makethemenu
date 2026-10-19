import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useOrders, useTables } from "@/hooks/use-resto";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { DollarSign, Users, ShoppingBag, TrendingUp, Clock, Eye, QrCode, Loader2, FileDown } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { format, subDays } from "date-fns";
import { tr } from "date-fns/locale";
import { apiRequest } from "@/lib/queryClient";

type Analytics = {
  days: number;
  totals: { menuView: number; qrScan: number; productView: number };
  daily: { date: string; menuView: number; qrScan: number; productView: number }[];
  topProducts: { productId: number | null; name: string; views: number }[];
};

export default function Dashboard() {
  const { data: orders } = useOrders();
  const { data: tables } = useTables();

  const activeOrders = orders?.filter(o => o.status === 'pending') || [];
  const completedOrders = orders?.filter(o => o.status === 'completed') || [];
  const totalRevenue = completedOrders.reduce((acc, order) => acc + Number(order.totalAmount), 0);
  const occupiedTables = tables?.filter(t => t.status === 'occupied').length || 0;
  const totalTables = tables?.length || 0;

  // Real revenue per day for the last 7 days, from completed orders in the database.
  const salesData = Array.from({ length: 7 }, (_, i) => {
    const day = subDays(new Date(), 6 - i);
    const key = format(day, 'yyyy-MM-dd');
    const total = completedOrders
      .filter(o => o.createdAt && format(new Date(o.createdAt), 'yyyy-MM-dd') === key)
      .reduce((acc, o) => acc + Number(o.totalAmount), 0);
    return { name: format(day, 'EEE', { locale: tr }), total };
  });

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden pt-14 md:pt-0">
        <header className="h-16 border-b flex items-center justify-between px-4 sm:px-6 bg-card/50 backdrop-blur-sm z-10">
          <h1 className="text-xl sm:text-2xl font-display font-bold">Yönetim Paneli</h1>
          <div className="flex items-center gap-2 sm:gap-3">
            <Button variant="outline" size="sm" className="gap-2" onClick={() => window.open("/api/orders/export", "_blank")} data-testid="button-export-orders">
              <FileDown className="h-4 w-4" /> <span className="hidden sm:inline">Siparişleri</span> CSV
            </Button>
            <Button variant="outline" size="sm" className="gap-2" onClick={() => window.open("/api/analytics/export?days=30", "_blank")} data-testid="button-export-analytics">
              <FileDown className="h-4 w-4" /> <span className="hidden sm:inline">Analitiği</span> CSV
            </Button>
            <div className="ml-auto text-xs sm:text-sm text-muted-foreground">
              {format(new Date(), 'dd MMMM yyyy, EEEE', { locale: tr })}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 sm:p-6 scroll-smooth space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <StatCard
              title="Toplam Gelir"
              value={`${totalRevenue.toLocaleString('tr-TR', { maximumFractionDigits: 2 })} ₺`}
              icon={DollarSign}
              trend={`${completedOrders.length} tamamlanan sipariş`}
              color="text-green-500"
            />
            <StatCard
              title="Aktif Siparişler"
              value={activeOrders.length.toString()}
              icon={ShoppingBag}
              trend="Şu an hazırlanıyor"
              color="text-blue-500"
            />
            <StatCard
              title="Masa Doluluğu"
              value={`${occupiedTables}/${totalTables}`}
              icon={Users}
              trend={`%${totalTables ? Math.round((occupiedTables / totalTables) * 100) : 0} doluluk`}
              color="text-amber-500"
            />
            <StatCard
              title="Menü Görüntüleme"
              value={<MenuViewValue />}
              icon={Eye}
              trend="Son 7 gün"
              color="text-purple-500"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            <Card className="lg:col-span-2 border-none shadow-lg bg-card/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Son 7 Günün Geliri
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value} ₺`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                      itemStyle={{ color: 'hsl(var(--foreground))' }}
                      formatter={(value) => [`${Number(value).toLocaleString('tr-TR')} ₺`, 'Gelir']}
                    />
                    <Bar dataKey="total" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg bg-card/50">
              <CardHeader>
                <CardTitle>Son Siparişler</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px] pr-4">
                  <div className="space-y-4">
                    {activeOrders.slice(0, 5).map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-3 rounded-lg bg-background border border-border/50">
                        <div>
                          <p className="font-medium text-sm">Sipariş #{order.id}</p>
                          <p className="text-xs text-muted-foreground">
                            {order.table ? `Masa ${order.table.name}` : 'Paket Servis'} • {order.items.length} ürün
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-sm text-primary">{order.totalAmount} ₺</p>
                          <Badge variant="secondary" className="text-[10px] h-5 px-1.5 uppercase tracking-wide">
                            {order.status === 'pending' ? 'Bekliyor' : order.status === 'completed' ? 'Tamamlandı' : order.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                    {activeOrders.length === 0 && (
                      <div className="text-center py-10 text-muted-foreground">
                        Aktif sipariş yok
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          <AnalyticsCard />
        </main>
      </div>
    </div>
  );
}

function MenuViewValue() {
  const { data } = useQuery<Analytics>({
    queryKey: ["/api/analytics/summary", 7],
    queryFn: async () => (await apiRequest("GET", "/api/analytics/summary?days=7")).json(),
  });
  if (!data) return "…";
  return data.totals.menuView.toString();
}

function AnalyticsCard() {
  const [days, setDays] = useState(30);
  const { data, isLoading } = useQuery<Analytics>({
    queryKey: ["/api/analytics/summary", days],
    queryFn: async () => (await apiRequest("GET", `/api/analytics/summary?days=${days}`)).json(),
  });

  const maxDaily = Math.max(1, ...(data?.daily ?? []).map((d) => d.menuView + d.qrScan));

  return (
    <Card className="border-none shadow-lg bg-card/50">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <CardTitle className="flex items-center gap-2">
          <QrCode className="h-5 w-5 text-primary" />
          Menü Analitiği (gerçek veri)
        </CardTitle>
        <div className="sm:ml-auto flex gap-2">
          {[7, 30, 90].map((d) => (
            <Button key={d} size="sm" variant={days === d ? "default" : "outline"} onClick={() => setDays(d)}>
              {d} gün
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading || !data ? (
          <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="grid grid-cols-3 lg:grid-cols-1 gap-3">
              <Kpi label="Menü görüntüleme" value={data.totals.menuView} />
              <Kpi label="QR tarama" value={data.totals.qrScan} />
              <Kpi label="Ürün görüntüleme" value={data.totals.productView} />
            </div>

            <div className="lg:col-span-2 space-y-4">
              <div>
                <p className="text-sm font-medium mb-2">Günlük görüntüleme (menü + QR)</p>
                {data.daily.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4">Bu aralıkta veri yok; menünüz ziyaret edildiğinde burada birikecek.</p>
                ) : (
                  <div className="flex items-end gap-1.5 h-28">
                    {data.daily.map((d) => {
                      const total = d.menuView + d.qrScan;
                      return (
                        <div key={d.date} className="flex-1 flex flex-col items-center gap-1 group" title={`${d.date}: ${total}`}>
                          <div className="w-full bg-primary/80 rounded-t" style={{ height: `${(total / maxDaily) * 100}%`, minHeight: total > 0 ? 4 : 1 }} />
                          <span className="text-[10px] text-muted-foreground">{d.date.slice(8)}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              <div>
                <p className="text-sm font-medium mb-2">En çok görüntülenen ürünler</p>
                {data.topProducts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Henüz ürün görüntüleme yok.</p>
                ) : (
                  <ul className="space-y-1.5">
                    {data.topProducts.map((p) => (
                      <li key={p.productId} className="flex justify-between text-sm">
                        <span className="truncate mr-3">{p.name}</span>
                        <span className="text-muted-foreground whitespace-nowrap">{p.views} görüntüleme</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Kpi({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border/50 bg-background p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, trend, color }: { title: string; value: React.ReactNode; icon: typeof DollarSign; trend: string; color: string }) {
  return (
    <Card className="border-none shadow-md hover:shadow-lg transition-all duration-300 bg-card">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <h3 className="text-3xl font-bold mt-2 font-display">{value}</h3>
          </div>
          <div className={`p-3 rounded-xl bg-background shadow-sm ${color}`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
        <div className="mt-4 flex items-center text-xs">
          <span className="text-muted-foreground">{trend}</span>
        </div>
      </CardContent>
    </Card>
  );
}
