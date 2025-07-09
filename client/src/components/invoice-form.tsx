import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Eye, FileText, Search, User } from "lucide-react";
import logoImage from "@assets/8944800c-f7c0-4823-a996-e72890d14956_1750803319943.jpeg";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { createInvoiceSchema, type CreateInvoice, type Client } from "@shared/schema";
import { apiRequest, getQueryFn } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/currency";
import { generateInvoicePDF } from "@/lib/pdf-generator";

interface InvoiceFormProps {
  invoiceData: CreateInvoice;
  setInvoiceData: (data: CreateInvoice) => void;
  editMode?: boolean;
  editInvoiceId?: number | null;
  originalInvoiceNumber?: string;
}

export default function InvoiceForm({ 
  invoiceData, 
  setInvoiceData, 
  editMode = false, 
  editInvoiceId = null,
  originalInvoiceNumber = ""
}: InvoiceFormProps) {
  const [invoiceNumber] = useState(editMode ? originalInvoiceNumber : `INV-${new Date().getFullYear()}-001`);
  const [isClientSearchOpen, setIsClientSearchOpen] = useState(false);
  const [clientSearchQuery, setClientSearchQuery] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<CreateInvoice>({
    resolver: zodResolver(createInvoiceSchema),
    defaultValues: invoiceData,
  });

  // Fetch clients for search
  const { data: clients } = useQuery({
    queryKey: ["/api/clients", clientSearchQuery],
    queryFn: getQueryFn({ on401: "throw" }),
    select: (data) => data as Client[],
    enabled: isClientSearchOpen,
  });

  const createInvoiceMutation = useMutation({
    mutationFn: async (data: CreateInvoice) => {
      const response = await apiRequest("POST", "/api/invoices", data);
      return await response.json();
    },
    onSuccess: (invoice) => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      
      // Generate and download PDF to local download folder
      try {
        const filename = `${invoice.clientName.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_')}_${invoice.invoiceNumber}_${invoice.assessmentYear}.pdf`;
        
        generateInvoicePDF(invoice);
        
        toast({
          title: "Invoice Created",
          description: `Invoice saved and PDF downloaded to your Downloads folder as: ${filename}`,
        });
        
        // Show additional success message after brief delay
        setTimeout(() => {
          toast({
            title: "PDF Ready",
            description: `Check your Downloads folder for ${filename}`,
          });
        }, 1500);
        
      } catch (error) {
        console.error("PDF download error:", error);
        toast({
          title: "Invoice Created",
          description: "Invoice saved successfully, but PDF download failed. Try downloading from invoice history.",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateInvoiceMutation = useMutation({
    mutationFn: async (data: CreateInvoice) => {
      const response = await apiRequest("PUT", `/api/invoices/${editInvoiceId}`, data);
      return await response.json();
    },
    onSuccess: (invoice) => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      
      // Generate and download PDF to local download folder
      try {
        const filename = `${invoice.clientName.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_')}_${invoice.invoiceNumber}_${invoice.assessmentYear}.pdf`;
        
        generateInvoicePDF(invoice);
        
        toast({
          title: "Invoice Updated",
          description: `Invoice updated and PDF downloaded to your Downloads folder as: ${filename}`,
        });
        
        // Navigate back to invoice history after successful update
        setTimeout(() => {
          window.location.href = '/invoices';
        }, 2000);
        
      } catch (error) {
        console.error("PDF download error:", error);
        toast({
          title: "Invoice Updated",
          description: "Invoice updated successfully, but PDF download failed. Try downloading from invoice history.",
          variant: "destructive",
        });
        
        // Navigate back to invoice history after successful update
        setTimeout(() => {
          window.location.href = '/invoices';
        }, 2000);
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const calculateTotal = () => {
    const taxReturn = parseFloat(invoiceData.taxReturnCharges || "0");
    const accounting = parseFloat(invoiceData.accountingCharges || "0");
    const audit = parseFloat(invoiceData.auditFee || "0");
    const additional = invoiceData.additionalCharges.reduce((sum, charge) => sum + (charge.amount || 0), 0);
    return taxReturn + accounting + audit + additional;
  };

  const handleInputChange = (field: keyof CreateInvoice, value: any) => {
    const newData = { ...invoiceData, [field]: value };
    setInvoiceData(newData);
    form.setValue(field, value);
  };

  const handleAdditionalChargeChange = (index: number, field: 'label' | 'amount', value: string | number) => {
    const newAdditionalCharges = [...invoiceData.additionalCharges];
    newAdditionalCharges[index] = {
      ...newAdditionalCharges[index],
      [field]: value,
    };
    handleInputChange('additionalCharges', newAdditionalCharges);
  };

  const onSubmit = (data: CreateInvoice) => {
    if (!data.assessmentYear) {
      toast({
        title: "Validation Error",
        description: "Please select an Assessment Year",
        variant: "destructive",
      });
      return;
    }

    if (!data.clientName) {
      toast({
        title: "Validation Error",
        description: "Please enter Client Name",
        variant: "destructive",
      });
      return;
    }

    if (!data.taxReturnCharges || parseFloat(data.taxReturnCharges) <= 0) {
      toast({
        title: "Validation Error",
        description: "Please enter Tax Return Charges",
        variant: "destructive",
      });
      return;
    }

    if (editMode) {
      updateInvoiceMutation.mutate(data);
    } else {
      createInvoiceMutation.mutate(data);
    }
  };

  const handlePreview = () => {
    toast({
      title: "Preview Updated",
      description: "Invoice preview has been refreshed",
    });
  };

  const handleSelectClient = (client: Client) => {
    const clientData = {
      clientName: client.name,
      clientAddress: client.address,
      clientCity: client.city,
      clientState: client.state,
      clientPin: client.pin,
      clientEmail: client.email || "",
      clientPhone: client.phone || "",
    };

    // Update form values - convert null to undefined for form compatibility
    Object.entries(clientData).forEach(([key, value]) => {
      form.setValue(key as keyof CreateInvoice, value || undefined);
    });

    // Update invoice data state - convert null to undefined for form compatibility  
    const convertedClientData = Object.fromEntries(
      Object.entries(clientData).map(([key, value]) => [key, value || undefined])
    );
    setInvoiceData({ ...invoiceData, ...convertedClientData });
    
    setIsClientSearchOpen(false);
    setClientSearchQuery("");
    
    toast({
      title: "Client Selected",
      description: `${client.name}'s information has been populated`,
    });
  };

  return (
    <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {editMode ? "Edit Invoice" : "Create Invoice"}
          </h2>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <span>Invoice #</span>
            <span className="font-mono bg-gray-100 px-2 py-1 rounded">{invoiceNumber}</span>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Assessment Year */}
            <FormField
              control={form.control}
              name="assessmentYear"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">
                    Assessment Year <span className="text-red-500">*</span>
                  </FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      handleInputChange('assessmentYear', value);
                    }}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Assessment Year" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="2025-26">2025-26</SelectItem>
                      <SelectItem value="2024-25">2024-25</SelectItem>
                      <SelectItem value="2023-24">2023-24</SelectItem>
                      <SelectItem value="2022-23">2022-23</SelectItem>
                      <SelectItem value="2021-22">2021-22</SelectItem>
                      <SelectItem value="2020-21">2020-21</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Client Information Section */}
            <div className="border-t pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Client Information</h3>
                <Dialog open={isClientSearchOpen} onOpenChange={setIsClientSearchOpen}>
                  <DialogTrigger asChild>
                    <Button type="button" variant="outline" size="sm">
                      <Search className="w-4 h-4 mr-2" />
                      Search Existing Client
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Select Existing Client</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Search clients by name, email, or phone..."
                          value={clientSearchQuery}
                          onChange={(e) => setClientSearchQuery(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      <div className="max-h-96 overflow-y-auto space-y-2">
                        {clients?.filter(client => 
                          !clientSearchQuery || 
                          client.name.toLowerCase().includes(clientSearchQuery.toLowerCase()) ||
                          client.email?.toLowerCase().includes(clientSearchQuery.toLowerCase()) ||
                          client.phone?.includes(clientSearchQuery)
                        ).map(client => (
                          <div
                            key={client.id}
                            className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                            onClick={() => handleSelectClient(client)}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-900">{client.name}</h4>
                                <p className="text-sm text-gray-600">{client.email}</p>
                                <p className="text-sm text-gray-500">
                                  {client.address}, {client.city}, {client.state}, {client.pin}
                                </p>
                                {client.phone && <p className="text-sm text-gray-500">📞 {client.phone}</p>}
                              </div>
                              <User className="w-5 h-5 text-gray-400" />
                            </div>
                          </div>
                        ))}
                        {clients?.length === 0 && (
                          <div className="text-center py-8 text-gray-500">
                            <User className="mx-auto h-12 w-12 text-gray-300" />
                            <p className="mt-2">No clients found</p>
                            <p className="text-sm">Try adjusting your search query</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              
              {/* Compact Client Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <FormField
                  control={form.control}
                  name="clientName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">
                        Client Name <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter client name"
                          {...field}
                          onChange={(e) => {
                            field.onChange(e.target.value);
                            handleInputChange('clientName', e.target.value);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="clientAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">
                        Address
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter full address"
                          {...field}
                          onChange={(e) => {
                            field.onChange(e.target.value);
                            handleInputChange('clientAddress', e.target.value);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                <FormField
                  control={form.control}
                  name="clientCity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">
                        City
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="City"
                          {...field}
                          onChange={(e) => {
                            field.onChange(e.target.value);
                            handleInputChange('clientCity', e.target.value);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="clientState"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">
                        State
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="State"
                          {...field}
                          onChange={(e) => {
                            field.onChange(e.target.value);
                            handleInputChange('clientState', e.target.value);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="clientPin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">
                        PIN
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="PIN Code"
                          {...field}
                          onChange={(e) => {
                            field.onChange(e.target.value);
                            handleInputChange('clientPin', e.target.value);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="clientEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">
                        Email
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="Email"
                          {...field}
                          onChange={(e) => {
                            field.onChange(e.target.value);
                            handleInputChange('clientEmail', e.target.value);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="clientPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">
                        Phone
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Phone"
                          {...field}
                          onChange={(e) => {
                            field.onChange(e.target.value);
                            handleInputChange('clientPhone', e.target.value);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Fees Section */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Fees</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Tax Return Charges */}
                <FormField
                  control={form.control}
                  name="taxReturnCharges"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">
                        Tax Return Charges <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-2 text-gray-500">₹</span>
                          <Input
                            type="number"
                            step="0.01"
                            className="pl-8"
                            placeholder="0.00"
                            {...field}
                            onChange={(e) => {
                              field.onChange(e.target.value);
                              handleInputChange('taxReturnCharges', e.target.value);
                            }}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Accounting Charges */}
                <FormField
                  control={form.control}
                  name="accountingCharges"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">
                        Accounting Charges
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-2 text-gray-500">₹</span>
                          <Input
                            type="number"
                            step="0.01"
                            className="pl-8"
                            placeholder="0.00"
                            {...field}
                            onChange={(e) => {
                              field.onChange(e.target.value);
                              handleInputChange('accountingCharges', e.target.value);
                            }}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Audit Fee */}
                <FormField
                  control={form.control}
                  name="auditFee"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">
                        Audit Fee
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-2 text-gray-500">₹</span>
                          <Input
                            type="number"
                            step="0.01"
                            className="pl-8"
                            placeholder="0.00"
                            {...field}
                            onChange={(e) => {
                              field.onChange(e.target.value);
                              handleInputChange('auditFee', e.target.value);
                            }}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Additional Charges */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Charges</h3>
              
              {[0, 1, 2].map((index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">
                      Service Description
                    </Label>
                    <Input
                      placeholder={`e.g., ${index === 0 ? 'GST Filing' : index === 1 ? 'Consultation Fee' : 'Document Preparation'}`}
                      value={invoiceData.additionalCharges[index].label}
                      onChange={(e) => handleAdditionalChargeChange(index, 'label', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">
                      Amount
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-gray-500">₹</span>
                      <Input
                        type="number"
                        step="0.01"
                        className="pl-8"
                        placeholder="0.00"
                        value={invoiceData.additionalCharges[index].amount || ''}
                        onChange={(e) => handleAdditionalChargeChange(index, 'amount', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Total Display */}
            <div className="border-t pt-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-700">Total Amount:</span>
                  <span className="text-2xl font-bold text-app-primary">
                    {formatCurrency(calculateTotal())}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={handlePreview}
                className="flex items-center justify-center px-6 py-3"
              >
                <Eye className="w-4 h-4 mr-2" />
                Preview Invoice
              </Button>
              <Button
                type="submit"
                disabled={createInvoiceMutation.isPending || updateInvoiceMutation.isPending}
                className="flex items-center justify-center px-6 py-3"
              >
                <FileText className="w-4 h-4 mr-2" />
                {editMode 
                  ? (updateInvoiceMutation.isPending ? "Updating..." : "Update & Download PDF")
                  : (createInvoiceMutation.isPending ? "Generating..." : "Generate & Download PDF")
                }
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
