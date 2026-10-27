// Personel ve Vardiya: personel kayıtları ve vardiya planlama/giriş-çıkış takibi.
// Üçüncü taraf gerektirmeyen, platformun kendi (native) modülüdür.
import type { Express } from "express";
import { and, desc, eq, gte } from "drizzle-orm";
import { z } from "zod";
import { db } from "./db";
import { staffMembers, staffShifts } from "../shared/schema";
import { requireRestaurant, tenantId } from "./auth/middleware";
import { writeAudit } from "./audit";

const staffSchema = z.object({
  name: z.string().min(2, "Ad en az 2 karakter").max(128),
  phone: z.string().max(32).optional(),
  role: z.enum(["garson", "asci", "kurye", "kasiyer", "yonetici"]).default("garson"),
  hourlyWage: z.number().min(0).optional(),
});

const shiftSchema = z.object({
  staffId: z.number().int().positive(),
  startsAt: z.string().datetime().or(z.string().min(1)),
  endsAt: z.string().datetime().or(z.string().min(1)),
  note: z.string().max(255).optional(),
});

export function registerStaffRoutes(app: Express) {
  app.get("/api/ops/staff", requireRestaurant, async (req, res) => {
    const rid = tenantId(req);
    const rows = await db.select().from(staffMembers).where(and(eq(staffMembers.restaurantId, rid), eq(staffMembers.isActive, true))).orderBy(staffMembers.name);
    res.json({ staff: rows });
  });

  app.post("/api/ops/staff", requireRestaurant, async (req, res) => {
    const rid = tenantId(req);
    const parsed = staffSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.issues[0]?.message ?? "Geçersiz istek" });
    const input = parsed.data;
    const [result] = await db.insert(staffMembers).values({
      restaurantId: rid,
      name: input.name,
      phone: input.phone,
      role: input.role,
      hourlyWage: input.hourlyWage?.toFixed(2),
    }).$returningId();
    await writeAudit({ action: "staff.created", entity: "staff_members", entityId: String(result.id), restaurantId: rid, actorUserId: null });
    const [row] = await db.select().from(staffMembers).where(eq(staffMembers.id, result.id)).limit(1);
    res.status(201).json({ member: row });
  });

  app.patch("/api/ops/staff/:id", requireRestaurant, async (req, res) => {
    const rid = tenantId(req);
    const parsed = staffSchema.partial().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Geçersiz istek" });
    const input = parsed.data;
    const result = await db.update(staffMembers).set({
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.phone !== undefined ? { phone: input.phone } : {}),
      ...(input.role !== undefined ? { role: input.role } : {}),
      ...(input.hourlyWage !== undefined ? { hourlyWage: input.hourlyWage.toFixed(2) } : {}),
    }).where(and(eq(staffMembers.id, Number(req.params.id)), eq(staffMembers.restaurantId, rid)));
    if (!result[0].affectedRows) return res.status(404).json({ message: "Personel bulunamadı" });
    const [row] = await db.select().from(staffMembers).where(eq(staffMembers.id, Number(req.params.id))).limit(1);
    res.json({ member: row });
  });

  app.delete("/api/ops/staff/:id", requireRestaurant, async (req, res) => {
    const rid = tenantId(req);
    const result = await db.update(staffMembers).set({ isActive: false }).where(and(eq(staffMembers.id, Number(req.params.id)), eq(staffMembers.restaurantId, rid)));
    if (!result[0].affectedRows) return res.status(404).json({ message: "Personel bulunamadı" });
    res.json({ ok: true });
  });

  app.get("/api/ops/staff/shifts", requireRestaurant, async (req, res) => {
    const rid = tenantId(req);
    const from = req.query.from ? new Date(String(req.query.from)) : new Date(Date.now() - 7 * 86400000);
    const rows = await db.select().from(staffShifts).where(and(eq(staffShifts.restaurantId, rid), gte(staffShifts.startsAt, from))).orderBy(desc(staffShifts.startsAt));
    res.json({ shifts: rows });
  });

  app.post("/api/ops/staff/shifts", requireRestaurant, async (req, res) => {
    const rid = tenantId(req);
    const parsed = shiftSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.issues[0]?.message ?? "Geçersiz istek" });
    const input = parsed.data;
    const [staff] = await db.select().from(staffMembers).where(and(eq(staffMembers.id, input.staffId), eq(staffMembers.restaurantId, rid))).limit(1);
    if (!staff) return res.status(404).json({ message: "Personel bulunamadı" });
    const starts = new Date(input.startsAt);
    const ends = new Date(input.endsAt);
    if (!(ends > starts)) return res.status(400).json({ message: "Bitiş saati başlangıçtan sonra olmalı" });
    const [result] = await db.insert(staffShifts).values({
      restaurantId: rid,
      staffId: input.staffId,
      startsAt: starts,
      endsAt: ends,
      note: input.note,
    }).$returningId();
    res.status(201).json({ id: result.id });
  });

  app.post("/api/ops/staff/shifts/:id/check-in", requireRestaurant, async (req, res) => {
    const rid = tenantId(req);
    const result = await db.update(staffShifts).set({ checkedInAt: new Date() }).where(and(eq(staffShifts.id, Number(req.params.id)), eq(staffShifts.restaurantId, rid)));
    if (!result[0].affectedRows) return res.status(404).json({ message: "Vardiya bulunamadı" });
    res.json({ ok: true });
  });

  app.post("/api/ops/staff/shifts/:id/check-out", requireRestaurant, async (req, res) => {
    const rid = tenantId(req);
    const result = await db.update(staffShifts).set({ checkedOutAt: new Date() }).where(and(eq(staffShifts.id, Number(req.params.id)), eq(staffShifts.restaurantId, rid)));
    if (!result[0].affectedRows) return res.status(404).json({ message: "Vardiya bulunamadı" });
    res.json({ ok: true });
  });

  app.delete("/api/ops/staff/shifts/:id", requireRestaurant, async (req, res) => {
    const rid = tenantId(req);
    const result = await db.delete(staffShifts).where(and(eq(staffShifts.id, Number(req.params.id)), eq(staffShifts.restaurantId, rid)));
    if (!result[0].affectedRows) return res.status(404).json({ message: "Vardiya bulunamadı" });
    res.json({ ok: true });
  });
}
