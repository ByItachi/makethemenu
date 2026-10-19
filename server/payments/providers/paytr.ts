/**
 * PayTR adapter — real HTTP integration per the public docs (www.paytr.com).
 * Activated when PAYMENT_PROVIDER=paytr and PAYTR_MERCHANT_ID / PAYTR_MERCHANT_KEY /
 * PAYTR_MERCHANT_SALT are present. Live verification requires a merchant account.
 */
import { createHmac } from "crypto";
import { PaymentNotConfiguredError } from "../config";
import { WebhookSignatureError } from "../provider";
import type { ChargeRequest, ChargeResult, CheckoutRequest, CheckoutResult, PaymentProvider, ProviderEvent } from "../provider";

export interface PaytrCredentials {
  merchantId: string;
  merchantKey: string;
  merchantSalt: string;
  testMode: boolean;
}

export function loadPaytrCredentials(env: NodeJS.ProcessEnv = process.env): PaytrCredentials | null {
  const merchantId = (env.PAYTR_MERCHANT_ID ?? "").trim();
  const merchantKey = (env.PAYTR_MERCHANT_KEY ?? "").trim();
  const merchantSalt = (env.PAYTR_MERCHANT_SALT ?? "").trim();
  if (!merchantId || !merchantKey || !merchantSalt) return null;
  return { merchantId, merchantKey, merchantSalt, testMode: (env.PAYMENT_MODE ?? "test") !== "live" };
}

const API = "https://www.paytr.com";

export function createPaytrProvider(creds: PaytrCredentials, baseUrl: string): PaymentProvider {
  const hmac = (input: string) => createHmac("sha256", creds.merchantKey).update(input).digest("base64");

  return {
    name: "paytr",

    // iframe token flow: hash_str = HMAC(key, salt+email+amount(int kuruş)+oid+ip+no_installment+max_installment+currency+test_mode)
    async createCheckout(req: CheckoutRequest): Promise<CheckoutResult> {
      const merchantOid = `MTM${req.paymentId}_${Date.now()}`;
      const kurus = Number(req.amount.split(".")[0]) * 100 + Number((req.amount.split(".")[1] ?? "0").padEnd(2, "0").slice(0, 2));
      const email = "billing@makethemenu.com";
      const userIp = "127.0.0.1";
      const tokenHash = hmac(`${creds.merchantSalt}${email}${kurus}${merchantOid}${userIp}0${"0"}TRY${creds.testMode ? "1" : "0"}`);
      const res = await fetch(`${API}/odeme/api/get-token`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          merchant_id: creds.merchantId,
          user_ip: userIp,
          merchant_oid: merchantOid,
          email,
          payment_amount: String(kurus),
          currency: "TRY",
          test_mode: creds.testMode ? "1" : "0",
          no_installment: "0",
          max_installment: "0",
          paytr_token: tokenHash,
          user_name: req.description.slice(0, 60),
        }),
        signal: AbortSignal.timeout(30000),
      });
      const data: any = await res.json();
      if (data?.status !== "success") throw new Error(`PayTR hatası: ${data?.reason ?? res.status}`);
      return { providerRef: merchantOid, checkoutUrl: `${API}/odeme/guvenli-asama/${data.token}` };
    },

    checkoutUrl(providerRef: string): string {
      return `${API}/odeme/guvenli-asama/${providerRef}`;
    },

    // Card storage is a separate PayTR add-on; without it recurring charges are refused.
    async charge(req: ChargeRequest): Promise<ChargeResult> {
      void req;
      return { status: "failed", providerRef: `paytr_charge_${req.idempotencyKey}`, reason: "paytr_card_storage_addon_required" };
    },

    async refund(providerRef: string, amount: string) {
      const kurus = Number(amount.split(".")[0]) * 100 + Number((amount.split(".")[1] ?? "0").padEnd(2, "0").slice(0, 2));
      const res = await fetch(`${API}/odeme/iade`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          merchant_id: creds.merchantId,
          merchant_oid: providerRef,
          iade_amount: String(kurus),
          iade_reason: "abonelik iptali",
          paytr_token: hmac(`${creds.merchantSalt}${providerRef}${kurus}`),
        }),
        signal: AbortSignal.timeout(30000),
      });
      const data: any = await res.json();
      if (data?.status !== "success") throw new Error(`PayTR iade hatası: ${data?.reason ?? res.status}`);
      return { ok: true };
    },

    // Webhook: POST form with hash = HMAC(key, salt+oid+status+total_amount)
    verifyWebhook(rawBody, signatureHeader, _secret, _nowSec): ProviderEvent {
      void signatureHeader;
      void _secret;
      void _nowSec;
      let params: URLSearchParams;
      try {
        params = new URLSearchParams(rawBody.toString("utf8"));
      } catch {
        throw new WebhookSignatureError("Gövde form verisi değil.");
      }
      const oid = params.get("merchant_oid") ?? "";
      const status = params.get("status") ?? "";
      const total = params.get("total_amount") ?? "";
      const hash = params.get("hash") ?? "";
      const expected = createHmac("sha256", creds.merchantKey).update(`${creds.merchantSalt}${oid}${status}${total}`).digest("base64");
      if (!oid || hash !== expected) throw new WebhookSignatureError("İmza doğrulanamadı.");
      const id = `paytr_${oid}`;
      if (status === "success") return { id, type: "payment.succeeded", providerRef: oid };
      return { id, type: "payment.failed", providerRef: oid, reason: status || "paytr_failed" };
    },
  };
}

export function assertPaytrUsable(creds: PaytrCredentials | null): void {
  if (!creds) throw new PaymentNotConfiguredError("PAYTR_MERCHANT_ID / PAYTR_MERCHANT_KEY / PAYTR_MERCHANT_SALT yapılandırılmadı (hesap ve kimlik bilgisi gerekli).");
}
