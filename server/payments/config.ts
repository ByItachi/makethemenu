// Payment configuration. Test and live are separated: live mode refuses to start with a test-only provider.
import { loadStripeCredentials } from "./providers/stripe";
import { loadIyzicoCredentials } from "./providers/iyzico";
import { loadPaytrCredentials } from "./providers/paytr";

export const PAYMENT_PROVIDERS = ["none", "mock", "iyzico", "paytr", "stripe"] as const;
export type PaymentProviderName = (typeof PAYMENT_PROVIDERS)[number];
export type PaymentMode = "test" | "live";

export interface PaymentConfig {
  provider: PaymentProviderName;
  mode: PaymentMode;
  /** Shared secret for webhook signatures. Null when not configured (webhooks and checkout are refused). */
  webhookSecret: string | null;
}

/** Raised when a provider is selected but not usable (missing credentials, adapter not available). Maps to HTTP 503. */
export class PaymentNotConfiguredError extends Error {
  status = 503;
  code = "PAYMENT_NOT_CONFIGURED";
  constructor(message = "Ödeme sağlayıcısı yapılandırılmadı.") {
    super(message);
  }
}

export function loadPaymentConfig(env: NodeJS.ProcessEnv = process.env): PaymentConfig {
  const provider = (env.PAYMENT_PROVIDER ?? "none").trim().toLowerCase() as PaymentProviderName;
  if (!PAYMENT_PROVIDERS.includes(provider)) throw new Error(`PAYMENT_PROVIDER geçersiz: ${provider}`);
  const mode = (env.PAYMENT_MODE ?? "test").trim().toLowerCase() as PaymentMode;
  if (mode !== "test" && mode !== "live") throw new Error("PAYMENT_MODE yalnızca test veya live olabilir.");

  if (mode === "live" && provider === "mock") {
    throw new Error("PAYMENT_MODE=live iken test sağlayıcısı (mock) kullanılamaz.");
  }
  if (mode === "live" && provider === "stripe" && !loadStripeCredentials(env)) {
    throw new Error("PAYMENT_MODE=live için STRIPE_SECRET_KEY gerekli.");
  }
  if (mode === "live" && provider === "iyzico" && !loadIyzicoCredentials(env)) {
    throw new Error("PAYMENT_MODE=live için IYZICO_API_KEY / IYZICO_SECRET_KEY gerekli.");
  }
  if (mode === "live" && provider === "paytr" && !loadPaytrCredentials(env)) {
    throw new Error("PAYMENT_MODE=live için PAYTR_MERCHANT_ID / PAYTR_MERCHANT_KEY / PAYTR_MERCHANT_SALT gerekli.");
  }

  const secret = (env.PAYMENT_WEBHOOK_SECRET ?? "").trim();
  return { provider, mode, webhookSecret: secret.length >= 32 ? secret : null };
}

/** Test-mode hosted checkout simulator is available only for the mock provider in test mode. */
export function isMockTestMode(cfg: PaymentConfig): boolean {
  return cfg.provider === "mock" && cfg.mode === "test";
}
