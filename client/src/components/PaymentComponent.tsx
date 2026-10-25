import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CreditCard, Shield, AlertCircle, Loader2 } from "lucide-react";
import { paymentService, PaymentProvider, PaymentRequest } from '@/services/paymentService';

interface PaymentComponentProps {
  amount: number;
  orderId: string;
  customerEmail: string;
  customerName: string;
  customerPhone: string;
  paymentType: 'license' | 'integration';
  items: Array<{
    name: string;
    price: number;
    quantity: number;
    description?: string;
  }>;
  onPaymentSuccess: (transactionId: string) => void;
  onPaymentError: (error: string) => void;
  onPaymentCancel: () => void;
}

const PaymentComponent: React.FC<PaymentComponentProps> = ({
  amount,
  orderId,
  customerEmail,
  customerName,
  customerPhone,
  paymentType,
  items,
  onPaymentSuccess,
  onPaymentError,
  onPaymentCancel
}) => {
  const [providers, setProviders] = useState<PaymentProvider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    initializePaymentProviders();
  }, []);

  const initializePaymentProviders = async () => {
    try {
      await paymentService.initializeProviders();
      const activeProviders = paymentService.getActiveProviders();
      setProviders(activeProviders);
      
      if (activeProviders.length > 0) {
        setSelectedProvider(activeProviders[0].id);
      }
    } catch (err) {
      setError('Ödeme sağlayıcıları yüklenirken hata oluştu');
    }
  };

  const handlePayment = async () => {
    if (!selectedProvider) {
      setError('Lütfen bir ödeme yöntemi seçin');
      return;
    }

    setLoading(true);
    setError('');

    const paymentRequest: PaymentRequest = {
      amount,
      currency: 'TRY',
      orderId,
      customerEmail,
      customerName,
      customerPhone,
      returnUrl: `${window.location.origin}/payment/success`,
      cancelUrl: `${window.location.origin}/payment/cancel`,
      paymentType,
      items
    };

    try {
      const response = await paymentService.createPayment(selectedProvider, paymentRequest);
      
      if (response.success && response.paymentUrl) {
        // Redirect to 3D payment page
        window.location.href = response.paymentUrl;
      } else {
        setError(response.error || 'Ödeme başlatılamadı');
        onPaymentError(response.error || 'Ödeme başlatılamadı');
      }
    } catch (err) {
      setError('Ödeme işlemi sırasında hata oluştu');
      onPaymentError('Ödeme işlemi sırasında hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handle3DPaymentCallback = async (callbackData: any) => {
    setProcessing(true);
    
    try {
      const response = await paymentService.handlePaymentCallback(selectedProvider, callbackData);
      
      if (response.success && response.status === 'success') {
        onPaymentSuccess(response.transactionId);
      } else {
        onPaymentError(response.message || 'Ödeme doğrulanamadı');
      }
    } catch (err) {
      onPaymentError('Ödeme doğrulaması sırasında hata oluştu');
    } finally {
      setProcessing(false);
    }
  };

  if (processing) {
    return (
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Ödeme Doğrulanıyor</h3>
          <p className="text-blue-700">3D Secure doğrulaması tamamlanıyor...</p>
        </CardContent>
      </Card>
    );
  }

  if (providers.length === 0) {
    return (
      <Card className="border-yellow-200 bg-yellow-50">
        <CardContent className="p-8 text-center">
          <AlertCircle className="h-8 w-8 mx-auto mb-4 text-yellow-600" />
          <h3 className="text-lg font-semibold text-yellow-900 mb-2">Ödeme Sistemi Hazır Değil</h3>
          <p className="text-yellow-700 mb-4">Henüz aktif ödeme sağlayıcısı yapılandırılmamış.</p>
          <p className="text-sm text-yellow-600">Lütfen sistem yöneticinizle iletişime geçin.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Ödeme Yöntemi Seçin
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup value={selectedProvider} onValueChange={setSelectedProvider}>
            {providers.map((provider) => (
              <div key={provider.id} className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-muted/50">
                <RadioGroupItem value={provider.id} id={provider.id} />
                <Label htmlFor={provider.id} className="flex items-center gap-3 cursor-pointer flex-1">
                  <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                    <CreditCard className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div>
                    <div className="font-medium">{provider.name}</div>
                    <div className="text-sm text-gray-500">
                      {provider.testMode ? 'Test Modu' : 'Canlı Mod'}
                    </div>
                  </div>
                  <div className="ml-auto">
                    <Shield className="h-5 w-5 text-green-600" />
                  </div>
                </Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      <Card className="border-blue-200">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-blue-900">
            Ödeme Bilgileri
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Tutar:</span>
              <span className="font-semibold">₺{amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Sipariş No:</span>
              <span className="font-mono text-sm">{orderId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Ödeme Türü:</span>
              <span>{paymentType === 'license' ? 'Lisans Yenileme' : 'Entegrasyon Satın Alma'}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button
          variant="outline"
          onClick={onPaymentCancel}
          className="flex-1"
        >
          İptal
        </Button>
        <Button
          onClick={handlePayment}
          disabled={loading || !selectedProvider}
          className="flex-1 gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Yönlendiriliyor...
            </>
          ) : (
            <>
              <Shield className="h-4 w-4" />
              Ödemeye Git
            </>
          )}
        </Button>
      </div>

      <div className="text-center text-sm text-gray-500">
        <div className="flex items-center justify-center gap-2">
          <Shield className="h-4 w-4" />
          <span>256-bit SSL şifreleme ile korunmaktadır</span>
        </div>
      </div>
    </div>
  );
};

export default PaymentComponent;