import React, { useState, useEffect } from 'react';
import { useOffers } from '../../contexts/useOfferHook'; // Corrected import path
import { useAuth } from '../../hooks/useAuth'; // Added for wishlist
import { useCart } from '../../hooks/useCart'; // Import useCart
import { Heart } from 'lucide-react'; // Added for wishlist icon
import { Product } from '../../types/product'; // Import the full Product type
import { 
  getGuestWishlist, 
  addToGuestWishlist, 
  removeFromGuestWishlist, 
  isProductInGuestWishlist 
} from '../../lib/localStorageUtils'; // Import guest wishlist utils

export interface ProductCardProps {
  product: Product; // Use the full Product type
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { getApplicableOfferForProduct, isLoadingOffers } = useOffers();
  const { 
    isAuthenticated, 
    addToWishlist, 
    removeFromWishlist, 
    isProductInWishlist, 
    // wishlist // for direct check if needed, or rely on isProductInWishlist - Removed as isProductInWishlist is preferred
  } = useAuth(); // Added for wishlist
  const { addToCart } = useCart(); // Get addToCart from useCart

  // Destructure product properties for easier use
  const { id, images, name, price, stock, category } = product;
  const imageUrl = images && images.length > 0 ? images[0] : '/placeholder-image.jpg'; // Use first image or a placeholder
  const outOfStock = stock <= 0;

  // Local state for guest wishlist status
  const [isInGuestWishlistLocal, setIsInGuestWishlistLocal] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setIsInGuestWishlistLocal(isProductInGuestWishlist(id));
    }
  }, [isAuthenticated, id, isProductInGuestWishlist]); // Added isProductInGuestWishlist to dependencies

  // Get offer details for this product
  // The `product` object passed to `getApplicableOfferForProduct` must match its expected structure
  const { finalPrice, appliedOffer } = getApplicableOfferForProduct({
    id,
    price,
    categoryId: category, // Pass category as categoryId
    // Add other properties if your offer logic in OfferContext requires them
  });

  const displayPrice = finalPrice;
  const originalPriceToShow = price; // This is the base price before any *offers* are applied

  // Determine if an offer-based discount is applied
  const hasActiveOffer = appliedOffer && finalPrice < price;
  let offerDiscountPercent = 0;
  if (hasActiveOffer && appliedOffer?.discountPercent) {
    offerDiscountPercent = appliedOffer.discountPercent;
  } else if (hasActiveOffer && appliedOffer?.discountAmount) {
    // Calculate percentage if only amount is given for display consistency, or display amount directly
    offerDiscountPercent = Math.round(((price - finalPrice) / price) * 100);
  }

  if (isLoadingOffers) {
    // Optional: Render a skeleton or basic price display while offers are loading
    // For simplicity, we'll just show the base price, but you might want a loading indicator.
  }

  return (
    <div className="bg-white rounded-2xl shadow-md p-4 m-2 flex flex-col items-stretch max-w-xs hover:shadow-lg transition-shadow duration-150 relative">
      {/* Wishlist Button - Always shown, behavior depends on auth state */}
      <button 
        onClick={(e) => {
          e.stopPropagation(); // Prevent card click if any
          if (isAuthenticated) {
            isProductInWishlist(id) ? removeFromWishlist(id) : addToWishlist(id);
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
        }}
        className={`absolute top-2 right-2 z-10 p-1.5 rounded-full transition-colors duration-200 
                    ${(isAuthenticated ? isProductInWishlist(id) : isInGuestWishlistLocal) 
                      ? 'bg-red-100 hover:bg-red-200' 
                      : 'bg-gray-100 hover:bg-gray-200'}`}
        aria-label={(isAuthenticated ? isProductInWishlist(id) : isInGuestWishlistLocal) 
                      ? 'Remove from wishlist' 
                      : 'Add to wishlist'}
      >
        <Heart 
          className={`w-5 h-5 ${(isAuthenticated ? isProductInWishlist(id) : isInGuestWishlistLocal) 
                      ? 'text-red-500 fill-red-500' 
                      : 'text-gray-500'}`} 
        />
      </button>
      <div className="relative">
        <img 
          src={imageUrl} 
          alt={name} 
          className="w-full h-48 object-cover rounded-lg mb-3" 
          loading="lazy" 
        />
        {outOfStock && (
            <span className="absolute top-2 right-2 bg-gray-700 text-white text-xs font-semibold px-2 py-1 rounded">
                Out of Stock
            </span>
        )}
        {hasActiveOffer && !outOfStock && (
            <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-md">
                {appliedOffer?.discountPercent ? `${appliedOffer.discountPercent}% OFF` : (appliedOffer?.discountAmount ? `$${appliedOffer.discountAmount.toFixed(2)} OFF` : 'Special Offer')}
            </span>
        )}
      </div>
      
      <h3 className="text-md font-semibold text-gray-800 mb-1 text-center min-h-[40px]">{name}</h3>
      
      <div className="mt-auto"> {/* Pushes price and button to the bottom */} 
        <div className="flex items-baseline justify-center mb-2">
          <p className={`text-xl font-bold ${outOfStock ? 'text-gray-400' : 'text-blue-600'}`}>
            ${displayPrice.toFixed(2)}
          </p>
          {hasActiveOffer && !outOfStock && (
            <p className="text-sm text-gray-500 line-through ml-2">
              ${originalPriceToShow.toFixed(2)}
            </p>
          )}
        </div>

        {/* Optional: Display offer name or a generic discount message based on offerDiscountPercent */}
        {/* {hasActiveOffer && !outOfStock && offerDiscountPercent > 0 && (
          <p className="text-xs text-green-600 mb-2 text-center">{offerDiscountPercent}% off applied!</p>
        )} */}

        {!outOfStock ? (
          <button 
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-150 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75"
            aria-label={`Add ${name} to cart`}
            onClick={() => addToCart(product)}
          >
            Add to Cart
          </button>
        ) : (
          <button 
            className="w-full bg-gray-300 text-gray-500 font-semibold py-2 px-4 rounded-lg cursor-not-allowed"
            disabled
          >
            Out of Stock
          </button>
        )}
      </div>
    </div>
  );
};

export default ProductCard;
