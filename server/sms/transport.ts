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

export interface SmsProviderConfig {
  provider: string;
  iletimerkezi?: { apiKey: string; apiHash: string; sender: string; iysConsent?: boolean; sandbox?: boolean };
  netgsm?: { usercode: string; password: string; sender: string };
  twilio?: { accountSid: string; authToken: string; fromNumber: string };
}

let dynamicConfig: SmsProviderConfig | null = null;

export function setDynamicSmsConfig(config: SmsProviderConfig | null): void {
  dynamicConfig = config;
}

export function getDynamicSmsConfig(): SmsProviderConfig | null {
  return dynamicConfig;
}

export function loadSmsConfig(env: NodeJS.ProcessEnv = process.env): SmsTransport | null {
  if (dynamicConfig) return buildTransportFromConfig(dynamicConfig, env);

  const provider = (env.SMS_PROVIDER ?? "").toLowerCase();
  if (!provider) return null;

  if (provider === "mock") {
    return {
      name: "mock",
      async send(message) {
        console.log(`[sms-mock] Gönderiliyor: ${message.to} -> "${message.text.slice(0, 50)}..."`);
        await new Promise((resolve) => setTimeout(resolve, 100));
      },
    };
  }

  if (provider === "makethemenu") {
    return buildMakeTheMenuTransport(env);
  }

  return buildTransportFromEnv(provider, env);
}

function buildMakeTheMenuTransport(env: NodeJS.ProcessEnv): SmsTransport {
  const upstream = (env.MTM_SMS_UPSTREAM ?? "").toLowerCase();
  if (!upstream || upstream === "mock") {
    return {
      name: "makethemenu",
      async send(message) {
        console.log(`[MakeTheMenu SMS] Gönderiliyor: ${message.to} -> "${message.text.slice(0, 50)}..."`);
        await new Promise((resolve) => setTimeout(resolve, 50));
      },
    };
  }
  const transport = buildTransportFromEnv(upstream, env);
  if (!transport) throw new Error(`MakeTheMenu SMS: upstream sağlayıcı '${upstream}' yapılandırılamadı.`);
  return {
    name: "makethemenu",
    async send(message) {
      await transport.send(message);
    },
  };
}

export function buildTransportFromConfig(config: SmsProviderConfig, env: NodeJS.ProcessEnv = process.env): SmsTransport {
  const provider = config.provider.toLowerCase();

  if (provider === "mock") {
    return {
      name: "makethemenu",
      async send(message) {
        console.log(`[MakeTheMenu SMS] Gönderiliyor: ${message.to} -> "${message.text.slice(0, 50)}..."`);
        await new Promise((resolve) => setTimeout(resolve, 50));
      },
    };
  }

  if (provider === "iletimerkezi" && config.iletimerkezi) {
    const { apiKey, apiHash, sender, iysConsent, sandbox } = config.iletimerkezi;
    return {
      name: "makethemenu",
      async send(message) {
        const iysAttr = iysConsent ? ' iys="1"' : ' iys="0"';
        const xml = `<?xml version="1.0" encoding="UTF-8"?><request><authentication><key>${escapeXml(apiKey)}</key><hash>${escapeXml(apiHash)}</hash></authentication><order><sender>${escapeXml(sender)}</sender><sendDateTime></sendDateTime><message${iysAttr}><text>${escapeXml(message.text)}</text><receipents><number>${escapeXml(message.to)}</number></receipents></message></order></request>`;
        const resp = await fetch("https://api.iletimerkezi.com/v1/send-sms/xml", {
          method: "POST",
          headers: { "Content-Type": "application/xml", "APITEST": sandbox ? "1" : "0" },
          body: xml,
        });
        const body = await resp.text();
        if (!resp.ok || /<code>(?!200)\d+<\/code>/.test(body)) {
          throw new Error(redact(`İletiMerkezi hata: ${body.slice(0, 200)}`, [apiHash]));
        }
      },
    };
  }

  if (provider === "netgsm" && config.netgsm) {
    const { usercode, password, sender } = config.netgsm;
    return {
      name: "makethemenu",
      async send(message) {
        const params = new URLSearchParams({
          usercode, password, gsmno: message.to, message: message.text, msgheader: sender, filter: "0",
        });
        const resp = await fetch(`https://api.netgsm.com.tr/sms/send/get?${params.toString()}`);
        const body = await resp.text();
        if (!resp.ok || /^(20|30|40|50|51|70|85)/.test(body.trim())) {
          throw new Error(redact(`NetGSM hata: ${body.slice(0, 200)}`, [password]));
        }
      },
    };
  }

  if (provider === "twilio" && config.twilio) {
    const { accountSid, authToken, fromNumber } = config.twilio;
    return {
      name: "makethemenu",
      async send(message) {
        const body = new URLSearchParams({ To: message.to, From: fromNumber, Body: message.text });
        const resp = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
          method: "POST",
          headers: {
            Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body,
        });
        if (!resp.ok) {
          const text = await resp.text();
          throw new Error(redact(`Twilio hata: ${text.slice(0, 200)}`, [authToken]));
        }
      },
    };
  }

  throw new Error(`Bilinmeyen sağlayıcı: ${provider}`);
}

function buildTransportFromEnv(provider: string, env: NodeJS.ProcessEnv): SmsTransport {
  if (provider === "iletimerkezi") {
    const user = env.ILETIMERKEZI_API_KEY;
    const pass = env.ILETIMERKEZI_API_HASH;
    const sender = env.SMS_SENDER_TITLE;
    const iysConsent = env.ILETIMERKEZI_IYS_CONSENT === "true";
    if (!user || !pass || !sender) {
      throw new Error("SMS_PROVIDER=iletimerkezi için ILETIMERKEZI_API_KEY, ILETIMERKEZI_API_HASH ve SMS_SENDER_TITLE tanımlanmalı.");
    }
    return buildTransportFromConfig({
      provider: "iletimerkezi",
      iletimerkezi: { apiKey: user, apiHash: pass, sender, iysConsent, sandbox: env.ILETIMERKEZI_SANDBOX === "true" },
    }, env);
  }

  if (provider === "netgsm") {
    const user = env.NETGSM_USERCODE;
    const pass = env.NETGSM_PASSWORD;
    const sender = env.SMS_SENDER_TITLE;
    if (!user || !pass || !sender) {
      throw new Error("SMS_PROVIDER=netgsm için NETGSM_USERCODE, NETGSM_PASSWORD ve SMS_SENDER_TITLE tanımlanmalı.");
    }
    return buildTransportFromConfig({ provider: "netgsm", netgsm: { usercode: user, password: pass, sender } }, env);
  }

  if (provider === "twilio") {
    const sid = env.TWILIO_ACCOUNT_SID;
    const token = env.TWILIO_AUTH_TOKEN;
    const from = env.TWILIO_FROM_NUMBER;
    if (!sid || !token || !from) {
      throw new Error("SMS_PROVIDER=twilio için TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN ve TWILIO_FROM_NUMBER tanımlanmalı.");
    }
    return buildTransportFromConfig({ provider: "twilio", twilio: { accountSid: sid, authToken: token, fromNumber: from } }, env);
  }

  throw new Error(`Bilinmeyen SMS_PROVIDER: ${provider} (makethemenu | iletimerkezi | netgsm | twilio)`);
}

function escapeXml(s: string): string {
  return s.replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[c]!));
}
