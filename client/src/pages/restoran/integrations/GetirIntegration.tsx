import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Truck, 
  Settings, 
  Save, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle,
  Clock,
  BarChart3,
  Package,
  TrendingUp,
  DollarSign,
  MapPin,
  Clock3
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface GetirConfig {
  clientId: string;
  clientSecret: string;
  restaurantId: string;
  branchId: string;
  webhookUrl: string;
  autoAcceptOrders: boolean;
  deliveryTime: number;
  preparationTime: number;
  syncMenu: boolean;
  syncWorkingHours: boolean;
}

interface OrderStats {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  successRate: number;
  averageDeliveryTime: number;
}

const GetirIntegration: React.FC = () => {
  const [config, setConfig] = useState<GetirConfig>({
    clientId: '',
    clientSecret: '',
    restaurantId: '',
    branchId: '',
    webhookUrl: '',
    autoAcceptOrders: true,
    deliveryTime: 30,
    preparationTime: 15,
    syncMenu: true,
    syncWorkingHours: true
  });

  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [orderStats, setOrderStats] = useState<OrderStats>({
    totalOrders: 0,
    totalRevenue: 0,
    averageOrderValue: 0,
    successRate: 0,
    averageDeliveryTime: 0
  });

  useEffect(() => {
    // Load saved configuration
    const savedConfig = localStorage.getItem('getir_config');
    if (savedConfig) {
      setConfig(JSON.parse(savedConfig));
    }

    // Check connection status
    const checkConnection = async () => {
      try {
        const response = await fetch('/api/integrations/getir/status');
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
      localStorage.setItem('getir_config', JSON.stringify(config));
      
      // Test connection
      const response = await fetch('/api/integrations/getir/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });

      if (response.ok) {
        setIsConnected(true);
        alert('Bağlantı başarılı! Getir entegrasyonu aktif edildi.');
      } else {
        alert('Bağlantı başarısız. Lütfen API bilgilerinizi kontrol edin.');
      }
    } catch (error) {
      console.error('Save config failed:', error);
      alert('Kaydetme işlemi başarısız oldu.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSync = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/integrations/getir/sync', {
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
      console.error('Sync failed:', error);
      alert('Senkronizasyon başarısız oldu.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (confirm('Getir entegrasyonunu devre dışı bırakmak istediğinize emin misiniz?')) {
      setIsLoading(true);
      try {
        await fetch('/api/integrations/getir/disconnect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        setIsConnected(false);
        localStorage.removeItem('getir_config');
        alert('Entegrasyon devre dışı bırakıldı.');
      } catch (error) {
        console.error('Disconnect failed:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Truck className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Getir Entegrasyonu</h1>
          <Badge variant={isConnected ? 'default' : 'outline'}>
            {isConnected ? 'Aktif' : 'Pasif'}
          </Badge>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Hızlı teslimat ve yemek siparişi platformu ile entegrasyon
        </p>
      </div>

      {/* Status Alert */}
      <Alert className={`mb-6 ${isConnected ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'}`}>
        <div className="flex items-center gap-2">
          {isConnected ? <CheckCircle className="h-4 w-4 text-green-600" /> : <AlertCircle className="h-4 w-4 text-yellow-600" />}
          <AlertDescription>
            {isConnected 
              ? 'Getir entegrasyonunuz aktif durumda. Siparişler otomatik olarak alınmaktadır.' 
              : 'Getir entegrasyonu için API bilgilerinizi girerek bağlantıyı kurabilirsiniz.'
            }
          </AlertDescription>
        </div>
      </Alert>

      {/* Stats Cards */}
      {isConnected && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Toplam Sipariş</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{orderStats.totalOrders}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Toplam Ciro</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₺{orderStats.totalRevenue.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ortalama Sipariş</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₺{orderStats.averageOrderValue}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Başarı Oranı</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">%{(orderStats.successRate * 100).toFixed(1)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ort. Teslim Süresi</CardTitle>
              <Clock3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{orderStats.averageDeliveryTime} dk</div>
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
          <TabsTrigger value="delivery">
            <MapPin className="h-4 w-4 mr-2" />
            Teslimat
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
                Getir Partner Portal'dan aldığınız API bilgilerini girin
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="clientId">Client ID</Label>
                  <Input
                    id="clientId"
                    type="password"
                    value={config.clientId}
                    onChange={(e) => setConfig({...config, clientId: e.target.value})}
                    placeholder="Client ID'nizi girin"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientSecret">Client Secret</Label>
                  <Input
                    id="clientSecret"
                    type="password"
                    value={config.clientSecret}
                    onChange={(e) => setConfig({...config, clientSecret: e.target.value})}
                    placeholder="Client Secret'ınızı girin"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="restaurantId">Restoran ID</Label>
                  <Input
                    id="restaurantId"
                    value={config.restaurantId}
                    onChange={(e) => setConfig({...config, restaurantId: e.target.value})}
                    placeholder="Restoran ID'nizi girin"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="branchId">Şube ID</Label>
                  <Input
                    id="branchId"
                    value={config.branchId}
                    onChange={(e) => setConfig({...config, branchId: e.target.value})}
                    placeholder="Şube ID'nizi girin"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="webhookUrl">Webhook URL</Label>
                <Input
                  id="webhookUrl"
                  value={config.webhookUrl}
                  onChange={(e) => setConfig({...config, webhookUrl: e.target.value})}
                  placeholder="https://your-domain.com/webhook/getir"
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="autoAcceptOrders"
                    checked={config.autoAcceptOrders}
                    onChange={(e) => setConfig({...config, autoAcceptOrders: e.target.checked})}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="autoAcceptOrders">Siparişleri otomatik kabul et</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="syncMenu"
                    checked={config.syncMenu}
                    onChange={(e) => setConfig({...config, syncMenu: e.target.checked})}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="syncMenu">Menüyü otomatik senkronize et</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="syncWorkingHours"
                    checked={config.syncWorkingHours}
                    onChange={(e) => setConfig({...config, syncWorkingHours: e.target.checked})}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="syncWorkingHours">Çalışma saatlerini senkronize et</Label>
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
                Menü, siparişler ve diğer verileri manuel olarak senkronize edin
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button onClick={handleSync} disabled={isLoading || !isConnected}>
                  {isLoading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                  Tüm Verileri Senkronize Et
                </Button>
                <Button variant="outline" disabled={isLoading || !isConnected}>
                  Menüyü Senkronize Et
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

        <TabsContent value="delivery" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Teslimat Ayarları</CardTitle>
              <CardDescription>
                Getir teslimat süreleri ve hazırlık süresi ayarları
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="preparationTime">Hazırlama Süresi (dakika)</Label>
                  <Input
                    id="preparationTime"
                    type="number"
                    value={config.preparationTime}
                    onChange={(e) => setConfig({...config, preparationTime: parseInt(e.target.value) || 0})}
                    min="5"
                    max="60"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deliveryTime">Teslimat Süresi (dakika)</Label>
                  <Input
                    id="deliveryTime"
                    type="number"
                    value={config.deliveryTime}
                    onChange={(e) => setConfig({...config, deliveryTime: parseInt(e.target.value) || 0})}
                    min="10"
                    max="120"
                  />
                </div>
              </div>
              
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900 dark:text-blue-100">Teslimat Bilgisi</span>
                </div>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Toplam teslimat süresi: {config.preparationTime + config.deliveryTime} dakika
                </p>
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

export default GetirIntegration;