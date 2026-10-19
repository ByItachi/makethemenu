import AdminLayout from "./AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Bell, CheckCircle2, AlertCircle, Clock, Trash2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface Notification {
  id: number;
  type: 'support' | 'system' | 'payment';
  title: string;
  message: string;
  status: 'read' | 'unread';
  createdAt: string;
  contact: string;
}

export default function AdminNotifications() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: notifications, isLoading } = useQuery<Notification[]>({
    queryKey: ["/api/admin/notifications"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/admin/notifications?id=${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete notification");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/notifications"] });
      toast({
        title: "Başarılı",
        description: "Bildirim silindi.",
      });
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch("/api/admin/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "read" }),
      });
      if (!response.ok) throw new Error("Failed to update notification");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/notifications"] });
    },
  });

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="p-8 flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Bildirimler</h1>
            <p className="text-muted-foreground mt-1">Sistem bildirimleri ve destek talepleri</p>
          </div>
          <Badge variant="outline" className="px-4 py-2 text-sm">
            {notifications?.filter(n => n.status === 'unread').length || 0} Okunmamış
          </Badge>
        </div>

        <div className="space-y-4">
          {notifications?.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Bell className="h-12 w-12 mb-4 opacity-20" />
                <p>Henüz bildirim bulunmuyor.</p>
              </CardContent>
            </Card>
          ) : (
            notifications?.map((notification) => (
              <Card key={notification.id} className={`transition-all ${notification.status === 'unread' ? 'border-l-4 border-l-primary bg-blue-50/20' : ''}`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex gap-4">
                      <div className={`mt-1 p-2 rounded-full ${
                        notification.type === 'support' ? 'bg-orange-100 text-orange-600' :
                        notification.type === 'payment' ? 'bg-green-100 text-green-600' :
                        'bg-blue-100 text-blue-600'
                      }`}>
                        {notification.type === 'support' ? <AlertCircle className="w-5 h-5" /> :
                         notification.type === 'payment' ? <CheckCircle2 className="w-5 h-5" /> :
                         <Bell className="w-5 h-5" />}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-foreground">{notification.title}</h3>
                          {notification.status === 'unread' && (
                            <Badge variant="default" className="text-[10px] h-5">Yeni</Badge>
                          )}
                        </div>
                        <p className="text-foreground/80">{notification.message}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground/70 mt-2">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(notification.createdAt).toLocaleString('tr-TR')}
                          </span>
                          {notification.contact && notification.contact !== '-' && (
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {notification.contact}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      {notification.status === 'unread' && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => markAsReadMutation.mutate(notification.id)}
                          className="text-primary hover:text-primary/90"
                        >
                          Okundu İşaretle
                        </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-muted-foreground/70 hover:text-red-500"
                        onClick={() => deleteMutation.mutate(notification.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
