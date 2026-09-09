import React from "react";
import { Button } from "@/components/ui/button";
import { Plus, Search, Edit2, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function ComplimentaryPage() {
  const items = [
    { id: 1, name: "Patron İkramı", limit: "Limitsiz", dailyUsage: 2 },
    { id: 2, name: "Personel Yemeği", limit: "Günlük 1 Adet", dailyUsage: 15 },
    { id: 3, name: "Zayi / Bozuk", limit: "Limitsiz", dailyUsage: 1 },
    { id: 4, name: "Müşteri Memnuniyeti", limit: "Yönetici Onaylı", dailyUsage: 0 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Ödenmezler</h2>
          <p className="text-slate-500">Bedelsiz ürün çıkışı ve ikram nedenleri</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" />
          Yeni Ödenmez Ekle
        </Button>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
        <div className="p-4 border-b border-slate-200 flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input placeholder="Sebep ara..." className="pl-9" />
          </div>
        </div>

        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3 font-medium">Ödenmez Adı</th>
              <th className="px-6 py-3 font-medium">Limit / Kural</th>
              <th className="px-6 py-3 font-medium">Günlük Kullanım</th>
              <th className="px-6 py-3 font-medium text-right">İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="bg-white border-b border-slate-100 hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-medium text-slate-900">{item.name}</td>
                <td className="px-6 py-4 text-slate-600">{item.limit}</td>
                <td className="px-6 py-4 text-slate-600">{item.dailyUsage} Kez</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-blue-600">
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
