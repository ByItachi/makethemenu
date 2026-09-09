import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  FileText, 
  Settings, 
  Save, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle,
  Clock,
  BarChart3,
  TrendingUp,
  DollarSign,
  Send,
  Download,
  Shield,
  Key,
  Building,
  Mail
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface EFaturaConfig {
  companyName: string;
  taxNumber: string;
  taxOffice: string;
  eInvoiceProvider: string;
  apiUsername: string;
  apiPassword: string;
  apiKey: string;
  autoSend: boolean;
  autoArchive: boolean;
  testMode: boolean;
}

interface InvoiceStats {
  totalSent: number;
  totalReceived: number;
  totalAmount: number;
  successRate: number;
}

const EFaturaIntegration: React.FC = () => {
  const [config, setConfig] = useState<EFaturaConfig>({
    companyName: '',
    taxNumber: '',
    taxOffice: '',
    eInvoiceProvider: 'gib',
    apiUsername: '',
    apiPassword: '',
    apiKey: '',
    autoSend: true,
    autoArchive: true,
    testMode: false
  });

  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [invoiceStats, setInvoiceStats] = useState<InvoiceStats>({
    totalSent: 0,
    totalReceived: 0,
    totalAmount: 0,
    successRate: 0
  });

  useEffect(() => {
    // Load saved configuration
    const savedConfig = localStorage.getItem('efatura_config');
    if (savedConfig) {
      setConfig(JSON.parse(savedConfig));
    }

    // Check connection status
    const checkConnection = async () => {
      try {
        const response = await fetch('/api/integrations/efatura/status');
        const data = await response.json();
        setIsConnected(data.connected);
        if (data.lastSync) {
          setLastSync(new Date(data.lastSync));
        }
      } catch (error) {
        console.error('Connection check failed:', error);
      }
    };

    checkConnection();
  }, []);

  const handleSaveConfig = async () => {
    setIsLoading(true);
    try {
      // Save to localStorage
      localStorage.setItem('efatura_config', JSON.stringify(config));
      
      // Test connection
      const response = await fetch('/api/integrations/efatura/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });

      if (response.ok) {
        setIsConnected(true);
        alert('Bağlantı başarılı! E-Fatura entegrasyonu aktif edildi.');
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
      const response = await fetch('/api/integrations/efatura/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });

      if (response.ok) {
        setLastSync(new Date());
        alert('Senkronizasyon başarılı!');
      } else {
        alert('Senkronizasyon başarısız oldu.');
      }
    } catch (error) {
      console.error('Sync failed', error);
      alert('Senkronizasyon başarısız oldu.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (confirm('E-Fatura entegrasyonunu devre dışı bırakmak istediğinize emin misiniz?')) {
      setIsLoading(true);
      try {
        await fetch('/api/integrations/efatura/disconnect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        setIsConnected(false);
        localStorage.removeItem('efatura_config');
        alert('Entegrasyon devre dışı bırakıldı.');
      } catch (error) {
        console.error('Disconnect failed', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <FileText className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">E-Fatura & E-Arşiv Entegrasyonu</h1>
          <Badge variant={isConnected ? 'default' : 'outline'}>
            {isConnected ? 'Aktif' : 'Pasif'}
          </Badge>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Elektronik fatura ve e-arşiv fatura entegrasyonu
        </p>
      </div>

      {/* Status Alert */}
      <Alert className={`mb-6 ${isConnected ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'}`}>
        <div className="flex items-center gap-2">
          {isConnected ? <CheckCircle className="h-4 w-4 text-green-600" /> : <AlertCircle className="h-4 w-4 text-yellow-600" />}
          <AlertDescription>
            {isConnected 
              ? 'E-Fatura entegrasyonunuz aktif durumda. Faturalar otomatik olarak gönderilmektedir.' 
              : 'E-Fatura entegrasyonu için API bilgilerinizi girerek bağlantıyı kurabilirsiniz.'
            }
          </AlertDescription>
        </div>
      </Alert>

      {/* Stats Cards */}
      {isConnected && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Gönderilen Fatura</CardTitle>
              <Send className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{invoiceStats.totalSent}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Alınan Fatura</CardTitle>
              <Download className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{invoiceStats.totalReceived}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Toplam Tutar</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₺{invoiceStats.totalAmount.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Başarı Oranı</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">%{(invoiceStats.successRate * 100).toFixed(1)}</div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="settings" className="space-y-4">
        <TabsList>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-2" />
            Ayarlar
          </TabsTrigger>
          <TabsTrigger value="sync">
            <RefreshCw className="h-4 w-4 mr-2" />
            Senkronizasyon
          </TabsTrigger>
          <TabsTrigger value="invoices">
            <FileText className="h-4 w-4 mr-2" />
            Faturalar
          </TabsTrigger>
          <TabsTrigger value="logs">
            <BarChart3 className="h-4 w-4 mr-2" />
            Loglar
          </TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Firma Bilgileri</CardTitle>
              <CardDescription>
                E-Fatura sistemine kayıtlı firma bilgilerinizi girin
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Firma Adı</Label>
                  <Input
                    id="companyName"
                    value={config.companyName}
                    onChange={(e) => setConfig({...config, companyName: e.target.value})}
                    placeholder="Firma adınızı girin"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="taxNumber">Vergi Numarası</Label>
                  <Input
                    id="taxNumber"
                    value={config.taxNumber}
                    onChange={(e) => setConfig({...config, taxNumber: e.target.value})}
                    placeholder="Vergi numaranızı girin"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="taxOffice">Vergi Dairesi</Label>
                <Input
                  id="taxOffice"
                  value={config.taxOffice}
                  onChange={(e) => setConfig({...config, taxOffice: e.target.value})}
                  placeholder="Vergi dairenizi girin"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="eInvoiceProvider">E-Fatura Sağlayıcısı</Label>
                <select
                  id="eInvoiceProvider"
                  value={config.eInvoiceProvider}
                  onChange={(e) => setConfig({...config, eInvoiceProvider: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md bg-white dark:bg-gray-800"
                >
                  <option value="gib">GİB (Gelir İdaresi Başkanlığı)</option>
                  <option value="foriba">Foriba</option>
                  <option value="entegra">Entegra</option>
                  <option value="infinia">Infinia</option>
                  <option value="other">Diğer</option>
                </select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>API Ayarları</CardTitle>
              <CardDescription>
                E-Fatura sağlayıcınızdan aldığınız API bilgilerini girin
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="apiUsername">API Kullanıcı Adı</Label>
                <Input
                  id="apiUsername"
                  value={config.apiUsername}
                  onChange={(e) => setConfig({...config, apiUsername: e.target.value})}
                  placeholder="API kullanıcı adınızı girin"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="apiPassword">API Şifresi</Label>
                <Input
                  id="apiPassword"
                  type="password"
                  value={config.apiPassword}
                  onChange={(e) => setConfig({...config, apiPassword: e.target.value})}
                  placeholder="API şifrenizi girin"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="apiKey">API Anahtarı</Label>
                <Input
                  id="apiKey"
                  type="password"
                  value={config.apiKey}
                  onChange={(e) => setConfig({...config, apiKey: e.target.value})}
                  placeholder="API anahtarınızı girin"
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="autoSend"
                    checked={config.autoSend}
                    onChange={(e) => setConfig({...config, autoSend: e.target.checked})}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="autoSend">Faturaları otomatik olarak gönder</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="autoArchive"
                    checked={config.autoArchive}
                    onChange={(e) => setConfig({...config, autoArchive: e.target.checked})}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="autoArchive">Faturaları otomatik olarak arşivle</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="testMode"
                    checked={config.testMode}
                    onChange={(e) => setConfig({...config, testMode: e.target.checked})}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="testMode">Test modunu etkinleştir</Label>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSaveConfig} disabled={isLoading}>
                  {isLoading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                  Kaydet ve Bağlan
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

        <TabsContent value="sync" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Manuel Senkronizasyon</CardTitle>
              <CardDescription>
                Fatura durumlarını ve diğer verileri manuel olarak senkronize edin
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button onClick={handleSync} disabled={isLoading || !isConnected}>
                  {isLoading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                  Tüm Verileri Senkronize Et
                </Button>
                <Button variant="outline" disabled={isLoading || !isConnected}>
                  Fatura Durumlarını Güncelle
                </Button>
              </div>
              
              {lastSync && (
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Clock className="h-4 w-4" />
                  Son senkronizasyon: {lastSync.toLocaleString('tr-TR')}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Fatura İşlemleri</CardTitle>
              <CardDescription>
                E-Fatura ve E-Arşiv fatura işlemlerini yönetin
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Fatura Gönderme</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Faturaları otomatik olarak gönder</p>
                  </div>
                  <Button variant="outline" size="sm" disabled={!isConnected}>
                    <Send className="h-4 w-4 mr-2" />
                    Gönder
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Fatura İptali</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Faturaları iptal et</p>
                  </div>
                  <Button variant="outline" size="sm" disabled={!isConnected}>
                    İptal Et
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Fatura Sorgulama</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Fatura durumunu sorgula</p>
                  </div>
                  <Button variant="outline" size="sm" disabled={!isConnected}>
                    Sorgula
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Entegrasyon Logları</CardTitle>
              <CardDescription>
                Son entegrasyon aktiviteleri ve hatalar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Bağlantı başarılı - {new Date().toLocaleString('tr-TR')}</span>
                  </div>
                </div>
                <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                  Daha fazla log görüntülemek için entegrasyonu aktif edin
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EFaturaIntegration;