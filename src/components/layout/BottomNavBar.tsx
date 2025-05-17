import React from 'react';
// Assuming you have an icon library or SVG icons
// For example, using react-icons, you might import:
// import { FiHome, FiGrid, FiShoppingCart, FiUser } from 'react-icons/fi';
import { useCart } from '@/hooks/useCart'; // Import useCart
import CartIcon from '../cart/CartIcon'; // Import CartIcon

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode; // Placeholder for icon component
  path: string;
}

// const navItems: NavItem[] = [ // Comment out or remove original static navItems
//   { id: 'home', label: 'Home', icon: <span className="text-2xl">🏠</span>, path: '/' },
//   { id: 'categories', label: 'Categories', icon: <span className="text-2xl">📚</span>, path: '/categories' },
//   { id: 'cart', label: 'Cart', icon: <span className="text-2xl">🛒</span>, path: '/cart' },
//   { id: 'profile', label: 'Profile', icon: <span className="text-2xl">👤</span>, path: '/account' },
// ];

interface BottomNavBarProps {
  activePath?: string;
  onNavigate?: (path: string) => void; // Optional: For client-side routing without page reload
}

const BottomNavBar: React.FC<BottomNavBarProps> = ({ activePath, onNavigate }) => {
  const { getCartTotals } = useCart();
  const { itemsCount } = getCartTotals();

  // In a real app, you'd use a routing library (like React Router) to get the current path.
  const currentPath = activePath || (typeof window !== 'undefined' ? window.location.pathname : '/');

  const handleNav = (path: string) => {
    if (onNavigate) {
      onNavigate(path);
    } else {
      // Fallback to standard navigation if onNavigate is not provided
      window.location.href = path;
    }
  };

  // Define navItems inside the component so it can access itemsCount
  const navItems: NavItem[] = [
    { id: 'home', label: 'Home', icon: <span className="text-2xl">🏠</span>, path: '/' },
    { id: 'categories', label: 'Categories', icon: <span className="text-2xl">📚</span>, path: '/categories' },
    { id: 'cart', label: 'Cart', icon: <CartIcon itemCount={itemsCount} />, path: '/cart' }, // Use CartIcon here
    { id: 'profile', label: 'Profile', icon: <span className="text-2xl">👤</span>, path: '/account' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white shadow-t-md border-t border-gray-200 md:hidden z-50">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleNav(item.path)}
            className={`flex flex-col items-center justify-center p-2 rounded-lg focus:outline-none transition-colors duration-150 ease-in-out 
                        ${currentPath === item.path ? 'text-blue-600' : 'text-gray-500 hover:text-blue-500'}`}
          >
            {item.icon}
            <span className={`text-xs mt-1 ${currentPath === item.path ? 'font-semibold' : ''}`}>
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </nav>
  );
};

export default BottomNavBar;
