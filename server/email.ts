import sgMail from '@sendgrid/mail';
import jsPDF from 'jspdf';
import type { Invoice } from '@shared/schema';

if (!process.env.SENDGRID_API_KEY) {
  console.warn("SENDGRID_API_KEY environment variable not set - email functionality disabled");
} else {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

interface EmailParams {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
  attachments?: Array<{
    content: string;
    filename: string;
    type: string;
    disposition: string;
  }>;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  if (!process.env.SENDGRID_API_KEY) {
    throw new Error("SendGrid API key not configured");
  }

  try {
    await sgMail.send(params);
    return true;
  } catch (error) {
    console.error('SendGrid email error:', error);
    return false;
  }
}

// Generate PDF as base64 string for email attachment
function generateInvoicePDFBuffer(invoice: Invoice): string {
  const doc = new jsPDF();
  
  // Set font
  doc.setFont('helvetica', 'normal');
  
  // Company header - centered
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text('Dipak Kumar Sao & Associates', 105, 25, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text('(Advocate & Tax Consultant)', 105, 32, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text('dipakadv.sao@gmail.com or 9778780582/9434001881', 105, 39, { align: 'center' });
  
  // Separator line
  doc.line(20, 45, 190, 45);
  
  // Invoice header
  doc.setFontSize(20);
  doc.setTextColor(25, 118, 210);
  doc.text('INVOICE', 20, 60);
  
  // Invoice details
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text(`Invoice #: ${invoice.invoiceNumber}`, 150, 60);
  doc.text(`Date: ${new Date(invoice.createdAt).toLocaleDateString()}`, 150, 68);
  doc.text(`Assessment Year: ${invoice.assessmentYear}`, 150, 76);
  
  // Client info
  doc.setFontSize(12);
  doc.text('Bill To:', 20, 90);
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text(invoice.clientName, 20, 100);
  doc.text(invoice.clientAddress, 20, 108);
  doc.text(`${invoice.clientCity}, ${invoice.clientState}, ${invoice.clientPin}`, 20, 116);
  
  let clientInfoY = 124;
  if (invoice.clientEmail) {
    doc.text(`Email: ${invoice.clientEmail}`, 20, clientInfoY);
    clientInfoY += 8;
  }
  if (invoice.clientPhone) {
    doc.text(`Phone: ${invoice.clientPhone}`, 20, clientInfoY);
    clientInfoY += 8;
  }
  
  // Services table header
  let yPosition = Math.max(140, clientInfoY + 10);
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
    doc.text(`₹${parseFloat(invoice.taxReturnCharges).toLocaleString('en-IN')}`, 150, yPosition);
    yPosition += 10;
  }
  
  // Accounting charges
  if (parseFloat(invoice.accountingCharges || '0') > 0) {
    doc.text('Accounting Services', 20, yPosition);
    doc.text(`₹${parseFloat(invoice.accountingCharges!).toLocaleString('en-IN')}`, 150, yPosition);
    yPosition += 10;
  }
  
  // Audit fee
  if (parseFloat(invoice.auditFee || '0') > 0) {
    doc.text('Audit Services', 20, yPosition);
    doc.text(`₹${parseFloat(invoice.auditFee!).toLocaleString('en-IN')}`, 150, yPosition);
    yPosition += 10;
  }
  
  // Additional charges
  additionalCharges.forEach((charge: any) => {
    if (charge.label && charge.amount > 0) {
      doc.text(charge.label, 20, yPosition);
      doc.text(`₹${charge.amount.toLocaleString('en-IN')}`, 150, yPosition);
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
  doc.text(`₹${parseFloat(invoice.totalAmount).toLocaleString('en-IN')}`, 150, yPosition);
  
  // Footer
  yPosition += 30;
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text('Thank you for your business!', 105, yPosition, { align: 'center' });
  doc.text('For any queries, please contact us at dipakadv.sao@gmail.com or 9778780582/9434001881', 105, yPosition + 8, { align: 'center' });
  
  // Return as base64 string
  return doc.output('datauristring').split(',')[1];
}

export async function sendInvoiceEmail(invoice: Invoice): Promise<boolean> {
  if (!invoice.clientEmail) {
    throw new Error("Client email is required to send invoice");
  }

  const clientName = invoice.clientName.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_');
  const filename = `${clientName}_${invoice.invoiceNumber}_${invoice.assessmentYear}.pdf`;
  
  const pdfBuffer = generateInvoicePDFBuffer(invoice);
  
  const emailParams: EmailParams = {
    to: invoice.clientEmail,
    from: 'dipakadv.sao@gmail.com',
    subject: `Tax Invoice ${invoice.invoiceNumber} - ${invoice.assessmentYear}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1976D2;">Tax Invoice - ${invoice.invoiceNumber}</h2>
        
        <p>Dear ${invoice.clientName},</p>
        
        <p>Thank you for choosing our services. Please find attached your tax invoice for the assessment year ${invoice.assessmentYear}.</p>
        
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0; color: #333;">Invoice Summary</h3>
          <p style="margin: 5px 0;"><strong>Invoice Number:</strong> ${invoice.invoiceNumber}</p>
          <p style="margin: 5px 0;"><strong>Date:</strong> ${new Date(invoice.createdAt).toLocaleDateString('en-IN')}</p>
          <p style="margin: 5px 0;"><strong>Assessment Year:</strong> ${invoice.assessmentYear}</p>
          <p style="margin: 5px 0;"><strong>Total Amount:</strong> ₹${parseFloat(invoice.totalAmount).toLocaleString('en-IN')}</p>
        </div>
        
        <p>Services provided:</p>
        <ul>
          ${parseFloat(invoice.taxReturnCharges) > 0 ? `<li>Tax Return Filing - ₹${parseFloat(invoice.taxReturnCharges).toLocaleString('en-IN')}</li>` : ''}
          ${invoice.accountingCharges && parseFloat(invoice.accountingCharges) > 0 ? `<li>Accounting Services - ₹${parseFloat(invoice.accountingCharges).toLocaleString('en-IN')}</li>` : ''}
          ${invoice.auditFee && parseFloat(invoice.auditFee) > 0 ? `<li>Audit Services - ₹${parseFloat(invoice.auditFee).toLocaleString('en-IN')}</li>` : ''}
        </ul>
        
        <p>If you have any questions about this invoice, please don't hesitate to contact us.</p>
        
        <div style="border-top: 1px solid #ddd; padding-top: 20px; margin-top: 30px;">
          <p style="margin: 0;"><strong>Dipak Kumar Sao & Associates</strong></p>
          <p style="margin: 5px 0;">(Advocate & Tax Consultant)</p>
          <p style="margin: 5px 0;">Email: dipakadv.sao@gmail.com</p>
          <p style="margin: 5px 0;">Mobile: 9778780582/9434001881</p>
        </div>
      </div>
    `,
    text: `
      Tax Invoice - ${invoice.invoiceNumber}
      
      Dear ${invoice.clientName},
      
      Thank you for choosing our services. Please find attached your tax invoice for the assessment year ${invoice.assessmentYear}.
      
      Invoice Details:
      - Invoice Number: ${invoice.invoiceNumber}
      - Date: ${new Date(invoice.createdAt).toLocaleDateString('en-IN')}
      - Assessment Year: ${invoice.assessmentYear}
      - Total Amount: ₹${parseFloat(invoice.totalAmount).toLocaleString('en-IN')}
      
      For any queries, please contact us at dipakadv.sao@gmail.com or 9778780582/9434001881.
      
      Best regards,
      Dipak Kumar Sao & Associates
      (Advocate & Tax Consultant)
    `,
    attachments: [
      {
        content: pdfBuffer,
        filename: filename,
        type: 'application/pdf',
        disposition: 'attachment'
      }
    ]
  };
  
  return await sendEmail(emailParams);
}