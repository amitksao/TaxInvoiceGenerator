import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, FileText, Download, Calendar, User, Trash2, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { getQueryFn, apiRequest } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/currency";
import { generateInvoicePDF } from "@/lib/pdf-generator";
import type { Invoice } from "@shared/schema";

export default function Invoices() {
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check for client filter from URL
  const urlParams = new URLSearchParams(window.location.search);
  const clientFilter = urlParams.get('client');
  
  // Set initial search if client filter exists
  useState(() => {
    if (clientFilter && !searchQuery) {
      setSearchQuery(clientFilter);
    }
  });

  // Fetch invoices
  const { data: invoices, isLoading } = useQuery({
    queryKey: ["/api/invoices"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    select: (data) => data as Invoice[],
    enabled: true,
  });

  // Filter invoices based on search query
  const filteredInvoices = invoices?.filter(invoice => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      invoice.invoiceNumber.toLowerCase().includes(query) ||
      invoice.clientName.toLowerCase().includes(query) ||
      invoice.clientEmail?.toLowerCase().includes(query) ||
      invoice.clientPhone?.includes(query) ||
      invoice.assessmentYear.includes(query) ||
      invoice.clientCity?.toLowerCase().includes(query) ||
      invoice.clientState?.toLowerCase().includes(query)
    );
  });

  const deleteInvoiceMutation = useMutation({
    mutationFn: async (invoiceId: number) => {
      await apiRequest("DELETE", `/api/invoices/${invoiceId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      toast({
        title: "Invoice Deleted",
        description: "The invoice has been successfully deleted.",
      });
    },
    onError: (error) => {
      console.error("Delete invoice error:", error);
      toast({
        title: "Delete Failed",
        description: "There was an error deleting the invoice. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleDeleteInvoice = (invoiceId: number) => {
    deleteInvoiceMutation.mutate(invoiceId);
  };

  const handleEditInvoice = (invoice: Invoice) => {
    // Navigate to invoice generator with pre-populated data
    const editData = {
      id: invoice.id,
      assessmentYear: invoice.assessmentYear,
      clientName: invoice.clientName,
      clientAddress: invoice.clientAddress || "",
      clientCity: invoice.clientCity || "",
      clientState: invoice.clientState || "",
      clientPin: invoice.clientPin || "",
      clientEmail: invoice.clientEmail || "",
      clientPhone: invoice.clientPhone || "",
      taxReturnCharges: invoice.taxReturnCharges,
      accountingCharges: invoice.accountingCharges || "0",
      auditFee: invoice.auditFee || "0",
      additionalCharges: JSON.parse(invoice.additionalCharges || '[]'),
      invoiceNumber: invoice.invoiceNumber
    };
    
    // Store the edit data in sessionStorage to pass to the generator
    sessionStorage.setItem('editInvoiceData', JSON.stringify(editData));
    
    // Navigate to invoice generator
    window.location.href = '/invoice-generator?mode=edit';
  };

  const handleDownloadPDF = async (invoice: Invoice) => {
    try {
      const clientName = invoice.clientName.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_');
      const filename = `${clientName}_${invoice.invoiceNumber}_${invoice.assessmentYear}.pdf`;
      
      // Generate PDF with proper user interaction context
      generateInvoicePDF(invoice);
      
      // Show immediate feedback
      toast({
        title: "Downloading PDF",
        description: `Saving ${filename} to your Downloads folder...`,
      });
      
      // Show success message after brief delay
      setTimeout(() => {
        toast({
          title: "PDF Downloaded",
          description: `${filename} has been saved to your Downloads folder`,
        });
      }, 1000);
      
    } catch (error) {
      console.error("PDF download error:", error);
      toast({
        title: "Download Failed",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-app-background">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <FileText className="text-primary-foreground text-lg" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Invoice History</h1>
                <p className="text-sm text-app-secondary">View and manage all invoices</p>
              </div>
            </div>
            <div className="text-sm text-gray-600">
              {filteredInvoices?.length || 0} invoice{filteredInvoices?.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by invoice number, client name, email, phone, city, state, or assessment year..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Invoice List */}
        <div className="space-y-4">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-32"></div>
                      <div className="h-3 bg-gray-200 rounded w-24"></div>
                    </div>
                    <div className="h-6 bg-gray-200 rounded w-20"></div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-full"></div>
                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : filteredInvoices?.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No invoices found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchQuery ? "Try adjusting your search query." : "Create your first invoice to get started."}
              </p>
            </div>
          ) : (
            filteredInvoices?.map((invoice) => (
              <Card key={invoice.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        {invoice.invoiceNumber}
                        <Badge variant="outline" className="text-xs">
                          {invoice.assessmentYear}
                        </Badge>
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        {formatDate(invoice.createdAt)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold text-green-600">
                        {formatCurrency(parseFloat(invoice.totalAmount))}
                      </div>
                      <div className="flex gap-2 mt-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleEditInvoice(invoice);
                          }}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleDownloadPDF(invoice);
                          }}
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Download PDF
                        </Button>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Invoice</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete invoice {invoice.invoiceNumber}? 
                                This action cannot be undone and will permanently remove the invoice data.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteInvoice(invoice.id)}
                                className="bg-red-600 hover:bg-red-700"
                                disabled={deleteInvoiceMutation.isPending}
                              >
                                {deleteInvoiceMutation.isPending ? "Deleting..." : "Delete Invoice"}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Client Information */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-gray-900">{invoice.clientName}</span>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>{invoice.clientAddress}</p>
                        <p>{invoice.clientCity}, {invoice.clientState}, {invoice.clientPin}</p>
                        {invoice.clientEmail && <p>✉️ {invoice.clientEmail}</p>}
                        {invoice.clientPhone && <p>📞 {invoice.clientPhone}</p>}
                      </div>
                    </div>

                    {/* Service Breakdown */}
                    <div>
                      <div className="text-sm space-y-1">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Tax Return Charges:</span>
                          <span className="font-medium">{formatCurrency(parseFloat(invoice.taxReturnCharges))}</span>
                        </div>
                        {invoice.accountingCharges && parseFloat(invoice.accountingCharges) > 0 && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Accounting Charges:</span>
                            <span className="font-medium">{formatCurrency(parseFloat(invoice.accountingCharges))}</span>
                          </div>
                        )}
                        {invoice.auditFee && parseFloat(invoice.auditFee) > 0 && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Audit Fee:</span>
                            <span className="font-medium">{formatCurrency(parseFloat(invoice.auditFee))}</span>
                          </div>
                        )}
                        
                        {/* Additional Charges */}
                        {(() => {
                          try {
                            const additionalCharges = JSON.parse(invoice.additionalCharges);
                            return additionalCharges
                              .filter((charge: any) => charge.label && charge.amount > 0)
                              .map((charge: any, index: number) => (
                                <div key={index} className="flex justify-between">
                                  <span className="text-gray-600">{charge.label}:</span>
                                  <span className="font-medium">{formatCurrency(charge.amount)}</span>
                                </div>
                              ));
                          } catch {
                            return null;
                          }
                        })()}
                        
                        <div className="border-t pt-1 mt-2">
                          <div className="flex justify-between font-semibold">
                            <span>Total:</span>
                            <span className="text-green-600">{formatCurrency(parseFloat(invoice.totalAmount))}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}