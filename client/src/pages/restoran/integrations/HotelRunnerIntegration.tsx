import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Hotel, 
  Settings, 
  Save, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle,
  Clock,
  BarChart3,
  Calendar,
  Users,
  Bed,
  Key,
  Wifi,
  Coffee
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface HotelRunnerConfig {
  hotelId: string;
  apiKey: string;
  apiSecret: string;
  propertyCode: string;
  webhookUrl: string;
  autoSync: boolean;
  syncRooms: boolean;
  syncReservations: boolean;
  syncRates: boolean;
  enableChannelManager: boolean;
  enableBookingEngine: boolean;
}

interface HotelRunnerStats {
  totalRooms: number;
  occupiedRooms: number;
  availableRooms: number;
  totalReservations: number;
  todayCheckins: number;
  todayCheckouts: number;
}

const HotelRunnerIntegration: React.FC = () => {
  const [config, setConfig] = useState<HotelRunnerConfig>({
    hotelId: '',
    apiKey: '',
    apiSecret: '',
    propertyCode: '',
    webhookUrl: '',
    autoSync: true,
    syncRooms: true,
    syncReservations: true,
    syncRates: true,
    enableChannelManager: true,
    enableBookingEngine: true
  });

  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [hotelRunnerStats, setHotelRunnerStats] = useState<HotelRunnerStats>({
    totalRooms: 0,
    occupiedRooms: 0,
    availableRooms: 0,
    totalReservations: 0,
    todayCheckins: 0,
    todayCheckouts: 0
  });

  useEffect(() => {
    // Load saved configuration
    const savedConfig = localStorage.getItem('hotel_runner_config');
    if (savedConfig) {
      setConfig(JSON.parse(savedConfig));
    }

    // Check connection status
    const checkConnection = async () => {
      try {
        const response = await fetch('/api/integrations/hotel-runner/status');
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
      localStorage.setItem('hotel_runner_config', JSON.stringify(config));
      
      // Test connection
      const response = await fetch('/api/integrations/hotel-runner/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });

      if (response.ok) {
        setIsConnected(true);
        alert('Bağlantı başarılı! Hotel Runner entegrasyonu aktif edildi.');
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
      const response = await fetch('/api/integrations/hotel-runner/sync', {
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

  const handleSyncReservations = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/integrations/hotel-runner/sync-reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });

      if (response.ok) {
        alert('Rezervasyon senkronizasyonu başarılı!');
      } else {
        alert('Rezervasyon senkronizasyonu başarısız oldu.');
      }
    } catch (error) {
      console.error('Sync reservations failed', error);
      alert('Rezervasyon senkronizasyonu başarısız oldu.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (confirm('Hotel Runner entegrasyonunu devre dışı bırakmak istediğinize emin misiniz?')) {
      setIsLoading(true);
      try {
        await fetch('/api/integrations/hotel-runner/disconnect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        setIsConnected(false);
        localStorage.removeItem('hotel_runner_config');
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
          <Hotel className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Hotel Runner Entegrasyonu</h1>
          <Badge variant={isConnected ? 'default' : 'outline'}>
            {isConnected ? 'Aktif' : 'Pasif'}
          </Badge>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Otel yönetimi ve rezervasyon entegrasyonu
        </p>
      </div>

      {/* Status Alert */}
      <Alert className={`mb-6 ${isConnected ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'}`}>
        <div className="flex items-center gap-2">
          {isConnected ? <CheckCircle className="h-4 w-4 text-green-600" /> : <AlertCircle className="h-4 w-4 text-yellow-600" />}
          <AlertDescription>
            {isConnected 
              ? 'Hotel Runner entegrasyonunuz aktif durumda. Oda ve rezervasyon bilgileri otomatik olarak senkronize edilmektedir.' 
              : 'Hotel Runner entegrasyonu için API bilgilerinizi girerek bağlantıyı kurabilirsiniz.'
            }
          </AlertDescription>
        </div>
      </Alert>

      {/* Stats Cards */}
      {isConnected && (
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Toplam Oda</CardTitle>
              <Bed className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{hotelRunnerStats.totalRooms}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Dolu Oda</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{hotelRunnerStats.occupiedRooms}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Boş Oda</CardTitle>
              <Key className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{hotelRunnerStats.availableRooms}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Toplam Rezervasyon</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{hotelRunnerStats.totalReservations}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bugün Giriş</CardTitle>
              <Coffee className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{hotelRunnerStats.todayCheckins}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bugün Çıkış</CardTitle>
              <Wifi className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{hotelRunnerStats.todayCheckouts}</div>
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
          <TabsTrigger value="rooms">
            <Bed className="h-4 w-4 mr-2" />
            Odalar
          </TabsTrigger>
          <TabsTrigger value="reservations">
            <Calendar className="h-4 w-4 mr-2" />
            Rezervasyonlar
          </TabsTrigger>
          <TabsTrigger value="sync">
            <RefreshCw className="h-4 w-4 mr-2" />
            Senkronizasyon
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
                Hotel Runner panelinden aldığınız API bilgilerini girin
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="hotelId">Otel ID</Label>
                  <Input
                    id="hotelId"
                    value={config.hotelId}
                    onChange={(e) => setConfig({...config, hotelId: e.target.value})}
                    placeholder="Otel ID'nizi girin"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="propertyCode">Tesis Kodu</Label>
                  <Input
                    id="propertyCode"
                    value={config.propertyCode}
                    onChange={(e) => setConfig({...config, propertyCode: e.target.value})}
                    placeholder="Tesis kodunuzu girin"
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
                  placeholder="https://your-domain.com/webhook/hotel-runner"
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="autoSync"
                    checked={config.autoSync}
                    onChange={(e) => setConfig({...config, autoSync: e.target.checked})}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="autoSync">Otomatik senkronizasyon</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="enableChannelManager"
                    checked={config.enableChannelManager}
                    onChange={(e) => setConfig({...config, enableChannelManager: e.target.checked})}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="enableChannelManager">Channel Manager etkinleştir</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="enableBookingEngine"
                    checked={config.enableBookingEngine}
                    onChange={(e) => setConfig({...config, enableBookingEngine: e.target.checked})}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="enableBookingEngine">Booking Engine etkinleştir</Label>
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

        <TabsContent value="rooms" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Oda Ayarları</CardTitle>
              <CardDescription>
                Oda senkronizasyonu ve yönetim ayarları
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="syncRooms"
                  checked={config.syncRooms}
                  onChange={(e) => setConfig({...config, syncRooms: e.target.checked})}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="syncRooms">Oda bilgilerini senkronize et</Label>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" disabled={isLoading || !isConnected}>
                  <Bed className="h-4 w-4 mr-2" />
                  Odaları Görüntüle
                </Button>
                <Button variant="outline" disabled={isLoading || !isConnected}>
                  <Key className="h-4 w-4 mr-2" />
                  Oda Türlerini Senkronize Et
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reservations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Rezervasyon Ayarları</CardTitle>
              <CardDescription>
                Rezervasyon senkronizasyonu ve yönetim ayarları
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="syncReservations"
                  checked={config.syncReservations}
                  onChange={(e) => setConfig({...config, syncReservations: e.target.checked})}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="syncReservations">Rezervasyonları senkronize et</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="syncRates"
                  checked={config.syncRates}
                  onChange={(e) => setConfig({...config, syncRates: e.target.checked})}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="syncRates">Fiyatları senkronize et</Label>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSyncReservations} disabled={isLoading || !isConnected}>
                  {isLoading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                  Rezervasyonları Senkronize Et
                </Button>
                <Button variant="outline" disabled={isLoading || !isConnected}>
                  <Calendar className="h-4 w-4 mr-2" />
                  Rezervasyonları Görüntüle
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sync" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Manuel Senkronizasyon</CardTitle>
              <CardDescription>
                Oda ve rezervasyon bilgilerini manuel olarak senkronize edin
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button onClick={handleSync} disabled={isLoading || !isConnected}>
                  {isLoading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                  Tüm Verileri Senkronize Et
                </Button>
                <Button variant="outline" disabled={isLoading || !isConnected}>
                  <Bed className="h-4 w-4 mr-2" />
                  Odaları Senkronize Et
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

export default HotelRunnerIntegration;