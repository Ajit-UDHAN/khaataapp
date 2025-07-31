import React, { useState, useEffect } from 'react';
import { Plus, Trash2, User, Phone, MapPin, Share2, Printer, Save } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { Invoice, InvoiceItem, Customer, Product } from '../types';

export default function BillingSystem() {
  const { products, customers, addInvoice, addCustomer, businessProfile } = useAppContext();
  const { user } = useAuth();
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'upi' | 'online' | 'credit'>('cash');
  const [amountPaid, setAmountPaid] = useState(0);
  const [notes, setNotes] = useState('');
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phone: '',
    address: '',
    email: ''
  });

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    customer.phone.includes(customerSearch)
  );

  const addItem = () => {
    setItems([...items, {
      id: Date.now().toString(),
      productId: '',
      productName: '',
      packSize: '',
      quantity: 1,
      rate: 0,
      total: 0,
      discount: 0
    }]);
  };

  const updateItem = (id: string, field: keyof InvoiceItem, value: any) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        
        if (field === 'productId' && value) {
          const product = products.find(p => p.id === value);
          if (product) {
            updatedItem.productName = product.name;
            updatedItem.packSize = product.packSize;
            updatedItem.rate = product.sellingPrice;
          }
        }
        
        if (field === 'quantity' || field === 'rate' || field === 'discount') {
          updatedItem.total = (updatedItem.quantity * updatedItem.rate) - (updatedItem.discount || 0);
        }
        
        return updatedItem;
      }
      return item;
    }));
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const tax = subtotal * 0.18; // 18% GST
  const grandTotal = subtotal + tax;
  const balanceDue = grandTotal - amountPaid;

  const handleCustomerSelect = (customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomerSearch(customer.name);
  };

  const handleAddNewCustomer = () => {
    if (newCustomer.name && newCustomer.phone) {
      const customer: Customer = {
        id: Date.now().toString(),
        ...newCustomer,
        totalPurchases: 0,
        creditBalance: 0,
        lastPurchase: new Date().toISOString()
      };
      addCustomer(customer);
      setSelectedCustomer(customer);
      setCustomerSearch(customer.name);
      setShowCustomerForm(false);
      setNewCustomer({ name: '', phone: '', address: '', email: '' });
    }
  };

  const handleSaveInvoice = () => {
    if (items.length === 0 || !selectedCustomer) return;

    const invoice: Invoice = {
      id: `INV-${Date.now()}`,
      customerId: selectedCustomer.id,
      customerName: selectedCustomer.name,
      items,
      subtotal,
      tax,
      total: grandTotal,
      amountPaid,
      balanceDue,
      paymentMethod,
      status: balanceDue > 0 ? 'credit' : 'paid',
      notes,
      date: new Date().toISOString(),
      invoiceNumber: `INV-${Date.now().toString().slice(-6)}`
    };

    addInvoice(invoice);
    
    // Reset form
    setItems([]);
    setSelectedCustomer(null);
    setCustomerSearch('');
    setAmountPaid(0);
    setNotes('');
    
    alert('Invoice saved successfully!');
  };

  const shareOnWhatsApp = () => {
    if (!selectedCustomer || items.length === 0) return;

    const receiptText = `
*${businessProfile?.shopName || 'Shop Name'}*
${businessProfile?.address || 'Shop Address'}
${businessProfile?.phone || 'Contact Number'}
${businessProfile?.gstNumber ? `GST: ${businessProfile.gstNumber}` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
*INVOICE*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Invoice: INV-${Date.now().toString().slice(-6)}
Date: ${new Date().toLocaleDateString('en-IN')}
Time: ${new Date().toLocaleTimeString('en-IN')}

Customer: ${selectedCustomer.name}
Phone: ${selectedCustomer.phone}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
*ITEMS*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${items.map(item => 
  `${item.quantity}x ${item.productName} ${item.packSize}\n₹${item.rate} × ${item.quantity} = ₹${item.total}`
).join('\n\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Subtotal: ₹${subtotal.toFixed(2)}
Tax (18%): ₹${tax.toFixed(2)}
*Total: ₹${grandTotal.toFixed(2)}*

Payment: ${paymentMethod.toUpperCase()}
Paid: ₹${amountPaid.toFixed(2)}
${balanceDue > 0 ? `Balance Due: ₹${balanceDue.toFixed(2)}` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
*THANK YOU FOR YOUR BUSINESS!*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `.trim();

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(receiptText)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Side - Billing Form */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Invoice</h2>
            
            {/* Customer Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Customer
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  placeholder="Search customer by name or phone..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {customerSearch && !selectedCustomer && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredCustomers.map(customer => (
                      <div
                        key={customer.id}
                        onClick={() => handleCustomerSelect(customer)}
                        className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                      >
                        <div className="font-medium text-gray-900">{customer.name}</div>
                        <div className="text-sm text-gray-500">{customer.phone}</div>
                      </div>
                    ))}
                    <div
                      onClick={() => setShowCustomerForm(true)}
                      className="p-3 hover:bg-blue-50 cursor-pointer text-blue-600 font-medium"
                    >
                      + Add New Customer
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* New Customer Form */}
            {showCustomerForm && (
              <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="font-medium text-gray-900 mb-3">Add New Customer</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Customer Name *"
                    value={newCustomer.name}
                    onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="tel"
                    placeholder="Phone Number *"
                    value={newCustomer.phone}
                    onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="email"
                    placeholder="Email (optional)"
                    value={newCustomer.email}
                    onChange={(e) => setNewCustomer({...newCustomer, email: e.target.value})}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    placeholder="Address (optional)"
                    value={newCustomer.address}
                    onChange={(e) => setNewCustomer({...newCustomer, address: e.target.value})}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={handleAddNewCustomer}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Add Customer
                  </button>
                  <button
                    onClick={() => setShowCustomerForm(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Items Section */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Items
                </label>
                <button
                  onClick={addItem}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4" />
                  Add Item
                </button>
              </div>

              <div className="space-y-4">
                {items.map((item, index) => (
                  <div key={item.id} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                      <div className="md:col-span-2">
                        <select
                          value={item.productId}
                          onChange={(e) => updateItem(item.id, 'productId', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select Product</option>
                          {products.map(product => (
                            <option key={product.id} value={product.id}>
                              {product.name} - {product.packSize}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <input
                          type="number"
                          placeholder="Qty"
                          value={item.quantity}
                          onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <input
                          type="number"
                          placeholder="Rate"
                          value={item.rate}
                          onChange={(e) => updateItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <input
                          type="number"
                          placeholder="Discount"
                          value={item.discount}
                          onChange={(e) => updateItem(item.id, 'discount', parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900">₹{item.total.toFixed(2)}</span>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="cash">Cash</option>
                  <option value="upi">UPI</option>
                  <option value="online">Online</option>
                  <option value="credit">Credit</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount Paid
                </label>
                <input
                  type="number"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional notes..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={handleSaveInvoice}
                disabled={!selectedCustomer || items.length === 0}
                className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                Save Invoice
              </button>
              <button
                onClick={shareOnWhatsApp}
                disabled={!selectedCustomer || items.length === 0}
                className="flex items-center gap-2 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                <Share2 className="w-4 h-4" />
                Share on WhatsApp
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Live Receipt Preview */}
      <div className="w-96 bg-white border-l border-gray-200 p-6 overflow-y-auto">
        <div className="sticky top-0 bg-white pb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Live Receipt Preview</h3>
        </div>
        
        {/* Receipt */}
        <div className="bg-white border-2 border-dashed border-gray-300 p-4 font-mono text-sm">
          <div className="text-center mb-4">
            <div className="text-xs">********************************</div>
            <div className="font-bold text-base my-2">RECEIPT</div>
            <div className="text-xs">********************************</div>
          </div>
          
          <div className="mb-4">
            <div className="font-bold text-center">{businessProfile?.shopName || 'SHOP NAME'}</div>
            <div className="text-center text-xs">{businessProfile?.address || 'Shop Address'}</div>
            <div className="text-center text-xs">{businessProfile?.phone || 'Contact Number'}</div>
            {businessProfile?.gstNumber && (
              <div className="text-center text-xs">GST: {businessProfile.gstNumber}</div>
            )}
          </div>

          <div className="border-t border-dashed border-gray-400 pt-2 mb-2">
            <div className="flex justify-between text-xs">
              <span>Invoice: INV-{Date.now().toString().slice(-6)}</span>
              <span>{new Date().toLocaleDateString('en-IN')}</span>
            </div>
            <div className="text-xs text-right">{new Date().toLocaleTimeString('en-IN')}</div>
          </div>

          {selectedCustomer && (
            <div className="mb-4 text-xs">
              <div>Customer: {selectedCustomer.name}</div>
              <div>Phone: {selectedCustomer.phone}</div>
              {selectedCustomer.address && <div>Address: {selectedCustomer.address}</div>}
            </div>
          )}

          <div className="border-t border-dashed border-gray-400 pt-2 mb-2">
            {items.map((item, index) => (
              <div key={item.id} className="mb-2">
                <div className="flex justify-between">
                  <span className="text-xs">{item.quantity}x {item.productName}</span>
                  <span className="text-xs">₹{item.total.toFixed(2)}</span>
                </div>
                {item.packSize && (
                  <div className="text-xs text-gray-600 ml-4">{item.packSize}</div>
                )}
              </div>
            ))}
          </div>

          <div className="border-t border-dashed border-gray-400 pt-2 mb-2">
            <div className="flex justify-between text-xs">
              <span>SUBTOTAL</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span>TAX (18%)</span>
              <span>₹{tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold">
              <span>TOTAL AMOUNT</span>
              <span>₹{grandTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span>{paymentMethod.toUpperCase()}</span>
              <span>₹{amountPaid.toFixed(2)}</span>
            </div>
            {balanceDue > 0 && (
              <div className="flex justify-between text-xs font-bold">
                <span>BALANCE DUE</span>
                <span>₹{balanceDue.toFixed(2)}</span>
              </div>
            )}
          </div>

          <div className="text-center mt-4">
            <div className="text-xs">********************************</div>
            <div className="font-bold text-xs my-2">THANK YOU!</div>
            <div className="text-xs">********************************</div>
          </div>

          {/* Barcode placeholder */}
          <div className="text-center mt-4">
            <div className="text-xs">||||||||||||||||||||||||||||||||</div>
            <div className="text-xs">||||||||||||||||||||||||||||||||</div>
          </div>
        </div>
      </div>
    </div>
  );
}