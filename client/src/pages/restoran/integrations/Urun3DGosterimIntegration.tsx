import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Upload,
  Box,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Download,
  Info,
  CheckCircle,
  Loader2,
  ImageIcon,
} from 'lucide-react';

// model-viewer JSX tipleri PublicMenu.tsx'teki ortak bildirimden geliyor.

// @google/model-viewer: gerçek GLB render'ı için CDN'den tembel yüklenir.
const MODEL_VIEWER_CDN = '/vendor/model-viewer.min.js';
let modelViewerPromise: Promise<void> | null = null;

function loadModelViewer(): Promise<void> {
  if (typeof window !== 'undefined' && customElements.get('model-viewer')) return Promise.resolve();
  modelViewerPromise ??= new Promise<void>((resolve, reject) => {
    const s = document.createElement('script');
    s.type = 'module';
    s.src = MODEL_VIEWER_CDN;
    s.onload = () => resolve();
    s.onerror = () => {
      modelViewerPromise = null;
      reject(new Error('model-viewer yüklenemedi'));
    };
    document.head.appendChild(s);
  });
  return modelViewerPromise;
}

// Gerçek 3D ürün modelleri (Poly by Google, CC-BY)
const sampleModels = [
  { name: 'Pizza', url: '/models/pizza-meshy.glb', thumbnail: '🍕' },
  { name: 'Hamburger', url: '/models/burger.glb', thumbnail: '🍔' },
  { name: 'İçecek', url: '/models/drink.glb', thumbnail: '🥤' },
  { name: 'Tatlı', url: '/models/cake.glb', thumbnail: '🍰' },
];

type BgType = 'white' | 'black' | 'transparent';
type LightType = 'natural' | 'fluorescent' | 'scene';

const Urun3DGosterimIntegration: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [modelUrl, setModelUrl] = useState<string>('/models/pizza-meshy.glb');
  const [modelName, setModelName] = useState<string>('Pizza');
  const [viewerStatus, setViewerStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [modelLoading, setModelLoading] = useState(true);
  const [backgroundType, setBackgroundType] = useState<BgType>('white');
  const [lightType, setLightType] = useState<LightType>('natural');
  const [autoRotate, setAutoRotate] = useState(true);
  const [customUrl, setCustomUrl] = useState('');
  const viewerRef = useRef<HTMLElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let alive = true;
    loadModelViewer()
      .then(() => alive && setViewerStatus('ready'))
      .catch(() => alive && setViewerStatus('error'));
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => setModelLoading(true), [modelUrl]);

  const bgStyle = backgroundType === 'white' ? '#ffffff' : backgroundType === 'black' ? '#0a0a0a' : 'transparent';

  const lightSettings: Record<LightType, { shadowIntensity: number; exposure: number }> = {
    natural: { shadowIntensity: 0.7, exposure: 1 },
    fluorescent: { shadowIntensity: 0.35, exposure: 1.15 },
    scene: { shadowIntensity: 1.1, exposure: 0.9 },
  };

  const applyToViewer = useCallback(
    (fn: (mv: any) => void) => {
      const mv = viewerRef.current as any;
      if (mv) fn(mv);
    },
    []
  );

  const handleZoomIn = () =>
    applyToViewer((mv) => {
      const o = mv.getCameraOrbit();
      mv.cameraOrbit = `${o.theta}rad ${o.phi}rad ${Math.max(o.radius * 0.8, 0.05)}m`;
    });

  const handleZoomOut = () =>
    applyToViewer((mv) => {
      const o = mv.getCameraOrbit();
      mv.cameraOrbit = `${o.theta}rad ${o.phi}rad ${o.radius * 1.25}m`;
    });

  const handleReset = () =>
    applyToViewer((mv) => {
      mv.cameraOrbit = '0deg 75deg auto';
      mv.resetTurntableRotation?.();
    });

  const handleDownload = () =>
    applyToViewer((mv) => {
      const data = mv.toDataURL?.();
      if (!data) return;
      const link = document.createElement('a');
      link.download = `${modelName.toLowerCase().replace(/\s+/g, '-')}-3d.png`;
      link.href = data;
      link.click();
    });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setModelName(file.name.replace(/\.[^.]+$/, ''));
    setModelUrl(URL.createObjectURL(file));
  };

  const handleSampleModelSelect = (model: typeof sampleModels[0]) => {
    setModelUrl(model.url);
    setModelName(model.name);
    setSelectedFile(null);
  };

  const handleCustomUrl = () => {
    const url = customUrl.trim();
    if (!/^https?:\/\/.+\.(glb|gltf)(\?.*)?$/i.test(url)) return;
    setModelUrl(url);
    setModelName(url.split('/').pop()?.replace(/\.[^.]+$/, '') || 'Model');
    setSelectedFile(null);
  };

  const isCustom = !sampleModels.some((m) => m.url === modelUrl);

  return (
    <div className="p-6 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Başlık bandı */}
        <div className="fx-header-band -m-6 mb-8 px-6 pt-8 pb-6 sm:rounded-b-2xl border-b border-primary/10">
          <div className="flex items-center gap-4 mb-3">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 border border-primary/25 text-primary text-2xl fx-float">🍕</span>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
                <span className="fx-gradient-text">Ürün 3D Gösterim</span>
              </h1>
              <p className="text-muted-foreground">Gerçek 3D ürün modellerini döndürün, yakınlaştırın ve mobilde AR ile deneyin</p>
            </div>
          </div>
          <Badge className="bg-primary/10 text-primary border border-primary/25">14 gün ücretsiz deneme</Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 3D Görüntüleyici */}
          <div className="lg:col-span-2">
            <Card className="h-full">
              <CardHeader>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div>
                    <CardTitle>3D Model Görüntüleyici{!isCustom ? ` — ${modelName}` : ''}</CardTitle>
                    <CardDescription>Sürükleyerek döndürün, tekerlek/pinch ile yakınlaştırın</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleZoomIn} aria-label="Yakınlaştır"><ZoomIn className="h-4 w-4" /></Button>
                    <Button variant="outline" size="sm" onClick={handleZoomOut} aria-label="Uzaklaştır"><ZoomOut className="h-4 w-4" /></Button>
                    <Button variant="outline" size="sm" onClick={handleReset} aria-label="Sıfırla"><RotateCcw className="h-4 w-4" /></Button>
                    <Button variant="outline" size="sm" onClick={handleDownload} aria-label="Görüntüyü indir"><Download className="h-4 w-4" /></Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {viewerStatus === 'error' ? (
                  <div className="h-96 flex flex-col items-center justify-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 text-sm text-muted-foreground">
                    <Box className="h-8 w-8 text-destructive" />
                    3D görüntüleyici yüklenemedi. İnternet bağlantınızı kontrol edin.
                  </div>
                ) : viewerStatus === 'loading' ? (
                  <div className="relative">
                    <div className="h-96 rounded-lg border" style={{ backgroundColor: bgStyle === 'transparent' ? undefined : bgStyle }}>
                      <Skeleton className="h-full w-full rounded-lg opacity-40" />
                    </div>
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-6 w-6 animate-spin" />
                      Görüntüleyici hazırlanıyor…
                    </div>
                  </div>
                ) : (
                  <div className="relative h-96 overflow-hidden rounded-lg border cursor-grab active:cursor-grabbing">
                    <model-viewer
                      ref={viewerRef}
                      src={modelUrl}
                      alt={`${modelName} 3D modeli`}
                      camera-controls
                      auto-rotate={autoRotate}
                      rotation-per-second="30deg"
                      shadow-intensity={lightSettings[lightType].shadowIntensity}
                      exposure={lightSettings[lightType].exposure}
                      ar
                      ar-modes="webxr scene-viewer quick-look"
                      style={{ width: '100%', height: '100%', backgroundColor: bgStyle }}
                      onLoad={() => setModelLoading(false)}
                    />
                    {modelLoading && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-sm text-muted-foreground pointer-events-none">
                        <Loader2 className="h-6 w-6 animate-spin" />
                        {modelName} yükleniyor…
                      </div>
                    )}
                    <div className="absolute bottom-4 left-4 bg-black/60 text-white px-3 py-1 rounded text-xs">
                      Gerçek 3D model — fare ile döndürün
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Kontroller */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Model Yükle</CardTitle>
                <CardDescription>Kendi ürün modelinizi yükleyin (GLB, GLTF)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".gltf,.glb,model/gltf-binary" className="hidden" />
                <Button onClick={() => fileInputRef.current?.click()} className="w-full" variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  Dosya Seç
                </Button>
                {selectedFile && (
                  <div className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                    <CheckCircle className="h-4 w-4" />
                    {selectedFile.name} yüklendi
                  </div>
                )}
                <div className="flex gap-2">
                  <Input
                    placeholder="veya https://…/model.glb bağlantısı"
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCustomUrl()}
                    className="text-xs"
                  />
                  <Button size="sm" variant="secondary" onClick={handleCustomUrl} disabled={!customUrl.trim()}>Ekle</Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Örnek Modeller</CardTitle>
                <CardDescription>Gerçek 3D tarama modelleriyle deneyin</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {sampleModels.map((model) => (
                    <Button
                      key={model.url}
                      variant={modelUrl === model.url && !selectedFile ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleSampleModelSelect(model)}
                      className="flex flex-col items-center gap-2 p-3 h-auto"
                    >
                      <span className="text-2xl">{model.thumbnail}</span>
                      <span className="text-xs">{model.name}</span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Görüntüleme Ayarları</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Arka Plan</label>
                  <select
                    className="w-full mt-1 p-2 border rounded bg-background"
                    value={backgroundType}
                    onChange={(e) => setBackgroundType(e.target.value as BgType)}
                  >
                    <option value="white">Beyaz</option>
                    <option value="black">Siyah</option>
                    <option value="transparent">Şeffaf</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Işık Tipi</label>
                  <select
                    className="w-full mt-1 p-2 border rounded bg-background"
                    value={lightType}
                    onChange={(e) => setLightType(e.target.value as LightType)}
                  >
                    <option value="natural">Doğal</option>
                    <option value="fluorescent">Floresan</option>
                    <option value="scene">Sahne</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Animasyon</label>
                  <div className="flex items-center gap-2 mt-1">
                    <input type="checkbox" className="rounded" checked={autoRotate} onChange={(e) => setAutoRotate(e.target.checked)} />
                    <span className="text-sm">Otomatik döndür</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Entegrasyon Bilgileri</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Box className="h-4 w-4 text-green-500" />
                  <span>Desteklenen formatlar: GLB, GLTF</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <ImageIcon className="h-4 w-4 text-blue-500" />
                  <span>Menüde ürün kartında 3D rozetiyle gösterilir</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Örnek modeller: Poly by Google (CC-BY). Menünüzdeki ürünlerde 3D sekmesi görünsün için ürün düzenleme ekranından model bağlantısı ekleyin.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Urun3DGosterimIntegration;
