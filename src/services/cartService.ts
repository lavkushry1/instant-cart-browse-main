import { Product } from '@/types/product';
import { toast } from 'sonner';

export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
}

const CART_STORAGE_KEY = 'instantCartItems';
const SAVE_FOR_LATER_KEY = 'instantCartSavedItems';

/**
 * Load cart from localStorage
 */
export const loadCart = (): CartItem[] => {
  try {
    const cartData = localStorage.getItem(CART_STORAGE_KEY);
    if (cartData) {
      return JSON.parse(cartData);
    }
  } catch (error) {
    console.error('Failed to load cart from localStorage', error);
  }
  return [];
};

/**
 * Save cart to localStorage
 */
export const saveCart = (cart: CartItem[]): void => {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  } catch (error) {
    console.error('Failed to save cart to localStorage', error);
  }
};

/**
 * Load saved items from localStorage
 */
export const loadSavedItems = (): CartItem[] => {
  try {
    const savedData = localStorage.getItem(SAVE_FOR_LATER_KEY);
    if (savedData) {
      return JSON.parse(savedData);
    }
  } catch (error) {
    console.error('Failed to load saved items from localStorage', error);
  }
  return [];
};

/**
 * Save saved items to localStorage
 */
export const saveSavedItems = (items: CartItem[]): void => {
  try {
    localStorage.setItem(SAVE_FOR_LATER_KEY, JSON.stringify(items));
  } catch (error) {
    console.error('Failed to save saved items to localStorage', error);
  }
};

/**
 * Add item to cart
 */
export const addItemToCart = (cart: CartItem[], product: Product, quantity = 1): CartItem[] => {
  const existingItemIndex = cart.findIndex(item => item.product.id === product.id);
  
  if (existingItemIndex >= 0) {
    // Update quantity if item already exists
    const updatedCart = [...cart];
    updatedCart[existingItemIndex] = {
      ...updatedCart[existingItemIndex],
      quantity: updatedCart[existingItemIndex].quantity + quantity
    };
    
    toast.success(`Updated quantity for ${product.name}`);
    return updatedCart;
  } else {
    // Add new item if it doesn't exist
    toast.success(`Added ${product.name} to cart`);
    return [...cart, {
      id: product.id,
      product,
      quantity
    }];
  }
};

/**
 * Remove item from cart
 */
export const removeItemFromCart = (cart: CartItem[], productId: string): CartItem[] => {
  const updatedCart = cart.filter(item => item.product.id !== productId);
  toast.info('Item removed from cart');
  return updatedCart;
};

/**
 * Update item quantity
 */
export const updateItemQuantity = (cart: CartItem[], productId: string, quantity: number): CartItem[] => {
  const updatedCart = cart.map(item => {
    if (item.product.id === productId) {
      return { ...item, quantity };
    }
    return item;
  });
  
  toast.success('Cart updated');
  return updatedCart;
};

/**
 * Save item for later
 */
export const saveItemForLater = (cart: CartItem[], productId: string): { updatedCart: CartItem[], updatedSavedItems: CartItem[] } => {
  // Find the item in the cart
  const item = cart.find(item => item.product.id === productId);
  if (!item) {
    return { updatedCart: cart, updatedSavedItems: loadSavedItems() };
  }
  
  // Remove item from cart
  const updatedCart = removeItemFromCart(cart, productId);
  
  // Add item to saved items
  const savedItems = loadSavedItems();
  const existingItemIndex = savedItems.findIndex(savedItem => savedItem.product.id === productId);
  
  let updatedSavedItems;
  if (existingItemIndex >= 0) {
    // Update quantity if item already exists in saved items
    updatedSavedItems = [...savedItems];
    updatedSavedItems[existingItemIndex] = {
      ...updatedSavedItems[existingItemIndex],
      quantity: updatedSavedItems[existingItemIndex].quantity + item.quantity
    };
  } else {
    // Add new item to saved items
    updatedSavedItems = [...savedItems, item];
  }
  
  // Save to localStorage
  saveSavedItems(updatedSavedItems);
  
  toast.success(`${item.product.name} saved for later`);
  return { updatedCart, updatedSavedItems };
};

/**
 * Move item from saved to cart
 */
export const moveToCart = (savedItems: CartItem[], productId: string): { updatedCart: CartItem[], updatedSavedItems: CartItem[] } => {
  // Find the item in saved items
  const item = savedItems.find(item => item.product.id === productId);
  if (!item) {
    return { updatedCart: loadCart(), updatedSavedItems: savedItems };
  }
  
  // Remove item from saved items
  const updatedSavedItems = savedItems.filter(item => item.product.id !== productId);
  
  // Add item to cart
  const cart = loadCart();
  const updatedCart = addItemToCart(cart, item.product, item.quantity);
  
  // Save to localStorage
  saveSavedItems(updatedSavedItems);
  saveCart(updatedCart);
  
  toast.success(`${item.product.name} moved to cart`);
  return { updatedCart, updatedSavedItems };
};

/**
 * Remove item from saved items
 */
export const removeSavedItem = (savedItems: CartItem[], productId: string): CartItem[] => {
  const updatedSavedItems = savedItems.filter(item => item.product.id !== productId);
  saveSavedItems(updatedSavedItems);
  toast.info('Item removed from saved items');
  return updatedSavedItems;
};

/**
 * Clear cart
 */
export const clearCart = (): void => {
  localStorage.removeItem(CART_STORAGE_KEY);
  toast.info('Cart cleared');
};

/**
 * Clear saved items
 */
export const clearSavedItems = (): void => {
  localStorage.removeItem(SAVE_FOR_LATER_KEY);
  toast.info('Saved items cleared');
};

/**
 * Get cart totals
 */
export const getCartTotals = (cart: CartItem[]) => {
  const subtotal = cart.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  const totalItems = cart.reduce((count, item) => count + item.quantity, 0);
  
  return {
    subtotal,
    totalItems
  };
};
