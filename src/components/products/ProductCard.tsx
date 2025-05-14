import { Link } from 'react-router-dom';
import { Product } from '@/types/product';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Star, Heart } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';
import { CurrencyPrice } from '@/components/currency/CurrencyPrice';
import { useCart } from '@/hooks/useCart';

interface ProductCardProps {
  product: Product;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const { id, name, price, images, stock, discount } = product;
  const image = images && images.length > 0 ? images[0] : ''; // Use the first image from the array
  const rating = 4.5; // Default rating since it's not in the Product type
  const inStock = stock > 0; // Determine inStock from stock count
  
  const [isHovered, setIsHovered] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const { addToCart } = useCart();
  
  const handleAddToCart = () => {
    setIsAddingToCart(true);
    // Simulate a small delay to show loading state
    setTimeout(() => {
      addToCart(product, 1);
      toast.success(`${name} added to cart!`);
      setIsAddingToCart(false);
    }, 600);
  };
  
  const discountedPrice = discount ? price * (1 - discount / 100) : price;
  
  return (
    <div 
      className="product-card bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link to={`/product/${id}`} className="block">
        <div className="relative h-64 overflow-hidden">
          <img 
            src={image} 
            alt={name}
            className={`w-full h-full object-cover transition-transform duration-500 ${isHovered ? 'scale-110' : 'scale-100'}`}
          />
          
          {discount && (
            <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded-md text-sm font-medium">
              {discount}% OFF
            </div>
          )}

          {!inStock && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <span className="text-white font-semibold px-4 py-2 bg-black bg-opacity-70 rounded">
                Out of Stock
              </span>
            </div>
          )}
          
          <button 
            className="absolute top-2 right-2 bg-white bg-opacity-80 rounded-full p-1.5 hover:bg-opacity-100"
            aria-label="Add to wishlist"
          >
            <Heart className="w-4 h-4 text-gray-600" />
          </button>
        </div>
        
        <div className="p-4">
          <h3 className="font-medium text-lg mb-1 truncate">{name}</h3>
          
          <div className="flex items-center mb-2">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${
                    i < Math.floor(rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
                  }`}
                />
              ))}
              <span className="ml-1 text-sm text-gray-500">({rating})</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-2">
            <div>
              {discount ? (
                <div className="flex items-center">
                  <span className="text-lg font-semibold">
                    <CurrencyPrice amount={discountedPrice} />
                  </span>
                  <span className="ml-2 text-sm text-gray-400 line-through">
                    <CurrencyPrice amount={price} />
                  </span>
                </div>
              ) : (
                <span className="text-lg font-semibold">
                  <CurrencyPrice amount={price} />
                </span>
              )}
            </div>
          </div>
          
          {inStock && (
            <div className="mt-2">
              <div className="h-1.5 w-full bg-gray-200 rounded-full">
                <div 
                  className="h-1.5 rounded-full bg-green-500"
                  style={{width: `${Math.min(85, Math.random() * 100)}%`}}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">In stock</p>
            </div>
          )}
        </div>
      </Link>
      
      <div className="px-4 pb-4">
        <Button
          onClick={handleAddToCart}
          className="w-full bg-brand-teal hover:bg-brand-dark text-white transition-all"
          disabled={!inStock || isAddingToCart}
        >
          {isAddingToCart ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Adding...
            </span>
          ) : (
            <>
              <ShoppingCart className="mr-2 h-4 w-4" />
              {inStock ? 'Add to Cart' : 'Out of Stock'}
            </>
          )}
        </Button>
      </div>
      
      {/* Trust badges */}
      <div className="px-4 py-2 bg-gray-50 flex justify-between items-center text-xs text-gray-500 border-t">
        <span>Free delivery</span>
        <span>Secure payment</span>
      </div>
    </div>
  );
};

export default ProductCard;
