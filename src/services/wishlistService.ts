import { db as firestore } from '../lib/firebaseAdmin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

const WISHLISTS_COLLECTION = 'wishlists';

export interface WishlistItemBE {
  productId: string;
  addedAt: Timestamp;
}

/**
 * Retrieves the product IDs from a user's wishlist.
 * @param userId The ID of the user.
 * @returns A promise that resolves to an array of product IDs.
 */
export const getWishlistBE = async (userId: string): Promise<string[]> => {
  try {
    const wishlistDoc = await firestore.collection(WISHLISTS_COLLECTION).doc(userId).get();
    if (wishlistDoc.exists) {
      const data = wishlistDoc.data();
      // Assuming wishlist items are stored in an array of objects { productId, addedAt }
      // and we just want the product IDs for now.
      // Or, if productIds is directly an array of strings.
      // Let's assume a subcollection 'items' or an array field 'productItems' for more structure
      // For simplicity with current request: using an array of productIds directly on the user's wishlist doc.
      return data?.productIds || []; 
    }
    return [];
  } catch (error) {
    console.error('Error getting wishlist from BE:', error);
    throw new Error('Failed to get wishlist.');
  }
};

/**
 * Adds a product to the user's wishlist.
 * @param userId The ID of the user.
 * @param productId The ID of the product to add.
 */
export const addToWishlistBE = async (userId: string, productId: string): Promise<void> => {
  try {
    const wishlistRef = firestore.collection(WISHLISTS_COLLECTION).doc(userId);
    await wishlistRef.set(
      {
        productIds: FieldValue.arrayUnion(productId),
        updatedAt: FieldValue.serverTimestamp(), // Keep track of updates
      },
      { merge: true }
    );
  } catch (error) {
    console.error('Error adding to wishlist in BE:', error);
    throw new Error('Failed to add product to wishlist.');
  }
};

/**
 * Removes a product from the user's wishlist.
 * @param userId The ID of the user.
 * @param productId The ID of the product to remove.
 */
export const removeFromWishlistBE = async (userId: string, productId: string): Promise<void> => {
  try {
    const wishlistRef = firestore.collection(WISHLISTS_COLLECTION).doc(userId);
    await wishlistRef.update({
      productIds: FieldValue.arrayRemove(productId),
      updatedAt: FieldValue.serverTimestamp(),
    });
  } catch (error) {
    console.error('Error removing from wishlist in BE:', error);
    throw new Error('Failed to remove product from wishlist.');
  }
}; 