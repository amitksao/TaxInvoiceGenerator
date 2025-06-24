import { Card, CardContent } from "@/components/ui/card";
import { File, Circle } from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import type { CreateInvoice } from "@shared/schema";
import logoImage from "@assets/8944800c-f7c0-4823-a996-e72890d14956_1750803319943.jpeg";

interface InvoicePreviewProps {
  invoiceData: CreateInvoice;
}

export default function InvoicePreview({ invoiceData }: InvoicePreviewProps) {
  const currentDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 15);
  const dueDateFormatted = dueDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const invoiceNumber = `INV-${new Date().getFullYear()}-001`;

  const calculateTotal = () => {
    const taxReturn = parseFloat(invoiceData.taxReturnCharges || "0");
    const accounting = parseFloat(invoiceData.accountingCharges || "0");
    const audit = parseFloat(invoiceData.auditFee || "0");
    const additional = invoiceData.additionalCharges.reduce((sum, charge) => sum + (charge.amount || 0), 0);
    return taxReturn + accounting + audit + additional;
  };

  const getServices = () => {
    const services = [];
    
    const taxReturn = parseFloat(invoiceData.taxReturnCharges || "0");
    if (taxReturn > 0) {
      services.push({ description: "Tax Return Filing", amount: taxReturn });
    }
    
    const accounting = parseFloat(invoiceData.accountingCharges || "0");
    if (accounting > 0) {
      services.push({ description: "Accounting Services", amount: accounting });
    }
    
    const audit = parseFloat(invoiceData.auditFee || "0");
    if (audit > 0) {
      services.push({ description: "Audit Services", amount: audit });
    }
    
    invoiceData.additionalCharges.forEach((charge) => {
      if (charge.label && charge.amount > 0) {
        services.push({ description: charge.label, amount: charge.amount });
      }
    });
    
    return services;
  };

  const services = getServices();
  const totalAmount = calculateTotal();

  return (
    <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Invoice Preview</h2>
          <div className="flex items-center space-x-2">
            <Circle className="w-2 h-2 bg-app-accent rounded-full fill-current text-app-accent" />
            <span className="text-sm text-gray-500">Live Preview</span>
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg p-6 bg-white">
          {/* Invoice Header */}
          <div className="flex items-start justify-between mb-8">
            <div className="flex items-center space-x-3">
              <div className="w-16 h-16 rounded-lg overflow-hidden">
                <img 
                  src={logoImage} 
                  alt="Company Logo" 
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Tax Consultation Services</h3>
                <p className="text-gray-600">Professional Tax & Accounting Solutions</p>
              </div>
            </div>
            <div className="text-right">
              <h3 className="text-2xl font-bold text-app-primary">INVOICE</h3>
              <p className="text-gray-600">Invoice #: {invoiceNumber}</p>
            </div>
          </div>

          {/* Client & Service Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Bill To:</h4>
              <div className="text-gray-600">
                <p>[Client Name]</p>
                <p>[Client Address]</p>
                <p>[City, State, PIN]</p>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Service Details:</h4>
              <div className="text-gray-600">
                <p>Assessment Year: <span>{invoiceData.assessmentYear || "-"}</span></p>
                <p>Date: <span>{currentDate}</span></p>
                <p>Due Date: <span>{dueDateFormatted}</span></p>
              </div>
            </div>
          </div>

          {/* Services Table */}
          <div className="overflow-x-auto mb-8">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-3 px-2 font-semibold text-gray-900">Description</th>
                  <th className="text-right py-3 px-2 font-semibold text-gray-900">Amount</th>
                </tr>
              </thead>
              <tbody>
                {services.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="text-center py-4 text-gray-500">
                      No services added yet
                    </td>
                  </tr>
                ) : (
                  services.map((service, index) => (
                    <tr key={index} className="border-b border-gray-100">
                      <td className="py-2 px-2 text-gray-600">{service.description}</td>
                      <td className="py-2 px-2 text-right text-gray-900">
                        {formatCurrency(service.amount)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Total Section */}
          <div className="border-t-2 border-gray-200 pt-4">
            <div className="flex justify-end">
              <div className="w-64">
                <div className="flex justify-between items-center py-2">
                  <span className="font-semibold text-gray-900">Subtotal:</span>
                  <span className="text-gray-900">{formatCurrency(totalAmount)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-t border-gray-200">
                  <span className="text-lg font-bold text-gray-900">Total Amount:</span>
                  <span className="text-lg font-bold text-app-primary">
                    {formatCurrency(totalAmount)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="text-center text-sm text-gray-500">
              <p>Thank you for your business!</p>
              <p>For any queries, please contact us at [email] or [phone]</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
