import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { AppError, createResponse } from "./utils";

// Validation middleware
export function validateRequest(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        
        return res.status(400).json(
          createResponse(false, null, "Validation failed", undefined)
        );
      }
      next(error);
    }
  };
}

// Query validation middleware
export function validateQuery(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.query);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        
        return res.status(400).json(
          createResponse(false, null, "Query validation failed", undefined)
        );
      }
      next(error);
    }
  };
}

// Rate limiting middleware (simple in-memory implementation)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export function rateLimit(options: {
  windowMs: number;
  max: number;
  message?: string;
}) {
  const { windowMs, max, message = "Too many requests" } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip || "unknown";
    const now = Date.now();
    const windowStart = now - windowMs;

    // Clean up old entries
    for (const [ip, data] of Array.from(rateLimitStore.entries())) {
      if (data.resetTime < now) {
        rateLimitStore.delete(ip);
      }
    }

    const record = rateLimitStore.get(key);
    
    if (!record || record.resetTime < now) {
      // New window
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + windowMs,
      });
      return next();
    }

    if (record.count >= max) {
      return res.status(429).json(
        createResponse(false, null, message, undefined)
      );
    }

    record.count++;
    next();
  };
}

// CORS middleware
export function cors(options: {
  origin?: string | string[];
  methods?: string[];
  allowedHeaders?: string[];
  credentials?: boolean;
} = {}) {
  const {
    origin = "*",
    methods = ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders = ["Content-Type", "Authorization"],
    credentials = false,
  } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    const originHeader = Array.isArray(origin) 
      ? origin.includes(req.headers.origin || "") 
        ? req.headers.origin 
        : origin[0]
      : origin;

    res.header("Access-Control-Allow-Origin", originHeader);
    res.header("Access-Control-Allow-Methods", methods.join(", "));
    res.header("Access-Control-Allow-Headers", allowedHeaders.join(", "));
    
    if (credentials) {
      res.header("Access-Control-Allow-Credentials", "true");
    }

    if (req.method === "OPTIONS") {
      return res.status(200).end();
    }

    next();
  };
}

// Request logging middleware
export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  const { method, url, ip } = req;
  
  res.on("finish", () => {
    const duration = Date.now() - start;
    const { statusCode } = res;
    
    console.log(
      `${new Date().toISOString()} ${method} ${url} ${statusCode} - ${duration}ms - ${ip}`
    );
  });

  next();
}

// Security headers middleware
export function securityHeaders(req: Request, res: Response, next: NextFunction) {
  // Prevent clickjacking
  res.header("X-Frame-Options", "DENY");
  
  // Prevent MIME type sniffing
  res.header("X-Content-Type-Options", "nosniff");
  
  // Enable XSS protection
  res.header("X-XSS-Protection", "1; mode=block");
  
  // Force HTTPS in production
  if (process.env.NODE_ENV === "production") {
    res.header("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
  
  // Content Security Policy
  res.header(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'"
  );

  next();
}

// Health check middleware
export function healthCheck(req: Request, res: Response) {
  const health = {
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
    version: process.env.npm_package_version || "1.0.0",
  };

  res.json(health);
}

// Error handling middleware
export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json(
      createResponse(false, null, error.message, undefined)
    );
  }

  // Handle Zod validation errors
  if (error instanceof z.ZodError) {
    const errors = error.errors.map(err => ({
      field: err.path.join('.'),
      message: err.message,
    }));
    
    return res.status(400).json(
      createResponse(false, null, "Validation failed", undefined)
    );
  }

  // Handle JWT errors
  if (error.name === "JsonWebTokenError") {
    return res.status(401).json(
      createResponse(false, null, "Invalid token", undefined)
    );
  }

  if (error.name === "TokenExpiredError") {
    return res.status(401).json(
      createResponse(false, null, "Token expired", undefined)
    );
  }

  // Handle database errors
  if (error.message.includes("duplicate key")) {
    return res.status(409).json(
      createResponse(false, null, "Resource already exists", undefined)
    );
  }

  if (error.message.includes("foreign key constraint")) {
    return res.status(400).json(
      createResponse(false, null, "Invalid reference", undefined)
    );
  }

  // Log unexpected errors
  console.error("Unexpected error:", {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
  });

  // Generic error response
  res.status(500).json(
    createResponse(false, null, "Internal server error", undefined)
  );
}

// 404 handler
export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json(
    createResponse(false, null, `Route ${req.method} ${req.url} not found`, undefined)
  );
}
