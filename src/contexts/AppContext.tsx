import React, { createContext, useContext, ReactNode } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { Product, Customer, Invoice, Expense, ExpenseCategory } from '../types';

interface AppContextType {
  products: Product[];
  setProducts: (products: Product[] | ((prev: Product[]) => Product[])) => void;
  customers: Customer[];
  setCustomers: (customers: Customer[] | ((prev: Customer[]) => Customer[])) => void;
  invoices: Invoice[];
  setInvoices: (invoices: Invoice[] | ((prev: Invoice[]) => Invoice[])) => void;
  expenses: Expense[];
  setExpenses: (expenses: Expense[] | ((prev: Expense[]) => Expense[])) => void;
  expenseCategories: ExpenseCategory[];
  setExpenseCategories: (categories: ExpenseCategory[] | ((prev: ExpenseCategory[]) => ExpenseCategory[])) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [products, setProducts] = useLocalStorage<Product[]>('products', []);
  const [customers, setCustomers] = useLocalStorage<Customer[]>('customers', []);
  const [invoices, setInvoices] = useLocalStorage<Invoice[]>('invoices', []);
  const [expenses, setExpenses] = useLocalStorage<Expense[]>('expenses', []);
  const [expenseCategories, setExpenseCategories] = useLocalStorage<ExpenseCategory[]>('expenseCategories', []);

  return (
    <AppContext.Provider
      value={{
        products,
        setProducts,
        customers,
        setCustomers,
        invoices,
        setInvoices,
        expenses,
        setExpenses,
        expenseCategories,
        setExpenseCategories,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};