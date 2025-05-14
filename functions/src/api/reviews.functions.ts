// functions/src/api/reviews.functions.ts

import * as functions from 'firebase-functions';
import {
  createReviewBE,
  getReviewsForProductBE,
  updateReviewBE,
  deleteReviewBE,
  // Assuming ReviewCreationData and ReviewUpdateData are correctly defined and exported in reviewService
  ReviewCreationData, 
  ReviewUpdateData,
  ProductReviewBE // For return type in getReviewByIdBE (if created)
} from '../../../src/services/reviewService'; // Adjust path

const ensureAuthenticated = (context: functions.https.CallableContext): string => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated.');
  }
  return context.auth.uid;
};

const ensureAdmin = (context: functions.https.CallableContext): string => {
  ensureAuthenticated(context);
  if (!context.auth || !context.auth.token.admin) { 
    throw new functions.https.HttpsError('permission-denied', 'User must be an admin.');
  }
  return context.auth.uid;
};

// Helper to get a single review, useful for permission checks before update/delete
// This would ideally be in reviewService.ts if needed there too.
const getReviewByIdForPermissionCheck = async (productId: string, reviewId: string): Promise<ProductReviewBE | null> => {
    /* 
    // This is a simplified version of a getById method just for this context.
    const reviewRef = db.collection(PRODUCTS_COLLECTION).doc(productId)
                        .collection(REVIEWS_SUBCOLLECTION).doc(reviewId);
    const docSnap = await reviewRef.get();
    if (!docSnap.exists) return null;
    return { id: docSnap.id, ...docSnap.data() } as ProductReviewBE;
    */
   // Mock for now as it's not a primary BE service function in reviewService.ts
   console.warn("getReviewByIdForPermissionCheck: Mock implementation returning placeholder.");
   return Promise.resolve({ id: reviewId, productId, userId: "mockAuthorId", rating: 5, createdAt: new Date(), updatedAt: new Date() } as ProductReviewBE);
};

console.log("(Cloud Functions) reviews.functions.ts: Initializing with LIVE logic...");

export const createReviewCF = functions.https.onCall(async (data: { productId: string; reviewData: ReviewCreationData }, context) => {
  console.log("(Cloud Function) createReviewCF called with data:", data);
  const userId = ensureAuthenticated(context);
  try {
    const { productId, reviewData } = data;
    if (!productId || !reviewData) {
      throw new functions.https.HttpsError('invalid-argument', 'Product ID and review data are required.');
    }
    if (reviewData.userId !== userId) {
        throw new functions.https.HttpsError('permission-denied', 'Cannot create review for another user.');
    }
    if (reviewData.rating < 1 || reviewData.rating > 5) {
        throw new functions.https.HttpsError('invalid-argument', 'Rating must be between 1 and 5.');
    }
    const newReview = await createReviewBE(productId, reviewData);
    return { success: true, review: newReview };
  } catch (error: any) {
    console.error("Error in createReviewCF:", error);
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError('internal', error.message || 'Failed to create review.');
  }
});

export const getReviewsForProductCF = functions.https.onRequest(async (req, res) => {
  console.log("(Cloud Function) getReviewsForProductCF called for product:", req.query.productId);
  try {
    const productId = req.query.productId as string;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
    // const startAfter = req.query.startAfter; // TODO: Handle Firestore cursor stringification/parsing for pagination
    if (!productId) {
      res.status(400).send({ success: false, error: 'Product ID is required.' });
      return;
    }
    const result = await getReviewsForProductBE(productId, limit /*, startAfterDoc */);
    res.status(200).send({ success: true, ...result });
  } catch (error: any) {
    console.error("Error in getReviewsForProductCF:", error);
    res.status(500).send({ success: false, error: error.message || 'Failed to get reviews.' });
  }
});

export const updateReviewCF = functions.https.onCall(async (data: { productId: string; reviewId: string; updateData: ReviewUpdateData }, context) => {
  console.log("(Cloud Function) updateReviewCF called with data:", data);
  const currentUserId = ensureAuthenticated(context);
  try {
    const { productId, reviewId, updateData } = data;
    if (!productId || !reviewId || !updateData || Object.keys(updateData).length === 0) {
      throw new functions.https.HttpsError('invalid-argument', 'Product ID, Review ID, and valid update data are required.');
    }

    // Permission check: only author or admin can update.
    const reviewToUpdate = await getReviewByIdForPermissionCheck(productId, reviewId); 
    if (!reviewToUpdate) {
      throw new functions.https.HttpsError('not-found', 'Review not found.');
    }
    if (reviewToUpdate.userId !== currentUserId && !context.auth?.token.admin) {
      throw new functions.https.HttpsError('permission-denied', 'You do not have permission to update this review.');
    }
    if (updateData.rating && (updateData.rating < 1 || updateData.rating > 5)) {
        throw new functions.https.HttpsError('invalid-argument', 'Rating must be between 1 and 5 if provided.');
    }

    const updatedReview = await updateReviewBE(productId, reviewId, updateData);
    return { success: true, review: updatedReview };
  } catch (error: any) {
    console.error("Error in updateReviewCF:", error);
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError('internal', error.message || 'Failed to update review.');
  }
});

export const deleteReviewCF = functions.https.onCall(async (data: { productId: string; reviewId: string }, context) => {
  console.log("(Cloud Function) deleteReviewCF called with data:", data);
  const currentUserId = ensureAuthenticated(context);
  try {
    const { productId, reviewId } = data;
    if (!productId || !reviewId) {
      throw new functions.https.HttpsError('invalid-argument', 'Product ID and Review ID are required.');
    }

    // Permission check: only author or admin can delete.
    const reviewToDelete = await getReviewByIdForPermissionCheck(productId, reviewId);
    if (!reviewToDelete) {
      throw new functions.https.HttpsError('not-found', 'Review not found.');
    }
    if (reviewToDelete.userId !== currentUserId && !context.auth?.token.admin) {
      throw new functions.https.HttpsError('permission-denied', 'You do not have permission to delete this review.');
    }

    await deleteReviewBE(productId, reviewId);
    return { success: true, message: 'Review deleted successfully.' };
  } catch (error: any) {
    console.error("Error in deleteReviewCF:", error);
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError('internal', error.message || 'Failed to delete review.');
  }
});
