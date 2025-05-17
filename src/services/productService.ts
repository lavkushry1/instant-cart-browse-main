// src/services/productService.ts

// Import Firebase Client resources
import { 
    firestoreClient 
} from '../lib/firebaseClient';
import { 
    Timestamp as ClientTimestamp, 
    collection, 
    doc, 
    getDoc, 
    getDocs, 
    query, 
    where, 
    orderBy as clientOrderBy, 
    limit as clientLimit,
    startAfter as clientStartAfter,
    DocumentSnapshot as ClientDocumentSnapshot,
    QueryConstraint
} from 'firebase/firestore';

// Export the type for use in other files
export type { ClientDocumentSnapshot };

const PRODUCTS_COLLECTION = 'products';

// --- Client-Side Types (using ClientTimestamp) ---

export interface ProductVariation {
    type: string; 
    option: string; 
    priceModifier?: number; 
    stock?: number; 
}

export interface ProductReview {
    id: string;
    userId: string;
    rating: number; 
    comment?: string;
    reviewerName?: string; 
    createdAt: ClientTimestamp; // Use ClientTimestamp
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
  // SEO Fields
  slug?: string; // URL-friendly identifier
  seoTitle?: string; // For <title> tag
  seoDescription?: string; // For <meta name="description"> tag
  createdAt: ClientTimestamp; // Use ClientTimestamp
  updatedAt: ClientTimestamp; // Use ClientTimestamp
}

// --- Client-Side Product Fetching ---

export interface GetAllProductsOptions {
    categoryId?: string;
    featured?: boolean;
    searchQuery?: string; 
    minPrice?: number;
    maxPrice?: number;
    isEnabled?: boolean;
    sortBy?: 'price' | 'createdAt' | 'name' | 'averageRating' | 'stock'; // Added stock for sorting
    sortOrder?: 'asc' | 'desc';
    limit?: number;
    startAfter?: ClientDocumentSnapshot; 
}

export const getProducts = async (options: GetAllProductsOptions = {}): Promise<{ products: Product[], lastVisible?: ClientDocumentSnapshot, totalCount?: number }> => {
  console.log('(Service-Client) getProducts with options:', options);
  if (!firestoreClient) {
    console.error("Firestore client not initialized. Cannot fetch products.");
    return { products: [], totalCount: 0 };
  }
  try {
    const qConstraints: QueryConstraint[] = [];

    if (options.categoryId) qConstraints.push(where('categoryId', '==', options.categoryId));
    if (options.featured !== undefined) qConstraints.push(where('featured', '==', options.featured));
    if (options.isEnabled !== undefined) qConstraints.push(where('isEnabled', '==', options.isEnabled));
    else qConstraints.push(where('isEnabled', '==', true)); 

    if (options.minPrice !== undefined) qConstraints.push(where('price', '>=', options.minPrice));
    if (options.maxPrice !== undefined) qConstraints.push(where('price', '<=', options.maxPrice));
    
    const sortBy = options.sortBy || 'createdAt';
    const sortOrder = options.sortOrder || 'desc';
    qConstraints.push(clientOrderBy(sortBy, sortOrder));

    if (options.startAfter) qConstraints.push(clientStartAfter(options.startAfter));
    if (options.limit) qConstraints.push(clientLimit(options.limit));
    
    const productsCollectionRef = collection(firestoreClient, PRODUCTS_COLLECTION);
    const finalQuery = query(productsCollectionRef, ...qConstraints);
    
    const snapshot = await getDocs(finalQuery);
    if (snapshot.empty) return { products: [], totalCount: 0 };

    const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
    const lastVisible = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : undefined;
    
    return { products, lastVisible, totalCount: products.length }; 

  } catch (error) {
    console.error("Error in getProducts (client-side):", error);
    throw error;
  }
};

export const getProductById = async (productId: string): Promise<Product | null> => {
  console.log(`(Service-Client) getProductById for ID: ${productId}`);
  if (!firestoreClient) {
    console.error("Firestore client not initialized. Cannot fetch product.");
    return null;
  }
  try {
    const docRef = doc(firestoreClient, PRODUCTS_COLLECTION, productId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    return { id: docSnap.id, ...docSnap.data() } as Product;
  } catch (error) {
    console.error(`Error in getProductById (client-side) for ${productId}:`, error);
    throw error;
  }
};

// Placeholder for client-side review fetching if needed, though this is usually via CF.
// export const getProductReviews = async (productId: string, options = {}): Promise<ProductReview[]> => {
//   // ... client-side logic to fetch reviews, perhaps from a subcollection using firestoreClient
//   return [];
// };