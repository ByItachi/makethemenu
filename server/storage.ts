import { db } from "./db";
import { eq, desc } from "drizzle-orm";
import { 
  users, tables, categories, products, orders, orderItems,
  type User, type InsertUser,
  type Table, type InsertTable,
  type Category, type InsertCategory,
  type Product, type InsertProduct,
  type Order, type InsertOrder,
  type OrderItem, type InsertOrderItem,
  type OrderWithItems
} from "@shared/schema";

// Import Auth Storage to extend/implement
import { authStorage, type IAuthStorage } from "./replit_integrations/auth";

export interface IStorage extends IAuthStorage {
  // Tables
  getTables(): Promise<Table[]>;
  getTable(id: number): Promise<Table | undefined>;
  createTable(table: InsertTable): Promise<Table>;
  updateTable(id: number, table: Partial<InsertTable>): Promise<Table>;
  deleteTable(id: number): Promise<void>;

  // Categories
  getCategories(): Promise<Category[]>;
  getCategory(id: number): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  deleteCategory(id: number): Promise<void>;

  // Products
  getProducts(categoryId?: number): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product>;
  deleteProduct(id: number): Promise<void>;

  // Orders
  getOrders(status?: string): Promise<OrderWithItems[]>;
  getOrder(id: number): Promise<OrderWithItems | undefined>;
  createOrder(order: InsertOrder, items: InsertOrderItem[]): Promise<OrderWithItems>;
  updateOrderStatus(id: number, status: string): Promise<Order>;
  // Contact messages
  createContactMessage(message: InsertContactMessage): Promise<ContactMessage>;
}

export class DatabaseStorage implements IStorage {
  // Implement IAuthStorage methods by delegating or re-implementing if needed
  // Since we imported authStorage, we can just use its methods or extend our class from it if it was a class.
  // But authStorage is an instance. So we delegate.
  getUser(id: string) { return authStorage.getUser(id); }
  upsertUser(user: any) { return authStorage.upsertUser(user); }

  // Tables
  async getTables(): Promise<Table[]> {
    return await db.select().from(tables).orderBy(tables.id);
  }

  async getTable(id: number): Promise<Table | undefined> {
    const [table] = await db.select().from(tables).where(eq(tables.id, id));
    return table;
  }

  async createTable(table: InsertTable): Promise<Table> {
    const [newTable] = await db.insert(tables).values(table).returning();
    return newTable;
  }

  async updateTable(id: number, updates: Partial<InsertTable>): Promise<Table> {
    const [updated] = await db.update(tables).set(updates).where(eq(tables.id, id)).returning();
    return updated;
  }

  async deleteTable(id: number): Promise<void> {
    await db.delete(tables).where(eq(tables.id, id));
  }

  // Categories
  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories).orderBy(categories.id);
  }

  async getCategory(id: number): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category;
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db.insert(categories).values(category).returning();
    return newCategory;
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

  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const [newProduct] = await db.insert(products).values(product).returning();
    return newProduct;
  }

  async updateProduct(id: number, updates: Partial<InsertProduct>): Promise<Product> {
    const [updated] = await db.update(products).set(updates).where(eq(products.id, id)).returning();
    return updated;
  }

  async deleteProduct(id: number): Promise<void> {
    await db.delete(products).where(eq(products.id, id));
  }

  // Orders
  async getOrders(status?: string): Promise<OrderWithItems[]> {
    const conditions = status ? eq(orders.status, status) : undefined;
    const ordersList = await db.query.orders.findMany({
      where: conditions,
      orderBy: desc(orders.createdAt),
      with: {
        items: {
          with: {
            product: true
          }
        },
        table: true
      }
    });
    return ordersList;
  }

  async getOrder(id: number): Promise<OrderWithItems | undefined> {
    const order = await db.query.orders.findFirst({
      where: eq(orders.id, id),
      with: {
        items: {
          with: {
            product: true
          }
        },
        table: true
      }
    });
    return order;
  }

  async createOrder(orderData: InsertOrder, itemsData: InsertOrderItem[]): Promise<OrderWithItems> {
    // Start a transaction
    return await db.transaction(async (tx) => {
      // 1. Create Order
      // Calculate total amount from items
      let total = 0;
      // We need to fetch product prices to be secure, or trust the input (internal usage).
      // Let's trust input for now or fetch. Better to fetch prices.
      // For MVP, assuming itemsData has correct price or we fetch it.
      // schema.ts says OrderItem has price.
      
      // Let's refetch product prices to ensure accuracy
      const productIds = itemsData.map(i => i.productId);
      const productsList = await tx.select().from(products); // In transaction
      // Optimization: whereIn
      
      let computedTotal = 0;
      const finalItems = itemsData.map(item => {
        const product = productsList.find(p => p.id === item.productId);
        const price = product ? Number(product.price) : 0;
        computedTotal += price * item.quantity;
        return {
          ...item,
          price: price.toString()
        };
      });

      const [newOrder] = await tx.insert(orders).values({
        ...orderData,
        totalAmount: computedTotal.toString(),
        status: "pending"
      }).returning();

      // 2. Create Items
      if (itemsData.length > 0) {
        await tx.insert(orderItems).values(
          finalItems.map(item => ({
            ...item,
            orderId: newOrder.id
          }))
        );
      }
      
      // Update table status if valid table
      if (orderData.tableId) {
        await tx.update(tables)
          .set({ status: 'occupied' })
          .where(eq(tables.id, orderData.tableId));
      }

      // Return full order
      const createdOrder = await tx.query.orders.findFirst({
        where: eq(orders.id, newOrder.id),
        with: {
          items: {
            with: {
              product: true
            }
          },
          table: true
        }
      });
      
      if (!createdOrder) throw new Error("Failed to create order");
      return createdOrder;
    });
  }

  async updateOrderStatus(id: number, status: string): Promise<Order> {
    const [updated] = await db.update(orders).set({ status }).where(eq(orders.id, id)).returning();
    
    // If completed or paid or cancelled, free the table?
    if (['completed', 'cancelled', 'paid'].includes(status) && updated.tableId) {
      await db.update(tables).set({ status: 'available' }).where(eq(tables.id, updated.tableId));
    }

    return updated;
  }
}

export const storage = new DatabaseStorage();
