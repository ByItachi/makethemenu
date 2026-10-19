import type { Express, Request, Response } from "express";
import { asc, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "./db";
import { plans, emailOutbox, restaurants } from "@shared/schema";
import { writeAudit } from "./audit";
import { processOutbox } from "./email/worker";
import { getMailTransport } from "./email";

const planUpdateSchema = z
  .object({
    name: z.string().trim().min(1).max(64),
    priceMonthly: z.number().min(0).max(1_000_000),
    priceYearly: z.number().min(0).max(10_000_000),
    maxProducts: z.number().int().min(0).max(1_000_000).nullable(),
    maxTables: z.number().int().min(0).max(100_000).nullable(),
    customDomain: z.boolean(),
    isActive: z.boolean(),
  })
  .partial();

const planDto = (p: typeof plans.$inferSelect) => ({
  code: p.code,
  name: p.name,
  priceMonthly: Number(p.priceMonthly),
  priceYearly: Number(p.priceYearly),
  maxProducts: p.maxProducts,
  maxTables: p.maxTables,
  customDomain: p.customDomain,
  isActive: p.isActive,
  sortOrder: p.sortOrder,
});

/** Public: active plans for the pricing page. */
export function registerPublicPlanRoutes(app: Express) {
  app.get("/api/plans", async (_req: Request, res: Response) => {
    const rows = await db.select().from(plans).where(eq(plans.isActive, true)).orderBy(asc(plans.sortOrder));
    res.json(rows.map(planDto));
  });
}

/** Platform admin only; mounted behind requirePlatformAdmin by the caller. */
export function registerAdminPlanRoutes(app: Express) {
  app.get("/api/admin/plans", async (_req: Request, res: Response) => {
    const rows = await db.select().from(plans).orderBy(asc(plans.sortOrder));
    res.json(rows.map(planDto));
  });

  app.put("/api/admin/plans/:code", async (req: Request, res: Response) => {
    const code = String(req.params.code);
    const parsed = planUpdateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.errors[0].message });
    const [before] = await db.select().from(plans).where(eq(plans.code, code));
    if (!before) return res.status(404).json({ message: "Plan bulunamadı." });

    const d = parsed.data;
    const update: Partial<typeof plans.$inferInsert> = {};
    if (d.name !== undefined) update.name = d.name;
    if (d.priceMonthly !== undefined) update.priceMonthly = d.priceMonthly.toFixed(2);
    if (d.priceYearly !== undefined) update.priceYearly = d.priceYearly.toFixed(2);
    if (d.maxProducts !== undefined) update.maxProducts = d.maxProducts;
    if (d.maxTables !== undefined) update.maxTables = d.maxTables;
    if (d.customDomain !== undefined) update.customDomain = d.customDomain;
    if (d.isActive !== undefined) update.isActive = d.isActive;
    if (Object.keys(update).length) await db.update(plans).set(update).where(eq(plans.code, code));

    const [after] = await db.select().from(plans).where(eq(plans.code, code));
    await writeAudit({ restaurantId: null, actorUserId: req.auth!.userId, action: "admin.plan_update", entity: "plan", entityId: code, req, meta: { before: planDto(before), after: planDto(after) } });
    res.json(planDto(after));
  });

  app.get("/api/admin/email-outbox", async (_req: Request, res: Response) => {
    const rows = await db
      .select({
        id: emailOutbox.id,
        toAddress: emailOutbox.toAddress,
        subject: emailOutbox.subject,
        status: emailOutbox.status,
        attempts: emailOutbox.attempts,
        lastError: emailOutbox.lastError,
        createdAt: emailOutbox.createdAt,
        sentAt: emailOutbox.sentAt,
      })
      .from(emailOutbox)
      .orderBy(desc(emailOutbox.id))
      .limit(200);
    res.json(rows);
  });

  app.post("/api/admin/email-outbox/process", async (req: Request, res: Response) => {
    const transport = getMailTransport();
    if (!transport) return res.status(409).json({ message: "E-posta sağlayıcısı yapılandırılmadı (EMAIL_PROVIDER=smtp ve SMTP_* ayarları gerekli).", code: "MAIL_NOT_CONFIGURED" });
    const result = await processOutbox(transport, 50);
    await writeAudit({ restaurantId: null, actorUserId: req.auth!.userId, action: "admin.email_process", entity: "email_outbox", entityId: "batch", req, meta: result });
    res.json(result);
  });

  app.put("/api/admin/restaurants/:id/plan", async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const parsed = z.object({ planCode: z.string().min(1).max(32) }).safeParse(req.body);
    if (!Number.isInteger(id) || !parsed.success) return res.status(400).json({ message: "Geçersiz istek." });
    const [plan] = await db.select().from(plans).where(eq(plans.code, parsed.data.planCode));
    if (!plan || !plan.isActive) return res.status(400).json({ message: "Geçersiz veya pasif plan." });
    const [r] = await db.select().from(restaurants).where(eq(restaurants.id, id));
    if (!r) return res.status(404).json({ message: "İşletme bulunamadı." });
    await db.update(restaurants).set({ planCode: plan.code }).where(eq(restaurants.id, id));
    await writeAudit({ restaurantId: id, actorUserId: req.auth!.userId, action: "admin.restaurant_plan", entity: "restaurant", entityId: String(id), req, meta: { from: r.planCode, to: plan.code } });
    res.json({ ok: true, planCode: plan.code });
  });
}
