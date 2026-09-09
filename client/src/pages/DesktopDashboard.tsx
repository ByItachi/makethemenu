import React, { useState, useEffect } from "react";
import { 
  Calculator, 
  LayoutGrid, 
  Receipt, 
  CreditCard, 
  Clock, 
  Package, 
  ShoppingBag, 
  BarChart3, 
  Settings, 
  LogOut, 
  Monitor,
  CheckCircle2,
  AlertTriangle
} from "lucide-react";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

// Interface for dashboard tiles
interface DashboardTile {
  title: string;
  icon: React.ElementType;
  color: string;
  path: string;
}
import { OldLogo } from "@/components/OldLogo";

const DesktopDashboard = () => {
  const [, setLocation] = useLocation();
  const [licenseStatus, setLicenseStatus] = useState<'checking' | 'valid' | 'invalid'>('checking');
  const [showLicenseModal, setShowLicenseModal] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Check license on mount
  useEffect(() => {
    checkLicense();
  }, []);

  const checkLicense = async () => {
    try {
      // In a real electron app, this might use window.electron.checkLicense()
      // For now, we hit our local python API
      const response = await fetch('/api/license-check');
      if (response.ok) {
        const data = await response.json();
        if (data.status === 'valid') {
          setLicenseStatus('valid');
        } else {
          setLicenseStatus('invalid');
          setShowLicenseModal(true);
        }
      } else {
        // Fallback for demo if API isn't ready
        setLicenseStatus('valid'); 
      }
    } catch (error) {
      console.error("License check failed", error);
      // Assume valid for demo purposes if offline/error, or show error
      setLicenseStatus('invalid');
      setShowLicenseModal(true);
    }
  };

  const tiles: DashboardTile[] = [
    { title: "Gün İşlemleri", icon: Calculator, color: "bg-primary", path: "/restoran/operations" },
    { title: "POS", icon: Monitor, color: "bg-primary", path: "/restoran/sales" },
    { title: "Adisyonlar", icon: Receipt, color: "bg-primary", path: "/restoran/sales" },
    { title: "Hesaplar", icon: CreditCard, color: "bg-primary", path: "/restoran/reports/sales" },
    { title: "TimeClock", icon: Clock, color: "bg-primary", path: "/restoran/settings/restaurant" },
    { title: "Depolar", icon: Package, color: "bg-primary", path: "/restoran/operations/stock" },
    { title: "Uygulama Mağazası", icon: ShoppingBag, color: "bg-primary", path: "/restoran/app-store" },
    { title: "Raporlar", icon: BarChart3, color: "bg-primary", path: "/restoran/reports" },
    { title: "Yönetim", icon: Settings, color: "bg-primary", path: "/restoran/management" },
    { title: "Çıkış", icon: LogOut, color: "bg-red-600", path: "/logout" },
  ];

  const handleTileClick = (path: string) => {
    if (path === "/logout") {
      // Handle logout logic
      setLocation("/giris");
    } else {
      setLocation(path);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Bar */}
      <header className="bg-white border-b border-slate-200 px-3 sm:px-6 py-3 flex flex-wrap justify-between items-center gap-y-2 gap-x-4 shadow-sm">
        <div className="flex items-center gap-2 sm:gap-4">
          <OldLogo />
          <h1 className="text-lg sm:text-xl font-bold text-slate-800">Resto<span className="text-primary">POS</span></h1>
          <span className="px-3 py-1 bg-red-100 text-red-600 text-xs font-semibold rounded-full">
            DEMO Sürümü
          </span>
        </div>
        <div className="flex items-center gap-4 sm:gap-6 text-sm text-slate-600">
          <div className="hidden sm:flex flex-col items-end">
             <span className="font-medium">{currentTime.toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
             <span>{currentTime.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <span className="sm:hidden font-medium">{currentTime.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
          <div className="flex items-center gap-2">
            {licenseStatus === 'valid' ? (
              <span className="flex items-center gap-1 text-green-600">
                <CheckCircle2 size={16} /> Lisanslı
              </span>
            ) : (
               <span className="flex items-center gap-1 text-red-600 cursor-pointer" onClick={() => setShowLicenseModal(true)}>
                <AlertTriangle size={16} /> Lisanssız
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Main Content - Grid */}
      <main className="flex-1 p-6 overflow-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 h-full max-h-[800px] content-start">
          {tiles.map((tile, index) => (
            <Card 
              key={index}
              onClick={() => handleTileClick(tile.path)}
              className={`${tile.color} hover:brightness-110 transition-all cursor-pointer border-none shadow-md text-white flex flex-col items-center justify-center p-6 h-40 group relative overflow-hidden`}
            >
              {/* Tile Content */}
              <tile.icon className="w-12 h-12 mb-3 opacity-90 group-hover:scale-110 transition-transform duration-300" />
              <span className="text-lg font-semibold tracking-wide">{tile.title}</span>
              
              {/* Decorative background circle */}
              <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-white opacity-10 rounded-full pointer-events-none" />
            </Card>
          ))}
        </div>
      </main>

      {/* Bottom Bar */}
      <footer className="bg-white border-t border-slate-200 px-3 sm:px-6 py-2 flex flex-wrap justify-between items-center gap-2 text-xs text-slate-500">
        <div className="flex gap-4">
          <Button variant="ghost" size="sm" className="h-6 text-xs">Klavye</Button>
        </div>
        <div className="font-bold text-red-500 tracking-wider text-center order-first w-full sm:order-none sm:w-auto">
          GÜN SONU YAPMAYI UNUTMAYINIZ!
        </div>
        <div className="flex gap-4">
          <span className="hidden sm:inline">Administrator</span>
          <Button variant="ghost" size="sm" className="h-6 text-xs">Ana Menü</Button>
        </div>
      </footer>

      {/* License Modal */}
      <Dialog open={showLicenseModal} onOpenChange={setShowLicenseModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lisans Doğrulaması</DialogTitle>
            <DialogDescription>
              Uygulamanın bu kopyası lisanslanmamış veya doğrulama başarısız oldu.
              Lütfen internet bağlantınızı kontrol edin veya yönetim paneli ile iletişime geçin.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="p-4 bg-slate-100 rounded-md text-sm font-mono">
              Durum: {licenseStatus === 'checking' ? 'Kontrol ediliyor...' : 'Doğrulanamadı'}
              <br />
              Sunucu: Connected (SQL Server Mock)
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowLicenseModal(false)}>Kapat</Button>
            <Button onClick={checkLicense}>Tekrar Dene</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DesktopDashboard;
