// Su dağıtım demo paneli (/su): gerçek API'lere bağlı — özet, siparişler, araç ataması.
// Giriş yapılmamışsa demo hesabı bilgisiyle yönlendirir.
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Droplets, Truck, Banknote, ClipboardList } from "lucide-react";
import { useLocation } from "wouter";

interface WaterOrder {
  id: number; orderNo: string; customerName: string; phone: string; addressText: string;
  total: string; filledDelivered: number; emptyTaken: number; scheduledDate: string;
  timeSlot: string; status: string; paymentMethod: string; paidAmount: string; vehicleId: number | null;
}
interface Vehicle { id: number; plate: string; driverName: string | null; }

const STATUS_LABEL: Record<string, string> = {
  new: "Yeni", preparing: "Hazırlanıyor", on_route: "Yolda",
  delivered: "Teslim Edildi", failed: "Başarısız", cancelled: "İptal",
};

export default function SuOpsDemo() {
  const [authed, setAuthed] = useState<"loading" | boolean>("loading");
  const [summary, setSummary] = useState<Record<string, unknown> | null>(null);
  const [orders, setOrders] = useState<WaterOrder[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [, navigate] = useLocation();

  const load = async () => {
    const r = await fetch("/api/ops/water/orders");
    if (r.status === 401) return setAuthed(false);
    const s = await fetch("/api/ops/water/summary");
    const v = await fetch("/api/ops/vehicles");
    setSummary(await s.json());
    setVehicles((await v.json()).vehicles ?? []);
    setOrders((await r.json()).orders ?? []);
    setAuthed(true);
  };

  useEffect(() => { load(); }, []);

  const assign = async (order: WaterOrder, vehicleId: number) => {
    // Su siparişine araç ataması: araç bağlanır ve durum "Yolda"ya alınır.
    const res = await fetch(`/api/ops/water/orders/${order.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vehicleId, status: "on_route" }),
    });
    if (res.ok) load();
  };

  if (authed === "loading") return <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">Yükleniyor…</div>;
  if (!authed) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="p-8 max-w-md text-center">
          <Droplets className="w-10 h-10 text-primary mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Su Dağıtım Paneli</h1>
          <p className="text-muted-foreground mb-6">Bu panel işletme hesabına bağlıdır. Demo için <span className="font-mono">demo@makethemenu.com / demo1234</span> hesabıyla giriş yapın.</p>
          <Button onClick={() => navigate("/giris")}>Giriş Yap</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6 site-container">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-display font-bold">Su Dağıtım <span className="text-primary">Paneli</span> (Demo)</h1>
        <Button variant="outline" onClick={() => navigate("/su-siparisi")}>Müşteri Sipariş Sayfası</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <SummaryCard icon={<ClipboardList className="w-5 h-5 text-primary" />} label="Bugünkü Sipariş" value={String((summary as { todayOrders?: number } | null)?.todayOrders ?? 0)} />
        <SummaryCard icon={<Droplets className="w-5 h-5 text-primary" />} label="Bugünkü Ciro" value={`₺${Number((summary as { todayTotal?: number } | null)?.todayTotal ?? 0).toFixed(0)}`} />
        <SummaryCard icon={<Banknote className="w-5 h-5 text-primary" />} label="Tahsil Edilen" value={`₺${Number((summary as { collected?: number } | null)?.collected ?? 0).toFixed(0)}`} />
        <SummaryCard icon={<Banknote className="w-5 h-5 text-primary" />} label="Açık Bakiye" value={`₺${Number((summary as { openBalance?: number } | null)?.openBalance ?? 0).toFixed(0)}`} />
        <SummaryCard icon={<Truck className="w-5 h-5 text-primary" />} label="Aktif Araç" value={String((summary as { activeVehicles?: number } | null)?.activeVehicles ?? 0)} />
      </div>

      <Card>
        <CardHeader><CardTitle>Siparişler</CardTitle></CardHeader>
        <CardContent>
          {!orders.length && <p className="text-muted-foreground">Henüz sipariş yok. /su-siparisi sayfasından demo sipariş oluşturabilirsiniz.</p>}
          <div className="space-y-3">
            {orders.map((o) => (
              <div key={o.id} className="flex flex-col md:flex-row md:items-center gap-3 border border-border rounded-lg p-3">
                <div className="flex-1">
                  <p className="font-medium"><span className="font-mono text-xs text-muted-foreground mr-2">{o.orderNo}</span>{o.customerName}</p>
                  <p className="text-sm text-muted-foreground">{o.addressText}</p>
                  <p className="text-sm text-muted-foreground">{o.scheduledDate} · {o.timeSlot} · Dolu: {o.filledDelivered} / Boş iade: {o.emptyTaken} · ₺{Number(o.total).toFixed(2)}</p>
                </div>
                <Badge variant="outline">{STATUS_LABEL[o.status] ?? o.status}</Badge>
                <select
                  className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                  value={o.vehicleId ?? ""}
                  onChange={(e) => assign(o, Number(e.target.value))}
                >
                  <option value="">Araç ata…</option>
                  {vehicles.map((v) => <option key={v.id} value={v.id}>{v.plate} — {v.driverName ?? "Şoför atanmadı"}</option>)}
                </select>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-1">{icon}<span className="text-xs text-muted-foreground">{label}</span></div>
      <p className="text-xl font-bold">{value}</p>
    </Card>
  );
}
