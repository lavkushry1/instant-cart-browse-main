import AdminLayout from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, BarChart, TrendingUp, DollarSign, ShoppingCart, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

const AdminAnalytics = () => {
  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Analytics</h1>
            <p className="text-gray-500 mt-1">
              Basic overview of your store's performance
            </p>
          </div>
          <Button asChild>
            <Link to="/admin/advanced-analytics">
              <LineChart className="h-4 w-4 mr-2" />
              Advanced Analytics
            </Link>
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <DollarSign className="h-5 w-5 text-green-500 mr-2" />
                <span className="text-2xl font-bold">$12,426</span>
                <span className="ml-2 text-sm text-green-500 flex items-center">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  12%
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Compared to last month</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <ShoppingCart className="h-5 w-5 text-blue-500 mr-2" />
                <span className="text-2xl font-bold">156</span>
                <span className="ml-2 text-sm text-green-500 flex items-center">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  8%
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Compared to last month</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                Conversion Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <BarChart className="h-5 w-5 text-purple-500 mr-2" />
                <span className="text-2xl font-bold">3.2%</span>
                <span className="ml-2 text-sm text-green-500 flex items-center">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  0.5%
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Compared to last month</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                New Customers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Users className="h-5 w-5 text-orange-500 mr-2" />
                <span className="text-2xl font-bold">78</span>
                <span className="ml-2 text-sm text-green-500 flex items-center">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  14%
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Compared to last month</p>
            </CardContent>
          </Card>
        </div>
        
        <div className="bg-gray-100 p-12 rounded-lg text-center">
          <LineChart className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-xl font-semibold mb-2">View Detailed Analytics</h2>
          <p className="text-gray-500 max-w-lg mx-auto mb-6">
            For more detailed analytics, custom reports, and advanced metrics, check out our advanced analytics dashboard.
          </p>
          <Button asChild>
            <Link to="/admin/advanced-analytics">
              Go to Advanced Analytics
            </Link>
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminAnalytics; 