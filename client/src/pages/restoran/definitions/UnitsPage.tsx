import React from "react";
import { Button } from "@/components/ui/button";
import { Plus, Search, Edit2, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function UnitsPage() {
  const units = [
    { id: 1, name: "Porsiyon", code: "PORS", main: true },
    { id: 2, name: "Adet", code: "ADET", main: false },
    { id: 3, name: "Kilogram", code: "KG", main: false },
    { id: 4, name: "Litre", code: "LT", main: false },
    { id: 5, name: "Kadeh", code: "KDH", main: false },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Birimler</h2>
          <p className="text-slate-500">Ürün satış birimlerinin tanımlanması (Porsiyon, Adet, Kg vb.)</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" />
          Yeni Birim Ekle
        </Button>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
        <div className="p-4 border-b border-slate-200 flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input placeholder="Birim ara..." className="pl-9" />
          </div>
        </div>

        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3 font-medium">Birim Adı</th>
              <th className="px-6 py-3 font-medium">Kısaltma (Kod)</th>
              <th className="px-6 py-3 font-medium">Varsayılan</th>
              <th className="px-6 py-3 font-medium text-right">İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {units.map((unit) => (
              <tr key={unit.id} className="bg-white border-b border-slate-100 hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-medium text-slate-900">{unit.name}</td>
                <td className="px-6 py-4 text-slate-600 font-mono text-xs bg-slate-100 w-fit px-2 py-1 rounded inline-block mt-2">{unit.code}</td>
                <td className="px-6 py-4">
                  {unit.main && (
                    <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-bold">Ana Birim</span>
                  )}
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
