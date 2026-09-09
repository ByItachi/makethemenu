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
  Grid
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
import { Link, Route, Switch, useLocation, useRoute } from "wouter";
import { DarkModeProvider, useDarkMode } from "@/contexts/DarkModeContext";
import DigitalMenuLayout from "./restoran/DigitalMenuLayout";
import OnlineDefinitions from "./restoran/OnlineDefinitions";
import OnlineSales from "./restoran/OnlineSales";
import OnlineCustomers from "./restoran/OnlineCustomers";
import OnlineKitchen from "./restoran/OnlineKitchen";
import OnlineCampaigns from "./restoran/OnlineCampaigns";
import OnlineManagement from "./restoran/OnlineManagement";
import OnlineSettings from "./restoran/OnlineSettings";
import OnlineAccount from "./restoran/OnlineAccount";
import Integrations from "./restoran/integrations/Integrations";
import YemekSepetiIntegration from "./restoran/integrations/YemekSepetiIntegration";
import GetirIntegration from "./restoran/integrations/GetirIntegration";
import TrendyolYemekIntegration from "./restoran/integrations/TrendyolYemekIntegration";
import RestaJetIntegration from "./restoran/integrations/RestaJetIntegration";
import EFaturaIntegration from "./restoran/integrations/EFaturaIntegration";
import MigrosYemekIntegration from "./restoran/integrations/MigrosYemekIntegration";
import FuudyIntegration from "./restoran/integrations/FuudyIntegration";
import PaketServisiIntegration from "./restoran/integrations/PaketServisiIntegration";
import HemenyoldaIntegration from "./restoran/integrations/HemenyoldaIntegration";
import EAdisyonIntegration from "./restoran/integrations/EAdisyonIntegration";
import BoostfeelIntegration from "./restoran/integrations/BoostfeelIntegration";
import VeriAktarimiAPIIntegration from "./restoran/integrations/VeriAktarimiAPIIntegration";
import HotelRunnerIntegration from "./restoran/integrations/HotelRunnerIntegration";
import HMSHotelIntegration from "./restoran/integrations/HMSHotelIntegration";
import Hotelier101Integration from "./restoran/integrations/Hotelier101Integration";
import BizimHesapIntegration from "./restoran/integrations/BizimHesapIntegration";
import CallerIDIntegration from "./restoran/integrations/CallerIDIntegration";
import YazarKasaIntegration from "./restoran/integrations/YazarKasaIntegration";
import AdisyoHaritaIntegration from "./restoran/integrations/AdisyoHaritaIntegration";
import AndroidCallerIDIntegration from "./restoran/integrations/AndroidCallerIDIntegration";
import { NotificationsPopover, HelpSheet, SupportDialog } from "@/components/restoran/HeaderActions";

// Definitions Pages
import TablesPage from "./restoran/definitions/TablesPage";
import ProductsPage from "./restoran/definitions/ProductsPage";
import UnitsPage from "./restoran/definitions/UnitsPage";
import PropertiesPage from "./restoran/definitions/PropertiesPage";
import VatPage from "./restoran/definitions/VatPage";
import DiscountsPage from "./restoran/definitions/DiscountsPage";
import KitchenGroupsPage from "./restoran/definitions/KitchenGroupsPage";
import ComplimentaryPage from "./restoran/definitions/ComplimentaryPage";
import ServiceChargePage from "./restoran/definitions/ServiceChargePage";

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
    setLocation("/online/account");
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
            <div className="space-y-2">
              <Label>Bağlantı</Label>
              <select className="w-full border rounded-md px-3 py-2" value={iface} onChange={e => setIface(e.target.value as any)}>
                <option>Ethernet</option>
                <option>USB</option>
              </select>
            </div>
            {iface === "Ethernet" && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>IP</Label>
                  <Input placeholder="192.168.1.50" value={ip} onChange={e => setIp(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Port</Label>
                  <Input placeholder="9100" value={port} onChange={e => setPort(e.target.value)} />
                </div>
              </div>
            )}
            <div className="flex items-center gap-2">
              <input id="enabled" type="checkbox" checked={enabled} onChange={() => setEnabled(v => !v)} />
              <Label htmlFor="enabled">Aktif</Label>
            </div>
            <div className="flex items-center gap-2">
              <Button className="bg-primary hover:bg-primary/90" onClick={addPrinter}>Ekle</Button>
              <Button variant="secondary" onClick={() => { setName(""); setIp(""); setPort("9100"); setCopies(1); setEnabled(true); setRole("Mutfak"); setWidth("80mm"); setIface("Ethernet"); }}>Temizle</Button>
            </div>
          </div>
        </div>
        <div className="md:col-span-2 space-y-4">
          <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
            <h3 className="text-lg font-medium text-slate-800 mb-4">Yazıcılar</h3>
            {printers.length === 0 ? (
              <div className="text-slate-500">Kayıtlı yazıcı bulunmuyor.</div>
            ) : (
              <div className="space-y-3">
                {printers.map(p => (
                  <div key={p.id} className="flex items-center justify-between border rounded-md px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${p.enabled ? "bg-emerald-500" : "bg-slate-300"}`} />
                      <div>
                        <div className="font-medium">{p.name}</div>
                        <div className="text-xs text-slate-500">
                          {p.role} • {p.width} • {p.iface}{p.iface === "Ethernet" && p.ip ? ` • ${p.ip}:${p.port || "9100"}` : ""}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="secondary" onClick={() => testPrinter(p)}>Test Baskı</Button>
                      <Button variant="secondary" onClick={() => toggleEnabled(p.id)}>{p.enabled ? "Pasifleştir" : "Aktifleştir"}</Button>
                      <Button variant="destructive" onClick={() => removePrinter(p.id)}>Sil</Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

type CallerConfig = {
  enabled: boolean;
  serverUrl: string;
  token: string;
  deviceName: string;
  autoStart: boolean;
};

const CallerIdSettingsPage: React.FC = () => {
  const [cfg, setCfg] = useState<CallerConfig>(() => {
    try {
      const raw = localStorage.getItem("callerid");
      return raw ? JSON.parse(raw) : {
        enabled: true,
        serverUrl: "http://127.0.0.1:5000/callerid",
        token: "",
        deviceName: "Android Cihaz",
        autoStart: true
      };
    } catch {
      return {
        enabled: true,
        serverUrl: "http://127.0.0.1:5000/callerid",
        token: "",
        deviceName: "Android Cihaz",
        autoStart: true
      };
    }
  });
  const [testNumber, setTestNumber] = useState("");
  const [status, setStatus] = useState<"disconnected" | "connected">("disconnected");

  useEffect(() => {
    localStorage.setItem("callerid", JSON.stringify(cfg));
  }, [cfg]);

  const save = () => {
    localStorage.setItem("callerid", JSON.stringify(cfg));
    alert("CallerId ayarları kaydedildi");
  };

  const simulateCall = () => {
    if (!testNumber.trim()) return;
    alert(`Simüle arama: ${testNumber}`);
  };

  const toggleConnection = () => {
    setStatus(s => s === "connected" ? "disconnected" : "connected");
  };

  return (
    <div className="max-w-6xl space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
          <Smartphone className="w-5 h-5 text-slate-500" />
          Android CallerId Ayarları
        </h2>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${status === "connected" ? "bg-emerald-500" : "bg-slate-300"}`} />
          <span className="text-sm text-slate-500">{status === "connected" ? "Bağlı" : "Bağlı değil"}</span>
          <Button variant="secondary" onClick={toggleConnection}>{status === "connected" ? "Bağlantıyı Kes" : "Bağlan"}</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <input id="cid-enabled" type="checkbox" checked={cfg.enabled} onChange={() => setCfg(v => ({ ...v, enabled: !v.enabled }))} />
              <Label htmlFor="cid-enabled">CallerId Aktif</Label>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cid-server">Sunucu URL</Label>
              <Input id="cid-server" value={cfg.serverUrl} onChange={e => setCfg(v => ({ ...v, serverUrl: e.target.value }))} placeholder="http://sunucu:5000/callerid" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cid-token">Erişim Anahtarı</Label>
                <Input id="cid-token" value={cfg.token} onChange={e => setCfg(v => ({ ...v, token: e.target.value }))} placeholder="opsiyonel" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cid-device">Cihaz Adı</Label>
                <Input id="cid-device" value={cfg.deviceName} onChange={e => setCfg(v => ({ ...v, deviceName: e.target.value }))} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input id="cid-autostart" type="checkbox" checked={cfg.autoStart} onChange={() => setCfg(v => ({ ...v, autoStart: !v.autoStart }))} />
              <Label htmlFor="cid-autostart">Uygulama açılınca otomatik başlat</Label>
            </div>
            <div className="flex items-center gap-2">
              <Button className="bg-primary hover:bg-primary/90" onClick={save}>Kaydet</Button>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-lg font-medium text-slate-800">Test</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="cid-test">Telefon Numarası</Label>
                <Input id="cid-test" value={testNumber} onChange={e => setTestNumber(e.target.value)} placeholder="+90 5xx xxx xx xx" />
              </div>
              <div className="flex items-end">
                <Button variant="secondary" onClick={simulateCall}>Aramayı Simüle Et</Button>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-3">
            <h3 className="text-lg font-medium text-slate-800">Kurulum</h3>
            <ol className="text-sm text-slate-600 space-y-2">
              <li>1. Android CallerId uygulamasını cihaza yükleyin.</li>
              <li>2. Aynı ağda olduğunuzdan emin olun.</li>
              <li>3. Sunucu URL’sini ve anahtarı uygulamaya girin.</li>
              <li>4. Cihazda servisi başlatın ve burada Bağlan’a tıklayın.</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

const OnlineDashboardContent = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [location, setLocation] = useLocation();
  const { isDarkMode, toggleDarkMode } = useDarkMode();

  useEffect(() => {
    // Set light mode by default on /online
    if (location === '/online' || location === '/online/') {
      if (isDarkMode) {
        toggleDarkMode();
      }
    }
  }, [location, isDarkMode, toggleDarkMode]);

  // Helper to determine if a route is active
  const isActive = (path: string) => {
    if (path === "/online") {
      return location === "/online" || location === "/online/";
    }
    return location.startsWith(path);
  };

  const IntegrationsRoute = () => {
    const [isAppStore] = useRoute("/online/integrations/app-store");
    const [isYemeksepeti] = useRoute("/online/integrations/yemeksepeti");
    const [isGetir] = useRoute("/online/integrations/getir");
    const [isTrendyol] = useRoute("/online/integrations/trendyol-yemek");
    const [isRestaJet] = useRoute("/online/integrations/restajet");
    const [isEFatura] = useRoute("/online/integrations/e-fatura");
    const [isMigros] = useRoute("/online/integrations/migros-yemek");
    const [isFuudy] = useRoute("/online/integrations/fuudy");
    const [isPaketServisi] = useRoute("/online/integrations/paket-servisi");
    const [isHemenyolda] = useRoute("/online/integrations/hemenyolda");
    const [isEAdisyon] = useRoute("/online/integrations/e-adisyon");
    const [isBoostfeel] = useRoute("/online/integrations/boostfeel");
    const [isVeriAktarimi] = useRoute("/online/integrations/veri-aktarimi");
    const [isHotelRunner] = useRoute("/online/integrations/hotel-runner");
    const [isHMSHotel] = useRoute("/online/integrations/hms-hotel");
    const [isHotelier101] = useRoute("/online/integrations/hotelier-101");
    const [isBizimHesap] = useRoute("/online/integrations/bizim-hesap");
    const [isCallerID] = useRoute("/online/integrations/caller-id");
    const [isYazarKasa] = useRoute("/online/integrations/yazar-kasa");
    const [isAdisyoHarita] = useRoute("/online/integrations/adisyo-harita");
    const [isAndroidCallerID] = useRoute("/online/integrations/android-callerid");
    const [isIntegrations] = useRoute("/online/integrations");

    if (isAppStore) return <Integrations />;
    if (isYemeksepeti) return <YemekSepetiIntegration />;
    if (isGetir) return <GetirIntegration />;
    if (isTrendyol) return <TrendyolYemekIntegration />;
    if (isRestaJet) return <RestaJetIntegration />;
    if (isEFatura) return <EFaturaIntegration />;
    if (isMigros) return <MigrosYemekIntegration />;
    if (isFuudy) return <FuudyIntegration />;
    if (isPaketServisi) return <PaketServisiIntegration />;
    if (isHemenyolda) return <HemenyoldaIntegration />;
    if (isEAdisyon) return <EAdisyonIntegration />;
    if (isBoostfeel) return <BoostfeelIntegration />;
    if (isVeriAktarimi) return <VeriAktarimiAPIIntegration />;
    if (isHotelRunner) return <HotelRunnerIntegration />;
    if (isHMSHotel) return <HMSHotelIntegration />;
    if (isHotelier101) return <Hotelier101Integration />;
    if (isBizimHesap) return <BizimHesapIntegration />;
    if (isCallerID) return <CallerIDIntegration />;
    if (isYazarKasa) return <YazarKasaIntegration />;
    if (isAdisyoHarita) return <AdisyoHaritaIntegration />;
    if (isAndroidCallerID) return <AndroidCallerIDIntegration />;
    if (isIntegrations) return <Integrations />;

    return null; // Veya bir 404 bileşeni
  };

  const getPageTitle = () => {
    if (location === "/online" || location === "/online/") return "Genel Bakış";
    if (location.startsWith("/online/menu")) return "Dijital Menü";
    // Definitions sub-pages
    if (location.startsWith("/online/definitions/tables")) return "Masa / Bölgeler";
    if (location.startsWith("/online/definitions/products")) return "Menü / Ürünler";
    if (location.startsWith("/online/definitions/units")) return "Birimler";
    if (location.startsWith("/online/definitions/properties")) return "Özellikler";
    if (location.startsWith("/online/definitions/vat")) return "Kdv Oranları";
    if (location.startsWith("/online/definitions/discounts")) return "İndirimler";
    if (location.startsWith("/online/definitions/kitchen-groups")) return "Mutfak Grupları";
    if (location.startsWith("/online/definitions/complimentary")) return "Ödenmezler";
    if (location.startsWith("/online/definitions/service-charge")) return "Kuver/Garsoniye";
    if (location.startsWith("/online/definitions")) return "Tanımlamalar";
    if (location.startsWith("/online/operations")) return "İşlemler";
    if (location.startsWith("/online/reports")) return "Raporlar";
    if (location.startsWith("/online/users")) return "Kullanıcılar";

    // New Sections Titles
    if (location.startsWith("/online/operations/stock")) return "Stok İşlemleri";
    if (location.startsWith("/online/operations/expenses")) return "Gider / Masraf İşlemleri";
    if (location.startsWith("/online/operations/waste")) return "Zayi İşlemleri";

    if (location.startsWith("/online/reports/sales")) return "Ürün Satış Raporu";
    if (location.startsWith("/online/reports/end-of-day")) return "Gün Sonu Raporu";
    if (location.startsWith("/online/reports/shift")) return "Vardiya Satış Raporu";
    if (location.startsWith("/online/reports/stats")) return "Restaurant İstatistikleri";
    if (location.startsWith("/online/reports/stock")) return "Stok Durum Raporu";
    if (location.startsWith("/online/reports/waste")) return "Fire Raporu";

    if (location.startsWith("/online/users/list")) return "Kullanıcılar";
    if (location.startsWith("/online/users/permissions")) return "Yetkiler";

    if (location.startsWith("/online/settings/restaurant")) return "Restaurant Ayarları";
    if (location.startsWith("/online/settings/printers")) return "Yazıcı Ayarları";
    if (location.startsWith("/online/settings/callerid")) return "Android CallerId Ayarları";
    if (location.startsWith("/online/settings/customer-display")) return "Müşteri Bilgi Ekranı";
    if (location.startsWith("/online/settings/app-store")) return "Uygulama Mağazası";
    if (location.startsWith("/online/app-store")) return "Uygulama Mağazası";

    if (location.startsWith("/online/sales")) return "Satışlar";
    if (location.startsWith("/online/customers")) return "Müşteriler";
    if (location.startsWith("/online/kitchen")) return "Mutfak";
    if (location.startsWith("/online/campaigns")) return "Kampanyalar";
    if (location.startsWith("/online/management")) return "Yönetim";
    if (location.startsWith("/online/settings")) return "Ayarlar";
    if (location.startsWith("/online/license")) return "Lisans Yenileme";
    if (location.startsWith("/online/account")) return "Hesabım";
    return "Genel Bakış";
  };

  const clearClientCache = async () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map(k => caches.delete(k)));
      }
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map(r => r.unregister()));
      }
    } finally {
      window.location.reload();
    }
  };

  return (
    <div className={`min-h-screen bg-slate-100 flex font-sans text-slate-800 dark:bg-slate-900 dark:text-slate-100`}>
      {/* Sidebar */}
      <aside className={`bg-white border-r border-slate-200 w-64 flex-shrink-0 flex flex-col transition-all duration-300 dark:bg-slate-800 dark:border-slate-700 ${sidebarOpen ? 'translate-x-0' : '-translate-x-64 absolute h-full z-20'}`}>
        {/* Sidebar Header */}
        <div className="h-16 flex items-center px-4 border-b border-slate-100 dark:border-slate-700">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <LayoutDashboard className="w-8 h-8 text-primary" />
              <span className="font-bold text-lg text-slate-800 dark:text-white">Resto<span className="text-primary">POS</span></span>
            </div>
          </Link>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 dark:bg-slate-800/50 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold dark:bg-blue-900 dark:text-blue-300">
              K
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-slate-700 dark:text-slate-200">KULLANICI</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">12345 - Yönetici</span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-2">
          <SidebarItem icon={LayoutDashboard} label="Ana Sayfa" href="/online" active={isActive("/online") && !location.startsWith("/online/")} />
          <SidebarItem icon={Store} label="Dijital Menü" href="/online/menu" active={isActive("/online/menu")} badge="Yepyeni" />

          <SidebarItem
            icon={FileText}
            label="Tanımlamalar"
            href="/online/definitions"
            active={isActive("/online/definitions")}
          >
            <SidebarItem icon={LayoutGrid} label="Masa / Bölgeler" href="/online/definitions/tables" active={isActive("/online/definitions/tables")} />
            <SidebarItem icon={Utensils} label="Menü / Ürünler" href="/online/definitions/products" active={isActive("/online/definitions/products")} />
            <SidebarItem icon={Scale} label="Birimler" href="/online/definitions/units" active={isActive("/online/definitions/units")} />
            <SidebarItem icon={List} label="Özellikler" href="/online/definitions/properties" active={isActive("/online/definitions/properties")} />
            <SidebarItem icon={Percent} label="Kdv Oranları" href="/online/definitions/vat" active={isActive("/online/definitions/vat")} />
            <SidebarItem icon={Tag} label="İndirimler" href="/online/definitions/discounts" active={isActive("/online/definitions/discounts")} />
            <SidebarItem icon={ChefHat} label="Mutfak Grupları" href="/online/definitions/kitchen-groups" active={isActive("/online/definitions/kitchen-groups")} />
            <SidebarItem icon={XCircle} label="Ödenmezler" href="/online/definitions/complimentary" active={isActive("/online/definitions/complimentary")} />
            <SidebarItem icon={Coins} label="Kuver/Garsoniye" href="/online/definitions/service-charge" active={isActive("/online/definitions/service-charge")} />
          </SidebarItem>

          <SidebarItem
            icon={ArrowRightLeft}
            label="İşlemler"
            href="/online/operations"
            active={isActive("/online/operations")}
          >
            <SidebarItem icon={Truck} label="Stok İşlemleri" href="/online/operations/stock" active={isActive("/online/operations/stock")} />
            <SidebarItem icon={TrendingDown} label="Gider / Masraf İşlemleri" href="/online/operations/expenses" active={isActive("/online/operations/expenses")} />
            <SidebarItem icon={Trash2} label="Zayi İşlemleri" href="/online/operations/waste" active={isActive("/online/operations/waste")} />
          </SidebarItem>

          <SidebarItem
            icon={FileText}
            label="Raporlar"
            href="/online/reports"
            active={isActive("/online/reports")}
          >
            <SidebarItem icon={LineChart} label="Ürün Satış Raporu" href="/online/reports/sales" active={isActive("/online/reports/sales")} />
            <SidebarItem icon={DollarSign} label="Gün Sonu Raporu" href="/online/reports/end-of-day" active={isActive("/online/reports/end-of-day")} />
            <SidebarItem icon={ClipboardList} label="Vardiya Satış Raporu" href="/online/reports/shift" active={isActive("/online/reports/shift")} />
            <SidebarItem icon={PieChartIcon} label="Restaurant İstatistikleri" href="/online/reports/stats" active={isActive("/online/reports/stats")} />
            <SidebarItem icon={Box} label="Stok Durum Raporu" href="/online/reports/stock" active={isActive("/online/reports/stock")} />
            <SidebarItem icon={FileMinus} label="Fire Raporu" href="/online/reports/waste" active={isActive("/online/reports/waste")} />
          </SidebarItem>

          <SidebarItem
            icon={Users}
            label="Kullanıcılar"
            href="/online/users"
            active={isActive("/online/users")}
          >
            <SidebarItem icon={Users} label="Kullanıcılar" href="/online/users/list" active={isActive("/online/users/list")} />
            <SidebarItem icon={UserCog} label="Yetkiler" href="/online/users/permissions" active={isActive("/online/users/permissions")} />
          </SidebarItem>

          <SidebarItem
            icon={Settings}
            label="Ayarlar"
            href="/online/settings"
            active={isActive("/online/settings")}
          >
            <SidebarItem icon={Settings} label="Restaurant Ayarları" href="/online/settings/restaurant" active={isActive("/online/settings/restaurant")} />
            <SidebarItem icon={Printer} label="Yazıcı Ayarları" href="/online/settings/printers" active={isActive("/online/settings/printers")} />
            <SidebarItem icon={Smartphone} label="Android CallerId Ayarları" href="/online/settings/callerid" active={isActive("/online/settings/callerid")} />
            <SidebarItem icon={Monitor} label="Müşteri Bilgi Ekranı" href="/online/settings/customer-display" active={isActive("/online/settings/customer-display")} />
          </SidebarItem>

          <SidebarItem
            icon={Grid}
            label="Entegrasyonlar"
            href="/online/integrations"
            active={isActive("/online/integrations")}
          >
            <SidebarItem icon={Store} label="Uygulama Mağazası" href="/online/integrations/app-store" active={isActive("/online/integrations/app-store")} />
          </SidebarItem>

          <SidebarSectionHeader label="Hesabım" />
          <SidebarItem icon={User} label="Hesabım" href="/online/account" active={isActive("/online/account")} />

          {/* Çıkış Yap - Online Menü içinde */}
          <div
            className="flex items-center justify-between px-4 py-3 cursor-pointer text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
            onClick={() => {
              localStorage.removeItem('token');
              window.location.href = '/giris';
            }}
          >
            <div className="flex items-center gap-3">
              <LogOut size={20} />
              <span className="font-medium text-sm">Çıkış Yap</span>
            </div>
          </div>
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-700 sticky bottom-0 bg-white dark:bg-slate-800">
          <div className="text-xs text-slate-400 text-center dark:text-slate-500">
            <p>&copy; 2026 RestoPOS</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarOpen ? '' : 'ml-0'}`}>
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-10 dark:bg-slate-800 dark:border-slate-700">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)} className="dark:text-slate-300 dark:hover:text-white">
              <MenuIcon className="h-5 w-5 text-slate-600 dark:text-slate-300" />
            </Button>
            <h1 className="text-xl font-bold text-slate-800 dark:text-white">{getPageTitle()}</h1>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="text-orange-500 border-orange-200 hover:bg-orange-50 hover:text-orange-600 h-9 text-xs font-semibold dark:bg-orange-900/20 dark:border-orange-800"
              onClick={() => setLocation('/online/account')}
            >
              <span className="w-2 h-2 rounded-full bg-orange-500 mr-2"></span>
              Hizmet Duraklatıldı
            </Button>

            <div className="h-6 w-px bg-slate-200 mx-2 dark:bg-slate-700"></div>

            <ThemeToggle />
            <NotificationsPopover />
            <Button
              variant="outline"
              className="h-9 text-xs font-semibold gap-2"
              onClick={clearClientCache}
            >
              <RefreshCw className="h-4 w-4" />
              Cache Temizle
            </Button>

            <HelpSheet />

            <SupportDialog />
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 p-6 overflow-y-auto">
          <Switch>
            <Route path="/online/menu" component={DigitalMenuLayout} />

            {/* Definitions Sub-routes (must be before /online/definitions) */}
            <Route path="/online/definitions/tables" component={TablesPage} />
            <Route path="/online/definitions/products" component={ProductsPage} />
            <Route path="/online/definitions/units" component={UnitsPage} />
            <Route path="/online/definitions/properties" component={PropertiesPage} />
            <Route path="/online/definitions/vat" component={VatPage} />
            <Route path="/online/definitions/discounts" component={DiscountsPage} />
            <Route path="/online/definitions/kitchen-groups" component={KitchenGroupsPage} />
            <Route path="/online/definitions/complimentary" component={ComplimentaryPage} />
            <Route path="/online/definitions/service-charge" component={ServiceChargePage} />

            <Route path="/online/definitions" component={OnlineDefinitions} />

            {/* Operations */}
            <Route path="/online/operations" component={() => <PlaceholderPage title="İşlemler" icon={ArrowRightLeft} />} />
            <Route path="/online/operations/stock" component={() => <PlaceholderPage title="Stok İşlemleri" icon={Truck} />} />
            <Route path="/online/operations/expenses" component={() => <PlaceholderPage title="Gider / Masraf İşlemleri" icon={TrendingDown} />} />
            <Route path="/online/operations/waste" component={() => <PlaceholderPage title="Zayi İşlemleri" icon={Trash2} />} />

            {/* Reports */}
            <Route path="/online/reports" component={() => <PlaceholderPage title="Raporlar" icon={FileText} />} />
            <Route path="/online/reports/sales" component={() => <PlaceholderPage title="Ürün Satış Raporu" icon={LineChart} />} />
            <Route path="/online/reports/end-of-day" component={() => <PlaceholderPage title="Gün Sonu Raporu" icon={DollarSign} />} />
            <Route path="/online/reports/shift" component={() => <PlaceholderPage title="Vardiya Satış Raporu" icon={ClipboardList} />} />
            <Route path="/online/reports/stats" component={() => <PlaceholderPage title="Restaurant İstatistikleri" icon={PieChartIcon} />} />
            <Route path="/online/reports/stock" component={() => <PlaceholderPage title="Stok Durum Raporu" icon={Box} />} />
            <Route path="/online/reports/waste" component={() => <PlaceholderPage title="Fire Raporu" icon={FileMinus} />} />

            {/* Users */}
            <Route path="/online/users" component={() => <PlaceholderPage title="Kullanıcılar" icon={Users} />} />
            <Route path="/online/users/list" component={() => <PlaceholderPage title="Kullanıcılar" icon={Users} />} />
            <Route path="/online/users/permissions" component={() => <PlaceholderPage title="Yetkiler" icon={UserCog} />} />

            {/* Settings */}
            <Route path="/online/settings/restaurant" component={OnlineManagement} />
            <Route path="/online/settings/printers" component={PrinterSettingsPage} />
            <Route path="/online/settings/callerid" component={CallerIdSettingsPage} />
            <Route path="/online/settings/customer-display" component={CustomerDisplaySettingsPage} />
            <Route path="/online/settings/app-store" component={() => <PlaceholderPage title="Uygulama Mağazası" icon={Grid} />} />
            <Route path="/online/app-store" component={() => <PlaceholderPage title="Uygulama Mağazası" icon={Grid} />} />

            {/* Integrations */}
            <Route path="/online/integrations/:subpath*" component={IntegrationsRoute} />
            <Route path="/online/integrations" component={IntegrationsRoute} />


            <Route path="/online/sales" component={OnlineSales} />
            <Route path="/online/customers" component={OnlineCustomers} />
            <Route path="/online/kitchen" component={OnlineKitchen} />
            <Route path="/online/campaigns" component={OnlineCampaigns} />
            <Route path="/online/management" component={OnlineManagement} />
            <Route path="/online/settings" component={OnlineSettings} />
            <Route path="/online/account" component={OnlineAccount} />
            <Route path="/online/license" component={RedirectToAccount} />
            <Route path="/online/" component={DashboardHome} />
            <Route path="/online" component={DashboardHome} />
            {/* Fallback */}
            <Route path="/online/:rest*" component={DashboardHome} />
          </Switch>
        </main>
      </div>
    </div>
  );
};

const OnlineDashboard = () => (
  <DarkModeProvider>
    <OnlineDashboardContent />
  </DarkModeProvider>
);

export default OnlineDashboard;
