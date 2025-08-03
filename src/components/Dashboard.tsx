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
  TrendingDown,
  ShoppingCart,
  Calendar,
  Target,
  Award,
  Activity
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="p-4 lg:p-8 max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                Dashboard
              </h1>
              <p className="text-gray-600 text-lg">Welcome back! Here's your business overview for today.</p>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-500">Today</p>
                <p className="text-lg font-semibold text-gray-900">{new Date().toLocaleDateString('en-IN', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {summaryCards.slice(0, 4).map((card, index) => {
            const Icon = card.icon;
            return (
              <div
                key={index}
                className={`bg-white rounded-2xl shadow-lg p-6 border-0 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 ${
                  card.action ? 'cursor-pointer' : ''
                }`}
                onClick={card.action}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`${card.color} p-4 rounded-xl shadow-lg`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  {card.change && (
                    <span className={`text-sm font-semibold px-3 py-1 rounded-full ${
                      card.change.startsWith('+') 
                        ? 'text-green-700 bg-green-100' 
                        : 'text-red-700 bg-red-100'
                    }`}>{card.change}</span>
                  )}
                </div>
                <h3 className="text-sm font-semibold text-gray-500 mb-2 uppercase tracking-wide">{card.title}</h3>
                <p className="text-3xl font-bold text-gray-900">{card.value}</p>
              </div>
            );
          })}
        </div>

        {/* Profit/Loss Summary */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 rounded-2xl p-8 text-white mb-8 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Financial Overview</h2>
              <p className="text-blue-100">Track your business performance</p>
            </div>
            <div className="bg-white bg-opacity-20 p-3 rounded-xl">
              <Activity className="w-8 h-8 text-white" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center bg-white bg-opacity-10 rounded-xl p-6 backdrop-blur-sm">
              <div className="flex items-center justify-center mb-3">
                <Target className="w-6 h-6 text-green-300 mr-2" />
                <p className="text-blue-100 font-medium">Today's Profit/Loss</p>
              </div>
              <p className={`text-3xl font-bold ${
                (stats.todaySales - todayExpenseTotal) >= 0 ? 'text-green-300' : 'text-red-300'
              }`}>
                {formatCurrency(stats.todaySales - todayExpenseTotal)}
              </p>
            </div>
            <div className="text-center bg-white bg-opacity-10 rounded-xl p-6 backdrop-blur-sm">
              <div className="flex items-center justify-center mb-3">
                <Calendar className="w-6 h-6 text-blue-300 mr-2" />
                <p className="text-blue-100 font-medium">Monthly Profit/Loss</p>
              </div>
              <p className={`text-3xl font-bold ${
                (stats.monthlySales - monthExpenseTotal) >= 0 ? 'text-green-300' : 'text-red-300'
              }`}>
                {formatCurrency(stats.monthlySales - monthExpenseTotal)}
              </p>
            </div>
            <div className="text-center bg-white bg-opacity-10 rounded-xl p-6 backdrop-blur-sm">
              <div className="flex items-center justify-center mb-3">
                <BarChart3 className="w-6 h-6 text-yellow-300 mr-2" />
                <p className="text-blue-100 font-medium">Expense Ratio</p>
              </div>
              <p className="text-3xl font-bold text-yellow-300">
                {stats.monthlySales > 0 ? ((monthExpenseTotal / stats.monthlySales) * 100).toFixed(1) : 0}%
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <ShoppingCart className="w-6 h-6 mr-3 text-blue-600" />
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action) => (
              <button
                key={action.id}
                onClick={() => onViewChange(action.id)}
                className={`${action.color} text-white p-6 rounded-2xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-2 hover:scale-105`}
              >
                <div className="text-lg">{action.title}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Additional Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {summaryCards.slice(4).map((card, index) => {
            const Icon = card.icon;
            return (
              <div
                key={index + 4}
                className={`bg-white rounded-xl shadow-md p-6 border-l-4 hover:shadow-lg transition-all duration-200 ${
                  card.action ? 'cursor-pointer' : ''
                }`}
                onClick={card.action}
                style={{ borderLeftColor: card.color.replace('bg-', '').replace('-500', '') }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={`${card.color} p-3 rounded-lg`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  {card.change && (
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      card.change.startsWith('+') ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'
                    }`}>{card.change}</span>
                  )}
                </div>
                <h3 className="text-sm font-medium text-gray-600 mb-1">{card.title}</h3>
                <p className="text-xl font-bold text-gray-900">{card.value}</p>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Invoices */}
          <div className="bg-white rounded-2xl shadow-lg border-0">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                  <Receipt className="w-5 h-5 mr-2 text-blue-600" />
                  Recent Invoices
                </h2>
                <button
                  onClick={() => onViewChange('invoices')}
                  className="text-sm text-blue-600 hover:text-blue-800 font-semibold px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors duration-200"
                >
                  View All
                </button>
              </div>
            </div>
            <div className="p-6">
              {recentInvoices.length === 0 ? (
                <div className="text-center py-12">
                  <Receipt className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">No invoices yet</p>
                  <p className="text-gray-400 text-sm">Create your first invoice to get started</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentInvoices.map((invoice) => (
                    <div key={invoice.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl hover:shadow-md transition-all duration-200">
                      <div>
                        <p className="font-semibold text-gray-900">{invoice.customerName}</p>
                        <p className="text-sm text-gray-600">{invoice.invoiceNumber}</p>
                        <p className="text-xs text-gray-500">{new Date(invoice.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900 text-lg">{formatCurrency(invoice.grandTotal)}</p>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                          invoice.status === 'paid' 
                            ? 'bg-green-100 text-green-800' 
                            : invoice.status === 'credit'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {invoice.status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Low Stock Alert */}
          <div className="bg-white rounded-2xl shadow-lg border-0">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                  <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
                  Low Stock Alert
                </h2>
                <button
                  onClick={() => onViewChange('products')}
                  className="text-sm text-blue-600 hover:text-blue-800 font-semibold px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors duration-200"
                >
                  Manage Stock
                </button>
              </div>
            </div>
            <div className="p-6">
              {lowStockProducts.length === 0 ? (
                <div className="text-center py-12">
                  <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Package className="w-8 h-8 text-green-600" />
                  </div>
                  <p className="text-green-600 text-lg font-semibold">All products are well stocked!</p>
                  <p className="text-gray-400 text-sm">Great job managing your inventory</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {lowStockProducts.map((product) => (
                    <div key={product.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-red-50 to-orange-50 rounded-xl border-l-4 border-red-400 hover:shadow-md transition-all duration-200">
                      <div>
                        <p className="font-semibold text-gray-900">{product.productName}</p>
                        <p className="text-sm text-gray-600">{product.packSize}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-red-600 text-lg">{product.stockQuantity} left</p>
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
          <div className="mt-8 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 rounded-2xl p-8 text-white shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="bg-white bg-opacity-20 p-4 rounded-xl mr-6">
                  <Award className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-2 flex items-center">
                    🏆 Top Selling Product
                  </h2>
                  <p className="text-2xl font-bold">{stats.topSellingProduct}</p>
                  <p className="text-orange-100 text-lg">Keep it well stocked!</p>
                </div>
              </div>
              <div className="text-right">
                <button
                  onClick={() => onViewChange('reports')}
                  className="bg-white bg-opacity-20 hover:bg-opacity-30 px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-200 hover:shadow-lg backdrop-blur-sm"
                >
                  View Reports
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;