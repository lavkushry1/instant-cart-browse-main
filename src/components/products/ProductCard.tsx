import React, { useState, useEffect } from 'react';
import { useOffers } from '../../contexts/useOfferHook';
import { useAuth } from '../../hooks/useAuth';
import { useCart } from '../../hooks/useCart';
import { Heart, Star, ShoppingCart } from 'lucide-react';
import { Product } from '../../types/product';
import { 
  getGuestWishlist, 
  addToGuestWishlist, 
  removeFromGuestWishlist, 
  isProductInGuestWishlist 
} from '../../lib/localStorageUtils';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface ProductCardProps {
  product: Product;
  withRating?: boolean;
  withActions?: boolean;
}

// Extended product type with additional optional properties we might handle
interface ExtendedProductInfo {
  rating?: { average: number; count: number };
  brand?: string;
  options?: string[];
}

const ProductCard = ({ 
  product, 
  withRating = true, 
  withActions = true 
}: ProductCardProps) => {
  const { getApplicableOfferForProduct, isLoadingOffers } = useOffers();
  const { 
    isAuthenticated, 
    addToWishlist, 
    removeFromWishlist, 
    isProductInWishlist,
  } = useAuth();
  const { addToCart } = useCart();

  // Destructure product properties for easier use
  const { id, images, name, price, stock, category } = product;
  const imageUrl = images && images.length > 0 ? images[0] : '/placeholder.svg';
  const outOfStock = stock <= 0;

  // Local state for guest wishlist status
  const [isInGuestWishlistLocal, setIsInGuestWishlistLocal] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setIsInGuestWishlistLocal(isProductInGuestWishlist(id));
    }
  }, [isAuthenticated, id]);

  // Get offer details for this product
  const { finalPrice, appliedOffer } = getApplicableOfferForProduct({
    id,
    price,
    categoryId: category,
  });

  const displayPrice = finalPrice;
  const originalPriceToShow = price;

  // Determine if an offer-based discount is applied
  const hasActiveOffer = appliedOffer && finalPrice < price;
  let offerDiscountPercent = 0;
  if (hasActiveOffer && appliedOffer?.discountPercent) {
    offerDiscountPercent = appliedOffer.discountPercent;
  } else if (hasActiveOffer && appliedOffer?.discountAmount) {
    offerDiscountPercent = Math.round(((price - finalPrice) / price) * 100);
  }

  const isWishlistedCurrent = isAuthenticated ? isProductInWishlist(id) : isInGuestWishlistLocal;

  const [isHovered, setIsHovered] = useState(false);
  
  // Mock rating data - in a real app, this would come from the API
  const rating = { 
    average: Math.floor(Math.random() * 5) + 1, 
    count: Math.floor(Math.random() * 5000) + 100 
  };
  
  // In a real app, these would come from the backend
  const productExtras: ExtendedProductInfo = {
    brand: product.category, // Using category as brand for demo
    options: product.tags, // Using tags as options for demo
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isAuthenticated) {
      if (isProductInWishlist(id)) {
        removeFromWishlist(id);
      } else {
        addToWishlist(id);
      }
    } else {
      // Guest wishlist logic
      if (isInGuestWishlistLocal) {
        removeFromGuestWishlist(id);
        setIsInGuestWishlistLocal(false);
      } else {
        addToGuestWishlist(id);
        setIsInGuestWishlistLocal(true);
      }
    }
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product);
  };

  return (
    <Link 
      to={`/product/${id}`} 
      className="block bg-white rounded-sm border border-flipkart-gray-border hover:shadow-flipkart-card transition-shadow duration-300 h-full relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Wishlist button */}
      <button
        onClick={handleToggleWishlist}
        className={`absolute top-2 right-2 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
          isWishlistedCurrent ? 'bg-flipkart-blue text-white' : 'bg-white text-gray-400 hover:bg-gray-100'
        }`}
        aria-label={isWishlistedCurrent ? "Remove from wishlist" : "Add to wishlist"}
      >
        <Heart className={`h-4 w-4 ${isWishlistedCurrent ? 'fill-white' : ''}`} />
      </button>

      {/* Product Image */}
      <div className="relative pt-[100%] overflow-hidden">
        <img
          src={imageUrl}
          alt={name}
          className="absolute top-0 left-0 w-full h-full object-contain p-4"
          loading="lazy"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = "/placeholder.svg";
          }}
        />
      </div>

      {/* Product Details */}
      <div className="p-3 border-t border-flipkart-gray-border">
        {/* Brand */}
        {productExtras.brand && (
          <p className="text-flipkart-gray-secondary-text text-xs mb-1">{productExtras.brand}</p>
        )}
        
        {/* Title */}
        <h3 className="text-flipkart-body text-flipkart-gray-primary-text font-normal line-clamp-2 mb-1 h-[40px]">
          {name}
        </h3>
        
        {/* Rating */}
        {withRating && rating && (
          <div className="flex items-center mb-1">
            <div className="bg-flipkart-green text-white text-xs px-1.5 py-0.5 flex items-center rounded">
              {rating.average}
              <svg className="w-2.5 h-2.5 ml-0.5" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 9.121L2.292 11 3 7.02 0 4.202l4.146-.581L6 0l1.854 3.621 4.146.58-3 2.82L9.708 11z" fill="currentColor" />
              </svg>
            </div>
            <span className="text-flipkart-gray-secondary-text text-xs ml-1">({rating.count})</span>
            {product.featured === 1 && (
              <img 
                src="/flipkart-assured.png" 
                alt="Flipkart Assured" 
                className="h-4 ml-2"
              />
            )}
          </div>
        )}
        
        {/* Price */}
        <div className="flex items-center flex-wrap">
          <span className="text-flipkart-price-discounted mr-2">₹{displayPrice.toLocaleString()}</span>
          {originalPriceToShow > displayPrice && (
            <span className="text-flipkart-price-original line-through text-flipkart-gray-secondary-text mr-2">
              ₹{originalPriceToShow.toLocaleString()}
            </span>
          )}
          {product.discount > 0 && (
            <span className="text-flipkart-green text-xs font-medium">
              {product.discount}% off
            </span>
          )}
        </div>
        
        {/* Free shipping */}
        {stock > 0 && (
          <p className="text-flipkart-gray-secondary-text text-xs mt-1">Free delivery</p>
        )}
        
        {/* Out of stock */}
        {outOfStock && (
          <p className="text-flipkart-red text-xs font-medium mt-1">Out of stock</p>
        )}
      </div>
      
      {/* Quick view on hover */}
      {isHovered && withActions && (
        <div className="absolute inset-x-0 bottom-0 bg-flipkart-blue text-white flex items-center justify-center py-2 text-sm font-medium">
          <button 
            onClick={handleAddToCart}
            disabled={outOfStock}
            className="flex items-center justify-center w-full disabled:opacity-50"
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            {outOfStock ? "Out of Stock" : "Add to Cart"}
          </button>
        </div>
      )}
    </Link>
  );
};

export default ProductCard;
export { ProductCard };
