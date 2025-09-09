import React, { useState } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Phone,
  MapPin,
  CreditCard,
  ShoppingBag,
  Calendar,
  X
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { Customer } from '../types';
import { formatCurrency } from '../utils/calculations';

const CustomerManager: React.FC = () => {
  const { customers, setCustomers, invoices } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm) ||
    customer.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCustomerStats = (customerId: string) => {
    const customerInvoices = invoices.filter(inv => inv.customerId === customerId);
    const totalOrders = customerInvoices.length;
    const totalSpent = customerInvoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
    const creditBalance = customerInvoices.reduce((sum, inv) => sum + inv.balanceDue, 0);
    const lastOrderDate = customerInvoices.length > 0 
      ? new Date(Math.max(...customerInvoices.map(inv => new Date(inv.createdAt).getTime())))
      : null;

    return { totalOrders, totalSpent, creditBalance, lastOrderDate };
  };

  const handleAddCustomer = (customerData: Omit<Customer, 'id' | 'totalPurchases' | 'lastVisit' | 'createdAt'>) => {
    const newCustomer: Customer = {
      ...customerData,
      id: Date.now().toString(),
      totalPurchases: 0,
      lastVisit: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };
    setCustomers(prev => [...prev, newCustomer]);
    setShowAddCustomer(false);
  };

  const handleUpdateCustomer = (updatedCustomer: Customer) => {
    setCustomers(prev => prev.map(c => 
      c.id === updatedCustomer.id ? updatedCustomer : c
    ));
    setEditingCustomer(null);
  };

  const handleDeleteCustomer = (customerId: string) => {
    const hasInvoices = invoices.some(inv => inv.customerId === customerId);
    if (hasInvoices) {
      alert('Cannot delete customer with existing invoices. Archive customer instead.');
      return;
    }
    
    if (confirm('Are you sure you want to delete this customer?')) {
      setCustomers(prev => prev.filter(c => c.id !== customerId));
    }
  };

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
            <img src="/KHA.jpg" alt="KHAATA" className="w-8 h-8 rounded mr-3" />
            Customer Management
          </h1>
          <p className="text-gray-600">Manage your customer relationships and track purchase history</p>
        </div>
        <button
          onClick={() => setShowAddCustomer(true)}
          className="mt-4 sm:mt-0 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors duration-200"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Customer
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <div className="flex items-center">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-600">Total Customers</p>
              <p className="text-lg font-semibold text-gray-900">{customers.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <div className="flex items-center">
            <div className="bg-green-100 p-2 rounded-lg">
              <ShoppingBag className="w-5 h-5 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-600">Total Orders</p>
              <p className="text-lg font-semibold text-gray-900">{invoices.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <div className="flex items-center">
            <div className="bg-purple-100 p-2 rounded-lg">
              <CreditCard className="w-5 h-5 text-purple-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-lg font-semibold text-gray-900">
                {formatCurrency(invoices.reduce((sum, inv) => sum + inv.grandTotal, 0))}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <div className="flex items-center">
            <div className="bg-red-100 p-2 rounded-lg">
              <CreditCard className="w-5 h-5 text-red-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-600">Credit Outstanding</p>
              <p className="text-lg font-semibold text-gray-900">
                {formatCurrency(customers.reduce((sum, customer) => sum + customer.creditBalance, 0))}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="relative">
          <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search customers by name, phone, or address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Customers Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredCustomers.map((customer) => {
          const stats = getCustomerStats(customer.id);
          return (
            <CustomerCard
              key={customer.id}
              customer={customer}
              stats={stats}
              onEdit={() => setEditingCustomer(customer)}
              onDelete={() => handleDeleteCustomer(customer.id)}
              onViewDetails={() => setSelectedCustomer(customer)}
            />
          );
        })}
      </div>

      {filteredCustomers.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No customers found</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm 
              ? 'Try adjusting your search'
              : 'Get started by adding your first customer'
            }
          </p>
          <button
            onClick={() => setShowAddCustomer(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
          >
            Add Customer
          </button>
        </div>
      )}

      {/* Add/Edit Customer Modal */}
      {(showAddCustomer || editingCustomer) && (
        <CustomerForm
          customer={editingCustomer}
          onSave={editingCustomer ? handleUpdateCustomer : handleAddCustomer}
          onCancel={() => {
            setShowAddCustomer(false);
            setEditingCustomer(null);
          }}
        />
      )}

      {/* Customer Details Modal */}
      {selectedCustomer && (
        <CustomerDetailsModal
          customer={selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
          onEdit={() => {
            setEditingCustomer(selectedCustomer);
            setSelectedCustomer(null);
          }}
        />
      )}
    </div>
  );
};

const CustomerCard: React.FC<{
  customer: Customer;
  stats: any;
  onEdit: () => void;
  onDelete: () => void;
  onViewDetails: () => void;
}> = ({ customer, stats, onEdit, onDelete, onViewDetails }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{customer.name}</h3>
          <div className="space-y-1">
            <div className="flex items-center text-sm text-gray-600">
              <Phone className="w-4 h-4 mr-2" />
              {customer.phone}
            </div>
            {customer.address && (
              <div className="flex items-center text-sm text-gray-600">
                <MapPin className="w-4 h-4 mr-2" />
                {customer.address}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 ml-4">
          <button
            onClick={onViewDetails}
            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
            title="View Details"
          >
            <Users className="w-4 h-4" />
          </button>
          <button
            onClick={onEdit}
            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
            title="Edit"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Customer Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <p className="text-2xl font-bold text-blue-600">{stats.totalOrders}</p>
          <p className="text-sm text-gray-600">Orders</p>
        </div>
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalSpent)}</p>
          <p className="text-sm text-gray-600">Total Spent</p>
        </div>
      </div>

      {/* Credit Balance Alert */}
      {stats.creditBalance > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <div className="flex items-center">
            <CreditCard className="w-4 h-4 text-red-500 mr-2" />
            <span className="text-sm font-medium text-red-800">
              Credit Outstanding: {formatCurrency(stats.creditBalance)}
            </span>
          </div>
        </div>
      )}

      {/* Last Order */}
      {stats.lastOrderDate && (
        <div className="text-sm text-gray-600 flex items-center">
          <Calendar className="w-4 h-4 mr-2" />
          Last order: {stats.lastOrderDate.toLocaleDateString()}
        </div>
      )}

      {/* Notes */}
      {customer.notes && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-sm text-gray-600">{customer.notes}</p>
        </div>
      )}
    </div>
  );
};

const CustomerForm: React.FC<{
  customer?: Customer | null;
  onSave: (customer: any) => void;
  onCancel: () => void;
}> = ({ customer, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: customer?.name || '',
    phone: customer?.phone || '',
    address: customer?.address || '',
    notes: customer?.notes || '',
    creditBalance: customer?.creditBalance || 0
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
   if (!formData.name.trim()) {
     alert('Customer name is required');
     return;
   }
    if (customer) {
      onSave({ ...customer, ...formData });
    } else {
      onSave(formData);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg max-w-md w-full">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900">
            {customer ? 'Edit Customer' : 'Add New Customer'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Name*</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone*</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
             placeholder="Phone Number (optional)"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
            <input
              type="text"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          {customer && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Credit Balance</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.creditBalance}
                onChange={(e) => setFormData(prev => ({ ...prev, creditBalance: parseFloat(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}

          <div className="flex items-center justify-end gap-4 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
            >
              {customer ? 'Update Customer' : 'Add Customer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const CustomerDetailsModal: React.FC<{
  customer: Customer;
  onClose: () => void;
  onEdit: () => void;
}> = ({ customer, onClose, onEdit }) => {
  const { invoices } = useApp();
  const customerInvoices = invoices
    .filter(inv => inv.customerId === customer.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const stats = {
    totalOrders: customerInvoices.length,
    totalSpent: customerInvoices.reduce((sum, inv) => sum + inv.grandTotal, 0),
    creditBalance: customerInvoices.reduce((sum, inv) => sum + inv.balanceDue, 0),
    averageOrderValue: customerInvoices.length > 0 
      ? customerInvoices.reduce((sum, inv) => sum + inv.grandTotal, 0) / customerInvoices.length 
      : 0
  };

  return (
    <div className="fixed inset-0 z-50 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Customer Details</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={onEdit}
                className="p-2 text-gray-500 hover:text-blue-600 rounded-lg hover:bg-blue-50"
              >
                <Edit className="w-5 h-5" />
              </button>
              <button
                onClick={onClose}
                className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Customer Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-gray-600">Name</label>
                  <p className="font-medium text-gray-900">{customer.name}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Phone</label>
                  <p className="font-medium text-gray-900">{customer.phone}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Address</label>
                  <p className="font-medium text-gray-900">{customer.address || 'Not provided'}</p>
                </div>
                {customer.notes && (
                  <div>
                    <label className="text-sm text-gray-600">Notes</label>
                    <p className="font-medium text-gray-900">{customer.notes}</p>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistics</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-blue-600">{stats.totalOrders}</p>
                  <p className="text-sm text-gray-600">Total Orders</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalSpent)}</p>
                  <p className="text-sm text-gray-600">Total Spent</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-purple-600">{formatCurrency(stats.averageOrderValue)}</p>
                  <p className="text-sm text-gray-600">Avg Order</p>
                </div>
                <div className={`rounded-lg p-4 text-center ${stats.creditBalance > 0 ? 'bg-red-50' : 'bg-gray-50'}`}>
                  <p className={`text-2xl font-bold ${stats.creditBalance > 0 ? 'text-red-600' : 'text-gray-600'}`}>
                    {formatCurrency(stats.creditBalance)}
                  </p>
                  <p className="text-sm text-gray-600">Credit Balance</p>
                </div>
              </div>
            </div>
          </div>

          {/* Purchase History */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Purchase History</h3>
            {customerInvoices.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <ShoppingBag className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No orders yet</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {customerInvoices.map((invoice) => (
                  <div key={invoice.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{invoice.invoiceNumber}</p>
                      <p className="text-sm text-gray-600">
                        {new Date(invoice.createdAt).toLocaleDateString()} • {invoice.items.length} item{invoice.items.length > 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{formatCurrency(invoice.grandTotal)}</p>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        invoice.status === 'paid' 
                          ? 'bg-green-100 text-green-800' 
                          : invoice.status === 'credit'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {invoice.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerManager;