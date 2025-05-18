"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeFromWishlistBE = exports.addToWishlistBE = exports.getWishlistBE = void 0;
const firebaseAdmin_1 = require("../lib/firebaseAdmin");
const firestore_1 = require("firebase-admin/firestore");
const WISHLISTS_COLLECTION = 'wishlists';
const getWishlistBE = async (userId) => {
    try {
        const wishlistDoc = await firebaseAdmin_1.firestoreDB.collection(WISHLISTS_COLLECTION).doc(userId).get();
        if (wishlistDoc.exists) {
            const data = wishlistDoc.data();
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
const addToWishlistBE = async (userId, productId) => {
    try {
        const wishlistRef = firebaseAdmin_1.firestoreDB.collection(WISHLISTS_COLLECTION).doc(userId);
        await wishlistRef.set({
            productIds: firestore_1.FieldValue.arrayUnion(productId),
            updatedAt: firestore_1.FieldValue.serverTimestamp(),
        }, { merge: true });
    }
    catch (error) {
        console.error('Error adding to wishlist in BE:', error);
        throw new Error('Failed to add product to wishlist.');
    }
};
exports.addToWishlistBE = addToWishlistBE;
const removeFromWishlistBE = async (userId, productId) => {
    try {
        const wishlistRef = firebaseAdmin_1.firestoreDB.collection(WISHLISTS_COLLECTION).doc(userId);
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
//# sourceMappingURL=wishlistServiceBE.js.map