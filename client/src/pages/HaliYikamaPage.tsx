import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Sparkles, Clock, PackageCheck, ShieldCheck, Tag } from "lucide-react";
import { useMemo, useState } from "react";

/** Varsayılan tahmini fiyat cetveli — işletme panelinden değiştirilebilir (kademeli mimari). */
const PRICE_LIST: Record<string, number> = {
  yonasilmis: 60,
  makine: 45,
  el_dokuma: 120,
  shaggy: 70,
  kilim: 40,
  yolluk: 35,
};

export default function HaliYikamaPage() {
  const [form, setForm] = useState({
    customerName: "", phone: "", addressText: "", serviceType: "pickup_delivery",
    pieces: 1, carpetType: "yonasilmis", sizeW: 200, sizeH: 300,
    colorDesc: "", conditionNote: "", pickupDate: "", timeSlot: "10:00-13:00", note: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ orderNo: string; labelCodes: string[] } | null>(null);
  const [error, setError] = useState("");

  const estimate = useMemo(() => {
    const unit = PRICE_LIST[form.carpetType] ?? 60;
    const sqm = form.sizeW && form.sizeH ? (form.sizeW * form.sizeH) / 10_000 : 1;
    const perPiece = Math.max(unit * (sqm || 1), unit * 0.6);
    return perPiece * form.pieces;
  }, [form.carpetType, form.sizeW, form.sizeH, form.pieces]);

  const submit = async () => {
    setError("");
    if (!form.customerName || !form.phone || !form.addressText || !form.pickupDate)
      return setError("Ad, telefon, adres ve alım günü zorunludur.");
    setSubmitting(true);
    try {
      const res = await fetch("/api/carpet/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idempotencyKey: `hl-web-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
          ...form,
          estimatedPrice: estimate,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Talep oluşturulamadı");
      setResult({ orderNo: data.orderNo, labelCodes: data.labelCodes ?? [] });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Bir hata oluştu");
    } finally {
      setSubmitting(false);
    }
  };

  const features = [
    { icon: <PackageCheck className="h-8 w-8 text-primary" />, title: "Parça Bazlı Takip", description: "Her halıya özel etiket kodu verilir; yıkama aşamaları tek tek izlenir." },
    { icon: <Clock className="h-8 w-8 text-primary" />, title: "Aşama Durumu", description: "Toplandı, fabrikada, yıkanıyor, kalite kontrol, teslimde — her aşama kayıtlı." },
    { icon: <ShieldCheck className="h-8 w-8 text-primary" />, title: "Zarar Kaydı", description: "Alım anında halı durumu fotoğraf/ not ile işlenir; sorumluluk netleşir." },
    { icon: <Tag className="h-8 w-8 text-primary" />, title: "Şeffaf Fiyat", description: "Tahmini fiyat ölçüye göre verilir; kesin fiyat işletme onayıyla kesinleşir." },
    { icon: <Sparkles className="h-8 w-8 text-primary" />, title: "Kalite Kontrol", description: "Teslim öncesi kalite kontrol aşamasından geçmeyen halı teslime çıkmaz." },
    { icon: <Check className="h-8 w-8 text-primary" />, title: "Zaman Aralığı", description: "Alım ve teslimat için uygun gün ve saat aralığını siz seçin." },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/20 to-white/0 dark:to-transparent pointer-events-none" />
        <div className="site-container text-center pt-32 relative z-10">
          <h1 className="text-5xl md:text-6xl font-display font-bold mb-6">
            Halı Yıkama ve <span className="text-primary">Koltuk Takip</span> Sistemi
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Halınızı yıkamaya verin, her aşamayı etiket koduyla takip edin. Alımdan teslimata parça parça izlenebilir süreç.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="text-lg px-8" onClick={() => document.querySelector("#talep")?.scrollIntoView({ behavior: "smooth" })}>
              Yıkama Talebi Oluştur
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8" onClick={() => (window.location.href = "/hali")}>
              Demo Paneli Gör
            </Button>
          </div>
        </div>
      </section>

      <section className="py-20 bg-muted/30">
        <div className="site-container">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-display font-bold mb-4">Nasıl <span className="text-primary">Çalışır?</span></h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">Talepten teslimata 14 aşamalı üretim akışı.</p>
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

      {/* Talep formu */}
      <section id="talep" className="py-20">
        <div className="site-container max-w-4xl">
          <h2 className="text-3xl font-display font-bold mb-8 text-center">Yıkama <span className="text-primary">Talebi</span></h2>

          {result ? (
            <Card className="p-8 text-center border-green-300 dark:border-green-700">
              <div className="w-14 h-14 rounded-full bg-green-100 dark:bg-green-900/40 text-green-600 flex items-center justify-center mx-auto mb-4">
                <Check className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Talebiniz alındı</h3>
              <p className="text-muted-foreground mb-1">Sipariş numaranız: <span className="font-mono font-bold">{result.orderNo}</span></p>
              <p className="text-muted-foreground mb-4">Her halınız için verilen etiket kodları — alımda halıların üzerine yapıştırılacaktır:</p>
              <div className="flex flex-wrap justify-center gap-2 mb-6">
                {result.labelCodes.map((c) => (
                  <span key={c} className="font-mono bg-muted px-3 py-1 rounded-md text-sm">{c}</span>
                ))}
              </div>
              <Button variant="outline" onClick={() => setResult(null)}>Yeni Talep</Button>
            </Card>
          ) : (
            <Card className="p-6 sm:p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input className="h-10 rounded-md border border-input bg-background px-3" placeholder="Ad Soyad" value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} />
                <input className="h-10 rounded-md border border-input bg-background px-3" placeholder="Telefon (05xx…)" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                <textarea className="min-h-[80px] rounded-md border border-input bg-background px-3 py-2 md:col-span-2" placeholder="Adres (mahalle, sokak, no, kat)" value={form.addressText} onChange={(e) => setForm({ ...form, addressText: e.target.value })} />
                <select className="h-10 rounded-md border border-input bg-background px-3" value={form.serviceType} onChange={(e) => setForm({ ...form, serviceType: e.target.value })}>
                  <option value="pickup_delivery">Yerinden Al / Teslim Et</option>
                  <option value="factory_only">Fabrikaya Ben Getireceğim</option>
                </select>
                <select className="h-10 rounded-md border border-input bg-background px-3" value={form.carpetType} onChange={(e) => setForm({ ...form, carpetType: e.target.value })}>
                  <option value="yonasilmis">Yün Halı (Yönlü Dokuma)</option>
                  <option value="makine">Makine Halısı</option>
                  <option value="el_dokuma">El Dokuması</option>
                  <option value="shaggy">Shaggy</option>
                  <option value="kilim">Kilim</option>
                  <option value="yolluk">Yolluk / Koşucu</option>
                </select>
                <label className="text-sm text-muted-foreground">Adet
                  <input type="number" min={1} max={100} className="w-full h-10 rounded-md border border-input bg-background px-3 mt-1" value={form.pieces} onChange={(e) => setForm({ ...form, pieces: Math.max(1, Number(e.target.value)) })} />
                </label>
                <label className="text-sm text-muted-foreground">En (cm)
                  <input type="number" min={0} max={600} className="w-full h-10 rounded-md border border-input bg-background px-3 mt-1" value={form.sizeW} onChange={(e) => setForm({ ...form, sizeW: Math.max(0, Number(e.target.value)) })} />
                </label>
                <label className="text-sm text-muted-foreground">Boy (cm)
                  <input type="number" min={0} max={1000} className="w-full h-10 rounded-md border border-input bg-background px-3 mt-1" value={form.sizeH} onChange={(e) => setForm({ ...form, sizeH: Math.max(0, Number(e.target.value)) })} />
                </label>
                <input className="h-10 rounded-md border border-input bg-background px-3" placeholder="Renk tanımı (örn. bordo — krem)" value={form.colorDesc} onChange={(e) => setForm({ ...form, colorDesc: e.target.value })} />
                <input id="hl-date" type="date" className="h-10 rounded-md border border-input bg-background px-3" value={form.pickupDate} onChange={(e) => setForm({ ...form, pickupDate: e.target.value })} />
                <select className="h-10 rounded-md border border-input bg-background px-3" value={form.timeSlot} onChange={(e) => setForm({ ...form, timeSlot: e.target.value })}>
                  {["09:00-12:00", "10:00-13:00", "13:00-16:00", "16:00-19:00"].map((s) => <option key={s}>{s}</option>)}
                </select>
                <textarea className="min-h-[60px] rounded-md border border-input bg-background px-3 py-2 md:col-span-2" placeholder="Halı durumu / zarar notu (opsiyonel)" value={form.conditionNote} onChange={(e) => setForm({ ...form, conditionNote: e.target.value })} />
              </div>

              <div className="mt-6 rounded-lg bg-primary/10 border border-primary/20 p-4">
                <p className="text-sm text-muted-foreground">Tahmini fiyat (ölçü ve türe göre):</p>
                <p className="text-2xl font-bold">₺{estimate.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground mt-1">Bu tutar bilgilendirme amaçlıdır; kesin fiyat halı görüldükten sonra işletme onayıyla kesinleşir.</p>
              </div>

              {error && <p className="text-destructive text-sm mt-3">{error}</p>}
              <div className="flex justify-end mt-6">
                <Button size="lg" disabled={submitting} onClick={submit}>{submitting ? "Gönderiliyor…" : "Talebi Gönder"}</Button>
              </div>
            </Card>
          )}
        </div>
      </section>

      <section className="py-20 bg-primary text-primary-foreground">
        <div className="site-container text-center">
          <h2 className="text-4xl font-display font-bold mb-6">Halı Yıkama İşletmeniz İçin Panel Mi Arıyorsunuz?</h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Üretim kanbanı, barkod etiketleme, ölçü-metre kaydı ve tahsilat takibi tek panelde.
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
