import React, { useState } from "react";
import { Home, QrCode, Settings, ChevronLeft } from "lucide-react";

// Bu alt sayfaları daha sonra oluşturacağız
const DigitalMenuHome = () => (
  <div>
    <h2 className="text-2xl font-bold mb-4">Bilgilendirme ve Kurulum</h2>
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <p className="text-slate-600">
        Adisyo kullanıcıları işletmelerine ait menülerini dijital olarak da oluşturabilirler. Siz de aşağıdaki talimatlara uyarak işletmenize ait dijital menünüzü oluşturmaya başlayın.
      </p>
      {/* Görseldeki gibi adımları buraya ekleyeceğiz */}
    </div>
  </div>
);

const TableQrCodes = () => (
  <div>
    <h2 className="text-2xl font-bold mb-4">Masa Karekod İşlemleri</h2>
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
      {/* Örnek bölge kartları */}
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="bg-white p-4 rounded-lg shadow-sm border text-center">
          <p className="font-semibold">Bölge/{i + 1}</p>
          <p className="text-sm text-slate-500 mb-3">{Math.floor(Math.random() * 20)} adet masa</p>
          <button className="w-full bg-red-600 text-white py-2 rounded-md hover:bg-red-700">
            İndir
          </button>
        </div>
      ))}
    </div>
  </div>
);

const DigitalMenuSettings = () => (
  <div>
    <h2 className="text-2xl font-bold mb-4">Dijital Menü Ayarları</h2>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="font-semibold mb-4">Parametreler</h3>
        {/* Ayar seçenekleri buraya gelecek */}
      </div>
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="font-semibold mb-4">Logo</h3>
        {/* Logo yükleme alanı buraya gelecek */}
      </div>
    </div>
  </div>
);

const SidebarItem = ({ icon, text, active, onClick }: any) => (
  <div
    onClick={onClick}
    className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
      active
        ? "bg-slate-100 text-primary border-r-4 border-primary dark:bg-slate-800"
        : "text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700"
    }`}
  >
    {icon}
    <span className="font-medium text-sm">{text}</span>
  </div>
);

export default function DigitalMenuLayout() {
  const [activePage, setActivePage] = useState("home");

  const renderContent = () => {
    switch (activePage) {
      case "home":
        return <DigitalMenuHome />;
      case "tables":
        return <TableQrCodes />;
      case "settings":
        return <DigitalMenuSettings />;
      default:
        return <DigitalMenuHome />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900">
      <div className="w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2">
          <button className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700">
            <ChevronLeft className="w-5 h-5 text-slate-500" />
          </button>
          <h2 className="font-bold text-lg text-slate-800 dark:text-slate-100">Dijital Menü</h2>
        </div>
        <nav className="flex-1 py-2">
          <SidebarItem
            icon={<Home className="w-5 h-5" />}
            text="Giriş"
            active={activePage === "home"}
            onClick={() => setActivePage("home")}
          />
          <SidebarItem
            icon={<QrCode className="w-5 h-5" />}
            text="Masa Karekod İşlemleri"
            active={activePage === "tables"}
            onClick={() => setActivePage("tables")}
          />
          <SidebarItem
            icon={<Settings className="w-5 h-5" />}
            text="Ayarlar"
            active={activePage === "settings"}
            onClick={() => setActivePage("settings")}
          />
        </nav>
      </div>
      <main className="flex-1 p-8 overflow-auto">
        {renderContent()}
      </main>
    </div>
  );
}
