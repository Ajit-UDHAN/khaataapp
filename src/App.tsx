import React, { useState, useEffect } from 'react';
import { AppProvider } from './contexts/AppContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginScreen from './components/LoginScreen';
import BusinessProfileSetup from './components/BusinessProfileSetup';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import ProductManager from './components/ProductManager';
import BillingSystem from './components/BillingSystem';
import InvoiceManager from './components/InvoiceManager';
import CustomerManager from './components/CustomerManager';
import Reports from './components/Reports';
import ExpenseManager from './components/ExpenseManager';
import Settings from './components/Settings';
import { sampleProducts, sampleCustomers, sampleInvoices, sampleExpenses, sampleExpenseCategories } from './utils/sampleData';

const AppContent: React.FC = () => {
  const { user, businessProfile, isLoading } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  if (!businessProfile) {
    return <BusinessProfileSetup />;
  }

  // Initialize with sample data if localStorage is empty
  useEffect(() => {
    if (!localStorage.getItem('products')) {
      localStorage.setItem('products', JSON.stringify(sampleProducts));
    }
    if (!localStorage.getItem('customers')) {
      localStorage.setItem('customers', JSON.stringify(sampleCustomers));
    }
    if (!localStorage.getItem('invoices')) {
      localStorage.setItem('invoices', JSON.stringify(sampleInvoices));
    }
    if (!localStorage.getItem('expenses')) {
      localStorage.setItem('expenses', JSON.stringify(sampleExpenses));
    }
    if (!localStorage.getItem('expenseCategories')) {
      localStorage.setItem('expenseCategories', JSON.stringify(sampleExpenseCategories));
    }
  }, []);

  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard onViewChange={setCurrentView} />;
      case 'products':
      case 'add-product':
        return <ProductManager />;
      case 'billing':
        return <BillingSystem onViewChange={setCurrentView} />;
      case 'invoices':
        return <InvoiceManager />;
      case 'customers':
        return <CustomerManager />;
      case 'reports':
        return <Reports />;
      case 'expenses':
        return <ExpenseManager />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard onViewChange={setCurrentView} />;
    }
  };

  return (
    <AppProvider>
      <Layout currentView={currentView} onViewChange={setCurrentView}>
        {renderCurrentView()}
      </Layout>
    </AppProvider>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;