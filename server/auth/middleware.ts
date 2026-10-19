import type { NextFunction, Request, Response } from "express";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { users } from "@shared/schema";

export interface AuthContext {
  userId: number;
  restaurantId: number | null;
  isPlatformAdmin: boolean;
  roleId: number | null;
}

declare global {
  namespace Express {
    interface Request {
      auth?: AuthContext;
    }
  }
}

declare module "express-session" {
  interface SessionData {
    userId?: number;
  }
}

/** Loads the logged-in user from the session on every request, so disabling a user takes effect immediately. */
export async function loadAuth(req: Request, _res: Response, next: NextFunction) {
  const userId = req.session?.userId;
  if (!userId) return next();
  try {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user || user.isActive === false) {
      req.session.userId = undefined;
      return next();
    }
    req.auth = {
      userId: user.id,
      restaurantId: user.restaurantId ?? null,
      isPlatformAdmin: !!user.isPlatformAdmin,
      roleId: user.roleId ?? null,
    };
    next();
  } catch (err) {
    next(err);
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.auth) return res.status(401).json({ message: "Giriş yapmanız gerekiyor." });
  next();
}

/** Tenant scope: the user must belong to a business. Returns the restaurant id to use for queries. */
export function requireRestaurant(req: Request, res: Response, next: NextFunction) {
  if (!req.auth) return res.status(401).json({ message: "Giriş yapmanız gerekiyor." });
  if (!req.auth.restaurantId) {
    return res.status(403).json({ message: "Hesabınıza bağlı bir işletme yok." });
  }
  next();
}

export function requirePlatformAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.auth) return res.status(401).json({ message: "Giriş yapmanız gerekiyor." });
  if (!req.auth.isPlatformAdmin) return res.status(403).json({ message: "Bu alan için yetkiniz yok." });
  next();
}

/** Returns the tenant id for the current request. Only call after requireRestaurant. */
export function tenantId(req: Request): number {
  if (!req.auth?.restaurantId) throw new Error("tenantId() called without a tenant");
  return req.auth.restaurantId;
}

/** In-memory fixed-window rate limiter. Single-process only; use Redis when scaling out. */
export function rateLimit(opts: { windowMs: number; max: number; keyPrefix: string; keyFn?: (req: Request) => string }) {
  const hits = new Map<string, { count: number; resetAt: number }>();
  const timer = setInterval(() => {
    const now = Date.now();
    hits.forEach((v, k) => {
      if (v.resetAt <= now) hits.delete(k);
    });
  }, opts.windowMs);
  timer.unref?.();
  return (req: Request, res: Response, next: NextFunction) => {
    const key = `${opts.keyPrefix}:${opts.keyFn ? opts.keyFn(req) : req.ip}`;
    const now = Date.now();
    let entry = hits.get(key);
    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + opts.windowMs };
      hits.set(key, entry);
    }
    entry.count += 1;
    if (entry.count > opts.max) {
      res.setHeader("Retry-After", Math.ceil((entry.resetAt - now) / 1000));
      return res.status(429).json({ message: "Çok fazla deneme. Lütfen biraz bekleyin." });
    }
    next();
  };
}

/** Rejects state-changing API requests that do not send JSON. Blocks cross-site HTML form posts (CSRF). */
export function requireJsonBody(req: Request, res: Response, next: NextFunction) {
  const method = req.method.toUpperCase();
  if (!req.path.startsWith("/api") || method === "GET" || method === "HEAD" || method === "OPTIONS") {
    return next();
  }
  const hasBody = Boolean(req.headers["content-length"] && req.headers["content-length"] !== "0") || Boolean(req.headers["transfer-encoding"]);
  if (hasBody && !(req.headers["content-type"] ?? "").toLowerCase().includes("application/json")) {
    return res.status(415).json({ message: "Yalnızca application/json kabul edilir." });
  }
  next();
}

export function securityHeaders(req: Request, res: Response, next: NextFunction) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  if (req.path.startsWith("/api")) {
    res.setHeader("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'");
    res.setHeader("Cache-Control", "no-store");
  }
  if (process.env.NODE_ENV === "production") {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
  next();
}
