import { users, invoices, type User, type InsertUser, type Invoice, type InsertInvoice } from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  getInvoice(id: number): Promise<Invoice | undefined>;
  getInvoices(): Promise<Invoice[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private invoices: Map<number, Invoice>;
  private currentUserId: number;
  private currentInvoiceId: number;
  private invoiceCounter: number;

  constructor() {
    this.users = new Map();
    this.invoices = new Map();
    this.currentUserId = 1;
    this.currentInvoiceId = 1;
    this.invoiceCounter = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createInvoice(insertInvoice: InsertInvoice): Promise<Invoice> {
    const id = this.currentInvoiceId++;
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(this.invoiceCounter++).padStart(3, '0')}`;
    
    // Calculate total amount
    const taxReturn = parseFloat(insertInvoice.taxReturnCharges);
    const accounting = parseFloat(insertInvoice.accountingCharges || "0");
    const audit = parseFloat(insertInvoice.auditFee || "0");
    
    const additionalCharges = JSON.parse(insertInvoice.additionalCharges);
    const additionalTotal = additionalCharges.reduce((sum: number, charge: any) => sum + (charge.amount || 0), 0);
    
    const totalAmount = (taxReturn + accounting + audit + additionalTotal).toFixed(2);
    
    const invoice: Invoice = {
      id,
      invoiceNumber,
      assessmentYear: insertInvoice.assessmentYear,
      clientName: insertInvoice.clientName,
      clientAddress: insertInvoice.clientAddress,
      clientCity: insertInvoice.clientCity,
      clientState: insertInvoice.clientState,
      clientPin: insertInvoice.clientPin,
      clientEmail: insertInvoice.clientEmail || null,
      clientPhone: insertInvoice.clientPhone || null,
      taxReturnCharges: insertInvoice.taxReturnCharges,
      accountingCharges: insertInvoice.accountingCharges || null,
      auditFee: insertInvoice.auditFee || null,
      additionalCharges: insertInvoice.additionalCharges,
      totalAmount,
      createdAt: new Date(),
    };
    
    this.invoices.set(id, invoice);
    return invoice;
  }

  async getInvoice(id: number): Promise<Invoice | undefined> {
    return this.invoices.get(id);
  }

  async getInvoices(): Promise<Invoice[]> {
    return Array.from(this.invoices.values()).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
}

// Database Storage Implementation
export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async createInvoice(insertInvoice: InsertInvoice): Promise<Invoice> {
    // Generate invoice number
    const currentYear = new Date().getFullYear();
    const existingInvoices = await db.select().from(invoices);
    const invoiceNumber = `INV-${currentYear}-${String(existingInvoices.length + 1).padStart(3, '0')}`;
    
    // Calculate total amount
    const taxReturn = parseFloat(insertInvoice.taxReturnCharges);
    const accounting = parseFloat(insertInvoice.accountingCharges || "0");
    const audit = parseFloat(insertInvoice.auditFee || "0");
    
    const additionalCharges = JSON.parse(insertInvoice.additionalCharges);
    const additionalTotal = additionalCharges.reduce((sum: number, charge: any) => sum + (charge.amount || 0), 0);
    
    const totalAmount = (taxReturn + accounting + audit + additionalTotal).toFixed(2);
    
    const [invoice] = await db
      .insert(invoices)
      .values({
        invoiceNumber,
        assessmentYear: insertInvoice.assessmentYear,
        clientName: insertInvoice.clientName,
        clientAddress: insertInvoice.clientAddress,
        clientCity: insertInvoice.clientCity,
        clientState: insertInvoice.clientState,
        clientPin: insertInvoice.clientPin,
        clientEmail: insertInvoice.clientEmail || null,
        clientPhone: insertInvoice.clientPhone || null,
        taxReturnCharges: insertInvoice.taxReturnCharges,
        accountingCharges: insertInvoice.accountingCharges || null,
        auditFee: insertInvoice.auditFee || null,
        additionalCharges: insertInvoice.additionalCharges,
        totalAmount,
      })
      .returning();
    
    return invoice;
  }

  async getInvoice(id: number): Promise<Invoice | undefined> {
    const [invoice] = await db.select().from(invoices).where(eq(invoices.id, id));
    return invoice || undefined;
  }

  async getInvoices(): Promise<Invoice[]> {
    return await db.select().from(invoices).orderBy(desc(invoices.createdAt));
  }
}

export const storage = new DatabaseStorage();
