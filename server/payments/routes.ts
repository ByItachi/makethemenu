import type { Express, Request, Response, NextFunction } from "express";
import { desc, eq, sql } from "drizzle-orm";
import { randomBytes, randomUUID } from "crypto";
import { z } from "zod";
import { db } from "../db";
import { coupons, payments } from "@shared/schema";
import { requireRestaurant, tenantId } from "../auth/middleware";
import { writeAudit } from "../audit";
import { loadPaymentConfig, isMockTestMode, PaymentNotConfiguredError, type PaymentConfig } from "./config";
import { signPayload, SIGNATURE_HEADER } from "./provider";
import {
  changePlan,
  deletePaymentMethod,
  getOverview,
  handleWebhook,
  listPaymentMethods,
  listPayments,
  quote,
  refundPayment,
  setCancelAtPeriodEnd,
  setDefaultPaymentMethod,
  startCheckout,
} from "./billing";

type Handler = (req: Request, res: Response) => Promise<unknown>;

/** Maps typed billing/provider errors to JSON responses; everything else goes to the global error handler. */
function route(fn: Handler) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res).catch((err: any) => {
      if (typeof err?.status === "number" && typeof err?.code === "string") {
        return res.status(err.status).json({ message: err.message, code: err.code });
      }
      next(err);
    });
  };
}

const interval = z.enum(["monthly", "yearly"]);
const checkoutSchema = z.object({ planCode: z.string().trim().min(1).max(32), interval, couponCode: z.string().trim().max(32).optional() });
const changeSchema = z.object({ planCode: z.string().trim().min(1).max(32), interval });
const couponSchema = z
  .object({
    code: z.string().trim().toUpperCase().regex(/^[A-Z0-9_-]{3,32}$/, "Kupon kodu 3-32 karakter: harf, rakam, - veya _"),
    percentOff: z.number().int().min(1).max(100).nullable().optional(),
    amountOff: z.number().min(0.01).max(1_000_000).nullable().optional(),
    validDays: z.number().int().min(1).max(3650).nullable().optional(),
    maxRedemptions: z.number().int().min(1).max(1_000_000).nullable().optional(),
  })
  .refine((d) => (d.percentOff ?? null) !== null !== ((d.amountOff ?? null) !== null), {
    message: "Yüzde veya tutar indirimi seçin (ikisi birden olamaz).",
  });

function ok(res: Response, body: unknown) {
  return res.json(body);
}

function badInput(res: Response, message: string) {
  return res.status(400).json({ message, code: "BAD_INPUT" });
}

/** Tenant-scoped billing endpoints (owner-only actions are enforced in billing.ts). */
export function registerBillingRoutes(app: Express) {
  const cfg = loadPaymentConfig();

  app.get("/api/billing/config", (_req, res) => {
    ok(res, { mode: cfg.mode, provider: cfg.provider, testMode: isMockTestMode(cfg), configured: cfg.provider !== "none" && (cfg.provider !== "mock" || !!cfg.webhookSecret) });
  });

  app.get("/api/billing/overview", requireRestaurant, route(async (req, res) => ok(res, await getOverview(tenantId(req)))));

  app.get("/api/billing/history", requireRestaurant, route(async (req, res) => ok(res, await listPayments(tenantId(req)))));

  app.post(
    "/api/billing/quote",
    requireRestaurant,
    route(async (req, res) => {
      const p = checkoutSchema.safeParse(req.body);
      if (!p.success) return badInput(res, p.error.errors[0].message);
      const q = await quote({ planCode: p.data.planCode, interval: p.data.interval, couponCode: p.data.couponCode });
      ok(res, { planCode: q.plan.code, interval: q.interval, subtotal: q.subtotal / 100, discount: q.discount / 100, amount: q.amount / 100, taxAmount: q.taxAmount / 100, currency: "TRY" });
    }),
  );

  app.post(
    "/api/billing/checkout",
    requireRestaurant,
    route(async (req, res) => {
      const p = checkoutSchema.safeParse(req.body);
      if (!p.success) return badInput(res, p.error.errors[0].message);
      const session = await startCheckout({
        restaurantId: tenantId(req),
        userId: req.auth!.userId,
        planCode: p.data.planCode,
        interval: p.data.interval,
        couponCode: p.data.couponCode,
        kind: "subscription",
        idempotencyKey: req.header("Idempotency-Key"),
        cfg,
      });
      ok(res, session);
    }),
  );

  app.post(
    "/api/billing/change-plan",
    requireRestaurant,
    route(async (req, res) => {
      const p = changeSchema.safeParse(req.body);
      if (!p.success) return badInput(res, p.error.errors[0].message);
      ok(res, await changePlan({ restaurantId: tenantId(req), userId: req.auth!.userId, planCode: p.data.planCode, interval: p.data.interval, cfg }));
    }),
  );

  app.post("/api/billing/cancel", requireRestaurant, route(async (req, res) => ok(res, await setCancelAtPeriodEnd(tenantId(req), req.auth!.userId, true))));
  app.post("/api/billing/resume", requireRestaurant, route(async (req, res) => ok(res, await setCancelAtPeriodEnd(tenantId(req), req.auth!.userId, false))));

  app.get("/api/billing/payment-methods", requireRestaurant, route(async (req, res) => ok(res, await listPaymentMethods(tenantId(req), req.auth!.userId))));
  app.post(
    "/api/billing/payment-methods/:id/default",
    requireRestaurant,
    route(async (req, res) => {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) return badInput(res, "Geçersiz ödeme yöntemi.");
      ok(res, await setDefaultPaymentMethod(tenantId(req), req.auth!.userId, id));
    }),
  );
  app.delete(
    "/api/billing/payment-methods/:id",
    requireRestaurant,
    route(async (req, res) => {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) return badInput(res, "Geçersiz ödeme yöntemi.");
      ok(res, await deletePaymentMethod(tenantId(req), req.auth!.userId, id));
    }),
  );

  // Provider webhook: no session. Authenticity comes only from the HMAC signature over the raw body.
  app.post(
    "/api/billing/webhook",
    route(async (req, res) => {
      const raw = req.rawBody;
      if (!Buffer.isBuffer(raw)) return res.status(400).json({ message: "Gövde okunamadı.", code: "BAD_BODY" });
      const result = await handleWebhook(raw, req.header(SIGNATURE_HEADER), cfg);
      ok(res, { received: true, duplicate: result.duplicate });
    }),
  );

  if (isMockTestMode(cfg)) registerTestModeRoutes(app, cfg);
}

/**
 * Test mode only: a stand-in for the provider's hosted payment page. Completing it sends a SIGNED webhook
 * through the normal verification path, so the same code runs as with a real provider.
 */
function registerTestModeRoutes(app: Express, cfg: PaymentConfig) {
  app.get(
    "/api/billing/test/session/:ref",
    route(async (req, res) => {
      const ref = String(req.params.ref);
      if (!/^mock_[a-f0-9]{24}$/.test(ref)) return res.status(404).json({ message: "Oturum bulunamadı." });
      const [p] = await db.select().from(payments).where(eq(payments.providerRef, ref));
      if (!p) return res.status(404).json({ message: "Oturum bulunamadı." });
      ok(res, { planCode: p.planCode, interval: p.interval, amount: Number(p.amount), taxAmount: Number(p.taxAmount), currency: p.currency, status: p.status });
    }),
  );

  app.post(
    "/api/billing/test/complete",
    requireRestaurant,
    route(async (req, res) => {
      const body = z.object({ ref: z.string().regex(/^mock_[a-f0-9]{24}$/), outcome: z.enum(["success", "fail", "success_declining_renewals"]) }).safeParse(req.body);
      if (!body.success) return badInput(res, "Geçersiz istek.");
      if (!cfg.webhookSecret) throw new PaymentNotConfiguredError("PAYMENT_WEBHOOK_SECRET tanımlı değil.");
      const [p] = await db.select().from(payments).where(eq(payments.providerRef, body.data.ref));
      if (!p || p.restaurantId !== tenantId(req)) return res.status(404).json({ message: "Oturum bulunamadı." });

      const event =
        body.data.outcome === "fail"
          ? { id: `evt_${randomUUID()}`, type: "payment.failed", providerRef: body.data.ref, reason: "card_declined" }
          : {
              id: `evt_${randomUUID()}`,
              type: "payment.succeeded",
              providerRef: body.data.ref,
              card: {
                token: `mock_tok_${body.data.outcome === "success" ? "4242" : "0002"}_${randomBytes(8).toString("hex")}`,
                brand: "TEST VISA",
                last4: body.data.outcome === "success" ? "4242" : "0002",
              },
            };
      const raw = Buffer.from(JSON.stringify(event));
      const sig = signPayload(cfg.webhookSecret, raw, Math.floor(Date.now() / 1000));
      const result = await handleWebhook(raw, sig, cfg);
      ok(res, { received: true, duplicate: result.duplicate, outcome: body.data.outcome });
    }),
  );
}

/** Platform admin endpoints. Mounted behind requirePlatformAdmin by the caller. */
export function registerAdminBillingRoutes(app: Express) {
  app.get("/api/admin/payments", async (_req, res) => {
    const rows = await db
      .select({
        id: payments.id,
        restaurantId: payments.restaurantId,
        kind: payments.kind,
        planCode: payments.planCode,
        interval: payments.interval,
        amount: payments.amount,
        taxAmount: payments.taxAmount,
        status: payments.status,
        provider: payments.provider,
        invoiceNo: payments.invoiceNo,
        failureReason: payments.failureReason,
        attempts: payments.attempts,
        createdAt: payments.createdAt,
      })
      .from(payments)
      .orderBy(desc(payments.id))
      .limit(200);
    res.json(rows);
  });

  app.post(
    "/api/admin/payments/:id/refund",
    route(async (req, res) => {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) return badInput(res, "Geçersiz ödeme.");
      ok(res, await refundPayment(id, req.auth!.userId));
    }),
  );

  app.get("/api/admin/coupons", async (_req, res) => {
    res.json(await db.select().from(coupons).orderBy(desc(coupons.id)).limit(200));
  });

  app.post(
    "/api/admin/coupons",
    route(async (req, res) => {
      const p = couponSchema.safeParse(req.body);
      if (!p.success) return badInput(res, p.error.errors[0].message);
      const d = p.data;
      try {
        const [ins] = await db.insert(coupons).values({
          code: d.code,
          percentOff: d.percentOff ?? null,
          amountOff: d.amountOff != null ? d.amountOff.toFixed(2) : null,
          validUntil: d.validDays ? sql`DATE_ADD(NOW(), INTERVAL ${d.validDays} DAY)` : null,
          maxRedemptions: d.maxRedemptions ?? null,
        });
        await writeAudit({ restaurantId: null, actorUserId: req.auth!.userId, action: "admin.coupon_create", entity: "coupon", entityId: String(ins.insertId), req, meta: { code: d.code } });
        return res.status(201).json({ id: ins.insertId, code: d.code });
      } catch (err: any) {
        if (err?.code === "ER_DUP_ENTRY") return res.status(409).json({ message: "Bu kupon kodu zaten var.", code: "DUPLICATE" });
        throw err;
      }
    }),
  );

  app.patch(
    "/api/admin/coupons/:id",
    route(async (req, res) => {
      const id = Number(req.params.id);
      const body = z.object({ isActive: z.boolean() }).safeParse(req.body);
      if (!Number.isInteger(id) || !body.success) return badInput(res, "Geçersiz istek.");
      await db.update(coupons).set({ isActive: body.data.isActive }).where(eq(coupons.id, id));
      await writeAudit({ restaurantId: null, actorUserId: req.auth!.userId, action: "admin.coupon_update", entity: "coupon", entityId: String(id), req, meta: { isActive: body.data.isActive } });
      res.json({ id, isActive: body.data.isActive });
    }),
  );
}
