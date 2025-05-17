import * as functions from 'firebase-functions/v1';
// Use functions.https.CallableContext for typing context
import { addToWishlistBE, getWishlistBE, removeFromWishlistBE } from '../../../src/services/wishlistService'; // Corrected path

// Helper to check authentication
const ensureAuthenticated = (context: functions.https.CallableContext): string => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'The function must be called while authenticated.'
    );
  }
  return context.auth.uid;
};

interface WishlistRequestData {
  productId: string;
}

export const getWishlistCF = functions.https.onCall(async (data: unknown, context: functions.https.CallableContext) => {
  const userId = ensureAuthenticated(context);
  try {
    const productIds = await getWishlistBE(userId);
    return { productIds };
  } catch (error) {
    console.error('Error in getWishlistCF:', error);
    throw new functions.https.HttpsError('internal', 'Failed to get wishlist', (error as Error).message);
  }
});

export const addToWishlistCF = functions.https.onCall(async (data: WishlistRequestData, context: functions.https.CallableContext) => {
  const userId = ensureAuthenticated(context);
  const { productId } = data; // Now correctly typed
  if (!productId || typeof productId !== 'string') {
    // This check might be redundant if type system enforces WishlistRequestData correctly, but good for runtime safety
    throw new functions.https.HttpsError('invalid-argument', 'ProductId is required and must be a string.');
  }
  try {
    await addToWishlistBE(userId, productId);
    return { success: true, message: 'Product added to wishlist.' };
  } catch (error) {
    console.error('Error in addToWishlistCF:', error);
    throw new functions.https.HttpsError('internal', 'Failed to add to wishlist', (error as Error).message);
  }
});

export const removeFromWishlistCF = functions.https.onCall(async (data: WishlistRequestData, context: functions.https.CallableContext) => {
  const userId = ensureAuthenticated(context);
  const { productId } = data; // Now correctly typed
  if (!productId || typeof productId !== 'string') {
    // Redundant check, similar to above
    throw new functions.https.HttpsError('invalid-argument', 'ProductId is required and must be a string.');
  }
  try {
    await removeFromWishlistBE(userId, productId);
    return { success: true, message: 'Product removed from wishlist.' };
  } catch (error) {
    console.error('Error in removeFromWishlistCF:', error);
    throw new functions.https.HttpsError('internal', 'Failed to remove from wishlist', (error as Error).message);
  }
}); 