import React from 'react';
import { 
  TrendingUp, Users, Package, AlertTriangle, IndianRupee, Receipt,
  UserPlus, BarChart3, CreditCard, TrendingDown, ShoppingCart, Calendar,
  Target, Award, Activity, ArrowRight, Zap
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { calculateDashboardStats, formatCurrency } from '../utils/calculations';

interface DashboardProps {
  onViewChange: (view: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onViewChange }) => {
  const { products, customers, invoices, expenses } = useApp();
  const stats = calculateDashboardStats(invoices, products, customers);

  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  
  const todayExpenseTotal = expenses.filter(e => new Date(e.date) >= todayStart).reduce((s, e) => s + e.amount, 0);
  const monthExpenseTotal = expenses.filter(e => new Date(e.date) >= monthStart).reduce((s, e) => s + e.amount, 0);
  const todayProfit = stats.todaySales - todayExpenseTotal;
  const monthProfit = stats.monthlySales - monthExpenseTotal;

  const keyMetrics = [
    { title: "Today's Sales", value: formatCurrency(stats.todaySales), icon: TrendingUp, sub: 'Live sales today' },
    { title: "Today's Expenses", value: formatCurrency(todayExpenseTotal), icon: TrendingDown, sub: 'Spent today', action: () => onViewChange('expenses') },
    { title: "Monthly Sales", value: formatCurrency(stats.monthlySales), icon: BarChart3, sub: 'This month so far' },
    { title: "Monthly Expenses", value: formatCurrency(monthExpenseTotal), icon: CreditCard, sub: 'Spent this month', action: () => onViewChange('expenses') },
  ];

  const secondaryMetrics = [
    { title: 'Credit Pending', value: formatCurrency(stats.creditPending), icon: IndianRupee, action: () => onViewChange('customers') },
    { title: 'Low Stock', value: stats.lowStockCount.toString(), icon: AlertTriangle, action: () => onViewChange('products') },
    { title: 'Products', value: stats.totalProducts.toString(), icon: Package, action: () => onViewChange('products') },
    { title: 'Customers', value: customers.length.toString(), icon: Users, action: () => onViewChange('customers') },
    { title: 'New Customers', value: stats.newCustomersWeek.toString(), icon: UserPlus, sub: 'Last 7 days' },
    { title: 'Yearly Revenue', value: formatCurrency(stats.yearlyRevenue), icon: Receipt },
  ];

  const quickActions = [
    { id: 'billing', title: 'New Bill', desc: 'Create invoice', icon: ShoppingCart },
    { id: 'add-product', title: 'Add Product', desc: 'New inventory item', icon: Package },
    { id: 'expenses', title: 'Add Expense', desc: 'Record spending', icon: CreditCard },
    { id: 'invoices', title: 'Search Invoice', desc: 'Find past bills', icon: Receipt },
  ];

  const recentInvoices = [...invoices]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6);

  const lowStockProducts = products
    .flatMap(p => p.variants.filter(v => v.stockQuantity <= v.lowStockThreshold).map(v => ({ ...v, productName: p.name })))
    .slice(0, 5);

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
          <p className="text-gray-500 mt-1">{today.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <button onClick={() => onViewChange('billing')}
          className="hidden sm:flex items-center gap-2 bg-gray-900 text-white px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-gray-800 transition-all shadow-sm hover:shadow-md">
          <Plus className="w-4 h-4" />
          New Bill
        </button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {keyMetrics.map((m, i) => {
          const Icon = m.icon;
          return (
            <div key={i}
              className={`premium-card p-5 ${m.action ? 'cursor-pointer' : ''}`}
              onClick={m.action}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Icon className="w-[18px] h-[18px] text-gray-600" />
                </div>
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">{m.title}</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 tracking-tight">{m.value}</p>
              {m.sub && <p className="text-xs text-gray-400 mt-1">{m.sub}</p>}
            </div>
          );
        })}
      </div>

      {/* Profit/Loss Overview */}
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl p-6 lg:p-8 text-white mb-6 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-gray-400" />
              <h2 className="text-lg font-semibold">Financial Overview</h2>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/5 rounded-xl p-5 backdrop-blur-sm border border-white/5">
              <div className="flex items-center gap-2 mb-3">
                <Target className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-400">Today's Profit/Loss</span>
              </div>
              <p className={`text-2xl font-bold tracking-tight ${todayProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {formatCurrency(todayProfit)}
              </p>
            </div>
            <div className="bg-white/5 rounded-xl p-5 backdrop-blur-sm border border-white/5">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-400">Monthly Profit/Loss</span>
              </div>
              <p className={`text-2xl font-bold tracking-tight ${monthProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {formatCurrency(monthProfit)}
              </p>
            </div>
            <div className="bg-white/5 rounded-xl p-5 backdrop-blur-sm border border-white/5">
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-400">Expense Ratio</span>
              </div>
              <p className="text-2xl font-bold text-yellow-400 tracking-tight">
                {stats.monthlySales > 0 ? ((monthExpenseTotal / stats.monthlySales) * 100).toFixed(1) : 0}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {quickActions.map((a) => {
          const Icon = a.icon;
          return (
            <button key={a.id} onClick={() => onViewChange(a.id)}
              className="premium-card p-5 text-left group">
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-gray-900 group-hover:text-white transition-all duration-200">
                  <Icon className="w-[18px] h-[18px] text-gray-600 group-hover:text-white" />
                </div>
                <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-gray-900 transition-colors" />
              </div>
              <p className="font-semibold text-gray-900 text-sm">{a.title}</p>
              <p className="text-xs text-gray-400 mt-0.5">{a.desc}</p>
            </button>
          );
        })}
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {secondaryMetrics.map((m, i) => {
          const Icon = m.icon;
          return (
            <div key={i}
              className={`premium-card p-4 ${m.action ? 'cursor-pointer' : ''}`}
              onClick={m.action}>
              <Icon className="w-4 h-4 text-gray-400 mb-2" />
              <p className="text-lg font-bold text-gray-900 tracking-tight">{m.value}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">{m.title}</p>
            </div>
          );
        })}
      </div>

      {/* Recent + Low Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Recent Invoices */}
        <div className="premium-card">
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Recent Invoices</h2>
            <button onClick={() => onViewChange('invoices')}
              className="text-sm text-gray-500 hover:text-gray-900 font-medium transition-colors">
              View All
            </button>
          </div>
          <div className="p-5">
            {recentInvoices.length === 0 ? (
              <div className="text-center py-10">
                <Receipt className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">No invoices yet</p>
                <button onClick={() => onViewChange('billing')}
                  className="mt-3 text-sm text-gray-900 font-semibold hover:text-blue-600 transition-colors">
                  Create your first invoice
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {recentInvoices.map((inv) => (
                  <div key={inv.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors">
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 text-sm truncate">{inv.customerName}</p>
                      <p className="text-xs text-gray-400">{inv.invoiceNumber}</p>
                    </div>
                    <div className="text-right ml-2 flex-shrink-0">
                      <p className="font-semibold text-gray-900 text-sm">{formatCurrency(inv.grandTotal)}</p>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        inv.status === 'paid' ? 'bg-green-50 text-green-700'
                          : inv.status === 'credit' ? 'bg-red-50 text-red-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}>
                        {inv.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Low Stock */}
        <div className="premium-card">
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Low Stock Alert</h2>
            <button onClick={() => onViewChange('products')}
              className="text-sm text-gray-500 hover:text-gray-900 font-medium transition-colors">
              Manage
            </button>
          </div>
          <div className="p-5">
            {lowStockProducts.length === 0 ? (
              <div className="text-center py-10">
                <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Package className="w-5 h-5 text-green-600" />
                </div>
                <p className="text-green-600 font-medium text-sm">All products well stocked</p>
              </div>
            ) : (
              <div className="space-y-2">
                {lowStockProducts.map((p) => (
                  <div key={p.id} className="flex items-center justify-between p-3 rounded-xl bg-red-50/50 border border-red-100/50">
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 text-sm truncate">{p.productName}</p>
                      <p className="text-xs text-gray-400">{p.packSize}</p>
                    </div>
                    <div className="text-right ml-2 flex-shrink-0">
                      <p className="font-bold text-red-600 text-sm">{p.stockQuantity} left</p>
                      <p className="text-[10px] text-gray-400">Min: {p.lowStockThreshold}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Top Selling */}
      {stats.topSellingProduct !== 'N/A' && (
        <div className="bg-gradient-to-r from-amber-500 to-orange-600 rounded-2xl p-6 text-white shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <p className="text-amber-100 text-sm font-medium mb-1">Top Selling Product</p>
                <p className="text-xl font-bold">{stats.topSellingProduct}</p>
              </div>
            </div>
            <button onClick={() => onViewChange('reports')}
              className="bg-white/15 hover:bg-white/25 px-4 py-2.5 rounded-xl text-sm font-semibold backdrop-blur-sm transition-all">
              View Reports
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
