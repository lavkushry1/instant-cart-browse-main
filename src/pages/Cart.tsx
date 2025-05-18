import React, { useState, useEffect, useMemo } from 'react'; // Added useMemo
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { useCart } from '@/hooks/useCart';
import { useOffers } from '@/contexts/useOfferHook'; // Changed import path
import { CartItem as ServiceCartItem } from '@/services/offerService'; // Import ServiceCartItem type
import SavedItems from '@/components/cart/SavedItems';
import { Button } from '@/components/ui/button';
import { 
  Trash, 
  Plus, 
  Minus, 
  ArrowRight, 
  Heart,
  ShoppingCart,
  RefreshCw,
  Tag // Icon for offers
} from 'lucide-react';

const Cart = () => {
  const navigate = useNavigate();
  const { 
    cart, 
    savedItems,
    removeFromCart, 
    updateQuantity, 
    saveForLater,
    moveSavedItemToCart,
    removeSavedItem,
    clearCart,
  } = useCart();

  const { calculateCartWithOffers, isLoadingOffers, errorOffers } = useOffers();

  // Transform cart items from useCart to the format expected by calculateCartWithOffers
  const serviceCartItems: ServiceCartItem[] = useMemo(() => cart.map(item => ({
    productId: item.product.id, // Assuming item.product.id is the product ID
    unitPrice: item.product.price, // Original unit price
    quantity: item.quantity,
    categoryId: item.product.category, // Assuming item.product.category is the category ID
  })), [cart]);

  // Calculate cart totals with offers applied
  const { 
    items: processedCartItems, 
    subTotal: offerAdjustedSubtotal, // This is the sum of original prices
    discount: totalDiscount, 
    total: offerAdjustedTotal,
    appliedOffers 
  } = useMemo(() => calculateCartWithOffers(serviceCartItems), [serviceCartItems, calculateCartWithOffers]);
  
  const itemsCount = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);

  // Shipping and tax calculation based on the subtotal *before* discount, or after, depending on business rules.
  // Here, let's assume it's based on the subtotal before general discounts (offerAdjustedSubtotal)
  const shipping = offerAdjustedSubtotal > 1000 ? 0 : 99;
  const taxRate = 0.18; // 18% GST
  // Tax can be calculated on (subtotal - discount) or just subtotal. Let's use (subtotal - discount).
  const taxableAmount = offerAdjustedSubtotal - totalDiscount;
  const tax = taxableAmount > 0 ? taxableAmount * taxRate : 0;
  const finalTotalWithTaxAndShipping = offerAdjustedTotal + shipping + tax;
  
  const handleUpdateQuantity = (itemId: string, newQuantity: number) => {
    updateQuantity(itemId, newQuantity);
  };
  
  const handleRemoveItem = (itemId: string) => {
    removeFromCart(itemId);
  };
  
  const handleSaveForLater = (itemId: string) => {
    const cartItem = cart.find(item => item.id === itemId);
    if (cartItem) {
      saveForLater(itemId, cartItem.product);
    } else {
      console.warn("Product not found in cart for saving later:", itemId);
    }
  };
  
  const handleMoveToCart = (itemId: string) => {
    moveSavedItemToCart(itemId);
  };
  
  const handleRemoveSaved = (itemId: string) => {
    removeSavedItem(itemId);
  };
  
  const handleClearCart = () => {
    clearCart();
  };
  
  const handleCheckout = () => {
    // Pass the offer-adjusted total and applied offers to checkout page if needed
    navigate('/checkout', { state: { finalTotal: finalTotalWithTaxAndShipping, appliedOffers } });
  };

  // Find the processed item details from calculateCartWithOffers result
  const getProcessedItemDetails = (cartItemId: string) => {
    // Assuming cart item ID from useCart hook matches productId in serviceCartItems
    // This mapping might need adjustment based on actual ID structures
    const originalCartItem = cart.find(ci => ci.id === cartItemId);
    if (!originalCartItem) return { displayPrice: 0, itemSubTotal: 0, originalItemPrice: 0 };

    const processedItem = processedCartItems.find(pci => pci.productId === originalCartItem.product.id);
    
    return {
        displayPrice: processedItem?.discountedPrice !== undefined ? processedItem.discountedPrice : originalCartItem.product.price,
        itemSubTotal: processedItem?.discountedPrice !== undefined ? processedItem.discountedPrice * originalCartItem.quantity : originalCartItem.product.price * originalCartItem.quantity,
        originalItemPrice: originalCartItem.product.price
    };
  };

  if (isLoadingOffers) {
    return <Layout><div className="container mx-auto px-4 py-8 min-h-screen text-center">Loading offers and cart...</div></Layout>;
  }
  if (errorOffers) {
    return <Layout><div className="container mx-auto px-4 py-8 min-h-screen text-center text-red-500">Error loading offers: {errorOffers}</div></Layout>;
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 min-h-screen">
        <h1 className="text-3xl font-bold mb-6">Shopping Cart</h1>
        
        {cart.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-8">
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="hidden md:grid grid-cols-12 gap-4 p-4 border-b border-gray-200 bg-gray-50 text-gray-600 font-medium">
                  <div className="col-span-6">Product</div>
                  <div className="col-span-2 text-center">Price</div>
                  <div className="col-span-2 text-center">Quantity</div>
                  <div className="col-span-2 text-center">Total</div>
                </div>
                
                {cart.map((item) => {
                  const { displayPrice, itemSubTotal, originalItemPrice } = getProcessedItemDetails(item.id);
                  const showOriginalPrice = displayPrice < originalItemPrice;
                  
                  return (
                    <div key={item.id} className="grid grid-cols-12 gap-4 p-4 border-b border-gray-200 items-center">
                      <div className="col-span-12 md:col-span-6 flex items-center">
                        <div className="w-20 h-20 flex-shrink-0 mr-4 bg-gray-100 rounded">
                          <img 
                            src={item.product.images[0]} 
                            alt={item.product.name}
                            className="w-full h-full object-contain p-2"
                          />
                        </div>
                        <div>
                          <Link to={`/product/${item.product.id}`} className="font-medium hover:text-brand-teal truncate mb-1 block">
                            {item.product.name}
                          </Link>
                          <p className="text-sm text-gray-500">
                            Category: {item.product.category}
                          </p>
                          <div className="flex mt-2 space-x-3">
                            <button onClick={() => handleSaveForLater(item.id)} className="text-gray-500 hover:text-brand-teal text-sm flex items-center" title="Save for later">
                              <Heart className="h-4 w-4 mr-1" /> Save for later
                            </button>
                            <button onClick={() => handleRemoveItem(item.id)} className="text-gray-400 hover:text-red-500 text-sm flex items-center md:hidden">
                              <Trash className="h-4 w-4 mr-1" /> Remove
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      <div className="col-span-4 md:col-span-2 text-center">
                        <div className="md:hidden text-sm text-gray-500 mb-1">Price:</div>
                        <div>
                          <span className="font-semibold">₹{displayPrice.toFixed(2)}</span>
                          {showOriginalPrice && (
                            <div className="text-xs text-gray-500 line-through">
                              ₹{originalItemPrice.toFixed(2)}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="col-span-4 md:col-span-2 text-center">
                         <div className="md:hidden text-sm text-gray-500 mb-1">Quantity:</div>
                        <div className="flex items-center justify-center">
                          <button onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)} className="p-1 rounded-full hover:bg-gray-100" disabled={item.quantity <= 1}>
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="mx-2 min-w-[2rem] text-center">{item.quantity}</span>
                          <button onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)} className="p-1 rounded-full hover:bg-gray-100" disabled={item.quantity >= item.product.stock}>
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="col-span-3 md:col-span-2 text-center font-semibold">
                        <div className="md:hidden text-sm text-gray-500 mb-1">Total:</div>
                        ₹{itemSubTotal.toFixed(2)}
                      </div>
                      
                      <div className="col-span-1 hidden md:flex justify-center">
                        <button onClick={() => handleRemoveItem(item.id)} className="text-gray-400 hover:text-red-500" title="Remove item">
                          <Trash className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
                
                <div className="p-4 flex justify-between">
                  <button onClick={handleClearCart} className="text-red-500 hover:text-red-600 text-sm flex items-center">
                    <Trash className="h-4 w-4 mr-1" /> Clear Cart
                  </button>
                  <Link to="/products">
                    <Button variant="outline" className="flex items-center">
                      <RefreshCw className="mr-2 h-4 w-4" /> Continue Shopping
                    </Button>
                  </Link>
                </div>
              </div>
              
              <SavedItems savedItems={savedItems} onMoveToCart={handleMoveToCart} onRemove={handleRemoveSaved} />
            </div>
            
            <div className="lg:col-span-4">
              <div className="bg-white rounded-lg shadow-sm p-6 sticky top-24">
                <h2 className="text-lg font-bold mb-4 pb-4 border-b">Order Summary</h2>
                
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal ({itemsCount} items)</span>
                    <span className="font-medium">₹{offerAdjustedSubtotal.toFixed(2)}</span>
                  </div>

                  {totalDiscount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span className="flex items-center"><Tag className="h-4 w-4 mr-1"/> Promotions Applied</span>
                      <span className="font-medium">- ₹{totalDiscount.toFixed(2)}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Shipping</span>
                    <span className="font-medium">{shipping > 0 ? `₹${shipping.toFixed(2)}` : 'Free'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax (18%)</span>
                    <span className="font-medium">₹{tax.toFixed(2)}</span>
                  </div>
                </div>
                
                <div className="border-t border-b py-4 mb-4">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Grand Total</span>
                    <span>₹{finalTotalWithTaxAndShipping.toFixed(2)}</span>
                  </div>
                </div>

                {appliedOffers && appliedOffers.length > 0 && (
                    <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
                        <h3 className="text-sm font-semibold text-green-700 mb-1 flex items-center"><Tag className="h-4 w-4 mr-1"/> Applied Offers:</h3>
                        <ul className="list-disc list-inside pl-1 text-xs text-green-600">
                            {appliedOffers.map(offer => <li key={offer.id}>{offer.name}</li>)}
                        </ul>
                    </div>
                )}
                
                <Button onClick={handleCheckout} className="w-full bg-brand-teal hover:bg-brand-dark" disabled={cart.length === 0}>
                  Proceed to Checkout <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                
                {offerAdjustedSubtotal < 1000 && offerAdjustedSubtotal > 0 && totalDiscount === 0 && (
                  <p className="mt-4 text-sm text-gray-600 text-center">
                    Add items worth ₹{(1000 - offerAdjustedSubtotal).toFixed(2)} more for free shipping!
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="max-w-md mx-auto">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                <h2 className="text-2xl font-semibold mb-4">Your cart is empty</h2>
                <p className="text-gray-600 mb-6">Looks like you haven't added anything to your cart yet. Browse our products and discover great items!</p>
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                    <Link to="/products">
                        <Button className="bg-brand-teal hover:bg-brand-dark w-full sm:w-auto"><ShoppingCart className="mr-2 h-5 w-5" />Start Shopping</Button>
                    </Link>
                    {savedItems.length > 0 && (
                        <Button variant="outline" className="w-full sm:w-auto" onClick={() => savedItems.length > 0 && handleMoveToCart(savedItems[0].id)}>
                            <Heart className="mr-2 h-5 w-5" />View Saved Items ({savedItems.length})
                        </Button>
                    )}
                </div>
            </div>
        </div>
        )}
        
        {cart.length === 0 && savedItems.length > 0 && (
          <div className="mt-8">
            <SavedItems savedItems={savedItems} onMoveToCart={handleMoveToCart} onRemove={handleRemoveSaved} />
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Cart;
