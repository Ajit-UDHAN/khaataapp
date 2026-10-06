import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product, Customer, Invoice, Expense, ExpenseCategory, ProductVariant } from '../types';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';
import { sampleExpenseCategories as defaultExpenseCategories } from '../utils/sampleData';

interface AppContextType {
  products: Product[];
  setProducts: (products: Product[] | ((prev: Product[]) => Product[])) => void;
  customers: Customer[];
  setCustomers: (customers: Customer[] | ((prev: Customer[]) => Customer[])) => void;
  invoices: Invoice[];
  setInvoices: (invoices: Invoice[] | ((prev: Invoice[]) => Invoice[])) => void;
  deleteInvoice: (id: string) => void;
  expenses: Expense[];
  setExpenses: (expenses: Expense[] | ((prev: Expense[]) => Expense[])) => void;
  expenseCategories: ExpenseCategory[];
  setExpenseCategories: (categories: ExpenseCategory[] | ((prev: ExpenseCategory[]) => ExpenseCategory[])) => void;
  isLoadingData: boolean;
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
  const { user } = useAuth();

  const [products, setProductsState] = useState<Product[]>([]);
  const [customers, setCustomersState] = useState<Customer[]>([]);
  const [invoices, setInvoicesState] = useState<Invoice[]>([]);
  const [expenses, setExpensesState] = useState<Expense[]>([]);
  const [expenseCategories] = useState<ExpenseCategory[]>(defaultExpenseCategories);
  const [isLoadingData, setIsLoadingData] = useState(false);

  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      setIsLoadingData(true);
      try {
        // Load products (variants stored as jsonb array)
        const { data: productsData } = await supabase
          .from('products')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (productsData) {
          const mappedProducts: Product[] = productsData.map((p: any) => ({
            id: p.id,
            name: p.name,
            category: p.category,
            brand: p.brand,
            variants: (p.variants || []) as ProductVariant[],
            createdAt: p.created_at,
            updatedAt: p.updated_at
          }));
          setProductsState(mappedProducts);
        }

        // Load customers
        const { data: customersData } = await supabase
          .from('customers')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (customersData) {
          const mappedCustomers: Customer[] = customersData.map((c: any) => ({
            id: c.id,
            name: c.name,
            phone: c.phone,
            address: c.address || '',
            notes: c.notes || '',
            creditBalance: parseFloat(c.credit_balance) || 0,
            totalPurchases: parseFloat(c.total_purchases) || 0,
            lastVisit: c.last_visit || new Date().toISOString(),
            createdAt: c.created_at
          }));
          setCustomersState(mappedCustomers);
        }

        // Load invoices (items stored as jsonb array)
        const { data: invoicesData } = await supabase
          .from('invoices')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (invoicesData) {
          const mappedInvoices: Invoice[] = invoicesData.map((i: any) => ({
            id: i.id,
            invoiceNumber: i.invoice_number,
            customerId: i.customer_id || '',
            customerName: i.customer_name,
            items: i.items || [],
            subtotal: parseFloat(i.subtotal) || 0,
            tax: parseFloat(i.tax) || 0,
            discount: parseFloat(i.discount) || 0,
            grandTotal: parseFloat(i.grand_total) || 0,
            paymentType: i.payment_type || 'cash',
            amountPaid: parseFloat(i.amount_paid) || 0,
            balanceDue: parseFloat(i.balance_due) || 0,
            status: i.status || 'paid',
            notes: i.notes || '',
            createdAt: i.created_at
          }));
          setInvoicesState(mappedInvoices);
        }

        // Load expenses
        const { data: expensesData } = await supabase
          .from('expenses')
          .select('*')
          .eq('user_id', user.id)
          .order('date', { ascending: false });

        if (expensesData) {
          const mappedExpenses: Expense[] = expensesData.map((e: any) => ({
            id: e.id,
            title: e.title,
            description: e.description || '',
            category: e.category,
            amount: parseFloat(e.amount) || 0,
            paymentMethod: e.payment_method || 'cash',
            date: e.date,
            receipt: e.receipt || '',
            vendor: e.vendor || '',
            notes: e.notes || '',
            createdAt: e.created_at,
            updatedAt: e.updated_at
          }));
          setExpensesState(mappedExpenses);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoadingData(false);
      }
    };

    loadData();
  }, [user]);

  const setProducts = (value: Product[] | ((prev: Product[]) => Product[])) => {
    setProductsState(prev => {
      const next = typeof value === 'function' ? (value as (p: Product[]) => Product[])(prev) : value;
      if (user) {
        next.forEach(p => {
          supabase
            .from('products')
            .upsert({
              id: p.id,
              user_id: user.id,
              name: p.name,
              category: p.category,
              brand: p.brand,
              variants: p.variants,
              updated_at: new Date().toISOString()
            })
            .then(({ error }) => {
              if (error) console.error('Error saving product:', error);
            });
        });
      }
      return next;
    });
  };

  const setCustomers = (value: Customer[] | ((prev: Customer[]) => Customer[])) => {
    setCustomersState(prev => {
      const next = typeof value === 'function' ? (value as (c: Customer[]) => Customer[])(prev) : value;
      if (user) {
        next.forEach(c => {
          supabase
            .from('customers')
            .upsert({
              id: c.id,
              user_id: user.id,
              name: c.name,
              phone: c.phone,
              address: c.address,
              notes: c.notes,
              credit_balance: c.creditBalance,
              total_purchases: c.totalPurchases,
              last_visit: c.lastVisit
            })
            .then(({ error }) => {
              if (error) console.error('Error saving customer:', error);
            });
        });
      }
      return next;
    });
  };

  const setInvoices = (value: Invoice[] | ((prev: Invoice[]) => Invoice[])) => {
    setInvoicesState(prev => {
      const next = typeof value === 'function' ? (value as (i: Invoice[]) => Invoice[])(prev) : value;
      if (user) {
        next.forEach(i => {
          supabase
            .from('invoices')
            .upsert({
              id: i.id,
              user_id: user.id,
              invoice_number: i.invoiceNumber,
              customer_id: i.customerId,
              customer_name: i.customerName,
              items: i.items,
              subtotal: i.subtotal,
              tax: i.tax,
              discount: i.discount,
              grand_total: i.grandTotal,
              payment_type: i.paymentType,
              amount_paid: i.amountPaid,
              balance_due: i.balanceDue,
              status: i.status,
              notes: i.notes
            })
            .then(({ error }) => {
              if (error) console.error('Error saving invoice:', error);
            });
        });
      }
      return next;
    });
  };

  const deleteInvoice = (id: string) => {
    setInvoicesState(prev => prev.filter(i => i.id !== id));
    if (user) {
      supabase
        .from('invoices')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)
        .then(({ error }) => {
          if (error) console.error('Error deleting invoice:', error);
        });
    }
  };

  const setExpenses = (value: Expense[] | ((prev: Expense[]) => Expense[])) => {
    setExpensesState(prev => {
      const next = typeof value === 'function' ? (value as (e: Expense[]) => Expense[])(prev) : value;
      if (user) {
        next.forEach(e => {
          supabase
            .from('expenses')
            .upsert({
              id: e.id,
              user_id: user.id,
              title: e.title,
              description: e.description,
              category: e.category,
              amount: e.amount,
              payment_method: e.paymentMethod,
              date: e.date,
              receipt: e.receipt,
              vendor: e.vendor,
              notes: e.notes,
              updated_at: new Date().toISOString()
            })
            .then(({ error }) => {
              if (error) console.error('Error saving expense:', error);
            });
        });
      }
      return next;
    });
  };

  return (
    <AppContext.Provider
      value={{
        products,
        setProducts,
        customers,
        setCustomers,
        invoices,
        setInvoices,
        deleteInvoice,
        expenses,
        setExpenses,
        expenseCategories,
        setExpenseCategories: () => {},
        isLoadingData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
