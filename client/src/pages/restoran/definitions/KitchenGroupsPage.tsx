import React from "react";
import { Button } from "@/components/ui/button";
import { Plus, Search, Edit2, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function KitchenGroupsPage() {
  const groups = [
    { id: 1, name: "Sıcak Mutfak", printer: "Yazıcı 1 (Mutfak)", products: 45 },
    { id: 2, name: "Soğuk Mutfak", printer: "Yazıcı 1 (Mutfak)", products: 28 },
    { id: 3, name: "Bar / İçecek", printer: "Yazıcı 2 (Bar)", products: 32 },
    { id: 4, name: "Izgara", printer: "Yazıcı 3 (Ocakbaşı)", products: 12 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Mutfak Grupları</h2>
          <p className="text-slate-500">Ürünlerin hazırlanacağı mutfak bölümleri ve yazıcı eşleştirmeleri</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" />
          Yeni Grup Ekle
        </Button>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
        <div className="p-4 border-b border-slate-200 flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input placeholder="Grup ara..." className="pl-9" />
          </div>
        </div>

        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3 font-medium">Grup Adı</th>
              <th className="px-6 py-3 font-medium">Hedef Yazıcı</th>
              <th className="px-6 py-3 font-medium">Ürün Sayısı</th>
              <th className="px-6 py-3 font-medium text-right">İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {groups.map((group) => (
              <tr key={group.id} className="bg-white border-b border-slate-100 hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-medium text-slate-900">{group.name}</td>
                <td className="px-6 py-4 text-slate-600">{group.printer}</td>
                <td className="px-6 py-4 text-slate-600">{group.products} Ürün</td>
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
