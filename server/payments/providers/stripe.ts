/**
 * Stripe adapter — real HTTP integration against api.stripe.com (no SDK).
 * Activated when PAYMENT_PROVIDER=stripe and STRIPE_SECRET_KEY is present.
 * Live verification requires a Stripe account; unit tests cover only wiring.
 */
import { createHmac, timingSafeEqual } from "crypto";
import { PaymentNotConfiguredError } from "../config";
import {
  WEBHOOK_TOLERANCE_SEC,
  type ChargeRequest,
  type ChargeResult,
  type CheckoutRequest,
  type CheckoutResult,
  type PaymentProvider,
  type ProviderEvent,
} from "../provider";
import { WebhookSignatureError } from "../provider";

const API = "https://api.stripe.com";

export interface StripeCredentials {
  secretKey: string;
  webhookSecret: string | null;
}

export function loadStripeCredentials(env: NodeJS.ProcessEnv = process.env): StripeCredentials | null {
  const secretKey = (env.STRIPE_SECRET_KEY ?? "").trim();
  if (!secretKey) return null;
  return { secretKey, webhookSecret: (env.STRIPE_WEBHOOK_SECRET ?? "").trim() || null };
}

async function stripeCall<T>(key: string, path: string, params: Record<string, string>, idempotencyKey?: string): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/x-www-form-urlencoded",
      ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
    },
    body: new URLSearchParams(params),
    signal: AbortSignal.timeout(30000),
  });
  const data: any = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.message ? `Stripe hatası: ${data.error.message}` : `Stripe hatası (HTTP ${res.status}).`);
  }
  return data as T;
}

function toMinor(amount: string): string {
  // "299.00" → "29900" (kuruş)
  const [whole = "0", frac = "0"] = amount.split(".");
  return String(Number(whole) * 100 + Number((frac + "00").slice(0, 2)));
}

export function createStripeProvider(creds: StripeCredentials, baseUrl: string): PaymentProvider {
  const key = creds.secretKey;
  return {
    name: "stripe",

    async createCheckout(req: CheckoutRequest): Promise<CheckoutResult> {
      const session = await stripeCall<{ id: string; url: string }>(key, "/v1/checkout/sessions", {
        mode: "payment",
        client_reference_id: String(req.paymentId),
        "metadata[paymentId]": String(req.paymentId),
        "metadata[idempotencyKey]": req.idempotencyKey,
        "line_items[0][quantity]": "1",
        "line_items[0][price_data][currency]": req.currency.toLowerCase(),
        "line_items[0][price_data][unit_amount]": toMinor(req.amount),
        "line_items[0][price_data][product_data][name]": req.description.slice(0, 120),
        success_url: `${baseUrl}/odeme/basarili?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/odeme/basarisiz`,
      }, `checkout-${req.idempotencyKey}`);
      return { providerRef: session.id, checkoutUrl: session.url };
    },

    // Stripe hosted URLs are not derivable from the ref; recovery re-runs createCheckout
    // with the same idempotency key instead. An empty redirectUrl signals "contact support".
    checkoutUrl(): string {
      return "";
    },

    async charge(req: ChargeRequest): Promise<ChargeResult> {
      // Reusable cards require a saved PaymentMethod + Customer ("pm_...|cus_...").
      const [pm, customer] = req.token.split("|");
      if (!pm?.startsWith("pm_") || !customer?.startsWith("cus_")) {
        return { status: "failed", providerRef: `stripe_charge_${req.idempotencyKey}`, reason: "stripe_saved_payment_method_required" };
      }
      try {
        const intent = await stripeCall<{ id: string; status: string }>(key, "/v1/payment_intents", {
          amount: toMinor(req.amount),
          currency: req.currency.toLowerCase(),
          payment_method: pm,
          customer,
          confirm: "true",
          off_session: "true",
        }, `charge-${req.idempotencyKey}`);
        return { status: intent.status === "succeeded" ? "succeeded" : "failed", providerRef: intent.id, reason: intent.status !== "succeeded" ? intent.status : undefined };
      } catch (err) {
        return { status: "failed", providerRef: `stripe_charge_${req.idempotencyKey}`, reason: err instanceof Error ? err.message.slice(0, 120) : "stripe_error" };
      }
    },

    async refund(providerRef: string, amount: string) {
      await stripeCall(key, "/v1/refunds", { payment_intent: providerRef, amount: toMinor(amount) });
      return { ok: true };
    },

    // Stripe-Signature: "t=<unix>,v1=<hmac-sha256(t.body)>". Matches the shared scheme.
    verifyWebhook(rawBody, signatureHeader, secret, nowSec = Math.floor(Date.now() / 1000)): ProviderEvent {
      if (!signatureHeader) throw new WebhookSignatureError("İmza başlığı eksik.");
      const parts = Object.fromEntries(signatureHeader.split(",").map((p) => p.trim().split("=") as [string, string]));
      const t = Number(parts.t);
      const v1 = parts.v1 ?? "";
      if (!Number.isFinite(t) || !/^[0-9a-f]{64}$/.test(v1)) throw new WebhookSignatureError("İmza biçimi geçersiz.");
      if (Math.abs(nowSec - t) > WEBHOOK_TOLERANCE_SEC) throw new WebhookSignatureError("İmza zaman aşımına uğramış.");
      const expected = createHmac("sha256", secret).update(`${t}.`).update(rawBody).digest("hex");
      const a = Buffer.from(expected, "hex");
      const b = Buffer.from(v1, "hex");
      if (a.length !== b.length || !timingSafeEqual(a, b)) throw new WebhookSignatureError("İmza doğrulanamadı.");

      let evt: any;
      try {
        evt = JSON.parse(rawBody.toString("utf8"));
      } catch {
        throw new WebhookSignatureError("Gövde JSON değil.");
      }
      const id = typeof evt?.id === "string" ? evt.id : `evt_${t}`;
      const type = evt?.type as string;
      const obj = evt?.data?.object ?? {};
      const providerRef = String(obj.payment_intent ?? obj.id ?? "");
      if (type === "checkout.session.completed" || type === "payment_intent.succeeded") {
        return { id, type: "payment.succeeded", providerRef, card: obj.last4 ? { token: "stripe", brand: "card", last4: String(obj.last4) } : undefined };
      }
      if (type === "payment_intent.payment_failed" || type === "checkout.session.expired") {
        return { id, type: "payment.failed", providerRef, reason: String(obj.last_payment_error?.message ?? type).slice(0, 120) };
      }
      throw new WebhookSignatureError("Desteklenmeyen olay türü.");
    },
  };
}

export function assertStripeUsable(creds: StripeCredentials | null): void {
  if (!creds) throw new PaymentNotConfiguredError("STRIPE_SECRET_KEY yapılandırılmadı (hesap ve kimlik bilgisi gerekli).");
}
