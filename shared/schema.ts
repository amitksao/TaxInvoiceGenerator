import { pgTable, text, serial, integer, decimal, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  invoiceNumber: text("invoice_number").notNull().unique(),
  assessmentYear: text("assessment_year").notNull(),
  clientName: text("client_name").notNull(),
  clientAddress: text("client_address").notNull(),
  clientCity: text("client_city").notNull(),
  clientState: text("client_state").notNull(),
  clientPin: text("client_pin").notNull(),
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
  clientAddress: z.string().min(1, "Client address is required"),
  clientCity: z.string().min(1, "City is required"),
  clientState: z.string().min(1, "State is required"),
  clientPin: z.string().min(1, "PIN code is required"),
  clientEmail: z.string().email("Invalid email format").optional(),
  clientPhone: z.string().optional(),
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
  additionalCharges: z.array(additionalChargeSchema).max(3),
});

export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type CreateInvoice = z.infer<typeof createInvoiceSchema>;
export type Invoice = typeof invoices.$inferSelect;
export type AdditionalCharge = z.infer<typeof additionalChargeSchema>;

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
