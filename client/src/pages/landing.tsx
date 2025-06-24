import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Users, History, Shield } from "lucide-react";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center">
              <FileText className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Invoice Management System
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Professional tax invoice generation for <strong>Dipak Kumar Sao & Associates</strong>
            <br />
            <span className="text-lg">(Advocate & Tax Consultant)</span>
          </p>
          <Button onClick={handleLogin} size="lg" className="px-8 py-3">
            <Shield className="w-5 h-5 mr-2" />
            Admin Login
          </Button>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="w-6 h-6 mr-3 text-primary" />
                Invoice Generation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Create professional tax invoices with automatic calculations, 
                custom charges, and instant PDF generation with optimized naming.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="w-6 h-6 mr-3 text-primary" />
                Client Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Manage client database with full CRUD operations, 
                search functionality, and quick client selection for invoices.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <History className="w-6 h-6 mr-3 text-primary" />
                Invoice History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Track all invoices with comprehensive search by client details, 
                invoice numbers, and assessment years.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Contact Info */}
        <div className="text-center bg-white rounded-lg p-8 shadow-lg">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Dipak Kumar Sao & Associates
          </h2>
          <p className="text-gray-600 mb-2">(Advocate & Tax Consultant)</p>
          <p className="text-gray-600 mb-2">📧 dipakadv.sao@gmail.com</p>
          <p className="text-gray-600">📞 9778780582 / 9434001881</p>
        </div>
      </div>
    </div>
  );
}