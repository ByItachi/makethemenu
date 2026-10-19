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
import { registerCsvExportRoutes } from "./csv-export";
import { registerDomainRoutes, registerCustomDomainHostRewrite } from "./domains";
import { registerAiMenuRoutes } from "./ai/routes";
import { assertWithin3dLimit, Model3dLimitError, isValid3dUrl } from "./plans";
import { enforcePlanLimit } from "./plans";
import { insertRestaurantSchema, insertLicenseSchema, insertAdminNotificationSchema } from "@shared/schema";

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
  app.use(requireJsonBody);
  setupSession(app);
  registerAuthRoutes(app); // also attaches req.auth to every request
  registerPublicRoutes(app);
  registerTenantRoutes(app);
  registerPublicPlanRoutes(app);
  registerBillingRoutes(app);
  registerHealthRoutes(app);
  registerSeoRoutes(app);
  registerAnalyticsRoutes(app);
  registerCsvExportRoutes(app);
  registerDomainRoutes(app);
  registerAiMenuRoutes(app);

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
  app.use(["/api/admin", "/api/integrations"], requirePlatformAdmin);
  registerAdminPlanRoutes(app);
  registerAdminBillingRoutes(app);

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

  // === INTEGRATIONS ===
  // Yemek Sepeti Integration
  app.get('/api/integrations/yemeksepeti/status', async (req, res) => {
    try {
      // Check if Yemek Sepeti integration is configured
      const config = JSON.parse(localStorage.getItem('yemeksepeti_config') || '{}');
      const connected = !!(config.apiKey && config.restaurantId);
      res.json({ 
        connected, 
        lastSync: localStorage.getItem('yemeksepeti_last_sync') || null 
      });
    } catch (error) {
      res.status(500).json({ message: 'Status check failed' });
    }
  });

  app.post('/api/integrations/yemeksepeti/test', async (req, res) => {
    try {
      const { apiKey, apiSecret, restaurantId, branchId } = req.body;
      
      // Simulate API test
      if (apiKey && restaurantId) {
        // In real implementation, make actual API call to Yemek Sepeti
        res.json({ success: true, message: 'Connection successful' });
      } else {
        res.status(400).json({ message: 'Missing required fields' });
      }
    } catch (error) {
      res.status(500).json({ message: 'Connection test failed' });
    }
  });

  app.post('/api/integrations/yemeksepeti/sync', async (req, res) => {
    try {
      // Simulate sync process
      localStorage.setItem('yemeksepeti_last_sync', new Date().toISOString());
      res.json({ success: true, message: 'Sync completed' });
    } catch (error) {
      res.status(500).json({ message: 'Sync failed' });
    }
  });

  app.post('/api/integrations/yemeksepeti/disconnect', async (req, res) => {
    try {
      localStorage.removeItem('yemeksepeti_config');
      localStorage.removeItem('yemeksepeti_last_sync');
      res.json({ success: true, message: 'Disconnected successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Disconnect failed' });
    }
  });

  // Getir Integration
  app.get('/api/integrations/getir/status', async (req, res) => {
    try {
      const config = JSON.parse(localStorage.getItem('getir_config') || '{}');
      const connected = !!(config.clientId && config.restaurantId);
      res.json({ 
        connected, 
        lastSync: localStorage.getItem('getir_last_sync') || null 
      });
    } catch (error) {
      res.status(500).json({ message: 'Status check failed' });
    }
  });

  app.post('/api/integrations/getir/test', async (req, res) => {
    try {
      const { clientId, clientSecret, restaurantId, branchId } = req.body;
      
      if (clientId && restaurantId) {
        // Simulate API test for Getir
        res.json({ success: true, message: 'Connection successful' });
      } else {
        res.status(400).json({ message: 'Missing required fields' });
      }
    } catch (error) {
      res.status(500).json({ message: 'Connection test failed' });
    }
  });

  app.post('/api/integrations/getir/sync', async (req, res) => {
    try {
      localStorage.setItem('getir_last_sync', new Date().toISOString());
      res.json({ success: true, message: 'Sync completed' });
    } catch (error) {
      res.status(500).json({ message: 'Sync failed' });
    }
  });

  app.post('/api/integrations/getir/disconnect', async (req, res) => {
    try {
      localStorage.removeItem('getir_config');
      localStorage.removeItem('getir_last_sync');
      res.json({ success: true, message: 'Disconnected successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Disconnect failed' });
    }
  });

  // Generic integration endpoints for other services
  app.get('/api/integrations/:service/status', async (req, res) => {
    const { service } = req.params;
    try {
      const config = JSON.parse(localStorage.getItem(`${service}_config`) || '{}');
      const connected = !!(config.apiKey || config.clientId);
      res.json({ 
        connected, 
        lastSync: localStorage.getItem(`${service}_last_sync`) || null 
      });
    } catch (error) {
      res.status(500).json({ message: 'Status check failed' });
    }
  });

  app.post('/api/integrations/:service/test', async (req, res) => {
    const { service } = req.params;
    try {
      // Generic test endpoint for all integrations
      res.json({ success: true, message: `${service} connection test successful` });
    } catch (error) {
      res.status(500).json({ message: 'Connection test failed' });
    }
  });

  app.post('/api/integrations/:service/sync', async (req, res) => {
    const { service } = req.params;
    try {
      localStorage.setItem(`${service}_last_sync`, new Date().toISOString());
      res.json({ success: true, message: `${service} sync completed` });
    } catch (error) {
      res.status(500).json({ message: 'Sync failed' });
    }
  });

  app.post('/api/integrations/:service/disconnect', async (req, res) => {
    const { service } = req.params;
    try {
      localStorage.removeItem(`${service}_config`);
      localStorage.removeItem(`${service}_last_sync`);
      res.json({ success: true, message: `${service} disconnected successfully` });
    } catch (error) {
      res.status(500).json({ message: 'Disconnect failed' });
    }
  });
  
  // Custom endpoints for specific integrations
  // E-Adisyon: Generate adisyon
  app.post('/api/integrations/eadisyon/generate', async (req, res) => {
    try {
      res.json({ success: true, message: 'E-Adisyon generated successfully' });
    } catch (error) {
      res.status(500).json({ message: 'E-Adisyon generate failed' });
    }
  });

  // BOOSTFEEL: Create campaign
  app.post('/api/integrations/boostfeel/campaign', async (req, res) => {
    try {
      res.json({ success: true, message: 'Campaign created successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Campaign creation failed' });
    }
  });

  // Hotel Runner: Sync reservations
  app.post('/api/integrations/hotel-runner/sync-reservations', async (req, res) => {
    try {
      res.json({ success: true, message: 'Reservations sync successful' });
    } catch (error) {
      res.status(500).json({ message: 'Reservations sync failed' });
    }
  });
  
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
