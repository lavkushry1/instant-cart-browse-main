import { useState, useEffect, useCallback, useContext } from 'react';
import { Product } from '@/types/product';
import { getGuestCart, saveGuestCart, getGuestSavedItems, saveGuestSavedItems } from '@/lib/localStorageUtils'; // Import guest cart utils
import { AuthContext } from './AuthContextDef'; // Corrected import for AuthContext
import { functionsClient } from '@/lib/firebaseClient';
import { httpsCallable, HttpsCallable, HttpsCallableResult } from 'firebase/functions';
import { toast } from 'sonner';
import { Timestamp } from 'firebase/firestore'; // For backend CartItemBE addedAt (though not directly used in mapping here)
import React from 'react';
// Import BE types for saved items from the correct src/services location
import { SavedItemBE as BackendSavedItem, SavedProductDataBE } from '../services/savedItemsService'; 

// Backend types (align with functions/src/services/cartService.ts)
export interface ProductInCartBE {
  id: string;
  name: string;
  price: number;
  images?: string[]; // Optional here is fine as it maps from various sources
}

export interface CartItemBE {
  productId: string;
  quantity: number;
  product: ProductInCartBE;
  addedAt: Timestamp; // Or string/object representation if converted by CF
}

export interface UserCartBE {
  userId: string;
  items: CartItemBE[];
  lastUpdatedAt?: Timestamp;
}

// Cloud Function response types
interface GetUserCartResponse {
  success: boolean;
  cart?: UserCartBE;
  error?: string;
}

// Payload for setItemInUserCartCF
interface ProductDataForCF {
  id: string;
  name: string;
  price: number;
  images: string[]; // Made non-optional as prepareProductDataForCF ensures it's an array
}
interface SetItemInCartPayload {
  productId: string;
  quantity: number;
  product: ProductDataForCF;
}
interface SetItemInCartResponse {
  success: boolean;
  cart?: UserCartBE; // The updated cart
  error?: string;
  message?: string;
}

interface ClearCartResponse {
  success: boolean;
  error?: string;
  message?: string;
}

// --- Cloud Function response types for SAVED ITEMS ---
interface GetSavedItemsResponse {
  success: boolean;
  savedItems?: BackendSavedItem[]; // Uses the BE type
  error?: string;
}

interface AddSavedItemPayload {
  productId: string;
  productData: Pick<Product, 'id' | 'name' | 'price' | 'images'>; // This is the expected type by CF
}
interface AddSavedItemResponse {
  success: boolean;
  savedItem?: BackendSavedItem;
  error?: string;
}

interface RemoveSavedItemPayload {
  productId: string;
}
interface BasicSuccessResponse { // For remove and move-to-cart
  success: boolean;
  error?: string;
}
// --- End Saved Items CF types ---

// Callable function references
let getUserCartCallable: HttpsCallable<void, GetUserCartResponse> | undefined;
let setItemInCartCallable: HttpsCallable<SetItemInCartPayload, SetItemInCartResponse> | undefined;
let clearUserCartCallable: HttpsCallable<void, ClearCartResponse> | undefined;

// --- Callable function references for SAVED ITEMS ---
let getSavedItemsCallable: HttpsCallable<void, GetSavedItemsResponse> | undefined;
let addSavedItemCallable: HttpsCallable<AddSavedItemPayload, AddSavedItemResponse> | undefined;
let removeSavedItemCallable: HttpsCallable<RemoveSavedItemPayload, BasicSuccessResponse> | undefined;
let moveSavedItemToCartCallable: HttpsCallable<{ productId: string }, BasicSuccessResponse> | undefined;

if (functionsClient && Object.keys(functionsClient).length > 0) {
  try {
    // Cart callables
    getUserCartCallable = httpsCallable(functionsClient, 'cart-getUserCartCF');
    setItemInCartCallable = httpsCallable(functionsClient, 'cart-setItemInUserCartCF');
    clearUserCartCallable = httpsCallable(functionsClient, 'cart-clearUserCartCF');

    // Saved Items callables
    getSavedItemsCallable = httpsCallable(functionsClient, 'savedItems-getSavedItemsCF');
    addSavedItemCallable = httpsCallable(functionsClient, 'savedItems-addSavedItemCF');
    removeSavedItemCallable = httpsCallable(functionsClient, 'savedItems-removeSavedItemCF');
    moveSavedItemToCartCallable = httpsCallable(functionsClient, 'savedItems-moveSavedItemToCartCF');

  } catch (error) {
    console.error("useCart: Error preparing callable functions:", error);
    toast.error("Could not initialize cart/saved items services.");
  }
}

export interface CartItem {
  id: string; 
  product: Product;
  quantity: number;
}

// The helper functions like addItemToCart, removeItemFromCart, etc., 
// are defined below as part of the hook's internal logic or can be co-located
// if they were more complex. The direct localStorage interaction
// will be handled by loadCart and saveCart.

// Updated to use localStorageUtils - These are now guest-specific
const loadGuestCartFromStorage = (): CartItem[] => {
  return getGuestCart();
};

const saveGuestCartToStorage = (cart: CartItem[]): void => {
  saveGuestCart(cart);
};

// Renamed stub for loading guest saved items
const loadGuestSavedItemsFromStorage = (): CartItem[] => {
  return getGuestSavedItems(); 
};

// Renamed stub for saving guest saved items
const saveGuestSavedItemsToStorage = (items: CartItem[]): void => {
  saveGuestSavedItems(items);
};

// These specific helper functions are effectively implemented within the useCart hook's returned methods.
// Keeping them separate like this was part of the original stub structure.
// For clarity, the hook itself will manage these operations on its state,
// and `saveCart` (now `saveGuestCart`) will handle persistence.
// So, we can simplify by removing the standalone `addItemToCart_stub`, `removeItemFromCart_stub` etc.

export const useCart = () => {
  const { user, isAuthenticated, isLoading: authLoading } = useContext(AuthContext);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [savedForLaterItems, setSavedForLaterItems] = useState<CartItem[]>([]); // Renamed state variable
  const [isLoading, setIsLoading] = useState(true); // General loading for cart + saved items init
  const [isCartInitialized, setIsCartInitialized] = useState(false);
  const [isSavedItemsInitialized, setIsSavedItemsInitialized] = useState(false); // New state for saved items

  // Helper to map ProductInCartBE or SavedProductDataBE to client Product type
  // Renamed from mapProductInBEToProduct for clarity
  const mapBEProductToClientProduct = (pBE: ProductInCartBE | SavedProductDataBE): Product => {
    return {
      id: pBE.id,
      name: pBE.name,
      price: pBE.price,
      images: pBE.images && pBE.images.length > 0 ? pBE.images : ['/placeholder.svg'],
      description: '', 
      category: '', 
      compareAtPrice: pBE.price, 
      stock: 0, 
      tags: [],
      featured: 0, 
      discount: 0, 
      createdAt: new Date().toISOString(), 
      updatedAt: new Date().toISOString(), 
      seo: undefined,
    };
  };
  
  // Helper to map CartItemBE (from Firestore) to client CartItem (remains same)
  const mapCartItemBEToCartItem = (itemBE: CartItemBE): CartItem => {
    return {
      id: itemBE.productId,
      product: mapBEProductToClientProduct(itemBE.product),
      quantity: itemBE.quantity,
    };
  };

  // Helper to map BackendSavedItem (from Firestore) to client CartItem (for saved list)
  const mapBackendSavedItemToCartItem = (itemBE: BackendSavedItem): CartItem => {
    return {
      id: itemBE.productId,
      product: mapBEProductToClientProduct(itemBE.product), // itemBE.product is SavedProductDataBE
      quantity: 1, // Saved items always have quantity 1
    };
  };

  // Load cart AND saved items on mount and auth changes
  useEffect(() => {
    if (authLoading || !functionsClient) { 
      // console.log("useCart: Auth loading or functions client not ready.");
      return;
    }

    const loadInitialData = async () => {
      // console.log("useCart: loadInitialData called. isAuthenticated:", isAuthenticated);
      setIsLoading(true);
      if (isAuthenticated && user) {
        // Load Cart
        if (getUserCartCallable) {
          try {
            // console.log("useCart: Fetching cart from Firestore for user:", user.uid);
            const result = await getUserCartCallable();
            if (result.data.success && result.data.cart) {
              setCart(result.data.cart.items.map(mapCartItemBEToCartItem));
              // console.log("useCart: Cart loaded from Firestore:", result.data.cart.items);
            } else {
              console.error("useCart: Failed to load cart from Firestore:", result.data.error);
              toast.error(result.data.error || "Failed to load cart from server.");
              setCart([]);
            }
          } catch (error) {
            console.error("useCart: Error calling getUserCartCF:", error);
            toast.error("Error fetching your cart.");
            setCart([]);
          }
        }
        // Load Saved Items
        if (getSavedItemsCallable) {
          try {
            // console.log("useCart: Fetching saved items for user:", user.uid);
            const result = await getSavedItemsCallable();
            if (result.data.success && result.data.savedItems) {
              setSavedForLaterItems(result.data.savedItems.map(mapBackendSavedItemToCartItem));
              // console.log("useCart: Saved items loaded from Firestore:", result.data.savedItems);
            } else {
              console.error("useCart: Failed to load saved items from Firestore:", result.data.error);
              toast.error(result.data.error || "Failed to load saved items from server.");
              setSavedForLaterItems([]);
            }
          } catch (error) {
            console.error("useCart: Error calling getSavedItemsCF:", error);
            toast.error("Error fetching your saved items.");
            setSavedForLaterItems([]);
          }
        }
      } else {
        // Guest: Load from localStorage
        // console.log("useCart: Loading cart & saved items from guest storage.");
        setCart(loadGuestCartFromStorage());
        setSavedForLaterItems(loadGuestSavedItemsFromStorage());
        // console.log("useCart: Guest cart/saved loaded.");
      }
    setIsLoading(false);
      setIsCartInitialized(true);
      setIsSavedItemsInitialized(true);
      // console.log("useCart: Data initialized. isLoading:", false);
    };

    if (!isCartInitialized || !isSavedItemsInitialized) { // Load if either is not initialized
        // console.log("useCart: Cart or SavedItems not initialized, calling loadInitialData.");
        loadInitialData();
    }

  }, [isAuthenticated, user, authLoading, functionsClient, isCartInitialized, isSavedItemsInitialized]); // Dependencies for main data load

  // Effects for resetting initialization status on auth change
  const prevIsAuthenticated = usePrevious(isAuthenticated);
  useEffect(() => {
    if (!authLoading && prevIsAuthenticated !== undefined && prevIsAuthenticated !== isAuthenticated) {
      // console.log("useCart: Auth status changed (isAuthenticated). Resetting init flags.");
      setIsCartInitialized(false);
      setIsSavedItemsInitialized(false); // Reset both on auth change to trigger reload
    }
  }, [isAuthenticated, authLoading, prevIsAuthenticated]);

  // Custom hook to get previous value (as it was)
  function usePrevious<T>(value: T): T | undefined {
    const ref = React.useRef<T>();
    useEffect(() => { ref.current = value; }, [value]);
    return ref.current;
  }

  // Save GUEST cart to localStorage (as it was)
  useEffect(() => {
    if (!isAuthenticated && !authLoading && isCartInitialized) { 
      saveGuestCartToStorage(cart);
    }
  }, [cart, isAuthenticated, authLoading, isCartInitialized]);

  // Save GUEST saved items to localStorage (NEW)
  useEffect(() => {
    if (!isAuthenticated && !authLoading && isSavedItemsInitialized) { 
      saveGuestSavedItemsToStorage(savedForLaterItems);
    }
  }, [savedForLaterItems, isAuthenticated, authLoading, isSavedItemsInitialized]);

  // Helper to prepare product data for Cloud Function
  const prepareProductDataForCF = (product: Product): ProductDataForCF => {
    return {
      id: product.id,
      name: product.name,
      price: product.price,
      images: product.images?.slice(0, 1) || [],
    };
  };

  const addToCart = async (product: Product, quantity = 1) => { 
    // console.log("useCart: addToCart called", product, quantity);
    if (!product || !product.id) {
      toast.error("Invalid product data.");
      return;
    }
    if (isAuthenticated && user && setItemInCartCallable) {
      setIsLoading(true);
      try {
        const result = await setItemInCartCallable({ 
          productId: product.id, 
          quantity, 
          product: prepareProductDataForCF(product) 
        });
        if (result.data.success && result.data.cart) {
          setCart(result.data.cart.items.map(mapCartItemBEToCartItem));
          toast.success(`${product.name} added to cart.`);
        } else {
          toast.error(result.data.error || `Failed to add ${product.name} to cart.`);
        }
      } catch (error) {
        console.error("Error calling setItemInUserCartCF:", error);
        toast.error(`Error adding ${product.name} to cart.`);
      }
      setIsLoading(false);
    } else {
      // Guest cart logic (as it was, using direct state update and localStorage effect)
      setCart(prevCart => {
        const existingItem = prevCart.find(item => item.product.id === product.id);
        let newCart;
        if (existingItem) {
          newCart = prevCart.map(item =>
            item.product.id === product.id
              ? { ...item, quantity: item.quantity + quantity }
              : item
          );
        } else {
          newCart = [...prevCart, { id: product.id, product, quantity }];
        }
        // saveGuestCartToStorage(newCart); // Let useEffect handle saving for guests
        return newCart;
      });
      toast.success(`${product.name} added to guest cart.`);
    }
  };

  const removeFromCart = async (productId: string) => { 
    // console.log("useCart: removeFromCart called", productId);
    if (isAuthenticated && user && setItemInCartCallable) {
      setIsLoading(true);
      try {
        const productToRemove = cart.find(item => item.id === productId)?.product;
        const result = await setItemInCartCallable({ 
          productId, 
          quantity: 0, 
          product: productToRemove 
            ? prepareProductDataForCF(productToRemove) 
            : { id: productId, name: 'N/A', price: 0, images: [] } // Added images: []
        });
        if (result.data.success && result.data.cart) {
          setCart(result.data.cart.items.map(mapCartItemBEToCartItem));
          if(productToRemove) toast.success(`${productToRemove.name} removed from cart.`); else toast.success(`Item removed from cart.`);
        } else {
          toast.error(result.data.error || "Failed to remove item from cart.");
        }
      } catch (error) {
        console.error("Error calling setItemInUserCartCF for removal:", error);
        toast.error("Error removing item from cart.");
      }
      setIsLoading(false);
    } else {
      // Guest cart logic
      const productToRemove = cart.find(item => item.id === productId)?.product;
      setCart(prevCart => prevCart.filter(item => item.product.id !== productId));
      if(productToRemove) toast.success(`${productToRemove.name} removed from guest cart.`); else toast.success(`Item removed from guest cart.`);
    }
  };

  const updateQuantity = async (productId: string, quantity: number) => { 
    // console.log("useCart: updateQuantity called", productId, quantity);
    if (quantity <= 0) {
      await removeFromCart(productId);
      return;
    }
    if (isAuthenticated && user && setItemInCartCallable) {
      setIsLoading(true);
      try {
        const productToUpdate = cart.find(item => item.id === productId)?.product;
        if (!productToUpdate) {
          toast.error("Product not found in cart for update.");
          setIsLoading(false);
          return;
        }
        const result = await setItemInCartCallable({ 
          productId, 
          quantity, 
          product: prepareProductDataForCF(productToUpdate)
        });
        if (result.data.success && result.data.cart) {
          setCart(result.data.cart.items.map(mapCartItemBEToCartItem));
          toast.success(`Quantity for ${productToUpdate.name} updated.`);
        } else {
          toast.error(result.data.error || "Failed to update quantity.");
        }
      } catch (error) {
        console.error("Error calling setItemInUserCartCF for update:", error);
        toast.error("Error updating quantity.");
      }
      setIsLoading(false);
    } else {
      // Guest cart logic
      setCart(prevCart =>
        prevCart.map(item =>
          item.product.id === productId ? { ...item, quantity } : item
        )
      );
      const productName = cart.find(item => item.id === productId)?.product.name || "Item";
      toast.success(`Quantity for ${productName} updated in guest cart.`);
    }
  };

  const clearCartItems = async () => { 
    // console.log("useCart: clearCartItems called");
    if (isAuthenticated && user && clearUserCartCallable) {
      setIsLoading(true);
      try {
        const result = await clearUserCartCallable();
        if (result.data.success) {
          setCart([]);
          toast.success("Cart cleared.");
        } else {
          toast.error(result.data.error || "Failed to clear cart.");
        }
      } catch (error) {
        console.error("Error calling clearUserCartCF:", error);
        toast.error("Error clearing cart.");
      }
      setIsLoading(false);
    } else {
      // Guest cart logic
      setCart([]);
      toast.success("Guest cart cleared.");
    }
  };

  // --- Actual implementations for saved item actions ---
  const saveForLater = async (productId: string, product: Product) => {
    if (!productId || !product) {
      toast.error("Invalid product data for saving.");
      return;
    }

    if (isAuthenticated && user && addSavedItemCallable && removeSavedItemCallable) {
      setIsLoading(true);
      try {
        // addPayload expects productData to be Pick<Product,...>, which prepareProductDataForCF now matches better
        const productDataForPayload: Pick<Product, 'id' | 'name' | 'price' | 'images'> = prepareProductDataForCF(product);
        const addPayload: AddSavedItemPayload = { productId, productData: productDataForPayload };
        const addResult = await addSavedItemCallable(addPayload);
        
        if (!addResult.data.success) {
          toast.error(addResult.data.error || "Failed to save item.");
          setIsLoading(false);
          return;
        }

        const newItem: CartItem = { id: productId, product, quantity: 1 };
        setSavedForLaterItems(prev => {
          if (prev.find(item => item.id === productId)) return prev; 
          return [...prev, newItem];
        });
        toast.success(`${product.name} saved for later.`);

        const itemInCart = cart.find(item => item.id === productId);
        if (itemInCart) {
          await removeFromCart(productId); 
        }

      } catch (error) {
        console.error("Error in saveForLater (auth):", error); // Corrected typo: . to ,
        toast.error("An error occurred while saving the item.");
      }
      setIsLoading(false);
    } else {
      // Guest logic (remains same)
      const itemInCart = cart.find(item => item.id === productId);
      if (itemInCart) {
        setCart(prevCart => prevCart.filter(item => item.id !== productId)); 
      }
      setSavedForLaterItems(prevSaved => {
        if (prevSaved.find(item => item.id === productId)) return prevSaved; 
        return [...prevSaved, { id: productId, product, quantity: 1 }]; 
      });
      toast.success(`${product.name} saved for later (guest).`);
    }
  };

  const moveSavedItemToCart = async (productId: string) => {
    const itemToMove = savedForLaterItems.find(item => item.id === productId);
    if (!itemToMove) {
      toast.error("Item not found in saved list.");
      return;
    }

    if (isAuthenticated && user && moveSavedItemToCartCallable) {
      setIsLoading(true);
      try {
        const result = await moveSavedItemToCartCallable({ productId });
        if (result.data.success) {
          // Optimistically update local saved items state
          setSavedForLaterItems(prev => prev.filter(item => item.id !== productId));
          toast.success(`${itemToMove.product.name} moved to cart.`);
          // Trigger cart refresh
          setIsCartInitialized(false); 
        } else {
          toast.error(result.data.error || "Failed to move item to cart.");
        }
      } catch (error) {
        console.error("Error in moveSavedItemToCart (auth):", error);
        toast.error("An error occurred while moving the item.");
      }
      setIsLoading(false);
    } else {
      // Guest: remove from guest saved, add to guest cart
      setSavedForLaterItems(prev => prev.filter(item => item.id !== productId));
      // Add to guest cart (logic from addToCart for guest)
      setCart(prevCart => {
        const existingItem = prevCart.find(item => item.product.id === itemToMove.product.id);
        let newCart;
        if (existingItem) {
          newCart = prevCart.map(item =>
            item.product.id === itemToMove.product.id
              ? { ...item, quantity: item.quantity + itemToMove.quantity } // Use quantity from saved item (usually 1)
              : item
          );
        } else {
          newCart = [...prevCart, { id: itemToMove.product.id, product: itemToMove.product, quantity: itemToMove.quantity }];
        }
        return newCart;
      });
      toast.success(`${itemToMove.product.name} moved to cart (guest).`);
    }
  };

  const removeSavedItem = async (productId: string) => {
    const itemToRemove = savedForLaterItems.find(item => item.id === productId);
    if (!itemToRemove) return; // Should not happen if called from UI with valid item

    if (isAuthenticated && user && removeSavedItemCallable) {
      setIsLoading(true);
      try {
        const result = await removeSavedItemCallable({ productId });
        if (result.data.success) {
          setSavedForLaterItems(prev => prev.filter(item => item.id !== productId));
          toast.success(`${itemToRemove.product.name} removed from saved list.`);
        } else {
          toast.error(result.data.error || "Failed to remove saved item.");
        }
      } catch (error) {
        console.error("Error in removeSavedItem (auth):", error);
        toast.error("An error occurred while removing the item.");
      }
      setIsLoading(false);
    } else {
      // Guest: remove from guest saved items
      setSavedForLaterItems(prev => prev.filter(item => item.id !== productId));
      toast.success(`${itemToRemove.product.name} removed from saved list (guest).`);
    }
  };

  const clearSavedItems = async () => {
    if (isAuthenticated && user && removeSavedItemCallable) { // No batch clear CF yet, clear one by one
      setIsLoading(true);
      try {
        // Create a batch of promises for removal, though CFs are individual calls here
        const removalPromises = savedForLaterItems.map(item => removeSavedItemCallable({ productId: item.id }));
        const results = await Promise.all(removalPromises.map(p => p.catch(e => e))); // Catch individual errors
        
        let allSucceeded = true;
        results.forEach(result => {
          if (!result?.data?.success) {
            allSucceeded = false;
            // Individual errors could be toasted here if needed, or a general message
          }
        });

        if (allSucceeded) {
          setSavedForLaterItems([]);
          toast.success("All saved items cleared.");
        } else {
          toast.error("Some items could not be cleared. Please refresh and try again.");
          // Optionally, refetch saved items to get the current state
          setIsSavedItemsInitialized(false);
        }
      } catch (error) {
        console.error("Error in clearSavedItems (auth):", error);
        toast.error("An error occurred while clearing saved items.");
      }
      setIsLoading(false);
    } else {
      // Guest: clear local storage saved items
      setSavedForLaterItems([]);
      toast.success("Saved items cleared (guest).");
    }
  };
  // --- End saved item actions ---

  const getCartTotals = () => {
    // console.log("useCart: getCartTotals called");
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    // Placeholder for discount and finalTotal if offers are applied elsewhere
    return {
      totalItems, 
      subtotal,
      discount: 0, // To be calculated if offers are part of cart state
      finalTotal: subtotal, // To be adjusted by discounts, taxes, shipping
      appliedOffers: [] // Placeholder
    };
  };

  return {
    cart,
    savedItems: savedForLaterItems, 
    isLoading,
    isCartInitialized, 
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart: clearCartItems, 
    getCartTotals,
    saveForLater, 
    moveSavedItemToCart, 
    removeSavedItem, 
    clearSavedItems 
  };
};

export default useCart;