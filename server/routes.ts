import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertInvoiceSchema, createInvoiceSchema } from "@shared/schema";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(app: Express): Promise<Server> {
  // Create invoice
  app.post("/api/invoices", async (req, res) => {
    try {
      const parsed = createInvoiceSchema.parse(req.body);
      
      const invoiceData = {
        assessmentYear: parsed.assessmentYear,
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
      const invoices = await storage.getInvoices();
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

  const httpServer = createServer(app);
  return httpServer;
}
