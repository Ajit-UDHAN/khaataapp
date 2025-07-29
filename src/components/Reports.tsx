import React, { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Calendar, 
  Download, 
  Package,
  Users,
  Filter,
  ChevronDown,
  FileText,
  CreditCard
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { 
  calculateSalesReport, 
  calculateProductSalesReport, 
  formatCurrency, 
  formatNumber 
} from '../utils/calculations';
import DateRangePicker from './DateRangePicker';

const Reports: React.FC = () => {
  const { invoices, products, customers, expenses } = useApp();
  const [activeTab, setActiveTab] = useState<'sales' | 'product' | 'customer' | 'expense'>('sales');
  const [customDateRange, setCustomDateRange] = useState({ startDate: '', endDate: '' });
  const [selectedProduct, setSelectedProduct] = useState('');

  const getDateRange = () => {
    if (customDateRange.startDate && customDateRange.endDate) {
      return {
        start: new Date(customDateRange.startDate),
        end: new Date(customDateRange.endDate),
        label: `${new Date(customDateRange.startDate).toLocaleDateString()} - ${new Date(customDateRange.endDate).toLocaleDateString()}`
      };
    }
    
    // Default to last 7 days
    const now = new Date();
    return {
      start: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      end: now,
      label: 'Last 7 Days'
    };
  };

  const range = getDateRange();
  const salesReport = calculateSalesReport(invoices, range.start, range.end);

  const handleExportCSV = (data: any[], filename: string) => {
    if (data.length === 0) return;
    
    const headers = Object.keys(data[0]);
    const csv = [
      headers.join(','),
      ...data.map(row => headers.map(header => `"${row[header]}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const tabs = [
    { id: 'sales', name: 'Sales Reports', icon: TrendingUp },
    { id: 'product', name: 'Product Reports', icon: Package },
    { id: 'customer', name: 'Customer Reports', icon: Users },
    { id: 'expense', name: 'Expense Reports', icon: CreditCard }
  ];

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Reports & Analytics</h1>
          <p className="text-gray-600">Gain insights into your business performance</p>
        </div>
      </div>

      {/* Date Range Selector */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Date Range:</span>
          </div>
          <div className="flex-1 max-w-sm">
            <DateRangePicker
              startDate={customDateRange.startDate}
              endDate={customDateRange.endDate}
              onChange={setCustomDateRange}
            />
          </div>
          <div className="text-sm text-gray-600">
            {range.label}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`
                    flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200
                    ${activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <Icon className="w-5 h-5 mr-2" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'sales' && <SalesReports salesReport={salesReport} range={range} onExport={handleExportCSV} />}
          {activeTab === 'product' && (
            <ProductReports 
              products={products} 
              invoices={invoices} 
              range={range} 
              selectedProduct={selectedProduct}
              onProductSelect={setSelectedProduct}
              onExport={handleExportCSV}
            />
          )}
          {activeTab === 'customer' && <CustomerReports customers={customers} invoices={invoices} range={range} onExport={handleExportCSV} />}
          {activeTab === 'expense' && <ExpenseReports expenses={expenses} range={range} onExport={handleExportCSV} />}
        </div>
      </div>
    </div>
  );
};

const SalesReports: React.FC<{
  salesReport: any;
  range: any;
  onExport: (data: any[], filename: string) => void;
}> = ({ salesReport, range, onExport }) => {
  const { invoices } = useApp();

  const filteredInvoices = invoices.filter(invoice => {
    const invoiceDate = new Date(invoice.createdAt);
    return invoiceDate >= range.start && invoiceDate <= range.end;
  });

  const paymentMethodData = filteredInvoices.reduce((acc, invoice) => {
    acc[invoice.paymentType] = (acc[invoice.paymentType] || 0) + invoice.grandTotal;
    return acc;
  }, {} as { [key: string]: number });

  const exportData = filteredInvoices.map(invoice => ({
    'Invoice Number': invoice.invoiceNumber,
    'Customer Name': invoice.customerName,
    'Date': new Date(invoice.createdAt).toLocaleDateString(),
    'Payment Type': invoice.paymentType,
    'Subtotal': invoice.subtotal,
    'Discount': invoice.discount,
    'Grand Total': invoice.grandTotal,
    'Amount Paid': invoice.amountPaid,
    'Balance Due': invoice.balanceDue,
    'Status': invoice.status
  }));

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100">Total Sales</p>
              <p className="text-2xl font-bold">{formatCurrency(salesReport.totalSales)}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-blue-200" />
          </div>
        </div>
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100">Total Units</p>
              <p className="text-2xl font-bold">{formatNumber(salesReport.totalUnits)}</p>
            </div>
            <Package className="w-8 h-8 text-green-200" />
          </div>
        </div>
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100">Invoices</p>
              <p className="text-2xl font-bold">{formatNumber(salesReport.invoiceCount)}</p>
            </div>
            <FileText className="w-8 h-8 text-purple-200" />
          </div>
        </div>
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100">Avg Order</p>
              <p className="text-2xl font-bold">{formatCurrency(salesReport.averageOrderSize)}</p>
            </div>
            <BarChart3 className="w-8 h-8 text-orange-200" />
          </div>
        </div>
      </div>

      {/* Payment Methods */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-50 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Payment Methods</h3>
            <button
              onClick={() => onExport(
                Object.entries(paymentMethodData).map(([method, amount]) => ({
                  'Payment Method': method.toUpperCase(),
                  'Amount': amount,
                  'Percentage': ((amount / salesReport.totalSales) * 100).toFixed(1) + '%'
                })),
                'payment-methods'
              )}
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
            >
              <Download className="w-4 h-4 mr-1" />
              Export
            </button>
          </div>
          <div className="space-y-3">
            {Object.entries(paymentMethodData).map(([method, amount]) => (
              <div key={method} className="flex items-center justify-between">
                <span className="font-medium text-gray-700 capitalize">{method}</span>
                <div className="text-right">
                  <div className="font-semibold text-gray-900">{formatCurrency(amount)}</div>
                  <div className="text-sm text-gray-500">
                    {((amount / salesReport.totalSales) * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
          </div>
          <div className="space-y-3">
            <button
              onClick={() => onExport(exportData, 'sales-report')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg flex items-center justify-center transition-colors duration-200"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Sales Report
            </button>
          </div>
        </div>
      </div>

      {/* Recent Invoices */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Invoices</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 font-medium text-gray-700">Invoice</th>
                <th className="text-left py-2 font-medium text-gray-700">Customer</th>
                <th className="text-left py-2 font-medium text-gray-700">Date</th>
                <th className="text-right py-2 font-medium text-gray-700">Amount</th>
                <th className="text-left py-2 font-medium text-gray-700">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.slice(0, 10).map((invoice) => (
                <tr key={invoice.id} className="border-b border-gray-100">
                  <td className="py-2 font-medium text-gray-900">{invoice.invoiceNumber}</td>
                  <td className="py-2 text-gray-600">{invoice.customerName}</td>
                  <td className="py-2 text-gray-600">{new Date(invoice.createdAt).toLocaleDateString()}</td>
                  <td className="py-2 text-right font-medium text-gray-900">{formatCurrency(invoice.grandTotal)}</td>
                  <td className="py-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      invoice.status === 'paid' 
                        ? 'bg-green-100 text-green-800' 
                        : invoice.status === 'credit'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {invoice.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const ProductReports: React.FC<{
  products: any[];
  invoices: any[];
  range: any;
  selectedProduct: string;
  onProductSelect: (productId: string) => void;
  onExport: (data: any[], filename: string) => void;
}> = ({ products, invoices, range, selectedProduct, onProductSelect, onExport }) => {
  
  const productSalesData = products.map(product => {
    const report = calculateProductSalesReport(invoices, product.id, range.start, range.end);
    return report ? {
      ...product,
      ...report
    } : {
      ...product,
      totalVolume: 0,
      totalRevenue: 0,
      variants: []
    };
  }).sort((a, b) => b.totalRevenue - a.totalRevenue);

  const selectedProductData = selectedProduct 
    ? productSalesData.find(p => p.id === selectedProduct)
    : null;

  const exportProductData = productSalesData.map(product => ({
    'Product Name': product.name,
    'Brand': product.brand,
    'Category': product.category,
    'Total Revenue': product.totalRevenue,
    'Total Volume': product.totalVolume,
    'Variants Sold': product.variants.length
  }));

  return (
    <div className="space-y-6">
      {/* Product Selector */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <label className="text-sm font-medium text-gray-700">Select Product for Detailed Analysis:</label>
          <select
            value={selectedProduct}
            onChange={(e) => onProductSelect(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Products Overview</option>
            {products.map(product => (
              <option key={product.id} value={product.id}>{product.name} - {product.brand}</option>
            ))}
          </select>
          <button
            onClick={() => onExport(exportProductData, 'product-sales-report')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors duration-200"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {selectedProductData ? (
        /* Detailed Product Report */
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
            <h2 className="text-2xl font-bold mb-2">{selectedProductData.name}</h2>
            <p className="text-green-100">{selectedProductData.brand} • {selectedProductData.category}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(selectedProductData.totalRevenue)}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-500" />
              </div>
            </div>
            <div className="bg-white rounded-lg p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600">Total Volume</p>
                  <p className="text-2xl font-bold text-gray-900">{formatNumber(selectedProductData.totalVolume)}</p>
                </div>
                <Package className="w-8 h-8 text-blue-500" />
              </div>
            </div>
            <div className="bg-white rounded-lg p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600">Variants Sold</p>
                  <p className="text-2xl font-bold text-gray-900">{selectedProductData.variants.length}</p>
                </div>
                <BarChart3 className="w-8 h-8 text-purple-500" />
              </div>
            </div>
          </div>

          {/* Variant Breakdown */}
          <div className="bg-white rounded-lg p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Variant Performance</h3>
            <div className="space-y-4">
              {selectedProductData.variants.map((variant: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{variant.packSize}</p>
                    <p className="text-sm text-gray-600">
                      {variant.unitsSold} units • {formatNumber(variant.totalVolume)} total volume
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{formatCurrency(variant.revenue)}</p>
                    <p className="text-sm text-gray-600">
                      {((variant.revenue / selectedProductData.totalRevenue) * 100).toFixed(1)}% of total
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* All Products Overview */
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100">Total Products</p>
                  <p className="text-2xl font-bold">{products.length}</p>
                </div>
                <Package className="w-8 h-8 text-blue-200" />
              </div>
            </div>
            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100">Products Sold</p>
                  <p className="text-2xl font-bold">{productSalesData.filter(p => p.totalRevenue > 0).length}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-200" />
              </div>
            </div>
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100">Top Seller</p>
                  <p className="text-lg font-bold truncate">{productSalesData[0]?.name || 'N/A'}</p>
                </div>
                <BarChart3 className="w-8 h-8 text-purple-200" />
              </div>
            </div>
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100">Total Revenue</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(productSalesData.reduce((sum, p) => sum + p.totalRevenue, 0))}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-orange-200" />
              </div>
            </div>
          </div>

          {/* Top Selling Products */}
          <div className="bg-white rounded-lg p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Selling Products</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 font-medium text-gray-700">Product</th>
                    <th className="text-left py-2 font-medium text-gray-700">Brand</th>
                    <th className="text-right py-2 font-medium text-gray-700">Revenue</th>
                    <th className="text-right py-2 font-medium text-gray-700">Volume</th>
                    <th className="text-right py-2 font-medium text-gray-700">Variants</th>
                  </tr>
                </thead>
                <tbody>
                  {productSalesData.slice(0, 10).map((product) => (
                    <tr key={product.id} className="border-b border-gray-100">
                      <td className="py-2">
                        <button
                          onClick={() => onProductSelect(product.id)}
                          className="font-medium text-blue-600 hover:text-blue-800"
                        >
                          {product.name}
                        </button>
                      </td>
                      <td className="py-2 text-gray-600">{product.brand}</td>
                      <td className="py-2 text-right font-medium text-gray-900">{formatCurrency(product.totalRevenue)}</td>
                      <td className="py-2 text-right text-gray-600">{formatNumber(product.totalVolume)}</td>
                      <td className="py-2 text-right text-gray-600">{product.variants.length}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const CustomerReports: React.FC<{
  customers: any[];
  invoices: any[];
  range: any;
  onExport: (data: any[], filename: string) => void;
}> = ({ customers, invoices, range, onExport }) => {
  
  const filteredInvoices = invoices.filter(invoice => {
    const invoiceDate = new Date(invoice.createdAt);
    return invoiceDate >= range.start && invoiceDate <= range.end;
  });

  const customerData = customers.map(customer => {
    const customerInvoices = filteredInvoices.filter(inv => inv.customerId === customer.id);
    const totalSpent = customerInvoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
    const totalOrders = customerInvoices.length;
    const creditBalance = customerInvoices.reduce((sum, inv) => sum + inv.balanceDue, 0);
    const averageOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;
    const lastOrder = customerInvoices.length > 0 
      ? new Date(Math.max(...customerInvoices.map(inv => new Date(inv.createdAt).getTime())))
      : null;

    return {
      ...customer,
      totalSpent,
      totalOrders,
      creditBalance,
      averageOrderValue,
      lastOrder
    };
  }).sort((a, b) => b.totalSpent - a.totalSpent);

  const exportData = customerData.map(customer => ({
    'Customer Name': customer.name,
    'Phone': customer.phone,
    'Total Orders': customer.totalOrders,
    'Total Spent': customer.totalSpent,
    'Average Order Value': customer.averageOrderValue,
    'Credit Balance': customer.creditBalance,
    'Last Order': customer.lastOrder ? customer.lastOrder.toLocaleDateString() : 'Never'
  }));

  const totalRevenue = customerData.reduce((sum, customer) => sum + customer.totalSpent, 0);
  const totalCreditOutstanding = customerData.reduce((sum, customer) => sum + customer.creditBalance, 0);
  const activeCustomers = customerData.filter(customer => customer.totalOrders > 0).length;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100">Total Customers</p>
              <p className="text-2xl font-bold">{customers.length}</p>
            </div>
            <Users className="w-8 h-8 text-blue-200" />
          </div>
        </div>
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100">Active Customers</p>
              <p className="text-2xl font-bold">{activeCustomers}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-200" />
          </div>
        </div>
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100">Total Revenue</p>
              <p className="text-2xl font-bold">{formatCurrency(totalRevenue)}</p>
            </div>
            <BarChart3 className="w-8 h-8 text-purple-200" />
          </div>
        </div>
        <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100">Credit Outstanding</p>
              <p className="text-2xl font-bold">{formatCurrency(totalCreditOutstanding)}</p>
            </div>
            <FileText className="w-8 h-8 text-red-200" />
          </div>
        </div>
      </div>

      {/* Export Button */}
      <div className="flex justify-end">
        <button
          onClick={() => onExport(exportData, 'customer-report')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center transition-colors duration-200"
        >
          <Download className="w-4 h-4 mr-2" />
          Export Customer Report
        </button>
      </div>

      {/* Top Customers */}
      <div className="bg-white rounded-lg p-6 border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Customers by Revenue</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 font-medium text-gray-700">Customer</th>
                <th className="text-left py-2 font-medium text-gray-700">Phone</th>
                <th className="text-right py-2 font-medium text-gray-700">Orders</th>
                <th className="text-right py-2 font-medium text-gray-700">Total Spent</th>
                <th className="text-right py-2 font-medium text-gray-700">Avg Order</th>
                <th className="text-right py-2 font-medium text-gray-700">Credit</th>
                <th className="text-left py-2 font-medium text-gray-700">Last Order</th>
              </tr>
            </thead>
            <tbody>
              {customerData.slice(0, 15).map((customer) => (
                <tr key={customer.id} className="border-b border-gray-100">
                  <td className="py-2 font-medium text-gray-900">{customer.name}</td>
                  <td className="py-2 text-gray-600">{customer.phone}</td>
                  <td className="py-2 text-right text-gray-900">{customer.totalOrders}</td>
                  <td className="py-2 text-right font-medium text-gray-900">{formatCurrency(customer.totalSpent)}</td>
                  <td className="py-2 text-right text-gray-600">{formatCurrency(customer.averageOrderValue)}</td>
                  <td className="py-2 text-right">
                    <span className={customer.creditBalance > 0 ? 'text-red-600 font-medium' : 'text-gray-600'}>
                      {formatCurrency(customer.creditBalance)}
                    </span>
                  </td>
                  <td className="py-2 text-gray-600">
                    {customer.lastOrder ? customer.lastOrder.toLocaleDateString() : 'Never'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const ExpenseReports: React.FC<{
  expenses: any[];
  range: any;
  onExport: (data: any[], filename: string) => void;
}> = ({ expenses, range, onExport }) => {
  
  const filteredExpenses = expenses.filter(expense => {
    const expenseDate = new Date(expense.date);
    return expenseDate >= range.start && expenseDate <= range.end;
  });

  const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const categoryTotals = filteredExpenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
    return acc;
  }, {} as { [key: string]: number });

  const paymentMethodTotals = filteredExpenses.reduce((acc, expense) => {
    acc[expense.paymentMethod] = (acc[expense.paymentMethod] || 0) + expense.amount;
    return acc;
  }, {} as { [key: string]: number });

  const exportData = filteredExpenses.map(expense => ({
    'Date': new Date(expense.date).toLocaleDateString(),
    'Title': expense.title,
    'Category': expense.category,
    'Amount': expense.amount,
    'Payment Method': expense.paymentMethod,
    'Vendor': expense.vendor || '',
    'Description': expense.description || '',
    'Notes': expense.notes || ''
  }));

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100">Total Expenses</p>
              <p className="text-2xl font-bold">{formatCurrency(totalExpenses)}</p>
            </div>
            <CreditCard className="w-8 h-8 text-red-200" />
          </div>
        </div>
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100">Total Entries</p>
              <p className="text-2xl font-bold">{formatNumber(filteredExpenses.length)}</p>
            </div>
            <FileText className="w-8 h-8 text-orange-200" />
          </div>
        </div>
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100">Categories</p>
              <p className="text-2xl font-bold">{Object.keys(categoryTotals).length}</p>
            </div>
            <Filter className="w-8 h-8 text-purple-200" />
          </div>
        </div>
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100">Avg Expense</p>
              <p className="text-2xl font-bold">
                {formatCurrency(filteredExpenses.length > 0 ? totalExpenses / filteredExpenses.length : 0)}
              </p>
            </div>
            <BarChart3 className="w-8 h-8 text-blue-200" />
          </div>
        </div>
      </div>

      {/* Category and Payment Method Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-50 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Expense Categories</h3>
            <button
              onClick={() => onExport(
                Object.entries(categoryTotals).map(([category, amount]) => ({
                  'Category': category,
                  'Amount': amount,
                  'Percentage': ((amount / totalExpenses) * 100).toFixed(1) + '%'
                })),
                'expense-categories'
              )}
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
            >
              <Download className="w-4 h-4 mr-1" />
              Export
            </button>
          </div>
          <div className="space-y-3">
            {Object.entries(categoryTotals).map(([category, amount]) => (
              <div key={category} className="flex items-center justify-between">
                <span className="font-medium text-gray-700">{category}</span>
                <div className="text-right">
                  <div className="font-semibold text-gray-900">{formatCurrency(amount)}</div>
                  <div className="text-sm text-gray-500">
                    {((amount / totalExpenses) * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Payment Methods</h3>
            <button
              onClick={() => onExport(
                Object.entries(paymentMethodTotals).map(([method, amount]) => ({
                  'Payment Method': method.toUpperCase(),
                  'Amount': amount,
                  'Percentage': ((amount / totalExpenses) * 100).toFixed(1) + '%'
                })),
                'expense-payment-methods'
              )}
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
            >
              <Download className="w-4 h-4 mr-1" />
              Export
            </button>
          </div>
          <div className="space-y-3">
            {Object.entries(paymentMethodTotals).map(([method, amount]) => (
              <div key={method} className="flex items-center justify-between">
                <span className="font-medium text-gray-700 capitalize">{method}</span>
                <div className="text-right">
                  <div className="font-semibold text-gray-900">{formatCurrency(amount)}</div>
                  <div className="text-sm text-gray-500">
                    {((amount / totalExpenses) * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Export Button */}
      <div className="bg-gray-50 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Export Options</h3>
        </div>
        <div className="space-y-3">
          <button
            onClick={() => onExport(exportData, 'expense-report')}
            className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg flex items-center justify-center transition-colors duration-200"
          >
            <Download className="w-4 h-4 mr-2" />
            Export Expense Report
          </button>
        </div>
      </div>

      {/* Recent Expenses */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Expenses</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 font-medium text-gray-700">Date</th>
                <th className="text-left py-2 font-medium text-gray-700">Title</th>
                <th className="text-left py-2 font-medium text-gray-700">Category</th>
                <th className="text-right py-2 font-medium text-gray-700">Amount</th>
                <th className="text-left py-2 font-medium text-gray-700">Payment</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.slice(0, 10).map((expense) => (
                <tr key={expense.id} className="border-b border-gray-100">
                  <td className="py-2 text-gray-600">{new Date(expense.date).toLocaleDateString()}</td>
                  <td className="py-2 font-medium text-gray-900">{expense.title}</td>
                  <td className="py-2 text-gray-600">{expense.category}</td>
                  <td className="py-2 text-right font-medium text-red-600">{formatCurrency(expense.amount)}</td>
                  <td className="py-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      expense.paymentMethod === 'cash' 
                        ? 'bg-green-100 text-green-800' 
                        : expense.paymentMethod === 'upi'
                        ? 'bg-blue-100 text-blue-800'
                        : expense.paymentMethod === 'online'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {expense.paymentMethod.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;