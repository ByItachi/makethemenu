import React from "react";
import { Plus, LayoutGrid, Utensils, Scale, List, Percent, Tags, ChefHat, Gift, Coins } from "lucide-react";
import { useLocation } from "wouter";

export default function OnlineDefinitions() {
  const [, setLocation] = useLocation();

  const definitions = [
    {
      title: "Masa / Bölgeler",
      description: "Restoran oturma planı, masa numaraları ve bölgeleri yapılandırın.",
      icon: LayoutGrid,
      color: "blue",
      route: "/restoran/definitions/tables",
      stat: "12 Masa Tanımlı"
    },
    {
      title: "Menü / Ürünler",
      description: "Ürün listesi, fiyatlar ve kategori yönetimi.",
      icon: Utensils,
      color: "orange",
      route: "/restoran/definitions/products",
      stat: "45 Ürün Aktif"
    },
    {
      title: "Birimler",
      description: "Ürün satış birimlerinin tanımlanması (Porsiyon, Adet, Kg).",
      icon: Scale,
      color: "green",
      route: "/restoran/definitions/units",
      stat: "5 Birim"
    },
    {
      title: "Özellikler",
      description: "Ürün seçenekleri ve varyasyon tanımları (Acılı, Az Pişmiş vb.).",
      icon: List,
      color: "purple",
      route: "/restoran/definitions/properties",
      stat: "8 Özellik"
    },
    {
      title: "KDV Oranları",
      description: "Vergi oranları ve tanımlamaları.",
      icon: Percent,
      color: "red",
      route: "/restoran/definitions/vat",
      stat: "4 Oran"
    },
    {
      title: "İndirimler",
      description: "İndirim türleri ve oran tanımlamaları.",
      icon: Tags,
      color: "indigo",
      route: "/restoran/definitions/discounts",
      stat: "4 İndirim Tipi"
    },
    {
      title: "Mutfak Grupları",
      description: "Ürünlerin hazırlanacağı mutfak bölümleri ve yazıcılar.",
      icon: ChefHat,
      color: "yellow",
      route: "/restoran/definitions/kitchen-groups",
      stat: "4 Grup"
    },
    {
      title: "Ödenmezler",
      description: "Bedelsiz ürün çıkışı ve ikram nedenleri.",
      icon: Gift,
      color: "pink",
      route: "/restoran/definitions/complimentary",
      stat: "4 Sebep"
    },
    {
      title: "Kuver / Garsoniye",
      description: "Otomatik veya manuel eklenen hizmet bedelleri.",
      icon: Coins,
      color: "cyan",
      route: "/restoran/definitions/service-charge",
      stat: "3 Hizmet"
    }
  ];

  const getColorClasses = (color: string) => {
    const colors: Record<string, string> = {
      blue: "bg-blue-100 text-blue-600",
      orange: "bg-orange-100 text-orange-600",
      green: "bg-green-100 text-green-600",
      purple: "bg-purple-100 text-purple-600",
      red: "bg-red-100 text-red-600",
      indigo: "bg-indigo-100 text-indigo-600",
      yellow: "bg-yellow-100 text-yellow-600",
      pink: "bg-pink-100 text-pink-600",
      cyan: "bg-cyan-100 text-cyan-600",
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {definitions.map((def, index) => (
        <div 
          key={index}
          onClick={() => setLocation(def.route)}
          className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
        >
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${getColorClasses(def.color)}`}>
            <def.icon className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">{def.title}</h3>
          <p className="text-sm text-slate-500 mb-4 h-10">
            {def.description}
          </p>
          <div className="flex items-center text-xs font-medium text-slate-400">
            <span>{def.stat}</span>
          </div>
        </div>
      ))}

       {/* Add New Definition */}
       <div className="bg-slate-50 rounded-lg border-2 border-dashed border-slate-300 flex flex-col items-center justify-center p-6 cursor-pointer hover:bg-slate-100 transition-colors">
          <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center mb-4 text-slate-400">
            <Plus className="w-6 h-6" />
          </div>
          <h3 className="font-semibold text-slate-600">Yeni Tanım Ekle</h3>
        </div>
    </div>
  );
}
