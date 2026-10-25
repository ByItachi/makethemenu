import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, CreditCard, Landmark, Loader2, Lock, Minus, Plus, ShieldCheck, ShoppingBag, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getPlan, computeTotals, type BillingCycle, type PlanDef } from "@shared/plans";
import { useSeo } from "@/lib/seo";

const fmt = (n: number) => n.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function PlanCheckout() {
  const [, navigate] = useLocation();
  useSeo({
    title: "Plan Satın Al — Makethemenu",
    description: "Makethemenu aboneliğinizi güvenle satın alın: sepet, fatura bilgileri ve kart ile ödeme adımları.",
    path: "/checkout",
  });

  // Query parametreleri: /checkout?plan=baslangic&cycle=monthly
  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const initialPlan = getPlan(params.get("plan")) ?? getPlan("profesyonel")!;

  const [plan, setPlan] = useState<PlanDef>(initialPlan);
  const [cycle, setCycle] = useState<BillingCycle>((params.get("cycle") === "annual" ? "annual" : "monthly") as BillingCycle);
  const [step, setStep] = useState(1); // 1 Sepet · 2 Fatura · 3 Ödeme · 4 Başarı
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [order, setOrder] = useState<{ orderNo: string; invoiceNo: string; total: number } | null>(null);

  // Kurumsal gibi satın alınamayan planlar iletişime yönlendirilir.
  useEffect(() => {
    if (!plan.purchasable) navigate("/iletisim", { replace: true });
  }, [plan, navigate]);

  // Oturum varsa sipariş işletmeye bağlanır (opsiyonel).
  const { data: me } = useQuery<{ restaurant?: { id: number } | null }>({
    queryKey: ["/api/auth/me"],
    queryFn: async () => {
      const r = await fetch("/api/auth/me", { credentials: "include" });
      return r.ok ? r.json() : null;
    },
    retry: false,
  });

  const totals = computeTotals(plan, cycle);

  const [billing, setBilling] = useState({ companyName: "", taxNo: "", taxOffice: "", address: "", email: "", phone: "" });
  const [card, setCard] = useState({ holder: "", number: "", expiry: "", cvv: "" });
  const [paymentMethod, setPaymentMethod] = useState<"card" | "transfer">("card");

  const setB = (k: keyof typeof billing) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setBilling((p) => ({ ...p, [k]: e.target.value }));
  const setC = (k: keyof typeof card) => (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value;
    if (k === "number") v = v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
    if (k === "expiry") { const d = v.replace(/\D/g, "").slice(0, 4); v = d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d; }
    if (k === "cvv") v = v.replace(/\D/g, "").slice(0, 4);
    setCard((p) => ({ ...p, [k]: v }));
  };

  function validateStep1(): string | null {
    if (!plan.purchasable) return "Bu plan çevrimiçi satılamaz.";
    return null;
  }
  function validateStep2(): string | null {
    if (billing.companyName.trim().length < 2) return "Firma ünvanı en az 2 karakter olmalıdır.";
    if (!/^\d{10,11}$/.test(billing.taxNo.trim())) return "Vergi numarası 10-11 haneli olmalıdır.";
    if (billing.address.trim().length < 10) return "Fatura adresi en az 10 karakter olmalıdır.";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(billing.email.trim())) return "Geçerli bir e-posta girin.";
    return null;
  }
  function validateStep3(): string | null {
    if (paymentMethod === "transfer") return null;
    if (card.holder.trim().length < 2) return "Kart üzerindeki isim gerekli.";
    if (!/^\d{13,16}$/.test(card.number.replace(/\s/g, ""))) return "Kart numarası 13-16 haneli olmalıdır.";
    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(card.expiry)) return "Son kullanma tarihi AA/YY formatında olmalıdır.";
    if (!/^\d{3,4}$/.test(card.cvv)) return "CVV 3-4 haneli olmalıdır.";
    return null;
  }

  async function submit() {
    const err = validateStep3();
    if (err) { setError(err); return; }
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/subscription-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          planId: plan.id,
          billingCycle: cycle,
          billing,
          paymentMethod,
          ...(paymentMethod === "card" ? {
            card: {
              holder: card.holder,
              number: card.number.replace(/\s/g, ""),
              expiry: card.expiry,
              cvv: card.cvv,
            },
          } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.details?.[0]?.message ?? data?.error ?? "Ödeme alınamadı.");
        return;
      }
      setOrder({ orderNo: data.orderNo, invoiceNo: data.invoiceNo, total: data.total });
      setStep(4);
      window.scrollTo(0, 0);
    } catch {
      setError("Sunucuya ulaşılamadı. Lütfen tekrar deneyin.");
    } finally {
      setSubmitting(false);
    }
  }

  const steps = ["Sepet", "Fatura Bilgileri", paymentMethod === "transfer" ? "Havale/EFT" : "Ödeme", "Onay"];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-6xl mx-auto px-4 pt-28 pb-20">
        <div className="mb-10 text-center">
          <h1 className="text-3xl md:text-4xl font-display font-bold">
            Plan <span className="text-primary">Satın Al</span>
          </h1>
          <p className="text-muted-foreground mt-2">Sepetinizi gözden geçirin, fatura ve ödeme adımlarını tamamlayın.</p>
        </div>

        {/* Adım göstergesi */}
        <ol className="flex items-center justify-center gap-2 sm:gap-4 mb-10 text-xs sm:text-sm" aria-label="Ödeme adımları">
          {steps.map((label, i) => (
            <li key={label} className="flex items-center gap-2">
              <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border ${step > i + 1 ? "bg-primary text-primary-foreground border-primary" : step === i + 1 ? "border-primary text-primary" : "border-border text-muted-foreground"}`}>
                {step > i + 1 ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
              </span>
              <span className={step === i + 1 ? "font-semibold" : "text-muted-foreground hidden sm:inline"}>{label}</span>
              {i < steps.length - 1 && <span className="w-6 sm:w-10 h-px bg-border" aria-hidden="true" />}
            </li>
          ))}
        </ol>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* Sol: adım içeriği */}
          <div className="lg:col-span-3">
            {step === 1 && (
              <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><ShoppingBag className="w-5 h-5 text-primary" /> Sepetiniz</h2>
                {/* Plan seçimi */}
                <div className="space-y-3 mb-6">
                  {(["baslangic", "profesyonel"] as const).map((id) => {
                    const p = getPlan(id)!;
                    const active = plan.id === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setPlan(p)}
                        aria-pressed={active}
                        className={`w-full text-left rounded-xl border p-4 transition-colors ${active ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="font-semibold">{p.name}</p>
                            <p className="text-sm text-muted-foreground">{p.desc}</p>
                          </div>
                          <p className="font-bold text-primary whitespace-nowrap">₺{p.monthlyPrice}/ay</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
                {/* Periyot */}
                <div className="flex items-center justify-between gap-4 rounded-xl border border-border p-4">
                  <div>
                    <Label htmlFor="cycle">Faturalandırma Periyodu</Label>
                    <p className="text-sm text-muted-foreground">Yıllık ödemede %20 indirim uygulanır.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button type="button" size="sm" variant={cycle === "monthly" ? "default" : "outline"} onClick={() => setCycle("monthly")}>Aylık</Button>
                    <Button type="button" size="sm" variant={cycle === "annual" ? "default" : "outline"} onClick={() => setCycle("annual")}>Yıllık</Button>
                  </div>
                </div>
                {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
                <div className="mt-6 flex justify-end">
                  <Button onClick={() => { const e = validateStep1(); if (e) setError(e); else { setError(null); setStep(2); window.scrollTo(0, 0); } }}>
                    Devam Et
                  </Button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                <h2 className="text-lg font-bold mb-4">Fatura Bilgileri</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <Label htmlFor="companyName">Firma Ünvanı *</Label>
                    <Input id="companyName" value={billing.companyName} onChange={setB("companyName")} placeholder="Ör. ABC Gıda San. Tic. Ltd. Şti." required />
                  </div>
                  <div>
                    <Label htmlFor="taxNo">Vergi Numarası *</Label>
                    <Input id="taxNo" inputMode="numeric" value={billing.taxNo} onChange={setB("taxNo")} placeholder="1234567890" required />
                  </div>
                  <div>
                    <Label htmlFor="taxOffice">Vergi Dairesi</Label>
                    <Input id="taxOffice" value={billing.taxOffice} onChange={setB("taxOffice")} placeholder="Ör. Kadıköy" />
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor="address">Fatura Adresi *</Label>
                    <Input id="address" value={billing.address} onChange={setB("address")} placeholder="Mahalle, sokak, no, ilçe/il" required />
                  </div>
                  <div>
                    <Label htmlFor="email">E-Posta *</Label>
                    <Input id="email" type="email" value={billing.email} onChange={setB("email")} placeholder="fatura@sirket.com" required />
                  </div>
                  <div>
                    <Label htmlFor="phone">Telefon</Label>
                    <Input id="phone" type="tel" value={billing.phone} onChange={setB("phone")} placeholder="0 5xx xxx xx xx" />
                  </div>
                </div>
                {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
                <div className="mt-6 flex justify-between">
                  <Button variant="outline" onClick={() => setStep(1)}>Geri</Button>
                  <Button onClick={() => { const e = validateStep2(); if (e) setError(e); else { setError(null); setStep(3); window.scrollTo(0, 0); } }}>
                    Devam Et
                  </Button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                <h2 className="text-lg font-bold mb-4">{paymentMethod === "transfer" ? "Havale / EFT" : "Kart ile Ödeme"}</h2>
                <div className="flex gap-2 mb-6" role="tablist" aria-label="Ödeme yöntemi">
                  <button type="button" role="tab" aria-selected={paymentMethod === "card"} onClick={() => setPaymentMethod("card")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm ${paymentMethod === "card" ? "border-primary bg-primary/5 font-semibold" : "border-border"}`}>
                    <CreditCard className="w-4 h-4" /> Kredi Kartı
                  </button>
                  <button type="button" role="tab" aria-selected={paymentMethod === "transfer"} onClick={() => setPaymentMethod("transfer")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm ${paymentMethod === "transfer" ? "border-primary bg-primary/5 font-semibold" : "border-border"}`}>
                    <Landmark className="w-4 h-4" /> Havale / EFT
                  </button>
                </div>

                {paymentMethod === "card" ? (
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <Label htmlFor="cardHolder">Kart Üzerindeki İsim *</Label>
                      <Input id="cardHolder" value={card.holder} onChange={setC("holder")} placeholder="FATMA YILMAZ" autoComplete="cc-name" required />
                    </div>
                    <div className="sm:col-span-2">
                      <Label htmlFor="cardNumber">Kart Numarası *</Label>
                      <Input id="cardNumber" inputMode="numeric" value={card.number} onChange={setC("number")} placeholder="4242 4242 4242 4242" autoComplete="cc-number" required />
                    </div>
                    <div>
                      <Label htmlFor="cardExpiry">Son Kullanma (AA/YY) *</Label>
                      <Input id="cardExpiry" inputMode="numeric" value={card.expiry} onChange={setC("expiry")} placeholder="12/28" autoComplete="cc-exp" required />
                    </div>
                    <div>
                      <Label htmlFor="cardCvv">CVV *</Label>
                      <Input id="cardCvv" inputMode="numeric" value={card.cvv} onChange={setC("cvv")} placeholder="123" autoComplete="cc-csc" required />
                    </div>
                    <p className="sm:col-span-2 text-xs text-muted-foreground flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5" /> Kart bilgileriniz sizin cihazınızdan sunucuya şifreli iletilir; kart numarası tam olarak saklanmaz.
                    </p>
                  </div>
                ) : (
                  <div className="rounded-xl border border-border p-4 text-sm text-muted-foreground space-y-2">
                    <p>Havale/EFT bildiriminizden sonra aboneliğiniz en kısa sürede aktifleştirilir.</p>
                    <p className="font-medium text-foreground">Alıcı: Makethemenu Yazılım A.Ş. — TRxx xxxx xxxx xxxx xxxx xx xx</p>
                    <p>Açıklama alanına sipariş numaranızı yazmanız yeterlidir.</p>
                  </div>
                )}
                {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
                <div className="mt-6 flex justify-between">
                  <Button variant="outline" onClick={() => setStep(2)}>Geri</Button>
                  <Button onClick={submit} disabled={submitting}>
                    {submitting ? (<><Loader2 className="w-4 h-4 animate-spin" /> İşleniyor…</>) : paymentMethod === "card" ? `₺${fmt(totals.total)} Öde` : "Siparişi Tamamla"}
                  </Button>
                </div>
              </div>
            )}

            {step === 4 && order && (
              <div className="bg-card border border-border rounded-2xl p-8 shadow-sm text-center">
                <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-950 text-green-600 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Siparişiniz Alındı</h2>
                <p className="text-muted-foreground mb-6">Fatura kopyası <span className="font-medium text-foreground">{billing.email}</span> adresine gönderilecektir.</p>
                <dl className="text-sm text-left max-w-sm mx-auto space-y-2 mb-8">
                  <div className="flex justify-between"><dt className="text-muted-foreground">Sipariş No</dt><dd className="font-mono font-medium">{order.orderNo}</dd></div>
                  <div className="flex justify-between"><dt className="text-muted-foreground">Fatura No</dt><dd className="font-mono font-medium">{order.invoiceNo}</dd></div>
                  <div className="flex justify-between"><dt className="text-muted-foreground">Plan</dt><dd className="font-medium">{plan.name} ({cycle === "annual" ? "Yıllık" : "Aylık"})</dd></div>
                  <div className="flex justify-between border-t border-border pt-2"><dt className="text-muted-foreground">Toplam</dt><dd className="font-bold text-primary">₺{fmt(order.total)}</dd></div>
                </dl>
                <p className="text-xs text-muted-foreground mb-6 flex items-center justify-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-primary" /> Bu bir demo ödeme altyapısıdır; gerçek tahsilat yapılmaz.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  {me?.restaurant ? (
                    <Button onClick={() => navigate("/restoran/dashboard")}>Panele Git</Button>
                  ) : (
                    <Button onClick={() => navigate("/kayit")}>Hesap Oluştur & Kuruluma Başla</Button>
                  )}
                  <Button variant="outline" onClick={() => navigate("/fiyatlar")}>Fiyat Sayfasına Dön</Button>
                </div>
              </div>
            )}
          </div>

          {/* Sağ: sipariş özeti (sepet) */}
          <aside className="lg:col-span-2" aria-label="Sipariş özeti">
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm sticky top-24">
              <h2 className="text-lg font-bold mb-4">Sipariş Özeti</h2>
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <p className="font-semibold">{plan.name} Planı</p>
                  <p className="text-sm text-muted-foreground">{cycle === "annual" ? "Yıllık faturalandırma" : "Aylık faturalandırma"}</p>
                </div>
                {step === 1 ? (
                  <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                    <Plus className="w-3 h-3" /><Minus className="w-3 h-3" /> 1 adet
                  </span>
                ) : (
                  <button type="button" className="text-xs text-primary hover:underline" onClick={() => setStep(1)}>Düzenle</button>
                )}
              </div>
              <dl className="text-sm space-y-2 border-t border-border pt-4">
                <div className="flex justify-between"><dt className="text-muted-foreground">Ara Toplam</dt><dd>₺{fmt(totals.periodAmount)}</dd></div>
                {cycle === "annual" && (
                  <div className="flex justify-between text-green-600"><dt>Yıllık indirim (%20)</dt><dd>−₺{fmt(Math.round(plan.monthlyPrice! * 12 * 0.2))}</dd></div>
                )}
                <div className="flex justify-between"><dt className="text-muted-foreground">KDV (%20)</dt><dd>₺{fmt(totals.vat)}</dd></div>
                <div className="flex justify-between border-t border-border pt-3 text-base font-bold"><dt>Toplam</dt><dd>₺{fmt(totals.total)}</dd></div>
              </dl>
              {step < 4 && (
                <button type="button" className="mt-4 text-xs text-muted-foreground hover:text-destructive inline-flex items-center gap-1" onClick={() => setStep(1)}>
                  <Trash2 className="w-3 h-3" /> Sepeti boşalt
                </button>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
