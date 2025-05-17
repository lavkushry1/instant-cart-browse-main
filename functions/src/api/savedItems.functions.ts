import * as functions from 'firebase-functions/v1';
import {
  addSavedItemBE,
  removeSavedItemBE,
  getSavedItemsBE,
  moveSavedItemToCartBE,
  SavedProductDataBE, // Import the type for use here
} from '../services/savedItemsServiceBE'; // Corrected path to BE service
import { adminInstance } from '../lib/firebaseAdmin'; // Corrected path for adminInstance

// Initialize Firebase Admin SDK (idempotent call via import)
adminInstance; // Ensures firebaseAdmin.ts runs and initializes SDK

console.log('(Cloud Functions) savedItems.functions.ts: Initializing...');

const ensureAuthenticated = (context: functions.https.CallableContext): string => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'The function must be called while authenticated.'
    );
  }
  return context.auth.uid;
};

export const addSavedItemCF = functions.https.onCall(async (data, context) => {
  const userId = ensureAuthenticated(context);
  // Expect data to conform to SavedProductDataBE for productData part
  const { productId, productData } = data as { productId: string, productData: SavedProductDataBE };

  if (!productId || !productData || productData.id !== productId || !productData.name || typeof productData.price !== 'number') {
    throw new functions.https.HttpsError('invalid-argument', 'Product ID and essential product data (id, name, price) are required.');
  }
  try {
    console.log(`(CF) addSavedItemCF: User: ${userId}, Product: ${productId}`)
    // productData now directly matches SavedProductDataBE
    const savedItem = await addSavedItemBE(userId, productId, productData);
    return { success: true, savedItem };
  } catch (error) {
    console.error('(CF) Error in addSavedItemCF:', error);
    const err = error as Error;
    throw new functions.https.HttpsError('internal', err.message || 'Failed to add item to saved list.');
  }
});

export const removeSavedItemCF = functions.https.onCall(async (data, context) => {
  const userId = ensureAuthenticated(context);
  const { productId } = data as { productId: string };

  if (!productId) {
    throw new functions.https.HttpsError('invalid-argument', 'Product ID is required.');
  }
  try {
    console.log(`(CF) removeSavedItemCF: User: ${userId}, Product: ${productId}`)
    await removeSavedItemBE(userId, productId);
    return { success: true };
  } catch (error) {
    console.error('(CF) Error in removeSavedItemCF:', error);
    const err = error as Error;
    throw new functions.https.HttpsError('internal', err.message || 'Failed to remove item from saved list.');
  }
});

export const getSavedItemsCF = functions.https.onCall(async (_data, context) => {
  const userId = ensureAuthenticated(context);
  try {
    console.log(`(CF) getSavedItemsCF: User: ${userId}`)
    const savedItems = await getSavedItemsBE(userId);
    return { success: true, savedItems };
  } catch (error) {
    console.error('(CF) Error in getSavedItemsCF:', error);
    const err = error as Error;
    throw new functions.https.HttpsError('internal', err.message || 'Failed to retrieve saved items.');
  }
});

export const moveSavedItemToCartCF = functions.https.onCall(async (data, context) => {
  const userId = ensureAuthenticated(context);
  const { productId } = data as { productId: string };

  if (!productId) {
    throw new functions.https.HttpsError('invalid-argument', 'Product ID is required.');
  }
  try {
    console.log(`(CF) moveSavedItemToCartCF: User: ${userId}, Product: ${productId}`)
    // moveSavedItemToCartBE now returns Promise<void>, so we don't expect updatedCart here.
    // The client will be responsible for refetching the cart.
    await moveSavedItemToCartBE(userId, productId);
    return { success: true }; // Indicate success, client refetches cart
  } catch (error) {
    console.error('(CF) Error in moveSavedItemToCartCF:', error);
    const err = error as Error;
    throw new functions.https.HttpsError('internal', err.message || 'Failed to move item to cart.');
  }
}); 