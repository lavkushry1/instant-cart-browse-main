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
  approved?: boolean; // Optional: for moderation
}

export type ReviewCreationData = Omit<ProductReviewBE, 'id' | 'productId' | 'createdAt' | 'updatedAt'>;
export type ReviewUpdateData = Partial<Omit<ProductReviewBE, 'id' | 'productId' | 'userId' | 'createdAt' | 'updatedAt'> & { approved?: boolean }>;

console.log(`(Service-Backend) Review Service: Using subcollection: ${PRODUCTS_COLLECTION}/{productId}/${REVIEWS_SUBCOLLECTION}`);

const updateProductRatingStats = async (transaction: admin.firestore.Transaction, productId: string) => {
  const productRef = db.collection(PRODUCTS_COLLECTION).doc(productId);
  // Query only approved reviews if moderation is enabled
  const reviewsQuery = db.collection(PRODUCTS_COLLECTION).doc(productId)
                         .collection(REVIEWS_SUBCOLLECTION)
                         .where('approved', '==', true); // Assuming only approved reviews contribute
  
  const reviewsSnapshot = await transaction.get(reviewsQuery);
  let totalRating = 0;
  const reviewCount = reviewsSnapshot.size;

  reviewsSnapshot.forEach(doc => {
    totalRating += (doc.data() as ProductReviewBE).rating;
  });

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
    const reviewRef = db.collection(PRODUCTS_COLLECTION).doc(productId)
                        .collection(REVIEWS_SUBCOLLECTION).doc(); 
    // const productRef = db.collection(PRODUCTS_COLLECTION).doc(productId); // Not needed if only updating via transaction helper

    await db.runTransaction(async (transaction) => {
      // Optional: Check if the user has already reviewed this product if needed
      const existingReviewQuery = db.collection(PRODUCTS_COLLECTION).doc(productId)
                                    .collection(REVIEWS_SUBCOLLECTION)
                                    .where('userId', '==', reviewData.userId).limit(1);
      const existingReviewSnap = await transaction.get(existingReviewQuery);
      if (!existingReviewSnap.empty) {
        // Decide on behavior: error, or allow update of existing (though updateReviewBE is better for that)
        // For now, let's throw an error to prevent duplicate reviews by same user.
        throw new Error('User has already reviewed this product.');
      }

      const dataToSave: any = {
        ...reviewData,
        productId: productId,
        approved: reviewData.approved === undefined ? true : reviewData.approved, // Default to approved, or implement moderation flow
        createdAt: adminInstance.firestore.FieldValue.serverTimestamp(),
        updatedAt: adminInstance.firestore.FieldValue.serverTimestamp(),
      };
      transaction.set(reviewRef, dataToSave);
      await updateProductRatingStats(transaction, productId); 
    });

    const newReviewSnap = await reviewRef.get();
    if (!newReviewSnap.exists) {
        throw new Error('Review document not found after creation');
    }
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
                  .where('approved', '==', true) // Typically only show approved reviews
                  .orderBy('createdAt', 'desc')
                  .limit(limit);

    if (startAfterDoc) {
      query = query.startAfter(startAfterDoc);
    }

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

export const updateReviewBE = async (productId: string, reviewId: string, reviewUpdateData: ReviewUpdateData): Promise<ProductReviewBE> => {
  console.log(`(Service-Backend) updateReviewBE for review ${reviewId} on product ${productId}:`, reviewUpdateData);
  try {
    const reviewRef = db.collection(PRODUCTS_COLLECTION).doc(productId)
                        .collection(REVIEWS_SUBCOLLECTION).doc(reviewId);

    await db.runTransaction(async (transaction) => {
      const reviewDoc = await transaction.get(reviewRef);
      if (!reviewDoc.exists) throw new Error('Review not found.');
      // TODO: Add permission check here: ensure current user is author or admin (requires auth context)

      const dataToUpdate: any = {
        ...reviewUpdateData,
        updatedAt: adminInstance.firestore.FieldValue.serverTimestamp(),
      };
      // Ensure fields like productId, userId, createdAt are not accidentally overwritten if not in ReviewUpdateData
      Object.keys(dataToUpdate).forEach(key => dataToUpdate[key] === undefined && delete dataToUpdate[key]);

      transaction.update(reviewRef, dataToUpdate);
      await updateProductRatingStats(transaction, productId);
    });

    const updatedReviewSnap = await reviewRef.get();
    if (!updatedReviewSnap.exists) {
        throw new Error('Review document not found after update.');
    }
    return { id: updatedReviewSnap.id, ...updatedReviewSnap.data() } as ProductReviewBE;

  } catch (error) {
    console.error(`Error updating review ${reviewId} for product ${productId}:`, error);
    throw error;
  }
};

export const deleteReviewBE = async (productId: string, reviewId: string): Promise<void> => {
  console.log(`(Service-Backend) deleteReviewBE for review ${reviewId} on product ${productId}`);
  try {
    const reviewRef = db.collection(PRODUCTS_COLLECTION).doc(productId)
                        .collection(REVIEWS_SUBCOLLECTION).doc(reviewId);
    
    await db.runTransaction(async (transaction) => {
      const reviewDoc = await transaction.get(reviewRef);
      if (!reviewDoc.exists) throw new Error('Review not found to delete.');
      // TODO: Add permission check here: ensure current user is author or admin

      transaction.delete(reviewRef);
      await updateProductRatingStats(transaction, productId);
    });

  } catch (error) {
    console.error(`Error deleting review ${reviewId} for product ${productId}:`, error);
    throw error;
  }
};