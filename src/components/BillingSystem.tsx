import React, { useState, useRef } from 'react';
import { Plus, Trash2, Search, User, Receipt, Save, Printer as Print, Share, Calculator, ShoppingCart, CreditCard, Smartphone } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { Invoice, InvoiceItem, Customer } from '../types';
import { formatCurrency, generateInvoiceNumber } from '../utils/calculations';

interface BillingSystemProps {
  onViewChange: (view: string) => void;
}

const BillingSystem: React.FC<BillingSystemProps> = ({ onViewChange }) => {
  const { products, customers, setCustomers, invoices, setInvoices, setProducts } = useApp();
  const { businessProfile } = useAuth();
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [paymentType, setPaymentType] = useState<'cash' | 'upi' | 'online' | 'credit'>('cash');
  const [amountPaid, setAmountPaid] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [notes, setNotes] = useState('');
  const invoiceRef = useRef<HTMLDivElement>(null);

  const generateReceiptContent = () => {
    if (!selectedCustomer || items.length === 0) return '';
    
    const receiptData = {
      businessName: businessProfile?.shopName || 'Shop Name',
      businessAddress: businessProfile?.businessAddress || 'Business Address',
      businessPhone: businessProfile?.contactNumber || 'Contact Number',
      gstNumber: businessProfile?.gstNumber || '',
      invoiceNumber: generateInvoiceNumber(invoices),
      date: new Date().toLocaleDateString('en-IN'),
      time: new Date().toLocaleTimeString('en-IN', { hour12: true }),
      customer: selectedCustomer,
      items,
      subtotal,
      discount,
      grandTotal,
      amountPaid,
      balanceDue,
      paymentType
    };
    
    return receiptData;
  };

  const shareOnWhatsApp = () => {
    const receiptData = generateReceiptContent();
    if (!receiptData) return;
    
    let message = `*${receiptData.businessName}*\n`;
    message += `${receiptData.businessAddress}\n`;
    message += `📞 ${receiptData.businessPhone}\n`;
    if (receiptData.gstNumber) {
      message += `GST: ${receiptData.gstNumber}\n`;
    }
    message += `${'='.repeat(30)}\n`;
    message += `*INVOICE: ${receiptData.invoiceNumber}*\n`;
    message += `Date: ${receiptData.date} ${receiptData.time}\n`;
    message += `Customer: ${receiptData.customer.name}\n`;
    message += `Phone: ${receiptData.customer.phone}\n`;
    message += `${'='.repeat(30)}\n`;
    
    receiptData.items.forEach(item => {
      message += `${item.productName} (${item.packSize})\n`;
      message += `${item.quantity} x ${formatCurrency(item.rate)} = ${formatCurrency(item.total)}\n\n`;
    });
    
    message += `${'-'.repeat(30)}\n`;
    message += `Subtotal: ${formatCurrency(receiptData.subtotal)}\n`;
    if (receiptData.discount > 0) {
      message += `Discount: -${formatCurrency(receiptData.discount)}\n`;
    }
    message += `*Grand Total: ${formatCurrency(receiptData.grandTotal)}*\n`;
    message += `Payment: ${receiptData.paymentType.toUpperCase()}\n`;
    message += `Amount Paid: ${formatCurrency(receiptData.amountPaid)}\n`;
    if (receiptData.balanceDue > 0) {
      message += `Balance Due: ${formatCurrency(receiptData.balanceDue)}\n`;
    }
    message += `${'='.repeat(30)}\n`;
    message += `*Thank you for your business!*\n`;
    message += `Visit again soon! 🙏`;
    
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    customer.phone.includes(customerSearch)
  );

  const availableProducts = products.flatMap(product =>
    product.variants
      .filter(variant => variant.stockQuantity > 0)
      .map(variant => ({
        productId: product.id,
        variantId: variant.id,
        productName: product.name,
        packSize: variant.packSize,
        unit: variant.unit,
        stockQuantity: variant.stockQuantity,
        sellingPrice: variant.sellingPrice,
        searchText: `${product.name} ${variant.packSize} ${product.brand}`.toLowerCase()
      }))
  );

  const filteredProducts = availableProducts.filter(product =>
    product.searchText.includes(productSearch.toLowerCase())
  );

  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const tax = 0; // Can be implemented as needed
  const grandTotal = subtotal + tax - discount;
  const balanceDue = grandTotal - amountPaid;

  const addItem = (product: typeof availableProducts[0]) => {
    const existingItemIndex = items.findIndex(
      item => item.productId === product.productId && item.variantId === product.variantId
    );

    if (existingItemIndex >= 0) {
      const updatedItems = [...items];
      updatedItems[existingItemIndex].quantity += 1;
      updatedItems[existingItemIndex].total = updatedItems[existingItemIndex].quantity * updatedItems[existingItemIndex].rate;
      setItems(updatedItems);
    } else {
      const newItem: InvoiceItem = {
        productId: product.productId,
        variantId: product.variantId,
        productName: product.productName,
        packSize: product.packSize,
        quantity: 1,
        rate: product.sellingPrice,
        total: product.sellingPrice
      };
      setItems([...items, newItem]);
    }
    setProductSearch('');
  };

  const updateItemQuantity = (index: number, quantity: number) => {
    if (quantity <= 0) {
      removeItem(index);
      return;
    }

    const updatedItems = [...items];
    updatedItems[index].quantity = quantity;
    updatedItems[index].total = quantity * updatedItems[index].rate;
    setItems(updatedItems);
  };

  const updateItemRate = (index: number, rate: number) => {
    const updatedItems = [...items];
    updatedItems[index].rate = rate;
    updatedItems[index].total = updatedItems[index].quantity * rate;
    setItems(updatedItems);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const createInvoice = () => {
    if (!selectedCustomer || items.length === 0) {
      alert('Please select a customer and add items to the bill');
      return;
    }

    // Check stock availability
    for (const item of items) {
      const product = products.find(p => p.id === item.productId);
      const variant = product?.variants.find(v => v.id === item.variantId);
      if (!variant || variant.stockQuantity < item.quantity) {
        alert(`Insufficient stock for ${item.productName} ${item.packSize}`);
        return;
      }
    }

    const invoice: Invoice = {
      id: Date.now().toString(),
      invoiceNumber: generateInvoiceNumber(invoices),
      customerId: selectedCustomer.id,
      customerName: selectedCustomer.name,
      items: [...items],
      subtotal,
      tax,
      discount,
      grandTotal,
      paymentType,
      amountPaid,
      balanceDue,
      status: balanceDue > 0 ? 'credit' : amountPaid < grandTotal ? 'partial' : 'paid',
      notes,
      createdAt: new Date().toISOString()
    };

    // Update stock
    setProducts(prevProducts =>
      prevProducts.map(product => ({
        ...product,
        variants: product.variants.map(variant => {
          const item = items.find(i => i.productId === product.id && i.variantId === variant.id);
          if (item) {
            return {
              ...variant,
              stockQuantity: variant.stockQuantity - item.quantity
            };
          }
          return variant;
        })
      }))
    );

    // Update customer
    setCustomers(prevCustomers =>
      prevCustomers.map(customer =>
        customer.id === selectedCustomer.id
          ? {
              ...customer,
              totalPurchases: customer.totalPurchases + grandTotal,
              creditBalance: customer.creditBalance + balanceDue,
              lastVisit: new Date().toISOString()
            }
          : customer
      )
    );

    // Save invoice
    setInvoices(prevInvoices => [...prevInvoices, invoice]);

    // Reset form
    resetForm();
    alert('Invoice created successfully!');
  };

  const resetForm = () => {
    setSelectedCustomer(null);
    setCustomerSearch('');
    setItems([]);
    setProductSearch('');
    setPaymentType('cash');
    setAmountPaid(0);
    setDiscount(0);
    setNotes('');
  };

  const handleCustomerSelect = (customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomerSearch('');
  };

  const createNewCustomer = (customerData: Omit<Customer, 'id' | 'totalPurchases' | 'lastVisit' | 'createdAt'>) => {
    const newCustomer: Customer = {
      ...customerData,
      id: Date.now().toString(),
      totalPurchases: 0,
      lastVisit: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };
    setCustomers(prev => [...prev, newCustomer]);
    setSelectedCustomer(newCustomer);
    setShowNewCustomer(false);
  };

  // Auto-fill amount paid when payment type changes
  React.useEffect(() => {
    if (paymentType !== 'credit') {
      setAmountPaid(grandTotal);
    } else {
      setAmountPaid(0);
    }
  }, [paymentType, grandTotal]);

  return (
    <div className="p-4 lg:p-6 max-w-full mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Bill</h1>
          <p className="text-gray-600">Generate professional invoices for your customers</p>
        </div>
        <div className="flex gap-2 mt-4 sm:mt-0">
          <button
            onClick={resetForm}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
          >
            Clear All
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* Billing Form */}
        <div className="xl:col-span-3 space-y-6">
          {/* Customer Selection */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <User className="w-5 h-5 mr-2" />
                Customer Information
              </h2>
              <button
                onClick={() => setShowNewCustomer(true)}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                + New Customer
              </button>
            </div>

            {selectedCustomer ? (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">{selectedCustomer.name}</h3>
                    <p className="text-sm text-gray-600">{selectedCustomer.phone}</p>
                    <p className="text-sm text-gray-600">{selectedCustomer.address}</p>
                    {selectedCustomer.creditBalance > 0 && (
                      <p className="text-sm text-red-600 font-medium">
                        Credit Balance: {formatCurrency(selectedCustomer.creditBalance)}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => setSelectedCustomer(null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="relative">
                <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search customer by name or phone..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {customerSearch && filteredCustomers.length > 0 && (
                  <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto z-10">
                    {filteredCustomers.map(customer => (
                      <button
                        key={customer.id}
                        onClick={() => handleCustomerSelect(customer)}
                        className="w-full text-left p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                      >
                        <div className="font-medium text-gray-900">{customer.name}</div>
                        <div className="text-sm text-gray-600">{customer.phone}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Product Selection */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Calculator className="w-5 h-5 mr-2" />
              Add Items
            </h2>

            <div className="relative mb-4">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search products..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {productSearch && filteredProducts.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto z-10">
                  {filteredProducts.slice(0, 10).map(product => (
                    <button
                      key={`${product.productId}-${product.variantId}`}
                      onClick={() => addItem(product)}
                      className="w-full text-left p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900">{product.productName}</div>
                          <div className="text-sm text-gray-600">{product.packSize} • Stock: {product.stockQuantity}</div>
                        </div>
                        <div className="font-semibold text-gray-900">
                          {formatCurrency(product.sellingPrice)}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Items List */}
            {items.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-medium text-gray-900">Invoice Items</h3>
                {items.map((item, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-medium text-gray-900">{item.productName}</h4>
                        <p className="text-sm text-gray-600">{item.packSize}</p>
                      </div>
                      <button
                        onClick={() => removeItem(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Quantity</label>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateItemQuantity(index, parseInt(e.target.value) || 1)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Rate</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.rate}
                          onChange={(e) => updateItemRate(index, parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Total</label>
                        <div className="px-3 py-2 bg-gray-100 rounded-lg font-semibold text-gray-900">
                          {formatCurrency(item.total)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Payment Details */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Type</label>
                <select
                  value={paymentType}
                  onChange={(e) => setPaymentType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="cash">Cash</option>
                  <option value="upi">UPI</option>
                  <option value="online">Online</option>
                  <option value="credit">Credit</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Amount Paid</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Discount</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={discount}
                onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Any additional notes..."
              />
            </div>
          </div>
        </div>

        {/* Live Receipt Preview */}
        <div className="xl:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 sticky top-4">
            {/* Receipt Header */}
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <Receipt className="w-5 h-5 mr-2" />
                Live Receipt Preview
              </h2>
            </div>

            {/* Receipt Content */}
            <div className="p-6 bg-gray-50 font-mono text-sm">
              <div className="bg-white p-6 rounded-lg shadow-sm border-2 border-dashed border-gray-300 max-w-sm mx-auto">
                {/* Business Header */}
                <div className="text-center border-b border-gray-300 pb-4 mb-4">
                  <div className="text-xs">{'*'.repeat(32)}</div>
                  <div className="font-bold text-lg my-2">{businessProfile?.shopName || 'SHOP NAME'}</div>
                  <div className="text-xs">{'*'.repeat(32)}</div>
                  <div className="text-xs mt-2">{businessProfile?.businessAddress || 'Business Address'}</div>
                  <div className="text-xs">📞 {businessProfile?.contactNumber || 'Contact Number'}</div>
                  {businessProfile?.gstNumber && (
                    <div className="text-xs">GST: {businessProfile.gstNumber}</div>
                  )}
                </div>

                {/* Invoice Details */}
                <div className="text-xs mb-4">
                  <div className="flex justify-between">
                    <span>Invoice#</span>
                    <span>{generateInvoiceNumber(invoices)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Date</span>
                    <span>{new Date().toLocaleDateString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Time</span>
                    <span>{new Date().toLocaleTimeString('en-IN', { hour12: true })}</span>
                  </div>
                </div>

                {/* Customer Info */}
                {selectedCustomer && (
                  <div className="text-xs mb-4 border-b border-gray-300 pb-2">
                    <div>Customer: {selectedCustomer.name}</div>
                    <div>Phone: {selectedCustomer.phone}</div>
                  </div>
                )}

                {/* Items */}
                {items.length > 0 ? (
                  <div className="mb-4">
                    {items.map((item, index) => (
                      <div key={index} className="mb-2">
                        <div className="flex justify-between">
                          <span className="text-xs">{item.productName}</span>
                          <span className="text-xs">{formatCurrency(item.total)}</span>
                        </div>
                        <div className="text-xs text-gray-600">
                          {item.quantity} x {item.packSize} @ {formatCurrency(item.rate)}
                        </div>
                      </div>
                    ))}
                    <div className="border-t border-gray-300 pt-2 mt-2">
                      <div className="flex justify-between text-xs">
                        <span>SUBTOTAL</span>
                        <span>{formatCurrency(subtotal)}</span>
                      </div>
                      {discount > 0 && (
                        <div className="flex justify-between text-xs">
                          <span>DISCOUNT</span>
                          <span>-{formatCurrency(discount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-bold text-sm border-t border-gray-300 pt-1 mt-1">
                        <span>TOTAL AMOUNT</span>
                        <span>{formatCurrency(grandTotal)}</span>
                      </div>
                      <div className="flex justify-between text-xs mt-1">
                        <span>PAID ({paymentType.toUpperCase()})</span>
                        <span>{formatCurrency(amountPaid)}</span>
                      </div>
                      {balanceDue !== 0 && (
                        <div className="flex justify-between text-xs">
                          <span>{balanceDue > 0 ? 'BALANCE DUE' : 'CHANGE'}</span>
                          <span>{formatCurrency(Math.abs(balanceDue))}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <div className="text-xs">Add items to see receipt</div>
                  </div>
                )}

                {/* Footer */}
                <div className="flex justify-between">
                  <div className="text-center w-full">
                    <div className="text-xs border-t border-gray-300 pt-2">
                      {'*'.repeat(10)} THANK YOU! {'*'.repeat(10)}
                    </div>
                    <div className="text-xs mt-1">Visit Again Soon! 🙏</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="p-4 border-t border-gray-200 space-y-3">
              <button
                onClick={createInvoice}
                disabled={!selectedCustomer || items.length === 0}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed text-white py-3 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center shadow-lg"
              >
                <Save className="w-5 h-5 mr-2" />
                Create Invoice
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={shareOnWhatsApp}
                  disabled={!selectedCustomer || items.length === 0}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center justify-center"
                >
                  <Smartphone className="w-4 h-4 mr-1" />
                  WhatsApp
                </button>
                <button
                  onClick={() => onViewChange('invoices')}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-3 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center justify-center"
                >
                  <Receipt className="w-4 h-4 mr-1" />
                  All Bills
                </button>
              </div>

              {/* Quick Summary */}
              <div className="bg-gray-50 rounded-lg p-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Items: {items.length}</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(grandTotal)}</span>
                </div>
                {balanceDue > 0 && (
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-red-600">Due:</span>
                    <span className="font-semibold text-red-600">{formatCurrency(balanceDue)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* New Customer Modal */}
      {showNewCustomer && (
        <NewCustomerForm
          onSave={createNewCustomer}
          onCancel={() => setShowNewCustomer(false)}
        />
      )}
    </div>
  );
};

const NewCustomerForm: React.FC<{
  onSave: (customer: Omit<Customer, 'id' | 'totalPurchases' | 'lastVisit' | 'createdAt'>) => void;
  onCancel: () => void;
}> = ({ onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    notes: '',
    creditBalance: 0
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg max-w-md w-full">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900">Add New Customer</h2>
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
              required
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              Add Customer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BillingSystem;

            </div>
          </div>
        </div>
      </div>

      {/* New Customer Modal */}
      {showNewCustomer && (
        <NewCustomerForm
          onSave={createNewCustomer}
          onCancel={() => setShowNewCustomer(false)}
        />
      )}
    </div>
  );
};

const NewCustomerForm: React.FC<{
  onSave: (customer: Omit<Customer, 'id' | 'totalPurchases' | 'lastVisit' | 'createdAt'>) => void;
  onCancel: () => void;
}> = ({ onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    notes: '',
    creditBalance: 0
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg max-w-md w-full">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900">Add New Customer</h2>
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
              required
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              Add Customer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BillingSystem;