"use strict";
// functions/src/api/reviews.functions.ts
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProductReviewsCF = exports.addReviewCF = void 0;
const functions = __importStar(require("firebase-functions/v1"));
const productServiceBE_1 = require("../services/productServiceBE"); // Corrected path and file name
const ensureAuthenticated = (context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated.');
    }
    return context.auth.uid;
};
const ensureAdmin = (context) => {
    ensureAuthenticated(context);
    if (!context.auth || !context.auth.token.admin) {
        throw new functions.https.HttpsError('permission-denied', 'User must be an admin.');
    }
    return context.auth.uid;
};
// Helper to get a single review for permission checks (can be expanded or moved to service layer)
const getReviewByIdForPermissionCheckBE = async (productId, reviewId) => {
    // This is a simplified direct DB access for permission check, ideally part of reviewServiceBE
    // For now, this is a placeholder. In a real app, use a service function from reviewService.ts
    console.warn("getReviewByIdForPermissionCheckBE: Mock implementation for permission check.");
    // Example structure if it were real:
    // const reviewRef = db.collection(PRODUCTS_COLLECTION).doc(productId).collection(REVIEWS_SUBCOLLECTION).doc(reviewId);
    // const docSnap = await reviewRef.get();
    // if (!docSnap.exists) return null;
    // return { id: docSnap.id, ...docSnap.data() } as ProductReviewBE;
    return Promise.resolve(null); // Placeholder
};
// Initialize Firebase Admin SDK if not already done (idempotent)
// adminInstance; // Removed as it's an unused expression and initialization is handled by import
console.log("(Cloud Functions) reviews.functions.ts: Initializing...");
exports.addReviewCF = functions.https.onCall(async (data, context) => {
    console.log("(Cloud Function) addReviewCF called with data:", data);
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated to add a review.');
    }
    if (!data.productId || typeof data.rating !== 'number' || data.rating < 1 || data.rating > 5) {
        throw new functions.https.HttpsError('invalid-argument', 'Product ID and a valid rating (1-5) are required.');
    }
    const userId = context.auth.uid;
    const reviewerName = context.auth.token.name || context.auth.token.email || 'Anonymous User';
    try {
        const reviewPayload = { rating: data.rating, comment: data.comment };
        const newReview = await (0, productServiceBE_1.addProductReviewBE)(data.productId, reviewPayload, userId, reviewerName);
        return { success: true, review: newReview };
    }
    catch (error) {
        console.error("Error in addReviewCF:", error);
        if (error instanceof functions.https.HttpsError)
            throw error;
        const message = error instanceof Error ? error.message : 'Failed to add review.';
        throw new functions.https.HttpsError('internal', message);
    }
});
exports.getProductReviewsCF = functions.https.onCall(async (data, context) => {
    console.log("(Cloud Function) getProductReviewsCF called with data:", data);
    if (!data.productId) {
        throw new functions.https.HttpsError('invalid-argument', 'Product ID is required.');
    }
    try {
        // Note: Client-sent data.startAfter (e.g. a string ID) needs to be converted 
        // to an admin.firestore.DocumentSnapshot for use with getProductReviewsBE.
        // This conversion (e.g., fetching the doc by ID) is not implemented here.
        const options = {
            limit: data.limit || 10,
            // startAfter: undefined, // Explicitly undefined until conversion is implemented
        };
        const result = await (0, productServiceBE_1.getProductReviewsBE)(data.productId, options);
        // Cannot send Admin SDK DocumentSnapshot directly to client.
        // If pagination with cursors is needed, send serializable parts of result.lastVisible.
        // For this version, returning reviews only. Client can use limit/offset or simpler cursor.
        return { success: true, reviews: result.reviews };
    }
    catch (error) {
        console.error("Error in getProductReviewsCF:", error);
        if (error instanceof functions.https.HttpsError)
            throw error;
        const message = error instanceof Error ? error.message : 'Failed to get reviews.';
        throw new functions.https.HttpsError('internal', message);
    }
});
//# sourceMappingURL=reviews.functions.js.map