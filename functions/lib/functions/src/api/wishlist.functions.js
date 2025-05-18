"use strict";
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
exports.removeFromWishlistCF = exports.addToWishlistCF = exports.getWishlistCF = void 0;
const functions = __importStar(require("firebase-functions/v1"));
// Use functions.https.CallableContext for typing context
const wishlistServiceBE_1 = require("../services/wishlistServiceBE"); // Corrected path
// Helper to check authentication
const ensureAuthenticated = (context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }
    return context.auth.uid;
};
exports.getWishlistCF = functions.https.onCall(async (data, context) => {
    const userId = ensureAuthenticated(context);
    try {
        const productIds = await (0, wishlistServiceBE_1.getWishlistBE)(userId);
        return { productIds };
    }
    catch (error) {
        console.error('Error in getWishlistCF:', error);
        throw new functions.https.HttpsError('internal', 'Failed to get wishlist', error.message);
    }
});
exports.addToWishlistCF = functions.https.onCall(async (data, context) => {
    const userId = ensureAuthenticated(context);
    const { productId } = data; // Now correctly typed
    if (!productId || typeof productId !== 'string') {
        // This check might be redundant if type system enforces WishlistRequestData correctly, but good for runtime safety
        throw new functions.https.HttpsError('invalid-argument', 'ProductId is required and must be a string.');
    }
    try {
        await (0, wishlistServiceBE_1.addToWishlistBE)(userId, productId);
        return { success: true, message: 'Product added to wishlist.' };
    }
    catch (error) {
        console.error('Error in addToWishlistCF:', error);
        throw new functions.https.HttpsError('internal', 'Failed to add to wishlist', error.message);
    }
});
exports.removeFromWishlistCF = functions.https.onCall(async (data, context) => {
    const userId = ensureAuthenticated(context);
    const { productId } = data; // Now correctly typed
    if (!productId || typeof productId !== 'string') {
        // Redundant check, similar to above
        throw new functions.https.HttpsError('invalid-argument', 'ProductId is required and must be a string.');
    }
    try {
        await (0, wishlistServiceBE_1.removeFromWishlistBE)(userId, productId);
        return { success: true, message: 'Product removed from wishlist.' };
    }
    catch (error) {
        console.error('Error in removeFromWishlistCF:', error);
        throw new functions.https.HttpsError('internal', 'Failed to remove from wishlist', error.message);
    }
});
//# sourceMappingURL=wishlist.functions.js.map