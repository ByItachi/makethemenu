import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { setupAuth, registerAuthRoutes } from "./replit_integrations/auth";
import { insertRestaurantSchema, insertLicenseSchema, insertAdminNotificationSchema } from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // === AUTHENTICATION ===
  await setupAuth(app);
  registerAuthRoutes(app);

  // Production login is demo/localStorage based; ensure logout always resolves
  // even when the Replit OIDC provider is unavailable (setupAuth returns early).
  app.get("/api/logout", (req, res) => {
    if (typeof req.logout === "function") req.logout(() => {});
    res.redirect("/");
  });
  app.post("/api/logout", (req, res) => {
    if (typeof req.logout === "function") req.logout(() => {});
    res.status(200).json({ ok: true });
  });

  // === TABLES ===
  app.get(api.tables.list.path, async (req, res) => {
    const tables = await storage.getTables();
    res.json(tables);
  });

  app.post(api.tables.create.path, async (req, res) => {
    try {
      const input = api.tables.create.input.parse(req.body);
      const table = await storage.createTable(input);
      res.status(201).json(table);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.patch(api.tables.update.path, async (req, res) => {
    const table = await storage.updateTable(Number(req.params.id), req.body);
    res.json(table);
  });

  app.delete(api.tables.delete.path, async (req, res) => {
    await storage.deleteTable(Number(req.params.id));
    res.status(204).end();
  });

  // === CATEGORIES ===
  app.get(api.categories.list.path, async (req, res) => {
    const categories = await storage.getCategories();
    res.json(categories);
  });

  app.post(api.categories.create.path, async (req, res) => {
    try {
      const input = api.categories.create.input.parse(req.body);
      const category = await storage.createCategory(input);
      res.status(201).json(category);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.delete(api.categories.delete.path, async (req, res) => {
    await storage.deleteCategory(Number(req.params.id));
    res.status(204).end();
  });

  // === PRODUCTS ===
  app.get(api.products.list.path, async (req, res) => {
    const categoryId = req.query.categoryId ? Number(req.query.categoryId) : undefined;
    const products = await storage.getProducts(categoryId);
    res.json(products);
  });

  app.post(api.products.create.path, async (req, res) => {
    try {
      const input = api.products.create.input.parse(req.body);
      const product = await storage.createProduct(input);
      res.status(201).json(product);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.patch(api.products.update.path, async (req, res) => {
    const product = await storage.updateProduct(Number(req.params.id), req.body);
    res.json(product);
  });

  app.delete(api.products.delete.path, async (req, res) => {
    await storage.deleteProduct(Number(req.params.id));
    res.status(204).end();
  });

  // === ORDERS ===
  app.get(api.orders.list.path, async (req, res) => {
    const status = req.query.status as string | undefined;
    const orders = await storage.getOrders(status);
    res.json(orders);
  });

  app.get(api.orders.get.path, async (req, res) => {
    const order = await storage.getOrder(Number(req.params.id));
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json(order);
  });

  app.post(api.orders.create.path, async (req, res) => {
    try {
      const { items, ...orderData } = api.orders.create.input.parse(req.body);

      const products = await storage.getProducts();
      const itemsWithPrices = items.map((item) => {
        const product = products.find((p) => p.id === item.productId);
        if (!product) throw new Error(`Product ${item.productId} not found`);
        return { ...item, price: product.price };
      });

      const subtotal = itemsWithPrices.reduce(
        (sum, item) => sum + Number(item.price) * item.quantity,
        0
      );
      const totalAmount = (subtotal * 1.1).toFixed(2); // 10% tax, matches client display

      const order = await storage.createOrder({ ...orderData, totalAmount }, itemsWithPrices);
      res.status(201).json(order);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      console.error(err);
      res.status(400).json({ message: "Failed to create order" });
    }
  });

  app.patch(api.orders.updateStatus.path, async (req, res) => {
    const order = await storage.updateOrderStatus(Number(req.params.id), req.body.status);
    res.json(order);
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
  
  // === SEED DATA ===
  await seedDatabase();

  return httpServer;
}

function toRestaurantDto(row: Awaited<ReturnType<typeof storage.getRestaurants>>[number]) {
  const { lat, lng, ...rest } = row;
  return {
    ...rest,
    coordinates: lat != null && lng != null ? { lat: Number(lat), lng: Number(lng) } : undefined,
  };
}

async function seedDatabase() {
  const categories = await storage.getCategories();
  if (categories.length === 0) {
    console.log("Seeding database...");
    
    // Tables
    await storage.createTable({ name: "Table 1", capacity: 4, status: "available", x: 0, y: 0 });
    await storage.createTable({ name: "Table 2", capacity: 2, status: "available", x: 1, y: 0 });
    await storage.createTable({ name: "Table 3", capacity: 4, status: "occupied", x: 0, y: 1 });
    await storage.createTable({ name: "Table 4", capacity: 6, status: "reserved", x: 1, y: 1 });
    await storage.createTable({ name: "Takeaway", capacity: 0, status: "available", x: 2, y: 0 });

    // Categories
    const catDrinks = await storage.createCategory({ name: "Drinks", slug: "drinks", imageUrl: "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=800&q=80" });
    const catMain = await storage.createCategory({ name: "Main Course", slug: "main-course", imageUrl: "https://images.unsplash.com/photo-1559847844-5315695dadae?w=800&q=80" });
    const catDessert = await storage.createCategory({ name: "Desserts", slug: "desserts", imageUrl: "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=800&q=80" });

    // Products
    await storage.createProduct({ categoryId: catDrinks.id, name: "Cola", price: "2.50", isAvailable: true, imageUrl: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=800&q=80", description: "Ice cold cola" });
    await storage.createProduct({ categoryId: catDrinks.id, name: "Orange Juice", price: "3.50", isAvailable: true, imageUrl: "https://images.unsplash.com/photo-1600271886742-f049cd451bba?auto=format&fit=crop&w=800&q=80", description: "Freshly squeezed" });
    
    await storage.createProduct({ categoryId: catMain.id, name: "Cheeseburger", price: "12.99", isAvailable: true, imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80", description: "Juicy beef burger with cheese" });
    await storage.createProduct({ categoryId: catMain.id, name: "Margherita Pizza", price: "14.50", isAvailable: true, imageUrl: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=800&q=80", description: "Classic tomato and mozzarella" });
    await storage.createProduct({ categoryId: catMain.id, name: "Pasta Carbonara", price: "13.50", isAvailable: true, imageUrl: "https://images.unsplash.com/photo-1612874742237-982867143825?auto=format&fit=crop&w=800&q=80", description: "Creamy sauce with bacon" });

    await storage.createProduct({ categoryId: catDessert.id, name: "Chocolate Cake", price: "6.50", isAvailable: true, imageUrl: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80", description: "Rich chocolate layer cake" });
    await storage.createProduct({ categoryId: catDessert.id, name: "Tiramisu", price: "7.00", isAvailable: true, imageUrl: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=800&q=80", description: "Coffee flavored Italian dessert" });

    console.log("Database seeded successfully!");
  }
}
