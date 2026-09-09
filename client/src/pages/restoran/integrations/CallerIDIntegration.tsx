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
import { ArrowLeft, Settings, Phone, Wifi, RefreshCw, CheckCircle, XCircle } from 'lucide-react';

interface CallerIDConfig {
  deviceType: string;
  comPort: string;
  baudRate: string;
  dataBits: string;
  parity: string;
  stopBits: string;
  flowControl: string;
  autoAnswer: boolean;
  callLogging: boolean;
  callerPopup: boolean;
  soundNotification: boolean;
  integrationType: string;
  serverUrl: string;
  serverPort: string;
  deviceIp: string;
  devicePort: string;
}

export default function CallerIDIntegration() {
  const [config, setConfig] = useState<CallerIDConfig>({
    deviceType: 'serial',
    comPort: 'COM1',
    baudRate: '9600',
    dataBits: '8',
    parity: 'none',
    stopBits: '1',
    flowControl: 'none',
    autoAnswer: false,
    callLogging: true,
    callerPopup: true,
    soundNotification: true,
    integrationType: 'local',
    serverUrl: 'localhost',
    serverPort: '8080',
    deviceIp: '192.168.1.100',
    devicePort: '23'
  });
  
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lastTest, setLastTest] = useState<string>('');

  useEffect(() => {
    const savedConfig = localStorage.getItem('callerid_config');
    const savedStatus = localStorage.getItem('callerid_status');
    const savedLastTest = localStorage.getItem('callerid_last_test');
    
    if (savedConfig) {
      setConfig(JSON.parse(savedConfig));
    }
    if (savedStatus) {
      setIsConnected(JSON.parse(savedStatus));
    }
    if (savedLastTest) {
      setLastTest(savedLastTest);
    }
  }, []);

  const handleSaveConfig = async () => {
    setIsLoading(true);
    try {
      localStorage.setItem('callerid_config', JSON.stringify(config));
      
      const response = await fetch('/api/integrations/callerid/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      
      if (response.ok) {
        setIsConnected(true);
        localStorage.setItem('callerid_status', 'true');
        const now = new Date().toLocaleString('tr-TR');
        setLastTest(now);
        localStorage.setItem('callerid_last_test', now);
        alert('Bağlantı başarılı! Caller ID cihazı entegrasyonu aktif edildi.');
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

  const handleTestConnection = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/integrations/callerid/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      
      if (response.ok) {
        const now = new Date().toLocaleString('tr-TR');
        setLastTest(now);
        localStorage.setItem('callerid_last_test', now);
        alert('Cihaz bağlantı testi başarılı!');
      } else {
        alert('Cihaz bağlantı testi başarısız oldu.');
      }
    } catch (error) {
      console.error('Test connection failed', error);
      alert('Bağlantı testi sırasında hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setIsLoading(true);
    try {
      await fetch('/api/integrations/callerid/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      setIsConnected(false);
      localStorage.removeItem('callerid_config');
      localStorage.removeItem('callerid_status');
      localStorage.removeItem('callerid_last_test');
      
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
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Caller ID Cihazı Entegrasyonu</h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                Telefon sistemleri için Caller ID cihazı entegrasyonu
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={isConnected ? "default" : "secondary"}>
                {isConnected ? <CheckCircle className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                {isConnected ? 'Bağlı' : 'Bağlı Değil'}
              </Badge>
              {lastTest && (
                <Badge variant="outline">
                  Son Test: {lastTest}
                </Badge>
              )}
            </div>
          </div>
        </div>

        <Tabs defaultValue="device" className="space-y-4">
          <TabsList>
            <TabsTrigger value="device">
              <Phone className="w-4 h-4 mr-2" />
              Cihaz Ayarları
            </TabsTrigger>
            <TabsTrigger value="network">
              <Wifi className="w-4 h-4 mr-2" />
              Ağ Ayarları
            </TabsTrigger>
            <TabsTrigger value="features">
              <Settings className="w-4 h-4 mr-2" />
              Özellikler
            </TabsTrigger>
            <TabsTrigger value="test">
              <RefreshCw className="w-4 h-4 mr-2" />
              Test & Bağlantı
            </TabsTrigger>
          </TabsList>

          <TabsContent value="device">
            <Card>
              <CardHeader>
                <CardTitle>Cihaz Ayarları</CardTitle>
                <CardDescription>
                  Caller ID cihazı bağlantı ayarlarını yapın
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="deviceType">Cihaz Türü</Label>
                    <Select
                      value={config.deviceType}
                      onValueChange={(value) => setConfig({ ...config, deviceType: value })}
                    >
                      <SelectTrigger id="deviceType">
                        <SelectValue placeholder="Cihaz türü seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="serial">Seri Port (Serial)</SelectItem>
                        <SelectItem value="usb">USB</SelectItem>
                        <SelectItem value="network">Ağ (TCP/IP)</SelectItem>
                        <SelectItem value="bluetooth">Bluetooth</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {config.deviceType === 'serial' && (
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
                      
                      <div className="space-y-2">
                        <Label htmlFor="dataBits">Data Bits</Label>
                        <Select
                          value={config.dataBits}
                          onValueChange={(value) => setConfig({ ...config, dataBits: value })}
                        >
                          <SelectTrigger id="dataBits">
                            <SelectValue placeholder="Data bits seçin" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="7">7</SelectItem>
                            <SelectItem value="8">8</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="parity">Parity</Label>
                        <Select
                          value={config.parity}
                          onValueChange={(value) => setConfig({ ...config, parity: value })}
                        >
                          <SelectTrigger id="parity">
                            <SelectValue placeholder="Parity seçin" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            <SelectItem value="even">Even</SelectItem>
                            <SelectItem value="odd">Odd</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="stopBits">Stop Bits</Label>
                        <Select
                          value={config.stopBits}
                          onValueChange={(value) => setConfig({ ...config, stopBits: value })}
                        >
                          <SelectTrigger id="stopBits">
                            <SelectValue placeholder="Stop bits seçin" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1</SelectItem>
                            <SelectItem value="2">2</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="flowControl">Flow Control</Label>
                        <Select
                          value={config.flowControl}
                          onValueChange={(value) => setConfig({ ...config, flowControl: value })}
                        >
                          <SelectTrigger id="flowControl">
                            <SelectValue placeholder="Flow control seçin" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            <SelectItem value="hardware">Hardware (RTS/CTS)</SelectItem>
                            <SelectItem value="software">Software (XON/XOFF)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}
                </div>

                <Alert>
                  <AlertDescription>
                    Seri port ayarları cihazınızın teknik dokümantasyonunda belirtilen değerlerle eşleşmelidir.
                    Yanlış ayarlar cihaz bağlantısının başarısız olmasına neden olabilir.
                  </AlertDescription>
                </Alert>

                <Button onClick={handleSaveConfig} disabled={isLoading}>
                  {isLoading ? 'Kaydediliyor...' : 'Ayarları Kaydet'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="network">
            <Card>
              <CardHeader>
                <CardTitle>Ağ Ayarları</CardTitle>
                <CardDescription>
                  Ağ tabanlı Caller ID cihazları için bağlantı ayarları
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        <SelectItem value="local">Yerel Bağlantı</SelectItem>
                        <SelectItem value="remote">Uzaktan Bağlantı</SelectItem>
                        <SelectItem value="cloud">Bulut Servisi</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="serverUrl">Sunucu URL</Label>
                    <Input
                      id="serverUrl"
                      value={config.serverUrl}
                      onChange={(e) => setConfig({ ...config, serverUrl: e.target.value })}
                      placeholder="Sunucu URL'si"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="serverPort">Sunucu Port</Label>
                    <Input
                      id="serverPort"
                      type="number"
                      value={config.serverPort}
                      onChange={(e) => setConfig({ ...config, serverPort: e.target.value })}
                      placeholder="Sunucu port numarası"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="deviceIp">Cihaz IP Adresi</Label>
                    <Input
                      id="deviceIp"
                      value={config.deviceIp}
                      onChange={(e) => setConfig({ ...config, deviceIp: e.target.value })}
                      placeholder="Cihaz IP adresi"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="devicePort">Cihaz Port</Label>
                    <Input
                      id="devicePort"
                      type="number"
                      value={config.devicePort}
                      onChange={(e) => setConfig({ ...config, devicePort: e.target.value })}
                      placeholder="Cihaz port numarası"
                    />
                  </div>
                </div>

                <Alert>
                  <AlertDescription>
                    Ağ tabanlı cihazlar için IP adresi ve port bilgileri cihazınızın ağ ayarlarından alınmalıdır.
                    Güvenlik duvarı ayarlarınızın cihaza izin verdiğinden emin olun.
                  </AlertDescription>
                </Alert>

                <Button onClick={handleSaveConfig} disabled={isLoading}>
                  {isLoading ? 'Kaydediliyor...' : 'Ağ Ayarlarını Kaydet'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="features">
            <Card>
              <CardHeader>
                <CardTitle>Özellik Ayarları</CardTitle>
                <CardDescription>
                  Caller ID özelliklerini yapılandırın
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Otomatik Cevaplama</Label>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Gelen aramaları otomatik olarak cevapla
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
                        Tüm aramaları kaydet ve raporla
                      </p>
                    </div>
                    <Switch
                      checked={config.callLogging}
                      onCheckedChange={(checked) => setConfig({ ...config, callLogging: checked })}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Arayan Bilgi Penceresi</Label>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Gelen aramalarda bilgi penceresi göster
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
                        Gelen aramalarda sesli bildirim ver
                      </p>
                    </div>
                    <Switch
                      checked={config.soundNotification}
                      onCheckedChange={(checked) => setConfig({ ...config, soundNotification: checked })}
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

          <TabsContent value="test">
            <Card>
              <CardHeader>
                <CardTitle>Test & Bağlantı</CardTitle>
                <CardDescription>
                  Cihaz bağlantısını test edin ve bağlantı durumunu kontrol edin
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg dark:bg-slate-800">
                  <div>
                    <p className="font-medium">Bağlantı Durumu</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {isConnected ? 'Caller ID cihazı bağlı' : 'Caller ID cihazı bağlı değil'}
                    </p>
                  </div>
                  <Badge variant={isConnected ? "default" : "secondary"}>
                    {isConnected ? <CheckCircle className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                    {isConnected ? 'Bağlı' : 'Bağlı Değil'}
                  </Badge>
                </div>

                {lastTest && (
                  <div className="p-4 bg-slate-50 rounded-lg dark:bg-slate-800">
                    <p className="font-medium">Son Bağlantı Testi</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{lastTest}</p>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button onClick={handleTestConnection} disabled={isLoading}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Bağlantıyı Test Et
                  </Button>
                  {isConnected && (
                    <Button variant="outline" onClick={handleDisconnect} disabled={isLoading}>
                      Bağlantıyı Kes
                    </Button>
                  )}
                </div>

                <Alert>
                  <AlertDescription>
                    Bağlantı testi cihazınızla iletişimi kontrol eder. Test başarısız olursa 
                    cihaz ayarlarınızı ve bağlantılarınızı kontrol edin.
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