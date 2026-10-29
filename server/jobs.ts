import { processOutbox } from "./email/worker";
import { getMailTransport } from "./email";
import { processSmsOutbox } from "./sms/outbox";
import { getSmsTransport } from "./sms";
import { cleanupExpiredOtp } from "./sms/otp";
import { reapExpiredGatewayJobs } from "./sms/gateway";
import { hydrateSmsConfig } from "./sms/settings";
import { loadPaymentConfig } from "./payments/config";
import { runBillingCycle } from "./payments/billing";

/** Starts background workers. Timers are unref'd so they never keep the process alive on their own. */
export function startBackgroundJobs(): void {
  const payCfg = loadPaymentConfig(); // throws on invalid/unsafe payment config: the server refuses to start
  if (payCfg.provider !== "none") {
    const billingTick = () =>
      runBillingCycle(payCfg)
        .then((r) => {
          if (r.canceled || r.renewed || r.retried) console.log(`[billing] iptal=${r.canceled} yenileme=${r.renewed} yeniden_deneme=${r.retried}`);
        })
        .catch((e) => console.error("[billing] döngü hatası:", e?.code ?? e?.message));
    setInterval(billingTick, 15 * 60_000).unref();
  }

  const transport = getMailTransport();
  if (transport) {
    const tick = () =>
      processOutbox(transport)
        .then((r) => {
          if (r.sent || r.retried || r.failed) console.log(`[email] gönderildi=${r.sent} yeniden=${r.retried} hatalı=${r.failed}`);
        })
        .catch((e) => console.error("[email] işçi hatası:", e?.code ?? e?.message));
    setInterval(tick, 15_000).unref();
    void tick();
  }

  const smsTick = () => {
    const smsTransport = getSmsTransport();
    if (!smsTransport) return Promise.resolve();
    if (smsTransport.mode === "pull") {
      return reapExpiredGatewayJobs()
        .then((n) => {
          if (n) console.log(`[sms-gateway] zaman aşımı nedeniyle başarısız=${n}`);
        })
        .catch((e) => console.error("[sms-gateway] temizlik hatası:", e?.code ?? e?.message));
    }
    return processSmsOutbox(smsTransport)
      .then((r) => {
        if (r.sent || r.retried || r.failed) console.log(`[sms] gönderildi=${r.sent} yeniden=${r.retried} hatalı=${r.failed}`);
      })
      .catch((e) => console.error("[sms] işçi hatası:", e?.code ?? e?.message));
  };
  hydrateSmsConfig().finally(() => {
    setInterval(smsTick, 5_000).unref();
    void smsTick();
  });

  const otpCleanupTick = () => cleanupExpiredOtp().catch((e) => console.error("[otp] temizlik hatası:", e?.code ?? e?.message));
  setInterval(otpCleanupTick, 5 * 60_000).unref();
}
