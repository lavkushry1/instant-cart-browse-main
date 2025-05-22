import { Link, useLocation } from 'react-router-dom';
import { Home, Search, ShoppingCart, Heart, User, Menu, Tag, Package } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';

const MobileFooterNav = () => {
  const location = useLocation();
  const { cart } = useCart();
  const { user } = useAuth();
  
  // Get cart item count
  const cartItemCount = cart.reduce((total, item) => total + item.quantity, 0);
  
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t z-40">
      <div className="flex justify-around py-1">
        <Link to="/" className="flex flex-col items-center p-2">
          <Home size={18} className={location.pathname === '/' ? 'text-flipkart-blue' : 'text-gray-500'} strokeWidth={1.5} />
          <span className="text-[10px] mt-1">Home</span>
        </Link>
        
        <Link to="/category/all" className="flex flex-col items-center p-2">
          <Menu size={18} className={location.pathname.includes('/category') ? 'text-flipkart-blue' : 'text-gray-500'} strokeWidth={1.5} />
          <span className="text-[10px] mt-1">Categories</span>
        </Link>
        
        <Link to="/deals" className="flex flex-col items-center p-2">
          <Tag size={18} className={location.pathname === '/deals' ? 'text-flipkart-blue' : 'text-gray-500'} strokeWidth={1.5} />
          <span className="text-[10px] mt-1">Offers</span>
        </Link>
        
        <Link to="/cart" className="flex flex-col items-center p-2 relative">
          <ShoppingCart size={18} className={location.pathname === '/cart' ? 'text-flipkart-blue' : 'text-gray-500'} strokeWidth={1.5} />
          {cartItemCount > 0 && (
            <span className="absolute -top-1 right-0 bg-red-500 text-white text-[9px] rounded-full w-4 h-4 flex items-center justify-center">
              {cartItemCount}
            </span>
          )}
          <span className="text-[10px] mt-1">Cart</span>
        </Link>
        
        {user ? (
          <Link to="/account" className="flex flex-col items-center p-2">
            <User size={18} className={location.pathname.includes('/account') ? 'text-flipkart-blue' : 'text-gray-500'} strokeWidth={1.5} />
            <span className="text-[10px] mt-1">Account</span>
          </Link>
        ) : (
          <Link to="/login" className="flex flex-col items-center p-2">
            <User size={18} className={location.pathname === '/login' ? 'text-flipkart-blue' : 'text-gray-500'} strokeWidth={1.5} />
            <span className="text-[10px] mt-1">Login</span>
          </Link>
        )}
      </div>
    </div>
  );
};

export default MobileFooterNav; 