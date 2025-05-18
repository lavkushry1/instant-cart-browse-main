"use strict";
// src/services/productService.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProductById = exports.getProducts = void 0;
// Import Firebase Client resources
const firebaseClient_1 = require("../lib/firebaseClient");
const firestore_1 = require("firebase/firestore");
const PRODUCTS_COLLECTION = 'products';
const getProducts = async (options = {}) => {
    console.log('(Service-Client) getProducts with options:', options);
    if (!firebaseClient_1.firestoreClient) {
        console.error("Firestore client not initialized. Cannot fetch products.");
        return { products: [], totalCount: 0 };
    }
    try {
        const qConstraints = [];
        if (options.categoryId)
            qConstraints.push((0, firestore_1.where)('categoryId', '==', options.categoryId));
        if (options.featured !== undefined)
            qConstraints.push((0, firestore_1.where)('featured', '==', options.featured));
        if (options.isEnabled !== undefined)
            qConstraints.push((0, firestore_1.where)('isEnabled', '==', options.isEnabled));
        else
            qConstraints.push((0, firestore_1.where)('isEnabled', '==', true));
        if (options.minPrice !== undefined)
            qConstraints.push((0, firestore_1.where)('price', '>=', options.minPrice));
        if (options.maxPrice !== undefined)
            qConstraints.push((0, firestore_1.where)('price', '<=', options.maxPrice));
        const sortBy = options.sortBy || 'createdAt';
        const sortOrder = options.sortOrder || 'desc';
        qConstraints.push((0, firestore_1.orderBy)(sortBy, sortOrder));
        if (options.startAfter)
            qConstraints.push((0, firestore_1.startAfter)(options.startAfter));
        if (options.limit)
            qConstraints.push((0, firestore_1.limit)(options.limit));
        const productsCollectionRef = (0, firestore_1.collection)(firebaseClient_1.firestoreClient, PRODUCTS_COLLECTION);
        const finalQuery = (0, firestore_1.query)(productsCollectionRef, ...qConstraints);
        const snapshot = await (0, firestore_1.getDocs)(finalQuery);
        if (snapshot.empty)
            return { products: [], totalCount: 0 };
        const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const lastVisible = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : undefined;
        return { products, lastVisible, totalCount: products.length };
    }
    catch (error) {
        console.error("Error in getProducts (client-side):", error);
        throw error;
    }
};
exports.getProducts = getProducts;
const getProductById = async (productId) => {
    console.log(`(Service-Client) getProductById for ID: ${productId}`);
    if (!firebaseClient_1.firestoreClient) {
        console.error("Firestore client not initialized. Cannot fetch product.");
        return null;
    }
    try {
        const docRef = (0, firestore_1.doc)(firebaseClient_1.firestoreClient, PRODUCTS_COLLECTION, productId);
        const docSnap = await (0, firestore_1.getDoc)(docRef);
        if (!docSnap.exists())
            return null;
        return { id: docSnap.id, ...docSnap.data() };
    }
    catch (error) {
        console.error(`Error in getProductById (client-side) for ${productId}:`, error);
        throw error;
    }
};
exports.getProductById = getProductById;
// Placeholder for client-side review fetching if needed, though this is usually via CF.
// export const getProductReviews = async (productId: string, options = {}): Promise<ProductReview[]> => {
//   // ... client-side logic to fetch reviews, perhaps from a subcollection using firestoreClient
//   return [];
// };
//# sourceMappingURL=productService.js.map