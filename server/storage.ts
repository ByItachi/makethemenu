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
import { and, eq, desc, asc } from "drizzle-orm";

// Every tenant-owned query takes restaurantId as its first argument.
// Rows belonging to another business are treated as "not found".
export interface IStorage {
  // Tables
  getTables(restaurantId: number): Promise<Table[]>;
  createTable(restaurantId: number, table: InsertTable): Promise<Table>;
  updateTable(restaurantId: number, id: number, table: Partial<InsertTable>): Promise<Table | undefined>;
  deleteTable(restaurantId: number, id: number): Promise<boolean>;

  // Categories
  getCategories(restaurantId: number): Promise<Category[]>;
  createCategory(restaurantId: number, category: InsertCategory): Promise<Category>;
  deleteCategory(restaurantId: number, id: number): Promise<boolean>;
  reorderCategories(restaurantId: number, orderedIds: number[]): Promise<boolean>;

  // Products
  getProducts(restaurantId: number, categoryId?: number): Promise<Product[]>;
  createProduct(restaurantId: number, product: InsertProduct): Promise<Product>;
  updateProduct(restaurantId: number, id: number, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(restaurantId: number, id: number): Promise<boolean>;
  reorderProducts(restaurantId: number, orderedIds: number[]): Promise<boolean>;

  // Orders
  getOrders(restaurantId: number, status?: string): Promise<OrderWithItems[]>;
  getOrder(restaurantId: number, id: number): Promise<OrderWithItems | undefined>;
  createOrder(restaurantId: number, order: InsertOrder, items: InsertOrderItem[]): Promise<OrderWithItems>;
  updateOrderStatus(restaurantId: number, id: number, status: string): Promise<Order | undefined>;

  // Contact (public, not tenant-scoped)
  createContactMessage(message: InsertContactMessage): Promise<ContactMessage>;
}

export class DatabaseStorage implements IStorage {
  // Tables
  async getTables(restaurantId: number): Promise<Table[]> {
    return await db.select().from(tables).where(eq(tables.restaurantId, restaurantId));
  }

  async createTable(restaurantId: number, insertTable: InsertTable): Promise<Table> {
    const [result] = await db.insert(tables).values({ ...insertTable, restaurantId });
    const [table] = await db.select().from(tables).where(eq(tables.id, result.insertId));
    return table;
  }

  async updateTable(restaurantId: number, id: number, updateTable: Partial<InsertTable>): Promise<Table | undefined> {
    const [result] = await db.update(tables).set(updateTable).where(and(eq(tables.id, id), eq(tables.restaurantId, restaurantId)));
    if (result.affectedRows === 0) return undefined;
    const [table] = await db.select().from(tables).where(eq(tables.id, id));
    return table;
  }

  async deleteTable(restaurantId: number, id: number): Promise<boolean> {
    const [result] = await db.delete(tables).where(and(eq(tables.id, id), eq(tables.restaurantId, restaurantId)));
    return result.affectedRows > 0;
  }

  // Categories
  async getCategories(restaurantId: number): Promise<Category[]> {
    return await db.select().from(categories).where(eq(categories.restaurantId, restaurantId)).orderBy(asc(categories.sortOrder), asc(categories.id));
  }

  async createCategory(restaurantId: number, insertCategory: InsertCategory): Promise<Category> {
    const [result] = await db.insert(categories).values({ ...insertCategory, restaurantId });
    const [category] = await db.select().from(categories).where(eq(categories.id, result.insertId));
    return category;
  }

  async deleteCategory(restaurantId: number, id: number): Promise<boolean> {
    const [result] = await db.delete(categories).where(and(eq(categories.id, id), eq(categories.restaurantId, restaurantId)));
    return result.affectedRows > 0;
  }

  async reorderCategories(restaurantId: number, orderedIds: number[]): Promise<boolean> {
    await Promise.all(
      orderedIds.map((id, index) =>
        db.update(categories).set({ sortOrder: index }).where(and(eq(categories.id, id), eq(categories.restaurantId, restaurantId))),
      ),
    );
    return true;
  }

  // Products
  async getProducts(restaurantId: number, categoryId?: number): Promise<Product[]> {
    const scope = categoryId
      ? and(eq(products.restaurantId, restaurantId), eq(products.categoryId, categoryId))
      : eq(products.restaurantId, restaurantId);
    return await db.select().from(products).where(scope).orderBy(asc(products.sortOrder), asc(products.id));
  }

  async reorderProducts(restaurantId: number, orderedIds: number[]): Promise<boolean> {
    await Promise.all(
      orderedIds.map((id, index) =>
        db.update(products).set({ sortOrder: index }).where(and(eq(products.id, id), eq(products.restaurantId, restaurantId))),
      ),
    );
    return true;
  }

  async createProduct(restaurantId: number, insertProduct: InsertProduct): Promise<Product> {
    if (insertProduct.categoryId && !(await this.ownsCategory(restaurantId, insertProduct.categoryId))) {
      throw new Error("Category not found");
    }
    const [result] = await db.insert(products).values({ ...insertProduct, restaurantId });
    const [product] = await db.select().from(products).where(eq(products.id, result.insertId));
    return product;
  }

  async updateProduct(restaurantId: number, id: number, updateProduct: Partial<InsertProduct>): Promise<Product | undefined> {
    if (updateProduct.categoryId && !(await this.ownsCategory(restaurantId, updateProduct.categoryId))) {
      throw new Error("Category not found");
    }
    const [result] = await db.update(products).set(updateProduct).where(and(eq(products.id, id), eq(products.restaurantId, restaurantId)));
    if (result.affectedRows === 0) return undefined;
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }

  async deleteProduct(restaurantId: number, id: number): Promise<boolean> {
    const [result] = await db.delete(products).where(and(eq(products.id, id), eq(products.restaurantId, restaurantId)));
    return result.affectedRows > 0;
  }

  private async ownsCategory(restaurantId: number, categoryId: number): Promise<boolean> {
    const [row] = await db
      .select({ id: categories.id })
      .from(categories)
      .where(and(eq(categories.id, categoryId), eq(categories.restaurantId, restaurantId)));
    return !!row;
  }

  // Orders
  async getOrders(restaurantId: number, status?: string): Promise<OrderWithItems[]> {
    const scope = status
      ? and(eq(orders.restaurantId, restaurantId), eq(orders.status, status))
      : eq(orders.restaurantId, restaurantId);
    const orderResults = await db.select().from(orders).where(scope);
    const results = await Promise.all(orderResults.map((order) => this.getOrder(restaurantId, order.id)));
    return results.filter((o): o is OrderWithItems => o !== undefined);
  }

  async getOrder(restaurantId: number, id: number): Promise<OrderWithItems | undefined> {
    const [order] = await db
      .select()
      .from(orders)
      .where(and(eq(orders.id, id), eq(orders.restaurantId, restaurantId)));
    if (!order) return undefined;

    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, id));
    const itemsWithProducts = await Promise.all(items.map(async (item) => {
      const [product] = await db.select().from(products).where(eq(products.id, item.productId!));
      return { ...item, product: product! };
    }));

    const [table] = order.tableId ? await db.select().from(tables).where(eq(tables.id, order.tableId)) : [undefined];

    return { ...order, table: table || null, items: itemsWithProducts };
  }

  async createOrder(restaurantId: number, insertOrder: InsertOrder, items: InsertOrderItem[]): Promise<OrderWithItems> {
    if (insertOrder.tableId) {
      const [t] = await db.select({ id: tables.id }).from(tables).where(and(eq(tables.id, insertOrder.tableId), eq(tables.restaurantId, restaurantId)));
      if (!t) throw new Error("Table not found");
    }
    const [result] = await db.insert(orders).values({ ...insertOrder, restaurantId });

    for (const item of items) {
      await db.insert(orderItems).values({ ...item, orderId: result.insertId });
    }

    return (await this.getOrder(restaurantId, result.insertId))!;
  }

  async updateOrderStatus(restaurantId: number, id: number, status: string): Promise<Order | undefined> {
    const [result] = await db.update(orders).set({ status }).where(and(eq(orders.id, id), eq(orders.restaurantId, restaurantId)));
    if (result.affectedRows === 0) return undefined;
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
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

export const storage = new DatabaseStorage();
