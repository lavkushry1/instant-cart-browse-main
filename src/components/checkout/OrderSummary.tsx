import { useState } from 'react';
import { CartItem, Product } from '../../types';
import { Button } from '@/components/ui/button';
import { Check, ChevronUp, ChevronDown } from "lucide-react";

interface OrderSummaryProps {
  cart: CartItem[];
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  showUpsells?: boolean;
}

const OrderSummary = ({ 
  cart, 
  subtotal, 
  shipping, 
  tax, 
  total,
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
      discount: 50
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
  
  // Calculate additional cost from selected upsells
  const upsellTotal = upsellProducts
    .filter(product => selectedUpsells.includes(product.id) && !product.free)
    .reduce((sum, product) => {
      const price = product.discount 
        ? product.price * (1 - product.discount / 100) 
        : product.price;
      return sum + price;
    }, 0);
  
  const finalTotal = total + upsellTotal;
  
  return (
    <>
      {/* Mobile Order Summary Toggle */}
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
            <span className="font-bold mr-2">₹{finalTotal.toFixed(2)}</span>
            {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>
        </div>
      </div>
    
      {/* Full Order Summary */}
      <div className={`bg-white p-4 md:p-6 rounded-lg shadow-sm md:sticky md:top-24 ${expanded ? 'block' : 'hidden md:block'}`}>
        <h2 className="text-lg font-bold mb-4 hidden md:block">Order Summary</h2>
        
        <div className="max-h-64 overflow-y-auto mb-4">
          {cart.map((item) => {
            const itemPrice = item.discount 
              ? item.price * (1 - item.discount / 100)
              : item.price;
              
            return (
              <div key={item.id} className="flex py-3 border-b">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-gray-100 rounded flex-shrink-0">
                  <img 
                    src={item.image} 
                    alt={item.name}
                    className="w-full h-full object-contain p-2"
                  />
                </div>
                <div className="flex-1 ml-3 md:ml-4">
                  <div className="flex justify-between">
                    <p className="font-medium text-sm md:text-base line-clamp-1">{item.name}</p>
                    <p className="font-medium text-sm md:text-base">₹{(itemPrice * item.quantity).toFixed(2)}</p>
                  </div>
                  <p className="text-xs md:text-sm text-gray-500">Qty: {item.quantity}</p>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Upsell section */}
        {showUpsells && upsellProducts.length > 0 && (
          <div className="mt-4 mb-6 border-t border-b py-4">
            <h3 className="font-medium text-sm md:text-base mb-3">Recommended Add-ons</h3>
            
            {upsellProducts.map((product) => {
              const isSelected = selectedUpsells.includes(product.id);
              const displayPrice = product.discount 
                ? product.price * (1 - product.discount / 100)
                : product.price;
              
              return (
                <div 
                  key={product.id} 
                  className={`flex items-center p-2 md:p-3 mb-2 border rounded-lg cursor-pointer transition-colors ${
                    isSelected ? 'border-brand-teal bg-brand-teal/5' : 'border-gray-200'
                  }`}
                  onClick={() => toggleUpsell(product.id)}
                >
                  <div className={`w-5 h-5 rounded-full mr-2 md:mr-3 flex items-center justify-center ${
                    isSelected ? 'bg-brand-teal text-white' : 'border border-gray-300'
                  }`}>
                    {isSelected && <Check className="w-3 h-3" />}
                  </div>
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-gray-100 rounded flex-shrink-0">
                    <img 
                      src={product.image} 
                      alt={product.name}
                      className="w-full h-full object-contain p-2"
                    />
                  </div>
                  <div className="flex-1 ml-2 md:ml-3">
                    <p className="font-medium text-xs md:text-sm">{product.name}</p>
                    <div className="flex items-center">
                      {product.free ? (
                        <span className="text-green-600 text-xs md:text-sm font-medium">FREE</span>
                      ) : (
                        <>
                          <span className="text-xs md:text-sm font-medium">₹{displayPrice.toFixed(2)}</span>
                          {product.discount && (
                            <span className="ml-2 text-xs text-gray-500 line-through">
                              ₹{product.price.toFixed(2)}
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        {/* Price calculations */}
        <div className="space-y-3 text-xs md:text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Subtotal</span>
            <span>₹{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Shipping</span>
            <span>{shipping > 0 ? `₹${shipping.toFixed(2)}` : 'FREE'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Tax (18% GST)</span>
            <span>₹{tax.toFixed(2)}</span>
          </div>
          {upsellTotal > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-600">Add-ons</span>
              <span>₹{upsellTotal.toFixed(2)}</span>
            </div>
          )}
        </div>
        
        <div className="border-t border-b my-4 py-4">
          <div className="flex justify-between font-bold text-base md:text-lg">
            <span>Total</span>
            <span>₹{finalTotal.toFixed(2)}</span>
          </div>
        </div>
        
        {/* Trust badges */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center text-xs text-gray-500 mt-4 space-y-2 md:space-y-0">
          <div className="flex items-center">
            <span>🔒 Secure Checkout</span>
          </div>
          <div className="flex">
            <span>🚚 Free shipping over ₹1000</span>
          </div>
        </div>
      </div>
    </>
  );
};

export default OrderSummary;
