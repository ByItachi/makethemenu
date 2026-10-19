import { processOutbox } from "./email/worker";
import { getMailTransport } from "./email";
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
}
