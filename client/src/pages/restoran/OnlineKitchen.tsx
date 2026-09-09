import React from "react";
import { Clock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const preparingOrders = [
  { id: "1024", table: "Masa 5", items: ["Izgara Köfte", "Ayran"], time: "14:30" },
  { id: "1025", table: "Masa 2", items: ["Mercimek Çorbası", "Mevsim Salatası"], time: "14:32" },
  { id: "1027", table: "Paket Servis", items: ["Adana Kebap (1.5)", "Şalgam"], time: "14:35" },
];

const readyOrders = [
  { id: "1022", table: "Masa 8", items: ["Künefe", "Çay"], time: "14:15" },
  { id: "1023", table: "Masa 1", items: ["Türk Kahvesi"], time: "14:20" },
];

export default function OnlineKitchen() {
  return (
    <div className="h-full flex flex-col space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-800">Mutfak Ekranı</h2>
        <div className="flex gap-2">
           <span className="flex items-center gap-2 text-sm text-slate-500">
             <span className="w-2 h-2 rounded-full bg-green-500"></span>
             Online
           </span>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-hidden">
        {/* Preparing Column */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-full">
          <div className="p-4 border-b border-slate-200 bg-orange-50 flex items-center justify-between">
            <h3 className="font-bold text-orange-700 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Hazırlanıyor
            </h3>
            <span className="px-2 py-1 bg-white text-orange-700 text-xs font-bold rounded-full border border-orange-200">
              {preparingOrders.length}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
            {preparingOrders.map((order) => (
              <div key={order.id} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="text-xs font-bold text-slate-500 block mb-1">#{order.id}</span>
                    <h4 className="font-bold text-lg text-slate-800">{order.table}</h4>
                  </div>
                  <span className="text-sm font-medium text-slate-400 bg-slate-100 px-2 py-1 rounded">
                    {order.time}
                  </span>
                </div>
                <div className="space-y-2 mb-4">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="text-sm text-slate-700 py-1 border-b border-dashed border-slate-100 last:border-0">
                      1x {item}
                    </div>
                  ))}
                </div>
                <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Hazır Olarak İşaretle
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Ready Column */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-full">
          <div className="p-4 border-b border-slate-200 bg-green-50 flex items-center justify-between">
            <h3 className="font-bold text-green-700 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              Hazır / Servis Bekliyor
            </h3>
            <span className="px-2 py-1 bg-white text-green-700 text-xs font-bold rounded-full border border-green-200">
              {readyOrders.length}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
            {readyOrders.map((order) => (
              <div key={order.id} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm opacity-75 hover:opacity-100 transition-opacity">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="text-xs font-bold text-slate-500 block mb-1">#{order.id}</span>
                    <h4 className="font-bold text-lg text-slate-800">{order.table}</h4>
                  </div>
                  <span className="text-sm font-medium text-slate-400 bg-slate-100 px-2 py-1 rounded">
                    {order.time}
                  </span>
                </div>
                <div className="space-y-2 mb-4">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="text-sm text-slate-700 py-1 border-b border-dashed border-slate-100 last:border-0 line-through text-slate-400">
                      1x {item}
                    </div>
                  ))}
                </div>
                <Button variant="outline" className="w-full text-slate-500 hover:text-slate-700">
                  Teslim Edildi
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
