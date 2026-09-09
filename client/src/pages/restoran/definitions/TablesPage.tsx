import React from "react";
import { Button } from "@/components/ui/button";
import { Plus, Search, MoreHorizontal, Edit2, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function TablesPage() {
  const tables = [
    { id: 1, name: "Masa 1", region: "Bahçe", capacity: 4, status: "Boş" },
    { id: 2, name: "Masa 2", region: "Bahçe", capacity: 4, status: "Dolu" },
    { id: 3, name: "Masa 3", region: "Salon", capacity: 2, status: "Boş" },
    { id: 4, name: "Masa 4", region: "Salon", capacity: 6, status: "Rezerve" },
    { id: 5, name: "Masa 5", region: "Teras", capacity: 4, status: "Boş" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Masa / Bölgeler</h2>
          <p className="text-slate-500">Restoran masa düzeni ve bölge tanımlamaları</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" />
          Yeni Masa Ekle
        </Button>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
        <div className="p-4 border-b border-slate-200 flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input placeholder="Masa ara..." className="pl-9" />
          </div>
          <div className="flex gap-2">
            <Button variant="outline">Filtrele</Button>
            <Button variant="outline">Dışa Aktar</Button>
          </div>
        </div>

        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3 font-medium">Masa Adı</th>
              <th className="px-6 py-3 font-medium">Bölge</th>
              <th className="px-6 py-3 font-medium">Kapasite</th>
              <th className="px-6 py-3 font-medium">Durum</th>
              <th className="px-6 py-3 font-medium text-right">İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {tables.map((table) => (
              <tr key={table.id} className="bg-white border-b border-slate-100 hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-medium text-slate-900">{table.name}</td>
                <td className="px-6 py-4 text-slate-600">{table.region}</td>
                <td className="px-6 py-4 text-slate-600">{table.capacity} Kişilik</td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    table.status === 'Boş' ? 'bg-green-100 text-green-700' :
                    table.status === 'Dolu' ? 'bg-red-100 text-red-700' :
                    'bg-orange-100 text-orange-700'
                  }`}>
                    {table.status}
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
