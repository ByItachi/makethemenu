import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Package, 
  Settings, 
  Save, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle,
  Clock,
  BarChart3,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Truck,
  MapPin
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface MigrosYemekConfig {
  restaurantId: string;
  apiKey: string;
  apiSecret: string;
  branchId: string;
  webhookUrl: string;
  autoAcceptOrders: boolean;
  syncMenu: boolean;
  syncInventory: boolean;
  deliveryRadius: number;
  minimumOrderAmount: number;
}

interface OrderStats {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  deliverySuccessRate: number;
}

const MigrosYemekIntegration: React.FC = () => {
  const [config, setConfig] = useState<MigrosYemekConfig>({
    restaurantId: '',
    apiKey: '',
    apiSecret: '',
    branchId: '',
    webhookUrl: '',
    autoAcceptOrders: true,
    syncMenu: true,
    syncInventory: true,
    deliveryRadius: 5,
    minimumOrderAmount: 50
  });

  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [orderStats, setOrderStats] = useState<OrderStats>({
    totalOrders: 0,
    totalRevenue: 0,
    averageOrderValue: 0,
    deliverySuccessRate: 0
  });

  useEffect(() => {
    // Load saved configuration
    const savedConfig = localStorage.getItem('migros_yemek_config');
    if (savedConfig) {
      setConfig(JSON.parse(savedConfig));
    }

    // Check connection status
    const checkConnection = async () => {
      try {
        const response = await fetch('/api/integrations/migros-yemek/status');
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
      localStorage.setItem('migros_yemek_config', JSON.stringify(config));
      
      // Test connection
      const response = await fetch('/api/integrations/migros-yemek/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });

      if (response.ok) {
        setIsConnected(true);
        alert('Bağlantı başarılı! Migros Yemek entegrasyonu aktif edildi.');
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
      const response = await fetch('/api/integrations/migros-yemek/sync', {
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
    if (confirm('Migros Yemek entegrasyonunu devre dışı bırakmak istediğinize emin misiniz?')) {
      setIsLoading(true);
      try {
        await fetch('/api/integrations/migros-yemek/disconnect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        setIsConnected(false);
        localStorage.removeItem('migros_yemek_config');
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
          <Package className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Migros Yemek Entegrasyonu</h1>
          <Badge variant={isConnected ? 'default' : 'outline'}>
            {isConnected ? 'Aktif' : 'Pasif'}
          </Badge>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Migros'un online yemek siparişi platformu ile entegrasyon
        </p>
      </div>

      {/* Status Alert */}
      <Alert className={`mb-6 ${isConnected ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'}`}>
        <div className="flex items-center gap-2">
          {isConnected ? <CheckCircle className="h-4 w-4 text-green-600" /> : <AlertCircle className="h-4 w-4 text-yellow-600" />}
          <AlertDescription>
            {isConnected 
              ? 'Migros Yemek entegrasyonunuz aktif durumda. Siparişler otomatik olarak alınmaktadır.' 
              : 'Migros Yemek entegrasyonu için API bilgilerinizi girerek bağlantıyı kurabilirsiniz.'
            }
          </AlertDescription>
        </div>
      </Alert>

      {/* Stats Cards */}
      {isConnected && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Toplam Sipariş</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
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
              <CardTitle className="text-sm font-medium">Teslimat Başarısı</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">%{(orderStats.deliverySuccessRate * 100).toFixed(1)}</div>
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
            <Truck className="h-4 w-4 mr-2" />
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
                Migros Yemek panelinden aldığınız API bilgilerini girin
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="restaurantId">Restaurant ID</Label>
                  <Input
                    id="restaurantId"
                    value={config.restaurantId}
                    onChange={(e) => setConfig({...config, restaurantId: e.target.value})}
                    placeholder="Restaurant ID'nizi girin"
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
                <Label htmlFor="apiKey">API Anahtarı</Label>
                <Input
                  id="apiKey"
                  type="password"
                  value={config.apiKey}
                  onChange={(e) => setConfig({...config, apiKey: e.target.value})}
                  placeholder="API Anahtarınızı girin"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="apiSecret">API Gizli Anahtarı</Label>
                <Input
                  id="apiSecret"
                  type="password"
                  value={config.apiSecret}
                  onChange={(e) => setConfig({...config, apiSecret: e.target.value})}
                  placeholder="API Gizli Anahtarınızı girin"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="webhookUrl">Webhook URL</Label>
                <Input
                  id="webhookUrl"
                  value={config.webhookUrl}
                  onChange={(e) => setConfig({...config, webhookUrl: e.target.value})}
                  placeholder="https://your-domain.com/webhook/migros-yemek"
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
                    id="syncInventory"
                    checked={config.syncInventory}
                    onChange={(e) => setConfig({...config, syncInventory: e.target.checked})}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="syncInventory">Stokları senkronize et</Label>
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
                Migros Yemek teslimat ayarlarını yapılandırın
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="deliveryRadius" className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Teslimat Yarıçapı (km)
                  </Label>
                  <Input
                    id="deliveryRadius"
                    type="number"
                    value={config.deliveryRadius}
                    onChange={(e) => setConfig({...config, deliveryRadius: parseInt(e.target.value) || 0})}
                    min="1"
                    max="20"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minimumOrderAmount" className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Minimum Sipariş Tutarı (₺)
                  </Label>
                  <Input
                    id="minimumOrderAmount"
                    type="number"
                    value={config.minimumOrderAmount}
                    onChange={(e) => setConfig({...config, minimumOrderAmount: parseInt(e.target.value) || 0})}
                    min="0"
                    step="0.01"
                  />
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

export default MigrosYemekIntegration;