import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage-factory";
import { upload } from "./upload";
import { z } from "zod";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { insertInquirySchema } from "@shared/schema";
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
  InsertInquiry
} from "@shared/schema";
import { sendInquiryEmails, sendOrderEmails, sendOTPEmail } from "./email-service";
import crypto from "crypto";

// In-memory store for pending registrations removed in favor of storage

// Authentication middleware
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: "Access token required" });
  }

  jwt.verify(token, process.env.JWT_SECRET!, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ message: "Invalid token" });
    }
    req.user = user;
    next();
  });
};

// Helper function to generate order number
const generateOrderNumber = () => {
  return `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
};

const generateInvoiceNumber = () => {
  return `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
};

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {


  // Authentication middleware
  const requireAdmin = (req: any, res: any, next: any) => {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }
    next();
  };

  // File upload route
  app.post("/api/upload", upload.single('file'), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({ url: fileUrl });
  });

  // Image proxy — fetches external product structure images server-side to bypass hotlink protection
  app.get("/api/img-proxy", async (req, res) => {
    const url = req.query.url as string;
    if (!url || !url.startsWith("https://www.ottokemi.com/")) {
      return res.status(400).send("Invalid URL");
    }
    try {
      const { default: axios } = await import("axios");
      const response = await axios.get(url, {
        responseType: "arraybuffer",
        timeout: 8000,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "Referer": "https://www.ottokemi.com/",
          "Accept": "image/png,image/jpeg,image/*,*/*"
        }
      });
      const contentType = response.headers["content-type"] || "image/png";
      res.set("Content-Type", contentType);
      res.set("Cache-Control", "public, max-age=86400"); // cache for 24h
      res.send(response.data);
    } catch {
      // Return 404 so browser triggers onError → fallback image
      res.status(404).send("Image not found");
    }
  });

  // Authentication routes

  // Step 1: Initiate registration and send OTP
  app.post("/api/auth/register/initiate", async (req, res) => {
    try {
      const registerSchema = z.object({
        email: z.string().email(),
        password: z.string().min(6),
        firstName: z.string().min(1),
        lastName: z.string().min(1),
        phone: z.string().optional(),
      });

      const data = registerSchema.parse(req.body);

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(data.email);
      if (existingUser) {
        return res.status(400).json({ message: "An account with this email already exists" });
      }

      // Generate a 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();

      // Hash password prematurely to store securely even in memory
      const hashedPassword = await bcrypt.hash(data.password, 10);

      const userData: InsertUser = {
        username: data.email.split('@')[0],
        email: data.email,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone || "",
        role: "employee",
        companyId: null,
      };

      // Store in database/storage
      await storage.createPendingRegistration({
        email: data.email,
        userData,
        otp,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      });

      // Send the OTP email with a 3-second timeout so it doesn't block registration if SMTP fails
      try {
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('SMTP timeout')), 3000);
        });
        await Promise.race([sendOTPEmail(data.email, otp), timeoutPromise]);
      } catch (emailError) {
        console.warn("Could not send OTP email (SMTP might be unconfigured). OTP is:", otp);
        // We still return 200 below because we saved the OTP to the DB successfully.
      }

      res.status(200).json({ message: "OTP sent successfully to email" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      console.error("Initiate registration error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Step 2: Verify OTP and create account
  app.post("/api/auth/register/verify", async (req, res) => {
    try {
      const verifySchema = z.object({
        email: z.string().email(),
        otp: z.string().length(6),
      });

      const { email, otp } = verifySchema.parse(req.body);

      const pendingRegistration = await storage.getPendingRegistration(email);

      if (!pendingRegistration) {
        return res.status(400).json({ message: "No pending registration found or it has expired. Please try registering again." });
      }

      if (new Date() > new Date(pendingRegistration.expiresAt)) {
        await storage.deletePendingRegistration(email);
        return res.status(400).json({ message: "OTP has expired. Please request a new one." });
      }

      if (pendingRegistration.otp !== otp) {
        return res.status(400).json({ message: "Invalid verification code." });
      }

      // Check one last time if user exists just in case
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        await storage.deletePendingRegistration(email);
        return res.status(400).json({ message: "Account already exists." });
      }

      // Create user
      const user = await storage.createUser(pendingRegistration.userData as InsertUser);

      // Clear pending registration
      await storage.deletePendingRegistration(email);

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, companyId: null, role: user.role },
        process.env.JWT_SECRET!,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as jwt.SignOptions
      );

      res.status(201).json({
        message: "Account created successfully",
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      console.error("Verify registration error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Verify session endpoint
  app.get("/api/auth/verify", authenticateToken, (req, res) => {
    res.json({ user: req.user });
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "Email/username and password are required" });
      }

      // Find user by email or username
      let user = await storage.getUserByEmail(email);
      if (!user) {
        user = await storage.getUserByUsername(email);
      }

      if (!user) {
        return res.status(401).json({
          message: "Account does not exist. Please create an account.",
          code: "USER_NOT_FOUND"
        });
      }

      // Check password
      // For demo mode: compare plain text (demo admin uses "change me")
      // For production: use bcrypt.compare
      let validPassword = false;
      if (user.password.startsWith('$2')) {
        validPassword = await bcrypt.compare(password, user.password);
      } else {
        // Demo mode - plain text comparison
        validPassword = password === user.password;
      }

      if (!validPassword) {
        return res.status(401).json({
          message: "Invalid email/username or password. Please check your credentials or create an account.",
          code: "INVALID_PASSWORD"
        });
      }

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, companyId: user.companyId, role: user.role },
        process.env.JWT_SECRET!,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as jwt.SignOptions
      );

      // Update last login
      await storage.updateUser(user.id, { lastLogin: new Date() });

      res.json({
        message: "Login successful",
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      console.error("Login error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });



  // Inquiry routes
  app.post("/api/inquiries", async (req, res) => {
    try {
      const data = insertInquirySchema.parse(req.body);
      const inquiry = await storage.createInquiry(data);

      // Send email notifications asynchronously
      sendInquiryEmails(inquiry).catch(err => {
        console.error("Failed to send inquiry emails in background:", err);
      });

      res.status(201).json(inquiry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      console.error("Create inquiry error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get all inquiries (admin only)
  app.get("/api/admin/inquiries", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const inquiries = await storage.getInquiriesByAdmin();
      res.json(inquiries);
    } catch (error) {
      console.error("Get inquiries error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Company routes

  // Get public company directory (for Team page)
  // MUST COME BEFORE /api/companies/:id or similar dynamic routes
  app.get("/api/companies/directory", async (req, res) => {
    try {
      const companies = await storage.getAllCompanies?.() || [];
      const activeCompanies = companies.filter((c: any) => c.isActive);

      const publicData = activeCompanies.map((c: any) => ({
        id: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        city: c.city,
        country: c.country,
        logo: c.logo,
        type: c.type,
        website: c.website
      }));

      res.json(publicData);
    } catch (error) {
      console.error("Get company directory error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/companies", authenticateToken, async (req, res) => {
    try {
      const companies = await storage.getAllCompanies();
      res.json(companies);
    } catch (error) {
      console.error("Get companies error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/companies/:id", authenticateToken, async (req, res) => {
    try {
      const company = await storage.getCompany(req.params.id);
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }
      res.json(company);
    } catch (error) {
      console.error("Get company error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Product routes
  app.get("/api/products", async (req, res) => {
    try {
      const { search, category, seller, includeInactive } = req.query;
      let products: Product[] = [];

      console.log("[API] GET /api/products - fetching all products");

      // Fetch all products (including inactive if requested) - don't filter by status here
      // The frontend should handle displaying based on status
      if (search) {
        products = await storage.searchProducts(search as string);
      } else if (seller) {
        products = await storage.getProductsBySeller(seller as string);
      } else {
        // Get all products including inactive ones so admin can see them
        products = await storage.getAllProducts();
      }

      console.log("[API] GET /api/products - found", products.length, "products");

      // Filter by category if provided
      if (category) {
        products = products.filter(p => p.category === category);
      }

      // Enrich products with seller/owner information
      const enrichedProducts = await Promise.all(
        products.map(async (product) => {
          let sellerCompany = null;
          if (product.sellerCompanyId) {
            sellerCompany = await storage.getCompany(product.sellerCompanyId);
          }
          return {
            ...product,
            seller: sellerCompany ? {
              id: sellerCompany.id,
              name: sellerCompany.name,
              email: sellerCompany.email,
              type: sellerCompany.type,
            } : null,
          };
        })
      );

      // Log the enriched products for debugging
      console.log("[API] GET /api/products - returning enriched products:", enrichedProducts.map(p => ({
        id: p.id,
        name: p.name,
        category: p.category,
        seller: p.seller?.name || 'Unknown',
        sellerCompany: p.seller?.name || 'Unknown',
        isActive: p.isActive,
        stockQuantity: p.stockQuantity
      })));

      res.json(enrichedProducts);
    } catch (error) {
      console.error("Get products error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      const product = await storage.getProduct(req.params.id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      // Enrich product with seller/owner information
      let sellerCompany = null;
      if (product.sellerCompanyId) {
        sellerCompany = await storage.getCompany(product.sellerCompanyId);
      }
      const enrichedProduct = {
        ...product,
        seller: sellerCompany ? {
          id: sellerCompany.id,
          name: sellerCompany.name,
          email: sellerCompany.email,
          type: sellerCompany.type,
        } : null,
      };

      console.log("[API] GET /api/products/:id - returning enriched product:", {
        id: enrichedProduct.id,
        name: enrichedProduct.name,
        category: enrichedProduct.category,
        seller: enrichedProduct.seller?.name,
        sellerCompany: enrichedProduct.seller?.name,
        isActive: enrichedProduct.isActive,
        stockQuantity: enrichedProduct.stockQuantity
      });

      res.json(enrichedProduct);
    } catch (error) {
      console.error("Get product error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/products", authenticateToken, async (req, res) => {
    try {
      const productSchema = z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        sku: z.string().min(1),
        category: z.string().min(1),
        subCategory: z.string().optional(),
        price: z.string().transform(Number),
        cost: z.string().transform(Number).optional(),
        stockQuantity: z.number().default(0),
        minStockLevel: z.number().default(0),
        images: z.array(z.string()).optional(),
        properties: z.string().optional(),
      });

      const data = productSchema.parse(req.body);

      // Check if SKU already exists
      const existingProduct = await storage.getProductBySku(data.sku);
      if (existingProduct) {
        return res.status(400).json({ message: "SKU already exists" });
      }

      const productData: InsertProduct = {
        ...data,
        sellerCompanyId: req.user!.companyId,
        price: data.price.toString(),
        cost: data.cost?.toString(),
      };

      const product = await storage.createProduct(productData);

      // Enrich created product with seller information
      let sellerCompany = null;
      if (product.sellerCompanyId) {
        sellerCompany = await storage.getCompany(product.sellerCompanyId);
      }
      const enrichedProduct = {
        ...product,
        seller: sellerCompany ? {
          id: sellerCompany.id,
          name: sellerCompany.name,
          email: sellerCompany.email,
          type: sellerCompany.type,
        } : null,
      };

      console.log("[API] POST /api/products - created enriched product:", {
        id: enrichedProduct.id,
        name: enrichedProduct.name,
        category: enrichedProduct.category,
        seller: enrichedProduct.seller?.name,
        sellerCompany: enrichedProduct.seller?.name,
        isActive: enrichedProduct.isActive,
        stockQuantity: enrichedProduct.stockQuantity
      });

      res.status(201).json(enrichedProduct);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      console.error("Create product error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Admin Order route
  app.get("/api/admin/orders", authenticateToken, async (req, res) => {
    if (req.user!.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }
    try {
      const orders = await storage.getAllOrdersWithDetails();
      res.json(orders);
    } catch (error) {
      console.error("Get admin orders error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Order routes
  app.get("/api/orders", authenticateToken, async (req, res) => {
    try {
      const { type } = req.query;
      let orders: Order[] = [];

      // if user has no companyId (B2C user), only show their own orders
      if (!req.user!.companyId) {
        orders = await storage.getOrdersByUser(req.user!.userId);
      } else {
        if (type === "buyer") {
          orders = await storage.getOrdersByBuyer(req.user!.companyId);
        } else if (type === "seller") {
          orders = await storage.getOrdersBySeller(req.user!.companyId);
        } else {
          // Get both buyer and seller orders
          const buyerOrders = await storage.getOrdersByBuyer(req.user!.companyId);
          const sellerOrders = await storage.getOrdersBySeller(req.user!.companyId);
          // deduplicate if needed, but IDs are unique so it's fine to just concat for now?
          // actually a company could be both buyer and seller on same order? unlikely but possible
          // simpler to just concat
          orders = [...buyerOrders, ...sellerOrders];

          // Deduplicate based on ID just in case
          const uniqueOrders = new Map();
          orders.forEach(o => uniqueOrders.set(o.id, o));
          orders = Array.from(uniqueOrders.values());

          // Re-sort
          orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }
      }

      res.json(orders);
    } catch (error) {
      console.error("Get orders error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/orders/:id", authenticateToken, async (req, res) => {
    try {
      const order = await storage.getOrder(req.params.id);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Check if user has access to this order
      if (order.buyerCompanyId !== req.user!.companyId && order.sellerCompanyId !== req.user!.companyId) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Get order items
      const orderItems = await storage.getOrderItems(order.id);

      res.json({ ...order, items: orderItems });
    } catch (error) {
      console.error("Get order error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/orders", authenticateToken, async (req, res) => {
    try {
      const orderSchema = z.object({
        sellerCompanyId: z.string(),
        items: z.array(z.object({
          productId: z.string(),
          quantity: z.number().min(1),
          unitPrice: z.string().transform(Number),
        })),
        shippingAddress: z.string(),
        billingAddress: z.string(),
        notes: z.string().optional(),
      });

      const data = orderSchema.parse(req.body);

      // Calculate totals
      const subtotal = data.items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
      const taxAmount = subtotal * 0.1; // 10% tax
      const shippingAmount = 10; // Fixed shipping
      const totalAmount = subtotal + taxAmount + shippingAmount;

      // Create order
      const orderData: InsertOrder = {
        orderNumber: generateOrderNumber(),
        buyerCompanyId: req.user!.companyId,
        sellerCompanyId: data.sellerCompanyId,
        subtotal: subtotal.toString(),
        taxAmount: taxAmount.toString(),
        shippingAmount: shippingAmount.toString(),
        totalAmount: totalAmount.toString(),
        shippingAddress: data.shippingAddress,
        billingAddress: data.billingAddress,
        notes: data.notes,
        createdBy: req.user!.userId,
      };

      const order = await storage.createOrder(orderData);

      // Create order items
      for (const item of data.items) {
        const orderItemData: InsertOrderItem = {
          orderId: order.id,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice.toString(),
          totalPrice: (item.unitPrice * item.quantity).toString(),
        };
        await storage.createOrderItem(orderItemData);
      }

      // Fetch user details to send order emails asynchronously
      storage.getUser(req.user!.userId).then(user => {
        if (user) {
          const userName = `${user.firstName} ${user.lastName}`.trim();
          sendOrderEmails(order, user.email, userName).catch(err => {
            console.error("Failed to send order emails in background:", err);
          });
        }
      }).catch(err => console.error("Could not fetch user for order emails:", err));

      res.status(201).json(order);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      console.error("Create order error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Invoice routes
  app.get("/api/invoices", authenticateToken, async (req, res) => {
    try {
      const invoices = await storage.getInvoicesByCompany(req.user!.companyId);
      res.json(invoices);
    } catch (error) {
      console.error("Get invoices error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/invoices/:id", authenticateToken, async (req, res) => {
    try {
      const invoice = await storage.getInvoice(req.params.id);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }

      // Check if user has access to this invoice
      if (invoice.issuerCompanyId !== req.user!.companyId && invoice.recipientCompanyId !== req.user!.companyId) {
        return res.status(403).json({ message: "Access denied" });
      }

      res.json(invoice);
    } catch (error) {
      console.error("Get invoice error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/invoices", authenticateToken, async (req, res) => {
    try {
      const invoiceSchema = z.object({
        orderId: z.string(),
        recipientCompanyId: z.string(),
        dueDate: z.string().transform(date => new Date(date)),
        notes: z.string().optional(),
      });

      const data = invoiceSchema.parse(req.body);

      // Get order details
      const order = await storage.getOrder(data.orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Check if user can create invoice for this order
      if (order.sellerCompanyId !== req.user!.companyId) {
        return res.status(403).json({ message: "Only seller can create invoice" });
      }

      const invoiceData: InsertInvoice = {
        invoiceNumber: generateInvoiceNumber(),
        orderId: data.orderId,
        issuerCompanyId: req.user!.companyId,
        recipientCompanyId: data.recipientCompanyId,
        dueDate: data.dueDate,
        subtotal: order.subtotal,
        taxAmount: order.taxAmount,
        totalAmount: order.totalAmount,
        currency: order.currency,
        notes: data.notes,
      };

      const invoice = await storage.createInvoice(invoiceData);
      res.status(201).json(invoice);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      console.error("Create invoice error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ==================== ADMIN ROUTES ====================



  // Get all users (admin only)
  app.get("/api/admin/users", authenticateToken, requireAdmin, async (req, res) => {
    try {
      // For demo storage, we need a way to get all users
      // Using a simple approach - in production, add method to storage
      const allUsers = await storage.getAllUsers?.() || [];
      res.json(allUsers);
    } catch (error) {
      console.error("Get all users error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });



  // Approve user (admin only)
  app.post("/api/admin/users/:id/approve", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      await storage.updateUser(req.params.id, { isActive: true } as any);
      res.json({ message: "User approved" });
    } catch (error) {
      console.error("Approve user error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Deactivate user (admin only)
  app.post("/api/admin/users/:id/deactivate", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      await storage.updateUser(req.params.id, { isActive: false } as any);
      res.json({ message: "User deactivated" });
    } catch (error) {
      console.error("Deactivate user error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Delete user (admin only)
  app.delete("/api/admin/users/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const deleted = await storage.deleteUser(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ message: "User deleted" });
    } catch (error) {
      console.error("Delete user error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Update user role (admin only)
  app.put("/api/admin/users/:id/role", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const schema = z.object({
        role: z.enum(["admin", "manager", "employee"]),
      });

      const { role } = schema.parse(req.body);

      const user = await storage.updateUser(req.params.id, { role } as any);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      console.error("Update user role error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Delete product (admin only)
  app.delete("/api/admin/products/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const deleted = await storage.deleteProduct(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json({ message: "Product deleted" });
    } catch (error) {
      console.error("Delete product error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Update product (admin only)
  app.put("/api/admin/products/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const productSchema = z.object({
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        sku: z.string().min(1).optional(),
        category: z.string().min(1).optional(),
        subCategory: z.string().optional(),
        price: z.string().transform(Number).optional(),
        cost: z.string().transform(Number).optional(),
        stockQuantity: z.number().optional(),
        minStockLevel: z.number().optional(),
        images: z.array(z.string()).optional(),
        properties: z.string().optional(),
        isActive: z.boolean().optional(),
      });

      const data = productSchema.parse(req.body);

      // Check if SKU already exists (if changing SKU)
      if (data.sku) {
        const existingProduct = await storage.getProductBySku(data.sku);
        if (existingProduct && existingProduct.id !== req.params.id) {
          return res.status(400).json({ message: "SKU already exists" });
        }
      }

      const updateData: any = { ...data };
      if (data.price) {
        updateData.price = data.price.toString();
      }
      if (data.cost) {
        updateData.cost = data.cost.toString();
      }

      const product = await storage.updateProduct(req.params.id, updateData);

      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      res.json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      console.error("Update product error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Create product (admin only) - doesn't require company association
  app.post("/api/admin/products", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const productSchema = z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        sku: z.string().min(1),
        category: z.string().min(1),
        subCategory: z.string().optional(),
        price: z.string().transform(Number),
        cost: z.string().transform(Number).optional(),
        stockQuantity: z.number().default(0),
        minStockLevel: z.number().default(0),
        images: z.array(z.string()).optional(),
        properties: z.string().optional(),
      });

      const data = productSchema.parse(req.body);

      console.log("[API] POST /api/admin/products - creating product:", data.name, "SKU:", data.sku);

      // Check if SKU already exists
      const existingProduct = await storage.getProductBySku(data.sku);
      if (existingProduct) {
        console.log("[API] POST /api/admin/products - SKU already exists:", data.sku);
        return res.status(400).json({ message: "SKU already exists" });
      }

      const productData: InsertProduct = {
        name: data.name,
        sku: data.sku,
        category: data.category,
        subCategory: data.subCategory,
        price: data.price.toString(),
        cost: data.cost?.toString(),
        sellerCompanyId: null, // Admin-created products don't have a company
        stockQuantity: data.stockQuantity ?? 0,
        minStockLevel: data.minStockLevel ?? 0,
        images: data.images,
        description: data.description,
        properties: data.properties,
      };

      console.log("[API] POST /api/admin/products - saving to storage");
      const product = await storage.createProduct(productData);
      console.log("[API] POST /api/admin/products - product created with ID:", product.id);

      res.status(201).json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      console.error("Create product error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Update order status (admin only)
  app.put("/api/admin/orders/:id/status", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const { status } = req.body;
      const order = await storage.getOrder(req.params.id);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      await storage.updateOrder(req.params.id, { status });
      res.json({ message: "Order status updated" });
    } catch (error) {
      console.error("Update order status error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Delete order (admin only)
  app.delete("/api/admin/orders/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const deleted = await storage.deleteOrder(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Order not found" });
      }
      res.json({ message: "Order deleted" });
    } catch (error) {
      console.error("Delete order error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });



  // Get all companies (owners) - admin only
  app.get("/api/admin/companies", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const companies = await storage.getAllCompanies();
      res.json(companies);
    } catch (error) {
      console.error("Get companies error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Create company (owner) - admin only
  app.post("/api/admin/companies", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const companySchema = z.object({
        name: z.string().min(1),
        taxId: z.string().optional(),
        type: z.enum(["buyer", "seller", "both"]).default("both"),
        email: z.string().email(),
        phone: z.string().optional(),
        address: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        country: z.string().optional(),
        postalCode: z.string().optional(),
        website: z.string().optional(),
        logo: z.string().optional(),
      });

      const data = companySchema.parse(req.body);

      // Check if email already exists
      const existingCompany = await storage.getCompanyByEmail(data.email);
      if (existingCompany) {
        return res.status(400).json({ message: "A company with this email already exists" });
      }

      const companyData: InsertCompany = {
        name: data.name,
        taxId: data.taxId || undefined,
        type: data.type,
        email: data.email,
        phone: data.phone || null,
        address: data.address || null,
        city: data.city || null,
        state: data.state || null,
        country: data.country || null,
        postalCode: data.postalCode || null,
        website: data.website || null,
        logo: data.logo || null,
      };

      const company = await storage.createCompany(companyData);
      res.status(201).json(company);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      console.error("Create company error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Update company - admin only
  app.put("/api/admin/companies/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const companySchema = z.object({
        name: z.string().min(1).optional(),
        taxId: z.string().optional(),
        type: z.enum(["buyer", "seller", "both"]).optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        country: z.string().optional(),
        postalCode: z.string().optional(),
        website: z.string().optional(),
        logo: z.string().optional(),
        isActive: z.boolean().optional(),
      });

      const data = companySchema.parse(req.body);
      const company = await storage.updateCompany(req.params.id, data);

      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }

      res.json(company);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      console.error("Update company error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Delete company - admin only
  app.delete("/api/admin/companies/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const deleted = await storage.deleteCompany(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Company not found" });
      }
      res.json({ message: "Company deleted" });
    } catch (error) {
      console.error("Delete company error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ==================== INQUIRY ROUTES ====================

  // Create inquiry (public - no authentication required)
  app.post("/api/inquiries", async (req, res) => {
    try {
      const inquirySchema = z.object({
        productId: z.string().uuid(),
        productName: z.string().min(1),
        sellerCompanyId: z.string().uuid(),
        buyerCompanyId: z.string().uuid().optional(),
        buyerName: z.string().min(1),
        buyerEmail: z.string().email(),
        buyerPhone: z.string().optional(),
        buyerCompany: z.string().optional(),
        subject: z.string().min(1),
        message: z.string().min(10),
        quantity: z.string().optional(),
        budget: z.string().optional(),
        deliveryDate: z.string().optional(),
        additionalRequirements: z.string().optional(),
        priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
      });

      const data = inquirySchema.parse(req.body);

      // Verify product exists
      const product = await storage.getProduct(data.productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      // Verify seller company exists
      const sellerCompany = await storage.getCompany(data.sellerCompanyId);
      if (!sellerCompany) {
        return res.status(404).json({ message: "Seller company not found" });
      }

      const inquiryData: InsertInquiry = {
        ...data,
        status: "pending",
        priority: data.priority || "medium",
      };

      const inquiry = await storage.createInquiry(inquiryData);
      res.status(201).json(inquiry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      console.error("Create inquiry error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get inquiry by ID (public)
  app.get("/api/inquiries/:id", async (req, res) => {
    try {
      const inquiry = await storage.getInquiry(req.params.id);
      if (!inquiry) {
        return res.status(404).json({ message: "Inquiry not found" });
      }
      res.json(inquiry);
    } catch (error) {
      console.error("Get inquiry error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get inquiries for admin (admin only)
  app.get("/api/admin/inquiries", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const inquiries = await storage.getInquiriesByAdmin();
      res.json(inquiries);
    } catch (error) {
      console.error("Get admin inquiries error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get inquiries for seller (authenticated)
  app.get("/api/seller/inquiries", authenticateToken, async (req, res) => {
    try {
      const inquiries = await storage.getInquiriesBySeller(req.user!.companyId);
      res.json(inquiries);
    } catch (error) {
      console.error("Get seller inquiries error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get inquiries for buyer (authenticated)
  app.get("/api/buyer/inquiries", authenticateToken, async (req, res) => {
    try {
      const inquiries = await storage.getInquiriesByBuyer(req.user!.companyId);
      res.json(inquiries);
    } catch (error) {
      console.error("Get buyer inquiries error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get inquiries for product (public)
  app.get("/api/products/:productId/inquiries", async (req, res) => {
    try {
      const inquiries = await storage.getInquiriesByProduct(req.params.productId);
      res.json(inquiries);
    } catch (error) {
      console.error("Get product inquiries error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Update inquiry (admin only)
  app.put("/api/admin/inquiries/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const updateSchema = z.object({
        status: z.enum(["pending", "in_progress", "responded", "closed", "cancelled"]).optional(),
        adminResponse: z.string().optional(),
        assignedTo: z.string().uuid().optional(),
        isReadByAdmin: z.boolean().optional(),
        isReadBySeller: z.boolean().optional(),
      });

      const data = updateSchema.parse(req.body);
      const inquiry = await storage.updateInquiry(req.params.id, {
        ...data,
        adminResponseDate: data.adminResponse ? new Date() : undefined,
      });

      if (!inquiry) {
        return res.status(404).json({ message: "Inquiry not found" });
      }

      res.json(inquiry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      console.error("Update inquiry error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Delete inquiry (admin only)
  app.delete("/api/admin/inquiries/:id", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const deleted = await storage.deleteInquiry(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Inquiry not found" });
      }
      res.json({ message: "Inquiry deleted" });
    } catch (error) {
      console.error("Delete inquiry error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get inquiry statistics (admin only)
  app.get("/api/admin/inquiries/stats", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const stats = await storage.getInquiryStats();
      res.json(stats);
    } catch (error) {
      console.error("Get inquiry stats error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Content Management Routes

  // Get all content (public)
  app.get("/api/content", async (req, res) => {
    try {
      const content = await storage.getSiteContent();
      const contentMap: Record<string, string> = {};

      // For public API, prefer published content, falback to draft if no published content exists (or just empty)
      // Actually per plan: return map of { key: content } (Live content)

      for (const [key, item] of Array.from(content.entries())) {
        if (item.isPublished) {
          contentMap[key] = item.content;
        }
      }

      res.json(contentMap);
    } catch (error) {
      console.error("Get content error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get content for admin (includes drafts)
  app.get("/api/admin/content", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const content = await storage.getSiteContent();
      const contentMap: Record<string, any> = {};

      for (const [key, item] of Array.from(content.entries())) {
        contentMap[key] = {
          content: item.content,
          draftContent: item.draftContent,
          isPublished: item.isPublished,
          lastPublishedAt: item.lastPublishedAt
        };
      }

      res.json(contentMap);
    } catch (error) {
      console.error("Get admin content error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Update content draft
  app.post("/api/admin/content", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const schema = z.object({
        key: z.string(),
        value: z.string()
      });

      const { key, value } = schema.parse(req.body);

      const updated = await storage.updateSiteContent(key, value);

      res.json(updated);
    } catch (error) {
      console.error("Update content error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Publish content
  app.post("/api/admin/content/publish", authenticateToken, requireAdmin, async (req, res) => {
    try {
      await storage.publishSiteContent();
      res.json({ message: "Content published successfully" });
    } catch (error) {
      console.error("Publish content error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  return httpServer;
}


