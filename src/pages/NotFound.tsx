
import { Link } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { Button } from '@/components/ui/button';

const NotFound = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-16 min-h-[60vh] flex items-center justify-center">
        <div className="max-w-md w-full text-center">
          <h1 className="text-6xl font-bold text-brand-teal mb-4">404</h1>
          <h2 className="text-2xl font-semibold mb-4">Page Not Found</h2>
          <p className="text-gray-600 mb-8">
            The page you are looking for doesn't exist or has been moved.
          </p>
          <div className="flex justify-center space-x-4">
            <Link to="/">
              <Button className="bg-brand-teal hover:bg-brand-dark">
                Back to Home
              </Button>
            </Link>
            <Link to="/products">
              <Button variant="outline">
                Browse Products
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default NotFound;
