import React from "react";
import { Plus, Tag, Calendar, Percent } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

const campaigns = [
  { id: 1, title: "Hafta Sonu İndirimi", description: "Tüm ana yemeklerde %10 indirim", type: "Yüzde İndirim", value: "%10", status: true, dates: "Her Cumartesi - Pazar" },
  { id: 2, title: "Kahve Kampanyası", description: "Tatlı alana kahve ikram", type: "Ürün İkramı", value: "1 Kahve", status: true, dates: "Süresiz" },
  { id: 3, title: "Öğrenci Menüsü", description: "Öğrenci kimliği ile %15 indirim", type: "Özel Grup", value: "%15", status: false, dates: "Hafta İçi 12:00-14:00" },
];

export default function OnlineCampaigns() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-800">Kampanyalar</h2>
        <Button className="bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" />
          Yeni Kampanya
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {campaigns.map((campaign) => (
          <div key={campaign.id} className="bg-white rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-6 relative overflow-hidden">
            <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full opacity-10 ${campaign.status ? 'bg-green-500' : 'bg-slate-500'}`}></div>
            
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
                <Tag className="w-6 h-6" />
              </div>
              <Switch checked={campaign.status} />
            </div>

            <h3 className="text-lg font-bold text-slate-800 mb-2">{campaign.title}</h3>
            <p className="text-sm text-slate-500 mb-4 h-10">{campaign.description}</p>

            <div className="space-y-3 pt-4 border-t border-slate-100">
              <div className="flex items-center text-sm text-slate-600">
                <Percent className="w-4 h-4 mr-2 text-slate-400" />
                <span className="font-medium">{campaign.type}:</span>
                <span className="ml-2 font-bold text-indigo-600">{campaign.value}</span>
              </div>
              <div className="flex items-center text-sm text-slate-600">
                <Calendar className="w-4 h-4 mr-2 text-slate-400" />
                <span>{campaign.dates}</span>
              </div>
            </div>

            <div className="mt-6 flex gap-2">
              <Button variant="outline" className="flex-1">Düzenle</Button>
              <Button variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-50">Sil</Button>
            </div>
          </div>
        ))}
        
        {/* Add New Card */}
        <div className="bg-slate-50 rounded-lg border-2 border-dashed border-slate-300 flex flex-col items-center justify-center p-6 cursor-pointer hover:bg-slate-100 transition-colors min-h-[300px]">
          <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center mb-4 text-slate-400">
            <Plus className="w-6 h-6" />
          </div>
          <h3 className="font-semibold text-slate-600">Yeni Kampanya Oluştur</h3>
          <p className="text-sm text-slate-400 mt-2 text-center">Özel indirimler ve fırsatlar tanımlayın</p>
        </div>
      </div>
    </div>
  );
}
