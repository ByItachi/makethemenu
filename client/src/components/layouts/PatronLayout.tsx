import React, { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Menu as MenuIcon,
  Settings,
  Users,
  FileText,
  ChefHat,
  ShoppingBag,
  Utensils,
  ChevronDown,
  Bell,
  Gift,
  RefreshCw,
  MoreVertical,
  HelpCircle,
  User,
  X,
  Store,
  ArrowRightLeft,
  LayoutGrid,
  Scale,
  Percent,
  Tag,
  Coins,
  DollarSign,
  XCircle,
  List,
  Moon,
  Sun,
  LogOut,
  Truck,
  TrendingDown,
  Trash2,
  LineChart,
  ClipboardList,
  PieChart as PieChartIcon,
  Box,
  FileMinus,
  UserCog,
  Shield,
  Printer,
  Smartphone,
  Monitor,
  Grid,
  Plus,
  AlertTriangle,
  Filter,
  TrendingUp,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link, Route, Switch, useLocation, useRoute } from "wouter";
import { DarkModeProvider, useDarkMode } from "@/contexts/DarkModeContext";
// Imports removed
import { NotificationsPopover, HelpSheet, SupportDialog } from "@/components/restoran/HeaderActions";
import Integrations from "@/pages/restoran/integrations/Integrations";
import Urun3DGosterimIntegration from "@/pages/restoran/integrations/Urun3DGosterimIntegration";
import DigitalMenuLayout from "@/pages/restoran/DigitalMenuLayout";
import PatronDashboard from "@/pages/patron/PatronDashboard";

// --- Mock Data ---
const dailySalesData = [
  { time: '00:00', value: 0 }, { time: '01:00', value: 0 }, { time: '02:00', value: 0 },
  { time: '03:00', value: 0 }, { time: '04:00', value: 0 }, { time: '05:00', value: 0 },
  { time: '06:00', value: 0 }, { time: '07:00', value: 0 }, { time: '08:00', value: 0 },
  { time: '09:00', value: 0 }, { time: '10:00', value: 0 }, { time: '11:00', value: 0 },
  { time: '12:00', value: 0 }, { time: '13:00', value: 0 }, { time: '14:00', value: 0 },
  { time: '15:00', value: 0 }, { time: '16:00', value: 0 }, { time: '17:00', value: 0 },
  { time: '18:00', value: 0 }, { time: '19:00', value: 0 }, { time: '20:00', value: 0 },
  { time: '21:00', value: 0 }, { time: '22:00', value: 0 }, { time: '23:00', value: 0 },
  { time: '24:00', value: 0 },
];

const paymentsData = [
  { name: 'Nakit', value: 0 },
  { name: 'Kredi Kartı', value: 0 },
  { name: 'Yemek Çeki', value: 0 },
];

const densityData = [
  { name: 'Dolu', value: 10 },
  { name: 'Boş', value: 90 },
];

const COLORS = ['#0ea5e9', '#22c55e']; // Blue for Full (dummy), Green for Empty

// --- Components ---

const ThemeToggle = () => {
  const { isDarkMode, toggleDarkMode } = useDarkMode();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleDarkMode}
      className="text-slate-500 hover:text-primary dark:text-slate-400 dark:hover:text-primary"
    >
      {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </Button>
  );
};

const SidebarItem = ({ icon: Icon, label, href, active = false, hasSubmenu = false, badge = "", children }: any) => {
  const [isOpen, setIsOpen] = useState(active);

  useEffect(() => {
    if (active) setIsOpen(true);
  }, [active]);

  const toggle = (e: any) => {
    e.preventDefault();
    setIsOpen(!isOpen);
  };

  const hasChildren = children || hasSubmenu;

  const content = (
    <div
      className={`flex items-center justify-between px-4 py-3 cursor-pointer transition-colors ${active && !children
        ? 'bg-slate-100 text-primary border-r-4 border-primary dark:bg-slate-800 dark:text-primary'
        : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800'
        }`}
      onClick={hasChildren ? toggle : undefined}
    >
      <div className="flex items-center gap-3">
        {Icon && <Icon size={20} />}
        <span className={`font-medium text-sm ${!Icon ? 'pl-8' : ''}`}>{label}</span>
      </div>
      <div className="flex items-center gap-2">
        {badge && (
          <span className="px-2 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full uppercase">
            {badge}
          </span>
        )}
        {hasChildren && (
          <ChevronDown size={16} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        )}
      </div>
    </div>
  );

  return (
    <div>
      {href ? <Link href={href}>{content}</Link> : content}
      {children && isOpen && (
        <div className="bg-slate-50 border-l-4 border-slate-100 ml-0 dark:bg-slate-900 dark:border-slate-800">
          {children}
        </div>
      )}
    </div>
  );
};

const SummaryCard = ({ title, value, subtext, colorClass, icon: Icon }: any) => (
  <div className="bg-white rounded-lg shadow-sm border border-slate-100 p-0 overflow-hidden flex h-32 dark:bg-slate-800 dark:border-slate-700">
    <div className={`w-24 ${colorClass} flex items-center justify-center text-white`}>
      <Icon size={32} />
    </div>
    <div className="flex-1 p-4 flex flex-col justify-center relative">
      <h3 className="text-slate-500 text-xs font-medium mb-1 dark:text-slate-400">{title}</h3>
      <div className="text-2xl font-bold text-slate-800 mb-1 dark:text-white">{value}</div>
      <div className="text-xs text-slate-400 dark:text-slate-500">{subtext}</div>
    </div>
  </div>
);

// --- Page Components ---
const DashboardHome = () => {
  const { isDarkMode } = useDarkMode();
  const axisColor = isDarkMode ? '#94a3b8' : '#64748b';
  const gridColor = isDarkMode ? '#334155' : '#e2e8f0';

  return (
    <>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <SummaryCard
          title="Bugünkü toplam satış tutarı"
          value="₺0,00"
          subtext="Gün sonu raporu"
          colorClass="bg-orange-500"
          icon={ShoppingBag}
        />
        <SummaryCard
          title="Bugünkü misafir sayısı"
          value="0"
          subtext="Kişi başı ortalama: ₺0,00"
          colorClass="bg-teal-500"
          icon={Users}
        />
        <SummaryCard
          title="Açık adisyon tutarı"
          value="₺0,00"
          subtext="0 Adisyon"
          colorClass="bg-indigo-500"
          icon={FileText}
        />
        <SummaryCard
          title="Kapanan adisyon tutarı"
          value="₺0,00"
          subtext="0 Adisyon"
          colorClass="bg-pink-500"
          icon={ChefHat}
        />
      </div>

      {/* Charts Row 1 */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100 mb-6 dark:bg-slate-800 dark:border-slate-700">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Günlük Satış Miktarları</h3>
          <div className="flex gap-2">
            {/* Filters could go here */}
          </div>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dailySalesData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
              <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: axisColor }} interval={2} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: axisColor }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: isDarkMode ? '#1e293b' : '#fff',
                  borderColor: isDarkMode ? '#334155' : '#e2e8f0',
                  color: isDarkMode ? '#f8fafc' : '#0f172a'
                }}
              />
              <Bar dataKey="value" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100 dark:bg-slate-800 dark:border-slate-700">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Ödemeler</h3>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={paymentsData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={gridColor} />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: axisColor }} />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: axisColor }} width={80} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDarkMode ? '#1e293b' : '#fff',
                    borderColor: isDarkMode ? '#334155' : '#e2e8f0',
                    color: isDarkMode ? '#f8fafc' : '#0f172a'
                  }}
                />
                <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100 dark:bg-slate-800 dark:border-slate-700">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Masa Yoğunluğu (%)</h3>
            <div className="flex gap-4 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                <span className="dark:text-slate-300">Dolu</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="dark:text-slate-300">Boş</span>
              </div>
            </div>
          </div>
          <div className="h-64 w-full relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={densityData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={0}
                  dataKey="value"
                  startAngle={90}
                  endAngle={-270}
                >
                  {densityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            {/* Center Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-bold text-slate-700 dark:text-white">10.0%</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

const PlaceholderPage = ({ title, icon: Icon }: any) => (
  <div className="flex flex-col items-center justify-center h-[60vh] text-slate-400 dark:text-slate-500">
    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 dark:bg-slate-800">
      <Icon size={32} />
    </div>
    <h2 className="text-xl font-semibold text-slate-600 mb-2 dark:text-slate-300">{title}</h2>
    <p>Bu modül şu anda geliştirme aşamasındadır.</p>
  </div>
);

const SidebarSectionHeader = ({ label }: { label: string }) => (
  <div className="px-4 py-2 mt-2 mb-1 text-xs font-semibold text-slate-400 uppercase tracking-wider dark:text-slate-500">
    {label}
  </div>
);

const RedirectToAccount: React.FC = () => {
  const [, setLocation] = useLocation();
  useEffect(() => {
    setLocation("/patron/account");
  }, [setLocation]);
  return null;
};

const CustomerDisplaySettingsPage: React.FC = () => {
  const [cfg, setCfg] = useState(() => {
    try {
      const raw = localStorage.getItem("customerDisplay");
      return raw ? JSON.parse(raw) : {
        enabled: true,
        theme: "light",
        showItems: true,
        showTotal: true,
        headline: "Hoş Geldiniz",
      };
    } catch {
      return {
        enabled: true,
        theme: "light",
        showItems: true,
        showTotal: true,
        headline: "Hoş Geldiniz",
      };
    }
  });
  const [items] = useState([
    { id: "1", name: "Burger", qty: 1, price: 120 },
    { id: "2", name: "Patates", qty: 1, price: 45 },
  ]);
  const total = items.reduce((s, it) => s + it.price * it.qty, 0);
  useEffect(() => {
    localStorage.setItem("customerDisplay", JSON.stringify(cfg));
  }, [cfg]);
  return (
    <div className="max-w-6xl space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
          <Monitor className="w-5 h-5 text-slate-500" />
          Müşteri Bilgi Ekranı
        </h2>
        <div className="text-sm text-slate-500">Yerel ayarlar</div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <input id="cde-enabled" type="checkbox" checked={cfg.enabled} onChange={() => setCfg((v: any) => ({ ...v, enabled: !v.enabled }))} />
              <Label htmlFor="cde-enabled">Ekran Aktif</Label>
            </div>
            <div className="space-y-2">
              <Label>Tema</Label>
              <select className="w-full border rounded-md px-3 py-2" value={cfg.theme} onChange={e => setCfg((v: any) => ({ ...v, theme: e.target.value }))}>
                <option value="light">Açık</option>
                <option value="dark">Koyu</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cde-head">Başlık</Label>
              <Input id="cde-head" value={cfg.headline} onChange={e => setCfg((v: any) => ({ ...v, headline: e.target.value }))} />
            </div>
            <div className="flex items-center gap-2">
              <input id="cde-items" type="checkbox" checked={cfg.showItems} onChange={() => setCfg((v: any) => ({ ...v, showItems: !v.showItems }))} />
              <Label htmlFor="cde-items">Ürünleri Göster</Label>
            </div>
            <div className="flex items-center gap-2">
              <input id="cde-total" type="checkbox" checked={cfg.showTotal} onChange={() => setCfg((v: any) => ({ ...v, showTotal: !v.showTotal }))} />
              <Label htmlFor="cde-total">Toplamı Göster</Label>
            </div>
            <Button className="bg-primary hover:bg-primary/90" onClick={() => localStorage.setItem("customerDisplay", JSON.stringify(cfg))}>Kaydet</Button>
          </div>
        </div>
        <div className="md:col-span-2">
          <div className={`rounded-xl border shadow-sm overflow-hidden ${cfg.theme === "dark" ? "bg-black text-white border-slate-800" : "bg-white border-slate-200"}`}>
            <div className={`px-6 py-4 text-2xl font-bold ${cfg.theme === "dark" ? "bg-slate-900" : "bg-slate-50"}`}>{cfg.headline}</div>
            <div className="p-6 space-y-4">
              {cfg.showItems && (
                <div className="space-y-2">
                  {items.map(it => (
                    <div key={it.id} className="flex items-center justify-between">
                      <div className="text-lg">{it.name} x{it.qty}</div>
                      <div className="text-lg">{it.price.toFixed(2)} ₺</div>
                    </div>
                  ))}
                </div>
              )}
              {cfg.showTotal && (
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="text-xl font-semibold">Toplam</div>
                  <div className="text-2xl font-bold">{total.toFixed(2)} ₺</div>
                </div>
              )}
              {!cfg.showItems && !cfg.showTotal && (
                <div className="text-center text-slate-500">Görsel önizleme</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

type PrinterConfig = {
  id: string;
  name: string;
  role: "Mutfak" | "Fiş" | "Fatura" | "Diğer";
  width: "58mm" | "80mm";
  iface: "Ethernet" | "USB";
  ip?: string;
  port?: string;
  copies: number;
  enabled: boolean;
};

const PrinterSettingsPage: React.FC = () => {
  const [printers, setPrinters] = useState<PrinterConfig[]>(() => {
    try {
      const raw = localStorage.getItem("printers");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [name, setName] = useState("");
  const [role, setRole] = useState<PrinterConfig["role"]>("Mutfak");
  const [width, setWidth] = useState<PrinterConfig["width"]>("80mm");
  const [iface, setIface] = useState<PrinterConfig["iface"]>("Ethernet");
  const [ip, setIp] = useState("");
  const [port, setPort] = useState("9100");
  const [copies, setCopies] = useState(1);
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    localStorage.setItem("printers", JSON.stringify(printers));
  }, [printers]);

  const addPrinter = () => {
    if (!name.trim()) return;
    const p: PrinterConfig = {
      id: crypto.randomUUID(),
      name: name.trim(),
      role,
      width,
      iface,
      ip: iface === "Ethernet" ? ip.trim() : undefined,
      port: iface === "Ethernet" ? (port || "9100") : undefined,
      copies: Math.max(1, Number(copies) || 1),
      enabled,
    };
    setPrinters(prev => [...prev, p]);
    setName("");
    setIp("");
    setPort("9100");
    setCopies(1);
    setEnabled(true);
    setRole("Mutfak");
    setWidth("80mm");
    setIface("Ethernet");
  };

  const removePrinter = (id: string) => {
    setPrinters(prev => prev.filter(p => p.id !== id));
  };

  const testPrinter = (p: PrinterConfig) => {
    alert(`Test baskı gönderildi: ${p.name}`);
  };

  const toggleEnabled = (id: string) => {
    setPrinters(prev => prev.map(p => p.id === id ? { ...p, enabled: !p.enabled } : p));
  };

  return (
    <div className="max-w-6xl space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
          <Printer className="w-5 h-5 text-slate-500" />
          Yazıcı Ayarları
        </h2>
        <div className="text-sm text-slate-500">Yerel ayarlar</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4">
            <div className="space-y-2">
              <Label htmlFor="printer-name">Yazıcı Adı</Label>
              <Input id="printer-name" value={name} onChange={e => setName(e.target.value)} placeholder="Mutfak Yazıcı" />
            </div>
            <div className="space-y-2">
              <Label>Rol</Label>
              <select className="w-full border rounded-md px-3 py-2" value={role} onChange={e => setRole(e.target.value as any)}>
                <option>Mutfak</option>
                <option>Fiş</option>
                <option>Fatura</option>
                <option>Diğer</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Kağıt</Label>
                <select className="w-full border rounded-md px-3 py-2" value={width} onChange={e => setWidth(e.target.value as any)}>
                  <option>80mm</option>
                  <option>58mm</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Kopya</Label>
                <Input type="number" min={1} value={copies} onChange={e => setCopies(Number(e.target.value))} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const PatronLayout: React.FC = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [location, setLocation] = useLocation();
  const [, params] = useRoute("/patron/:page*");
  const currentPage = (params as any)?.["page*"] || "dashboard";

  const isActive = (path: string) => {
    if (path === "dashboard" && currentPage === "dashboard") return true;
    return currentPage?.startsWith(path) && path !== "dashboard";
  };

  const pageTitle = "Patron Paneli";

  return (
    <DarkModeProvider>
      <div className="flex h-screen bg-slate-50 dark:bg-slate-900">
        {/* Mobile overlay */}
        {isSidebarOpen && (
          <div className="md:hidden fixed inset-0 z-30 bg-black/50" onClick={() => setSidebarOpen(false)} />
        )}

        {/* Sidebar */}
        <aside
          className={`fixed top-0 left-0 z-40 w-64 h-screen bg-white border-r border-slate-200 transition-transform md:translate-x-0 dark:bg-slate-900 dark:border-slate-800 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"
            }`}
        >
          <div className="flex items-center justify-between h-16 px-4 border-b border-slate-200 dark:border-slate-800">
            <Link href="/patron">
              <div className="flex items-center gap-2 cursor-pointer">
                <ChefHat className="text-primary" />
                <span className="text-lg font-bold text-slate-800 dark:text-white">Adisyo Patron</span>
              </div>
            </Link>
          </div>
          <nav className="py-4">
            <SidebarItem icon={LayoutDashboard} label="Ana Sayfa" href="/patron/dashboard" active={isActive("dashboard")} />
            <SidebarItem icon={Store} label="Şubeler" href="/patron/subeler" active={isActive("subeler")} />
            <SidebarItem icon={ArrowRightLeft} label="Entegrasyon Bağlantıları" href="/patron/entegrasyonlar" active={isActive("entegrasyonlar")} />
            <SidebarItem icon={FileText} label="BİB" href="/patron/bib" active={isActive("bib")} />
            <SidebarItem icon={Coins} label="Transaksiyonlar" href="/patron/transaksiyonlar" active={isActive("transaksiyonlar")} />
            <SidebarItem icon={Users} label="Kullanıcılar" href="/patron/kullanicilar" active={isActive("kullanicilar")} />
            <SidebarItem icon={HelpCircle} label="Öneri ve Şikayet Yönetimi" href="/patron/oneri-sikayet" active={isActive("oneri-sikayet")} />
            <SidebarItem icon={LineChart} label="Raporlar" href="/patron/raporlar" active={isActive("raporlar")} />
            <SidebarItem icon={Settings} label="Ayarlar" href="/patron/ayarlar" active={isActive("ayarlar")} />
          </nav>
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col md:ml-64">
          {/* Header */}
          <header className="flex items-center justify-between h-16 px-3 sm:px-4 bg-white border-b border-slate-200 dark:bg-slate-900 dark:border-slate-800">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0">
              <Button variant="ghost" size="icon" className="md:hidden shrink-0" onClick={() => setSidebarOpen(!isSidebarOpen)}>
                <MenuIcon className="h-6 w-6 text-slate-500" />
              </Button>
              <h1 className="text-lg font-semibold text-slate-800 dark:text-white truncate">{pageTitle}</h1>
            </div>
            <div className="flex items-center gap-2 sm:gap-4 shrink-0">
              <ThemeToggle />
              <NotificationsPopover />
              <HelpSheet />
              <SupportDialog />
              <User className="w-5 h-5 text-slate-500" />
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 p-6 overflow-y-auto">
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
              <p className="font-bold">Yetkiniz Bulunmamaktadır!</p>
              <p>Bu alanı görüntülemek için yetkiniz yok.</p>
            </div>
            <Switch location={location}>
              <Route path="/patron/dashboard" component={PatronDashboard} />
              <Route path="/patron/:rest*">
                {(params: any) => <PlaceholderPage title={params["rest*"]} icon={AlertTriangle} />}
              </Route>
            </Switch>
          </main>
        </div>
      </div>
    </DarkModeProvider>
  );
};

export default PatronLayout;
