import { Sidebar } from "@/components/Sidebar";
import { useOrders, useUpdateOrderStatus } from "@/hooks/use-resto";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { format } from "date-fns";
import { Clock, CheckCircle, XCircle, ArrowRight } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function Orders() {
  const [statusFilter, setStatusFilter] = useState("pending");
  const { data: orders, isLoading } = useOrders(statusFilter === 'all' ? undefined : statusFilter);
  const updateStatus = useUpdateOrderStatus();

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 border-b flex items-center justify-between px-6 bg-card/50 backdrop-blur-sm">
          <h1 className="text-2xl font-display font-bold">Kitchen Orders</h1>
          <Tabs value={statusFilter} onValueChange={setStatusFilter}>
            <TabsList>
              <TabsTrigger value="pending">Active</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
              <TabsTrigger value="all">All History</TabsTrigger>
            </TabsList>
          </Tabs>
        </header>

        <main className="flex-1 overflow-auto p-6 bg-muted/10">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {orders?.map((order) => (
              <Card key={order.id} className="border-l-4 border-l-primary shadow-sm hover:shadow-md transition-all">
                <CardContent className="p-5">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-lg">#{order.id}</span>
                        <Badge variant={order.status === 'completed' ? "default" : "secondary"}>
                          {order.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {order.createdAt ? format(new Date(order.createdAt), 'h:mm a') : 'Just now'}
                        <span className="mx-1">•</span>
                        {order.table ? `Table ${order.table.name}` : 'Takeaway'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-xl text-primary">${order.totalAmount}</div>
                      <div className="text-xs text-muted-foreground">{order.items.length} items</div>
                    </div>
                  </div>

                  <div className="space-y-2 mb-6 border-t border-b py-3 border-dashed">
                    {order.items.map((item: any) => (
                       <div key={item.id} className="flex justify-between text-sm">
                         <div className="flex gap-2">
                           <span className="font-bold w-4">{item.quantity}x</span>
                           <span>{item.product.name}</span>
                         </div>
                         <span className="text-muted-foreground">${item.price}</span>
                       </div>
                    ))}
                  </div>

                  {order.status === 'pending' && (
                    <div className="flex gap-2">
                      <Button 
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white" 
                        onClick={() => updateStatus.mutate({ id: order.id, status: 'completed' })}
                        disabled={updateStatus.isPending}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Complete
                      </Button>
                      <Button 
                        variant="outline"
                        className="flex-1"
                        onClick={() => updateStatus.mutate({ id: order.id, status: 'cancelled' })}
                        disabled={updateStatus.isPending}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
            
            {orders?.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-20 text-muted-foreground">
                <p>No orders found</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
