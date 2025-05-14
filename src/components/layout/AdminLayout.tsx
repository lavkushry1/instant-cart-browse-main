import { ReactNode, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { 
  LayoutGrid, 
  Package, 
  ShoppingCart, 
  Users, 
  Settings, 
  BarChart, 
  Globe, 
  PaintBucket,
  LogOut,
  Code,
  LineChart,
  Banknote
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

interface AdminLayoutProps {
  children: ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  // Check if user is authenticated, if not redirect to login
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { name: 'Dashboard', icon: <LayoutGrid className="h-5 w-5" />, path: '/admin' },
    { name: 'Products', icon: <Package className="h-5 w-5" />, path: '/admin/products' },
    { name: 'Orders', icon: <ShoppingCart className="h-5 w-5" />, path: '/admin/orders' },
    { name: 'Customers', icon: <Users className="h-5 w-5" />, path: '/admin/customers' },
    { name: 'Analytics', icon: <BarChart className="h-5 w-5" />, path: '/admin/analytics' },
    { name: 'Advanced Analytics', icon: <LineChart className="h-5 w-5" />, path: '/admin/advanced-analytics' },
    { name: 'Currency', icon: <Banknote className="h-5 w-5" />, path: '/admin/currency' },
    { name: 'SEO', icon: <Globe className="h-5 w-5" />, path: '/admin/seo' },
    { name: 'Theme', icon: <PaintBucket className="h-5 w-5" />, path: '/admin/theme' },
    { name: 'Tracking', icon: <Code className="h-5 w-5" />, path: '/admin/tracking' },
    { name: 'Settings', icon: <Settings className="h-5 w-5" />, path: '/admin/settings' },
  ];

  // If user is not authenticated, show loading or nothing
  if (!user) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r">
        <div className="p-6 border-b">
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold">InstantCart</span>
            <span className="bg-primary text-white text-xs px-2 py-1 rounded">Admin</span>
          </Link>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center space-x-3 px-3 py-2 rounded-md hover:bg-gray-100 ${
                location.pathname === item.path ? 'bg-gray-100 text-primary' : 'text-gray-700'
              }`}
            >
              {item.icon}
              <span>{item.name}</span>
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t">
          <Button variant="outline" className="w-full justify-start" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1">
        {/* Header */}
        <header className="bg-white border-b sticky top-0 z-10">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center md:hidden">
              <Link to="/" className="text-xl font-bold">InstantCart</Link>
            </div>
            <div className="flex items-center space-x-2 ml-auto">
              <span className="text-sm font-medium hidden sm:inline-block">
                {user.name}
              </span>
              <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
                View Store
              </Button>
            </div>
          </div>
        </header>

        {/* Content */}
        <main>
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout; 