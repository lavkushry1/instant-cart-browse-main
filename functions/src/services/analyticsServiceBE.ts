// functions/src/services/analyticsServiceBE.ts

import * as admin from 'firebase-admin';
import { firestoreDB as db, adminInstance } from '../lib/firebaseAdmin'; // Corrected relative path

// Import BE service functions
import { getOrdersBE, Order as OrderBE, OrderStatus as OrderStatusBE, GetOrdersOptionsBE } from './orderServiceBE';
import { getAllProductsBE, ProductBE, GetAllProductsOptionsBE } from './productServiceBE';

// --- Type Definitions (Adapted for Backend) ---

export type TimePeriod = 'today' | 'yesterday' | 'week' | 'month' | 'year' | 'custom';

export interface DateRangeBE {
    startDate: admin.firestore.Timestamp;
    endDate: admin.firestore.Timestamp;
}

export interface SalesSummaryBE {
  totalSales: number;
  totalOrders: number;
  averageOrderValue: number;
  comparisonPeriod?: { // Comparison is optional for BE, can be calculated if needed by CF
    totalSales: number;
    totalOrders: number;
    averageOrderValue: number;
  };
  salesGrowth?: number;
  ordersGrowth?: number;
  aovGrowth?: number;
}

export interface ProductSummaryBE {
  totalProducts: number;
  lowStockProducts: number; // Threshold can be defined, e.g., < 10
  outOfStockProducts: number;
  topSellingProducts: Array<{
    id: string;
    name: string;
    sales: number;
    quantity: number;
  }>;
}

export interface CustomerSummaryBE {
  totalCustomers: number; // Count of unique userIds from orders
  newCustomers: number;   // Customers whose first order is in the period
  returningCustomers: number; // Customers with >1 order or orders before this period
  // customerGrowth?: number; // Optional
}

export interface OrderStatusSummaryBE {
  pending: number;
  processing: number;
  shipped: number;
  delivered: number;
  cancelled: number;
  returned: number; // Assuming 'Returned' is a valid OrderStatusBE
  paymentFailed: number;
  refunded: number;
}

export interface SalesByCategoryBE {
  category: string; // Category ID or Name
  sales: number;
  orderCount: number;
  // percentage?: number; // Can be calculated by CF or client
}

export interface SalesByPaymentMethodBE {
  method: string;
  sales: number;
  orderCount: number;
  // percentage?: number; // Can be calculated by CF or client
}

export interface DashboardDataBE {
  salesSummary: SalesSummaryBE;
  productSummary: ProductSummaryBE;
  customerSummary: CustomerSummaryBE;
  orderStatusSummary: OrderStatusSummaryBE;
  salesByCategory: SalesByCategoryBE[];
  salesByPaymentMethod: SalesByPaymentMethodBE[];
  salesOverTime: Array<{
    date: string; // Formatted date string e.g., YYYY-MM-DD
    sales: number;
    orders: number;
  }>;
  recentOrders: OrderBE[]; // A few recent orders
}

// --- Helper Functions (Backend Adapted) ---

const getDateRangeForPeriodBE = (period: TimePeriod, customRange?: { startDate: Date, endDate: Date }): DateRangeBE => {
  const now = new Date(); // Use server's concept of 'now'
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  let startDate: Date;
  let endDate: Date = now; // Most periods end 'now'

  switch (period) {
    case 'today':
      startDate = todayStart;
      break;
    case 'yesterday':
      startDate = new Date(todayStart);
      startDate.setDate(startDate.getDate() - 1);
      endDate = new Date(todayStart.getTime() - 1); // End of yesterday
      break;
    case 'week':
      startDate = new Date(todayStart);
      startDate.setDate(startDate.getDate() - 7);
      break;
    case 'month':
      startDate = new Date(todayStart);
      startDate.setMonth(startDate.getMonth() - 1);
      break;
    case 'year':
      startDate = new Date(todayStart);
      startDate.setFullYear(startDate.getFullYear() - 1);
      break;
    case 'custom':
      if (!customRange || !customRange.startDate || !customRange.endDate) {
        throw new Error('Custom date range (startDate and endDate) is required for custom period');
      }
      startDate = customRange.startDate;
      endDate = customRange.endDate;
      break;
    default: // Default to 'month' or throw error
      console.warn('Unknown time period: ' + period + ', defaulting to \'month\'.');
      startDate = new Date(todayStart);
      startDate.setMonth(startDate.getMonth() - 1);
      break;
  }
  return {
    startDate: admin.firestore.Timestamp.fromDate(startDate),
    endDate: admin.firestore.Timestamp.fromDate(endDate)
  };
};

const calculateGrowth = (current: number, previous: number): number => {
  if (previous === 0) return current > 0 ? 100 : 0; // Or Infinity if preferred for 0 to non-zero
  return parseFloat((((current - previous) / previous) * 100).toFixed(2));
};

const formatChartDateBE = (date: admin.firestore.Timestamp): string => {
  // Format to YYYY-MM-DD for consistency in charts
  const d = date.toDate();
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};


// --- Main Data Fetching and Aggregation Logic ---

export const getDashboardDataBE = async (
  period: TimePeriod = 'month',
  customRangeJS?: { startDate: Date, endDate: Date } // JS Dates from CF input
): Promise<DashboardDataBE> => {
  console.log(`(Service-Backend) getDashboardDataBE called for period: ${period}`);
  const dateRange = getDateRangeForPeriodBE(period, customRangeJS);
  console.log(`(Service-Backend) Date range: ${dateRange.startDate.toDate()} to ${dateRange.endDate.toDate()}`);

  // 1. Fetch all orders within the date range (with pagination)
  const allOrders: OrderBE[] = [];
  let lastVisibleOrder: admin.firestore.DocumentSnapshot | undefined = undefined;
  const orderFetchLimit = 200; // Fetch orders in batches

   
  while (true) {
    const orderOptions: GetOrdersOptionsBE = {
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
      sortBy: 'createdAt',
      sortOrder: 'asc', // Process chronologically
      limit: orderFetchLimit,
      startAfter: lastVisibleOrder,
    };
    // console.log("(Service-Backend) Fetching orders with options:", orderOptions);
    const { orders: fetchedOrders, lastVisible } = await getOrdersBE(orderOptions);
    if (fetchedOrders.length === 0) {
      break;
    }
    allOrders.push(...fetchedOrders);
    lastVisibleOrder = lastVisible;
    if (!lastVisibleOrder || fetchedOrders.length < orderFetchLimit) { // Break if last page
        break;
    }
  }
  console.log(`(Service-Backend) Total orders fetched: ${allOrders.length}`);

  // 2. Fetch all products (or relevant ones for analytics)
  // For now, fetch all enabled products. Could be optimized if needed.
  const allProducts: ProductBE[] = [];
  let lastVisibleProduct: admin.firestore.DocumentSnapshot | undefined = undefined;
  const productFetchLimit = 200;
  
   
  while(true) {
      const productOptions: GetAllProductsOptionsBE = {
          fetchAll: true, // Fetch all regardless of isEnabled for admin analytics
          limit: productFetchLimit,
          startAfter: lastVisibleProduct,
      };
      const { products: fetchedProducts, lastVisible } = await getAllProductsBE(productOptions);
      if(fetchedProducts.length === 0) break;
      allProducts.push(...fetchedProducts);
      lastVisibleProduct = lastVisible;
      if(!lastVisibleProduct || fetchedProducts.length < productFetchLimit) break;
  }
  console.log(`(Service-Backend) Total products fetched: ${allProducts.length}`);


  // 3. Calculate Sales Summary
  let totalSales = 0;
  const totalOrders = allOrders.length;
  allOrders.forEach(order => {
    totalSales += order.grandTotal;
  });
  const averageOrderValue = totalOrders > 0 ? parseFloat((totalSales / totalOrders).toFixed(2)) : 0;

  const salesSummary: SalesSummaryBE = {
    totalSales: parseFloat(totalSales.toFixed(2)),
    totalOrders,
    averageOrderValue,
    // Comparison period and growth can be added if needed, requires fetching previous period data
  };

  // 4. Calculate Product Summary
  const lowStockThreshold = 10;
  let lowStockProducts = 0;
  let outOfStockProducts = 0;
  allProducts.forEach(p => {
    if (p.stock === 0) outOfStockProducts++;
    else if (p.stock < lowStockThreshold) lowStockProducts++;
  });

  const productSalesMap = new Map<string, { name: string; sales: number; quantity: number }>();
  allOrders.forEach(order => {
    order.items.forEach(item => {
      const current = productSalesMap.get(item.productId) || { name: item.productName, sales: 0, quantity: 0 };
      current.sales += item.lineItemTotal;
      current.quantity += item.quantity;
      productSalesMap.set(item.productId, current);
    });
  });
  const topSellingProducts = Array.from(productSalesMap.entries())
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => b.sales - a.sales)
    .slice(0, 10); // Top 10

  const productSummary: ProductSummaryBE = {
    totalProducts: allProducts.length,
    lowStockProducts,
    outOfStockProducts,
    topSellingProducts,
  };

  // 5. Calculate Customer Summary
  const customerOrderMap = new Map<string, admin.firestore.Timestamp[]>();
  allOrders.forEach(order => {
    if (order.userId) {
      const ordersTimestamps = customerOrderMap.get(order.userId) || [];
      ordersTimestamps.push(order.createdAt as admin.firestore.Timestamp); // OrderBE has Timestamp
      customerOrderMap.set(order.userId, ordersTimestamps);
    }
  });

  let newCustomers = 0;
  let returningCustomers = 0;
  customerOrderMap.forEach(timestamps => {
    const firstOrderInPeriod = timestamps.some(ts => 
        ts.toMillis() >= dateRange.startDate.toMillis() && ts.toMillis() <= dateRange.endDate.toMillis()
    );
    if (firstOrderInPeriod) {
        const hasOrderBeforePeriod = timestamps.some(ts => ts.toMillis() < dateRange.startDate.toMillis());
        if (hasOrderBeforePeriod) {
            returningCustomers++;
        } else {
            newCustomers++;
        }
    }
  });
  // More accurate returning might need all-time order data for users who ordered in period

  const customerSummary: CustomerSummaryBE = {
    totalCustomers: customerOrderMap.size,
    newCustomers,
    returningCustomers,
  };

  // 6. Calculate Order Status Summary
  const orderStatusSummary: OrderStatusSummaryBE = {
    pending: 0, processing: 0, shipped: 0, delivered: 0,
    cancelled: 0, returned: 0, paymentFailed: 0, refunded: 0,
  };
  allOrders.forEach(order => {
    const statusKey = order.orderStatus.toLowerCase() as keyof OrderStatusSummaryBE;
    if (Object.prototype.hasOwnProperty.call(orderStatusSummary, statusKey)) {
        orderStatusSummary[statusKey]++;
    } else {
        // Fallback for statuses not directly matching keys, e.g. 'PaymentFailed' from OrderStatusBE
        if (order.orderStatus === 'PaymentFailed') orderStatusSummary.paymentFailed++;
        // else console.warn(`Unknown order status for summary: ${order.orderStatus}`);
    }
  });

  // 7. Calculate Sales By Category
  const salesByCategoryMap = new Map<string, { sales: number; orderCount: number }>();
  allOrders.forEach(order => {
    const orderCategories = new Set<string>(); // Track categories within one order to count order once per category
    order.items.forEach(item => {
      const product = allProducts.find(p => p.id === item.productId);
      if (product && product.categoryId) {
        const categoryId = product.categoryId;
        const current = salesByCategoryMap.get(categoryId) || { sales: 0, orderCount: 0 };
        current.sales += item.lineItemTotal;
        if (!orderCategories.has(categoryId)) {
            current.orderCount +=1;
            orderCategories.add(categoryId);
        }
        salesByCategoryMap.set(categoryId, current);
      }
    });
  });
  const salesByCategory: SalesByCategoryBE[] = Array.from(salesByCategoryMap.entries())
    .map(([category, data]) => ({ category, ...data })) // category is ID, could map to name
    .sort((a,b) => b.sales - a.sales);

  // 8. Calculate Sales By Payment Method
  const salesByPaymentMethodMap = new Map<string, { sales: number; orderCount: number }>();
   allOrders.forEach(order => {
    const method = order.paymentMethod || 'Unknown';
    const current = salesByPaymentMethodMap.get(method) || { sales: 0, orderCount: 0 };
    current.sales += order.grandTotal;
    current.orderCount += 1;
    salesByPaymentMethodMap.set(method, current);
  });
  const salesByPaymentMethod: SalesByPaymentMethodBE[] = Array.from(salesByPaymentMethodMap.entries())
    .map(([method, data]) => ({ method, ...data }))
    .sort((a,b) => b.sales - a.sales);


  // 9. Prepare Sales Over Time Data (Daily aggregation)
  const salesOverTimeMap = new Map<string, { sales: number; orders: number }>();
  const currentDate = dateRange.startDate.toDate();
  const anEndDate = dateRange.endDate.toDate(); // Renamed to avoid conflict with global endDate if any
  while(currentDate <= anEndDate) {
      salesOverTimeMap.set(formatChartDateBE(admin.firestore.Timestamp.fromDate(currentDate)), {sales: 0, orders: 0});
      currentDate.setDate(currentDate.getDate() + 1);
  }

  allOrders.forEach(order => {
    const orderDateStr = formatChartDateBE(order.createdAt as admin.firestore.Timestamp);
    if (salesOverTimeMap.has(orderDateStr)) {
      const current = salesOverTimeMap.get(orderDateStr)!; // Existence checked
      current.sales += order.grandTotal;
      current.orders += 1;
      salesOverTimeMap.set(orderDateStr, current);
    }
  });
  const salesOverTime = Array.from(salesOverTimeMap.entries())
    .map(([date, data]) => ({ date, ...data }))
    .sort((a, b) => a.date.localeCompare(b.date)); // Sort by date string

  // 10. Get Recent Orders (e.g., last 5)
  const recentOrders = allOrders.slice(-5).reverse(); // Last 5, newest first

  return {
    salesSummary,
    productSummary,
    customerSummary,
    orderStatusSummary,
    salesByCategory,
    salesByPaymentMethod,
    salesOverTime,
    recentOrders,
  };
}; 