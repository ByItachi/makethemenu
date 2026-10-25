// QR etiketi okutulunca açılan sayfa (/teslimat/:code):
// Sürücü aktif teslimattaysa tek tıkla "Teslim Edildi" işaretler; değilse sürücü paneline yönlendirir.
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { CheckCircle2, PackageCheck, Navigation } from "lucide-react";

export default function DeliveryConfirmPage({ code }: { code: string }) {
  const [state, setState] = useState<"idle" | "done" | "error">("idle");
  const [msg, setMsg] = useState("");
  const [active, setActive] = useState<boolean | null>(null);
  const [, navigate] = useLocation();

  useEffect(() => {
    fetch("/api/driver/delivery/active")
      .then((r) => r.json())
      .then((d) => setActive(!!d.session))
      .catch(() => setActive(false));
  }, []);

  const complete = async () => {
    const r = await fetch("/api/driver/delivery/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    const d = await r.json();
    if (!r.ok) {
      setState("error");
      setMsg(d.message ?? "Teslim edilemedi");
      return;
    }
    setState("done");
    setMsg(d.message);
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,#fff7ed,#fffbeb)] flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-xl border border-orange-100 p-8 max-w-md w-full text-center">
        <img src="/makethemenu-header.png" alt="Makethemenu" className="h-10 mx-auto mb-5 object-contain" draggable={false} />
        <p className="text-xs font-semibold tracking-wider text-slate-400">TESLİMAT KODU</p>
        <p className="font-mono text-2xl font-bold text-slate-900 mb-1">{code}</p>

        {state === "idle" && (
          <>
            <p className="text-sm text-slate-500 mb-5">
              {active === null ? "Kontrol ediliyor…" :
                active ? "Aktif teslimatınız var — teslim etmek için onaylayın." :
                  "Aktif teslimat bulunamadı. Sürücü panelinden teslimata çıkın."}
            </p>
            <div className="space-y-2">
              <Button className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold" disabled={!active} onClick={complete}>
                <PackageCheck className="w-5 h-5" /> Teslim Edildi İşaretle
              </Button>
              <Button variant="outline" className="w-full border-orange-100 bg-white text-slate-600" onClick={() => navigate("/surucu")}>
                <Navigation className="w-4 h-4" /> Sürücü Panelini Aç
              </Button>
            </div>
          </>
        )}

        {state === "done" && (
          <div className="py-4">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
            <p className="font-semibold text-slate-800">Teslim edildi</p>
            <p className="text-sm text-slate-500 mt-1">{msg}</p>
            <Button className="mt-5 bg-primary text-primary-foreground hover:brightness-105" onClick={() => navigate("/surucu")}>
              Sürücü Paneline Dön
            </Button>
          </div>
        )}

        {state === "error" && (
          <div className="py-4">
            <p className="font-semibold text-rose-600">Teslim edilemedi</p>
            <p className="text-sm text-slate-500 mt-1">{msg}</p>
            <Button variant="outline" className="mt-5 border-orange-100 bg-white text-slate-600" onClick={() => navigate("/surucu")}>
              Sürücü Panelini Aç
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
