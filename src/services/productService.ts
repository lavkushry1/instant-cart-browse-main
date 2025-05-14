// src/services/productService.ts

// Import Firebase Admin resources
import {
  db, // Firestore instance from firebaseAdmin.ts
  adminInstance, // For FieldValue, Timestamp etc. from firebaseAdmin.ts
  storage // For deleting images from Firebase Storage
} from '../../lib/firebaseAdmin'; // Adjust path as necessary
const PRODUCTS_COLLECTION = 'products';
const REVIEWS_SUBCOLLECTION = 'reviews'; // Used when deleting a product with its reviews

// Keep client-side Timestamp for type consistency if Product interface is shared
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

console.log(`(Service-Backend) Product Service: Using Firestore collection: ${PRODUCTS_COLLECTION}`);

export const createProductBE = async (productData: ProductCreationData): Promise<Product> => {
  console.log('(Service-Backend) createProductBE called with:', productData);
  try {
    const dataToSave: any = {
      ...productData,
      averageRating: 0,
      reviewCount: 0,
      createdAt: adminInstance.firestore.FieldValue.serverTimestamp(),
      updatedAt: adminInstance.firestore.FieldValue.serverTimestamp(),
    };
    Object.keys(dataToSave).forEach(key => dataToSave[key] === undefined && delete dataToSave[key]);

    const docRef = await db.collection(PRODUCTS_COLLECTION).add(dataToSave);
    const newDoc = await docRef.get();
    if (!newDoc.exists) {
        throw new Error('Product document not found after creation.');
    }
    return { id: newDoc.id, ...newDoc.data() } as Product;
  } catch (error) {
    console.error("Error in createProductBE:", error);
    throw error;
  }
};

export const getProductByIdBE = async (productId: string): Promise<Product | null> => {
  console.log(`(Service-Backend) getProductByIdBE for ID: ${productId}`);
  try {
    const docRef = db.collection(PRODUCTS_COLLECTION).doc(productId);
    const docSnap = await docRef.get();
    if (!docSnap.exists) return null;
    // TODO: Optionally fetch first page of reviews or other subcollection data if needed for product detail view
    return { id: docSnap.id, ...docSnap.data() } as Product;
  } catch (error) {
    console.error(`Error in getProductByIdBE for ${productId}:`, error);
    throw error;
  }
};

export interface GetAllProductsOptionsBE {
    categoryId?: string;
    featured?: boolean;
    searchQuery?: string; // Requires specific indexing/search solution (e.g., Algolia, or simpler Firestore workarounds)
    minPrice?: number;
    maxPrice?: number;
    isEnabled?: boolean;
    sortBy?: 'price' | 'createdAt' | 'name' | 'averageRating';
    sortOrder?: 'asc' | 'desc';
    limit?: number;
    startAfter?: any; // Firestore DocumentSnapshot
}

export const getAllProductsBE = async (options: GetAllProductsOptionsBE = {}): Promise<{ products: Product[], lastVisible?: any, totalCount?: number }> => {
  console.log('(Service-Backend) getAllProductsBE with options:', options);
  try {
    let query: admin.firestore.Query = db.collection(PRODUCTS_COLLECTION);

    if (options.categoryId) query = query.where('categoryId', '==', options.categoryId);
    if (options.featured !== undefined) query = query.where('featured', '==', options.featured);
    if (options.isEnabled !== undefined) query = query.where('isEnabled', '==', options.isEnabled);
    if (options.minPrice !== undefined) query = query.where('price', '>=', options.minPrice);
    if (options.maxPrice !== undefined) query = query.where('price', '<=', options.maxPrice);
    // Note on price range: Firestore may require an inequality filter on only one field per query without composite indexes.
    // For more complex filtering (e.g., text search on name/description), a dedicated search service like Algolia is recommended.

    const sortBy = options.sortBy || 'createdAt';
    const sortOrder = options.sortOrder || 'desc';
    query = query.orderBy(sortBy, sortOrder);

    // For total count, if not using .count() (which might not be available/performant on all SDK versions or for complex queries)
    // a separate, less constrained query might be needed or an approximation.
    // For this example, we won't implement totalCount precisely for paginated results without .count().
    // const totalCountSnapshot = await db.collection(PRODUCTS_COLLECTION).where(...).count().get(); // If using .count()

    if (options.startAfter) query = query.startAfter(options.startAfter);
    if (options.limit) query = query.limit(options.limit);

    const snapshot = await query.get();
    if (snapshot.empty) return { products: [], totalCount: 0 };

    const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
    const lastVisible = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : undefined;
    
    // totalCount here is an approximation for the current batch or requires another query.
    // If options.limit is set, this totalCount is not the grand total.
    return { products, lastVisible, totalCount: products.length }; 

  } catch (error) {
    console.error("Error in getAllProductsBE:", error);
    throw error;
  }
};

export const updateProductBE = async (productId: string, productData: ProductUpdateData): Promise<Product> => {
  console.log(`(Service-Backend) updateProductBE for ID ${productId} with:`, productData);
  try {
    const docRef = db.collection(PRODUCTS_COLLECTION).doc(productId);
    const dataToUpdate: any = { ...productData, updatedAt: adminInstance.firestore.FieldValue.serverTimestamp() };
    Object.keys(dataToUpdate).forEach(key => dataToUpdate[key] === undefined && delete dataToUpdate[key]);

    await docRef.update(dataToUpdate);
    const updatedDoc = await docRef.get();
    if (!updatedDoc.exists) {
        throw new Error('Product document not found after update.');
    }
    return { id: updatedDoc.id, ...updatedDoc.data() } as Product;
  } catch (error) {
    console.error(`Error in updateProductBE for ${productId}:`, error);
    throw error;
  }
};

export const deleteProductBE = async (productId: string): Promise<void> => {
  console.log(`(Service-Backend) deleteProductBE for ID: ${productId}`);
  try {
    const productRef = db.collection(PRODUCTS_COLLECTION).doc(productId);
    const product = (await productRef.get()).data() as Product | undefined;

    // 1. Delete images from Firebase Storage (if URLs are stored and accessible)
    if (product && product.images && product.images.length > 0) {
      const bucket = storage.bucket(); // Default bucket
      for (const imageUrl of product.images) {
        try {
          // Attempt to parse URL and get GCS path. This needs to be robust.
          // Example: gs://<bucket-name>/path/to/image.jpg or https://firebasestorage.googleapis.com/...
          // This parsing logic is highly dependent on how image URLs are stored.
          // For simplicity, if it's a GCS path already, use it. Otherwise, adapt.
          let imagePath = imageUrl;
          if (imageUrl.startsWith('https://firebasestorage.googleapis.com')) {
             // Crude parsing - better to store GCS paths directly or have a reliable way to derive them.
            const urlParts = imageUrl.split('/o/');
            if (urlParts.length > 1) {
                imagePath = decodeURIComponent(urlParts[1].split('?')[0]);
            }
          }
          if (imagePath) {
            console.log(`Attempting to delete image from storage: ${imagePath}`);
            // await bucket.file(imagePath).delete().catch(e => console.warn(`Failed to delete image ${imagePath}: ${e.message}`));
          }
        } catch (e) {
          console.warn(`Could not parse or delete image URL ${imageUrl}: ${e}`);
        }
      }
    }

    // 2. Delete reviews subcollection (batched delete)
    const reviewsCollectionRef = productRef.collection(REVIEWS_SUBCOLLECTION);
    const reviewsSnapshot = await reviewsCollectionRef.limit(500).get(); // Batch delete in chunks if many reviews
    if (!reviewsSnapshot.empty) {
      const batch = db.batch();
      reviewsSnapshot.docs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
      console.log(`Deleted ${reviewsSnapshot.size} reviews for product ${productId}`);
    }
    // Repeat if reviewsSnapshot.size === 500 until all deleted

    // 3. Delete the product document itself
    await productRef.delete();
    console.log(`Product ${productId} and its associated data deleted successfully.`);

  } catch (error) {
    console.error(`Error in deleteProductBE for ${productId}:`, error);
    throw error;
  }
};

export const updateProductStockBE = async (productId: string, quantityChange: number): Promise<void> => {
    console.log(`(Service-Backend) updateProductStockBE for ${productId}, change: ${quantityChange}`);
    try {
        const productRef = db.collection(PRODUCTS_COLLECTION).doc(productId);
        await productRef.update({
            stock: adminInstance.firestore.FieldValue.increment(quantityChange)
        });
        console.log(`Stock updated for product ${productId} by ${quantityChange}`);
    } catch (error) {
        console.error(`Error updating stock for product ${productId}:`, error);
        throw error;
    }
};