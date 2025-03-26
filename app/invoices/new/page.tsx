"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { InvoiceStatus } from "@prisma/client";

type PurchaseOrder = {
  id: string;
  poNumber: string;
  clientName: string;
  amount: number;
  status: string;
  uploadedAt: string;
};

export default function NewInvoicePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const poId = searchParams.get("poId");
  
  const [isLoading, setIsLoading] = useState(false);
  const [po, setPo] = useState<PurchaseOrder | null>(null);
  const [formData, setFormData] = useState({
    invoiceNumber: "",
    notes: ""
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (session?.user?.role !== "ACCOUNTS") {
      router.push("/dashboard");
      return;
    }

    if (poId) {
      // Get PO from localStorage instead of using static mock data
      const purchaseOrders = JSON.parse(localStorage.getItem('purchaseOrders') || '[]');
      const foundPO = purchaseOrders.find((po: any) => po.id === poId);
      
      if (foundPO) {
        setPo(foundPO);
        setFormData({
          invoiceNumber: `INV-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
          notes: ""
        });
      }
    }
  }, [poId, router, session, status]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!po) return;
    
    setIsLoading(true);
    
    try {
      // Create a new invoice object with a proper random ID
      const newInvoice = {
        id: Math.random().toString(36).substr(2, 9), // Simple random ID for demo
        invoiceNumber: formData.invoiceNumber,
        poNumber: po.poNumber,
        clientName: po.clientName,
        amount: po.amount,
        status: "PENDING" as InvoiceStatus,
        generatedAt: new Date().toISOString(),
        fileUrl: "/mock-invoice.pdf", // Mock file URL
        notes: formData.notes
      };

      // Update the purchase order status to INVOICED
      const purchaseOrders = JSON.parse(localStorage.getItem('purchaseOrders') || '[]');
      const updatedPOs = purchaseOrders.map((purchaseOrder: any) => 
        purchaseOrder.id === po.id 
          ? { ...purchaseOrder, status: "INVOICED" } 
          : purchaseOrder
      );
      localStorage.setItem('purchaseOrders', JSON.stringify(updatedPOs));

      // Add the new invoice to existing invoices
      const existingInvoices = JSON.parse(localStorage.getItem('invoices') || '[]');
      const updatedInvoices = [newInvoice, ...existingInvoices];
      localStorage.setItem('invoices', JSON.stringify(updatedInvoices));
      
      console.log("New invoice created:", newInvoice);
      console.log("Updated PO status to INVOICED for PO:", po.id);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Redirect to invoices page after creating the invoice
      router.push("/invoices");
    } catch (error) {
      console.error("Error creating invoice:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  if (status === "loading") {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl text-gray-500">Loading...</div>
      </div>
    );
  }
  
  if (!po) {
    return (
      <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Purchase Order Not Found</h1>
          <p className="text-gray-500 mb-6">Unable to find the specified purchase order.</p>
          <Button onClick={() => router.push("/purchase-orders")}>
            Back to Purchase Orders
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Generate Invoice</h1>
        <p className="text-gray-600 mt-1">Create a new invoice for purchase order {po.poNumber}</p>
      </div>
      
      <div className="bg-white shadow-md rounded-lg p-6 mb-8 border border-gray-200">
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Purchase Order Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">PO Number</p>
              <p className="text-base font-medium">{po.poNumber}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Client</p>
              <p className="text-base font-medium">{po.clientName}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Amount</p>
              <p className="text-base font-medium">${po.amount.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Date</p>
              <p className="text-base font-medium">{new Date(po.uploadedAt).toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <h2 className="text-lg font-semibold mb-4">Invoice Information</h2>
          <div className="space-y-6">
            <div>
              <label htmlFor="invoiceNumber" className="block text-sm font-medium text-gray-700 mb-1">
                Invoice Number
              </label>
              <input
                type="text"
                id="invoiceNumber"
                name="invoiceNumber"
                value={formData.invoiceNumber}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                Notes (Optional)
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={4}
                value={formData.notes}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div className="flex justify-end mt-8 space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/purchase-orders")}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? "Generating..." : "Generate Invoice"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
} 