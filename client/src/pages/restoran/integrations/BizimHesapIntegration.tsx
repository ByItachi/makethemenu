import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Link } from 'wouter';
import { ArrowLeft, Settings, CreditCard, FileText, RefreshCw, CheckCircle, XCircle } from 'lucide-react';

interface BizimHesapConfig {
  apiKey: string;
  apiSecret: string;
  companyCode: string;
  taxNumber: string;
  taxOffice: string;
  endpointUrl: string;
  autoSync: boolean;
  syncOrders: boolean;
  syncInvoices: boolean;
  syncPayments: boolean;
  syncDailyReports: boolean;
  paymentMethod: string;
  accountType: string;
}

export default function BizimHesapIntegration() {
  const [config, setConfig] = useState<BizimHesapConfig>({
    apiKey: '',
    apiSecret: '',
    companyCode: '',
    taxNumber: '',
    taxOffice: '',
    endpointUrl: 'https://api.bizimhesap.com/v1',
    autoSync: true,
    syncOrders: true,
    syncInvoices: true,
    syncPayments: true,
    syncDailyReports: true,
    paymentMethod: 'credit_card',
    accountType: 'restaurant'
  });
  
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lastSync, setLastSync] = useState<string>('');

  useEffect(() => {
    const savedConfig = localStorage.getItem('bizimhesap_config');
    const savedStatus = localStorage.getItem('bizimhesap_status');
    const savedLastSync = localStorage.getItem('bizimhesap_last_sync');
    
    if (savedConfig) {
      setConfig(JSON.parse(savedConfig));
    }
    if (savedStatus) {
      setIsConnected(JSON.parse(savedStatus));
    }
    if (savedLastSync) {
      setLastSync(savedLastSync);
    }
  }, []);

  const handleSaveConfig = async () => {
    setIsLoading(true);
    try {
      localStorage.setItem('bizimhesap_config', JSON.stringify(config));
      
      const response = await fetch('/api/integrations/bizimhesap/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      
      if (response.ok) {
        setIsConnected(true);
        localStorage.setItem('bizimhesap_status', 'true');
        alert('Bağlantı başarılı! Bizim Hesap entegrasyonu aktif edildi.');
      } else {
        alert('Bağlantı başarısız. Lütfen API bilgilerinizi kontrol edin.');
      }
    } catch (error) {
      console.error('Save config failed', error);
      alert('Kaydetme işlemi başarısız oldu.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSync = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/integrations/bizimhesap/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      
      if (response.ok) {
        const now = new Date().toLocaleString('tr-TR');
        setLastSync(now);
        localStorage.setItem('bizimhesap_last_sync', now);
        alert('Senkronizasyon başarılı!');
      } else {
        alert('Senkronizasyon başarısız oldu.');
      }
    } catch (error) {
      console.error('Sync failed', error);
      alert('Senkronizasyon sırasında hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setIsLoading(true);
    try {
      await fetch('/api/integrations/bizimhesap/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      setIsConnected(false);
      localStorage.removeItem('bizimhesap_config');
      localStorage.removeItem('bizimhesap_status');
      localStorage.removeItem('bizimhesap_last_sync');
      
      alert('Bağlantı başarıyla kesildi.');
    } catch (error) {
      console.error('Disconnect failed', error);
      alert('Bağlantı kesme işlemi başarısız oldu.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 dark:bg-slate-900">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <Link href="/restoran/integrations">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Geri Dön
            </Button>
          </Link>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Bizim Hesap Entegrasyonu</h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                Muhasebe ve finans yönetimi için Bizim Hesap entegrasyonu
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={isConnected ? "default" : "secondary"}>
                {isConnected ? <CheckCircle className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                {isConnected ? 'Aktif' : 'Pasif'}
              </Badge>
              {lastSync && (
                <Badge variant="outline">
                  Son Senkronizasyon: {lastSync}
                </Badge>
              )}
            </div>
          </div>
        </div>

        <Tabs defaultValue="settings" className="space-y-4">
          <TabsList>
            <TabsTrigger value="settings">
              <Settings className="w-4 h-4 mr-2" />
              API Ayarları
            </TabsTrigger>
            <TabsTrigger value="accounting">
              <CreditCard className="w-4 h-4 mr-2" />
              Muhasebe Ayarları
            </TabsTrigger>
            <TabsTrigger value="sync">
              <RefreshCw className="w-4 h-4 mr-2" />
              Senkronizasyon
            </TabsTrigger>
          </TabsList>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>API Bağlantı Ayarları</CardTitle>
                <CardDescription>
                  Bizim Hesap API bağlantısı için gerekli bilgileri girin
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="apiKey">API Anahtarı</Label>
                    <Input
                      id="apiKey"
                      type="password"
                      value={config.apiKey}
                      onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                      placeholder="API anahtarınızı girin"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="apiSecret">API Gizli Anahtarı</Label>
                    <Input
                      id="apiSecret"
                      type="password"
                      value={config.apiSecret}
                      onChange={(e) => setConfig({ ...config, apiSecret: e.target.value })}
                      placeholder="API gizli anahtarınızı girin"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="companyCode">Firma Kodu</Label>
                    <Input
                      id="companyCode"
                      value={config.companyCode}
                      onChange={(e) => setConfig({ ...config, companyCode: e.target.value })}
                      placeholder="Firma kodunuzu girin"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="taxNumber">Vergi Numarası</Label>
                    <Input
                      id="taxNumber"
                      value={config.taxNumber}
                      onChange={(e) => setConfig({ ...config, taxNumber: e.target.value })}
                      placeholder="Vergi numaranızı girin"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="taxOffice">Vergi Dairesi</Label>
                    <Input
                      id="taxOffice"
                      value={config.taxOffice}
                      onChange={(e) => setConfig({ ...config, taxOffice: e.target.value })}
                      placeholder="Vergi dairenizi girin"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="endpointUrl">API Endpoint URL</Label>
                    <Input
                      id="endpointUrl"
                      value={config.endpointUrl}
                      onChange={(e) => setConfig({ ...config, endpointUrl: e.target.value })}
                      placeholder="API endpoint URL"
                    />
                  </div>
                </div>

                <Alert>
                  <AlertDescription>
                    API bilgilerinizi Bizim Hesap yönetim panelinden alabilirsiniz. 
                    API erişimi için lütfen Bizim Hesap destek ekibiyle iletişime geçin.
                  </AlertDescription>
                </Alert>

                <div className="flex gap-2">
                  <Button onClick={handleSaveConfig} disabled={isLoading}>
                    {isLoading ? 'Kaydediliyor...' : 'Bağlantıyı Test Et ve Kaydet'}
                  </Button>
                  {isConnected && (
                    <Button variant="outline" onClick={handleDisconnect} disabled={isLoading}>
                      Bağlantıyı Kes
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="accounting">
            <Card>
              <CardHeader>
                <CardTitle>Muhasebe Ayarları</CardTitle>
                <CardDescription>
                  Muhasebe senkronizasyonu için gerekli ayarları yapın
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="accountType">Hesap Türü</Label>
                    <Select
                      value={config.accountType}
                      onValueChange={(value) => setConfig({ ...config, accountType: value })}
                    >
                      <SelectTrigger id="accountType">
                        <SelectValue placeholder="Hesap türü seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="restaurant">Restoran</SelectItem>
                        <SelectItem value="cafe">Kafe</SelectItem>
                        <SelectItem value="hotel">Otel</SelectItem>
                        <SelectItem value="retail">Perakende</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="paymentMethod">Varsayılan Ödeme Yöntemi</Label>
                    <Select
                      value={config.paymentMethod}
                      onValueChange={(value) => setConfig({ ...config, paymentMethod: value })}
                    >
                      <SelectTrigger id="paymentMethod">
                        <SelectValue placeholder="Ödeme yöntemi seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="credit_card">Kredi Kartı</SelectItem>
                        <SelectItem value="cash">Nakit</SelectItem>
                        <SelectItem value="bank_transfer">Banka Havalesi</SelectItem>
                        <SelectItem value="check">Çek</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Sipariş Senkronizasyonu</Label>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Siparişleri otomatik olarak muhasebe sistemine gönder
                      </p>
                    </div>
                    <Switch
                      checked={config.syncOrders}
                      onCheckedChange={(checked) => setConfig({ ...config, syncOrders: checked })}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Fatura Senkronizasyonu</Label>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Faturaları otomatik olarak muhasebe sistemine gönder
                      </p>
                    </div>
                    <Switch
                      checked={config.syncInvoices}
                      onCheckedChange={(checked) => setConfig({ ...config, syncInvoices: checked })}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Ödeme Senkronizasyonu</Label>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Ödemeleri otomatik olarak muhasebe sistemine gönder
                      </p>
                    </div>
                    <Switch
                      checked={config.syncPayments}
                      onCheckedChange={(checked) => setConfig({ ...config, syncPayments: checked })}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Günlük Rapor Senkronizasyonu</Label>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Günlük satış raporlarını muhasebe sistemine gönder
                      </p>
                    </div>
                    <Switch
                      checked={config.syncDailyReports}
                      onCheckedChange={(checked) => setConfig({ ...config, syncDailyReports: checked })}
                    />
                  </div>
                </div>

                <Button onClick={handleSaveConfig} disabled={isLoading}>
                  Ayarları Kaydet
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sync">
            <Card>
              <CardHeader>
                <CardTitle>Senkronizasyon</CardTitle>
                <CardDescription>
                  Manuel senkronizasyon ve bağlantı durumu
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg dark:bg-slate-800">
                  <div>
                    <p className="font-medium">Bağlantı Durumu</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {isConnected ? 'Bizim Hesap ile bağlantı aktif' : 'Bizim Hesap ile bağlantı kurulmadı'}
                    </p>
                  </div>
                  <Badge variant={isConnected ? "default" : "secondary"}>
                    {isConnected ? <CheckCircle className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                    {isConnected ? 'Bağlı' : 'Bağlı Değil'}
                  </Badge>
                </div>

                {lastSync && (
                  <div className="p-4 bg-slate-50 rounded-lg dark:bg-slate-800">
                    <p className="font-medium">Son Senkronizasyon</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{lastSync}</p>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button onClick={handleSync} disabled={isLoading || !isConnected}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Manuel Senkronizasyon
                  </Button>
                  {isConnected && (
                    <Button variant="outline" onClick={handleDisconnect} disabled={isLoading}>
                      Bağlantıyı Kes
                    </Button>
                  )}
                </div>

                <Alert>
                  <AlertDescription>
                    Manuel senkronizasyon, otomatik senkronizasyonun dışında ekstra bir senkronizasyon döngüsü başlatır.
                    Bu işlem birkaç dakika sürebilir.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}