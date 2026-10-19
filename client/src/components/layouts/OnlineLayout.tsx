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
  Puzzle,
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
import PluginCenter from "@/pages/restoran/integrations/PluginCenter";
import Urun3DGosterimIntegration from "@/pages/restoran/integrations/Urun3DGosterimIntegration";
import DigitalMenuLayout from "@/pages/restoran/DigitalMenuLayout";

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
    setLocation("/restoran/account");
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
              <Label>Arayüz</Label>
              <select className="w-full border rounded-md px-3 py-2" value={iface} onChange={e => setIface(e.target.value as any)}>
                <option>Ethernet</option>
                <option>USB</option>
              </select>
            </div>
            {iface === "Ethernet" && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="printer-ip">IP Adresi</Label>
                  <Input id="printer-ip" value={ip} onChange={e => setIp(e.target.value)} placeholder="192.168.1.100" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="printer-port">Port</Label>
                  <Input id="printer-port" value={port} onChange={e => setPort(e.target.value)} placeholder="9100" />
                </div>
              </div>
            )}
            <div className="flex items-center gap-2 pt-2">
              <input id="printer-enabled" type="checkbox" checked={enabled} onChange={() => setEnabled(v => !v)} />
              <Label htmlFor="printer-enabled">Aktif</Label>
            </div>
            <Button className="w-full bg-primary hover:bg-primary/90" onClick={addPrinter}>
              <Plus className="w-4 h-4 mr-2" />
              Yazıcı Ekle
            </Button>
          </div>
        </div>
        <div className="md:col-span-2">
          <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
            <ul className="space-y-3">
              {printers.map(p => (
                <li key={p.id} className="flex items-center justify-between p-3 rounded-md bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${p.enabled ? 'bg-green-500' : 'bg-slate-400'}`}></div>
                    <div>
                      <div className="font-semibold">{p.name}</div>
                      <div className="text-xs text-slate-500">
                        {p.role} - {p.width} - {p.iface} {p.iface === "Ethernet" && `(${p.ip}:${p.port})`} - {p.copies} kopya
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => testPrinter(p)}>Test</Button>
                    <Button variant="ghost" size="icon" onClick={() => toggleEnabled(p.id)}>
                      <RefreshCw className={`w-4 h-4 ${!p.enabled && 'text-slate-400'}`} />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600" onClick={() => removePrinter(p.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </li>
              ))}
              {printers.length === 0 && (
                <div className="text-center text-slate-500 py-8">
                  Henüz yazıcı eklenmemiş.
                </div>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Main Layout ---
export default function OnlineLayout() {
  return (
    <DarkModeProvider>
      <OnlineLayoutContent />
    </DarkModeProvider>
  );
}

function OnlineLayoutContent() {
  const [location] = useLocation();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const isActive = (path: string) => location.startsWith(path);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location]);

  return (
    <div className="flex h-screen bg-slate-100 dark:bg-slate-950 overflow-hidden">
      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div className="md:hidden fixed inset-0 z-30 bg-black/50" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <div
        className={`fixed md:static top-0 left-0 z-40 w-64 h-screen flex-shrink-0 bg-white border-r border-slate-200 flex flex-col dark:bg-slate-900 dark:border-slate-800 transition-transform md:translate-x-0 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 dark:border-slate-800">
          <Link href="/restoran" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Utensils className="text-white" size={18} />
            </div>
            <span className="font-bold text-lg text-slate-800 dark:text-white">Restoran</span>
          </Link>
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSidebarOpen(false)} aria-label="Menüyü kapat">
            <X className="h-5 w-5" />
          </Button>
        </div>
        <nav className="flex-1 py-2 overflow-y-auto">
          <SidebarItem icon={LayoutDashboard} label="Ana Sayfa" href="/restoran" active={isActive("/restoran") && !location.startsWith("/restoran/")} />
          <SidebarItem icon={Store} label="Dijital Menü" href="/restoran/digital-menu" active={isActive("/restoran/digital-menu")} badge="Yepyeni" />

          <SidebarItem
            icon={FileText}
            label="Tanımlamalar"
            href="/restoran/definitions"
            active={isActive("/restoran/definitions")}
          >
            <SidebarItem icon={LayoutGrid} label="Masa / Bölgeler" href="/restoran/definitions/tables" active={isActive("/restoran/definitions/tables")} />
            <SidebarItem icon={Utensils} label="Menü / Ürünler" href="/restoran/definitions/products" active={isActive("/restoran/definitions/products")} />
            <SidebarItem icon={Scale} label="Birimler" href="/restoran/definitions/units" active={isActive("/restoran/definitions/units")} />
            <SidebarItem icon={List} label="Özellikler" href="/restoran/definitions/properties" active={isActive("/restoran/definitions/properties")} />
            <SidebarItem icon={Percent} label="Kdv Oranları" href="/restoran/definitions/vat" active={isActive("/restoran/definitions/vat")} />
            <SidebarItem icon={Tag} label="İndirimler" href="/restoran/definitions/discounts" active={isActive("/restoran/definitions/discounts")} />
            <SidebarItem icon={ChefHat} label="Mutfak Grupları" href="/restoran/definitions/kitchen-groups" active={isActive("/restoran/definitions/kitchen-groups")} />
            <SidebarItem icon={XCircle} label="Ödenmezler" href="/restoran/definitions/complimentary" active={isActive("/restoran/definitions/complimentary")} />
            <SidebarItem icon={Coins} label="Kuver/Garsoniye" href="/restoran/definitions/service-charge" active={isActive("/restoran/definitions/service-charge")} />
          </SidebarItem>

          <SidebarItem
            icon={ArrowRightLeft}
            label="İşlemler"
            href="/restoran/operations"
            active={isActive("/restoran/operations")}
          >
            <SidebarItem icon={Truck} label="Stok İşlemleri" href="/restoran/operations/stock" active={isActive("/restoran/operations/stock")} />
            <SidebarItem icon={TrendingDown} label="Gider / Masraf İşlemleri" href="/restoran/operations/expenses" active={isActive("/restoran/operations/expenses")} />
            <SidebarItem icon={Trash2} label="Zayi İşlemleri" href="/restoran/operations/waste" active={isActive("/restoran/operations/waste")} />
          </SidebarItem>

          <SidebarItem
            icon={FileText}
            label="Raporlar"
            href="/restoran/reports"
            active={isActive("/restoran/reports")}
          >
            <SidebarItem icon={LineChart} label="Ürün Satış Raporu" href="/restoran/reports/sales" active={isActive("/restoran/reports/sales")} />
            <SidebarItem icon={DollarSign} label="Gün Sonu Raporu" href="/restoran/reports/end-of-day" active={isActive("/restoran/reports/end-of-day")} />
            <SidebarItem icon={ClipboardList} label="Vardiya Satış Raporu" href="/restoran/reports/shift" active={isActive("/restoran/reports/shift")} />
            <SidebarItem icon={PieChartIcon} label="Restaurant İstatistikleri" href="/restoran/reports/stats" active={isActive("/restoran/reports/stats")} />
            <SidebarItem icon={Box} label="Stok Durum Raporu" href="/restoran/reports/stock" active={isActive("/restoran/reports/stock")} />
            <SidebarItem icon={FileMinus} label="Fire Raporu" href="/restoran/reports/waste" active={isActive("/restoran/reports/waste")} />
          </SidebarItem>

          <SidebarItem
            icon={Users}
            label="Kullanıcılar"
            href="/restoran/users"
            active={isActive("/restoran/users")}
          >
            <SidebarItem icon={Users} label="Kullanıcılar" href="/restoran/users/list" active={isActive("/restoran/users/list")} />
            <SidebarItem icon={UserCog} label="Yetkiler" href="/restoran/users/permissions" active={isActive("/restoran/users/permissions")} />
          </SidebarItem>

          <SidebarItem
            icon={Settings}
            label="Ayarlar"
            href="/restoran/settings"
            active={isActive("/restoran/settings")}
          >
            <SidebarItem icon={Settings} label="Restaurant Ayarları" href="/restoran/settings/restaurant" active={isActive("/restoran/settings/restaurant")} />
            <SidebarItem icon={Printer} label="Yazıcı Ayarları" href="/restoran/settings/printers" active={isActive("/restoran/settings/printers")} />
            <SidebarItem icon={Smartphone} label="Android CallerId Ayarları" href="/restoran/settings/callerid" active={isActive("/restoran/settings/callerid")} />
            <SidebarItem icon={Monitor} label="Müşteri Bilgi Ekranı" href="/restoran/settings/customer-display" active={isActive("/restoran/settings/customer-display")} />
          </SidebarItem>

          <SidebarItem
            icon={Grid}
            label="Entegrasyonlar"
            href="/restoran/integrations"
            active={isActive("/restoran/integrations")}
          >
            <SidebarItem icon={Store} label="Uygulama Mağazası" href="/restoran/integrations/app-store" active={isActive("/restoran/integrations/app-store")} />
            <SidebarItem icon={Puzzle} label="Eklenti Merkezi" href="/restoran/integrations/plugins" active={isActive("/restoran/integrations/plugins")} />
          </SidebarItem>

          <SidebarSectionHeader label="Hesabım" />
          <SidebarItem icon={User} label="Hesabım" href="/restoran/account" active={isActive("/restoran/account")} />

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
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-50 dark:bg-slate-900">
          <Switch>
            <Route path="/restoran" component={DashboardHome} />
            <Route path="/restoran/dashboard" component={DashboardHome} />
            <Route path="/restoran/reports" component={() => <PlaceholderPage title="Raporlar" icon={LineChart} />} />
            <Route path="/restoran/products" component={() => <PlaceholderPage title="Ürünler" icon={Box} />} />
            <Route path="/restoran/stock" component={() => <PlaceholderPage title="Stok Yönetimi" icon={ClipboardList} />} />
            <Route path="/restoran/customers" component={() => <PlaceholderPage title="Müşteriler" icon={Users} />} />
            <Route path="/restoran/suppliers" component={() => <PlaceholderPage title="Tedarikçiler" icon={Truck} />} />
            <Route path="/restoran/expenses" component={() => <PlaceholderPage title="Giderler" icon={TrendingDown} />} />
            <Route path="/restoran/account" component={() => <PlaceholderPage title="Hesabım" icon={UserCog} />} />
            <Route path="/restoran/security" component={() => <PlaceholderPage title="Güvenlik" icon={Shield} />} />
            <Route path="/restoran/printers" component={PrinterSettingsPage} />
            <Route path="/restoran/customer-display" component={CustomerDisplaySettingsPage} />
            <Route path="/restoran/integrations" component={Integrations} />
            <Route path="/restoran/integrations/plugins" component={PluginCenter} />
            <Route path="/restoran/integrations/urun-3d-gosterim" component={Urun3DGosterimIntegration} />
            <Route path="/restoran/digital-menu" component={DigitalMenuLayout} />
            <Route path="/restoran/online-menu" component={() => <PlaceholderPage title="Online Menü" icon={MenuIcon} />} />
            <Route path="/restoran/:rest*">
              <RedirectToAccount />
            </Route>
          </Switch>
        </main>
      </div>
    </div>
  );
}

const Header = ({ onMenuClick }: { onMenuClick?: () => void }) => {
  return (
    <header className="h-16 flex-shrink-0 flex items-center justify-between px-4 bg-white border-b border-slate-200 dark:bg-slate-900 dark:border-slate-800">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="md:hidden" onClick={onMenuClick} aria-label="Menüyü aç">
          <MenuIcon className="h-6 w-6 text-slate-500" />
        </Button>
      </div>
      <div className="flex items-center gap-2 sm:gap-4">
        <ThemeToggle />
        <NotificationsPopover />
        <HelpSheet />
        <SupportDialog />
        <UserMenu />
      </div>
    </header>
  );
};

const UserMenu = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center dark:bg-slate-700">
          <User size={18} className="text-slate-500 dark:text-slate-300" />
        </div>
        <div className="hidden md:flex flex-col items-start">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Yönetici</span>
          <span className="text-xs text-slate-500 dark:text-slate-400">Admin</span>
        </div>
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 dark:bg-slate-800 dark:border dark:border-slate-700">
          <Link href="/restoran/account" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700">
            Hesabım
          </Link>
          <Link href="/restoran/settings" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700">
            Ayarlar
          </Link>
          <div className="border-t border-slate-200 my-1 dark:border-slate-700"></div>
          <Link href="#" className="flex items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10">
            <LogOut size={16} />
            Çıkış Yap
          </Link>
        </div>
      )}
    </div>
  );
};
