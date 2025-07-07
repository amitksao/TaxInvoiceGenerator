import { pgTable, text, serial, integer, decimal, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  invoiceNumber: text("invoice_number").notNull().unique(),
  assessmentYear: text("assessment_year").notNull(),
  clientName: text("client_name").notNull(),
  clientAddress: text("client_address"),
  clientCity: text("client_city"),
  clientState: text("client_state"),
  clientPin: text("client_pin"),
  clientEmail: text("client_email"),
  clientPhone: text("client_phone"),
  taxReturnCharges: decimal("tax_return_charges", { precision: 10, scale: 2 }).notNull(),
  accountingCharges: decimal("accounting_charges", { precision: 10, scale: 2 }).default("0"),
  auditFee: decimal("audit_fee", { precision: 10, scale: 2 }).default("0"),
  additionalCharges: text("additional_charges").notNull(), // JSON string of additional charges
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const additionalChargeSchema = z.object({
  label: z.string(),
  amount: z.number().min(0),
});

export const insertInvoiceSchema = createInsertSchema(invoices, {
  assessmentYear: z.string().min(1, "Assessment year is required"),
  clientName: z.string().min(1, "Client name is required"),
  clientAddress: z.string().optional(),
  clientCity: z.string().optional(),
  clientState: z.string().optional(),
  clientPin: z.string().optional(),
  clientEmail: z.string().refine((val) => !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), "Invalid email format").optional(),
  clientPhone: z.string().refine((val) => !val || val.length >= 10, "Phone number must be at least 10 digits").optional(),
  taxReturnCharges: z.string().min(1, "Tax return charges are required"),
  accountingCharges: z.string().optional(),
  auditFee: z.string().optional(),
  additionalCharges: z.string(),
}).omit({
  id: true,
  invoiceNumber: true,
  totalAmount: true,
  createdAt: true,
});

export const createInvoiceSchema = insertInvoiceSchema.extend({
  clientName: z.string().min(1, "Client name is required"),
  clientEmail: z.string().refine((val) => !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), "Invalid email format").optional(),
  clientPhone: z.string().refine((val) => !val || val.length >= 10, "Phone number must be at least 10 digits").optional(),
  clientAddress: z.string().optional(),
  clientCity: z.string().optional(),
  clientState: z.string().optional(),
  clientPin: z.string().optional(),
  assessmentYear: z.string().min(1, "Assessment year is required"),
  taxReturnCharges: z.string().min(1, "Tax return charges are required"),
  accountingCharges: z.string().optional(),
  auditFee: z.string().optional(),
  additionalCharges: z.array(additionalChargeSchema).max(3).default([]),
});

export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type CreateInvoice = z.infer<typeof createInvoiceSchema>;
export type Invoice = typeof invoices.$inferSelect;
export type AdditionalCharge = z.infer<typeof additionalChargeSchema>;

// Admin users table for authentication
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(), // Will store hashed passwords
  createdAt: timestamp("created_at").defaultNow(),
});

export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type User = typeof users.$inferSelect;
export type LoginRequest = z.infer<typeof loginSchema>;
export type RegisterRequest = z.infer<typeof registerSchema>;

// Client schema for customer management
export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").unique(),
  phone: text("phone"),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  pin: text("pin"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertClientSchema = createInsertSchema(clients, {
  name: z.string().min(1, "Client name is required"),
  email: z.string().email("Invalid email format").optional(),
  phone: z.string().refine((val) => !val || val.length >= 10, "Phone number must be at least 10 digits").optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pin: z.string().optional(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertClient = z.infer<typeof insertClientSchema>;
export type Client = typeof clients.$inferSelect;
