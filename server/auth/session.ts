import type { Express } from "express";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);
const TTL_MS = 7 * 24 * 60 * 60 * 1000;
const DEV_FALLBACK_SECRET = "dev-only-insecure-secret-change-me";

/**
 * Cookie-based sessions. In production SESSION_SECRET is mandatory (>= 32 chars),
 * so the app refuses to start with a guessable secret.
 * NOTE: MemoryStore is per-process; use a persistent store (e.g. connect-pg-simple / Redis) before scaling out.
 */
export function setupSession(app: Express) {
  const isProd = process.env.NODE_ENV === "production";
  const secret = process.env.SESSION_SECRET;
  if (isProd && (!secret || secret.length < 32)) {
    throw new Error("SESSION_SECRET (en az 32 karakter) production ortamında zorunludur.");
  }
  if (!secret) {
    console.warn("SESSION_SECRET tanımlı değil; yalnızca geliştirme için geçici anahtar kullanılıyor.");
  }

  app.set("trust proxy", 1);
  app.use(
    session({
      name: "mtm.sid",
      secret: secret ?? DEV_FALLBACK_SECRET,
      store: new MemoryStore({ checkPeriod: TTL_MS }),
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        sameSite: "lax",
        secure: isProd,
        maxAge: TTL_MS,
      },
    })
  );
}
