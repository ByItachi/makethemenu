import React from "react";
import { Button } from "@/components/ui/button";
import { Plus, Search, Edit2, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function ProductsPage() {
  const products = [
    { id: 1, name: "Mercimek Çorbası", category: "Çorbalar", price: "90.00 ₺", stock: true },
    { id: 2, name: "Izgara Köfte", category: "Ana Yemekler", price: "240.00 ₺", stock: true },
    { id: 3, name: "Mevsim Salata", category: "Salatalar", price: "120.00 ₺", stock: true },
    { id: 4, name: "Kola", category: "İçecekler", price: "40.00 ₺", stock: true },
    { id: 5, name: "Sütlaç", category: "Tatlılar", price: "90.00 ₺", stock: false },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Menü / Ürünler</h2>
          <p className="text-slate-500">Ürün listesi, fiyatlar ve kategori yönetimi</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" />
          Yeni Ürün Ekle
        </Button>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
        <div className="p-4 border-b border-slate-200 flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input placeholder="Ürün ara..." className="pl-9" />
          </div>
          <div className="flex gap-2">
             <Button variant="outline">Kategori Seç</Button>
          </div>
        </div>

        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3 font-medium">Ürün Adı</th>
              <th className="px-6 py-3 font-medium">Kategori</th>
              <th className="px-6 py-3 font-medium">Fiyat</th>
              <th className="px-6 py-3 font-medium">Stok Durumu</th>
              <th className="px-6 py-3 font-medium text-right">İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} className="bg-white border-b border-slate-100 hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-medium text-slate-900">{product.name}</td>
                <td className="px-6 py-4 text-slate-600">{product.category}</td>
                <td className="px-6 py-4 font-bold text-slate-800">{product.price}</td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    product.stock ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {product.stock ? 'Stokta Var' : 'Tükendi'}
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
