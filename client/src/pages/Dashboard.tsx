import { Sidebar } from "@/components/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useOrders, useTables } from "@/hooks/use-resto";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, PieChart, Pie, Cell 
} from 'recharts';
import { DollarSign, Users, ShoppingBag, TrendingUp, Clock } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

const CHART_COLORS = ['#fb923c', '#f59e0b', '#d97706', '#92400e'];

export default function Dashboard() {
  const { data: orders } = useOrders();
  const { data: tables } = useTables();

  const activeOrders = orders?.filter(o => o.status === 'pending') || [];
  const completedOrders = orders?.filter(o => o.status === 'completed') || [];
  const totalRevenue = completedOrders.reduce((acc, order) => acc + Number(order.totalAmount), 0);
  const occupiedTables = tables?.filter(t => t.status === 'occupied').length || 0;
  const totalTables = tables?.length || 0;
  
  // Mock data for charts - in real app would aggregate from backend
  const salesData = [
    { name: 'Pzt', total: 1200 },
    { name: 'Sal', total: 1800 },
    { name: 'Çar', total: 1600 },
    { name: 'Per', total: 2100 },
    { name: 'Cum', total: 2800 },
    { name: 'Cmt', total: 3200 },
    { name: 'Paz', total: 2600 },
  ];

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden pt-14 md:pt-0">
        <header className="h-16 border-b flex items-center px-4 sm:px-6 bg-card/50 backdrop-blur-sm z-10">
          <h1 className="text-xl sm:text-2xl font-display font-bold">Yönetim Paneli</h1>
          <div className="ml-auto text-xs sm:text-sm text-muted-foreground">
            {format(new Date(), 'dd MMMM yyyy, EEEE', { locale: tr })}
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 sm:p-6 scroll-smooth">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
            <StatCard 
              title="Toplam Gelir" 
              value={`${totalRevenue.toLocaleString()} ₺`} 
              icon={DollarSign} 
              trend="Geçen haftaya göre +%12"
              trendUp={true}
              color="text-green-500"
            />
            <StatCard 
              title="Aktif Siparişler" 
              value={activeOrders.length.toString()} 
              icon={ShoppingBag} 
              trend="Şu an hazırlanıyor"
              trendUp={true}
              color="text-blue-500"
            />
            <StatCard 
              title="Masa Doluluğu" 
              value={`${occupiedTables}/${totalTables}`} 
              icon={Users} 
              trend={`%${Math.round((occupiedTables/totalTables)*100) || 0} doluluk`}
              trendUp={occupiedTables > 0}
              color="text-amber-500"
            />
            <StatCard 
              title="Ort. Hazırlama Süresi" 
              value="18 dk" 
              icon={Clock} 
              trend="Düne göre -2 dk"
              trendUp={true}
              color="text-purple-500"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
            <Card className="lg:col-span-2 border-none shadow-lg bg-card/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Haftalık Gelir
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={salesData}>
                    <defs>
                      <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value} ₺`} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                      itemStyle={{ color: 'hsl(var(--foreground))' }}
                      formatter={(value) => [`${value} ₺`, 'Gelir']}
                      labelFormatter={(label) => `${label}`}
                    />
                    <Area type="monotone" dataKey="total" stroke="hsl(var(--primary))" strokeWidth={2} fillOpacity={1} fill="url(#colorTotal)" />
                  </AreaChart>
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
        </main>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, trend, trendUp, color }: any) {
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
          <span className={trendUp ? "text-green-500 font-medium" : "text-red-500 font-medium"}>
            {trend}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
