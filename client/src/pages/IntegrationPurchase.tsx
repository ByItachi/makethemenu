import React, { useState, useEffect } from "react";
import { 
  CreditCard, 
  Calendar, 
  CheckCircle2, 
  Package, 
  FileText, 
  ShieldCheck, 
  ArrowRight,
  Landmark,
  Trash2,
  Smartphone
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { useLocation, Link } from "wouter";
 

interface Integration {
  id: string;
  name: string;
  price?: number;
  description?: string;
}

const IntegrationPurchase = () => {
  const [, navigate] = useLocation();
  const [step, setStep] = useState(1);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const [cartItems, setCartItems] = useState<Integration[]>([]);
  const [customerInfo, setCustomerInfo] = useState({
    companyName: '',
    taxNo: '',
    taxOffice: '',
    address: ''
  });
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [cardBrand, setCardBrand] = useState('');
  const [cardProgram, setCardProgram] = useState('');

  const detectBrand = (digits: string) => {
    if (/^4\d{0,}/.test(digits)) return 'Visa';
    if (/^(5[1-5]|2(2[2-9]|[3-6]|7[01]|720))\d*/.test(digits)) return 'Mastercard';
    if (/^9792\d*/.test(digits)) return 'Troy';
    return '';
  };

  const detectProgram = (digits: string) => {
    const bin = digits.slice(0, 6);
    const axessBins = ['557113', '557114', '521532', '552608'];
    if (axessBins.includes(bin)) return 'Axess';
    return '';
  };

  const formatCardNumber = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 19);
    const parts = [];
    for (let i = 0; i < digits.length; i += 4) parts.push(digits.slice(i, i + 4));
    return parts.join(' ');
  };

  const onChangeCardNumber = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value);
    setCardNumber(formatted);
    const digits = formatted.replace(/\s/g, '');
    setCardBrand(detectBrand(digits));
    setCardProgram(detectProgram(digits));
  };

  const onChangeExpiry = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 4);
    let mm = digits.slice(0, 2);
    let yy = digits.slice(2, 4);
    if (mm.length === 1 && Number(mm) > 1) mm = '0' + mm;
    let monthNum = Number(mm);
    if (mm.length === 2 && (monthNum < 1 || monthNum > 12)) mm = '12';
    const value = yy ? `${mm}/${yy}` : mm;
    setCardExpiry(value);
  };

  const onChangeCvv = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 4);
    setCardCvv(digits);
  };

  const onChangeHolder = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCardHolder(e.target.value);
  };

  useEffect(() => {
    try {
      const raw = localStorage.getItem('integrationCart');
      if (raw) {
        const parsed = JSON.parse(raw) as Integration[];
        setCartItems(parsed);
      }
    } catch {
      setCartItems([]);
    }
  }, []);

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  const handleCustomerInfoChange = (field: string, value: string) => {
    setCustomerInfo(prev => ({ ...prev, [field]: value }));
  };

  const handlePaymentSuccess = (transactionId: string) => {
    setPaymentProcessing(false);
    clearCart();
    alert(`Ödeme başarılı! İşlem numarası: ${transactionId}`);
    navigate('/restoran/integrations');
  };

  const handlePaymentError = (error: string) => {
    setPaymentProcessing(false);
    alert(`Ödeme hatası: ${error}`);
  };

  const handlePaymentCancel = () => {
    setPaymentProcessing(false);
    // Stay on the same page but reset payment state
  };

  const removeFromCart = (index: number) => {
    const updated = cartItems.filter((_, i) => i !== index);
    setCartItems(updated);
    localStorage.setItem('integrationCart', JSON.stringify(updated));
  };

  const clearCart = () => {
    setCartItems([]);
    localStorage.removeItem('integrationCart');
  };

  const calculateTotal = () => {
    const monthlyTotal = cartItems.reduce((sum, item) => sum + (item.price || 0), 0);
    return billingCycle === 'annual' ? Math.round(monthlyTotal * 12 * 0.8) : monthlyTotal;
  };

  const total = calculateTotal();

  return (
    <div className="flex h-full">
      {/* Fixed Left Navbar */}
      <div className="w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col fixed h-full">
        <div className="h-16 flex items-center px-4 border-b border-slate-100 dark:border-slate-700">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-layout-dashboard w-8 h-8 text-primary">
                <rect width="7" height="9" x="3" y="3" rx="1"></rect>
                <rect width="7" height="5" x="14" y="3" rx="1"></rect>
                <rect width="7" height="9" x="14" y="12" rx="1"></rect>
                <rect width="7" height="5" x="3" y="16" rx="1"></rect>
              </svg>
              <span className="font-bold text-lg text-slate-800 dark:text-white">Resto<span className="text-primary">POS</span></span>
            </div>
          </Link>
        </div>
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 dark:bg-slate-800/50 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold dark:bg-blue-900 dark:text-blue-300">K</div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-slate-700 dark:text-slate-200">KULLANICI</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">12345 - Yönetici</span>
            </div>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto py-2">
          <div>
            <Link href="/restoran"><div className="flex items-center justify-between px-4 py-3 cursor-pointer transition-colors text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800"><div className="flex items-center gap-3"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-layout-dashboard"><rect width="7" height="9" x="3" y="3" rx="1"></rect><rect width="7" height="5" x="14" y="3" rx="1"></rect><rect width="7" height="9" x="14" y="12" rx="1"></rect><rect width="7" height="5" x="3" y="16" rx="1"></rect></svg><span className="font-medium text-sm">Ana Sayfa</span></div><div className="flex items-center gap-2"></div></div></Link>
          </div>
          <div>
            <Link href="/restoran/digital-menu"><div className="flex items-center justify-between px-4 py-3 cursor-pointer transition-colors text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800"><div className="flex items-center gap-3"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-store"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"></path><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"></path><path d="M2 7h20"></path><path d="M22 7v3a2 2 0 0 1-2 2a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12a2 2 0 0 1-2-2V7"></path></svg><span className="font-medium text-sm">Dijital Menü</span></div><div className="flex items-center gap-2"><span className="px-2 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full uppercase">Yepyeni</span></div></div></Link>
          </div>
          <div>
            <Link href="/restoran/definitions"><div className="flex items-center justify-between px-4 py-3 cursor-pointer transition-colors text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800"><div className="flex items-center gap-3"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-file-text"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"></path><path d="M14 2v4a2 2 0 0 0 2 2h4"></path><path d="M10 9H8"></path><path d="M16 13H8"></path><path d="M16 17H8"></path></svg><span className="font-medium text-sm">Tanımlamalar</span></div><div className="flex items-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-down transition-transform duration-200"><path d="m6 9 6 6 6-6"></path></svg></div></div></Link>
          </div>
          <div>
            <Link href="/restoran/operations"><div className="flex items-center justify-between px-4 py-3 cursor-pointer transition-colors text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800"><div className="flex items-center gap-3"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-right-left"><path d="m16 3 4 4-4 4"></path><path d="M20 7H4"></path><path d="m8 21-4-4 4-4"></path><path d="M4 17h16"></path></svg><span className="font-medium text-sm">İşlemler</span></div><div className="flex items-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-down transition-transform duration-200"><path d="m6 9 6 6 6-6"></path></svg></div></div></Link>
          </div>
          <div>
            <Link href="/restoran/reports"><div className="flex items-center justify-between px-4 py-3 cursor-pointer transition-colors text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800"><div className="flex items-center gap-3"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-file-text"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"></path><path d="M14 2v4a2 2 0 0 0 2 2h4"></path><path d="M10 9H8"></path><path d="M16 13H8"></path><path d="M16 17H8"></path></svg><span className="font-medium text-sm">Raporlar</span></div><div className="flex items-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-down transition-transform duration-200"><path d="m6 9 6 6 6-6"></path></svg></div></div></Link>
          </div>
          <div>
            <Link href="/restoran/users"><div className="flex items-center justify-between px-4 py-3 cursor-pointer transition-colors text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800"><div className="flex items-center gap-3"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-users"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg><span className="font-medium text-sm">Kullanıcılar</span></div><div className="flex items-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-down transition-transform duration-200"><path d="m6 9 6 6 6-6"></path></svg></div></div></Link>
          </div>
          <div>
            <Link href="/restoran/settings"><div className="flex items-center justify-between px-4 py-3 cursor-pointer transition-colors text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800"><div className="flex items-center gap-3"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-settings"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l-.43-.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg><span className="font-medium text-sm">Ayarlar</span></div><div className="flex items-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-down transition-transform duration-200"><path d="m6 9 6 6 6-6"></path></svg></div></div></Link>
          </div>
          <div>
            <Link href="/restoran/settings/restaurant"><div className="flex items-center justify-between px-4 py-3 cursor-pointer transition-colors text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800"><div className="flex items-center gap-3"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-settings"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l-.43-.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg><span className="font-medium text-sm ">Restaurant Ayarları</span></div><div className="flex items-center gap-2"></div></div></Link>
          </div>
          <div>
            <Link href="/restoran/settings/printers"><div className="flex items-center justify-between px-4 py-3 cursor-pointer transition-colors text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800"><div className="flex items-center gap-3"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-settings"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l-.43-.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg><span className="font-medium text-sm ">Yazıcı Ayarları</span></div><div className="flex items-center gap-2"></div></div></Link>
          </div>
          <div>
            <Link href="/restoran/settings/callerid"><div className="flex items-center justify-between px-4 py-3 cursor-pointer transition-colors text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800"><div className="flex items-center gap-3"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-smartphone"><rect width="14" height="20" x="5" y="2" rx="2" ry="2"></rect><path d="M12 18h.01"></path></svg><span className="font-medium text-sm">Android CallerId Ayarları</span></div><div className="flex items-center gap-2"></div></div></Link>
          </div>
          <div>
            <Link href="/restoran/integrations"><div className="flex items-center justify-between px-4 py-3 cursor-pointer transition-colors text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800 bg-slate-50 dark:bg-slate-800"><div className="flex items-center gap-3"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-grid3x3"><rect width="18" height="18" x="3" y="3" rx="2"></rect><path d="M3 9h18"></path><path d="M3 15h18"></path><path d="M9 3v18"></path><path d="M15 3v18"></path></svg><span className="font-medium text-sm">Entegrasyonlar</span></div><div className="flex items-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-down transition-transform duration-200"><path d="m6 9 6 6 6-6"></path></svg></div></div></Link>
          </div>
          <div className="px-4 py-2 mt-2 mb-1 text-xs font-semibold text-slate-400 uppercase tracking-wider dark:text-slate-500">Hesabım</div>
          <div>
            <a href="/restoran/account"><div className="flex items-center justify-between px-4 py-3 cursor-pointer transition-colors text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800"><div className="flex items-center gap-3"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-user"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg><span className="font-medium text-sm">Hesabım</span></div><div className="flex items-center gap-2"></div></div></a>
          </div>
          <div className="flex items-center justify-between px-4 py-3 cursor-pointer text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20">
            <div className="flex items-center gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-log-out">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" x2="9" y1="12" y2="12"></line>
              </svg>
              <span className="font-medium text-sm">Çıkış Yap</span>
            </div>
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 ml-64 p-6 max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Entegrasyon Satın Al</h1>
          <p className="text-slate-500 dark:text-slate-400">Seçtiğiniz entegrasyon uygulamalarını satın alın ve Makethemenu deneyiminizi güçlendirin.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Summary */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="dark:bg-slate-800 dark:border-slate-700">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Sepetiniz</CardTitle>
              </CardHeader>
              <CardContent className="pb-4">
                {cartItems.length === 0 ? (
                  <p className="text-slate-500 dark:text-slate-400 text-sm">Sepetinizde ürün bulunmuyor.</p>
                ) : (
                  <>
                    <div className="space-y-3 mb-4">
                      {cartItems.map((item, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div>
                            <div className="text-sm font-medium dark:text-slate-200">{item.name}</div>
                            <div className="text-xs text-slate-500">₺{item.price || 0}/ay</div>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => removeFromCart(index)} 
                            aria-label="Kaldır"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                    
                    <Separator className="my-4" />
                    
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm text-slate-500 dark:text-slate-400">Ödeme Periyodu</span>
                      <span className="font-medium dark:text-slate-200">
                        {billingCycle === 'annual' ? 'Yıllık (%20 İndirimli)' : 'Aylık'}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between font-bold">
                      <span className="text-lg text-slate-800 dark:text-white">Toplam</span>
                      <span className="text-lg text-slate-800 dark:text-white">₺{total}</span>
                    </div>
                    
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full mt-4" 
                      onClick={clearCart}
                    >
                      Sepeti Temizle
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Payment Wizard */}
          <div className="lg:col-span-2">
            <Card className="dark:bg-slate-800 dark:border-slate-700 h-full">
              <CardHeader>
                <CardTitle>Entegrasyon Satın Alma</CardTitle>
                <div className="flex items-center gap-2 mt-6">
                  <div className={`flex items-center gap-2 ${step >= 1 ? 'text-primary' : 'text-slate-400'}`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step >= 1 ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500 dark:bg-slate-700'}`}>1</div>
                    <span className="text-sm font-medium">Ödeme Periyodu</span>
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
                {/* Step 1: Billing Cycle Selection */}
                {step === 1 && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-4 dark:text-white">Ödeme Periyodu Seçin</h3>
                      <p className="text-slate-500 dark:text-slate-400 mb-6">
                        Entegrasyonlarınız için ödeme periyodunu seçin. Yıllık ödeme yaparak %20 tasarruf edebilirsiniz.
                      </p>
                    </div>

                    <div className="flex justify-center">
                      <div className="bg-slate-100 p-1 rounded-lg flex dark:bg-slate-900">
                        <button 
                          className={`px-6 py-3 rounded-md text-sm font-medium transition-all ${billingCycle === 'monthly' ? 'bg-white shadow-sm text-slate-900 dark:bg-slate-800 dark:text-white' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'}`}
                          onClick={() => setBillingCycle('monthly')}
                        >
                          Aylık Ödeme
                        </button>
                        <button 
                          className={`px-6 py-3 rounded-md text-sm font-medium transition-all ${billingCycle === 'annual' ? 'bg-white shadow-sm text-slate-900 dark:bg-slate-800 dark:text-white' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'}`}
                          onClick={() => setBillingCycle('annual')}
                        >
                          Yıllık Ödeme (%20 İndirim)
                        </button>
                      </div>
                    </div>

                    {cartItems.length > 0 && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          <span className="font-medium text-blue-900 dark:text-blue-300">
                            {billingCycle === 'annual' ? 'Yıllık ödeme ile %20 tasarruf edeceksiniz!' : 'Aylık esnek ödeme seçeneği'}
                          </span>
                        </div>
                        <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                          Toplam: ₺{total} ({billingCycle === 'annual' ? 'yıllık' : 'aylık'})
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Step 2: Invoice Details */}
                {step === 2 && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-4 dark:text-white">Fatura Bilgileri</h3>
                      <p className="text-slate-500 dark:text-slate-400 mb-6">
                        Entegrasyonlarınız için fatura bilgilerinizi girin.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="companyName">Firma Ünvanı</Label>
                        <Input 
                          id="companyName" 
                          placeholder="İşletmenizin tam adı" 
                          value={customerInfo.companyName}
                          onChange={(e) => handleCustomerInfoChange('companyName', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="taxNo">Vergi Numarası</Label>
                        <Input 
                          id="taxNo" 
                          placeholder="10 haneli vergi numaranız" 
                          value={customerInfo.taxNo}
                          onChange={(e) => handleCustomerInfoChange('taxNo', e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="taxOffice">Vergi Dairesi</Label>
                      <Input 
                        id="taxOffice" 
                        placeholder="Bağlı olduğunuz vergi dairesi" 
                        value={customerInfo.taxOffice}
                        onChange={(e) => handleCustomerInfoChange('taxOffice', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address">Fatura Adresi</Label>
                      <Input 
                        id="address" 
                        placeholder="Açık adresiniz" 
                        value={customerInfo.address}
                        onChange={(e) => handleCustomerInfoChange('address', e.target.value)}
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

                {/* Step 3: Payment Options - Lisans yenilemedeki tasarım ile aynı */}
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
                              id="card-number"
                              name="cardNumber"
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
                              id="card-expiry"
                              name="cardExpiry"
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
                              id="card-cvv"
                              name="cardCvv"
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
                            id="card-holder"
                            name="cardHolder"
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
                            <p className="font-medium dark:text-slate-200">Makethemenu Teknoloji A.Ş.</p>
                          </div>
                          <div className="bg-blue-50 p-3 rounded border border-blue-100 dark:bg-blue-900/20 dark:border-blue-800">
                            <p className="text-xs text-blue-700 dark:text-blue-300">
                              <strong>Not:</strong> Lütfen havale açıklama kısmına <strong>"ENT-{Date.now().toString().slice(-6)}"</strong> yazmayı unutmayınız.
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
                  onClick={() => navigate('/restoran/integrations')} 
                >
                  Geri
                </Button>
                {step < 3 ? (
                  <Button onClick={nextStep} className="gap-2" disabled={cartItems.length === 0}>
                    Devam Et <ArrowRight className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button className="bg-green-600 hover:bg-green-700 gap-2" disabled={cartItems.length === 0}>
                    <CheckCircle2 className="w-4 h-4" /> Ödemeyi Tamamla
                  </Button>
                )}
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IntegrationPurchase;
