import React, { useState, useContext } from 'react';
import { AppContext } from '../contexts/AppContext';
import { AuthContext } from '../contexts/AuthContext';
import { FileText, Search, Plus, Eye, Edit, Trash2, Calendar, User, Phone, Mail, IndianRupee, Filter, Download, Share2 } from 'lucide-react';

const InvoiceManager: React.FC = () => {
  const { invoices, customers, deleteInvoice } = useContext(AppContext);
  const { user } = useContext(AuthContext);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  // Filter invoices based on search term and status
  const filteredInvoices = invoices.filter(invoice => {
    const customer = customers.find(c => c.id === invoice.customerId);
    const matchesSearch = customer?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'paid' && invoice.status === 'paid') ||
                         (filterStatus === 'pending' && invoice.status === 'pending') ||
                         (filterStatus === 'overdue' && invoice.status === 'overdue');
    
    return matchesSearch && matchesStatus;
  });

  const getCustomerInfo = (customerId: string) => {
    return customers.find(c => c.id === customerId);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleViewInvoice = (invoice: any) => {
    setSelectedInvoice(invoice);
    setShowInvoiceModal(true);
  };

  const handleDeleteInvoice = (invoiceId: string) => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      deleteInvoice(invoiceId);
    }
  };

  const shareInvoice = (invoice: any) => {
    const customer = getCustomerInfo(invoice.customerId);
    if (!customer) return;

    const message = `*INVOICE*\n\nInvoice #: ${invoice.invoiceNumber}\nDate: ${new Date(invoice.date).toLocaleDateString()}\nCustomer: ${customer.name}\n\nItems:\n${invoice.items.map((item: any) => `• ${item.name} - ₹${item.price} x ${item.quantity} = ₹${item.total}`).join('\n')}\n\nSubtotal: ₹${invoice.subtotal}\nGST (${invoice.gstRate}%): ₹${invoice.gstAmount}\nTotal: ₹${invoice.total}\n\nThank you for your business!`;
    
    const whatsappUrl = `https://wa.me/${customer.phone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="p-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div className="flex items-center mb-4 md:mb-0">
          <div className="bg-blue-100 p-3 rounded-lg mr-4">
            <FileText className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Invoice Manager</h1>
            <p className="text-gray-600">Manage and track all your invoices</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
            {filteredInvoices.length} Invoices
          </span>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by customer name or invoice number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
        </div>
      </div>

      {/* Invoices Grid */}
      {filteredInvoices.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No invoices found</h3>
          <p className="text-gray-500">
            {searchTerm || filterStatus !== 'all' 
              ? 'Try adjusting your search or filter criteria'
              : 'Create your first invoice to get started'
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredInvoices.map((invoice) => {
            const customer = getCustomerInfo(invoice.customerId);
            return (
              <div key={invoice.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                <div className="p-6">
                  {/* Invoice Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">
                        #{invoice.invoiceNumber}
                      </h3>
                      <div className="flex items-center text-sm text-gray-500 mb-2">
                        <Calendar className="w-4 h-4 mr-1" />
                        {new Date(invoice.date).toLocaleDateString()}
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                      {invoice.status}
                    </span>
                  </div>

                  {/* Customer Info */}
                  {customer && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center mb-2">
                        <User className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="font-medium text-gray-900">{customer.name}</span>
                      </div>
                      {customer.phone && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Phone className="w-4 h-4 text-gray-400 mr-2" />
                          {customer.phone}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Invoice Amount */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                      <span>Subtotal:</span>
                      <span>₹{invoice.subtotal}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                      <span>GST ({invoice.gstRate}%):</span>
                      <span>₹{invoice.gstAmount}</span>
                    </div>
                    <div className="flex items-center justify-between font-semibold text-gray-900 pt-2 border-t">
                      <span>Total:</span>
                      <span className="flex items-center">
                        <IndianRupee className="w-4 h-4 mr-1" />
                        {invoice.total}
                      </span>
                    </div>
                  </div>

                  {/* Items Count */}
                  <div className="mb-4 text-sm text-gray-600">
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      {invoice.items.length} item{invoice.items.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleViewInvoice(invoice)}
                      className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center text-sm"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </button>
                    <button
                      onClick={() => shareInvoice(invoice)}
                      className="flex-1 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center text-sm"
                    >
                      <Share2 className="w-4 h-4 mr-1" />
                      Share
                    </button>
                    <button
                      onClick={() => handleDeleteInvoice(invoice.id)}
                      className="bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Invoice Detail Modal */}
      {showInvoiceModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Invoice Details</h2>
                <button
                  onClick={() => setShowInvoiceModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              {/* Invoice Content */}
              <div className="space-y-6">
                {/* Header */}
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold">Invoice #{selectedInvoice.invoiceNumber}</h3>
                    <p className="text-gray-600">Date: {new Date(selectedInvoice.date).toLocaleDateString()}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedInvoice.status)}`}>
                    {selectedInvoice.status}
                  </span>
                </div>

                {/* Customer Info */}
                {(() => {
                  const customer = getCustomerInfo(selectedInvoice.customerId);
                  return customer ? (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">Customer Information</h4>
                      <p className="text-gray-700">{customer.name}</p>
                      {customer.phone && <p className="text-gray-600">{customer.phone}</p>}
                      {customer.email && <p className="text-gray-600">{customer.email}</p>}
                    </div>
                  ) : null;
                })()}

                {/* Items */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Items</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-200">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="border border-gray-200 px-4 py-2 text-left">Item</th>
                          <th className="border border-gray-200 px-4 py-2 text-right">Price</th>
                          <th className="border border-gray-200 px-4 py-2 text-right">Qty</th>
                          <th className="border border-gray-200 px-4 py-2 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedInvoice.items.map((item: any, index: number) => (
                          <tr key={index}>
                            <td className="border border-gray-200 px-4 py-2">{item.name}</td>
                            <td className="border border-gray-200 px-4 py-2 text-right">₹{item.price}</td>
                            <td className="border border-gray-200 px-4 py-2 text-right">{item.quantity}</td>
                            <td className="border border-gray-200 px-4 py-2 text-right">₹{item.total}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Totals */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>₹{selectedInvoice.subtotal}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>GST ({selectedInvoice.gstRate}%):</span>
                      <span>₹{selectedInvoice.gstAmount}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-lg pt-2 border-t">
                      <span>Total:</span>
                      <span>₹{selectedInvoice.total}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-3">
                  <button
                    onClick={() => shareInvoice(selectedInvoice)}
                    className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Share via WhatsApp
                  </button>
                  <button
                    onClick={() => setShowInvoiceModal(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceManager;