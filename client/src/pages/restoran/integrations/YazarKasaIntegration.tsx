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
import { ArrowLeft, Settings, Printer, CreditCard, RefreshCw, CheckCircle, XCircle } from 'lucide-react';

interface YazarKasaConfig {
  deviceModel: string;
  connectionType: string;
  comPort: string;
  baudRate: string;
  printerWidth: string;
  taxNumber: string;
  branchCode: string;
  terminalId: string;
  autoPrint: boolean;
  printLogo: boolean;
  printBarcode: boolean;
  printQrCode: boolean;
  fiscalMode: boolean;
  dailyReport: boolean;
  zReport: boolean;
  serverUrl: string;
  serverPort: string;
}

export default function YazarKasaIntegration() {
  const [config, setConfig] = useState<YazarKasaConfig>({
    deviceModel: 'genius',
    connectionType: 'serial',
    comPort: 'COM1',
    baudRate: '9600',
    printerWidth: '80',
    taxNumber: '',
    branchCode: '001',
    terminalId: '001',
    autoPrint: true,
    printLogo: true,
    printBarcode: false,
    printQrCode: false,
    fiscalMode: true,
    dailyReport: true,
    zReport: true,
    serverUrl: 'localhost',
    serverPort: '8080'
  });
  
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lastSync, setLastSync] = useState<string>('');

  useEffect(() => {
    const savedConfig = localStorage.getItem('yazarkasa_config');
    const savedStatus = localStorage.getItem('yazarkasa_status');
    const savedLastSync = localStorage.getItem('yazarkasa_last_sync');
    
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
      localStorage.setItem('yazarkasa_config', JSON.stringify(config));
      
      const response = await fetch('/api/integrations/yazarkasa/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      
      if (response.ok) {
        setIsConnected(true);
        localStorage.setItem('yazarkasa_status', 'true');
        alert('Bağlantı başarılı! Yazar kasa entegrasyonu aktif edildi.');
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
      const response = await fetch('/api/integrations/yazarkasa/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      
      if (response.ok) {
        const now = new Date().toLocaleString('tr-TR');
        setLastSync(now);
        localStorage.setItem('yazarkasa_last_sync', now);
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

  const handleDailyReport = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/integrations/yazarkasa/daily-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      
      if (response.ok) {
        alert('Günlük rapor başarıyla oluşturuldu!');
      } else {
        alert('Günlük rapor oluşturulamadı.');
      }
    } catch (error) {
      console.error('Daily report failed', error);
      alert('Günlük rapor sırasında hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleZReport = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/integrations/yazarkasa/z-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      
      if (response.ok) {
        alert('Z raporu başarıyla oluşturuldu!');
      } else {
        alert('Z raporu oluşturulamadı.');
      }
    } catch (error) {
      console.error('Z report failed', error);
      alert('Z raporu sırasında hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setIsLoading(true);
    try {
      await fetch('/api/integrations/yazarkasa/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      setIsConnected(false);
      localStorage.removeItem('yazarkasa_config');
      localStorage.removeItem('yazarkasa_status');
      localStorage.removeItem('yazarkasa_last_sync');
      
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
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Yazar Kasa Entegrasyonu</h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                Yazar kasa cihazları için entegrasyon ayarları
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
              <Printer className="w-4 h-4 mr-2" />
              Cihaz Ayarları
            </TabsTrigger>
            <TabsTrigger value="fiscal">
              <CreditCard className="w-4 h-4 mr-2" />
              Mali Ayarlar
            </TabsTrigger>
            <TabsTrigger value="features">
              <Settings className="w-4 h-4 mr-2" />
              Özellikler
            </TabsTrigger>
            <TabsTrigger value="reports">
              <RefreshCw className="w-4 h-4 mr-2" />
              Raporlar
            </TabsTrigger>
          </TabsList>

          <TabsContent value="device">
            <Card>
              <CardHeader>
                <CardTitle>Cihaz Ayarları</CardTitle>
                <CardDescription>
                  Yazar kasa cihazı bağlantı ayarlarını yapın
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="deviceModel">Cihaz Modeli</Label>
                    <Select
                      value={config.deviceModel}
                      onValueChange={(value) => setConfig({ ...config, deviceModel: value })}
                    >
                      <SelectTrigger id="deviceModel">
                        <SelectValue placeholder="Cihaz modeli seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="genius">Genius</SelectItem>
                        <SelectItem value="sam4s">Sam4s</SelectItem>
                        <SelectItem value="casio">Casio</SelectItem>
                        <SelectItem value="olivetti">Olivetti</SelectItem>
                        <SelectItem value="sharp">Sharp</SelectItem>
                        <SelectItem value="other">Diğer</SelectItem>
                      </SelectContent>
                    </Select>
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
                        <SelectItem value="serial">Seri Port (Serial)</SelectItem>
                        <SelectItem value="usb">USB</SelectItem>
                        <SelectItem value="ethernet">Ethernet</SelectItem>
                        <SelectItem value="wifi">WiFi</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {config.connectionType === 'serial' && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="comPort">COM Port</Label>
                        <Select
                          value={config.comPort}
                          onValueChange={(value) => setConfig({ ...config, comPort: value })}
                        >
                          <SelectTrigger id="comPort">
                            <SelectValue placeholder="COM port seçin" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="COM1">COM1</SelectItem>
                            <SelectItem value="COM2">COM2</SelectItem>
                            <SelectItem value="COM3">COM3</SelectItem>
                            <SelectItem value="COM4">COM4</SelectItem>
                            <SelectItem value="COM5">COM5</SelectItem>
                            <SelectItem value="COM6">COM6</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="baudRate">Baud Rate</Label>
                        <Select
                          value={config.baudRate}
                          onValueChange={(value) => setConfig({ ...config, baudRate: value })}
                        >
                          <SelectTrigger id="baudRate">
                            <SelectValue placeholder="Baud rate seçin" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="9600">9600</SelectItem>
                            <SelectItem value="19200">19200</SelectItem>
                            <SelectItem value="38400">38400</SelectItem>
                            <SelectItem value="57600">57600</SelectItem>
                            <SelectItem value="115200">115200</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}
                  
                  <div className="space-y-2">
                    <Label htmlFor="printerWidth">Yazıcı Genişliği</Label>
                    <Select
                      value={config.printerWidth}
                      onValueChange={(value) => setConfig({ ...config, printerWidth: value })}
                    >
                      <SelectTrigger id="printerWidth">
                        <SelectValue placeholder="Yazıcı genişliği seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="57">57mm</SelectItem>
                        <SelectItem value="80">80mm</SelectItem>
                        <SelectItem value="110">110mm</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Alert>
                  <AlertDescription>
                    Cihaz modeli ve bağlantı ayarları cihazınızın teknik dokümantasyonunda belirtilen değerlerle eşleşmelidir.
                    Yanlış ayarlar cihaz bağlantısının başarısız olmasına neden olabilir.
                  </AlertDescription>
                </Alert>

                <Button onClick={handleSaveConfig} disabled={isLoading}>
                  {isLoading ? 'Kaydediliyor...' : 'Cihaz Ayarlarını Kaydet'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="fiscal">
            <Card>
              <CardHeader>
                <CardTitle>Mali Ayarlar</CardTitle>
                <CardDescription>
                  Mali ve vergi ayarlarını yapılandırın
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="taxNumber">Vergi Numarası</Label>
                    <Input
                      id="taxNumber"
                      value={config.taxNumber}
                      onChange={(e) => setConfig({ ...config, taxNumber: e.target.value })}
                      placeholder="Vergi numaranızı girin"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="branchCode">Şube Kodu</Label>
                    <Input
                      id="branchCode"
                      value={config.branchCode}
                      onChange={(e) => setConfig({ ...config, branchCode: e.target.value })}
                      placeholder="Şube kodu"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="terminalId">Terminal ID</Label>
                    <Input
                      id="terminalId"
                      value={config.terminalId}
                      onChange={(e) => setConfig({ ...config, terminalId: e.target.value })}
                      placeholder="Terminal ID"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Maliye Modu</Label>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Mali yazarkasa modunu etkinleştir
                      </p>
                    </div>
                    <Switch
                      checked={config.fiscalMode}
                      onCheckedChange={(checked) => setConfig({ ...config, fiscalMode: checked })}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Günlük Rapor</Label>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Günlük mali raporları otomatik oluştur
                      </p>
                    </div>
                    <Switch
                      checked={config.dailyReport}
                      onCheckedChange={(checked) => setConfig({ ...config, dailyReport: checked })}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Z Raporu</Label>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Z raporlarını otomatik oluştur
                      </p>
                    </div>
                    <Switch
                      checked={config.zReport}
                      onCheckedChange={(checked) => setConfig({ ...config, zReport: checked })}
                    />
                  </div>
                </div>

                <Alert>
                  <AlertDescription>
                    Mali ayarlar yazar kasanızın mali modülü ile doğrudan ilişkilidir.
                    Bu ayarları değiştirirken dikkatli olun ve gerekirse mali müşavirinize danışın.
                  </AlertDescription>
                </Alert>

                <Button onClick={handleSaveConfig} disabled={isLoading}>
                  Mali Ayarları Kaydet
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="features">
            <Card>
              <CardHeader>
                <CardTitle>Özellik Ayarları</CardTitle>
                <CardDescription>
                  Yazar kasa yazdırma özelliklerini yapılandırın
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Otomatik Yazdırma</Label>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Siparişleri otomatik olarak yazdır
                      </p>
                    </div>
                    <Switch
                      checked={config.autoPrint}
                      onCheckedChange={(checked) => setConfig({ ...config, autoPrint: checked })}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Logo Yazdırma</Label>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Fişlerde logo yazdır
                      </p>
                    </div>
                    <Switch
                      checked={config.printLogo}
                      onCheckedChange={(checked) => setConfig({ ...config, printLogo: checked })}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Barkod Yazdırma</Label>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Fişlerde barkod yazdır
                      </p>
                    </div>
                    <Switch
                      checked={config.printBarcode}
                      onCheckedChange={(checked) => setConfig({ ...config, printBarcode: checked })}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>QR Kod Yazdırma</Label>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Fişlerde QR kod yazdır
                      </p>
                    </div>
                    <Switch
                      checked={config.printQrCode}
                      onCheckedChange={(checked) => setConfig({ ...config, printQrCode: checked })}
                    />
                  </div>
                </div>

                <Alert>
                  <AlertDescription>
                    Özellikler cihazınızın yeteneklerine göre değişiklik gösterebilir.
                    Tüm özellikler her cihazda desteklenmeyebilir.
                  </AlertDescription>
                </Alert>

                <Button onClick={handleSaveConfig} disabled={isLoading}>
                  Özellik Ayarlarını Kaydet
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports">
            <Card>
              <CardHeader>
                <CardTitle>Raporlar</CardTitle>
                <CardDescription>
                  Mali raporları oluşturun ve senkronize edin
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg dark:bg-slate-800">
                  <div>
                    <p className="font-medium">Bağlantı Durumu</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {isConnected ? 'Yazar kasa bağlı' : 'Yazar kasa bağlı değil'}
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
                  <Button onClick={handleDailyReport} disabled={isLoading || !isConnected}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Günlük Rapor Oluştur
                  </Button>
                  <Button onClick={handleZReport} disabled={isLoading || !isConnected}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Z Raporu Oluştur
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
                    Raporlar yazar kasanızın mali hafızasından alınır. Günlük rapor gün sonu işlemi için kullanılır,
                    Z raporu ise periyodik mali raporlama için kullanılır.
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