import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Eye, 
  Download, 
  Share, 
  Calendar,
  Receipt,
  X,
  ChevronDown,
  FileText
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { Invoice } from '../types';
import { formatCurrency } from '../utils/calculations';

const InvoiceManager: React.FC = () => {
  const { invoices, customers } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const getCustomerName = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    return customer?.name || 'Unknown Customer';
  };

  const getDateRange = () => {
    const now = new Date();
    const ranges = {
      today: {
        start: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
        end: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
      },
      week: {
        start: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        end: now
      },
      month: {
        start: new Date(now.getFullYear(), now.getMonth(), 1),
        end: now
      },
      year: {
        start: new Date(now.getFullYear(), 0, 1),
        end: now
      }
    };
    return ranges[dateFilter as keyof typeof ranges];
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = 
      invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.items.some(item => item.productName.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = !statusFilter || invoice.status === statusFilter;

    let matchesDate = true;
    if (dateFilter && dateFilter !== 'all') {
      const range = getDateRange();
      if (range) {
        const invoiceDate = new Date(invoice.createdAt);
        matchesDate = invoiceDate >= range.start && invoiceDate <= range.end;
      }
    }

    return matchesSearch && matchesStatus && matchesDate;
  });

  const totalAmount = filteredInvoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
  const paidAmount = filteredInvoices
    .filter(inv => inv.status === 'paid')
    .reduce((sum, inv) => sum + inv.grandTotal, 0);
  const creditAmount = filteredInvoices
    .filter(inv => inv.status === 'credit')
    .reduce((sum, inv) => sum + inv.balanceDue, 0);

  const handlePrint = (invoice: Invoice) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(generatePrintableInvoice(invoice));
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleShare = (invoice: Invoice) => {
    const message = `Invoice ${invoice.invoiceNumber}\nCustomer: ${invoice.customerName}\nAmount: ${formatCurrency(invoice.grandTotal)}\nStatus: ${invoice.status.toUpperCase()}`;
    
    if (navigator.share) {
      navigator.share({
        title: `Invoice ${invoice.invoiceNumber}`,
        text: message,
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(message).then(() => {
        alert('Invoice details copied to clipboard!');
      });
    }
  };

  const generatePrintableInvoice = (invoice: Invoice): string => {
    const customer = customers.find(c => c.id === invoice.customerId);
    
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice ${invoice.invoiceNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            .header { text-align: center; margin-bottom: 30px; }
            .invoice-info { display: flex; justify-content: space-between; margin-bottom: 30px; }
            .customer-info, .invoice-details { flex: 1; }
            .items-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            .items-table th, .items-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            .items-table th { background-color: #f2f2f2; }
            .totals { margin-left: auto; width: 300px; }
            .total-row { display: flex; justify-content: space-between; margin-bottom: 5px; }
            .grand-total { font-weight: bold; font-size: 1.2em; border-top: 2px solid #333; padding-top: 10px; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>ShopManager</h1>
            <h2>INVOICE</h2>
          </div>
          
          <div class="invoice-info">
            <div class="customer-info">
              <h3>Bill To:</h3>
              <p><strong>${customer?.name || 'Unknown Customer'}</strong></p>
              <p>${customer?.phone || ''}</p>
              <p>${customer?.address || ''}</p>
            </div>
            <div class="invoice-details">
              <p><strong>Invoice #:</strong> ${invoice.invoiceNumber}</p>
              <p><strong>Date:</strong> ${new Date(invoice.createdAt).toLocaleDateString()}</p>
              <p><strong>Payment:</strong> ${invoice.paymentType.toUpperCase()}</p>
              <p><strong>Status:</strong> ${invoice.status.toUpperCase()}</p>
            </div>
          </div>

          <table class="items-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Pack Size</th>
                <th>Qty</th>
                <th>Rate</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${invoice.items.map(item => `
                <tr>
                  <td>${item.productName}</td>
                  <td>${item.packSize}</td>
                  <td>${item.quantity}</td>
                  <td>${formatCurrency(item.rate)}</td>
                  <td>${formatCurrency(item.total)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="totals">
            <div class="total-row">
              <span>Subtotal:</span>
              <span>${formatCurrency(invoice.subtotal)}</span>
            </div>
            ${invoice.tax > 0 ? `
            <div class="total-row">
              <span>Tax:</span>
              <span>${formatCurrency(invoice.tax)}</span>
            </div>
            ` : ''}
            ${invoice.discount > 0 ? `
            <div class="total-row">
              <span>Discount:</span>
              <span>-${formatCurrency(invoice.discount)}</span>
            </div>
            ` : ''}
            <div class="total-row grand-total">
              <span>Grand Total:</span>
              <span>${formatCurrency(invoice.grandTotal)}</span>
            </div>
            <div class="total-row">
              <span>Amount Paid:</span>
              <span>${formatCurrency(invoice.amountPaid)}</span>
            </div>
            ${invoice.balanceDue > 0 ? `
            <div class="total-row">
              <span>Balance Due:</span>
              <span>${formatCurrency(invoice.balanceDue)}</span>
            </div>
            ` : ''}
          </div>

          ${invoice.notes ? `
          <div style="margin-top: 30px;">
            <h4>Notes:</h4>
            <p>${invoice.notes}</p>
          </div>
          ` : ''}

          <div style="margin-top: 50px; text-align: center; color: #666;">
            <p>Thank you for your business!</p>
          </div>
        </body>
      </html>
    `;
  };

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Invoice Management</h1>
          <p className="text-gray-600">View and manage all your invoices</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <div className="flex items-center">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Receipt className="w-5 h-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-600">Total Invoices</p>
              <p className="text-lg font-semibold text-gray-900">{filteredInvoices.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <div className="flex items-center">
            <div className="bg-green-100 p-2 rounded-lg">
              <FileText className="w-5 h-5 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-600">Total Amount</p>
              <p className="text-lg font-semibold text-gray-900">{formatCurrency(totalAmount)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <div className="flex items-center">
            <div className="bg-green-100 p-2 rounded-lg">
              <FileText className="w-5 h-5 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-600">Paid Amount</p>
              <p className="text-lg font-semibold text-green-600">{formatCurrency(paidAmount)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <div className="flex items-center">
            <div className="bg-red-100 p-2 rounded-lg">
              <FileText className="w-5 h-5 text-red-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-600">Credit Pending</p>
              <p className="text-lg font-semibold text-red-600">{formatCurrency(creditAmount)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by invoice number, customer name, or product..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
           <div className="mb-6">
             <div className="bg-white rounded-lg shadow-sm">
               <div className="p-4 border-b border-gray-200">
                 <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                   <Package className="w-5 h-5 mr-2 text-purple-600" />
                   Items ({invoice.items.length})
                 </h3>
               </div>
               <div className="overflow-x-auto">
                 <table className="w-full">
                   <thead className="bg-gray-50">
            >
                       <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Item</th>
                       <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Pack Size</th>
                       <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Qty</th>
                       <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Rate</th>
                       <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Total</th>
            <select
                   </thead>
                   <tbody className="divide-y divide-gray-200">
                     {invoice.items.map((item, index) => (
                       <tr key={index} className="hover:bg-gray-50">
                         <td className="px-6 py-4">
                           <div className="font-medium text-gray-900">{item.productName}</div>
                         </td>
                         <td className="px-6 py-4 text-gray-600">{item.packSize}</td>
                         <td className="px-6 py-4 text-right">
                           <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm font-medium">
                             {item.quantity}
                           </span>
                         </td>
                         <td className="px-6 py-4 text-right font-medium text-gray-900">{formatCurrency(item.rate)}</td>
                         <td className="px-6 py-4 text-right font-bold text-gray-900">{formatCurrency(item.total)}</td>
                       </tr>
                     ))}
             <div className="mb-6">
               <div className="bg-white rounded-lg shadow-sm p-4">
                 <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                   <FileText className="w-5 h-5 mr-2 text-orange-600" />
                   Notes
                 </h3>
                 <p className="text-gray-700 bg-orange-50 rounded-lg p-4 border-l-4 border-orange-400">{invoice.notes}</p>
               </div>
             </div>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('');
                  setDateFilter('');
                }}
               className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors duration-200"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
           <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-200">

      {/* Invoices List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {filteredInvoices.length === 0 ? (
          <div className="text-center py-12">
            <Receipt className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No invoices found</h3>
            <p className="text-gray-600">
              {searchTerm || statusFilter || dateFilter 
                ? 'Try adjusting your search or filters'
                : 'Create your first invoice to get started'
              }
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Invoice
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredInvoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div>
               <div className="bg-white rounded-lg p-4 shadow-sm">
                 <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                   <Users className="w-5 h-5 mr-2 text-blue-600" />
                   Bill To:
                 </h3>
                 <div className="space-y-2">
                   <p className="font-medium text-gray-900 text-lg">{customer?.name || 'Unknown Customer'}</p>
                   {customer?.phone && (
                     <p className="text-gray-600 flex items-center">
                       <Phone className="w-4 h-4 mr-2" />
                       {customer.phone}
                     </p>
                   )}
           <div className="mb-6">
             <div className="bg-white rounded-lg shadow-sm p-6 ml-auto max-w-md">
               <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                 <Calculator className="w-5 h-5 mr-2 text-green-600" />
                 Payment Summary
               </h3>
               <div className="space-y-3">
                       {customer.address}
                     </p>
                   )}
                 </div>
               </div>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                     <span className="font-bold text-red-600 text-lg">{formatCurrency(invoice.balanceDue)}</span>
                 <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                   <Receipt className="w-5 h-5 mr-2 text-green-600" />
                   Invoice Info:
                 </h3>
                 <div className="space-y-3">
                      </div>
                    </td>
                     <span className="font-bold text-blue-600">{invoice.invoiceNumber}</span>
                      {new Date(invoice.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="font-medium text-gray-900">{formatCurrency(invoice.grandTotal)}</p>
                        {invoice.balanceDue > 0 && (
                          <p className="text-sm text-red-600">Due: {formatCurrency(invoice.balanceDue)}</p>
                     <span className="font-medium capitalize bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">{invoice.paymentType}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        invoice.status === 'paid' 
                          ? 'bg-green-100 text-green-800' 
                          : invoice.status === 'credit'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {invoice.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedInvoice(invoice)}
                          className="p-1 text-gray-500 hover:text-blue-600"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handlePrint(invoice)}
                          className="p-1 text-gray-500 hover:text-green-600"
                          title="Print"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleShare(invoice)}
                          className="p-1 text-gray-500 hover:text-purple-600"
                          title="Share"
                        >
                          <Share className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Invoice Detail Modal */}
      {selectedInvoice && (
        <InvoiceDetailModal
          invoice={selectedInvoice}
          customer={customers.find(c => c.id === selectedInvoice.customerId)}
          onClose={() => setSelectedInvoice(null)}
          onPrint={() => handlePrint(selectedInvoice)}
          onShare={() => handleShare(selectedInvoice)}
        />
      )}
    </div>
  );
};

const InvoiceDetailModal: React.FC<{
  invoice: Invoice;
  customer?: any;
  onClose: () => void;
  onPrint: () => void;
  onShare: () => void;
}> = ({ invoice, customer, onClose, onPrint, onShare }) => {
  return (
    <div className="fixed inset-0 z-50 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Invoice Details</h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Invoice Header */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Bill To:</h3>
              <p className="font-medium text-gray-900">{customer?.name || 'Unknown Customer'}</p>
              <p className="text-gray-600">{customer?.phone || ''}</p>
              <p className="text-gray-600">{customer?.address || ''}</p>
            </div>
            <div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Invoice #:</span>
                    <span className="font-medium">{invoice.invoiceNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date:</span>
                    <span className="font-medium">{new Date(invoice.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment:</span>
                    <span className="font-medium capitalize">{invoice.paymentType}</span>
                  </div>
                 <div className="border-t border-gray-300 pt-3 mt-3">
                    <span className="text-gray-600">Status:</span>
                     <span className="text-xl font-bold text-gray-900">Grand Total:</span>
                     <span className="text-xl font-bold text-green-600">{formatCurrency(invoice.grandTotal)}</span>
                        ? 'bg-green-100 text-green-800' 
                        : invoice.status === 'credit'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {invoice.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Items</h3>
            <div className="overflow-x-auto">
              <table className="w-full border border-gray-200 rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Item</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Pack Size</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Qty</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Rate</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {invoice.items.map((item, index) => (
                    <tr key={index}>
                      <td className="px-4 py-3 text-sm text-gray-900">{item.productName}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{item.packSize}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right">{item.quantity}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right">{formatCurrency(item.rate)}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right font-medium">{formatCurrency(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals */}
          <div className="mb-8">
            <div className="bg-gray-50 rounded-lg p-4 ml-auto max-w-sm">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">{formatCurrency(invoice.subtotal)}</span>
                </div>
                {invoice.tax > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax:</span>
                    <span className="font-medium">{formatCurrency(invoice.tax)}</span>
                  </div>
                )}
                {invoice.discount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Discount:</span>
                    <span className="font-medium text-red-600">-{formatCurrency(invoice.discount)}</span>
                  </div>
                )}
                <div className="border-t border-gray-200 pt-2">
                  <div className="flex justify-between">
                    <span className="text-lg font-semibold text-gray-900">Grand Total:</span>
                    <span className="text-lg font-bold text-gray-900">{formatCurrency(invoice.grandTotal)}</span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount Paid:</span>
                  <span className={`font-medium ${invoice.amountPaid > 0 ? 'text-green-600' : 'text-gray-900'}`}>
                    {formatCurrency(invoice.amountPaid)}
                  </span>
                </div>
                {invoice.balanceDue > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Balance Due:</span>
                    <span className="font-medium text-red-600">{formatCurrency(invoice.balanceDue)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Notes</h3>
              <p className="text-gray-600 bg-gray-50 rounded-lg p-4">{invoice.notes}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-4">
            <button
               className="flex items-center px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200 font-medium"
              className="flex items-center px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
            >
              <Share className="w-4 h-4 mr-2" />
              Share
            </button>
            <button
               className="flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 font-medium shadow-lg"
              className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
            >
              <Download className="w-4 h-4 mr-2" />
              Print
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

 const { Users, Phone, MapPin, Package, Calculator, FileText } = require('lucide-react');
export default InvoiceManager;