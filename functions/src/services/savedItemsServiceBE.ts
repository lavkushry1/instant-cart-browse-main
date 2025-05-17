import { firestoreDB, Timestamp } from '../lib/firebaseAdmin'; // Corrected Admin SDK path, added Timestamp
import { Product } from '../../../src/types/product'; // Assuming Product type from frontend is sufficient for product data
import { CartItemBE, ProductInCartBE } from './cartService'; // Re-use CartItemBE for structure if suitable

// Simplified interface for product data stored in saved items
// Explicitly pick only necessary fields from the main Product type
export type SavedProductDataBE = Pick<Product, 'id' | 'name' | 'price' | 'images'> & {
    featured?: number; // Make optional if they can be missing
    discount?: number; // Make optional if they can be missing
};

// Interface for an item stored in the savedForLater subcollection
export interface SavedItemBE {
    id: string; // Product ID
    productData: SavedProductDataBE;
    addedAt: FirebaseFirestore.Timestamp; // Use imported Timestamp or admin.firestore.Timestamp
}


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
export const addSavedItemBE = async (
    userId: string,
    productId: string,
    productData: SavedProductDataBE
): Promise<SavedItemBE> => {
    if (!userId || !productId || !productData) {
        throw new Error('User ID, Product ID, and Product Data are required to add a saved item.');
    }
    const userSavedItemsRef = firestoreDB
        .collection(USERS_COLLECTION)
        .doc(userId)
        .collection(SAVED_FOR_LATER_COLLECTION);

    const savedItemDocRef = userSavedItemsRef.doc(productId);

    const newSavedItem: SavedItemBE = {
        id: productId,
        productData,
        addedAt: Timestamp.now(), // Use imported Timestamp
    };

    await savedItemDocRef.set(newSavedItem);
    console.log(`(BE) Product ${productId} added to saved for later for user ${userId}`);
    return newSavedItem;
};

/**
 * Removes an item from the user's saved for later list in Firestore.
 * @param userId The ID of the user.
 * @param productId The ID of the product to remove.
 */
export const removeSavedItemBE = async (userId: string, productId: string): Promise<void> => {
    if (!userId || !productId) {
        throw new Error('User ID and Product ID are required to remove a saved item.');
    }
    const savedItemDocRef = firestoreDB
        .collection(USERS_COLLECTION)
        .doc(userId)
        .collection(SAVED_FOR_LATER_COLLECTION)
        .doc(productId);

    await savedItemDocRef.delete();
    console.log(`(BE) Product ${productId} removed from saved for later for user ${userId}`);
};

/**
 * Retrieves all saved for later items for a user from Firestore.
 * @param userId The ID of the user.
 * @returns A promise that resolves to an array of saved items.
 */
export const getSavedItemsBE = async (userId: string): Promise<SavedItemBE[]> => {
    if (!userId) {
        throw new Error('User ID is required to get saved items.');
    }
    const userSavedItemsRef = firestoreDB
        .collection(USERS_COLLECTION)
        .doc(userId)
        .collection(SAVED_FOR_LATER_COLLECTION)
        .orderBy('addedAt', 'desc');

    const snapshot = await userSavedItemsRef.get();
    if (snapshot.empty) {
        return [];
    }
    // Type assertion needed here as .data() returns DocumentData
    return snapshot.docs.map(doc => doc.data() as SavedItemBE); 
};

/**
 * Moves an item from the user's saved for later list to their cart in Firestore.
 * This operation is transactional.
 * @param userId The ID of the user.
 * @param productId The ID of the product to move.
 * @throws Throws an error if the item is not found in saved items or if the transaction fails.
 */
export const moveSavedItemToCartBE = async (userId: string, productId: string): Promise<void> => {
    if (!userId || !productId) {
        throw new Error('User ID and Product ID are required to move item to cart.');
    }

    const userDocRef = firestoreDB.collection(USERS_COLLECTION).doc(userId);
    const savedItemDocRef = userDocRef.collection(SAVED_FOR_LATER_COLLECTION).doc(productId);
    const cartItemDocRef = userDocRef.collection(CART_COLLECTION).doc(productId);

    await firestoreDB.runTransaction(async (transaction) => {
        const savedItemSnapshot = await transaction.get(savedItemDocRef);
        if (!savedItemSnapshot.exists) {
            throw new Error(`Product ${productId} not found in saved for later for user ${userId}.`);
        }
        const savedItemData = savedItemSnapshot.data() as SavedItemBE;

        // Ensure cartProductData conforms to ProductInCartBE
        // SavedProductDataBE has id, name, price, images
        // ProductInCartBE also expects id, name, price, and optional images
        // So, direct spread should be fine if ProductInCartBE does not have other *required* fields.
        const cartProductData: ProductInCartBE = {
            id: savedItemData.productData.id, // Explicitly ensure id is from productData
            name: savedItemData.productData.name,
            price: savedItemData.productData.price,
            images: savedItemData.productData.images,
            // ... any other fields from savedItemData.productData that ARE in ProductInCartBE
            // ... or any default values for fields in ProductInCartBE NOT in SavedProductDataBE
        };
        
        const newCartItem: CartItemBE = {
            productId: productId,
            product: cartProductData, // Corrected field name from productData to product
            quantity: 1,
            addedAt: Timestamp.now(), // Use imported Timestamp
        };

        transaction.set(cartItemDocRef, newCartItem);
        transaction.delete(savedItemDocRef);
    });
    console.log(`(BE) Product ${productId} moved from saved for later to cart for user ${userId}`);
}; 