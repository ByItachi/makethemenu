/**
 * iyzico adapter — real HTTP integration per the public REST docs (api.iyzipay.com).
 * Activated when PAYMENT_PROVIDER=iyzico and IYZICO_API_KEY / IYZICO_SECRET_KEY are present.
 * NOTE: request/response shapes follow the public docs but live verification requires a
 * merchant account; the adapter is exercised only against the iyzico sandbox in test mode.
 */
import { createHmac, randomBytes } from "crypto";
import { PaymentNotConfiguredError } from "../config";
import { WebhookSignatureError } from "../provider";
import type { ChargeRequest, ChargeResult, CheckoutRequest, CheckoutResult, PaymentProvider, ProviderEvent } from "../provider";

export interface IyzicoCredentials {
  apiKey: string;
  secretKey: string;
  baseUrl: string;
}

export function loadIyzicoCredentials(env: NodeJS.ProcessEnv = process.env): IyzicoCredentials | null {
  const apiKey = (env.IYZICO_API_KEY ?? "").trim();
  const secretKey = (env.IYZICO_SECRET_KEY ?? "").trim();
  if (!apiKey || !secretKey) return null;
  return { apiKey, secretKey, baseUrl: (env.IYZICO_BASE_URL ?? "https://sandbox-api.iyzipay.com").replace(/\/$/, "") };
}

/** Authorization: "IYZWSv2 apiKey:random:hmacSha256(secret, apiKey+random+body)" (base64). */
function authHeader(creds: IyzicoCredentials, body: string): { header: string; random: string } {
  const random = randomBytes(16).toString("hex");
  const mac = createHmac("sha256", creds.secretKey).update(creds.apiKey).update(random).update(body).digest("base64");
  return { header: `IYZWSv2 ${creds.apiKey}:${random}:${mac}`, random };
}

async function iyziCall<T>(creds: IyzicoCredentials, path: string, body: Record<string, unknown>): Promise<T> {
  const raw = JSON.stringify(body);
  const auth = authHeader(creds, raw);
  const res = await fetch(`${creds.baseUrl}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: auth.header, "X-IYZ-RND": auth.random },
    body: raw,
    signal: AbortSignal.timeout(30000),
  });
  const data: any = await res.json();
  if (!res.ok || (data?.status && data.status !== "success")) {
    throw new Error(data?.errorMessage ? `iyzico hatası: ${data.errorMessage}` : `iyzico hatası (HTTP ${res.status}).`);
  }
  return data as T;
}

export function createIyzicoProvider(creds: IyzicoCredentials, baseUrl: string): PaymentProvider {
  return {
    name: "iyzico",

    // 3DS payment form initialize; the response contains an HTML form that posts to iyzico.
    async createCheckout(req: CheckoutRequest): Promise<CheckoutResult> {
      const conversationId = `mtm-${req.paymentId}-${Date.now()}`;
      const data = await iyziCall<{ paymentPageUrl?: string; threeDSHTMLContent?: string }>(creds, "/v2/payment/threeds/initialize", {
        locale: "tr",
        conversationId,
        price: req.amount,
        paidPrice: req.amount,
        currency: req.currency,
        basketId: String(req.paymentId),
        paymentGroup: "PRODUCT",
        enabledInstallments: [1],
        callbackUrl: `${baseUrl}/odeme/basarili`,
        buyer: { id: `mtm-${req.paymentId}`, ip: "127.0.0.1", name: "mtm", surname: "abonelik", email: "billing@makethemenu.com" },
        basketItems: [{ id: String(req.paymentId), name: req.description.slice(0, 80), category1: "abonelik", itemType: "VIRTUAL", price: req.amount }],
      });
      const checkoutUrl = data.paymentPageUrl ?? `${baseUrl}/abonelik/odeme/iyzico/${conversationId}`;
      return { providerRef: conversationId, checkoutUrl };
    },

    checkoutUrl(providerRef: string): string {
      return `${baseUrl}/abonelik/odeme/iyzico/${providerRef}`;
    },

    // Saved-card charge via card token storage (cardUserKey + cardToken from a stored card).
    async charge(req: ChargeRequest): Promise<ChargeResult> {
      const [cardToken, cardUserKey] = req.token.split("|");
      if (!cardToken || !cardUserKey) {
        return { status: "failed", providerRef: `iyzi_charge_${req.idempotencyKey}`, reason: "iyzico_saved_card_required" };
      }
      try {
        await iyziCall(creds, "/v2/payment/auth", {
          locale: "tr",
          conversationId: req.idempotencyKey,
          price: req.amount,
          paidPrice: req.amount,
          currency: req.currency,
          installment: 1,
          paymentCard: { cardToken, cardUserKey },
        });
        return { status: "succeeded", providerRef: req.idempotencyKey };
      } catch (err) {
        return { status: "failed", providerRef: `iyzi_charge_${req.idempotencyKey}`, reason: err instanceof Error ? err.message.slice(0, 120) : "iyzico_error" };
      }
    },

    async refund(providerRef: string, amount: string) {
      await iyziCall(creds, "/v2/payment/refund", { paymentId: providerRef, price: amount, currency: "TRY", ip: "127.0.0.1" });
      return { ok: true };
    },

    // iyzico does not push standard webhooks in the basic integration; reject unverifiable calls.
    verifyWebhook(): ProviderEvent {
      throw new WebhookSignatureError("iyzico temel entegrasyonda webhook göndermez; ödemi durumları sorgulanarak alınır.");
    },
  };
}

export function assertIyzicoUsable(creds: IyzicoCredentials | null): void {
  if (!creds) throw new PaymentNotConfiguredError("IYZICO_API_KEY / IYZICO_SECRET_KEY yapılandırılmadı (hesap ve kimlik bilgisi gerekli).");
}
