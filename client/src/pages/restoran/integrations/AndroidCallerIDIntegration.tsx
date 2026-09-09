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
import { ArrowLeft, Settings, Phone, Smartphone, Wifi, CheckCircle, XCircle, RefreshCw } from 'lucide-react';

interface AndroidCallerIDConfig {
  deviceName: string;
  deviceId: string;
  serverUrl: string;
  serverPort: string;
  connectionType: string;
  autoAnswer: boolean;
  callLogging: boolean;
  callerPopup: boolean;
  soundNotification: boolean;
  vibration: boolean;
  bluetooth: boolean;
  wifi: boolean;
  mobileData: boolean;
  syncContacts: boolean;
  syncCallHistory: boolean;
  integrationType: string;
  apiKey: string;
  timeout: string;
}

export default function AndroidCallerIDIntegration() {
  const [config, setConfig] = useState<AndroidCallerIDConfig>({
    deviceName: '',
    deviceId: '',
    serverUrl: 'localhost',
    serverPort: '8080',
    connectionType: 'wifi',
    autoAnswer: false,
    callLogging: true,
    callerPopup: true,
    soundNotification: true,
    vibration: true,
    bluetooth: false,
    wifi: true,
    mobileData: false,
    syncContacts: true,
    syncCallHistory: true,
    integrationType: 'server',
    apiKey: '',
    timeout: '30'
  });
  
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lastSync, setLastSync] = useState<string>('');

  useEffect(() => {
    const savedConfig = localStorage.getItem('androidcallerid_config');
    const savedStatus = localStorage.getItem('androidcallerid_status');
    const savedLastSync = localStorage.getItem('androidcallerid_last_sync');
    
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
      localStorage.setItem('androidcallerid_config', JSON.stringify(config));
      
      const response = await fetch('/api/integrations/androidcallerid/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      
      if (response.ok) {
        setIsConnected(true);
        localStorage.setItem('androidcallerid_status', 'true');
        alert('Bağlantı başarılı! Android Caller ID entegrasyonu aktif edildi.');
      } else {
        alert('Bağlantı başarısız. Lütfen cihaz ayarlarınızı kontrol edin.');
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
      const response = await fetch('/api/integrations/androidcallerid/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      
      if (response.ok) {
        const now = new Date().toLocaleString('tr-TR');
        setLastSync(now);
        localStorage.setItem('androidcallerid_last_sync', now);
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

  const handleSyncContacts = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/integrations/androidcallerid/sync-contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      
      if (response.ok) {
        alert('Rehber senkronizasyonu başarılı!');
      } else {
        alert('Rehber senkronizasyonu başarısız oldu.');
      }
    } catch (error) {
      console.error('Sync contacts failed', error);
      alert('Rehber senkronizasyonu sırasında hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestCall = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/integrations/androidcallerid/test-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      
      if (response.ok) {
        alert('Arama testi başarılı!');
      } else {
        alert('Arama testi başarısız oldu.');
      }
    } catch (error) {
      console.error('Test call failed', error);
      alert('Arama testi sırasında hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setIsLoading(true);
    try {
      await fetch('/api/integrations/androidcallerid/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      setIsConnected(false);
      localStorage.removeItem('androidcallerid_config');
      localStorage.removeItem('androidcallerid_status');
      localStorage.removeItem('androidcallerid_last_sync');
      
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
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Android Caller ID Entegrasyonu</h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                Android cihazlar için arayan kimlik servisi entegrasyonu
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

        <Tabs defaultValue="device" className="space-y-4">
          <TabsList>
            <TabsTrigger value="device">
              <Smartphone className="w-4 h-4 mr-2" />
              Cihaz Ayarları
            </TabsTrigger>
            <TabsTrigger value="connection">
              <Wifi className="w-4 h-4 mr-2" />
              Bağlantı Ayarları
            </TabsTrigger>
            <TabsTrigger value="features">
              <Phone className="w-4 h-4 mr-2" />
              Arama Özellikleri
            </TabsTrigger>
            <TabsTrigger value="operations">
              <Settings className="w-4 h-4 mr-2" />
              İşlemler
            </TabsTrigger>
          </TabsList>

          <TabsContent value="device">
            <Card>
              <CardHeader>
                <CardTitle>Cihaz Ayarları</CardTitle>
                <CardDescription>
                  Android cihaz bilgilerinizi yapılandırın
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="deviceName">Cihaz Adı</Label>
                    <Input
                      id="deviceName"
                      value={config.deviceName}
                      onChange={(e) => setConfig({ ...config, deviceName: e.target.value })}
                      placeholder="Cihaz adınızı girin"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="deviceId">Cihaz ID</Label>
                    <Input
                      id="deviceId"
                      value={config.deviceId}
                      onChange={(e) => setConfig({ ...config, deviceId: e.target.value })}
                      placeholder="Cihaz ID'nizi girin"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="integrationType">Entegrasyon Türü</Label>
                    <Select
                      value={config.integrationType}
                      onValueChange={(value) => setConfig({ ...config, integrationType: value })}
                    >
                      <SelectTrigger id="integrationType">
                        <SelectValue placeholder="Entegrasyon türü seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="server">Sunucu Tabanlı</SelectItem>
                        <SelectItem value="direct">Doğrudan Bağlantı</SelectItem>
                        <SelectItem value="cloud">Bulut Tabanlı</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="timeout">Bağlantı Zaman Aşımı (saniye)</Label>
                    <Select
                      value={config.timeout}
                      onValueChange={(value) => setConfig({ ...config, timeout: value })}
                    >
                      <SelectTrigger id="timeout">
                        <SelectValue placeholder="Zaman aşımı süresi seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10 saniye</SelectItem>
                        <SelectItem value="20">20 saniye</SelectItem>
                        <SelectItem value="30">30 saniye</SelectItem>
                        <SelectItem value="60">60 saniye</SelectItem>
                        <SelectItem value="120">120 saniye</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Alert>
                  <AlertDescription>
                    Cihaz ID, Android cihazınızın benzersiz tanımlayıcısıdır.
                    Bu bilgiyi cihaz ayarlarından veya makethemenu mobil uygulamasından bulabilirsiniz.
                  </AlertDescription>
                </Alert>

                <Button onClick={handleSaveConfig} disabled={isLoading}>
                  {isLoading ? 'Kaydediliyor...' : 'Cihaz Ayarlarını Kaydet'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="connection">
            <Card>
              <CardHeader>
                <CardTitle>Bağlantı Ayarları</CardTitle>
                <CardDescription>
                  Sunucu bağlantı ayarlarını yapılandırın
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="serverUrl">Sunucu URL</Label>
                    <Input
                      id="serverUrl"
                      value={config.serverUrl}
                      onChange={(e) => setConfig({ ...config, serverUrl: e.target.value })}
                      placeholder="Sunucu URL'nizi girin"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="serverPort">Sunucu Port</Label>
                    <Input
                      id="serverPort"
                      value={config.serverPort}
                      onChange={(e) => setConfig({ ...config, serverPort: e.target.value })}
                      placeholder="Sunucu port'unuzu girin"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="connectionType">Bağlantı Türü</Label>
                    <Select
                      value={config.connectionType}
                      onValueChange={(value) => setConfig({ ...config, connectionType: value })}
                    >
                      <SelectTrigger id="connectionType">
                        <SelectValue placeholder="Bağlantı türü seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="wifi">WiFi</SelectItem>
                        <SelectItem value="mobile">Mobil Veri</SelectItem>
                        <SelectItem value="ethernet">Ethernet</SelectItem>
                        <SelectItem value="bluetooth">Bluetooth</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="apiKey">API Anahtarı</Label>
                    <Input
                      id="apiKey"
                      value={config.apiKey}
                      onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                      placeholder="API anahtarınızı girin"
                      type="password"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Bluetooth</Label>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Bluetooth bağlantısını etkinleştir
                      </p>
                    </div>
                    <Switch
                      checked={config.bluetooth}
                      onCheckedChange={(checked) => setConfig({ ...config, bluetooth: checked })}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>WiFi</Label>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        WiFi bağlantısını etkinleştir
                      </p>
                    </div>
                    <Switch
                      checked={config.wifi}
                      onCheckedChange={(checked) => setConfig({ ...config, wifi: checked })}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Mobil Veri</Label>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Mobil veri bağlantısını etkinleştir
                      </p>
                    </div>
                    <Switch
                      checked={config.mobileData}
                      onCheckedChange={(checked) => setConfig({ ...config, mobileData: checked })}
                    />
                  </div>
                </div>

                <Alert>
                  <AlertDescription>
                    Sunucu bağlantı ayarları, Android cihazınızın makethemenu sistemine bağlanması için gereklidir.
                    Güvenlik için API anahtarı kullanımı önerilir.
                  </AlertDescription>
                </Alert>

                <Button onClick={handleSaveConfig} disabled={isLoading}>
                  Bağlantı Ayarlarını Kaydet
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="features">
            <Card>
              <CardHeader>
                <CardTitle>Arama Özellikleri</CardTitle>
                <CardDescription>
                  Arama ve arayan kimlik özelliklerini yapılandırın
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Otomatik Cevaplama</Label>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Gelen aramaları otomatik cevapla
                      </p>
                    </div>
                    <Switch
                      checked={config.autoAnswer}
                      onCheckedChange={(checked) => setConfig({ ...config, autoAnswer: checked })}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Arama Kaydı</Label>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Tüm aramaları kaydet
                      </p>
                    </div>
                    <Switch
                      checked={config.callLogging}
                      onCheckedChange={(checked) => setConfig({ ...config, callLogging: checked })}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Arayan Popup</Label>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Arayan kimlik bilgilerini popup olarak göster
                      </p>
                    </div>
                    <Switch
                      checked={config.callerPopup}
                      onCheckedChange={(checked) => setConfig({ ...config, callerPopup: checked })}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Sesli Bildirim</Label>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Arama bildirimlerinde ses kullan
                      </p>
                    </div>
                    <Switch
                      checked={config.soundNotification}
                      onCheckedChange={(checked) => setConfig({ ...config, soundNotification: checked })}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Titresim</Label>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Arama bildirimlerinde titresim kullan
                      </p>
                    </div>
                    <Switch
                      checked={config.vibration}
                      onCheckedChange={(checked) => setConfig({ ...config, vibration: checked })}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Rehber Senkronizasyonu</Label>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Rehberi senkronize et
                      </p>
                    </div>
                    <Switch
                      checked={config.syncContacts}
                      onCheckedChange={(checked) => setConfig({ ...config, syncContacts: checked })}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Arama Geçmişi Senkronizasyonu</Label>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Arama geçmişini senkronize et
                      </p>
                    </div>
                    <Switch
                      checked={config.syncCallHistory}
                      onCheckedChange={(checked) => setConfig({ ...config, syncCallHistory: checked })}
                    />
                  </div>
                </div>

                <Alert>
                  <AlertDescription>
                    Arama özellikleri cihazınızın yeteneklerine ve işletim sistemi versiyonuna göre değişiklik gösterebilir.
                    Bazı özellikler Android versiyonunuzda desteklenmeyebilir.
                  </AlertDescription>
                </Alert>

                <Button onClick={handleSaveConfig} disabled={isLoading}>
                  Arama Özelliklerini Kaydet
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="operations">
            <Card>
              <CardHeader>
                <CardTitle>İşlemler</CardTitle>
                <CardDescription>
                  Android Caller ID ile ilgili işlemleri gerçekleştirin
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg dark:bg-slate-800">
                  <div>
                    <p className="font-medium">Bağlantı Durumu</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {isConnected ? 'Android cihaz bağlı' : 'Android cihaz bağlı değil'}
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button onClick={handleSyncContacts} disabled={isLoading || !isConnected}>
                    <Phone className="w-4 h-4 mr-2" />
                    Rehberi Senkronize Et
                  </Button>
                  <Button onClick={handleTestCall} disabled={isLoading || !isConnected}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Arama Testi
                  </Button>
                  <Button onClick={handleSync} disabled={isLoading || !isConnected}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Senkronize Et
                  </Button>
                  {isConnected && (
                    <Button variant="outline" onClick={handleDisconnect} disabled={isLoading}>
                      Bağlantıyı Kes
                    </Button>
                  )}
                </div>

                <Alert>
                  <AlertDescription>
                    Rehber senkronizasyonu için cihazınızda gerekli izinlerin verilmiş olması gerekir.
                    Arama testi, sistem bağlantısını ve arayan kimlik doğrulamasını test eder.
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