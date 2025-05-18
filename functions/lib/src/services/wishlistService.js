"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeFromWishlistBE = exports.addToWishlistBE = exports.getWishlistBE = void 0;
const firebaseAdmin_1 = require("../lib/firebaseAdmin");
const firestore_1 = require("firebase-admin/firestore");
const WISHLISTS_COLLECTION = 'wishlists';
/**
 * Retrieves the product IDs from a user's wishlist.
 * @param userId The ID of the user.
 * @returns A promise that resolves to an array of product IDs.
 */
const getWishlistBE = async (userId) => {
    try {
        const wishlistDoc = await firebaseAdmin_1.db.collection(WISHLISTS_COLLECTION).doc(userId).get();
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
    }
    catch (error) {
        console.error('Error getting wishlist from BE:', error);
        throw new Error('Failed to get wishlist.');
    }
};
exports.getWishlistBE = getWishlistBE;
/**
 * Adds a product to the user's wishlist.
 * @param userId The ID of the user.
 * @param productId The ID of the product to add.
 */
const addToWishlistBE = async (userId, productId) => {
    try {
        const wishlistRef = firebaseAdmin_1.db.collection(WISHLISTS_COLLECTION).doc(userId);
        await wishlistRef.set({
            productIds: firestore_1.FieldValue.arrayUnion(productId),
            updatedAt: firestore_1.FieldValue.serverTimestamp(), // Keep track of updates
        }, { merge: true });
    }
    catch (error) {
        console.error('Error adding to wishlist in BE:', error);
        throw new Error('Failed to add product to wishlist.');
    }
};
exports.addToWishlistBE = addToWishlistBE;
/**
 * Removes a product from the user's wishlist.
 * @param userId The ID of the user.
 * @param productId The ID of the product to remove.
 */
const removeFromWishlistBE = async (userId, productId) => {
    try {
        const wishlistRef = firebaseAdmin_1.db.collection(WISHLISTS_COLLECTION).doc(userId);
        await wishlistRef.update({
            productIds: firestore_1.FieldValue.arrayRemove(productId),
            updatedAt: firestore_1.FieldValue.serverTimestamp(),
        });
    }
    catch (error) {
        console.error('Error removing from wishlist in BE:', error);
        throw new Error('Failed to remove product from wishlist.');
    }
};
exports.removeFromWishlistBE = removeFromWishlistBE;
//# sourceMappingURL=wishlistService.js.map