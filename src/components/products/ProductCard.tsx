import React from 'react';
import { useOffers } from '../../contexts/OfferContext'; // Adjusted path

export interface ProductCardProps {
  // Assuming ProductCard receives a product object that includes id, categoryId (optional)
  product: {
    id: string;
    imageUrl: string;
    title: string;
    price: number;
    outOfStock?: boolean;
    categoryId?: string; // Add categoryId if it's part of your product data and used in offers
    // originalDiscount?: number; // Keep or remove based on whether you want to show a base discount AND an offer
  };
  // Props like imageUrl, title, price, discount, outOfStock are now part of the product object
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { getApplicableOfferForProduct, isLoadingOffers } = useOffers();

  // Destructure product properties for easier use
  const { id, imageUrl, title, price, outOfStock, categoryId } = product;

  // Get offer details for this product
  // The `product` object passed to `getApplicableOfferForProduct` must match its expected structure
  const { finalPrice, appliedOffer } = getApplicableOfferForProduct({
    id,
    price,
    categoryId,
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
    <div className="bg-white rounded-2xl shadow-md p-4 m-2 flex flex-col items-stretch max-w-xs hover:shadow-lg transition-shadow duration-150">
      <div className="relative">
        <img 
          src={imageUrl} 
          alt={title} 
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
      
      <h3 className="text-md font-semibold text-gray-800 mb-1 text-center min-h-[40px]">{title}</h3>
      
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
            aria-label={`Add ${title} to cart`}
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
