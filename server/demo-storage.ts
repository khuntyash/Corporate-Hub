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
import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";

// Helper to restore Dates from JSON
function jsonDateReviver(key: string, value: any) {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
    return new Date(value);
  }
  return value;
}

// Demo in-memory storage for testing without database
// Users must register first before they can login
export class MemStorage {
  private users: Map<string, User>;
  private companies: Map<string, Company>;
  private products: Map<string, Product>;
  private orders: Map<string, Order>;
  private orderItems: Map<string, OrderItem[]>;
  private invoices: Map<string, Invoice>;
  private inquiries: Map<string, Inquiry>;
  private siteContent: Map<string, SiteContent>;
  private pendingRegistrations: Map<string, PendingRegistration>;
  private currentId = 1;
  private dataFile = path.join(process.cwd(), "server", "data", "storage.json");

  constructor() {
    this.users = new Map();
    this.companies = new Map();
    this.products = new Map();
    this.orders = new Map();
    this.orderItems = new Map();
    this.invoices = new Map();
    this.inquiries = new Map();
    this.siteContent = new Map();
    this.pendingRegistrations = new Map();
    this.load();
  }

  private save() {
    const data = {
      users: Array.from(this.users.entries()),
      companies: Array.from(this.companies.entries()),
      products: Array.from(this.products.entries()),
      orders: Array.from(this.orders.entries()),
      orderItems: Array.from(this.orderItems.entries()),
      invoices: Array.from(this.invoices.entries()),
      inquiries: Array.from(this.inquiries.entries()),
      siteContent: Array.from(this.siteContent.entries()),
      pendingRegistrations: Array.from(this.pendingRegistrations.entries()),
      currentId: this.currentId
    };
    try {
      // Ensure directory exists
      const dir = path.dirname(this.dataFile);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      // Use asynchronous non-blocking write to avoid locking the thread on a 15MB file!
      fs.promises.writeFile(this.dataFile, JSON.stringify(data, null, 2))
        .catch(err => console.error("Async save failed:", err));
    } catch (err) {
      console.error("Failed to stringify or prepare demo storage:", err);
    }
  }

  private load() {
    if (fs.existsSync(this.dataFile)) {
      try {
        const raw = fs.readFileSync(this.dataFile, "utf-8");
        const data = JSON.parse(raw, jsonDateReviver);
        this.users = new Map(data.users);
        this.companies = new Map(data.companies);
        this.products = new Map(data.products);
        this.orders = new Map(data.orders);
        this.orderItems = new Map(data.orderItems);
        this.invoices = new Map(data.invoices);
        this.inquiries = new Map(data.inquiries);
        this.siteContent = new Map(data.siteContent);
        this.pendingRegistrations = new Map(data.pendingRegistrations || []); // Handle case where it might not exist in old data
        this.currentId = data.currentId || 1;
        console.log(`Loaded demo data from ${this.dataFile}`);
      } catch (err) {
        console.error("Failed to load demo storage:", err);
        // Fallback to seed
        this.seedData();
        this.save();
      }
    } else {
      this.seedData();
      this.save();
    }
  }

  private seedData() {
    // Create default admin company
    const adminCompany: Company = {
      id: randomUUID(),
      name: "Corporate Hub Admin",
      email: "admin@corporatehub.com",
      taxId: null,
      type: "both",
      phone: null,
      address: null,
      city: null,
      state: null,
      country: null,
      postalCode: null,
      website: null,
      logo: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.companies.set(adminCompany.id, adminCompany);

    // Create admin user with company association
    const adminUser: User = {
      id: randomUUID(),
      username: "admin",
      email: "admin@corporatehub.com",
      password: "change me", // Plain text for demo - in production use bcrypt hash
      firstName: "Admin",
      lastName: "User",
      role: "admin",
      companyId: adminCompany.id,
      phone: null,
      avatar: null,
      isActive: true,
      lastLogin: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(adminUser.id, adminUser);

    // Create demo user and company
    const demoCompany: Company = {
      id: randomUUID(),
      name: "Demo Company",
      email: "demo@company.com",
      taxId: null,
      type: "both",
      phone: null,
      address: null,
      city: null,
      state: null,
      country: null,
      postalCode: null,
      website: null,
      logo: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.companies.set(demoCompany.id, demoCompany);

    // Create demo user
    const demoUser: User = {
      id: randomUUID(),
      username: "demo",
      email: "demo@company.com",
      password: "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi", // password: "password"
      firstName: "Demo",
      lastName: "User",
      role: "admin",
      companyId: demoCompany.id,
      phone: null,
      avatar: null,
      isActive: true,
      lastLogin: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(demoUser.id, demoUser);
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const user: User = {
      id: randomUUID(),
      username: insertUser.username,
      email: insertUser.email,
      password: insertUser.password,
      firstName: insertUser.firstName,
      lastName: insertUser.lastName,
      role: insertUser.role || "employee",
      companyId: insertUser.companyId || null,
      phone: insertUser.phone || null,
      avatar: null,
      isActive: true,
      lastLogin: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(user.id, user);
    this.save();
    return user;
  }

  async updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined> {
    const existingUser = this.users.get(id);
    if (!existingUser) return undefined;

    const updatedUser = { ...existingUser, ...user, updatedAt: new Date() };
    this.users.set(id, updatedUser);
    this.save();
    return updatedUser;
  }

  async deleteUser(id: string): Promise<boolean> {
    const deleted = this.users.delete(id);
    if (deleted) this.save();
    return deleted;
  }

  async getUsersByCompany(companyId: string): Promise<User[]> {
    return Array.from(this.users.values()).filter(user => user.companyId === companyId);
  }

  // Get all users (for admin)
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  // Company operations
  async getCompany(id: string): Promise<Company | undefined> {
    return this.companies.get(id);
  }

  async getCompanyByEmail(email: string): Promise<Company | undefined> {
    return Array.from(this.companies.values()).find(company => company.email === email);
  }

  async createCompany(insertCompany: InsertCompany): Promise<Company> {
    const company: Company = {
      id: randomUUID(),
      name: insertCompany.name,
      email: insertCompany.email,
      taxId: insertCompany.taxId || null,
      type: insertCompany.type || "both",
      phone: insertCompany.phone || null,
      address: insertCompany.address || null,
      city: insertCompany.city || null,
      state: insertCompany.state || null,
      country: insertCompany.country || null,
      postalCode: insertCompany.postalCode || null,
      website: insertCompany.website || null,
      logo: insertCompany.logo || null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.companies.set(company.id, company);
    this.save();
    return company;
  }

  async updateCompany(id: string, company: Partial<InsertCompany>): Promise<Company | undefined> {
    const existingCompany = this.companies.get(id);
    if (!existingCompany) return undefined;

    const updatedCompany = { ...existingCompany, ...company, updatedAt: new Date() };
    this.companies.set(id, updatedCompany);
    this.save();
    return updatedCompany;
  }

  async deleteCompany(id: string): Promise<boolean> {
    const deleted = this.companies.delete(id);
    if (deleted) this.save();
    return deleted;
  }

  async getAllCompanies(): Promise<Company[]> {
    return Array.from(this.companies.values()).filter(company => company.isActive);
  }

  // Product operations
  async getProduct(id: string): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async getProductBySku(sku: string): Promise<Product | undefined> {
    return Array.from(this.products.values()).find(product => product.sku === sku);
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const product: Product = {
      id: randomUUID(),
      name: insertProduct.name,
      description: insertProduct.description || null,
      sku: insertProduct.sku,
      category: insertProduct.category,
      subCategory: insertProduct.subCategory || null,
      price: insertProduct.price,
      cost: insertProduct.cost ?? null,
      stockQuantity: insertProduct.stockQuantity || 0,
      minStockLevel: insertProduct.minStockLevel || 0,
      images: insertProduct.images || [],
      properties: insertProduct.properties || null,
      casNumber: insertProduct.casNumber || null,
      synonyms: insertProduct.synonyms || null,
      molFormula: insertProduct.molFormula || null,
      molWeight: insertProduct.molWeight || null,
      hsnCode: insertProduct.hsnCode || null,
      packingType: insertProduct.packingType || null,
      gstTaxRate: insertProduct.gstTaxRate || null,
      productPackings: insertProduct.productPackings || null,
      sellerCompanyId: insertProduct.sellerCompanyId ?? null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.products.set(product.id, product);
    this.save();
    return product;
  }

  async updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product | undefined> {
    const existingProduct = this.products.get(id);
    if (!existingProduct) return undefined;

    const updatedProduct = { ...existingProduct, ...product, updatedAt: new Date() };
    this.products.set(id, updatedProduct);
    this.save();
    return updatedProduct;
  }

  async deleteProduct(id: string): Promise<boolean> {
    const deleted = this.products.delete(id);
    if (deleted) this.save();
    return deleted;
  }

  async getProductsBySeller(sellerCompanyId: string): Promise<Product[]> {
    return Array.from(this.products.values())
      .filter(product => product.sellerCompanyId === sellerCompanyId && product.isActive);
  }

  async getAllProducts(): Promise<Product[]> {
    return Array.from(this.products.values()).filter(product => product.isActive);
  }

  async searchProducts(query: string): Promise<Product[]> {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.products.values())
      .filter(product =>
        product.isActive &&
        (
          product.name.toLowerCase().includes(lowerQuery) ||
          (product.sku && product.sku.toLowerCase().includes(lowerQuery)) ||
          (product.casNumber && product.casNumber.toLowerCase().includes(lowerQuery)) ||
          (product.description && product.description.toLowerCase().includes(lowerQuery)) ||
          (product.subCategory && product.subCategory.toLowerCase().includes(lowerQuery))
        )
      );
  }

  // Order operations
  async getOrder(id: string): Promise<Order | undefined> {
    return this.orders.get(id);
  }

  async getOrderByNumber(orderNumber: string): Promise<Order | undefined> {
    return Array.from(this.orders.values()).find(order => order.orderNumber === orderNumber);
  }

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const order: Order = {
      id: randomUUID(),
      orderNumber: insertOrder.orderNumber || `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      buyerCompanyId: insertOrder.buyerCompanyId,
      sellerCompanyId: insertOrder.sellerCompanyId,
      status: insertOrder.status || "pending",
      paymentStatus: insertOrder.paymentStatus || "pending",
      subtotal: insertOrder.subtotal,
      taxAmount: insertOrder.taxAmount || "0",
      shippingAmount: insertOrder.shippingAmount || "0",
      totalAmount: insertOrder.totalAmount,
      currency: insertOrder.currency || "USD",
      shippingAddress: insertOrder.shippingAddress,
      billingAddress: insertOrder.billingAddress,
      notes: insertOrder.notes || null,
      estimatedDelivery: insertOrder.estimatedDelivery || null,
      actualDelivery: insertOrder.actualDelivery || null,
      createdBy: insertOrder.createdBy || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.orders.set(order.id, order);
    this.save();
    return order;
  }

  async updateOrder(id: string, order: Partial<InsertOrder>): Promise<Order | undefined> {
    const existingOrder = this.orders.get(id);
    if (!existingOrder) return undefined;

    const updatedOrder = { ...existingOrder, ...order, updatedAt: new Date() };
    this.orders.set(id, updatedOrder);
    this.save();
    return updatedOrder;
  }

  async deleteOrder(id: string): Promise<boolean> {
    this.orderItems.delete(id);
    const deleted = this.orders.delete(id);
    if (deleted) this.save();
    return deleted;
  }

  async getOrdersByBuyer(buyerCompanyId: string): Promise<Order[]> {
    return Array.from(this.orders.values())
      .filter(order => order.buyerCompanyId === buyerCompanyId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getOrdersBySeller(sellerCompanyId: string): Promise<Order[]> {
    return Array.from(this.orders.values())
      .filter(order => order.sellerCompanyId === sellerCompanyId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getOrdersByUser(userId: string): Promise<Order[]> {
    return Array.from(this.orders.values())
      .filter(order => order.createdBy === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getAllOrdersWithDetails(): Promise<(Order & { user: User | null })[]> {
    const orders = Array.from(this.orders.values());
    return orders
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map(order => {
        const user = this.users.get(order.createdBy || "") || null;
        return { ...order, user };
      });
  }

  // Order item operations
  async getOrderItems(orderId: string): Promise<OrderItem[]> {
    return this.orderItems.get(orderId) || [];
  }

  async createOrderItem(insertItem: InsertOrderItem): Promise<OrderItem> {
    const item: OrderItem = {
      id: randomUUID(),
      orderId: insertItem.orderId,
      productId: insertItem.productId,
      quantity: insertItem.quantity,
      unitPrice: insertItem.unitPrice,
      totalPrice: insertItem.totalPrice,
      createdAt: new Date(),
    };

    const existingItems = this.orderItems.get(insertItem.orderId) || [];
    existingItems.push(item);
    this.orderItems.set(insertItem.orderId, existingItems);
    this.save();

    return item;
  }

  async updateOrderItem(id: string, item: Partial<InsertOrderItem>): Promise<OrderItem | undefined> {
    for (const [orderId, items] of Array.from(this.orderItems.entries())) {
      const itemIndex = items.findIndex(i => i.id === id);
      if (itemIndex !== -1) {
        const updatedItem = { ...items[itemIndex], ...item };
        items[itemIndex] = updatedItem;
        this.orderItems.set(orderId, items);
        this.save();
        return updatedItem;
      }
    }
    return undefined;
  }

  async deleteOrderItem(id: string): Promise<boolean> {
    for (const [orderId, items] of Array.from(this.orderItems.entries())) {
      const itemIndex = items.findIndex(item => item.id === id);
      if (itemIndex !== -1) {
        items.splice(itemIndex, 1);
        this.orderItems.set(orderId, items);
        this.save();
        return true;
      }
    }
    return false;
  }

  // Invoice operations
  async getInvoice(id: string): Promise<Invoice | undefined> {
    return this.invoices.get(id);
  }

  async getInvoiceByNumber(invoiceNumber: string): Promise<Invoice | undefined> {
    return Array.from(this.invoices.values()).find(invoice => invoice.invoiceNumber === invoiceNumber);
  }

  async createInvoice(insertInvoice: InsertInvoice): Promise<Invoice> {
    const invoice: Invoice = {
      id: randomUUID(),
      invoiceNumber: insertInvoice.invoiceNumber || `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      orderId: insertInvoice.orderId,
      issuerCompanyId: insertInvoice.issuerCompanyId,
      recipientCompanyId: insertInvoice.recipientCompanyId,
      issueDate: insertInvoice.issueDate || new Date(),
      dueDate: insertInvoice.dueDate,
      subtotal: insertInvoice.subtotal,
      taxAmount: insertInvoice.taxAmount || "0",
      totalAmount: insertInvoice.totalAmount,
      currency: insertInvoice.currency || "USD",
      status: insertInvoice.status || "draft",
      notes: insertInvoice.notes || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.invoices.set(invoice.id, invoice);
    this.save();
    return invoice;
  }

  async updateInvoice(id: string, invoice: Partial<InsertInvoice>): Promise<Invoice | undefined> {
    const existingInvoice = this.invoices.get(id);
    if (!existingInvoice) return undefined;

    const updatedInvoice = { ...existingInvoice, ...invoice, updatedAt: new Date() };
    this.invoices.set(id, updatedInvoice);
    this.save();
    return updatedInvoice;
  }

  async deleteInvoice(id: string): Promise<boolean> {
    const deleted = this.invoices.delete(id);
    if (deleted) this.save();
    return deleted;
  }

  async getInvoicesByCompany(companyId: string): Promise<Invoice[]> {
    return Array.from(this.invoices.values())
      .filter(invoice =>
        invoice.issuerCompanyId === companyId || invoice.recipientCompanyId === companyId
      )
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getInvoicesByOrder(orderId: string): Promise<Invoice[]> {
    return Array.from(this.invoices.values())
      .filter(invoice => invoice.orderId === orderId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // Inquiry operations
  async createInquiry(inquiry: InsertInquiry): Promise<Inquiry> {
    const newInquiry: Inquiry = {
      ...inquiry,
      id: randomUUID(),
      status: "pending",
      priority: inquiry.priority || "medium",
      adminResponse: null,
      adminResponseDate: null,
      assignedTo: inquiry.assignedTo || null,
      isReadByAdmin: false,
      isReadBySeller: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      sellerCompanyId: inquiry.sellerCompanyId || null,
      buyerCompanyId: inquiry.buyerCompanyId || null,
      buyerPhone: inquiry.buyerPhone ?? null,
      buyerCompany: inquiry.buyerCompany ?? null,
      quantity: inquiry.quantity ?? null,
      budget: inquiry.budget ?? null,
      deliveryDate: inquiry.deliveryDate ?? null,
      additionalRequirements: inquiry.additionalRequirements || null,
    };
    this.inquiries.set(newInquiry.id, newInquiry);
    this.save();
    return newInquiry;
  }

  async getInquiry(id: string): Promise<Inquiry | undefined> {
    return this.inquiries.get(id);
  }

  async updateInquiry(id: string, inquiry: Partial<InsertInquiry>): Promise<Inquiry | undefined> {
    const existingInquiry = this.inquiries.get(id);
    if (!existingInquiry) return undefined;

    const updatedInquiry = { ...existingInquiry, ...inquiry, updatedAt: new Date() };
    this.inquiries.set(id, updatedInquiry);
    this.save();
    return updatedInquiry;
  }

  async deleteInquiry(id: string): Promise<boolean> {
    const deleted = this.inquiries.delete(id);
    if (deleted) this.save();
    return deleted;
  }

  async getInquiriesByAdmin(): Promise<Inquiry[]> {
    return Array.from(this.inquiries.values())
      .sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0));
  }

  async getInquiriesBySeller(sellerCompanyId: string): Promise<Inquiry[]> {
    return Array.from(this.inquiries.values())
      .filter(inquiry => inquiry.sellerCompanyId === sellerCompanyId)
      .sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0));
  }

  async getInquiriesByBuyer(buyerCompanyId: string): Promise<Inquiry[]> {
    return Array.from(this.inquiries.values())
      .filter(inquiry => inquiry.buyerCompanyId === buyerCompanyId)
      .sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0));
  }

  async getInquiriesByProduct(productId: string): Promise<Inquiry[]> {
    return Array.from(this.inquiries.values())
      .filter(inquiry => inquiry.productId === productId)
      .sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0));
  }

  async getInquiryStats(): Promise<{ total: number; pending: number; responded: number; closed: number }> {
    const allInquiries = Array.from(this.inquiries.values());

    const stats = {
      total: allInquiries.length,
      pending: allInquiries.filter((i: Inquiry) => i.status === 'pending').length,
      responded: allInquiries.filter((i: Inquiry) => i.status === 'responded').length,
      closed: allInquiries.filter((i: Inquiry) => i.status === 'closed').length,
    };

    return stats;
  }

  // Session operations (simplified for demo)
  async getSession(id: string): Promise<unknown> {
    return undefined;
  }

  async getSessionByToken(token: string): Promise<unknown> {
    return undefined;
  }

  async createSession(session: unknown): Promise<unknown> {
    return session;
  }

  async updateSession(id: string, session: unknown): Promise<unknown> {
    return session;
  }

  async deleteSession(id: string): Promise<boolean> {
    return true;
  }

  async deleteExpiredSessions(): Promise<number> {
    return 0;
  }

  async getSessionsByUser(userId: string): Promise<unknown[]> {
    return [];
  }

  // Content
  async getSiteContent(): Promise<Map<string, SiteContent>> {
    const map = new Map<string, SiteContent>();
    for (const item of Array.from(this.siteContent.values())) {
      map.set(item.key, item);
    }
    return map;
  }

  async updateSiteContent(key: string, content: string): Promise<SiteContent> {
    const existing = Array.from(this.siteContent.values()).find(c => c.key === key);

    if (existing) {
      const updated: SiteContent = {
        ...existing,
        draftContent: content,
        updatedAt: new Date(),
      };
      this.siteContent.set(existing.id, updated);
      this.save();
      return updated;
    } else {
      const id = String(this.currentId++);
      const newContent: SiteContent = {
        id,
        key,
        content: content, // Initial content is same as draft
        draftContent: content,
        isPublished: false,
        lastPublishedAt: null,
        updatedAt: new Date(),
      };
      this.siteContent.set(id, newContent);
      this.save();
      return newContent;
    }
  }

  async publishSiteContent(): Promise<void> {
    let changed = false;
    for (const [id, content] of Array.from(this.siteContent.entries())) {
      if (content.draftContent) {
        const updated: SiteContent = {
          ...content,
          content: content.draftContent,
          isPublished: true,
          lastPublishedAt: new Date(),
          updatedAt: new Date(),
        };
        this.siteContent.set(id, updated);
        changed = true;
      }
    }
    if (changed) this.save();
  }

  // Pending Registration operations
  async getPendingRegistration(email: string): Promise<PendingRegistration | undefined> {
    return this.pendingRegistrations.get(email);
  }

  async createPendingRegistration(pending: InsertPendingRegistration): Promise<PendingRegistration> {
    const newPending: PendingRegistration = {
      ...pending,
      createdAt: new Date(),
    };
    this.pendingRegistrations.set(pending.email, newPending);
    this.save(); // Save after creating
    return newPending;
  }

  async deletePendingRegistration(email: string): Promise<boolean> {
    const deleted = this.pendingRegistrations.delete(email);
    if (deleted) this.save(); // Save after deleting
    return deleted;
  }
}

export const demoStorage = new MemStorage();
