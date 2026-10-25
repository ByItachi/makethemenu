// Halı yıkama demo paneli (/hali) — site marka renkleriyle tam panelli dashboard.
// Gerçek API: /api/ops/carpet/orders + /api/ops/carpet/items/:id/status (sahte veri yok).
// Kasa/Toplu SMS oturum-içi demo verilerle çalışır (gerçek kayıt gibi gösterilmez). Fason firmaları gerçek API ile kalıcı kaydedilir.
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ClipboardList, Droplets, CheckCircle2, Truck, Package, Search,
  Sun, Moon, ChevronRight, Home, Receipt, Users, Route as RouteIcon,
  CalendarDays, Wallet, BookUser, BarChart3, MessageSquare, Sparkles,
  Car, Settings, X, Menu, Plus, Building2, Image as ImageIcon,
  Landmark, Star, CreditCard, UserRound, TrendingUp, Download,
  ChevronLeft, ChevronRight as ChevR, QrCode, Sofa,
} from "lucide-react";

interface CarpetItem {
  id: number; labelCode: string; carpetType: string; sizeW: number; sizeH: number;
  sqm: string; status: string; colorDesc: string | null; conditionNote: string | null;
}
interface CarpetOrder {
  id: number; orderNo: string; customerName: string; phone: string; addressText: string;
  serviceType: string; category: "hali" | "koltuk"; estimatedPrice: string; approvedPrice: string | null; paidAmount: string;
  status: string; pickupDate: string; timeSlot: string; items: CarpetItem[]; createdAt?: string | null;
  driverId?: number | null;
}
interface SectorDriver { id: number; sector: string; name: string; phone: string | null; isActive: boolean }
interface CustomerRow {
  name: string; phone: string; address: string; count: number; delivered: number;
  paid: number; due: number; lastDate: string | null;
}
interface KasaEntry { id: number; type: "gelir" | "gider"; amount: number; note: string; method: string; date: string }
interface FasonFirm {
  id: number; kind: "yikayan" | "yikatan"; name: string; phone: string;
  address: string | null; discountPercent: string; debt: string;
}

/** 14 aşamalı üretim akışı, panel tarzı 4 gruba kümelenir (renkler işlevsel durum kodlarıdır). */
const GROUPS = [
  { key: "alinacak", label: "Alınacak", icon: ClipboardList, stages: ["requested", "pickup_planned"], color: "#e11d48", soft: "bg-rose-50" },
  { key: "yikamada", label: "Yıkamada", icon: Droplets, stages: ["picked_up", "at_factory", "measured", "wash_queue", "washing", "rinse", "drying", "quality_check"], color: "#f59e0b", soft: "bg-amber-50" },
  { key: "beklemede", label: "Beklemede", icon: CheckCircle2, badge: "Hazır", stages: ["packing", "delivery_queue"], color: "#ea580c", soft: "bg-orange-50" },
  { key: "teslimatta", label: "Teslimatta", icon: Truck, stages: ["on_route", "delivered"], color: "#22c55e", soft: "bg-green-50" },
] as const;

const GROUP_STAGES: Record<string, string[]> = Object.fromEntries(
  GROUPS.map((g) => [g.key, [...g.stages]]),
);

const STAGE_LABEL: Record<string, string> = {
  requested: "Talep", pickup_planned: "Alım Planlandı", picked_up: "Toplandı",
  at_factory: "Fabrikada", measured: "Ölçüldü", wash_queue: "Yıkama Kuyruğu",
  washing: "Yıkanıyor", rinse: "Durulama", drying: "Kurutma",
  quality_check: "Kalite Kontrol", packing: "Paketleme", delivery_queue: "Teslim Kuyruğu",
  on_route: "Yolda", delivered: "Teslim Edildi",
};

type View = "ana" | "siparisler" | "teslim" | "musteriler" | "rota" | "randevu" | "kasa" | "veresiye" | "raporlar" | "sms" | "fason" | "suruculer" | "ayarlar";

const MENU_MAIN: { label: string; icon: typeof Home; view: View }[] = [
  { label: "Ana Sayfa", icon: Home, view: "ana" },
  { label: "Siparişler", icon: Receipt, view: "siparisler" },
  { label: "Teslim Edilenler", icon: CheckCircle2, view: "teslim" },
  { label: "Müşteriler", icon: Users, view: "musteriler" },
  { label: "Rota", icon: RouteIcon, view: "rota" },
  { label: "Randevu Takvimi", icon: CalendarDays, view: "randevu" },
];
const MENU_MGMT: { label: string; icon: typeof Home; view?: View; href?: string }[] = [
  { label: "Kasa", icon: Wallet, view: "kasa" },
  { label: "Veresiyeler", icon: BookUser, view: "veresiye" },
  { label: "Sürücüler", icon: UserRound, view: "suruculer" },
  { label: "Raporlar", icon: BarChart3, view: "raporlar" },
  { label: "Toplu SMS", icon: MessageSquare, view: "sms" },
  { label: "Fason", icon: Sparkles, view: "fason" },
  { label: "Araç Takip", icon: Car, href: "/dashboard/fleet" },
];

const SMS_TEMPLATES: { key: string; label: string; text: string }[] = [
  { key: "geri", label: "Geri kazan", text: "Sayın {adı}, sizi bir süredir göremiyoruz. Yeni dönem yıkama kampanyamız hazır. Size özel fiyat için bize yazabilirsiniz. İletişim: {firmaTelefon}" },
  { key: "yillik", label: "Yıllık bakım", text: "Sayın {adı}, halılarınızın yıllık bakım zamanı geldi. Takviminizi bizimle ayırlayın. {firma}" },
  { key: "tesekkur", label: "Teşekkür / indirim", text: "Sayın {adı}, bizi tercih ettiğiniz için teşekkürler! Bir sonraki yıkamanızda %10 indirim sizin. {firma}" },
  { key: "odeme", label: "Ödeme hatırlatma", text: "Sayın {adı}, {borç} tutarında ödemeniz bulunmaktadır. Kolay gelsin. {firma}" },
  { key: "ilk", label: "İlk sipariş", text: "Sayın {adı}, ilk siparişinize özel hoş geldin indirimi sizi bekliyor! {firmaTelefon}" },
  { key: "serbest", label: "Serbest duyuru", text: "{firma} olarak yeniliklerimizi kaçırmayın; ayrıntılar için bize ulaşın." },
];

const fmtTL = (n: number) => n.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const dayKey = (d: Date) => d.toISOString().slice(0, 10);

export default function HaliOpsDemo() {
  const [authed, setAuthed] = useState<"loading" | boolean>("loading");
  const [orders, setOrders] = useState<CarpetOrder[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>("alinacak");
  const [expanded, setExpanded] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [mode, setMode] = useState<"hali" | "koltuk">("hali");
  const [toast, setToast] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [view, setView] = useState<View>("ana");

  // Demo (oturum-içi) veriler
  const [kasa, setKasa] = useState<KasaEntry[]>([]);
  const [fasonFirms, setFasonFirms] = useState<FasonFirm[]>([]);
  // Sürücü havuzu — halı sektörüne ait ayrı liste (su/tüp panellerinin havuzu bağımsızdır).
  const [drivers, setDrivers] = useState<SectorDriver[]>([]);
  const [orderDriver, setOrderDriver] = useState<Record<number, number>>({});
  const [rotaSel, setRotaSel] = useState<Set<number>>(new Set());
  const [rotaDone, setRotaDone] = useState<number[] | null>(null);
  const [calMonth, setCalMonth] = useState(() => new Date());
  const [calSel, setCalSel] = useState(() => dayKey(new Date()));
  const [smsSeg, setSmsSeg] = useState("tumu");
  const [smsTpl, setSmsTpl] = useState("geri");
  const [smsText, setSmsText] = useState(SMS_TEMPLATES[0].text);
  const [fasonModalOpen, setFasonModalOpen] = useState(false);
  const [fasonForm, setFasonForm] = useState({ kind: "yikayan" as "yikayan" | "yikatan", name: "", phone: "", address: "", discountPercent: "" });
  const [fasonError, setFasonError] = useState("");

  const [, navigate] = useLocation();

  const load = async () => {
    const r = await fetch("/api/ops/carpet/orders");
    if (r.status === 401) return setAuthed(false);
    const data = await r.json();
    setOrders(data.orders ?? []);
    setAuthed(true);
    const dr = await fetch("/api/ops/drivers?sector=carpet");
    if (dr.ok) setDrivers((await dr.json()).drivers ?? []);
    const fs = await fetch("/api/ops/fason");
    if (fs.ok) setFasonFirms((await fs.json()).firms ?? []);
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

  const setStatus = async (item: CarpetItem, status: string) => {
    const res = await fetch(`/api/ops/carpet/items/${item.id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      showToast(`${item.labelCode} → ${STAGE_LABEL[status] ?? status}`);
      load();
    }
  };

  const driverById = useMemo(() => new Map(drivers.map((d) => [d.id, d])), [drivers]);
  const aktifYuk = (driverId: number) =>
    orders.filter((o) => o.status === "on_route" && o.driverId === driverId).length;
  const driverNameFor = (o: CarpetOrder): string | null => {
    const id = o.driverId ?? orderDriver[o.id] ?? null;
    return id ? driverById.get(id)?.name ?? null : null;
  };

  /** Otomatik atama: en az yüklü aktif halı sürücüsü (sunucu seçer). */
  const autoAssign = async (o: CarpetOrder) => {
    const r = await fetch("/api/ops/drivers/assign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sector: "carpet", orderNo: o.orderNo }),
    });
    const d = await r.json();
    if (!r.ok) return showToast(d.message ?? "Atama yapılamadı");
    setOrderDriver((s) => ({ ...s, [o.id]: d.driver.id }));
    showToast(`${o.orderNo} → ${d.driver.name} (otomatik atandı)`);
    load();
  };

  /** Manuel atama: listeden seçilen sürücü. */
  const manualAssign = async (o: CarpetOrder, driverId: number) => {
    setOrderDriver((s) => ({ ...s, [o.id]: driverId }));
    const r = await fetch("/api/ops/drivers/assign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sector: "carpet", orderNo: o.orderNo, driverId }),
    });
    if (r.ok) showToast(`${o.orderNo} → ${driverById.get(driverId)?.name ?? "sürücü"} atandı`);
  };

  /** Teslimata çıkar: atanan sürücüyle teslimat oturumu açılır; sürücü seçilmemişse otomatik atanır. */
  const dispatch = async (o: CarpetOrder) => {
    const driverId = o.driverId ?? orderDriver[o.id] ?? undefined;
    const r = await fetch("/api/driver/delivery/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "carpet", orderNo: o.orderNo, driverId }),
    });
    const d = await r.json();
    if (!r.ok) return showToast(d.message ?? "Teslimat başlatılamadı");
    showToast(d.message ?? "Teslimat başladı");
    load();
  };

  // ---- Türetilmiş veriler (gerçek siparişlerden) ----
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
      c.due += Math.max(0, Number(o.estimatedPrice) - Number(o.paidAmount));
      if (o.addressText && !c.address) c.address = o.addressText;
      const d = o.pickupDate || (o.createdAt ?? "").slice(0, 10);
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
    const ciro = orders.reduce((s, o) => s + Number(o.estimatedPrice), 0);
    const tahsil = orders.reduce((s, o) => s + Number(o.paidAmount), 0);
    const m2 = orders.reduce((s, o) => s + o.items.reduce((x, i) => x + Number(i.sqm), 0), 0);
    const haliler = orders.filter((o) => o.category !== "koltuk").length;
    const koltuklar = orders.length - haliler;
    const veresiye = customers.reduce((s, c) => s + c.due, 0);
    return { ciro, tahsil, m2, haliler, koltuklar, veresiye };
  }, [orders, customers]);

  const groupOrders = (groupKey: string) => {
    const stages = GROUP_STAGES[groupKey];
    return orders
      .filter((o) => stages.includes(o.status))
      .filter((o) => o.category === mode)
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

  // SMS alıcıları
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

  // Randevu takvimi
  const calCells = useMemo(() => {
    const y = calMonth.getFullYear(), m = calMonth.getMonth();
    const first = new Date(y, m, 1);
    const lead = (first.getDay() + 6) % 7; // Pazartesi başlangıç
    const daysIn = new Date(y, m + 1, 0).getDate();
    const cells: (string | null)[] = Array(lead).fill(null);
    for (let d = 1; d <= daysIn; d++) cells.push(dayKey(new Date(Date.UTC(y, m, d))));
    while (cells.length % 7) cells.push(null);
    return cells;
  }, [calMonth]);
  const selDayOrders = orders.filter((o) => (o.pickupDate || "").startsWith(calSel));

  if (authed === "loading") return <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">Yükleniyor…</div>;
  if (!authed) {
    return (
      <div className="min-h-screen bg-[linear-gradient(135deg,#fff7ed,#fffbeb)] flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center border border-orange-100">
          <img src="/makethemenu-header.png" alt="Makethemenu" className="h-10 mx-auto mb-4 object-contain" draggable={false} />
          <h1 className="text-2xl font-bold mb-2 text-slate-900">Halı Yıkama Üretim Paneli</h1>
          <p className="text-slate-500 mb-6">Bu panel işletme hesabına bağlıdır. Demo için <span className="font-mono">demo@makethemenu.com / demo1234</span> hesabıyla giriş yapın.</p>
          <Button className="bg-primary text-primary-foreground hover:brightness-105" onClick={() => navigate("/giris")}>Giriş Yap</Button>
        </div>
      </div>
    );
  }

  const list = groupOrders(view === "ana" ? selectedGroup : selectedGroup);
  const g0 = GROUPS.find((x) => x.key === selectedGroup)!;

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
          onClick={() => { onNavigate?.(); navigate("/hali-yikama"); }}
        >
          <span className="flex items-center gap-2"><Package className="w-4 h-4" /> Yeni Sipariş</span>
          <kbd className="text-[10px] bg-black/10 rounded px-1.5 py-0.5">Ctrl N</kbd>
        </button>

        <nav className="mt-6 space-y-1">
          {MENU_MAIN.map((m) => (
            <button
              key={m.label}
              className={"w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors " +
                (view === m.view ? "bg-primary/10 text-primary" : "text-slate-600 hover:bg-orange-50")}
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
                (m.view && view === m.view ? "bg-primary/10 text-primary" : "text-slate-600 hover:bg-orange-50")}
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
          className={"w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium " + (view === "ayarlar" ? "bg-primary/10 text-primary" : "text-slate-600 hover:bg-orange-50")}
          onClick={() => { onNavigate?.(); go("ayarlar"); }}
        >
          <Settings className="w-4 h-4" /> Ayarlar
        </button>
        <div className="mt-3 flex items-center gap-3 rounded-xl border border-orange-100 bg-orange-50/60 p-3">
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

  const listFooter = (items: { label: string; value: string }[]) => (
    <footer className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 sm:px-5 py-3 border-t border-orange-50 text-xs text-slate-500 bg-orange-50/40">
      {items.map((i) => (
        <span key={i.label}>{i.label} <b className="text-slate-700">{i.value}</b></span>
      ))}
      <span className="ml-auto flex items-center gap-1"><Download className="w-3 h-3" /> Excel'e aktar</span>
    </footer>
  );

  const orderCard = (o: CarpetOrder, showItems = true) => {
    const open = expanded === o.id;
    return (
      <div key={o.id} className="rounded-xl border border-orange-50 bg-white hover:shadow-sm transition-shadow">
        <button className="w-full text-left px-4 py-3" onClick={() => setExpanded(open ? null : o.id)}>
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-full bg-primary/10 text-primary grid place-items-center text-sm font-bold shrink-0">
              {o.customerName.slice(0, 1).toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-slate-800 text-sm flex flex-wrap items-center gap-x-2">
                <span className="font-mono text-xs text-slate-400">{o.orderNo}</span> {o.customerName}
              </p>
              <p className="text-xs text-slate-400 truncate">{o.addressText}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm font-semibold text-slate-700">₺{Number(o.estimatedPrice).toFixed(2)}</p>
              <p className="hidden sm:block text-xs text-slate-400">{o.pickupDate} · {o.items.length} parça</p>
            </div>
            <ChevronRight className={"w-4 h-4 text-slate-300 transition-transform " + (open ? "rotate-90" : "")} />
          </div>
        </button>
        {open && (
          <div className="border-t border-orange-50 px-4 py-3 space-y-2 bg-orange-50/40">
            {!showItems && (
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pb-1">
                <span>Tel: <b className="text-slate-700">{o.phone || "—"}</b></span>
                <span>Alım: <b className="text-slate-700">{o.pickupDate}</b></span>
                {driverNameFor(o) && <span>Sürücü: <b className="text-slate-700">{driverNameFor(o)}</b></span>}
              </div>
            )}
            {o.items.map((i) => (
              <div key={i.id} className="flex flex-col sm:flex-row sm:items-center gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-sm font-semibold text-slate-700">{i.labelCode}</p>
                  <p className="text-xs text-slate-400">
                    {i.carpetType} · {i.sizeW}×{i.sizeH} cm · {Number(i.sqm).toFixed(2)} m²
                    {i.colorDesc ? ` · ${i.colorDesc}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {showItems ? (
                    <select className="h-8 rounded-lg border border-orange-100 bg-white px-2 text-xs"
                      value={i.status} onChange={(e) => setStatus(i, e.target.value)}>
                      {Object.entries(STAGE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  ) : (
                    <Badge className="bg-green-100 text-green-700 hover:bg-green-100">{STAGE_LABEL[i.status] ?? i.status}</Badge>
                  )}
                  <a href={`/api/qr.svg?text=${encodeURIComponent(window.location.origin + "/teslimat/" + i.labelCode)}`}
                    target="_blank" rel="noreferrer" title="QR etiketi"
                    className="p-1.5 rounded-lg border border-orange-100 text-primary hover:bg-orange-50">
                    <QrCode className="w-4 h-4" />
                  </a>
                </div>
              </div>
            ))}
            <p className="text-xs text-slate-400 pt-1 border-t border-orange-50">
              Tahsil: ₺{Number(o.paidAmount).toFixed(2)} · {o.timeSlot}
            </p>
            {/* Sürücü atama + teslimata çıkarma — paketleme/kurye aşamasındaki siparişlerde */}
            {["packing", "delivery_queue"].includes(o.status) && (
              <div className="pt-2 border-t border-orange-50 space-y-2">
                <p className="text-[11px] font-medium text-slate-500">Teslimat sürücüsü</p>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    className="h-8 rounded-lg border border-orange-100 bg-white px-2 text-xs min-w-[150px]"
                    value={o.driverId ?? orderDriver[o.id] ?? ""}
                    onChange={(e) => e.target.value && manualAssign(o, Number(e.target.value))}
                  >
                    <option value="">Sürücü seçin (manuel)</option>
                    {drivers.filter((d) => d.isActive).map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                  <button className="h-8 px-2.5 rounded-lg border border-orange-100 bg-white text-xs hover:bg-orange-50" onClick={() => autoAssign(o)}>
                    Otomatik Ata
                  </button>
                  <button className="h-8 px-2.5 rounded-lg text-white text-xs hover:opacity-90" style={{ backgroundColor: "var(--hl-main)" }} onClick={() => dispatch(o)}>
                    Teslimata Çıkar
                  </button>
                </div>
                {driverNameFor(o) && <p className="text-[11px] text-slate-400">Atanan: <b>{driverNameFor(o)}</b> — sürücü paneli: /surucu/hali</p>}
              </div>
            )}
            {o.status === "on_route" && (
              <div className="pt-2 border-t border-orange-50 flex items-center gap-2 text-xs text-slate-500">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shrink-0" />
                <span className="truncate">Yolda — sürücü: <b>{driverNameFor(o) ?? "atanmadı"}</b>. Sürücü QR okuttuğunda teslim işaretlenir.</span>
                <a className="ml-auto underline shrink-0" href="/surucu/hali" target="_blank" rel="noreferrer">Sürücü paneli</a>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const match = (o: CarpetOrder) =>
    !search ||
    o.customerName.toLowerCase().includes(search.toLowerCase()) ||
    o.orderNo.toLowerCase().includes(search.toLowerCase()) ||
    o.phone.includes(search);

  /** Halı Yıkama / Koltuk Yıkama servis türü seçimi — orders.category alanını gerçekten filtreler. */
  const modeToggle = (
    <div className="flex rounded-xl bg-white/80 border border-orange-100 p-1 shadow-sm self-start w-fit">
      <button className={"px-3 sm:px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 " + (mode === "hali" ? "bg-white text-slate-900 shadow border border-orange-100" : "text-slate-500")} onClick={() => setMode("hali")}>
        <Droplets className="w-4 h-4 text-primary" /> Halı Yıkama
      </button>
      <button className={"px-3 sm:px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 " + (mode === "koltuk" ? "bg-white text-slate-900 shadow border border-orange-100" : "text-slate-500")} onClick={() => setMode("koltuk")}>
        <Sofa className="w-4 h-4 text-primary" /> Koltuk Yıkama
      </button>
    </div>
  );

  // ================= GÖRÜNÜMLER =================
  const viewAna = (
    <>
      {pageHeader(`${greeting.text}`, dateLabel, modeToggle)}
      {/* Durum şeridi */}
      <div className="bg-white/90 backdrop-blur rounded-2xl border border-orange-100 shadow-sm p-2 sm:p-3 grid grid-cols-2 lg:grid-cols-4 gap-2">
        {GROUPS.map((g, gi) => {
          const selected = selectedGroup === g.key;
          const n = counts[g.key] ?? 0;
          return (
            <div key={g.key} className="relative">
              <button
                className={"w-full flex items-center gap-2 sm:gap-3 rounded-xl px-3 sm:px-4 py-3 text-left transition-all border-2 " +
                  (selected ? g.soft : "border-transparent hover:bg-slate-50")}
                style={selected ? { borderColor: g.color } : undefined}
                onClick={() => { setSelectedGroup(g.key); setMode("hali"); }}
              >
                <span className="w-9 h-9 sm:w-10 sm:h-10 rounded-full grid place-items-center text-white shrink-0" style={{ backgroundColor: g.color }}>
                  <g.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                </span>
                <span className="min-w-0">
                  <span className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-800">
                    {g.label}
                    {"badge" in g && g.badge && (
                      <Badge className="text-[10px] bg-amber-100 text-amber-700 border-0 px-1.5 py-0">{g.badge}</Badge>
                    )}
                  </span>
                  <span className="text-[11px] sm:text-xs text-slate-400">{n} sipariş</span>
                </span>
                <span className="ml-auto text-xl sm:text-2xl font-bold" style={{ color: g.color }}>{n}</span>
              </button>
              {gi < GROUPS.length - 1 && (
                <span className="hidden lg:grid absolute -right-2.5 top-1/2 -translate-y-1/2 z-10 w-5 h-5 rounded-full bg-white border border-orange-100 shadow-sm place-items-center">
                  <ChevR className="w-3 h-3 text-slate-400" />
                </span>
              )}
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-4 lg:gap-5 items-start">
        <section className="bg-white/95 backdrop-blur rounded-2xl border border-orange-100 shadow-sm overflow-hidden min-h-[360px]">
          <header className="flex items-center justify-between px-4 sm:px-5 py-4 border-t-0 border-b border-orange-50">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: g0.color }} />
              <h2 className="font-semibold text-slate-900">{mode === "koltuk" ? "Koltuk Yıkama" : g0.label}</h2>
              <span className="text-xs text-slate-400">{list.length} kayıt</span>
            </div>
            <span className="flex items-center gap-1.5 text-xs text-green-600 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Canlı
            </span>
          </header>
          <div className="p-4 sm:p-5">
            {!list.length ? (
              mode === "koltuk"
                ? emptyState(<Sofa className="w-7 h-7" />, "Koltuk yıkama siparişi yok", "Koltuk siparişleri de bu panelin aynı akışında yönetilir.")
                : emptyState(<Package className="w-7 h-7" />, "Bu listede sipariş yok", "Yeni sipariş eklediğinizde burada görünecek.")
            ) : (
              <div className="space-y-3">{list.map((o) => orderCard(o))}</div>
            )}
          </div>
        </section>

        <aside className="space-y-4">
          <div className="bg-white/95 backdrop-blur rounded-2xl border border-orange-100 shadow-sm p-4">
            <h3 className="font-semibold text-slate-900 mb-3">Bugün</h3>
            <div className="grid grid-cols-2 gap-2">
              <MiniStat label="Ciro" value={`${fmtTL(kpi.ciro)} ₺`} />
              <MiniStat label="Teslim edilen" value={String(orders.filter((o) => o.status === "delivered").length)} />
              <MiniStat label="Aktif sipariş" value={String(orders.filter((o) => o.status !== "delivered" && o.status !== "requested").length)} />
              <MiniStat label="Tahsilat" value={`${fmtTL(kpi.tahsil)} ₺`} />
            </div>
          </div>

          <div className="bg-white/95 backdrop-blur rounded-2xl border border-orange-100 shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-slate-900">Son 7 gün</h3>
              <button className="text-xs text-primary font-medium flex items-center" onClick={() => go("raporlar")}>
                Raporlar <ChevR className="w-3 h-3" />
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
            <div className="mt-3 pt-3 border-t border-orange-50 flex items-center justify-between text-sm">
              <span className="text-slate-500">İçerideki iş</span>
              <span className="font-semibold text-slate-800">{kpi.haliler + kpi.koltuklar - orders.filter((o) => o.status === "delivered").length} sipariş</span>
            </div>
          </div>

          <button className="w-full rounded-2xl border-2 border-dashed border-orange-200 bg-white/60 p-4 text-sm text-slate-500 hover:border-primary/50"
            onClick={() => navigate("/hali-yikama")}>
            + Müşteri talebi oluşturmak için tıklayın
          </button>
        </aside>
      </div>
    </>
  );

  const viewSiparisler = (
    <>
      {pageHeader("Siparişler", "Tüm aşamalardaki siparişlerinizi tek ekrandan yönetin", modeToggle)}
      <div className="bg-white/90 rounded-2xl border border-orange-100 shadow-sm p-2 sm:p-3 grid grid-cols-2 lg:grid-cols-5 gap-2">
        {GROUPS.map((g) => {
          const n = orders.filter((o) => GROUP_STAGES[g.key].includes(o.status) && o.category === mode).length;
          const selected = selectedGroup === g.key;
          return (
            <button key={g.key}
              className={"flex items-center gap-2 rounded-xl px-3 py-2.5 text-left border-2 " + (selected ? g.soft : "border-transparent hover:bg-slate-50")}
              style={selected ? { borderColor: g.color } : undefined}
              onClick={() => setSelectedGroup(g.key)}>
              <span className="w-8 h-8 rounded-lg grid place-items-center text-white" style={{ backgroundColor: g.color }}>
                <g.icon className="w-4 h-4" />
              </span>
              <span className="text-xs sm:text-sm font-semibold text-slate-800">{g.label}</span>
              <span className="ml-auto font-bold" style={{ color: g.color }}>{n}</span>
            </button>
          );
        })}
        <button className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-left border-2 border-transparent hover:bg-slate-50"
          onClick={() => go("teslim")}>
          <span className="w-8 h-8 rounded-lg grid place-items-center bg-slate-100 text-slate-500"><CheckCircle2 className="w-4 h-4" /></span>
          <span className="text-xs sm:text-sm font-semibold text-slate-700">Tamamlananlar</span>
        </button>
      </div>

      <section className="bg-white/95 rounded-2xl border border-orange-100 shadow-sm overflow-hidden min-h-[320px] flex flex-col">
        <div className="px-4 sm:px-5 pt-4 flex flex-wrap items-center gap-2 border-b border-orange-50 pb-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input className="w-full h-9 rounded-lg border border-orange-100 bg-white pl-9 pr-3 text-xs outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="Sipariş no veya isim" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <span className="ml-auto text-[11px] text-slate-400 hidden md:inline">↑↓ gez · Enter aç</span>
        </div>
        <div className="p-4 sm:p-5 flex-1">
          {!list.length ? (
            mode === "koltuk"
              ? emptyState(<Sofa className="w-7 h-7" />, "Koltuk siparişi yok", "Koltuk siparişleri de bu panelin aynı akışında yönetilir.")
              : emptyState(<Package className="w-7 h-7" />, "Sipariş Yok", "Yeni sipariş için kenar çubuğundaki 'Yeni Sipariş' düğmesini kullanın.")
          ) : (
            <div className="space-y-3">{list.filter(match).map((o) => orderCard(o))}</div>
          )}
        </div>
        {listFooter([
          { label: "Sipariş:", value: String(list.length) },
          { label: "Adet:", value: String(list.reduce((s, o) => s + o.items.length, 0)) },
          { label: "Tutar:", value: `${fmtTL(list.reduce((s, o) => s + Number(o.estimatedPrice), 0))} ₺` },
        ])}
      </section>
    </>
  );

  const delivered = orders.filter((o) => o.status === "delivered" && match(o));
  const viewTeslim = (
    <>
      {pageHeader("Teslim Edilenler", `${delivered.length} sipariş`)}
      <section className="bg-white/95 rounded-2xl border border-orange-100 shadow-sm overflow-hidden min-h-[320px] flex flex-col">
        <div className="px-4 sm:px-5 pt-4 pb-3 border-b border-orange-50 flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input className="w-full h-9 rounded-lg border border-orange-100 bg-white pl-9 pr-3 text-xs outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="Sipariş no, müşteri adı veya telefon" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="flex rounded-lg border border-orange-100 overflow-hidden text-xs">
            {["Bugün", "Bu hafta", "Bu ay", "Tümü"].map((p, i) => (
              <button key={p} className={"px-3 py-1.5 font-medium " + (i === 3 ? "bg-primary text-primary-foreground" : "text-slate-500 hover:bg-orange-50")}>
                {p}
              </button>
            ))}
          </div>
        </div>
        <div className="p-4 sm:p-5 flex-1">
          {!delivered.length ? (
            emptyState(<Package className="w-7 h-7" />, "Bu dönemde teslim edilen sipariş yok", "Teslim edilen siparişler burada listelenir.")
          ) : (
            <div className="space-y-3">{delivered.map((o) => orderCard(o, false))}</div>
          )}
        </div>
        {listFooter([{ label: "Teslim:", value: String(delivered.length) }, { label: "Tahsil:", value: `${fmtTL(delivered.reduce((s, o) => s + Number(o.paidAmount), 0))} ₺` }])}
      </section>
    </>
  );

  const viewMusteriler = (
    <>
      {pageHeader("Müşteriler", `${customers.length} kayıtlı müşteri`)}
      <div className="bg-white/90 rounded-2xl border border-orange-100 shadow-sm p-2 sm:p-3 grid grid-cols-2 lg:grid-cols-4 gap-2">
        {[
          { label: "Tüm müşteriler", n: customers.length, icon: Users, color: "#3b82f6" },
          { label: "Borçlu", n: customers.filter((c) => c.due > 0).length, icon: CreditCard, color: "#e11d48" },
          { label: "Siparişi yok", n: customers.filter((c) => c.count === 0).length, icon: Package, color: "#f59e0b" },
          { label: "Adresi yok", n: customers.filter((c) => !c.address).length, icon: UserRound, color: "#22c55e" },
        ].map((c) => (
          <div key={c.label} className="flex items-center gap-3 rounded-xl px-4 py-3 bg-white border border-orange-100">
            <span className="w-9 h-9 rounded-lg grid place-items-center text-white shrink-0" style={{ backgroundColor: c.color }}>
              <c.icon className="w-4 h-4" />
            </span>
            <span className="text-sm font-semibold text-slate-700">{c.label}</span>
            <span className="ml-auto font-bold" style={{ color: c.color }}>{c.n}</span>
          </div>
        ))}
      </div>

      <section className="bg-white/95 rounded-2xl border border-orange-100 shadow-sm overflow-hidden min-h-[300px] flex flex-col">
        <div className="px-4 sm:px-5 pt-4 pb-3 border-b border-orange-50">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input className="w-full h-9 rounded-lg border border-orange-100 bg-white pl-9 pr-3 text-xs outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="İsim, telefon veya adres ara" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>
        <div className="p-4 sm:p-5 flex-1">
          {!customers.length ? (
            emptyState(<Users className="w-7 h-7" />, "Henüz müşteri yok", "Müşteri kayıtları siparişlerle birlikte oluşur.")
          ) : (
            <div className="space-y-2">
              {customers
                .filter((c) => !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search) || c.address.toLowerCase().includes(search.toLowerCase()))
                .map((c) => (
                  <div key={c.phone + c.name} className="rounded-xl border border-orange-50 bg-white px-4 py-3 flex items-center gap-3">
                    <span className="w-9 h-9 rounded-full bg-primary/10 text-primary grid place-items-center text-sm font-bold shrink-0">
                      {c.name.slice(0, 1).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-slate-800 text-sm">{c.name}</p>
                      <p className="text-xs text-slate-400 truncate">{c.phone} {c.address ? `· ${c.address}` : ""}</p>
                    </div>
                    <div className="text-right text-xs shrink-0">
                      <p className="text-slate-600">{c.count} sipariş · {c.delivered} teslim</p>
                      {c.due > 0 && <p className="text-rose-600 font-semibold">Borç: {fmtTL(c.due)} ₺</p>}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
        {listFooter([{ label: "Müşteri:", value: String(customers.length) }])}
      </section>
    </>
  );

  const rotaPool = orders.filter((o) => ["delivery_queue", "on_route"].includes(o.status) && o.category === mode);
  const viewRota = (
    <>
      {pageHeader("Teslimat Rotası", "Rotaya eklemek istediğini seç",
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:ml-auto">
          {modeToggle}
          <Button className="bg-primary text-primary-foreground hover:brightness-105" onClick={() => {
            if (!rotaSel.size) return showToast("Önce listeden sipariş seçin");
            setRotaDone(Array.from(rotaSel)); setRotaSel(new Set()); showToast("Rota oluşturuldu (demo)");
          }}>
            <Plus className="w-4 h-4" /> Rota Oluştur
          </Button>
        </div>)}
      <section className="bg-white/95 rounded-2xl border border-orange-100 shadow-sm p-4 sm:p-5 min-h-[300px]">
        {!rotaPool.length ? (
          mode === "koltuk"
            ? emptyState(<Sofa className="w-7 h-7" />, "Koltuk Teslimatı Yok", "Teslim kuyruğuna alınmış koltuk siparişi olmadan rota oluşturulamaz.")
            : emptyState(<RouteIcon className="w-7 h-7" />, "Teslimat Yok", "Teslim kuyruğuna alınmış sipariş olmadan rota oluşturulamaz.")
        ) : (
          <div className="space-y-2">
            {rotaDone && <p className="text-xs text-green-600 font-medium mb-2">Rota: {rotaDone.length} teslimat sıraya alındı (demo)</p>}
            {rotaPool.map((o) => (
              <label key={o.id} className="flex items-center gap-3 rounded-xl border border-orange-50 bg-white px-4 py-3 cursor-pointer hover:border-primary/40">
                <input type="checkbox" className="accent-primary" checked={rotaSel.has(o.id)}
                  onChange={(e) => {
                    const s = new Set(rotaSel);
                    e.target.checked ? s.add(o.id) : s.delete(o.id);
                    setRotaSel(s);
                  }} />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-slate-800 text-sm"><span className="font-mono text-xs text-slate-400">{o.orderNo}</span> {o.customerName}</p>
                  <p className="text-xs text-slate-400 truncate">{o.addressText}</p>
                </div>
                <span className="text-xs text-slate-500">{o.timeSlot}</span>
              </label>
            ))}
          </div>
        )}
      </section>
    </>
  );

  const viewRandevu = (
    <>
      {pageHeader("Randevu takvimi", "Alım / teslim randevuları",
        <div className="flex items-center gap-2">
          <button className="p-2 rounded-lg border border-orange-100 bg-white" onClick={() => setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() - 1, 1))}><ChevronLeft className="w-4 h-4" /></button>
          <span className="px-3 py-2 text-sm font-semibold text-slate-700">{calMonth.toLocaleDateString("tr-TR", { month: "long", year: "numeric" })}</span>
          <button className="p-2 rounded-lg border border-orange-100 bg-white" onClick={() => setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() + 1, 1))}><ChevR className="w-4 h-4" /></button>
          <Button variant="outline" className="border-orange-100 bg-white text-slate-600" onClick={() => { setCalMonth(new Date()); setCalSel(dayKey(new Date())); }}>Bugün</Button>
        </div>)}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-4 lg:gap-5 items-start">
        <section className="bg-white/95 rounded-2xl border border-orange-100 shadow-sm p-3 overflow-hidden">
          <div className="grid grid-cols-7 text-center text-[10px] font-semibold text-slate-400 mb-1">
            {["PZT", "SAL", "ÇAR", "PER", "CUM", "CMT", "PAZ"].map((d) => <span key={d} className="py-1">{d}</span>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {calCells.map((k, i) => {
              if (!k) return <div key={"b" + i} className="h-16 sm:h-20 rounded-lg bg-orange-50/40" />;
              const dayOrders = orders.filter((o) => (o.pickupDate || "").startsWith(k));
              const isToday = k === dayKey(new Date());
              const isSel = k === calSel;
              return (
                <button key={k}
                  className={"h-16 sm:h-20 rounded-lg border text-left p-1.5 transition-colors " +
                    (isSel ? "border-primary bg-primary/5" : "border-orange-50 hover:bg-orange-50/50") +
                    (isToday ? " ring-1 ring-primary/40" : "")}
                  onClick={() => setCalSel(k)}>
                  <span className={"inline-grid place-items-center w-5 h-5 rounded-full text-[10px] font-bold " + (isToday ? "bg-primary text-white" : "text-slate-600")}>
                    {Number(k.slice(8, 10))}
                  </span>
                  {dayOrders.length > 0 && (
                    <span className="mt-1 block text-[9px] font-medium text-primary truncate">{dayOrders.length} randevu</span>
                  )}
                </button>
              );
            })}
          </div>
        </section>
        <aside className="bg-white/95 rounded-2xl border border-orange-100 shadow-sm p-4 min-h-[300px]">
          <p className="text-lg font-bold text-slate-900">
            {new Date(calSel + "T00:00:00").toLocaleDateString("tr-TR", { day: "numeric", month: "long" })}
          </p>
          <p className="text-xs text-slate-400 mb-3">{selDayOrders.length ? `${selDayOrders.length} randevu` : "Randevu yok"}</p>
          <div className="space-y-2">
            {selDayOrders.map((o) => (
              <div key={o.id} className="rounded-xl border border-orange-50 bg-orange-50/40 px-3 py-2">
                <p className="text-sm font-medium text-slate-800">{o.timeSlot} · {o.customerName}</p>
                <p className="text-xs text-slate-400 truncate">{o.orderNo} · {o.addressText}</p>
              </div>
            ))}
            {!selDayOrders.length && (
              <p className="text-xs text-slate-400 border-t border-orange-50 pt-3">Siparişlerin alım/teslim saatleri burada görünür.</p>
            )}
          </div>
        </aside>
      </div>
    </>
  );

  const gelir = kpi.tahsil + kasa.filter((k) => k.type === "gelir").reduce((s, k) => s + k.amount, 0);
  const gider = kasa.filter((k) => k.type === "gider").reduce((s, k) => s + k.amount, 0);
  const viewKasa = (
    <>
      {pageHeader("Kasa", dateLabel,
        <div className="flex items-center gap-2">
          <Button variant="destructive" className="bg-rose-600 hover:bg-rose-700 text-white" onClick={() => {
            const n = Number(window.prompt("Gider tutarı (₺)"));
            if (n > 0) setKasa([{ id: Date.now(), type: "gider", amount: n, note: "Gider", method: "Nakit", date: dayKey(new Date()) }, ...kasa]);
          }}>Gider Ekle</Button>
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => {
            const n = Number(window.prompt("Gelir tutarı (₺)"));
            if (n > 0) setKasa([{ id: Date.now(), type: "gelir", amount: n, note: "Gelir", method: "Nakit", date: dayKey(new Date()) }, ...kasa]);
          }}>Gelir Ekle</Button>
        </div>)}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-4 lg:gap-5 items-start">
        <section className="bg-white/95 rounded-2xl border border-orange-100 shadow-sm overflow-hidden min-h-[300px] flex flex-col">
          <div className="px-4 sm:px-5 pt-4 pb-3 border-b border-orange-50 flex flex-wrap items-center gap-2 text-xs">
            <span className="px-2.5 py-1.5 rounded-lg bg-primary/10 text-primary font-semibold">Tümü {kasa.length + orders.length}</span>
            <span className="px-2.5 py-1.5 rounded-lg text-slate-500">Sipariş tahsilatı {orders.length}</span>
            <span className="px-2.5 py-1.5 rounded-lg text-slate-500">Manuel {kasa.length}</span>
          </div>
          <div className="p-4 sm:p-5 flex-1">
            {!kasa.length && !orders.length ? (
              emptyState(<Wallet className="w-7 h-7" />, "Bu dönemde kasa hareketi yok.", "Sipariş tahsilatları otomatik gelir olarak işler.")
            ) : (
              <div className="space-y-2">
                {orders.map((o) => (
                  <div key={"o" + o.id} className="rounded-xl border border-orange-50 bg-white px-4 py-2.5 flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 grid place-items-center"><TrendingUp className="w-4 h-4" /></span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-700">Sipariş tahsilatı · {o.orderNo}</p>
                      <p className="text-xs text-slate-400">{o.customerName} · Nakit (yöntem takibi demo)</p>
                    </div>
                    <span className="text-sm font-semibold text-emerald-600">+{fmtTL(Number(o.paidAmount))} ₺</span>
                  </div>
                ))}
                {kasa.map((k) => (
                  <div key={k.id} className="rounded-xl border border-orange-50 bg-white px-4 py-2.5 flex items-center gap-3">
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
          <footer className="flex flex-wrap items-center gap-x-4 px-4 sm:px-5 py-3 border-t border-orange-50 text-xs text-slate-500 bg-orange-50/40">
            <span>Gelir <b className="text-emerald-600">+{fmtTL(gelir)} ₺</b></span>
            <span>Gider <b className="text-rose-600">−{fmtTL(gider)} ₺</b></span>
            <span className="ml-auto">Dönem neti <b className="text-slate-700">{fmtTL(gelir - gider)} ₺</b></span>
          </footer>
        </section>

        <aside className="space-y-4">
          <div className="bg-white/95 rounded-2xl border border-orange-100 shadow-sm p-4">
            <p className="text-sm font-semibold text-primary mb-1">Kasadaki para</p>
            <p className="text-3xl font-bold text-slate-900">{fmtTL(gelir - gider)} ₺</p>
            <div className="mt-3 pt-3 border-t border-dashed border-orange-100 space-y-1.5 text-sm">
              <p className="flex justify-between"><span className="text-slate-500">Devreden</span><span className="font-medium">0,00 ₺</span></p>
              <p className="flex justify-between"><span className="text-slate-500">Gelir</span><span className="font-medium text-emerald-600">+{fmtTL(gelir)} ₺</span></p>
              <p className="flex justify-between"><span className="text-slate-500">Gider</span><span className="font-medium text-rose-600">−{fmtTL(gider)} ₺</span></p>
            </div>
          </div>
          <div className="bg-white/95 rounded-2xl border border-orange-100 shadow-sm p-4">
            <p className="text-xs font-semibold tracking-wider text-slate-400 mb-3">ÖDEME YÖNTEMLERİ</p>
            {[["Nakit", "#22c55e", gelir], ["Kredi Kartı", "#3b82f6", 0], ["IBAN", "#f97316", 0]].map(([l, c, v]) => (
              <p key={l as string} className="flex items-center gap-2 text-sm py-1">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c as string }} />
                <span className="text-slate-600">{l as string}</span>
                <span className="ml-auto font-medium">{fmtTL(v as number)} ₺</span>
              </p>
            ))}
            <p className="mt-2 text-[11px] text-slate-400">Yöntem ayrımı demo sürümde otomatik Nakit işler.</p>
          </div>
        </aside>
      </div>
    </>
  );

  const borclular = customers.filter((c) => c.due > 0);
  const bucket = (c: CustomerRow) => {
    if (!c.lastDate) return 0;
    const d = (Date.now() - new Date(c.lastDate).getTime()) / 864e5;
    return d < 30 ? 1 : d < 90 ? 2 : 3;
  };
  const viewVeresiye = (
    <>
      {pageHeader("Veresiyeler", `${borclular.length} kayıt · ${customers.length} müşteri`)}
      <div className="bg-white/90 rounded-2xl border border-orange-100 shadow-sm p-2 sm:p-3 grid grid-cols-2 lg:grid-cols-4 gap-2">
        {[
          { label: "Toplam alacak", v: kpi.veresiye, c: "#e11d48" },
          { label: "0-30 gün", v: borclular.filter((c) => bucket(c) === 1).reduce((s, c) => s + c.due, 0), c: "#3b82f6" },
          { label: "30-90 gün", v: borclular.filter((c) => bucket(c) === 2).reduce((s, c) => s + c.due, 0), c: "#f59e0b" },
          { label: "90+ gün", v: borclular.filter((c) => bucket(c) === 3).reduce((s, c) => s + c.due, 0), c: "#ef4444" },
        ].map((b, i) => (
          <div key={b.label} className={"rounded-xl px-4 py-3 bg-white border-2 " + (i === 0 ? "border-rose-200" : "border-transparent")}>
            <p className="text-xs text-slate-500">{b.label}</p>
            <p className="text-xl font-bold" style={{ color: b.c }}>{fmtTL(b.v)} ₺</p>
          </div>
        ))}
      </div>
      <section className="bg-white/95 rounded-2xl border border-orange-100 shadow-sm overflow-hidden min-h-[280px] flex flex-col">
        <div className="p-4 sm:p-5 flex-1">
          {!borclular.length ? (
            emptyState(<CheckCircle2 className="w-7 h-7" />, "Alacak yok", "Tüm müşterileriniz ödemesini tamamlamış.")
          ) : (
            <div className="space-y-2">
              {borclular.map((c) => (
                <div key={c.phone + c.name} className="rounded-xl border border-orange-50 bg-white px-4 py-3 flex items-center gap-3">
                  <span className="w-9 h-9 rounded-full bg-rose-50 text-rose-600 grid place-items-center text-sm font-bold">{c.name.slice(0, 1)}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-800">{c.name}</p>
                    <p className="text-xs text-slate-400">{c.phone} · son: {c.lastDate ?? "—"}</p>
                  </div>
                  <span className="text-sm font-semibold text-rose-600">{fmtTL(c.due)} ₺</span>
                </div>
              ))}
            </div>
          )}
        </div>
        {listFooter([{ label: "Müşteri:", value: String(borclular.length) }, { label: "Toplam alacak:", value: `${fmtTL(kpi.veresiye)} ₺` }])}
      </section>
    </>
  );

  const viewRaporlar = (
    <>
      {pageHeader("Raporlar", dateLabel)}
      <div className="bg-white/90 rounded-2xl border border-orange-100 shadow-sm p-2 sm:p-3 grid grid-cols-2 lg:grid-cols-5 gap-2">
        {[
          ["Bu dönemin cirosu", `${fmtTL(kpi.ciro)} ₺`],
          ["Sipariş", `${orders.length} · ${kpi.haliler} halı · ${kpi.koltuklar} koltuk`],
          ["Müşteri", `${customers.length}`],
          ["Ort. sipariş", `${fmtTL(orders.length ? kpi.ciro / orders.length : 0)} ₺`],
          ["Tahsilat", `${fmtTL(kpi.tahsil)} ₺`],
        ].map(([l, v]) => (
          <div key={l} className="rounded-xl bg-white border border-orange-100 px-4 py-3">
            <p className="text-[11px] text-slate-400">{l}</p>
            <p className="text-lg font-bold text-slate-800 truncate">{v}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-4 lg:gap-5 items-start">
        <section className="bg-white/95 rounded-2xl border border-orange-100 shadow-sm p-4 min-h-[280px]">
          <h3 className="font-semibold text-slate-900 mb-3">Ciro trendi</h3>
          <div className="flex items-end justify-between gap-1.5 h-40">
            {[0.2, 0.5, 0.35, 0.8, 0.6, 0.45, 1].map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                <div className="w-full rounded-t bg-primary/15" style={{ height: `${h * 100}%` }} />
                <span className="text-[9px] text-slate-400">{["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"][i]}</span>
              </div>
            ))}
          </div>
        </section>
        <aside className="space-y-4">
          <div className="bg-white/95 rounded-2xl border border-orange-100 shadow-sm p-4">
            <h3 className="font-semibold text-slate-900 mb-3">Kasa</h3>
            <p className="flex justify-between text-sm py-1"><span className="text-slate-500">Tahsil edilen</span><span className="font-medium text-emerald-600">{fmtTL(kpi.tahsil)} ₺</span></p>
            <p className="flex justify-between text-sm py-1"><span className="text-slate-500">Gider</span><span className="font-medium text-rose-600">{fmtTL(gider)} ₺</span></p>
            <p className="flex justify-between text-sm py-2 border-t border-orange-50 mt-1"><span className="font-semibold text-slate-700">Net kasa</span><span className="font-bold">{fmtTL(kpi.tahsil - gider)} ₺</span></p>
          </div>
          <div className="bg-white/95 rounded-2xl border border-orange-100 shadow-sm p-4">
            <h3 className="font-semibold text-slate-900 mb-3">Operasyon durumu</h3>
            {GROUPS.map((g) => (
              <p key={g.key} className="flex items-center gap-2 text-sm py-1">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: g.color }} />
                <span className="text-slate-600">{g.label}</span>
                <span className="ml-auto font-medium">{counts[g.key]}</span>
              </p>
            ))}
            <p className="flex justify-between text-xs text-slate-400 border-t border-orange-50 mt-2 pt-2"><span>Dönem üretimi</span><span>{kpi.m2.toFixed(2)} m²</span></p>
            <p className="flex justify-between text-xs text-slate-400"><span>Veresiye alacak</span><span>{fmtTL(kpi.veresiye)} ₺</span></p>
          </div>
        </aside>
      </div>
    </>
  );

  const viewSms = (
    <>
      {pageHeader("Toplu SMS", "Kime gönderilsin?",
        <div className="flex items-center gap-2">
          <span className="px-3 py-2 rounded-xl bg-white border border-orange-100 text-sm font-semibold text-slate-700">💬 5 SMS</span>
          <Button variant="outline" className="border-orange-100 bg-white text-slate-600" onClick={() => showToast("Kredi yükleme demo sürümde pasif")}>
            <Plus className="w-4 h-4" /> Kredi Yükle
          </Button>
        </div>)}
      <div className="grid grid-cols-1 xl:grid-cols-[280px_1fr_300px] gap-4 lg:gap-5 items-start">
        <section className="bg-white/95 rounded-2xl border border-orange-100 shadow-sm p-4">
          <p className="text-xs font-semibold tracking-wider text-slate-400 mb-3">KİTLE</p>
          <div className="space-y-1">
            {[
              { k: "uzun", l: "Uzun süredir gelmeyenler", d: "Son siparişi 90+ gün önce" },
              { k: "sadik", l: "Sadık müşteriler", d: "3 ve üzeri sipariş verenler" },
              { k: "borclu", l: "Ödemesi kalanlar", d: "250 ₺+ borcu olanlar" },
              { k: "hic", l: "Hiç sipariş vermeyenler", d: "Henüz siparişi olmayanlar" },
              { k: "tumu", l: "Tüm müşteriler", d: "Genel duyurular" },
            ].map((s) => {
              const n =
                s.k === "uzun" ? customers.filter((c) => !c.lastDate || Date.now() - new Date(c.lastDate).getTime() > 90 * 864e5).length :
                s.k === "sadik" ? customers.filter((c) => c.count >= 3).length :
                s.k === "borclu" ? customers.filter((c) => c.due >= 250).length :
                s.k === "hic" ? customers.filter((c) => c.count === 0).length :
                customers.length;
              return (
                <button key={s.k}
                  className={"w-full text-left rounded-xl px-3 py-2.5 border-2 " + (smsSeg === s.k ? "border-primary bg-primary/5" : "border-transparent hover:bg-orange-50")}
                  onClick={() => setSmsSeg(s.k)}>
                  <span className="flex items-center justify-between text-sm font-medium text-slate-700">
                    {s.l} <span className={smsSeg === s.k ? "text-primary" : "text-slate-400"}>{n}</span>
                  </span>
                  <span className="text-[11px] text-slate-400">{s.d}</span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="bg-white/95 rounded-2xl border border-orange-100 shadow-sm p-4">
          <p className="text-xs font-semibold tracking-wider text-slate-400 mb-2">ŞABLON</p>
          <div className="flex flex-wrap gap-2 mb-3">
            {SMS_TEMPLATES.map((t) => (
              <button key={t.key}
                className={"px-3 py-1.5 rounded-lg text-xs font-medium border " + (smsTpl === t.key ? "bg-primary/10 border-primary text-primary" : "border-orange-100 bg-white text-slate-500 hover:bg-orange-50")}
                onClick={() => { setSmsTpl(t.key); setSmsText(t.text); }}>
                {t.label}
              </button>
            ))}
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-semibold tracking-wider">MESAJ</span>
            <span>{smsText.length} karakter</span>
          </div>
          <textarea className="w-full min-h-[160px] rounded-xl border border-orange-100 bg-white p-3 text-sm outline-none focus:ring-2 focus:ring-primary/40"
            value={smsText} onChange={(e) => setSmsText(e.target.value)} />
          <div className="mt-2 flex flex-wrap gap-2">
            {[["Müşteri adı", "{adı}"], ["Firma", "{firma}"], ["Firma tel", "{firmaTelefon}"], ["Borç", "{borç}"]].map(([l, v]) => (
              <button key={l} className="px-2.5 py-1 rounded-lg bg-orange-50 border border-orange-100 text-[11px] font-medium text-primary"
                onClick={() => setSmsText(smsText + " " + v)}>+ {l}</button>
            ))}
          </div>
        </section>

        <aside className="bg-white/95 rounded-2xl border border-orange-100 shadow-sm p-4 flex flex-col min-h-[320px]">
          <p className="text-xs font-semibold tracking-wider text-slate-400 mb-3">MÜŞTERİ BÖYLE GÖRECEK</p>
          <div className="rounded-xl border border-orange-100 bg-white p-3 flex-1">
            <p className="flex items-center gap-2 text-sm font-semibold text-slate-800 mb-2">
              <span className="w-7 h-7 rounded-full bg-primary/15 text-primary grid place-items-center text-xs font-bold">D</span> Demo
            </p>
            <p className="rounded-xl bg-slate-100 px-3 py-2 text-xs text-slate-600">{smsPreview}</p>
            <p className="mt-1 text-[10px] text-slate-400">şimdi</p>
          </div>
          <div className="mt-3 pt-3 border-t border-orange-50 text-xs space-y-1">
            <p className="flex justify-between"><span className="text-slate-500">Alıcı</span><b className="text-slate-700">{smsRecipients.length}</b></p>
            <p className="flex justify-between"><span className="text-slate-500">Kullanılacak kredi</span><b className="text-slate-700">{smsRecipients.length} kredi</b></p>
            <p className="flex justify-between"><span className="text-slate-500">Gönderim sonrası kalan</span><b className="text-slate-700">{Math.max(0, 5 - smsRecipients.length)} kredi</b></p>
          </div>
          <Button className="mt-3 w-full bg-primary text-primary-foreground hover:brightness-105 disabled:opacity-50"
            disabled={!smsRecipients.length}
            onClick={() => showToast("Demo: SMS gönderimi bu panelde pasif (kredi/SMS sağlayıcı gerekir)")}>
            {smsRecipients.length ? `Gönder (${smsRecipients.length})` : "Alıcı yok"}
          </Button>
        </aside>
      </div>
    </>
  );

  const fasonSubmit = async () => {
    setFasonError("");
    if (fasonForm.name.trim().length < 2) return setFasonError("Firma adı en az 2 karakter olmalı");
    if (fasonForm.phone.trim().length < 7) return setFasonError("Telefon gerekli");
    const r = await fetch("/api/ops/fason", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: fasonForm.kind,
        name: fasonForm.name.trim(),
        phone: fasonForm.phone.trim(),
        address: fasonForm.address.trim(),
        discountPercent: Number(fasonForm.discountPercent || 0),
      }),
    });
    const data = await r.json();
    if (!r.ok) return setFasonError(data.message ?? "Firma eklenemedi");
    setFasonModalOpen(false);
    setFasonForm({ kind: "yikayan", name: "", phone: "", address: "", discountPercent: "" });
    showToast("Fason firması eklendi");
    load();
  };

  const viewFason = (
    <>
      {pageHeader("Fason Yönetimi", `Toplam borcum: ${fmtTL(fasonFirms.reduce((s, f) => s + Number(f.debt), 0))} ₺`,
        <Button className="bg-primary text-primary-foreground hover:brightness-105" onClick={() => { setFasonError(""); setFasonModalOpen(true); }}>
          <Plus className="w-4 h-4" /> Firma Ekle
        </Button>)}
      <section className="bg-white/95 rounded-2xl border border-orange-100 shadow-sm p-4 sm:p-5 min-h-[300px]">
        {!fasonFirms.length ? (
          emptyState(<Sparkles className="w-7 h-7" />, "Henüz firma eklenmemiş", "Yukarıdaki Firma Ekle ile başlayın")
        ) : (
          <div className="space-y-2">
            {fasonFirms.map((f) => (
              <div key={f.id} className="rounded-xl border border-orange-50 bg-white px-4 py-3 flex items-center gap-3">
                <span className="w-9 h-9 rounded-full bg-primary/10 text-primary grid place-items-center text-sm font-bold">{f.name.slice(0, 1)}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-800">{f.name}</p>
                  <p className="text-xs text-slate-400 truncate">
                    {f.kind === "yikayan" ? "Fason yıkayan" : "Fason yıkatan"} · {f.phone}
                    {f.address ? ` · ${f.address}` : ""}
                    {Number(f.discountPercent) > 0 ? ` · %${Number(f.discountPercent).toFixed(0)} indirim` : ""}
                  </p>
                </div>
                <span className="text-sm font-semibold text-slate-600 shrink-0">{fmtTL(Number(f.debt))} ₺</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {fasonModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setFasonModalOpen(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <h3 className="text-lg font-bold text-slate-800">Yeni Firma</h3>
              <button className="p-1 rounded-lg hover:bg-slate-100" onClick={() => setFasonModalOpen(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <div className="px-5 space-y-4 pb-5">
              <div className="flex rounded-xl bg-orange-50 p-1 text-sm font-medium">
                {(["yikayan", "yikatan"] as const).map((k) => (
                  <button key={k}
                    className={"flex-1 h-9 rounded-lg transition-colors " + (fasonForm.kind === k ? "bg-white shadow-sm text-slate-800" : "text-slate-500")}
                    onClick={() => setFasonForm({ ...fasonForm, kind: k })}>
                    {k === "yikayan" ? "Fason Yıkayan" : "Fason Yıkatan"}
                  </button>
                ))}
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600">Firma Adı *</label>
                <input className="mt-1 w-full h-10 rounded-lg border border-orange-100 px-3 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                  value={fasonForm.name} onChange={(e) => setFasonForm({ ...fasonForm, name: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600">Telefon *</label>
                <input className="mt-1 w-full h-10 rounded-lg border border-orange-100 px-3 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                  value={fasonForm.phone} onChange={(e) => setFasonForm({ ...fasonForm, phone: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600">Adres</label>
                <textarea className="mt-1 w-full rounded-lg border border-orange-100 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40" rows={2}
                  value={fasonForm.address} onChange={(e) => setFasonForm({ ...fasonForm, address: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600">Genel İndirim (%)</label>
                <input type="number" min={0} max={100} placeholder="0" className="mt-1 w-full h-10 rounded-lg border border-orange-100 px-3 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                  value={fasonForm.discountPercent} onChange={(e) => setFasonForm({ ...fasonForm, discountPercent: e.target.value })} />
                <p className="text-[11px] text-slate-400 mt-1">Özel fiyatı girilmemiş ürünler normal fiyattan bu oranda indirimli hesaplanır. Boş bırakılabilir.</p>
              </div>
              {fasonError && <p className="text-xs text-rose-600">{fasonError}</p>}
            </div>
            <div className="flex justify-end gap-2 px-5 py-4 border-t border-orange-50">
              <Button variant="outline" onClick={() => setFasonModalOpen(false)}>Vazgeç</Button>
              <Button className="bg-primary text-primary-foreground hover:brightness-105" onClick={fasonSubmit}>Kaydet</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );

  const viewSuruculer = (
    <>
      {pageHeader("Sürücüler", "Halı sektörüne ait sürücü havuzu — su ve tüp servislerinin havuzu ayrıdır",
        <Button className="bg-primary text-primary-foreground hover:brightness-105" onClick={async () => {
          const name = window.prompt("Sürücü adı soyadı");
          if (!name || name.trim().length < 2) return;
          const phone = window.prompt("Telefon (opsiyonel)") ?? "";
          const r = await fetch("/api/ops/drivers", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sector: "carpet", name: name.trim(), phone }),
          });
          if (r.ok) { showToast("Sürücü eklendi"); load(); } else showToast((await r.json()).message ?? "Eklenemedi");
        }}><Plus className="w-4 h-4" /> Sürücü Ekle</Button>)}
      <section className="bg-white/95 rounded-2xl border border-orange-100 shadow-sm p-4 sm:p-5 min-h-[300px]">
        <p className="text-xs text-slate-500 mb-3">
          Yeni siparişler <b>otomatik olarak en az yüklü aktif sürücüye</b> atanır; isterseniz sipariş kartından manuel atayın.
          Sürücü görevi /surucu/hali panelinden yürütür: zorunlu GPS + QR ile teslim.
        </p>
        {!drivers.length ? (
          emptyState(<UserRound className="w-7 h-7" />, "Sürücü yok", "Sürücü Ekle ile havuza sürücü ekleyin")
        ) : (
          <div className="space-y-2">
            {drivers.map((d) => (
              <div key={d.id} className="rounded-xl border border-orange-50 bg-white px-4 py-3 flex items-center gap-3">
                <span className="w-9 h-9 rounded-full bg-primary/10 text-primary grid place-items-center text-sm font-bold">{d.name.slice(0, 1)}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-800">{d.name} {d.isActive ? "" : <span className="text-xs text-slate-400">(pasif)</span>}</p>
                  <p className="text-xs text-slate-400">{d.phone || "telefon yok"} · aktif görev: {aktifYuk(d.id)}</p>
                </div>
                <button className="text-[11px] px-2 py-1 rounded-lg border border-orange-100 hover:bg-orange-50"
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
    </>
  );

  const setupItems = [
    { l: "Logo", v: "Yüklenmedi", icon: ImageIcon, ok: false },
    { l: "IBAN", v: "Eksik", icon: Landmark, ok: false },
    { l: "Google yorum linki", v: "Eksik", icon: Star, ok: false },
    { l: "SMS kredisi", v: "5 kredi var", icon: CreditCard, ok: true },
    { l: "Otomatik mesajlar", v: "4 / 15 açık", icon: MessageSquare, ok: true },
    { l: "Personel", v: `${customers.length} müşteri kayıtlı`, icon: UserRound, ok: customers.length > 0 },
  ];
  const doneCount = setupItems.filter((i) => i.ok).length;
  const viewAyarlar = (
    <>
      {pageHeader("Ayarlar", undefined,
        <Button variant="outline" className="border-orange-100 bg-white text-slate-600" onClick={() => showToast("Firma bilgileri düzenleme demo sürümde pasif")}>
          Firma bilgilerini düzenle
        </Button>)}
      <p className="text-xs font-semibold tracking-wider text-slate-400">HESAP DURUMU</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {setupItems.map((i) => (
          <div key={i.l} className={"rounded-2xl border px-4 py-4 bg-white flex items-center gap-3 " + (i.ok ? "border-emerald-100" : "border-orange-100")}>
            <span className={"w-10 h-10 rounded-xl grid place-items-center " + (i.ok ? "bg-emerald-50 text-emerald-600" : "bg-orange-50 text-primary")}>
              <i.icon className="w-5 h-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] text-slate-400">{i.l}</p>
              <p className="text-sm font-semibold text-slate-800">{i.v}</p>
            </div>
            {!i.ok && <span className="text-rose-500 text-lg">!</span>}
            {i.ok && <span className="text-emerald-500"><CheckCircle2 className="w-5 h-5" /></span>}
          </div>
        ))}
      </div>
      <p className="text-xs font-semibold tracking-wider text-slate-400 mt-2">KURULUM DURUMU</p>
      <div className="bg-white/95 rounded-2xl border border-orange-100 shadow-sm p-4">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-slate-600">{doneCount} / {setupItems.length} tamamlandı</span>
          <span className="font-bold text-primary">%{Math.round((doneCount / setupItems.length) * 100)}</span>
        </div>
        <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(doneCount / setupItems.length) * 100}%` }} />
        </div>
      </div>
      <p className="text-xs font-semibold tracking-wider text-slate-400 mt-2">SIK KULLANILANLAR</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        {[
          { l: "Ürünler", d: "Hizmetler ve fiyat listesi", v: "siparisler" as View },
          { l: "Fiş Tasarımı", d: "Müşteriye verilen fiş ve yazıcı", v: null },
          { l: "SMS Şablonları", d: "Müşteriye giden mesaj metinleri", v: "sms" as View },
          { l: "Genel Ayarlar", d: "Ek özellikler, bildirimler, dil…", v: null },
        ].map((c) => (
          <button key={c.l} className="rounded-2xl border border-orange-100 bg-white px-4 py-4 text-left hover:border-primary/40"
            onClick={() => (c.v ? go(c.v) : showToast(`"${c.l}" demo sürümde pasif`))}>
            <p className="text-sm font-semibold text-slate-800">{c.l}</p>
            <p className="text-xs text-slate-400 mt-0.5">{c.d}</p>
          </button>
        ))}
      </div>
    </>
  );

  const views: Record<View, React.ReactNode> = {
    ana: viewAna,
    siparisler: viewSiparisler,
    teslim: viewTeslim,
    musteriler: viewMusteriler,
    rota: viewRota,
    randevu: viewRandevu,
    kasa: viewKasa,
    veresiye: viewVeresiye,
    raporlar: viewRaporlar,
    sms: viewSms,
    fason: viewFason,
    suruculer: viewSuruculer,
    ayarlar: viewAyarlar,
  };

  return (
    <div className="min-h-screen flex bg-[linear-gradient(135deg,#fff7ed_0%,#fffbeb_55%,#ffedd5_100%)]">
      {/* Sol Sidebar — masaüstü */}
      <aside className="hidden lg:flex w-60 shrink-0 bg-white/95 backdrop-blur flex-col justify-between border-r border-orange-100">
        {sidebarContent()}
      </aside>

      {/* Sol Sidebar — mobil çekmece */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDrawerOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-72 max-w-[85%] bg-white flex flex-col justify-between shadow-2xl overflow-y-auto">
            <button className="absolute right-3 top-3 p-2 rounded-lg text-slate-500 hover:bg-orange-50 z-10"
              onClick={() => setDrawerOpen(false)} aria-label="Menüyü kapat">
              <X className="w-5 h-5" />
            </button>
            {sidebarContent(() => setDrawerOpen(false))}
          </div>
        </div>
      )}

      {/* Ana içerik */}
      <main className="flex-1 min-w-0 p-3 sm:p-4 lg:p-6 space-y-4 lg:space-y-5">
        {/* Üst bar */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button className="lg:hidden p-2.5 rounded-xl bg-white/90 border border-orange-100 shadow-sm"
            onClick={() => setDrawerOpen(true)} aria-label="Menüyü aç">
            <Menu className="w-5 h-5 text-slate-700" />
          </button>
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              className="w-full h-11 rounded-xl border border-orange-100 bg-white/90 pl-10 pr-14 text-sm shadow-sm outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="Sipariş, müşteri veya telefon ara"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <kbd className="hidden sm:block absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 border border-slate-200 rounded px-1.5 py-0.5">Ctrl K</kbd>
          </div>
          <div className="ml-auto hidden md:flex items-center gap-2">
            <span className="items-center gap-1.5 rounded-full bg-white/90 border border-orange-100 px-3 py-1.5 text-xs font-medium text-slate-600">
              📦 {orders.length} Sipariş
            </span>
            <span className="items-center gap-1.5 rounded-full bg-white/90 border border-orange-100 px-3 py-1.5 text-xs font-medium text-slate-600">
              🔥 6 Gün
            </span>
          </div>
        </div>

        {views[view]}
      </main>

      {toast && (
        <div className="fixed bottom-6 inset-x-4 sm:inset-x-auto sm:right-6 z-[60] sm:z-50 rounded-xl bg-slate-900 text-white px-4 py-2.5 shadow-xl text-sm text-center sm:text-left">
          {toast}
        </div>
      )}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-orange-50/60 border border-orange-50 px-3 py-2.5">
      <p className="text-[11px] text-slate-400">{label}</p>
      <p className="text-base font-bold text-slate-800">{value}</p>
    </div>
  );
}
