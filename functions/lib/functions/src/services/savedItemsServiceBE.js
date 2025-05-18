"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.moveSavedItemToCartBE = exports.getSavedItemsBE = exports.removeSavedItemBE = exports.addSavedItemBE = void 0;
const firebaseAdmin_1 = require("@/lib/firebaseAdmin"); // Use path alias and adminInstance
const SAVED_FOR_LATER_COLLECTION = 'savedForLater';
const USERS_COLLECTION = 'users';
const CART_COLLECTION = 'cart';
/**
 * Adds an item to the user's saved for later list in Firestore.
 * @param userId The ID of the user.
 * @param productId The ID of the product to add.
 * @param productData The essential product data to save.
 * @returns The saved item.
 */
const addSavedItemBE = async (userId, productId, productData) => {
    if (!userId || !productId || !productData) {
        throw new Error('User ID, Product ID, and Product Data are required to add a saved item.');
    }
    const userSavedItemsRef = firebaseAdmin_1.firestoreDB
        .collection(USERS_COLLECTION)
        .doc(userId)
        .collection(SAVED_FOR_LATER_COLLECTION);
    const savedItemDocRef = userSavedItemsRef.doc(productId);
    const newSavedItem = {
        id: productId,
        productData,
        addedAt: firebaseAdmin_1.Timestamp.now(), // This should use adminInstance.firestore.Timestamp.now() or just Timestamp.now() if Timestamp is admin.firestore.Timestamp
    };
    await savedItemDocRef.set(newSavedItem);
    console.log(`(BE) Product ${productId} added to saved for later for user ${userId}`);
    return newSavedItem;
};
exports.addSavedItemBE = addSavedItemBE;
/**
 * Removes an item from the user's saved for later list in Firestore.
 * @param userId The ID of the user.
 * @param productId The ID of the product to remove.
 */
const removeSavedItemBE = async (userId, productId) => {
    if (!userId || !productId) {
        throw new Error('User ID and Product ID are required to remove a saved item.');
    }
    const savedItemDocRef = firebaseAdmin_1.firestoreDB
        .collection(USERS_COLLECTION)
        .doc(userId)
        .collection(SAVED_FOR_LATER_COLLECTION)
        .doc(productId);
    await savedItemDocRef.delete();
    console.log(`(BE) Product ${productId} removed from saved for later for user ${userId}`);
};
exports.removeSavedItemBE = removeSavedItemBE;
/**
 * Retrieves all saved for later items for a user from Firestore.
 * @param userId The ID of the user.
 * @returns A promise that resolves to an array of saved items.
 */
const getSavedItemsBE = async (userId) => {
    if (!userId) {
        throw new Error('User ID is required to get saved items.');
    }
    const userSavedItemsRef = firebaseAdmin_1.firestoreDB
        .collection(USERS_COLLECTION)
        .doc(userId)
        .collection(SAVED_FOR_LATER_COLLECTION)
        .orderBy('addedAt', 'desc');
    const snapshot = await userSavedItemsRef.get();
    if (snapshot.empty) {
        return [];
    }
    // Type assertion needed here as .data() returns DocumentData
    return snapshot.docs.map(doc => doc.data());
};
exports.getSavedItemsBE = getSavedItemsBE;
/**
 * Moves an item from the user's saved for later list to their cart in Firestore.
 * This operation is transactional.
 * @param userId The ID of the user.
 * @param productId The ID of the product to move.
 * @throws Throws an error if the item is not found in saved items or if the transaction fails.
 */
const moveSavedItemToCartBE = async (userId, productId) => {
    if (!userId || !productId) {
        throw new Error('User ID and Product ID are required to move item to cart.');
    }
    const userDocRef = firebaseAdmin_1.firestoreDB.collection(USERS_COLLECTION).doc(userId);
    const savedItemDocRef = userDocRef.collection(SAVED_FOR_LATER_COLLECTION).doc(productId);
    const cartItemDocRef = userDocRef.collection(CART_COLLECTION).doc(productId);
    await firebaseAdmin_1.firestoreDB.runTransaction(async (transaction) => {
        const savedItemSnapshot = await transaction.get(savedItemDocRef);
        if (!savedItemSnapshot.exists) {
            throw new Error(`Product ${productId} not found in saved for later for user ${userId}.`);
        }
        const savedItemData = savedItemSnapshot.data();
        // Ensure cartProductData conforms to ProductInCartBE
        // SavedProductDataBE has id, name, price, images
        // ProductInCartBE also expects id, name, price, and optional images
        // So, direct spread should be fine if ProductInCartBE does not have other *required* fields.
        const cartProductData = {
            id: savedItemData.productData.id, // Explicitly ensure id is from productData
            name: savedItemData.productData.name,
            price: savedItemData.productData.price,
            images: savedItemData.productData.images,
            // ... any other fields from savedItemData.productData that ARE in ProductInCartBE
            // ... or any default values for fields in ProductInCartBE NOT in SavedProductDataBE
        };
        const newCartItem = {
            productId: productId,
            product: cartProductData,
            quantity: 1,
            addedAt: firebaseAdmin_1.Timestamp.now(), // Same here, ensure it resolves to admin.firestore.Timestamp.now()
        };
        transaction.set(cartItemDocRef, newCartItem);
        transaction.delete(savedItemDocRef);
    });
    console.log(`(BE) Product ${productId} moved from saved for later to cart for user ${userId}`);
};
exports.moveSavedItemToCartBE = moveSavedItemToCartBE;
//# sourceMappingURL=savedItemsServiceBE.js.map