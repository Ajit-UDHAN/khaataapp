import { Invoice, Product, Customer, DashboardStats, SalesReport, ProductSalesReport } from '../types';

export const calculateDashboardStats = (
  invoices: Invoice[],
  products: Product[],
  customers: Customer[]
): DashboardStats => {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const yearStart = new Date(now.getFullYear(), 0, 1);
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const todayInvoices = invoices.filter(inv => new Date(inv.createdAt) >= todayStart);
  const monthInvoices = invoices.filter(inv => new Date(inv.createdAt) >= monthStart);
  const yearInvoices = invoices.filter(inv => new Date(inv.createdAt) >= yearStart);
  const newCustomers = customers.filter(cust => new Date(cust.createdAt) >= weekAgo);

  const todaySales = todayInvoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
  const monthlySales = monthInvoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
  const yearlyRevenue = yearInvoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
  const creditPending = customers.reduce((sum, cust) => sum + cust.creditBalance, 0);

  // Calculate top selling product
  const productSales: { [key: string]: number } = {};
  invoices.forEach(invoice => {
    invoice.items.forEach(item => {
      if (!productSales[item.productName]) {
        productSales[item.productName] = 0;
      }
      productSales[item.productName] += item.quantity;
    });
  });

  const topSellingProduct = Object.keys(productSales).reduce((a, b) => 
    productSales[a] > productSales[b] ? a : b, 'N/A'
  );

  // Calculate low stock count
  const lowStockCount = products.reduce((count, product) => {
    return count + product.variants.filter(variant => 
      variant.stockQuantity <= variant.lowStockThreshold
    ).length;
  }, 0);

  const totalProducts = products.reduce((sum, product) => sum + product.variants.length, 0);

  return {
    todaySales,
    monthlySales,
    creditPending,
    topSellingProduct,
    lowStockCount,
    totalProducts,
    newCustomersWeek: newCustomers.length,
    yearlyRevenue
  };
};

export const calculateSalesReport = (
  invoices: Invoice[],
  startDate: Date,
  endDate: Date
): SalesReport => {
  const filteredInvoices = invoices.filter(invoice => {
    const invoiceDate = new Date(invoice.createdAt);
    return invoiceDate >= startDate && invoiceDate <= endDate;
  });

  const totalSales = filteredInvoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
  const totalUnits = filteredInvoices.reduce((sum, inv) => 
    sum + inv.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
  );
  const invoiceCount = filteredInvoices.length;
  const averageOrderSize = invoiceCount > 0 ? totalSales / invoiceCount : 0;

  return {
    totalSales,
    totalUnits,
    invoiceCount,
    averageOrderSize,
    period: `${startDate.toDateString()} - ${endDate.toDateString()}`
  };
};

export const calculateProductSalesReport = (
  invoices: Invoice[],
  productId: string,
  startDate: Date,
  endDate: Date
): ProductSalesReport | null => {
  const filteredInvoices = invoices.filter(invoice => {
    const invoiceDate = new Date(invoice.createdAt);
    return invoiceDate >= startDate && invoiceDate <= endDate;
  });

  const productItems = filteredInvoices.flatMap(invoice => 
    invoice.items.filter(item => item.productId === productId)
  );

  if (productItems.length === 0) return null;

  const productName = productItems[0].productName;
  const variantSales: { [key: string]: { unitsSold: number; totalVolume: number; revenue: number } } = {};

  productItems.forEach(item => {
    if (!variantSales[item.packSize]) {
      variantSales[item.packSize] = { unitsSold: 0, totalVolume: 0, revenue: 0 };
    }
    variantSales[item.packSize].unitsSold += item.quantity;
    variantSales[item.packSize].revenue += item.total;
    
    // Calculate volume based on pack size
    const packValue = parseFloat(item.packSize.replace(/[^\d.]/g, ''));
    variantSales[item.packSize].totalVolume += packValue * item.quantity;
  });

  const variants = Object.entries(variantSales).map(([packSize, data]) => ({
    packSize,
    ...data
  }));

  const totalVolume = variants.reduce((sum, variant) => sum + variant.totalVolume, 0);
  const totalRevenue = variants.reduce((sum, variant) => sum + variant.revenue, 0);

  return {
    productId,
    productName,
    variants,
    totalVolume,
    totalRevenue
  };
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount);
};

export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('en-IN').format(num);
};

export const generateInvoiceNumber = (invoices: Invoice[]): string => {
  const existingNumbers = invoices
    .map(inv => {
      const match = inv.invoiceNumber.match(/INV-(\d+)/);
      return match ? parseInt(match[1]) : 0;
    })
    .sort((a, b) => b - a);
  
  const nextNumber = existingNumbers.length > 0 ? existingNumbers[0] + 1 : 1;
  return `KHAATA-${nextNumber.toString().padStart(4, '0')}`;
};