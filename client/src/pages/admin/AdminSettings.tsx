import AdminLayout from "./AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Globe, Shield, Bell, CreditCard, Mail, Database, Save } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function AdminSettings() {
  const { toast } = useToast();

  const saveSettingsMutation = useMutation({
    mutationFn: async () => {
      // In a real app, we would gather all form data here
      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ timestamp: new Date().toISOString() }),
      });
      if (!response.ok) throw new Error("Failed to save settings");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Ayarlar başarıyla kaydedildi.",
      });
    },
    onError: () => {
      toast({
        title: "Hata",
        description: "Ayarlar kaydedilirken bir sorun oluştu.",
        variant: "destructive",
      });
    },
  });

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sistem Ayarları</h1>
          <p className="text-gray-500 mt-1">Platform genel yapılandırması ve tercihleri</p>
        </div>

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="bg-white border p-1 h-auto grid grid-cols-2 md:grid-cols-6 gap-2 w-full max-w-4xl">
            <TabsTrigger value="general" className="flex gap-2 items-center data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Globe className="h-4 w-4" /> Genel
            </TabsTrigger>
            <TabsTrigger value="security" className="flex gap-2 items-center data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Shield className="h-4 w-4" /> Güvenlik
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex gap-2 items-center data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Bell className="h-4 w-4" /> Bildirim
            </TabsTrigger>
            <TabsTrigger value="payment" className="flex gap-2 items-center data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <CreditCard className="h-4 w-4" /> Ödeme
            </TabsTrigger>
            <TabsTrigger value="email" className="flex gap-2 items-center data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Mail className="h-4 w-4" /> E-posta
            </TabsTrigger>
            <TabsTrigger value="system" className="flex gap-2 items-center data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Database className="h-4 w-4" /> Sistem
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Site Kimliği</CardTitle>
                <CardDescription>Platform adı, logosu ve temel bilgileri.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="site-title">Site Başlığı</Label>
                    <Input id="site-title" defaultValue="makethemenu Admin" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="site-desc">Site Açıklaması</Label>
                    <Input id="site-desc" defaultValue="Restoran Yönetim Sistemi" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Site Dili</Label>
                  <Select defaultValue="tr">
                    <SelectTrigger>
                      <SelectValue placeholder="Dil Seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tr">Türkçe</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="de">Deutsch</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>İletişim Bilgileri</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="support-email">Destek E-postası</Label>
                        <Input id="support-email" defaultValue="destek@restopos.com" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="phone">Telefon</Label>
                        <Input id="phone" defaultValue="+90 850 123 45 67" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="address">Adres</Label>
                        <Input id="address" defaultValue="Teknoloji Vadisi, İstanbul" />
                    </div>
                </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Giriş Güvenliği</CardTitle>
                <CardDescription>Parola politikaları ve iki faktörlü doğrulama.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">İki Faktörlü Doğrulama (2FA)</Label>
                    <p className="text-sm text-muted-foreground">Yönetici girişleri için SMS/E-posta onayı zorunlu kıl.</p>
                  </div>
                  <Switch checked />
                </div>
                <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                        <Label className="text-base">Oturum Zaman Aşımı</Label>
                        <p className="text-sm text-muted-foreground">30 dakika hareketsizlikten sonra otomatik çıkış yap.</p>
                    </div>
                    <Switch checked />
                </div>
                <div className="space-y-2 pt-4 border-t">
                    <Label>Parola Değişikliği</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input type="password" placeholder="Mevcut Parola" />
                        <Input type="password" placeholder="Yeni Parola" />
                    </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
             <Card>
                <CardHeader>
                    <CardTitle>Bildirim Tercihleri</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label className="text-base">Yeni Üyelik Bildirimi</Label>
                            <p className="text-sm text-muted-foreground">Yeni bir restoran kayıt olduğunda e-posta al.</p>
                        </div>
                        <Switch checked />
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label className="text-base">Lisans Bitiş Uyarıları</Label>
                            <p className="text-sm text-muted-foreground">Lisans süresi dolan işletmeler için bildirim al.</p>
                        </div>
                        <Switch checked />
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label className="text-base">Sistem Hata Raporları</Label>
                            <p className="text-sm text-muted-foreground">Kritik hatalarda anlık bildirim gönder.</p>
                        </div>
                        <Switch />
                    </div>
                </CardContent>
             </Card>
          </TabsContent>

          <TabsContent value="payment" className="space-y-6">
             <Card>
                <CardHeader>
                    <CardTitle>Ödeme Altyapısı</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>Varsayılan Para Birimi</Label>
                        <Select defaultValue="try">
                            <SelectTrigger>
                                <SelectValue placeholder="Para Birimi" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="try">Türk Lirası (₺)</SelectItem>
                                <SelectItem value="usd">Amerikan Doları ($)</SelectItem>
                                <SelectItem value="eur">Euro (€)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Aktif Ödeme Yöntemleri</Label>
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2 border p-3 rounded-lg">
                                <Switch checked />
                                <span>Kredi Kartı (Iyzico)</span>
                            </div>
                            <div className="flex items-center gap-2 border p-3 rounded-lg">
                                <Switch />
                                <span>Stripe</span>
                            </div>
                            <div className="flex items-center gap-2 border p-3 rounded-lg">
                                <Switch checked />
                                <span>Havale / EFT</span>
                            </div>
                        </div>
                    </div>
                </CardContent>
             </Card>
          </TabsContent>

           <TabsContent value="email" className="space-y-6">
             <Card>
                <CardHeader>
                    <CardTitle>SMTP Ayarları</CardTitle>
                    <CardDescription>Sistem e-postalarının gönderimi için sunucu ayarları.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>SMTP Sunucusu</Label>
                            <Input placeholder="smtp.example.com" />
                        </div>
                        <div className="space-y-2">
                            <Label>Port</Label>
                            <Input placeholder="587" />
                        </div>
                        <div className="space-y-2">
                            <Label>Kullanıcı Adı</Label>
                            <Input placeholder="user@example.com" />
                        </div>
                        <div className="space-y-2">
                            <Label>Parola</Label>
                            <Input type="password" placeholder="••••••••" />
                        </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                        <Switch />
                        <Label>SSL/TLS Kullan</Label>
                    </div>
                </CardContent>
             </Card>
           </TabsContent>

           <TabsContent value="system" className="space-y-6">
             <Card>
                <CardHeader>
                    <CardTitle>Sistem Bakımı</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg bg-yellow-50 border-yellow-200">
                        <div>
                            <h4 className="font-medium text-yellow-900">Bakım Modu</h4>
                            <p className="text-sm text-yellow-700">Siteyi ziyaretçilere kapatır, sadece adminler erişebilir.</p>
                        </div>
                        <Switch />
                    </div>
                    
                    <div className="space-y-2 pt-4">
                        <Label>Veritabanı Yedekleme</Label>
                        <div className="flex gap-2">
                            <Button variant="outline">Yedek Al</Button>
                            <Button variant="outline">Geri Yükle</Button>
                        </div>
                    </div>
                    
                     <div className="space-y-2 pt-4">
                        <Label>Önbellek (Cache)</Label>
                        <div className="flex gap-2">
                            <Button variant="destructive">Önbelleği Temizle</Button>
                        </div>
                    </div>
                </CardContent>
             </Card>
           </TabsContent>
           
           <div className="flex justify-end gap-4 mt-8">
                <Button variant="outline">İptal</Button>
                <Button 
                    className="gap-2" 
                    onClick={() => saveSettingsMutation.mutate()}
                    disabled={saveSettingsMutation.isPending}
                >
                    <Save className="h-4 w-4" />
                    {saveSettingsMutation.isPending ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
                </Button>
           </div>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
