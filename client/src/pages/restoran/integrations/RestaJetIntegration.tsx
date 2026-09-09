import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Settings, 
  Save, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle,
  Clock,
  Users,
  Calendar,
  FileText,
  Utensils,
  Percent,
  Bell,
  Mail,
  Smartphone
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface RestaJetConfig {
  restaurantId: string;
  apiKey: string;
  branchId: string;
  webhookUrl: string;
  autoSync: boolean;
  syncReservations: boolean;
  syncCustomers: boolean;
  syncStaff: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
}

interface ReservationStats {
  totalReservations: number;
  todayReservations: number;
  pendingReservations: number;
  cancelledReservations: number;
}

const RestaJetIntegration: React.FC = () => {
  const [config, setConfig] = useState<RestaJetConfig>({
    restaurantId: '',
    apiKey: '',
    branchId: '',
    webhookUrl: '',
    autoSync: true,
    syncReservations: true,
    syncCustomers: true,
    syncStaff: true,
    emailNotifications: true,
    smsNotifications: false
  });

  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [reservationStats, setReservationStats] = useState<ReservationStats>({
    totalReservations: 0,
    todayReservations: 0,
    pendingReservations: 0,
    cancelledReservations: 0
  });

  useEffect(() => {
    // Load saved configuration
    const savedConfig = localStorage.getItem('restajet_config');
    if (savedConfig) {
      setConfig(JSON.parse(savedConfig));
    }

    // Check connection status
    const checkConnection = async () => {
      try {
        const response = await fetch('/api/integrations/restajet/status');
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
      localStorage.setItem('restajet_config', JSON.stringify(config));
      
      // Test connection
      const response = await fetch('/api/integrations/restajet/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });

      if (response.ok) {
        setIsConnected(true);
        alert('Bağlantı başarılı! RestaJet entegrasyonu aktif edildi.');
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
      const response = await fetch('/api/integrations/restajet/sync', {
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
    if (confirm('RestaJet entegrasyonunu devre dışı bırakmak istediğinize emin misiniz?')) {
      setIsLoading(true);
      try {
        await fetch('/api/integrations/restajet/disconnect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        setIsConnected(false);
        localStorage.removeItem('restajet_config');
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
          <Calendar className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">RestaJet Entegrasyonu</h1>
          <Badge variant={isConnected ? 'default' : 'outline'}>
            {isConnected ? 'Aktif' : 'Pasif'}
          </Badge>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          RestaJet restoran yönetim sistemi ile entegrasyon
        </p>
      </div>

      {/* Status Alert */}
      <Alert className={`mb-6 ${isConnected ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'}`}>
        <div className="flex items-center gap-2">
          {isConnected ? <CheckCircle className="h-4 w-4 text-green-600" /> : <AlertCircle className="h-4 w-4 text-yellow-600" />}
          <AlertDescription>
            {isConnected 
              ? 'RestaJet entegrasyonunuz aktif durumda. Rezervasyonlar otomatik olarak senkronize edilmektedir.' 
              : 'RestaJet entegrasyonu için API bilgilerinizi girerek bağlantıyı kurabilirsiniz.'
            }
          </AlertDescription>
        </div>
      </Alert>

      {/* Stats Cards */}
      {isConnected && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Toplam Rezervasyon</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{reservationStats.totalReservations}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bugünkü Rezervasyon</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{reservationStats.todayReservations}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bekleyen Rezervasyon</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{reservationStats.pendingReservations}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">İptal Edilen</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{reservationStats.cancelledReservations}</div>
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
          <TabsTrigger value="reservations">
            <Calendar className="h-4 w-4 mr-2" />
            Rezervasyonlar
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="h-4 w-4 mr-2" />
            Bildirimler
          </TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>API Ayarları</CardTitle>
              <CardDescription>
                RestaJet panelinden aldığınız API bilgilerini girin
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
                <Label htmlFor="webhookUrl">Webhook URL</Label>
                <Input
                  id="webhookUrl"
                  value={config.webhookUrl}
                  onChange={(e) => setConfig({...config, webhookUrl: e.target.value})}
                  placeholder="https://your-domain.com/webhook/restajet"
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
                  <Label htmlFor="autoSync">Otomatik senkronizasyonu etkinleştir</Label>
                </div>
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
                    id="syncCustomers"
                    checked={config.syncCustomers}
                    onChange={(e) => setConfig({...config, syncCustomers: e.target.checked})}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="syncCustomers">Müşterileri senkronize et</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="syncStaff"
                    checked={config.syncStaff}
                    onChange={(e) => setConfig({...config, syncStaff: e.target.checked})}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="syncStaff">Personel bilgilerini senkronize et</Label>
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
                Rezervasyonlar, müşteriler ve diğer verileri manuel olarak senkronize edin
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button onClick={handleSync} disabled={isLoading || !isConnected}>
                  {isLoading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                  Tüm Verileri Senkronize Et
                </Button>
                <Button variant="outline" disabled={isLoading || !isConnected}>
                  Rezervasyonları Senkronize Et
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

        <TabsContent value="reservations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Rezervasyon Yönetimi</CardTitle>
              <CardDescription>
                RestaJet üzerinden gelen rezervasyonları yönetin
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Rezervasyon Senkronizasyonu</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">RestaJet rezervasyonlarını otomatik olarak al</p>
                  </div>
                  <Button variant="outline" size="sm" disabled={!isConnected}>
                    Senkronize Et
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Müşteri Bilgileri</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Müşteri bilgilerini senkronize et</p>
                  </div>
                  <Button variant="outline" size="sm" disabled={!isConnected}>
                    Senkronize Et
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Bildirim Ayarları</CardTitle>
              <CardDescription>
                RestaJet bildirim ayarlarını yapılandırın
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="emailNotifications"
                    checked={config.emailNotifications}
                    onChange={(e) => setConfig({...config, emailNotifications: e.target.checked})}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="emailNotifications" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    E-posta bildirimlerini etkinleştir
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="smsNotifications"
                    checked={config.smsNotifications}
                    onChange={(e) => setConfig({...config, smsNotifications: e.target.checked})}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="smsNotifications" className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4" />
                    SMS bildirimlerini etkinleştir
                  </Label>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RestaJetIntegration;