import React, { useState, useEffect } from 'react';
import { AppProvider } from './contexts/AppContext';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import ProductManager from './components/ProductManager';
import BillingSystem from './components/BillingSystem';
import InvoiceManager from './components/InvoiceManager';
import CustomerManager from './components/CustomerManager';
import Reports from './components/Reports';
import ExpenseManager from './components/ExpenseManager';
import { sampleProducts, sampleCustomers, sampleInvoices, sampleExpenses, sampleExpenseCategories } from './utils/sampleData';

function App() {
  const [currentView, setCurrentView] = useState('dashboard');

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
}

export default App;