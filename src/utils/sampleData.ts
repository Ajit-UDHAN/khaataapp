import { Product, Customer, Invoice } from '../types';
import { Expense, ExpenseCategory } from '../types';

export const sampleProducts: Product[] = [
  {
    id: '1',
    name: 'Sunflower Oil',
    category: 'Cooking Oil',
    brand: 'Fortune',
    variants: [
      {
        id: '1-1',
        packSize: '500ml',
        unit: 'ml',
        stockQuantity: 50,
        sellingPrice: 85,
        purchasePrice: 75,
        lowStockThreshold: 10,
        barcode: '8901030877575',
        sku: 'FRT-SO-500'
      },
      {
        id: '1-2',
        packSize: '2L',
        unit: 'L',
        stockQuantity: 30,
        sellingPrice: 320,
        purchasePrice: 290,
        lowStockThreshold: 5,
        barcode: '8901030877582',
        sku: 'FRT-SO-2L'
      },
      {
        id: '1-3',
        packSize: '5L',
        unit: 'L',
        stockQuantity: 15,
        sellingPrice: 750,
        purchasePrice: 680,
        lowStockThreshold: 3,
        barcode: '8901030877599',
        sku: 'FRT-SO-5L'
      }
    ],
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z'
  },
  {
    id: '2',
    name: 'Basmati Rice',
    category: 'Rice & Grains',
    brand: 'India Gate',
    variants: [
      {
        id: '2-1',
        packSize: '1kg',
        unit: 'kg',
        stockQuantity: 25,
        sellingPrice: 180,
        purchasePrice: 160,
        lowStockThreshold: 5,
        sku: 'IG-BR-1KG'
      },
      {
        id: '2-2',
        packSize: '5kg',
        unit: 'kg',
        stockQuantity: 12,
        sellingPrice: 850,
        purchasePrice: 780,
        lowStockThreshold: 3,
        sku: 'IG-BR-5KG'
      }
    ],
    createdAt: '2024-01-16T11:00:00Z',
    updatedAt: '2024-01-16T11:00:00Z'
  },
  {
    id: '3',
    name: 'Tata Salt',
    category: 'Spices & Condiments',
    brand: 'Tata',
    variants: [
      {
        id: '3-1',
        packSize: '1kg',
        unit: 'kg',
        stockQuantity: 40,
        sellingPrice: 22,
        purchasePrice: 18,
        lowStockThreshold: 10,
        sku: 'TATA-SALT-1KG'
      }
    ],
    createdAt: '2024-01-17T09:00:00Z',
    updatedAt: '2024-01-17T09:00:00Z'
  }
];

export const sampleCustomers: Customer[] = [
  {
    id: '1',
    name: 'Rajesh Kumar',
    phone: '9876543210',
    address: 'Shop No. 15, Gandhi Market, Delhi',
    creditBalance: 0,
    totalPurchases: 2500,
    lastVisit: '2024-01-20T14:30:00Z',
    createdAt: '2024-01-10T08:00:00Z'
  },
  {
    id: '2',
    name: 'Priya Sharma',
    phone: '9876543211',
    address: 'House No. 42, Sector 15, Noida',
    creditBalance: 150,
    totalPurchases: 1800,
    lastVisit: '2024-01-19T16:45:00Z',
    createdAt: '2024-01-12T10:15:00Z'
  },
  {
    id: '3',
    name: 'Amit Patel',
    phone: '9876543212',
    address: 'B-201, Sunrise Apartments, Mumbai',
    creditBalance: 0,
    totalPurchases: 3200,
    lastVisit: '2024-01-18T11:20:00Z',
    createdAt: '2024-01-08T15:30:00Z'
  }
];

export const sampleInvoices: Invoice[] = [
  {
    id: '1',
    invoiceNumber: 'INV-2024-001',
    customerId: '1',
    customerName: 'Rajesh Kumar',
    items: [
      {
        productId: '1',
        variantId: '1-2',
        productName: 'Sunflower Oil',
        packSize: '2L',
        quantity: 2,
        rate: 320,
        total: 640
      },
      {
        productId: '2',
        variantId: '2-1',
        productName: 'Basmati Rice',
        packSize: '1kg',
        quantity: 1,
        rate: 180,
        total: 180
      }
    ],
    subtotal: 820,
    tax: 0,
    discount: 20,
    grandTotal: 800,
    paymentType: 'cash',
    amountPaid: 800,
    balanceDue: 0,
    status: 'paid',
    createdAt: '2024-01-20T14:30:00Z'
  },
  {
    id: '2',
    invoiceNumber: 'INV-2024-002',
    customerId: '2',
    customerName: 'Priya Sharma',
    items: [
      {
        productId: '1',
        variantId: '1-1',
        productName: 'Sunflower Oil',
        packSize: '500ml',
        quantity: 3,
        rate: 85,
        total: 255
      }
    ],
    subtotal: 255,
    tax: 0,
    discount: 0,
    grandTotal: 255,
    paymentType: 'upi',
    amountPaid: 255,
    balanceDue: 0,
    status: 'paid',
    createdAt: '2024-01-19T16:45:00Z'
  }
];

export const sampleExpenseCategories: ExpenseCategory[] = [
  { id: '1', name: 'Rent', color: 'bg-red-500', icon: 'Home' },
  { id: '2', name: 'Utilities', color: 'bg-yellow-500', icon: 'Zap' },
  { id: '3', name: 'Inventory Purchase', color: 'bg-blue-500', icon: 'Package' },
  { id: '4', name: 'Transportation', color: 'bg-green-500', icon: 'Truck' },
  { id: '5', name: 'Marketing', color: 'bg-purple-500', icon: 'Megaphone' },
  { id: '6', name: 'Staff Salary', color: 'bg-indigo-500', icon: 'Users' },
  { id: '7', name: 'Maintenance', color: 'bg-orange-500', icon: 'Wrench' },
  { id: '8', name: 'Office Supplies', color: 'bg-pink-500', icon: 'FileText' },
  { id: '9', name: 'Insurance', color: 'bg-teal-500', icon: 'Shield' },
  { id: '10', name: 'Other', color: 'bg-gray-500', icon: 'MoreHorizontal' }
];

export const sampleExpenses: Expense[] = [
  {
    id: '1',
    title: 'Shop Rent',
    description: 'Monthly rent for January 2024',
    category: 'Rent',
    amount: 15000,
    paymentMethod: 'online',
    date: '2024-01-01T00:00:00Z',
    vendor: 'Property Owner',
    notes: 'Paid via bank transfer',
    createdAt: '2024-01-01T10:00:00Z',
    updatedAt: '2024-01-01T10:00:00Z'
  },
  {
    id: '2',
    title: 'Electricity Bill',
    description: 'December 2023 electricity bill',
    category: 'Utilities',
    amount: 2500,
    paymentMethod: 'upi',
    date: '2024-01-05T00:00:00Z',
    vendor: 'State Electricity Board',
    createdAt: '2024-01-05T14:30:00Z',
    updatedAt: '2024-01-05T14:30:00Z'
  },
  {
    id: '3',
    title: 'Product Purchase',
    description: 'Bulk purchase of cooking oils',
    category: 'Inventory Purchase',
    amount: 45000,
    paymentMethod: 'cash',
    date: '2024-01-10T00:00:00Z',
    vendor: 'Wholesale Supplier',
    notes: 'Fortune & Sundrop oils - 100 units each',
    createdAt: '2024-01-10T09:15:00Z',
    updatedAt: '2024-01-10T09:15:00Z'
  }
];