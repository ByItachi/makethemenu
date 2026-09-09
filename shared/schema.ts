import { mysqlTable, text, timestamp, int, boolean, decimal, varchar, json } from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// POS Tables
export const tables = mysqlTable("tables", {
  id: int("id").autoincrement().primaryKey(),
  name: text("name").notNull(),
  status: varchar("status", { length: 32 }).notNull().default("available"),
  capacity: int("capacity").notNull(),
  x: int("x").default(0),
  y: int("y").default(0),
});

export const categories = mysqlTable("categories", {
  id: int("id").autoincrement().primaryKey(),
  name: text("name").notNull(),
  slug: varchar("slug", { length: 255 }).notNull(),
  imageUrl: text("image_url"),
  icon: text("icon"),
});

export const products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  categoryId: int("category_id").references(() => categories.id),
  name: text("name").notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  imageUrl: text("image_url"),
  isAvailable: boolean("is_available").default(true),
});

export const orders = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(),
  tableId: int("table_id").references(() => tables.id),
  status: varchar("status", { length: 32 }).notNull().default("pending"),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const orderItems = mysqlTable("order_items", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("order_id").references(() => orders.id),
  productId: int("product_id").references(() => products.id),
  quantity: int("quantity").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  notes: text("notes"),
});

// Marketing
export const contactMessages = mysqlTable("contact_messages", {
  id: int("id").autoincrement().primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Users and Permissions
export const roles = mysqlTable("roles", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull().unique(),
  description: text("description"),
  permissions: json("permissions").$type<string[]>(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  username: varchar("username", { length: 255 }).notNull().unique(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  roleId: int("role_id").references(() => roles.id),
  isActive: boolean("is_active").default(true),
  lastLogin: timestamp("last_login"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Admin: Businesses / Restaurants
export const restaurants = mysqlTable("restaurants", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  type: varchar("type", { length: 64 }).notNull().default("Restoran"),
  address: text("address").notNull(),
  city: varchar("city", { length: 128 }),
  country: varchar("country", { length: 128 }).default("Türkiye"),
  lat: decimal("lat", { precision: 9, scale: 6 }),
  lng: decimal("lng", { precision: 9, scale: 6 }),
  status: varchar("status", { length: 32 }).notNull().default("pending"),
  license: varchar("license", { length: 64 }),
  licenseExpiry: varchar("license_expiry", { length: 32 }),
  joinedAt: timestamp("joined_at").defaultNow(),
});

// Admin: Licenses
export const licenses = mysqlTable("licenses", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 64 }).notNull().unique(),
  type: varchar("type", { length: 64 }).notNull().default("Basic"),
  status: varchar("status", { length: 32 }).notNull().default("Active"),
  business: varchar("business", { length: 255 }).notNull(),
  expiry: varchar("expiry", { length: 32 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const licenseActivities = mysqlTable("license_activities", {
  id: int("id").autoincrement().primaryKey(),
  action: varchar("action", { length: 64 }).notNull(),
  code: varchar("code", { length: 64 }).notNull(),
  date: varchar("date", { length: 32 }).notNull(),
  details: text("details").notNull(),
});

// Admin: Notifications
export const adminNotifications = mysqlTable("admin_notifications", {
  id: int("id").autoincrement().primaryKey(),
  type: varchar("type", { length: 32 }).notNull().default("system"),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  status: varchar("status", { length: 16 }).notNull().default("unread"),
  contact: varchar("contact", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Admin: Pending Payments (dashboard widget)
export const pendingPayments = mysqlTable("pending_payments", {
  id: int("id").autoincrement().primaryKey(),
  businessName: varchar("business_name", { length: 255 }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 8 }).notNull().default("TRY"),
  plan: varchar("plan", { length: 64 }).notNull(),
  status: varchar("status", { length: 32 }).notNull().default("pending"),
  date: varchar("date", { length: 32 }).notNull(),
});

// Schemas
export const insertTableSchema = createInsertSchema(tables);
export const insertCategorySchema = createInsertSchema(categories);
export const insertProductSchema = createInsertSchema(products);
export const insertOrderSchema = createInsertSchema(orders);
export const insertOrderItemSchema = createInsertSchema(orderItems);
export const insertContactMessageSchema = createInsertSchema(contactMessages).omit({ id: true, createdAt: true });
export const insertRoleSchema = createInsertSchema(roles).omit({ id: true, createdAt: true, updatedAt: true });
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true });
export const insertRestaurantSchema = createInsertSchema(restaurants).omit({ id: true, joinedAt: true });
export const insertLicenseSchema = createInsertSchema(licenses).omit({ id: true, createdAt: true });
export const insertLicenseActivitySchema = createInsertSchema(licenseActivities).omit({ id: true });
export const insertAdminNotificationSchema = createInsertSchema(adminNotifications).omit({ id: true, createdAt: true });
export const insertPendingPaymentSchema = createInsertSchema(pendingPayments).omit({ id: true });

// Types
export type Table = typeof tables.$inferSelect;
export type InsertTable = z.infer<typeof insertTableSchema>;
export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type ContactMessage = typeof contactMessages.$inferSelect;
export type InsertContactMessage = z.infer<typeof insertContactMessageSchema>;
export type Role = typeof roles.$inferSelect;
export type InsertRole = z.infer<typeof insertRoleSchema>;
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Restaurant = typeof restaurants.$inferSelect;
export type InsertRestaurant = z.infer<typeof insertRestaurantSchema>;
export type License = typeof licenses.$inferSelect;
export type InsertLicense = z.infer<typeof insertLicenseSchema>;
export type LicenseActivity = typeof licenseActivities.$inferSelect;
export type InsertLicenseActivity = z.infer<typeof insertLicenseActivitySchema>;
export type AdminNotification = typeof adminNotifications.$inferSelect;
export type InsertAdminNotification = z.infer<typeof insertAdminNotificationSchema>;
export type PendingPayment = typeof pendingPayments.$inferSelect;
export type InsertPendingPayment = z.infer<typeof insertPendingPaymentSchema>;

export type OrderWithItems = Order & {
  table?: Table | null;
  items: (OrderItem & { product: Product })[];
};
