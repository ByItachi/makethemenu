import {
  Blocks,
  CalendarClock,
  Cake,
  Car,
  Droplets,
  Flame,
  Flower2,
  PawPrint,
  Scissors,
  ShoppingBasket,
  Sparkles,
  SprayCan,
  Store,
  Shirt,
  Boxes,
  UtensilsCrossed,
  Wrench,
  type LucideIcon,
} from "lucide-react";

/**
 * Sektör profillerinin ikon anahtarını (sector_profiles.icon) lucide bileşenine eşler.
 * Bilinmeyen anahtarlar Store ikonuna düşer; yeni sektör eklerken buraya anahtar eklemek yeterlidir.
 */
const SECTOR_ICONS: Record<string, LucideIcon> = {
  utensils: UtensilsCrossed,
  "utensils-crossed": UtensilsCrossed,
  cake: Cake,
  droplets: Droplets,
  flame: Flame,
  "spray-can": SprayCan,
  shirt: Shirt,
  car: Car,
  scissors: Scissors,
  wrench: Wrench,
  sparkles: Sparkles,
  "shopping-basket": ShoppingBasket,
  flower: Flower2,
  "calendar-clock": CalendarClock,
  boxes: Boxes,
  "paw-print": PawPrint,
  store: Store,
  blocks: Blocks,
};

export function SectorIcon({ name, className }: { name: string; className?: string }) {
  const Icon = SECTOR_ICONS[name.trim().toLowerCase()] ?? Store;
  return <Icon className={className} />;
}

/** Sipariş/iş emri modül anahtarlarının etiketleri (pannelde ve onboarding'de ortak). */
export const MODULE_LABELS: Record<string, string> = {
  crm: "CRM",
  catalog: "Katalog",
  menu: "Menü",
  orders: "Siparişler",
  statuses: "Durum Akışı",
  stock: "Stok",
  deposits: "Teminat",
  routes: "Rota / Teslimat",
  appointments: "Randevu",
  payments: "Tahsilat",
  qr: "QR Menü",
  contracts: "Sözleşmeler",
  priceLists: "Fiyat Listeleri",
  minOrderQty: "Min. Sipariş",
  customerGroups: "Müşteri Grupları",
  currentAccounts: "Cari Hesap",
  pets: "Evcil Kayıtları",
  vaccines: "Aşılama",
  pos: "POS",
  reservations: "Rezervasyon",
};

export function moduleLabel(key: string): string {
  return MODULE_LABELS[key] ?? key;
}
