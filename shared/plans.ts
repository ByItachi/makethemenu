/**
 * Merkezi abonelik planı kataloğu — /fiyatlar, ana sayfa fiyat bölümü ve
 * /checkout ödeme akışı bu tanımdan beslenir. Fiyatlar tek noktadan yönetilir;
 * sunucu tarafı doğrulama da aynı tabloyu kullanır (server/subscription.ts).
 */
export type PlanId = "baslangic" | "profesyonel" | "kurumsal";
export type BillingCycle = "monthly" | "annual";

export interface PlanDef {
  id: PlanId;
  name: string;
  /** Aylık fiyat, KDV hariç (TL). Kurumsal plan özel tekliftir (null). */
  monthlyPrice: number | null;
  desc: string;
  features: string[];
  cta: string;
  highlight: boolean;
  /** Kurumsal gibi özel teklif planları satın alamaz; iletişime yönlendirilir. */
  purchasable: boolean;
}

export const ANNUAL_DISCOUNT_RATE = 0.2; // Yıllık ödemede %20 indirim
export const VAT_RATE = 0.2; // KDV %20

export const PLANS: PlanDef[] = [
  {
    id: "baslangic",
    name: "Başlangıç",
    monthlyPrice: 199,
    desc: "Küçük kafeler ve büfeler için ideal.",
    features: [
      "Tek Cihaz",
      "Sınırsız Ürün & Kategori",
      "Basit Raporlama",
      "E-posta Desteği",
    ],
    cta: "Hemen Başla",
    highlight: false,
    purchasable: true,
  },
  {
    id: "profesyonel",
    name: "Profesyonel",
    monthlyPrice: 349,
    desc: "Büyüyen restoranlar için tam çözüm.",
    features: [
      "3 Cihaza Kadar",
      "Stok & Reçete Takibi",
      "Masa Yönetimi",
      "Gelişmiş Raporlar",
      "7/24 Telefon Desteği",
      "Mutfak Ekranı (KDS)",
    ],
    cta: "En Popüler Seçim",
    highlight: true,
    purchasable: true,
  },
  {
    id: "kurumsal",
    name: "Kurumsal",
    monthlyPrice: null,
    desc: "Zincir işletmeler ve büyük restoranlar.",
    features: [
      "Sınırsız Cihaz",
      "Şube Yönetimi",
      "API Erişimi",
      "Özel Entegrasyonlar",
      "Özel Müşteri Temsilcisi",
      "ERP Entegrasyonu",
    ],
    cta: "İletişime Geç",
    highlight: false,
    purchasable: false,
  },
];

export function getPlan(id: string | null | undefined): PlanDef | undefined {
  return PLANS.find((p) => p.id === id);
}

/** Sunucu ve istemcinin ortak kullandığı tutar hesabı (KDV hariç taban + KDV). */
export function computeTotals(plan: PlanDef, cycle: BillingCycle) {
  const base = plan.monthlyPrice ?? 0;
  const monthly = base;
  const periodAmount =
    cycle === "annual" ? Math.round(base * 12 * (1 - ANNUAL_DISCOUNT_RATE)) : base;
  const vat = Math.round(periodAmount * VAT_RATE * 100) / 100;
  const total = Math.round((periodAmount + vat) * 100) / 100;
  return { monthly, periodAmount, vat, total };
}
