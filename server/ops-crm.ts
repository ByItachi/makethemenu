// Cari Müşteri: müşteri kayıtları, borç/alacak ve sadakat puanı defteri.
// Üçüncü taraf gerektirmeyen, platformun kendi (native) modülüdür.
import type { Express } from "express";
import { and, desc, eq, like, or } from "drizzle-orm";
import { z } from "zod";
import { db } from "./db";
import { crmCustomers, crmLedgerEntries } from "../shared/schema";
import { requireRestaurant, tenantId } from "./auth/middleware";
import { writeAudit } from "./audit";

const customerSchema = z.object({
  name: z.string().min(2, "Ad en az 2 karakter").max(128),
  phone: z.string().max(32).optional(),
  email: z.string().email().max(160).optional().or(z.literal("")),
  note: z.string().max(255).optional(),
});

const ledgerSchema = z.object({
  customerId: z.number().int().positive(),
  type: z.enum(["borc", "odeme", "puan"]),
  amount: z.number(),
  note: z.string().max(255).optional(),
});

export function registerCrmRoutes(app: Express) {
  app.get("/api/ops/crm/customers", requireRestaurant, async (req, res) => {
    const rid = tenantId(req);
    const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
    const conditions = [eq(crmCustomers.restaurantId, rid)];
    if (q) conditions.push(or(like(crmCustomers.name, `%${q}%`), like(crmCustomers.phone, `%${q}%`))!);
    const rows = await db.select().from(crmCustomers).where(and(...conditions)).orderBy(desc(crmCustomers.createdAt)).limit(200);
    res.json({ customers: rows });
  });

  app.post("/api/ops/crm/customers", requireRestaurant, async (req, res) => {
    const rid = tenantId(req);
    const parsed = customerSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.issues[0]?.message ?? "Geçersiz istek" });
    const input = parsed.data;
    const [result] = await db.insert(crmCustomers).values({
      restaurantId: rid,
      name: input.name,
      phone: input.phone,
      email: input.email || null,
      note: input.note,
    }).$returningId();
    await writeAudit({ action: "crm.customer.created", entity: "crm_customers", entityId: String(result.id), restaurantId: rid, actorUserId: null });
    const [row] = await db.select().from(crmCustomers).where(eq(crmCustomers.id, result.id)).limit(1);
    res.status(201).json({ customer: row });
  });

  app.patch("/api/ops/crm/customers/:id", requireRestaurant, async (req, res) => {
    const rid = tenantId(req);
    const parsed = customerSchema.partial().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Geçersiz istek" });
    const input = parsed.data;
    const result = await db.update(crmCustomers).set({
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.phone !== undefined ? { phone: input.phone } : {}),
      ...(input.email !== undefined ? { email: input.email || null } : {}),
      ...(input.note !== undefined ? { note: input.note } : {}),
    }).where(and(eq(crmCustomers.id, Number(req.params.id)), eq(crmCustomers.restaurantId, rid)));
    if (!result[0].affectedRows) return res.status(404).json({ message: "Müşteri bulunamadı" });
    const [row] = await db.select().from(crmCustomers).where(eq(crmCustomers.id, Number(req.params.id))).limit(1);
    res.json({ customer: row });
  });

  app.delete("/api/ops/crm/customers/:id", requireRestaurant, async (req, res) => {
    const rid = tenantId(req);
    const result = await db.delete(crmCustomers).where(and(eq(crmCustomers.id, Number(req.params.id)), eq(crmCustomers.restaurantId, rid)));
    if (!result[0].affectedRows) return res.status(404).json({ message: "Müşteri bulunamadı" });
    res.json({ ok: true });
  });

  app.get("/api/ops/crm/customers/:id/ledger", requireRestaurant, async (req, res) => {
    const rid = tenantId(req);
    const rows = await db.select().from(crmLedgerEntries).where(and(eq(crmLedgerEntries.customerId, Number(req.params.id)), eq(crmLedgerEntries.restaurantId, rid))).orderBy(desc(crmLedgerEntries.createdAt));
    res.json({ entries: rows });
  });

  app.post("/api/ops/crm/ledger", requireRestaurant, async (req, res) => {
    const rid = tenantId(req);
    const parsed = ledgerSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.issues[0]?.message ?? "Geçersiz istek" });
    const input = parsed.data;
    const [customer] = await db.select().from(crmCustomers).where(and(eq(crmCustomers.id, input.customerId), eq(crmCustomers.restaurantId, rid))).limit(1);
    if (!customer) return res.status(404).json({ message: "Müşteri bulunamadı" });

    await db.insert(crmLedgerEntries).values({
      restaurantId: rid,
      customerId: input.customerId,
      type: input.type,
      amount: input.amount.toFixed(2),
      note: input.note,
    });

    if (input.type === "puan") {
      await db.update(crmCustomers).set({ loyaltyPoints: customer.loyaltyPoints + Math.round(input.amount) }).where(eq(crmCustomers.id, input.customerId));
    } else {
      const delta = input.type === "borc" ? -Math.abs(input.amount) : Math.abs(input.amount);
      await db.update(crmCustomers).set({ balance: (Number(customer.balance) + delta).toFixed(2) }).where(eq(crmCustomers.id, input.customerId));
    }

    await writeAudit({ action: "crm.ledger.created", entity: "crm_ledger_entries", entityId: String(input.customerId), restaurantId: rid, actorUserId: null, meta: { type: input.type, amount: input.amount } });
    const [updated] = await db.select().from(crmCustomers).where(eq(crmCustomers.id, input.customerId)).limit(1);
    res.status(201).json({ customer: updated });
  });
}
