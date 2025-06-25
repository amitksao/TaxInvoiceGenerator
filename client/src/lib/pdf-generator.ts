import jsPDF from 'jspdf';
import type { Invoice } from '@shared/schema';
import { formatCurrency } from './currency';
import logoImage from "@assets/8944800c-f7c0-4823-a996-e72890d14956_1750803319943.jpeg";

export function generateInvoicePDF(invoice: Invoice) {
  const doc = new jsPDF();
  
  // Set font
  doc.setFont('helvetica', 'normal');
  
  // Add logo centered
  try {
    doc.addImage(logoImage, 'JPEG', 95, 15, 20, 20);
  } catch (error) {
    console.warn('Could not add logo to PDF:', error);
  }
  
  // Company header - centered
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text('Dipak Kumar Sao & Associates', 105, 45, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text('(Advocate & Tax Consultant)', 105, 52, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text('Northlake Road, Besides Manas Sarovar, Po. & Dist. Purulia.', 105, 59, { align: 'center' });
  doc.text('Mobile - 9778780582/9434001881', 105, 66, { align: 'center' });
  doc.text('E-Mail : dipakadv.sao@gmail.com', 105, 73, { align: 'center' });
  
  // Separator line
  doc.line(20, 80, 190, 80);
  
  // Invoice header
  doc.setFontSize(20);
  doc.setTextColor(25, 118, 210); // Primary blue color
  doc.text('INVOICE', 20, 95);
  
  // Invoice details
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text(`Invoice #: ${invoice.invoiceNumber}`, 150, 95);
  doc.text(`Date: ${new Date(invoice.createdAt).toLocaleDateString()}`, 150, 103);
  doc.text(`Assessment Year: ${invoice.assessmentYear}`, 150, 111);
  
  // Client info
  doc.setFontSize(12);
  doc.text('Bill To:', 20, 125);
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text(invoice.clientName, 20, 135);
  doc.text(invoice.clientAddress, 20, 143);
  doc.text(`${invoice.clientCity}, ${invoice.clientState}, ${invoice.clientPin}`, 20, 151);
  
  let clientInfoY = 159;
  if (invoice.clientEmail) {
    doc.text(`Email: ${invoice.clientEmail}`, 20, clientInfoY);
    clientInfoY += 8;
  }
  if (invoice.clientPhone) {
    doc.text(`Phone: ${invoice.clientPhone}`, 20, clientInfoY);
    clientInfoY += 8;
  }
  
  // Services table header
  let yPosition = Math.max(170, clientInfoY + 10);
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text('Description', 20, yPosition);
  doc.text('Amount', 150, yPosition);
  
  // Draw line under header
  doc.line(20, yPosition + 2, 190, yPosition + 2);
  yPosition += 15;
  
  // Services
  doc.setFontSize(10);
  const additionalCharges = JSON.parse(invoice.additionalCharges);
  
  // Tax return charges
  if (parseFloat(invoice.taxReturnCharges) > 0) {
    doc.text('Tax Return Filing', 20, yPosition);
    doc.text(formatCurrency(parseFloat(invoice.taxReturnCharges)), 150, yPosition);
    yPosition += 10;
  }
  
  // Accounting charges
  if (parseFloat(invoice.accountingCharges || '0') > 0) {
    doc.text('Accounting Services', 20, yPosition);
    doc.text(formatCurrency(parseFloat(invoice.accountingCharges!)), 150, yPosition);
    yPosition += 10;
  }
  
  // Audit fee
  if (parseFloat(invoice.auditFee || '0') > 0) {
    doc.text('Audit Services', 20, yPosition);
    doc.text(formatCurrency(parseFloat(invoice.auditFee!)), 150, yPosition);
    yPosition += 10;
  }
  
  // Additional charges
  additionalCharges.forEach((charge: any) => {
    if (charge.label && charge.amount > 0) {
      doc.text(charge.label, 20, yPosition);
      doc.text(formatCurrency(charge.amount), 150, yPosition);
      yPosition += 10;
    }
  });
  
  // Total section
  yPosition += 10;
  doc.line(20, yPosition, 190, yPosition);
  yPosition += 15;
  
  doc.setFontSize(12);
  doc.setTextColor(25, 118, 210);
  doc.text('Total Amount:', 120, yPosition);
  doc.text(formatCurrency(parseFloat(invoice.totalAmount)), 150, yPosition);
  
  // Footer
  yPosition += 30;
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text('Thank you for your business!', 105, yPosition, { align: 'center' });
  doc.text('For any queries, please contact us at dipakadv.sao@gmail.com or 9778780582/9434001881', 105, yPosition + 8, { align: 'center' });
  
  // Generate filename with client name, invoice number, and assessment year
  const clientName = invoice.clientName.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_');
  let filename;
  if (invoice.invoiceNumber === "PREVIEW") {
    filename = `${clientName}_Preview_${invoice.assessmentYear}.pdf`;
  } else {
    filename = `${clientName}_${invoice.invoiceNumber}_${invoice.assessmentYear}.pdf`;
  }
  
  // Save the PDF
  doc.save(filename);
}
