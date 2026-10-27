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
  UserRound, Plus, TrendingUp, Image as ImageIcon, Landmark, Star, CreditCard,
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
  const [smsStatus, setSmsStatus] = useState<{ configured: boolean; provider: string | null } | null>(null);
  const [smsSending, setSmsSending] = useState(false);

  const [, navigate] = useLocation();

  const load = async () => {
    const r = await fetch("/api/ops/water/orders");
    if (r.status === 401) return setAuthed(false);
    setOrders((await r.json()).orders ?? []);
    setAuthed(true);
    const dr = await fetch("/api/ops/drivers?sector=water");
    if (dr.ok) setDrivers((await dr.json()).drivers ?? []);
    const sr = await fetch("/api/ops/sms/status");
    if (sr.ok) setSmsStatus(await sr.json());
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

  const gelir = useMemo(
    () => orders.reduce((s, o) => s + Number(o.paidAmount), 0) + kasa.filter((k) => k.type === "gelir").reduce((s, k) => s + k.amount, 0),
    [orders, kasa],
  );
  const gider = useMemo(() => kasa.filter((k) => k.type === "gider").reduce((s, k) => s + k.amount, 0), [kasa]);

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

  const sendBulkSms = async () => {
    const messages = smsRecipients
      .filter((c) => c.phone)
      .map((c) => ({
        phone: c.phone,
        text: smsText
          .replaceAll("{adı}", c.name || "Değerli Müşteri").replaceAll("{firma}", "İşletmeniz")
          .replaceAll("{firmaTelefon}", "").replaceAll("{borç}", `${fmtTL(c.due)} ₺`),
      }));
    if (!messages.length) return showToast("Telefon numarası olan alıcı yok");
    setSmsSending(true);
    try {
      const r = await fetch("/api/ops/sms/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages }),
      });
      const d = await r.json();
      if (!r.ok) return showToast(d.message ?? "Gönderim kuyruğa eklenemedi");
      setSmsStatus({ configured: d.configured, provider: d.provider });
      showToast(
        d.configured
          ? `${d.queued} mesaj kuyruğa alındı, ${d.provider} ile gönderiliyor`
          : `${d.queued} mesaj kuyruğa alındı — gönderim için SMS sağlayıcı gerekli (Ayarlar: .env → SMS_PROVIDER)`,
      );
    } finally {
      setSmsSending(false);
    }
  };

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
  const anaOrders = groupOrders(selectedGroup);
  const selectedG = GROUPS.find((g) => g.key === selectedGroup) ?? GROUPS[0];
  const teslimEdilen = orders.filter((o) => o.status === "delivered").length;
  const aktifSiparis = orders.filter((o) => o.status !== "delivered").length;

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

      {/* Durum şeridi */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-2 sm:p-3 grid grid-cols-2 lg:grid-cols-4 gap-2">
        {GROUPS.map((g) => {
          const selected = selectedGroup === g.key;
          const n = counts[g.key] ?? 0;
          return (
            <button
              key={g.key}
              className={"w-full flex items-center gap-2 sm:gap-3 rounded-xl px-3 sm:px-4 py-3 text-left transition-all border-2 " +
                (selected ? g.soft : "border-transparent hover:bg-slate-50")}
              style={selected ? { borderColor: g.color } : undefined}
              onClick={() => setSelectedGroup(g.key)}
            >
              <span className="w-9 h-9 sm:w-10 sm:h-10 rounded-full grid place-items-center text-white shrink-0" style={{ backgroundColor: g.color }}>
                <g.icon className="w-4 h-4 sm:w-5 sm:h-5" />
              </span>
              <span className="min-w-0">
                <span className="block text-xs sm:text-sm font-semibold text-slate-800">{g.label}</span>
                <span className="text-[11px] sm:text-xs text-slate-400">{n} sipariş</span>
              </span>
              <span className="ml-auto text-xl sm:text-2xl font-bold" style={{ color: g.color }}>{n}</span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-4 lg:gap-5 items-start">
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[360px]">
          <header className="flex items-center justify-between px-4 sm:px-5 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: selectedG.color }} />
              <h2 className="font-semibold text-slate-900">{selectedG.label}</h2>
              <span className="text-xs text-slate-400">{anaOrders.length} kayıt</span>
            </div>
            <span className="flex items-center gap-1.5 text-xs text-green-600 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Canlı
            </span>
          </header>
          <div className="p-4 sm:p-5">
            {!anaOrders.length ? (
              emptyState(<Package className="w-7 h-7" />, "Bu listede sipariş yok", "Yeni sipariş eklediğinizde burada görünecek.")
            ) : (
              <div className="space-y-3">
                {anaOrders.map((o) => (
                  <div key={o.id} className="rounded-xl border border-slate-200 p-4">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900 truncate">{o.customerName}</p>
                        <p className="text-xs text-slate-500 font-mono">{o.orderNo}</p>
                      </div>
                      <Badge variant="outline">{STATUS_LABEL[o.status] ?? o.status}</Badge>
                    </div>
                    <p className="text-sm text-slate-600 mb-1">{o.addressText}</p>
                    <p className="text-xs text-slate-500">
                      {o.scheduledDate} · {o.timeSlot} · Dolu: {o.filledDelivered} / Boş: {o.emptyTaken} · ₺{Number(o.total).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <aside className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
            <h3 className="font-semibold text-slate-900 mb-3">Bugün</h3>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg bg-slate-50 p-2.5">
                <p className="text-[11px] text-slate-400">Ciro</p>
                <p className="text-sm font-bold text-slate-900">{fmtTL(kpi.ciro)} ₺</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-2.5">
                <p className="text-[11px] text-slate-400">Teslim edilen</p>
                <p className="text-sm font-bold text-slate-900">{teslimEdilen}</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-2.5">
                <p className="text-[11px] text-slate-400">Aktif sipariş</p>
                <p className="text-sm font-bold text-slate-900">{aktifSiparis}</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-2.5">
                <p className="text-[11px] text-slate-400">Tahsilat</p>
                <p className="text-sm font-bold text-slate-900">{fmtTL(kpi.tahsil)} ₺</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-slate-900">Son 7 gün</h3>
              <button className="text-xs text-primary font-medium flex items-center" onClick={() => go("raporlar")}>
                Raporlar <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            <p className="text-xs text-slate-400">7 günlük ciro</p>
            <p className="text-2xl font-bold text-slate-900 mb-3">{fmtTL(kpi.ciro)} ₺</p>
            <div className="flex items-end justify-between gap-1.5 h-20">
              {[0.2, 0.5, 0.35, 0.8, 0.6, 0.45, 1].map((h, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full rounded-t bg-primary/15" style={{ height: `${h * 100}%` }} />
                  <span className="text-[9px] text-slate-400">{["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"][i]}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-sm">
              <span className="text-slate-500">İçerideki iş</span>
              <span className="font-semibold text-slate-800">{aktifSiparis} sipariş</span>
            </div>
          </div>

          <button className="w-full rounded-2xl border-2 border-dashed border-slate-200 bg-white/60 p-4 text-sm text-slate-500 hover:border-primary/50"
            onClick={() => navigate("/su-siparisi")}>
            + Müşteri talebi oluşturmak için tıklayın
          </button>
        </aside>
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
      {pageHeader("Kasa", dateLabel,
        <div className="flex items-center gap-2">
          <Button variant="destructive" onClick={() => {
            const n = Number(window.prompt("Gider tutarı (₺)"));
            if (n > 0) setKasa([{ id: Date.now(), type: "gider", amount: n, note: "Gider", method: "Nakit", date: new Date().toISOString().slice(0, 10) }, ...kasa]);
          }}>Gider Ekle</Button>
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => {
            const n = Number(window.prompt("Gelir tutarı (₺)"));
            if (n > 0) setKasa([{ id: Date.now(), type: "gelir", amount: n, note: "Gelir", method: "Nakit", date: new Date().toISOString().slice(0, 10) }, ...kasa]);
          }}>Gelir Ekle</Button>
        </div>)}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-4 items-start">
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[280px] flex flex-col">
          <div className="p-4 sm:p-5 flex-1">
            {!kasa.length && !orders.length ? (
              emptyState(<Wallet className="w-6 h-6" />, "Bu dönemde kasa hareketi yok", "Sipariş tahsilatları otomatik gelir olarak işlenir")
            ) : (
              <div className="space-y-2">
                {orders.map((o) => (
                  <div key={"o" + o.id} className="rounded-xl border border-slate-100 bg-white px-4 py-2.5 flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 grid place-items-center"><TrendingUp className="w-4 h-4" /></span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-700">Sipariş tahsilatı · {o.orderNo}</p>
                      <p className="text-xs text-slate-400">{o.customerName} · Nakit (yöntem takibi demo)</p>
                    </div>
                    <span className="text-sm font-semibold text-emerald-600">+{fmtTL(Number(o.paidAmount))} ₺</span>
                  </div>
                ))}
                {kasa.map((k) => (
                  <div key={k.id} className="rounded-xl border border-slate-100 bg-white px-4 py-2.5 flex items-center gap-3">
                    <span className={"w-8 h-8 rounded-lg grid place-items-center " + (k.type === "gelir" ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600")}>
                      <TrendingUp className="w-4 h-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-700">{k.note}</p>
                      <p className="text-xs text-slate-400">{k.date} · {k.method} · demo kayıt (oturum)</p>
                    </div>
                    <span className={"text-sm font-semibold " + (k.type === "gelir" ? "text-emerald-600" : "text-rose-600")}>
                      {k.type === "gelir" ? "+" : "−"}{fmtTL(k.amount)} ₺
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <footer className="flex flex-wrap items-center gap-x-4 px-4 sm:px-5 py-3 border-t border-slate-100 text-xs text-slate-500 bg-slate-50/60">
            <span>Gelir <b className="text-emerald-600">+{fmtTL(gelir)} ₺</b></span>
            <span>Gider <b className="text-rose-600">−{fmtTL(gider)} ₺</b></span>
            <span className="ml-auto">Dönem neti <b className="text-slate-700">{fmtTL(gelir - gider)} ₺</b></span>
          </footer>
        </section>
        <aside className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
            <p className="text-sm font-semibold text-primary mb-1">Kasadaki para</p>
            <p className="text-3xl font-bold text-slate-900">{fmtTL(gelir - gider)} ₺</p>
            <div className="mt-3 pt-3 border-t border-dashed border-slate-100 space-y-1.5 text-sm">
              <p className="flex justify-between"><span className="text-slate-500">Devreden</span><span className="font-medium">0,00 ₺</span></p>
              <p className="flex justify-between"><span className="text-slate-500">Gelir</span><span className="font-medium text-emerald-600">+{fmtTL(gelir)} ₺</span></p>
              <p className="flex justify-between"><span className="text-slate-500">Gider</span><span className="font-medium text-rose-600">−{fmtTL(gider)} ₺</span></p>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 px-1">Kasa kayıtları bu oturumda tutulur; sayfa yenilenince sıfırlanır. Sipariş tahsilatları her zaman sunucudaki gerçek verilerden gelir.</p>
        </aside>
      </div>
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
      {pageHeader("Sürücüler", "Su servisi sektörüne ait sürücü havuzu — halı ve tüp servislerinin havuzu ayrıdır",
        <Button className="bg-primary text-primary-foreground hover:brightness-105" onClick={async () => {
          const name = window.prompt("Sürücü adı soyadı");
          if (!name || name.trim().length < 2) return;
          const phone = window.prompt("Telefon (opsiyonel)") ?? "";
          const r = await fetch("/api/ops/drivers", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sector: "water", name: name.trim(), phone }),
          });
          if (r.ok) { showToast("Sürücü eklendi"); load(); } else showToast((await r.json()).message ?? "Eklenemedi");
        }}><Plus className="w-4 h-4" /> Sürücü Ekle</Button>)}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 min-h-[280px]">
        <p className="text-xs text-slate-500 mb-3">
          Yeni siparişler <b>otomatik olarak en az yüklü aktif sürücüye</b> atanır; isterseniz sipariş kartından manuel atayın.
        </p>
        {drivers.length === 0 ? (
          emptyState(<UserRound className="w-6 h-6" />, "Sürücü yok", "Sürücü Ekle ile havuza sürücü ekleyin")
        ) : (
          <div className="space-y-2">
            {drivers.map((d) => (
              <div key={d.id} className="rounded-xl border border-slate-100 bg-white px-4 py-3 flex items-center gap-3">
                <span className="w-9 h-9 rounded-full bg-primary/10 text-primary grid place-items-center text-sm font-bold">{d.name.slice(0, 1)}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-800">{d.name} {!d.isActive && <span className="text-xs text-slate-400">(pasif)</span>}</p>
                  <p className="text-xs text-slate-400">{d.phone || "telefon yok"}</p>
                </div>
                <button className="text-[11px] px-2 py-1 rounded-lg border border-slate-200 hover:bg-slate-50"
                  onClick={async () => {
                    await fetch(`/api/ops/drivers/${d.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !d.isActive }) });
                    load();
                  }}>
                  {d.isActive ? "Pasife Al" : "Aktife Al"}
                </button>
                <button className="text-[11px] px-2 py-1 rounded-lg border border-rose-100 text-rose-600 hover:bg-rose-50"
                  onClick={async () => {
                    if (!window.confirm(`${d.name} silinsin mi?`)) return;
                    await fetch(`/api/ops/drivers/${d.id}`, { method: "DELETE" });
                    load();
                  }}>Sil</button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );

  // Raporlar
  const renderRaporlar = () => (
    <div className="space-y-6">
      {pageHeader("Raporlar", dateLabel)}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          ["Dönem cirosu", `${fmtTL(kpi.ciro)} ₺`],
          ["Sipariş", `${orders.length}`],
          ["Müşteri", `${customers.length}`],
          ["Ort. sipariş", `${fmtTL(orders.length ? kpi.ciro / orders.length : 0)} ₺`],
          ["Tahsilat", `${fmtTL(kpi.tahsil)} ₺`],
        ].map(([l, v]) => (
          <div key={l} className="rounded-xl bg-white border border-slate-200 px-4 py-3">
            <p className="text-[11px] text-slate-400">{l}</p>
            <p className="text-lg font-bold text-slate-800 truncate">{v}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-4 items-start">
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 min-h-[260px]">
          <h3 className="font-semibold text-slate-900 mb-3">Durum dağılımı</h3>
          <div className="space-y-2">
            {GROUPS.map((g) => {
              const n = counts[g.key] ?? 0;
              const pct = orders.length ? Math.round((n / orders.length) * 100) : 0;
              return (
                <div key={g.key}>
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>{g.label}</span><span>{n} · %{pct}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: g.color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
        <aside className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
          <h3 className="font-semibold text-slate-900 mb-3">Kasa</h3>
          <p className="flex justify-between text-sm py-1"><span className="text-slate-500">Tahsil edilen</span><span className="font-medium text-emerald-600">{fmtTL(kpi.tahsil)} ₺</span></p>
          <p className="flex justify-between text-sm py-1"><span className="text-slate-500">Gider</span><span className="font-medium text-rose-600">{fmtTL(gider)} ₺</span></p>
          <p className="flex justify-between text-sm py-2 border-t border-slate-100 mt-1"><span className="font-semibold text-slate-700">Net kasa</span><span className="font-bold">{fmtTL(kpi.tahsil - gider)} ₺</span></p>
          <p className="flex justify-between text-xs text-slate-400 border-t border-slate-100 mt-2 pt-2"><span>Veresiye alacak</span><span>{fmtTL(kpi.veresiye)} ₺</span></p>
        </aside>
      </div>
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
        {smsStatus && !smsStatus.configured && (
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">
            SMS sağlayıcı yapılandırılmamış: mesajlar kuyruğa alınır ama gerçekten gönderilmez. Ayarlar için `.env` dosyasında SMS_PROVIDER tanımlanmalı.
          </div>
        )}
        <Button
          className="w-full disabled:opacity-50"
          disabled={!smsRecipients.length || smsSending}
          onClick={sendBulkSms}
        >
          {smsSending ? "Kuyruğa alınıyor..." : smsRecipients.length ? `Gönder (${smsRecipients.length})` : "Alıcı yok"}
        </Button>
      </div>
    </div>
  );

  // Ayarlar
  const setupItems = [
    { l: "Logo", v: "Yüklenmedi", icon: ImageIcon, ok: false },
    { l: "IBAN", v: "Eksik", icon: Landmark, ok: false },
    { l: "SMS sağlayıcı", v: smsStatus?.configured ? smsStatus.provider ?? "aktif" : "Yapılandırılmadı", icon: CreditCard, ok: Boolean(smsStatus?.configured) },
    { l: "Sürücü havuzu", v: `${drivers.length} sürücü`, icon: UserRound, ok: drivers.length > 0 },
    { l: "Müşteri kaydı", v: `${customers.length} müşteri`, icon: Users, ok: customers.length > 0 },
  ];
  const doneCount = setupItems.filter((i) => i.ok).length;
  const renderAyarlar = () => (
    <div className="space-y-6">
      {pageHeader("Ayarlar", undefined,
        <Button variant="outline" onClick={() => showToast("Firma bilgileri düzenleme demo sürümde pasif")}>
          Firma bilgilerini düzenle
        </Button>)}
      <p className="text-xs font-semibold tracking-wider text-slate-400">HESAP DURUMU</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {setupItems.map((i) => (
          <div key={i.l} className={"rounded-2xl border px-4 py-4 bg-white flex items-center gap-3 " + (i.ok ? "border-emerald-100" : "border-slate-200")}>
            <span className={"w-10 h-10 rounded-xl grid place-items-center " + (i.ok ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-primary")}>
              <i.icon className="w-5 h-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] text-slate-400">{i.l}</p>
              <p className="text-sm font-semibold text-slate-800">{i.v}</p>
            </div>
            {!i.ok && <span className="text-rose-500 text-lg">!</span>}
            {i.ok && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
          </div>
        ))}
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-slate-600">{doneCount} / {setupItems.length} tamamlandı</span>
          <span className="font-bold text-primary">%{Math.round((doneCount / setupItems.length) * 100)}</span>
        </div>
        <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(doneCount / setupItems.length) * 100}%` }} />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        {[
          { l: "Siparişler", d: "Tüm su siparişlerini görüntüle", v: "siparisler" as View },
          { l: "SMS Şablonları", d: "Müşteriye giden mesaj metinleri", v: "sms" as View },
          { l: "Sürücüler", d: "Sürücü havuzunu yönet", v: "suruculer" as View },
          { l: "Araç Takip", d: "Filo / GPS takibi", v: null },
        ].map((c) => (
          <button key={c.l} className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-left hover:border-primary/40"
            onClick={() => (c.v ? go(c.v) : navigate("/dashboard/fleet"))}>
            <p className="text-sm font-semibold text-slate-800">{c.l}</p>
            <p className="text-xs text-slate-400 mt-0.5">{c.d}</p>
          </button>
        ))}
      </div>
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
