import { useState } from "react";
import { Calculator, Calendar } from "lucide-react";
import InvoiceForm from "@/components/invoice-form";
import InvoicePreview from "@/components/invoice-preview";
import type { CreateInvoice } from "@shared/schema";
import logoImage from "@assets/8944800c-f7c0-4823-a996-e72890d14956_1750803319943.jpeg";

export default function InvoiceGenerator() {
  const [invoiceData, setInvoiceData] = useState<CreateInvoice>({
    assessmentYear: "",
    clientName: "",
    clientAddress: "",
    clientCity: "",
    clientState: "",
    clientPin: "",
    clientEmail: "",
    clientPhone: "",
    taxReturnCharges: "",
    accountingCharges: "",
    auditFee: "",
    additionalCharges: [
      { label: "", amount: 0 },
      { label: "", amount: 0 },
      { label: "", amount: 0 },
    ],
  });

  const currentDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen bg-app-background">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-lg overflow-hidden">
                <img 
                  src={logoImage} 
                  alt="Company Logo" 
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Dipak Kumar Sao & Associates</h1>
                <p className="text-sm text-app-secondary">Tax Invoice Generator</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Calendar className="w-4 h-4" />
              <span>{currentDate}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <InvoiceForm invoiceData={invoiceData} setInvoiceData={setInvoiceData} />
          <InvoicePreview invoiceData={invoiceData} />
        </div>
      </div>
    </div>
  );
}
