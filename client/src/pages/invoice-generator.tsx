import { useState, useEffect } from "react";
import { Calculator, Calendar, Download, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import InvoiceForm from "@/components/invoice-form";
import InvoicePreview from "@/components/invoice-preview";
import type { CreateInvoice } from "@shared/schema";
import { generateInvoicePDF } from "@/lib/pdf-generator";
import { useToast } from "@/hooks/use-toast";
import logoImage from "@assets/8944800c-f7c0-4823-a996-e72890d14956_1750803319943.jpeg";

export default function InvoiceGenerator() {
  const { toast } = useToast();
  const [editMode, setEditMode] = useState(false);
  const [editInvoiceId, setEditInvoiceId] = useState<number | null>(null);
  const [originalInvoiceNumber, setOriginalInvoiceNumber] = useState<string>("");
  
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

  // Check for edit mode on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get('mode');
    
    if (mode === 'edit') {
      const editData = sessionStorage.getItem('editInvoiceData');
      if (editData) {
        try {
          const parsedData = JSON.parse(editData);
          setEditMode(true);
          setEditInvoiceId(parsedData.id);
          setOriginalInvoiceNumber(parsedData.invoiceNumber);
          
          // Ensure additional charges array has 3 items
          const additionalCharges = parsedData.additionalCharges || [];
          while (additionalCharges.length < 3) {
            additionalCharges.push({ label: "", amount: 0 });
          }
          
          setInvoiceData({
            assessmentYear: parsedData.assessmentYear || "",
            clientName: parsedData.clientName || "",
            clientAddress: parsedData.clientAddress || "",
            clientCity: parsedData.clientCity || "",
            clientState: parsedData.clientState || "",
            clientPin: parsedData.clientPin || "",
            clientEmail: parsedData.clientEmail || "",
            clientPhone: parsedData.clientPhone || "",
            taxReturnCharges: parsedData.taxReturnCharges || "",
            accountingCharges: parsedData.accountingCharges || "",
            auditFee: parsedData.auditFee || "",
            additionalCharges: additionalCharges.slice(0, 3),
          });
          
          // Clear sessionStorage after loading
          sessionStorage.removeItem('editInvoiceData');
        } catch (error) {
          console.error('Error parsing edit data:', error);
          toast({
            title: "Error Loading Invoice",
            description: "Failed to load invoice data for editing.",
            variant: "destructive",
          });
        }
      }
    }
  }, [toast]);

  const handleDownloadPreview = () => {
    if (!invoiceData.clientName || !invoiceData.assessmentYear) {
      toast({
        title: "Incomplete Invoice",
        description: "Please fill in client name and assessment year before downloading.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Convert form data to invoice format for PDF generation
      const previewInvoice = {
        id: 0,
        invoiceNumber: "PREVIEW",
        assessmentYear: invoiceData.assessmentYear,
        clientName: invoiceData.clientName,
        clientAddress: invoiceData.clientAddress,
        clientCity: invoiceData.clientCity,
        clientState: invoiceData.clientState,
        clientPin: invoiceData.clientPin,
        clientEmail: invoiceData.clientEmail,
        clientPhone: invoiceData.clientPhone,
        taxReturnCharges: parseFloat(invoiceData.taxReturnCharges) || 0,
        accountingCharges: parseFloat(invoiceData.accountingCharges) || 0,
        auditFee: parseFloat(invoiceData.auditFee) || 0,
        additionalCharges: JSON.stringify(invoiceData.additionalCharges.filter(charge => charge.label && charge.amount > 0)),
        totalAmount: (
          (parseFloat(invoiceData.taxReturnCharges) || 0) +
          (parseFloat(invoiceData.accountingCharges) || 0) +
          (parseFloat(invoiceData.auditFee) || 0) +
          invoiceData.additionalCharges.reduce((sum, charge) => sum + charge.amount, 0)
        ).toString(),
        createdAt: new Date().toISOString(),
      };

      generateInvoicePDF(previewInvoice);
      
      const filename = `${invoiceData.clientName.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_')}_Preview_${invoiceData.assessmentYear}.pdf`;
      toast({
        title: "Preview Downloaded",
        description: `Preview PDF downloaded to your Downloads folder as: ${filename}`,
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "Download Failed",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleBackToHistory = () => {
    window.location.href = '/invoices';
  };

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
              {editMode && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBackToHistory}
                  className="mr-2"
                >
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Back to History
                </Button>
              )}
              <div className="w-12 h-12 rounded-lg overflow-hidden">
                <img 
                  src={logoImage} 
                  alt="Company Logo" 
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {editMode ? `Edit Invoice ${originalInvoiceNumber}` : "Dipak Kumar Sao & Associates"}
                </h1>
                <p className="text-sm text-app-secondary">
                  {editMode ? "Update invoice details and charges" : "Tax Invoice Generator"}
                </p>
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
          <InvoiceForm 
            invoiceData={invoiceData} 
            setInvoiceData={setInvoiceData} 
            editMode={editMode}
            editInvoiceId={editInvoiceId}
            originalInvoiceNumber={originalInvoiceNumber}
          />
          
          {/* Preview Section with Download */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Calculator className="w-5 h-5 text-primary" />
                Invoice Preview
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleDownloadPreview();
                }}
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download Preview
              </Button>
            </div>
            <InvoicePreview invoiceData={invoiceData} />
          </div>
        </div>
      </div>
    </div>
  );
}
