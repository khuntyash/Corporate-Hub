import { eq, and, desc, asc, ilike, count, or, lt, sql } from "drizzle-orm";
import { db } from "./db";
import * as schema from "@shared/schema";
import type {
  User,
  Company,
  Product,
  Order,
  OrderItem,
  Invoice,
  Inquiry,
  InsertUser,
  InsertCompany,
  InsertProduct,
  InsertOrder,
  InsertOrderItem,
  InsertInvoice,
  InsertInquiry,
  InsertSession,
  Session,
  SiteContent,
  PendingRegistration,
  InsertPendingRegistration,
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;
  getUsersByCompany(companyId: string): Promise<User[]>;
  getAllUsers(): Promise<User[]>;

  // Company operations
  getCompany(id: string): Promise<Company | undefined>;
  getCompanyByEmail(email: string): Promise<Company | undefined>;
  createCompany(company: InsertCompany): Promise<Company>;
  updateCompany(id: string, company: Partial<InsertCompany>): Promise<Company | undefined>;
  deleteCompany(id: string): Promise<boolean>;
  getAllCompanies(): Promise<Company[]>;

  // Product operations
  getProduct(id: string): Promise<Product | undefined>;
  getProductBySku(sku: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: string): Promise<boolean>;
  getProductsBySeller(sellerCompanyId: string): Promise<Product[]>;
  getAllProducts(): Promise<Product[]>;
  searchProducts(query: string): Promise<Product[]>;

  // Order operations
  getOrder(id: string): Promise<Order | undefined>;
  getOrderByNumber(orderNumber: string): Promise<Order | undefined>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: string, order: Partial<InsertOrder>): Promise<Order | undefined>;
  deleteOrder(id: string): Promise<boolean>;
  getOrdersByBuyer(buyerCompanyId: string): Promise<Order[]>;
  getOrdersBySeller(sellerCompanyId: string): Promise<Order[]>;
  getOrdersByUser(userId: string): Promise<Order[]>;
  getAllOrdersWithDetails(): Promise<(Order & { user: User | null })[]>;

  // Order item operations
  getOrderItems(orderId: string): Promise<OrderItem[]>;
  createOrderItem(item: InsertOrderItem): Promise<OrderItem>;
  updateOrderItem(id: string, item: Partial<InsertOrderItem>): Promise<OrderItem | undefined>;
  deleteOrderItem(id: string): Promise<boolean>;

  // Invoice operations
  getInvoice(id: string): Promise<Invoice | undefined>;
  getInvoiceByNumber(invoiceNumber: string): Promise<Invoice | undefined>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  updateInvoice(id: string, invoice: Partial<InsertInvoice>): Promise<Invoice | undefined>;
  deleteInvoice(id: string): Promise<boolean>;
  getInvoicesByCompany(companyId: string): Promise<Invoice[]>;
  getInvoicesByOrder(orderId: string): Promise<Invoice[]>;

  // Inquiry operations
  createInquiry(inquiry: InsertInquiry): Promise<Inquiry>;
  getInquiry(id: string): Promise<Inquiry | undefined>;
  updateInquiry(id: string, inquiry: Partial<InsertInquiry>): Promise<Inquiry | undefined>;
  deleteInquiry(id: string): Promise<boolean>;
  getInquiriesByAdmin(): Promise<Inquiry[]>;
  getInquiriesBySeller(sellerCompanyId: string): Promise<Inquiry[]>;
  getInquiriesByBuyer(buyerCompanyId: string): Promise<Inquiry[]>;
  getInquiriesByProduct(productId: string): Promise<Inquiry[]>;
  getInquiryStats(): Promise<{ total: number; pending: number; responded: number; closed: number }>;

  // Session operations
  getSession(id: string): Promise<any>;
  getSessionByToken(token: string): Promise<any>;
  createSession(session: any): Promise<any>;
  updateSession(id: string, session: Partial<any>): Promise<any>;
  deleteSession(id: string): Promise<boolean>;
  deleteExpiredSessions(): Promise<number>;
  getSessionsByUser(userId: string): Promise<any[]>;

  // Content
  getSiteContent(): Promise<Map<string, SiteContent>>;
  updateSiteContent(key: string, content: string): Promise<SiteContent>;
  publishSiteContent(): Promise<void>;

  // Pending Registration operations
  getPendingRegistration(email: string): Promise<PendingRegistration | undefined>;
  createPendingRegistration(pending: InsertPendingRegistration): Promise<PendingRegistration>;
  deletePendingRegistration(email: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(schema.users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(schema.users)
      .set({ ...user, updatedAt: new Date() })
      .where(eq(schema.users.id, id))
      .returning();
    return updatedUser;
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await db.delete(schema.users).where(eq(schema.users.id, id));
    return result.rowCount > 0;
  }

  async getUsersByCompany(companyId: string): Promise<User[]> {
    return await db.select().from(schema.users).where(eq(schema.users.companyId, companyId));
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(schema.users);
  }

  // Company operations
  async getCompany(id: string): Promise<Company | undefined> {
    const [company] = await db.select().from(schema.companies).where(eq(schema.companies.id, id));
    return company;
  }

  async getCompanyByEmail(email: string): Promise<Company | undefined> {
    const [company] = await db.select().from(schema.companies).where(eq(schema.companies.email, email));
    return company;
  }

  async createCompany(insertCompany: InsertCompany): Promise<Company> {
    const [company] = await db.insert(schema.companies).values(insertCompany).returning();
    return company;
  }

  async updateCompany(id: string, company: Partial<InsertCompany>): Promise<Company | undefined> {
    const [updatedCompany] = await db
      .update(schema.companies)
      .set({ ...company, updatedAt: new Date() })
      .where(eq(schema.companies.id, id))
      .returning();
    return updatedCompany;
  }

  async deleteCompany(id: string): Promise<boolean> {
    const result = await db.delete(schema.companies).where(eq(schema.companies.id, id));
    return result.rowCount > 0;
  }

  async getAllCompanies(): Promise<Company[]> {
    return await db.select().from(schema.companies).where(eq(schema.companies.isActive, true));
  }

  // Product operations
  async getProduct(id: string): Promise<Product | undefined> {
    const [product] = await db.select().from(schema.products).where(eq(schema.products.id, id));
    return product;
  }

  async getProductBySku(sku: string): Promise<Product | undefined> {
    const [product] = await db.select().from(schema.products).where(eq(schema.products.sku, sku));
    return product;
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const [product] = await db.insert(schema.products).values(insertProduct).returning();
    return product;
  }

  async updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product | undefined> {
    const [updatedProduct] = await db
      .update(schema.products)
      .set({ ...product, updatedAt: new Date() })
      .where(eq(schema.products.id, id))
      .returning();
    return updatedProduct;
  }

  async deleteProduct(id: string): Promise<boolean> {
    const result = await db.delete(schema.products).where(eq(schema.products.id, id));
    return result.rowCount > 0;
  }

  async getProductsBySeller(sellerCompanyId: string): Promise<Product[]> {
    return await db
      .select()
      .from(schema.products)
      .where(and(eq(schema.products.sellerCompanyId, sellerCompanyId), eq(schema.products.isActive, true)));
  }

  async getAllProducts(): Promise<Product[]> {
    return await db.select().from(schema.products).where(eq(schema.products.isActive, true));
  }

  async searchProducts(query: string): Promise<Product[]> {
    return await db
      .select()
      .from(schema.products)
      .where(
        and(
          eq(schema.products.isActive, true),
          or(
            ilike(schema.products.name, `%${query}%`),
            ilike(schema.products.sku, `%${query}%`),
            ilike(schema.products.casNumber, `%${query}%`)
          )
        )
      );
  }

  // Order operations
  async getOrder(id: string): Promise<Order | undefined> {
    const [order] = await db.select().from(schema.orders).where(eq(schema.orders.id, id));
    return order;
  }

  async getOrderByNumber(orderNumber: string): Promise<Order | undefined> {
    const [order] = await db.select().from(schema.orders).where(eq(schema.orders.orderNumber, orderNumber));
    return order;
  }

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const orderData = {
      ...insertOrder,
      orderNumber: insertOrder.orderNumber || `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
    };
    const [order] = await db.insert(schema.orders).values(orderData).returning();
    return order;
  }

  async updateOrder(id: string, order: Partial<InsertOrder>): Promise<Order | undefined> {
    const [updatedOrder] = await db
      .update(schema.orders)
      .set({ ...order, updatedAt: new Date() })
      .where(eq(schema.orders.id, id))
      .returning();
    return updatedOrder;
  }

  async deleteOrder(id: string): Promise<boolean> {
    const result = await db.delete(schema.orders).where(eq(schema.orders.id, id));
    return result.rowCount > 0;
  }

  async getOrdersByBuyer(buyerCompanyId: string): Promise<Order[]> {
    return await db
      .select()
      .from(schema.orders)
      .where(eq(schema.orders.buyerCompanyId, buyerCompanyId))
      .orderBy(desc(schema.orders.createdAt));
  }

  async getOrdersBySeller(sellerCompanyId: string): Promise<Order[]> {
    return await db
      .select()
      .from(schema.orders)
      .where(eq(schema.orders.sellerCompanyId, sellerCompanyId))
      .orderBy(desc(schema.orders.createdAt));
  }

  async getOrdersByUser(userId: string): Promise<Order[]> {
    return await db
      .select()
      .from(schema.orders)
      .where(eq(schema.orders.createdBy, userId))
      .orderBy(desc(schema.orders.createdAt));
  }

  async getAllOrdersWithDetails(): Promise<(Order & { user: User | null })[]> {
    const rows = await db
      .select({
        order: schema.orders,
        user: schema.users
      })
      .from(schema.orders)
      .leftJoin(schema.users, eq(schema.orders.createdBy, schema.users.id))
      .orderBy(desc(schema.orders.createdAt));

    return rows.map((row: any) => ({
      ...row.order,
      user: row.user
    }));
  }

  // Order item operations
  async getOrderItems(orderId: string): Promise<OrderItem[]> {
    return await db.select().from(schema.orderItems).where(eq(schema.orderItems.orderId, orderId));
  }

  async createOrderItem(insertItem: InsertOrderItem): Promise<OrderItem> {
    const [item] = await db.insert(schema.orderItems).values(insertItem).returning();
    return item;
  }

  async updateOrderItem(id: string, item: Partial<InsertOrderItem>): Promise<OrderItem | undefined> {
    const [updatedItem] = await db
      .update(schema.orderItems)
      .set(item)
      .where(eq(schema.orderItems.id, id))
      .returning();
    return updatedItem;
  }

  async deleteOrderItem(id: string): Promise<boolean> {
    const result = await db.delete(schema.orderItems).where(eq(schema.orderItems.id, id));
    return result.rowCount > 0;
  }

  // Invoice operations
  async getInvoice(id: string): Promise<Invoice | undefined> {
    const [invoice] = await db.select().from(schema.invoices).where(eq(schema.invoices.id, id));
    return invoice;
  }

  async getInvoiceByNumber(invoiceNumber: string): Promise<Invoice | undefined> {
    const [invoice] = await db.select().from(schema.invoices).where(eq(schema.invoices.invoiceNumber, invoiceNumber));
    return invoice;
  }

  async createInvoice(insertInvoice: InsertInvoice): Promise<Invoice> {
    const invoiceData = {
      ...insertInvoice,
      invoiceNumber: insertInvoice.invoiceNumber || `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
    };
    const [invoice] = await db.insert(schema.invoices).values(invoiceData).returning();
    return invoice;
  }

  async updateInvoice(id: string, invoice: Partial<InsertInvoice>): Promise<Invoice | undefined> {
    const [updatedInvoice] = await db
      .update(schema.invoices)
      .set({ ...invoice, updatedAt: new Date() })
      .where(eq(schema.invoices.id, id))
      .returning();
    return updatedInvoice;
  }

  async deleteInvoice(id: string): Promise<boolean> {
    const result = await db.delete(schema.invoices).where(eq(schema.invoices.id, id));
    return result.rowCount > 0;
  }

  async getInvoicesByCompany(companyId: string): Promise<Invoice[]> {
    return await db
      .select()
      .from(schema.invoices)
      .where(
        or(
          eq(schema.invoices.issuerCompanyId, companyId),
          eq(schema.invoices.recipientCompanyId, companyId)
        )
      )
      .orderBy(desc(schema.invoices.createdAt));
  }

  async getInvoicesByOrder(orderId: string): Promise<Invoice[]> {
    return await db
      .select()
      .from(schema.invoices)
      .where(eq(schema.invoices.orderId, orderId))
      .orderBy(desc(schema.invoices.createdAt));
  }

  // Session operations
  async getSession(id: string): Promise<Session | undefined> {
    const [session] = await db.select().from(schema.sessions).where(eq(schema.sessions.id, id));
    return session;
  }

  async getSessionByToken(token: string): Promise<Session | undefined> {
    const [session] = await db.select().from(schema.sessions).where(eq(schema.sessions.token, token));
    return session;
  }

  async createSession(insertSession: InsertSession): Promise<Session> {
    const [session] = await db.insert(schema.sessions).values(insertSession).returning();
    return session;
  }

  async updateSession(id: string, session: Partial<InsertSession>): Promise<Session | undefined> {
    const [updatedSession] = await db
      .update(schema.sessions)
      .set(session)
      .where(eq(schema.sessions.id, id))
      .returning();
    return updatedSession;
  }

  async deleteSession(id: string): Promise<boolean> {
    const result = await db.delete(schema.sessions).where(eq(schema.sessions.id, id));
    return result.rowCount > 0;
  }

  async deleteExpiredSessions(): Promise<number> {
    const result = await db
      .delete(schema.sessions)
      .where(and(
        eq(schema.sessions.isActive, true),
        lt(schema.sessions.expiresAt, new Date())
      ));
    return result.rowCount || 0;
  }

  async getSessionsByUser(userId: string): Promise<any[]> {
    return await db
      .select()
      .from(schema.sessions)
      .where(eq(schema.sessions.userId, userId))
      .orderBy(desc(schema.sessions.createdAt));
  }

  // Inquiry operations
  async createInquiry(inquiry: InsertInquiry): Promise<Inquiry> {
    const [createdInquiry] = await db.insert(schema.inquiries).values(inquiry).returning();
    return createdInquiry;
  }

  async getInquiry(id: string): Promise<Inquiry | undefined> {
    const [inquiry] = await db.select().from(schema.inquiries).where(eq(schema.inquiries.id, id));
    return inquiry;
  }

  async updateInquiry(id: string, inquiry: Partial<InsertInquiry>): Promise<Inquiry | undefined> {
    const [updatedInquiry] = await db
      .update(schema.inquiries)
      .set({ ...inquiry, updatedAt: new Date() })
      .where(eq(schema.inquiries.id, id))
      .returning();
    return updatedInquiry;
  }

  async deleteInquiry(id: string): Promise<boolean> {
    const result = await db.delete(schema.inquiries).where(eq(schema.inquiries.id, id));
    return result.rowCount > 0;
  }

  async getInquiriesByAdmin(): Promise<Inquiry[]> {
    return await db
      .select()
      .from(schema.inquiries)
      .orderBy(desc(schema.inquiries.createdAt));
  }

  async getInquiriesBySeller(sellerCompanyId: string): Promise<Inquiry[]> {
    return await db
      .select()
      .from(schema.inquiries)
      .where(eq(schema.inquiries.sellerCompanyId, sellerCompanyId))
      .orderBy(desc(schema.inquiries.createdAt));
  }

  async getInquiriesByBuyer(buyerCompanyId: string): Promise<Inquiry[]> {
    return await db
      .select()
      .from(schema.inquiries)
      .where(eq(schema.inquiries.buyerCompanyId, buyerCompanyId))
      .orderBy(desc(schema.inquiries.createdAt));
  }

  async getInquiriesByProduct(productId: string): Promise<Inquiry[]> {
    return await db
      .select()
      .from(schema.inquiries)
      .where(eq(schema.inquiries.productId, productId))
      .orderBy(desc(schema.inquiries.createdAt));
  }

  async getInquiryStats(): Promise<{ total: number; pending: number; responded: number; closed: number }> {
    const allInquiries = await db.select().from(schema.inquiries);

    const stats = {
      total: allInquiries.length,
      pending: allInquiries.filter((i: Inquiry) => i.status === 'pending').length,
      responded: allInquiries.filter((i: Inquiry) => i.status === 'responded').length,
      closed: allInquiries.filter((i: Inquiry) => i.status === 'closed').length,
    };

    return stats;
  }

  // Content
  async getSiteContent(): Promise<Map<string, SiteContent>> {
    const allContent = await db.select().from(schema.siteContent);
    const map = new Map<string, SiteContent>();
    allContent.forEach((c: SiteContent) => map.set(c.key, c));
    return map;
  }

  async updateSiteContent(key: string, content: string): Promise<SiteContent> {
    // Check if exists
    const [existing] = await db
      .select()
      .from(schema.siteContent)
      .where(eq(schema.siteContent.key, key));

    if (existing) {
      const [updated] = await db
        .update(schema.siteContent)
        .set({
          draftContent: content,
          updatedAt: new Date(),
        })
        .where(eq(schema.siteContent.id, existing.id))
        .returning();
      return updated;
    } else {
      const [newItem] = await db
        .insert(schema.siteContent)
        .values({
          key,
          content: content, // Initial content
          draftContent: content,
          isPublished: false,
        })
        .returning();
      return newItem;
    }
  }

  async publishSiteContent(): Promise<void> {
    // Update all records where draft_content is not null
    await db.execute(sql`
      UPDATE site_content 
      SET content = draft_content, 
          is_published = true, 
          last_published_at = NOW(), 
          updated_at = NOW()
      WHERE draft_content IS NOT NULL
    `);
  }

  // Pending Registration operations
  async getPendingRegistration(email: string): Promise<PendingRegistration | undefined> {
    const [pending] = await db.select().from(schema.pendingRegistrations).where(eq(schema.pendingRegistrations.email, email));
    return pending;
  }

  async createPendingRegistration(pending: InsertPendingRegistration): Promise<PendingRegistration> {
    // Delete existing one if it exists to avoid conflict
    await db.delete(schema.pendingRegistrations).where(eq(schema.pendingRegistrations.email, pending.email));
    const [created] = await db.insert(schema.pendingRegistrations).values(pending).returning();
    return created;
  }

  async deletePendingRegistration(email: string): Promise<boolean> {
    const result = await db.delete(schema.pendingRegistrations).where(eq(schema.pendingRegistrations.email, email));
    return result.rowCount > 0;
  }
}

export const storage = new DatabaseStorage();
