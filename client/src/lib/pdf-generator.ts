import jsPDF from 'jspdf';
import type { Invoice } from '@shared/schema';
import { formatCurrency } from './currency';
import logoImage from "@assets/8944800c-f7c0-4823-a996-e72890d14956_1750803319943.jpeg";

export function generateInvoicePDF(invoice: Invoice) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true
  });
  
  // Test currency symbol support
  console.log('Testing currency symbol in PDF:', formatCurrency(100));
  
  // Define a custom currency formatter for PDF that ensures proper rendering
  const formatCurrencyForPDF = (amount: number): string => {
    // Use the text "Rupees" to avoid Unicode issues entirely
    return `Rs. ${amount.toFixed(2)}`;
  };
  
  // Add logo centered - increased size
  try {
    doc.addImage(logoImage, 'JPEG', 85, 10, 40, 40);
  } catch (error) {
    console.warn('Could not add logo to PDF:', error);
  }
  
  // Company header - centered with compact fonts
  doc.setFontSize(18);
  doc.setTextColor(0, 0, 0);
  doc.text('Dipak Kumar Sao & Associates', 105, 48, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text('(Advocate & Tax Consultant)', 105, 56, { align: 'center' });
  
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text('North Lake Road, Besides Manas Sarovar, Po. & Dist. Purulia.', 105, 64, { align: 'center' });
  doc.text('Mobile - 9778780582/9434001881', 105, 70, { align: 'center' });
  doc.text('E-Mail : dipakadv.sao@gmail.com', 105, 76, { align: 'center' });
  
  // Separator line
  doc.line(20, 82, 190, 82);
  
  // Invoice header
  doc.setFontSize(18);
  doc.setTextColor(25, 118, 210); // Primary blue color
  doc.text('INVOICE', 20, 95);
  
  // Invoice details
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  doc.text(`Invoice #: ${invoice.invoiceNumber}`, 150, 95);
  doc.text(`Date: ${new Date(invoice.createdAt).toLocaleDateString()}`, 150, 102);
  doc.text(`Assessment Year: ${invoice.assessmentYear}`, 150, 109);
  
  // Client info
  doc.setFontSize(11);
  doc.text('Bill To:', 20, 122);
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  
  let clientInfoY = 130;
  doc.text(invoice.clientName, 20, clientInfoY);
  clientInfoY += 6;
  
  if (invoice.clientAddress) {
    doc.text(invoice.clientAddress, 20, clientInfoY);
    clientInfoY += 6;
  }
  
  const locationParts = [invoice.clientCity, invoice.clientState, invoice.clientPin].filter(Boolean);
  if (locationParts.length > 0) {
    doc.text(locationParts.join(', '), 20, clientInfoY);
    clientInfoY += 6;
  }
  
  if (invoice.clientEmail) {
    doc.text(`Email: ${invoice.clientEmail}`, 20, clientInfoY);
    clientInfoY += 6;
  }
  if (invoice.clientPhone) {
    doc.text(`Phone: ${invoice.clientPhone}`, 20, clientInfoY);
    clientInfoY += 6;
  }
  
  // Services table header
  let yPosition = Math.max(160, clientInfoY + 8);
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.text('Description', 20, yPosition);
  doc.text('Amount', 150, yPosition);
  
  // Draw line under header
  doc.line(20, yPosition + 2, 190, yPosition + 2);
  yPosition += 12;
  
  // Services
  doc.setFontSize(9);
  const additionalCharges = JSON.parse(invoice.additionalCharges);
  
  // Tax return charges
  if (parseFloat(invoice.taxReturnCharges) !== 0) {
    doc.text('Tax Return Filing', 20, yPosition);
    doc.text(formatCurrencyForPDF(parseFloat(invoice.taxReturnCharges)), 150, yPosition);
    yPosition += 8;
  }
  
  // Accounting charges
  if (parseFloat(invoice.accountingCharges || '0') !== 0) {
    doc.text('Accounting Services', 20, yPosition);
    doc.text(formatCurrencyForPDF(parseFloat(invoice.accountingCharges!)), 150, yPosition);
    yPosition += 8;
  }
  
  // Audit fee
  if (parseFloat(invoice.auditFee || '0') !== 0) {
    doc.text('Audit Services', 20, yPosition);
    doc.text(formatCurrencyForPDF(parseFloat(invoice.auditFee!)), 150, yPosition);
    yPosition += 8;
  }
  
  // Additional charges
  additionalCharges.forEach((charge: any) => {
    if (charge.label && charge.amount !== 0) {
      doc.text(charge.label, 20, yPosition);
      doc.text(formatCurrencyForPDF(charge.amount), 150, yPosition);
      yPosition += 8;
    }
  });
  
  // Total section
  yPosition += 8;
  doc.line(20, yPosition, 190, yPosition);
  yPosition += 10;
  
  doc.setFontSize(11);
  doc.setTextColor(25, 118, 210);
  doc.text('Total Amount:', 120, yPosition);
  doc.text(formatCurrencyForPDF(parseFloat(invoice.totalAmount)), 150, yPosition);
  
  // Signature section - compact layout to fit on one page
  yPosition += 20;
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  
  // Signature box with compact styling - positioned within page margins
  const signatureBoxX = 125; // Position on right side
  const signatureBoxWidth = 60; // Compact width
  const signatureBoxHeight = 30; // Reduced height
  
  doc.rect(signatureBoxX, yPosition, signatureBoxWidth, signatureBoxHeight);
  doc.text('Authorized Signatory:', signatureBoxX + 2, yPosition - 3);
  doc.text('Signature:', signatureBoxX + 2, yPosition + 10);
  doc.text('Date: __________', signatureBoxX + 2, yPosition + 22);
  
  // Company name below signature box
  doc.setFontSize(8);
  doc.setTextColor(50, 50, 50);
  doc.text('Dipak Kumar Sao & Associates', signatureBoxX + 2, yPosition + 38);
  
  // Footer - compact and positioned properly
  yPosition += 50;
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text('Thank you for your business!', 105, yPosition, { align: 'center' });
  doc.text('For queries: dipakadv.sao@gmail.com or 9778780582/9434001881', 105, yPosition + 6, { align: 'center' });
  
  // Generate filename with client name, invoice number, and assessment year
  const clientName = invoice.clientName.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_');
  let filename;
  if (invoice.invoiceNumber === "PREVIEW") {
    filename = `${clientName}_Preview_${invoice.assessmentYear}.pdf`;
  } else {
    filename = `${clientName}_${invoice.invoiceNumber}_${invoice.assessmentYear}.pdf`;
  }
  
  // Single download method to prevent multiple downloads
  console.log(`Downloading PDF: ${filename}`);
  
  // Use only jsPDF's native save method
  doc.save(filename);
  
  console.log(`✓ PDF download completed: ${filename}`);
}
