import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { 
  DollarSign, 
  Users, 
  ShoppingBag, 
  Package,
  TrendingUp, 
  TrendingDown, 
  AlertCircle,
  Clock,
  RefreshCw,
  ChevronRight,
  Activity,
  BarChart3
} from 'lucide-react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import AdminLayout from '@/components/layout/AdminLayout';
import { 
  getDashboardData, 
  TimePeriod, 
  DashboardDataClient,
  OrderStatusSummaryClient
} from '@/services/analyticsService';
import { formatDate } from '@/lib/utils';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

// Helper function to format currency
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(value);
};

// Helper function to format growth percentage
const formatGrowth = (value: number): string => {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
};

// Component for stats card
interface StatsCardProps {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
  trend: number;
  loading?: boolean;
}

const StatsCard = ({ title, value, description, icon, trend, loading = false }: StatsCardProps) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      {loading ? (
        <Skeleton className="h-8 w-[120px] mb-2" />
      ) : (
        <div className="text-2xl font-bold">{value}</div>
      )}
      <p className="text-xs text-muted-foreground">
        {loading ? (
          <Skeleton className="h-4 w-[180px]" />
        ) : (
          <span className="flex items-center gap-1">
            {trend > 0 ? (
              <TrendingUp className="h-3 w-3 text-green-500" />
            ) : trend < 0 ? (
              <TrendingDown className="h-3 w-3 text-red-500" />
            ) : (
              <span className="h-3 w-3" />
            )}
            <span className={trend > 0 ? 'text-green-500' : trend < 0 ? 'text-red-500' : ''}>
              {formatGrowth(trend)}
            </span>
            {' ' + description}
          </span>
        )}
      </p>
    </CardContent>
  </Card>
);

// Status badge for order statuses
const StatusBadge = ({ status, count }: { status: string; count: number }) => {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-indigo-100 text-indigo-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'returned':
        return 'bg-orange-100 text-orange-800';
      case 'refunded':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="flex justify-between items-center py-1">
      <Badge variant="outline" className={`${getStatusColor(status)}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
      <span className="font-medium">{count}</span>
    </div>
  );
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('month');
  const [dashboardData, setDashboardData] = useState<DashboardDataClient | null>(null);

  // Fetch dashboard data based on selected time period
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const data = await getDashboardData(timePeriod);
        setDashboardData(data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        toast.error('Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [timePeriod]);

  // Handle refresh
  const handleRefresh = async () => {
    try {
      setIsLoading(true);
      const data = await getDashboardData(timePeriod);
      setDashboardData(data);
      toast.success('Dashboard data refreshed');
    } catch (error) {
      console.error('Error refreshing dashboard data:', error);
      toast.error('Failed to refresh dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  // Configuration for sales over time chart
  const salesChartData = {
    labels: dashboardData?.salesOverTime.map(item => item.date) || [],
    datasets: [
      {
        label: 'Sales (₹)',
        data: dashboardData?.salesOverTime.map(item => item.sales) || [],
        borderColor: 'rgb(99, 102, 241)',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        fill: true,
        tension: 0.2,
      },
    ],
  };

  const salesChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value: number) => '₹' + value.toLocaleString(),
        },
      },
    },
  };

  // Configuration for orders over time chart
  const ordersChartData = {
    labels: dashboardData?.salesOverTime.map(item => item.date) || [],
    datasets: [
      {
        label: 'Orders',
        data: dashboardData?.salesOverTime.map(item => item.orders) || [],
        backgroundColor: 'rgb(99, 102, 241)',
        borderRadius: 4,
      },
    ],
  };

  const ordersChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0,
        },
      },
    },
  };

  // Configuration for sales by category chart
  const categoryChartData = {
    labels: dashboardData?.salesByCategory.map(item => item.category) || [],
    datasets: [
      {
        label: 'Sales by Category',
        data: dashboardData?.salesByCategory.map(item => item.sales) || [],
        backgroundColor: [
          'rgba(99, 102, 241, 0.8)',
          'rgba(79, 70, 229, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(147, 51, 234, 0.8)',
          'rgba(236, 72, 153, 0.8)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const categoryChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
      },
      tooltip: {
        callbacks: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          label: (context: any) => {
            const label = context.label || '';
            const value = context.raw || 0;
            return `${label}: ${formatCurrency(value)}`;
          },
        },
      },
    },
  };

  // Configuration for payment method chart
  const paymentChartData = {
    labels: dashboardData?.salesByPaymentMethod.map(item => item.method) || [],
    datasets: [
      {
        label: 'Sales by Payment Method',
        data: dashboardData?.salesByPaymentMethod.map(item => item.sales) || [],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)', // Blue
          'rgba(16, 185, 129, 0.8)', // Green
        ],
        borderWidth: 1,
      },
    ],
  };

  return (
    <AdminLayout>
      <div className="container py-10">
        <div className="flex flex-col space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
            <div className="flex items-center gap-4">
              <Tabs 
                value={timePeriod} 
                onValueChange={(value) => setTimePeriod(value as TimePeriod)}
                className="w-[400px]"
              >
                <TabsList className="grid grid-cols-5">
                  <TabsTrigger value="today">Today</TabsTrigger>
                  <TabsTrigger value="week">Week</TabsTrigger>
                  <TabsTrigger value="month">Month</TabsTrigger>
                  <TabsTrigger value="year">Year</TabsTrigger>
                  <TabsTrigger value="custom" disabled>Custom</TabsTrigger>
                </TabsList>
              </Tabs>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={handleRefresh}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>

          {/* Key metrics */}
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <StatsCard
              title="Total Sales"
              value={formatCurrency(dashboardData?.salesSummary.totalSales || 0)}
              description="Total sales in period"
              icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
              trend={0}
              loading={isLoading}
            />
            <StatsCard
              title="Total Orders"
              value={dashboardData?.salesSummary.totalOrders.toString() || '0'}
              description="Total orders in period"
              icon={<ShoppingBag className="h-4 w-4 text-muted-foreground" />}
              trend={0}
              loading={isLoading}
            />
            <StatsCard
              title="Average Order Value"
              value={formatCurrency(dashboardData?.salesSummary.averageOrderValue || 0)}
              description="Average value per order"
              icon={<Activity className="h-4 w-4 text-muted-foreground" />}
              trend={0}
              loading={isLoading}
            />
            <StatsCard
              title="Total Customers"
              value={dashboardData?.customerSummary.totalCustomers.toString() || '0'}
              description={`(${dashboardData?.customerSummary.newCustomers || 0} new in period)`}
              icon={<Users className="h-4 w-4 text-muted-foreground" />}
              trend={0}
              loading={isLoading}
            />
          </div>

          {/* Charts row */}
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
            {/* Sales over time chart */}
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Sales Trend</CardTitle>
                <CardDescription>
                  Sales performance over {timePeriod}
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                {isLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <Skeleton className="h-full w-full" />
                  </div>
                ) : (
                  <Line 
                    data={salesChartData} 
                    options={salesChartOptions}
                  />
                )}
              </CardContent>
            </Card>

            {/* Orders over time chart */}
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Order Count</CardTitle>
                <CardDescription>
                  Number of orders over {timePeriod}
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                {isLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <Skeleton className="h-full w-full" />
                  </div>
                ) : (
                  <Bar 
                    data={ordersChartData} 
                    options={ordersChartOptions}
                  />
                )}
              </CardContent>
            </Card>
          </div>

          {/* Third row */}
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
            {/* Order status summary */}
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Order Status</CardTitle>
                <CardDescription>
                  Current order status breakdown
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 7 }).map((_, i) => (
                      <Skeleton key={i} className="h-6 w-full" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {dashboardData && Object.entries(dashboardData.orderStatusSummary).map(([status, count]) => (
                      <StatusBadge key={status} status={status} count={count} />
                    ))}
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => navigate('/admin/orders')}
                >
                  View All Orders
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>

            {/* Sales by category */}
            <Card className="col-span-1 lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle>Sales by Category</CardTitle>
                  <CardDescription>
                    Distribution of sales across categories
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="h-[300px]">
                {isLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <Skeleton className="h-full w-full" />
                  </div>
                ) : (
                  <Doughnut 
                    data={categoryChartData} 
                    options={categoryChartOptions}
                  />
                )}
              </CardContent>
            </Card>
          </div>

          {/* Fourth row */}
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
            {/* Recent orders */}
            <Card className="col-span-1 lg:col-span-2">
              <CardHeader>
                <CardTitle>Recent Orders</CardTitle>
                <CardDescription>
                  Latest orders received
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {dashboardData?.recentOrders.map(order => (
                      <div key={order.id} className="flex justify-between items-center border-b pb-2">
                        <div>
                          <div className="font-medium">#{order.id}</div>
                          <div className="text-sm text-muted-foreground">{order.customerName}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{formatCurrency(order.total)}</div>
                          <div className="text-sm text-muted-foreground">{formatDate(order.createdAt)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => navigate('/admin/orders')}
                >
                  View All Orders
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>

            {/* Inventory status */}
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Inventory Status</CardTitle>
                <CardDescription>
                  Product stock summary
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="text-center p-6 bg-gray-50 rounded-md">
                      <div className="text-4xl font-bold">{dashboardData?.productSummary.totalProducts}</div>
                      <div className="text-sm text-muted-foreground mt-1">Total Products</div>
                    </div>
                    <div className="flex items-center justify-between border-b pb-2">
                      <div className="flex items-center">
                        <AlertCircle className="h-4 w-4 text-amber-500 mr-2" />
                        <span>Low Stock</span>
                      </div>
                      <Badge variant="outline" className="bg-amber-100 text-amber-800">
                        {dashboardData?.productSummary.lowStockProducts}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
                        <span>Out of Stock</span>
                      </div>
                      <Badge variant="outline" className="bg-red-100 text-red-800">
                        {dashboardData?.productSummary.outOfStockProducts}
                      </Badge>
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => navigate('/admin/products')}
                >
                  Manage Products
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard; 