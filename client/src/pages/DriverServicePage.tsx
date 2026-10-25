// Sürücü teslimat paneli — SEKTÖR BAZINDA AYRI: /surucu/hali, /surucu/su, /surucu/tup.
// Mantık her sektörde aynıdır; ama panel, sürücü listesi ve görevler sektöre özeldir.
// Panelde işletme panellerine giden bağlantı YOKTUR: işletme panelinden gelen siparişler
// sürücülere atanır (otomatik/manuel), sürücü görevi alır → zorunlu GPS → QR okut → teslim.
import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package, MapPin, QrCode, ShieldCheck, ListChecks, Truck } from "lucide-react";

interface ActiveSession {
  id: number; kind: string; orderNo: string;
  driverId: number | null; driverName: string | null;
  startedAt: string | null; lastLat: number | null; lastLng: number | null; lastPingAt: string | null;
}
interface Target {
  kind: string; orderNo: string; customerName: string; phone: string;
  addressText: string; timeSlot: string; total: string; codes: string[];
}
interface QueueTask {
  kind: string; orderNo: string; customerName: string; addressText: string;
  timeSlot: string; total: string; driverId: number | null;
}

export type DriverSector = "carpet" | "water" | "tube";

/** Her sektörün kendi paneli, kendi sürücü havuzu ve kendi görevleri — mantık aynı, kapsam ayrı. */
const SECTORS: Record<DriverSector, { title: string; short: string; apiKind: string; color: string; soft: string; icon: typeof Truck }> = {
  carpet: { title: "Halı Yıkama — Sürücü Teslimat Paneli", short: "Halı Teslimat", apiKind: "carpet", color: "#b45309", soft: "bg-amber-50", icon: Truck },
  water: { title: "Su Servisi — Sürücü Teslimat Paneli", short: "Su Teslimat", apiKind: "water", color: "#0369a1", soft: "bg-sky-50", icon: Package },
  tube: { title: "Tüp Servisi — Sürücü Teslimat Paneli", short: "Tüp Teslimat", apiKind: "tube", color: "#b91c1c", soft: "bg-rose-50", icon: Package },
};

export default function DriverServicePage({ sector }: { sector: DriverSector }) {
  const cfg = SECTORS[sector];
  const [session, setSession] = useState<ActiveSession | null>(null);
  const [target, setTarget] = useState<Target | null>(null);
  const [queue, setQueue] = useState<QueueTask[]>([]);
  const [manual, setManual] = useState("");
  const [msg, setMsg] = useState("");
  const [done, setDone] = useState(false);
  const [gps, setGps] = useState<{ lat: number; lng: number; acc: number | null } | null>(null);
  const [gpsErr, setGpsErr] = useState("");
  const watchRef = useRef<number | null>(null);
  const [error, setError] = useState("");
  const [, navigate] = useLocation();

  const kind = cfg.apiKind;

  const poll = async () => {
    try {
      const r = await fetch(`/api/driver/delivery/active?kind=${kind}`);
      const d = await r.json();
      setSession(d.session ?? null);
      setTarget(d.target ?? null);
    } catch { /* ağ hatası: bir sonraki yoklamada tekrar dener */ }
    try {
      const q = await fetch(`/api/driver/delivery/queue?kind=${kind}`);
      const dq = await q.json();
      setQueue(dq.tasks ?? []);
    } catch { /* kuyruk isteğe bağlıdır */ }
  };
  useEffect(() => { poll(); const t = setInterval(poll, 5000); return () => clearInterval(t); }, [kind]);

  // ZORUNLU GPS: görev varken izin verilmezse panel vazgeçmez; süreç bitene kadar izlemeyi yeniden dener.
  const startWatch = () => {
    if (!navigator.geolocation) { setGpsErr("Bu cihaz konum servisi desteklemiyor."); return; }
    if (watchRef.current != null) return;
    watchRef.current = navigator.geolocation.watchPosition(
      (p) => {
        setGpsErr("");
        setGps({ lat: p.coords.latitude, lng: p.coords.longitude, acc: p.coords.accuracy });
        fetch("/api/driver/delivery/ping", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ kind, lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy }),
        }).catch(() => { /* ping başarısızsa sonraki nokta yeniden dener */ });
      },
      (err) => setGpsErr(
        err.code === err.PERMISSION_DENIED
          ? "Konum izni reddedildi. Teslimat için konum izni ZORUNLUDUR — tarayıcı izinlerinden açın, panel izin isteğini yenileyecektir."
          : "Konum alınamadı: " + err.message,
      ),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 },
    );
  };
  useEffect(() => {
    if (session) startWatch();
    return () => {
      if (watchRef.current != null) { navigator.geolocation.clearWatch(watchRef.current); watchRef.current = null; }
      setGps(null); setGpsErr("");
    };
  }, [session?.id]);

  const complete = async (code: string) => {
    setMsg(""); setError("");
    const r = await fetch("/api/driver/delivery/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    const d = await r.json();
    if (!r.ok) { setError(d.message ?? "Teslim tamamlanamadı"); return; }
    if (d.completed) { setDone(true); setManual(""); poll(); } else { setMsg(d.message ?? "Parça teslim edildi"); poll(); }
  };

  const SectorIcon = cfg.icon;

  if (done) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-full bg-emerald-500/15 text-emerald-400 grid place-items-center mx-auto mb-5">
            <ShieldCheck className="w-10 h-10" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Teslim tamamlandı</h1>
          <p className="text-slate-400 mb-6">Görev kapatıldı, canlı konum servisi sona erdi. Yeni görev atandığında bu panelde görünecek.</p>
          <Button className="bg-white text-slate-900 hover:bg-slate-200" onClick={() => { setDone(false); poll(); }}>Yeni Görev Kontrol Et</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-16">
      {/* Üst bar — yalnızca bu sektörün sürücü paneli. Başka panele/	sektöre giden bağlantı yoktur. */}
      <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur border-b border-slate-800">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl grid place-items-center shrink-0" style={{ backgroundColor: cfg.color + "22", color: cfg.color }}>
            <SectorIcon className="w-5 h-5" />
          </span>
          <div className="min-w-0">
            <h1 className="font-bold leading-tight">{cfg.short} Paneli</h1>
            <p className="text-[11px] text-slate-400">Sürücü teslimat paneli · zorunlu konum + QR teslim</p>
          </div>
          <span className={"ml-auto shrink-0 flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium " + cfg.soft} style={{ color: cfg.color }}>
            <span className={"w-1.5 h-1.5 rounded-full " + (session ? "bg-green-500 animate-pulse" : "bg-slate-400")} />
            {session ? "Görevde" : "Beklemede"}
          </span>
        </div>
      </header>

      <main className="max-w-lg mx-auto p-4 space-y-4">
        {session && target ? (
          <>
            {/* Aktif görev kartı */}
            <section className="rounded-2xl border border-slate-800 bg-slate-900 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <Badge className="bg-white/10 text-white border-0">{cfg.short}</Badge>
                <span className="font-mono text-xs text-slate-400">{target.orderNo}</span>
              </div>
              <div>
                <p className="text-lg font-bold">{target.customerName}</p>
                <p className="text-sm text-slate-400 flex items-start gap-1.5"><MapPin className="w-4 h-4 mt-0.5 shrink-0" /> {target.addressText}</p>
                <p className="text-xs text-slate-500 mt-1">{target.timeSlot} · ₺{Number(target.total).toFixed(2)} · Tel: {target.phone}</p>
              </div>
              {session.driverName && (
                <p className="text-xs text-slate-300 flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5" /> Atanan sürücü: <b>{session.driverName}</b>
                </p>
              )}
            </section>

            {/* Zorunlu konum — kapatılamaz */}
            <section className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
              <p className="text-sm font-semibold mb-2 flex items-center gap-2"><MapPin className="w-4 h-4 text-emerald-400" /> Canlı konum (zorunlu)</p>
              {gps ? (
                <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3 text-xs text-emerald-300">
                  <p className="font-semibold">Konum paylaşılıyor — teslimat bitene kadar kapatılamaz.</p>
                  <p className="font-mono mt-1 text-[11px]">{gps.lat.toFixed(5)}, {gps.lng.toFixed(5)} · ±{gps.acc != null ? Math.round(gps.acc) : "?"} m</p>
                  <p className="mt-1 text-[11px] text-emerald-400/80">Son konum {session.lastPingAt ? `kaydedildi: ${new Date(session.lastPingAt).toLocaleTimeString("tr-TR")}` : "gönderiliyor..."}</p>
                </div>
              ) : gpsErr ? (
                <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-3 text-xs text-amber-300">
                  <p>{gpsErr}</p>
                  <Button size="sm" className="mt-2 h-7 bg-amber-400 text-slate-900 hover:bg-amber-300" onClick={() => { if (watchRef.current != null) { navigator.geolocation.clearWatch(watchRef.current); watchRef.current = null; } startWatch(); }}>
                    İzni tekrar iste
                  </Button>
                </div>
              ) : (
                <p className="text-xs text-slate-500">Konum alınıyor...</p>
              )}
            </section>

            {/* QR ile teslim — kod manuel de girilebilir */}
            <section className="rounded-2xl border border-slate-800 bg-slate-900 p-4 space-y-3">
              <p className="text-sm font-semibold flex items-center gap-2"><QrCode className="w-4 h-4" /> QR okutarak teslim et</p>
              <p className="text-xs text-slate-400">Müşteri paket/etiketteki QR kodu bu panele okutulur ya da kod aşağıya yazılır.</p>
              {target.codes.length > 1 && <p className="text-xs text-slate-500">Beklenen kodlar: <span className="font-mono">{target.codes.join(", ")}</span></p>}
              <div className="flex gap-2">
                <input
                  className="flex-1 h-11 rounded-xl bg-slate-950 border border-slate-700 px-3 text-sm outline-none focus:border-white/40"
                  placeholder="Kod (örn. HL-XXXXXX)"
                  value={manual}
                  onChange={(e) => setManual(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && manual.trim()) complete(manual.trim()); }}
                />
                <Button className="bg-emerald-500 text-white hover:bg-emerald-400" disabled={!manual.trim()} onClick={() => complete(manual.trim())}>
                  Teslim Edildi
                </Button>
              </div>
              <Button variant="outline" className="w-full border-slate-700 bg-transparent text-slate-200 hover:bg-slate-800"
                onClick={async () => {
                  // QR okuyucu: kamera izni varsa barkod, yoksa kod girişi düşer.
                  try {
                    const BarcodeDetectorCtor = (window as unknown as { BarcodeDetector?: new (o: { formats: string[] }) => { detect: (v: HTMLVideoElement) => Promise<{ rawValue: string }[]> } }).BarcodeDetector;
                    if (!BarcodeDetectorCtor) throw new Error("tarayıcı desteklemiyor");
                    const detector = new BarcodeDetectorCtor({ formats: ["qr_code"] });
                    const video = document.createElement("video");
                    video.playsInline = true; video.muted = true;
                    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
                    video.srcObject = stream;
                    await video.play();
                    const stop = () => { stream.getTracks().forEach((t) => t.stop()); video.remove(); };
                    const scan = async () => {
                      try {
                        const codes = await detector.detect(video);
                        if (codes.length) {
                          const raw = codes[0].rawValue;
                          const m = raw.match(/\/teslimat\/([^/?#]+)/);
                          stop();
                          complete(decodeURIComponent(m ? m[1] : raw).toUpperCase());
                          return;
                        }
                      } catch { /* kare okunamadı, devam */ }
                      raf = requestAnimationFrame(scan);
                    };
                    let raf = requestAnimationFrame(scan);
                    setTimeout(stop, 30000);
                  } catch {
                    setMsg("Kamera QR okuyucusu kullanılamıyor — kodu elle girin.");
                  }
                }}>
                Kamerayı Aç (QR)
              </Button>
              {msg && <p className="text-xs text-emerald-400">{msg}</p>}
              {error && <p className="text-xs text-rose-400">{error}</p>}
            </section>
          </>
        ) : (
          /* Görev yok: bu sektörün kuyruğu — işletme panelinden atanan görevler */
          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
            <p className="text-sm font-semibold mb-1 flex items-center gap-2"><ListChecks className="w-4 h-4" /> {cfg.short} görev kuyruğu</p>
            <p className="text-xs text-slate-500 mb-3">İşletme panelinden sürücülere atanan görevler burada listelenir. Görev başlatıldığında (teslimata çıkıldığında) konum takibi otomatik açılır.</p>
            {!queue.length ? (
              <div className="py-10 text-center">
                <Package className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                <p className="text-sm text-slate-400">Atanmış görev yok</p>
                <p className="text-xs text-slate-600 mt-1">Sektör paneli siparişi bir sürücüye atadığında burada görünür.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {queue.map((t) => (
                  <div key={t.orderNo} className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-slate-200">{t.customerName}</span>
                      <span className="font-mono text-[11px] text-slate-500">{t.orderNo}</span>
                    </div>
                    <p className="text-xs text-slate-500 truncate">{t.addressText}</p>
                    <p className="text-[11px] text-slate-600 mt-0.5">{t.timeSlot} · ₺{Number(t.total).toFixed(2)}{t.driverId ? " · sürücü atandı" : ""}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        <p className="text-center text-[11px] text-slate-600">
          Bu panel {cfg.short.toLowerCase()} görevleri içindir. Diğer sektörlerin işlemleri kendi panellerinden yürütülür.
        </p>
      </main>
    </div>
  );
}
