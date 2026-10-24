import { storage } from "./storage";
import { db } from "./db";
import { eq, sql } from "drizzle-orm";
import { roles, users, restaurants } from "@shared/schema";
import { hashPassword } from "./auth/password";
import { generateSlug } from "./tenancy/slugs";

export const DEMO_BUSINESS_SLUG = "varsayilan-isletme";

/** The business that owns the demo catalogue (also the target of the tenancy migration). */
async function ensureDemoBusiness(): Promise<number> {
  const [row] = await db.select({ id: restaurants.id }).from(restaurants).where(eq(restaurants.slug, DEMO_BUSINESS_SLUG));
  if (row) return row.id;
  const [ins] = await db.insert(restaurants).values({
    name: "Varsayılan İşletme", type: "Restoran", address: "-", country: "Türkiye", status: "active", slug: DEMO_BUSINESS_SLUG, currency: "TRY",
  });
  return ins.insertId;
}

export async function seedDatabase() {
  console.log("Seeding database...");
  const demoId = await ensureDemoBusiness();

  try {
    // Seed Categories
    const existingCategories = await storage.getCategories(demoId);
    if (existingCategories.length === 0) {
      console.log("Seeding categories...");
      const categories = [
        { name: "Ana Yemekler", slug: "ana-yemekler", imageUrl: "/images/ana-yemekler.svg", icon: "Utensils" },
        { name: "İçecekler", slug: "icecekler", imageUrl: "/images/icecekler.svg", icon: "Coffee" },
        { name: "Tatlılar", slug: "tatlilar", imageUrl: "/images/tatlilar.svg", icon: "Dessert" },
        { name: "Başlangıçlar", slug: "baslangiclar", imageUrl: "/images/baslangiclar.svg", icon: "Salad" },
      ];

      for (const cat of categories) {
        await storage.createCategory(demoId, cat);
      }
      console.log("Categories seeded.");
    }

    // Seed Products
    const existingProducts = await storage.getProducts(demoId);
    if (existingProducts.length === 0) {
      console.log("Seeding products...");
      const categories = await storage.getCategories(demoId);
      const mainCourseCat = categories.find(c => c.slug === "ana-yemekler");
      const drinksCat = categories.find(c => c.slug === "icecekler");
      const dessertsCat = categories.find(c => c.slug === "tatlilar");
      const startersCat = categories.find(c => c.slug === "baslangiclar");

      const products = [];

      if (mainCourseCat) {
        products.push(
          { categoryId: mainCourseCat.id, name: "Izgara Köfte", description: "Özel baharatlarla hazırlanmış ızgara köfte, pilav ve salata ile.", price: "250.00", imageUrl: "/images/izgara-kofte.svg", isAvailable: true },
          { categoryId: mainCourseCat.id, name: "Adana Kebap", description: "Zırh kıyması ile hazırlanmış acılı Adana kebap.", price: "280.00", imageUrl: "/images/adana-kebap.svg", isAvailable: true },
          { categoryId: mainCourseCat.id, name: "Tavuk Şiş", description: "Marine edilmiş tavuk göğsü şiş, közlenmiş biber ile.", price: "220.00", imageUrl: "/images/tavuk-sis.svg", isAvailable: true }
        );
      }

      if (drinksCat) {
        products.push(
          { categoryId: drinksCat.id, name: "Ayran", description: "Ev yapımı yayık ayranı.", price: "30.00", imageUrl: "/images/ayran.svg", isAvailable: true },
          { categoryId: drinksCat.id, name: "Kola", description: "Soğuk kutu kola.", price: "40.00", imageUrl: "/images/kola.svg", isAvailable: true },
          { categoryId: drinksCat.id, name: "Türk Kahvesi", description: "Geleneksel Türk kahvesi, lokum ile.", price: "60.00", imageUrl: "/images/turk-kahvesi.svg", isAvailable: true }
        );
      }

      if (dessertsCat) {
        products.push(
          { categoryId: dessertsCat.id, name: "Künefe", description: "Hatay usulü peynirli künefe.", price: "180.00", imageUrl: "/images/kunefe.svg", isAvailable: true },
          { categoryId: dessertsCat.id, name: "Sütlaç", description: "Fırınlanmış köy sütlacı.", price: "90.00", imageUrl: "/images/sutlac.svg", isAvailable: true }
        );
      }

      if (startersCat) {
        products.push(
          { categoryId: startersCat.id, name: "Mercimek Çorbası", description: "Sıcak mercimek çorbası, limon ile.", price: "70.00", imageUrl: "/images/mercimek-corbasi.svg", isAvailable: true },
          { categoryId: startersCat.id, name: "Mevsim Salatası", description: "Taze mevsim yeşillikleri ile.", price: "80.00", imageUrl: "/images/mevsim-salatasi.svg", isAvailable: true }
        );
      }

      for (const prod of products) {
        await storage.createProduct(demoId, prod);
      }
      console.log("Products seeded.");
    }

    // Seed Tables
    const existingTables = await storage.getTables(demoId);
    if (existingTables.length === 0) {
      console.log("Seeding tables...");
      const tables = [
        { name: "Masa 1", capacity: 4, x: 0, y: 0, status: "available" },
        { name: "Masa 2", capacity: 2, x: 1, y: 0, status: "available" },
        { name: "Masa 3", capacity: 4, x: 2, y: 0, status: "occupied" },
        { name: "Masa 4", capacity: 6, x: 0, y: 1, status: "reserved" },
        { name: "Masa 5", capacity: 4, x: 1, y: 1, status: "available" },
        { name: "Masa 6", capacity: 2, x: 2, y: 1, status: "available" },
        { name: "Bahçe 1", capacity: 8, x: 0, y: 2, status: "available" },
        { name: "Bahçe 2", capacity: 4, x: 1, y: 2, status: "available" },
      ];

      for (const table of tables) {
        await storage.createTable(demoId, table);
      }
      console.log("Tables seeded.");
    }

    console.log("Database seeding completed.");
  } catch (error) {
    console.error("Error seeding database:", error);
  }

  // Seed Roles and Users
  try {
    const existingRoles = await db.select().from(roles);
    let roleIds: Record<string, number> = {};
    if (existingRoles.length === 0) {
      console.log("Seeding roles...");
      const defaultRoles: { name: string; description: string; permissions: string[] }[] = [
        { name: "Admin", description: "Sistem yöneticisi, tüm yetkiler", permissions: ["*"] },
        { name: "Manager", description: "Restoran müdürü, raporlama ve yönetim", permissions: ["orders.manage", "reports.view", "menu.manage"] },
        { name: "Waiter", description: "Garson, sipariş ve masa yönetimi", permissions: ["orders.create", "tables.manage"] },
        { name: "Chef", description: "Aşçı, mutfak yönetimi", permissions: ["orders.view", "menu.view"] },
        { name: "Cashier", description: "Kasiyer, ödeme ve fiş işlemleri", permissions: ["orders.view", "payments.manage"] },
      ];
      for (const role of defaultRoles) {
        const [result] = await db.insert(roles).values(role);
        roleIds[role.name] = result.insertId;
      }
      console.log("Roles seeded.");
    } else {
      for (const role of existingRoles) roleIds[role.name] = role.id;
    }

    const existingUsers = await db.select().from(users);
    if (existingUsers.length === 0 && process.env.NODE_ENV !== "production") {
      console.log("Seeding demo users (development only)...");
      const seedUsers = [
        { username: "admin", email: "admin@restopos.com", password: "admin123", fullName: "Sistem Yöneticisi", roleId: roleIds["Admin"], isActive: true },
        { username: "mudur", email: "mudur@restopos.com", password: "mudur123", fullName: "Ahmet Yılmaz", roleId: roleIds["Manager"], isActive: true },
        { username: "garson1", email: "garson1@restopos.com", password: "garson123", fullName: "Zeynep Kaya", roleId: roleIds["Waiter"], isActive: true },
        { username: "asci1", email: "asci1@restopos.com", password: "asci123", fullName: "Mehmet Demir", roleId: roleIds["Chef"], isActive: true },
        { username: "kasiyer1", email: "kasiyer1@restopos.com", password: "kasiyer123", fullName: "Elif Şahin", roleId: roleIds["Cashier"], isActive: true },
      ];
      await db.insert(users).values(
        await Promise.all(
          seedUsers.map(async (u) => ({
            ...u,
            password: await hashPassword(u.password),
            restaurantId: demoId,
            isPlatformAdmin: u.username === "admin",
          }))
        )
      );
      console.log("Users seeded.");
    }
    console.log("User and role seeding completed.");
  } catch (error) {
    console.error("Error seeding users and roles:", error);
  }

  // Demo restaurants, licenses, notifications, and payments are no longer seeded.
  // All demo data has been removed to keep the database clean for production.
}
