import type { Express, Request, Response } from "express";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";
import { db } from "./db";
import { templates, demoSites, insertTemplateSchema, insertDemoSiteSchema } from "@shared/schema";
import { writeAudit } from "./audit";

function sendValidationError(err: unknown, res: Response): boolean {
  if (err instanceof z.ZodError) {
    res.status(400).json({ message: err.errors[0].message });
    return true;
  }
  return false;
}

/**
 * Şablon Stüdyosu — yönetici uçları. server/routes.ts tarafından
 * `app.use(["/api/admin", ...], requirePlatformAdmin)` sonrasında mount edilir.
 */
export function registerAdminTemplateRoutes(app: Express) {
  app.get("/api/admin/templates", async (_req: Request, res: Response) => {
    const rows = await db.select().from(templates).orderBy(desc(templates.updatedAt));
    res.json(rows);
  });

  app.get("/api/admin/templates/:id", async (req: Request, res: Response) => {
    const [row] = await db.select().from(templates).where(eq(templates.id, Number(req.params.id)));
    if (!row) return res.status(404).json({ message: "Şablon bulunamadı." });
    res.json(row);
  });

  app.post("/api/admin/templates", async (req: Request, res: Response) => {
    try {
      const input = insertTemplateSchema.parse(req.body);
      const [result] = await db.insert(templates).values(input);
      const [row] = await db.select().from(templates).where(eq(templates.id, result.insertId));
      await writeAudit({ restaurantId: null, actorUserId: req.auth!.userId, action: "template.create", entity: "template", entityId: String(row.id), req, meta: { name: row.name } });
      res.status(201).json(row);
    } catch (err) {
      if (sendValidationError(err, res)) return;
      if ((err as any)?.code === "ER_DUP_ENTRY") return res.status(409).json({ message: "Bu slug zaten kullanılıyor." });
      throw err;
    }
  });

  app.patch("/api/admin/templates/:id", async (req: Request, res: Response) => {
    try {
      const input = insertTemplateSchema.partial().parse(req.body);
      const id = Number(req.params.id);
      const [result] = await db.update(templates).set(input).where(eq(templates.id, id));
      if (result.affectedRows === 0) return res.status(404).json({ message: "Şablon bulunamadı." });
      const [row] = await db.select().from(templates).where(eq(templates.id, id));
      await writeAudit({ restaurantId: null, actorUserId: req.auth!.userId, action: "template.update", entity: "template", entityId: String(id), req, meta: { fields: Object.keys(input) } });
      res.json(row);
    } catch (err) {
      if (sendValidationError(err, res)) return;
      if ((err as any)?.code === "ER_DUP_ENTRY") return res.status(409).json({ message: "Bu slug zaten kullanılıyor." });
      throw err;
    }
  });

  app.post("/api/admin/templates/:id/duplicate", async (req: Request, res: Response) => {
    const [row] = await db.select().from(templates).where(eq(templates.id, Number(req.params.id)));
    if (!row) return res.status(404).json({ message: "Şablon bulunamadı." });
    const slug = `${row.slug}-kopya-${Date.now().toString(36)}`;
    const [result] = await db.insert(templates).values({
      slug,
      name: `${row.name} (Kopya)`,
      category: row.category,
      coverImage: row.coverImage,
      status: "draft",
      visibility: row.visibility,
      isFeatured: false,
      isDefault: false,
      planRestriction: row.planRestriction,
      data: row.data,
    });
    const [created] = await db.select().from(templates).where(eq(templates.id, result.insertId));
    res.status(201).json(created);
  });

  app.delete("/api/admin/templates/:id", async (req: Request, res: Response) => {
    // Sert silme yerine arşivleme: demo/müşteri referansları kopmasın.
    const id = Number(req.params.id);
    const [result] = await db.update(templates).set({ status: "archived" }).where(eq(templates.id, id));
    if (result.affectedRows === 0) return res.status(404).json({ message: "Şablon bulunamadı." });
    res.status(204).end();
  });

  // --- Demo siteleri ---
  app.get("/api/admin/demos", async (_req: Request, res: Response) => {
    const rows = await db.select().from(demoSites).orderBy(desc(demoSites.updatedAt));
    res.json(rows);
  });

  app.post("/api/admin/demos", async (req: Request, res: Response) => {
    try {
      const input = insertDemoSiteSchema.parse(req.body);
      const [result] = await db.insert(demoSites).values(input);
      const [row] = await db.select().from(demoSites).where(eq(demoSites.id, result.insertId));
      res.status(201).json(row);
    } catch (err) {
      if (sendValidationError(err, res)) return;
      if ((err as any)?.code === "ER_DUP_ENTRY") return res.status(409).json({ message: "Bu demo adresi (slug) zaten kullanılıyor." });
      throw err;
    }
  });

  app.patch("/api/admin/demos/:id", async (req: Request, res: Response) => {
    try {
      const input = insertDemoSiteSchema.partial().parse(req.body);
      const id = Number(req.params.id);
      const [result] = await db.update(demoSites).set(input).where(eq(demoSites.id, id));
      if (result.affectedRows === 0) return res.status(404).json({ message: "Demo bulunamadı." });
      const [row] = await db.select().from(demoSites).where(eq(demoSites.id, id));
      res.json(row);
    } catch (err) {
      if (sendValidationError(err, res)) return;
      throw err;
    }
  });

  app.delete("/api/admin/demos/:id", async (req: Request, res: Response) => {
    const [result] = await db.delete(demoSites).where(eq(demoSites.id, Number(req.params.id)));
    if (result.affectedRows === 0) return res.status(404).json({ message: "Demo bulunamadı." });
    res.status(204).end();
  });
}

/**
 * Herkese açık uçlar: yayınlanan şablon galerisi ve demo sayfası çözümü.
 * Kimlik doğrulama gerektirmez; requirePlatformAdmin'den ÖNCE mount edilir.
 */
export function registerPublicTemplateRoutes(app: Express) {
  app.get("/api/public/templates", async (_req: Request, res: Response) => {
    const rows = await db.select().from(templates).where(eq(templates.status, "published"));
    res.json(rows.filter((r) => r.visibility === "customer"));
  });

  app.get("/api/public/demos/:slug", async (req: Request, res: Response) => {
    const slug = String(req.params.slug ?? "");
    const [demo] = await db.select().from(demoSites).where(eq(demoSites.slug, slug));
    if (!demo || demo.status !== "published") return res.status(404).json({ message: "Demo bulunamadı." });
    const [tpl] = await db.select().from(templates).where(eq(templates.id, demo.templateId));
    if (!tpl) return res.status(404).json({ message: "Demo bulunamadı." });
    db.update(templates).set({ viewCount: tpl.viewCount + 1 }).where(eq(templates.id, tpl.id)).catch(() => {});
    res.json({ demo, template: tpl });
  });
}
