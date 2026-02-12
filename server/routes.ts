import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { setupAuth, registerAuthRoutes } from "./replit_integrations/auth";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // === AUTHENTICATION ===
  await setupAuth(app);
  registerAuthRoutes(app);

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
      const { items, ...orderData } = req.body;
      // We need to validate items separately or construct full input
      const order = await storage.createOrder(orderData, items);
      res.status(201).json(order);
    } catch (err) {
      console.error(err);
      res.status(400).json({ message: "Failed to create order" });
    }
  });

  app.patch(api.orders.updateStatus.path, async (req, res) => {
    const order = await storage.updateOrderStatus(Number(req.params.id), req.body.status);
    res.json(order);
  });
  
  // === SEED DATA ===
  await seedDatabase();

  return httpServer;
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
    await storage.createProduct({ categoryId: catDrinks.id, name: "Cola", price: "2.50", isAvailable: true, imageUrl: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=800&q=80", description: "Ice cold cola" });
    await storage.createProduct({ categoryId: catDrinks.id, name: "Orange Juice", price: "3.50", isAvailable: true, imageUrl: "https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=800&q=80", description: "Freshly squeezed" });
    
    await storage.createProduct({ categoryId: catMain.id, name: "Cheeseburger", price: "12.99", isAvailable: true, imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80", description: "Juicy beef burger with cheese" });
    await storage.createProduct({ categoryId: catMain.id, name: "Margherita Pizza", price: "14.50", isAvailable: true, imageUrl: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800&q=80", description: "Classic tomato and mozzarella" });
    await storage.createProduct({ categoryId: catMain.id, name: "Pasta Carbonara", price: "13.50", isAvailable: true, imageUrl: "https://images.unsplash.com/photo-1612874742237-982867143825?w=800&q=80", description: "Creamy sauce with bacon" });

    await storage.createProduct({ categoryId: catDessert.id, name: "Chocolate Cake", price: "6.50", isAvailable: true, imageUrl: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&q=80", description: "Rich chocolate layer cake" });
    await storage.createProduct({ categoryId: catDessert.id, name: "Tiramisu", price: "7.00", isAvailable: true, imageUrl: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=800&q=80", description: "Coffee flavored Italian dessert" });

    console.log("Database seeded successfully!");
  }
}
