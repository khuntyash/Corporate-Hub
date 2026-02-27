import { pgTable, text, timestamp, varchar, boolean, pgEnum } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Inquiry status enum
export const inquiryStatusEnum = pgEnum("inquiry_status", ["pending", "in_progress", "responded", "closed", "cancelled"]);

// Inquiry priority enum
export const inquiryPriorityEnum = pgEnum("inquiry_priority", ["low", "medium", "high", "urgent"]);

// Inquiries table
export const inquiries = pgTable("inquiries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").notNull(),
  productName: text("product_name").notNull(),
  sellerCompanyId: varchar("seller_company_id"),
  buyerCompanyId: varchar("buyer_company_id"),
  buyerName: text("buyer_name").notNull(),
  buyerEmail: text("buyer_email").notNull(),
  buyerPhone: text("buyer_phone"),
  buyerCompany: text("buyer_company"),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  quantity: text("quantity"),
  budget: text("budget"),
  deliveryDate: text("delivery_date"),
  additionalRequirements: text("additional_requirements"),
  status: inquiryStatusEnum("status").default("pending"),
  priority: inquiryPriorityEnum("priority").default("medium"),
  adminResponse: text("admin_response"),
  adminResponseDate: timestamp("admin_response_date"),
  assignedTo: varchar("assigned_to"), // Admin user ID
  isReadByAdmin: boolean("is_read_by_admin").default(false),
  isReadBySeller: boolean("is_read_by_seller").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert schemas
export const insertInquirySchema = createInsertSchema(inquiries).extend({
  productId: z.string().min(1),
  productName: z.string().min(1),
  buyerName: z.string().min(1),
  buyerEmail: z.string().email(),
  subject: z.string().min(1),
  message: z.string().min(10),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
});

// Update schemas
export const updateInquirySchema = z.object({
  status: z.enum(["pending", "in_progress", "responded", "closed", "cancelled"]).optional(),
  adminResponse: z.string().optional(),
  assignedTo: z.string().optional(),
  isReadByAdmin: z.boolean().optional(),
  isReadBySeller: z.boolean().optional(),
});

// Response schemas
export const inquiryResponseSchema = z.object({
  response: z.string().min(1),
  status: z.enum(["in_progress", "responded", "closed"]).optional(),
  assignedTo: z.string().optional(),
});

// Types
export type Inquiry = typeof inquiries.$inferSelect;
export type InsertInquiry = typeof inquiries.$inferInsert;
export type UpdateInquiry = z.infer<typeof updateInquirySchema>;
export type InquiryResponse = z.infer<typeof inquiryResponseSchema>;
