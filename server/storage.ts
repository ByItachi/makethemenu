import { 
  users, 
  type User, 
  type InsertUser, 
  tables, 
  type Table, 
  type InsertTable,
  categories, 
  type Category, 
  type InsertCategory,
  products, 
  type Product, 
  type InsertProduct,
  orders, 
  type Order, 
  type InsertOrder,
  orderItems, 
  type OrderItem, 
  type InsertOrderItem,
  contactMessages,
  type ContactMessage,
  type InsertContactMessage,
  type OrderWithItems
} from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";
import { authStorage } from "./replit_integrations/auth/storage";

export interface IStorage {
  // Auth
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

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
  // Auth Delegation
  async getUser(id: string) { return authStorage.getUser(id); }
  async getUserByUsername(username: string) { return authStorage.getUserByUsername(username); }
  async createUser(user: InsertUser) { return authStorage.createUser(user); }

  // Tables
  async getTables(): Promise<Table[]> {
    return await db.select().from(tables);
  }
  async createTable(table: InsertTable): Promise<Table> {
    const [t] = await db.insert(tables).values(table).returning();
    return t;
  }
  async updateTable(id: number, table: Partial<InsertTable>): Promise<Table> {
    const [t] = await db.update(tables).set(table).where(eq(tables.id, id)).returning();
    return t;
  }
  async deleteTable(id: number): Promise<void> {
    await db.delete(tables).where(eq(tables.id, id));
  }

  // Categories
  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories);
  }
  async createCategory(category: InsertCategory): Promise<Category> {
    const [c] = await db.insert(categories).values(category).returning();
    return c;
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
  async createProduct(product: InsertProduct): Promise<Product> {
    const [p] = await db.insert(products).values(product).returning();
    return p;
  }
  async updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product> {
    const [p] = await db.update(products).set(product).where(eq(products.id, id)).returning();
    return p;
  }
  async deleteProduct(id: number): Promise<void> {
    await db.delete(products).where(eq(products.id, id));
  }

  // Orders
  async getOrders(status?: string): Promise<OrderWithItems[]> {
    const baseOrders = status 
      ? await db.select().from(orders).where(eq(orders.status, status))
      : await db.select().from(orders);

    const result: OrderWithItems[] = [];
    for (const order of baseOrders) {
      const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
      const itemsWithProducts = [];
      for (const item of items) {
        const [product] = await db.select().from(products).where(eq(products.id, item.productId!));
        itemsWithProducts.push({ ...item, product });
      }
      const [table] = order.tableId ? await db.select().from(tables).where(eq(tables.id, order.tableId)) : [null];
      result.push({ ...order, table, items: itemsWithProducts });
    }
    return result;
  }

  async getOrder(id: number): Promise<OrderWithItems | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    if (!order) return undefined;
    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
    const itemsWithProducts = [];
    for (const item of items) {
      const [product] = await db.select().from(products).where(eq(products.id, item.productId!));
      itemsWithProducts.push({ ...item, product });
    }
    const [table] = order.tableId ? await db.select().from(tables).where(eq(tables.id, order.tableId)) : [null];
    return { ...order, table, items: itemsWithProducts };
  }

  async createOrder(order: InsertOrder, items: InsertOrderItem[]): Promise<OrderWithItems> {
    const [newOrder] = await db.insert(orders).values(order).returning();
    for (const item of items) {
      await db.insert(orderItems).values({ ...item, orderId: newOrder.id });
    }
    return (await this.getOrder(newOrder.id))!;
  }

  async updateOrderStatus(id: number, status: string): Promise<Order> {
    const [updated] = await db.update(orders).set({ status }).where(eq(orders.id, id)).returning();
    return updated;
  }

  // Contact
  async createContactMessage(message: InsertContactMessage): Promise<ContactMessage> {
    const [m] = await db.insert(contactMessages).values(message).returning();
    return m;
  }
}

export const storage = new DatabaseStorage();
