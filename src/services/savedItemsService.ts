import * as admin from 'firebase-admin'; // Import the full admin SDK
import { db, adminInstance } from '../lib/firebaseAdmin'; // Adjusted for functions/src/services location
import { Product } from '@/types/product'; // Adjusted for functions/src/services location

const USERS_COLLECTION = 'users';
const SAVED_ITEMS_SUBCOLLECTION = 'savedForLaterItems';
const CART_ITEMS_SUBCOLLECTION = 'cart'; // Path to user's cart items

// Interface for the actual data stored for a product within a saved item
export interface SavedProductDataBE {
  id: string; // productId
  name: string;
  price: number;
  images?: string[]; // Storing first image primarily
}

// Interface for the saved item document in Firestore
export interface SavedItemBE {
  productId: string; // Redundant if doc ID is productId, but good for data shaping
  product: SavedProductDataBE;
  addedAt: admin.firestore.Timestamp;
}

// Simplified Product structure for cart items on the backend
interface ProductDetailInCartBE {
  id: string;
  name: string;
  price: number;
  images?: string[];
}

// Backend representation of a cart item (for writing to Firestore)
interface CartItemDataBE {
  productId: string;
  quantity: number;
  product: ProductDetailInCartBE; 
  addedAt: admin.firestore.Timestamp; 
}

/**
 * Adds an item to the user's saved for later list.
 * The document ID in the subcollection will be the productId.
 */
export const addSavedItemBE = async (
  userId: string,
  productId: string,
  productDataInput: Pick<Product, 'id' | 'name' | 'price' | 'images'> // Input from client usually a Product
): Promise<SavedItemBE> => {
  console.log(`(Service-Backend @src) addSavedItemBE for user ${userId}, product ${productId}`);
  if (!userId || !productId || !productDataInput) {
    throw new Error('User ID, Product ID, and Product Data are required.');
  }

  const userSavedItemsRef = db.collection(USERS_COLLECTION).doc(userId).collection(SAVED_ITEMS_SUBCOLLECTION);
  const savedItemRef = userSavedItemsRef.doc(productId); // Use productId as document ID

  const productDataForSave: SavedProductDataBE = {
    id: productDataInput.id, // Should be same as productId
    name: productDataInput.name,
    price: productDataInput.price,
    images: productDataInput.images && productDataInput.images.length > 0 ? [productDataInput.images[0]] : [], // Store first image
  };

  const dataToSave: Omit<SavedItemBE, 'productId'> = { // productId is the doc ID
    product: productDataForSave,
    addedAt: admin.firestore.Timestamp.now(), // Corrected usage
  };

  await savedItemRef.set(dataToSave);
  
  // Construct the full SavedItemBE to return, including the productId from the doc ID
  return {
    ...dataToSave,
    productId: savedItemRef.id,
  } as SavedItemBE;
};

/**
 * Removes an item from the user's saved for later list.
 */
export const removeSavedItemBE = async (
  userId: string,
  productId: string
): Promise<void> => {
  console.log(`(Service-Backend @src) removeSavedItemBE for user ${userId}, product ${productId}`);
  if (!userId || !productId) {
    throw new Error('User ID and Product ID are required.');
  }
  const savedItemRef = db.collection(USERS_COLLECTION).doc(userId).collection(SAVED_ITEMS_SUBCOLLECTION).doc(productId);
  await savedItemRef.delete();
  console.log(`(Service-Backend @src) Product ${productId} removed from saved for later for user ${userId}.`);
};

/**
 * Retrieves all saved for later items for a user.
 */
export const getSavedItemsBE = async (userId: string): Promise<SavedItemBE[]> => {
  console.log(`(Service-Backend @src) getSavedItemsBE for user ${userId}`);
  if (!userId) {
    throw new Error('User ID is required.');
  }
  const userSavedItemsRef = db.collection(USERS_COLLECTION).doc(userId).collection(SAVED_ITEMS_SUBCOLLECTION);
  const snapshot = await userSavedItemsRef.orderBy('addedAt', 'desc').get();

  if (snapshot.empty) {
    return [];
  }
  return snapshot.docs.map(doc => ({
    productId: doc.id, // productId from the document ID
    ...(doc.data() as Omit<SavedItemBE, 'productId'>),
  } as SavedItemBE));
};

/**
 * Moves an item from the user's saved for later list to their main shopping cart.
 * Uses a transaction to ensure atomicity.
 * Assumes quantity of 1 when moving to cart.
 */
export const moveSavedItemToCartBE = async (
  userId: string,
  productId: string
): Promise<void> => { // Returns void, client will refetch cart
  console.log(`(Service-Backend @src) moveSavedItemToCartBE for user ${userId}, product ${productId}`);
  if (!userId || !productId) {
    throw new Error('User ID and Product ID are required.');
  }

  const savedItemRef = db.collection(USERS_COLLECTION).doc(userId).collection(SAVED_ITEMS_SUBCOLLECTION).doc(productId);
  const cartItemRef = db.collection(USERS_COLLECTION).doc(userId).collection(CART_ITEMS_SUBCOLLECTION).doc(productId); // Path based on cartService structure

  try {
    await db.runTransaction(async (transaction) => {
      const savedItemDoc = await transaction.get(savedItemRef);
      if (!savedItemDoc.exists) {
        throw new Error(`Saved item ${productId} not found for user ${userId}.`);
      }
      const savedItemData = savedItemDoc.data() as SavedItemBE;

      // Prepare product data for the cart item (similar to ProductInCartBE)
      // This maps SavedProductDataBE to ProductInCartBE if they are different,
      // but they are very similar here.
      const productDataForCart: ProductDetailInCartBE = {
        id: savedItemData.product.id, 
        name: savedItemData.product.name,
        price: savedItemData.product.price,
        images: savedItemData.product.images,
      };

      // Prepare the cart item
      const cartItemToSet: CartItemDataBE = {
        productId: productId,
        quantity: 1, // Default to quantity 1 when moving from saved
        product: productDataForCart,
        addedAt: admin.firestore.Timestamp.now(),
      };

      // Set the item in the main cart (this will add or overwrite)
      transaction.set(cartItemRef, cartItemToSet);

      // Delete the item from saved for later list
      transaction.delete(savedItemRef);
    });

    console.log(`(Service-Backend @src) Product ${productId} moved from saved to cart for user ${userId}.`);
    // No return value needed here as client will refetch cart

  } catch (error) {
    console.error(`(Service-Backend @src) Error moving saved item ${productId} to cart for user ${userId}:`, error);
    // Propagate the error or return null/specific error object
    if (error instanceof Error) {
        throw error; // Re-throw the error to be handled by the caller (e.g., Cloud Function)
    }
    throw new Error('Failed to move item to cart.');
  }
}; 