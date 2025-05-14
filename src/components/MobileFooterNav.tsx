import { Link, useLocation } from 'react-router-dom';
import { Home, Search, ShoppingCart, Heart, User } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';

const MobileFooterNav = () => {
  const location = useLocation();
  const { cart } = useCart();
  const { user } = useAuth();
  
  // Get cart item count
  const cartItemCount = cart.reduce((total, item) => total + item.quantity, 0);
  
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t z-50">
      <div className="flex justify-around py-2">
        <Link to="/" className="flex flex-col items-center p-2">
          <Home size={20} className={location.pathname === '/' ? 'text-primary' : 'text-gray-500'} />
          <span className="text-xs mt-1">Home</span>
        </Link>
        
        <Link to="/search" className="flex flex-col items-center p-2">
          <Search size={20} className={location.pathname === '/search' ? 'text-primary' : 'text-gray-500'} />
          <span className="text-xs mt-1">Search</span>
        </Link>
        
        <Link to="/cart" className="flex flex-col items-center p-2 relative">
          <ShoppingCart size={20} className={location.pathname === '/cart' ? 'text-primary' : 'text-gray-500'} />
          {cartItemCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-primary text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
              {cartItemCount}
            </span>
          )}
          <span className="text-xs mt-1">Cart</span>
        </Link>
        
        <Link to="/wishlist" className="flex flex-col items-center p-2">
          <Heart size={20} className={location.pathname === '/wishlist' ? 'text-primary' : 'text-gray-500'} />
          <span className="text-xs mt-1">Wishlist</span>
        </Link>
        
        <Link to={user ? "/account" : "/login"} className="flex flex-col items-center p-2">
          <User size={20} className={location.pathname === '/account' || location.pathname === '/login' ? 'text-primary' : 'text-gray-500'} />
          <span className="text-xs mt-1">{user ? 'Account' : 'Login'}</span>
        </Link>
      </div>
    </div>
  );
};

export default MobileFooterNav; 