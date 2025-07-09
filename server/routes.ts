import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertInvoiceSchema, createInvoiceSchema, insertClientSchema } from "@shared/schema";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";

// Simple validation middleware
function validateAndSanitize(schema: z.ZodSchema) {
  return (req: any, res: any, next: any) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: fromZodError(error).toString() });
      }
      return res.status(400).json({ message: 'Invalid request data' });
    }
  };
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Create invoice
  app.post("/api/invoices", validateAndSanitize(createInvoiceSchema), async (req, res) => {
    try {
      const parsed = req.body;
      
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
      res.status(500).json({ message: "Failed to create invoice" });
    }
  });

  // Get all invoices
  app.get("/api/invoices", async (req, res) => {
    try {
      const { search, clientId } = req.query;
      
      let invoices = await storage.getInvoices();
      
      // Filter by client ID if provided
      if (clientId) {
        const id = parseInt(clientId as string);
        if (!isNaN(id)) {
          invoices = await storage.getInvoicesByClient(id);
        }
      }
      
      // Search functionality
      if (search && typeof search === 'string') {
        invoices = await storage.searchInvoices(search.trim());
      }
      
      res.json(invoices);
    } catch (error) {
      console.error('Invoice retrieval error:', error);
      res.status(500).json({ message: "Failed to retrieve invoices" });
    }
  });

  // Get single invoice
  app.get("/api/invoices/:id", async (req, res) => {
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
      console.error('Invoice retrieval error:', error);
      res.status(500).json({ message: "Failed to retrieve invoice" });
    }
  });

  // Update invoice
  app.put("/api/invoices/:id", validateAndSanitize(createInvoiceSchema), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid invoice ID" });
      }
      
      const parsed = req.body;
      
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
      
      const invoice = await storage.updateInvoice(id, invoiceData);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      
      res.json(invoice);
    } catch (error) {
      console.error('Invoice update error:', error);
      res.status(500).json({ message: "Failed to update invoice" });
    }
  });

  // Delete invoice
  app.delete("/api/invoices/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid invoice ID" });
      }
      
      const deleted = await storage.deleteInvoice(id);
      if (!deleted) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      
      res.json({ message: "Invoice deleted successfully" });
    } catch (error) {
      console.error('Invoice deletion error:', error);
      res.status(500).json({ message: "Failed to delete invoice" });
    }
  });

  // Client management routes
  app.post("/api/clients", validateAndSanitize(insertClientSchema), async (req, res) => {
    try {
      const client = await storage.createClient(req.body);
      res.json(client);
    } catch (error) {
      console.error('Client creation error:', error);
      res.status(500).json({ message: "Failed to create client" });
    }
  });

  app.get("/api/clients", async (req, res) => {
    try {
      const { search } = req.query;
      
      let clients = await storage.getClients();
      
      if (search && typeof search === 'string') {
        clients = await storage.searchClients(search.trim());
      }
      
      res.json(clients);
    } catch (error) {
      console.error('Client retrieval error:', error);
      res.status(500).json({ message: "Failed to retrieve clients" });
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
      console.error('Client retrieval error:', error);
      res.status(500).json({ message: "Failed to retrieve client" });
    }
  });

  app.put("/api/clients/:id", validateAndSanitize(insertClientSchema), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid client ID" });
      }
      
      const client = await storage.updateClient(id, req.body);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      res.json(client);
    } catch (error) {
      console.error('Client update error:', error);
      res.status(500).json({ message: "Failed to update client" });
    }
  });

  app.delete("/api/clients/:id", async (req, res) => {
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
      console.error('Client deletion error:', error);
      res.status(500).json({ message: "Failed to delete client" });
    }
  });

  app.get("/api/clients/:id/invoices", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid client ID" });
      }
      
      const invoices = await storage.getInvoicesByClient(id);
      res.json(invoices);
    } catch (error) {
      console.error('Client invoices retrieval error:', error);
      res.status(500).json({ message: "Failed to retrieve client invoices" });
    }
  });

  const server = createServer(app);
  return server;
}