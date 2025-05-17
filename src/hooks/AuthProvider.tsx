import React, { useState, useEffect, ReactNode, useCallback } from 'react';
import { 
  getAuth, 
  onAuthStateChanged, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  updateProfile as firebaseUpdateProfile,
  User as FirebaseUser // Firebase's User type
} from 'firebase/auth';
import { firebaseApp, functionsClient } from '@/lib/firebaseClient'; // Assuming firebaseApp is exported for getAuth
import { AuthContext, AuthContextType, User, LoginCredentials, RegisterData, UpdateUserProfileData, UserAddress, ClientOrder, GetUserOrdersResponse } from './AuthContextDef';
import { httpsCallable, HttpsCallable, HttpsCallableResult } from 'firebase/functions';
import { getFunctions } from 'firebase/functions';
import { FirebaseError } from 'firebase/app';
import { toast } from 'react-hot-toast';
import { 
  getGuestWishlist, clearGuestWishlist, 
  getGuestCart, clearGuestCart, CartItemLocalStorage,
  getGuestSavedItems, clearGuestSavedItems // Added for saved items
} from '@/lib/localStorageUtils';
import { Product } from '@/types/product';

// Define the expected direct return type from the Cloud Function for user profile
interface UserProfileResponse { success: boolean; profile?: User; error?: string; } // User type here should match AuthContextDef's User

// Interface for AddAddress CF data and response
interface AddAddressCFData extends Omit<UserAddress, 'id'> {}
interface AddAddressCFResponse { success: boolean; address?: UserAddress; error?: string; }

// Interface for UpdateAddress CF data and response
interface UpdateAddressCFPayload { addressId: string; addressData: Partial<Omit<UserAddress, 'id'>> }
interface UpdateAddressCFResponse { success: boolean; address?: UserAddress; error?: string; }

// Interface for DeleteAddress CF data and response
interface DeleteAddressCFPayload { addressId: string; }
interface DeleteAddressCFResponse { success: boolean; message?: string; error?: string; }

// Interface for SetDefaultAddress CF data and response
interface SetDefaultAddressCFPayload { addressId: string; }
interface SetDefaultAddressCFResponse { success: boolean; message?: string; error?: string; }

// Interface for GetUserOrders CF data and response
interface GetUserOrdersCFPayload { limit?: number; startAfter?: any; }

// Interface for MergeGuestCart CF data and response (NEW)
interface MergeGuestCartCFPayload { items: CartItemLocalStorage[] }
interface MergeGuestCartCFResponse { success: boolean; message?: string; error?: string; }

// Interface for AddSavedItem CF (mirroring useCart.ts, but types locally defined or imported carefully)
interface AddSavedItemCFPayload_AuthProvider {
  productId: string;
  productData: Pick<Product, 'id' | 'name' | 'price' | 'images'>; // Assuming this is what addSavedItemCF expects
}
interface AddSavedItemCFResponse_AuthProvider { // Assuming general success/error structure
  success: boolean;
  savedItem?: any; // Type of savedItem can be more specific if BE type is imported safely
  error?: string;
}

let getUserProfileFunction: HttpsCallable<void, UserProfileResponse> | undefined;
let updateUserProfileFunction: HttpsCallable<UpdateUserProfileData, UserProfileResponse> | undefined;
// Callable function references for addresses
let addAddressCallable: HttpsCallable<AddAddressCFData, AddAddressCFResponse> | undefined;
let updateAddressCallable: HttpsCallable<UpdateAddressCFPayload, UpdateAddressCFResponse> | undefined;
let deleteAddressCallable: HttpsCallable<DeleteAddressCFPayload, DeleteAddressCFResponse> | undefined;
let setDefaultAddressCallable: HttpsCallable<SetDefaultAddressCFPayload, SetDefaultAddressCFResponse> | undefined;
let getUserOrdersCallable: HttpsCallable<GetUserOrdersCFPayload, GetUserOrdersResponse> | undefined;
let mergeGuestCartCallable: HttpsCallable<MergeGuestCartCFPayload, MergeGuestCartCFResponse> | undefined; // NEW
let addSavedItemCallable_AuthProvider: HttpsCallable<AddSavedItemCFPayload_AuthProvider, AddSavedItemCFResponse_AuthProvider> | undefined;

if (functionsClient && Object.keys(functionsClient).length > 0) {
  try {
    // Corrected callable names to match the exports from functions/src/index.ts (e.g., users.getUserProfile becomes users-getUserProfile)
    getUserProfileFunction = httpsCallable(functionsClient, 'users-getUserProfile');
    updateUserProfileFunction = httpsCallable(functionsClient, 'users-updateUserProfile');
    
    addAddressCallable = httpsCallable(functionsClient, 'users-addUserAddress');
    updateAddressCallable = httpsCallable(functionsClient, 'users-updateUserAddress');
    deleteAddressCallable = httpsCallable(functionsClient, 'users-deleteUserAddress');
    setDefaultAddressCallable = httpsCallable(functionsClient, 'users-setDefaultUserAddress');
    getUserOrdersCallable = httpsCallable(functionsClient, 'orders-getOrdersForUser');
    mergeGuestCartCallable = httpsCallable(functionsClient, 'cart-mergeGuestCart'); // NEW callable function
    addSavedItemCallable_AuthProvider = httpsCallable(functionsClient, 'savedItems-addCF');

  } catch (error) {
    console.error("AuthProvider: Error preparing callable functions:", error);
  }
}

const auth = getAuth(firebaseApp);
const functions = getFunctions(firebaseApp);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUserInternal, setFirebaseUserInternal] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [roles, setRoles] = useState<string[] | undefined>(undefined);
  const [wishlist, setWishlist] = useState<string[]>([]); // Wishlist state

  const fetchAndSetUserProfile = useCallback(async (fbUser: FirebaseUser | null) => {
    if (fbUser && getUserProfileFunction) {
      try {
        const result: HttpsCallableResult<UserProfileResponse> = await getUserProfileFunction();
        if (result.data.success && result.data.profile) {
          setUser(result.data.profile);
          setRoles(result.data.profile.roles);
          // Fetch initial user profile (including addresses) and wishlist after user is set
          if (fbUser) {
            fetchUserProfile(fbUser.uid);
            fetchUserWishlist(); // Fetch wishlist on initial load/login
          }
        } else {
          console.warn("Failed to fetch user profile or profile not found, using auth data as fallback:", result.data.error);
          // Fallback to basic info from Firebase Auth user if profile fetch fails
          setUser({
            id: fbUser.uid,
            email: fbUser.email || '',
            displayName: fbUser.displayName,
            photoURL: fbUser.photoURL,
            phoneNumber: fbUser.phoneNumber,
            // Set other fields to default/empty if not available
            roles: ['customer'], // Default role
            // addresses, preferences, etc., would be undefined or default
          });
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
        // Fallback if CF call fails
         setUser({
            id: fbUser.uid,
            email: fbUser.email || '',
            displayName: fbUser.displayName,
            photoURL: fbUser.photoURL,
            phoneNumber: fbUser.phoneNumber,
            roles: ['customer'],
          });
      }
    } else if (!fbUser) {
      setUser(null);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUserInternal(fbUser);
      await fetchAndSetUserProfile(fbUser);
    });
    return () => unsubscribe();
  }, [fetchAndSetUserProfile]);

  const fetchUserProfile = async (uid: string, forceRefresh: boolean = false) => {
    if (!auth.currentUser || !getUserProfileFunction) return;
    const currentUser = auth.currentUser;

    try {
      const result: HttpsCallableResult<UserProfileResponse> = await getUserProfileFunction();
      if (result.data.success && result.data.profile) {
        setUser(result.data.profile);
        setRoles(result.data.profile.roles);
        // Recursive call or incorrect condition, this needs review later
        // if (result.data.profile) {
        //   fetchUserProfile(result.data.profile.id); // Potentially problematic recursion
        //   fetchUserWishlist(); 
        // }
      } else {
        console.warn("Failed to fetch user profile or profile not found, using auth data as fallback:", result.data.error);
        if (currentUser && currentUser.uid === uid) {
          setUser({
            id: currentUser.uid,
            email: currentUser.email || '',
            displayName: currentUser.displayName,
            photoURL: currentUser.photoURL,
            phoneNumber: currentUser.phoneNumber,
            roles: ['customer'], 
            addresses: [], // Ensure addresses is initialized
            preferences: {}, // Ensure preferences is initialized
          });
        } else {
          // Cannot construct fallback if currentUser is not matching uid
          console.error('Cannot construct fallback user profile for uid:', uid);
        }
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      if (currentUser && currentUser.uid === uid) {
        setUser({
          id: currentUser.uid,
          email: currentUser.email || '',
          displayName: currentUser.displayName,
          photoURL: currentUser.photoURL,
          phoneNumber: currentUser.phoneNumber,
          roles: ['customer'],
          addresses: [], 
          preferences: {},
        });
      } else {
        console.error('Cannot construct fallback user profile on error for uid:', uid);
      }
    }
  };

  // Fetch user wishlist
  const fetchUserWishlist = async () => {
    if (!auth.currentUser) return;
    try {
      const getWishlistFunction = httpsCallable<unknown, { productIds: string[] }>(functions, 'wishlist-getWishlistCF');
      const result = await getWishlistFunction();
      setWishlist(result.data.productIds || []);
    } catch (error) {
      console.error("Error fetching wishlist:", error);
      // toast.error("Could not load your wishlist."); // Optional: notify user
      setWishlist([]); // Reset to empty on error
    }
  };

  const login = async (credentials: LoginCredentials): Promise<User | null> => {
    setIsLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, credentials.email, credentials.password);
      let loggedInUser: User | null = null;
      if (userCredential.user && getUserProfileFunction) {
        const result: HttpsCallableResult<UserProfileResponse> = await getUserProfileFunction();
        if (result.data.success && result.data.profile) {
          loggedInUser = result.data.profile;
          setUser(loggedInUser); 
          setRoles(loggedInUser.roles);
          await fetchUserWishlist();
        }
      }

      if (!loggedInUser) {
        const fbUser = userCredential.user;
        loggedInUser = {id: fbUser.uid, email: fbUser.email || '', displayName: fbUser.displayName, roles: ['customer']};
    setUser(loggedInUser);
        setRoles(loggedInUser.roles);
        await fetchUserWishlist(); 
      }
      
      if (loggedInUser) {
        // Merge Guest Wishlist (existing logic - ensure it completes before next merge)
        const guestWishlistItems = getGuestWishlist();
        if (guestWishlistItems.length > 0) {
          const uniqueGuestItems = new Set(guestWishlistItems);
          // Use Promise.all to wait for all wishlist merges if addToWishlist is async
          const wishlistMergePromises = Array.from(uniqueGuestItems).map(productId => {
            if (!wishlist.includes(productId)) { 
              return addToWishlist(productId).catch(mergeError => 
                console.error(`Error merging wishlist item ${productId}:`, mergeError)
              );
            }
            return Promise.resolve();
          });
          await Promise.all(wishlistMergePromises);
          clearGuestWishlist();
        }

        // Merge Guest Cart (existing logic - ensure it completes before next merge)
        if (mergeGuestCartCallable) {
          const guestCartItems = getGuestCart();
          if (guestCartItems.length > 0) {
            try {
              const mergeResult: HttpsCallableResult<MergeGuestCartCFResponse> = await mergeGuestCartCallable({ items: guestCartItems });
              if (mergeResult.data.success) {
                clearGuestCart();
                toast.success("Your guest cart items have been moved to your account.");
              } else {
                toast.error(mergeResult.data.error || "Could not merge guest cart.");
              }
            } catch (cartMergeError) {
              console.error("Error calling mergeGuestCartCF:", cartMergeError);
              toast.error("An error occurred while merging your guest cart.");
            }
          }
        }

        // Merge Guest Saved Items (NEW LOGIC)
        if (addSavedItemCallable_AuthProvider) {
          const guestSavedItems = getGuestSavedItems(); // This returns CartItemLocalStorage[]
          if (guestSavedItems.length > 0) {
            toast.loading("Migrating your saved items...", { id: 'merge-saved' });
            const savedItemMergePromises = guestSavedItems.map(item => {
              const payload: AddSavedItemCFPayload_AuthProvider = {
                productId: item.product.id,
                // Construct productData carefully based on what addSavedItemCF expects
                // (Pick<Product, 'id' | 'name' | 'price' | 'images'>)
                // item.product is a full Product object from CartItemLocalStorage
                productData: {
                  id: item.product.id,
                  name: item.product.name,
                  price: item.product.price,
                  images: item.product.images?.slice(0,1) || [] // Send first image or empty array
                }
              };
              return addSavedItemCallable_AuthProvider(payload).catch(mergeError => {
                console.error(`Error merging saved item ${item.product.id}:`, mergeError);
                // Don't let one failure stop others, but log it.
              });
            });
            try {
              await Promise.all(savedItemMergePromises);
              clearGuestSavedItems();
              toast.success("Your saved items have been moved to your account.", { id: 'merge-saved' });
            } catch (finalMergeError) {
              // This catch might not be strictly necessary if individual errors are caught above
              console.error("Error during final saved items merge batch:", finalMergeError);
              toast.error("Some saved items might not have been merged.", { id: 'merge-saved' });
            }
          }
        }
      }

      setIsLoading(false);
    return loggedInUser;

    } catch (error) {
      setIsLoading(false);
      console.error("Login error:", error);
      toast.error((error as FirebaseError).message || "Login failed. Please check your credentials.");
      throw error; 
    }
  };

  const register = async (data: RegisterData): Promise<User | null> => {
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const fbUser = userCredential.user;
      
      await firebaseUpdateProfile(fbUser, {
        displayName: data.name,
      });

      // Merge Guest Wishlist (existing logic - ensure it completes before next merge)
      const guestWishlistItems = getGuestWishlist();
      if (guestWishlistItems.length > 0) {
        const uniqueGuestItems = new Set(guestWishlistItems);
        const wishlistMergePromises = Array.from(uniqueGuestItems).map(productId => {
          if (!wishlist.includes(productId)) { 
            return addToWishlist(productId).catch(mergeError => 
              console.error(`Error merging wishlist item ${productId}:`, mergeError)
            );
          }
          return Promise.resolve();
        });
        await Promise.all(wishlistMergePromises);
        clearGuestWishlist();
      }

      // Merge Guest Cart (existing logic - ensure it completes before next merge)
      if (mergeGuestCartCallable) {
        const guestCartItems = getGuestCart();
        if (guestCartItems.length > 0) {
          try {
            const mergeResult: HttpsCallableResult<MergeGuestCartCFResponse> = await mergeGuestCartCallable({ items: guestCartItems });
            if (mergeResult.data.success) {
              clearGuestCart();
              toast.success("Your guest cart items have been moved to your account.");
            } else {
              toast.error(mergeResult.data.error || "Could not merge guest cart.");
            }
          } catch (cartMergeError) {
            console.error("Error calling mergeGuestCartCF:", cartMergeError);
            toast.error("An error occurred while merging your guest cart.");
          }
        }
      }
      
      // Merge Guest Saved Items (NEW LOGIC)
      if (addSavedItemCallable_AuthProvider) {
        const guestSavedItems = getGuestSavedItems();
        if (guestSavedItems.length > 0) {
          toast.loading("Migrating your saved items...", { id: 'merge-saved' });
          const savedItemMergePromises = guestSavedItems.map(item => {
            const payload: AddSavedItemCFPayload_AuthProvider = {
              productId: item.product.id,
              productData: {
                id: item.product.id,
                name: item.product.name,
                price: item.product.price,
                images: item.product.images?.slice(0,1) || []
              }
            };
            return addSavedItemCallable_AuthProvider(payload).catch(mergeError => {
              console.error(`Error merging saved item ${item.product.id}:`, mergeError);
            });
          });
          try {
            await Promise.all(savedItemMergePromises);
            clearGuestSavedItems();
            toast.success("Your saved items have been moved to your account.", { id: 'merge-saved' });
          } catch (finalMergeError) {
            console.error("Error during final saved items merge batch:", finalMergeError);
            toast.error("Some saved items might not have been merged.", { id: 'merge-saved' });
          }
        }
      }
      
      const registeredUser: User = {
        id: fbUser.uid,
        email: fbUser.email || '',
        displayName: data.name, 
        roles: ['customer'],
      };

      setIsLoading(false);
      return registeredUser; 

    } catch (error) {
      setIsLoading(false);
      console.error("Registration error:", error);
      const firebaseError = error as FirebaseError;
      if (firebaseError.code === 'auth/email-already-in-use') {
        toast.error("This email is already registered. Please login or use a different email.");
      } else {
        toast.error(firebaseError.message || "Registration failed. Please try again.");
      }
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    setIsLoading(true);
    try {
      await signOut(auth);
    setUser(null);
      setToken(null);
      setRoles(undefined);
      setWishlist([]); // Clear wishlist on logout
      // Clear any other user-specific state here
      toast.success("Logged out successfully!");
    } catch (error) {
      console.error("Logout error:", error);
      setIsLoading(false); // Ensure loading is false on error
      throw error;
    }
  };

  const updateProfile = async (data: UpdateUserProfileData): Promise<User | null> => {
    if (!firebaseUserInternal || !updateUserProfileFunction) {
      console.error("User not authenticated or update function not available for updateProfile.");
      return null;
    }
    setIsLoading(true);
    try {
      // Update Firebase Auth profile for displayName and photoURL if they exist in data
      const authUpdateData: { displayName?: string; photoURL?: string } = {};
      if (data.displayName) authUpdateData.displayName = data.displayName;
      if (data.photoURL) authUpdateData.photoURL = data.photoURL;
      
      if (Object.keys(authUpdateData).length > 0) {
        await firebaseUpdateProfile(firebaseUserInternal, authUpdateData);
      }

      // Call Cloud Function to update Firestore profile
      const result: HttpsCallableResult<UserProfileResponse> = await updateUserProfileFunction(data);
      if (result.data.success && result.data.profile) {
        setUser(result.data.profile); // Update context with the full profile from backend
        setIsLoading(false);
        setRoles(result.data.profile.roles);
        // Fetch initial user profile (including addresses) and wishlist after user is set
        if (result.data.profile) {
          fetchUserProfile(result.data.profile.id);
          fetchUserWishlist(); // Fetch wishlist on initial load/login
        }
        return result.data.profile;
      } else {
        console.error("Failed to update user profile in Firestore:", result.data.error);
        // Potentially refetch or use local data if backend update fails but auth update succeeded
        await fetchAndSetUserProfile(firebaseUserInternal); // Refetch to sync
        setIsLoading(false);
        return user; // Return current user from context
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      await fetchAndSetUserProfile(firebaseUserInternal); // Refetch on error to ensure sync
      setIsLoading(false);
      throw error;
    }
  };

  // --- Address Management Functions ---
  const addAddress = async (addressData: Omit<UserAddress, 'id'>): Promise<UserAddress | null> => {
    if (!firebaseUserInternal || !addAddressCallable) {
      console.error("User not authenticated or addAddress function not available.");
      throw new Error("Operation failed: User not authenticated or service unavailable.");
    }
    setIsLoading(true);
    try {
      const result: HttpsCallableResult<AddAddressCFResponse> = await addAddressCallable(addressData);
      if (result.data.success && result.data.address) {
        await fetchAndSetUserProfile(firebaseUserInternal); // Refetch profile to get updated addresses list
        setIsLoading(false);
        return result.data.address; // Return the newly added address
      } else {
        throw new Error(result.data.error || "Failed to add address.");
      }
    } catch (error) {
      console.error("Error adding address:", error);
      setIsLoading(false);
      throw error;
    }
  };

  const updateAddress = async (addressId: string, addressData: Partial<Omit<UserAddress, 'id'>>): Promise<UserAddress | null> => {
    if (!firebaseUserInternal || !updateAddressCallable) {
      console.error("User not authenticated or updateAddress function not available.");
      throw new Error("Operation failed: User not authenticated or service unavailable.");
    }
    setIsLoading(true);
    try {
      const payload: UpdateAddressCFPayload = { addressId, addressData };
      const result: HttpsCallableResult<UpdateAddressCFResponse> = await updateAddressCallable(payload);
      if (result.data.success && result.data.address) {
        await fetchAndSetUserProfile(firebaseUserInternal); // Refetch profile
        setIsLoading(false);
        return result.data.address;
      } else {
        throw new Error(result.data.error || "Failed to update address.");
      }
    } catch (error) {
      console.error("Error updating address:", error);
      setIsLoading(false);
      throw error;
    }
  };

  const deleteAddress = async (addressId: string): Promise<boolean> => {
    if (!firebaseUserInternal || !deleteAddressCallable) {
      console.error("User not authenticated or deleteAddress function not available.");
      throw new Error("Operation failed: User not authenticated or service unavailable.");
    }
    setIsLoading(true);
    try {
      const payload: DeleteAddressCFPayload = { addressId };
      const result: HttpsCallableResult<DeleteAddressCFResponse> = await deleteAddressCallable(payload);
      if (result.data.success) {
        await fetchAndSetUserProfile(firebaseUserInternal); // Refetch profile
        setIsLoading(false);
        return true;
      } else {
        throw new Error(result.data.error || "Failed to delete address.");
      }
    } catch (error) {
      console.error("Error deleting address:", error);
      setIsLoading(false);
      throw error;
    }
  };

  const setDefaultAddress = async (addressId: string): Promise<boolean> => {
    if (!firebaseUserInternal || !setDefaultAddressCallable) {
      console.error("User not authenticated or setDefaultAddress function not available.");
      throw new Error("Operation failed: User not authenticated or service unavailable.");
    }
    setIsLoading(true);
    try {
      const payload: SetDefaultAddressCFPayload = { addressId };
      const result: HttpsCallableResult<SetDefaultAddressCFResponse> = await setDefaultAddressCallable(payload);
      if (result.data.success) {
        await fetchAndSetUserProfile(firebaseUserInternal); // Refetch profile
        setIsLoading(false);
        return true;
      } else {
        throw new Error(result.data.error || "Failed to set default address.");
      }
    } catch (error) {
      console.error("Error setting default address:", error);
      setIsLoading(false);
      throw error;
    }
  };

  // --- End Address Management Functions ---

  // --- Order History Function ---
  const getUserOrders = async (limit?: number, startAfter?: any): Promise<GetUserOrdersResponse> => {
    if (!firebaseUserInternal || !getUserOrdersCallable) {
      console.error("User not authenticated or getUserOrders function not available.");
      throw new Error("Operation failed: User not authenticated or service unavailable.");
    }
    // No need to setIsLoading(true) here as this function is typically called on demand for a specific view,
    // and the view itself should handle its own loading state.
    try {
      const payload: GetUserOrdersCFPayload = { limit, startAfter };
      const result: HttpsCallableResult<GetUserOrdersResponse> = await getUserOrdersCallable(payload);
      if (result.data) { // Assuming the CF directly returns the GetUserOrdersResponse structure (which includes success implicitly or orders array)
        return result.data;
      } else {
        // This case should ideally not happen if CF always returns the structure or throws an error
        throw new Error("Failed to get user orders: Invalid response from server.");
      }
    } catch (error) {
      console.error("Error fetching user orders:", error);
      throw error; // Re-throw for the UI component to handle
    }
  };

  // --- End Order History Function ---

  const getWishlist = async (): Promise<string[]> => {
    if (!auth.currentUser) throw new Error("User not authenticated to get wishlist.");
    try {
      const getWishlistFunction = httpsCallable<unknown, { productIds: string[] }>(functions, 'wishlist-getWishlistCF');
      const result = await getWishlistFunction();
      setWishlist(result.data.productIds || []);
      return result.data.productIds || [];
    } catch (error) {
      console.error("Error calling getWishlistCF:", error);
      toast.error('Failed to refresh wishlist.');
      throw error; // Re-throw for caller to handle if needed
    }
  };

  const addToWishlist = async (productId: string): Promise<void> => {
    if (!auth.currentUser) throw new Error("User not authenticated to add to wishlist.");
    if (wishlist.includes(productId)) { 
      toast("Item already in wishlist.");
      return;
    }
    try {
      const addToWishlistFunction = httpsCallable<{productId: string}, {success: boolean}>(functions, 'wishlist-addToWishlistCF');
      await addToWishlistFunction({ productId });
      // Optimistic update or re-fetch
      setWishlist(prev => [...prev, productId]);
      toast.success("Added to wishlist!");
    } catch (error) {
      console.error("Error calling addToWishlistCF:", error);
      toast.error('Failed to add item to wishlist.');
      throw error;
    }
  };

  const removeFromWishlist = async (productId: string): Promise<void> => {
    if (!auth.currentUser) throw new Error("User not authenticated to remove from wishlist.");
    if (!wishlist.includes(productId)) {
      // Should not happen if UI is correct, but good to check
      console.warn("Attempted to remove item not in wishlist from AuthProvider");
      return;
    }
    try {
      const removeFromWishlistFunction = httpsCallable<{productId: string}, {success: boolean}>(functions, 'wishlist-removeFromWishlistCF');
      await removeFromWishlistFunction({ productId });
      // Optimistic update or re-fetch
      setWishlist(prev => prev.filter(id => id !== productId));
      toast.success("Removed from wishlist!");
    } catch (error) {
      console.error("Error calling removeFromWishlistCF:", error);
      toast.error('Failed to remove item from wishlist.');
      throw error;
    }
  };

  const isProductInWishlist = (productId: string): boolean => {
    return wishlist.includes(productId);
  };

  const contextValue: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user && !isLoading,
    token,
    roles,
    isAdmin: roles?.includes('admin') || false,
    login,
    register,
    logout,
    updateProfile,
    addAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
    getUserOrders,
    // Wishlist methods and state
    wishlist,
    getWishlist,
    addToWishlist,
    removeFromWishlist,
    isProductInWishlist,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};