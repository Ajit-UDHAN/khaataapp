import React from 'react';
import { 
  TrendingUp, 
  Users, 
  Package, 
  AlertTriangle,
  IndianRupee,
  Receipt,
  UserPlus,
  BarChart3,
  CreditCard,
  TrendingDown
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { calculateDashboardStats, formatCurrency, formatNumber } from '../utils/calculations';

interface DashboardProps {
  onViewChange: (view: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onViewChange }) => {
  const { products, customers, invoices, expenses } = useApp();
  const stats = calculateDashboardStats(invoices, products, customers);

  // Calculate expense stats
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  
  const todayExpenses = expenses.filter(exp => new Date(exp.date) >= todayStart);
  const monthExpenses = expenses.filter(exp => new Date(exp.date) >= monthStart);
  
  const todayExpenseTotal = todayExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const monthExpenseTotal = monthExpenses.reduce((sum, exp) => sum + exp.amount, 0);

  const summaryCards = [
    {
      title: 'Today\'s Sales',
      value: formatCurrency(stats.todaySales),
      icon: TrendingUp,
      color: 'bg-green-500',
      change: '+12.5%'
    },
    {
      title: 'Today\'s Expenses',
      value: formatCurrency(todayExpenseTotal),
      icon: TrendingDown,
      color: 'bg-red-500',
      change: '+5.2%',
      action: () => onViewChange('expenses')
    },
    {
      title: 'Monthly Sales',
      value: formatCurrency(stats.monthlySales),
      icon: BarChart3,
      color: 'bg-blue-500',
      change: '+8.2%'
    },
    {
      title: 'Monthly Expenses',
      value: formatCurrency(monthExpenseTotal),
      icon: CreditCard,
      color: 'bg-orange-500',
      change: '+3.1%',
      action: () => onViewChange('expenses')
    },
    {
      title: 'Credit Pending',
      value: formatCurrency(stats.creditPending),
      icon: IndianRupee,
      color: 'bg-orange-500',
      action: () => onViewChange('customers')
    },
    {
      title: 'Low Stock Products',
      value: stats.lowStockCount.toString(),
      icon: AlertTriangle,
      color: 'bg-red-500',
      action: () => onViewChange('products')
    },
    {
      title: 'Total Products',
      value: stats.totalProducts.toString(),
      icon: Package,
      color: 'bg-purple-500',
      action: () => onViewChange('products')
    },
    {
      title: 'Total Customers',
      value: customers.length.toString(),
      icon: Users,
      color: 'bg-indigo-500',
      action: () => onViewChange('customers')
    },
    {
      title: 'New Customers (7d)',
      value: stats.newCustomersWeek.toString(),
      icon: UserPlus,
      color: 'bg-teal-500'
    },
    {
      title: 'Yearly Revenue',
      value: formatCurrency(stats.yearlyRevenue),
      icon: Receipt,
      color: 'bg-pink-500'
    }
  ];

  const quickActions = [
    { id: 'billing', title: 'New Bill', color: 'bg-blue-600 hover:bg-blue-700' },
    { id: 'add-product', title: 'Add Product', color: 'bg-green-600 hover:bg-green-700' },
    { id: 'expenses', title: 'Add Expense', color: 'bg-red-600 hover:bg-red-700' },
    { id: 'invoices', title: 'Search Invoice', color: 'bg-purple-600 hover:bg-purple-700' },
  ];

  const recentInvoices = invoices
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const lowStockProducts = products
    .flatMap(product => 
      product.variants
        .filter(variant => variant.stockQuantity <= variant.lowStockThreshold)
        .map(variant => ({ ...variant, productName: product.name }))
    )
    .slice(0, 5);

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">Welcome back! Here's what's happening in your shop today.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {summaryCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div
              key={index}
              className={`bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow duration-200 ${
                card.action ? 'cursor-pointer' : ''
              }`}
              onClick={card.action}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`${card.color} p-3 rounded-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                {card.change && (
                  <span className={`text-sm font-medium ${
                    card.change.startsWith('+') ? 'text-green-600' : 'text-red-600'
                  }`}>{card.change}</span>
                )}
              </div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">{card.title}</h3>
              <p className="text-2xl font-bold text-gray-900">{card.value}</p>
            </div>
          );
        })}
      </div>

      {/* Profit/Loss Summary */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <p className="text-blue-100 mb-1">Today's Profit/Loss</p>
            <p className={`text-2xl font-bold ${
              (stats.todaySales - todayExpenseTotal) >= 0 ? 'text-green-200' : 'text-red-200'
            }`}>
              {formatCurrency(stats.todaySales - todayExpenseTotal)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-blue-100 mb-1">Monthly Profit/Loss</p>
            <p className={`text-2xl font-bold ${
              (stats.monthlySales - monthExpenseTotal) >= 0 ? 'text-green-200' : 'text-red-200'
            }`}>
              {formatCurrency(stats.monthlySales - monthExpenseTotal)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-blue-100 mb-1">Expense Ratio</p>
            <p className="text-2xl font-bold text-white">
              {stats.monthlySales > 0 ? ((monthExpenseTotal / stats.monthlySales) * 100).toFixed(1) : 0}%
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {quickActions.map((action) => (
            <button
              key={action.id}
              onClick={() => onViewChange(action.id)}
              className={`${action.color} text-white p-4 rounded-xl font-medium transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5`}
            >
              {action.title}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Invoices */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Recent Invoices</h2>
              <button
                onClick={() => onViewChange('invoices')}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                View All
              </button>
            </div>
          </div>
          <div className="p-6">
            {recentInvoices.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No invoices yet</p>
            ) : (
              <div className="space-y-4">
                {recentInvoices.map((invoice) => (
                  <div key={invoice.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{invoice.customerName}</p>
                      <p className="text-sm text-gray-600">{invoice.invoiceNumber}</p>
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

        {/* Low Stock Alert */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
                Low Stock Alert
              </h2>
              <button
                onClick={() => onViewChange('products')}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Manage Stock
              </button>
            </div>
          </div>
          <div className="p-6">
            {lowStockProducts.length === 0 ? (
              <p className="text-gray-500 text-center py-8">All products are well stocked!</p>
            ) : (
              <div className="space-y-4">
                {lowStockProducts.map((product) => (
                  <div key={product.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100">
                    <div>
                      <p className="font-medium text-gray-900">{product.productName}</p>
                      <p className="text-sm text-gray-600">{product.packSize}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-red-600">{product.stockQuantity} left</p>
                      <p className="text-xs text-gray-500">Min: {product.lowStockThreshold}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Top Selling Product */}
      {stats.topSellingProduct !== 'N/A' && (
        <div className="mt-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold mb-2">🏆 Top Selling Product</h2>
              <p className="text-xl font-bold">{stats.topSellingProduct}</p>
              <p className="text-blue-100">Keep it well stocked!</p>
            </div>
            <div className="text-right">
              <button
                onClick={() => onViewChange('reports')}
                className="bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:shadow-md"
              >
                View Reports
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;