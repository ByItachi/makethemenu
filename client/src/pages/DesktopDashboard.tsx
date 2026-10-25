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
  Keyboard,
  User,
  CheckCircle2,
  AlertTriangle
} from "lucide-react";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

// Interface for dashboard tiles
interface DashboardTile {
  title: string;
  icon: React.ElementType;
  color: string;
  path: string;
}

// Alt bardaki Klavye butonunun açtığı POS fonksiyon tuşları
const keyboardShortcuts: { key: string; label: string }[] = [
  { key: "F1", label: "Yardım" },
  { key: "F2", label: "Hızlı Ürün Ara" },
  { key: "F3", label: "Masa Planı" },
  { key: "F4", label: "Adisyon Birleştir" },
  { key: "F5", label: "Gün Sonu" },
  { key: "F6", label: "İndirim Uygula" },
  { key: "F7", label: "İade İşlemi" },
  { key: "F8", label: "Fiş Yazdır" },
  { key: "F9", label: "Kasa Çekişi" },
  { key: "F10", label: "Yeni Sipariş" },
  { key: "F11", label: "Tam Ekran" },
  { key: "F12", label: "Çıkış" },
];

const DesktopDashboard = () => {
  const [, setLocation] = useLocation();
  const [licenseStatus, setLicenseStatus] = useState<'checking' | 'valid' | 'invalid'>('checking');
  const [showLicenseModal, setShowLicenseModal] = useState(false);
  const [showKeyboardDialog, setShowKeyboardDialog] = useState(false);
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
      // Masaüstü uygulama simülasyonu: yerel API lisans durumunu döner.
      const response = await fetch('/api/license-check');
      if (response.ok) {
        const data = await response.json().catch(() => null);
        if (data?.status === 'valid') {
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
      // Demo modunda doğrulama servisine ulaşılamıyorsa lisanslı varsay
      // (masaüstü deneyimini yanıltıcı hata diyaloğuyla bozmamak için).
      console.warn("License check unreachable; assuming valid for demo", error);
      setLicenseStatus('valid');
    }
  };

  const tiles: DashboardTile[] = [
    { title: "Gün İşlemleri", icon: Calculator, color: "bg-primary", path: "/restoran/operations" },
    { title: "POS", icon: Monitor, color: "bg-primary", path: "/pos" },
    { title: "Adisyonlar", icon: Receipt, color: "bg-primary", path: "/masalar" },
    { title: "Hesaplar", icon: CreditCard, color: "bg-primary", path: "/restoran/reports/sales" },
    { title: "TimeClock", icon: Clock, color: "bg-primary", path: "/restoran/settings/restaurant" },
    { title: "Depolar", icon: Package, color: "bg-primary", path: "/restoran/operations/stock" },
    { title: "Uygulama Mağazası", icon: ShoppingBag, color: "bg-primary", path: "/restoran/integrations/app-store" },
    { title: "Raporlar", icon: BarChart3, color: "bg-primary", path: "/restoran/reports" },
    { title: "Yönetim", icon: Settings, color: "bg-primary", path: "/restoran/settings" },
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
    <div className="min-h-screen bg-muted/30 flex flex-col font-sans">
      {/* Top Bar */}
      <header className="bg-card border-b border-border px-3 sm:px-6 py-3 flex flex-wrap justify-between items-center gap-y-2 gap-x-4 shadow-sm">
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Marka logosu: light modda header (koyu yazı), dark modda footer (beyaz yazı) varyantı */}
          <img
            src="/makethemenu-header.png"
            alt="Makethemenu"
            draggable={false}
            className="h-10 md:h-11 w-auto max-w-[170px] object-contain select-none block dark:hidden"
          />
          <img
            src="/makethemenu-footer.png"
            alt="Makethemenu"
            draggable={false}
            className="h-10 md:h-11 w-auto max-w-[170px] object-contain select-none hidden dark:block"
          />
          <span className="px-3 py-1 bg-red-100 text-red-600 text-xs font-semibold rounded-full">
            DEMO Sürümü
          </span>
        </div>
        <div className="flex items-center gap-4 sm:gap-6 text-sm text-muted-foreground">
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
      <footer className="bg-card border-t border-border px-3 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        {/* Sol: Klavye kısayolları */}
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
            onClick={() => setShowKeyboardDialog(true)}
          >
            <Keyboard size={13} />
            Klavye
          </Button>
        </div>

        {/* Orta: gün sonu uyarısı (aynı satır yüksekliğinde) */}
        <div className="order-first w-full sm:order-none sm:w-auto h-6 flex items-center justify-center font-bold text-red-500 tracking-wider text-center">
          GÜN SONU YAPMAYI UNUTMAYINIZ!
        </div>

        {/* Sağ: kullanıcı menüsü + ana menü */}
        <div className="flex items-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
              >
                <User size={13} />
                Administrator
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel>
                <span className="block">Administrator</span>
                <span className="block text-xs font-normal text-muted-foreground">Sistem Yöneticisi</span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => handleTileClick("/logout")}
                className="text-red-600 focus:text-red-600"
              >
                <LogOut size={14} className="mr-2" /> Oturumu Kapat
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
              >
                <LayoutGrid size={13} />
                Ana Menü
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Ana Menü</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {tiles
                .filter((tile) => tile.title !== "Çıkış")
                .map((tile) => (
                  <DropdownMenuItem key={tile.title} onClick={() => handleTileClick(tile.path)}>
                    <tile.icon size={14} className="mr-2" />
                    {tile.title}
                  </DropdownMenuItem>
                ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => handleTileClick("/logout")}
                className="text-red-600 focus:text-red-600"
              >
                <LogOut size={14} className="mr-2" /> Çıkış
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
            <div className="p-4 bg-muted rounded-md text-sm font-mono">
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

      {/* Keyboard Shortcuts Dialog */}
      <Dialog open={showKeyboardDialog} onOpenChange={setShowKeyboardDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Klavye Kısayolları</DialogTitle>
            <DialogDescription>
              Kasa ekranında kullanılan fonksiyon tuşları ve işlevleri.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 py-2">
            {keyboardShortcuts.map((shortcut) => (
              <div
                key={shortcut.key}
                className="flex items-center justify-between gap-3 rounded-md border border-border bg-muted/40 px-3 py-1.5"
              >
                <kbd className="rounded border border-border bg-card px-1.5 py-0.5 font-mono text-[11px] font-semibold text-foreground">
                  {shortcut.key}
                </kbd>
                <span className="text-xs text-foreground text-right">{shortcut.label}</span>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DesktopDashboard;
