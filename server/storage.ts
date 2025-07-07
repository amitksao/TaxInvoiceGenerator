import {
  invoices,
  clients,
  users,
  type Invoice,
  type InsertInvoice,
  type Client,
  type InsertClient,
  type User,
  type RegisterRequest,
} from "@shared/schema";
import { db } from "./db";
import { eq, ilike, desc } from "drizzle-orm";

export interface IStorage {
  // User operations for authentication
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(userData: RegisterRequest & { password: string }): Promise<User>;
  getUserById(id: number): Promise<User | undefined>;
  
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  getInvoice(id: number): Promise<Invoice | undefined>;
  getInvoices(): Promise<Invoice[]>;
  searchInvoices(query: string): Promise<Invoice[]>;
  getInvoicesByClient(clientId: number): Promise<Invoice[]>;
  deleteInvoice(id: number): Promise<boolean>;
  
  createClient(client: InsertClient): Promise<Client>;
  getClient(id: number): Promise<Client | undefined>;
  getClients(): Promise<Client[]>;
  updateClient(id: number, client: Partial<InsertClient>): Promise<Client | undefined>;
  deleteClient(id: number): Promise<boolean>;
  searchClients(query: string): Promise<Client[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private invoices: Map<number, Invoice>;
  private clients: Map<number, Client>;
  private currentUserId: number;
  private currentInvoiceId: number;
  private currentClientId: number;
  private invoiceCounter: number;

  constructor() {
    this.users = new Map();
    this.invoices = new Map();
    this.clients = new Map();
    this.currentUserId = 1;
    this.currentInvoiceId = 1;
    this.currentClientId = 1;
    this.invoiceCounter = 1;
  }

  // User operations for authentication
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(userData: RegisterRequest & { password: string }): Promise<User> {
    const id = this.currentUserId++;
    const user: User = {
      id,
      username: userData.username,
      password: userData.password,
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async getUserById(id: number): Promise<User | undefined> {
    return this.users.get(id);
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
      clientAddress: insertInvoice.clientAddress || null,
      clientCity: insertInvoice.clientCity || null,
      clientState: insertInvoice.clientState || null,
      clientPin: insertInvoice.clientPin || null,
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

  async createClient(insertClient: InsertClient): Promise<Client> {
    const id = this.currentClientId++;
    const client: Client = {
      id,
      name: insertClient.name,
      address: insertClient.address || null,
      email: insertClient.email || null,
      phone: insertClient.phone || null,
      city: insertClient.city || null,
      state: insertClient.state || null,
      pin: insertClient.pin || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.clients.set(id, client);
    return client;
  }

  async getClient(id: number): Promise<Client | undefined> {
    return this.clients.get(id);
  }

  async getClients(): Promise<Client[]> {
    return Array.from(this.clients.values()).sort((a, b) => a.name.localeCompare(b.name));
  }

  async updateClient(id: number, updateData: Partial<InsertClient>): Promise<Client | undefined> {
    const client = this.clients.get(id);
    if (!client) return undefined;
    
    const updatedClient: Client = {
      ...client,
      ...updateData,
      updatedAt: new Date(),
    };
    this.clients.set(id, updatedClient);
    return updatedClient;
  }

  async deleteClient(id: number): Promise<boolean> {
    return this.clients.delete(id);
  }

  async searchClients(query: string): Promise<Client[]> {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.clients.values()).filter(client =>
      client.name.toLowerCase().includes(lowerQuery) ||
      client.email?.toLowerCase().includes(lowerQuery) ||
      client.phone?.includes(query)
    );
  }

  async searchInvoices(query: string): Promise<Invoice[]> {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.invoices.values()).filter(invoice =>
      invoice.invoiceNumber.toLowerCase().includes(lowerQuery) ||
      invoice.clientName.toLowerCase().includes(lowerQuery) ||
      invoice.clientEmail?.toLowerCase().includes(lowerQuery) ||
      invoice.clientPhone?.includes(query) ||
      invoice.assessmentYear.includes(query) ||
      invoice.clientCity?.toLowerCase().includes(lowerQuery) ||
      invoice.clientState?.toLowerCase().includes(lowerQuery)
    ).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getInvoicesByClient(clientId: number): Promise<Invoice[]> {
    const client = this.clients.get(clientId);
    if (!client) return [];
    
    return Array.from(this.invoices.values()).filter(invoice =>
      invoice.clientName === client.name &&
      invoice.clientEmail === client.email &&
      invoice.clientPhone === client.phone
    ).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async deleteInvoice(id: number): Promise<boolean> {
    return this.invoices.delete(id);
  }
}

// Database Storage Implementation
export class DatabaseStorage implements IStorage {
  // User operations for authentication
  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(userData: RegisterRequest & { password: string }): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        username: userData.username,
        password: userData.password,
      })
      .returning();
    return user;
  }

  async getUserById(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async createInvoice(insertInvoice: InsertInvoice): Promise<Invoice> {
    try {
      // Generate invoice number
      const currentYear = new Date().getFullYear();
      const existingInvoices = await db.select().from(invoices);
      
      // Find the highest existing invoice number for this year
      const yearPrefix = `INV-${currentYear}-`;
      const existingNumbers = existingInvoices
        .filter(inv => inv.invoiceNumber.startsWith(yearPrefix))
        .map(inv => {
          const numberPart = inv.invoiceNumber.replace(yearPrefix, '');
          return parseInt(numberPart, 10) || 0;
        })
        .sort((a, b) => b - a);
      
      const nextNumber = existingNumbers.length > 0 ? existingNumbers[0] + 1 : 1;
      const invoiceNumber = `INV-${currentYear}-${String(nextNumber).padStart(3, '0')}`;
      
      // Calculate total amount
      const taxReturn = parseFloat(insertInvoice.taxReturnCharges);
      const accounting = parseFloat(insertInvoice.accountingCharges || "0");
      const audit = parseFloat(insertInvoice.auditFee || "0");
      
      let additionalCharges = [];
      try {
        additionalCharges = typeof insertInvoice.additionalCharges === 'string' 
          ? JSON.parse(insertInvoice.additionalCharges) 
          : insertInvoice.additionalCharges || [];
      } catch (error) {
        console.error('Error parsing additional charges:', error);
        additionalCharges = [];
      }
      const additionalTotal = additionalCharges.reduce((sum: number, charge: any) => sum + (charge.amount || 0), 0);
      
      const totalAmount = (taxReturn + accounting + audit + additionalTotal).toFixed(2);
      
      const [invoice] = await db
        .insert(invoices)
        .values({
          invoiceNumber,
          assessmentYear: insertInvoice.assessmentYear,
          clientName: insertInvoice.clientName,
          clientAddress: insertInvoice.clientAddress || null,
          clientCity: insertInvoice.clientCity || null,
          clientState: insertInvoice.clientState || null,
          clientPin: insertInvoice.clientPin || null,
          clientEmail: insertInvoice.clientEmail || null,
          clientPhone: insertInvoice.clientPhone || null,
          taxReturnCharges: insertInvoice.taxReturnCharges,
          accountingCharges: insertInvoice.accountingCharges || "0",
          auditFee: insertInvoice.auditFee || "0",
          additionalCharges: insertInvoice.additionalCharges,
          totalAmount,
        })
        .returning();
      
      return invoice;
    } catch (error) {
      console.error('Database error in createInvoice:', error);
      throw error;
    }
  }

  async getInvoice(id: number): Promise<Invoice | undefined> {
    const [invoice] = await db.select().from(invoices).where(eq(invoices.id, id));
    return invoice || undefined;
  }

  async getInvoices(): Promise<Invoice[]> {
    return await db.select().from(invoices).orderBy(desc(invoices.createdAt));
  }

  async createClient(insertClient: InsertClient): Promise<Client> {
    const [client] = await db
      .insert(clients)
      .values(insertClient)
      .returning();
    return client;
  }

  async getClient(id: number): Promise<Client | undefined> {
    const [client] = await db.select().from(clients).where(eq(clients.id, id));
    return client || undefined;
  }

  async getClients(): Promise<Client[]> {
    return await db.select().from(clients).orderBy(clients.name);
  }

  async updateClient(id: number, updateData: Partial<InsertClient>): Promise<Client | undefined> {
    const [client] = await db
      .update(clients)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(clients.id, id))
      .returning();
    return client || undefined;
  }

  async deleteClient(id: number): Promise<boolean> {
    const result = await db.delete(clients).where(eq(clients.id, id));
    return (result.rowCount || 0) > 0;
  }

  async searchClients(query: string): Promise<Client[]> {
    return await db
      .select()
      .from(clients)
      .where(
        ilike(clients.name, `%${query}%`)
      )
      .orderBy(clients.name);
  }

  async searchInvoices(query: string): Promise<Invoice[]> {
    return await db
      .select()
      .from(invoices)
      .where(
        ilike(invoices.clientName, `%${query}%`)
      )
      .orderBy(desc(invoices.createdAt));
  }

  async getInvoicesByClient(clientId: number): Promise<Invoice[]> {
    const client = await this.getClient(clientId);
    if (!client) return [];
    
    return await db
      .select()
      .from(invoices)
      .where(
        ilike(invoices.clientName, client.name)
      )
      .orderBy(desc(invoices.createdAt));
  }

  async deleteInvoice(id: number): Promise<boolean> {
    try {
      const result = await db.delete(invoices).where(eq(invoices.id, id));
      return result.rowCount ? result.rowCount > 0 : false;
    } catch (error) {
      console.error('Database delete error:', error);
      return false;
    }
  }
}

export const storage = new DatabaseStorage();
