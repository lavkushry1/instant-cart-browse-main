import * as functions from 'firebase-functions/v1';
import {
  getUserCartBE,
  setItemInUserCartBE,
  clearUserCartBE,
  mergeGuestCartToFirestore,
  ProductInCartBE, // Import type for mapping
  UserCartBE // Import for return type if needed
} from '../services/cartService'; 

// Client-side Product structure (subset for setItem)
// This aligns with what setItemInUserCartBE needs for productData
interface ProductDataForCF {
  id: string;
  name: string;
  price: number;
  images?: string[];
  // Other fields client might send, that can be mapped to ProductInCartBE
}

// Data structure for setItemInUserCartCF
interface SetItemData {
  productId: string;
  quantity: number;
  product: ProductDataForCF; // Client sends product details
}

// Client-side CartItem structure for mergeGuestCartCF
interface ClientMergeCartItem {
  id: string; 
  product: { id: string; name: string; price: number; images?: string[] }; // More specific product type
  quantity: number;
}

const ensureAuthenticated = (context: functions.https.CallableContext): string => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated to perform this action.');
  }
  return context.auth.uid;
};

console.log("(Cloud Functions) cart.functions.ts: Initializing...");

export const getUserCartCF = functions.https.onCall(async (_data, context) => {
  functions.logger.info("(Cloud Function) getUserCartCF called.");
  const userId = ensureAuthenticated(context);
  try {
    const cart = await getUserCartBE(userId);
    if (cart) { // getUserCartBE returns UserCartBE | null
        return { success: true, cart };
    }
    // If service returns null (e.g. error or explicitly for not found if not returning empty cart)
    // We can choose to return an error or an empty cart structure.
    // Based on getUserCartBE returning {userId, items:[]} for empty, null means an error.
    throw new functions.https.HttpsError('internal', 'Failed to get user cart. Service returned null.');
  } catch (error: unknown) {
    functions.logger.error("Error in getUserCartCF:", error);
    if (error instanceof functions.https.HttpsError) throw error;
    const message = error instanceof Error ? error.message : 'Failed to get user cart.';
    throw new functions.https.HttpsError('internal', message);
  }
});

export const setItemInUserCartCF = functions.https.onCall(async (data: SetItemData, context) => {
  functions.logger.info("(Cloud Function) setItemInUserCartCF called with data:", data);
  const userId = ensureAuthenticated(context);
  try {
    const { productId, quantity, product } = data;
    if (!productId || typeof quantity !== 'number' || product?.id !== productId) {
      throw new functions.https.HttpsError('invalid-argument', 'Valid Product ID, quantity, and matching product data are required.');
    }

    // Map client product data to ProductInCartBE for the service
    const productDataForService: ProductInCartBE = {
      id: product.id,
      name: product.name,
      price: product.price,
      images: product.images && product.images.length > 0 ? product.images.slice(0,1) : [], // Example: take first image
    };

    const updatedCart = await setItemInUserCartBE(userId, productId, quantity, productDataForService);
    if (updatedCart) {
      return { success: true, cart: updatedCart };
    } else {
      throw new functions.https.HttpsError('internal', 'Failed to update item in cart. Service returned null.');
    }
  } catch (error: unknown) {
    functions.logger.error("Error in setItemInUserCartCF:", error);
    if (error instanceof functions.https.HttpsError) throw error;
    const message = error instanceof Error ? error.message : 'Failed to update item in cart.';
    throw new functions.https.HttpsError('internal', message);
  }
});

export const clearUserCartCF = functions.https.onCall(async (_data, context) => {
  functions.logger.info("(Cloud Function) clearUserCartCF called.");
  const userId = ensureAuthenticated(context);
  try {
    const result = await clearUserCartBE(userId);
    if (result.success) {
      return { success: true, message: 'Cart cleared successfully.' };
    } else {
      throw new functions.https.HttpsError('internal', result.error || 'Failed to clear cart.');
    }
  } catch (error: unknown) {
    functions.logger.error("Error in clearUserCartCF:", error);
    if (error instanceof functions.https.HttpsError) throw error;
    const message = error instanceof Error ? error.message : 'Failed to clear cart.';
    throw new functions.https.HttpsError('internal', message);
  }
});

export const mergeGuestCartCF = functions.https.onCall(async (data: { items: ClientMergeCartItem[] }, context) => {
  functions.logger.info("(Cloud Function) mergeGuestCartCF called with item count:", data.items?.length);
  const uid = ensureAuthenticated(context);

  if (!Array.isArray(data.items)) {
    functions.logger.error('Invalid data: items must be an array.', data);
    throw new functions.https.HttpsError('invalid-argument', 'Invalid data format: items must be an array.');
  }

  try {
    const result = await mergeGuestCartToFirestore(uid, data.items);
    if (result.success) {
      return { success: true, message: 'Guest cart merged successfully.' };
    } else {
      functions.logger.error('mergeGuestCartToFirestore failed:', result.error);
      throw new functions.https.HttpsError('internal', result.error || 'Failed to merge guest cart.');
    }
  } catch (error: unknown) {
    functions.logger.error("Error in mergeGuestCartCF:", error);
    if (error instanceof functions.https.HttpsError) throw error;
    const message = error instanceof Error ? error.message : 'An internal error occurred while merging the cart.';
    throw new functions.https.HttpsError('internal', message);
  }
});
