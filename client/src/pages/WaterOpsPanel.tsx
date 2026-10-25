// Su Servisi (/su-servisi) & Tüp Servisi (/tup-servisi) — işletme sevkiyat paneli.
// Aynı mantık: sipariş seç → araç ata → "Teslimata Çıkar" → sürücüde canlı konum otomatik açılır (kapatılamaz).
// Veri: gerçek water_orders (kind= damacana|tup). QR etiketleri sipariş no ile basılır.
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Droplets, Flame, Truck, Package, QrCode, Navigation, Radio, Phone, MapPin, X, Menu, Home,
} from "lucide-react";

interface WaterOrder {
  id: number; orderNo: string; kind: string; customerName: string; phone: string; addressText: string;
  items: { name: string; qty: number; unitPrice: number; depositFee: number }[];
  total: string; paidAmount: string; status: string; scheduledDate: string; timeSlot: string;
  paymentMethod: string; vehicleId: number | null; driverId?: number | null;
}
interface Vehicle { id: number; plate: string; driverName: string | null; isActive: boolean }
interface SectorDriver { id: number; sector: string; name: string; phone: string | null; isActive: boolean }

const FLOW = [
  { key: "new", label: "Yeni", color: "#3b82f6" },
  { key: "preparing", label: "Hazırlanıyor", color: "#f59e0b" },
  { key: "on_route", label: "Teslimatta", color: "#ea580c" },
  { key: "delivered", label: "Teslim Edildi", color: "#22c55e" },
];
const STATUS_LABEL: Record<string, string> = {
  new: "Yeni", preparing: "Hazırlanıyor", on_route: "Teslimatta",
  delivered: "Teslim Edildi", failed: "Başarısız", cancelled: "İptal",
};

export default function WaterOpsPanel({ kind }: { kind: "damacana" | "tup" }) {
  const [orders, setOrders] = useState<WaterOrder[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  // Bu sektörün (su veya tüp) kendi sürücü havuzu — halı panelinin havuzundan bağımsızdır.
  const [drivers, setDrivers] = useState<SectorDriver[]>([]);
  const [showDrivers, setShowDrivers] = useState(false);
  const [stage, setStage] = useState("new");
  const [authed, setAuthed] = useState<"loading" | boolean>("loading");
  const [toast, setToast] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selVehicle, setSelVehicle] = useState<Record<number, number>>({});
  const [selDriver, setSelDriver] = useState<Record<number, number>>({});
  const [, navigate] = useLocation();

  const label = kind === "tup" ? "Tüp Servisi" : "Su Servisi";
  const icon = kind === "tup" ? Flame : Droplets;
  const prefix = kind === "tup" ? "TP" : "SU";
  const driverSector = kind === "tup" ? "tube" : "water";
  const driverPanelHref = kind === "tup" ? "/surucu/tup" : "/surucu/su";

  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(""), 2400); };

  const load = async () => {
    const [o, v, dr] = await Promise.all([
      fetch("/api/ops/water/orders").then((r) => (r.status === 401 ? { orders: [] as WaterOrder[], unauth: true } : r.json().then((d) => ({ orders: d.orders as WaterOrder[], unauth: false })))),
      fetch("/api/ops/vehicles").then((r) => (r.status === 401 ? { vehicles: [] as Vehicle[] } : r.json())),
      fetch(`/api/ops/drivers?sector=${driverSector}`).then((r) => (r.ok ? r.json() : { drivers: [] })),
    ]);
    if (o.unauth) return setAuthed(false);
    setOrders(o.orders.filter((x) => (x.kind ?? "damacana") === kind));
    setVehicles(v.vehicles ?? []);
    setDrivers(dr.drivers ?? []);
    setAuthed(true);
  };
  useEffect(() => { load(); }, [kind]);

  const counts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const f of FLOW) m[f.key] = orders.filter((o) => o.status === f.key).length;
    return m;
  }, [orders]);

  const assign = async (o: WaterOrder) => {
    const vehicleId = selVehicle[o.id];
    if (!vehicleId) return showToast("Önce araç seçin");
    const r = await fetch(`/api/ops/water/orders/${o.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vehicleId, status: "preparing" }),
    });
    if (r.ok) { showToast(`${o.orderNo} → ${vehicles.find((v) => v.id === vehicleId)?.plate}`); load(); }
  };

  const driverById = useMemo(() => new Map(drivers.map((d) => [d.id, d])), [drivers]);

  /** Otomatik atama: sunucu bu sektörün en az yüklü aktif sürücüsünü seçer. */
  const autoAssign = async (o: WaterOrder) => {
    const r = await fetch("/api/ops/drivers/assign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sector: driverSector, orderNo: o.orderNo }),
    });
    const d = await r.json();
    if (!r.ok) return showToast(d.message ?? "Atama yapılamadı");
    setSelDriver((s) => ({ ...s, [o.id]: d.driver.id }));
    showToast(`${o.orderNo} → ${d.driver.name} (otomatik atandı)`);
    load();
  };

  /** Manuel atama: listeden seçilen sürücü. */
  const manualAssign = async (o: WaterOrder, driverId: number) => {
    setSelDriver((s) => ({ ...s, [o.id]: driverId }));
    const r = await fetch("/api/ops/drivers/assign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sector: driverSector, orderNo: o.orderNo, driverId }),
    });
    if (r.ok) showToast(`${o.orderNo} → ${driverById.get(driverId)?.name ?? "sürücü"} atandı`);
  };

  const dispatch = async (o: WaterOrder) => {
    const vehicleId = selVehicle[o.id] ?? o.vehicleId ?? undefined;
    // Atanmış sürücü ile çık; atanmamışsa sunucu otomatik sürücü atar.
    const driverId = o.driverId ?? selDriver[o.id] ?? undefined;
    const r = await fetch("/api/driver/delivery/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: kind === "tup" ? "tube" : "water", orderNo: o.orderNo, vehicleId, driverId }),
    });
    const d = await r.json();
    if (!r.ok) return showToast(d.message ?? "Başlatılamadı");
    if (vehicleId) {
      await fetch(`/api/ops/water/orders/${o.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vehicleId, status: "on_route" }),
      });
    }
    showToast(d.message);
    load();
  };

  if (authed === "loading") return <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">Yükleniyor…</div>;
  if (!authed) {
    return (
      <div className="min-h-screen bg-[linear-gradient(135deg,#fff7ed,#fffbeb)] flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-xl border border-orange-100 p-8 max-w-md text-center">
          <img src="/makethemenu-header.png" alt="Makethemenu" className="h-10 mx-auto mb-4 object-contain" draggable={false} />
          <h1 className="text-2xl font-bold mb-2 text-slate-900">{label} Paneli</h1>
          <p className="text-slate-500 mb-6">Bu panel işletme hesabına bağlıdır. Demo: <span className="font-mono">demo@makethemenu.com / demo1234</span></p>
          <Button className="bg-primary text-primary-foreground hover:brightness-105" onClick={() => navigate("/giris")}>Giriş Yap</Button>
        </div>
      </div>
    );
  }

  const driverNameFor = (o: WaterOrder): string | null => {
    const id = o.driverId ?? selDriver[o.id] ?? null;
    return id ? driverById.get(id)?.name ?? null : null;
  };

  const list = orders.filter((o) => o.status === stage);
  const DriverLink = (
    <a href={driverPanelHref} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 text-white px-4 py-2.5 text-sm font-medium hover:bg-slate-800">
      <Navigation className="w-4 h-4" /> Sürücü Paneli
    </a>
  );

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,#fff7ed_0%,#fffbeb_55%,#ffedd5_100%)]">
      {/* Üst bar (mobil menü dahil) */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-orange-100">
        <div className="max-w-6xl mx-auto px-3 sm:px-5 h-14 flex items-center gap-3">
          <button className="lg:hidden p-2 rounded-lg border border-orange-100" onClick={() => setDrawerOpen(true)} aria-label="Menüyü aç">
            <Menu className="w-5 h-5 text-slate-700" />
          </button>
          <img src="/makethemenu-header.png" alt="Makethemenu" className="h-7 object-contain hidden sm:block" draggable={false} />
          <span className="font-bold text-slate-900 flex items-center gap-2">
            {(() => { const I = icon; return <I className="w-5 h-5 text-primary" />; })()} {label}
          </span>
          <nav className="ml-auto hidden lg:flex items-center gap-1 text-sm">
            <a className="px-3 py-2 rounded-lg text-slate-600 hover:bg-orange-50 flex items-center gap-2" href="/su-servisi"><Droplets className="w-4 h-4" /> Su Servisi</a>
            <a className="px-3 py-2 rounded-lg text-slate-600 hover:bg-orange-50 flex items-center gap-2" href="/tup-servisi"><Flame className="w-4 h-4" /> Tüp Servisi</a>
            <a className="px-3 py-2 rounded-lg text-slate-600 hover:bg-orange-50 flex items-center gap-2" href="/dashboard/fleet"><Truck className="w-4 h-4" /> Filo</a>
            <a className="px-3 py-2 rounded-lg text-slate-600 hover:bg-orange-50 flex items-center gap-2" href="/hali"><Package className="w-4 h-4" /> Halı Paneli</a>
          </nav>
          <div className="ml-auto lg:ml-2">{DriverLink}</div>
        </div>
      </header>

      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDrawerOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-72 max-w-[85%] bg-white shadow-2xl p-4">
            <button className="absolute right-3 top-3 p-2 text-slate-500" onClick={() => setDrawerOpen(false)} aria-label="Menüyü kapat"><X className="w-5 h-5" /></button>
            <img src="/makethemenu-header.png" alt="Makethemenu" className="h-8 mb-5 object-contain" draggable={false} />
            <nav className="space-y-1 text-sm font-medium">
              {[{ l: "Su Servisi", h: "/su-servisi", i: Droplets }, { l: "Tüp Servisi", h: "/tup-servisi", i: Flame }, { l: "Filo / GPS", h: "/dashboard/fleet", i: Truck }, { l: "Halı Paneli", h: "/hali", i: Package }, { l: "Ana Sayfa", h: "/", i: Home }].map((m) => (
                <a key={m.l} href={m.h} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 hover:bg-orange-50" onClick={() => setDrawerOpen(false)}>
                  <m.i className="w-4 h-4" /> {m.l}
                </a>
              ))}
            </nav>
          </div>
        </div>
      )}

      <main className="max-w-6xl mx-auto p-3 sm:p-5 space-y-4">
        {/* Aşama şeridi */}
        <div className="bg-white/90 rounded-2xl border border-orange-100 shadow-sm p-2 sm:p-3 grid grid-cols-2 lg:grid-cols-4 gap-2">
          {FLOW.map((f, i) => (
            <button key={f.key}
              className={"flex items-center gap-3 rounded-xl px-3 sm:px-4 py-3 border-2 text-left " + (stage === f.key ? "bg-orange-50" : "border-transparent hover:bg-slate-50")}
              style={stage === f.key ? { borderColor: f.color } : undefined}
              onClick={() => setStage(f.key)}>
              <span className="w-9 h-9 rounded-full grid place-items-center text-white shrink-0" style={{ backgroundColor: f.color }}>
                {f.key === "delivered" ? <Truck className="w-4 h-4" /> : <Package className="w-4 h-4" />}
              </span>
              <span className="text-xs sm:text-sm font-semibold text-slate-800">{f.label}</span>
              <span className="ml-auto text-xl font-bold" style={{ color: f.color }}>{counts[f.key] ?? 0}</span>
              {i < FLOW.length - 1 && <Radio className="hidden lg:block absolute" />}
            </button>
          ))}
        </div>

        {/* Sipariş listesi */}
        <section className="bg-white/95 rounded-2xl border border-orange-100 shadow-sm overflow-hidden min-h-[300px] flex flex-col">
          <header className="px-4 sm:px-5 py-4 border-b border-orange-50 flex items-center gap-2">
            <h2 className="font-semibold text-slate-900">{FLOW.find((f) => f.key === stage)?.label} siparişler</h2>
            <span className="text-xs text-slate-400">{list.length} kayıt</span>
            <Badge className="ml-auto bg-primary/10 text-primary border-0">{prefix}-siparişleri</Badge>
          </header>
          <div className="p-4 sm:p-5 flex-1">
            {!list.length ? (
              <div className="py-16 text-center">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary grid place-items-center mx-auto mb-3"><Package className="w-7 h-7" /></div>
                <p className="font-medium text-slate-700">Bu aşamada sipariş yok</p>
                <p className="text-sm text-slate-400 mt-1">Müşteri siparişi oluşturduğunda burada listelenir.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {list.map((o) => (
                  <div key={o.id} className="rounded-xl border border-orange-50 bg-white px-4 py-3">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-800">
                          <span className="font-mono text-xs text-slate-400 mr-2">{o.orderNo}</span>{o.customerName}
                        </p>
                        <p className="text-xs text-slate-400 flex items-center gap-1.5 truncate">
                          <MapPin className="w-3 h-3" /> {o.addressText}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {o.items.map((i) => `${i.name} ×${i.qty}`).join(" · ")} — ₺{Number(o.total).toFixed(2)} · {o.scheduledDate} {o.timeSlot}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <a href={`/api/qr.svg?text=${encodeURIComponent(location.origin + "/teslimat/" + o.orderNo)}`}
                          target="_blank" rel="noreferrer" title="QR etiket (yazdır)"
                          className="p-2 rounded-lg border border-orange-100 text-primary hover:bg-orange-50">
                          <QrCode className="w-5 h-5" />
                        </a>
                        <a href={`tel:${o.phone}`} className="p-2 rounded-lg border border-orange-100 text-slate-500 hover:bg-orange-50" title="Müşteriyi ara">
                          <Phone className="w-5 h-5" />
                        </a>
                      </div>
                    </div>
                    {o.status !== "delivered" && (
                      <div className="mt-2 pt-2 border-t border-orange-50 flex flex-col sm:flex-row sm:items-center gap-2">
                        <select
                          className="h-9 rounded-lg border border-orange-100 bg-white px-2 text-xs"
                          value={selVehicle[o.id] ?? o.vehicleId ?? ""}
                          onChange={(e) => setSelVehicle({ ...selVehicle, [o.id]: Number(e.target.value) })}
                        >
                          <option value="">Araç seç...</option>
                          {vehicles.filter((v) => v.isActive).map((v) => (
                            <option key={v.id} value={v.id}>{v.plate}{v.driverName ? ` · ${v.driverName}` : ""}</option>
                          ))}
                        </select>
                        <Button size="sm" variant="outline" className="border-orange-100 bg-white text-slate-600 h-9" onClick={() => assign(o)}>
                          Araç Ata
                        </Button>
                        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white h-9 sm:ml-auto" onClick={() => dispatch(o)}>
                          <Navigation className="w-4 h-4" /> Teslimata Çıkar
                        </Button>
                      </div>
                    )}
                    {/* Sürücü ataması — bu sektörün kendi sürücü havuzundan */}
                    {["new", "preparing"].includes(o.status) && (
                      <div className="mt-2 flex flex-col sm:flex-row sm:items-center gap-2">
                        <select
                          className="h-9 rounded-lg border border-orange-100 bg-white px-2 text-xs"
                          value={o.driverId ?? selDriver[o.id] ?? ""}
                          onChange={(e) => e.target.value && manualAssign(o, Number(e.target.value))}
                        >
                          <option value="">Sürücü seçin (manuel)</option>
                          {drivers.filter((d) => d.isActive).map((d) => (
                            <option key={d.id} value={d.id}>{d.name}</option>
                          ))}
                        </select>
                        <Button size="sm" variant="outline" className="border-orange-100 bg-white text-slate-600 h-9" onClick={() => autoAssign(o)}>
                          Otomatik Ata
                        </Button>
                        {driverNameFor(o) && <span className="text-[11px] text-slate-400 sm:ml-auto">Atanan: <b>{driverNameFor(o)}</b></span>}
                      </div>
                    )}
                    {o.status === "on_route" && (
                      <p className="mt-2 text-[11px] text-amber-600 flex items-center gap-1.5">
                        <Radio className="w-3 h-3 animate-pulse" />
                        Sürücüde canlı konum açık{driverNameFor(o) ? ` — sürücü: ${driverNameFor(o)}` : ""} — QR okutulunca teslim işaretlenir.
                      </p>
                    )}
                    {o.status === "on_route" && (
                      <p className="mt-2 text-[11px] text-amber-600 flex items-center gap-1.5">
                        <Radio className="w-3 h-3 animate-pulse" /> Sürücüde canlı konum açık — teslimat QR ile kapanır.
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          <footer className="px-4 sm:px-5 py-3 border-t border-orange-50 text-xs text-slate-500 bg-orange-50/40">
            Teslimata çıkarılan siparişin QR etiketi okutulduğunda <b>Teslim Edildi</b> işaretlenir; canlı konum ancak o anda kapanır.
          </footer>
        </section>

        {/* Bu sektörün sürücü havuzu — su/tüp sürücü sistemi buradan yönetilir (mantık halı paneliyle aynı) */}
        <section className="bg-white/95 rounded-2xl border border-orange-100 shadow-sm overflow-hidden">
          <button className="w-full px-4 sm:px-5 py-4 flex items-center gap-2" onClick={() => setShowDrivers((s) => !s)}>
            <Truck className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-slate-900">{label} Sürücüleri</h2>
            <Badge className="bg-primary/10 text-primary border-0">{drivers.filter((d) => d.isActive).length} aktif</Badge>
            <span className="ml-auto text-xs text-slate-400">{showDrivers ? "gizle ▲" : "yönet ▼"}</span>
          </button>
          {showDrivers && (
            <div className="px-4 sm:px-5 pb-5 space-y-2">
              <p className="text-xs text-slate-500">
                Yeni siparişler <b>otomatik olarak en az yüklü aktif sürücüye</b> atanır; isterseniz siparişte manuel atayın.
                Sürücü görevini <a className="text-primary underline" href={driverPanelHref}>{driverPanelHref}</a> panelinden yürütür: zorunlu GPS + QR ile teslim.
              </p>
              {!drivers.length ? (
                <p className="text-sm text-slate-400 py-4 text-center">Sürücü yok — sürücü ekleyin ki siparişler otomatik atanabilsin.</p>
              ) : (
                <div className="space-y-2">
                  {drivers.map((d) => (
                    <div key={d.id} className="rounded-xl border border-orange-50 bg-white px-4 py-3 flex items-center gap-3">
                      <span className="w-9 h-9 rounded-full bg-primary/10 text-primary grid place-items-center text-sm font-bold">{d.name.slice(0, 1)}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-800">{d.name} {d.isActive ? "" : <span className="text-xs text-slate-400">(pasif)</span>}</p>
                        <p className="text-xs text-slate-400">{d.phone || "telefon yok"} · yoldaki görev: {orders.filter((x) => x.status === "on_route" && x.driverId === d.id).length}</p>
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
              <Button size="sm" className="bg-primary text-primary-foreground hover:brightness-105 h-9" onClick={async () => {
                const name = window.prompt("Sürücü adı soyadı");
                if (!name || name.trim().length < 2) return;
                const phone = window.prompt("Telefon (opsiyonel)") ?? "";
                const r = await fetch("/api/ops/drivers", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ sector: driverSector, name: name.trim(), phone }),
                });
                if (r.ok) { showToast("Sürücü eklendi"); load(); } else showToast((await r.json()).message ?? "Eklenemedi");
              }}>+ Sürücü Ekle</Button>
            </div>
          )}
        </section>

        <p className="text-xs text-slate-400">
          Müşteri siparişi: {kind === "tup" ? <a className="text-primary font-medium" href="/tup-servisi/talep">Tüp dolum talebi</a> : <a className="text-primary font-medium" href="/su-siparisi">Su siparişi</a>} · Filo: <a className="text-primary font-medium" href="/dashboard/fleet">Araç Takip</a>
        </p>
      </main>

      {toast && (
        <div className="fixed bottom-6 inset-x-4 sm:inset-x-auto sm:right-6 z-[60] rounded-xl bg-slate-900 text-white px-4 py-2.5 shadow-xl text-sm text-center sm:text-left">{toast}</div>
      )}
    </div>
  );
}
