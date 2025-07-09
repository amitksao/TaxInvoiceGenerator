import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertInvoiceSchema, createInvoiceSchema, insertClientSchema, loginSchema, registerSchema } from "@shared/schema";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import { authenticateToken, loginUser, registerUser, type AuthenticatedRequest } from "./auth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = loginSchema.parse(req.body);
      
      const result = await loginUser(username, password);
      if (!result) {
        return res.status(401).json({ message: "Invalid username or password" });
      }
      
      res.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: fromZodError(error).toString() });
      }
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const { username, password } = registerSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      const result = await registerUser(username, password);
      res.status(201).json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: fromZodError(error).toString() });
      }
      res.status(500).json({ message: "Registration failed" });
    }
  });

  app.get("/api/auth/user", authenticateToken, async (req: AuthenticatedRequest, res) => {
    res.json({ user: req.user });
  });

  // Protected routes - require authentication
  // Create invoice
  app.post("/api/invoices", authenticateToken, async (req, res) => {
    try {
      const parsed = createInvoiceSchema.parse(req.body);
      
      const invoiceData = {
        assessmentYear: parsed.assessmentYear,
        clientName: parsed.clientName,
        clientAddress: parsed.clientAddress,
        clientCity: parsed.clientCity,
        clientState: parsed.clientState,
        clientPin: parsed.clientPin,
        clientEmail: parsed.clientEmail,
        clientPhone: parsed.clientPhone,
        taxReturnCharges: parsed.taxReturnCharges,
        accountingCharges: parsed.accountingCharges || "0",
        auditFee: parsed.auditFee || "0",
        additionalCharges: JSON.stringify(parsed.additionalCharges || []),
      };
      
      const invoice = await storage.createInvoice(invoiceData);
      res.json(invoice);
    } catch (error) {
      console.error('Invoice creation error:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: fromZodError(error).toString() });
      } else {
        res.status(500).json({ message: "Failed to create invoice" });
      }
    }
  });

  // Get all invoices - protected
  app.get("/api/invoices", authenticateToken, async (req, res) => {
    try {
      const { search, clientId } = req.query;
      let invoices = await storage.getInvoices();
      
      // Filter by client ID if provided
      if (clientId && typeof clientId === 'string') {
        const id = parseInt(clientId);
        if (!isNaN(id)) {
          invoices = invoices.filter(invoice => 
            invoice.clientName && invoice.clientEmail && invoice.clientPhone &&
            // This would need client relationship - for now filter by client info
            false // TODO: Add proper client relationship
          );
        }
      }
      
      // Filter by search query if provided
      if (search && typeof search === 'string') {
        const query = search.toLowerCase();
        invoices = invoices.filter(invoice =>
          invoice.invoiceNumber.toLowerCase().includes(query) ||
          invoice.clientName.toLowerCase().includes(query) ||
          invoice.clientEmail?.toLowerCase().includes(query) ||
          invoice.clientPhone?.includes(query) ||
          invoice.assessmentYear.includes(query) ||
          invoice.clientCity?.toLowerCase().includes(query) ||
          invoice.clientState?.toLowerCase().includes(query)
        );
      }
      
      res.json(invoices);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch invoices" });
    }
  });

  // Update invoice - protected
  app.put("/api/invoices/:id", authenticateToken, async (req, res) => {
    try {
      const invoiceId = parseInt(req.params.id);
      if (isNaN(invoiceId)) {
        return res.status(400).json({ message: "Invalid invoice ID" });
      }

      const parsed = createInvoiceSchema.parse(req.body);
      
      const invoiceData = {
        assessmentYear: parsed.assessmentYear,
        clientName: parsed.clientName,
        clientAddress: parsed.clientAddress,
        clientCity: parsed.clientCity,
        clientState: parsed.clientState,
        clientPin: parsed.clientPin,
        clientEmail: parsed.clientEmail,
        clientPhone: parsed.clientPhone,
        taxReturnCharges: parsed.taxReturnCharges,
        accountingCharges: parsed.accountingCharges || "0",
        auditFee: parsed.auditFee || "0",
        additionalCharges: JSON.stringify(parsed.additionalCharges || []),
      };
      
      const updatedInvoice = await storage.updateInvoice(invoiceId, invoiceData);
      if (!updatedInvoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      
      res.json(updatedInvoice);
    } catch (error) {
      console.error('Invoice update error:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: fromZodError(error).toString() });
      } else {
        res.status(500).json({ message: "Failed to update invoice" });
      }
    }
  });

  // Get single invoice
  app.get("/api/invoices/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid invoice ID" });
      }
      
      const invoice = await storage.getInvoice(id);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      
      res.json(invoice);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch invoice" });
    }
  });

  // Delete invoice
  app.delete("/api/invoices/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid invoice ID" });
      }

      const success = await storage.deleteInvoice(id);
      if (!success) {
        return res.status(404).json({ message: "Invoice not found" });
      }

      res.json({ message: "Invoice deleted successfully" });
    } catch (error) {
      console.error("Error deleting invoice:", error);
      res.status(500).json({ message: "Failed to delete invoice" });
    }
  });

  // Client routes
  app.post("/api/clients", async (req, res) => {
    try {
      const parsed = insertClientSchema.parse(req.body);
      const client = await storage.createClient(parsed);
      res.json(client);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: fromZodError(error).toString() });
      } else {
        res.status(500).json({ message: "Failed to create client" });
      }
    }
  });

  app.get("/api/clients", async (req, res) => {
    try {
      const { search } = req.query;
      let clients;
      
      if (search && typeof search === 'string') {
        clients = await storage.searchClients(search);
      } else {
        clients = await storage.getClients();
      }
      
      res.json(clients);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch clients" });
    }
  });

  app.get("/api/clients/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid client ID" });
      }
      
      const client = await storage.getClient(id);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      res.json(client);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch client" });
    }
  });

  app.put("/api/clients/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid client ID" });
      }
      
      const parsed = insertClientSchema.partial().parse(req.body);
      const client = await storage.updateClient(id, parsed);
      
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      res.json(client);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: fromZodError(error).toString() });
      } else {
        res.status(500).json({ message: "Failed to update client" });
      }
    }
  });

  // Delete a client - protected
  app.delete("/api/clients/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid client ID" });
      }
      
      const deleted = await storage.deleteClient(id);
      if (!deleted) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      res.json({ message: "Client deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete client" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
