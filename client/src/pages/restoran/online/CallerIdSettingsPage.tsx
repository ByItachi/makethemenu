import React, { useState, useEffect } from "react";
import { Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type CallerConfig = {
  enabled: boolean;
  serverUrl: string;
  token: string;
  deviceName: string;
  autoStart: boolean;
};

const CallerIdSettingsPage: React.FC = () => {
  const [cfg, setCfg] = useState<CallerConfig>(() => {
    try {
      const raw = localStorage.getItem("callerid");
      return raw ? JSON.parse(raw) : {
        enabled: true,
        serverUrl: "http://127.0.0.1:5000/callerid",
        token: "",
        deviceName: "Android Cihaz",
        autoStart: true
      };
    } catch {
      return {
        enabled: true,
        serverUrl: "http://127.0.0.1:5000/callerid",
        token: "",
        deviceName: "Android Cihaz",
        autoStart: true
      };
    }
  });
  const [testNumber, setTestNumber] = useState("");
  const [status, setStatus] = useState<"disconnected" | "connected">("disconnected");

  useEffect(() => {
    localStorage.setItem("callerid", JSON.stringify(cfg));
  }, [cfg]);

  const save = () => {
    localStorage.setItem("callerid", JSON.stringify(cfg));
    alert("CallerId ayarları kaydedildi");
  };

  const simulateCall = () => {
    if (!testNumber.trim()) return;
    alert(`Simüle arama: ${testNumber}`);
  };

  const toggleConnection = () => {
    setStatus(s => s === "connected" ? "disconnected" : "connected");
  };

  return (
    <div className="max-w-6xl space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2 dark:text-slate-100">
          <Smartphone className="w-5 h-5 text-slate-500" />
          Android CallerId Ayarları
        </h2>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${status === "connected" ? "bg-emerald-500" : "bg-slate-300"}`} />
          <span className="text-sm text-slate-500">{status === "connected" ? "Bağlı" : "Bağlı değil"}</span>
          <Button variant="secondary" onClick={toggleConnection}>{status === "connected" ? "Bağlantıyı Kes" : "Bağlan"}</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4 dark:bg-slate-900 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <input id="cid-enabled" type="checkbox" checked={cfg.enabled} onChange={() => setCfg(v => ({ ...v, enabled: !v.enabled }))} />
              <Label htmlFor="cid-enabled">CallerId Aktif</Label>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cid-server">Sunucu URL</Label>
              <Input id="cid-server" value={cfg.serverUrl} onChange={e => setCfg(v => ({ ...v, serverUrl: e.target.value }))} placeholder="http://sunucu:5000/callerid" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cid-token">Erişim Anahtarı</Label>
                <Input id="cid-token" value={cfg.token} onChange={e => setCfg(v => ({ ...v, token: e.target.value }))} placeholder="opsiyonel" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cid-device">Cihaz Adı</Label>
                <Input id="cid-device" value={cfg.deviceName} onChange={e => setCfg(v => ({ ...v, deviceName: e.target.value }))} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input id="cid-autostart" type="checkbox" checked={cfg.autoStart} onChange={() => setCfg(v => ({ ...v, autoStart: !v.autoStart }))} />
              <Label htmlFor="cid-autostart">Uygulama açılınca otomatik başlat</Label>
            </div>
            <div className="flex items-center gap-2">
              <Button className="bg-primary hover:bg-primary/90" onClick={save}>Kaydet</Button>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4 dark:bg-slate-900 dark:border-slate-800">
            <h3 className="text-lg font-medium text-slate-800 dark:text-slate-100">Test</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="cid-test">Telefon Numarası</Label>
                <Input id="cid-test" value={testNumber} onChange={e => setTestNumber(e.target.value)} placeholder="+90 5xx xxx xx xx" />
              </div>
              <div className="flex items-end">
                <Button variant="secondary" onClick={simulateCall}>Aramayı Simüle Et</Button>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-3 dark:bg-slate-900 dark:border-slate-800">
            <h3 className="text-lg font-medium text-slate-800 dark:text-slate-100">Kurulum</h3>
            <ol className="text-sm text-slate-600 space-y-2 dark:text-slate-300">
              <li>1. Android CallerId uygulamasını cihaza yükleyin.</li>
              <li>2. Aynı ağda olduğunuzdan emin olun.</li>
              <li>3. Sunucu URL'sini ve anahtarı uygulamaya girin.</li>
              <li>4. Cihazda servisi başlatın ve burada Bağlan'a tıklayın.</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CallerIdSettingsPage;
