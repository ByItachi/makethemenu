import React, { useState } from "react";
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

const OnlineAccount = () => {
  const [step, setStep] = useState(1);
  const [selectedPlan, setSelectedPlan] = useState("pro");
  const [billingCycle, setBillingCycle] = useState("annual");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [cardHolder, setCardHolder] = useState("");
  const [cardBrand, setCardBrand] = useState("");
  const [cardProgram, setCardProgram] = useState("");

  const detectBrand = (digits: string) => {
    if (/^4\d{0,}/.test(digits)) return "Visa";
    if (/^(5[1-5]|2(2[2-9]|[3-6]|7[01]|720))\d*/.test(digits)) return "Mastercard";
    if (/^9792\d*/.test(digits)) return "Troy";
    return "";
  };

  const detectProgram = (digits: string) => {
    const bin = digits.slice(0, 6);
    const axessBins = ["557113", "557114", "521532", "552608"];
    if (axessBins.includes(bin)) return "Axess";
    return "";
  };

  const formatCardNumber = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 19);
    const parts = [];
    for (let i = 0; i < digits.length; i += 4) parts.push(digits.slice(i, i + 4));
    return parts.join(" ");
  };

  const onChangeCardNumber = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value);
    setCardNumber(formatted);
    const digits = formatted.replace(/\s/g, "");
    setCardBrand(detectBrand(digits));
    setCardProgram(detectProgram(digits));
  };

  const onChangeExpiry = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 4);
    let mm = digits.slice(0, 2);
    let yy = digits.slice(2, 4);
    if (mm.length === 1 && Number(mm) > 1) mm = "0" + mm;
    let monthNum = Number(mm);
    if (mm.length === 2 && (monthNum < 1 || monthNum > 12)) mm = "12";
    const value = yy ? `${mm}/${yy}` : mm;
    setCardExpiry(value);
  };

  const onChangeCvv = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 4);
    setCardCvv(digits);
  };

  const onChangeHolder = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCardHolder(e.target.value);
  };

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Hesabım</h1>
        <p className="text-slate-500 dark:text-slate-400">Lisans bilgilerinizi ve ödeme geçmişinizi yönetin.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: License Info */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="dark:bg-slate-800 dark:border-slate-700">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Mevcut Lisans</CardTitle>
              <CardDescription>makethemenu Pro Paketi</CardDescription>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-slate-500 dark:text-slate-400">Durum</span>
                <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold dark:bg-green-900/30 dark:text-green-400">
                  Aktif
                </span>
              </div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-slate-500 dark:text-slate-400">Bitiş Tarihi</span>
                <span className="font-medium dark:text-slate-200">15 Ocak 2026</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-2 dark:bg-slate-700">
                <div className="bg-green-500 h-full w-[75%]"></div>
              </div>
              <p className="text-xs text-slate-400 text-center dark:text-slate-500">Kalan Süre: 320 Gün</p>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full" 
                variant="outline"
                onClick={() => setStep(1)}
              >
                Lisans Süresini Uzat
              </Button>
            </CardFooter>
          </Card>

          <Card className="dark:bg-slate-800 dark:border-slate-700">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">İşletme Bilgileri</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <span className="text-xs text-slate-400 block mb-1">Firma Adı</span>
                <span className="text-sm font-medium dark:text-slate-200">Lezzet Durağı Ltd. Şti.</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block mb-1">Vergi No</span>
                <span className="text-sm font-medium dark:text-slate-200">1234567890</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block mb-1">Adres</span>
                <span className="text-sm font-medium dark:text-slate-200">Atatürk Mah. Cumhuriyet Cad. No:1 İstanbul</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Payment Wizard */}
        <div className="lg:col-span-2">
          <Card className="dark:bg-slate-800 dark:border-slate-700 h-full">
            <CardHeader>
              <CardTitle>Lisans Yenileme / Uzatma</CardTitle>
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
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="companyName">Firma Ünvanı</Label>
                      <Input id="companyName" defaultValue="Lezzet Durağı Ltd. Şti." />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="taxNo">Vergi Numarası</Label>
                      <Input id="taxNo" defaultValue="1234567890" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="taxOffice">Vergi Dairesi</Label>
                    <Input id="taxOffice" defaultValue="Beyoğlu Vergi Dairesi" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Fatura Adresi</Label>
                    <Input id="address" defaultValue="Atatürk Mah. Cumhuriyet Cad. No:1 İstanbul" />
                  </div>
                  <div className="flex items-center space-x-2 mt-4">
                    <input type="checkbox" id="terms" className="rounded border-gray-300 text-primary focus:ring-primary" defaultChecked />
                    <Label htmlFor="terms" className="text-sm font-normal text-slate-600 dark:text-slate-400">
                      <a href="#" className="text-primary hover:underline">Mesafeli Satış Sözleşmesi</a>'ni okudum ve kabul ediyorum.
                    </Label>
                  </div>
                </div>
              )}

              {/* Step 3: Payment Options */}
              {step === 3 && (
                <Tabs defaultValue="credit-card" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="credit-card">Kredi Kartı</TabsTrigger>
                    <TabsTrigger value="bank-transfer">Havale / EFT</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="credit-card" className="space-y-4">
                    <div className="p-4 border border-slate-200 rounded-lg bg-slate-50 dark:bg-slate-900 dark:border-slate-800">
                      <div className="flex items-center gap-2 mb-4">
                        <CreditCard className="w-5 h-5 text-slate-500" />
                        <span className="font-semibold text-slate-700 dark:text-slate-200">Kart Bilgileri</span>
                      </div>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Kart Numarası</Label>
                          <div className="relative">
                            <Input
                              placeholder="0000 0000 0000 0000"
                              value={cardNumber}
                              onChange={onChangeCardNumber}
                              inputMode="numeric"
                              autoComplete="cc-number"
                            />
                            {(cardBrand || cardProgram) && (
                              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs px-2 py-1 rounded bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                                {cardProgram || cardBrand}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Son Kullanma Tarihi</Label>
                            <Input
                              placeholder="AA/YY"
                              value={cardExpiry}
                              onChange={onChangeExpiry}
                              inputMode="numeric"
                              autoComplete="cc-exp"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>CVV</Label>
                            <Input
                              placeholder="123"
                              value={cardCvv}
                              onChange={onChangeCvv}
                              inputMode="numeric"
                              autoComplete="cc-csc"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Kart Sahibi</Label>
                          <Input
                            placeholder="Ad Soyad"
                            value={cardHolder}
                            onChange={onChangeHolder}
                            autoComplete="cc-name"
                          />
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="bank-transfer" className="space-y-4">
                    <div className="p-4 border border-slate-200 rounded-lg bg-slate-50 dark:bg-slate-900 dark:border-slate-800">
                      <div className="flex items-center gap-2 mb-4">
                        <Landmark className="w-5 h-5 text-slate-500" />
                        <span className="font-semibold text-slate-700 dark:text-slate-200">Banka Hesap Bilgileri</span>
                      </div>
                      <div className="space-y-4">
                        <div className="bg-white p-3 rounded border border-slate-200 dark:bg-slate-800 dark:border-slate-700">
                          <p className="text-xs text-slate-400">Banka</p>
                          <p className="font-medium dark:text-slate-200">Garanti Bankası</p>
                          <p className="text-xs text-slate-400 mt-2">IBAN</p>
                          <p className="font-mono text-sm dark:text-slate-200">TR12 0006 2000 0000 0000 1234 56</p>
                          <p className="text-xs text-slate-400 mt-2">Alıcı</p>
                          <p className="font-medium dark:text-slate-200">makethemenu Teknoloji A.Ş.</p>
                        </div>
                        <div className="bg-blue-50 p-3 rounded border border-blue-100 dark:bg-blue-900/20 dark:border-blue-800">
                          <p className="text-xs text-blue-700 dark:text-blue-300">
                            <strong>Not:</strong> Lütfen havale açıklama kısmına <strong>"LISANS-12345"</strong> yazmayı unutmayınız.
                          </p>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              )}
            </CardContent>
            <CardFooter className="flex justify-between pt-2">
              <Button 
                variant="outline" 
                onClick={prevStep} 
                disabled={step === 1}
              >
                Geri
              </Button>
              {step < 3 ? (
                <Button onClick={nextStep} className="gap-2">
                  Devam Et <ArrowRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button className="bg-green-600 hover:bg-green-700 gap-2">
                  <CheckCircle2 className="w-4 h-4" /> Ödemeyi Tamamla
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default OnlineAccount;
