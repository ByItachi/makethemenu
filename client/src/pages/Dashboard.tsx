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
    { name: 'Mon', total: 1200 },
    { name: 'Tue', total: 1800 },
    { name: 'Wed', total: 1600 },
    { name: 'Thu', total: 2100 },
    { name: 'Fri', total: 2800 },
    { name: 'Sat', total: 3200 },
    { name: 'Sun', total: 2600 },
  ];

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 border-b flex items-center px-6 bg-card/50 backdrop-blur-sm z-10">
          <h1 className="text-2xl font-display font-bold">Dashboard</h1>
          <div className="ml-auto text-sm text-muted-foreground">
            {format(new Date(), 'EEEE, MMMM do, yyyy')}
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6 scroll-smooth">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard 
              title="Total Revenue" 
              value={`$${totalRevenue.toLocaleString()}`} 
              icon={DollarSign} 
              trend="+12% from last week"
              trendUp={true}
              color="text-green-500"
            />
            <StatCard 
              title="Active Orders" 
              value={activeOrders.length.toString()} 
              icon={ShoppingBag} 
              trend="Currently processing"
              trendUp={true}
              color="text-blue-500"
            />
            <StatCard 
              title="Table Occupancy" 
              value={`${occupiedTables}/${totalTables}`} 
              icon={Users} 
              trend={`${Math.round((occupiedTables/totalTables)*100) || 0}% capacity`}
              trendUp={occupiedTables > 0}
              color="text-amber-500"
            />
            <StatCard 
              title="Avg Prep Time" 
              value="18 min" 
              icon={Clock} 
              trend="-2 min from yesterday"
              trendUp={true}
              color="text-purple-500"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <Card className="lg:col-span-2 border-none shadow-lg bg-card/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Weekly Revenue
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
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                      itemStyle={{ color: 'hsl(var(--foreground))' }}
                    />
                    <Area type="monotone" dataKey="total" stroke="hsl(var(--primary))" strokeWidth={2} fillOpacity={1} fill="url(#colorTotal)" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg bg-card/50">
              <CardHeader>
                <CardTitle>Recent Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px] pr-4">
                  <div className="space-y-4">
                    {activeOrders.slice(0, 5).map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-3 rounded-lg bg-background border border-border/50">
                        <div>
                          <p className="font-medium text-sm">Order #{order.id}</p>
                          <p className="text-xs text-muted-foreground">
                            {order.table ? `Table ${order.table.name}` : 'Takeaway'} • {order.items.length} items
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-sm text-primary">${order.totalAmount}</p>
                          <Badge variant="secondary" className="text-[10px] h-5 px-1.5 uppercase tracking-wide">
                            {order.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                    {activeOrders.length === 0 && (
                      <div className="text-center py-10 text-muted-foreground">
                        No active orders
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
