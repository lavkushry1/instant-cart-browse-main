import { Product } from '@/types/product'; // Import the main Product type

const GUEST_WISHLIST_KEY = 'guestWishlist';

export const getGuestWishlist = (): string[] => {
  try {
    const wishlistJson = localStorage.getItem(GUEST_WISHLIST_KEY);
    if (wishlistJson) {
      const productIds = JSON.parse(wishlistJson);
      if (Array.isArray(productIds) && productIds.every(id => typeof id === 'string')) {
        return productIds;
      }
    }
  } catch (error) {
    console.error('Error retrieving guest wishlist from localStorage:', error);
  }
  return [];
};

export const addToGuestWishlist = (productId: string): string[] => {
  if (typeof productId !== 'string' || !productId.trim()) {
    console.error('Invalid productId for guest wishlist');
    return getGuestWishlist();
  }
  const currentWishlist = getGuestWishlist();
  if (!currentWishlist.includes(productId)) {
    const updatedWishlist = [...currentWishlist, productId];
    try {
      localStorage.setItem(GUEST_WISHLIST_KEY, JSON.stringify(updatedWishlist));
      return updatedWishlist;
    } catch (error) {
      console.error('Error saving guest wishlist to localStorage:', error);
      return currentWishlist; // Return old list on error
    }
  }
  return currentWishlist; // Return current if already includes
};

export const removeFromGuestWishlist = (productId: string): string[] => {
   if (typeof productId !== 'string' || !productId.trim()) {
    console.error('Invalid productId for guest wishlist removal');
    return getGuestWishlist();
  }
  const currentWishlist = getGuestWishlist();
  const updatedWishlist = currentWishlist.filter(id => id !== productId);
  
  if (updatedWishlist.length < currentWishlist.length) { // Item was actually removed
    try {
      localStorage.setItem(GUEST_WISHLIST_KEY, JSON.stringify(updatedWishlist));
      return updatedWishlist;
    } catch (error) {
      console.error('Error saving updated guest wishlist to localStorage:', error);
      return currentWishlist; // Return old list on error
    }
  }
  return currentWishlist; // Return current if item was not found
};

export const isProductInGuestWishlist = (productId: string): boolean => {
  if (typeof productId !== 'string' || !productId.trim()) {
    return false;
  }
  const currentWishlist = getGuestWishlist();
  return currentWishlist.includes(productId);
};

export const clearGuestWishlist = (): void => {
  try {
    localStorage.removeItem(GUEST_WISHLIST_KEY);
  } catch (error) {
    console.error('Error clearing guest wishlist from localStorage:', error);
  }
};

// --- Guest Cart Utilities ---
const GUEST_CART_KEY = 'guestCart';

// Use the CartItem structure consistent with useCart.ts
// It uses the full Product type from '@/types/product'
export interface CartItemLocalStorage {
  id: string; // product.id
  product: Product; // Using the imported full Product type
  quantity: number;
}

export const getGuestCart = (): CartItemLocalStorage[] => {
  try {
    const cartJson = localStorage.getItem(GUEST_CART_KEY);
    if (cartJson) {
      const items = JSON.parse(cartJson) as CartItemLocalStorage[];
      // Add more robust validation for CartItemLocalStorage structure if needed
      // For example, check if product has essential fields like id, name, price
      if (Array.isArray(items) && items.every(item => 
          item && typeof item.id === 'string' && 
          item.product && typeof item.product.id === 'string' && 
          typeof item.quantity === 'number')) {
        return items;
      }
    }
  } catch (error) {
    console.error('Error retrieving guest cart from localStorage:', error);
  }
  return [];
};

export const saveGuestCart = (cart: CartItemLocalStorage[]): void => {
  try {
    // Ensure cart items conform to CartItemLocalStorage, especially product structure
    const validatedCart = cart.map(item => ({
      ...item,
      product: { ...item.product } // Ensure product is a plain object if it has methods/class instance
    }));
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(validatedCart));
  } catch (error) {
    console.error('Error saving guest cart to localStorage:', error);
  }
};

// The following functions (addToGuestCart, etc.) are NOT strictly necessary IF
// useCart.ts handles all cart logic updates and then calls saveGuestCart.
// If useCart.ts directly calls these, ensure Product type matches.
// For now, assuming useCart.ts uses its own logic and calls saveGuestCart.

export const clearGuestCart = (): void => {
  try {
    localStorage.removeItem(GUEST_CART_KEY);
  } catch (error) {
    console.error('Error clearing guest cart from localStorage:', error);
  }
};

// --- Guest Saved For Later Items (Stores array of CartItem-like objects) ---
const GUEST_SAVED_ITEMS_KEY = 'guestSavedItems';

type SavedCartItem = CartItemLocalStorage; // Changed to type alias

export const getGuestSavedItems = (): SavedCartItem[] => {
  try {
    const savedItemsJson = localStorage.getItem(GUEST_SAVED_ITEMS_KEY);
    return savedItemsJson ? JSON.parse(savedItemsJson) : [];
  } catch (error) {
    console.error('Error getting guest saved items from localStorage:', error);
    return [];
  }
};

export const saveGuestSavedItems = (savedItems: SavedCartItem[]): void => {
  try {
    localStorage.setItem(GUEST_SAVED_ITEMS_KEY, JSON.stringify(savedItems));
  } catch (error) {
    console.error('Error saving guest saved items to localStorage:', error);
  }
};

export const clearGuestSavedItems = (): void => {
  try {
    localStorage.removeItem(GUEST_SAVED_ITEMS_KEY);
  } catch (error) {
    console.error('Error clearing guest saved items from localStorage:', error);
  }
};

// --- Recently Viewed Products ---
// ... existing recentlyViewed functions ... 