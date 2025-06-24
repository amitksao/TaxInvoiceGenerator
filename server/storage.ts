import { users, invoices, type User, type InsertUser, type Invoice, type InsertInvoice } from "@shared/schema";

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

export const storage = new MemStorage();
