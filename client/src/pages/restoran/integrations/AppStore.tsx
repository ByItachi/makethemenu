import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { integrations, Integration } from './Integrations';
import { IntegrationSetupWizard, usePluginState } from './IntegrationSetupWizard';
import {
  Search, Sparkles, Crown, Zap, Building2, Store, Utensils, Bike,
  FileText, Hotel, HeartHandshake, Plug, ArrowRight, Check, Wrench,
  CreditCard,
} from 'lucide-react';

// id -> detail page path (routed under /restoran/integrations/<id>)
const detailPageIds = new Set(integrations.map(i => i.id));

// Adisyo tarzı vitrin bölümleri: kategori -> bölüm
const sections: { title: string; categoryKey: string; description: string; icon: React.ComponentType<any>; ids: string[] }[] = [
  {
    title: 'Restoran Operasyonu',
    categoryKey: 'operasyon',
    description: 'Operasyonunuzu hızlandıran dijital menü, yönetim ve donanım uygulamaları.',
    icon: Utensils,
    ids: ['urun-3d-gosterim', 'restajet', 'caller-id', 'android-callerid', 'yazar-kasa'],
  },
  {
    title: 'Paket Sipariş Entegrasyonları',
    categoryKey: 'pazaryeri',
    description: 'Siparişlerinizi dünyanın dört bir yanındaki restoranlarla tek panelden yönetin.',
    icon: Store,
    ids: ['yemeksepeti', 'getir', 'trendyol-yemek', 'migros-yemek', 'fuudy', 'paket-servisi'],
  },
  {
    title: 'Kurye Entegrasyonları',
    categoryKey: 'kurye',
    description: 'Teslimat sürelerini optimize edin, kuryelerinizi harita üzerinde izleyin.',
    icon: Bike,
    ids: ['hemenyolda', 'adisyo-harita'],
  },
  {
    title: 'Ödeme Yöntemi Entegrasyonları',
    categoryKey: 'odeme',
    description: 'Siparişlerinizde ödeme seçeneklerini genişletin.',
    icon: CreditCard,
    ids: ['bizim-hesap'],
  },
  {
    title: 'E-Dönüşüm Entegrasyonları',
    categoryKey: 'edonusum',
    description: 'E-Fatura ve E-Adisyon süreçlerinizi yasal gerekliliklere uygun yönetin.',
    icon: FileText,
    ids: ['e-fatura', 'e-adisyon'],
  },
  {
    title: 'Otel Entegrasyonları',
    categoryKey: 'operasyon',
    description: 'Otel restoran adisyonlarınızı otel yazılımınıza aktararak süreci hızlandırın.',
    icon: Hotel,
    ids: ['hotel-runner', 'hms-hotel', 'hotelier-101', 'butiksoft'],
  },
  {
    title: 'Müşteri Sadakat Entegrasyonları',
    categoryKey: 'operasyon',
    description: 'Kişiselleştirilmiş sadakat programları ile müşterilerinizi mutlu edin, uzun vadeli ilişkiler kurun.',
    icon: HeartHandshake,
    ids: ['boostfeel'],
  },
  {
    title: 'Veri Aktarımı & API Entegrasyonları',
    categoryKey: 'operasyon',
    description: 'Verilerinizi dış sistemlerle entegre ederek iş aşınızı otomatikleştirin.',
    icon: Plug,
    ids: ['veri-aktarimi'],
  },
];

const recommendedIds = ['urun-3d-gosterim', 'yemeksepeti', 'trendyol-yemek', 'migros-yemek'];

const AppStore: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [, navigate] = useLocation();
  const [wizardFor, setWizardFor] = useState<(Integration & { categoryKey?: string }) | null>(null);
  const pluginsState = usePluginState();

  const byId = (id: string) => integrations.find(i => i.id === id)!;

  const matches = (i: Integration) =>
    i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.description.toLowerCase().includes(searchTerm.toLowerCase());

  const trialBadge = (i: Integration) =>
    i.status === 'inactive' && (i.subscriptionDays ?? 0) >= 7;

  const openIntegration = (i: Integration) => {
    // Mağaza akışı: satın alma sayfası (deneme/satın al); yönetim ise detay sayfası
    localStorage.setItem('integrationCart', JSON.stringify([i]));
    navigate('/integration-purchase');
  };

  const renderCard = (i: Integration, recommended = false, categoryKey = 'operasyon') => {
    const hasDetail = detailPageIds.has(i.id);
    const pluginKey = i.id === 'urun-3d-gosterim' ? 'menu-3d' : i.id === 'getir' ? 'getiryemek' : i.id;
    const isActive = pluginsState.data?.plugins?.find(p => p.key === pluginKey)?.isEnabled === true;
    return (
      <Card key={i.id} className={`overflow-hidden flex flex-col ${recommended ? 'ring-2 ring-primary/40' : ''}`}>
        <CardContent className="p-4 flex flex-col gap-3 grow">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <div className={`w-11 h-11 rounded-lg ${i.backgroundColor} flex items-center justify-center text-2xl shrink-0`}>
                {i.logo}
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-sm truncate">{i.name}</div>
                <div className="text-xs text-muted-foreground">{i.category}</div>
              </div>
            </div>
            {trialBadge(i) && (
              <span className="shrink-0 text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                {i.subscriptionDays} Gün Ücretsiz
              </span>
            )}
          </div>

          <p className="text-xs text-muted-foreground line-clamp-2 grow">{i.description}</p>

          <div className="flex items-center justify-between pt-1">
            <div className="text-sm">
              {i.status === 'purchased' ? (
                <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                  <Check className="h-4 w-4" /> Sahipsiniz
                </span>
              ) : (
                <>
                  <span className="font-bold">{i.price}₺</span>
                  <span className="text-muted-foreground"> /ay</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              {hasDetail && (
                <Link href={`/restoran/integrations/${i.id}`}>
                  <Button variant="ghost" size="sm" className="h-8 gap-1">
                    <Wrench className="h-3.5 w-3.5" /> Yönet
                  </Button>
                </Link>
              )}
              {i.status === 'inactive' && !isActive ? (
                <Button size="sm" className="h-8 gap-1" onClick={() => setWizardFor({ ...i, categoryKey })} data-testid={`add-${i.id}`}>
                  + Ekle
                </Button>
              ) : (
                <Link href={`/restoran/integrations/${i.id}`}>
                  <Button variant="outline" size="sm" className="h-8 gap-1">
                    Ayarlar <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const recommended = recommendedIds.map(byId).filter(matches);
  const planItems = [
    { icon: Crown, name: 'Başlangıç', desc: 'Temel menü ve karekod', price: 'Ücretsiz' },
    { icon: Zap, name: 'Pro', desc: 'Tüm entegrasyonlar, 3D ürün gösterimi', price: '499₺/ay' },
    { icon: Building2, name: 'Kurumsal', desc: 'Çok şube, API erişimi, öncelikli destek', price: 'Teklif alın' },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Uygulama Mağazası</h1>
        <p className="text-muted-foreground mt-1">
          Restoranınız için entegrasyonları keşfedin, deneyin ve tek tıkla ekleyin.
        </p>
      </div>

      {/* Arama */}
      <div className="relative max-w-xl">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          type="text"
          placeholder="Uygulama ara..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Planınızı Yükseltin */}
      <div className="rounded-xl border bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-5">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="font-semibold">Planınızı Büyütün</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {planItems.map((p) => (
            <div key={p.name} className="rounded-lg border bg-background p-4">
              <div className="flex items-center gap-2 mb-1">
                <p.icon className="h-4 w-4 text-primary" />
                <span className="font-medium text-sm">{p.name}</span>
              </div>
              <p className="text-xs text-muted-foreground mb-2">{p.desc}</p>
              <div className="text-sm font-semibold">{p.price}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Size Önerilenler */}
      {recommended.length > 0 && (
        <section>
          <div className="flex items-baseline gap-2 mb-1">
            <h2 className="text-xl font-bold">Size Önerilenler</h2>
            <span className="text-xs text-muted-foreground">{recommended.length} uygulama</span>
          </div>
          <p className="text-sm text-muted-foreground mb-3">Sektörünüzde en çok tercih edilen entegrasyonlar.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {recommended.map((i) => renderCard(i, true, 'pazaryeri'))}
          </div>
        </section>
      )}

      {/* Kategorilere göre bölümler */}
      {sections.map((s) => {
        const items = s.ids.map(byId).filter(i => i && matches(i));
        if (items.length === 0) return null;
        const SectionIcon = s.icon;
        return (
          <section key={s.title}>
            <div className="flex items-baseline gap-2 mb-1">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <SectionIcon className="h-5 w-5 text-primary" /> {s.title}
              </h2>
              <span className="text-xs text-muted-foreground">{items.length} uygulama</span>
            </div>
            <p className="text-sm text-muted-foreground mb-3">{s.description}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {items.map((i) => renderCard(i, false, s.categoryKey))}
            </div>
          </section>
        );
      })}

      {/* Arama sonucu yok */}
      {searchTerm && recommended.length === 0 && sections.every(s => s.ids.map(byId).filter(matches).length === 0) && (
        <div className="text-center py-16 text-muted-foreground">
          "{searchTerm}" için uygulama bulunamadı.
        </div>
      )}

      {wizardFor && (
        <IntegrationSetupWizard
          integration={{ id: wizardFor.id, name: wizardFor.name, description: wizardFor.description, category: (wizardFor as { categoryKey?: string }).categoryKey }}
          open={!!wizardFor}
          onClose={() => setWizardFor(null)}
        />
      )}
    </div>
  );
};

export default AppStore;
