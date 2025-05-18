"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearUserCartBE = exports.setItemInUserCartBE = exports.getUserCartBE = exports.mergeGuestCartToFirestore = void 0;
const functions = __importStar(require("firebase-functions"));
// Use shared admin instance
const firebaseAdmin_1 = require("../lib/firebaseAdmin");
/**
 * Merges items from a guest's cart into a logged-in user's Firestore cart.
 *
 * @param uid The user's ID.
 * @param guestItems An array of cart items from the guest's session.
 * @returns A promise that resolves to an object indicating success or failure.
 */
const mergeGuestCartToFirestore = async (uid, guestItems) => {
    if (!uid) {
        functions.logger.error('User ID is undefined in mergeGuestCartToFirestore');
        return { success: false, error: 'User authentication error.' };
    }
    if (!guestItems || guestItems.length === 0) {
        return { success: true }; // Nothing to merge
    }
    const userCartCollectionRef = firebaseAdmin_1.firestoreDB.collection('users').doc(uid).collection('cart');
    const batch = firebaseAdmin_1.firestoreDB.batch();
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
            const productDataForBE = {
                id: productId,
                name: guestItem.product.name || 'Unnamed Product',
                price: guestItem.product.price || 0,
                images: guestItem.product.images && guestItem.product.images.length > 0 ? [guestItem.product.images[0]] : [],
                // Map other essential fields from guestItem.product to ProductInCartBE if needed
            };
            try {
                const docSnapshot = await productDocRef.get();
                const nowTimestamp = firebaseAdmin_1.adminInstance.firestore.Timestamp.now(); // Use adminInstance
                if (docSnapshot.exists) {
                    // Item exists, update quantity
                    const existingData = docSnapshot.data();
                    const newQuantity = (existingData.quantity || 0) + guestItem.quantity;
                    batch.update(productDocRef, {
                        quantity: newQuantity,
                        addedAt: nowTimestamp, // Update timestamp
                        // Optionally re-update product details if they can change, though typically cart merge focuses on quantity
                        // product: productDataForBE 
                    });
                    functions.logger.info(`Updating quantity for product ${productId} to ${newQuantity} for user ${uid}.`);
                }
                else {
                    // Item does not exist, add new cart item
                    const newCartItem = {
                        productId: productId,
                        quantity: guestItem.quantity,
                        product: productDataForBE,
                        addedAt: nowTimestamp, // Use variable from adminInstance
                    };
                    batch.set(productDocRef, newCartItem);
                    functions.logger.info(`Adding new product ${productId} with quantity ${guestItem.quantity} for user ${uid}.`);
                }
            }
            catch (docError) {
                functions.logger.error(`Error processing product ${productId} for user ${uid} during merge:`, docError);
                // Decide if one item failure should stop the whole batch or just skip this item.
                // For now, we continue processing other items but the batch might fail later if this error is critical.
                // If we want to ensure all-or-nothing, we might throw here and catch outside the loop.
            }
        }
        await batch.commit();
        functions.logger.info(`Successfully merged guest cart for user ${uid}.`);
        return { success: true };
    }
    catch (error) {
        functions.logger.error(`Error merging guest cart to Firestore for user ${uid}:`, error);
        if (error instanceof Error) {
            return { success: false, error: error.message };
        }
        return { success: false, error: 'An unknown error occurred during cart merge.' };
    }
};
exports.mergeGuestCartToFirestore = mergeGuestCartToFirestore;
/**
 * Retrieves a user's cart from Firestore.
 *
 * @param uid The user's ID.
 * @returns A promise that resolves to the UserCartBE object or null if not found/error.
 */
const getUserCartBE = async (uid) => {
    if (!uid) {
        functions.logger.error('User ID is undefined in getUserCartBE');
        return null;
    }
    try {
        const cartItems = [];
        const userCartCollectionRef = firebaseAdmin_1.firestoreDB.collection('users').doc(uid).collection('cart');
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
                    product: data.product,
                    addedAt: data.addedAt,
                });
            }
            else {
                functions.logger.warn(`Skipping cart item with invalid structure for user ${uid}, docId ${doc.id}:`, data);
            }
        });
        functions.logger.info(`Retrieved ${cartItems.length} cart items for user ${uid}.`);
        return { userId: uid, items: cartItems };
    }
    catch (error) {
        functions.logger.error(`Error retrieving cart for user ${uid}:`, error);
        return null;
    }
};
exports.getUserCartBE = getUserCartBE;
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
const setItemInUserCartBE = async (uid, productId, quantity, 
// Product data is crucial if the item is new or needs its details updated.
// For a simple quantity update of an existing item, this might be partially redundant
// if we only trust the client for productId and quantity, but good for new items.
productData) => {
    if (!uid || !productId) {
        functions.logger.error('User ID and Product ID are required in setItemInUserCartBE');
        return null;
    }
    const productDocRef = firebaseAdmin_1.firestoreDB.collection('users').doc(uid).collection('cart').doc(productId);
    try {
        if (quantity <= 0) {
            await productDocRef.delete();
            functions.logger.info(`Removed product ${productId} from cart for user ${uid}.`);
        }
        else {
            if (!productData || productData.id !== productId) {
                functions.logger.warn(`Product data for ${productId} might be incomplete or mismatched in setItemInUserCartBE.`);
            }
            const cartItemData = {
                productId: productId,
                quantity: quantity,
                product: {
                    id: productData.id || productId,
                    name: productData.name || 'Unnamed Product',
                    price: productData.price || 0,
                    images: productData.images || [],
                },
                addedAt: firebaseAdmin_1.adminInstance.firestore.Timestamp.now(), // Use adminInstance
            };
            await productDocRef.set(cartItemData, { merge: true });
            functions.logger.info(`Set product ${productId} with quantity ${quantity} for user ${uid}.`);
        }
        return await (0, exports.getUserCartBE)(uid);
    }
    catch (error) {
        functions.logger.error(`Error setting item ${productId} in cart for user ${uid}:`, error);
        return null;
    }
};
exports.setItemInUserCartBE = setItemInUserCartBE;
/**
 * Clears all items from a user's Firestore cart.
 *
 * @param uid The user's ID.
 * @returns A promise that resolves to an object indicating success or failure.
 */
const clearUserCartBE = async (uid) => {
    if (!uid) {
        functions.logger.error('User ID is undefined in clearUserCartBE');
        return { success: false, error: 'User ID cannot be empty.' };
    }
    const userCartCollectionRef = firebaseAdmin_1.firestoreDB.collection('users').doc(uid).collection('cart');
    try {
        const snapshot = await userCartCollectionRef.get();
        if (snapshot.empty) {
            functions.logger.info(`Cart is already empty for user ${uid}.`);
            return { success: true };
        }
        const batch = firebaseAdmin_1.firestoreDB.batch();
        snapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });
        await batch.commit();
        functions.logger.info(`Successfully cleared cart for user ${uid}. Deleted ${snapshot.size} items.`);
        return { success: true };
    }
    catch (error) {
        functions.logger.error(`Error clearing cart for user ${uid}:`, error);
        if (error instanceof Error) {
            return { success: false, error: error.message };
        }
        return { success: false, error: 'An unknown error occurred while clearing the cart.' };
    }
};
exports.clearUserCartBE = clearUserCartBE;
//# sourceMappingURL=cartService.js.map