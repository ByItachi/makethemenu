import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CreditCard, Settings, Save, TestTube, Eye, EyeOff } from "lucide-react";

interface PaymentProvider {
  id: string;
  name: string;
  enabled: boolean;
  testMode: boolean;
  merchantId?: string;
  merchantKey?: string;
  merchantSalt?: string;
  apiKey?: string;
  secretKey?: string;
  publicKey?: string;
  privateKey?: string;
  callbackUrl?: string;
}

const PaymentProvidersConfig: React.FC = () => {
  const [providers, setProviders] = useState<PaymentProvider[]>([
    {
      id: 'paytr',
      name: 'PayTR',
      enabled: false,
      testMode: true,
      merchantId: '',
      merchantKey: '',
      merchantSalt: '',
      callbackUrl: 'https://restopos.com.tr/api/payment/callback/paytr'
    },
    {
      id: 'iyzico',
      name: 'İyzico',
      enabled: false,
      testMode: true,
      apiKey: '',
      secretKey: '',
      publicKey: '',
      callbackUrl: 'https://restopos.com.tr/api/payment/callback/iyzico'
    },
    {
      id: 'shopier',
      name: 'Shopier',
      enabled: false,
      testMode: true,
      apiKey: '',
      secretKey: '',
      callbackUrl: 'https://restopos.com.tr/api/payment/callback/shopier'
    }
  ]);

  const [showKeys, setShowKeys] = useState<{[key: string]: boolean}>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  const handleProviderChange = (providerId: string, field: keyof PaymentProvider, value: any) => {
    setProviders(prev => prev.map(provider => 
      provider.id === providerId ? { ...provider, [field]: value } : provider
    ));
  };

  const toggleKeyVisibility = (providerId: string, keyType: string) => {
    const key = `${providerId}-${keyType}`;
    setShowKeys(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    
    try {
      const response = await fetch('/api/admin/payment-providers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ providers }),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Ödeme sağlayıcı ayarları başarıyla kaydedildi!' });
      } else {
        throw new Error('Kaydetme işlemi başarısız oldu');
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Ayarlar kaydedilirken bir hata oluştu.' });
    } finally {
      setSaving(false);
    }
  };

  const testConnection = async (providerId: string) => {
    const provider = providers.find(p => p.id === providerId);
    if (!provider) return;

    try {
      const response = await fetch('/api/admin/payment-providers/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ providerId, config: provider }),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: `${provider.name} bağlantı testi başarılı!` });
      } else {
        throw new Error('Bağlantı testi başarısız');
      }
    } catch (error) {
      setMessage({ type: 'error', text: `${provider.name} bağlantı testi başarısız oldu.` });
    }
  };

  const renderProviderConfig = (provider: PaymentProvider) => {
    switch (provider.id) {
      case 'paytr':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor={`${provider.id}-merchantId`}>Merchant ID</Label>
                <Input
                  id={`${provider.id}-merchantId`}
                  value={provider.merchantId || ''}
                  onChange={(e) => handleProviderChange(provider.id, 'merchantId', e.target.value)}
                  placeholder="PayTR Merchant ID"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`${provider.id}-merchantKey`}>Merchant Key</Label>
                <div className="relative">
                  <Input
                    id={`${provider.id}-merchantKey`}
                    type={showKeys[`${provider.id}-merchantKey`] ? 'text' : 'password'}
                    value={provider.merchantKey || ''}
                    onChange={(e) => handleProviderChange(provider.id, 'merchantKey', e.target.value)}
                    placeholder="PayTR Merchant Key"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => toggleKeyVisibility(provider.id, 'merchantKey')}
                  >
                    {showKeys[`${provider.id}-merchantKey`] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${provider.id}-merchantSalt`}>Merchant Salt</Label>
              <div className="relative">
                <Input
                  id={`${provider.id}-merchantSalt`}
                  type={showKeys[`${provider.id}-merchantSalt`] ? 'text' : 'password'}
                  value={provider.merchantSalt || ''}
                  onChange={(e) => handleProviderChange(provider.id, 'merchantSalt', e.target.value)}
                  placeholder="PayTR Merchant Salt"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => toggleKeyVisibility(provider.id, 'merchantSalt')}
                >
                  {showKeys[`${provider.id}-merchantSalt`] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${provider.id}-callbackUrl`}>Callback URL</Label>
              <Input
                id={`${provider.id}-callbackUrl`}
                value={provider.callbackUrl || ''}
                onChange={(e) => handleProviderChange(provider.id, 'callbackUrl', e.target.value)}
                placeholder="https://yourdomain.com/api/payment/callback/paytr"
              />
            </div>
          </div>
        );
      case 'iyzico':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor={`${provider.id}-apiKey`}>API Key</Label>
                <div className="relative">
                  <Input
                    id={`${provider.id}-apiKey`}
                    type={showKeys[`${provider.id}-apiKey`] ? 'text' : 'password'}
                    value={provider.apiKey || ''}
                    onChange={(e) => handleProviderChange(provider.id, 'apiKey', e.target.value)}
                    placeholder="İyzico API Key"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => toggleKeyVisibility(provider.id, 'apiKey')}
                  >
                    {showKeys[`${provider.id}-apiKey`] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor={`${provider.id}-secretKey`}>Secret Key</Label>
                <div className="relative">
                  <Input
                    id={`${provider.id}-secretKey`}
                    type={showKeys[`${provider.id}-secretKey`] ? 'text' : 'password'}
                    value={provider.secretKey || ''}
                    onChange={(e) => handleProviderChange(provider.id, 'secretKey', e.target.value)}
                    placeholder="İyzico Secret Key"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => toggleKeyVisibility(provider.id, 'secretKey')}
                  >
                    {showKeys[`${provider.id}-secretKey`] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${provider.id}-publicKey`}>Public Key (Opsiyonel)</Label>
              <Input
                id={`${provider.id}-publicKey`}
                value={provider.publicKey || ''}
                onChange={(e) => handleProviderChange(provider.id, 'publicKey', e.target.value)}
                placeholder="İyzico Public Key"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${provider.id}-callbackUrl`}>Callback URL</Label>
              <Input
                id={`${provider.id}-callbackUrl`}
                value={provider.callbackUrl || ''}
                onChange={(e) => handleProviderChange(provider.id, 'callbackUrl', e.target.value)}
                placeholder="https://yourdomain.com/api/payment/callback/iyzico"
              />
            </div>
          </div>
        );
      case 'shopier':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor={`${provider.id}-apiKey`}>API Key</Label>
                <div className="relative">
                  <Input
                    id={`${provider.id}-apiKey`}
                    type={showKeys[`${provider.id}-apiKey`] ? 'text' : 'password'}
                    value={provider.apiKey || ''}
                    onChange={(e) => handleProviderChange(provider.id, 'apiKey', e.target.value)}
                    placeholder="Shopier API Key"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => toggleKeyVisibility(provider.id, 'apiKey')}
                  >
                    {showKeys[`${provider.id}-apiKey`] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor={`${provider.id}-secretKey`}>Secret Key</Label>
                <div className="relative">
                  <Input
                    id={`${provider.id}-secretKey`}
                    type={showKeys[`${provider.id}-secretKey`] ? 'text' : 'password'}
                    value={provider.secretKey || ''}
                    onChange={(e) => handleProviderChange(provider.id, 'secretKey', e.target.value)}
                    placeholder="Shopier Secret Key"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => toggleKeyVisibility(provider.id, 'secretKey')}
                  >
                    {showKeys[`${provider.id}-secretKey`] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${provider.id}-callbackUrl`}>Callback URL</Label>
              <Input
                id={`${provider.id}-callbackUrl`}
                value={provider.callbackUrl || ''}
                onChange={(e) => handleProviderChange(provider.id, 'callbackUrl', e.target.value)}
                placeholder="https://yourdomain.com/api/payment/callback/shopier"
              />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {message && (
        <Alert className={message.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}>
          <AlertDescription className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <CreditCard className="h-6 w-6" />
            Ödeme Sağlayıcıları
          </h2>
          <p className="text-gray-500">3D Secure ödeme sistemlerini yapılandırın</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          <Save className="h-4 w-4" />
          {saving ? 'Kaydediliyor...' : 'Kaydet'}
        </Button>
      </div>

      <Tabs defaultValue="paytr" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          {providers.map(provider => (
            <TabsTrigger key={provider.id} value={provider.id}>
              {provider.name}
            </TabsTrigger>
          ))}
        </TabsList>
        
        {providers.map(provider => (
          <TabsContent key={provider.id} value={provider.id}>
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    {provider.name} Ayarları
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={provider.enabled}
                      onCheckedChange={(checked) => handleProviderChange(provider.id, 'enabled', checked)}
                    />
                    <span className="text-sm text-gray-500">
                      {provider.enabled ? 'Aktif' : 'Pasif'}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={provider.testMode}
                    onCheckedChange={(checked) => handleProviderChange(provider.id, 'testMode', checked)}
                  />
                  <span className="text-sm text-gray-500">
                    Test Modu {provider.testMode ? '(Aktif)' : '(Pasif)'}
                  </span>
                </div>
                
                {renderProviderConfig(provider)}
                
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => testConnection(provider.id)}
                    className="gap-2"
                  >
                    <TestTube className="h-4 w-4" />
                    Bağlantı Testi
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default PaymentProvidersConfig;