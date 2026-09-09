import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Database, 
  Settings, 
  Save, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle,
  Clock,
  BarChart3,
  TrendingUp,
  Download,
  Upload,
  Zap,
  Shield,
  Key
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface APIConfig {
  apiKey: string;
  apiSecret: string;
  webhookUrl: string;
  endpointUrl: string;
  rateLimit: number;
  timeout: number;
  retryAttempts: number;
  enableLogging: boolean;
  enableEncryption: boolean;
  dataFormat: 'json' | 'xml' | 'csv';
}

interface DataTransferStats {
  totalTransfers: number;
  successfulTransfers: number;
  failedTransfers: number;
  totalDataSize: number;
  averageTransferTime: number;
}

const VeriAktarimiAPIIntegration: React.FC = () => {
  const [config, setConfig] = useState<APIConfig>({
    apiKey: '',
    apiSecret: '',
    webhookUrl: '',
    endpointUrl: '',
    rateLimit: 100,
    timeout: 30,
    retryAttempts: 3,
    enableLogging: true,
    enableEncryption: true,
    dataFormat: 'json'
  });

  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [transferStats, setTransferStats] = useState<DataTransferStats>({
    totalTransfers: 0,
    successfulTransfers: 0,
    failedTransfers: 0,
    totalDataSize: 0,
    averageTransferTime: 0
  });

  useEffect(() => {
    // Load saved configuration
    const savedConfig = localStorage.getItem('veri_aktarimi_api_config');
    if (savedConfig) {
      setConfig(JSON.parse(savedConfig));
    }

    // Check connection status
    const checkConnection = async () => {
      try {
        const response = await fetch('/api/integrations/veri-aktarimi-api/status');
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
      localStorage.setItem('veri_aktarimi_api_config', JSON.stringify(config));
      
      // Test connection
      const response = await fetch('/api/integrations/veri-aktarimi-api/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });

      if (response.ok) {
        setIsConnected(true);
        alert('Bağlantı başarılı! Veri Aktarımı & API entegrasyonu aktif edildi.');
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
      const response = await fetch('/api/integrations/veri-aktarimi-api/sync', {
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

  const handleTestTransfer = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/integrations/veri-aktarimi-api/test-transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });

      if (response.ok) {
        alert('Test veri aktarımı başarılı!');
      } else {
        alert('Test veri aktarımı başarısız oldu.');
      }
    } catch (error) {
      console.error('Test transfer failed', error);
      alert('Test veri aktarımı başarısız oldu.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (confirm('Veri Aktarımı & API entegrasyonunu devre dışı bırakmak istediğinize emin misiniz?')) {
      setIsLoading(true);
      try {
        await fetch('/api/integrations/veri-aktarimi-api/disconnect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        setIsConnected(false);
        localStorage.removeItem('veri_aktarimi_api_config');
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
          <Database className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Veri Aktarımı & API Entegrasyonu</h1>
          <Badge variant={isConnected ? 'default' : 'outline'}>
            {isConnected ? 'Aktif' : 'Pasif'}
          </Badge>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Genel veri aktarımı ve API entegrasyon framework'ü
        </p>
      </div>

      {/* Status Alert */}
      <Alert className={`mb-6 ${isConnected ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'}`}>
        <div className="flex items-center gap-2">
          {isConnected ? <CheckCircle className="h-4 w-4 text-green-600" /> : <AlertCircle className="h-4 w-4 text-yellow-600" />}
          <AlertDescription>
            {isConnected 
              ? 'Veri aktarımı ve API entegrasyonunuz aktif durumda. Veriler otomatik olarak senkronize edilmektedir.' 
              : 'Veri aktarımı ve API entegrasyonu için API bilgilerinizi girerek bağlantıyı kurabilirsiniz.'
            }
          </AlertDescription>
        </div>
      </Alert>

      {/* Stats Cards */}
      {isConnected && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Toplam Aktarım</CardTitle>
              <Upload className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{transferStats.totalTransfers}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Başarılı</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{transferStats.successfulTransfers}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Başarısız</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{transferStats.failedTransfers}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Veri Boyutu</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(transferStats.totalDataSize / 1024).toFixed(1)} MB</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ort. Süre</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{transferStats.averageTransferTime}s</div>
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
          <TabsTrigger value="security">
            <Shield className="h-4 w-4 mr-2" />
            Güvenlik
          </TabsTrigger>
          <TabsTrigger value="logs">
            <BarChart3 className="h-4 w-4 mr-2" />
            Loglar
          </TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>API Ayarları</CardTitle>
              <CardDescription>
                Veri aktarımı ve API entegrasyonu için temel ayarlar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="apiKey" className="flex items-center gap-2">
                    <Key className="h-4 w-4" />
                    API Anahtarı
                  </Label>
                  <Input
                    id="apiKey"
                    type="password"
                    value={config.apiKey}
                    onChange={(e) => setConfig({...config, apiKey: e.target.value})}
                    placeholder="API Anahtarınızı girin"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="apiSecret" className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    API Gizli Anahtarı
                  </Label>
                  <Input
                    id="apiSecret"
                    type="password"
                    value={config.apiSecret}
                    onChange={(e) => setConfig({...config, apiSecret: e.target.value})}
                    placeholder="API Gizli Anahtarınızı girin"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="endpointUrl">API Endpoint URL</Label>
                <Input
                  id="endpointUrl"
                  value={config.endpointUrl}
                  onChange={(e) => setConfig({...config, endpointUrl: e.target.value})}
                  placeholder="https://api.example.com/v1/endpoint"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="webhookUrl">Webhook URL</Label>
                <Input
                  id="webhookUrl"
                  value={config.webhookUrl}
                  onChange={(e) => setConfig({...config, webhookUrl: e.target.value})}
                  placeholder="https://your-domain.com/webhook/api"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rateLimit">Rate Limit (istek/dakika)</Label>
                  <Input
                    id="rateLimit"
                    type="number"
                    value={config.rateLimit}
                    onChange={(e) => setConfig({...config, rateLimit: parseInt(e.target.value) || 100})}
                    min="1"
                    max="1000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timeout">Zaman Aşımı (saniye)</Label>
                  <Input
                    id="timeout"
                    type="number"
                    value={config.timeout}
                    onChange={(e) => setConfig({...config, timeout: parseInt(e.target.value) || 30})}
                    min="5"
                    max="300"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="retryAttempts">Yeniden Deneme</Label>
                  <Input
                    id="retryAttempts"
                    type="number"
                    value={config.retryAttempts}
                    onChange={(e) => setConfig({...config, retryAttempts: parseInt(e.target.value) || 3})}
                    min="0"
                    max="10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dataFormat">Veri Formatı</Label>
                <select
                  id="dataFormat"
                  value={config.dataFormat}
                  onChange={(e) => setConfig({...config, dataFormat: e.target.value as 'json' | 'xml' | 'csv'})}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="json">JSON</option>
                  <option value="xml">XML</option>
                  <option value="csv">CSV</option>
                </select>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSaveConfig} disabled={isLoading}>
                  {isLoading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                  Kaydet ve Bağlan
                </Button>
                <Button variant="outline" onClick={handleTestTransfer} disabled={isLoading || !isConnected}>
                  <Zap className="h-4 w-4 mr-2" />
                  Test Aktarımı
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
                Verileri manuel olarak senkronize edin veya aktarım başlatın
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button onClick={handleSync} disabled={isLoading || !isConnected}>
                  {isLoading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                  Tüm Verileri Senkronize Et
                </Button>
                <Button variant="outline" disabled={isLoading || !isConnected}>
                  <Upload className="h-4 w-4 mr-2" />
                  Veri Gönder
                </Button>
                <Button variant="outline" disabled={isLoading || !isConnected}>
                  <Download className="h-4 w-4 mr-2" />
                  Veri Al
                </Button>
                <Button variant="outline" disabled={isLoading || !isConnected}>
                  <Zap className="h-4 w-4 mr-2" />
                  Toplu Aktarım
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

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Güvenlik Ayarları</CardTitle>
              <CardDescription>
                Veri aktarımı ve API güvenlik ayarlarını yapılandırın
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="enableLogging"
                    checked={config.enableLogging}
                    onChange={(e) => setConfig({...config, enableLogging: e.target.checked})}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="enableLogging">Aktarım loglarını etkinleştir</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="enableEncryption"
                    checked={config.enableEncryption}
                    onChange={(e) => setConfig({...config, enableEncryption: e.target.checked})}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="enableEncryption">Veri şifrelemesini etkinleştir</Label>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Shield className="h-4 w-4" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Güvenlik sertifikası: <span className="text-green-600">Aktif</span>
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Key className="h-4 w-4" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Şifreleme: <span className="text-green-600">TLS 1.3</span>
                </span>
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

export default VeriAktarimiAPIIntegration;