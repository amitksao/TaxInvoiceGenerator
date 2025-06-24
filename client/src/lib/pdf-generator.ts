import jsPDF from 'jspdf';
import type { Invoice } from '@shared/schema';
import { formatCurrency } from './currency';
import logoImage from "@assets/8944800c-f7c0-4823-a996-e72890d14956_1750803319943.jpeg";

export function generateInvoicePDF(invoice: Invoice) {
  const doc = new jsPDF();
  
  // Set font
  doc.setFont('helvetica', 'normal');
  
  // Add logo
  try {
    doc.addImage(logoImage, 'JPEG', 20, 15, 20, 20);
  } catch (error) {
    console.warn('Could not add logo to PDF:', error);
  }
  
  // Header
  doc.setFontSize(20);
  doc.setTextColor(25, 118, 210); // Primary blue color
  doc.text('INVOICE', 150, 30);
  
  // Company info
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text('Tax Consultation Services', 45, 25);
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text('Professional Tax & Accounting Solutions', 45, 32);
  
  // Invoice details
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text(`Invoice #: ${invoice.invoiceNumber}`, 150, 40);
  doc.text(`Date: ${new Date(invoice.createdAt).toLocaleDateString()}`, 150, 48);
  doc.text(`Assessment Year: ${invoice.assessmentYear}`, 150, 56);
  
  // Client info placeholder
  doc.setFontSize(12);
  doc.text('Bill To:', 20, 70);
  doc.setFontSize(10);
  doc.text('[Client Name]', 20, 80);
  doc.text('[Client Address]', 20, 88);
  doc.text('[City, State, PIN]', 20, 96);
  
  // Services table header
  let yPosition = 120;
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
  doc.text('For any queries, please contact us at [email] or [phone]', 105, yPosition + 8, { align: 'center' });
  
  // Save the PDF
  doc.save(`invoice-${invoice.invoiceNumber}.pdf`);
}
