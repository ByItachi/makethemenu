// Fason firma yönetimi: "Fason Yıkayan" halılarınızı sizin adınıza yıkayan dış firma,
// "Fason Yıkatan" halılarını size gönderip yıkatan dış firma. Basit B2B cari hesap (borç takibi).
import type { Express } from "express";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "./db";
import { fasonFirms } from "../shared/schema";
import { requireRestaurant, tenantId } from "./auth/middleware";
import { writeAudit } from "./audit";

const fasonSchema = z.object({
  kind: z.enum(["yikayan", "yikatan"]),
  name: z.string().min(2, "Firma adı en az 2 karakter").max(128),
  phone: z.string().min(7, "Telefon gerekli").max(32),
  address: z.string().max(512).optional().default(""),
  discountPercent: z.number().min(0).max(100).default(0),
});

export function registerFasonRoutes(app: Express) {
  app.get("/api/ops/fason", requireRestaurant, async (req, res) => {
    const rid = tenantId(req);
    const rows = await db.select().from(fasonFirms).where(eq(fasonFirms.restaurantId, rid)).orderBy(desc(fasonFirms.createdAt));
    res.json({ firms: rows });
  });

  app.post("/api/ops/fason", requireRestaurant, async (req, res) => {
    const rid = tenantId(req);
    const parsed = fasonSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.issues[0]?.message ?? "Geçersiz istek" });
    const input = parsed.data;
    const [result] = await db.insert(fasonFirms).values({
      restaurantId: rid,
      kind: input.kind,
      name: input.name,
      phone: input.phone,
      address: input.address || null,
      discountPercent: input.discountPercent.toFixed(2),
    }).$returningId();
    await writeAudit({ action: "fason.firm.created", entity: "fason_firms", entityId: String(result.id), restaurantId: rid, actorUserId: null, meta: { kind: input.kind } });
    const [row] = await db.select().from(fasonFirms).where(eq(fasonFirms.id, result.id)).limit(1);
    res.status(201).json({ firm: row });
  });

  app.patch("/api/ops/fason/:id", requireRestaurant, async (req, res) => {
    const rid = tenantId(req);
    const parsed = fasonSchema.partial().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Geçersiz istek" });
    const input = parsed.data;
    const result = await db.update(fasonFirms).set({
      ...(input.kind !== undefined ? { kind: input.kind } : {}),
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.phone !== undefined ? { phone: input.phone } : {}),
      ...(input.address !== undefined ? { address: input.address || null } : {}),
      ...(input.discountPercent !== undefined ? { discountPercent: input.discountPercent.toFixed(2) } : {}),
    }).where(and(eq(fasonFirms.id, Number(req.params.id)), eq(fasonFirms.restaurantId, rid)));
    if (!result[0].affectedRows) return res.status(404).json({ message: "Firma bulunamadı" });
    const [row] = await db.select().from(fasonFirms).where(eq(fasonFirms.id, Number(req.params.id))).limit(1);
    res.json({ firm: row });
  });

  app.delete("/api/ops/fason/:id", requireRestaurant, async (req, res) => {
    const rid = tenantId(req);
    const result = await db.delete(fasonFirms).where(and(eq(fasonFirms.id, Number(req.params.id)), eq(fasonFirms.restaurantId, rid)));
    if (!result[0].affectedRows) return res.status(404).json({ message: "Firma bulunamadı" });
    res.json({ ok: true });
  });
}
