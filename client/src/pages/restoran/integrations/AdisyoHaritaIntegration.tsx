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
import { ArrowLeft, Settings, MapPin, Navigation, Globe, CheckCircle, XCircle, RefreshCw } from 'lucide-react';

interface AdisyoHaritaConfig {
  apiKey: string;
  mapProvider: string;
  mapType: string;
  centerLatitude: string;
  centerLongitude: string;
  defaultZoom: string;
  enableGeocoding: boolean;
  enableRouting: boolean;
  enableTraffic: boolean;
  enableSatellite: boolean;
  enableStreetView: boolean;
  showDeliveryZones: boolean;
  showBranchLocations: boolean;
  showCustomerLocations: boolean;
  autoLocate: boolean;
  routeOptimization: boolean;
  distanceUnit: string;
  language: string;
  theme: string;
}

export default function AdisyoHaritaIntegration() {
  const [config, setConfig] = useState<AdisyoHaritaConfig>({
    apiKey: '',
    mapProvider: 'google',
    mapType: 'roadmap',
    centerLatitude: '41.0082',
    centerLongitude: '28.9784',
    defaultZoom: '12',
    enableGeocoding: true,
    enableRouting: true,
    enableTraffic: true,
    enableSatellite: true,
    enableStreetView: true,
    showDeliveryZones: true,
    showBranchLocations: true,
    showCustomerLocations: true,
    autoLocate: true,
    routeOptimization: true,
    distanceUnit: 'km',
    language: 'tr',
    theme: 'light'
  });
  
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lastSync, setLastSync] = useState<string>('');

  useEffect(() => {
    const savedConfig = localStorage.getItem('adisyoharita_config');
    const savedStatus = localStorage.getItem('adisyoharita_status');
    const savedLastSync = localStorage.getItem('adisyoharita_last_sync');
    
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
      localStorage.setItem('adisyoharita_config', JSON.stringify(config));
      
      const response = await fetch('/api/integrations/adisyoharita/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      
      if (response.ok) {
        setIsConnected(true);
        localStorage.setItem('adisyoharita_status', 'true');
        alert('Bağlantı başarılı! Adisyo Harita entegrasyonu aktif edildi.');
      } else {
        alert('Bağlantı başarısız. Lütfen API anahtarınızı kontrol edin.');
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
      const response = await fetch('/api/integrations/adisyoharita/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      
      if (response.ok) {
        const now = new Date().toLocaleString('tr-TR');
        setLastSync(now);
        localStorage.setItem('adisyoharita_last_sync', now);
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

  const handleLocateBranches = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/integrations/adisyoharita/locate-branches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      
      if (response.ok) {
        alert('Şube lokasyonları başarıyla güncellendi!');
      } else {
        alert('Şube lokasyonları güncellenemedi.');
      }
    } catch (error) {
      console.error('Locate branches failed', error);
      alert('Şube lokasyonları güncellenirken hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOptimizeRoutes = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/integrations/adisyoharita/optimize-routes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      
      if (response.ok) {
        alert('Rota optimizasyonu başarıyla tamamlandı!');
      } else {
        alert('Rota optimizasyonu başarısız oldu.');
      }
    } catch (error) {
      console.error('Optimize routes failed', error);
      alert('Rota optimizasyonu sırasında hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setIsLoading(true);
    try {
      await fetch('/api/integrations/adisyoharita/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      setIsConnected(false);
      localStorage.removeItem('adisyoharita_config');
      localStorage.removeItem('adisyoharita_status');
      localStorage.removeItem('adisyoharita_last_sync');
      
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
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Adisyo Harita Entegrasyonu</h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                Harita ve lokasyon servisleri için entegrasyon ayarları
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

        <Tabs defaultValue="api" className="space-y-4">
          <TabsList>
            <TabsTrigger value="api">
              <Settings className="w-4 h-4 mr-2" />
              API Ayarları
            </TabsTrigger>
            <TabsTrigger value="map">
              <MapPin className="w-4 h-4 mr-2" />
              Harita Ayarları
            </TabsTrigger>
            <TabsTrigger value="features">
              <Navigation className="w-4 h-4 mr-2" />
              Özellikler
            </TabsTrigger>
            <TabsTrigger value="operations">
              <Globe className="w-4 h-4 mr-2" />
              İşlemler
            </TabsTrigger>
          </TabsList>

          <TabsContent value="api">
            <Card>
              <CardHeader>
                <CardTitle>API Ayarları</CardTitle>
                <CardDescription>
                  Harita servisi API anahtarınızı yapılandırın
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="apiKey">API Anahtarı</Label>
                    <Input
                      id="apiKey"
                      value={config.apiKey}
                      onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                      placeholder="Harita servisi API anahtarınızı girin"
                      type="password"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="mapProvider">Harita Sağlayıcısı</Label>
                    <Select
                      value={config.mapProvider}
                      onValueChange={(value) => setConfig({ ...config, mapProvider: value })}
                    >
                      <SelectTrigger id="mapProvider">
                        <SelectValue placeholder="Harita sağlayıcısı seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="google">Google Maps</SelectItem>
                        <SelectItem value="yandex">Yandex Maps</SelectItem>
                        <SelectItem value="openstreetmap">OpenStreetMap</SelectItem>
                        <SelectItem value="mapbox">Mapbox</SelectItem>
                        <SelectItem value="here">HERE Maps</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="language">Dil</Label>
                    <Select
                      value={config.language}
                      onValueChange={(value) => setConfig({ ...config, language: value })}
                    >
                      <SelectTrigger id="language">
                        <SelectValue placeholder="Dil seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tr">Türkçe</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="de">Deutsch</SelectItem>
                        <SelectItem value="fr">Français</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="theme">Tema</Label>
                    <Select
                      value={config.theme}
                      onValueChange={(value) => setConfig({ ...config, theme: value })}
                    >
                      <SelectTrigger id="theme">
                        <SelectValue placeholder="Tema seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Açık</SelectItem>
                        <SelectItem value="dark">Koyu</SelectItem>
                        <SelectItem value="auto">Otomatik</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Alert>
                  <AlertDescription>
                    API anahtarınız harita servis sağlayıcınızdan alınmalıdır.
                    Anahtarınızı güvenli bir şekilde saklayın ve başkalarıyla paylaşmayın.
                  </AlertDescription>
                </Alert>

                <Button onClick={handleSaveConfig} disabled={isLoading}>
                  {isLoading ? 'Kaydediliyor...' : 'API Ayarlarını Kaydet'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="map">
            <Card>
              <CardHeader>
                <CardTitle>Harita Ayarları</CardTitle>
                <CardDescription>
                  Harita görünümü ve konum ayarlarını yapılandırın
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="mapType">Harita Türü</Label>
                    <Select
                      value={config.mapType}
                      onValueChange={(value) => setConfig({ ...config, mapType: value })}
                    >
                      <SelectTrigger id="mapType">
                        <SelectValue placeholder="Harita türü seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="roadmap">Yol Haritası</SelectItem>
                        <SelectItem value="satellite">Uydu</SelectItem>
                        <SelectItem value="terrain">Arazi</SelectItem>
                        <SelectItem value="hybrid">Hibrit</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="defaultZoom">Varsayılan Yakınlaştırma</Label>
                    <Select
                      value={config.defaultZoom}
                      onValueChange={(value) => setConfig({ ...config, defaultZoom: value })}
                    >
                      <SelectTrigger id="defaultZoom">
                        <SelectValue placeholder="Yakınlaştırma seviyesi seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="8">8 - Şehir</SelectItem>
                        <SelectItem value="10">10 - İlçe</SelectItem>
                        <SelectItem value="12">12 - Mahalle</SelectItem>
                        <SelectItem value="14">14 - Sokak</SelectItem>
                        <SelectItem value="16">16 - Bina</SelectItem>
                        <SelectItem value="18">18 - Detay</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="centerLatitude">Merkez Enlem</Label>
                    <Input
                      id="centerLatitude"
                      value={config.centerLatitude}
                      onChange={(e) => setConfig({ ...config, centerLatitude: e.target.value })}
                      placeholder="Örn: 41.0082"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="centerLongitude">Merkez Boylam</Label>
                    <Input
                      id="centerLongitude"
                      value={config.centerLongitude}
                      onChange={(e) => setConfig({ ...config, centerLongitude: e.target.value })}
                      placeholder="Örn: 28.9784"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="distanceUnit">Mesafe Birimi</Label>
                    <Select
                      value={config.distanceUnit}
                      onValueChange={(value) => setConfig({ ...config, distanceUnit: value })}
                    >
                      <SelectTrigger id="distanceUnit">
                        <SelectValue placeholder="Mesafe birimi seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="km">Kilometre (km)</SelectItem>
                        <SelectItem value="mile">Mil (mile)</SelectItem>
                        <SelectItem value="meter">Metre (m)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Alert>
                  <AlertDescription>
                    Merkez koordinatları varsayılan harita görünümü için kullanılır.
                    İstanbul için enlem: 41.0082, boylam: 28.9784 değerlerini kullanabilirsiniz.
                  </AlertDescription>
                </Alert>

                <Button onClick={handleSaveConfig} disabled={isLoading}>
                  Harita Ayarlarını Kaydet
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="features">
            <Card>
              <CardHeader>
                <CardTitle>Özellik Ayarları</CardTitle>
                <CardDescription>
                  Harita özelliklerini etkinleştirin veya devre dışı bırakın
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Coğrafi Kodlama</Label>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Adresleri koordinatlara dönüştür
                      </p>
                    </div>
                    <Switch
                      checked={config.enableGeocoding}
                      onCheckedChange={(checked) => setConfig({ ...config, enableGeocoding: checked })}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Rota Planlama</Label>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Rota oluşturma ve yönlendirme
                      </p>
                    </div>
                    <Switch
                      checked={config.enableRouting}
                      onCheckedChange={(checked) => setConfig({ ...config, enableRouting: checked })}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Trafik Bilgisi</Label>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Canlı trafik verilerini göster
                      </p>
                    </div>
                    <Switch
                      checked={config.enableTraffic}
                      onCheckedChange={(checked) => setConfig({ ...config, enableTraffic: checked })}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Uydu Görünümü</Label>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Uydu harita görünümünü etkinleştir
                      </p>
                    </div>
                    <Switch
                      checked={config.enableSatellite}
                      onCheckedChange={(checked) => setConfig({ ...config, enableSatellite: checked })}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Sokak Görünümü</Label>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Sokak görünümünü etkinleştir
                      </p>
                    </div>
                    <Switch
                      checked={config.enableStreetView}
                      onCheckedChange={(checked) => setConfig({ ...config, enableStreetView: checked })}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Teslimat Bölgeleri</Label>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Teslimat bölgelerini haritada göster
                      </p>
                    </div>
                    <Switch
                      checked={config.showDeliveryZones}
                      onCheckedChange={(checked) => setConfig({ ...config, showDeliveryZones: checked })}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Şube Lokasyonları</Label>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Şube konumlarını haritada göster
                      </p>
                    </div>
                    <Switch
                      checked={config.showBranchLocations}
                      onCheckedChange={(checked) => setConfig({ ...config, showBranchLocations: checked })}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Müşteri Lokasyonları</Label>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Müşteri konumlarını haritada göster
                      </p>
                    </div>
                    <Switch
                      checked={config.showCustomerLocations}
                      onCheckedChange={(checked) => setConfig({ ...config, showCustomerLocations: checked })}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Otomatik Konum Belirleme</Label>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Kullanıcının konumunu otomatik olarak belirle
                      </p>
                    </div>
                    <Switch
                      checked={config.autoLocate}
                      onCheckedChange={(checked) => setConfig({ ...config, autoLocate: checked })}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Rota Optimizasyonu</Label>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        En kısa ve hızlı rotaları hesapla
                      </p>
                    </div>
                    <Switch
                      checked={config.routeOptimization}
                      onCheckedChange={(checked) => setConfig({ ...config, routeOptimization: checked })}
                    />
                  </div>
                </div>

                <Alert>
                  <AlertDescription>
                    Bazı özellikler (sokak görünümü, trafik bilgisi) seçtiğiniz harita sağlayıcısına göre değişiklik gösterebilir.
                    Tüm özellikler her sağlayıcıda desteklenmeyebilir.
                  </AlertDescription>
                </Alert>

                <Button onClick={handleSaveConfig} disabled={isLoading}>
                  Özellik Ayarlarını Kaydet
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="operations">
            <Card>
              <CardHeader>
                <CardTitle>İşlemler</CardTitle>
                <CardDescription>
                  Harita servisi ile ilgili işlemleri gerçekleştirin
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg dark:bg-slate-800">
                  <div>
                    <p className="font-medium">Bağlantı Durumu</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {isConnected ? 'Harita servisine bağlı' : 'Harita servisine bağlı değil'}
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
                  <Button onClick={handleLocateBranches} disabled={isLoading || !isConnected}>
                    <MapPin className="w-4 h-4 mr-2" />
                    Şube Lokasyonlarını Güncelle
                  </Button>
                  <Button onClick={handleOptimizeRoutes} disabled={isLoading || !isConnected}>
                    <Navigation className="w-4 h-4 mr-2" />
                    Rota Optimizasyonu
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
                    Şube lokasyonlarını güncellemek için tüm şubelerinizin adres bilgileri eksiksiz olmalıdır.
                    Rota optimizasyonu teslimat bölgeleriniz ve müşteri lokasyonlarınız dikkate alınarak yapılır.
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