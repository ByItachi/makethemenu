// Toplu SMS altyapısı: her işletme kendi kuyruğuna mesaj ekler (requireRestaurant ile izole).
// Sağlayıcı (SMS_PROVIDER) yapılandırılmamışsa mesajlar yalnızca kuyrukta bekler; "gönderildi" iddiası yapılmaz.
import type { Express, Request, Response } from "express";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "./db";
import { smsOutbox } from "@shared/schema";
import { requireRestaurant, tenantId } from "./auth/middleware";
import { getSmsTransport } from "./sms";
import { enqueueSms } from "./sms/outbox";

const bulkSchema = z.object({
  messages: z.array(z.object({
    phone: z.string().min(10).max(32),
    text: z.string().min(1).max(600),
  })).min(1).max(500),
});

export function registerSmsRoutes(app: Express) {
  app.get("/api/ops/sms/status", requireRestaurant, async (_req: Request, res: Response) => {
    const transport = getSmsTransport();
    res.json({
      configured: Boolean(transport),
      provider: transport?.name ?? null,
    });
  });

  app.post("/api/ops/sms/bulk", requireRestaurant, async (req: Request, res: Response) => {
    const parsed = bulkSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Geçersiz istek.", issues: parsed.error.issues });
    const rid = tenantId(req);
    for (const m of parsed.data.messages) {
      await enqueueSms(rid, m.phone, m.text);
    }
    const transport = getSmsTransport();
    res.json({
      queued: parsed.data.messages.length,
      configured: Boolean(transport),
      provider: transport?.name ?? null,
    });
  });

  app.get("/api/ops/sms/outbox", requireRestaurant, async (req: Request, res: Response) => {
    const rid = tenantId(req);
    const rows = await db
      .select({
        id: smsOutbox.id,
        toPhone: smsOutbox.toPhone,
        status: smsOutbox.status,
        attempts: smsOutbox.attempts,
        lastError: smsOutbox.lastError,
        createdAt: smsOutbox.createdAt,
        sentAt: smsOutbox.sentAt,
      })
      .from(smsOutbox)
      .where(eq(smsOutbox.restaurantId, rid))
      .orderBy(desc(smsOutbox.id))
      .limit(100);
    res.json(rows);
  });
}
