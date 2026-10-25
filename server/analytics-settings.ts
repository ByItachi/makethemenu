import type { Express, Request, Response } from "express";
import { asc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "./db";
import { analyticsSettings, sectorProfiles } from "@shared/schema";
import { requirePlatformAdmin } from "./auth/middleware";

// GSC doğrulama token'ının anlık önbelleği (middleware'in her istekte DB'ye vurmasını önler).
let gscTokenCache: string | null = null;

export async function warmSeoCaches() {
  try {
    const [row] = await db.select().from(analyticsSettings).where(eq(analyticsSettings.id, 1));
    gscTokenCache = row?.gscVerificationToken || null;
  } catch {
    gscTokenCache = null;
  }
}

// Biçim doğrulamaları: hatalı ID ile etiket yüklenemesin.
export const GTM_ID_RE = /^GTM-[A-Z0-9]{4,10}$/;
export const GA4_ID_RE = /^G-[A-Z0-9]{6,12}$/;
export const PIXEL_ID_RE = /^\d{15,16}$/;

const settingsSchema = z
  .object({
    gtmContainerId: z.union([z.string().regex(GTM_ID_RE, "GTM ID 'GTM-XXXXXX' biçiminde olmalı."), z.literal("")]).nullable(),
    ga4MeasurementId: z.union([z.string().regex(GA4_ID_RE, "GA4 ID 'G-XXXXXXXXXX' biçiminde olmalı."), z.literal("")]).nullable(),
    metaPixelId: z.union([z.string().regex(PIXEL_ID_RE, "Meta Pixel ID 15-16 haneli sayı olmalı."), z.literal("")]).nullable(),
    gscVerificationToken: z.string().max(255).nullable(),
    gtmEnabled: z.boolean(),
    ga4Enabled: z.boolean(),
    metaPixelEnabled: z.boolean(),
    ga4ViaGtm: z.boolean(),
    consentRequired: z.boolean(),
    enableInDev: z.boolean(),
  })
  .refine((s) => !s.gtmEnabled || !!s.gtmContainerId, { message: "GTM etkinleştirmek için Container ID girin." })
  .refine((s) => !s.ga4Enabled || !!s.ga4MeasurementId, { message: "GA4'ü etkinleştirmek için Measurement ID girin." })
  .refine((s) => !s.metaPixelEnabled || !!s.metaPixelId, { message: "Meta Pixel'i etkinleştirmek için Pixel ID girin." })
  // GA4 hem GTM üzerinden hem doğrudan açık olamaz: çift page_view ölçümü olur.
  .refine((s) => !(s.ga4Enabled && s.ga4ViaGtm && !s.gtmEnabled), {
    message: "GA4 GTM üzerinden seçiliyken GTM de etkin olmalı; ya doğrudan gtag.js kullanın.",
  });

async function getRow() {
  const [row] = await db.select().from(analyticsSettings).where(eq(analyticsSettings.id, 1));
  if (row) return row;
  await db.insert(analyticsSettings).values({ id: 1 });
  const [created] = await db.select().from(analyticsSettings).where(eq(analyticsSettings.id, 1));
  return created;
}

/** Özet: ayar satırı yoksa güvenli varsayılan (hepsi kapalı). */
export function registerAnalyticsSettingsRoutes(app: Express) {
  // Search Console HTML meta doğrulaması: token tanımlıysa tüm HTML yanıtlarına
  // meta etiketi eklenir. Token yoksa hiçbir etiket üretilmez (doğrulama başarılı gösterilmez).
  app.use((req, res: Response, next) => {
    const origSend = res.send.bind(res);
    res.send = function sendSeo(body: Parameters<typeof origSend>[0]) {
      res.send = origSend;
      const token = (gscTokenCache || "").trim();
      if (
        token &&
        typeof body === "string" &&
        body.includes("<head>") &&
        !body.includes("google-site-verification")
      ) {
        const escaped = token.replace(/[<>&"']/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&#39;" })[c]!);
        body = body.replace(
          "<head>",
          `<head>\n    <meta name="google-site-verification" content="${escaped}" />`,
        );
      }
      return origSend(body);
    } as typeof res.send;
    next();
  });

  // PUBLIC: client yalnızca etkin hizmetlerin ID'lerini alır. Devre dışı ID'ler asla sızmaz.
  app.get("/api/analytics/settings", async (_req: Request, res: Response) => {
    try {
      const row = await getRow();
      res.json({
        consentRequired: row?.consentRequired ?? true,
        enableInDev: row?.enableInDev ?? false,
        gtm: row?.gtmEnabled && row?.gtmContainerId ? { id: row.gtmContainerId } : null,
        ga4:
          row?.ga4Enabled && row?.ga4MeasurementId && !(row?.ga4ViaGtm && row?.gtmEnabled)
            ? { id: row.ga4MeasurementId, viaGtm: false }
            : row?.ga4Enabled && row?.ga4ViaGtm && row?.gtmEnabled
              ? { id: row.ga4MeasurementId, viaGtm: true }
              : null,
        pixel: row?.metaPixelEnabled && row?.metaPixelId ? { id: row.metaPixelId } : null,
        gscToken: row?.gscVerificationToken || null,
      });
    } catch {
      // DB hatasında etiket yükleme davranışı güvenli tarafta kalır: hiçbir şey yükleme.
      res.json({ consentRequired: true, enableInDev: false, gtm: null, ga4: null, pixel: null, gscToken: null });
    }
  });

  // ADMIN: ayarları görüntüle / güncelle
  app.get("/api/admin/analytics/settings", requirePlatformAdmin, async (_req, res) => {
    const row = await getRow();
    res.json({
      gtmContainerId: row?.gtmContainerId ?? "",
      ga4MeasurementId: row?.ga4MeasurementId ?? "",
      metaPixelId: row?.metaPixelId ?? "",
      gscVerificationToken: row?.gscVerificationToken ?? "",
      gtmEnabled: !!row?.gtmEnabled,
      ga4Enabled: !!row?.ga4Enabled,
      metaPixelEnabled: !!row?.metaPixelEnabled,
      ga4ViaGtm: row?.ga4ViaGtm ?? true,
      consentRequired: row?.consentRequired ?? true,
      enableInDev: row?.enableInDev ?? false,
    });
  });

  app.put("/api/admin/analytics/settings", requirePlatformAdmin, async (req, res) => {
    const parsed = settingsSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.errors[0].message });
    }
    const s = parsed.data;
    await getRow();
    gscTokenCache = s.gscVerificationToken || null;
    await db
      .update(analyticsSettings)
      .set({
        gtmContainerId: s.gtmContainerId || null,
        ga4MeasurementId: s.ga4MeasurementId || null,
        metaPixelId: s.metaPixelId || null,
        gscVerificationToken: s.gscVerificationToken || null,
        gtmEnabled: s.gtmEnabled,
        ga4Enabled: s.ga4Enabled,
        metaPixelEnabled: s.metaPixelEnabled,
        ga4ViaGtm: s.ga4ViaGtm,
        consentRequired: s.consentRequired,
        enableInDev: s.enableInDev,
        updatedAt: new Date(),
      })
      .where(eq(analyticsSettings.id, 1));
    res.json({ ok: true });
  });
}

// === SEKTÖR PROFİLLERİ ===
const sectorUpsertSchema = z.object({
  slug: z.string().min(2).max(64).regex(/^[a-z0-9-]+$/, "Slug küçük harf, rakam ve tire içerebilir."),
  name: z.string().min(2).max(128),
  description: z.string().max(2000).nullable(),
  icon: z.string().max(64),
  modules: z.array(z.string().max(64)).max(64),
  orderFields: z.array(z.any()).max(64).nullable(),
  orderStatuses: z.array(z.any()).max(64).nullable(),
  dashboardCards: z.array(z.string().max(64)).max(64).nullable(),
  isActive: z.boolean(),
  isFeatured: z.boolean(),
  sortOrder: z.number().int().min(0).max(10_000),
});

/** Public: aktif sektörler (onboarding ve vitrin). */
export function registerSectorRoutes(app: Express) {
  app.get("/api/sectors", async (_req, res) => {
    const rows = await db
      .select()
      .from(sectorProfiles)
      .where(eq(sectorProfiles.isActive, true))
      .orderBy(asc(sectorProfiles.sortOrder));
    res.json({ sectors: rows });
  });

  app.get("/api/admin/sectors", requirePlatformAdmin, async (_req, res) => {
    const rows = await db.select().from(sectorProfiles).orderBy(asc(sectorProfiles.sortOrder));
    res.json({ sectors: rows });
  });

  app.put("/api/admin/sectors/:id", requirePlatformAdmin, async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ message: "Geçersiz sektör." });
    const parsed = sectorUpsertSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.errors[0].message });
    const s = parsed.data;
    const [updated] = await db
      .update(sectorProfiles)
      .set({
        name: s.name,
        description: s.description,
        icon: s.icon,
        modules: s.modules,
        orderFields: s.orderFields,
        orderStatuses: s.orderStatuses,
        dashboardCards: s.dashboardCards,
        isActive: s.isActive,
        isFeatured: s.isFeatured,
        sortOrder: s.sortOrder,
        updatedAt: new Date(),
      })
      .where(eq(sectorProfiles.id, id));
    if (!updated) return res.status(404).json({ message: "Sektör bulunamadı." });
    res.json({ ok: true, sector: updated });
  });
}
