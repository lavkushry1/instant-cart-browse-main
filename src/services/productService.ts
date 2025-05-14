// src/services/productService.ts

/* Import Firebase Admin resources */
/*
import {
  db, // Firestore instance from firebaseAdmin.ts
  adminInstance // For FieldValue, Timestamp etc. from firebaseAdmin.ts
} from '../../lib/firebaseAdmin'; // Adjust path as necessary
const PRODUCTS_COLLECTION = 'products';
// const CATEGORIES_COLLECTION = 'categories'; // If categories are managed separately
*/

import { db, adminInstance } from '../../lib/firebaseAdmin'; // Mock or actual
const PRODUCTS_COLLECTION = 'products';

// Keep client-side Timestamp for type consistency in shared interfaces if needed
import { Timestamp as ClientTimestamp } from 'firebase/firestore';

export interface ProductVariation {
    type: string; 
    option: string; 
    priceModifier?: number; 
    stock?: number; 
}

export interface ProductReview {
    userId: string;
    rating: number; 
    comment?: string;
    reviewerName?: string; 
    createdAt: any; // admin.firestore.Timestamp
}

export interface Product {
  id: string; 
  name: string;
  description: string;
  price: number;
  originalPrice?: number; 
  sku?: string; 
  images: string[]; 
  categoryId: string; 
  categoryName?: string; 
  tags?: string[];
  stock: number; 
  variations?: ProductVariation[];
  attributes?: Record<string, string | number>; 
  averageRating?: number;
  reviewCount?: number;
  isEnabled: boolean; 
  featured?: boolean; 
  createdAt: any; // admin.firestore.Timestamp
  updatedAt: any; // admin.firestore.Timestamp
}

export type ProductCreationData = Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'averageRating' | 'reviewCount'>;
export type ProductUpdateData = Partial<Omit<Product, 'id' | 'createdAt' | 'updatedAt'>>;

/**
 * @module productService (Backend Operations)
 */

console.log(`(Service-Backend) Product Service: Using Firestore collection: ${PRODUCTS_COLLECTION}`);

/**
 * Creates a new product in Firestore (Backend Operation).
 */
export const createProductBE = async (productData: ProductCreationData): Promise<Product> => {
  console.log('(Service-Backend) createProductBE called with:', productData);
  /*
  try {
    const dataToSave = {
      ...productData,
      averageRating: 0,
      reviewCount: 0,
      createdAt: adminInstance.firestore.FieldValue.serverTimestamp(),
      updatedAt: adminInstance.firestore.FieldValue.serverTimestamp(),
    };
    Object.keys(dataToSave).forEach(key => (dataToSave as any)[key] === undefined && delete (dataToSave as any)[key]);

    const docRef = await db.collection(PRODUCTS_COLLECTION).add(dataToSave);
    // const newDoc = await docRef.get();
    // return { id: newDoc.id, ...newDoc.data() } as Product;
    return { 
        id: docRef.id, 
        ...dataToSave, 
        createdAt: adminInstance.firestore.Timestamp.now(), 
        updatedAt: adminInstance.firestore.Timestamp.now() 
    } as Product;
  } catch (error) {
    console.error("Error in createProductBE:", error);
    throw error;
  }
  */
  await new Promise(resolve => setTimeout(resolve, 100));
  const mockId = `mock_product_${Date.now()}`;
  const now = adminInstance.firestore.Timestamp.now();
  console.warn('createProductBE: Firestore not connected, using mock data.');
  return {
    id: mockId,
    ...productData,
    averageRating: 0,
    reviewCount: 0,
    createdAt: now,
    updatedAt: now,
  } as Product;
};

/**
 * Retrieves a single product by ID (Backend Operation).
 */
export const getProductByIdBE = async (productId: string): Promise<Product | null> => {
  console.log(`(Service-Backend) getProductByIdBE for ID: ${productId}`);
  /*
  try {
    const docRef = db.collection(PRODUCTS_COLLECTION).doc(productId);
    const docSnap = await docRef.get();
    if (!docSnap.exists) return null;
    // TODO: Fetch reviews from subcollection if they are not embedded
    return { id: docSnap.id, ...docSnap.data() } as Product;
  } catch (error) {
    console.error(`Error in getProductByIdBE for ${productId}:`, error);
    throw error;
  }
  */
  await new Promise(resolve => setTimeout(resolve, 50));
  console.warn(`getProductByIdBE: Mock for ${productId}, returning null.`);
  return null;
};

export interface GetAllProductsOptionsBE {
    categoryId?: string;
    featured?: boolean;
    searchQuery?: string; 
    minPrice?: number;
    maxPrice?: number;
    isEnabled?: boolean;
    sortBy?: 'price' | 'createdAt' | 'name' | 'averageRating';
    sortOrder?: 'asc' | 'desc';
    limit?: number;
    startAfter?: any; // Firestore DocumentSnapshot or its equivalent representation
}

/**
 * Retrieves products from Firestore with filtering and pagination (Backend Operation).
 */
export const getAllProductsBE = async (options: GetAllProductsOptionsBE = {}): Promise<{ products: Product[], lastVisible?: any, totalCount?: number }> => {
  console.log('(Service-Backend) getAllProductsBE with options:', options);
  /*
  try {
    let query: admin.firestore.Query = db.collection(PRODUCTS_COLLECTION);

    if (options.categoryId) query = query.where('categoryId', '==', options.categoryId);
    if (options.featured !== undefined) query = query.where('featured', '==', options.featured);
    if (options.isEnabled !== undefined) query = query.where('isEnabled', '==', options.isEnabled);
    // Note: Firestore requires an index for range filters on different fields if combined with equality or other range filters.
    // e.g. .where('price', '>=', options.minPrice).where('price', '<=', options.maxPrice)
    // Search query would typically require a more advanced solution like Algolia/Elasticsearch or carefully structured data for Firestore.
    // For a simple name search (case-insensitive), you might need to store an array of keywords or a lowercased name field.

    const sortBy = options.sortBy || 'createdAt';
    const sortOrder = options.sortOrder || 'desc';
    query = query.orderBy(sortBy, sortOrder);

    // For total count, a separate count query is more efficient.
    // const countQuery = db.collection(PRODUCTS_COLLECTION); // Apply same filters as main query
    // const totalCountSnapshot = await countQuery.count().get();
    // const totalCount = totalCountSnapshot.data().count;
    let totalCount = undefined;

    if (options.startAfter) query = query.startAfter(options.startAfter);
    if (options.limit) query = query.limit(options.limit);

    const snapshot = await query.get();
    if (snapshot.empty) return { products: [], totalCount: totalCount || 0 };

    const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
    const lastVisible = snapshot.docs[snapshot.docs.length - 1];
    
    return { products, lastVisible, totalCount: totalCount || products.length }; // Use accurate totalCount if fetched

  } catch (error) {
    console.error("Error in getAllProductsBE:", error);
    throw error;
  }
  */
  await new Promise(resolve => setTimeout(resolve, 200));
  console.warn('getAllProductsBE: Mock, returning empty array.');
  return { products: [] };
};

/**
 * Updates a product in Firestore (Backend Operation).
 */
export const updateProductBE = async (productId: string, productData: ProductUpdateData): Promise<Product> => {
  console.log(`(Service-Backend) updateProductBE for ID ${productId} with:`, productData);
  /*
  try {
    const docRef = db.collection(PRODUCTS_COLLECTION).doc(productId);
    const dataToUpdate: any = { ...productData, updatedAt: adminInstance.firestore.FieldValue.serverTimestamp() };
    Object.keys(dataToUpdate).forEach(key => dataToUpdate[key] === undefined && delete dataToUpdate[key]);

    await docRef.update(dataToUpdate);
    // const updatedDoc = await docRef.get();
    // return { id: updatedDoc.id, ...updatedDoc.data() } as Product;
    return { id: productId, ...dataToUpdate, updatedAt: adminInstance.firestore.Timestamp.now() } as Product;
  } catch (error) {
    console.error(`Error in updateProductBE for ${productId}:`, error);
    throw error;
  }
  */
  await new Promise(resolve => setTimeout(resolve, 100));
  const now = adminInstance.firestore.Timestamp.now();
  console.warn(`updateProductBE: Mock for ${productId}.`);
  const mockExistingProduct = await getProductByIdBE(productId) || { id: productId, createdAt: now, name: 'Temp Name', description:'', price:0, images:[], categoryId:'', stock:0, isEnabled:true } as Product;
  return { ...mockExistingProduct, ...productData, updatedAt: now } as Product;
};

/**
 * Deletes a product from Firestore (Backend Operation).
 * Also consider deleting associated storage items (images) and subcollections (reviews).
 */
export const deleteProductBE = async (productId: string): Promise<void> => {
  console.log(`(Service-Backend) deleteProductBE for ID: ${productId}`);
  /*
  try {
    // TODO: Add logic to delete images from Firebase Storage associated with this product.
    // const product = await getProductByIdBE(productId); // Fetch product to get image URLs
    // if (product && product.images) {
    //   for (const imageUrl of product.images) {
    //     const fileRef = storage.bucket().file(new URL(imageUrl).pathname.substring(1)); // Path from URL
    //     await fileRef.delete().catch(err => console.error("Error deleting image:", err));
    //   }
    // }

    // TODO: Add logic to delete subcollections like 'reviews' if they exist.
    // const reviewsRef = db.collection(PRODUCTS_COLLECTION).doc(productId).collection('reviews');
    // const reviewsSnapshot = await reviewsRef.get();
    // const batch = db.batch();
    // reviewsSnapshot.docs.forEach(doc => batch.delete(doc.ref));
    // await batch.commit();

    await db.collection(PRODUCTS_COLLECTION).doc(productId).delete();
  } catch (error) {
    console.error(`Error in deleteProductBE for ${productId}:`, error);
    throw error;
  }
  */
  await new Promise(resolve => setTimeout(resolve, 50));
  console.warn(`deleteProductBE: Mock deletion for ${productId}.`);
};

/**
 * Updates the stock for a given product (Backend Operation).
 * @param {string} productId - The ID of the product.
 * @param {number} quantityChange - The change in quantity (e.g., -1 for decrement, 1 for increment).
 * @returns {Promise<void>}
 */
export const updateProductStockBE = async (productId: string, quantityChange: number): Promise<void> => {
    console.log(`(Service-Backend) updateProductStockBE for ${productId}, change: ${quantityChange}`);
    /*
    try {
        const productRef = db.collection(PRODUCTS_COLLECTION).doc(productId);
        await productRef.update({
            stock: adminInstance.firestore.FieldValue.increment(quantityChange)
        });
        console.log(`Stock updated for product ${productId} by ${quantityChange}`);
    } catch (error) {
        console.error(`Error updating stock for product ${productId}:`, error);
        // Potentially throw error to handle in calling function (e.g., rollback order creation)
        throw error;
    }
    */
    await new Promise(resolve => setTimeout(resolve, 50));
    console.warn(`updateProductStockBE: Mock stock update for ${productId} by ${quantityChange}.`);
};