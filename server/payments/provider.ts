import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { PaymentNotConfiguredError, type PaymentConfig } from "./config";
import { createStripeProvider, loadStripeCredentials } from "./providers/stripe";
import { createIyzicoProvider, loadIyzicoCredentials } from "./providers/iyzico";
import { createPaytrProvider, loadPaytrCredentials } from "./providers/paytr";

export interface CheckoutRequest {
  paymentId: number;
  amount: string; // "299.00"
  currency: string;
  description: string;
  idempotencyKey: string;
}
export interface CheckoutResult {
  providerRef: string;
  checkoutUrl: string;
}
export interface CardInfo {
  token: string; // provider-side reusable token; never a card number
  brand: string;
  last4: string;
}
export interface ChargeRequest {
  token: string;
  amount: string;
  currency: string;
  idempotencyKey: string;
}
export interface ChargeResult {
  status: "succeeded" | "failed";
  providerRef: string;
  reason?: string;
}
export type ProviderEvent =
  | { id: string; type: "payment.succeeded"; providerRef: string; card?: CardInfo }
  | { id: string; type: "payment.failed"; providerRef: string; reason: string };

export interface PaymentProvider {
  readonly name: string;
  createCheckout(req: CheckoutRequest): Promise<CheckoutResult>;
  checkoutUrl(providerRef: string): string;
  charge(req: ChargeRequest): Promise<ChargeResult>;
  refund(providerRef: string, amount: string): Promise<{ ok: boolean }>;
  /** Verifies the signature and freshness of a webhook body and returns the parsed event. Throws on failure. */
  verifyWebhook(rawBody: Buffer, signatureHeader: string | undefined, secret: string, nowSec?: number): ProviderEvent;
}

export const WEBHOOK_TOLERANCE_SEC = 300;
export const SIGNATURE_HEADER = "x-payment-signature";

/** Signature format: "t=<unix seconds>,v1=<hex HMAC-SHA256 of "<t>.<rawBody>">". */
export function signPayload(secret: string, rawBody: Buffer | string, timestampSec: number): string {
  const body = typeof rawBody === "string" ? Buffer.from(rawBody) : rawBody;
  const mac = createHmac("sha256", secret).update(`${timestampSec}.`).update(body).digest("hex");
  return `t=${timestampSec},v1=${mac}`;
}

export class WebhookSignatureError extends Error {
  status = 401;
  code = "BAD_SIGNATURE";
  constructor(message: string) {
    super(message);
  }
}

function parseEvent(raw: Buffer): ProviderEvent {
  let data: any;
  try {
    data = JSON.parse(raw.toString("utf8"));
  } catch {
    throw new WebhookSignatureError("Gövde JSON değil.");
  }
  if (typeof data?.id !== "string" || typeof data?.type !== "string" || typeof data?.providerRef !== "string") {
    throw new WebhookSignatureError("Geçersiz olay biçimi.");
  }
  if (data.type === "payment.succeeded") return data as ProviderEvent;
  if (data.type === "payment.failed") return { ...data, reason: String(data.reason ?? "unknown").slice(0, 120) } as ProviderEvent;
  throw new WebhookSignatureError("Desteklenmeyen olay türü.");
}

function verifySignature(rawBody: Buffer, header: string | undefined, secret: string, nowSec: number): void {
  if (!header) throw new WebhookSignatureError("İmza başlığı eksik.");
  const parts = Object.fromEntries(header.split(",").map((p) => p.trim().split("=") as [string, string]));
  const t = Number(parts.t);
  const v1 = parts.v1 ?? "";
  if (!Number.isFinite(t) || !/^[0-9a-f]{64}$/.test(v1)) throw new WebhookSignatureError("İmza biçimi geçersiz.");
  if (Math.abs(nowSec - t) > WEBHOOK_TOLERANCE_SEC) throw new WebhookSignatureError("İmza zaman aşımına uğramış (tekrar oynatma olabilir).");
  const expected = Buffer.from(signPayload(secret, rawBody, t).split("v1=")[1], "hex");
  const given = Buffer.from(v1, "hex");
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) throw new WebhookSignatureError("İmza doğrulanamadı.");
}

/**
 * Test-mode provider. It behaves like a hosted payment page: the checkout URL is a test page,
 * and completing it produces a SIGNED webhook that goes through the same verification path as live providers.
 * Cards: last4 "4242" succeeds; a token containing "_0002_" declines renewals.
 */
export function createMockProvider(baseUrl: string): PaymentProvider {
  return {
    name: "mock",
    async createCheckout() {
      const providerRef = `mock_${randomBytes(12).toString("hex")}`;
      return { providerRef, checkoutUrl: `${baseUrl}/odeme/test?ref=${providerRef}` };
    },
    checkoutUrl(providerRef: string) {
      return `${baseUrl}/odeme/test?ref=${providerRef}`;
    },
    async charge(req: ChargeRequest) {
      const providerRef = `mock_chg_${randomBytes(10).toString("hex")}`;
      if (req.token.includes("_0002_")) return { status: "failed", providerRef, reason: "card_declined" };
      return { status: "succeeded", providerRef };
    },
    async refund() {
      return { ok: true };
    },
    verifyWebhook(rawBody, header, secret, nowSec = Math.floor(Date.now() / 1000)) {
      verifySignature(rawBody, header, secret, nowSec);
      return parseEvent(rawBody);
    },
  };
}

/** Placeholder for providers whose accounts/adapters are not set up. Every call refuses; nothing is charged. */
export function createUnavailableProvider(name: string): PaymentProvider {
  const fail = (): never => {
    throw new PaymentNotConfiguredError(`${name} entegrasyonu bu ortamda yapılandırılmadı (hesap ve kimlik bilgisi gerekli).`);
  };
  return {
    name,
    async createCheckout() {
      return fail();
    },
    checkoutUrl() {
      return fail();
    },
    async charge() {
      return fail();
    },
    async refund() {
      return fail();
    },
    verifyWebhook() {
      return fail();
    },
  };
}

/** Returns the active provider, or throws PaymentNotConfiguredError when payments cannot be processed. */
export function resolveProvider(cfg: PaymentConfig, baseUrl: string): PaymentProvider {
  if (cfg.provider === "none") throw new PaymentNotConfiguredError("Ödeme sağlayıcısı tanımlı değil (PAYMENT_PROVIDER).");
  if (cfg.provider === "mock") {
    if (!cfg.webhookSecret) throw new PaymentNotConfiguredError("PAYMENT_WEBHOOK_SECRET en az 32 karakter olmalı.");
    return createMockProvider(baseUrl);
  }
  // Real adapters activate only when their credentials are configured; otherwise they
  // refuse (nothing is ever charged without a merchant account).
  if (cfg.provider === "stripe") {
    const creds = loadStripeCredentials();
    if (creds) return createStripeProvider(creds, baseUrl);
  } else if (cfg.provider === "iyzico") {
    const creds = loadIyzicoCredentials();
    if (creds) return createIyzicoProvider(creds, baseUrl);
  } else if (cfg.provider === "paytr") {
    const creds = loadPaytrCredentials();
    if (creds) return createPaytrProvider(creds, baseUrl);
  }
  return createUnavailableProvider(cfg.provider);
}
