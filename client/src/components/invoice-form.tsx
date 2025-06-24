import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Eye, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { createInvoiceSchema, type CreateInvoice } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/currency";
import { generateInvoicePDF } from "@/lib/pdf-generator";

interface InvoiceFormProps {
  invoiceData: CreateInvoice;
  setInvoiceData: (data: CreateInvoice) => void;
}

export default function InvoiceForm({ invoiceData, setInvoiceData }: InvoiceFormProps) {
  const [invoiceNumber] = useState(`INV-${new Date().getFullYear()}-001`);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<CreateInvoice>({
    resolver: zodResolver(createInvoiceSchema),
    defaultValues: invoiceData,
  });

  const createInvoiceMutation = useMutation({
    mutationFn: async (data: CreateInvoice) => {
      const response = await apiRequest("POST", "/api/invoices", data);
      return response.json();
    },
    onSuccess: (invoice) => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      generateInvoicePDF(invoice);
      toast({
        title: "Success",
        description: "Invoice generated and PDF downloaded successfully!",
      });
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

    if (!data.taxReturnCharges || parseFloat(data.taxReturnCharges) <= 0) {
      toast({
        title: "Validation Error",
        description: "Please enter Tax Return Charges",
        variant: "destructive",
      });
      return;
    }

    createInvoiceMutation.mutate(data);
  };

  const handlePreview = () => {
    toast({
      title: "Preview Updated",
      description: "Invoice preview has been refreshed",
    });
  };

  return (
    <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Create Invoice</h2>
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
                        min="0"
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
                    Accounting Charges (if applicable)
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-gray-500">₹</span>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
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
                    Audit Fee (if applicable)
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-gray-500">₹</span>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
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
                        min="0"
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
                disabled={createInvoiceMutation.isPending}
                className="flex items-center justify-center px-6 py-3"
              >
                <FileText className="w-4 h-4 mr-2" />
                {createInvoiceMutation.isPending ? "Generating..." : "Generate & Download PDF"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
