import React from "react";
import { Search, Filter, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const salesData = [
  { id: "ADS-1024", date: "14.02.2024 14:30", amount: "₺450.00", payment: "Kredi Kartı", status: "Tamamlandı" },
  { id: "ADS-1023", date: "14.02.2024 14:15", amount: "₺120.00", payment: "Nakit", status: "Tamamlandı" },
  { id: "ADS-1022", date: "14.02.2024 13:45", amount: "₺850.50", payment: "Kredi Kartı", status: "Tamamlandı" },
  { id: "ADS-1021", date: "14.02.2024 13:30", amount: "₺320.00", payment: "Yemek Çeki", status: "Tamamlandı" },
  { id: "ADS-1020", date: "14.02.2024 13:10", amount: "₺65.00", payment: "Nakit", status: "İptal" },
];

export default function OnlineSales() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-800">Satış Raporları</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Filtrele
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Dışa Aktar
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input className="pl-9 bg-white" placeholder="Adisyon no veya tutar ara..." />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 font-medium">Adisyon No</th>
                <th className="px-6 py-3 font-medium">Tarih</th>
                <th className="px-6 py-3 font-medium">Ödeme Tipi</th>
                <th className="px-6 py-3 font-medium">Durum</th>
                <th className="px-6 py-3 font-medium text-right">Tutar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {salesData.map((sale) => (
                <tr key={sale.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-900">{sale.id}</td>
                  <td className="px-6 py-4 text-slate-600">{sale.date}</td>
                  <td className="px-6 py-4 text-slate-600">{sale.payment}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      sale.status === 'Tamamlandı' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {sale.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-slate-800">{sale.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="p-4 border-t border-slate-200 bg-slate-50 text-xs text-slate-500 flex justify-between items-center">
          <span>Toplam 5 kayıt gösteriliyor</span>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" disabled>Önceki</Button>
            <Button variant="outline" size="sm" disabled>Sonraki</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
