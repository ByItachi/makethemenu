import React from "react";
import { Button } from "@/components/ui/button";
import { Plus, Search, Edit2, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function DiscountsPage() {
  const discounts = [
    { id: 1, name: "Personel İndirimi", type: "Oran", value: "%50", active: true },
    { id: 2, name: "Öğrenci İndirimi", type: "Oran", value: "%10", active: true },
    { id: 3, name: "VIP Müşteri", type: "Oran", value: "%20", active: true },
    { id: 4, name: "İkram", type: "Tutar", value: "Tamamı", active: true },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">İndirimler</h2>
          <p className="text-slate-500">İndirim türleri ve oran tanımlamaları</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" />
          Yeni İndirim Ekle
        </Button>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
        <div className="p-4 border-b border-slate-200 flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input placeholder="İndirim ara..." className="pl-9" />
          </div>
        </div>

        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3 font-medium">İndirim Adı</th>
              <th className="px-6 py-3 font-medium">Tür</th>
              <th className="px-6 py-3 font-medium">Değer</th>
              <th className="px-6 py-3 font-medium">Durum</th>
              <th className="px-6 py-3 font-medium text-right">İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {discounts.map((discount) => (
              <tr key={discount.id} className="bg-white border-b border-slate-100 hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-medium text-slate-900">{discount.name}</td>
                <td className="px-6 py-4 text-slate-600">{discount.type}</td>
                <td className="px-6 py-4 text-slate-600 font-bold">{discount.value}</td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    discount.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {discount.active ? 'Aktif' : 'Pasif'}
                  </span>
                </td>
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
