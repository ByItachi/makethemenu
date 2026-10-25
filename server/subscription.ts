// Abonelik satın alma (checkout) uç noktası — /fiyatlar ve ana sayfa akışı.
// Tutarlar İSTEMCİDEN ALINMAZ; ortak plan kataloğundan sunucuda hesaplanır.
// Kart verisi SAKLANMAZ (yalnızca marka + son 4 hane). Demo ödeme sağlayıcısı
// olarak mock onay kullanılır; gerçek PSP (iyzico/PayTR) bağlanacağında burada
// tek değişiklik yeterlidir.
import type { Express, Request, Response } from "express";
import { z } from "zod";
import { db } from "./db";
import { subscriptionOrders } from "@shared/schema";
import { getPlan, computeTotals, type BillingCycle } from "@shared/plans";
import { writeAudit } from "./audit";

const checkoutSchema = z.object({
  planId: z.enum(["baslangic", "profesyonel"]),
  billingCycle: z.enum(["monthly", "annual"]),
  billing: z.object({
    companyName: z.string().trim().min(2, "Firma ünvanı gerekli").max(160),
    taxNo: z.string().trim().regex(/^\d{10,11}$/, "Vergi numarası 10-11 haneli olmalıdır"),
    taxOffice: z.string().trim().max(80).optional().default(""),
    address: z.string().trim().min(10, "Adres en az 10 karakter olmalıdır").max(500),
    email: z.string().trim().email("Geçerli bir e-posta gerekli"),
    phone: z.string().trim().max(20).optional().default(""),
  }),
  paymentMethod: z.enum(["card", "transfer"]).default("card"),
  card: z
    .object({
      holder: z.string().trim().min(2).max(80),
      number: z.string().regex(/^\d{13,19}$/, "Kart numarası 13-19 haneli olmalıdır"),
      expiry: z.string().regex(/^(0[1-9]|1[0-2])\/\d{2}$/, "Son kullanma AA/YY formatında olmalıdır"),
      cvv: z.string().regex(/^\d{3,4}$/, "CVV 3-4 haneli olmalıdır"),
    })
    .optional(),
});

function detectBrand(num: string): string {
  if (/^4/.test(num)) return "visa";
  if (/^5[1-5]/.test(num) || /^2[2-7]/.test(num)) return "mastercard";
  if (/^3[47]/.test(num)) return "amex";
  if (/^9792/.test(num)) return "troy";
  return "card";
}

function orderNo(): string {
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `SUB-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${rand}`;
}

function invoiceNo(): string {
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `FTR-${new Date().getFullYear()}-${rand}`;
}

export function registerSubscriptionCheckoutRoutes(app: Express) {
  app.post("/api/subscription-checkout", async (req: Request, res: Response) => {
    const parsed = checkoutSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: "Doğrulama hatası",
        details: parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
      });
    }
    const { planId, billingCycle, billing, paymentMethod, card } = parsed.data;

    const plan = getPlan(planId);
    if (!plan || plan.monthlyPrice == null) {
      return res.status(400).json({ error: "Bu plan çevrimiçi satın alınamaz. Kurumsal plan için iletişime geçin." });
    }
    if (paymentMethod === "card" && !card) {
      return res.status(400).json({ error: "Kart bilgileri eksik." });
    }

    // Tutar sunucuda hesaplanır — istemci değeri asla kullanılmaz.
    const { periodAmount, vat, total } = computeTotals(plan, billingCycle as BillingCycle);
    const no = orderNo();
    const inv = invoiceNo();

    try {
      await db.insert(subscriptionOrders).values({
        orderNo: no,
        planId,
        billingCycle,
        periodAmount: periodAmount.toFixed(2),
        vatAmount: vat.toFixed(2),
        totalAmount: total.toFixed(2),
        paymentMethod,
        billingInfo: billing,
        cardBrand: paymentMethod === "card" && card ? detectBrand(card.number) : null,
        cardLast4: paymentMethod === "card" && card ? card.number.slice(-4) : null,
        status: paymentMethod === "transfer" ? "pending_transfer" : "succeeded",
        invoiceNo: inv,
      });
    } catch (err) {
      console.error("subscription-checkout insert error:", err);
      return res.status(500).json({ error: "Sipariş kaydedilemedi. Lütfen tekrar deneyin." });
    }

    await writeAudit({
      action: "subscription.purchased",
      restaurantId: null,
      actorUserId: null,
      entity: "subscription_order",
      entityId: no,
      meta: { orderNo: no, planId, billingCycle, total, paymentMethod },
    }).catch(() => undefined);

    return res.status(201).json({
      orderNo: no,
      invoiceNo: inv,
      planId,
      planName: plan.name,
      billingCycle,
      periodAmount,
      vat,
      total,
      status: paymentMethod === "transfer" ? "pending_transfer" : "succeeded",
    });
  });
}
