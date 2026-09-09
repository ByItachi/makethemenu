import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Hotel,
  Settings,
  Save,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Calendar,
  Bed,
  Users,
  Key,
  Clock
} from 'lucide-react';

interface HMSConfig {
  hotelId: string;
  apiKey: string;
  apiSecret: string;
  propertyCode: string;
  webhookUrl: string;
  autoSync: boolean;
  syncRooms: boolean;
  syncReservations: boolean;
  syncRates: boolean;
}

interface HMSStats {
  totalRooms: number;
  occupiedRooms: number;
  availableRooms: number;
  totalReservations: number;
  todayCheckins: number;
  todayCheckouts: number;
}

const HMSHotelIntegration: React.FC = () => {
  const [config, setConfig] = useState<HMSConfig>({
    hotelId: '',
    apiKey: '',
    apiSecret: '',
    propertyCode: '',
    webhookUrl: '',
    autoSync: true,
    syncRooms: true,
    syncReservations: true,
    syncRates: true,
  });

  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [stats, setStats] = useState<HMSStats>({
    totalRooms: 0,
    occupiedRooms: 0,
    availableRooms: 0,
    totalReservations: 0,
    todayCheckins: 0,
    todayCheckouts: 0
  });

  useEffect(() => {
    const saved = localStorage.getItem('hms-hotel_config');
    if (saved) {
      setConfig(JSON.parse(saved));
    }
    const check = async () => {
      try {
        const res = await fetch('/api/integrations/hms-hotel/status');
        const data = await res.json();
        setIsConnected(data.connected);
        if (data.lastSync) setLastSync(new Date(data.lastSync));
      } catch {}
    };
    check();
  }, []);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      localStorage.setItem('hms-hotel_config', JSON.stringify(config));
      const res = await fetch('/api/integrations/hms-hotel/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      if (res.ok) {
        setIsConnected(true);
        alert('Bağlantı başarılı! HMS HOTEL entegrasyonu aktif edildi.');
      } else {
        alert('Bağlantı başarısız. Lütfen API bilgilerinizi kontrol edin.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSync = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/integrations/hms-hotel/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      if (res.ok) {
        setLastSync(new Date());
        alert('Senkronizasyon başarılı!');
      } else {
        alert('Senkronizasyon başarısız.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('HMS HOTEL entegrasyonunu devre dışı bırakmak istiyor musunuz?')) return;
    setIsLoading(true);
    try {
      await fetch('/api/integrations/hms-hotel/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      setIsConnected(false);
      localStorage.removeItem('hms-hotel_config');
      alert('Entegrasyon devre dışı bırakıldı.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Hotel className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">HMS HOTEL Entegrasyonu</h1>
          <Badge variant={isConnected ? 'default' : 'outline'}>
            {isConnected ? 'Aktif' : 'Pasif'}
          </Badge>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          HMS otel yönetim sistemi ile oda ve rezervasyon senkronizasyonu
        </p>
      </div>

      <Alert className={`mb-6 ${isConnected ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'}`}>
        <div className="flex items-center gap-2">
          {isConnected ? <CheckCircle className="h-4 w-4 text-green-600" /> : <AlertCircle className="h-4 w-4 text-yellow-600" />}
          <AlertDescription>
            {isConnected 
              ? 'HMS HOTEL entegrasyonunuz aktif. Veriler otomatik senkronize ediliyor.' 
              : 'API bilgilerinizi girerek HMS HOTEL bağlantısını kurabilirsiniz.'}
          </AlertDescription>
        </div>
      </Alert>

      {isConnected && (
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Toplam Oda</CardTitle>
              <Bed className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalRooms}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Dolu Oda</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.occupiedRooms}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Boş Oda</CardTitle>
              <Key className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.availableRooms}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Toplam Rezervasyon</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalReservations}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bugün Giriş</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.todayCheckins}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bugün Çıkış</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.todayCheckouts}</div>
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
        </TabsList>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>API Ayarları</CardTitle>
              <CardDescription>HMS HOTEL API bilgilerinizi girin</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="hotelId">Otel ID</Label>
                  <Input id="hotelId" value={config.hotelId} onChange={(e) => setConfig({ ...config, hotelId: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="propertyCode">Tesis Kodu</Label>
                  <Input id="propertyCode" value={config.propertyCode} onChange={(e) => setConfig({ ...config, propertyCode: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="apiKey">API Anahtarı</Label>
                <Input id="apiKey" type="password" value={config.apiKey} onChange={(e) => setConfig({ ...config, apiKey: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="apiSecret">API Gizli Anahtarı</Label>
                <Input id="apiSecret" type="password" value={config.apiSecret} onChange={(e) => setConfig({ ...config, apiSecret: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="webhookUrl">Webhook URL</Label>
                <Input id="webhookUrl" value={config.webhookUrl} onChange={(e) => setConfig({ ...config, webhookUrl: e.target.value })} placeholder="https://your-domain.com/webhook/hms-hotel" />
              </div>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="autoSync" checked={config.autoSync} onChange={(e) => setConfig({ ...config, autoSync: e.target.checked })} className="rounded border-gray-300" />
                  <Label htmlFor="autoSync">Otomatik senkronizasyon</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="syncRooms" checked={config.syncRooms} onChange={(e) => setConfig({ ...config, syncRooms: e.target.checked })} className="rounded border-gray-300" />
                  <Label htmlFor="syncRooms">Oda bilgilerini senkronize et</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="syncReservations" checked={config.syncReservations} onChange={(e) => setConfig({ ...config, syncReservations: e.target.checked })} className="rounded border-gray-300" />
                  <Label htmlFor="syncReservations">Rezervasyonları senkronize et</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="syncRates" checked={config.syncRates} onChange={(e) => setConfig({ ...config, syncRates: e.target.checked })} className="rounded border-gray-300" />
                  <Label htmlFor="syncRates">Fiyatları senkronize et</Label>
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSave} disabled={isLoading}>
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
              <CardDescription>Oda ve rezervasyon bilgilerini manuel olarak senkronize edin</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={handleSync} disabled={isLoading || !isConnected}>
                {isLoading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                Tüm Verileri Senkronize Et
              </Button>
              {lastSync && (
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Clock className="h-4 w-4" />
                  Son senkronizasyon: {lastSync.toLocaleString('tr-TR')}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default HMSHotelIntegration;
