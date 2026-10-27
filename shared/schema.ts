import { mysqlTable, text, timestamp, int, boolean, decimal, varchar, json, double, index, uniqueIndex, type AnyMySqlColumn } from "drizzle-orm/mysql-core";
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

// Şablon Stüdyosu: yönetici panelinden kod değiştirmeden oluşturulan/düzenlenen
// menü şablonları. "data" alanı client/src/lib/menu-presets.ts'teki MenuPreset
// JSON biçimiyle aynıdır (geriye dönük uyumluluk için).
export const templates = mysqlTable("templates", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 120 }).notNull().unique(),
  name: varchar("name", { length: 160 }).notNull(),
  category: varchar("category", { length: 80 }).notNull().default("Genel"),
  coverImage: text("cover_image"),
  status: varchar("status", { length: 16 }).notNull().default("draft"), // draft | published | archived
  visibility: varchar("visibility", { length: 16 }).notNull().default("customer"), // admin | customer
  isFeatured: boolean("is_featured").notNull().default(false),
  isDefault: boolean("is_default").notNull().default(false),
  planRestriction: varchar("plan_restriction", { length: 40 }), // null = tüm planlar
  data: json("data").notNull(),
  usageCount: int("usage_count").notNull().default(0),
  viewCount: int("view_count").notNull().default(0),
  createdBy: int("created_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

// Şablon Stüdyosu: /sablon-demo/:slug adresinde yayınlanan demo restoranlar.
// Bir şablona bağlanır; demo verisi gerçek müşteri menülerinden tamamen ayrıdır.
export const demoSites = mysqlTable("demo_sites", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 120 }).notNull().unique(),
  templateId: int("template_id").notNull().references(() => templates.id),
  title: varchar("title", { length: 160 }).notNull(),
  seoTitle: varchar("seo_title", { length: 160 }),
  seoDescription: varchar("seo_description", { length: 320 }),
  ogImage: text("og_image"),
  status: varchar("status", { length: 16 }).notNull().default("draft"), // draft | published
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const categories = mysqlTable("categories", {
  id: int("id").autoincrement().primaryKey(),
  restaurantId: int("restaurant_id").notNull().references(() => restaurants.id),
  name: text("name").notNull(),
  slug: varchar("slug", { length: 255 }).notNull(),
  imageUrl: text("image_url"),
  icon: text("icon"),
  sortOrder: int("sort_order").notNull().default(0),
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
  sortOrder: int("sort_order").notNull().default(0),
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
  menuPreset: varchar("menu_preset", { length: 64 }),
  // Şablon oluşturucudan kaydedilen özel tasarım (renk/font/logo). menuPreset = "custom" iken kullanılır.
  customPreset: json("custom_preset"),
  showProductImages: boolean("show_product_images").notNull().default(true),
  menuLanguage: varchar("menu_language", { length: 8 }).notNull().default("tr"),
  paymentTypes: json("payment_types"),
  /** Sektör profili (sector_profiles.slug). Restoran/kafe varsayılan; boşsa restoran akışı kullanılır. */
  sectorSlug: varchar("sector_slug", { length: 64 }),
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
export const insertTemplateSchema = createInsertSchema(templates).omit({ id: true, createdAt: true, updatedAt: true, usageCount: true, viewCount: true });
export const insertDemoSiteSchema = createInsertSchema(demoSites).omit({ id: true, createdAt: true, updatedAt: true });

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
export type MenuTemplate = typeof templates.$inferSelect;
export type InsertMenuTemplate = z.infer<typeof insertTemplateSchema>;
export type DemoSite = typeof demoSites.$inferSelect;
export type InsertDemoSite = z.infer<typeof insertDemoSiteSchema>;
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

// Outgoing SMS queue (toplu SMS / bildirim). Delivery adapters (İletiMerkezi, NetGSM, Twilio)
// read 'queued' rows and set status. Scoped per restaurant so her işletme yalnızca kendi kuyruğunu görür.
export const smsOutbox = mysqlTable("sms_outbox", {
  id: int("id").autoincrement().primaryKey(),
  restaurantId: int("restaurant_id").references(() => restaurants.id),
  toPhone: varchar("to_phone", { length: 32 }).notNull(),
  body: varchar("body", { length: 640 }).notNull(),
  status: varchar("status", { length: 16 }).notNull().default("queued"),
  attempts: int("attempts").notNull().default(0),
  lastError: varchar("last_error", { length: 255 }),
  lockedUntil: timestamp("locked_until"),
  createdAt: timestamp("created_at").defaultNow(),
  sentAt: timestamp("sent_at"),
});

export const smsInbound = mysqlTable("sms_inbound", {
  id: int("id").autoincrement().primaryKey(),
  restaurantId: int("restaurant_id").references(() => restaurants.id),
  fromPhone: varchar("from_phone", { length: 32 }).notNull(),
  body: varchar("body", { length: 640 }).notNull(),
  externalId: varchar("external_id", { length: 64 }),
  receivedAt: timestamp("received_at").defaultNow(),
});

export const smsWebhookLog = mysqlTable("sms_webhook_log", {
  id: int("id").autoincrement().primaryKey(),
  provider: varchar("provider", { length: 32 }).notNull(),
  signatureValid: boolean("signature_valid").notNull().default(false),
  payloadHash: varchar("payload_hash", { length: 64 }),
  errorMessage: varchar("error_message", { length: 255 }),
  processedAt: timestamp("processed_at").defaultNow(),
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

// Uygulama Mağazası: entegrasyon satın alımları. Kart verisi SAKLANMAZ (yalnızca marka + son 4 hane).
export const integrationPurchases = mysqlTable("integration_purchases", {
  id: int("id").autoincrement().primaryKey(),
  restaurantId: int("restaurant_id").notNull().references(() => restaurants.id),
  orderNo: varchar("order_no", { length: 32 }).notNull().unique(),
  pluginKey: varchar("plugin_key", { length: 64 }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  billingCycle: varchar("billing_cycle", { length: 16 }).notNull().default("monthly"), // monthly | annual
  billingInfo: json("billing_info"), // firma ünvanı, vergi no/daire, adres, e-posta
  cardBrand: varchar("card_brand", { length: 16 }),
  cardLast4: varchar("card_last4", { length: 4 }),
  status: varchar("status", { length: 16 }).notNull().default("succeeded"), // succeeded | refunded
  invoiceNo: varchar("invoice_no", { length: 32 }),
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => [index("idx_integration_purchase_restaurant").on(t.restaurantId)]);

// === ABONELİK SATIN ALMA (fiyat sayfası / ana sayfa checkout akışı) ===
// Anonim ziyaretçi de satın alabilir (restaurant_id NULL); hesap sonradan bağlanabilir.
export const subscriptionOrders = mysqlTable("subscription_orders", {
  id: int("id").autoincrement().primaryKey(),
  restaurantId: int("restaurant_id").references(() => restaurants.id),
  orderNo: varchar("order_no", { length: 32 }).notNull().unique(),
  planId: varchar("plan_id", { length: 32 }).notNull(), // baslangic | profesyonel
  billingCycle: varchar("billing_cycle", { length: 16 }).notNull().default("monthly"), // monthly | annual
  periodAmount: decimal("period_amount", { precision: 10, scale: 2 }).notNull(),
  vatAmount: decimal("vat_amount", { precision: 10, scale: 2 }).notNull(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: varchar("payment_method", { length: 16 }).notNull().default("card"), // card | transfer
  billingInfo: json("billing_info"), // firma ünvanı, vergi no/daire, adres, e-posta
  cardBrand: varchar("card_brand", { length: 16 }),
  cardLast4: varchar("card_last4", { length: 4 }),
  status: varchar("status", { length: 16 }).notNull().default("succeeded"), // succeeded | refunded | pending_transfer
  invoiceNo: varchar("invoice_no", { length: 32 }),
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => [index("idx_subscription_orders_restaurant").on(t.restaurantId)]);


// === ENTEGRASYON MERKEZİ ===
// Sağlayıcı bağlantıları. Credential'lar AES-256-GCM ile şifreli tutulur; API yanıtlarında maskelenir.
export const integrationConnections = mysqlTable("integration_connections", {
  id: int("id").autoincrement().primaryKey(),
  restaurantId: int("restaurant_id").notNull().references(() => restaurants.id),
  providerKey: varchar("provider_key", { length: 64 }).notNull(),
  status: varchar("status", { length: 32 }).notNull().default("pending_config"), // connected | pending_config | error | needs_api_access | testing
  credentials: text("credentials"), // şifreli JSON
  config: json("config"), // şifresiz ayarlar (şube eşleşmesi vb.)
  lastTestAt: timestamp("last_test_at"),
  lastTestOk: boolean("last_test_ok"),
  lastTestMessage: text("last_test_message"),
  lastSyncAt: timestamp("last_sync_at"),
  lastError: text("last_error"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (t) => [uniqueIndex("uq_integration_connection").on(t.restaurantId, t.providerKey)]);

// Senkronizasyon işleri: kuyruk, sınırlı retry, incelenebilir hatalar
export const integrationSyncJobs = mysqlTable("integration_sync_jobs", {
  id: int("id").autoincrement().primaryKey(),
  restaurantId: int("restaurant_id").notNull().references(() => restaurants.id),
  providerKey: varchar("provider_key", { length: 64 }).notNull(),
  jobType: varchar("job_type", { length: 40 }).notNull(), // fetch_orders | sync_payments | create_invoice | ...
  status: varchar("status", { length: 16 }).notNull().default("queued"), // queued | running | succeeded | failed
  attempts: int("attempts").notNull().default(0),
  maxAttempts: int("max_attempts").notNull().default(3),
  payload: json("payload"),
  result: json("result"),
  error: text("error"),
  createdAt: timestamp("created_at").defaultNow(),
  startedAt: timestamp("started_at"),
  finishedAt: timestamp("finished_at"),
}, (t) => [index("idx_sync_job_restaurant").on(t.restaurantId)]);

// Entegrasyon logları (işletme yalnızca kendi loglarını görür)
export const integrationLogs = mysqlTable("integration_logs", {
  id: int("id").autoincrement().primaryKey(),
  restaurantId: int("restaurant_id").notNull().references(() => restaurants.id),
  providerKey: varchar("provider_key", { length: 64 }),
  level: varchar("level", { length: 16 }).notNull().default("info"), // info | warn | error
  event: varchar("event", { length: 64 }).notNull(),
  message: text("message"),
  meta: json("meta"),
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => [index("idx_integration_log_restaurant").on(t.restaurantId)]);

// Harici sipariş eşleştirmeleri: idempotency (externalOrderId + provider benzersiz)
export const externalOrderMappings = mysqlTable("external_order_mappings", {
  id: int("id").autoincrement().primaryKey(),
  restaurantId: int("restaurant_id").notNull().references(() => restaurants.id),
  providerKey: varchar("provider_key", { length: 64 }).notNull(),
  externalOrderId: varchar("external_order_id", { length: 128 }).notNull(),
  internalOrderId: int("internal_order_id").references(() => orders.id),
  status: varchar("status", { length: 32 }).notNull().default("received"),
  providerMetadata: json("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (t) => [uniqueIndex("uq_external_order").on(t.providerKey, t.externalOrderId), index("idx_external_order_restaurant").on(t.restaurantId)]);

// Giden webhook endpoint'leri: secret yalnızca oluştuğu anda tam gösterilir
export const webhookEndpoints = mysqlTable("webhook_endpoints", {
  id: int("id").autoincrement().primaryKey(),
  restaurantId: int("restaurant_id").notNull().references(() => restaurants.id),
  url: varchar("url", { length: 512 }).notNull(),
  description: varchar("description", { length: 200 }),
  events: json("events").notNull(), // ["order.created", ...]
  secretMasked: varchar("secret_masked", { length: 80 }),
  secretEncrypted: text("secret_encrypted"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => [index("idx_webhook_endpoint_restaurant").on(t.restaurantId)]);

export const webhookDeliveries = mysqlTable("webhook_deliveries", {
  id: int("id").autoincrement().primaryKey(),
  endpointId: int("endpoint_id").notNull().references(() => webhookEndpoints.id),
  restaurantId: int("restaurant_id").notNull().references(() => restaurants.id),
  event: varchar("event", { length: 64 }).notNull(),
  payload: json("payload"),
  status: varchar("status", { length: 16 }).notNull().default("pending"), // pending | delivered | failed
  responseCode: int("response_code"),
  attempts: int("attempts").notNull().default(0),
  error: text("error"),
  createdAt: timestamp("created_at").defaultNow(),
  deliveredAt: timestamp("delivered_at"),
}, (t) => [index("idx_webhook_delivery_endpoint").on(t.endpointId)]);

// Veri Aktarımı API anahtarları: yalnızca sha256 özeti saklanır, düz değer bir kez gösterilir
export const integrationApiKeys = mysqlTable("integration_api_keys", {
  id: int("id").autoincrement().primaryKey(),
  restaurantId: int("restaurant_id").notNull().references(() => restaurants.id),
  label: varchar("label", { length: 120 }).notNull(),
  keyHash: varchar("key_hash", { length: 64 }).notNull().unique(),
  keyPrefix: varchar("key_prefix", { length: 24 }).notNull(), // mtm_live_ab12cd – görüntüleme için
  isActive: boolean("is_active").notNull().default(true),
  lastUsedAt: timestamp("last_used_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => [index("idx_api_key_restaurant").on(t.restaurantId)]);


/**
 * Platform genelinde ölçümleme ayarları (tek satır, id=1).
 * GTM / GA4 / Meta Pixel / Search Console doğrulama token'ları admin panelinden yönetilir.
 * ID'ler public API'den yalnızca etkin olduklarında döner; gizli anahtar burada tutulmaz.
 */
export const analyticsSettings = mysqlTable("analytics_settings", {
  id: int("id").autoincrement().primaryKey(),
  gtmContainerId: varchar("gtm_container_id", { length: 32 }),
  ga4MeasurementId: varchar("ga4_measurement_id", { length: 32 }),
  metaPixelId: varchar("meta_pixel_id", { length: 32 }),
  gscVerificationToken: varchar("gsc_verification_token", { length: 255 }),
  gtmEnabled: boolean("gtm_enabled").notNull().default(false),
  ga4Enabled: boolean("ga4_enabled").notNull().default(false),
  metaPixelEnabled: boolean("meta_pixel_enabled").notNull().default(false),
  /** GA4 etiketi GTM container'ı üzerinden mi geliyor? Doğruysa ayrıca gtag.js yüklenmez. */
  ga4ViaGtm: boolean("ga4_via_gtm").notNull().default(true),
  /** Rıza (consent) yönetimi zorunlu: doğruysa etiketler onay verilene dek yüklenmez. */
  consentRequired: boolean("consent_required").notNull().default(true),
  /** Geliştirme ortamında da etiket yüklensin mi? Varsayılan hayır — dev/prod davranışı ayrışır. */
  enableInDev: boolean("enable_in_dev").notNull().default(false),
  updatedAt: timestamp("updated_at").defaultNow(),
});

/**
 * Sektör profilleri: platformun restoran dışı sektörlerde de çalışabilmesi için
 * tanımlı modül seti, sipariş/iş emri alanları ve durum akışları. Yeni sektör eklemek
 * kod yazmadan bu tabloya kayıt ekleyerek yapılır.
 */
export const sectorProfiles = mysqlTable("sector_profiles", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 64 }).notNull().unique(),
  name: varchar("name", { length: 128 }).notNull(),
  description: text("description"),
  icon: varchar("icon", { length: 64 }).notNull().default("store"),
  /** Etkin modüller: crm, catalog, orders, statuses, stock, deposits, routes, appointments, payments, qr, ... */
  modules: json("modules").notNull(),
  /** Sipariş/iş emri formunda görünecek alan tanımları (anahtar, etiket, tip, birim). */
  orderFields: json("order_fields"),
  /** Durum akışı: [{ key, label, color, sortOrder }] */
  orderStatuses: json("order_statuses"),
  /** Dashboard'da gösterilecek kart anahtarları. */
  dashboardCards: json("dashboard_cards"),
  isActive: boolean("is_active").notNull().default(true),
  isFeatured: boolean("is_featured").notNull().default(false),
  sortOrder: int("sort_order").notNull().default(100),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type Plan = typeof plans.$inferSelect;export type AuthToken = typeof authTokens.$inferSelect;
export type EmailOutbox = typeof emailOutbox.$inferSelect;
export type SmsOutbox = typeof smsOutbox.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;

export type OrderWithItems = Order & {
  table?: Table | null;
  items: (OrderItem & { product: Product })[];
};

// === SEKTÖR OPERASYONLARI: SU DAĞITIM + HALI YIKAMA + FİLO/GPS (prompt-4) ===
// Tenant kapsamı zorunlu: her satır restaurant_id ile bağlıdır.

/** Su dağıtım ürün kataloğu — işletme yönetir, sabit kodlu değildir. */
export const waterProducts = mysqlTable("water_products", {
  id: int("id").autoincrement().primaryKey(),
  restaurantId: int("restaurant_id").notNull().references(() => restaurants.id),
  name: varchar("name", { length: 128 }).notNull(),
  kind: varchar("kind", { length: 24 }).notNull().default("damacana"), // damacana | pet_sise | koli | other
  price: decimal("price", { precision: 10, scale: 2 }).notNull().default("0"),
  depositFee: decimal("deposit_fee", { precision: 10, scale: 2 }).notNull().default("0"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

/** Su siparişleri. idempotencyKey tekrar gönderimi engeller; damacana bakiyesi hareketlerden türetilir. */
export const waterOrders = mysqlTable("water_orders", {
  id: int("id").autoincrement().primaryKey(),
  restaurantId: int("restaurant_id").notNull().references(() => restaurants.id),
  orderNo: varchar("order_no", { length: 32 }).notNull().unique(),
  idempotencyKey: varchar("idempotency_key", { length: 64 }).notNull().unique(),
  kind: varchar("kind", { length: 16 }).notNull().default("damacana"), // damacana | tup
  customerName: varchar("customer_name", { length: 128 }).notNull(),
  phone: varchar("phone", { length: 32 }).notNull(),
  addressText: varchar("address_text", { length: 512 }).notNull(),
  items: json("items").notNull(), // [{ productId, name, qty, unitPrice, depositFee }]
  total: decimal("total", { precision: 10, scale: 2 }).notNull().default("0"),
  filledDelivered: int("filled_delivered").notNull().default(0),
  emptyTaken: int("empty_taken").notNull().default(0),
  scheduledDate: varchar("scheduled_date", { length: 16 }).notNull(),
  timeSlot: varchar("time_slot", { length: 32 }).notNull().default("10:00-13:00"),
  note: varchar("note", { length: 512 }),
  paymentMethod: varchar("payment_method", { length: 24 }).notNull().default("cash"), // cash | card_on_delivery | transfer
  paidAmount: decimal("paid_amount", { precision: 10, scale: 2 }).notNull().default("0"),
  status: varchar("status", { length: 24 }).notNull().default("new"), // new | preparing | on_route | delivered | failed | cancelled
  failReason: varchar("fail_reason", { length: 256 }),
  vehicleId: int("vehicle_id"),
  driverId: int("driver_id"), // atanmış sürücü (sector_drivers) — otomatik veya manuel
  createdAt: timestamp("created_at").defaultNow(),
});

/** Halı yıkama siparişleri — tahmini fiyat ile onaylı fiyat ayrı tutulur. */
export const carpetOrders = mysqlTable("carpet_orders", {
  id: int("id").autoincrement().primaryKey(),
  restaurantId: int("restaurant_id").notNull().references(() => restaurants.id),
  orderNo: varchar("order_no", { length: 32 }).notNull().unique(),
  idempotencyKey: varchar("idempotency_key", { length: 64 }).notNull().unique(),
  customerName: varchar("customer_name", { length: 128 }).notNull(),
  phone: varchar("phone", { length: 32 }).notNull(),
  addressText: varchar("address_text", { length: 512 }).notNull(),
  serviceType: varchar("service_type", { length: 32 }).notNull().default("pickup_delivery"), // pickup_delivery | factory_only
  category: varchar("category", { length: 16 }).notNull().default("hali"), // hali | koltuk — halı yıkama / koltuk yıkama
  estimatedPrice: decimal("estimated_price", { precision: 10, scale: 2 }).notNull().default("0"),
  approvedPrice: decimal("approved_price", { precision: 10, scale: 2 }),
  paidAmount: decimal("paid_amount", { precision: 10, scale: 2 }).notNull().default("0"),
  pickupDate: varchar("pickup_date", { length: 16 }).notNull(),
  timeSlot: varchar("time_slot", { length: 32 }).notNull().default("10:00-13:00"),
  note: varchar("note", { length: 512 }),
  status: varchar("status", { length: 32 }).notNull().default("requested"),
  failReason: varchar("fail_reason", { length: 256 }),
  vehicleId: int("vehicle_id"),
  driverId: int("driver_id"), // atanmış sürücü (sector_drivers) — otomatik veya manuel
  createdAt: timestamp("created_at").defaultNow(),
});

/** Her halı ayrı izlenen kayıt — barkod/etiket kodu benzersiz. */
export const carpetItems = mysqlTable("carpet_items", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("order_id").notNull().references(() => carpetOrders.id),
  restaurantId: int("restaurant_id").notNull().references(() => restaurants.id),
  labelCode: varchar("label_code", { length: 24 }).notNull().unique(),
  carpetType: varchar("carpet_type", { length: 48 }).notNull().default("yonasilmis"),
  sizeW: int("size_w").notNull().default(0), // cm
  sizeH: int("size_h").notNull().default(0), // cm
  sqm: decimal("sqm", { precision: 8, scale: 2 }).notNull().default("0"),
  colorDesc: varchar("color_desc", { length: 128 }),
  conditionNote: varchar("condition_note", { length: 512 }),
  status: varchar("status", { length: 32 }).notNull().default("requested"),
  createdAt: timestamp("created_at").defaultNow(),
});

/** Halı işlem geçmişi — her aşama geçişi personel ve zamanla kaydedilir. */
export const carpetEvents = mysqlTable("carpet_events", {
  id: int("id").autoincrement().primaryKey(),
  itemId: int("item_id").references(() => carpetItems.id),
  orderId: int("order_id").notNull().references(() => carpetOrders.id),
  restaurantId: int("restaurant_id").notNull().references(() => restaurants.id),
  fromStatus: varchar("from_status", { length: 32 }),
  toStatus: varchar("to_status", { length: 32 }).notNull(),
  actor: varchar("actor", { length: 128 }).notNull().default("sistem"),
  note: varchar("note", { length: 512 }),
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => [index("idx_carpet_events_item").on(t.itemId), index("idx_carpet_events_order").on(t.orderId)]);

/** Filo: plaka işletme içinde benzersiz; benzersiz iç kayıt kimliği (internal_code) birincil tanım. */
/** Sektör sürücü havuzu — her sektör (halı / su / tüp) kendi sürücü listesini yönetir; havuzlar birbirinden bağımsızdır. */
export const sectorDrivers = mysqlTable("sector_drivers", {
  id: int("id").autoincrement().primaryKey(),
  restaurantId: int("restaurant_id").notNull().references(() => restaurants.id),
  sector: varchar("sector", { length: 16 }).notNull(), // carpet | water | tube
  name: varchar("name", { length: 96 }).notNull(),
  phone: varchar("phone", { length: 32 }),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => [index("idx_sector_drivers_pool").on(t.restaurantId, t.sector)]);

/** Teslimat oturumları — işletme "teslimata çıkar" dediğinde açılır; canlı konum zorunludur, sürücü kapatamaz.
 *  Her sektörün (carpet | water | tube) oturumu ayrıdır: bir sektörün sürücüsü yoldayken diğeri de görev alabilir. */
export const deliverySessions = mysqlTable("delivery_sessions", {
  id: int("id").autoincrement().primaryKey(),
  restaurantId: int("restaurant_id").notNull().references(() => restaurants.id),
  kind: varchar("kind", { length: 16 }).notNull(), // carpet | water | tube
  orderNo: varchar("order_no", { length: 32 }).notNull(),
  driverId: int("driver_id"), // sector_drivers kaydı — atama işletme panelinden (otomatik/manuel) gelir
  driverName: varchar("driver_name", { length: 96 }),
  status: varchar("status", { length: 16 }).notNull().default("active"), // active | completed
  lastLat: double("last_lat"),
  lastLng: double("last_lng"),
  lastAccuracy: double("last_accuracy"),
  lastPingAt: timestamp("last_ping_at"),
  startedAt: timestamp("started_at").defaultNow(),
  endedAt: timestamp("ended_at"),
});

/** Fason firmaları: "Fason Yıkayan" = halılarınızı sizin adınıza yıkayan dış firma (siz onlara iş veriyorsunuz),
 *  "Fason Yıkatan" = halılarını size gönderip sizin yıkamanızı isteyen dış firma (onlar size iş veriyor). B2B cari hesap. */
export const fasonFirms = mysqlTable("fason_firms", {
  id: int("id").autoincrement().primaryKey(),
  restaurantId: int("restaurant_id").notNull().references(() => restaurants.id),
  kind: varchar("kind", { length: 16 }).notNull(), // yikayan | yikatan
  name: varchar("name", { length: 128 }).notNull(),
  phone: varchar("phone", { length: 32 }).notNull(),
  address: varchar("address", { length: 512 }),
  discountPercent: decimal("discount_percent", { precision: 5, scale: 2 }).notNull().default("0"),
  debt: decimal("debt", { precision: 10, scale: 2 }).notNull().default("0"),
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => [index("idx_fason_firms_restaurant").on(t.restaurantId)]);

export const vehicles = mysqlTable("vehicles", {
  id: int("id").autoincrement().primaryKey(),
  restaurantId: int("restaurant_id").notNull().references(() => restaurants.id),
  internalCode: varchar("internal_code", { length: 24 }).notNull().unique(),
  plate: varchar("plate", { length: 24 }).notNull(),
  name: varchar("name", { length: 96 }),
  brand: varchar("brand", { length: 48 }),
  modelYear: int("model_year"),
  capacity: int("capacity").notNull().default(0), // damacana adedi veya halı adedi
  driverName: varchar("driver_name", { length: 96 }),
  status: varchar("status", { length: 24 }).notNull().default("active"), // active | maintenance | passive
  gpsMethod: varchar("gps_method", { length: 24 }).notNull().default("none"), // none | driver_app | gps_device
  gpsDeviceId: varchar("gps_device_id", { length: 64 }),
  lastLat: decimal("last_lat", { precision: 10, scale: 6 }),
  lastLng: decimal("last_lng", { precision: 10, scale: 6 }),
  lastSeenAt: timestamp("last_seen_at"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => [uniqueIndex("uq_vehicle_restaurant_plate").on(t.restaurantId, t.plate)]);

/** GPS konum geçmişi — yalnızca gerçek kaynak (şoför uygulaması/cihaz) kaydeder; sahte veri üretilmez. */
export const vehicleLocations = mysqlTable("vehicle_locations", {
  id: int("id").autoincrement().primaryKey(),
  vehicleId: int("vehicle_id").notNull().references(() => vehicles.id),
  restaurantId: int("restaurant_id").notNull().references(() => restaurants.id),
  lat: decimal("lat", { precision: 10, scale: 6 }).notNull(),
  lng: decimal("lng", { precision: 10, scale: 6 }).notNull(),
  speed: decimal("speed", { precision: 6, scale: 2 }),
  source: varchar("source", { length: 24 }).notNull().default("driver_app"), // driver_app | gps_device
  recordedAt: timestamp("recorded_at").notNull().defaultNow(),
}, (t) => [index("idx_vl_vehicle_time").on(t.vehicleId, t.recordedAt)]);
