import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Package,
  Settings,
  Save,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Clock
} from 'lucide-react';

interface ButiksoftConfig {
  clientId: string;
  apiKey: string;
  apiSecret: string;
  webhookUrl: string;
  autoSync: boolean;
  syncProducts: boolean;
  syncCustomers: boolean;
  syncOrders: boolean;
}

const ButiksoftIntegration: React.FC = () => {
  const [config, setConfig] = useState<ButiksoftConfig>({
    clientId: '',
    apiKey: '',
    apiSecret: '',
    webhookUrl: '',
    autoSync: true,
    syncProducts: true,
    syncCustomers: true,
    syncOrders: true,
  });

  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('butiksoft_config');
    if (saved) {
      setConfig(JSON.parse(saved));
    }
    const check = async () => {
      try {
        const res = await fetch('/api/integrations/butiksoft/status');
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
      localStorage.setItem('butiksoft_config', JSON.stringify(config));
      const res = await fetch('/api/integrations/butiksoft/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      if (res.ok) {
        setIsConnected(true);
        alert('Bağlantı başarılı! Butiksoft entegrasyonu aktif edildi.');
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
      const res = await fetch('/api/integrations/butiksoft/sync', {
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
    if (!confirm('Butiksoft entegrasyonunu devre dışı bırakmak istiyor musunuz?')) return;
    setIsLoading(true);
    try {
      await fetch('/api/integrations/butiksoft/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      setIsConnected(false);
      localStorage.removeItem('butiksoft_config');
      alert('Entegrasyon devre dışı bırakıldı.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Package className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Butiksoft Entegrasyonu</h1>
          <Badge variant={isConnected ? 'default' : 'outline'}>
            {isConnected ? 'Aktif' : 'Pasif'}
          </Badge>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Butiksoft yazılım çözümleri ile ürün, müşteri ve sipariş senkronizasyonu
        </p>
      </div>

      <Alert className={`mb-6 ${isConnected ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'}`}>
        <div className="flex items-center gap-2">
          {isConnected ? <CheckCircle className="h-4 w-4 text-green-600" /> : <AlertCircle className="h-4 w-4 text-yellow-600" />}
          <AlertDescription>
            {isConnected 
              ? 'Butiksoft entegrasyonunuz aktif. Veriler otomatik senkronize ediliyor.' 
              : 'API bilgilerinizi girerek Butiksoft bağlantısını kurabilirsiniz.'}
          </AlertDescription>
        </div>
      </Alert>

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
              <CardDescription>Butiksoft API bilgilerinizi girin</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="clientId">Client ID</Label>
                  <Input id="clientId" value={config.clientId} onChange={(e) => setConfig({ ...config, clientId: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="webhookUrl">Webhook URL</Label>
                  <Input id="webhookUrl" value={config.webhookUrl} onChange={(e) => setConfig({ ...config, webhookUrl: e.target.value })} placeholder="https://your-domain.com/webhook/butiksoft" />
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
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="autoSync" checked={config.autoSync} onChange={(e) => setConfig({ ...config, autoSync: e.target.checked })} className="rounded border-gray-300" />
                  <Label htmlFor="autoSync">Otomatik senkronizasyon</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="syncProducts" checked={config.syncProducts} onChange={(e) => setConfig({ ...config, syncProducts: e.target.checked })} className="rounded border-gray-300" />
                  <Label htmlFor="syncProducts">Ürünleri senkronize et</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="syncCustomers" checked={config.syncCustomers} onChange={(e) => setConfig({ ...config, syncCustomers: e.target.checked })} className="rounded border-gray-300" />
                  <Label htmlFor="syncCustomers">Müşterileri senkronize et</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="syncOrders" checked={config.syncOrders} onChange={(e) => setConfig({ ...config, syncOrders: e.target.checked })} className="rounded border-gray-300" />
                  <Label htmlFor="syncOrders">Siparişleri senkronize et</Label>
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
              <CardDescription>Verileri manuel olarak senkronize edin</CardDescription>
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

export default ButiksoftIntegration;
