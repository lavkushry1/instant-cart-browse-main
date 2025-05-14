// src/services/reviewService.ts

// Import Firebase Admin resources
import {
  db, // Firestore instance from firebaseAdmin.ts
  adminInstance // For FieldValue, Timestamp etc. from firebaseAdmin.ts
} from '../../lib/firebaseAdmin'; // Adjust path as necessary
const PRODUCTS_COLLECTION = 'products';
const REVIEWS_SUBCOLLECTION = 'reviews';

export interface ProductReviewBE {
  id: string; 
  productId: string; 
  userId: string; 
  reviewerName?: string; 
  rating: number; 
  comment?: string;
  createdAt: any; // admin.firestore.Timestamp
  updatedAt: any; // admin.firestore.Timestamp
  approved?: boolean; 
}

export type ReviewCreationData = Omit<ProductReviewBE, 'id' | 'productId' | 'createdAt' | 'updatedAt'>;
export type ReviewUpdateData = Partial<Omit<ProductReviewBE, 'id' | 'productId' | 'userId' | 'createdAt' | 'updatedAt'> & { approved?: boolean }>;

console.log(`(Service-Backend) Review Service: Using subcollection: ${PRODUCTS_COLLECTION}/{productId}/${REVIEWS_SUBCOLLECTION}`);

const updateProductRatingStats = async (transaction: admin.firestore.Transaction, productId: string) => {
  const productRef = db.collection(PRODUCTS_COLLECTION).doc(productId);
  const reviewsQuery = db.collection(PRODUCTS_COLLECTION).doc(productId)
                         .collection(REVIEWS_SUBCOLLECTION)
                         .where('approved', '==', true); 
  
  const reviewsSnapshot = await transaction.get(reviewsQuery);
  let totalRating = 0;
  const reviewCount = reviewsSnapshot.size;
  reviewsSnapshot.forEach(doc => { totalRating += (doc.data() as ProductReviewBE).rating; });
  const averageRating = reviewCount > 0 ? parseFloat((totalRating / reviewCount).toFixed(1)) : 0;
  
  transaction.update(productRef, {
    averageRating: averageRating,
    reviewCount: reviewCount,
    updatedAt: adminInstance.firestore.FieldValue.serverTimestamp()
  });
  console.log(`Updated rating stats for product ${productId}: AvgRating=${averageRating}, Count=${reviewCount}`);
};

export const createReviewBE = async (productId: string, reviewData: ReviewCreationData): Promise<ProductReviewBE> => {
  console.log(`(Service-Backend) createReviewBE for product ${productId} with:`, reviewData);
  try {
    const reviewRef = db.collection(PRODUCTS_COLLECTION).doc(productId).collection(REVIEWS_SUBCOLLECTION).doc(); 
    await db.runTransaction(async (transaction: admin.firestore.Transaction) => {
      const existingReviewQuery = db.collection(PRODUCTS_COLLECTION).doc(productId)
                                    .collection(REVIEWS_SUBCOLLECTION)
                                    .where('userId', '==', reviewData.userId).limit(1);
      const existingReviewSnap = await transaction.get(existingReviewQuery);
      if (!existingReviewSnap.empty) throw new Error('User has already reviewed this product.');
      const dataToSave: any = {
        ...reviewData,
        productId: productId,
        approved: reviewData.approved === undefined ? false : reviewData.approved, // Default to not approved for moderation
        createdAt: adminInstance.firestore.FieldValue.serverTimestamp(),
        updatedAt: adminInstance.firestore.FieldValue.serverTimestamp(),
      };
      transaction.set(reviewRef, dataToSave);
      // Only update product rating if review is approved immediately
      if (dataToSave.approved) {
        await updateProductRatingStats(transaction, productId); 
      }
    });
    const newReviewSnap = await reviewRef.get();
    if (!newReviewSnap.exists) throw new Error('Review document not found after creation');
    return { id: newReviewSnap.id, ...newReviewSnap.data() } as ProductReviewBE;
  } catch (error) {
    console.error(`Error in createReviewBE for product ${productId}:`, error);
    throw error;
  }
};

export const getReviewsForProductBE = async (productId: string, limit: number = 10, startAfterDoc?: admin.firestore.DocumentSnapshot): Promise<{ reviews: ProductReviewBE[], lastVisible?: admin.firestore.DocumentSnapshot }> => {
  console.log(`(Service-Backend) getReviewsForProductBE for product ${productId}, limit: ${limit}`);
  try {
    let query: admin.firestore.Query = db.collection(PRODUCTS_COLLECTION).doc(productId)
                  .collection(REVIEWS_SUBCOLLECTION)
                  .where('approved', '==', true)
                  .orderBy('createdAt', 'desc')
                  .limit(limit);
    if (startAfterDoc) query = query.startAfter(startAfterDoc);
    const snapshot = await query.get();
    if (snapshot.empty) return { reviews: [] };
    const reviews = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ProductReviewBE));
    const lastVisible = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : undefined;
    return { reviews, lastVisible };
  } catch (error) {
    console.error(`Error in getReviewsForProductBE for product ${productId}:`, error);
    throw error;
  }
};

export interface GetReviewsAdminOptionsBE {
    productId?: string; // Filter by specific product
    userId?: string; // Filter by specific user
    approved?: boolean; // Filter by approval status (true, false, or undefined for all)
    limit?: number;
    startAfter?: any; // Firestore DocumentSnapshot
    sortBy?: 'createdAt' | 'rating';
    sortOrder?: 'asc' | 'desc';
}

// New function for Admin to get reviews with more filters
export const getReviewsAdminBE = async (options: GetReviewsAdminOptionsBE = {}): Promise<{ reviews: ProductReviewBE[], lastVisible?: any, totalCount?: number}> => {
    console.log(\`(Service-Backend) getReviewsAdminBE with options:\`, options);
    try {
        // This query needs to be on the root 'reviews' collection if not per product, 
        // or use collectionGroup query if reviews are subcollections and you want to query across all products.
        // Assuming for now an admin might look at reviews for a specific product OR all reviews.
        let query: admin.firestore.Query;
        if (options.productId) {
            query = db.collection(PRODUCTS_COLLECTION).doc(options.productId).collection(REVIEWS_SUBCOLLECTION);
        } else {
            query = db.collectionGroup(REVIEWS_SUBCOLLECTION); // Query across all products' reviews subcollections
        }

        if (options.userId) query = query.where('userId', '==', options.userId);
        if (options.approved !== undefined) query = query.where('approved', '==', options.approved);
        
        const sortBy = options.sortBy || 'createdAt';
        const sortOrder = options.sortOrder || 'desc';
        query = query.orderBy(sortBy, sortOrder);

        // TODO: Add total count logic if needed for pagination
        if (options.startAfter) query = query.startAfter(options.startAfter);
        if (options.limit) query = query.limit(options.limit);

        const snapshot = await query.get();
        if (snapshot.empty) return { reviews: [] };
        const reviews = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ProductReviewBE));
        const lastVisible = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : undefined;
        return { reviews, lastVisible, totalCount: reviews.length }; // totalCount is approximated
    } catch (error) {
        console.error("Error in getReviewsAdminBE:", error);
        throw error;
    }
};

export const updateReviewBE = async (productId: string, reviewId: string, reviewUpdateData: ReviewUpdateData): Promise<ProductReviewBE> => {
  console.log(`(Service-Backend) updateReviewBE for review ${reviewId} on product ${productId}:`, reviewUpdateData);
  try {
    const reviewRef = db.collection(PRODUCTS_COLLECTION).doc(productId).collection(REVIEWS_SUBCOLLECTION).doc(reviewId);
    await db.runTransaction(async (transaction: admin.firestore.Transaction) => {
      const reviewDoc = await transaction.get(reviewRef);
      if (!reviewDoc.exists) throw new Error('Review not found.');
      const dataToUpdate: any = { ...reviewUpdateData, updatedAt: adminInstance.firestore.FieldValue.serverTimestamp() };
      Object.keys(dataToUpdate).forEach(key => dataToUpdate[key] === undefined && delete dataToUpdate[key]);
      transaction.update(reviewRef, dataToUpdate);
      // If 'approved' status changes, product rating should be recalculated.
      await updateProductRatingStats(transaction, productId);
    });
    const updatedReviewSnap = await reviewRef.get();
    if (!updatedReviewSnap.exists) throw new Error('Review document not found after update.');
    return { id: updatedReviewSnap.id, ...updatedReviewSnap.data() } as ProductReviewBE;
  } catch (error) {
    console.error(`Error updating review ${reviewId} for product ${productId}:`, error);
    throw error;
  }
};

export const deleteReviewBE = async (productId: string, reviewId: string): Promise<void> => {
  console.log(`(Service-Backend) deleteReviewBE for review ${reviewId} on product ${productId}`);
  try {
    const reviewRef = db.collection(PRODUCTS_COLLECTION).doc(productId).collection(REVIEWS_SUBCOLLECTION).doc(reviewId);
    await db.runTransaction(async (transaction: admin.firestore.Transaction) => {
      const reviewDoc = await transaction.get(reviewRef);
      if (!reviewDoc.exists) throw new Error('Review not found to delete.');
      transaction.delete(reviewRef);
      await updateProductRatingStats(transaction, productId);
    });
  } catch (error) {
    console.error(`Error deleting review ${reviewId} for product ${productId}:`, error);
    throw error;
  }
};