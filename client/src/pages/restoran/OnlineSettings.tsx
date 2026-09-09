import React from "react";
import { Save, Lock, Globe, Bell, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export default function OnlineSettings() {
  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-800">Sistem Ayarları</h2>
        <Button className="bg-primary hover:bg-primary/90">
          <Save className="w-4 h-4 mr-2" />
          Ayarları Kaydet
        </Button>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm divide-y divide-slate-100">
        {/* General Settings */}
        <div className="p-6 space-y-6">
          <div className="flex items-center gap-3 mb-4">
            <Globe className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-medium text-slate-800">Genel Ayarlar</h3>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Dil Seçeneği</Label>
              <p className="text-sm text-slate-500">Sistem arayüz dilini belirleyin</p>
            </div>
            <select className="border border-slate-200 rounded px-2 py-1 text-sm bg-white">
              <option>Türkçe</option>
              <option>English</option>
            </select>
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Karanlık Mod</Label>
              <p className="text-sm text-slate-500">Arayüz temasını değiştirin</p>
            </div>
            <Switch />
          </div>
        </div>

        {/* Notification Settings */}
        <div className="p-6 space-y-6">
          <div className="flex items-center gap-3 mb-4">
            <Bell className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-medium text-slate-800">Bildirimler</h3>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Yeni Sipariş Bildirimi</Label>
              <p className="text-sm text-slate-500">Yeni sipariş geldiğinde sesli uyarı ver</p>
            </div>
            <Switch defaultChecked />
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">E-posta Bildirimleri</Label>
              <p className="text-sm text-slate-500">Gün sonu raporlarını e-posta ile gönder</p>
            </div>
            <Switch defaultChecked />
          </div>
        </div>

        {/* Printer Settings */}
        <div className="p-6 space-y-6">
          <div className="flex items-center gap-3 mb-4">
            <Printer className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-medium text-slate-800">Yazıcı Ayarları</h3>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Otomatik Yazdırma</Label>
              <p className="text-sm text-slate-500">Sipariş onaylandığında otomatik fiş yazdır</p>
            </div>
            <Switch defaultChecked />
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Mutfak Yazıcısı</Label>
              <p className="text-sm text-slate-500">Mutfak siparişlerini ayrı yazıcıya gönder</p>
            </div>
            <select className="border border-slate-200 rounded px-2 py-1 text-sm bg-white w-48">
              <option>Varsayılan Yazıcı</option>
              <option>POS-80 (Mutfak)</option>
              <option>POS-58 (Bar)</option>
            </select>
          </div>
        </div>

        {/* Security Settings */}
        <div className="p-6 space-y-6">
          <div className="flex items-center gap-3 mb-4">
            <Lock className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-medium text-slate-800">Güvenlik</h3>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">İki Adımlı Doğrulama</Label>
              <p className="text-sm text-slate-500">Giriş güvenliğini artırın</p>
            </div>
            <Switch />
          </div>
          
          <div className="mt-4">
            <Button variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200">
              Tüm Oturumlardan Çıkış Yap
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
