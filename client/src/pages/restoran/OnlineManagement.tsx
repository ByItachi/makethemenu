import React from "react";
import { Building2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function OnlineManagement() {
  return (
    <div className="max-w-4xl space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-800">Restoran Yönetimi</h2>
        <Button className="bg-primary hover:bg-primary/90">
          <Save className="w-4 h-4 mr-2" />
          Değişiklikleri Kaydet
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column - General Info */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
            <h3 className="text-lg font-medium text-slate-800 mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-slate-400" />
              İşletme Bilgileri
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">İşletme Adı</Label>
                <Input id="name" defaultValue="makethemenu Restoranı" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefon</Label>
                <Input id="phone" defaultValue="+90 (555) 123-4567" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address">Adres</Label>
                <Textarea id="address" defaultValue="Örnek Mah. Lezzet Cad. No:123, İstanbul" rows={3} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-posta</Label>
                <Input id="email" defaultValue="info@restopos.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="web">Web Sitesi</Label>
                <Input id="web" defaultValue="www.restopos.com" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
            <h3 className="text-lg font-medium text-slate-800 mb-4">Çalışma Saatleri</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 items-center">
                <span className="font-medium text-slate-600">Hafta İçi</span>
                <Input defaultValue="09:00" className="text-center" />
                <Input defaultValue="23:00" className="text-center" />
              </div>
              <div className="grid grid-cols-3 gap-4 items-center">
                <span className="font-medium text-slate-600">Hafta Sonu</span>
                <Input defaultValue="10:00" className="text-center" />
                <Input defaultValue="00:00" className="text-center" />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Logo & Branding */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
            <h3 className="text-lg font-medium text-slate-800 mb-4">Logo</h3>
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-lg p-8 mb-4 hover:bg-slate-50 transition-colors cursor-pointer">
              <div className="w-24 h-24 bg-primary rounded-xl flex items-center justify-center text-white text-4xl font-bold mb-4">R</div>
              <p className="text-sm text-slate-500 text-center">Değiştirmek için tıklayın veya sürükleyin</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
            <h3 className="text-lg font-medium text-slate-800 mb-4">Sosyal Medya</h3>
            <div className="space-y-3">
              <Input placeholder="Instagram Linki" />
              <Input placeholder="Facebook Linki" />
              <Input placeholder="Twitter Linki" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
