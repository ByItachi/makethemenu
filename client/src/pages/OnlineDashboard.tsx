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

const COLORS = ['#0ea5e9', '#22c55e'];

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

// TRADITIONAL SUMMARY CARD - Simple design without colored sidebars
const SummaryCard = ({ title, value, subtext, icon: Icon }: any) => (
  <div className="bg-white rounded-lg shadow-sm border border-slate-100 p-6 dark:bg-slate-800 dark:border-slate-700">
    <div className="flex items-center justify-between">
      <div>
        <h3 className="text-slate-500 text-sm font-medium mb-2 dark:text-slate-400">{title}</h3>
        <div className="text-2xl font-bold text-slate-800 dark:text-white mb-1">{value}</div>
        <div className="text-sm text-slate-400 dark:text-slate-500">{subtext}</div>
      </div>
      {Icon && <Icon size={24} className="text-slate-400 dark:text-slate-500" />}
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
      {/* TRADITIONAL Summary Cards - Simple layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <SummaryCard
          title="Bugünkü toplam satış tutarı"
          value="₺0,00"
          subtext="Gün sonu raporu"
          icon={ShoppingBag}
        />
        <SummaryCard
          title="Bugünkü misafir sayısı"
          value="0"
          subtext="Kişi başı ortalama: ₺0,00"
          icon={Users}
        />
        <SummaryCard
          title="Açık adisyon tutarı"
          value="₺0,00"
          subtext="0 Adisyon"
          icon={FileText}
        />
        <SummaryCard
          title="Kapanan adisyon tutarı"
          value="₺0,00"
          subtext="0 Adisyon"
          icon={ChefHat}
        />
      </div>

      {/* TRADITIONAL Charts Row 1 - Simple layout */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100 mb-6 dark:bg-slate-800 dark:border-slate-700">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200">Günlük Satış Miktarları</h3>
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

      {/* TRADITIONAL Charts Row 2 - Simple layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100 dark:bg-slate-800 dark:border-slate-700">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200">Ödemeler</h3>
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
                <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100 dark:bg-slate-800 dark:border-slate-700">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200">Masa Doluluk Oranı</h3>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={densityData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {densityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-4">
            {densityData.map((entry, index) => (
              <div key={entry.name} className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full`} style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                <span className="text-sm text-slate-600 dark:text-slate-400">{entry.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};