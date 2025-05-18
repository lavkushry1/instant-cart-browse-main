import {
  firestoreDB as db, // Use firestoreDB aliased as db
  adminInstance // For FieldValue
} from '../lib/firebaseAdmin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

const WISHLISTS_COLLECTION = 'wishlists';

export interface WishlistItemBE {
  productId: string;
  addedAt: Timestamp; // admin.firestore.Timestamp
}

export const getWishlistBE = async (userId: string): Promise<string[]> => {
  try {
    const wishlistDoc = await db.collection(WISHLISTS_COLLECTION).doc(userId).get();
    if (wishlistDoc.exists) {
      const data = wishlistDoc.data();
      return data?.productIds || []; 
    }
    return [];
  } catch (error) {
    console.error('Error getting wishlist from BE:', error);
    throw new Error('Failed to get wishlist.');
  }
};

export const addToWishlistBE = async (userId: string, productId: string): Promise<void> => {
  try {
    const wishlistRef = db.collection(WISHLISTS_COLLECTION).doc(userId);
    await wishlistRef.set(
      {
        productIds: FieldValue.arrayUnion(productId),
        updatedAt: FieldValue.serverTimestamp(), 
      },
      { merge: true }
    );
  } catch (error) {
    console.error('Error adding to wishlist in BE:', error);
    throw new Error('Failed to add product to wishlist.');
  }
};

export const removeFromWishlistBE = async (userId: string, productId: string): Promise<void> => {
  try {
    const wishlistRef = db.collection(WISHLISTS_COLLECTION).doc(userId);
    await wishlistRef.update({
      productIds: FieldValue.arrayRemove(productId),
      updatedAt: FieldValue.serverTimestamp(),
    });
  } catch (error) {
    console.error('Error removing from wishlist in BE:', error);
    throw new Error('Failed to remove product from wishlist.');
  }
}; 