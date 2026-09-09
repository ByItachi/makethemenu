import React from "react";
import { Search, UserPlus, Mail, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const customersData = [
  { id: 1, name: "Ahmet Yılmaz", phone: "0532 123 45 67", email: "ahmet@mail.com", lastVisit: "14.02.2024", totalSpent: "₺1,250.00", points: 120 },
  { id: 2, name: "Ayşe Demir", phone: "0533 987 65 43", email: "ayse@mail.com", lastVisit: "10.02.2024", totalSpent: "₺3,450.00", points: 340 },
  { id: 3, name: "Mehmet Kaya", phone: "0555 111 22 33", email: "mehmet@mail.com", lastVisit: "05.02.2024", totalSpent: "₺850.00", points: 85 },
  { id: 4, name: "Zeynep Çelik", phone: "0542 444 55 66", email: "zeynep@mail.com", lastVisit: "01.02.2024", totalSpent: "₺2,100.00", points: 210 },
  { id: 5, name: "Ali Vural", phone: "0536 777 88 99", email: "ali@mail.com", lastVisit: "12.01.2024", totalSpent: "₺450.00", points: 45 },
];

export default function OnlineCustomers() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-800">Müşteri Yönetimi</h2>
        <Button className="bg-primary hover:bg-primary/90">
          <UserPlus className="w-4 h-4 mr-2" />
          Yeni Müşteri Ekle
        </Button>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input className="pl-9 bg-white" placeholder="Müşteri adı, telefon veya e-posta ara..." />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 font-medium">Müşteri</th>
                <th className="px-6 py-3 font-medium">İletişim</th>
                <th className="px-6 py-3 font-medium">Son Ziyaret</th>
                <th className="px-6 py-3 font-medium text-right">Toplam Harcama</th>
                <th className="px-6 py-3 font-medium text-right">Puan</th>
                <th className="px-6 py-3 font-medium text-center">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {customersData.map((customer) => (
                <tr key={customer.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs">
                        {customer.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <span className="font-medium text-slate-900">{customer.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    <div className="flex flex-col text-xs">
                      <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {customer.phone}</span>
                      <span className="flex items-center gap-1 text-slate-400"><Mail className="w-3 h-3" /> {customer.email}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600">{customer.lastVisit}</td>
                  <td className="px-6 py-4 text-right font-medium text-slate-800">{customer.totalSpent}</td>
                  <td className="px-6 py-4 text-right">
                    <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-bold">
                      {customer.points} P
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <Button variant="ghost" size="sm" className="h-8 text-blue-600 hover:text-blue-700">Detay</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
