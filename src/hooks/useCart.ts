import { useState, useEffect } from 'react';
import { Product } from '@/types/product';
import { 
  loadCart, 
  saveCart, 
  addItemToCart, 
  removeItemFromCart,
  updateItemQuantity,
  loadSavedItems,
  saveSavedItems,
  saveItemForLater,
  moveToCart,
  removeSavedItem,
  clearCart,
  clearSavedItems
} from '@/services/cartService';

export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
}

export const useCart = () => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [savedItems, setSavedItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load cart and saved items from localStorage on mount
  useEffect(() => {
    const storedCart = loadCart();
    const storedSavedItems = loadSavedItems();
    setCart(storedCart);
    setSavedItems(storedSavedItems);
    setIsLoading(false);
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (!isLoading) {
      saveCart(cart);
    }
  }, [cart, isLoading]);

  // Save savedItems to localStorage whenever it changes
  useEffect(() => {
    if (!isLoading) {
      saveSavedItems(savedItems);
    }
  }, [savedItems, isLoading]);

  // Add item to cart
  const addToCart = (product: Product, quantity = 1) => {
    const updatedCart = addItemToCart(cart, product, quantity);
    setCart(updatedCart);
    return updatedCart;
  };

  // Remove item from cart
  const removeFromCart = (productId: string) => {
    const updatedCart = removeItemFromCart(cart, productId);
    setCart(updatedCart);
    return updatedCart;
  };

  // Update item quantity
  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity < 1) return removeFromCart(productId);
    
    const updatedCart = updateItemQuantity(cart, productId, quantity);
    setCart(updatedCart);
    return updatedCart;
  };

  // Save item for later (move from cart to saved items)
  const saveForLater = (productId: string) => {
    const { updatedCart, updatedSavedItems } = saveItemForLater(cart, productId);
    setCart(updatedCart);
    setSavedItems(updatedSavedItems);
  };

  // Move item to cart (from saved items)
  const moveItemToCart = (productId: string) => {
    const { updatedCart, updatedSavedItems } = moveToCart(savedItems, productId);
    setCart(updatedCart);
    setSavedItems(updatedSavedItems);
  };

  // Remove item from saved items
  const removeSaved = (productId: string) => {
    const updatedSavedItems = removeSavedItem(savedItems, productId);
    setSavedItems(updatedSavedItems);
  };

  // Clear cart
  const clearCartItems = () => {
    clearCart();
    setCart([]);
  };

  // Clear saved items
  const clearSaved = () => {
    clearSavedItems();
    setSavedItems([]);
  };

  // Get cart totals
  const getCartTotals = () => {
    const subtotal = cart.reduce((total, item) => total + (item.product.price * item.quantity), 0);
    const itemsCount = cart.reduce((count, item) => count + item.quantity, 0);
    
    return {
      subtotal,
      itemsCount,
    };
  };

  return {
    cart,
    savedItems,
    isLoading,
    addToCart,
    removeFromCart,
    updateQuantity,
    saveForLater,
    moveItemToCart,
    removeSaved,
    clearCartItems,
    clearSaved,
    getCartTotals,
  };
};

export default useCart;