// Şoför konum paneli (/driver/location): tarayıcı Geolocation ile GERÇEK konum paylaşımı.
// Kullanıcı açıkça başlatana kadar hiçbir konum toplanmaz/gönderilmez.
import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Navigation, Play, Square } from "lucide-react";

interface Vehicle { id: number; plate: string; driverName: string | null; gpsMethod: string; }

export default function DriverLocationPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehicleId, setVehicleId] = useState<number | null>(null);
  const [sharing, setSharing] = useState(false);
  const [state, setState] = useState("");
  const [lastSent, setLastSent] = useState<string | null>(null);
  const [sentCount, setSentCount] = useState(0);
  const [error, setError] = useState("");
  const watchId = useRef<number | null>(null);
  const lastPush = useRef(0);

  useEffect(() => {
    fetch("/api/ops/vehicles")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("unauthorized"))))
      .then((d) => {
        const list: Vehicle[] = d.vehicles ?? [];
        setVehicles(list);
        const shareable = list.filter((v) => v.gpsMethod !== "none");
        if (shareable.length && !vehicleId) setVehicleId(shareable[0].id);
      })
      .catch(() => setError("Bu panel işletme oturumu gerektirir. Lütfen giriş yapın."));
    return () => stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const push = async (pos: GeolocationPosition) => {
    // En fazla 15 saniyede bir gönder (sunucu tarafı da 2 sn spam korumasına sahip).
    if (Date.now() - lastPush.current < 15_000) return;
    lastPush.current = Date.now();
    const res = await fetch("/api/driver/location", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        vehicleId,
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        speed: pos.coords.speed != null ? pos.coords.speed * 3.6 : undefined,
        clientTime: new Date().toISOString(),
      }),
    });
    if (res.ok) {
      setLastSent(new Date().toLocaleTimeString("tr-TR"));
      setSentCount((n) => n + 1);
      setState("Paylaşım aktif");
    } else {
      const d = await res.json().catch(() => ({}));
      setState(d.message || "Gönderilemedi");
    }
  };

  const start = () => {
    setError("");
    if (!navigator.geolocation) return setError("Tarayıcı konum desteği yok.");
    if (!vehicleId) return setError("Önce paylaşım yapılacak aracı seçin.");
    setState("Konum izni bekleniyor…");
    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        setState(`Alınıyor: ${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`);
        push(pos);
      },
      (err) => setState(err.code === err.PERMISSION_DENIED ? "Konum izni reddedildi" : `Hata: ${err.message}`),
      { enableHighAccuracy: true, maximumAge: 10_000 },
    );
    setSharing(true);
  };

  const stop = () => {
    if (watchId.current != null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
    setSharing(false);
    setState("Paylaşım kapalı");
  };

  const shareable = vehicles.filter((v) => v.gpsMethod !== "none");

  return (
    <div className="min-h-screen bg-background p-6 site-container max-w-xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Navigation className="w-5 h-5 text-primary" /> Şoför Konum Paylaşımı
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Bu panel aracın konumunu yalnızca siz <b>Başlat</b>'a bastığınızda paylaşır. Tarayıcı sekmesi kapatıldığında paylaşım durur.
            Arka planda gizli takip yapılmaz.
          </p>

          {error && <p className="text-destructive text-sm">{error}</p>}

          <div>
            <label className="text-sm text-muted-foreground">Araç</label>
            <select
              className="w-full h-10 rounded-md border border-input bg-background px-3 mt-1"
              value={vehicleId ?? ""}
              onChange={(e) => setVehicleId(Number(e.target.value))}
              disabled={sharing}
            >
              <option value="" disabled>Araç seçin…</option>
              {shareable.map((v) => (
                <option key={v.id} value={v.id}>{v.plate} — {v.driverName ?? "Şoför atanmadı"}</option>
              ))}
            </select>
            {!shareable.length && !error && (
              <p className="text-xs text-muted-foreground mt-1">GPS yöntemi atanmış araç yok. Fleet sayfasından araç ekleyip "Şoför Uygulaması" yöntemini seçin.</p>
            )}
          </div>

          <div className="flex items-center gap-3">
            {sharing ? (
              <Button variant="destructive" onClick={stop}><Square className="w-4 h-4 mr-1" />Durdur</Button>
            ) : (
              <Button onClick={start}><Play className="w-4 h-4 mr-1" />Başlat</Button>
            )}
            {sharing ? <Badge className="bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300">Aktif</Badge> : <Badge variant="outline">Kapalı</Badge>}
          </div>

          {state && <p className="text-sm text-muted-foreground">{state}</p>}
          {lastSent && <p className="text-xs text-muted-foreground">Son gönderim: {lastSent} (toplam {sentCount} nokta)</p>}
        </CardContent>
      </Card>
    </div>
  );
}
