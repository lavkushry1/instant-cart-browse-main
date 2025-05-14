export interface AnalyticsData {
  id: string;
  date: string;
  source: DataSource;
  metrics: MetricsData;
}

export interface CustomerInsight {
  id: string;
  customerSegment: string;
  description: string;
  value: number;
  previousValue: number;
  changePercentage: number;
  period: string;
  trend: TrendData[];
}

export interface MarketingCampaign {
  id: string;
  name: string;
  status: CampaignStatus;
  startDate: string;
  endDate: string;
  budget: number;
  spent: number;
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
  roas: number; // Return on Ad Spend
  ctr: number; // Click-through Rate
  cvr: number; // Conversion Rate
  cpa: number; // Cost per Acquisition
}

export interface CustomReport {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  schedule?: ReportSchedule;
  metrics: string[];
  dimensions: string[];
  filters: ReportFilter[];
  dateRange: DateRange;
  visualizationType: VisualizationType;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

export interface ReportFilter {
  dimension: string;
  operator: FilterOperator;
  value: string | number | boolean | string[] | number[];
}

export interface ExportJob {
  id: string;
  name: string;
  status: ExportStatus;
  format: ExportFormat;
  createdAt: string;
  completedAt?: string;
  downloadUrl?: string;
  fileSize?: number;
  reportId?: string;
  dataRange?: DateRange;
  exportOptions?: ReportExportOptions;
  scheduledSendTo?: string[];
}

// Supporting types
export type DataSource = 
  | 'storefront' 
  | 'admin' 
  | 'marketing' 
  | 'integration' 
  | 'custom';

export interface ReportExportOptions {
  includeSummary: boolean;
  includeCharts: boolean;
  includeRawData: boolean;
  chartType?: VisualizationType;
  dateFormat?: string;
  paperSize?: 'letter' | 'a4' | 'legal';
  orientation?: 'portrait' | 'landscape';
  theme?: 'default' | 'dark' | 'minimal' | 'branded';
  customHeaderLogo?: boolean;
  includeTimestamp?: boolean;
}

export interface MetricsData {
  views: number;
  visitors: number;
  orders: number;
  revenue: number;
  conversionRate: number;
  averageOrderValue: number;
  [key: string]: number | string | boolean;
}

export interface TrendData {
  date: string;
  value: number;
}

export type CampaignStatus = 
  | 'active' 
  | 'paused' 
  | 'completed' 
  | 'scheduled' 
  | 'draft';

export type ReportSchedule = {
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  time?: string; // For daily
  dayOfWeek?: number; // 0-6 for weekly (Sunday-Saturday)
  dayOfMonth?: number; // 1-31 for monthly
  recipients: string[]; // email addresses
  active: boolean;
  lastSent?: string;
};

export type FilterOperator = 
  | 'equals' 
  | 'not_equals' 
  | 'contains' 
  | 'not_contains' 
  | 'starts_with' 
  | 'ends_with' 
  | 'greater_than' 
  | 'less_than' 
  | 'in' 
  | 'not_in';

export interface DateRange {
  startDate: string | Date;
  endDate: string | Date;
  isCustom?: boolean;
  preset?: 'today' | 'yesterday' | 'last_7_days' | 'last_30_days' | 'this_month' | 'last_month' | 'this_year';
}

export type VisualizationType = 
  | 'table' 
  | 'line_chart' 
  | 'bar_chart' 
  | 'pie_chart' 
  | 'area_chart' 
  | 'funnel' 
  | 'heatmap'
  | 'scatter_plot'
  | 'pivot_table';

export type ExportStatus = 
  | 'pending' 
  | 'processing' 
  | 'completed' 
  | 'failed';

export type ExportFormat = 
  | 'csv' 
  | 'xlsx' 
  | 'json' 
  | 'pdf';

export interface AnalyticsDimension {
  id: string;
  name: string;
  description: string;
  category: string;
  dataType: 'string' | 'number' | 'boolean' | 'date';
}

export interface AnalyticsMetric {
  id: string;
  name: string;
  description: string;
  category: string;
  aggregation: 'sum' | 'avg' | 'min' | 'max' | 'count' | 'count_distinct';
  formula?: string;
}

export interface DashboardLayout {
  id: string;
  name: string;
  description?: string;
  isDefault: boolean;
  widgets: DashboardWidget[];
  createdAt: string;
  updatedAt: string;
}

export interface DashboardWidget {
  id: string;
  type: WidgetType;
  title: string;
  size: 'small' | 'medium' | 'large' | 'wide' | 'tall' | 'full';
  position: {
    x: number;
    y: number;
  };
  reportId?: string;
  customConfig?: Record<string, any>;
}

export type WidgetType = 
  | 'metric_card' 
  | 'chart' 
  | 'table' 
  | 'kpi' 
  | 'map' 
  | 'funnel' 
  | 'heat_map'
  | 'custom'; 