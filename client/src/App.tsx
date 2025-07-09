import { Switch, Route, Link, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { FileText, Users, History } from "lucide-react";
import InvoiceGenerator from "@/pages/invoice-generator";
import Clients from "@/pages/clients";
import Invoices from "@/pages/invoices";
import NotFound from "@/pages/not-found";

function Router() {
  const [location] = useLocation();

  return (
    <>
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex space-x-8">
              <Link href="/">
                <Button 
                  variant={location === "/" ? "default" : "ghost"} 
                  className="flex items-center space-x-2"
                >
                  <FileText className="w-4 h-4" />
                  <span>Invoice Generator</span>
                </Button>
              </Link>
              <Link href="/invoices">
                <Button 
                  variant={location === "/invoices" ? "default" : "ghost"} 
                  className="flex items-center space-x-2"
                >
                  <History className="w-4 h-4" />
                  <span>Invoice History</span>
                </Button>
              </Link>
              <Link href="/clients">
                <Button 
                  variant={location === "/clients" ? "default" : "ghost"} 
                  className="flex items-center space-x-2"
                >
                  <Users className="w-4 h-4" />
                  <span>Clients</span>
                </Button>
              </Link>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Tax Invoice Generator
              </span>
            </div>
          </div>
        </div>
      </nav>
      
      {/* Routes */}
      <Switch>
        <Route path="/" component={InvoiceGenerator} />
        <Route path="/invoices" component={Invoices} />
        <Route path="/clients" component={Clients} />
        <Route component={NotFound} />
      </Switch>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
