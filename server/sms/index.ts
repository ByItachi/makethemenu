import { loadSmsConfig, type SmsTransport } from "./transport";

let cached: { transport: SmsTransport | null } | null = null;

/** Returns the configured SMS transport, or null when only the outbox queue is active. */
export function getSmsTransport(): SmsTransport | null {
  if (!cached) {
    const transport = loadSmsConfig();
    cached = { transport };
    if (!transport) console.warn("[sms] SMS_PROVIDER tanımlı değil; mesajlar yalnızca kuyrukta bekliyor.");
  }
  return cached.transport;
}

/** Test/geliştirme ortamı: önbelleği sıfırlar (env değişince yeniden okumak için). */
export function resetSmsTransportCache(): void {
  cached = null;
}
