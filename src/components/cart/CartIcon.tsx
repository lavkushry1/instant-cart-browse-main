import React from 'react';
// Assuming an icon, e.g., from react-icons:
// import { FiShoppingCart } from 'react-icons/fi';

interface CartIconProps {
  itemCount: number;
  onClick?: () => void;
}

const CartIcon: React.FC<CartIconProps> = ({ itemCount, onClick }) => {
  return (
    <button 
      onClick={onClick}
      className="relative flex items-center justify-center p-2 rounded-full text-gray-600 hover:text-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-150 ease-in-out"
      aria-label={`Cart with ${itemCount} items`}
    >
      {/* Replace with actual SVG icon or icon component */}
      <span className="text-2xl">🛒</span> 
      {itemCount > 0 && (
        <span className="absolute top-0 right-0 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full transform translate-x-1/2 -translate-y-1/2">
          {itemCount > 9 ? '9+' : itemCount}
        </span>
      )}
    </button>
  );
};

export default CartIcon;
