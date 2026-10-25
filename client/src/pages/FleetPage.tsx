// Araç Takip (/dashboard/fleet): sektör sürücü havuzundaki GERÇEK şoförlerin canlı konumu.
// Konum yalnızca /surucu/* panelinden gelen gerçek GPS'ten (delivery_sessions) okunur — sahte konum üretilmez.
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { MapPin, Radio, Truck, Users } from "lucide-react";

interface LiveDriver {
  id: number; sector: string; sectorLabel: string; name: string; phone: string | null;
  isActive: boolean; tracking: boolean; online: boolean; orderNo: string | null;
  lastLat: number | string | null; lastLng: number | string | null; lastPingAt: string | null;
}

export default function FleetPage() {
  const [drivers, setDrivers] = useState<LiveDriver[]>([]);
  const [counts, setCounts] = useState({ online: 0, tracking: 0, total: 0 });
  const [selected, setSelected] = useState<number | null>(null);

  const load = async () => {
    const r = await fetch("/api/ops/drivers/live");
    if (!r.ok) return;
    const data = await r.json();
    setDrivers(data.drivers ?? []);
    setCounts(data.counts ?? { online: 0, tracking: 0, total: 0 });
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 10_000);
    return () => clearInterval(t);
  }, []);

  const toggleActive = async (d: LiveDriver) => {
    await fetch(`/api/ops/drivers/${d.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !d.isActive }),
    });
    load();
  };

  const current = drivers.find((d) => d.id === selected) ?? drivers.find((d) => d.tracking) ?? null;
  const notTracking = drivers.filter((d) => !d.tracking);
  const tracking = drivers.filter((d) => d.tracking);

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row">
      <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b lg:hidden">
        <h1 className="text-xl font-display font-bold">Araç Takip</h1>
      </div>

      <aside className="w-full lg:w-80 border-b lg:border-b-0 lg:border-r shrink-0 bg-card">
        <div className="hidden lg:block px-5 pt-5">
          <h1 className="text-2xl font-display font-bold">Araç Takip</h1>
          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
            <Radio className="w-3 h-3 text-green-500" /> 10 sn'de bir güncellenir
          </p>
        </div>
        <div className="flex flex-wrap gap-2 px-5 py-3">
          <Badge variant="outline" className="gap-1"><Radio className="w-3 h-3 text-green-500" /> Çevrimiçi {counts.online}</Badge>
          <Badge variant="outline" className="gap-1"><MapPin className="w-3 h-3" /> Takipte {counts.tracking}</Badge>
          <Badge variant="outline" className="gap-1"><Users className="w-3 h-3" /> Toplam {counts.total}</Badge>
        </div>

        {!drivers.length && (
          <p className="px-5 py-6 text-sm text-muted-foreground">
            Henüz sürücü kaydı yok. Halı/Su/Tüp panellerindeki "Sürücüler" bölümünden ekleyin.
          </p>
        )}

        {!!tracking.length && (
          <div className="px-3">
            <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Takipte · {tracking.length}</p>
            {tracking.map((d) => (
              <button key={d.id} onClick={() => setSelected(d.id)}
                className={`w-full text-left flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-muted transition-colors ${selected === d.id ? "bg-muted" : ""}`}>
                <span className="relative w-9 h-9 rounded-full bg-primary/10 text-primary grid place-items-center text-sm font-bold shrink-0">
                  {d.name.slice(0, 1)}
                  {d.online && <span className="absolute -right-0.5 -bottom-0.5 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-card" />}
                </span>
                <span className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{d.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{d.sectorLabel} · {d.orderNo ?? "Yolda"}</p>
                </span>
              </button>
            ))}
          </div>
        )}

        {!!notTracking.length && (
          <div className="px-3 mt-2">
            <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Boşta · {notTracking.length}</p>
            {notTracking.map((d) => (
              <div key={d.id} className="w-full flex items-center gap-3 px-2 py-2 rounded-lg">
                <span className="w-9 h-9 rounded-full bg-muted text-muted-foreground grid place-items-center text-sm font-bold shrink-0">{d.name.slice(0, 1)}</span>
                <span className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{d.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{d.sectorLabel} · {d.isActive ? "Teslimatta değil" : "Pasif (havuzdan çıkarıldı)"}</p>
                </span>
                <button type="button" role="switch" aria-checked={d.isActive} title="Sürücüyü aktif/pasif yap (pasif sürücüye yeni sipariş atanmaz)" onClick={() => toggleActive(d)}
                  className={`appearance-none border-0 p-0 w-9 h-5 rounded-full relative transition-colors shrink-0 ${d.isActive ? "bg-primary" : "bg-muted-foreground/30"}`}>
                  <span className={`absolute left-0.5 top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${d.isActive ? "translate-x-4" : "translate-x-0"}`} />
                </button>
              </div>
            ))}
          </div>
        )}
      </aside>

      <main className="flex-1 min-h-[420px] flex items-center justify-center p-6">
        {current && current.lastLat != null && current.lastLng != null ? (
          <div className="text-center max-w-sm">
            <Truck className="w-10 h-10 text-primary mx-auto mb-3" />
            <p className="font-semibold">{current.name} — {current.sectorLabel}</p>
            <p className="text-sm text-muted-foreground mt-1 font-mono">{Number(current.lastLat).toFixed(5)}, {Number(current.lastLng).toFixed(5)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {current.lastPingAt ? `Son konum: ${new Date(current.lastPingAt).toLocaleTimeString("tr-TR")}` : ""}
            </p>
            <a className="inline-block mt-3 text-sm text-primary font-medium hover:underline"
              href={`https://www.google.com/maps?q=${current.lastLat},${current.lastLng}`} target="_blank" rel="noreferrer">
              Haritada Aç ↗
            </a>
          </div>
        ) : (
          <div className="text-center text-muted-foreground">
            <MapPin className="w-10 h-10 mx-auto mb-3 text-primary/60" />
            <p>Haritada gösterilecek konum yok</p>
            <p className="text-xs mt-1">
              Bir sürücü teslimata çıktığında ve şoför panelinden (/surucu) konum paylaşımı başladığında burada görünür.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
