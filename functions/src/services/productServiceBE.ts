import * as admin from 'firebase-admin';
import {
  firestoreDB as db,
  adminInstance,
  storageAdmin as storage
} from '../lib/firebaseAdmin'; // Corrected path

// Import types that might be shared or defined here if specific to BE
// Assuming Product, ProductVariation, ProductReview, ProductCreationData, ProductUpdateData might be needed
// and need to use admin.firestore.Timestamp where appropriate.

const PRODUCTS_COLLECTION = 'products';
const CATEGORIES_COLLECTION = 'categories';
const REVIEWS_SUBCOLLECTION = 'reviews';

// --- Re-define types for Backend context or import from a shared types file that handles client/admin Timestamps ---
// For now, we'll redefine crucial parts for BE context if they differ, specifically Timestamps.

export interface ProductVariationBE { // Assuming same as client for now
    type: string; 
    option: string; 
    priceModifier?: number; 
    stock?: number; 
}

export interface ProductReviewBE { // Backend version uses Admin Timestamp
    id: string; // id is usually assigned by Firestore, but here it's part of the interface from original
    userId: string;
    rating: number; 
    comment?: string;
    reviewerName?: string; 
    createdAt: admin.firestore.Timestamp; // Key difference
}

// Type for writing review data to Firestore, using server timestamp for createdAt
interface ProductReviewWriteDataBE extends Omit<ProductReviewBE, 'id' | 'createdAt'> {
  createdAt: admin.firestore.FieldValue;
}


export interface ProductBE {
  id: string; 
  name: string;
  description: string;
  price: number;
  originalPrice?: number; 
  sku?: string; 
  images: string[]; 
  categoryId: string; 
  categoryName?: string; // This might be denormalized or fetched separately
  tags?: string[];
  stock: number; 
  variations?: ProductVariationBE[];
  attributes?: Record<string, string | number>; 
  averageRating?: number;
  reviewCount?: number;
  isEnabled: boolean; 
  featured?: boolean; 
  slug?: string; 
  seoTitle?: string; 
  seoDescription?: string; 
  createdAt: admin.firestore.Timestamp; // Key difference
  updatedAt: admin.firestore.Timestamp; // Key difference
}

// Note: ProductCreationData and ProductUpdateData from the original file used Omit<Product, ...>
// If Product uses ClientTimestamp, then these would too. We need BE versions.

export type ProductCreationDataBE = Omit<ProductBE, 'createdAt' | 'updatedAt' | 'averageRating' | 'reviewCount' | 'id'> & { 
  id?: string; // Allow pre-generated ID
  // Ensure isEnabled and featured are part of the data if not defaulted
  isEnabled: boolean;
  featured: boolean;
};

interface ProductWriteDataBE extends Omit<ProductCreationDataBE, 'id'> {
    averageRating: number; // Defaulted
    reviewCount: number;   // Defaulted
    createdAt: admin.firestore.FieldValue;
    updatedAt: admin.firestore.FieldValue;
}

export type ProductUpdateDataBE = Partial<Omit<ProductBE, 'id' | 'createdAt' | 'updatedAt'>>;

interface ProductUpdateWriteDataBE extends ProductUpdateDataBE {
    updatedAt: admin.firestore.FieldValue;
}


// --- Backend Product Management (Firebase Admin SDK) ---
console.log(`(Service-Backend) Product Service BE: Using Firestore collection: ${PRODUCTS_COLLECTION}`);

const generateBaseSlug = (text: string): string => {
  if (!text) return 'product'; 
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')      
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+/, '')         
    .replace(/-+$/, '');        
};

const generateUniqueSlugBE = async (baseText: string, currentProductId?: string): Promise<string> => {
  let potentialSlug = generateBaseSlug(baseText);
  let counter = 1;
   
  while (true) {
    const query = db.collection(PRODUCTS_COLLECTION).where('slug', '==', potentialSlug);
    const snapshot = await query.get();
    
    let isUnique = true;
    if (!snapshot.empty) {
      if (currentProductId) {
        if (snapshot.docs.some(doc => doc.id !== currentProductId)) {
          isUnique = false;
        }
      } else {
        isUnique = false;
      }
    }

    if (isUnique) {
      return potentialSlug;
    }

    counter++;
    potentialSlug = `${generateBaseSlug(baseText)}-${counter}`;
    if (counter > 10) { 
        potentialSlug = `${generateBaseSlug(baseText)}-${Date.now()}`;
        console.warn(`Slug generation fallback for ${baseText}, using timestamped slug: ${potentialSlug}`);
        return potentialSlug; 
    }
  }
};

const updateCategoryProductCount = async (transaction: admin.firestore.Transaction, categoryId: string, increment: boolean) => {
  const categoryRef = db.collection(CATEGORIES_COLLECTION).doc(categoryId);
  try {
    // const categoryDoc = await transaction.get(categoryRef); // Not strictly needed if just incrementing
    // if (!categoryDoc.exists) {
    //   console.warn(`Category ${categoryId} not found during product count update.`);
    //   // Decide if this should throw or just log. If it throws, the whole product operation might fail.
    //   // For now, let's assume category should exist.
    // }
    transaction.update(categoryRef, {
      productCount: adminInstance.firestore.FieldValue.increment(increment ? 1 : -1)
    });
  } catch (error) {
    console.error(`Error updating product count for category ${categoryId}:`, error);
    // Rethrow to ensure transaction consistency if this is critical
    throw error;
  }
};

export const createProductBE = async (productData: ProductCreationDataBE): Promise<ProductBE> => {
  console.log('(Service-Backend) createProductBE with data:', productData);
  const { id: preGeneratedId, ...restOfProductData } = productData;

  return db.runTransaction(async (transaction) => {
    let productDocRef: admin.firestore.DocumentReference;
    if (preGeneratedId) {
      productDocRef = db.collection(PRODUCTS_COLLECTION).doc(preGeneratedId);
      const existingDoc = await transaction.get(productDocRef);
      if (existingDoc.exists) {
        throw new Error(`Product with pre-generated ID ${preGeneratedId} already exists.`);
      }
    } else {
      productDocRef = db.collection(PRODUCTS_COLLECTION).doc();
    }

    const baseSlugText = productData.slug || productData.name;
    const uniqueSlug = await generateUniqueSlugBE(baseSlugText);

    const dataToSave: ProductWriteDataBE = {
      ...restOfProductData,
      slug: uniqueSlug,
      seoTitle: productData.seoTitle || productData.name,
      seoDescription: productData.seoDescription || productData.description.substring(0, 160),
      averageRating: 0,
      reviewCount: 0,
      createdAt: adminInstance.firestore.FieldValue.serverTimestamp(),
      updatedAt: adminInstance.firestore.FieldValue.serverTimestamp(),
    };
    transaction.set(productDocRef, dataToSave);
    await updateCategoryProductCount(transaction, productData.categoryId, true);
    
    // Return the shape of ProductBE, createdAt/updatedAt will be null until committed and read back
    // For immediate use, it's better to fetch after transaction, or construct carefully.
    // Here, we construct what it *will* look like.
    return { 
        id: productDocRef.id, 
        ...dataToSave,
        // Timestamps will be server-generated, so we can't return them accurately here
        // Casting as ProductBE implies they are Timestamps, but they are FieldValues before commit
        createdAt: adminInstance.firestore.Timestamp.now(), // Placeholder, actual value is server-generated
        updatedAt: adminInstance.firestore.Timestamp.now(), // Placeholder
     } as unknown as ProductBE; // Cast because TS doesn't know FieldValues become Timestamps
  }).then(async (newProductShell) => { // Fetch the actual document to get server-generated timestamps
    const finalDoc = await db.collection(PRODUCTS_COLLECTION).doc(newProductShell.id).get();
    return { id: finalDoc.id, ...finalDoc.data() } as ProductBE;
  });
};

export const getProductByIdBE = async (productId: string): Promise<ProductBE | null> => {
  console.log(`(Service-Backend) getProductByIdBE for ID: ${productId}`);
  try {
    const docRef = db.collection(PRODUCTS_COLLECTION).doc(productId);
    const docSnap = await docRef.get();
    if (!docSnap.exists) return null;
    return { id: docSnap.id, ...docSnap.data() } as ProductBE;
  } catch (error) {
    console.error(`Error in getProductByIdBE for ${productId}:`, error);
    throw error;
  }
};

export interface GetAllProductsOptionsBE {
    categoryId?: string;
    featured?: boolean;
    searchQuery?: string; 
    minPrice?: number;
    maxPrice?: number;
    isEnabled?: boolean; // For admin, might want to fetch disabled products too
    sortBy?: 'price' | 'createdAt' | 'name' | 'averageRating' | 'stock';
    sortOrder?: 'asc' | 'desc';
    limit?: number;
    startAfter?: admin.firestore.DocumentSnapshot; 
    fetchAll?: boolean; // Added to bypass isEnabled filter for admin use
}

export const getAllProductsBE = async (options: GetAllProductsOptionsBE = {}): Promise<{ products: ProductBE[], lastVisible?: admin.firestore.DocumentSnapshot, totalCount?: number }> => {
  console.log('(Service-Backend) getAllProductsBE with options:', options);
  try {
    let query: admin.firestore.Query = db.collection(PRODUCTS_COLLECTION);

    if (options.categoryId) query = query.where('categoryId', '==', options.categoryId);
    if (options.featured !== undefined) query = query.where('featured', '==', options.featured);
    
    if (!options.fetchAll) { // If not fetching all, apply isEnabled filter
        query = query.where('isEnabled', '==', options.isEnabled === undefined ? true : options.isEnabled);
    }
    // Note: Firestore does not support inequality filters on multiple properties
    // if (options.minPrice !== undefined) query = query.where('price', '>=', options.minPrice);
    // if (options.maxPrice !== undefined) query = query.where('price', '<=', options.maxPrice);
    // Range filters on price would need to be the primary sort or done client-side after a broader fetch.

    const sortBy = options.sortBy || 'createdAt';
    const sortOrder = options.sortOrder || 'desc';
    query = query.orderBy(sortBy, sortOrder);

    // Basic search query handling - this assumes 'name' field. For more complex search, use a dedicated search service.
    // Firestore is limited in text search. This is a very basic prefix/equality search.
    // if (options.searchQuery) {
    //   query = query.where('name', '>=', options.searchQuery).where('name', '<=', options.searchQuery + '\uf8ff');
    // }
    
    const totalCount: number | undefined = undefined; // Count query can be expensive

    if (options.startAfter) query = query.startAfter(options.startAfter);
    if (options.limit) query = query.limit(options.limit);

    const snapshot = await query.get();
    if (snapshot.empty) return { products: [], totalCount : 0 };

    const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ProductBE));
    const lastVisible = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : undefined;
    
    return { products, lastVisible, totalCount: products.length }; // totalCount is for the current batch

  } catch (error) {
    console.error("Error in getAllProductsBE:", error);
    throw error;
  }
};

export const updateProductBE = async (productId: string, productData: ProductUpdateDataBE): Promise<ProductBE> => {
  console.log(`(Service-Backend) updateProductBE for ID ${productId} with data:`, productData);
  const productRef = db.collection(PRODUCTS_COLLECTION).doc(productId);

  return db.runTransaction(async (transaction) => {
    const productDoc = await transaction.get(productRef);
    if (!productDoc.exists) {
      throw new Error(`Product with ID ${productId} not found.`);
    }
    const oldProductData = productDoc.data() as ProductBE;

    const dataToUpdate: ProductUpdateWriteDataBE = {
      ...productData,
      updatedAt: adminInstance.firestore.FieldValue.serverTimestamp(),
    };

    // Handle slug update if name changes and slug is not explicitly provided
    if (productData.name && productData.name !== oldProductData.name && !productData.slug) {
      dataToUpdate.slug = await generateUniqueSlugBE(productData.name, productId);
    } else if (productData.slug && productData.slug !== oldProductData.slug) {
      // If slug is explicitly provided, ensure it's unique
      dataToUpdate.slug = await generateUniqueSlugBE(productData.slug, productId);
    }
    
    // Handle category change and product count update
    if (productData.categoryId && productData.categoryId !== oldProductData.categoryId) {
      await updateCategoryProductCount(transaction, oldProductData.categoryId, false); // Decrement old category
      await updateCategoryProductCount(transaction, productData.categoryId, true);    // Increment new category
    }

    // Handle image deletion from storage if images array changes
    if (productData.images && Array.isArray(oldProductData.images)) {
        const oldImages = oldProductData.images;
        const newImages = productData.images;
        const imagesToDelete = oldImages.filter(oldImg => !newImages.includes(oldImg));
        
        for (const imageUrl of imagesToDelete) {
            try {
                const path = decodeURIComponent(new URL(imageUrl).pathname.split('/').pop()?.split('?')[0] || '');
                if (path && path.startsWith('products/')) { // Basic check
                    const imageRef = storage.bucket().file(path);
                    await imageRef.delete().catch(e => console.warn(`Failed to delete image ${path} from storage:`, e));
                    console.log(`(Service-Backend) Deleted image ${path} from storage for product ${productId}`);
                }
            } catch (e) {
                console.error(`Error parsing or deleting image URL ${imageUrl}:`, e);
            }
        }
    }


    transaction.update(productRef, dataToUpdate as Partial<ProductBE>);
    return { ...oldProductData, ...dataToUpdate, id: productId } as ProductBE; // Return optimistic update
  }).then(async () => {
      const updatedDoc = await productRef.get();
      return {id: updatedDoc.id, ...updatedDoc.data()} as ProductBE;
  });
};

export const deleteProductBE = async (productId: string): Promise<void> => {
  console.log(`(Service-Backend) deleteProductBE for ID: ${productId}`);
  const productRef = db.collection(PRODUCTS_COLLECTION).doc(productId);

  return db.runTransaction(async (transaction) => {
    const productDoc = await transaction.get(productRef);
    if (!productDoc.exists) {
      console.warn(`Product ${productId} not found for deletion.`);
      return;
    }
    const productData = productDoc.data() as ProductBE;

    // Delete images from storage
    if (productData.images && productData.images.length > 0) {
        for (const imageUrl of productData.images) {
            try {
                const path = decodeURIComponent(new URL(imageUrl).pathname.split('/').pop()?.split('?')[0] || '');
                 if (path && path.startsWith('products/')) { // Basic check
                    const imageRef = storage.bucket().file(path);
                    // No transaction for storage, attempt delete directly. If it fails, Firestore deletion will also fail if we rethrow.
                    // Or, log and continue. For now, log and continue.
                    await imageRef.delete().catch(e => console.warn(`Failed to delete image ${path} from storage during product deletion:`, e));
                    console.log(`(Service-Backend) Deleted image ${path} from storage for product ${productId} during deletion.`);
                }
            } catch (e) {
                console.error(`Error parsing or deleting image URL ${imageUrl} during product deletion:`, e);
            }
        }
    }
    
    // Delete reviews subcollection (best effort, can be many reviews)
    // This should be done carefully, possibly in batches or a separate scheduled function for large subcollections.
    const reviewsQuery = productRef.collection(REVIEWS_SUBCOLLECTION);
    const reviewsSnapshot = await reviewsQuery.limit(500).get(); // Limit to avoid excessive reads in one go
    if (!reviewsSnapshot.empty) {
        console.log(`(Service-Backend) Deleting ${reviewsSnapshot.size} reviews for product ${productId}...`);
        reviewsSnapshot.docs.forEach(doc => transaction.delete(doc.ref));
        // If more than 500, need a more robust solution (e.g. recursive delete CF trigger)
    }


    transaction.delete(productRef);
    if (productData.categoryId) {
      await updateCategoryProductCount(transaction, productData.categoryId, false);
    }
  });
};

export const updateProductStockBE = async (productId: string, quantityChange: number): Promise<void> => {
  console.log(`(Service-Backend) updateProductStockBE for ID ${productId}, change: ${quantityChange}`);
  const productRef = db.collection(PRODUCTS_COLLECTION).doc(productId);
  try {
    await productRef.update({
      stock: adminInstance.firestore.FieldValue.increment(quantityChange)
    });
  } catch (error) {
    console.error(`Error updating stock for product ${productId}:`, error);
    throw error;
  }
};

export const addProductReviewBE = async (
  productId: string, 
  reviewData: { rating: number; comment?: string }, 
  userId: string, 
  reviewerName?: string
): Promise<ProductReviewBE> => {
  console.log(`(Service-Backend) addProductReviewBE for product ${productId} by user ${userId}`);
  const productRef = db.collection(PRODUCTS_COLLECTION).doc(productId);
  const reviewCollectionRef = productRef.collection(REVIEWS_SUBCOLLECTION);
  
  return db.runTransaction(async (transaction) => {
    const productDoc = await transaction.get(productRef);
    if (!productDoc.exists) {
      throw new Error(`Product ${productId} not found.`);
    }
    const productData = productDoc.data() as ProductBE;

    const newReviewRef = reviewCollectionRef.doc(); 
    const dataToSave: ProductReviewWriteDataBE = {
      userId,
      rating: reviewData.rating,
      comment: reviewData.comment || '',
      reviewerName: reviewerName || 'Anonymous', // Default if not provided
      createdAt: adminInstance.firestore.FieldValue.serverTimestamp(),
    };
    transaction.set(newReviewRef, dataToSave);

    // Update product's averageRating and reviewCount
    const newReviewCount = (productData.reviewCount || 0) + 1;
    const newAverageRating = 
      ((productData.averageRating || 0) * (productData.reviewCount || 0) + reviewData.rating) / newReviewCount;
    
    transaction.update(productRef, {
      reviewCount: newReviewCount,
      averageRating: parseFloat(newAverageRating.toFixed(2)) // Round to 2 decimal places
    });
    
    // Construct the ProductReviewBE to return (createdAt will be FieldValue before commit)
    return {
        id: newReviewRef.id,
        ...dataToSave,
        createdAt: adminInstance.firestore.Timestamp.now() // Placeholder, actual value is server-generated
    } as unknown as ProductReviewBE;
  }).then(async (newReviewShell) => {
      const finalReviewDoc = await reviewCollectionRef.doc(newReviewShell.id).get();
      const finalProductDoc = await productRef.get(); // Re-fetch product to get its updated state
      return { 
          id: finalReviewDoc.id, 
          ...(finalReviewDoc.data() as Omit<ProductReviewBE, 'id' | 'createdAt'>),
          createdAt: finalReviewDoc.data()?.createdAt as admin.firestore.Timestamp // Ensure correct type
      };
  });
};

export interface GetProductReviewsOptionsBE {
  limit?: number;
  startAfter?: admin.firestore.DocumentSnapshot;
  orderBy?: 'createdAt' | 'rating';
  orderDirection?: 'asc' | 'desc';
}

export const getProductReviewsBE = async (
  productId: string, 
  options: GetProductReviewsOptionsBE = {}
): Promise<{ reviews: ProductReviewBE[], lastVisible?: admin.firestore.DocumentSnapshot }> => {
  console.log(`(Service-Backend) getProductReviewsBE for product ${productId} with options:`, options);
  try {
    const reviewCollectionRef = db.collection(PRODUCTS_COLLECTION).doc(productId).collection(REVIEWS_SUBCOLLECTION);
    let query: admin.firestore.Query = reviewCollectionRef;

    const sortBy = options.orderBy || 'createdAt';
    const sortDir = options.orderDirection || 'desc';
    query = query.orderBy(sortBy, sortDir);

    if (options.startAfter) query = query.startAfter(options.startAfter);
    if (options.limit) query = query.limit(options.limit);
    
    const snapshot = await query.get();
    if (snapshot.empty) return { reviews: [] };

    const reviews = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ProductReviewBE));
    const lastVisible = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : undefined;
    
    return { reviews, lastVisible };
  } catch (error) {
    console.error(`Error in getProductReviewsBE for product ${productId}:`, error);
    throw error;
  }
}; 