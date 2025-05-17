import { functionsClient } from '../lib/firebaseClient'; // Corrected path
import { httpsCallable, HttpsCallableResult, HttpsCallable } from 'firebase/functions';
import { Timestamp as ClientTimestamp } from 'firebase/firestore';
import { Order } from '@/types/order'; // Assuming this uses ClientTimestamp
import {
  AnalyticsData,
  CustomerInsight,
  MarketingCampaign,
  CustomReport,
  ExportJob,
  ReportFilter,
  DateRange,
  AnalyticsDimension,
  AnalyticsMetric,
  DashboardLayout,
  DashboardWidget,
  ExportFormat,
  ReportSchedule,
  ReportExportOptions
} from '@/types/analytics';

// Re-define types for Client context if they differ from BE, specifically Timestamps.
// Or, use a generic type that can be <T extends Timestamp> client-side or admin-side.

export type TimePeriod = 'today' | 'yesterday' | 'week' | 'month' | 'year' | 'custom';

export interface DateRangeClient {
    startDate: ClientTimestamp | Date | string; // Flexible for input, converted before CF call
    endDate: ClientTimestamp | Date | string;
}

export interface SalesSummaryClient {
  totalSales: number;
  totalOrders: number;
  averageOrderValue: number;
  // Growth metrics would be calculated client-side if previous period data is also fetched or returned by CF
}

export interface ProductSummaryClient {
  totalProducts: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  topSellingProducts: Array<{
    id: string;
    name: string;
    sales: number;
    quantity: number;
  }>;
}

export interface CustomerSummaryClient {
  totalCustomers: number;
  newCustomers: number;
  returningCustomers: number;
}

export interface OrderStatusSummaryClient {
  pending: number;
  processing: number;
  shipped: number;
  delivered: number;
  cancelled: number;
  returned: number;
  paymentFailed: number;
  refunded: number;
}

export interface SalesByCategoryClient {
  category: string;
  sales: number;
  orderCount: number;
}

export interface SalesByPaymentMethodClient {
  method: string;
  sales: number;
  orderCount: number;
}

// This DashboardData type is what the client-side components (AdminDashboard.tsx) will expect.
// It should mirror DashboardDataBE but use ClientTimestamps where appropriate if dates are passed through.
// For salesOverTime, the date is already a string from BE.
// For recentOrders, OrderBE timestamps need conversion to ClientTimestamp if not already compatible.
export interface DashboardDataClient {
  salesSummary: SalesSummaryClient;
  productSummary: ProductSummaryClient;
  customerSummary: CustomerSummaryClient;
  orderStatusSummary: OrderStatusSummaryClient;
  salesByCategory: SalesByCategoryClient[];
  salesByPaymentMethod: SalesByPaymentMethodClient[];
  salesOverTime: Array<{
    date: string;
    sales: number;
    orders: number;
  }>;
  recentOrders: Order[]; // Use the client Order type from @/types/order
}

// --- Cloud Function Call ---

let getDashboardDataCallable: HttpsCallable<
  { timePeriod: TimePeriod; customRange?: { startDate: string; endDate: string } }, 
  { success: boolean; data?: DashboardDataClient; error?: string }
>;

const initializeCallables = () => {
    if (!functionsClient) {
        console.error("Firebase functions client not available for analyticsService.");
        return;
    }
    if (!getDashboardDataCallable) {
        getDashboardDataCallable = httpsCallable(functionsClient, 'analytics-getDashboardDataCF');
    }
};

// Ensure callables are initialized when the module loads or on first call
// Be cautious with top-level initializeCallables() if it might run before Firebase app is fully ready.
// A common pattern is to initialize on first use or within a useEffect in a component.
// For a service, initializing on first use is safer.

export const getDashboardData = async (
  period: TimePeriod = 'month',
  customRange?: DateRangeClient
): Promise<DashboardDataClient> => {
  initializeCallables(); // Initialize on first use
  if (!getDashboardDataCallable) {
    throw new Error("Analytics function (getDashboardDataCallable) not initialized.");
  }

  console.log('(Service-Client) getDashboardData called for period:', period, 'customRange:', customRange);

  let payloadRange;
  if (customRange && customRange.startDate && customRange.endDate) {
    // Convert Date/ClientTimestamp to ISO string for CF payload
    const toISO = (date: ClientTimestamp | Date | string): string => {
        if (typeof date === 'string') return date;
        if (date instanceof ClientTimestamp) return date.toDate().toISOString();
        return date.toISOString();
    };
    payloadRange = {
        startDate: toISO(customRange.startDate),
        endDate: toISO(customRange.endDate),
    };
  }

  try {
    const result = await getDashboardDataCallable({ timePeriod: period, customRange: payloadRange });
    
    if (!result.data.success || !result.data.data) {
      console.error('Failed to get dashboard data from CF:', result.data.error || 'No data returned');
      throw new Error(result.data.error || 'Failed to retrieve dashboard data.');
    }
    
    // The data from CF should be DashboardDataBE. We need to map it to DashboardDataClient.
    // Key part: Convert admin.firestore.Timestamp in recentOrders to ClientTimestamp.
    // Other parts of DashboardDataBE are numbers/strings/simple arrays and should map directly to DashboardDataClient fields.
    const beData = result.data.data as any; // Cast to any for easier mapping temporarily
    
    const clientRecentOrders = beData.recentOrders.map((order: any) => ({
        ...order,
        createdAt: order.createdAt && order.createdAt._seconds ? ClientTimestamp.fromDate(new Date(order.createdAt._seconds * 1000 + (order.createdAt._nanoseconds || 0) / 1000000)) : ClientTimestamp.now(),
        updatedAt: order.updatedAt && order.updatedAt._seconds ? ClientTimestamp.fromDate(new Date(order.updatedAt._seconds * 1000 + (order.updatedAt._nanoseconds || 0) / 1000000)) : ClientTimestamp.now(),
        // Ensure other nested timestamps (if any in Order type) are also converted.
    })) as Order[];
    
    return {
        salesSummary: beData.salesSummary,
        productSummary: beData.productSummary,
        customerSummary: beData.customerSummary,
        orderStatusSummary: beData.orderStatusSummary,
        salesByCategory: beData.salesByCategory,
        salesByPaymentMethod: beData.salesByPaymentMethod,
        salesOverTime: beData.salesOverTime,
        recentOrders: clientRecentOrders,
    } as DashboardDataClient;

  } catch (error) {
    console.error("Error calling getDashboardDataCallable:", error);
    if (error instanceof Error && error.message.includes('functions/analytics-getDashboardDataCF is not a valid function name')) {
        throw new Error('Analytics function not deployed or misconfigured. Check Firebase console.');
    }
    throw error; // Re-throw original or a more specific error
  }
};

// Remove all old client-side aggregation logic, helpers like getDateRangeForPeriod, filterOrdersByDateRange, etc.
// Only keep the types needed by the client (DashboardDataClient and its sub-types) and the getDashboardData CF caller.

// Mock data for analytics
const generateDailyData = (days: number): AnalyticsData[] => {
  const data: AnalyticsData[] = [];
  const now = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(now.getDate() - i);
    
    // Base values with some randomization
    const views = Math.floor(1000 + Math.random() * 500);
    const visitors = Math.floor(views * (0.7 + Math.random() * 0.2)); // 70-90% of views
    const orders = Math.floor(visitors * (0.02 + Math.random() * 0.03)); // 2-5% conversion
    const revenue = orders * (50 + Math.random() * 30); // $50-80 average order value
    
    data.push({
      id: `day-${date.toISOString().split('T')[0]}`,
      date: date.toISOString(),
      source: 'storefront',
      metrics: {
        views,
        visitors,
        orders,
        revenue,
        conversionRate: Number((orders / visitors * 100).toFixed(2)),
        averageOrderValue: Number((revenue / orders).toFixed(2)),
        // Additional metrics
        addToCart: Math.floor(visitors * (0.1 + Math.random() * 0.1)),
        checkoutStarts: Math.floor(visitors * (0.05 + Math.random() * 0.05)),
        abandonedCarts: Math.floor(visitors * (0.03 + Math.random() * 0.04)),
      }
    });
  }
  
  return data;
};

// Customer insights mock data
const customerInsights: CustomerInsight[] = [
  {
    id: '1',
    customerSegment: 'Returning Customers',
    description: 'Customers who have made more than one purchase',
    value: 35.8,
    previousValue: 32.5,
    changePercentage: 10.15,
    period: 'last_30_days',
    trend: Array(10).fill(0).map((_, i) => ({
      date: new Date(Date.now() - (9 - i) * 86400000).toISOString(),
      value: 30 + Math.random() * 10
    }))
  },
  {
    id: '2',
    customerSegment: 'New Customers',
    description: 'First-time purchasers',
    value: 245,
    previousValue: 210,
    changePercentage: 16.67,
    period: 'last_30_days',
    trend: Array(10).fill(0).map((_, i) => ({
      date: new Date(Date.now() - (9 - i) * 86400000).toISOString(),
      value: 180 + Math.random() * 100
    }))
  },
  {
    id: '3',
    customerSegment: 'VIP Customers',
    description: 'Top 10% of customers by order value',
    value: 128,
    previousValue: 115,
    changePercentage: 11.3,
    period: 'last_30_days',
    trend: Array(10).fill(0).map((_, i) => ({
      date: new Date(Date.now() - (9 - i) * 86400000).toISOString(),
      value: 100 + Math.random() * 40
    }))
  },
  {
    id: '4',
    customerSegment: 'At-Risk Customers',
    description: 'Customers who haven\'t purchased in over 60 days',
    value: 89,
    previousValue: 72,
    changePercentage: 23.61,
    period: 'last_30_days',
    trend: Array(10).fill(0).map((_, i) => ({
      date: new Date(Date.now() - (9 - i) * 86400000).toISOString(),
      value: 60 + Math.random() * 40
    }))
  },
  {
    id: '5',
    customerSegment: 'Average Order Value',
    description: 'Average spend per order',
    value: 68.42,
    previousValue: 65.17,
    changePercentage: 4.99,
    period: 'last_30_days',
    trend: Array(10).fill(0).map((_, i) => ({
      date: new Date(Date.now() - (9 - i) * 86400000).toISOString(),
      value: 60 + Math.random() * 15
    }))
  }
];

// Marketing campaigns mock data
const marketingCampaigns: MarketingCampaign[] = [
  {
    id: '1',
    name: 'Summer Sale 2023',
    status: 'active',
    startDate: '2023-06-01T00:00:00Z',
    endDate: '2023-06-30T23:59:59Z',
    budget: 5000,
    spent: 3750,
    impressions: 125000,
    clicks: 7500,
    conversions: 450,
    revenue: 18000,
    roas: 4.8,
    ctr: 6.0,
    cvr: 6.0,
    cpa: 8.33
  },
  {
    id: '2',
    name: 'New Product Launch',
    status: 'active',
    startDate: '2023-05-15T00:00:00Z',
    endDate: '2023-07-15T23:59:59Z',
    budget: 7500,
    spent: 4800,
    impressions: 180000,
    clicks: 9200,
    conversions: 380,
    revenue: 22800,
    roas: 4.75,
    ctr: 5.11,
    cvr: 4.13,
    cpa: 12.63
  },
  {
    id: '3',
    name: 'Loyal Customer Rewards',
    status: 'completed',
    startDate: '2023-04-01T00:00:00Z',
    endDate: '2023-04-30T23:59:59Z',
    budget: 3000,
    spent: 3000,
    impressions: 82000,
    clicks: 5100,
    conversions: 410,
    revenue: 16400,
    roas: 5.47,
    ctr: 6.22,
    cvr: 8.04,
    cpa: 7.32
  },
  {
    id: '4',
    name: 'Black Friday Preview',
    status: 'scheduled',
    startDate: '2023-11-15T00:00:00Z',
    endDate: '2023-11-24T23:59:59Z',
    budget: 10000,
    spent: 0,
    impressions: 0,
    clicks: 0,
    conversions: 0,
    revenue: 0,
    roas: 0,
    ctr: 0,
    cvr: 0,
    cpa: 0
  },
  {
    id: '5',
    name: 'Winter Collection',
    status: 'draft',
    startDate: '2023-12-01T00:00:00Z',
    endDate: '2023-12-31T23:59:59Z',
    budget: 8000,
    spent: 0,
    impressions: 0,
    clicks: 0,
    conversions: 0,
    revenue: 0,
    roas: 0,
    ctr: 0,
    cvr: 0,
    cpa: 0
  }
];

// Custom reports mock data
const customReports: CustomReport[] = [
  {
    id: '1',
    name: 'Monthly Sales Overview',
    description: 'Monthly breakdown of sales performance by product category',
    createdAt: '2023-05-10T08:30:00Z',
    updatedAt: '2023-06-05T14:15:00Z',
    schedule: {
      frequency: 'monthly',
      dayOfMonth: 1,
      recipients: ['admin@example.com', 'sales@example.com'],
      active: true,
      lastSent: '2023-06-01T06:00:00Z'
    },
    metrics: ['orders', 'revenue', 'averageOrderValue'],
    dimensions: ['productCategory', 'month'],
    filters: [],
    dateRange: {
      startDate: '2023-01-01T00:00:00Z',
      endDate: '2023-12-31T23:59:59Z',
      preset: 'this_year'
    },
    visualizationType: 'bar_chart'
  },
  {
    id: '2',
    name: 'Traffic Source Analysis',
    description: 'Detailed analysis of traffic sources and conversion rates',
    createdAt: '2023-04-22T11:45:00Z',
    updatedAt: '2023-06-01T09:30:00Z',
    metrics: ['visitors', 'conversionRate', 'orders'],
    dimensions: ['trafficSource', 'device'],
    filters: [
      {
        dimension: 'visitors',
        operator: 'greater_than',
        value: 100
      }
    ],
    dateRange: {
      startDate: '2023-05-01T00:00:00Z',
      endDate: '2023-05-31T23:59:59Z',
      preset: 'last_30_days'
    },
    visualizationType: 'pie_chart'
  },
  {
    id: '3',
    name: 'Customer Retention Report',
    description: 'Insights into customer retention and repeat purchase behavior',
    createdAt: '2023-03-15T13:20:00Z',
    updatedAt: '2023-03-15T13:20:00Z',
    metrics: ['repeatCustomers', 'customerLifetimeValue', 'churnRate'],
    dimensions: ['customerSegment', 'country'],
    filters: [],
    dateRange: {
      startDate: '2023-01-01T00:00:00Z',
      endDate: '2023-12-31T23:59:59Z',
      preset: 'this_year'
    },
    visualizationType: 'table',
    sortBy: 'customerLifetimeValue',
    sortDirection: 'desc'
  }
];

// Export jobs mock data
const exportJobs: ExportJob[] = [
  {
    id: '1',
    name: 'May 2023 Sales Export',
    status: 'completed',
    format: 'xlsx',
    createdAt: '2023-06-01T09:15:00Z',
    completedAt: '2023-06-01T09:16:30Z',
    downloadUrl: '/exports/sales_may_2023.xlsx',
    fileSize: 1240000,
    reportId: '1',
    dataRange: {
      startDate: '2023-05-01T00:00:00Z',
      endDate: '2023-05-31T23:59:59Z',
      preset: 'last_month'
    }
  },
  {
    id: '2',
    name: 'Customer Data Export',
    status: 'processing',
    format: 'csv',
    createdAt: '2023-06-05T14:30:00Z',
    reportId: '3'
  },
  {
    id: '3',
    name: 'Traffic Source Report',
    status: 'failed',
    format: 'pdf',
    createdAt: '2023-06-03T11:20:00Z',
    reportId: '2'
  }
];

// Available dimensions for reports
const dimensions: AnalyticsDimension[] = [
  {
    id: 'date',
    name: 'Date',
    description: 'Date of the event',
    category: 'Time',
    dataType: 'date'
  },
  {
    id: 'productCategory',
    name: 'Product Category',
    description: 'Category of the product',
    category: 'Product',
    dataType: 'string'
  },
  {
    id: 'trafficSource',
    name: 'Traffic Source',
    description: 'Source of the traffic',
    category: 'Acquisition',
    dataType: 'string'
  },
  {
    id: 'device',
    name: 'Device',
    description: 'Device used by the user',
    category: 'Technology',
    dataType: 'string'
  },
  {
    id: 'customerSegment',
    name: 'Customer Segment',
    description: 'Segment the customer belongs to',
    category: 'Customer',
    dataType: 'string'
  },
  {
    id: 'country',
    name: 'Country',
    description: 'Country of the user',
    category: 'Geography',
    dataType: 'string'
  },
  {
    id: 'month',
    name: 'Month',
    description: 'Month of the event',
    category: 'Time',
    dataType: 'string'
  }
];

// Available metrics for reports
const metrics: AnalyticsMetric[] = [
  {
    id: 'views',
    name: 'Page Views',
    description: 'Number of page views',
    category: 'Traffic',
    aggregation: 'sum'
  },
  {
    id: 'visitors',
    name: 'Unique Visitors',
    description: 'Number of unique visitors',
    category: 'Traffic',
    aggregation: 'count_distinct'
  },
  {
    id: 'orders',
    name: 'Orders',
    description: 'Number of orders placed',
    category: 'Conversion',
    aggregation: 'sum'
  },
  {
    id: 'revenue',
    name: 'Revenue',
    description: 'Total revenue',
    category: 'Conversion',
    aggregation: 'sum'
  },
  {
    id: 'conversionRate',
    name: 'Conversion Rate',
    description: 'Percentage of visitors who made a purchase',
    category: 'Conversion',
    aggregation: 'avg',
    formula: 'orders / visitors * 100'
  },
  {
    id: 'averageOrderValue',
    name: 'Average Order Value',
    description: 'Average value of orders',
    category: 'Conversion',
    aggregation: 'avg',
    formula: 'revenue / orders'
  },
  {
    id: 'repeatCustomers',
    name: 'Repeat Customers',
    description: 'Number of customers who have made more than one purchase',
    category: 'Customer',
    aggregation: 'count'
  },
  {
    id: 'customerLifetimeValue',
    name: 'Customer Lifetime Value',
    description: 'Average revenue generated by a customer over their lifetime',
    category: 'Customer',
    aggregation: 'avg'
  },
  {
    id: 'churnRate',
    name: 'Churn Rate',
    description: 'Percentage of customers who have not returned to make a purchase',
    category: 'Customer',
    aggregation: 'avg'
  }
];

// In-memory storage
const analyticsData = generateDailyData(90); // Last 90 days of data

// Advanced Analytics API Functions

/**
 * Get analytics data for a specific date range
 */
export const getAdvancedAnalyticsData = async (dateRange: { startDate: string; endDate: string }): Promise<AnalyticsData[]> => {
  return new Promise(resolve => {
    setTimeout(() => {
      const startDate = new Date(dateRange.startDate);
      const endDate = new Date(dateRange.endDate);
      
      const filteredData = analyticsData.filter(item => {
        const itemDate = new Date(item.date);
        return itemDate >= startDate && itemDate <= endDate;
      });
      
      resolve(filteredData);
    }, 300);
  });
};

/**
 * Get customer insights
 */
export const getCustomerInsights = async (period?: string): Promise<CustomerInsight[]> => {
  return new Promise(resolve => {
    setTimeout(() => {
      // If period is specified, filter insights
      if (period) {
        const filteredInsights = customerInsights.filter(insight => insight.period === period);
        resolve(filteredInsights);
      } else {
        resolve(customerInsights);
      }
    }, 300);
  });
};

/**
 * Get marketing campaigns
 */
export const getMarketingCampaigns = async (status?: string): Promise<MarketingCampaign[]> => {
  return new Promise(resolve => {
    setTimeout(() => {
      // If status is specified, filter campaigns
      if (status) {
        const filteredCampaigns = marketingCampaigns.filter(campaign => campaign.status === status);
        resolve(filteredCampaigns);
      } else {
        resolve(marketingCampaigns);
      }
    }, 300);
  });
};

/**
 * Get marketing campaign by ID
 */
export const getMarketingCampaignById = async (id: string): Promise<MarketingCampaign | null> => {
  return new Promise(resolve => {
    setTimeout(() => {
      const campaign = marketingCampaigns.find(c => c.id === id);
      resolve(campaign || null);
    }, 300);
  });
};

/**
 * Create or update a marketing campaign
 */
export const saveMarketingCampaign = async (campaign: Partial<MarketingCampaign> & { id?: string }): Promise<MarketingCampaign> => {
  return new Promise(resolve => {
    setTimeout(() => {
      if (campaign.id) {
        // Update existing campaign
        const index = marketingCampaigns.findIndex(c => c.id === campaign.id);
        if (index !== -1) {
          marketingCampaigns[index] = { ...marketingCampaigns[index], ...campaign };
          resolve(marketingCampaigns[index]);
        } else {
          // Not found, create new with provided ID
          const newCampaign = {
            ...createEmptyCampaign(),
            ...campaign
          } as MarketingCampaign;
          marketingCampaigns.push(newCampaign);
          resolve(newCampaign);
        }
      } else {
        // Create new campaign
        const newCampaign = {
          ...createEmptyCampaign(),
          ...campaign,
          id: `campaign-${Date.now()}`,
        } as MarketingCampaign;
        marketingCampaigns.push(newCampaign);
        resolve(newCampaign);
      }
    }, 300);
  });
};

/**
 * Delete a marketing campaign
 */
export const deleteMarketingCampaign = async (id: string): Promise<boolean> => {
  return new Promise(resolve => {
    setTimeout(() => {
      const index = marketingCampaigns.findIndex(c => c.id === id);
      if (index !== -1) {
        marketingCampaigns.splice(index, 1);
        resolve(true);
      } else {
        resolve(false);
      }
    }, 300);
  });
};

/**
 * Get custom reports
 */
export const getCustomReports = async (): Promise<CustomReport[]> => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(customReports);
    }, 300);
  });
};

/**
 * Get custom report by ID
 */
export const getCustomReportById = async (id: string): Promise<CustomReport | null> => {
  return new Promise(resolve => {
    setTimeout(() => {
      const report = customReports.find(r => r.id === id);
      resolve(report || null);
    }, 300);
  });
};

/**
 * Create or update a custom report
 */
export const saveCustomReport = async (report: Partial<CustomReport> & { id?: string }): Promise<CustomReport> => {
  return new Promise(resolve => {
    setTimeout(() => {
      if (report.id) {
        // Update existing report
        const index = customReports.findIndex(r => r.id === report.id);
        if (index !== -1) {
          customReports[index] = { 
            ...customReports[index], 
            ...report,
            updatedAt: new Date().toISOString()
          };
          resolve(customReports[index]);
        } else {
          // Not found, create new with provided ID
          const newReport = {
            id: report.id,
            name: report.name || 'New Report',
            description: report.description || '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            metrics: report.metrics || [],
            dimensions: report.dimensions || [],
            filters: report.filters || [],
            dateRange: report.dateRange || {
              startDate: new Date(Date.now() - 30 * 86400000).toISOString(),
              endDate: new Date().toISOString(),
              preset: 'last_30_days'
            },
            visualizationType: report.visualizationType || 'table',
            sortBy: report.sortBy,
            sortDirection: report.sortDirection,
            schedule: report.schedule
          } as CustomReport;
          customReports.push(newReport);
          resolve(newReport);
        }
      } else {
        // Create new report
        const newReport = {
          id: `report-${Date.now()}`,
          name: report.name || 'New Report',
          description: report.description || '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          metrics: report.metrics || [],
          dimensions: report.dimensions || [],
          filters: report.filters || [],
          dateRange: report.dateRange || {
            startDate: new Date(Date.now() - 30 * 86400000).toISOString(),
            endDate: new Date().toISOString(),
            preset: 'last_30_days'
          },
          visualizationType: report.visualizationType || 'table',
          sortBy: report.sortBy,
          sortDirection: report.sortDirection,
          schedule: report.schedule
        } as CustomReport;
        customReports.push(newReport);
        resolve(newReport);
      }
    }, 300);
  });
};

/**
 * Delete a custom report
 */
export const deleteCustomReport = async (id: string): Promise<boolean> => {
  return new Promise(resolve => {
    setTimeout(() => {
      const index = customReports.findIndex(r => r.id === id);
      if (index !== -1) {
        customReports.splice(index, 1);
        resolve(true);
      } else {
        resolve(false);
      }
    }, 300);
  });
};

/**
 * Get export jobs
 */
export const getExportJobs = async (): Promise<ExportJob[]> => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(exportJobs);
    }, 300);
  });
};

/**
 * Create a new export job
 */
export const createExportJob = async (exportJob: Partial<ExportJob> & { format: ExportFormat }): Promise<ExportJob> => {
  return new Promise(resolve => {
    setTimeout(() => {
      const newExportJob: ExportJob = {
        id: `export-${Date.now()}`,
        name: exportJob.name || 'New Export',
        status: 'pending',
        format: exportJob.format,
        createdAt: new Date().toISOString(),
        reportId: exportJob.reportId,
        dataRange: exportJob.dataRange,
        exportOptions: exportJob.exportOptions || {
          includeSummary: true,
          includeCharts: true,
          includeRawData: true,
          theme: 'default',
          orientation: 'portrait',
          paperSize: 'a4',
          includeTimestamp: true
        },
        scheduledSendTo: exportJob.scheduledSendTo
      };
      
      exportJobs.push(newExportJob);
      
      // Simulate processing
      setTimeout(() => {
        const index = exportJobs.findIndex(j => j.id === newExportJob.id);
        if (index !== -1) {
          exportJobs[index].status = 'processing';
          
          // Simulate completion after some time
          setTimeout(() => {
            const finalIndex = exportJobs.findIndex(j => j.id === newExportJob.id);
            if (finalIndex !== -1) {
              // 80% chance of success
              if (Math.random() < 0.8) {
                exportJobs[finalIndex].status = 'completed';
                exportJobs[finalIndex].completedAt = new Date().toISOString();
                exportJobs[finalIndex].downloadUrl = `/exports/${newExportJob.id}.${newExportJob.format}`;
                exportJobs[finalIndex].fileSize = Math.floor(500000 + Math.random() * 1500000); // Random file size
              } else {
                exportJobs[finalIndex].status = 'failed';
              }
            }
          }, 5000 + Math.random() * 5000); // Random time between 5-10 seconds
        }
      }, 1000 + Math.random() * 1000); // Random time between 1-2 seconds
      
      resolve(newExportJob);
    }, 300);
  });
};

/**
 * Schedule a report to be exported and sent periodically
 */
export const scheduleReportExport = async (
  reportId: string, 
  schedule: ReportSchedule, 
  exportFormat: ExportFormat,
  exportOptions?: ReportExportOptions
): Promise<boolean> => {
  return new Promise(resolve => {
    setTimeout(() => {
      // Find the report
      const report = customReports.find(r => r.id === reportId);
      if (!report) {
        resolve(false);
        return;
      }
      
      // Update the report with the schedule
      const reportIndex = customReports.findIndex(r => r.id === reportId);
      if (reportIndex !== -1) {
        customReports[reportIndex].schedule = schedule;
        customReports[reportIndex].updatedAt = new Date().toISOString();
        
        // Create initial export job
        createExportJob({
          name: `Scheduled: ${report.name}`,
          format: exportFormat,
          reportId: reportId,
          dataRange: report.dateRange,
          exportOptions,
          scheduledSendTo: schedule.recipients
        });
        
        resolve(true);
      } else {
        resolve(false);
      }
    }, 300);
  });
};

/**
 * Get available dimensions
 */
export const getAvailableDimensions = async (): Promise<AnalyticsDimension[]> => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(dimensions);
    }, 300);
  });
};

/**
 * Get available metrics
 */
export const getAvailableMetrics = async (): Promise<AnalyticsMetric[]> => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(metrics);
    }, 300);
  });
};

/**
 * Helper function to create an empty campaign
 */
const createEmptyCampaign = (): Partial<MarketingCampaign> => {
  return {
    name: 'New Campaign',
    status: 'draft',
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 30 * 86400000).toISOString(), // 30 days from now
    budget: 0,
    spent: 0,
    impressions: 0,
    clicks: 0,
    conversions: 0,
    revenue: 0,
    roas: 0,
    ctr: 0,
    cvr: 0,
    cpa: 0
  };
}; 