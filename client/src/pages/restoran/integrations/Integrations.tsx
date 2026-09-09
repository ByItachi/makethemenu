import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  Package, 
  ShoppingCart, 
  Truck, 
  FileText, 
  CreditCard, 
  Phone, 
  MapPin,
  Smartphone,
  Wifi,
  BarChart3,
  Hotel,
  Calculator,
  Settings,
  CheckCircle,
  Clock,
  AlertCircle,
  Power,
  PowerOff,
  ExternalLink,
  Calendar,
  DollarSign,
  Box
} from 'lucide-react';

interface Integration {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: React.ComponentType<any>;
  status: 'active' | 'inactive' | 'pending' | 'purchased';
  apiEndpoint?: string;
  documentation?: string;
  subscriptionStatus?: 'expired' | 'active' | 'trial' | 'ending-soon';
  subscriptionDays?: number;
  price?: number;
  logo?: string;
  backgroundColor?: string;
}

const integrations: Integration[] = [
  // 3D Product Visualization
  {
    id: 'urun-3d-gosterim',
    name: 'Ürün 3D Gösterim',
    description: 'Müşterilerinize ürünlerinizi 3D olarak inceleme imkanı sunun.',
    category: 'Görselleştirme',
    icon: Box,
    status: 'inactive',
    apiEndpoint: '/api/integrations/urun-3d-gosterim',
    subscriptionStatus: 'trial',
    subscriptionDays: 14,
    price: 499,
    logo: '🧊',
    backgroundColor: 'bg-gradient-to-br from-blue-400 to-indigo-600'
  },
  // Food Delivery Integrations
  {
    id: 'yemeksepeti',
    name: 'Yemek Sepeti',
    description: 'Türkiye\'nin en büyük online yemek siparişi platformu entegrasyonu',
    category: 'Yemek Siparişi',
    icon: ShoppingCart,
    status: 'purchased',
    apiEndpoint: '/api/integrations/yemeksepeti',
    documentation: 'https://developer.yemeksepeti.com',
    subscriptionStatus: 'expired',
    subscriptionDays: 0,
    price: 299,
    logo: '🍕',
    backgroundColor: 'bg-gradient-to-br from-red-500 to-orange-500'
  },
  {
    id: 'getir',
    name: 'Getir',
    description: 'Hızlı teslimat ve yemek siparişi entegrasyonu',
    category: 'Yemek Siparişi',
    icon: Truck,
    status: 'purchased',
    apiEndpoint: '/api/integrations/getir',
    documentation: 'https://developer.getir.com',
    subscriptionStatus: 'ending-soon',
    subscriptionDays: 2,
    price: 249,
    logo: '🚀',
    backgroundColor: 'bg-gradient-to-br from-blue-500 to-cyan-500'
  },
  {
    id: 'trendyol-yemek',
    name: 'Trendyol Yemek',
    description: 'Trendyol\'un yemek siparişi platformu entegrasyonu',
    category: 'Yemek Siparişi',
    icon: Package,
    status: 'inactive',
    apiEndpoint: '/api/integrations/trendyol-yemek',
    documentation: 'https://partner.trendyol.com',
    subscriptionStatus: 'trial',
    subscriptionDays: 7,
    price: 199,
    logo: '🛍️',
    backgroundColor: 'bg-gradient-to-br from-purple-500 to-pink-500'
  },
  {
    id: 'migros-yemek',
    name: 'Migros Yemek',
    description: 'Migros\'un online yemek siparişi hizmeti entegrasyonu',
    category: 'Yemek Siparişi',
    icon: ShoppingCart,
    status: 'inactive',
    apiEndpoint: '/api/integrations/migros-yemek',
    subscriptionStatus: 'trial',
    subscriptionDays: 14,
    price: 179,
    logo: '🏪',
    backgroundColor: 'bg-gradient-to-br from-green-500 to-teal-500'
  },
  {
    id: 'fuudy',
    name: 'Fuudy',
    description: 'Yerel restoran keşif ve sipariş platformu entegrasyonu',
    category: 'Yemek Siparişi',
    icon: MapPin,
    status: 'inactive',
    apiEndpoint: '/api/integrations/fuudy',
    subscriptionStatus: 'trial',
    subscriptionDays: 30,
    price: 149,
    logo: '📍',
    backgroundColor: 'bg-gradient-to-br from-yellow-500 to-orange-500'
  },
  {
    id: 'paket-servisi',
    name: 'Paket Servisi',
    description: 'Genel paket servisi yönetim entegrasyonu',
    category: 'Yemek Siparişi',
    icon: Truck,
    status: 'inactive',
    apiEndpoint: '/api/integrations/paket-servisi',
    subscriptionStatus: 'trial',
    subscriptionDays: 30,
    price: 99,
    logo: '🚚',
    backgroundColor: 'bg-gradient-to-br from-indigo-500 to-blue-500'
  },
  {
    id: 'hemenyolda',
    name: 'Hemenyolda',
    description: 'Yerel hizmet ve yemek siparişi platformu entegrasyonu',
    category: 'Yemek Siparişi',
    icon: MapPin,
    status: 'inactive',
    apiEndpoint: '/api/integrations/hemenyolda',
    subscriptionStatus: 'trial',
    subscriptionDays: 30,
    price: 129,
    logo: '⚡',
    backgroundColor: 'bg-gradient-to-br from-red-500 to-pink-500'
  },
  // Restaurant Management
  {
    id: 'restajet',
    name: 'RestaJet',
    description: 'Restoran operasyon yönetim sistemi entegrasyonu',
    category: 'Restoran Yönetimi',
    icon: Settings,
    status: 'purchased',
    apiEndpoint: '/api/integrations/restajet',
    subscriptionStatus: 'active',
    subscriptionDays: 45,
    price: 399,
    logo: '⚙️',
    backgroundColor: 'bg-gradient-to-br from-gray-600 to-gray-800'
  },
  // E-Invoice & Accounting
  {
    id: 'e-fatura',
    name: 'E-Fatura & E-Arşiv',
    description: 'Elektronik fatura ve arşiv yönetimi entegrasyonu',
    category: 'Muhasebe',
    icon: FileText,
    status: 'purchased',
    apiEndpoint: '/api/integrations/efatura',
    subscriptionStatus: 'active',
    subscriptionDays: 120,
    price: 599,
    logo: '📄',
    backgroundColor: 'bg-gradient-to-br from-emerald-500 to-green-600'
  },
  {
    id: 'e-adisyon',
    name: 'E-Adisyon',
    description: 'Elektronik adisyon yönetim sistemi entegrasyonu',
    category: 'Muhasebe',
    icon: CreditCard,
    status: 'inactive',
    apiEndpoint: '/api/integrations/eadisyon',
    subscriptionStatus: 'trial',
    subscriptionDays: 30,
    price: 249,
    logo: '💳',
    backgroundColor: 'bg-gradient-to-br from-slate-500 to-slate-700'
  },
  {
    id: 'bizim-hesap',
    name: 'Bizim Hesap',
    description: 'Muhasebe ve finans yönetimi entegrasyonu',
    category: 'Muhasebe',
    icon: Calculator,
    status: 'inactive',
    apiEndpoint: '/api/integrations/bizim-hesap',
    subscriptionStatus: 'trial',
    subscriptionDays: 30,
    price: 199,
    logo: '🧮',
    backgroundColor: 'bg-gradient-to-br from-blue-600 to-blue-800'
  },
  // Hotel Integrations
  {
    id: 'hotel-runner',
    name: 'Hotel Runner',
    description: 'Otel yönetim sistemi entegrasyonu',
    category: 'Otel',
    icon: Hotel,
    status: 'inactive',
    apiEndpoint: '/api/integrations/hotel-runner',
    subscriptionStatus: 'trial',
    subscriptionDays: 30,
    price: 349,
    logo: '🏨',
    backgroundColor: 'bg-gradient-to-br from-amber-500 to-orange-600'
  },
  {
    id: 'hms-hotel',
    name: 'HMS HOTEL',
    description: 'HMS otel yönetim sistemi entegrasyonu',
    category: 'Otel',
    icon: Hotel,
    status: 'inactive',
    apiEndpoint: '/api/integrations/hms-hotel',
    subscriptionStatus: 'trial',
    subscriptionDays: 30,
    price: 379,
    logo: '🏩',
    backgroundColor: 'bg-gradient-to-br from-cyan-500 to-blue-600'
  },
  {
    id: 'hotelier-101',
    name: 'Hotelier 101',
    description: 'Hotelier 101 otel yönetim sistemi entegrasyonu',
    category: 'Otel',
    icon: Hotel,
    status: 'inactive',
    apiEndpoint: '/api/integrations/hotelier-101',
    subscriptionStatus: 'trial',
    subscriptionDays: 30,
    price: 329,
    logo: '🏢',
    backgroundColor: 'bg-gradient-to-br from-violet-500 to-purple-600'
  },
  // Hardware & Device Integrations
  {
    id: 'caller-id',
    name: 'Caller ID Cihazı',
    description: 'Telefon görüşme kimliği gösterim cihazı entegrasyonu',
    category: 'Donanım',
    icon: Phone,
    status: 'purchased',
    apiEndpoint: '/api/integrations/caller-id',
    subscriptionStatus: 'active',
    subscriptionDays: 90,
    price: 149,
    logo: '📞',
    backgroundColor: 'bg-gradient-to-br from-lime-500 to-green-600'
  },
  {
    id: 'android-callerid',
    name: 'Android Caller ID',
    description: 'Android tabanlı arayan kimlik gösterim entegrasyonu',
    category: 'Donanım',
    icon: Smartphone,
    status: 'inactive',
    apiEndpoint: '/api/integrations/android-callerid',
    subscriptionStatus: 'trial',
    subscriptionDays: 30,
    price: 99,
    logo: '📱',
    backgroundColor: 'bg-gradient-to-br from-teal-500 to-cyan-600'
  },
  {
    id: 'yazar-kasa',
    name: 'Yazar Kasa',
    description: 'Yazar kasa cihazı entegrasyonu',
    category: 'Donanım',
    icon: CreditCard,
    status: 'purchased',
    apiEndpoint: '/api/integrations/yazar-kasa',
    subscriptionStatus: 'ending-soon',
    subscriptionDays: 5,
    price: 199,
    logo: '💰',
    backgroundColor: 'bg-gradient-to-br from-rose-500 to-pink-600'
  },
  // Other Integrations
  {
    id: 'boostfeel',
    name: 'BOOSTFEEL',
    description: 'BOOSTFEEL platform entegrasyonu',
    category: 'Diğer',
    icon: BarChart3,
    status: 'inactive',
    apiEndpoint: '/api/integrations/boostfeel',
    subscriptionStatus: 'trial',
    subscriptionDays: 30,
    price: 179,
    logo: '📊',
    backgroundColor: 'bg-gradient-to-br from-orange-500 to-red-600'
  },
  {
    id: 'butiksoft',
    name: 'Butiksoft',
    description: 'Butiksoft yazılım çözümleri entegrasyonu',
    category: 'Diğer',
    icon: Package,
    status: 'inactive',
    apiEndpoint: '/api/integrations/butiksoft',
    subscriptionStatus: 'trial',
    subscriptionDays: 30,
    price: 159,
    logo: '📦',
    backgroundColor: 'bg-gradient-to-br from-purple-600 to-indigo-700'
  },
  {
    id: 'adisyo-harita',
    name: 'Adisyo Harita',
    description: 'Adres ve harita entegrasyonu',
    category: 'Diğer',
    icon: MapPin,
    status: 'inactive',
    apiEndpoint: '/api/integrations/adisyo-harita',
    subscriptionStatus: 'trial',
    subscriptionDays: 30,
    price: 89,
    logo: '🗺️',
    backgroundColor: 'bg-gradient-to-br from-stone-500 to-stone-700'
  },
  {
    id: 'veri-aktarimi',
    name: 'Veri Aktarımı & API',
    description: 'Genel veri aktarımı ve API entegrasyon çerçevesi',
    category: 'API',
    icon: Wifi,
    status: 'inactive',
    apiEndpoint: '/api/integrations/veri-aktarimi',
    subscriptionStatus: 'trial',
    subscriptionDays: 30,
    price: 299,
    logo: '🔗',
    backgroundColor: 'bg-gradient-to-br from-sky-500 to-blue-700'
  }
];

const categories = [
  'Tümü',
  'Görselleştirme',
  'Yemek Siparişi',
  'Restoran Yönetimi',
  'Muhasebe',
  'Otel',
  'Donanım',
  'API',
  'Diğer'
];

const Integrations: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tümü');
  const [, navigate] = useLocation();

  const filteredIntegrations = integrations.filter(integration => {
    const matchesSearch = integration.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         integration.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'Tümü' || integration.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const getSubscriptionStatusText = (integration: Integration) => {
    if (integration.status === 'purchased') {
      switch (integration.subscriptionStatus) {
        case 'expired':
          return 'Sona Erdi';
        case 'ending-soon':
          return `Son ${integration.subscriptionDays} gün`;
        case 'active':
          return `${integration.subscriptionDays} gün kaldı`;
        default:
          return 'Aktif';
      }
    }
    return null;
  };

  const getSubscriptionStatusColor = (integration: Integration) => {
    if (integration.status === 'purchased') {
      switch (integration.subscriptionStatus) {
        case 'expired':
          return 'text-red-500 bg-red-50';
        case 'ending-soon':
          return 'text-orange-500 bg-orange-50';
        case 'active':
          return 'text-green-500 bg-green-50';
        default:
          return 'text-green-500 bg-green-50';
      }
    }
    return '';
  };

  const handlePurchase = (integration: Integration) => {
    // Store only this integration for direct purchase
    localStorage.setItem('integrationCart', JSON.stringify([integration]));
    navigate('/integration-purchase');
  };

  const handleExtend = (integration: Integration) => {
    // Implement extend logic here
    alert(`${integration.name} süre uzatma işlemi başlatıldı!`);
  };

  const handleToggleActive = (integration: Integration) => {
    // Implement toggle logic here
    const newStatus = integration.status === 'active' ? 'purchased' : 'active';
    alert(`${integration.name} ${newStatus === 'active' ? 'aktif' : 'pasif'} yapıldı!`);
  };

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Uygulama Mağazası</h1>
        <p className="text-gray-600 dark:text-gray-400 text-lg">
          Restoranınız için en iyi entegrasyonları keşfedin ve satın alın
        </p>
      </div>

      {/* Filters */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row gap-4 max-w-4xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              type="text"
              placeholder="Entegrasyon ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-12 text-lg"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-6 py-3 border border-gray-300 rounded-lg bg-white dark:bg-gray-800 dark:border-gray-600 h-12 text-lg"
          >
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Integrations Grid - New App Store Design */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredIntegrations.map((integration) => {
          const Icon = integration.icon;
          const subscriptionText = getSubscriptionStatusText(integration);
          
          return (
            <Card key={integration.id} className="overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-105">
              {/* Header with gradient background */}
              <div className={`${integration.backgroundColor} h-32 relative flex items-center justify-center`}>
                <div className="text-6xl">{integration.logo}</div>
                {subscriptionText && (
                  <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-semibold ${getSubscriptionStatusColor(integration)}`}>
                    {subscriptionText}
                  </div>
                )}
              </div>
              
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                      {integration.name}
                    </CardTitle>
                    <CardDescription className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {integration.description}
                    </CardDescription>
                  </div>
                </div>
                <div className="mt-3">
                  <Badge variant="outline" className="text-xs">
                    {integration.category}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                {/* Price */}
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">
                    {integration.price}₺
                  </span>
                  <span className="text-sm text-gray-500">/aylık</span>
                </div>
                
                {/* Trial info for inactive integrations */}
                {integration.status === 'inactive' && integration.subscriptionDays && (
                  <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                    <Calendar className="h-4 w-4" />
                    <span>{integration.subscriptionDays} gün ücretsiz deneme</span>
                  </div>
                )}
                
                {/* Action Buttons */}
                <div className="space-y-2">
                  {integration.status === 'inactive' ? (
                    <>
                      <Button 
                        onClick={() => handlePurchase(integration)}
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3"
                      >
                        <DollarSign className="h-4 w-4 mr-2" />
                        Satın Al
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => {
                          if (integration.id === 'urun-3d-gosterim') {
                            window.location.href = '/restoran/integrations/urun-3d-gosterim';
                          } else {
                            alert('Ücretsiz deneme başlatıldı!');
                          }
                        }}
                        className="w-full font-semibold py-3"
                      >
                        Ücretsiz Dene
                      </Button>
                    </>
                  ) : integration.status === 'purchased' ? (
                    <>
                      <Button 
                        onClick={() => handleToggleActive(integration)}
                        variant="default"
                        className="w-full font-semibold py-3"
                      >
                        <Power className="h-4 w-4 mr-2" />
                        Aktif Et
                      </Button>
                      {integration.subscriptionStatus === 'ending-soon' && (
                        <Button 
                          onClick={() => handleExtend(integration)}
                          variant="outline"
                          className="w-full font-semibold py-3 border-orange-500 text-orange-600 hover:bg-orange-50"
                        >
                          <Calendar className="h-4 w-4 mr-2" />
                          Süre Uzat
                        </Button>
                      )}
                    </>
                  ) : null}
                  
                  <Link href={`/restoran/integrations/${integration.id}`} className="block">
                    <Button 
                      variant="ghost"
                      className="w-full font-semibold py-3 text-gray-600 hover:text-gray-900"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Uygulama Detayı
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredIntegrations.length === 0 && (
        <div className="text-center py-12">
          <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
            Entegrasyon bulunamadı
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Arama kriterlerinize uygun entegrasyon bulunmuyor.
          </p>
        </div>
      )}
    </div>
  );
};

export default Integrations;
