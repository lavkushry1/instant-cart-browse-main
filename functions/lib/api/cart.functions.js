"use strict";
// functions/src/api/cart.functions.ts
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
exports.mergeGuestCartCF = exports.clearUserCartCF = exports.setItemInUserCartCF = exports.getUserCartCF = void 0;
const functions = __importStar(require("firebase-functions/v1"));
const cartService_1 = require("../services/cartService");
const ensureAuthenticated = (context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated to perform this action.');
    }
    return context.auth.uid;
};
console.log("(Cloud Functions) cart.functions.ts: Initializing...");
exports.getUserCartCF = functions.https.onCall(async (_data, context) => {
    functions.logger.info("(Cloud Function) getUserCartCF called.");
    const userId = ensureAuthenticated(context);
    try {
        const cart = await (0, cartService_1.getUserCartBE)(userId);
        if (cart) { // getUserCartBE returns UserCartBE | null
            return { success: true, cart };
        }
        // If service returns null (e.g. error or explicitly for not found if not returning empty cart)
        // We can choose to return an error or an empty cart structure.
        // Based on getUserCartBE returning {userId, items:[]} for empty, null means an error.
        throw new functions.https.HttpsError('internal', 'Failed to get user cart. Service returned null.');
    }
    catch (error) {
        functions.logger.error("Error in getUserCartCF:", error);
        if (error instanceof functions.https.HttpsError)
            throw error;
        const message = error instanceof Error ? error.message : 'Failed to get user cart.';
        throw new functions.https.HttpsError('internal', message);
    }
});
exports.setItemInUserCartCF = functions.https.onCall(async (data, context) => {
    functions.logger.info("(Cloud Function) setItemInUserCartCF called with data:", data);
    const userId = ensureAuthenticated(context);
    try {
        const { productId, quantity, product } = data;
        if (!productId || typeof quantity !== 'number' || product?.id !== productId) {
            throw new functions.https.HttpsError('invalid-argument', 'Valid Product ID, quantity, and matching product data are required.');
        }
        // Map client product data to ProductInCartBE for the service
        const productDataForService = {
            id: product.id,
            name: product.name,
            price: product.price,
            images: product.images && product.images.length > 0 ? product.images.slice(0, 1) : [], // Example: take first image
        };
        const updatedCart = await (0, cartService_1.setItemInUserCartBE)(userId, productId, quantity, productDataForService);
        if (updatedCart) {
            return { success: true, cart: updatedCart };
        }
        else {
            throw new functions.https.HttpsError('internal', 'Failed to update item in cart. Service returned null.');
        }
    }
    catch (error) {
        functions.logger.error("Error in setItemInUserCartCF:", error);
        if (error instanceof functions.https.HttpsError)
            throw error;
        const message = error instanceof Error ? error.message : 'Failed to update item in cart.';
        throw new functions.https.HttpsError('internal', message);
    }
});
exports.clearUserCartCF = functions.https.onCall(async (_data, context) => {
    functions.logger.info("(Cloud Function) clearUserCartCF called.");
    const userId = ensureAuthenticated(context);
    try {
        const result = await (0, cartService_1.clearUserCartBE)(userId);
        if (result.success) {
            return { success: true, message: 'Cart cleared successfully.' };
        }
        else {
            throw new functions.https.HttpsError('internal', result.error || 'Failed to clear cart.');
        }
    }
    catch (error) {
        functions.logger.error("Error in clearUserCartCF:", error);
        if (error instanceof functions.https.HttpsError)
            throw error;
        const message = error instanceof Error ? error.message : 'Failed to clear cart.';
        throw new functions.https.HttpsError('internal', message);
    }
});
exports.mergeGuestCartCF = functions.https.onCall(async (data, context) => {
    functions.logger.info("(Cloud Function) mergeGuestCartCF called with item count:", data.items?.length);
    const uid = ensureAuthenticated(context);
    if (!Array.isArray(data.items)) {
        functions.logger.error('Invalid data: items must be an array.', data);
        throw new functions.https.HttpsError('invalid-argument', 'Invalid data format: items must be an array.');
    }
    try {
        const result = await (0, cartService_1.mergeGuestCartToFirestore)(uid, data.items);
        if (result.success) {
            return { success: true, message: 'Guest cart merged successfully.' };
        }
        else {
            functions.logger.error('mergeGuestCartToFirestore failed:', result.error);
            throw new functions.https.HttpsError('internal', result.error || 'Failed to merge guest cart.');
        }
    }
    catch (error) {
        functions.logger.error("Error in mergeGuestCartCF:", error);
        if (error instanceof functions.https.HttpsError)
            throw error;
        const message = error instanceof Error ? error.message : 'An internal error occurred while merging the cart.';
        throw new functions.https.HttpsError('internal', message);
    }
});
//# sourceMappingURL=cart.functions.js.map