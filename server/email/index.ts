import { createSmtpTransport, loadSmtpConfig, type MailTransport } from "./transport";

let cached: { transport: MailTransport | null } | null = null;

/** Returns the configured transport, or null when only the outbox queue is active. */
export function getMailTransport(): MailTransport | null {
  if (!cached) {
    const cfg = loadSmtpConfig();
    cached = { transport: cfg ? createSmtpTransport(cfg) : null };
    if (!cfg) console.warn("[email] EMAIL_PROVIDER=smtp değil; e-postalar yalnızca kuyrukta bekliyor.");
  }
  return cached.transport;
}
