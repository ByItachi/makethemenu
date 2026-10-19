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

  // Seed Admin: Restaurants / Businesses
  try {
    const existingRestaurants = await storage.getRestaurants();
    if (existingRestaurants.length === 0) {
      console.log("Seeding admin businesses...");
      const sampleRestaurants = [
        { name: "Sultan Sofrası", type: "Restoran", address: "Sultanahmet, Fatih", city: "İstanbul", country: "Türkiye", lat: "41.005270", lng: "28.976960", status: "active", license: "Enterprise", licenseExpiry: "2027-03-15" },
        { name: "Kızılay Kafe", type: "Kafe", address: "Kızılay Meydanı", city: "Ankara", country: "Türkiye", lat: "39.919960", lng: "32.854270", status: "active", license: "Pro", licenseExpiry: "2026-11-02" },
        { name: "Alsancak Bistro", type: "Restoran", address: "Kordon Boyu", city: "İzmir", country: "Türkiye", lat: "38.436180", lng: "27.128810", status: "active", license: "Pro", licenseExpiry: "2026-09-30" },
        { name: "Lara Sahil Restoran", type: "Restoran", address: "Lara Caddesi", city: "Antalya", country: "Türkiye", lat: "36.858330", lng: "30.799170", status: "pending", license: "Basic", licenseExpiry: "2026-10-05" },
        { name: "Nilüfer Pastane & Kafe", type: "Kafe", address: "Nilüfer", city: "Bursa", country: "Türkiye", lat: "40.216670", lng: "28.986670", status: "active", license: "Basic", licenseExpiry: "2026-12-20" },
        { name: "Seyhan Büfe", type: "Büfe", address: "Seyhan Merkez", city: "Adana", country: "Türkiye", lat: "37.000000", lng: "35.321300", status: "inactive", license: "Basic", licenseExpiry: "2025-12-01" },
        { name: "Mevlana Restoran", type: "Restoran", address: "Karatay", city: "Konya", country: "Türkiye", lat: "37.874600", lng: "32.493200", status: "active", license: "Pro", licenseExpiry: "2027-01-18" },
        { name: "Gaziantep Baklavacısı", type: "Kafe", address: "Şahinbey", city: "Gaziantep", country: "Türkiye", lat: "37.066200", lng: "37.383300", status: "pending", license: "Enterprise", licenseExpiry: "2026-09-25" },
      ];
      for (const r of sampleRestaurants) {
        await storage.createRestaurant({ ...(r as any), slug: await generateSlug(r.name) });
      }
      console.log("Admin businesses seeded.");
    }
  } catch (error) {
    console.error("Error seeding admin businesses:", error);
  }

  // Seed Admin: Licenses + Activities
  try {
    const existingLicenses = await storage.getLicenses();
    if (existingLicenses.length === 0) {
      console.log("Seeding admin licenses...");
      const sampleLicenses = [
        { code: "L-1042", type: "Enterprise", status: "Active", business: "Sultan Sofrası", expiry: "2027-03-15" },
        { code: "L-2078", type: "Pro", status: "Active", business: "Kızılay Kafe", expiry: "2026-11-02" },
        { code: "L-3311", type: "Pro", status: "Active", business: "Alsancak Bistro", expiry: "2026-09-30" },
        { code: "L-4459", type: "Basic", status: "Pending", business: "Lara Sahil Restoran", expiry: "2026-10-05" },
        { code: "L-5122", type: "Basic", status: "Active", business: "Nilüfer Pastane & Kafe", expiry: "2026-12-20" },
        { code: "L-6087", type: "Basic", status: "Inactive", business: "Seyhan Büfe", expiry: "2025-12-01" },
        { code: "L-7203", type: "Pro", status: "Active", business: "Mevlana Restoran", expiry: "2027-01-18" },
        { code: "L-8340", type: "Enterprise", status: "Pending", business: "Gaziantep Baklavacısı", expiry: "2026-09-25" },
      ];
      for (const l of sampleLicenses) {
        const created = await storage.createLicense(l);
        await storage.createLicenseActivity({
          action: "Oluşturuldu",
          code: created.code,
          date: new Date().toLocaleString('tr-TR'),
          details: `${created.business} için ${created.type} lisansı oluşturuldu`,
        });
      }
      console.log("Admin licenses seeded.");
    }
  } catch (error) {
    console.error("Error seeding admin licenses:", error);
  }

  // Seed Admin: Notifications
  try {
    const existingNotifications = await storage.getAdminNotifications();
    if (existingNotifications.length === 0) {
      console.log("Seeding admin notifications...");
      await Promise.all([
        storage.createAdminNotification({ type: "support", title: "Destek Talebi: Yazıcı Bağlantı Sorunu", message: "Mutfak yazıcımız sipariş fişlerini basmıyor, acil yardım rica ederiz.", status: "unread", contact: "seyhanbufe@example.com" }),
        storage.createAdminNotification({ type: "payment", title: "Ödeme Alındı", message: "Kızılay Kafe için Pro paket yenileme ödemesi başarıyla alındı.", status: "unread", contact: "kizilaykafe@example.com" }),
        storage.createAdminNotification({ type: "system", title: "Sistem Bakımı Tamamlandı", message: "Planlı bakım çalışması başarıyla tamamlandı, tüm servisler aktif.", status: "read", contact: "-" }),
        storage.createAdminNotification({ type: "support", title: "Destek Talebi: Menü Güncelleme", message: "Yeni ürünlerimizi menüye nasıl ekleyeceğimiz konusunda yardım istiyoruz.", status: "unread", contact: "nilufer@example.com" }),
        storage.createAdminNotification({ type: "system", title: "Yeni İşletme Kaydı", message: "Gaziantep Baklavacısı sisteme kayıt oldu ve onay bekliyor.", status: "read", contact: "-" }),
      ]);
      console.log("Admin notifications seeded.");
    }
  } catch (error) {
    console.error("Error seeding admin notifications:", error);
  }

  // Seed Admin: Pending Payments
  try {
    const existingPending = await storage.getPendingPayments();
    if (existingPending.length === 0) {
      console.log("Seeding pending payments...");
      await Promise.all([
        storage.createPendingPayment({ businessName: "Lara Sahil Restoran", amount: "499.00", currency: "TRY", plan: "Basic", status: "pending", date: new Date().toLocaleDateString('tr-TR') }),
        storage.createPendingPayment({ businessName: "Gaziantep Baklavacısı", amount: "1499.00", currency: "TRY", plan: "Enterprise", status: "pending", date: new Date().toLocaleDateString('tr-TR') }),
        storage.createPendingPayment({ businessName: "Seyhan Büfe", amount: "499.00", currency: "TRY", plan: "Basic", status: "overdue", date: new Date().toLocaleDateString('tr-TR') }),
      ]);
      console.log("Pending payments seeded.");
    }
  } catch (error) {
    console.error("Error seeding pending payments:", error);
  }
}
