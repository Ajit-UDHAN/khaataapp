import React, { useState } from 'react';
import { 
  Home, 
  Package, 
  Receipt, 
  Users, 
  BarChart3, 
  Menu, 
  X,
  ShoppingCart,
  Plus,
  CreditCard,
  Settings,
  LogOut
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
  currentView: string;
  onViewChange: (view: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, currentView, onViewChange }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, businessProfile, logout } = useAuth();

  const navigation = [
    { id: 'dashboard', name: 'Dashboard', icon: Home },
    { id: 'products', name: 'Products', icon: Package },
    { id: 'billing', name: 'New Bill', icon: ShoppingCart },
    { id: 'invoices', name: 'Invoices', icon: Receipt },
    { id: 'customers', name: 'Customers', icon: Users },
    { id: 'expenses', name: 'Expenses', icon: CreditCard },
    { id: 'reports', name: 'Reports', icon: BarChart3 },
    { id: 'settings', name: 'Settings', icon: Settings },
  ];

  const quickActions = [
    { id: 'billing', name: 'New Bill', icon: Plus, color: 'bg-blue-600 hover:bg-blue-700' },
    { id: 'add-product', name: 'Add Product', icon: Package, color: 'bg-green-600 hover:bg-green-700' },
    { id: 'expenses', name: 'Add Expense', icon: CreditCard, color: 'bg-red-600 hover:bg-red-700' },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-80 bg-white shadow-xl border-r border-gray-100 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center justify-between h-20 px-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <div>
            <h1 className="text-xl font-bold">{businessProfile?.shopName || 'ShopManager Pro'}</h1>
            <p className="text-xs text-blue-100">{user?.name || 'Business Management'}</p>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-lg hover:bg-blue-700/50 transition-colors duration-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="mt-6 pb-32 overflow-y-auto max-h-[calc(100vh-200px)]">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onViewChange(item.id);
                  setSidebarOpen(false);
                }}
                className={`
                  w-full flex items-center px-6 py-4 text-left transition-all duration-200 group
                  ${currentView === item.id 
                    ? 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border-r-4 border-blue-600 shadow-sm' 
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }
                `}
              >
                <Icon className={`w-5 h-5 mr-4 transition-colors duration-200 ${
                  currentView === item.id ? 'text-blue-600' : 'text-gray-500 group-hover:text-gray-700'
                }`} />
                <span className="font-medium">{item.name}</span>
              </button>
            );
          })}
        </nav>

        <div className="absolute bottom-6 left-4 right-4 space-y-4 bg-white">
          {/* User Profile */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="ml-3">
                  <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
                  <p className="text-xs text-gray-600">{user?.email}</p>
                </div>
              </div>
              <button
                onClick={logout}
                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
              <Plus className="w-4 h-4 mr-2" />
              Quick Actions
            </h3>
            <div className="space-y-2">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.id}
                    onClick={() => {
                      onViewChange(action.id);
                      setSidebarOpen(false);
                    }}
                    className={`
                      w-full flex items-center px-3 py-2.5 text-sm text-white rounded-lg font-medium transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5
                      ${action.color}
                    `}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {action.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col lg:ml-0">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center justify-between h-16 px-4 bg-white shadow-sm border-b border-gray-100 relative z-30">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors duration-200"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="text-center">
            <h1 className="text-lg font-bold text-gray-900">{businessProfile?.shopName || 'ShopManager Pro'}</h1>
            <p className="text-xs text-gray-500">{user?.name || 'Business Management'}</p>
          </div>
          <div className="w-10" /> {/* Spacer */}
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto bg-gray-50 relative z-10">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;