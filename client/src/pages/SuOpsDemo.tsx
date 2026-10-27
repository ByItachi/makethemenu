// Su dağıtım demo paneli (/su): sidebar'lı, halı paneline benzer tasarım.
// Gerçek API'lere bağlı — özet, siparişler, araç ataması, sürücü yönetimi.
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ClipboardList, Droplets, CheckCircle2, Truck, Package, Search,
  Sun, Moon, ChevronRight, Home, Receipt, Users,
  Wallet, BookUser, BarChart3, MessageSquare, Car, Settings, Menu,
  UserRound,
} from "lucide-react";

interface WaterOrder {
  id: number; orderNo: string; customerName: string; phone: string; addressText: string;
  total: string; filledDelivered: number; emptyTaken: number; scheduledDate: string;
  timeSlot: string; status: string; paymentMethod: string; paidAmount: string; vehicleId: number | null;
}
interface SectorDriver { id: number; sector: string; name: string; phone: string | null; isActive: boolean }
interface CustomerRow {
  name: string; phone: string; address: string; count: number; delivered: number;
  paid: number; due: number; lastDate: string | null;
}
interface KasaEntry { id: number; type: "gelir" | "gider"; amount: number; note: string; method: string; date: string }

const GROUPS = [
  { key: "yeni", label: "Yeni", icon: ClipboardList, stages: ["new"], color: "#e11d48", soft: "bg-rose-50" },
  { key: "hazirlaniyar", label: "Hazırlanıyor", icon: Droplets, stages: ["preparing"], color: "#f59e0b", soft: "bg-amber-50" },
  { key: "teslimatta", label: "Teslimatta", icon: Truck, stages: ["on_route"], color: "#22c55e", soft: "bg-green-50" },
  { key: "teslim", label: "Teslim Edildi", icon: CheckCircle2, stages: ["delivered"], color: "#3b82f6", soft: "bg-blue-50" },
] as const;

const GROUP_STAGES: Record<string, string[]> = Object.fromEntries(
  GROUPS.map((g) => [g.key, [...g.stages]]),
);

const STATUS_LABEL: Record<string, string> = {
  new: "Yeni", preparing: "Hazırlanıyor", on_route: "Yolda",
  delivered: "Teslim Edildi", failed: "Başarısız", cancelled: "İptal",
};

type View = "ana" | "siparisler" | "teslim" | "musteriler" | "kasa" | "veresiye" | "suruculer" | "raporlar" | "sms" | "ayarlar";

const MENU_MAIN: { label: string; icon: typeof Home; view: View }[] = [
  { label: "Ana Sayfa", icon: Home, view: "ana" },
  { label: "Siparişler", icon: Receipt, view: "siparisler" },
  { label: "Teslim Edilenler", icon: CheckCircle2, view: "teslim" },
  { label: "Müşteriler", icon: Users, view: "musteriler" },
];
const MENU_MGMT: { label: string; icon: typeof Home; view?: View; href?: string }[] = [
  { label: "Kasa", icon: Wallet, view: "kasa" },
  { label: "Veresiyeler", icon: BookUser, view: "veresiye" },
  { label: "Sürücüler", icon: UserRound, view: "suruculer" },
  { label: "Raporlar", icon: BarChart3, view: "raporlar" },
  { label: "Toplu SMS", icon: MessageSquare, view: "sms" },
  { label: "Araç Takip", icon: Car, href: "/dashboard/fleet" },
];

const SMS_TEMPLATES: { key: string; label: string; text: string }[] = [
  { key: "geri", label: "Geri kazan", text: "Sayın {adı}, sizi bir süredir göremiyoruz. Yeni dönem su kampanyamız hazır. Size özel fiyat için bize yazabilirsiniz. İletişim: {firmaTelefon}" },
  { key: "tesekkur", label: "Teşekkür / indirim", text: "Sayın {adı}, bizi tercih ettiğiniz için teşekkürler! Bir sonraki siparişinizde %10 indirim sizin. {firma}" },
  { key: "odeme", label: "Ödeme hatırlatma", text: "Sayın {adı}, {borç} tutarında ödemeniz bulunmaktadır. Kolay gelsin. {firma}" },
  { key: "ilk", label: "İlk sipariş", text: "Sayın {adı}, ilk siparişinize özel hoş geldin indirimi sizi bekliyor! {firmaTelefon}" },
  { key: "serbest", label: "Serbest duyuru", text: "{firma} olarak yeniliklerimizi kaçırmayın; ayrıntılar için bize ulaşın." },
];

const fmtTL = (n: number) => n.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function SuOpsDemo() {
  const [authed, setAuthed] = useState<"loading" | boolean>("loading");
  const [orders, setOrders] = useState<WaterOrder[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>("yeni");
  const [expanded, setExpanded] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [view, setView] = useState<View>("ana");
  const [drivers, setDrivers] = useState<SectorDriver[]>([]);
  const [orderDriver, setOrderDriver] = useState<Record<number, number>>({});
  const [kasa, setKasa] = useState<KasaEntry[]>([]);
  const [smsSeg, setSmsSeg] = useState("tumu");
  const [smsTpl, setSmsTpl] = useState("geri");
  const [smsText, setSmsText] = useState(SMS_TEMPLATES[0].text);

  const [, navigate] = useLocation();

  const load = async () => {
    const r = await fetch("/api/ops/water/orders");
    if (r.status === 401) return setAuthed(false);
    setOrders((await r.json()).orders ?? []);
    setAuthed(true);
    const dr = await fetch("/api/ops/drivers?sector=water");
    if (dr.ok) setDrivers((await dr.json()).drivers ?? []);
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setDrawerOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawerOpen]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2200);
  };

  const driverById = useMemo(() => new Map(drivers.map((d) => [d.id, d])), [drivers]);

  const autoAssign = async (o: WaterOrder) => {
    const r = await fetch("/api/ops/drivers/assign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sector: "water", orderNo: o.orderNo }),
    });
    const d = await r.json();
    if (!r.ok) return showToast(d.message ?? "Atama yapılamadı");
    setOrderDriver((s) => ({ ...s, [o.id]: d.driver.id }));
    showToast(`${o.orderNo} → ${d.driver.name} (otomatik atandı)`);
    load();
  };

  const manualAssign = async (o: WaterOrder, driverId: number) => {
    setOrderDriver((s) => ({ ...s, [o.id]: driverId }));
    const r = await fetch("/api/ops/drivers/assign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sector: "water", orderNo: o.orderNo, driverId }),
    });
    if (r.ok) showToast(`${o.orderNo} → ${driverById.get(driverId)?.name ?? "sürücü"} atandı`);
  };

  const customers = useMemo<CustomerRow[]>(() => {
    const map = new Map<string, CustomerRow>();
    for (const o of orders) {
      const key = o.phone || o.customerName;
      const c = map.get(key) ?? {
        name: o.customerName, phone: o.phone, address: o.addressText, count: 0,
        delivered: 0, paid: 0, due: 0, lastDate: null,
      };
      c.count += 1;
      if (o.status === "delivered") c.delivered += 1;
      c.paid += Number(o.paidAmount);
      c.due += Math.max(0, Number(o.total) - Number(o.paidAmount));
      if (o.addressText && !c.address) c.address = o.addressText;
      const d = o.scheduledDate || "";
      if (d && (!c.lastDate || d > c.lastDate)) c.lastDate = d;
      map.set(key, c);
    }
    return Array.from(map.values());
  }, [orders]);

  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const g of GROUPS) map[g.key] = orders.filter((o) => GROUP_STAGES[g.key].includes(o.status)).length;
    return map;
  }, [orders]);

  const kpi = useMemo(() => {
    const ciro = orders.reduce((s, o) => s + Number(o.total), 0);
    const tahsil = orders.reduce((s, o) => s + Number(o.paidAmount), 0);
    const veresiye = customers.reduce((s, c) => s + c.due, 0);
    return { ciro, tahsil, veresiye };
  }, [orders, customers]);

  const groupOrders = (groupKey: string) => {
    const stages = GROUP_STAGES[groupKey];
    return orders
      .filter((o) => stages.includes(o.status))
      .filter((o) =>
        !search ||
        o.customerName.toLowerCase().includes(search.toLowerCase()) ||
        o.orderNo.toLowerCase().includes(search.toLowerCase()) ||
        o.phone.includes(search),
      );
  };

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return { text: "İyi sabahlar", icon: <Sun className="w-5 h-5 text-amber-500" /> };
    if (h < 18) return { text: "İyi günler", icon: <Sun className="w-5 h-5 text-amber-500" /> };
    return { text: "İyi akşamlar", icon: <Moon className="w-5 h-5 text-primary" /> };
  }, []);
  const dateLabel = new Date().toLocaleDateString("tr-TR", { day: "numeric", month: "long", weekday: "long" });

  const smsRecipients = useMemo(() => {
    const days = 90;
    const far = (d: string | null) => !d || (Date.now() - new Date(d).getTime()) > days * 864e5;
    switch (smsSeg) {
      case "uzun": return customers.filter((c) => far(c.lastDate));
      case "sadik": return customers.filter((c) => c.count >= 3);
      case "borclu": return customers.filter((c) => c.due >= 250);
      case "hic": return customers.filter((c) => c.count === 0);
      default: return customers;
    }
  }, [customers, smsSeg]);
  const smsPreview = smsText
    .replaceAll("{adı}", "Ahmet").replaceAll("{firma}", "Demo")
    .replaceAll("{firmaTelefon}", "0555 000 00 00").replaceAll("{borç}", `${fmtTL(250)} ₺`);

  if (authed === "loading") return <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">Yükleniyor...</div>;
  if (!authed) {
    return (
      <div className="min-h-screen bg-[linear-gradient(135deg,#f0f9ff,#e0f2fe)] flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center border border-blue-100">
          <img src="/makethemenu-header.png" alt="Makethemenu" className="h-10 mx-auto mb-4 object-contain" draggable={false} />
          <h1 className="text-2xl font-bold mb-2 text-slate-900">Su Dağıtım Paneli</h1>
          <p className="text-slate-500 mb-6">Bu panel işletme hesabına bağlıdır. Demo için <span className="font-mono">demo@makethemenu.com / demo1234</span> hesabıyla giriş yapın.</p>
          <Button className="bg-primary text-primary-foreground hover:brightness-105" onClick={() => navigate("/giris")}>Giriş Yap</Button>
        </div>
      </div>
    );
  }

  const go = (v: View) => { setView(v); setDrawerOpen(false); setExpanded(null); };

  const sidebarContent = (onNavigate?: () => void) => (
    <>
      <div className="p-4">
        <div className="flex items-center px-2 mb-6">
          <img src="/makethemenu-header.png" alt="Makethemenu" draggable={false}
            className="h-9 w-auto max-w-[160px] object-contain select-none" />
        </div>
        <button
          className="w-full flex items-center justify-between bg-primary text-primary-foreground rounded-xl px-4 py-3 font-medium shadow-lg shadow-primary/30 hover:brightness-105"
          onClick={() => { onNavigate?.(); navigate("/su-siparisi"); }}
        >
          <span className="flex items-center gap-2"><Package className="w-4 h-4" /> Yeni Sipariş</span>
          <kbd className="text-[10px] bg-black/10 rounded px-1.5 py-0.5">Ctrl N</kbd>
        </button>

        <nav className="mt-6 space-y-1">
          {MENU_MAIN.map((m) => (
            <button
              key={m.label}
              className={"w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors " +
                (view === m.view ? "bg-primary/10 text-primary" : "text-slate-600 hover:bg-blue-50")}
              onClick={() => { onNavigate?.(); go(m.view); }}
            >
              <m.icon className="w-4 h-4" /> {m.label}
            </button>
          ))}
        </nav>

        <p className="px-3 mt-6 mb-2 text-[11px] font-semibold tracking-wider text-slate-400">YÖNETİM</p>
        <nav className="space-y-1">
          {MENU_MGMT.map((m) => (
            <button
              key={m.label}
              className={"w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium " +
                (m.view && view === m.view ? "bg-primary/10 text-primary" : "text-slate-600 hover:bg-blue-50")}
              onClick={() => {
                onNavigate?.();
                if (m.href) navigate(m.href);
                else if (m.view) go(m.view);
              }}
            >
              <m.icon className="w-4 h-4" /> {m.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="p-4">
        <button
          className={"w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium " + (view === "ayarlar" ? "bg-primary/10 text-primary" : "text-slate-600 hover:bg-blue-50")}
          onClick={() => { onNavigate?.(); go("ayarlar"); }}
        >
          <Settings className="w-4 h-4" /> Ayarlar
        </button>
        <div className="mt-3 flex items-center gap-3 rounded-xl border border-blue-100 bg-blue-50/60 p-3">
          <div className="w-9 h-9 rounded-full bg-primary/15 text-primary grid place-items-center font-bold">D</div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-800 truncate">Demo</p>
            <p className="text-xs text-slate-400">Deneme Paketi</p>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between px-2 text-[11px] text-slate-400">
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Makethemenu Demo</span>
          <span>Güncel</span>
        </div>
      </div>
    </>
  );

  const pageHeader = (title: string, subtitle?: string, right?: React.ReactNode) => (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
      <div>
        <h1 className="text-2xl lg:text-3xl font-display font-bold text-slate-900">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
      </div>
      {right && <div className="sm:ml-auto">{right}</div>}
    </div>
  );

  const emptyState = (icon: React.ReactNode, title: string, desc?: string, action?: React.ReactNode) => (
    <div className="py-16 text-center">
      <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary grid place-items-center mx-auto mb-3">{icon}</div>
      <p className="font-medium text-slate-700">{title}</p>
      {desc && <p className="text-sm text-slate-400 mt-1">{desc}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );

  // Ana Sayfa
  const renderAna = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        {greeting.icon}
        <div>
          <p className="text-sm text-slate-500">Bugün</p>
          <p className="text-lg font-semibold text-slate-900">{greeting.text}, Demo</p>
          <p className="text-xs text-slate-400">{dateLabel}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500 mb-1">Bugünkü Ciro</p>
          <p className="text-2xl font-bold text-slate-900">₺{fmtTL(kpi.ciro)}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500 mb-1">Tahsil Edilen</p>
          <p className="text-2xl font-bold text-slate-900">₺{fmtTL(kpi.tahsil)}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500 mb-1">Açık Bakiye</p>
          <p className="text-2xl font-bold text-slate-900">₺{fmtTL(kpi.veresiye)}</p>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="font-semibold text-slate-900">Durum Özeti</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {GROUPS.map((g) => (
            <button
              key={g.key}
              onClick={() => { setSelectedGroup(g.key); setView("siparisler"); }}
              className={`rounded-lg border-2 p-3 text-center transition-all ${
                selectedGroup === g.key
                  ? "border-primary bg-primary/5"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <g.icon className="w-5 h-5 mx-auto mb-1 text-slate-600" />
              <p className="text-sm font-medium text-slate-900">{g.label}</p>
              <p className="text-lg font-bold text-primary">{counts[g.key] ?? 0}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  // Siparişler (Kanban)
  const renderSiparisler = () => (
    <div className="space-y-6">
      {pageHeader("Siparişler", "Durum gruplarına göre yönetin")}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Müşteri, sipariş no, telefon..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      <div className="space-y-4">
        {GROUPS.map((g) => {
          const items = groupOrders(g.key);
          return (
            <div key={g.key} className={`rounded-xl border-2 border-slate-200 overflow-hidden ${g.soft}`}>
              <button
                onClick={() => setSelectedGroup(g.key)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-black/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <g.icon className="w-5 h-5" style={{ color: g.color }} />
                  <span className="font-semibold text-slate-900">{g.label}</span>
                  <Badge variant="secondary">{items.length}</Badge>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
              {items.length > 0 && (
                <div className="border-t border-slate-200 divide-y divide-slate-200">
                  {items.map((o) => (
                    <div key={o.id} className="p-4 hover:bg-black/5 transition-colors">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-900 truncate">{o.customerName}</p>
                          <p className="text-xs text-slate-500 font-mono">{o.orderNo}</p>
                        </div>
                        <Badge variant="outline">{STATUS_LABEL[o.status] ?? o.status}</Badge>
                      </div>
                      <p className="text-sm text-slate-600 mb-2">{o.addressText}</p>
                      <p className="text-xs text-slate-500 mb-3">
                        {o.scheduledDate} · {o.timeSlot} · Dolu: {o.filledDelivered} / Boş: {o.emptyTaken} · ₺{Number(o.total).toFixed(2)}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => autoAssign(o)}
                          className="flex-1"
                        >
                          Otomatik Ata
                        </Button>
                        <select
                          className="h-9 rounded-md border border-input bg-background px-2 text-sm flex-1"
                          value={o.vehicleId ?? ""}
                          onChange={(e) => manualAssign(o, Number(e.target.value))}
                        >
                          <option value="">Araç seç...</option>
                          {drivers.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  // Teslim Edilenler
  const renderTeslim = () => {
    const delivered = orders.filter((o) => o.status === "delivered");
    return (
      <div className="space-y-6">
        {pageHeader("Teslim Edilenler", `${delivered.length} sipariş`)}
        {delivered.length === 0 ? (
          emptyState(<CheckCircle2 className="w-6 h-6" />, "Henüz teslim edilmiş sipariş yok")
        ) : (
          <div className="space-y-3">
            {delivered.map((o) => (
              <div key={o.id} className="rounded-lg border border-slate-200 bg-white p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <p className="font-medium text-slate-900">{o.customerName}</p>
                    <p className="text-xs text-slate-500 font-mono">{o.orderNo}</p>
                  </div>
                  <Badge className="bg-green-100 text-green-800">Teslim Edildi</Badge>
                </div>
                <p className="text-sm text-slate-600 mb-1">{o.addressText}</p>
                <p className="text-xs text-slate-500">₺{Number(o.total).toFixed(2)} · {o.paymentMethod}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Müşteriler
  const renderMusteriler = () => (
    <div className="space-y-6">
      {pageHeader("Müşteriler", `${customers.length} müşteri`)}
      {customers.length === 0 ? (
        emptyState(<Users className="w-6 h-6" />, "Henüz müşteri yok")
      ) : (
        <div className="space-y-3">
          {customers.map((c, i) => (
            <div key={i} className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <p className="font-medium text-slate-900">{c.name}</p>
                  <p className="text-xs text-slate-500">{c.phone}</p>
                </div>
                <Badge variant="secondary">{c.count} sipariş</Badge>
              </div>
              <p className="text-sm text-slate-600 mb-2">{c.address}</p>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div><p className="text-slate-500">Teslim</p><p className="font-semibold text-slate-900">{c.delivered}</p></div>
                <div><p className="text-slate-500">Tahsil</p><p className="font-semibold text-slate-900">₺{fmtTL(c.paid)}</p></div>
                <div><p className="text-slate-500">Borç</p><p className="font-semibold text-red-600">₺{fmtTL(c.due)}</p></div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Kasa
  const renderKasa = () => (
    <div className="space-y-6">
      {pageHeader("Kasa", "Gelir ve gider kaydı")}
      {emptyState(<Wallet className="w-6 h-6" />, "Kasa modülü demo verilerle çalışır", "Gerçek kayıtlar sunucuda tutulur")}
    </div>
  );

  // Veresiye
  const renderVeresiye = () => {
    const borclular = customers.filter((c) => c.due > 0);
    return (
      <div className="space-y-6">
        {pageHeader("Veresiyeler", `${borclular.length} müşteri`)}
        {borclular.length === 0 ? (
          emptyState(<BookUser className="w-6 h-6" />, "Veresiye yok")
        ) : (
          <div className="space-y-3">
            {borclular.map((c, i) => (
              <div key={i} className="rounded-lg border border-slate-200 bg-white p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <p className="font-medium text-slate-900">{c.name}</p>
                    <p className="text-xs text-slate-500">{c.phone}</p>
                  </div>
                  <Badge variant="destructive">₺{fmtTL(c.due)}</Badge>
                </div>
                <p className="text-sm text-slate-600">{c.address}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Sürücüler
  const renderSuruculer = () => (
    <div className="space-y-6">
      {pageHeader("Sürücüler", `${drivers.length} sürücü`)}
      {drivers.length === 0 ? (
        emptyState(<UserRound className="w-6 h-6" />, "Henüz sürücü yok")
      ) : (
        <div className="space-y-3">
          {drivers.map((d) => (
            <div key={d.id} className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-slate-900">{d.name}</p>
                  <p className="text-xs text-slate-500">{d.phone}</p>
                </div>
                <Badge variant={d.isActive ? "default" : "secondary"}>{d.isActive ? "Aktif" : "Pasif"}</Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Raporlar
  const renderRaporlar = () => (
    <div className="space-y-6">
      {pageHeader("Raporlar", "İstatistikler ve analizler")}
      {emptyState(<BarChart3 className="w-6 h-6" />, "Raporlar modülü geliştiriliyor")}
    </div>
  );

  // SMS
  const renderSms = () => (
    <div className="space-y-6">
      {pageHeader("Toplu SMS", `${smsRecipients.length} alıcı`)}
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-slate-900 block mb-2">Alıcı Segmenti</label>
          <select
            value={smsSeg}
            onChange={(e) => setSmsSeg(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="tumu">Tüm Müşteriler</option>
            <option value="uzun">90+ Gün Görülmeyenler</option>
            <option value="sadik">3+ Sipariş Verenler</option>
            <option value="borclu">250+ ₺ Borçlular</option>
            <option value="hic">Hiç Sipariş Vermeyenler</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-slate-900 block mb-2">Şablon</label>
          <select
            value={smsTpl}
            onChange={(e) => {
              setSmsTpl(e.target.value);
              const t = SMS_TEMPLATES.find((x) => x.key === e.target.value);
              if (t) setSmsText(t.text);
            }}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            {SMS_TEMPLATES.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-slate-900 block mb-2">Mesaj</label>
          <textarea
            value={smsText}
            onChange={(e) => setSmsText(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            rows={4}
          />
        </div>
        <div className="rounded-lg bg-slate-50 border border-slate-200 p-4">
          <p className="text-xs text-slate-500 mb-2">Ön İzleme</p>
          <p className="text-sm text-slate-900">{smsPreview}</p>
        </div>
        <Button className="w-full">Gönder ({smsRecipients.length} alıcı)</Button>
      </div>
    </div>
  );

  // Ayarlar
  const renderAyarlar = () => (
    <div className="space-y-6">
      {pageHeader("Ayarlar", "Panel ayarları")}
      {emptyState(<Settings className="w-6 h-6" />, "Ayarlar modülü geliştiriliyor")}
    </div>
  );

  const renderContent = () => {
    switch (view) {
      case "ana": return renderAna();
      case "siparisler": return renderSiparisler();
      case "teslim": return renderTeslim();
      case "musteriler": return renderMusteriler();
      case "kasa": return renderKasa();
      case "veresiye": return renderVeresiye();
      case "suruculer": return renderSuruculer();
      case "raporlar": return renderRaporlar();
      case "sms": return renderSms();
      case "ayarlar": return renderAyarlar();
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar — Desktop */}
      <div className="hidden lg:flex w-64 bg-white border-r border-slate-200 flex-col">
        {sidebarContent()}
      </div>

      {/* Drawer — Mobile */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setDrawerOpen(false)}
        />
      )}
      <div
        className={`fixed left-0 top-0 bottom-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col transform transition-transform lg:hidden ${
          drawerOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {sidebarContent(() => setDrawerOpen(false))}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-4 flex items-center justify-between lg:hidden">
          <button
            onClick={() => setDrawerOpen(true)}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Menu className="w-5 h-5 text-slate-600" />
          </button>
          <img src="/makethemenu-header.png" alt="Makethemenu" className="h-6 object-contain" draggable={false} />
          <div className="w-9" />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          <div className="p-4 sm:p-6 max-w-6xl">
            {renderContent()}
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-4 right-4 bg-slate-900 text-white rounded-lg px-4 py-3 text-sm shadow-lg z-50">
          {toast}
        </div>
      )}
    </div>
  );
}
