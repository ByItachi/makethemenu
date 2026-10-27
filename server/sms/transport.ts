import { redact, sanitizeError } from "../email/transport";

export interface SmsMessage {
  to: string;
  text: string;
}

export interface SmsTransport {
  name: string;
  send(message: SmsMessage): Promise<void>;
}

export { sanitizeError };

/**
 * SMS_PROVIDER seçenekleri:
 *  - (boş)        → yalnızca kuyruk (sms_outbox); hiçbir mesaj gerçekten gönderilmez.
 *  - iletimerkezi → İletiMerkezi REST API (yeni üyeliklerde ~100 ücretsiz test kredisi verir; en "ücretsiz" seçenek).
 *  - netgsm       → NetGSM REST API (ücretli, Türkiye'de yaygın).
 *  - twilio       → Twilio REST API (ücretli; 30 günlük deneme kredisi verir, sadece doğrulanmış numaralara).
 * Kimlik bilgisi girilmeden hiçbir sağlayıcı "gönderildi" iddiasında bulunmaz.
 */
export function loadSmsConfig(env: NodeJS.ProcessEnv = process.env): SmsTransport | null {
  const provider = (env.SMS_PROVIDER ?? "").toLowerCase();
  if (!provider) return null;

  if (provider === "iletimerkezi") {
    const user = env.ILETIMERKEZI_API_KEY;
    const pass = env.ILETIMERKEZI_API_HASH;
    const sender = env.SMS_SENDER_TITLE;
    if (!user || !pass || !sender) {
      throw new Error("SMS_PROVIDER=iletimerkezi için ILETIMERKEZI_API_KEY, ILETIMERKEZI_API_HASH ve SMS_SENDER_TITLE tanımlanmalı.");
    }
    return {
      name: "iletimerkezi",
      async send(message) {
        const xml = `<?xml version="1.0" encoding="UTF-8"?><request><authentication><key>${escapeXml(user)}</key><hash>${escapeXml(pass)}</hash></authentication><order><sender>${escapeXml(sender)}</sender><sendDateTime></sendDateTime><message><text>${escapeXml(message.text)}</text><receipents><number>${escapeXml(message.to)}</number></receipents></message></order></request>`;
        const resp = await fetch("https://api.iletimerkezi.com/v1/send-sms/xml", {
          method: "POST",
          headers: { "Content-Type": "application/xml" },
          body: xml,
        });
        const body = await resp.text();
        if (!resp.ok || /<code>(?!200)\d+<\/code>/.test(body)) {
          throw new Error(redact(`İletiMerkezi hata: ${body.slice(0, 200)}`, [pass]));
        }
      },
    };
  }

  if (provider === "netgsm") {
    const user = env.NETGSM_USERCODE;
    const pass = env.NETGSM_PASSWORD;
    const sender = env.SMS_SENDER_TITLE;
    if (!user || !pass || !sender) {
      throw new Error("SMS_PROVIDER=netgsm için NETGSM_USERCODE, NETGSM_PASSWORD ve SMS_SENDER_TITLE tanımlanmalı.");
    }
    return {
      name: "netgsm",
      async send(message) {
        const params = new URLSearchParams({
          usercode: user,
          password: pass,
          gsmno: message.to,
          message: message.text,
          msgheader: sender,
          filter: "0",
        });
        const resp = await fetch(`https://api.netgsm.com.tr/sms/send/get?${params.toString()}`);
        const body = await resp.text();
        if (!resp.ok || /^(20|30|40|50|51|70|85)/.test(body.trim())) {
          throw new Error(redact(`NetGSM hata: ${body.slice(0, 200)}`, [pass]));
        }
      },
    };
  }

  if (provider === "twilio") {
    const sid = env.TWILIO_ACCOUNT_SID;
    const token = env.TWILIO_AUTH_TOKEN;
    const from = env.TWILIO_FROM_NUMBER;
    if (!sid || !token || !from) {
      throw new Error("SMS_PROVIDER=twilio için TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN ve TWILIO_FROM_NUMBER tanımlanmalı.");
    }
    return {
      name: "twilio",
      async send(message) {
        const body = new URLSearchParams({ To: message.to, From: from, Body: message.text });
        const resp = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
          method: "POST",
          headers: {
            Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body,
        });
        if (!resp.ok) {
          const text = await resp.text();
          throw new Error(redact(`Twilio hata: ${text.slice(0, 200)}`, [token]));
        }
      },
    };
  }

  throw new Error(`Bilinmeyen SMS_PROVIDER: ${provider} (iletimerkezi | netgsm | twilio)`);
}

function escapeXml(s: string): string {
  return s.replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[c]!));
}
