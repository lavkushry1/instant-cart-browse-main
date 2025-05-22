import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

// Use shared admin instance
import { firestoreDB as firestore, adminInstance } from '../lib/firebaseAdmin';

// const auth = admin.auth(); // If needed for auth operations

// Simplified Product structure for cart items on the backend
// This should capture essential details from the client's Product type
export interface ProductInCartBE {
  id: string;
  name: string;
  price: number;
  images?: string[]; // Storing the first image might be enough or all if needed
  // Add any other fields from client Product type that are essential for cart display/processing
  // e.g., stock for validation, category for analytics, etc.
  // For simplicity, keeping it minimal for now.
}

// Backend representation of a cart item
export interface CartItemBE {
  productId: string; // Redundant if product.id is always present, but can be useful
  quantity: number;
  product: ProductInCartBE; // Embed product details
  addedAt: admin.firestore.Timestamp; // Keep track of when it was added/updated
}

// Interface for the whole user cart document/object
export interface UserCartBE {
  userId: string;
  items: CartItemBE[];
  lastUpdatedAt?: admin.firestore.Timestamp; // Optional: to track overall cart changes
}

// Client-side CartItemLocalStorage structure (from localStorageUtils.ts)
// This is what the Cloud Function will receive.
// We need to map this to CartItemBE if there are differences or use it directly if compatible.
// Assuming CartItemLocalStorage sends product: Product (full client Product type)
interface ClientCartItem {
  id: string; // This is product.id from client
  product: { id: string; name: string; price: number; images?: string[] }; // More specific type for product
  quantity: number;
}


/**
 * Merges items from a guest's cart into a logged-in user's Firestore cart.
 *
 * @param uid The user's ID.
 * @param guestItems An array of cart items from the guest's session.
 * @returns A promise that resolves to an object indicating success or failure.
 */
export const mergeGuestCartToFirestore = async (
  uid: string,
  guestItems: ClientCartItem[]
): Promise<{ success: boolean; error?: string }> => {
  if (!uid) {
    functions.logger.error('User ID is undefined in mergeGuestCartToFirestore');
    return { success: false, error: 'User authentication error.' };
  }
  if (!guestItems || guestItems.length === 0) {
    return { success: true }; // Nothing to merge
  }

  const userCartCollectionRef = firestore.collection('users').doc(uid).collection('cart');
  const batch = firestore.batch();

  try {
    functions.logger.info(`Starting cart merge for user ${uid}. Items to merge: ${guestItems.length}`);

    for (const guestItem of guestItems) {
      if (!guestItem.product || !guestItem.product.id || typeof guestItem.quantity !== 'number' || guestItem.quantity <= 0) {
        functions.logger.warn('Skipping invalid guest cart item:', guestItem);
        continue;
      }

      const productId = guestItem.product.id;
      const productDocRef = userCartCollectionRef.doc(productId);
      
      // Prepare product data for Firestore, selecting only necessary fields
      // from the potentially large client-side product object.
      const productDataForBE: ProductInCartBE = {
        id: productId,
        name: guestItem.product.name || 'Unnamed Product',
        price: guestItem.product.price || 0,
        images: guestItem.product.images && guestItem.product.images.length > 0 ? [guestItem.product.images[0]] : [],
        // Map other essential fields from guestItem.product to ProductInCartBE if needed
      };

      try {
        const docSnapshot = await productDocRef.get();
        const nowTimestamp = adminInstance.firestore.Timestamp.now(); // Use adminInstance

        if (docSnapshot.exists) {
          // Item exists, update quantity
          const existingData = docSnapshot.data() as CartItemBE;
          const newQuantity = (existingData.quantity || 0) + guestItem.quantity;
          batch.update(productDocRef, { 
            quantity: newQuantity,
            addedAt: nowTimestamp, // Update timestamp
            // Optionally re-update product details if they can change, though typically cart merge focuses on quantity
            // product: productDataForBE 
          });
          functions.logger.info(`Updating quantity for product ${productId} to ${newQuantity} for user ${uid}.`);
        } else {
          // Item does not exist, add new cart item
          const newCartItem: CartItemBE = {
            productId: productId,
            quantity: guestItem.quantity,
            product: productDataForBE,
            addedAt: nowTimestamp, // Use variable from adminInstance
          };
          batch.set(productDocRef, newCartItem);
          functions.logger.info(`Adding new product ${productId} with quantity ${guestItem.quantity} for user ${uid}.`);
        }
      } catch (docError) {
        functions.logger.error(`Error processing product ${productId} for user ${uid} during merge:`, docError);
        // Decide if one item failure should stop the whole batch or just skip this item.
        // For now, we continue processing other items but the batch might fail later if this error is critical.
        // If we want to ensure all-or-nothing, we might throw here and catch outside the loop.
      }
    }

    await batch.commit();
    functions.logger.info(`Successfully merged guest cart for user ${uid}.`);
    return { success: true };
  } catch (error) {
    functions.logger.error(`Error merging guest cart to Firestore for user ${uid}:`, error);
    if (error instanceof Error) {
        return { success: false, error: error.message };
    }
    return { success: false, error: 'An unknown error occurred during cart merge.' };
  }
}; 

/**
 * Retrieves a user's cart from Firestore.
 *
 * @param uid The user's ID.
 * @returns A promise that resolves to the UserCartBE object or null if not found/error.
 */
export const getUserCartBE = async (uid: string): Promise<UserCartBE | null> => {
  if (!uid) {
    functions.logger.error('User ID is undefined in getUserCartBE');
    return null;
  }
  try {
    const cartItems: CartItemBE[] = [];
    const userCartCollectionRef = firestore.collection('users').doc(uid).collection('cart');
    const snapshot = await userCartCollectionRef.orderBy('addedAt', 'desc').get(); // Get items, optionally order them

    if (snapshot.empty) {
      functions.logger.info(`No cart items found for user ${uid}.`);
      // Return an empty cart structure rather than null, for consistency
      return { userId: uid, items: [] }; 
    }

    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.productId && data.quantity && data.product && data.addedAt) {
        cartItems.push({
          productId: data.productId,
          quantity: data.quantity,
          product: data.product as ProductInCartBE, 
          addedAt: data.addedAt as admin.firestore.Timestamp, 
        });
      } else {
        functions.logger.warn(`Skipping cart item with invalid structure for user ${uid}, docId ${doc.id}:`, data);
      }
    });
    
    functions.logger.info(`Retrieved ${cartItems.length} cart items for user ${uid}.`);
    return { userId: uid, items: cartItems };

  } catch (error) {
    functions.logger.error(`Error retrieving cart for user ${uid}:`, error);
    return null; 
  }
};

/**
 * Adds or updates an item in the user's Firestore cart. 
 * If quantity is 0 or less, the item is removed.
 *
 * @param uid The user's ID.
 * @param productId The ID of the product.
 * @param quantity The new quantity for the product.
 * @param productData The product details (ProductInCartBE) if adding/updating significantly.
 *                    If null, it implies only quantity update or removal.
 * @returns A promise that resolves to the updated UserCartBE or null on error.
 */
export const setItemInUserCartBE = async (
  uid: string,
  productId: string,
  quantity: number,
  // Product data is crucial if the item is new or needs its details updated.
  // For a simple quantity update of an existing item, this might be partially redundant
  // if we only trust the client for productId and quantity, but good for new items.
  productData: ProductInCartBE 
): Promise<UserCartBE | null> => {
  if (!uid || !productId) {
    functions.logger.error('User ID and Product ID are required in setItemInUserCartBE');
    return null; 
  }

  const productDocRef = firestore.collection('users').doc(uid).collection('cart').doc(productId);

  try {
    if (quantity <= 0) {
      await productDocRef.delete();
      functions.logger.info(`Removed product ${productId} from cart for user ${uid}.`);
    } else {
      if (!productData || productData.id !== productId) {
        functions.logger.warn(`Product data for ${productId} might be incomplete or mismatched in setItemInUserCartBE.`);
      }
      const cartItemData: CartItemBE = {
        productId: productId,
        quantity: quantity,
        product: {
          id: productData.id || productId, 
          name: productData.name || 'Unnamed Product',
          price: productData.price || 0,
          images: productData.images || [],
        },
        addedAt: adminInstance.firestore.Timestamp.now(), // Use adminInstance
      };
      await productDocRef.set(cartItemData, { merge: true }); 
      functions.logger.info(`Set product ${productId} with quantity ${quantity} for user ${uid}.`);
    }
    return await getUserCartBE(uid);
  } catch (error) {
    functions.logger.error(`Error setting item ${productId} in cart for user ${uid}:`, error);
    return null; 
  }
};

/**
 * Clears all items from a user's Firestore cart.
 *
 * @param uid The user's ID.
 * @returns A promise that resolves to an object indicating success or failure.
 */
export const clearUserCartBE = async (uid: string): Promise<{ success: boolean; error?: string }> => {
  if (!uid) {
    functions.logger.error('User ID is undefined in clearUserCartBE');
    return { success: false, error: 'User ID cannot be empty.' };
  }

  const userCartCollectionRef = firestore.collection('users').doc(uid).collection('cart');

  try {
    const snapshot = await userCartCollectionRef.get();
    if (snapshot.empty) {
      functions.logger.info(`Cart is already empty for user ${uid}.`);
      return { success: true };
    }

    const batch = firestore.batch();
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();

    functions.logger.info(`Successfully cleared cart for user ${uid}. Deleted ${snapshot.size} items.`);
    return { success: true };

  } catch (error) {
    functions.logger.error(`Error clearing cart for user ${uid}:`, error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'An unknown error occurred while clearing the cart.' };
  }
}; 