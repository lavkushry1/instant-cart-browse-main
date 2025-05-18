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
exports.moveSavedItemToCartCF = exports.getSavedItemsCF = exports.removeSavedItemCF = exports.addSavedItemCF = void 0;
const functions = __importStar(require("firebase-functions/v1"));
const savedItemsServiceBE_1 = require("../services/savedItemsServiceBE"); // Corrected path to BE service
// Initialize Firebase Admin SDK (idempotent call via import)
// adminInstance; // Removed as it's an unused expression and initialization is handled by import
console.log('(Cloud Functions) savedItems.functions.ts: Initializing...');
const ensureAuthenticated = (context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }
    return context.auth.uid;
};
exports.addSavedItemCF = functions.https.onCall(async (data, context) => {
    const userId = ensureAuthenticated(context);
    // Expect data to conform to SavedProductDataBE for productData part
    const { productId, productData } = data;
    if (!productId || !productData || productData.id !== productId || !productData.name || typeof productData.price !== 'number') {
        throw new functions.https.HttpsError('invalid-argument', 'Product ID and essential product data (id, name, price) are required.');
    }
    try {
        console.log(`(CF) addSavedItemCF: User: ${userId}, Product: ${productId}`);
        // productData now directly matches SavedProductDataBE
        const savedItem = await (0, savedItemsServiceBE_1.addSavedItemBE)(userId, productId, productData);
        return { success: true, savedItem };
    }
    catch (error) {
        console.error('(CF) Error in addSavedItemCF:', error);
        const err = error;
        throw new functions.https.HttpsError('internal', err.message || 'Failed to add item to saved list.');
    }
});
exports.removeSavedItemCF = functions.https.onCall(async (data, context) => {
    const userId = ensureAuthenticated(context);
    const { productId } = data;
    if (!productId) {
        throw new functions.https.HttpsError('invalid-argument', 'Product ID is required.');
    }
    try {
        console.log(`(CF) removeSavedItemCF: User: ${userId}, Product: ${productId}`);
        await (0, savedItemsServiceBE_1.removeSavedItemBE)(userId, productId);
        return { success: true };
    }
    catch (error) {
        console.error('(CF) Error in removeSavedItemCF:', error);
        const err = error;
        throw new functions.https.HttpsError('internal', err.message || 'Failed to remove item from saved list.');
    }
});
exports.getSavedItemsCF = functions.https.onCall(async (_data, context) => {
    const userId = ensureAuthenticated(context);
    try {
        console.log(`(CF) getSavedItemsCF: User: ${userId}`);
        const savedItems = await (0, savedItemsServiceBE_1.getSavedItemsBE)(userId);
        return { success: true, savedItems };
    }
    catch (error) {
        console.error('(CF) Error in getSavedItemsCF:', error);
        const err = error;
        throw new functions.https.HttpsError('internal', err.message || 'Failed to retrieve saved items.');
    }
});
exports.moveSavedItemToCartCF = functions.https.onCall(async (data, context) => {
    const userId = ensureAuthenticated(context);
    const { productId } = data;
    if (!productId) {
        throw new functions.https.HttpsError('invalid-argument', 'Product ID is required.');
    }
    try {
        console.log(`(CF) moveSavedItemToCartCF: User: ${userId}, Product: ${productId}`);
        // moveSavedItemToCartBE now returns Promise<void>, so we don't expect updatedCart here.
        // The client will be responsible for refetching the cart.
        await (0, savedItemsServiceBE_1.moveSavedItemToCartBE)(userId, productId);
        return { success: true }; // Indicate success, client refetches cart
    }
    catch (error) {
        console.error('(CF) Error in moveSavedItemToCartCF:', error);
        const err = error;
        throw new functions.https.HttpsError('internal', err.message || 'Failed to move item to cart.');
    }
});
//# sourceMappingURL=savedItems.functions.js.map