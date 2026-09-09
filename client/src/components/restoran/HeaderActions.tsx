import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bell, HelpCircle, Search, FileText, ExternalLink, CheckCircle2, LifeBuoy } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export function NotificationsPopover() {
  const [notifications, setNotifications] = useState([
    { id: 1, title: "Yeni Sipariş #1234", time: "2 dk önce", type: "order", read: false },
    { id: 2, title: "Masa 5 Ödeme Alındı", time: "5 dk önce", type: "payment", read: false },
    { id: 3, title: "Stok Uyarısı: Kola", time: "1 saat önce", type: "stock", read: true },
    { id: 4, title: "Gün sonu raporu hazır", time: "Dün", type: "system", read: true },
  ]);

  const markAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-slate-500 hover:text-primary">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
          <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100">Bildirimler</h4>
          {unreadCount > 0 && (
            <button 
              onClick={markAsRead}
              className="text-xs text-primary hover:underline"
            >
              Tümünü Okundu İşaretle
            </button>
          )}
        </div>
        <ScrollArea className="h-[300px]">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-slate-500 dark:text-slate-400">
              Bildiriminiz bulunmuyor.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {notifications.map((notification) => (
                <div 
                  key={notification.id} 
                  className={`px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${!notification.read ? 'bg-blue-50/50 dark:bg-blue-900/20' : ''}`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className={`text-sm font-medium ${!notification.read ? 'text-slate-900 dark:text-slate-100' : 'text-slate-600 dark:text-slate-300'}`}>
                      {notification.title}
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 whitespace-nowrap ml-2">
                      {notification.time}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {notification.type === 'order' && 'Mutfak onay bekliyor.'}
                    {notification.type === 'payment' && 'Kredi kartı ile ödendi.'}
                    {notification.type === 'stock' && 'Kritik seviyenin altına düştü.'}
                    {notification.type === 'system' && 'İncelemek için tıklayın.'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

export function HelpSheet() {
  const helpTopics = [
    { title: "Sipariş Nasıl Oluşturulur?", category: "Siparişler" },
    { title: "Masa Taşıma ve Birleştirme", category: "Masalar" },
    { title: "Gün Sonu Raporu Alma", category: "Raporlar" },
    { title: "Menü Düzenleme", category: "Menü" },
    { title: "Yazıcı Ayarları", category: "Ayarlar" },
  ];

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="text-slate-500 hover:text-primary">
          <HelpCircle className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader className="mb-6">
          <SheetTitle>Yardım Merkezi</SheetTitle>
          <SheetDescription>
            Sistem kullanımı ile ilgili rehberlere buradan ulaşabilirsiniz.
          </SheetDescription>
        </SheetHeader>
        
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input placeholder="Konu ara..." className="pl-9" />
        </div>

        <div className="space-y-6">
          <div>
            <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">Sık Sorulan Sorular</h4>
            <div className="space-y-2">
              {helpTopics.map((topic, i) => (
                <button 
                  key={i}
                  className="w-full flex items-center justify-between p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-left group transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-slate-400 group-hover:text-primary" />
                    <span className="text-sm text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-slate-100">{topic.title}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800">
            <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">Canlı Destek</h4>
            <p className="text-xs text-blue-700 dark:text-blue-300 mb-3">
              Sorununuzu çözemediniz mi? Destek ekibimiz haftanın 7 günü 09:00 - 24:00 arası hizmetinizdedir.
            </p>
            <Button variant="outline" className="w-full bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/30 h-8 text-xs">
              Canlı Sohbete Bağlan
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function SupportDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // @ts-ignore
      const subject = e.target.elements.subject.value;
      // @ts-ignore
      const category = e.target.elements.category.value;
      // @ts-ignore
      const message = e.target.elements.message.value;

      const response = await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'support',
          title: `Destek: ${subject}`,
          message: `[${category}] ${message}`,
          contact: 'Restoran Paneli', // Could be dynamic if we had user info
          status: 'unread'
        }),
      });

      if (response.ok) {
        setOpen(false);
        toast({
          title: "Talebiniz Alındı",
          description: "Destek ekibimiz en kısa sürede size dönüş yapacaktır.",
        });
        // @ts-ignore
        e.target.reset();
      } else {
        throw new Error('Failed to send support request');
      }
    } catch (error) {
      toast({
        title: "Hata",
        description: "Destek talebi gönderilirken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" className="ml-1 sm:ml-2 bg-primary hover:bg-primary/90 h-9 w-9 sm:w-auto px-0 sm:px-4 text-xs font-bold gap-2">
          <LifeBuoy className="h-4 w-4" />
          <span className="hidden sm:inline">Destek İste</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Destek Talebi Oluştur</DialogTitle>
          <DialogDescription>
            Yaşadığınız sorunu veya talebinizi detaylı bir şekilde açıklayın.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="subject">Konu</Label>
            <Input id="subject" placeholder="Örn: Yazıcı bağlantı sorunu" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="category">Kategori</Label>
            <select 
              id="category" 
              className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option>Teknik Sorun</option>
              <option>Fatura / Ödeme</option>
              <option>Özellik İsteği</option>
              <option>Diğer</option>
            </select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="message">Mesajınız</Label>
            <Textarea 
              id="message" 
              placeholder="Sorununuzu detaylıca anlatın..." 
              className="min-h-[100px]" 
              required
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Gönderiliyor..." : "Talebi Gönder"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
