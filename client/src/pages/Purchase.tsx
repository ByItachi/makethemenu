import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { 
  CreditCard, 
  Calendar, 
  CheckCircle2, 
  Package, 
  FileText, 
  ShieldCheck, 
  ArrowRight,
  Landmark
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import PaymentComponent from "@/components/PaymentComponent";

const Purchase = () => {
  const [location, navigate] = useLocation();
  const [step, setStep] = useState(1);
  const [selectedPlan, setSelectedPlan] = useState("pro");
  const [billingCycle, setBillingCycle] = useState("annual");
  const [customerInfo, setCustomerInfo] = useState({
    companyName: '',
    taxNo: '',
    taxOffice: '',
    address: ''
  });
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const plan = searchParams.get('plan');
    if (plan) {
      setSelectedPlan(plan);
    }
  }, [location]);

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  const handleCustomerInfoChange = (field: string, value: string) => {
    setCustomerInfo(prev => ({ ...prev, [field]: value }));
  };

  const handlePaymentSuccess = (paymentResult: any) => {
    setPaymentProcessing(false);
    // Show success message and redirect to dashboard
    alert('Ödeme başarıyla tamamlandı! Lisansınız yenilendi.');
    navigate('/admin/dashboard');
  };

  const handlePaymentError = (error: string) => {
    setPaymentProcessing(false);
    alert(`Ödeme hatası: ${error}`);
  };

  const handlePaymentCancel = () => {
    setPaymentProcessing(false);
    setStep(2); // Go back to payment method selection
  };

  const planMonthly = selectedPlan === 'basic' ? 299 : selectedPlan === 'enterprise' ? 999 : 599;
  const planTotal = billingCycle === 'annual' ? Math.round(planMonthly * 12 * 0.8) : planMonthly;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Lisans Yenileme</h1>
        <p className="text-slate-500 dark:text-slate-400">İşletmeniz için en uygun planı seçin ve lisansınızı yenileyin.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Summary */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="dark:bg-slate-800 dark:border-slate-700">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Sipariş Özeti</CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
                <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-slate-500 dark:text-slate-400">Plan</span>
                    <span className="font-medium dark:text-slate-200 capitalize">{selectedPlan}</span>
                </div>
                <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-slate-500 dark:text-slate-400">Ödeme Periyodu</span>
                    <span className="font-medium dark:text-slate-200">{billingCycle === 'annual' ? 'Yıllık' : 'Aylık'}</span>
                </div>
                <Separator className="my-4" />
                <div className="flex items-center justify-between font-bold">
                    <span className="text-lg text-slate-800 dark:text-white">Toplam</span>
                    <span className="text-lg text-slate-800 dark:text-white">₺{planTotal}</span>
                </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Payment Wizard */}
        <div className="lg:col-span-2">
          <Card className="dark:bg-slate-800 dark:border-slate-700 h-full">
            <CardHeader>
              <CardTitle>Lisans Yenileme</CardTitle>
              <div className="flex items-center gap-2 mt-6">
                <div className={`flex items-center gap-2 ${step >= 1 ? 'text-primary' : 'text-slate-400'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step >= 1 ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500 dark:bg-slate-700'}`}>1</div>
                  <span className="text-sm font-medium">Paket</span>
                </div>
                <div className="w-8 h-px bg-slate-200 dark:bg-slate-700"></div>
                <div className={`flex items-center gap-2 ${step >= 2 ? 'text-primary' : 'text-slate-400'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step >= 2 ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500 dark:bg-slate-700'}`}>2</div>
                  <span className="text-sm font-medium">Fatura</span>
                </div>
                <div className="w-8 h-px bg-slate-200 dark:bg-slate-700"></div>
                <div className={`flex items-center gap-2 ${step >= 3 ? 'text-primary' : 'text-slate-400'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step >= 3 ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500 dark:bg-slate-700'}`}>3</div>
                  <span className="text-sm font-medium">Ödeme</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {/* Step 1: Package Selection */}
              {step === 1 && (
                <div className="space-y-6">
                  <div className="flex justify-center mb-6">
                    <div className="bg-slate-100 p-1 rounded-lg flex dark:bg-slate-900">
                      <button 
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${billingCycle === 'monthly' ? 'bg-white shadow-sm text-slate-900 dark:bg-slate-800 dark:text-white' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'}`}
                        onClick={() => setBillingCycle('monthly')}
                      >
                        Aylık Ödeme
                      </button>
                      <button 
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${billingCycle === 'annual' ? 'bg-white shadow-sm text-slate-900 dark:bg-slate-800 dark:text-white' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'}`}
                        onClick={() => setBillingCycle('annual')}
                      >
                        Yıllık Ödeme (%20 İndirim)
                      </button>
                    </div>
                  </div>

                  <RadioGroup value={selectedPlan} onValueChange={setSelectedPlan} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className={`border-2 rounded-lg p-4 cursor-pointer hover:border-primary transition-all ${selectedPlan === 'basic' ? 'border-primary bg-blue-50/50 dark:bg-blue-900/10' : 'border-slate-100 dark:border-slate-700'}`} onClick={() => setSelectedPlan('basic')}>
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-bold text-lg dark:text-white">Başlangıç</span>
                        <RadioGroupItem value="basic" id="basic" />
                      </div>
                      <div className="text-2xl font-bold mb-2 dark:text-white">
                        {billingCycle === 'annual' ? '₺239' : '₺299'} <span className="text-sm font-normal text-slate-500">/ay</span>
                      </div>
                      <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                        <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" /> 5 Masa</li>
                        <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" /> Temel Raporlar</li>
                        <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" /> Mobil Destek</li>
                      </ul>
                    </div>

                    <div className={`border-2 rounded-lg p-4 cursor-pointer hover:border-primary transition-all relative ${selectedPlan === 'pro' ? 'border-primary bg-blue-50/50 dark:bg-blue-900/10' : 'border-slate-100 dark:border-slate-700'}`} onClick={() => setSelectedPlan('pro')}>
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                        En Popüler
                      </div>
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-bold text-lg dark:text-white">Profesyonel</span>
                        <RadioGroupItem value="pro" id="pro" />
                      </div>
                      <div className="text-2xl font-bold mb-2 dark:text-white">
                        {billingCycle === 'annual' ? '₺479' : '₺599'} <span className="text-sm font-normal text-slate-500">/ay</span>
                      </div>
                      <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                        <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" /> Sınırsız Masa</li>
                        <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" /> Gelişmiş Analizler</li>
                        <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" /> Stok Takibi</li>
                        <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" /> 7/24 Destek</li>
                      </ul>
                    </div>

                    <div className={`border-2 rounded-lg p-4 cursor-pointer hover:border-primary transition-all ${selectedPlan === 'enterprise' ? 'border-primary bg-blue-50/50 dark:bg-blue-900/10' : 'border-slate-100 dark:border-slate-700'}`} onClick={() => setSelectedPlan('enterprise')}>
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-bold text-lg dark:text-white">Kurumsal</span>
                        <RadioGroupItem value="enterprise" id="enterprise" />
                      </div>
                      <div className="text-2xl font-bold mb-2 dark:text-white">
                        {billingCycle === 'annual' ? '₺799' : '₺999'} <span className="text-sm font-normal text-slate-500">/ay</span>
                      </div>
                      <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                        <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" /> Çoklu Şube</li>
                        <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" /> API Erişimi</li>
                        <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" /> Özel Entegrasyon</li>
                        <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" /> Özel Danışman</li>
                      </ul>
                    </div>
                  </RadioGroup>
                </div>
              )}

              {/* Step 2: Invoice Details */}
              {step === 2 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="companyName">Firma Ünvanı</Label>
                      <Input
                        id="companyName"
                        name="companyName"
                        placeholder="İşletmenizin tam adı"
                        value={customerInfo.companyName}
                        onChange={(e) => handleCustomerInfoChange('companyName', e.target.value)}
                        autoComplete="organization"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="taxNo">Vergi Numarası</Label>
                      <Input
                        id="taxNo"
                        name="taxNo"
                        placeholder="10 haneli vergi numaranız"
                        value={customerInfo.taxNo}
                        onChange={(e) => handleCustomerInfoChange('taxNo', e.target.value)}
                        autoComplete="off"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="taxOffice">Vergi Dairesi</Label>
                    <Input
                      id="taxOffice"
                      name="taxOffice"
                      placeholder="Bağlı olduğunuz vergi dairesi"
                      value={customerInfo.taxOffice}
                      onChange={(e) => handleCustomerInfoChange('taxOffice', e.target.value)}
                      autoComplete="off"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Fatura Adresi</Label>
                    <Input
                      id="address"
                      name="address"
                      placeholder="Açık adresiniz"
                      value={customerInfo.address}
                      onChange={(e) => handleCustomerInfoChange('address', e.target.value)}
                      autoComplete="street-address"
                    />
                  </div>
                  <div className="flex items-center space-x-2 mt-4">
                    <input type="checkbox" id="terms" className="rounded border-gray-300 text-primary focus:ring-primary" />
                    <Label htmlFor="terms" className="text-sm font-normal text-slate-600 dark:text-slate-400">
                      <a href="#" className="text-primary hover:underline">Mesafeli Satış Sözleşmesi</a>'ni okudum ve kabul ediyorum.
                    </Label>
                  </div>
                </div>
              )}

              {/* Step 3: Payment Options */}
              {step === 3 && (
                <PaymentComponent
                  amount={planTotal}
                  orderId={`LIC-${Date.now()}`}
                  customerEmail="customer@example.com" // This should come from user profile
                  customerName={customerInfo.companyName || 'Müşteri'}
                  customerPhone="5551234567" // This should come from user profile
                  paymentType="license"
                  items={[{
                    name: `${selectedPlan.toUpperCase()} Plan - ${billingCycle === 'annual' ? 'Yıllık' : 'Aylık'}`,
                    price: planTotal,
                    quantity: 1,
                    description: `makethemenu ${selectedPlan} lisans - ${billingCycle === 'annual' ? '12 ay' : '1 ay'}`
                  }]}
                  onPaymentSuccess={handlePaymentSuccess}
                  onPaymentError={handlePaymentError}
                  onPaymentCancel={handlePaymentCancel}
                />
              )}
            </CardContent>
            <CardFooter className="flex justify-between pt-2">
              <Button 
                variant="outline" 
                onClick={prevStep} 
                disabled={step === 1 || paymentProcessing}
              >
                Geri
              </Button>
              {step < 3 ? (
                <Button onClick={nextStep} className="gap-2" disabled={paymentProcessing}>
                  Devam Et <ArrowRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button 
                  className="bg-green-600 hover:bg-green-700 gap-2" 
                  disabled={paymentProcessing}
                  onClick={() => setPaymentProcessing(true)}
                >
                  {paymentProcessing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      İşlem Devam Ediyor...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" /> Ödemeyi Tamamla
                    </>
                  )}
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Purchase;