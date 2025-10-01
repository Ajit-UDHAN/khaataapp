import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  User, 
  Phone, 
  MapPin, 
  Calculator,
  Receipt,
  Printer,
  Share2,
  Save,
  X,
  Search,
  Package
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { Invoice, InvoiceItem, Customer } from '../types';
import { formatCurrency, generateInvoiceNumber } from '../utils/calculations';

interface BillingSystemProps {
  onViewChange: (view: string) => void;
}

const BillingSystem: React.FC<BillingSystemProps> = ({ onViewChange }) => {
  const { products, customers, setCustomers, invoices, setInvoices } = useApp();
  const { businessProfile } = useAuth();
  
  // Billing state
  const [selectedItems, setSelectedItems] = useState<InvoiceItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [gstRate, setGstRate] = useState(18);
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState<'percentage' | 'amount'>('percentage');
  const [paymentType, setPaymentType] = useState<'cash' | 'upi' | 'online' | 'credit'>('cash');
  const [notes, setNotes] = useState('');
  const [showCalculator, setShowCalculator] = useState(false);

  // Calculations
  const subtotal = selectedItems.reduce((sum, item) => sum + item.total, 0);
  const discountAmount = discountType === 'percentage' 
    ? (subtotal * discount) / 100 
    : discount;
  const taxableAmount = subtotal - discountAmount;
  const taxAmount = (taxableAmount * gstRate) / 100;
  const grandTotal = taxableAmount + taxAmount;

  // Filter products for search
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.brand.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addItemToBill = (productId: string, variantId: string) => {
    const product = products.find(p => p.id === productId);
    const variant = product?.variants.find(v => v.id === variantId);
    
    if (!product || !variant) return;

    const existingItemIndex = selectedItems.findIndex(
      item => item.productId === productId && item.variantId === variantId
    );

    if (existingItemIndex >= 0) {
      // Update quantity
      setSelectedItems(prev => prev.map((item, index) => 
        index === existingItemIndex 
          ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.rate }
          : item
      ));
    } else {
      // Add new item
      const newItem: InvoiceItem = {
        productId,
        variantId,
        productName: product.name,
        packSize: variant.packSize,
        quantity: 1,
        rate: variant.sellingPrice,
        total: variant.sellingPrice
      };
      setSelectedItems(prev => [...prev, newItem]);
    }
  };

  const updateItemQuantity = (index: number, quantity: number) => {
    if (quantity <= 0) {
      removeItem(index);
      return;
    }
    
    setSelectedItems(prev => prev.map((item, i) => 
      i === index 
        ? { ...item, quantity, total: quantity * item.rate }
        : item
    ));
  };

  const updateItemRate = (index: number, rate: number) => {
    setSelectedItems(prev => prev.map((item, i) => 
      i === index 
        ? { ...item, rate, total: item.quantity * rate }
        : item
    ));
  };

  const removeItem = (index: number) => {
    setSelectedItems(prev => prev.filter((_, i) => i !== index));
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
    setSelectedCustomer(newCustomer);
    setShowCustomerForm(false);
  };

  const generateInvoice = () => {
    if (selectedItems.length === 0) {
      alert('Please add items to the bill');
      return;
    }

    if (!selectedCustomer) {
      alert('Please select a customer');
      return;
    }

    const amountPaid = paymentType === 'credit' ? 0 : grandTotal;
    const balanceDue = grandTotal - amountPaid;

    const invoice: Invoice = {
      id: Date.now().toString(),
      invoiceNumber: generateInvoiceNumber(invoices),
      customerId: selectedCustomer.id,
      customerName: selectedCustomer.name,
      items: selectedItems,
      subtotal,
      tax: taxAmount,
      discount: discountAmount,
      grandTotal,
      paymentType,
      amountPaid,
      balanceDue,
      status: paymentType === 'credit' ? 'credit' : balanceDue > 0 ? 'partial' : 'paid',
      notes,
      createdAt: new Date().toISOString()
    };

    setInvoices(prev => [...prev, invoice]);

    // Update customer credit balance if needed
    if (balanceDue > 0) {
      setCustomers(prev => prev.map(c => 
        c.id === selectedCustomer.id 
          ? { ...c, creditBalance: c.creditBalance + balanceDue }
          : c
      ));
    }

    // Clear the bill
    setSelectedItems([]);
    setSelectedCustomer(null);
    setDiscount(0);
    setNotes('');
    
    alert('Invoice generated successfully!');
    onViewChange('invoices');
  };

  const printReceipt = () => {
    if (selectedItems.length === 0) {
      alert('Please add items to print receipt');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const receiptHTML = generateReceiptHTML();
    printWindow.document.write(receiptHTML);
    printWindow.document.close();
    printWindow.print();
  };

  const shareReceipt = () => {
    if (!selectedCustomer || selectedItems.length === 0) {
      alert('Please select customer and add items');
      return;
    }

    const message = generateWhatsAppMessage();
    const whatsappUrl = `https://wa.me/${selectedCustomer.phone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const generateReceiptHTML = () => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt - ${businessProfile?.shopName || 'KHAATA'}</title>
        <style>
          body { 
            font-family: 'Courier New', monospace; 
            max-width: 400px; 
            margin: 0 auto; 
            padding: 20px; 
            line-height: 1.4;
          }
          .header { 
            text-align: center; 
            border-bottom: 2px solid #000; 
            padding-bottom: 10px; 
            margin-bottom: 15px; 
          }
          .shop-name { 
            font-size: 24px; 
            font-weight: bold; 
            margin-bottom: 5px; 
            text-transform: uppercase;
          }
          .shop-details { 
            font-size: 12px; 
            color: #333; 
            margin-bottom: 3px;
          }
          .invoice-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 15px;
            font-size: 12px;
          }
          .customer-info { 
            margin-bottom: 15px; 
            padding: 10px; 
            background: #f9f9f9; 
            border: 1px solid #ddd;
          }
          .customer-info h4 {
            margin: 0 0 5px 0;
            font-size: 14px;
          }
          .items-table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-bottom: 15px; 
          }
          .items-table th, .items-table td { 
            padding: 6px 4px; 
            text-align: left; 
            border-bottom: 1px solid #ddd; 
            font-size: 11px;
          }
          .items-table th { 
            background: #f0f0f0; 
            font-weight: bold; 
            text-transform: uppercase;
          }
          .item-name {
            font-weight: bold;
          }
          .item-details {
            font-size: 10px;
            color: #666;
          }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          .totals { 
            border-top: 2px solid #000; 
            padding-top: 10px; 
            margin-top: 10px;
          }
          .total-row { 
            display: flex; 
            justify-content: space-between; 
            margin-bottom: 3px; 
            font-size: 12px;
          }
          .grand-total { 
            font-weight: bold; 
            font-size: 16px; 
            border-top: 1px solid #000; 
            padding-top: 5px; 
            margin-top: 5px;
          }
          .payment-info {
            margin-top: 10px;
            padding: 8px;
            background: #f0f0f0;
            border: 1px solid #ddd;
          }
          .footer { 
            text-align: center; 
            margin-top: 20px; 
            font-size: 11px; 
            color: #666; 
            border-top: 1px dashed #999;
            padding-top: 10px;
          }
          .thank-you {
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          @media print { 
            body { margin: 0; padding: 10px; } 
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="shop-name">${businessProfile?.shopName || 'KHAATA'}</div>
          <div class="shop-details">${businessProfile?.businessAddress || ''}</div>
          <div class="shop-details">Phone: ${businessProfile?.contactNumber || ''}</div>
          ${businessProfile?.gstNumber ? `<div class="shop-details">GST: ${businessProfile.gstNumber}</div>` : ''}
        </div>

        <div class="invoice-info">
          <div>
            <strong>Invoice:</strong> ${generateInvoiceNumber(invoices)}<br>
            <strong>Date:</strong> ${new Date().toLocaleDateString()}<br>
            <strong>Time:</strong> ${new Date().toLocaleTimeString()}
          </div>
        </div>

        <div class="customer-info">
          <h4>Bill To:</h4>
          <strong>${selectedCustomer?.name || 'Walk-in Customer'}</strong><br>
          ${selectedCustomer?.phone ? `Phone: ${selectedCustomer.phone}<br>` : ''}
          ${selectedCustomer?.address ? `${selectedCustomer.address}<br>` : ''}
        </div>

        <table class="items-table">
          <thead>
            <tr>
              <th style="width: 40%">Item</th>
              <th style="width: 15%" class="text-center">Qty</th>
              <th style="width: 20%" class="text-right">Rate</th>
              <th style="width: 25%" class="text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${selectedItems.map(item => `
              <tr>
                <td>
                  <div class="item-name">${item.productName}</div>
                  <div class="item-details">${item.packSize}</div>
                </td>
                <td class="text-center">${item.quantity}</td>
                <td class="text-right">${formatCurrency(item.rate)}</td>
                <td class="text-right"><strong>${formatCurrency(item.total)}</strong></td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="totals">
          <div class="total-row">
            <span>Subtotal:</span>
            <span>${formatCurrency(subtotal)}</span>
          </div>
          ${discountAmount > 0 ? `
            <div class="total-row">
              <span>Discount (${discountType === 'percentage' ? discount + '%' : 'Fixed'}):</span>
              <span>-${formatCurrency(discountAmount)}</span>
            </div>
            <div class="total-row">
              <span>After Discount:</span>
              <span>${formatCurrency(taxableAmount)}</span>
            </div>
          ` : ''}
          <div class="total-row">
            <span>GST (${gstRate}%):</span>
            <span>${formatCurrency(taxAmount)}</span>
          </div>
          <div class="total-row grand-total">
            <span>GRAND TOTAL:</span>
            <span>${formatCurrency(grandTotal)}</span>
          </div>
        </div>

        <div class="payment-info">
          <div class="total-row">
            <span><strong>Payment Method:</strong></span>
            <span><strong>${paymentType.toUpperCase()}</strong></span>
          </div>
          <div class="total-row">
            <span>Amount Paid:</span>
            <span>${formatCurrency(paymentType === 'credit' ? 0 : grandTotal)}</span>
          </div>
          ${paymentType === 'credit' ? `
            <div class="total-row" style="color: #d32f2f;">
              <span><strong>Balance Due:</strong></span>
              <span><strong>${formatCurrency(grandTotal)}</strong></span>
            </div>
          ` : ''}
        </div>

        ${notes ? `
          <div style="margin-top: 15px; padding: 8px; background: #f9f9f9; border: 1px solid #ddd;">
            <strong>Notes:</strong> ${notes}
          </div>
        ` : ''}

        <div class="footer">
          <div class="thank-you">Thank You for Your Business!</div>
          <div>Visit Again Soon</div>
          <div style="margin-top: 10px;">Powered by KHAATA Business Management</div>
        </div>
      </body>
      </html>
    `;
  };

  const generateWhatsAppMessage = () => {
    return `*${businessProfile?.shopName || 'KHAATA'} - INVOICE*

📋 *Invoice:* ${generateInvoiceNumber(invoices)}
📅 *Date:* ${new Date().toLocaleDateString()}
🕐 *Time:* ${new Date().toLocaleTimeString()}

👤 *Customer:* ${selectedCustomer?.name}
${selectedCustomer?.phone ? `📞 *Phone:* ${selectedCustomer.phone}` : ''}

*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*

📦 *ITEMS:*
${selectedItems.map((item, index) => 
  `${index + 1}. *${item.productName}*
   📏 Size: ${item.packSize}
   🔢 Qty: ${item.quantity} × ${formatCurrency(item.rate)} = *${formatCurrency(item.total)}*`
).join('\n\n')}

*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*

💰 *BILL SUMMARY:*
Subtotal: ${formatCurrency(subtotal)}${discountAmount > 0 ? `
Discount: -${formatCurrency(discountAmount)}
After Discount: ${formatCurrency(taxableAmount)}` : ''}
GST (${gstRate}%): ${formatCurrency(taxAmount)}

*🎯 GRAND TOTAL: ${formatCurrency(grandTotal)}*

💳 *Payment:* ${paymentType.toUpperCase()}
${paymentType === 'credit' ? `⚠️ *Balance Due:* ${formatCurrency(grandTotal)}` : '✅ *Paid:* ${formatCurrency(grandTotal)}'}

${notes ? `📝 *Notes:* ${notes}\n` : ''}
*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*

🙏 Thank you for your business!
🔄 Visit again soon!

_Powered by KHAATA Business Management_`;
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Side - Billing Interface */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <img src="/KHA.jpg" alt="KHAATA" className="w-8 h-8 rounded mr-3" />
                New Bill
              </h1>
              <p className="text-gray-600">Create professional invoices and receipts</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowCalculator(!showCalculator)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg flex items-center transition-colors duration-200"
              >
                <Calculator className="w-5 h-5 mr-2" />
                Calculator
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Main Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {/* Customer Selection */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <User className="w-5 h-5 mr-2" />
                Customer Information
              </h2>
              
              {selectedCustomer ? (
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                  <div>
                    <p className="font-semibold text-gray-900">{selectedCustomer.name}</p>
                    {selectedCustomer.phone && (
                      <p className="text-sm text-gray-600 flex items-center">
                        <Phone className="w-4 h-4 mr-1" />
                        {selectedCustomer.phone}
                      </p>
                    )}
                    {selectedCustomer.address && (
                      <p className="text-sm text-gray-600 flex items-center">
                        <MapPin className="w-4 h-4 mr-1" />
                        {selectedCustomer.address}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => setSelectedCustomer(null)}
                    className="text-red-600 hover:text-red-800 p-2"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {customers.slice(0, 4).map(customer => (
                      <button
                        key={customer.id}
                        onClick={() => setSelectedCustomer(customer)}
                        className="p-3 text-left border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors duration-200"
                      >
                        <p className="font-medium text-gray-900">{customer.name}</p>
                        <p className="text-sm text-gray-600">{customer.phone}</p>
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setShowCustomerForm(true)}
                    className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors duration-200"
                  >
                    + Add New Customer
                  </button>
                </div>
              )}
            </div>

            {/* Product Search & Selection */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Package className="w-5 h-5 mr-2" />
                Add Products
              </h2>
              
              <div className="relative mb-4">
                <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto">
                {filteredProducts.map(product => 
                  product.variants.map(variant => (
                    <button
                      key={`${product.id}-${variant.id}`}
                      onClick={() => addItemToBill(product.id, variant.id)}
                      className="p-3 text-left border border-gray-200 rounded-lg hover:bg-green-50 hover:border-green-300 transition-colors duration-200"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{product.name}</p>
                          <p className="text-sm text-gray-600">{variant.packSize} • {product.brand}</p>
                          <p className="text-sm text-gray-500">Stock: {variant.stockQuantity}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-green-600">{formatCurrency(variant.sellingPrice)}</p>
                          <Plus className="w-4 h-4 text-green-600 ml-auto" />
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Selected Items */}
            {selectedItems.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Bill Items ({selectedItems.length})
                </h2>
                
                <div className="space-y-3">
                  {selectedItems.map((item, index) => (
                    <div key={index} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{item.productName}</p>
                        <p className="text-sm text-gray-600">{item.packSize}</p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateItemQuantity(index, item.quantity - 1)}
                          className="p-1 text-red-600 hover:bg-red-100 rounded"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateItemQuantity(index, parseInt(e.target.value) || 1)}
                          className="w-16 px-2 py-1 text-center border border-gray-300 rounded"
                        />
                        <button
                          onClick={() => updateItemQuantity(index, item.quantity + 1)}
                          className="p-1 text-green-600 hover:bg-green-100 rounded"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="w-24">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.rate}
                          onChange={(e) => updateItemRate(index, parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1 text-right border border-gray-300 rounded"
                        />
                      </div>

                      <div className="w-24 text-right">
                        <p className="font-semibold text-gray-900">{formatCurrency(item.total)}</p>
                      </div>

                      <button
                        onClick={() => removeItem(index)}
                        className="p-1 text-red-600 hover:bg-red-100 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bill Settings */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Bill Settings</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">GST Rate (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={gstRate}
                    onChange={(e) => setGstRate(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <div className="flex flex-wrap gap-1 mt-2">
                    {[0, 5, 12, 18, 28].map(rate => (
                      <button
                        key={rate}
                        onClick={() => setGstRate(rate)}
                        className={`px-2 py-1 text-xs rounded ${
                          gstRate === rate 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {rate}%
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Discount</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="0"
                      value={discount}
                      onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <select
                      value={discountType}
                      onChange={(e) => setDiscountType(e.target.value as 'percentage' | 'amount')}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="percentage">%</option>
                      <option value="amount">₹</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
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
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Add any notes for this bill..."
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={generateInvoice}
                disabled={selectedItems.length === 0 || !selectedCustomer}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-6 py-3 rounded-lg font-semibold flex items-center justify-center transition-colors duration-200"
              >
                <Save className="w-5 h-5 mr-2" />
                Generate Invoice
              </button>
              <button
                onClick={printReceipt}
                disabled={selectedItems.length === 0}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white px-6 py-3 rounded-lg font-semibold flex items-center transition-colors duration-200"
              >
                <Printer className="w-5 h-5 mr-2" />
                Print
              </button>
              <button
                onClick={shareReceipt}
                disabled={selectedItems.length === 0 || !selectedCustomer?.phone}
                className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white px-6 py-3 rounded-lg font-semibold flex items-center transition-colors duration-200"
              >
                <Share2 className="w-5 h-5 mr-2" />
                Share
              </button>
            </div>
          </div>

          {/* Right Side - Live Receipt Preview */}
          <div className="hidden lg:block w-96 bg-gray-50 border-l border-gray-200 p-6 overflow-y-auto">
            <div className="sticky top-0 bg-gray-50 pb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Receipt className="w-5 h-5 mr-2" />
                Live Receipt Preview
              </h3>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 font-mono text-sm">
              {/* Receipt Header */}
              <div className="text-center border-b-2 border-gray-800 pb-4 mb-4">
                <h2 className="text-xl font-bold uppercase">{businessProfile?.shopName || 'KHAATA'}</h2>
                {businessProfile?.businessAddress && (
                  <p className="text-xs text-gray-600 mt-1">{businessProfile.businessAddress}</p>
                )}
                {businessProfile?.contactNumber && (
                  <p className="text-xs text-gray-600">Phone: {businessProfile.contactNumber}</p>
                )}
                {businessProfile?.gstNumber && (
                  <p className="text-xs text-gray-600">GST: {businessProfile.gstNumber}</p>
                )}
              </div>

              {/* Invoice Info */}
              <div className="mb-4 text-xs">
                <div className="flex justify-between">
                  <span>Invoice: {generateInvoiceNumber(invoices)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Date: {new Date().toLocaleDateString()}</span>
                  <span>Time: {new Date().toLocaleTimeString()}</span>
                </div>
              </div>

              {/* Customer Info */}
              <div className="mb-4 p-3 bg-gray-50 rounded">
                <p className="font-bold">Bill To:</p>
                <p><strong>{selectedCustomer?.name || 'Select Customer'}</strong></p>
                {selectedCustomer?.phone && <p>Phone: {selectedCustomer.phone}</p>}
                {selectedCustomer?.address && <p>{selectedCustomer.address}</p>}
              </div>

              {/* Items */}
              <div className="mb-4">
                <div className="border-b border-gray-400 pb-2 mb-2">
                  <div className="grid grid-cols-12 gap-1 text-xs font-bold">
                    <div className="col-span-5">ITEM</div>
                    <div className="col-span-2 text-center">QTY</div>
                    <div className="col-span-2 text-right">RATE</div>
                    <div className="col-span-3 text-right">AMOUNT</div>
                  </div>
                </div>
                
                {selectedItems.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No items added</p>
                ) : (
                  selectedItems.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-1 text-xs mb-2">
                      <div className="col-span-5">
                        <div className="font-medium">{item.productName}</div>
                        <div className="text-gray-600">{item.packSize}</div>
                      </div>
                      <div className="col-span-2 text-center">{item.quantity}</div>
                      <div className="col-span-2 text-right">{formatCurrency(item.rate)}</div>
                      <div className="col-span-3 text-right font-medium">{formatCurrency(item.total)}</div>
                    </div>
                  ))
                )}
              </div>

              {/* Totals */}
              {selectedItems.length > 0 && (
                <div className="border-t-2 border-gray-800 pt-3">
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>{formatCurrency(subtotal)}</span>
                    </div>
                    {discountAmount > 0 && (
                      <>
                        <div className="flex justify-between">
                          <span>Discount ({discountType === 'percentage' ? discount + '%' : 'Fixed'}):</span>
                          <span>-{formatCurrency(discountAmount)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>After Discount:</span>
                          <span>{formatCurrency(taxableAmount)}</span>
                        </div>
                      </>
                    )}
                    <div className="flex justify-between">
                      <span>GST ({gstRate}%):</span>
                      <span>{formatCurrency(taxAmount)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-base border-t border-gray-400 pt-2">
                      <span>GRAND TOTAL:</span>
                      <span>{formatCurrency(grandTotal)}</span>
                    </div>
                    <div className="flex justify-between text-xs mt-2 p-2 bg-gray-100 rounded">
                      <span>Payment Method:</span>
                      <span className="font-medium">{paymentType.toUpperCase()}</span>
                    </div>
                    {paymentType === 'credit' && (
                      <div className="flex justify-between text-xs text-red-600 font-medium">
                        <span>Balance Due:</span>
                        <span>{formatCurrency(grandTotal)}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {notes && (
                <div className="mt-4 pt-3 border-t border-gray-400">
                  <p className="text-xs"><strong>Notes:</strong> {notes}</p>
                </div>
              )}

              <div className="text-center mt-6 pt-4 border-t border-gray-400 text-xs text-gray-600">
                <div className="font-bold mb-1">Thank You for Your Business!</div>
                <div>Visit Again Soon</div>
                <div className="mt-2">Powered by KHAATA</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Form Modal */}
      {showCustomerForm && (
        <CustomerFormModal
          onSave={handleAddCustomer}
          onCancel={() => setShowCustomerForm(false)}
        />
      )}

      {/* Calculator Modal */}
      {showCalculator && (
        <CalculatorModal onClose={() => setShowCalculator(false)} />
      )}
    </div>
  );
};

const CustomerFormModal: React.FC<{
  onSave: (customer: any) => void;
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
    if (!formData.name.trim()) {
      alert('Customer name is required');
      return;
    }
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Customer name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone (Optional)</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Phone number"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Address (Optional)</label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Customer address"
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

const CalculatorModal: React.FC<{
  onClose: () => void;
}> = ({ onClose }) => {
  const [display, setDisplay] = useState('0');
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);

  const inputNumber = (num: string) => {
    if (waitingForOperand) {
      setDisplay(num);
      setWaitingForOperand(false);
    } else {
      setDisplay(display === '0' ? num : display + num);
    }
  };

  const inputOperation = (nextOperation: string) => {
    const inputValue = parseFloat(display);

    if (previousValue === null) {
      setPreviousValue(inputValue);
    } else if (operation) {
      const currentValue = previousValue || 0;
      const newValue = calculate(currentValue, inputValue, operation);

      setDisplay(String(newValue));
      setPreviousValue(newValue);
    }

    setWaitingForOperand(true);
    setOperation(nextOperation);
  };

  const calculate = (firstValue: number, secondValue: number, operation: string) => {
    switch (operation) {
      case '+':
        return firstValue + secondValue;
      case '-':
        return firstValue - secondValue;
      case '×':
        return firstValue * secondValue;
      case '÷':
        return firstValue / secondValue;
      case '=':
        return secondValue;
      default:
        return secondValue;
    }
  };

  const performCalculation = () => {
    const inputValue = parseFloat(display);

    if (previousValue !== null && operation) {
      const newValue = calculate(previousValue, inputValue, operation);
      setDisplay(String(newValue));
      setPreviousValue(null);
      setOperation(null);
      setWaitingForOperand(true);
    }
  };

  const clear = () => {
    setDisplay('0');
    setPreviousValue(null);
    setOperation(null);
    setWaitingForOperand(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg w-80">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Calculator</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          <div className="bg-gray-900 text-white p-4 rounded-lg mb-4 text-right text-2xl font-mono">
            {display}
          </div>

          <div className="grid grid-cols-4 gap-2">
            <button
              onClick={clear}
              className="col-span-2 bg-red-500 hover:bg-red-600 text-white p-3 rounded-lg font-semibold"
            >
              Clear
            </button>
            <button
              onClick={() => inputOperation('÷')}
              className="bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-lg font-semibold"
            >
              ÷
            </button>
            <button
              onClick={() => inputOperation('×')}
              className="bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-lg font-semibold"
            >
              ×
            </button>

            {[7, 8, 9].map(num => (
              <button
                key={num}
                onClick={() => inputNumber(String(num))}
                className="bg-gray-200 hover:bg-gray-300 text-gray-900 p-3 rounded-lg font-semibold"
              >
                {num}
              </button>
            ))}
            <button
              onClick={() => inputOperation('-')}
              className="bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-lg font-semibold"
            >
              -
            </button>

            {[4, 5, 6].map(num => (
              <button
                key={num}
                onClick={() => inputNumber(String(num))}
                className="bg-gray-200 hover:bg-gray-300 text-gray-900 p-3 rounded-lg font-semibold"
              >
                {num}
              </button>
            ))}
            <button
              onClick={() => inputOperation('+')}
              className="bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-lg font-semibold"
            >
              +
            </button>

            {[1, 2, 3].map(num => (
              <button
                key={num}
                onClick={() => inputNumber(String(num))}
                className="bg-gray-200 hover:bg-gray-300 text-gray-900 p-3 rounded-lg font-semibold"
              >
                {num}
              </button>
            ))}
            <button
              onClick={performCalculation}
              className="row-span-2 bg-green-500 hover:bg-green-600 text-white p-3 rounded-lg font-semibold"
            >
              =
            </button>

            <button
              onClick={() => inputNumber('0')}
              className="col-span-2 bg-gray-200 hover:bg-gray-300 text-gray-900 p-3 rounded-lg font-semibold"
            >
              0
            </button>
            <button
              onClick={() => inputNumber('.')}
              className="bg-gray-200 hover:bg-gray-300 text-gray-900 p-3 rounded-lg font-semibold"
            >
              .
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillingSystem;