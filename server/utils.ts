import { z } from "zod";

// Validation schemas for common operations
export const paginationSchema = z.object({
  page: z.string().transform(Number).default("1"),
  limit: z.string().transform(Number).default("10"),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const searchSchema = z.object({
  query: z.string().min(1),
  category: z.string().optional(),
  minPrice: z.string().transform(Number).optional(),
  maxPrice: z.string().transform(Number).optional(),
});

export const dateRangeSchema = z.object({
  startDate: z.string().transform(date => new Date(date)).optional(),
  endDate: z.string().transform(date => new Date(date)).optional(),
});

// Utility functions
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export function formatCurrency(amount: string | number, currency = "USD"): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(num);
}

export function calculateTax(subtotal: number, taxRate = 0.1): number {
  return subtotal * taxRate;
}

export function calculateTotal(subtotal: number, taxAmount: number, shippingAmount: number): number {
  return subtotal + taxAmount + shippingAmount;
}

export function generateOrderNumber(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9).toUpperCase();
  return `ORD-${timestamp}-${random}`;
}

export function generateInvoiceNumber(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9).toUpperCase();
  return `INV-${timestamp}-${random}`;
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePassword(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }
  
  if (!/\d/.test(password)) {
    errors.push("Password must contain at least one number");
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push("Password must contain at least one special character");
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function sanitizeString(input: string): string {
  return input.trim().replace(/[<>]/g, "");
}

export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function calculateShipping(weight: number, distance: number): number {
  // Simple shipping calculation: $5 base + $0.50 per kg + $0.10 per km
  return 5 + (weight * 0.5) + (distance * 0.1);
}

export function isInStock(stockQuantity: number, minStockLevel: number): boolean {
  return stockQuantity > minStockLevel;
}

export function getStockStatus(stockQuantity: number, minStockLevel: number): {
  status: "in_stock" | "low_stock" | "out_of_stock";
  message: string;
} {
  if (stockQuantity === 0) {
    return {
      status: "out_of_stock",
      message: "Out of stock",
    };
  }
  
  if (stockQuantity <= minStockLevel) {
    return {
      status: "low_stock",
      message: `Low stock (${stockQuantity} remaining)`,
    };
  }
  
  return {
    status: "in_stock",
    message: `In stock (${stockQuantity} available)`,
  };
}

// Error handling utilities
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

export function createResponse<T>(
  success: boolean,
  data?: T,
  message?: string,
  error?: string
) {
  return {
    success,
    data,
    message,
    error,
    timestamp: new Date().toISOString(),
  };
}

// Logging utilities
export function logInfo(message: string, source = "app") {
  console.log(`[${new Date().toISOString()}] [INFO] [${source}] ${message}`);
}

export function logError(message: string, error?: any, source = "app") {
  console.error(`[${new Date().toISOString()}] [ERROR] [${source}] ${message}`);
  if (error) {
    console.error(error);
  }
}

export function logWarn(message: string, source = "app") {
  console.warn(`[${new Date().toISOString()}] [WARN] [${source}] ${message}`);
}
