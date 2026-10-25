// Filo / GPS aracı takibi (/dashboard/fleet): araç listesi, GPS yöntemi, son bilinen konum.
// Dürüstlük kuralı: GPS sağlayıcı yoksa canlı harita YOKTUR — sistem boş durumu gösterir.
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Truck, MapPin, ShieldAlert } from "lucide-react";

interface Vehicle {
  id: number; internalCode: string; plate: string; name: string | null; brand: string | null;
  capacity: number; driverName: string | null; status: string; gpsMethod: string;
  gpsDeviceId: string | null; lastLat: string | null; lastLng: string | null; lastSeenAt: string | null; isActive: boolean;
}

const GPS_LABEL: Record<string, string> = {
  none: "GPS Yok",
  driver_app: "Şoför Uygulaması",
  gps_device: "GPS Cihazı",
};

export default function FleetPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ plate: "", name: "", driverName: "", capacity: 40, gpsMethod: "none", gpsDeviceId: "" });
  const [error, setError] = useState("");
  const [track, setTrack] = useState<Record<string, unknown> | null>(null);

  const load = async () => {
    const r = await fetch("/api/ops/vehicles");
    if (r.ok) setVehicles((await r.json()).vehicles ?? []);
  };
  useEffect(() => { load(); }, []);

  const create = async () => {
    setError("");
    const res = await fetch("/api/ops/vehicles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, capacity: Number(form.capacity) }),
    });
    const data = await res.json();
    if (!res.ok) return setError(data.message || "Araç eklenemedi");
    setShowForm(false);
    setForm({ plate: "", name: "", driverName: "", capacity: 40, gpsMethod: "none", gpsDeviceId: "" });
    load();
  };

  const openTrack = async (v: Vehicle) => {
    const r = await fetch(`/api/ops/vehicles/${v.id}/track`);
    if (r.ok) setTrack(await r.json());
  };

  const freshness = (v: Vehicle): { label: string; cls: string } => {
    if (v.gpsMethod === "none") return { label: "GPS yok", cls: "bg-muted text-muted-foreground" };
    if (!v.lastSeenAt) return { label: "Bilinmiyor", cls: "bg-muted text-muted-foreground" };
    const age = (Date.now() - new Date(v.lastSeenAt).getTime()) / 1000;
    return age < 300
      ? { label: "Canlı (yakın zamanda)", cls: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300" }
      : { label: "Eski veri", cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" };
  };

  return (
    <div className="min-h-screen bg-background p-6 site-container">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-display font-bold">Filo ve <span className="text-primary">Araç Takibi</span></h1>
        <Button onClick={() => setShowForm((s) => !s)}>{showForm ? "Vazgeç" : "Araç Ekle"}</Button>
      </div>

      {showForm && (
        <Card className="p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input className="h-10 rounded-md border border-input bg-background px-3" placeholder="Plaka (34 ABC 123)" value={form.plate} onChange={(e) => setForm({ ...form, plate: e.target.value.toUpperCase() })} />
            <input className="h-10 rounded-md border border-input bg-background px-3" placeholder="Araç adı" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input className="h-10 rounded-md border border-input bg-background px-3" placeholder="Şoför adı" value={form.driverName} onChange={(e) => setForm({ ...form, driverName: e.target.value })} />
            <input type="number" className="h-10 rounded-md border border-input bg-background px-3" placeholder="Kapasite" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })} />
            <select className="h-10 rounded-md border border-input bg-background px-3" value={form.gpsMethod} onChange={(e) => setForm({ ...form, gpsMethod: e.target.value })}>
              <option value="none">GPS Yok</option>
              <option value="driver_app">Şoför Uygulaması</option>
              <option value="gps_device">GPS Cihazı</option>
            </select>
            {form.gpsMethod === "gps_device" && (
              <input className="h-10 rounded-md border border-input bg-background px-3" placeholder="Cihaz kimliği" value={form.gpsDeviceId} onChange={(e) => setForm({ ...form, gpsDeviceId: e.target.value })} />
            )}
          </div>
          {error && <p className="text-destructive text-sm mt-2">{error}</p>}
          <div className="flex justify-end mt-3">
            <Button onClick={create}>Kaydet</Button>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {vehicles.map((v) => {
          const f = freshness(v);
          return (
            <Card key={v.id} className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Truck className="w-5 h-5 text-primary" />
                  <p className="font-bold">{v.plate}</p>
                  <Badge variant="outline" className="text-[10px]">{v.internalCode}</Badge>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${f.cls}`}>{f.label}</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {v.name ?? "—"} · Şoför: {v.driverName ?? "atanmadı"} · Kapasite: {v.capacity} · {GPS_LABEL[v.gpsMethod]}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {v.gpsMethod !== "none" && v.lastSeenAt
                  ? <>Son konum: {Number(v.lastLat).toFixed(5)}, {Number(v.lastLng).toFixed(5)} · {new Date(v.lastSeenAt).toLocaleString("tr-TR")}</>
                  : v.gpsMethod === "none"
                    ? "Bu araç için konum paylaşımı etkin değil."
                    : "Henüz konum verisi gelmedi."}
              </p>
              <div className="flex gap-2 mt-3">
                <Button size="sm" variant="outline" onClick={() => openTrack(v)}><MapPin className="w-4 h-4 mr-1" />Konum Geçmişi</Button>
              </div>
            </Card>
          );
        })}
        {!vehicles.length && <p className="text-muted-foreground">Araç kaydı yok. "Araç Ekle" ile başlayın.</p>}
      </div>

      {track && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-primary" />
              {(track.vehicle as { plate?: string })?.plate} — Konum Geçmişi
            </CardTitle>
          </CardHeader>
          <CardContent>
            {Array.isArray(track.trail) && track.trail.length ? (
              <div className="max-h-60 overflow-y-auto space-y-1 text-sm font-mono">
                {(track.trail as { lat: string; lng: string; speed: string | null; recordedAt: string; source: string }[]).map((p, i) => (
                  <p key={i} className="text-muted-foreground">{p.recordedAt.slice(0, 19).replace("T", " ")} · {Number(p.lat).toFixed(5)}, {Number(p.lng).toFixed(5)} · {p.speed ? `${Number(p.speed).toFixed(0)} km/s` : "—"} · {p.source}</p>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">Bu araç için kayıtlı konum yok.</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Dürüst canlı harita durumu */}
      <Card className="border-amber-300 dark:border-amber-700">
        <CardContent className="p-4 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium">Canlı harita hakkında</p>
            <p className="text-muted-foreground">
              Canlı konum yalnızca gerçek bir kaynaktan gelir: şoförün konum paylaşımı (aşağıdaki şoför paneli) veya harici GPS cihazı entegrasyonu.
              Kaynak yapılandırılmadıysa yukarıda sahte konum gösterilmez; yalnızca son bilinen veri ve yaşı listelenir.
            </p>
            <div className="mt-2">
              <Button size="sm" variant="outline" onClick={() => (window.location.href = "/driver/location")}>Şoför Konum Panelini Aç</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
