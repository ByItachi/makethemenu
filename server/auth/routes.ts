import type { Express, Request, Response } from "express";
import { randomBytes } from "crypto";
import { and, desc, eq, like } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db";
import { auditLogs, roles, users, restaurants } from "@shared/schema";
import { hashPassword, verifyPassword, needsRehash, PASSWORD_MIN, PASSWORD_MAX } from "./password";
import { loadAuth, requireAuth, rateLimit } from "./middleware";
import { generateSlug } from "../tenancy/slugs";
import { writeAudit } from "../audit";
import { createToken, consumeToken, invalidateTokens } from "./tokens";
import { enqueueEmail } from "../email/outbox";
import { publicBaseUrl } from "../tenant-routes";

const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email("Geçerli bir e-posta girin.").max(255),
  password: z.string().min(PASSWORD_MIN, `Parola en az ${PASSWORD_MIN} karakter olmalı.`).max(PASSWORD_MAX),
  fullName: z.string().trim().min(2, "Ad soyad en az 2 karakter olmalı.").max(120),
  businessName: z.string().trim().min(2, "İşletme adı en az 2 karakter olmalı.").max(120),
});

const loginSchema = z.object({
  identifier: z.string().trim().min(1).max(255),
  password: z.string().min(1).max(PASSWORD_MAX),
});

const forgotSchema = z.object({ email: z.string().trim().toLowerCase().max(255) });
const resetSchema = z.object({
  token: z.string().min(20).max(128),
  password: z.string().min(PASSWORD_MIN, `Parola en az ${PASSWORD_MIN} karakter olmalı.`).max(PASSWORD_MAX),
});
const verifySchema = z.object({ token: z.string().min(20).max(128) });

const GENERIC_LOGIN_ERROR = "E-posta veya parola hatalı.";
const GENERIC_FORGOT_OK = "Bu e-posta kayıtlıysa parola sıfırlama bağlantısı gönderildi.";

// Used to spend the same time on unknown accounts as on real ones (prevents user enumeration by timing)
const dummyHash = hashPassword("timing-dummy-password-not-used");

type Db = typeof db;
type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];

export function publicUser(u: typeof users.$inferSelect) {
  return {
    id: u.id,
    username: u.username,
    email: u.email,
    fullName: u.fullName,
    restaurantId: u.restaurantId ?? null,
    isPlatformAdmin: !!u.isPlatformAdmin,
    isActive: u.isActive,
    emailVerified: !!u.emailVerifiedAt,
  };
}

async function getOrCreateOwnerRole(tx: Tx): Promise<number> {
  const [existing] = await tx.select().from(roles).where(eq(roles.name, "Owner"));
  if (existing) return existing.id;
  const [r] = await tx.insert(roles).values({
    name: "Owner",
    description: "İşletme sahibi; kendi işletmesinde tam yetki",
    permissions: ["*"],
  });
  return r.insertId;
}

const envInt = (name: string, fallback: number) => {
  const v = Number(process.env[name]);
  return Number.isFinite(v) && v > 0 ? v : fallback;
};

async function sendVerificationEmail(userId: number, email: string) {
  const token = await createToken(userId, "verify_email");
  await enqueueEmail(
    email,
    "E-posta adresinizi doğrulayın",
    `E-posta adresinizi doğrulamak için bu bağlantıyı açın (24 saat geçerli):\n${publicBaseUrl()}/dogrula?token=${token}`,
  );
}

export function registerAuthRoutes(app: Express) {
  const loginLimiter = rateLimit({
    windowMs: 15 * 60_000,
    max: envInt("AUTH_LOGIN_MAX", 20),
    keyPrefix: "login",
  });
  const registerLimiter = rateLimit({
    windowMs: 60 * 60_000,
    max: envInt("AUTH_REGISTER_MAX", 10),
    keyPrefix: "register",
  });

  const verifyLimiter = rateLimit({ windowMs: 60 * 60_000, max: envInt("AUTH_VERIFY_MAX", 5), keyPrefix: "verify" });
  const forgotLimiter = rateLimit({ windowMs: 60 * 60_000, max: envInt("AUTH_FORGOT_MAX", 5), keyPrefix: "forgot" });

  app.use(loadAuth);

  // Current user (401 when logged out)
  app.get("/api/auth/user", async (req: Request, res: Response) => {
    if (!req.auth) return res.status(401).json({ message: "Giriş yapmanız gerekiyor." });
    const [user] = await db.select().from(users).where(eq(users.id, req.auth.userId));
    if (!user) return res.status(401).json({ message: "Giriş yapmanız gerekiyor." });
    res.json({ ...publicUser(user), impersonatedBy: (req.session as any).impersonatorId ?? null });
  });

  // Security timeline for the logged-in user: recent auth events from the audit trail
  app.get("/api/auth/security-events", requireAuth, async (req: Request, res: Response) => {
    const rows = await db
      .select({ id: auditLogs.id, action: auditLogs.action, ip: auditLogs.ip, createdAt: auditLogs.createdAt })
      .from(auditLogs)
      .where(and(eq(auditLogs.actorUserId, req.auth!.userId), like(auditLogs.action, "auth.%")))
      .orderBy(desc(auditLogs.id))
      .limit(50);
    res.json(rows);
  });

  // End impersonation: return to the platform admin's own session
  app.post("/api/auth/stop-impersonating", requireAuth, async (req: Request, res: Response) => {
    const adminId = (req.session as any).impersonatorId as number | undefined;
    if (!adminId) return res.status(400).json({ message: "Aktif temsilci oturumu yok." });
    const [admin] = await db.select().from(users).where(eq(users.id, adminId)).limit(1);
    if (!admin || admin.isPlatformAdmin !== true) {
      // Admin gone or demoted: fall back to a clean logout
      await new Promise<void>((resolve, reject) =>
        req.session.destroy((err) => (err ? reject(err) : resolve()))
      );
      return res.json({ ok: true, loggedOut: true });
    }
    await writeAudit({ restaurantId: req.auth!.restaurantId ?? null, actorUserId: adminId, action: "auth.impersonation_ended", entity: "user", entityId: String(req.auth!.userId), req });
    await new Promise<void>((resolve, reject) =>
      req.session.regenerate((err) => (err ? reject(err) : resolve()))
    );
    req.session.userId = adminId;
    res.json({ ok: true, user: publicUser(admin) });
  });

  app.post("/api/auth/register", registerLimiter, async (req: Request, res: Response) => {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.errors[0].message });
    const { email, password, fullName, businessName } = parsed.data;

    try {
      const passwordHash = await hashPassword(password);
      const created = await db.transaction(async (tx) => {
        const [dup] = await tx.select({ id: users.id }).from(users).where(eq(users.email, email));
        if (dup) throw Object.assign(new Error("Bu e-posta ile bir hesap zaten var."), { status: 409 });

        const roleId = await getOrCreateOwnerRole(tx);
        const slug = await generateSlug(businessName, tx);
        const [rest] = await tx.insert(restaurants).values({
          name: businessName,
          type: "Restoran",
          address: "-",
          country: "Türkiye",
          status: "active",
          slug,
          currency: "TRY",
        });
        const localPart = email.split("@")[0].replace(/[^a-z0-9]/g, "").slice(0, 40) || "user";
        const username = `${localPart}-${randomBytes(3).toString("hex")}`;
        const [user] = await tx.insert(users).values({
          username,
          email,
          password: passwordHash,
          fullName,
          roleId,
          restaurantId: rest.insertId,
          isActive: true,
        });
        await tx.update(restaurants).set({ ownerUserId: user.insertId }).where(eq(restaurants.id, rest.insertId));
        return { userId: user.insertId, restaurantId: rest.insertId, slug };
      });

      await new Promise<void>((resolve, reject) =>
        req.session.regenerate((err) => (err ? reject(err) : resolve()))
      );
      req.session.userId = created.userId;
      const [user] = await db.select().from(users).where(eq(users.id, created.userId));
      await writeAudit({ restaurantId: created.restaurantId, actorUserId: created.userId, action: "auth.register", entity: "restaurant", entityId: String(created.restaurantId), req });
      await sendVerificationEmail(created.userId, email);
      res.status(201).json({ ...publicUser(user), restaurantSlug: created.slug });
    } catch (err: any) {
      if (err?.status === 409) return res.status(409).json({ message: err.message });
      console.error("register failed:", err?.code ?? err?.message);
      res.status(500).json({ message: "Kayıt tamamlanamadı. Lütfen tekrar deneyin." });
    }
  });

  app.post("/api/auth/login", loginLimiter, async (req: Request, res: Response) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "E-posta ve parola gerekli." });
    const raw = parsed.data.identifier;

    const byEmail = await db.select().from(users).where(eq(users.email, raw.toLowerCase())).limit(1);
    const user = byEmail[0] ?? (await db.select().from(users).where(eq(users.username, raw)).limit(1))[0];

    let ok = false;
    if (user) {
      ok = await verifyPassword(parsed.data.password, user.password);
    } else {
      await verifyPassword(parsed.data.password, await dummyHash);
    }

    if (!user || !ok || user.isActive === false) {
      return res.status(401).json({ message: GENERIC_LOGIN_ERROR });
    }

    if (needsRehash(user.password)) {
      // Upgrade a legacy plaintext password (old seed) to a salted hash
      await db.update(users).set({ password: await hashPassword(parsed.data.password) }).where(eq(users.id, user.id));
    }

    await new Promise<void>((resolve, reject) =>
      req.session.regenerate((err) => (err ? reject(err) : resolve()))
    );
    req.session.userId = user.id;
    await db.update(users).set({ lastLogin: new Date() }).where(eq(users.id, user.id));
    await writeAudit({ restaurantId: user.restaurantId ?? null, actorUserId: user.id, action: "auth.login", entity: "user", entityId: String(user.id), req });
    res.json(publicUser({ ...user, lastLogin: new Date() }));
  });

  // E-mail verification: link sent at registration; resend is rate limited
  app.post("/api/auth/verify-email", verifyLimiter, async (req: Request, res: Response) => {
    const parsed = verifySchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Geçersiz doğrulama bağlantısı." });
    const userId = await consumeToken(parsed.data.token, "verify_email");
    if (!userId) return res.status(400).json({ message: "Doğrulama bağlantısı geçersiz veya süresi dolmuş." });
    await db.update(users).set({ emailVerifiedAt: new Date() }).where(eq(users.id, userId));
    await writeAudit({ restaurantId: null, actorUserId: userId, action: "auth.email_verified", entity: "user", entityId: String(userId), req });
    res.json({ ok: true });
  });

  app.post("/api/auth/resend-verification", requireAuth, verifyLimiter, async (req: Request, res: Response) => {
    const [user] = await db.select().from(users).where(eq(users.id, req.auth!.userId));
    if (!user) return res.status(401).json({ message: "Giriş yapmanız gerekiyor." });
    if (user.emailVerifiedAt) return res.json({ ok: true, alreadyVerified: true });
    await sendVerificationEmail(user.id, user.email);
    res.json({ ok: true });
  });

  // Password reset: always answers the same way so accounts cannot be enumerated
  app.post("/api/auth/forgot-password", forgotLimiter, async (req: Request, res: Response) => {
    const parsed = forgotSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Geçerli bir e-posta girin." });
    const [user] = await db.select().from(users).where(eq(users.email, parsed.data.email)).limit(1);
    if (user && user.isActive !== false) {
      const token = await createToken(user.id, "reset_password");
      await enqueueEmail(
        user.email,
        "Parolanızı sıfırlayın",
        `Parolanızı sıfırlamak için bu bağlantıyı açın (1 saat geçerli):\n${publicBaseUrl()}/sifre-sifirla?token=${token}\n\nBu isteği siz yapmadıysanız bu e-postayı yok sayın.`,
      );
      await writeAudit({ restaurantId: user.restaurantId ?? null, actorUserId: user.id, action: "auth.password_reset_requested", entity: "user", entityId: String(user.id), req });
    }
    res.json({ message: GENERIC_FORGOT_OK });
  });

  app.post("/api/auth/reset-password", forgotLimiter, async (req: Request, res: Response) => {
    const parsed = resetSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.errors[0].message });
    const userId = await consumeToken(parsed.data.token, "reset_password");
    if (!userId) return res.status(400).json({ message: "Sıfırlama bağlantısı geçersiz veya süresi dolmuş." });
    await db.update(users).set({ password: await hashPassword(parsed.data.password) }).where(eq(users.id, userId));
    await invalidateTokens(userId, "reset_password");
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    await writeAudit({ restaurantId: user?.restaurantId ?? null, actorUserId: userId, action: "auth.password_reset", entity: "user", entityId: String(userId), req });
    res.json({ ok: true });
  });

  app.post("/api/auth/logout", requireAuth, async (req: Request, res: Response) => {
    const auth = req.auth!;
    await writeAudit({ restaurantId: auth.restaurantId, actorUserId: auth.userId, action: "auth.logout", entity: "user", entityId: String(auth.userId), req });
    req.session.destroy(() => {
      res.clearCookie("mtm.sid");
      res.status(200).json({ ok: true });
    });
  });

  // Legacy link from the old client; ends the session and returns to the home page
  app.get("/api/logout", (req, res) => {
    req.session?.destroy(() => {
      res.clearCookie("mtm.sid");
      res.redirect("/");
    });
  });
}
