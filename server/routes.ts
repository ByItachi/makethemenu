import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { setupSession } from "./auth/session";
import { registerAuthRoutes } from "./auth/routes";
import {
  requireRestaurant,
  requirePlatformAdmin,
  requireJsonBody,
  securityHeaders,
  tenantId,
} from "./auth/middleware";
import { registerPublicRoutes } from "./public-menu";
import { registerAnalyticsRoutes } from "./analytics";
import { registerTenantRoutes } from "./tenant-routes";
import { registerPublicPlanRoutes, registerAdminPlanRoutes } from "./plan-routes";
import { registerBillingRoutes, registerAdminBillingRoutes } from "./payments/routes";
import { registerHealthRoutes, registerSeoRoutes } from "./seo";
import { registerAnalyticsSettingsRoutes, registerSectorRoutes, warmSeoCaches } from "./analytics-settings";
import { registerCsvExportRoutes } from "./csv-export";
import { registerDomainRoutes, registerCustomDomainHostRewrite } from "./domains";
import { registerAiMenuRoutes } from "./ai/routes";
import { registerAdminTemplateRoutes, registerPublicTemplateRoutes } from "./admin-templates";
import { registerPluginRoutes } from "./plugins";
import { registerSectorOpsRoutes } from "./sector-ops";
import { registerSmsRoutes } from "./sms-routes";
import { registerSectorDrivers } from "./sector-drivers";
import { registerFasonRoutes } from "./fason";
import { registerDeliveryService } from "./delivery-service";
import { registerIntegrationCenterRoutes } from "./integration-center";
import { registerSubscriptionCheckoutRoutes } from "./subscription";
import { emitIntegrationEvent } from "./integrations/runner";
import { integrationApiKeys, integrationConnections } from "@shared/schema";
import { CATALOG } from "./integrations/registry";
import crypto from "crypto";
import { assertWithin3dLimit, Model3dLimitError, isValid3dUrl } from "./plans";
import { enforcePlanLimit } from "./plans";
import { insertRestaurantSchema, insertLicenseSchema, insertAdminNotificationSchema, restaurants, users } from "@shared/schema";
import { and, eq } from "drizzle-orm";import { db } from "./db";
import { writeAudit } from "./audit";

function sendValidationError(err: unknown, res: import("express").Response): boolean {
  if (err instanceof z.ZodError) {
    res.status(400).json({ message: err.errors[0].message });
    return true;
  }
  return false;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.use(securityHeaders);
  // CSRF derinlemesine savunma: gövdeli isteklerde Origin varsa siteyle aynı host olmalı.
  // (Çerezler SameSite=Lax; bu kontrol de cross-site form/fetch saldırılarını kapatır.
  //  Custom alan adları Origin=Host olduğu için etkilenmez; webhook'larda Origin gelmez.)
  app.use((req, res, next) => {
    if (!["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) return next();
    const origin = req.headers.origin;
    if (origin) {
      // Ters proxy arkasında (örn. LiteSpeed/Apache [P] kuralı) Host başlığı
      // genellikle backend adresine (127.0.0.1:PORT) yeniden yazılır; gerçek
      // host X-Forwarded-Host içinde gelir. "trust proxy" zaten ayarlı.
      const forwardedHost = (req.headers["x-forwarded-host"] as string | undefined)
        ?.split(",")[0]
        ?.trim();
      const expectedHost = forwardedHost || req.headers.host;
      try {
        if (new URL(origin).host !== expectedHost) {
          return res.status(403).json({ message: "Geçersiz istek kaynağı." });
        }
      } catch {
        return res.status(403).json({ message: "Geçersiz istek kaynağı." });
      }
    }
    next();
  });
  app.use(requireJsonBody);
  setupSession(app);
  registerAuthRoutes(app); // also attaches req.auth to every request
  registerPublicRoutes(app);
  registerTenantRoutes(app);
  registerPublicPlanRoutes(app);
  registerBillingRoutes(app);
  registerHealthRoutes(app);
  registerSeoRoutes(app);
  await warmSeoCaches();
  registerAnalyticsSettingsRoutes(app);
  registerSectorRoutes(app);
  registerAnalyticsRoutes(app);
  registerCsvExportRoutes(app);
  registerDomainRoutes(app);
  registerAiMenuRoutes(app);
  registerPluginRoutes(app);
  registerSectorOpsRoutes(app);
  registerSmsRoutes(app);
  registerSectorDrivers(app);
  registerFasonRoutes(app);
  registerDeliveryService(app);
  registerIntegrationCenterRoutes(app);
  registerSubscriptionCheckoutRoutes(app);
  registerPublicTemplateRoutes(app);

  // === PUBLIC: /api/ic/ping — Veri Aktarımı API bağlantı testi (X-API-Key doğrulamalı) ===
  // Not: /api/health zaten registerHealthRoutes tarafından kullanıldığı için ayrı uç nokta.
  app.get("/api/ic/ping", async (req, res) => {
    const apiKey = String(req.headers["x-api-key"] ?? "");
    const restaurantId = Number(req.headers["x-restaurant-id"] ?? 0);
    if (!apiKey || !Number.isInteger(restaurantId) || restaurantId <= 0) {
      return res.status(401).json({ ok: false, message: "API anahtarı ve restoran kimliği gerekli." });
    }
    const keyHash = crypto.createHash("sha256").update(apiKey).digest("hex");
    const [keyRow] = (await db
      .select()
      .from(integrationApiKeys)
      .where(and(eq(integrationApiKeys.keyHash, keyHash), eq(integrationApiKeys.isActive, true)))
      .limit(1));
    if (!keyRow || keyRow.restaurantId !== restaurantId) {
      return res.status(401).json({ ok: false, message: "API anahtarı geçersiz." });
    }
    await db.update(integrationApiKeys).set({ lastUsedAt: new Date() }).where(eq(integrationApiKeys.id, keyRow.id));
    res.json({ ok: true, service: "makethemenu-data-api", restaurantId, time: new Date().toISOString() });
  });

  // === PUBLIC: CONTACT / APPLICATION FORMS ===
  app.post(api.contact.submit.path, async (req, res) => {
    try {
      const input = api.contact.submit.input.parse(req.body);
      const message = await storage.createContactMessage(input);
      // Yönetim paneline de bildirim düşür; cevapsız talep kalmasın.
      await storage.createAdminNotification({
        type: "contact",
        title: `Yeni mesaj: ${input.subject}`,
        message: `${input.name} (${input.email}): ${input.message}`.slice(0, 2000),
        contact: input.email,
        status: "unread",
      });
      res.status(201).json({ ok: true, id: message.id });
    } catch (err) {
      if (sendValidationError(err, res)) return;
      throw err;
    }
  });

  // === PUBLIC: LICENSE CHECK (masaüstü uygulama /desktop demo lisans doğrulaması) ===
  app.get("/api/license-check", (_req, res) => {
    // Demo kurulumunda lisans sunucusu yerine mock yanıt döner.
    // Gerçek dağıtımda bu endpoint lisans anahtarını doğrulayan servise köprü olur.
    res.json({
      status: "valid",
      edition: "DEMO",
      server: "Connected (SQL Server Mock)",
      checkedAt: new Date().toISOString(),
    });
  });

  // Business (tenant) data: must be logged in and belong to a business
  app.use(["/api/tables", "/api/categories", "/api/products", "/api/orders"], requireRestaurant);

  // === TABLES ===
  app.get(api.tables.list.path, async (req, res) => {
    res.json(await storage.getTables(tenantId(req)));
  });

  app.post(api.tables.create.path, async (req, res) => {
    try {
      const input = api.tables.create.input.parse(req.body);
      if (await enforcePlanLimit(req, res, tenantId(req), "tables")) return;
      res.status(201).json(await storage.createTable(tenantId(req), input));
    } catch (err) {
      if (sendValidationError(err, res)) return;
      throw err;
    }
  });

  app.patch(api.tables.update.path, async (req, res) => {
    try {
      const input = api.tables.update.input.parse(req.body);
      const table = await storage.updateTable(tenantId(req), Number(req.params.id), input);
      if (!table) return res.status(404).json({ message: "Masa bulunamadı." });
      res.json(table);
    } catch (err) {
      if (sendValidationError(err, res)) return;
      throw err;
    }
  });

  app.delete(api.tables.delete.path, async (req, res) => {
    const ok = await storage.deleteTable(tenantId(req), Number(req.params.id));
    if (!ok) return res.status(404).json({ message: "Masa bulunamadı." });
    res.status(204).end();
  });

  // === CATEGORIES ===
  app.get(api.categories.list.path, async (req, res) => {
    res.json(await storage.getCategories(tenantId(req)));
  });

  app.post(api.categories.create.path, async (req, res) => {
    try {
      const input = api.categories.create.input.parse(req.body);
      res.status(201).json(await storage.createCategory(tenantId(req), input));
    } catch (err) {
      if (sendValidationError(err, res)) return;
      throw err;
    }
  });

  app.delete(api.categories.delete.path, async (req, res) => {
    const ok = await storage.deleteCategory(tenantId(req), Number(req.params.id));
    if (!ok) return res.status(404).json({ message: "Kategori bulunamadı." });
    res.status(204).end();
  });

  // Şablon oluşturucu: sürükle-bırak ile kategori sıralaması.
  app.post("/api/categories/reorder", async (req, res) => {
    const parsed = z.object({ ids: z.array(z.number().int().positive()).min(1).max(200) }).safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Geçersiz sıralama listesi." });
    await storage.reorderCategories(tenantId(req), parsed.data.ids);
    res.json({ ok: true });
  });

  // === PRODUCTS ===
  app.get(api.products.list.path, async (req, res) => {
    const categoryId = req.query.categoryId ? Number(req.query.categoryId) : undefined;
    res.json(await storage.getProducts(tenantId(req), categoryId));
  });

  // 3D model attachment is validated and quota-checked by plan (spec §6).
  const check3dUrl = async (req: import("express").Request, res: import("express").Response, value: unknown): Promise<boolean> => {
    if (value === undefined) return false;
    if (value !== null && (typeof value !== "string" || !isValid3dUrl(value))) {
      res.status(400).json({ message: "3D model bağlantısı http(s) üzerinde .glb veya .gltf dosyası olmalı." });
      return true;
    }
    try {
      await assertWithin3dLimit(tenantId(req), (value as string | null) ?? null);
      return false;
    } catch (err) {
      if (err instanceof Model3dLimitError) {
        res.status(403).json({ message: err.message, code: err.code });
        return true;
      }
      throw err;
    }
  };

  app.post(api.products.create.path, async (req, res) => {
    try {
      const input = api.products.create.input.parse(req.body);
      if (await enforcePlanLimit(req, res, tenantId(req), "products")) return;
      if (await check3dUrl(req, res, input.model3dUrl)) return;
      res.status(201).json(await storage.createProduct(tenantId(req), input));
    } catch (err) {
      if (sendValidationError(err, res)) return;
      if (err instanceof Error && err.message === "Category not found") return res.status(400).json({ message: "Kategori bulunamadı." });
      throw err;
    }
  });

  app.patch(api.products.update.path, async (req, res) => {
    try {
      const input = api.products.update.input.parse(req.body);
      // Re-sending the model a product already has must not consume quota again.
      if (input.model3dUrl !== undefined) {
        const [current] = await storage.getProducts(tenantId(req)).then((ps) => ps.filter((p) => p.id === Number(req.params.id)));
        if (current?.model3dUrl === input.model3dUrl) {
          const product = await storage.updateProduct(tenantId(req), Number(req.params.id), input);
          if (!product) return res.status(404).json({ message: "Ürün bulunamadı." });
          return res.json(product);
        }
      }
      if (await check3dUrl(req, res, input.model3dUrl)) return;
      const product = await storage.updateProduct(tenantId(req), Number(req.params.id), input);
      if (!product) return res.status(404).json({ message: "Ürün bulunamadı." });
      res.json(product);
    } catch (err) {
      if (sendValidationError(err, res)) return;
      if (err instanceof Error && err.message === "Category not found") return res.status(400).json({ message: "Kategori bulunamadı." });
      throw err;
    }
  });

  app.delete(api.products.delete.path, async (req, res) => {
    const ok = await storage.deleteProduct(tenantId(req), Number(req.params.id));
    if (!ok) return res.status(404).json({ message: "Ürün bulunamadı." });
    res.status(204).end();
  });

  // Şablon oluşturucu: sürükle-bırak ile ürün sıralaması (kategori içi).
  app.post("/api/products/reorder", async (req, res) => {
    const parsed = z.object({ ids: z.array(z.number().int().positive()).min(1).max(500) }).safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Geçersiz sıralama listesi." });
    await storage.reorderProducts(tenantId(req), parsed.data.ids);
    res.json({ ok: true });
  });

  // === ORDERS ===
  app.get(api.orders.list.path, async (req, res) => {
    const status = req.query.status as string | undefined;
    res.json(await storage.getOrders(tenantId(req), status));
  });

  app.get(api.orders.get.path, async (req, res) => {
    const order = await storage.getOrder(tenantId(req), Number(req.params.id));
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json(order);
  });

  app.post(api.orders.create.path, async (req, res) => {
    try {
      const tid = tenantId(req);
      const { items, ...orderData } = api.orders.create.input.parse(req.body);
      if (items.length === 0) return res.status(400).json({ message: "Sipariş en az bir ürün içermeli." });

      // Prices always come from the database, never from the client
      const products = await storage.getProducts(tid);
      const itemsWithPrices = items.map((item) => {
        const product = products.find((p) => p.id === item.productId);
        if (!product) throw new Error(`Product ${item.productId} not found`);
        if (product.isAvailable === false) throw new Error(`Product ${item.productId} is unavailable`);
        return { ...item, price: product.price };
      });

      const subtotal = itemsWithPrices.reduce(
        (sum, item) => sum + Number(item.price) * item.quantity,
        0
      );
      const totalAmount = (subtotal * 1.1).toFixed(2); // 10% tax, matches client display

      const order = await storage.createOrder(tid, { ...orderData, totalAmount }, itemsWithPrices);
      // Entegrasyon Merkezi: giden webhook'lara sipariş oluşturuldu olayı yayınla
      emitIntegrationEvent(tid, "order.created", { internalOrderId: order.id, total: Number(order.totalAmount), source: "pos" }).catch(() => undefined);
      res.status(201).json(order);
    } catch (err) {
      if (sendValidationError(err, res)) return;
      console.error(err);
      res.status(400).json({ message: "Sipariş oluşturulamadı." });
    }
  });

  app.patch(api.orders.updateStatus.path, async (req, res) => {
    try {
      const input = api.orders.updateStatus.input.parse(req.body);
      const order = await storage.updateOrderStatus(tenantId(req), Number(req.params.id), input.status);
      if (!order) return res.status(404).json({ message: "Sipariş bulunamadı." });
      res.json(order);
    } catch (err) {
      if (sendValidationError(err, res)) return;
      throw err;
    }
  });

  // === PLATFORM ADMIN (all /api/admin and /api/integrations routes) ===
  app.use("/api/admin", requirePlatformAdmin);
  registerAdminPlanRoutes(app);
  registerAdminBillingRoutes(app);
  registerAdminTemplateRoutes(app);

  // === ADMIN: IMPERSONATION (login as a business user) ===
  app.post("/api/admin/impersonate", async (req: import("express").Request, res: import("express").Response) => {
    let userId = Number(req.body?.userId);
    if (!Number.isInteger(userId) || userId <= 0) {
      const restaurantId = Number(req.body?.restaurantId);
      if (!Number.isInteger(restaurantId) || restaurantId <= 0) {
        return res.status(400).json({ message: "Geçersiz kullanıcı." });
      }
      const [rest] = await db.select().from(restaurants).where(eq(restaurants.id, restaurantId)).limit(1);
      if (!rest) return res.status(404).json({ message: "İşletme bulunamadı." });
      if (rest.ownerUserId) {
        userId = rest.ownerUserId;
      } else {
        // Owner bağlanmamışsa işletmenin ilk aktif kullanıcısına geç (demo/seed verileri)
        const [fallback] = await db.select().from(users).where(and(eq(users.restaurantId, restaurantId), eq(users.isActive, true))).limit(1);
        if (!fallback) return res.status(404).json({ message: "İşletme kullanıcısı bulunamadı." });
        userId = fallback.id;
      }
    }
    const [target] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!target || target.isActive === false) {
      return res.status(404).json({ message: "Kullanıcı bulunamadı." });
    }
    const adminId = req.auth!.userId;
    await new Promise<void>((resolve, reject) =>
      req.session.regenerate((err) => (err ? reject(err) : resolve()))
    );
    req.session.userId = target.id;
    (req.session as any).impersonatorId = adminId;
    await writeAudit({
      restaurantId: target.restaurantId ?? null,
      actorUserId: adminId,
      action: "admin.impersonate",
      entity: "user",
      entityId: String(target.id),
      req,
    });
    res.json({ ok: true, user: { id: target.id, email: target.email, restaurantId: target.restaurantId ?? null } });
  });

  // === ADMIN: RESTAURANTS / BUSINESSES ===
  app.get('/api/admin/restaurants', async (req, res) => {
    const rows = await storage.getRestaurants();
    res.json(rows.map(toRestaurantDto));
  });

  app.post('/api/admin/restaurants', async (req, res) => {
    try {
      const input = insertRestaurantSchema.parse(req.body);
      const row = await storage.createRestaurant(input);
      res.status(201).json(toRestaurantDto(row));
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(400).json({ message: "Failed to create restaurant" });
    }
  });

  app.put('/api/admin/restaurants', async (req, res) => {
    try {
      const { id, ...rest } = req.body;
      const input = insertRestaurantSchema.partial().parse(rest);
      const row = await storage.updateRestaurant(Number(id), input);
      res.json(toRestaurantDto(row));
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(400).json({ message: "Failed to update restaurant" });
    }
  });

  app.delete('/api/admin/restaurants', async (req, res) => {
    await storage.deleteRestaurant(Number(req.query.id));
    res.status(204).end();
  });

  // === ADMIN: LICENSES ===
  app.get('/api/admin/licenses', async (req, res) => {
    res.json(await storage.getLicenses());
  });

  app.post('/api/admin/licenses', async (req, res) => {
    try {
      const input = insertLicenseSchema.parse(req.body);
      const row = await storage.createLicense(input);
      await storage.createLicenseActivity({
        action: "Oluşturuldu",
        code: row.code,
        date: new Date().toLocaleString('tr-TR'),
        details: `${row.business} için ${row.type} lisansı oluşturuldu`,
      });
      res.status(201).json(row);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(400).json({ message: "Failed to create license" });
    }
  });

  app.put('/api/admin/licenses', async (req, res) => {
    try {
      const { id, ...rest } = req.body;
      const input = insertLicenseSchema.partial().parse(rest);
      const row = await storage.updateLicense(Number(id), input);
      await storage.createLicenseActivity({
        action: "Güncellendi",
        code: row.code,
        date: new Date().toLocaleString('tr-TR'),
        details: `${row.business} lisansı güncellendi`,
      });
      res.json(row);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(400).json({ message: "Failed to update license" });
    }
  });

  app.delete('/api/admin/licenses', async (req, res) => {
    const id = Number(req.query.id);
    const existing = await storage.getLicense(id);
    await storage.deleteLicense(id);
    if (existing) {
      await storage.createLicenseActivity({
        action: "Silindi",
        code: existing.code,
        date: new Date().toLocaleString('tr-TR'),
        details: `${existing.business} lisansı silindi`,
      });
    }
    res.status(204).end();
  });

  app.get('/api/admin/license-activities', async (req, res) => {
    res.json(await storage.getLicenseActivities());
  });

  // === ADMIN: NOTIFICATIONS ===
  app.get('/api/admin/notifications', async (req, res) => {
    res.json(await storage.getAdminNotifications());
  });

  app.put('/api/admin/notifications', async (req, res) => {
    try {
      const { id, status } = req.body;
      const row = await storage.updateAdminNotification(Number(id), { status });
      res.json(row);
    } catch (err) {
      res.status(400).json({ message: "Failed to update notification" });
    }
  });

  app.delete('/api/admin/notifications', async (req, res) => {
    await storage.deleteAdminNotification(Number(req.query.id));
    res.status(204).end();
  });

  // === ADMIN: PENDING PAYMENTS ===
  app.get('/api/admin/pending-payments', async (req, res) => {
    res.json(await storage.getPendingPayments());
  });

  // === ADMIN: SETTINGS (stub) ===
  app.post('/api/admin/settings', async (req, res) => {
    res.json({ success: true });
  });

  // === INTEGRATIONS (eski detay sayfası uçları) ===
  // Dürüstlük kuralı: Buradaki uçlar sahte başarı/localStorage kurgusu üretmez.
  // Gerçekten çalışan sağlayıcı (veri-aktarimi) registry adapter'ına delege edilir;
  // diğerleri 501 "henüz geliştirilmedi" döndürür. Birincil ve tam özellikli
  // arayüz Entegrasyon Merkezi'dir (/api/ic/*).
  const NOT_IMPLEMENTED_MSG =
    "Bu entegrasyon henüz geliştirilmedi. Sağlayıcı API erişimi sağlandığında yazılacak. Entegrasyon Merkezi'nden durumunu görebilirsiniz.";
  const isVeriAktarimi = (sv: string) => sv === "veri-aktarimi" || sv === "veri-aktarimi-api";

  const veriAdapter = CATALOG["veri-aktarimi"];
  const veriCreds = (body: unknown) => {
    const { apiKey, apiSecret } = (body ?? {}) as { apiKey?: string; apiSecret?: string };
    if (!apiKey || !apiSecret) return null;
    return { apiKey, apiSecret };
  };
  const missingCreds = { message: "API anahtarı ve gizli anahtar zorunludur." };

  app.get("/api/integrations/:service/status", requireRestaurant, async (req, res) => {
    const { service } = req.params;
    if (!isVeriAktarimi(String(service))) return res.status(501).json({ message: NOT_IMPLEMENTED_MSG });
    const rid = tenantId(req);
    const row = (
      await db
        .select()
        .from(integrationConnections)
        .where(and(eq(integrationConnections.restaurantId, rid), eq(integrationConnections.providerKey, "veri-aktarimi")))
        .limit(1)
    )[0];
    res.json({ connected: !!row, lastSync: row?.updatedAt ?? null, implemented: true });
  });

  app.post("/api/integrations/:service/test", requireRestaurant, async (req, res) => {
    const { service } = req.params;
    if (!isVeriAktarimi(String(service))) return res.status(501).json({ message: NOT_IMPLEMENTED_MSG });
    const creds = veriCreds(req.body);
    if (!creds) return res.status(400).json(missingCreds);
    res.json(await veriAdapter.testConnection!(tenantId(req), creds));
  });

  app.post("/api/integrations/:service/sync", requireRestaurant, async (req, res) => {
    const { service } = req.params;
    if (!isVeriAktarimi(String(service))) return res.status(501).json({ message: NOT_IMPLEMENTED_MSG });
    const creds = veriCreds(req.body);
    if (!creds) return res.status(400).json(missingCreds);
    try {
      const items = await veriAdapter.fetchOrders!(tenantId(req), creds);
      res.json({ success: true, message: "Senkronizasyon tamamlandı.", count: items.length });
    } catch (err) {
      res.status(502).json({ success: false, message: `Sağlayıcıdan veri alınamadı: ${err instanceof Error ? err.message : "bilinmeyen hata"}` });
    }
  });

  app.post("/api/integrations/veri-aktarimi-api/test-transfer", requireRestaurant, async (req, res) => {
    const creds = veriCreds(req.body);
    if (!creds) return res.status(400).json(missingCreds);
    const rid = tenantId(req);
    const test = await veriAdapter.testConnection!(rid, creds);
    if (!test.ok) return res.status(400).json({ success: false, message: test.message });
    try {
      const items = await veriAdapter.fetchOrders!(rid, creds);
      res.json({ success: true, message: "Test veri aktarımı tamamlandı.", itemCount: items.length });
    } catch (err) {
      res.status(502).json({ success: false, message: `Test aktarımı başarısız: ${err instanceof Error ? err.message : "bilinmeyen hata"}` });
    }
  });

  app.post("/api/integrations/:service/disconnect", requireRestaurant, async (req, res) => {
    const { service } = req.params;
    if (!isVeriAktarimi(String(service))) return res.status(501).json({ message: NOT_IMPLEMENTED_MSG });
    const rid = tenantId(req);
    await db
      .delete(integrationConnections)
      .where(and(eq(integrationConnections.restaurantId, rid), eq(integrationConnections.providerKey, "veri-aktarimi")));
    res.json({ success: true, message: "Bağlantı kaldırıldı." });
  });

  // Diğer özel sağlayıcı uçları (e-adisyon üretimi, kampanya, rezervasyon
  // senkronu) gerçek API erişimi olmadan sahte başarı DÖNDÜRMEZ; dürüst 501.
  app.post("/api/integrations/eadisyon/generate", (_req, res) => res.status(501).json({ message: NOT_IMPLEMENTED_MSG }));
  app.post("/api/integrations/boostfeel/campaign", (_req, res) => res.status(501).json({ message: NOT_IMPLEMENTED_MSG }));
  app.post("/api/integrations/hotel-runner/sync-reservations", (_req, res) => res.status(501).json({ message: NOT_IMPLEMENTED_MSG }));

  // Custom-domain host rewrite must come after all API routes and before vite/static (index.ts).
  registerCustomDomainHostRewrite(app);

  return httpServer;
}

function toRestaurantDto(row: Awaited<ReturnType<typeof storage.getRestaurants>>[number]) {
  const { lat, lng, ...rest } = row;
  return {
    ...rest,
    coordinates: lat != null && lng != null ? { lat: Number(lat), lng: Number(lng) } : undefined,
  };
}
