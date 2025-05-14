import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { useCart } from '@/hooks/useCart';
import SavedItems from '@/components/cart/SavedItems';
import { Button } from '@/components/ui/button';
import { 
  Trash, 
  Plus, 
  Minus, 
  ArrowRight, 
  Heart,
  ShoppingCart,
  RefreshCw
} from 'lucide-react';

const Cart = () => {
  const navigate = useNavigate();
  const { 
    cart, 
    savedItems,
    isLoading,
    removeFromCart, 
    updateQuantity, 
    saveForLater,
    moveItemToCart,
    removeSaved,
    clearCartItems,
    getCartTotals 
  } = useCart();
  
  const { subtotal, itemsCount } = getCartTotals();
  const shipping = subtotal > 1000 ? 0 : 99;
  const tax = subtotal * 0.18; // 18% GST
  const total = subtotal + shipping + tax;
  
  const handleUpdateQuantity = (itemId: string, newQuantity: number) => {
    updateQuantity(itemId, newQuantity);
  };
  
  const handleRemoveItem = (itemId: string) => {
    removeFromCart(itemId);
  };
  
  const handleSaveForLater = (itemId: string) => {
    saveForLater(itemId);
  };
  
  const handleMoveToCart = (itemId: string) => {
    moveItemToCart(itemId);
  };
  
  const handleRemoveSaved = (itemId: string) => {
    removeSaved(itemId);
  };
  
  const handleClearCart = () => {
    clearCartItems();
  };
  
  const handleCheckout = () => {
    navigate('/checkout');
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 min-h-screen">
        <h1 className="text-3xl font-bold mb-6">Shopping Cart</h1>
        
        {cart.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-8">
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                {/* Header */}
                <div className="hidden md:grid grid-cols-12 gap-4 p-4 border-b border-gray-200 bg-gray-50 text-gray-600 font-medium">
                  <div className="col-span-6">Product</div>
                  <div className="col-span-2 text-center">Price</div>
                  <div className="col-span-2 text-center">Quantity</div>
                  <div className="col-span-2 text-center">Total</div>
                </div>
                
                {/* Cart Items */}
                {cart.map((item) => {
                  const itemTotal = item.product.price * item.quantity;
                  const discountedPrice = item.product.discount > 0
                    ? item.product.price * (1 - item.product.discount / 100)
                    : item.product.price;
                  
                  return (
                    <div key={item.id} className="grid grid-cols-12 gap-4 p-4 border-b border-gray-200 items-center">
                      {/* Product */}
                      <div className="col-span-12 md:col-span-6 flex items-center">
                        <div className="w-20 h-20 flex-shrink-0 mr-4 bg-gray-100 rounded">
                          <img 
                            src={item.product.images[0]} 
                            alt={item.product.name}
                            className="w-full h-full object-contain p-2"
                          />
                        </div>
                        <div>
                          <Link to={`/product/${item.id}`} className="font-medium hover:text-brand-teal truncate mb-1 block">
                            {item.product.name}
                          </Link>
                          <p className="text-sm text-gray-500">
                            Category: {item.product.category}
                          </p>
                          <div className="flex mt-2 space-x-3">
                            <button 
                              onClick={() => handleSaveForLater(item.id)}
                              className="text-gray-500 hover:text-brand-teal text-sm flex items-center"
                              title="Save for later"
                            >
                              <Heart className="h-4 w-4 mr-1" />
                              Save for later
                            </button>
                            <button 
                              onClick={() => handleRemoveItem(item.id)}
                              className="text-gray-400 hover:text-red-500 text-sm flex items-center md:hidden"
                            >
                              <Trash className="h-4 w-4 mr-1" />
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      {/* Price */}
                      <div className="col-span-4 md:col-span-2 text-center">
                        <div className="md:hidden text-sm text-gray-500 mb-1">Price:</div>
                        {item.product.discount > 0 ? (
                          <div>
                            <span className="font-semibold">
                              ₹{discountedPrice.toFixed(2)}
                            </span>
                            <div className="text-xs text-gray-500 line-through">
                              ₹{item.product.price.toFixed(2)}
                            </div>
                          </div>
                        ) : (
                          <span className="font-semibold">₹{item.product.price.toFixed(2)}</span>
                        )}
                      </div>
                      
                      {/* Quantity */}
                      <div className="col-span-4 md:col-span-2 text-center">
                        <div className="md:hidden text-sm text-gray-500 mb-1">Quantity:</div>
                        <div className="flex items-center justify-center">
                          <button
                            onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                            className="p-1 rounded-full hover:bg-gray-100"
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="mx-2 min-w-[2rem] text-center">{item.quantity}</span>
                          <button
                            onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                            className="p-1 rounded-full hover:bg-gray-100"
                            disabled={item.quantity >= item.product.stock}
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      
                      {/* Total */}
                      <div className="col-span-3 md:col-span-2 text-center font-semibold">
                        <div className="md:hidden text-sm text-gray-500 mb-1">Total:</div>
                        ₹{(discountedPrice * item.quantity).toFixed(2)}
                      </div>
                      
                      {/* Remove - desktop only */}
                      <div className="col-span-1 hidden md:flex justify-center">
                        <button 
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-gray-400 hover:text-red-500"
                          title="Remove item"
                        >
                          <Trash className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
                
                {/* Cart Actions */}
                <div className="p-4 flex justify-between">
                  <button
                    onClick={handleClearCart}
                    className="text-red-500 hover:text-red-600 text-sm flex items-center"
                  >
                    <Trash className="h-4 w-4 mr-1" />
                    Clear Cart
                  </button>
                  
                  <Link to="/products">
                    <Button variant="outline" className="flex items-center">
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Continue Shopping
                    </Button>
                  </Link>
                </div>
              </div>
              
              {/* Display Saved Items */}
              <SavedItems 
                savedItems={savedItems}
                onMoveToCart={handleMoveToCart}
                onRemove={handleRemoveSaved}
              />
            </div>
            
            {/* Order Summary */}
            <div className="lg:col-span-4">
              <div className="bg-white rounded-lg shadow-sm p-6 sticky top-24">
                <h2 className="text-lg font-bold mb-4 pb-4 border-b">Order Summary</h2>
                
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal ({itemsCount} items)</span>
                    <span className="font-medium">₹{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Shipping</span>
                    <span className="font-medium">{shipping > 0 ? `₹${shipping.toFixed(2)}` : 'Free'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax (18% GST)</span>
                    <span className="font-medium">₹{tax.toFixed(2)}</span>
                  </div>
                </div>
                
                <div className="border-t border-b py-4 mb-4">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>₹{total.toFixed(2)}</span>
                  </div>
                </div>
                
                <Button
                  onClick={handleCheckout}
                  className="w-full bg-brand-teal hover:bg-brand-dark"
                  disabled={cart.length === 0}
                >
                  Proceed to Checkout
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                
                {subtotal < 1000 && subtotal > 0 && (
                  <p className="mt-4 text-sm text-gray-600 text-center">
                    Add items worth ₹{(1000 - subtotal).toFixed(2)} more for free shipping!
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="max-w-md mx-auto">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <h2 className="text-2xl font-semibold mb-4">Your cart is empty</h2>
              <p className="text-gray-600 mb-6">
                Looks like you haven't added anything to your cart yet.
                Browse our products and discover great items!
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Link to="/products">
                  <Button className="bg-brand-teal hover:bg-brand-dark w-full sm:w-auto">
                    <ShoppingCart className="mr-2 h-5 w-5" />
                    Start Shopping
                  </Button>
                </Link>
                
                {savedItems.length > 0 && (
                  <Button 
                    variant="outline" 
                    className="w-full sm:w-auto"
                    onClick={() => handleMoveToCart(savedItems[0].id)}
                  >
                    <Heart className="mr-2 h-5 w-5" />
                    View Saved Items ({savedItems.length})
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* If cart is empty but saved items exist, show saved items */}
        {cart.length === 0 && savedItems.length > 0 && (
          <div className="mt-8">
            <SavedItems 
              savedItems={savedItems}
              onMoveToCart={handleMoveToCart}
              onRemove={handleRemoveSaved}
            />
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Cart;
