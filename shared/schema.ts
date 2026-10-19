import { mysqlTable, text, timestamp, int, boolean, decimal, varchar, json, index, uniqueIndex, type AnyMySqlColumn } from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// POS Tables
export const tables = mysqlTable("tables", {
  id: int("id").autoincrement().primaryKey(),
  restaurantId: int("restaurant_id").notNull().references(() => restaurants.id),
  name: text("name").notNull(),
  status: varchar("status", { length: 32 }).notNull().default("available"),
  capacity: int("capacity").notNull(),
  x: int("x").default(0),
  y: int("y").default(0),
});

export const categories = mysqlTable("categories", {
  id: int("id").autoincrement().primaryKey(),
  restaurantId: int("restaurant_id").notNull().references(() => restaurants.id),
  name: text("name").notNull(),
  slug: varchar("slug", { length: 255 }).notNull(),
  imageUrl: text("image_url"),
  icon: text("icon"),
});

export const products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  restaurantId: int("restaurant_id").notNull().references(() => restaurants.id),
  categoryId: int("category_id").references(() => categories.id),
  name: text("name").notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  imageUrl: text("image_url"),
  model3dUrl: text("model_3d_url"),
  isAvailable: boolean("is_available").default(true),
  // Dil çevirileri: { en: { name, description }, ar: { name, description } }
  translations: json("translations"),
});

export const orders = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(),
  restaurantId: int("restaurant_id").notNull().references(() => restaurants.id),
  tableId: int("table_id").references(() => tables.id),
  status: varchar("status", { length: 32 }).notNull().default("pending"),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  customerName: varchar("customer_name", { length: 120 }),
  phone: varchar("phone", { length: 32 }),
  note: text("note"),
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
  restaurantId: int("restaurant_id").references((): AnyMySqlColumn => restaurants.id),
  isPlatformAdmin: boolean("is_platform_admin").notNull().default(false),
  emailVerifiedAt: timestamp("email_verified_at"),
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
  // Tenant / public menu settings
  slug: varchar("slug", { length: 63 }).unique(),
  ownerUserId: int("owner_user_id").references((): AnyMySqlColumn => users.id),
  isPublished: boolean("is_published").notNull().default(false),
  ordersEnabled: boolean("orders_enabled").notNull().default(false),
  description: text("description"),
  phone: varchar("phone", { length: 32 }),
  currency: varchar("currency", { length: 3 }).notNull().default("TRY"),
  planCode: varchar("plan_code", { length: 32 }).notNull().default("free"),
  // Dijital menü kişiselleştirme + ödeme tipleri (QRall benzeri)
  menuTheme: varchar("menu_theme", { length: 32 }).notNull().default("yesil"),
  menuRadius: int("menu_radius").notNull().default(12),
  menuTemplate: varchar("menu_template", { length: 32 }).notNull().default("liste"),
  showProductImages: boolean("show_product_images").notNull().default(true),
  menuLanguage: varchar("menu_language", { length: 8 }).notNull().default("tr"),
  paymentTypes: json("payment_types"),
});

// Old slugs kept so renamed businesses keep working (301 redirects)
export const restaurantSlugRedirects = mysqlTable("restaurant_slug_redirects", {
  oldSlug: varchar("old_slug", { length: 63 }).primaryKey(),
  restaurantId: int("restaurant_id").notNull().references(() => restaurants.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Audit trail for critical actions
export const auditLogs = mysqlTable("audit_logs", {
  id: int("id").autoincrement().primaryKey(),
  restaurantId: int("restaurant_id"),
  actorUserId: int("actor_user_id"),
  action: varchar("action", { length: 64 }).notNull(),
  entity: varchar("entity", { length: 64 }),
  entityId: varchar("entity_id", { length: 64 }),
  ip: varchar("ip", { length: 64 }),
  meta: json("meta"),
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => [index("idx_audit_restaurant").on(t.restaurantId)]);

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
// restaurantId is omitted: it is always taken from the authenticated session, never from the body
export const insertTableSchema = createInsertSchema(tables).omit({ restaurantId: true });
export const insertCategorySchema = createInsertSchema(categories).omit({ restaurantId: true });
export const insertProductSchema = createInsertSchema(products).omit({ restaurantId: true });
export const insertOrderSchema = createInsertSchema(orders).omit({ restaurantId: true });
export const insertOrderItemSchema = createInsertSchema(orderItems);
export const insertContactMessageSchema = createInsertSchema(contactMessages).omit({ id: true, createdAt: true });
export const insertRoleSchema = createInsertSchema(roles).omit({ id: true, createdAt: true, updatedAt: true });
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true });
export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({ id: true, createdAt: true });
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

// Subscription plans. A null limit means unlimited. Editable from the platform admin panel.
export const plans = mysqlTable("plans", {
  code: varchar("code", { length: 32 }).primaryKey(),
  name: varchar("name", { length: 64 }).notNull(),
  priceMonthly: decimal("price_monthly", { precision: 10, scale: 2 }).notNull().default("0"),
  priceYearly: decimal("price_yearly", { precision: 10, scale: 2 }).notNull().default("0"),
  maxProducts: int("max_products"),
  maxTables: int("max_tables"),
  max3dModels: int("max_3d_models"),
  customDomain: boolean("custom_domain").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: int("sort_order").notNull().default(0),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Custom domains connected to a business (extra feature). The free address is always
// makethemenu.com/p/<slug>; connecting another domain requires a plan with customDomain=1.
// DNS ownership is proven with a TXT record; TLS is issued automatically by the platform
// reverse proxy once a domain reaches "verified".
export const restaurantDomains = mysqlTable("restaurant_domains", {
  id: int("id").autoincrement().primaryKey(),
  restaurantId: int("restaurant_id").notNull().references(() => restaurants.id),
  domain: varchar("domain", { length: 255 }).notNull().unique(),
  status: varchar("status", { length: 16 }).notNull().default("pending"),
  verificationToken: varchar("verification_token", { length: 64 }).notNull(),
  verifiedAt: timestamp("verified_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Single-use tokens for email verification and password reset. Only a SHA-256 hash is stored.
export const authTokens = mysqlTable("auth_tokens", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull().references(() => users.id),
  purpose: varchar("purpose", { length: 32 }).notNull(),
  tokenHash: varchar("token_hash", { length: 64 }).notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Outgoing e-mail queue. Delivery adapters (SMTP, provider API) read 'queued' rows and set status.
export const emailOutbox = mysqlTable("email_outbox", {
  id: int("id").autoincrement().primaryKey(),
  toAddress: varchar("to_address", { length: 255 }).notNull(),
  subject: varchar("subject", { length: 255 }).notNull(),
  body: text("body").notNull(),
  status: varchar("status", { length: 16 }).notNull().default("queued"),
  attempts: int("attempts").notNull().default(0),
  lastError: varchar("last_error", { length: 255 }),
  lockedUntil: timestamp("locked_until"),
  createdAt: timestamp("created_at").defaultNow(),
  sentAt: timestamp("sent_at"),
});

// ---- Billing (subscriptions, payments, coupons, webhooks). Card data is never stored here;
// only provider references, brand and last4 as reported by the provider.
export const subscriptions = mysqlTable("subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  restaurantId: int("restaurant_id").notNull().references(() => restaurants.id),
  planCode: varchar("plan_code", { length: 32 }).notNull().references(() => plans.code),
  interval: varchar("interval", { length: 16 }).notNull().default("monthly"),
  status: varchar("status", { length: 16 }).notNull().default("active"), // active | past_due | canceled
  currentPeriodEnd: timestamp("current_period_end").notNull(),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").notNull().default(false),
  pendingPlanCode: varchar("pending_plan_code", { length: 32 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (t) => [index("idx_subscription_restaurant").on(t.restaurantId)]);

export const paymentMethods = mysqlTable("payment_methods", {
  id: int("id").autoincrement().primaryKey(),
  restaurantId: int("restaurant_id").notNull().references(() => restaurants.id),
  provider: varchar("provider", { length: 32 }).notNull(),
  token: varchar("token", { length: 128 }).notNull(), // provider-side token, never a PAN
  brand: varchar("brand", { length: 32 }),
  last4: varchar("last4", { length: 4 }),
  isDefault: boolean("is_default").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const coupons = mysqlTable("coupons", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 32 }).notNull().unique(),
  percentOff: int("percent_off"),
  amountOff: decimal("amount_off", { precision: 10, scale: 2 }),
  validUntil: timestamp("valid_until"),
  maxRedemptions: int("max_redemptions"),
  redemptions: int("redemptions").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const payments = mysqlTable("payments", {
  id: int("id").autoincrement().primaryKey(),
  restaurantId: int("restaurant_id").notNull().references(() => restaurants.id),
  subscriptionId: int("subscription_id").references(() => subscriptions.id),
  kind: varchar("kind", { length: 16 }).notNull(), // subscription | upgrade | renewal
  planCode: varchar("plan_code", { length: 32 }).notNull(),
  interval: varchar("interval", { length: 16 }).notNull(),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  discount: decimal("discount", { precision: 10, scale: 2 }).notNull().default("0"),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(), // gross, KDV dahil
  taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }).notNull().default("0"),
  currency: varchar("currency", { length: 3 }).notNull().default("TRY"),
  couponId: int("coupon_id").references(() => coupons.id),
  status: varchar("status", { length: 16 }).notNull().default("pending"), // pending | succeeded | failed | refunded
  provider: varchar("provider", { length: 32 }).notNull(),
  providerRef: varchar("provider_ref", { length: 128 }),
  idempotencyKey: varchar("idempotency_key", { length: 128 }).notNull().unique(),
  attempts: int("attempts").notNull().default(0),
  nextRetryAt: timestamp("next_retry_at"),
  failureReason: varchar("failure_reason", { length: 255 }),
  invoiceNo: varchar("invoice_no", { length: 32 }).unique(),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (t) => [index("idx_payment_restaurant").on(t.restaurantId)]);

export const webhookEvents = mysqlTable("webhook_events", {
  id: int("id").autoincrement().primaryKey(),
  provider: varchar("provider", { length: 32 }).notNull(),
  eventId: varchar("event_id", { length: 128 }).notNull(),
  type: varchar("type", { length: 64 }).notNull(),
  receivedAt: timestamp("received_at").defaultNow(),
}, (t) => [uniqueIndex("uq_webhook_event").on(t.provider, t.eventId)]);

// Anonymous menu analytics. No IPs, no profiles: aggregated counts only.
export const menuEvents = mysqlTable("menu_events", {
  id: int("id").autoincrement().primaryKey(),
  restaurantId: int("restaurant_id").notNull().references(() => restaurants.id),
  type: varchar("type", { length: 32 }).notNull(), // menu_view | qr_scan | product_view
  productId: int("product_id").references(() => products.id),
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => [index("idx_menu_events_restaurant").on(t.restaurantId, t.createdAt)]);

// Eklenti Merkezi: restoran bazında etkinleştirilmiş modüller.
export const restaurantPlugins = mysqlTable("restaurant_plugins", {
  id: int("id").autoincrement().primaryKey(),
  restaurantId: int("restaurant_id").notNull().references(() => restaurants.id),
  pluginKey: varchar("plugin_key", { length: 64 }).notNull(),
  isEnabled: boolean("is_enabled").notNull().default(false),
  settings: json("settings"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (t) => [uniqueIndex("uq_restaurant_plugin").on(t.restaurantId, t.pluginKey)]);

export type AuditLog = typeof auditLogs.$inferSelect;
export type Plan = typeof plans.$inferSelect;
export type AuthToken = typeof authTokens.$inferSelect;
export type EmailOutbox = typeof emailOutbox.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;

export type OrderWithItems = Order & {
  table?: Table | null;
  items: (OrderItem & { product: Product })[];
};
