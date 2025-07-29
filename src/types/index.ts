export interface Product {
  id: string;
  name: string;
  category: string;
  brand: string;
  variants: ProductVariant[];
  createdAt: string;
  updatedAt: string;
}

export interface ProductVariant {
  id: string;
  packSize: string;
  unit: string;
  stockQuantity: number;
  sellingPrice: number;
  purchasePrice?: number;
  barcode?: string;
  sku?: string;
  lowStockThreshold: number;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  notes?: string;
  creditBalance: number;
  totalPurchases: number;
  lastVisit: string;
  createdAt: string;
}

export interface InvoiceItem {
  productId: string;
  variantId: string;
  productName: string;
  packSize: string;
  quantity: number;
  rate: number;
  total: number;
  tax?: number;
  discount?: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  discount: number;
  grandTotal: number;
  paymentType: 'cash' | 'upi' | 'online' | 'credit';
  amountPaid: number;
  balanceDue: number;
  status: 'paid' | 'partial' | 'credit';
  notes?: string;
  createdAt: string;
}

export interface DashboardStats {
  todaySales: number;
  monthlySales: number;
  creditPending: number;
  topSellingProduct: string;
  lowStockCount: number;
  totalProducts: number;
  newCustomersWeek: number;
  yearlyRevenue: number;
}

export interface SalesReport {
  totalSales: number;
  totalUnits: number;
  invoiceCount: number;
  averageOrderSize: number;
  period: string;
}

export interface ProductSalesReport {
  productId: string;
  productName: string;
  variants: {
    packSize: string;
    unitsSold: number;
    totalVolume: number;
    revenue: number;
  }[];
  totalVolume: number;
  totalRevenue: number;
}

export interface Expense {
  id: string;
  title: string;
  description?: string;
  category: string;
  amount: number;
  paymentMethod: 'cash' | 'upi' | 'online' | 'cheque';
  date: string;
  receipt?: string;
  vendor?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  color: string;
  icon: string;
}

export interface DateRange {
  startDate: string;
  endDate: string;
  label: string;
}