import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Upload, 
  Box, 
  RotateCcw, 
  ZoomIn, 
  ZoomOut, 
  Move,
  Eye,
  Download,
  Settings,
  Info,
  CheckCircle
} from 'lucide-react';

const Urun3DGosterimIntegration: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [modelUrl, setModelUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'rotate' | 'pan' | 'zoom'>('rotate');
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState({ x: 0, y: 0, z: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [currentRotation, setCurrentRotation] = useState({ x: 0, y: 0 });
  const [backgroundType, setBackgroundType] = useState<'white' | 'black' | 'transparent' | 'grid'>('white');
  const [lightType, setLightType] = useState<'natural' | 'fluorescent' | 'scene'>('natural');
  const [autoRotate, setAutoRotate] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Örnek 3D model türleri (demo için)
  const sampleModels = [
    { name: 'Pizza', url: 'pizza', thumbnail: '🍕' },
    { name: 'Hamburger', url: 'hamburger', thumbnail: '🍔' },
    { name: 'İçecek', url: 'drink', thumbnail: '🥤' },
    { name: 'Tatlı', url: 'dessert', thumbnail: '🍰' }
  ];

  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Canvas boyutunu ayarla
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        
        // 3D model simülasyonu çiz
        draw3DModel(ctx);
      }
    }
  }, [rotation, zoom, modelUrl, backgroundType, lightType]);

  // Otomatik döndürme efekti
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (autoRotate) {
      interval = setInterval(() => {
        setRotation(prev => ({
          ...prev,
          y: prev.y + 1
        }));
      }, 50);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRotate]);

  const draw3DModel = (ctx: CanvasRenderingContext2D) => {
    const centerX = ctx.canvas.width / 2;
    const centerY = ctx.canvas.height / 2;
    const size = 100 * zoom;

    // Arka planı temizle
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    
    // Arka plan rengini ayarla
    if (backgroundType === 'white') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    } else if (backgroundType === 'black') {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    } else if (backgroundType === 'grid') {
      ctx.fillStyle = '#f0f0f0';
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      ctx.strokeStyle = '#e0e0e0';
      ctx.lineWidth = 1;
      const gridSize = 20;
      for (let x = 0; x <= ctx.canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, ctx.canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y <= ctx.canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(ctx.canvas.width, y);
        ctx.stroke();
      }
    }
    
    // Işık efekti uygula
    if (lightType === 'natural') {
      ctx.shadowColor = 'rgba(0,0,0,0.2)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetX = 5;
      ctx.shadowOffsetY = 5;
    } else if (lightType === 'fluorescent') {
      ctx.shadowColor = 'rgba(0,0,0,0.1)';
      ctx.shadowBlur = 5;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
    } else if (lightType === 'scene') {
      ctx.shadowColor = 'rgba(0,0,0,0.3)';
      ctx.shadowBlur = 15;
      ctx.shadowOffsetX = 8;
      ctx.shadowOffsetY = 8;
    }

    // Model tipine göre 3D şekil çiz
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate((rotation.y * Math.PI) / 180);
    
    let productName = 'Ürün 3D Model';
    let color1 = '#3b82f6';
    let color2 = '#1d4ed8';
    let color3 = '#1e40af';
    
    // Model tipine göre renk ve şekil ayarla
    if (modelUrl === 'pizza') {
      productName = 'Pizza 3D';
      color1 = '#f59e0b'; // Turuncu
      color2 = '#d97706';
      color3 = '#b45309';
      draw3DCylinder(ctx, size, color1, color2, color3);
    } else if (modelUrl === 'hamburger') {
      productName = 'Hamburger 3D';
      color1 = '#92400e'; // Kahverengi
      color2 = '#78350f';
      color3 = '#451a03';
      draw3DSandwich(ctx, size, color1, color2, color3);
    } else if (modelUrl === 'drink') {
      productName = 'İçecek 3D';
      color1 = '#10b981'; // Yeşil
      color2 = '#059669';
      color3 = '#047857';
      draw3DCup(ctx, size, color1, color2, color3);
    } else if (modelUrl === 'dessert') {
      productName = 'Tatlı 3D';
      color1 = '#ec4899'; // Pembe
      color2 = '#db2777';
      color3 = '#be185d';
      draw3DCake(ctx, size);
    } else {
      // Varsayılan küp
      draw3DCube(ctx, size, color1, color2, color3);
    }
    
    // Ürün adı - canvas kutusunun tam ortasına yerleştir
    const fontSize = Math.min(16, size / 8); // Orta boyut
    const textY = 0; // Tam dikey orta
    
    // Yazı arka planı - yarı saydam dikdörtgen
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    const textWidth = ctx.measureText(productName).width;
    const padding = 10;
    const rectX = -textWidth / 2 - padding;
    const rectY = -fontSize / 2 - padding / 2;
    const rectWidth = textWidth + padding * 2;
    const rectHeight = fontSize + padding;
    
    // Yuvarlak köşeli dikdörtgen çiz
    const cornerRadius = 6;
    ctx.beginPath();
    ctx.moveTo(rectX + cornerRadius, rectY);
    ctx.lineTo(rectX + rectWidth - cornerRadius, rectY);
    ctx.quadraticCurveTo(rectX + rectWidth, rectY, rectX + rectWidth, rectY + cornerRadius);
    ctx.lineTo(rectX + rectWidth, rectY + rectHeight - cornerRadius);
    ctx.quadraticCurveTo(rectX + rectWidth, rectY + rectHeight, rectX + rectWidth - cornerRadius, rectY + rectHeight);
    ctx.lineTo(rectX + cornerRadius, rectY + rectHeight);
    ctx.quadraticCurveTo(rectX, rectY + rectHeight, rectX, rectY + rectHeight - cornerRadius);
    ctx.lineTo(rectX, rectY + cornerRadius);
    ctx.quadraticCurveTo(rectX, rectY, rectX + cornerRadius, rectY);
    ctx.closePath();
    ctx.fill();
    
    // Yazı
    ctx.fillStyle = '#ffffff';
    ctx.font = `${fontSize}px Arial`;
    ctx.textAlign = 'center';
     
    // Yazıya gölge efekti ekle (daha iyi görünürlük için)
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 3;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;
    
    // Yazıyı canvas kutusunun tam ortasına yerleştir
    ctx.fillText(productName, 0, textY + fontSize / 3); // Dikey hizalama için küçük düzeltme
    
    // Gölgeyi sıfırla
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    
    ctx.restore();
  };

  // 3D Küp çizim fonksiyonu
  const draw3DCube = (ctx: CanvasRenderingContext2D, size: number, color1: string, color2: string, color3: string) => {
    // Ön yüzey
    ctx.fillStyle = color1;
    ctx.fillRect(-size/2, -size/2, size, size);
    
    // Üst yüzey
    ctx.fillStyle = color2;
    ctx.beginPath();
    ctx.moveTo(-size/2, -size/2);
    ctx.lineTo(-size/2 + size * 0.3, -size/2 - size * 0.3);
    ctx.lineTo(size/2 + size * 0.3, -size/2 - size * 0.3);
    ctx.lineTo(size/2, -size/2);
    ctx.closePath();
    ctx.fill();
    
    // Sağ yüzey
    ctx.fillStyle = color3;
    ctx.beginPath();
    ctx.moveTo(size/2, -size/2);
    ctx.lineTo(size/2 + size * 0.3, -size/2 - size * 0.3);
    ctx.lineTo(size/2 + size * 0.3, size/2 - size * 0.3);
    ctx.lineTo(size/2, size/2);
    ctx.closePath();
    ctx.fill();
  };

  // 3D Silindir (Pizza) çizim fonksiyonu
  const draw3DCylinder = (ctx: CanvasRenderingContext2D, size: number, color1: string, color2: string, color3: string) => {
    // Pizza tabanı
    ctx.fillStyle = '#f3b95b'; // Hamur rengi
    ctx.beginPath();
    ctx.arc(0, 0, size/2, 0, Math.PI * 2);
    ctx.fill();
    
    // Pizza sosu
    ctx.fillStyle = '#e11d48'; // Kırmızı sos
    ctx.beginPath();
    ctx.arc(0, 0, size/2 * 0.9, 0, Math.PI * 2);
    ctx.fill();
    
    // Malzemeler (örneğin, sucuk)
    ctx.fillStyle = '#c2410c'; // Sucuk rengi
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const x = Math.cos(angle) * size * 0.3;
      const y = Math.sin(angle) * size * 0.3;
      ctx.beginPath();
      ctx.arc(x, y, size * 0.08, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Pizza dilimleri
    ctx.strokeStyle = '#f3b95b';
    ctx.lineWidth = 2;
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(angle) * size/2, Math.sin(angle) * size/2);
      ctx.stroke();
    }
  };

  // 3D Sandviç (Hamburger) çizim fonksiyonu
  const draw3DSandwich = (ctx: CanvasRenderingContext2D, size: number, color1: string, color2: string, color3: string) => {
    // Alt ekmek
    ctx.fillStyle = '#d2a679'; // Ekmek rengi
    ctx.beginPath();
    ctx.arc(0, size * 0.2, size/2, 0, Math.PI, false);
    ctx.fill();
    ctx.fillRect(-size/2, size * 0.2, size, size * 0.1);
    
    // Köfte
    ctx.fillStyle = '#8a3324'; // Köfte rengi
    ctx.fillRect(-size/2, size * 0.1, size, size * 0.1);
    
    // Peynir
    ctx.fillStyle = '#ffd700'; // Peynir rengi
    ctx.fillRect(-size/2, size * 0.05, size, size * 0.05);
    
    // Marul
    ctx.fillStyle = '#22c55e'; // Marul rengi
    ctx.beginPath();
    ctx.ellipse(0, 0, size/2, size * 0.1, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Üst ekmek
    ctx.fillStyle = '#d2a679'; // Ekmek rengi
    ctx.beginPath();
    ctx.arc(0, 0, size/2, 0, Math.PI, true);
    ctx.fill();
    
    // Susamlar
    ctx.fillStyle = '#f0e68c'; // Susam rengi
    for (let i = 0; i < 20; i++) {
      const x = (Math.random() - 0.5) * size * 0.8;
      const y = -Math.random() * size * 0.2;
      ctx.fillRect(x, y, 2, 2);
    }
  };

  // 3D Bardak (İçecek) çizim fonksiyonu
  const draw3DCup = (ctx: CanvasRenderingContext2D, size: number, color1: string, color2: string, color3: string) => {
    // Bardak gövdesi
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'; // Şeffaf bardak
    ctx.beginPath();
    ctx.moveTo(-size/3, -size/2);
    ctx.lineTo(-size/4, size/2);
    ctx.lineTo(size/4, size/2);
    ctx.lineTo(size/3, -size/2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    // İçecek
    ctx.fillStyle = '#fca5a5'; // İçecek rengi (örneğin, çilekli)
    ctx.beginPath();
    ctx.moveTo(-size/3.2, -size/3);
    ctx.lineTo(-size/4.2, size/2.2);
    ctx.lineTo(size/4.2, size/2.2);
    ctx.lineTo(size/3.2, -size/3);
    ctx.closePath();
    ctx.fill();
    
    // Pipet
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(size/6, -size/1.5, 5, size);
    
    // Buzlar
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    for (let i = 0; i < 3; i++) {
      const x = (Math.random() - 0.5) * size * 0.2;
      const y = (Math.random() - 0.5) * size * 0.2;
      ctx.fillRect(x, y, 10, 10);
    }
  };

  // 3D Pasta (Tatlı) çizim fonksiyonu
  const draw3DCake = (ctx: CanvasRenderingContext2D, size: number) => {
    // Renkleri kullanalım ama daha uygun pasta renkleriyle
    const cakeBodyColor = '#FEE2E2'; // Açık pembe/krem
    const cakeSideColor = '#FCA5A5'; // Biraz daha koyu
    const cakeTopColor = '#FFFFFF';   // Krema
    const strawberryColor = '#EF4444';
    const leafColor = '#22C55E';

    const cakeHeight = size * 0.4;
    const tipX = size / 1.8;
    const tipY = 0;
    
    const backLeftX = -size / 2.5;
    const backLeftY = -size / 2.5;
    
    const backRightX = -size / 2.5;
    const backRightY = size / 2.5;

    // Arka kavisli yüzey
    ctx.fillStyle = cakeSideColor;
    ctx.beginPath();
    ctx.moveTo(backLeftX, backLeftY);
    ctx.lineTo(backLeftX, backLeftY + cakeHeight);
    ctx.quadraticCurveTo(
      backLeftX - size * 0.2, backLeftY + cakeHeight / 2, // control point
      backRightX, backRightY + cakeHeight // end point
    );
    ctx.lineTo(backRightX, backRightY);
    ctx.closePath();
    ctx.fill();

    // Yan kesik yüzey (sağ)
    ctx.fillStyle = cakeBodyColor;
    ctx.beginPath();
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(backRightX, backRightY);
    ctx.lineTo(backRightX, backRightY + cakeHeight);
    ctx.lineTo(tipX, tipY + cakeHeight);
    ctx.closePath();
    ctx.fill();

    // Yan kesik yüzey (sol)
    ctx.fillStyle = cakeBodyColor;
    ctx.beginPath();
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(backLeftX, backLeftY);
    ctx.lineTo(backLeftX, backLeftY + cakeHeight);
    ctx.lineTo(tipX, tipY + cakeHeight);
    ctx.closePath();
    ctx.fill();

    // Üst yüzey (krema)
    ctx.fillStyle = cakeTopColor;
    ctx.beginPath();
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(backLeftX, backLeftY);
    ctx.quadraticCurveTo(
      backLeftX - size * 0.2, (backLeftY + backRightY) / 2, // control point
      backRightX, backRightY // end point
    );
    ctx.closePath();
    ctx.fill();

    // Çilek
    ctx.fillStyle = strawberryColor;
    const strawberryX = 0;
    const strawberryY = -size * 0.1;
    ctx.beginPath();
    ctx.arc(strawberryX, strawberryY, 15, 0, Math.PI * 2);
    ctx.fill();
    
    // Çilek yaprağı
    ctx.fillStyle = leafColor;
    ctx.beginPath();
    ctx.moveTo(strawberryX, strawberryY - 12);
    ctx.lineTo(strawberryX - 5, strawberryY - 18);
    ctx.lineTo(strawberryX + 5, strawberryY - 18);
    ctx.closePath();
    ctx.fill();
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setModelUrl(url);
    }
  };

  const handleSampleModelSelect = (model: typeof sampleModels[0]) => {
    setModelUrl(model.url);
    setSelectedFile(null);
    setRotation({ x: 0, y: 0, z: 0 }); // Model değiştiğinde rotation'ı sıfırla
  };

  const handleMouseDown = (event: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: event.clientX, y: event.clientY });
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    if (!isDragging) return;
    
    const deltaX = event.clientX - dragStart.x;
    const deltaY = event.clientY - dragStart.y;
    
    setRotation(prev => ({
      ...prev,
      x: prev.x + deltaY * 0.5,
      y: prev.y + deltaX * 0.5
    }));
    
    setDragStart({ x: event.clientX, y: event.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.2, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.2, 0.5));
  };

  const handleReset = () => {
    setRotation({ x: 0, y: 0, z: 0 });
    setZoom(1);
  };

  const handleDownload = () => {
    if (canvasRef.current) {
      const link = document.createElement('a');
      link.download = '3d-model-view.png';
      link.href = canvasRef.current.toDataURL();
      link.click();
    }
  };

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="text-4xl">🧊</div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                Ürün 3D Gösterim
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Müşterilerinize ürünlerinizi 3D olarak inceleme imkanı sunun
              </p>
            </div>
          </div>
          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            14 gün ücretsiz deneme
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 3D Viewer */}
          <div className="lg:col-span-2">
            <Card className="h-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>3D Model Görüntüleyici</CardTitle>
                    <CardDescription>
                      Ürününüzü 3 boyutlu olarak inceleyin
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleZoomOut}
                    >
                      <ZoomOut className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleZoomIn}
                    >
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleReset}
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDownload}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <canvas
                    ref={canvasRef}
                    className="w-full h-96 border border-gray-200 dark:border-gray-700 rounded-lg cursor-grab active:cursor-grabbing"
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                  />
                  <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded text-sm">
                    Fare ile sürükleyerek döndürün
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Controls Panel */}
          <div className="space-y-6">
            {/* File Upload */}
            <Card>
              <CardHeader>
                <CardTitle>Model Yükle</CardTitle>
                <CardDescription>
                  3D model dosyanızı yükleyin (OBJ, FBX, GLTF)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".obj,.fbx,.gltf,.glb"
                  className="hidden"
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full"
                  variant="outline"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Dosya Seç
                </Button>
                {selectedFile && (
                  <div className="text-sm text-green-600 dark:text-green-400 flex items-center">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    {selectedFile.name} yüklendi
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Sample Models */}
            <Card>
              <CardHeader>
                <CardTitle>Örnek Modeller</CardTitle>
                <CardDescription>
                  Hızlı başlangıç için örnek 3D modeller
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {sampleModels.map((model, index) => (
                    <Button
                      key={index}
                      variant="outline"
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

            {/* Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Görüntüleme Ayarları</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Arka Plan</label>
                  <select 
                    className="w-full mt-1 p-2 border rounded"
                    value={backgroundType}
                    onChange={(e) => setBackgroundType(e.target.value as 'white' | 'black' | 'transparent' | 'grid')}
                  >
                    <option value="white">Beyaz</option>
                    <option value="black">Siyah</option>
                    <option value="transparent">Şeffaf</option>
                    <option value="grid">Grid</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Işık Tipi</label>
                  <select 
                    className="w-full mt-1 p-2 border rounded"
                    value={lightType}
                    onChange={(e) => setLightType(e.target.value as 'natural' | 'fluorescent' | 'scene')}
                  >
                    <option value="natural">Doğal</option>
                    <option value="fluorescent">Floresan</option>
                    <option value="scene">Sahne</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Animasyon</label>
                  <div className="flex items-center gap-2 mt-1">
                    <input 
                      type="checkbox" 
                      className="rounded" 
                      checked={autoRotate}
                      onChange={(e) => setAutoRotate(e.target.checked)}
                    />
                    <span className="text-sm">Otomatik döndür</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Integration Info */}
            <Card>
              <CardHeader>
                <CardTitle>Entegrasyon Bilgileri</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Info className="h-4 w-4 text-blue-500" />
                  <span>Desteklenen formatlar: OBJ, FBX, GLTF</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Box className="h-4 w-4 text-green-500" />
                  <span>Maksimum dosya boyutu: 50MB</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Eye className="h-4 w-4 text-purple-500" />
                  <span>360° dönme özelliği</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mt-8">
          <Button
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <Box className="h-5 w-5 mr-2" />
            Entegrasyonu Aktif Et
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => window.history.back()}
          >
            Geri Dön
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Urun3DGosterimIntegration;