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
  
  // Company header - centered with larger fonts
  doc.setFontSize(20);
  doc.setTextColor(0, 0, 0);
  doc.text('Dipak Kumar Sao & Associates', 105, 48, { align: 'center' });
  
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text('(Advocate & Tax Consultant)', 105, 58, { align: 'center' });
  
  doc.setFontSize(11);
  doc.setTextColor(100, 100, 100);
  doc.text('North Lake Road, Besides Manas Sarovar, Po. & Dist. Purulia.', 105, 68, { align: 'center' });
  doc.text('Mobile - 9778780582/9434001881', 105, 78, { align: 'center' });
  doc.text('E-Mail : dipakadv.sao@gmail.com', 105, 88, { align: 'center' });
  
  // Separator line
  doc.line(20, 95, 190, 95);
  
  // Invoice header
  doc.setFontSize(20);
  doc.setTextColor(25, 118, 210); // Primary blue color
  doc.text('INVOICE', 20, 110);
  
  // Invoice details
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text(`Invoice #: ${invoice.invoiceNumber}`, 150, 110);
  doc.text(`Date: ${new Date(invoice.createdAt).toLocaleDateString()}`, 150, 118);
  doc.text(`Assessment Year: ${invoice.assessmentYear}`, 150, 126);
  
  // Client info
  doc.setFontSize(12);
  doc.text('Bill To:', 20, 140);
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  
  let clientInfoY = 150;
  doc.text(invoice.clientName, 20, clientInfoY);
  clientInfoY += 8;
  
  if (invoice.clientAddress) {
    doc.text(invoice.clientAddress, 20, clientInfoY);
    clientInfoY += 8;
  }
  
  const locationParts = [invoice.clientCity, invoice.clientState, invoice.clientPin].filter(Boolean);
  if (locationParts.length > 0) {
    doc.text(locationParts.join(', '), 20, clientInfoY);
    clientInfoY += 8;
  }
  
  if (invoice.clientEmail) {
    doc.text(`Email: ${invoice.clientEmail}`, 20, clientInfoY);
    clientInfoY += 8;
  }
  if (invoice.clientPhone) {
    doc.text(`Phone: ${invoice.clientPhone}`, 20, clientInfoY);
    clientInfoY += 8;
  }
  
  // Services table header
  let yPosition = Math.max(185, clientInfoY + 10);
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
    doc.text(formatCurrencyForPDF(parseFloat(invoice.taxReturnCharges)), 150, yPosition);
    yPosition += 10;
  }
  
  // Accounting charges
  if (parseFloat(invoice.accountingCharges || '0') > 0) {
    doc.text('Accounting Services', 20, yPosition);
    doc.text(formatCurrencyForPDF(parseFloat(invoice.accountingCharges!)), 150, yPosition);
    yPosition += 10;
  }
  
  // Audit fee
  if (parseFloat(invoice.auditFee || '0') > 0) {
    doc.text('Audit Services', 20, yPosition);
    doc.text(formatCurrencyForPDF(parseFloat(invoice.auditFee!)), 150, yPosition);
    yPosition += 10;
  }
  
  // Additional charges
  additionalCharges.forEach((charge: any) => {
    if (charge.label && charge.amount > 0) {
      doc.text(charge.label, 20, yPosition);
      doc.text(formatCurrencyForPDF(charge.amount), 150, yPosition);
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
  doc.text(formatCurrencyForPDF(parseFloat(invoice.totalAmount)), 150, yPosition);
  
  // Signature section - ensure it stays within page boundaries
  yPosition += 30;
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  
  // Check if signature box would fit on current page, if not, add new page
  const signatureBoxHeight = 40;
  const pageHeight = 297; // A4 height in mm
  const bottomMargin = 20;
  
  if (yPosition + signatureBoxHeight > pageHeight - bottomMargin) {
    doc.addPage();
    yPosition = 20; // Start from top of new page
  }
  
  // Signature box with better styling - positioned within page margins
  const signatureBoxX = 120; // Move left to fit within page
  const signatureBoxWidth = 65; // Adjust width to fit within margins
  
  doc.rect(signatureBoxX, yPosition, signatureBoxWidth, signatureBoxHeight);
  doc.text('Authorized Signatory:', signatureBoxX + 2, yPosition - 5);
  doc.text('Signature:', signatureBoxX + 2, yPosition + 15);
  doc.text('Date: _______________', signatureBoxX + 2, yPosition + 30);
  
  // Company name below signature box
  doc.setFontSize(9);
  doc.setTextColor(50, 50, 50);
  doc.text('Dipak Kumar Sao & Associates', signatureBoxX + 2, yPosition + 50);
  
  // Footer - ensure it's positioned properly
  yPosition += 60;
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
  
  // Aggressive download approach - multiple simultaneous methods
  console.log(`Attempting PDF download: ${filename}`);
  
  // Create blob first (most reliable)
  const pdfBlob = doc.output('blob');
  const blobUrl = URL.createObjectURL(pdfBlob);
  
  // Method 1: Native jsPDF save
  try {
    doc.save(filename);
    console.log(`✓ jsPDF save attempted: ${filename}`);
  } catch (e) {
    console.warn('jsPDF save failed:', e);
  }
  
  // Method 2: Blob download with aggressive click simulation
  const downloadLink = document.createElement('a');
  downloadLink.href = blobUrl;
  downloadLink.download = filename;
  downloadLink.style.position = 'fixed';
  downloadLink.style.top = '-1000px';
  downloadLink.style.left = '-1000px';
  
  // Attach to DOM
  document.body.appendChild(downloadLink);
  
  // Multiple click attempts
  downloadLink.click();
  
  // Force click events
  ['mousedown', 'mouseup', 'click'].forEach(eventType => {
    const event = new MouseEvent(eventType, {
      view: window,
      bubbles: true,
      cancelable: true,
      buttons: 1
    });
    downloadLink.dispatchEvent(event);
  });
  
  console.log(`✓ Blob download attempted: ${filename}`);
  
  // Method 3: Data URI approach (immediate)
  setTimeout(() => {
    try {
      const dataUri = doc.output('datauristring');
      const dataLink = document.createElement('a');
      dataLink.href = dataUri;
      dataLink.download = filename;
      document.body.appendChild(dataLink);
      dataLink.click();
      document.body.removeChild(dataLink);
      console.log(`✓ Data URI download attempted: ${filename}`);
    } catch (e) {
      console.warn('Data URI download failed:', e);
    }
  }, 50);
  
  // Method 4: Window.open approach (last resort)
  setTimeout(() => {
    try {
      const newWindow = window.open(blobUrl, '_blank');
      if (newWindow) {
        newWindow.document.title = filename;
        console.log(`✓ Window.open attempted: ${filename}`);
      }
    } catch (e) {
      console.warn('Window.open failed:', e);
    }
  }, 100);
  
  // Cleanup after delay
  setTimeout(() => {
    try {
      document.body.removeChild(downloadLink);
    } catch (e) {
      // Link may already be removed
    }
    URL.revokeObjectURL(blobUrl);
  }, 5000);
  
  console.log(`📄 PDF download process completed for: ${filename}`);
}
