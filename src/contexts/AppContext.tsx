import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product, Customer, Invoice, Expense, ExpenseCategory } from '../types';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';

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

  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      setIsLoadingData(true);
      try {
        // Load products
        const { data: productsData } = await supabase
          .from('products')
          .select('*, product_variants(*)')
          .eq('user_id', user.id);

        if (productsData) {
          const mappedProducts: Product[] = productsData.map((p: any) => ({
            id: p.id,
            name: p.name,
            description: p.description,
            variants: p.product_variants.map((v: any) => ({
              id: v.id,
              packSize: v.pack_size,
              unitPrice: parseFloat(v.unit_price),
              stockQuantity: v.stock_quantity,
              lowStockThreshold: v.low_stock_threshold
            }))
          }));
          setProducts(mappedProducts);
        }

        // Load customers
        const { data: customersData } = await supabase
          .from('customers')
          .select('*')
          .eq('user_id', user.id);

        if (customersData) {
          const mappedCustomers: Customer[] = customersData.map((c: any) => ({
            id: c.id,
            name: c.name,
            phone: c.phone,
            email: c.email,
            creditLimit: parseFloat(c.credit_limit),
            creditUsed: parseFloat(c.credit_used)
          }));
          setCustomers(mappedCustomers);
        }

        // Load invoices
        const { data: invoicesData } = await supabase
          .from('invoices')
          .select('*, invoice_items(*)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (invoicesData) {
          const mappedInvoices: Invoice[] = invoicesData.map((i: any) => ({
            id: i.id,
            invoiceNumber: i.invoice_number,
            customerId: i.customer_id,
            customerName: i.customer_name,
            subtotal: parseFloat(i.subtotal),
            discountPercentage: i.discount_percentage,
            discountAmount: parseFloat(i.discount_amount),
            taxPercentage: i.tax_percentage,
            taxAmount: parseFloat(i.tax_amount),
            grandTotal: parseFloat(i.grand_total),
            status: i.status,
            items: i.invoice_items.map((it: any) => ({
              id: it.id,
              productVariantId: it.product_variant_id,
              productName: it.product_name,
              packSize: it.pack_size,
              quantity: it.quantity,
              unitPrice: parseFloat(it.unit_price),
              totalPrice: parseFloat(it.total_price)
            })),
            notes: i.notes,
            createdAt: i.created_at
          }));
          setInvoices(mappedInvoices);
        }

        // Load expense categories
        const { data: categoriesData } = await supabase
          .from('expense_categories')
          .select('*')
          .eq('user_id', user.id);

        if (categoriesData) {
          const mappedCategories: ExpenseCategory[] = categoriesData.map((c: any) => ({
            id: c.id,
            name: c.name,
            color: c.color
          }));
          setExpenseCategories(mappedCategories);
        }

        // Load expenses
        const { data: expensesData } = await supabase
          .from('expenses')
          .select('*')
          .eq('user_id', user.id);

        if (expensesData) {
          const mappedExpenses: Expense[] = expensesData.map((e: any) => ({
            id: e.id,
            categoryId: e.category_id,
            description: e.description,
            amount: parseFloat(e.amount),
            date: e.date
          }));
          setExpenses(mappedExpenses);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoadingData(false);
      }
    };

    loadData();
  }, [user]);

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
        isLoadingData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};