import nodemailer from "nodemailer";

export interface MailMessage {
  to: string;
  subject: string;
  text: string;
}

export interface MailTransport {
  name: string;
  send(message: MailMessage): Promise<void>;
}

export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user?: string;
  pass?: string;
  from: string;
}

/** Reads SMTP settings from the environment. Returns null when e-mail delivery is not configured. */
export function loadSmtpConfig(env: NodeJS.ProcessEnv = process.env): SmtpConfig | null {
  const provider = (env.EMAIL_PROVIDER ?? (env.SMTP_HOST ? "smtp" : "outbox")).toLowerCase();
  if (provider !== "smtp") return null;
  const host = env.SMTP_HOST;
  const port = Number(env.SMTP_PORT ?? 587);
  const from = env.SMTP_FROM;
  if (!host || !from || !Number.isInteger(port) || port <= 0) {
    throw new Error("EMAIL_PROVIDER=smtp için SMTP_HOST, SMTP_PORT ve SMTP_FROM tanımlanmalı.");
  }
  return {
    host,
    port,
    secure: env.SMTP_SECURE === "true" || port === 465,
    user: env.SMTP_USER || undefined,
    pass: env.SMTP_PASS || undefined,
    from,
  };
}

/** Replaces any configured secret inside an error text so it never reaches the database or logs. */
export function redact(text: string, secrets: Array<string | undefined>): string {
  let out = text;
  for (const s of secrets) {
    if (s && s.length >= 3) out = out.split(s).join("***");
  }
  return out.replace(/\s+/g, " ").slice(0, 240);
}

// Masks credential-looking "key=value" / "key: value" pairs in arbitrary error text.
const SECRET_PAIR = /\b(password|passwd|pass|pwd|parola|token|secret|api[_-]?key|auth)\b(\s*[=:]\s*)\S+/gi;
export function sanitizeError(text: string, secrets: Array<string | undefined> = []): string {
  return redact(text.replace(SECRET_PAIR, "$1$2***"), secrets);
}

export function createSmtpTransport(cfg: SmtpConfig): MailTransport {
  const transporter = nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    auth: cfg.user && cfg.pass ? { user: cfg.user, pass: cfg.pass } : undefined,
    connectionTimeout: 10_000,
    socketTimeout: 20_000,
  });
  return {
    name: "smtp",
    async send(message) {
      try {
        await transporter.sendMail({ from: cfg.from, to: message.to, subject: message.subject, text: message.text });
      } catch (err: any) {
        // Re-throw with secrets removed; the worker stores only this sanitized text
        throw new Error(redact(String(err?.message ?? "SMTP gönderimi başarısız"), [cfg.pass, cfg.user]));
      }
    },
  };
}
