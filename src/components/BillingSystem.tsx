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
            updatedItem.total = updatedItem.quantity * variant.sellingPrice;
          }
        }
        
        if (field === 'quantity' || field === 'rate') {
          updatedItem.total = (updatedItem.quantity * updatedItem.rate) - (updatedItem.discount || 0);
        }
        
        if (field === 'discount') {
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
  
  const discountedSubtotal = Math.max(0, subtotal - totalDiscount);
  const tax = enableGST ? (discountedSubtotal * gstRate) / 100 : 0;
  const grandTotal = discountedSubtotal + tax;
  const balanceDue = grandTotal - amountPaid;

  // Auto-save draft functionality
  useEffect(() => {
    if (items.length > 0 || selectedCustomer) {
      const draft = {
        id: currentDraft || Date.now().toString(),
        customer: selectedCustomer,
        items,
        paymentMethod,
        amountPaid,
        discountType,
        discountValue,
        enableGST,
        gstRate,
        notes,
        savedAt: new Date().toISOString()
      };
      localStorage.setItem('currentDraft', JSON.stringify(draft));
    }
  }, [items, selectedCustomer, paymentMethod, amountPaid, discountType, discountValue, enableGST, gstRate, notes]);

  // Load draft on component mount
  useEffect(() => {
    const savedDraft = localStorage.getItem('currentDraft');
    if (savedDraft) {
      const draft = JSON.parse(savedDraft);
      if (draft.items?.length > 0) {
        setItems(draft.items);
        setSelectedCustomer(draft.customer);
        setCustomerSearch(draft.customer?.name || '');
        setPaymentMethod(draft.paymentMethod || 'cash');
        setAmountPaid(draft.amountPaid || 0);
        setDiscountType(draft.discountType || 'percentage');
        setDiscountValue(draft.discountValue || 0);
        setEnableGST(draft.enableGST || false);
        setGstRate(draft.gstRate || 18);
        setNotes(draft.notes || '');
        setCurrentDraft(draft.id);
      }
    }
  }, []);

  const handleCustomerSelect = (customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomerSearch(customer.name);
  };

  const handleAddNewCustomer = () => {
   if (newCustomer.name) {
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

    // Validate that all items have required data
    const validItems = items.filter(item => item.productName && item.quantity > 0 && item.rate > 0);
    if (validItems.length === 0) {
      alert('Please add valid items with product, quantity, and rate.');
      return;
    }

    const invoice: Invoice = {
      id: Date.now().toString(),
      invoiceNumber: generateInvoiceNumber(invoices),
      customerId: selectedCustomer.id,
      customerName: selectedCustomer.name,
      items: validItems,
      subtotal,
      tax,
      discount: totalDiscount,
      grandTotal,
      amountPaid,
      balanceDue,
      paymentType: paymentMethod,
      status: balanceDue > 0 ? 'credit' : 'paid',
      notes,
      createdAt: new Date().toISOString()
    };

    setInvoices(prev => [...prev, invoice]);
    
    // Clear draft after successful save
    localStorage.removeItem('currentDraft');
    
    // Reset form
    setItems([]);
    setSelectedCustomer(null);
    setCustomerSearch('');
    setAmountPaid(0);
    setDiscountValue(0);
    setNotes('');
    setProductSearch('');
    setCurrentDraft('');
    
    alert('Invoice saved successfully!');
  };

  const shareOnWhatsApp = () => {
    if (!selectedCustomer || items.length === 0) return;

    const receiptText = `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏪 *${businessProfile?.shopName || 'KHAATA'}*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${businessProfile?.businessAddress || 'Shop Address'}
📞 ${businessProfile?.contactNumber || 'Contact Number'}
${businessProfile?.gstNumber ? `GST: ${businessProfile.gstNumber}` : ''}

┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃            🧾 *INVOICE*            ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

📋 *Invoice:* ${generateInvoiceNumber(invoices)}
📅 *Date:* ${new Date().toLocaleDateString('en-IN')}
🕐 *Time:* ${new Date().toLocaleTimeString('en-IN')}

👤 *Customer:* ${selectedCustomer.name}
📱 *Phone:* ${selectedCustomer.phone}

┌─────────────────────────────────────┐
│              📦 *ITEMS*              │
└─────────────────────────────────────┘

${items.map(item => 
  `🔸 *${item.quantity}x* ${item.productName}
   📦 ${item.packSize}
   💰 ₹${item.rate} × ${item.quantity} = *₹${item.total}*`
).join('\n\n')}

┌─────────────────────────────────────┐
│            💳 *BILLING*             │
└─────────────────────────────────────┘

💵 *Subtotal:* ${formatCurrency(subtotal)}
${totalDiscount > 0 ? `🎯 *Discount:* -${formatCurrency(totalDiscount)}\n` : ''}${enableGST ? `📊 *GST (${gstRate}%):* ${formatCurrency(tax)}\n` : ''}
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ 💰 *TOTAL: ${formatCurrency(grandTotal)}* ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

💳 *Payment:* ${paymentMethod.toUpperCase()}
✅ *Paid:* ${formatCurrency(amountPaid)}
${balanceDue > 0 ? `⚠️ *Balance Due:* ${formatCurrency(balanceDue)}` : ''}

┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃    🙏 *THANK YOU FOR YOUR*      ┃
┃         *BUSINESS!* 🙏          ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

💬 *Follow us for offers & updates!*
🔄 *Visit again soon!*
    `.trim();

    const whatsappUrl = `https://wa.me/${selectedCustomer.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(receiptText)}`;
    window.open(whatsappUrl, '_blank');
  };

  const sendReceiptToCustomer = () => {
    if (!selectedCustomer || items.length === 0) return;

   const receiptText = `🏪 *${businessProfile?.shopName || 'KHAATA'}*

Hi ${selectedCustomer.name}! 👋

Here's your purchase receipt:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 *Invoice:* ${generateInvoiceNumber(invoices)}
📅 *Date:* ${new Date().toLocaleDateString('en-IN')}

📦 *Items Purchased:*
${items.map(item => 
  `• ${item.quantity}x ${item.productName} (${item.packSize}) - ₹${item.total}`
).join('\n')}

💰 *Total Amount:* ${formatCurrency(grandTotal)}
💳 *Payment:* ${paymentMethod.toUpperCase()}
${balanceDue > 0 ? `⚠️ *Balance Due:* ${formatCurrency(balanceDue)}` : '✅ *Fully Paid*'}

🙏 Thank you for shopping with us!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

    const whatsappUrl = `https://wa.me/${selectedCustomer.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(receiptText)}`;
    window.open(whatsappUrl, '_blank');
  };

  const saveDraft = () => {
    if (items.length === 0 && !selectedCustomer) {
      alert('Nothing to save');
      return;
    }
    
    const draftName = prompt('Enter draft name:') || `Draft ${new Date().toLocaleString()}`;
    const draft = {
      id: Date.now().toString(),
      name: draftName,
      customer: selectedCustomer,
      items,
      paymentMethod,
      amountPaid,
      discountType,
      discountValue,
      enableGST,
      gstRate,
      notes,
      savedAt: new Date().toISOString()
    };
    
    const existingDrafts = JSON.parse(localStorage.getItem('invoiceDrafts') || '[]');
    existingDrafts.push(draft);
    localStorage.setItem('invoiceDrafts', JSON.stringify(existingDrafts));
    setSavedDrafts(existingDrafts);
    alert('Draft saved successfully!');
  };

  const loadDraft = (draft: any) => {
    setItems(draft.items);
    setSelectedCustomer(draft.customer);
    setCustomerSearch(draft.customer?.name || '');
    setPaymentMethod(draft.paymentMethod);
    setAmountPaid(draft.amountPaid);
    setDiscountType(draft.discountType);
    setDiscountValue(draft.discountValue);
    setEnableGST(draft.enableGST);
    setGstRate(draft.gstRate);
    setNotes(draft.notes);
  };

  const clearDraft = () => {
    if (confirm('Clear current invoice? This will remove all items and customer selection.')) {
      setItems([]);
      setSelectedCustomer(null);
      setCustomerSearch('');
      setAmountPaid(0);
      setDiscountValue(0);
      setNotes('');
      setProductSearch('');
      localStorage.removeItem('currentDraft');
    }
  };

  // Load saved drafts on mount
  useEffect(() => {
    const drafts = JSON.parse(localStorage.getItem('invoiceDrafts') || '[]');
    setSavedDrafts(drafts);
  }, []);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Side - Billing Form */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          {/* Header with Quick Actions */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-6 mb-6 text-white">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className="bg-white bg-opacity-20 p-3 rounded-lg mr-4">
                  <Receipt className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Create New Invoice</h2>
                  <p className="text-blue-100">Professional billing made simple</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-blue-100 mb-1">Invoice Number</div>
                <div className="text-xl font-bold">
                  {generateInvoiceNumber(invoices)}
                </div>
              </div>
            </div>
            
            {/* Quick Action Buttons */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={saveDraft}
                className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-lg flex items-center transition-all duration-200"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Draft
              </button>
              <button
                onClick={clearDraft}
                className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-lg flex items-center transition-all duration-200"
              >
                <X className="w-4 h-4 mr-2" />
                Clear All
              </button>
              {savedDrafts.length > 0 && (
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      const draft = savedDrafts.find(d => d.id === e.target.value);
                      if (draft) loadDraft(draft);
                    }
                  }}
                  className="bg-white bg-opacity-20 text-white px-4 py-2 rounded-lg border border-white border-opacity-30"
                >
                  <option value="">Load Draft</option>
                  {savedDrafts.map(draft => (
                    <option key={draft.id} value={draft.id} className="text-gray-900">
                      {draft.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            {/* Progress Indicator */}
            <div className="mb-6">
              <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                <span>Invoice Progress</span>
                <span>{Math.round(((selectedCustomer ? 1 : 0) + (items.length > 0 ? 1 : 0)) / 2 * 100)}% Complete</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((selectedCustomer ? 1 : 0) + (items.length > 0 ? 1 : 0)) / 2 * 100}%` }}
                ></div>
              </div>
            </div>
            
            {/* Live Totals Summary */}
            {(items.length > 0 || selectedCustomer) && (
              <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-4 mb-6 border border-green-200">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <p className="text-sm text-gray-600">Items</p>
                    <p className="text-xl font-bold text-gray-900">{items.length}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Subtotal</p>
                    <p className="text-xl font-bold text-gray-900">{formatCurrency(subtotal)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Tax</p>
                    <p className="text-xl font-bold text-gray-900">{formatCurrency(tax)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total</p>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(grandTotal)}</p>
                  </div>
                </div>
              </div>
            )}
            
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
                   placeholder="Phone Number (optional)"
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
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                  <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="🔍 Search products to add instantly..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                  />
                  {productSearch && (
                    <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-xl max-h-64 overflow-y-auto">
                      {filteredProducts.slice(0, 8).map(variant => (
                        <div
                          key={variant.id}
                          onClick={() => {
                            const newItem: InvoiceItem = {
                              productId: variant.productId,
                              variantId: variant.id,
                              productName: variant.productName,
                              packSize: variant.packSize,
                              quantity: 1,
                              rate: variant.sellingPrice,
                              total: variant.sellingPrice,
                              tax: 0,
                              discount: 0
                            };
                            setItems(prev => [...prev, newItem]);
                            setProductSearch('');
                          }}
                          className="p-4 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-all duration-200"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="font-semibold text-gray-900">{variant.productName}</div>
                              <div className="text-sm text-gray-600">{variant.packSize} • {variant.brand}</div>
                              <div className="flex items-center gap-2 mt-1">
                                <span className={`text-xs px-2 py-1 rounded-full ${
                                  variant.stockQuantity > variant.lowStockThreshold 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  Stock: {variant.stockQuantity}
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-blue-600">{formatCurrency(variant.sellingPrice)}</div>
                              <div className="text-xs text-gray-500">Click to add</div>
                            </div>
                          </div>
                        </div>
                      ))}
                      {filteredProducts.length === 0 && (
                        <div className="p-4 text-center text-gray-500">
                          <Package className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                          <p>No products found</p>
                        </div>
                      )}
                    </div>
                  )}
                  </div>
                  <button
                    onClick={() => setQuickAddMode(!quickAddMode)}
                    className={`px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                      quickAddMode 
                        ? 'bg-green-600 text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Quick Add
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {items.map((item, index) => (
                  <div key={index} className="p-4 border border-gray-200 rounded-xl bg-gradient-to-r from-gray-50 to-blue-50 hover:shadow-md transition-all duration-200">
                    <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                      <div className="md:col-span-3">
                        <label className="block text-xs font-medium text-gray-700 mb-1">Product</label>
                        <select
                          value={item.variantId}
                          onChange={(e) => updateItem(index, 'variantId', e.target.value)}
                          className="w-full px-3 py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium"
                        >
                          <option value="">Select Product</option>
                          {filteredProducts.map(variant => (
                            <option key={variant.id} value={variant.id}>
                              {variant.productName} • {variant.packSize} • {formatCurrency(variant.sellingPrice)}
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
                          step="1"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                          className="w-full px-3 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-bold text-center"
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
                          className="w-full px-3 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Discount</label>
                        <input
                          type="number"
                          placeholder="Discount"
                          min="0"
                          step="0.01"
                          value={item.discount || 0}
                          onChange={(e) => updateItem(index, 'discount', parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-bold"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Total</label>
                          <div className="bg-green-100 px-3 py-2 rounded-lg">
                            <span className="font-bold text-green-800 text-lg">{formatCurrency(item.total)}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => removeItem(index)}
                          className="p-3 text-red-600 hover:bg-red-100 rounded-lg transition-all duration-200 mt-4 hover:scale-110"
                          title="Remove Item"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                
                {items.length === 0 && (
                  <div className="text-center py-12 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border-2 border-dashed border-gray-300">
                    <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No items added yet</h3>
                    <p className="text-gray-600 mb-4">Search and add products to create your invoice</p>
                    <button
                      onClick={addItem}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
                    >
                      Add First Item
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Discount Section */}
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Calculator className="w-5 h-5 mr-2 text-blue-600" />
                Discount & Tax Calculation
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Discount Type</label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as 'percentage' | 'amount')}
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium"
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
                      className="w-full px-3 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-bold text-center"
                      placeholder={discountType === 'percentage' ? '0' : '0.00'}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Enable GST</label>
                  <div className="flex items-center space-x-3 mt-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={enableGST}
                        onChange={(e) => setEnableGST(e.target.checked)}
                        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm font-medium text-gray-700">Add GST</span>
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
                     step="0.01"
                      value={gstRate}
                      onChange={(e) => setGstRate(parseFloat(e.target.value) || 18)}
                      className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-bold text-center"
                     placeholder="0, 5, 12, 18, 28"
                    />
                  </div>
                )}
              </div>
              
              {/* Payment and Balance Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount Paid
                  </label>
                  <input
                    type="number"
                    value={amountPaid}
                    min="0"
                    step="0.01"
                    onChange={(e) => setAmountPaid(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-bold text-lg"
                  />
                </div>
                <div className={`p-4 rounded-lg border ${balanceDue > 0 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Balance Due
                  </label>
                  <div className={`px-3 py-3 rounded-lg font-bold text-lg ${
                    balanceDue > 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {formatCurrency(balanceDue)}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Payment Section */}
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <CreditCard className="w-5 h-5 mr-2 text-green-600" />
                Payment Method
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { value: 'cash', label: 'Cash', icon: '💵', color: 'green' },
                  { value: 'upi', label: 'UPI', icon: '📱', color: 'blue' },
                  { value: 'online', label: 'Online', icon: '💳', color: 'purple' },
                  { value: 'credit', label: 'Credit', icon: '📝', color: 'orange' }
                ].map(method => (
                  <button
                    key={method.value}
                    type="button"
                    onClick={() => setPaymentMethod(method.value as any)}
                    className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                      paymentMethod === method.value
                        ? `border-${method.color}-500 bg-${method.color}-50 text-${method.color}-700`
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-2xl mb-2">{method.icon}</div>
                    <div className="font-medium">{method.label}</div>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Notes */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <input
                type="text"
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional notes..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
               placeholder="Phone Number (optional)"
              />
            </div>

            {/* Action Buttons */}
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Receipt className="w-5 h-5 mr-2 text-blue-600" />
                Complete Invoice
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={handleSaveInvoice}
                disabled={!selectedCustomer || items.length === 0}
                className="flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                <Save className="w-5 h-5" />
                Save Invoice
              </button>
              <button
                onClick={sendReceiptToCustomer}
                disabled={!selectedCustomer || items.length === 0}
                className="flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                <Phone className="w-5 h-5" />
                Send to Customer
              </button>
              <button
                onClick={shareOnWhatsApp}
                disabled={!selectedCustomer || items.length === 0}
                className="flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                <Share2 className="w-5 h-5" />
                Share Receipt
              </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Live Receipt Preview */}
      <div className="hidden lg:block w-96 bg-gray-50 border-l border-gray-200 p-6 overflow-y-auto">
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
           <div className="font-bold text-center text-base">{businessProfile?.shopName || 'KHAATA'}</div>
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
                  <span className="text-xs font-medium">{item.quantity || 0}x {item.productName || 'Product'}</span>
                  <span className="text-xs font-bold">{formatCurrency(item.total || 0)}</span>
                </div>
                {item.packSize && (
                  <div className="text-xs text-gray-600 ml-2">{item.packSize}</div>
                )}
                <div className="text-xs text-gray-500 ml-2">
                  {formatCurrency(item.rate || 0)} × {item.quantity || 0} = {formatCurrency((item.quantity || 0) * (item.rate || 0))}
                  {(item.discount || 0) > 0 && <span> - {formatCurrency(item.discount || 0)}</span>}
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
            {totalDiscount > 0 && (
              <div className="flex justify-between text-xs">
                <span>DISCOUNT</span>
                <span>-{formatCurrency(totalDiscount)}</span>
              </div>
            )}
            {enableGST && (
              <div className="flex justify-between text-xs">
                <span>GST ({gstRate}%)</span>
                <span>{formatCurrency(tax)}</span>
              </div>
            )}
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