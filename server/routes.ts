import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertInvoiceSchema, createInvoiceSchema, insertClientSchema } from "@shared/schema";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(app: Express): Promise<Server> {
  // Create invoice
  app.post("/api/invoices", async (req, res) => {
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
        additionalCharges: JSON.stringify(parsed.additionalCharges),
      };
      
      const invoice = await storage.createInvoice(invoiceData);
      res.json(invoice);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: fromZodError(error).toString() });
      } else {
        res.status(500).json({ message: "Failed to create invoice" });
      }
    }
  });

  // Get all invoices
  app.get("/api/invoices", async (req, res) => {
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
          invoice.clientCity.toLowerCase().includes(query) ||
          invoice.clientState.toLowerCase().includes(query)
        );
      }
      
      res.json(invoices);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch invoices" });
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
      res.status(500).json({ message: "Failed to fetch invoice" });
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
      res.status(500).json({ message: "Failed to delete client" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
