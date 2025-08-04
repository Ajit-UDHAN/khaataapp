import React, { useState, useEffect } from 'react';
import { Plus, Trash2, User, Phone, MapPin, Share2, Printer, Save, Search, Receipt, Percent, Calculator } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { Invoice, InvoiceItem, Customer, Product, ProductVariant } from '../types';
import { formatCurrency, generateInvoiceNumber } from '../utils/calculations';

interface BillingSystemProps {
  onViewChange: (view: string) => void;
}

const BillingSystem: React.FC<BillingSystemProps> = ({ onViewChange }) => {
  const { products, customers, invoices, setInvoices, setCustomers } = useApp();
  const { businessProfile } = useAuth();
  const { user } = useAuth();
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'upi' | 'online' | 'credit'>('cash');
  const [amountPaid, setAmountPaid] = useState(0);
  const [discountType, setDiscountType] = useState<'percentage' | 'amount'>('percentage');
  const [discountValue, setDiscountValue] = useState(0);
  const [enableGST, setEnableGST] = useState(false);
  const [gstRate, setGstRate] = useState(18);
  const [notes, setNotes] = useState('');
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phone: '',
    address: '',
    email: ''
  });

  // Get all product variants for selection
  const allProductVariants = products.flatMap(product => 
    product.variants.map(variant => ({
      ...variant,
      productName: product.name,
      productId: product.id,
      brand: product.brand,
      category: product.category
    }))
  );

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    customer.phone.includes(customerSearch)
  );

  const filteredProducts = allProductVariants.filter(variant =>
    variant.productName.toLowerCase().includes(productSearch.toLowerCase()) ||
    variant.packSize.toLowerCase().includes(productSearch.toLowerCase())
  );

  const addItem = () => {
    setItems([...items, {
      productId: '',
      variantId: '',
      productName: '',
      packSize: '',
      quantity: 1,
      rate: 0,
      total: 0,
      tax: 0,
      discount: 0
    }]);
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    setItems(items.map((item, i) => {
      if (i === index) {
        const updatedItem = { ...item, [field]: value };
        
        if (field === 'variantId' && value) {
          const variant = allProductVariants.find(v => v.id === value);
          if (variant) {
            updatedItem.productId = variant.productId;
            updatedItem.productName = variant.productName;
            updatedItem.packSize = variant.packSize;
            updatedItem.rate = variant.sellingPrice;
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

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  
  // Calculate discount
  const totalDiscount = discountType === 'percentage' 
    ? (subtotal * discountValue) / 100 
    : discountValue;
  
  const discountedSubtotal = subtotal - totalDiscount;
  const tax = enableGST ? (discountedSubtotal * gstRate) / 100 : 0;
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
      setCustomers(prev => [...prev, customer]);
      setSelectedCustomer(customer);
      setCustomerSearch(customer.name);
      setShowCustomerForm(false);
      setNewCustomer({ name: '', phone: '', address: '', email: '' });
    }
  };

  const handleSaveInvoice = () => {
    if (items.length === 0 || !selectedCustomer) return;

    const invoice: Invoice = {
      id: Date.now().toString(),
      invoiceNumber: generateInvoiceNumber(invoices),
      customerId: selectedCustomer.id,
      customerName: selectedCustomer.name,
      items,
      subtotal,
      tax,
      discount: totalDiscount,
      total: grandTotal,
      amountPaid,
      balanceDue,
      paymentMethod,
      status: balanceDue > 0 ? 'credit' : 'paid',
      notes,
      createdAt: new Date().toISOString()
    };

    setInvoices(prev => [...prev, invoice]);
    
    // Reset form
    setItems([]);
    setSelectedCustomer(null);
    setCustomerSearch('');
    setAmountPaid(0);
    setDiscountValue(0);
    setNotes('');
    setProductSearch('');
    
    alert('Invoice saved successfully!');
  };

  const shareOnWhatsApp = () => {
    if (!selectedCustomer || items.length === 0) return;

    const receiptText = `
*${businessProfile?.shopName || 'Shop Name'}*
${businessProfile?.businessAddress || 'Shop Address'}
${businessProfile?.contactNumber || 'Contact Number'}
${businessProfile?.gstNumber ? `GST: ${businessProfile.gstNumber}` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
*INVOICE*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Invoice: ${generateInvoiceNumber(invoices)}
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

Subtotal: ${formatCurrency(subtotal)}
${totalDiscount > 0 ? `Discount: -${formatCurrency(totalDiscount)}\n` : ''}
${enableGST ? `Tax (${gstRate}%): ${formatCurrency(tax)}\n` : ''}
*Total: ${formatCurrency(grandTotal)}*

Payment: ${paymentMethod.toUpperCase()}
Paid: ${formatCurrency(amountPaid)}
${balanceDue > 0 ? `Balance Due: ${formatCurrency(balanceDue)}` : ''}

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
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Create New Invoice</h2>
              <div className="text-sm text-gray-600">
                Invoice #: {generateInvoiceNumber(invoices)}
              </div>
            </div>
            
            {/* Customer Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Customer
              </label>
              <div className="relative">
                <User className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  placeholder="Search customer by name or phone..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <input
                    type="tel"
                    placeholder="Phone Number *"
                    value={newCustomer.phone}
                    onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <input
                    type="email"
                    placeholder="Email (optional)"
                    value={newCustomer.email}
                    onChange={(e) => setNewCustomer({...newCustomer, email: e.target.value})}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <input
                    type="text"
                    placeholder="Address (optional)"
                    value={newCustomer.address}
                    onChange={(e) => setNewCustomer({...newCustomer, address: e.target.value})}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

              {/* Product Search */}
              <div className="mb-4">
                <div className="relative">
                  <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="space-y-4">
                {items.map((item, index) => (
                  <div key={index} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                    <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                      <div className="md:col-span-3">
                        <label className="block text-xs font-medium text-gray-700 mb-1">Product</label>
                        <select
                          value={item.variantId}
                          onChange={(e) => updateItem(index, 'variantId', e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Select Product</option>
                          {filteredProducts.map(variant => (
                            <option key={variant.id} value={variant.id}>
                              {variant.productName} - {variant.packSize} - {formatCurrency(variant.sellingPrice)}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Qty</label>
                        <input
                          type="number"
                          placeholder="Qty"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Rate</label>
                        <input
                          type="number"
                          placeholder="Rate"
                          min="0"
                          step="0.01"
                          value={item.rate}
                          onChange={(e) => updateItem(index, 'rate', parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Discount</label>
                        <input
                          type="number"
                          placeholder="Discount"
                          min="0"
                          step="0.01"
                          value={item.discount}
                          onChange={(e) => updateItem(index, 'discount', parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Total</label>
                          <span className="font-medium text-gray-900 text-lg">{formatCurrency(item.total)}</span>
                        </div>
                        <button
                          onClick={() => removeItem(index)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200 mt-4"
                          title="Remove Item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Discount Section */}
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Discount & Tax</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Discount Type</label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as 'percentage' | 'amount')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="amount">Fixed Amount (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Discount {discountType === 'percentage' ? '(%)' : '(₹)'}
                  </label>
                  <div className="relative">
                    {discountType === 'percentage' ? (
                      <Percent className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 transform -translate-y-1/2" />
                    ) : (
                      <Calculator className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 transform -translate-y-1/2" />
                    )}
                    <input
                      type="number"
                      min="0"
                      max={discountType === 'percentage' ? 100 : undefined}
                      step={discountType === 'percentage' ? 1 : 0.01}
                      value={discountValue}
                      onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder={discountType === 'percentage' ? '0' : '0.00'}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Enable GST</label>
                  <div className="flex items-center space-x-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={enableGST}
                        onChange={(e) => setEnableGST(e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Add GST</span>
                    </label>
                  </div>
                </div>
                {enableGST && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">GST Rate (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="50"
                    step="0.1"
                    value={gstRate}
                    onChange={(e) => setGstRate(parseFloat(e.target.value) || 18)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}
              </div>
              
              {/* Discount Preview */}
              {totalDiscount > 0 && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800">
                    <strong>Discount Applied:</strong> {formatCurrency(totalDiscount)}
                    {discountType === 'percentage' && ` (${discountValue}% of ${formatCurrency(subtotal)})`}
                  </p>
                </div>
              )}
            </div>
            {/* Payment Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  min="0"
                  step="0.01"
                  onChange={(e) => setAmountPaid(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            {/* Notes */}
            {totalDiscount > 0 && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  <strong>Discount Applied:</strong> {formatCurrency(totalDiscount)}
                  {discountType === 'percentage' && ` (${discountValue}% of ${formatCurrency(subtotal)})`}
                </p>
              </div>
            )}
            <div className="mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional notes..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={handleSaveInvoice}
                disabled={!selectedCustomer || items.length === 0}
                className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200"
              >
                <Save className="w-4 h-4" />
                Save Invoice
              </button>
              <button
                onClick={shareOnWhatsApp}
                disabled={!selectedCustomer || items.length === 0}
                className="flex items-center gap-2 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200"
              >
                <Share2 className="w-4 h-4" />
                Share on WhatsApp
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Live Receipt Preview */}
      <div className="w-96 bg-gray-50 border-l border-gray-200 p-6 overflow-y-auto">
        <div className="sticky top-0 bg-white pb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Receipt className="w-5 h-5 mr-2" />
            Live Receipt Preview
          </h3>
        </div>
        
        {/* Receipt */}
        <div className="bg-white border-2 border-dashed border-gray-300 p-6 font-mono text-sm shadow-lg max-w-sm mx-auto">
          <div className="text-center mb-4">
            <div className="text-xs tracking-wider">********************************</div>
            <div className="font-bold text-lg my-2 tracking-wide">RECEIPT</div>
            <div className="text-xs tracking-wider">********************************</div>
          </div>
          
          <div className="mb-4">
            <div className="font-bold text-center text-base">{businessProfile?.shopName || 'SHOP NAME'}</div>
            <div className="text-center text-xs mt-1">{businessProfile?.businessAddress || 'Shop Address'}</div>
            <div className="text-center text-xs">{businessProfile?.contactNumber || 'Contact Number'}</div>
            {businessProfile?.gstNumber && (
              <div className="text-center text-xs mt-1">GST: {businessProfile.gstNumber}</div>
            )}
          </div>

          <div className="border-t border-dashed border-gray-400 pt-3 mb-3">
            <div className="flex justify-between text-xs">
              <span>Invoice: {generateInvoiceNumber(invoices)}</span>
              <span>{new Date().toLocaleDateString('en-IN')}</span>
            </div>
            <div className="text-xs text-right mt-1">{new Date().toLocaleTimeString('en-IN')}</div>
          </div>

          {selectedCustomer && (
            <div className="mb-4 text-xs border-b border-dashed border-gray-300 pb-2">
              <div>Customer: {selectedCustomer.name}</div>
              <div>Phone: {selectedCustomer.phone}</div>
              {selectedCustomer.address && <div>Address: {selectedCustomer.address}</div>}
            </div>
          )}

          <div className="mb-3">
            {items.length > 0 ? items.map((item, index) => (
              <div key={index} className="mb-3">
                <div className="flex justify-between">
                  <span className="text-xs font-medium">{item.quantity}x {item.productName}</span>
                  <span className="text-xs font-bold">{formatCurrency(item.total)}</span>
                </div>
                {item.packSize && (
                  <div className="text-xs text-gray-600 ml-2">{item.packSize}</div>
                )}
                <div className="text-xs text-gray-500 ml-2">
                  {formatCurrency(item.rate)} × {item.quantity} = {formatCurrency(item.quantity * item.rate)}
                  {item.discount > 0 && <span> - {formatCurrency(item.discount)}</span>}
                </div>
              </div>
            )) : (
              <div className="text-xs text-gray-500 text-center py-4">No items added</div>
            )}
          </div>

          <div className="border-t border-dashed border-gray-400 pt-3 mb-3">
            <div className="flex justify-between text-xs">
              <span>SUBTOTAL</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span>TAX (18%)</span>
              <span>{formatCurrency(tax)}</span>
            </div>
            <div className="flex justify-between font-bold text-sm border-t border-gray-300 pt-1 mt-1">
              <span>TOTAL AMOUNT</span>
              <span>{formatCurrency(grandTotal)}</span>
            </div>
            <div className="flex justify-between text-xs mt-2">
              <span>{paymentMethod.toUpperCase()}</span>
              <span>{formatCurrency(amountPaid)}</span>
            </div>
            {balanceDue > 0 && (
              <div className="flex justify-between text-xs font-bold text-red-600">
                <span>BALANCE DUE</span>
                <span>{formatCurrency(balanceDue)}</span>
              </div>
            )}
          </div>

          {notes && (
            <div className="border-t border-dashed border-gray-400 pt-2 mb-3">
              <div className="text-xs">
                <span className="font-medium">Notes: </span>
                <span>{notes}</span>
              </div>
            </div>
          )}

          <div className="text-center mt-4">
            <div className="text-xs tracking-wider">********************************</div>
            <div className="font-bold text-sm my-2 tracking-wide">THANK YOU!</div>
            <div className="text-xs tracking-wider">********************************</div>
          </div>

          {/* Barcode placeholder */}
          <div className="text-center mt-4">
            <div className="text-xs tracking-widest">||||||||||||||||||||||||||||||||</div>
            <div className="text-xs tracking-widest">||||||||||||||||||||||||||||||||</div>
            <div className="text-xs mt-1">{generateInvoiceNumber(invoices)}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillingSystem;