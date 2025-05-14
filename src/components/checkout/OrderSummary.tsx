import React, { useState } from 'react'; // React import was missing
import { Product } from '../../types'; // Assuming CartItem type might come from props or a global type
import { Offer as OfferType } from '../../services/offerService'; // Import OfferType
import { Button } from '@/components/ui/button';
import { Check, ChevronUp, ChevronDown, Tag } from "lucide-react"; // Added Tag icon

// Define a more specific CartItem type if it's consistent with what CheckoutOrderSummaryWrapper provides
interface DisplayCartItem {
  id: number | string;
  name: string;
  price: number; // This should be the original price per unit for display consistency
  image: string;
  quantity: number;
  // If individual item discounts are to be shown, add relevant fields here:
  // discountedPrice?: number;
  // originalItemTotal?: number;
  // finalItemTotal?: number;
}

interface OrderSummaryProps {
  cart: DisplayCartItem[];
  subtotal: number;       // Original subtotal before cart-wide discounts
  discount?: number;       // Total discount amount from offers
  shipping: number;
  tax: number;
  total: number;          // Final total AFTER offers, shipping, and tax
  appliedOffers?: OfferType[];
  showUpsells?: boolean;
}

const OrderSummary = ({ 
  cart,
  subtotal,
  discount = 0, // Default discount to 0
  shipping,
  tax,
  total, // This is the grand total including offers, shipping, tax
  appliedOffers,
  showUpsells = true
}: OrderSummaryProps) => {
  // Upsell products - in a real app, these would come from an API based on cart contents
  const [upsellProducts] = useState<(Product & { free?: boolean })[]>([
    {
      id: 101,
      name: "Free Sample Pack",
      price: 0,
      image: "/placeholder.svg",
      category: "samples",
      rating: 4.5,
      brand: "Brand Name",
      description: "Free samples with your purchase",
      inStock: true,
      free: true
    },
    {
      id: 102,
      name: "Premium Gift Wrapping",
      price: 99,
      image: "/placeholder.svg",
      category: "add-ons",
      rating: 4.8,
      brand: "Premium",
      description: "Luxury gift wrapping service",
      inStock: true,
      discount: 50 // This is a product-level discount for the upsell itself
    }
  ]);
  
  const [selectedUpsells, setSelectedUpsells] = useState<number[]>([101]); // Free item selected by default
  const [expanded, setExpanded] = useState(false); // For mobile view collapsible state
  
  const toggleUpsell = (productId: number) => {
    setSelectedUpsells(prev => {
      if (prev.includes(productId)) {
        return prev.filter(id => id !== productId);
      } else {
        return [...prev, productId];
      }
    });
  };
  
  const upsellTotalCost = upsellProducts
    .filter(product => selectedUpsells.includes(product.id) && !product.free)
    .reduce((sum, product) => {
      const price = product.discount 
        ? product.price * (1 - (product.discount || 0) / 100) 
        : product.price;
      return sum + price;
    }, 0);
  
  // The `total` prop already includes offer discounts, shipping, and tax.
  // We just need to add the upsell cost to this prop.
  const finalTotalWithUpsells = total + upsellTotalCost;
  
  return (
    <>
      <div className="md:hidden sticky top-0 z-20 bg-white border-b border-t py-3 px-4 mt-4">
        <div 
          className="flex justify-between items-center cursor-pointer"
          onClick={() => setExpanded(!expanded)}
        >
          <div>
            <h2 className="font-medium">Order Summary</h2>
            <p className="text-sm text-gray-500">{cart.length} {cart.length === 1 ? 'item' : 'items'}</p>
          </div>
          <div className="flex items-center">
            <span className="font-bold mr-2">₹{finalTotalWithUpsells.toFixed(2)}</span>
            {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>
        </div>
      </div>
    
      <div className={`bg-white p-4 md:p-6 rounded-lg shadow-sm md:sticky md:top-24 ${expanded ? 'block' : 'hidden md:block'}`}>
        <h2 className="text-lg font-bold mb-4 hidden md:block">Order Summary</h2>
        
        <div className="max-h-64 overflow-y-auto mb-4">
          {cart.map((item) => {
            // Assuming item.price is original price for display consistency. 
            // If CheckoutOrderSummaryWrapper passes discounted item prices, this needs adjustment.
            const itemDisplayTotal = item.price * item.quantity;
              
            return (
              <div key={item.id} className="flex py-3 border-b">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-gray-100 rounded flex-shrink-0">
                  <img src={item.image} alt={item.name} className="w-full h-full object-contain p-2" />
                </div>
                <div className="flex-1 ml-3 md:ml-4">
                  <div className="flex justify-between">
                    <p className="font-medium text-sm md:text-base line-clamp-1">{item.name}</p>
                    <p className="font-medium text-sm md:text-base">₹{itemDisplayTotal.toFixed(2)}</p>
                  </div>
                  <p className="text-xs md:text-sm text-gray-500">Qty: {item.quantity}</p>
                  {/* TODO: If item-specific discount needs to be shown, add logic here based on item props */}
                </div>
              </div>
            );
          })}
        </div>
        
        {showUpsells && upsellProducts.length > 0 && (
          <div className="mt-4 mb-6 border-t border-b py-4">
            <h3 className="font-medium text-sm md:text-base mb-3">Recommended Add-ons</h3>
            {upsellProducts.map((product) => {
              const isSelected = selectedUpsells.includes(product.id);
              const displayPrice = product.discount 
                ? product.price * (1 - (product.discount || 0) / 100)
                : product.price;
              return (
                <div key={product.id} className={`flex items-center p-2 md:p-3 mb-2 border rounded-lg cursor-pointer transition-colors ${isSelected ? 'border-brand-teal bg-brand-teal/5' : 'border-gray-200'}`} onClick={() => toggleUpsell(product.id)}>
                  <div className={`w-5 h-5 rounded-full mr-2 md:mr-3 flex items-center justify-center ${isSelected ? 'bg-brand-teal text-white' : 'border border-gray-300'}`}>{isSelected && <Check className="w-3 h-3" />}</div>
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-gray-100 rounded flex-shrink-0"><img src={product.image} alt={product.name} className="w-full h-full object-contain p-2"/></div>
                  <div className="flex-1 ml-2 md:ml-3">
                    <p className="font-medium text-xs md:text-sm">{product.name}</p>
                    <div className="flex items-center">
                      {product.free ? <span className="text-green-600 text-xs md:text-sm font-medium">FREE</span> : <><span className="text-xs md:text-sm font-medium">₹{displayPrice.toFixed(2)}</span>{product.discount && <span className="ml-2 text-xs text-gray-500 line-through">₹{product.price.toFixed(2)}</span>}</>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        <div className="space-y-3 text-xs md:text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Subtotal</span>
            <span>₹{subtotal.toFixed(2)}</span>
          </div>

          {discount > 0 && (
            <div className="flex justify-between text-green-600">
              <span className="flex items-center"><Tag className="h-3.5 w-3.5 mr-1"/> Promotions Applied</span>
              <span className="font-medium">- ₹{discount.toFixed(2)}</span>
            </div>
          )}

          <div className="flex justify-between">
            <span className="text-gray-600">Shipping</span>
            <span>{shipping > 0 ? `₹${shipping.toFixed(2)}` : 'FREE'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Tax (18% GST)</span> {/* Tax should be based on (subtotal - discount + shipping) or as per local regulations */}
            <span>₹{tax.toFixed(2)}</span>
          </div>
          {upsellTotalCost > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-600">Add-ons</span>
              <span>₹{upsellTotalCost.toFixed(2)}</span>
            </div>
          )}
        </div>
        
        <div className="border-t mt-4 pt-4">
          <div className="flex justify-between font-bold text-base md:text-lg mb-3">
            <span>Grand Total</span>
            <span>₹{finalTotalWithUpsells.toFixed(2)}</span>
          </div>
        </div>
        
        {appliedOffers && appliedOffers.length > 0 && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
                <h3 className="text-sm font-semibold text-green-700 mb-1 flex items-center">
                    <Tag className="h-4 w-4 mr-1.5"/> Applied Offers:
                </h3>
                <ul className="list-disc list-inside pl-1 text-xs text-green-600 space-y-0.5">
                    {appliedOffers.map(offer => <li key={offer.id}>{offer.name}</li>)}
                </ul>
            </div>
        )}
        
        <div className="flex flex-col md:flex-row md:justify-between md:items-center text-xs text-gray-500 mt-4 space-y-2 md:space-y-0">
          <div className="flex items-center"><span>🔒 Secure Checkout</span></div>
          <div className="flex"><span>🚚 Free shipping over ₹1000</span></div>
        </div>
      </div>
    </>
  );
};

export default OrderSummary;
