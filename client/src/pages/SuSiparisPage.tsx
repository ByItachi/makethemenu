import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Droplets, Clock, Truck, RefreshCw, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

interface WaterProduct { id: number; name: string; kind: string; price: string; depositFee: string; }
interface CartLine { productId: number; qty: number; emptyReturn: number; }

export default function SuSiparisPage() {
  const [products, setProducts] = useState<WaterProduct[]>([]);
  const [cart, setCart] = useState<Record<number, CartLine>>({});
  const [form, setForm] = useState({
    customerName: "", phone: "", addressText: "", scheduledDate: "", timeSlot: "10:00-13:00",
    note: "", paymentMethod: "cash",
  });
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ orderNo: string; total: number } | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/water/products")
      .then((r) => r.json())
      .then((d) => setProducts(d.products ?? []))
      .catch(() => setProducts([]));
    const el = document.querySelector<HTMLInputElement>("#su-date");
    if (el) el.min = new Date().toISOString().slice(0, 10);
  }, []);

  const total = useMemo(() => {
    return products.reduce((sum, p) => {
      const line = cart[p.id];
      if (!line) return sum;
      return sum + Number(p.price) * line.qty + Number(p.depositFee) * line.qty;
    }, 0);
  }, [cart, products]);

  const setQty = (p: WaterProduct, qty: number) => {
    setCart((c) => {
      const next = { ...c };
      if (qty <= 0) delete next[p.id];
      else next[p.id] = { productId: p.id, qty, emptyReturn: next[p.id]?.emptyReturn ?? 0 };
      return next;
    });
  };

  const submit = async () => {
    setError("");
    const items = Object.values(cart);
    if (!items.length) return setError("Sepetinizde ürün yok.");
    if (!form.customerName || !form.phone || !form.addressText || !form.scheduledDate)
      return setError("Ad, telefon, adres ve teslimat günü zorunludur.");
    setSubmitting(true);
    try {
      const res = await fetch("/api/water/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idempotencyKey: `su-web-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
          ...form,
          items,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Sipariş oluşturulamadı");
      setResult({ orderNo: data.orderNo, total: data.total });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Bir hata oluştu");
    } finally {
      setSubmitting(false);
    }
  };

  const features = [
    { icon: <Droplets className="h-8 w-8 text-primary" />, title: "Aynı Gün Teslimat", description: "Günün teslimat aralıklarına göre sipariş verin, damacananız zamanında gelsin." },
    { icon: <RefreshCw className="h-8 w-8 text-primary" />, title: "Damacana Takibi", description: "Dolu alınan ve boş teslim edilen damacanalar sisteme işlenir; bakiyeniz her zaman doğru." },
    { icon: <Clock className="h-8 w-8 text-primary" />, title: "Saat Aralığı Seçimi", description: "Siparişinizi gün içinde size uygun zaman aralığına planlayın." },
    { icon: <Truck className="h-8 w-8 text-primary" />, title: "Rota Planlaması", description: "Operasyon ekibi bölge bazlı rota kurar; şoför ve araç ataması yapılır." },
    { icon: <ShieldCheck className="h-8 w-8 text-primary" />, title: "Depozito Güvencesi", description: "Depozito ücretleri şeffaf; boş damacana iadesiyle bakiyeniz güncellenir." },
    { icon: <Check className="h-8 w-8 text-primary" />, title: "Kapıda Ödeme", description: "Nakit, kapıda kart veya havale seçenekleriyle ödeme kolaylığı." },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/20 to-white/0 dark:to-transparent pointer-events-none" />
        <div className="site-container text-center pt-32 relative z-10">
          <h1 className="text-5xl md:text-6xl font-display font-bold mb-6">
            Su Dağıtım ve <span className="text-primary">Damacana</span> Siparişi
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Damacana, pet şişe ve koli siparişlerinizi dakikalar içinde oluşturun. Boş damacana iadeniz ve depozito bakiyeniz otomatik takip edilir.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="text-lg px-8" onClick={() => document.querySelector("#siparis")?.scrollIntoView({ behavior: "smooth" })}>
              Hemen Sipariş Ver
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8" onClick={() => (window.location.href = "/su")}>
              Demo Paneli Gör
            </Button>
          </div>
        </div>
      </section>

      <section className="py-20 bg-muted/30">
        <div className="site-container">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-display font-bold mb-4">Nasıl <span className="text-primary">Çalışır?</span></h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">Siparişten teslimata tüm süreç sistemde izlenebilir.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <Card key={i} className="p-6 hover:shadow-lg transition-shadow duration-300">
                <div className="mb-4">{f.icon}</div>
                <h3 className="text-xl font-bold mb-3">{f.title}</h3>
                <p className="text-muted-foreground">{f.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Sipariş formu */}
      <section id="siparis" className="py-20">
        <div className="site-container max-w-4xl">
          <h2 className="text-3xl font-display font-bold mb-8 text-center">Sipariş <span className="text-primary">Oluştur</span></h2>

          {result ? (
            <Card className="p-8 text-center border-green-300 dark:border-green-700">
              <div className="w-14 h-14 rounded-full bg-green-100 dark:bg-green-900/40 text-green-600 flex items-center justify-center mx-auto mb-4">
                <Check className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Siparişiniz alındı</h3>
              <p className="text-muted-foreground mb-1">Sipariş numaranız: <span className="font-mono font-bold">{result.orderNo}</span></p>
              <p className="text-muted-foreground mb-6">Tutar: ₺{result.total.toFixed(2)}</p>
              <Button variant="outline" onClick={() => setResult(null)}>Yeni Sipariş</Button>
            </Card>
          ) : (
            <Card className="p-6 sm:p-8">
              <div className="space-y-3 mb-8">
                {products.map((p) => {
                  const line = cart[p.id];
                  return (
                    <div key={p.id} className="flex flex-col sm:flex-row sm:items-center gap-3 border-b border-border/40 pb-3">
                      <div className="flex-1">
                        <p className="font-medium">{p.name}</p>
                        <p className="text-sm text-muted-foreground">
                          ₺{Number(p.price).toFixed(2)}
                          {Number(p.depositFee) > 0 && <> + depozito ₺{Number(p.depositFee).toFixed(2)}</>}
                        </p>
                      </div>
                      {p.kind === "damacana" && line && (
                        <label className="text-sm text-muted-foreground flex items-center gap-2">
                          Boş iade:
                          <input
                            type="number" min={0} max={line.qty * 5} value={line.emptyReturn}
                            onChange={(e) => setCart((c) => ({ ...c, [p.id]: { ...c[p.id], emptyReturn: Math.max(0, Number(e.target.value)) } }))}
                            className="w-16 h-9 rounded-md border border-input bg-background px-2"
                          />
                        </label>
                      )}
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setQty(p, (line?.qty ?? 0) - 1)}>-</Button>
                        <span className="w-8 text-center font-medium">{line?.qty ?? 0}</span>
                        <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setQty(p, (line?.qty ?? 0) + 1)}>+</Button>
                      </div>
                    </div>
                  );
                })}
                {!products.length && <p className="text-muted-foreground">Ürün kataloğu yükleniyor…</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input className="h-10 rounded-md border border-input bg-background px-3" placeholder="Ad Soyad" value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} />
                <input className="h-10 rounded-md border border-input bg-background px-3" placeholder="Telefon (05xx…)" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                <input id="su-date" type="date" className="h-10 rounded-md border border-input bg-background px-3 md:col-span-2" value={form.scheduledDate} onChange={(e) => setForm({ ...form, scheduledDate: e.target.value })} />
                <select className="h-10 rounded-md border border-input bg-background px-3" value={form.timeSlot} onChange={(e) => setForm({ ...form, timeSlot: e.target.value })}>
                  {["09:00-12:00", "10:00-13:00", "13:00-16:00", "16:00-19:00"].map((s) => <option key={s}>{s}</option>)}
                </select>
                <select className="h-10 rounded-md border border-input bg-background px-3" value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}>
                  <option value="cash">Kapıda Nakit</option>
                  <option value="card_on_delivery">Kapıda Kredi Kartı</option>
                  <option value="transfer">Havale / EFT</option>
                </select>
                <textarea className="min-h-[80px] rounded-md border border-input bg-background px-3 py-2 md:col-span-2" placeholder="Adres (mahalle, sokak, no, kat)" value={form.addressText} onChange={(e) => setForm({ ...form, addressText: e.target.value })} />
                <textarea className="min-h-[60px] rounded-md border border-input bg-background px-3 py-2 md:col-span-2" placeholder="Teslimat notu (opsiyonel)" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
              </div>

              {error && <p className="text-destructive text-sm mt-3">{error}</p>}
              <div className="flex items-center justify-between mt-6">
                <p className="text-lg font-semibold">Toplam: ₺{total.toFixed(2)}</p>
                <Button size="lg" disabled={submitting} onClick={submit}>{submitting ? "Gönderiliyor…" : "Siparişi Onayla"}</Button>
              </div>
            </Card>
          )}
        </div>
      </section>

      <section className="py-20 bg-primary text-primary-foreground">
        <div className="site-container text-center">
          <h2 className="text-4xl font-display font-bold mb-6">Su Dağıtım İşletmeniz İçin Panel Mi Arıyorsunuz?</h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Damacana bakiyesi, rota planlama, tahsilat ve filo takibi tek panelde.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="text-lg px-8" onClick={() => (window.location.href = "/kayit")}>Hemen Başla</Button>
            <Button size="lg" variant="outline" className="text-lg px-8 border-white/20 text-white hover:bg-white/10" onClick={() => (window.location.href = "/fiyatlar")}>Detaylı Bilgi Al</Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
