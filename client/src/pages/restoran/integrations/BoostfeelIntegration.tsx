import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Zap, 
  Settings, 
  Save, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle,
  Clock,
  BarChart3,
  TrendingUp,
  Users,
  Target,
  Award,
  Star,
  Heart
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface BoostfeelConfig {
  clientId: string;
  apiKey: string;
  apiSecret: string;
  restaurantId: string;
  webhookUrl: string;
  autoSync: boolean;
  enableLoyalty: boolean;
  enableCampaigns: boolean;
  enableAnalytics: boolean;
  pointsRate: number;
  welcomePoints: number;
  birthdayPoints: number;
}

interface BoostfeelStats {
  totalCustomers: number;
  activeMembers: number;
  totalPoints: number;
  redeemedPoints: number;
  totalCampaigns: number;
  conversionRate: number;
}

const BoostfeelIntegration: React.FC = () => {
  const [config, setConfig] = useState<BoostfeelConfig>({
    clientId: '',
    apiKey: '',
    apiSecret: '',
    restaurantId: '',
    webhookUrl: '',
    autoSync: true,
    enableLoyalty: true,
    enableCampaigns: true,
    enableAnalytics: true,
    pointsRate: 1,
    welcomePoints: 100,
    birthdayPoints: 200
  });

  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [boostfeelStats, setBoostfeelStats] = useState<BoostfeelStats>({
    totalCustomers: 0,
    activeMembers: 0,
    totalPoints: 0,
    redeemedPoints: 0,
    totalCampaigns: 0,
    conversionRate: 0
  });

  useEffect(() => {
    // Load saved configuration
    const savedConfig = localStorage.getItem('boostfeel_config');
    if (savedConfig) {
      setConfig(JSON.parse(savedConfig));
    }

    // Check connection status
    const checkConnection = async () => {
      try {
        const response = await fetch('/api/integrations/boostfeel/status');
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
      localStorage.setItem('boostfeel_config', JSON.stringify(config));
      
      // Test connection
      const response = await fetch('/api/integrations/boostfeel/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });

      if (response.ok) {
        setIsConnected(true);
        alert('Bağlantı başarılı! BOOSTFEEL entegrasyonu aktif edildi.');
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
      const response = await fetch('/api/integrations/boostfeel/sync', {
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

  const handleCreateCampaign = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/integrations/boostfeel/campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });

      if (response.ok) {
        alert('Kampanya başarıyla oluşturuldu!');
      } else {
        alert('Kampanya oluşturma başarısız oldu.');
      }
    } catch (error) {
      console.error('Create campaign failed', error);
      alert('Kampanya oluşturma başarısız oldu.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (confirm('BOOSTFEEL entegrasyonunu devre dışı bırakmak istediğinize emin misiniz?')) {
      setIsLoading(true);
      try {
        await fetch('/api/integrations/boostfeel/disconnect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        setIsConnected(false);
        localStorage.removeItem('boostfeel_config');
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
          <Zap className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">BOOSTFEEL Entegrasyonu</h1>
          <Badge variant={isConnected ? 'default' : 'outline'}>
            {isConnected ? 'Aktif' : 'Pasif'}
          </Badge>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Müşteri sadakat programı ve kampanya yönetimi
        </p>
      </div>

      {/* Status Alert */}
      <Alert className={`mb-6 ${isConnected ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'}`}>
        <div className="flex items-center gap-2">
          {isConnected ? <CheckCircle className="h-4 w-4 text-green-600" /> : <AlertCircle className="h-4 w-4 text-yellow-600" />}
          <AlertDescription>
            {isConnected 
              ? 'BOOSTFEEL entegrasyonunuz aktif durumda. Sadakat programı ve kampanyalar otomatik olarak yönetilmektedir.' 
              : 'BOOSTFEEL entegrasyonu için API bilgilerinizi girerek bağlantıyı kurabilirsiniz.'
            }
          </AlertDescription>
        </div>
      </Alert>

      {/* Stats Cards */}
      {isConnected && (
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Toplam Müşteri</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{boostfeelStats.totalCustomers}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aktif Üye</CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{boostfeelStats.activeMembers}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Toplam Puan</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{boostfeelStats.totalPoints}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Kullanılan Puan</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{boostfeelStats.redeemedPoints}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Kampanyalar</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{boostfeelStats.totalCampaigns}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Dönüşüm Oranı</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">% {boostfeelStats.conversionRate}</div>
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
          <TabsTrigger value="loyalty">
            <Heart className="h-4 w-4 mr-2" />
            Sadakat Programı
          </TabsTrigger>
          <TabsTrigger value="campaigns">
            <Target className="h-4 w-4 mr-2" />
            Kampanyalar
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
                BOOSTFEEL panelinden aldığınız API bilgilerini girin
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="clientId">Client ID</Label>
                  <Input
                    id="clientId"
                    value={config.clientId}
                    onChange={(e) => setConfig({...config, clientId: e.target.value})}
                    placeholder="Client ID'nizi girin"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="restaurantId">Restaurant ID</Label>
                  <Input
                    id="restaurantId"
                    value={config.restaurantId}
                    onChange={(e) => setConfig({...config, restaurantId: e.target.value})}
                    placeholder="Restaurant ID'nizi girin"
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
                  placeholder="https://your-domain.com/webhook/boostfeel"
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
                    id="enableAnalytics"
                    checked={config.enableAnalytics}
                    onChange={(e) => setConfig({...config, enableAnalytics: e.target.checked})}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="enableAnalytics">Analitik raporları</Label>
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

        <TabsContent value="loyalty" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sadakat Programı Ayarları</CardTitle>
              <CardDescription>
                Müşteri sadakat programı ve puan sistemi ayarları
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="enableLoyalty"
                  checked={config.enableLoyalty}
                  onChange={(e) => setConfig({...config, enableLoyalty: e.target.checked})}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="enableLoyalty">Sadakat programını etkinleştir</Label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pointsRate">Puan Oranı (₺ başına puan)</Label>
                  <Input
                    id="pointsRate"
                    type="number"
                    value={config.pointsRate}
                    onChange={(e) => setConfig({...config, pointsRate: parseFloat(e.target.value) || 1})}
                    step="0.1"
                    min="0"
                    max="10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="welcomePoints">Hoşgeldin Puanı</Label>
                  <Input
                    id="welcomePoints"
                    type="number"
                    value={config.welcomePoints}
                    onChange={(e) => setConfig({...config, welcomePoints: parseInt(e.target.value) || 100})}
                    min="0"
                    max="1000"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="birthdayPoints">Doğum Günü Puanı</Label>
                <Input
                  id="birthdayPoints"
                  type="number"
                  value={config.birthdayPoints}
                  onChange={(e) => setConfig({...config, birthdayPoints: parseInt(e.target.value) || 200})}
                  min="0"
                  max="1000"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Kampanya Yönetimi</CardTitle>
              <CardDescription>
                Kampanya oluşturma ve yönetim ayarları
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="enableCampaigns"
                  checked={config.enableCampaigns}
                  onChange={(e) => setConfig({...config, enableCampaigns: e.target.checked})}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="enableCampaigns">Kampanyaları etkinleştir</Label>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleCreateCampaign} disabled={isLoading || !isConnected}>
                  <Target className="h-4 w-4 mr-2" />
                  Yeni Kampanya Oluştur
                </Button>
                <Button variant="outline" disabled={isLoading || !isConnected}>
                  <Award className="h-4 w-4 mr-2" />
                  Kampanyaları Görüntüle
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
                Müşteri verilerini ve kampanyaları manuel olarak senkronize edin
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button onClick={handleSync} disabled={isLoading || !isConnected}>
                  {isLoading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                  Tüm Verileri Senkronize Et
                </Button>
                <Button variant="outline" disabled={isLoading || !isConnected}>
                  <Users className="h-4 w-4 mr-2" />
                  Müşterileri Senkronize Et
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

export default BoostfeelIntegration;