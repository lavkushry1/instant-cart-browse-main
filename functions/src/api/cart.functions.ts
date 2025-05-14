// functions/src/api/cart.functions.ts

import * as functions from 'firebase-functions';
import {
  getUserCartBE,
  setItemInUserCartBE,
  clearUserCartBE,
} from '../../../src/services/cartService'; // Adjust path
import { UserCartBE } from '../../../src/services/cartService';

const ensureAuthenticated = (context: functions.https.CallableContext): string => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated to perform this action.');
  }
  return context.auth.uid;
};

console.log("(Cloud Functions) cart.functions.ts: Initializing with LIVE logic...");

export const getUserCartCF = functions.https.onCall(async (data, context) => {
  console.log("(Cloud Function) getUserCartCF called.");
  const userId = ensureAuthenticated(context);
  try {
    const cart = await getUserCartBE(userId);
    // The cart from BE contains only productIds and quantities.
    // Client is responsible for fetching full product details if needed for display.
    if (cart) {
        return { success: true, cart };
    }
    // If no cart exists in DB, return an empty cart structure for the user.
    return { success: true, cart: { userId, items: [], updatedAt: null } }; 
  } catch (error: any) {
    console.error("Error in getUserCartCF:", error);
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError('internal', error.message || 'Failed to get user cart.');
  }
});

export const setItemInUserCartCF = functions.https.onCall(async (data: { productId: string; quantity: number }, context) => {
  console.log("(Cloud Function) setItemInUserCartCF called with data:", data);
  const userId = ensureAuthenticated(context);
  try {
    const { productId, quantity } = data;
    if (!productId || typeof quantity !== 'number' || quantity < 0) { // Quantity cannot be negative
      throw new functions.https.HttpsError('invalid-argument', 'Product ID and a non-negative quantity (number) are required.');
    }
    // TODO: Add validation for quantity if necessary (e.g., max cart item quantity).
    // Optionally, check product existence and stock before adding to cart, though stock check is often better at checkout.
    const updatedCart = await setItemInUserCartBE(userId, productId, quantity);
    return { success: true, cart: updatedCart };
  } catch (error: any) {
    console.error("Error in setItemInUserCartCF:", error);
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError('internal', error.message || 'Failed to update item in cart.');
  }
});

export const clearUserCartCF = functions.https.onCall(async (data, context) => {
  console.log("(Cloud Function) clearUserCartCF called.");
  const userId = ensureAuthenticated(context);
  try {
    await clearUserCartBE(userId);
    return { success: true, message: 'Cart cleared successfully.' };
  } catch (error: any) {
    console.error("Error in clearUserCartCF:", error);
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError('internal', error.message || 'Failed to clear cart.');
  }
});
