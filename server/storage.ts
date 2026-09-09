import {
  tables, type Table, type InsertTable,
  categories, type Category, type InsertCategory,
  products, type Product, type InsertProduct,
  orders, type Order, type InsertOrder,
  orderItems, type OrderItem, type InsertOrderItem,
  contactMessages, type ContactMessage, type InsertContactMessage,
  restaurants, type Restaurant, type InsertRestaurant,
  licenses, type License, type InsertLicense,
  licenseActivities, type LicenseActivity, type InsertLicenseActivity,
  adminNotifications, type AdminNotification, type InsertAdminNotification,
  pendingPayments, type PendingPayment, type InsertPendingPayment,
  type OrderWithItems
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // Tables
  getTables(): Promise<Table[]>;
  createTable(table: InsertTable): Promise<Table>;
  updateTable(id: number, table: Partial<InsertTable>): Promise<Table>;
  deleteTable(id: number): Promise<void>;

  // Categories
  getCategories(): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;
  deleteCategory(id: number): Promise<void>;

  // Products
  getProducts(categoryId?: number): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product>;
  deleteProduct(id: number): Promise<void>;

  // Orders
  getOrders(status?: string): Promise<OrderWithItems[]>;
  getOrder(id: number): Promise<OrderWithItems | undefined>;
  createOrder(order: InsertOrder, items: InsertOrderItem[]): Promise<OrderWithItems>;
  updateOrderStatus(id: number, status: string): Promise<Order>;

  // Contact
  createContactMessage(message: InsertContactMessage): Promise<ContactMessage>;
}

export class DatabaseStorage implements IStorage {
  // Tables
  async getTables(): Promise<Table[]> {
    return await db.select().from(tables);
  }

  async createTable(insertTable: InsertTable): Promise<Table> {
    const [result] = await db.insert(tables).values(insertTable);
    const [table] = await db.select().from(tables).where(eq(tables.id, result.insertId));
    return table;
  }

  async updateTable(id: number, updateTable: Partial<InsertTable>): Promise<Table> {
    await db.update(tables).set(updateTable).where(eq(tables.id, id));
    const [table] = await db.select().from(tables).where(eq(tables.id, id));
    if (!table) throw new Error("Table not found");
    return table;
  }

  async deleteTable(id: number): Promise<void> {
    await db.delete(tables).where(eq(tables.id, id));
  }

  // Categories
  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories);
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const [result] = await db.insert(categories).values(insertCategory);
    const [category] = await db.select().from(categories).where(eq(categories.id, result.insertId));
    return category;
  }

  async deleteCategory(id: number): Promise<void> {
    await db.delete(categories).where(eq(categories.id, id));
  }

  // Products
  async getProducts(categoryId?: number): Promise<Product[]> {
    if (categoryId) {
      return await db.select().from(products).where(eq(products.categoryId, categoryId));
    }
    return await db.select().from(products);
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const [result] = await db.insert(products).values(insertProduct);
    const [product] = await db.select().from(products).where(eq(products.id, result.insertId));
    return product;
  }

  async updateProduct(id: number, updateProduct: Partial<InsertProduct>): Promise<Product> {
    await db.update(products).set(updateProduct).where(eq(products.id, id));
    const [product] = await db.select().from(products).where(eq(products.id, id));
    if (!product) throw new Error("Product not found");
    return product;
  }

  async deleteProduct(id: number): Promise<void> {
    await db.delete(products).where(eq(products.id, id));
  }

  // Orders
  async getOrders(status?: string): Promise<OrderWithItems[]> {
    const orderResults = status
      ? await db.select().from(orders).where(eq(orders.status, status))
      : await db.select().from(orders);
    const results = await Promise.all(orderResults.map(order => this.getOrder(order.id)));
    return results.filter((o): o is OrderWithItems => o !== undefined);
  }

  async getOrder(id: number): Promise<OrderWithItems | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    if (!order) return undefined;

    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, id));
    const itemsWithProducts = await Promise.all(items.map(async (item) => {
      const [product] = await db.select().from(products).where(eq(products.id, item.productId!));
      return { ...item, product: product! };
    }));

    const [table] = order.tableId ? await db.select().from(tables).where(eq(tables.id, order.tableId)) : [undefined];

    return { ...order, table: table || null, items: itemsWithProducts };
  }

  async createOrder(insertOrder: InsertOrder, items: InsertOrderItem[]): Promise<OrderWithItems> {
    const [result] = await db.insert(orders).values(insertOrder);

    for (const item of items) {
      await db.insert(orderItems).values({ ...item, orderId: result.insertId });
    }

    return (await this.getOrder(result.insertId))!;
  }

  async updateOrderStatus(id: number, status: string): Promise<Order> {
    await db.update(orders).set({ status }).where(eq(orders.id, id));
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    if (!order) throw new Error("Order not found");
    return order;
  }

  // Admin: Restaurants
  async getRestaurants(): Promise<Restaurant[]> {
    return await db.select().from(restaurants).orderBy(desc(restaurants.id));
  }

  async createRestaurant(insert: InsertRestaurant): Promise<Restaurant> {
    const [result] = await db.insert(restaurants).values(insert);
    const [row] = await db.select().from(restaurants).where(eq(restaurants.id, result.insertId));
    return row;
  }

  async updateRestaurant(id: number, update: Partial<InsertRestaurant>): Promise<Restaurant> {
    await db.update(restaurants).set(update).where(eq(restaurants.id, id));
    const [row] = await db.select().from(restaurants).where(eq(restaurants.id, id));
    if (!row) throw new Error("Restaurant not found");
    return row;
  }

  async deleteRestaurant(id: number): Promise<void> {
    await db.delete(restaurants).where(eq(restaurants.id, id));
  }

  // Admin: Licenses
  async getLicenses(): Promise<License[]> {
    return await db.select().from(licenses).orderBy(desc(licenses.id));
  }

  async createLicense(insert: InsertLicense): Promise<License> {
    const [result] = await db.insert(licenses).values(insert);
    const [row] = await db.select().from(licenses).where(eq(licenses.id, result.insertId));
    return row;
  }

  async updateLicense(id: number, update: Partial<InsertLicense>): Promise<License> {
    await db.update(licenses).set(update).where(eq(licenses.id, id));
    const [row] = await db.select().from(licenses).where(eq(licenses.id, id));
    if (!row) throw new Error("License not found");
    return row;
  }

  async getLicense(id: number): Promise<License | undefined> {
    const [row] = await db.select().from(licenses).where(eq(licenses.id, id));
    return row;
  }

  async deleteLicense(id: number): Promise<void> {
    await db.delete(licenses).where(eq(licenses.id, id));
  }

  async getLicenseActivities(): Promise<LicenseActivity[]> {
    return await db.select().from(licenseActivities).orderBy(desc(licenseActivities.id)).limit(20);
  }

  async createLicenseActivity(insert: InsertLicenseActivity): Promise<LicenseActivity> {
    const [result] = await db.insert(licenseActivities).values(insert);
    const [row] = await db.select().from(licenseActivities).where(eq(licenseActivities.id, result.insertId));
    return row;
  }

  // Admin: Notifications
  async getAdminNotifications(): Promise<AdminNotification[]> {
    return await db.select().from(adminNotifications).orderBy(desc(adminNotifications.id));
  }

  async createAdminNotification(insert: InsertAdminNotification): Promise<AdminNotification> {
    const [result] = await db.insert(adminNotifications).values(insert);
    const [row] = await db.select().from(adminNotifications).where(eq(adminNotifications.id, result.insertId));
    return row;
  }

  async updateAdminNotification(id: number, update: Partial<InsertAdminNotification>): Promise<AdminNotification> {
    await db.update(adminNotifications).set(update).where(eq(adminNotifications.id, id));
    const [row] = await db.select().from(adminNotifications).where(eq(adminNotifications.id, id));
    if (!row) throw new Error("Notification not found");
    return row;
  }

  async deleteAdminNotification(id: number): Promise<void> {
    await db.delete(adminNotifications).where(eq(adminNotifications.id, id));
  }

  // Admin: Pending Payments
  async getPendingPayments(): Promise<PendingPayment[]> {
    return await db.select().from(pendingPayments).orderBy(desc(pendingPayments.id));
  }

  async createPendingPayment(insert: InsertPendingPayment): Promise<PendingPayment> {
    const [result] = await db.insert(pendingPayments).values(insert);
    const [row] = await db.select().from(pendingPayments).where(eq(pendingPayments.id, result.insertId));
    return row;
  }

  // Contact
  async createContactMessage(insertMessage: InsertContactMessage): Promise<ContactMessage> {
    const [result] = await db.insert(contactMessages).values(insertMessage);
    const [message] = await db.select().from(contactMessages).where(eq(contactMessages.id, result.insertId));
    return message;
  }
}

export class MemStorage implements IStorage {
  private tables: Map<number, Table>;
  private categories: Map<number, Category>;
  private products: Map<number, Product>;
  private orders: Map<number, Order>;
  private orderItems: Map<number, OrderItem>;
  private contactMessages: Map<number, ContactMessage>;
  
  private tableId: number;
  private categoryId: number;
  private productId: number;
  private orderId: number;
  private orderItemId: number;
  private contactMessageId: number;

  constructor() {
    this.tables = new Map();
    this.categories = new Map();
    this.products = new Map();
    this.orders = new Map();
    this.orderItems = new Map();
    this.contactMessages = new Map();
    
    this.tableId = 1;
    this.categoryId = 1;
    this.productId = 1;
    this.orderId = 1;
    this.orderItemId = 1;
    this.contactMessageId = 1;
  }

  // Tables
  async getTables(): Promise<Table[]> {
    return Array.from(this.tables.values());
  }

  async createTable(insertTable: InsertTable): Promise<Table> {
    const id = this.tableId++;
    const table: Table = { ...insertTable, id, x: insertTable.x ?? 0, y: insertTable.y ?? 0, status: insertTable.status ?? "available" };
    this.tables.set(id, table);
    return table;
  }

  async updateTable(id: number, updateTable: Partial<InsertTable>): Promise<Table> {
    const table = this.tables.get(id);
    if (!table) throw new Error("Table not found");
    const updatedTable = { ...table, ...updateTable };
    this.tables.set(id, updatedTable);
    return updatedTable;
  }

  async deleteTable(id: number): Promise<void> {
    this.tables.delete(id);
  }

  // Categories
  async getCategories(): Promise<Category[]> {
    return Array.from(this.categories.values());
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const id = this.categoryId++;
    const category: Category = { ...insertCategory, id, imageUrl: insertCategory.imageUrl ?? null, icon: insertCategory.icon ?? null };
    this.categories.set(id, category);
    return category;
  }

  async deleteCategory(id: number): Promise<void> {
    this.categories.delete(id);
  }

  // Products
  async getProducts(categoryId?: number): Promise<Product[]> {
    const products = Array.from(this.products.values());
    if (categoryId) {
      return products.filter(p => p.categoryId === categoryId);
    }
    return products;
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const id = this.productId++;
    const product: Product = { ...insertProduct, id, description: insertProduct.description ?? null, imageUrl: insertProduct.imageUrl ?? null, isAvailable: insertProduct.isAvailable ?? true, categoryId: insertProduct.categoryId ?? null };
    this.products.set(id, product);
    return product;
  }

  async updateProduct(id: number, updateProduct: Partial<InsertProduct>): Promise<Product> {
    const product = this.products.get(id);
    if (!product) throw new Error("Product not found");
    const updatedProduct = { ...product, ...updateProduct };
    this.products.set(id, updatedProduct);
    return updatedProduct;
  }

  async deleteProduct(id: number): Promise<void> {
    this.products.delete(id);
  }

  // Orders
  async getOrders(status?: string): Promise<OrderWithItems[]> {
    let orders = Array.from(this.orders.values());
    if (status) {
      orders = orders.filter(o => o.status === status);
    }
    const results = await Promise.all(orders.map(order => this.getOrder(order.id)));
    return results.filter((o): o is OrderWithItems => o !== undefined);
  }

  async getOrder(id: number): Promise<OrderWithItems | undefined> {
    const order = this.orders.get(id);
    if (!order) return undefined;

    const items = Array.from(this.orderItems.values()).filter(item => item.orderId === id);
    const itemsWithProducts = items.map(item => {
      const product = this.products.get(item.productId!);
      return { ...item, product: product! };
    });

    const table = order.tableId ? this.tables.get(order.tableId) : undefined;

    return { ...order, table: table || null, items: itemsWithProducts };
  }

  async createOrder(insertOrder: InsertOrder, items: InsertOrderItem[]): Promise<OrderWithItems> {
    const id = this.orderId++;
    const order: Order = { ...insertOrder, id, status: insertOrder.status ?? "pending", createdAt: new Date(), tableId: insertOrder.tableId ?? null };
    this.orders.set(id, order);

    for (const item of items) {
      const itemId = this.orderItemId++;
      this.orderItems.set(itemId, { ...item, id: itemId, orderId: id, notes: item.notes ?? null, productId: item.productId ?? null });
    }

    return (await this.getOrder(id))!;
  }

  async updateOrderStatus(id: number, status: string): Promise<Order> {
    const order = this.orders.get(id);
    if (!order) throw new Error("Order not found");
    const updatedOrder = { ...order, status };
    this.orders.set(id, updatedOrder);
    return updatedOrder;
  }

  // Contact
  async createContactMessage(insertMessage: InsertContactMessage): Promise<ContactMessage> {
    const id = this.contactMessageId++;
    const message: ContactMessage = { ...insertMessage, id, createdAt: new Date() };
    this.contactMessages.set(id, message);
    return message;
  }
}

export const storage = new DatabaseStorage();
