import React from "react";
import { Button } from "@/components/ui/button";
import { Plus, Search, Edit2, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function PropertiesPage() {
  const properties = [
    { id: 1, name: "Acılı", group: "Tat", priceDiff: "0.00 ₺" },
    { id: 2, name: "Acısız", group: "Tat", priceDiff: "0.00 ₺" },
    { id: 3, name: "Az Pişmiş", group: "Pişirme", priceDiff: "0.00 ₺" },
    { id: 4, name: "Orta Pişmiş", group: "Pişirme", priceDiff: "0.00 ₺" },
    { id: 5, name: "İyi Pişmiş", group: "Pişirme", priceDiff: "0.00 ₺" },
    { id: 6, name: "Ekstra Peynir", group: "Ekstra", priceDiff: "25.00 ₺" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Özellikler</h2>
          <p className="text-slate-500">Ürün seçenekleri ve varyasyon tanımları (Acılı, Az Pişmiş vb.)</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" />
          Yeni Özellik Ekle
        </Button>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
        <div className="p-4 border-b border-slate-200 flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input placeholder="Özellik ara..." className="pl-9" />
          </div>
          <div className="flex gap-2">
            <Button variant="outline">Grup Filtrele</Button>
          </div>
        </div>

        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3 font-medium">Özellik Adı</th>
              <th className="px-6 py-3 font-medium">Grup</th>
              <th className="px-6 py-3 font-medium">Fiyat Farkı</th>
              <th className="px-6 py-3 font-medium text-right">İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {properties.map((prop) => (
              <tr key={prop.id} className="bg-white border-b border-slate-100 hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-medium text-slate-900">{prop.name}</td>
                <td className="px-6 py-4 text-slate-600">
                  <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs">{prop.group}</span>
                </td>
                <td className="px-6 py-4 text-slate-600">{prop.priceDiff}</td>
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
