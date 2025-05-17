// functions/src/api/products.functions.ts

import * as functions from 'firebase-functions/v1';
import {
  createProductBE,
  getProductByIdBE,
  getAllProductsBE,
  updateProductBE,
  deleteProductBE,
} from '../../../src/services/productService'; // Adjust path
import { ProductCreationData, ProductUpdateData, GetAllProductsOptionsBE } from '../../../src/services/productService';

// Helper to check for admin role (example)
const ensureAdmin = (context: functions.https.CallableContext) => {
  if (!context.auth || !context.auth.token.admin) {
    throw new functions.https.HttpsError('permission-denied', 'User must be an admin to perform this action.');
  }
};

console.log("(Cloud Functions) products.functions.ts: Initializing with LIVE logic...");

export const createProductCF = functions.https.onCall(async (data: ProductCreationData, context) => {
  console.log("(Cloud Function) createProductCF called with data:", data);
  ensureAdmin(context);
  try {
    // TODO: Add more specific validation for ProductCreationData if needed
    if (!data.name || !data.price || !data.categoryId || !data.stock) {
        throw new functions.https.HttpsError('invalid-argument', 'Required product fields (name, price, categoryId, stock) are missing.');
    }
    const newProduct = await createProductBE(data);
    return { success: true, product: newProduct };
  } catch (error: unknown) {
    console.error("Error in createProductCF:", error);
    if (error instanceof functions.https.HttpsError) throw error;
    const message = error instanceof Error ? error.message : 'Failed to create product.';
    throw new functions.https.HttpsError('internal', message);
  }
});

export const getProductByIdCF = functions.https.onCall(async (data: { productId: string }, context) => {
  console.log("(Cloud Function) getProductByIdCF (callable) called with data:", data);
  // No admin check here, as this might be used publicly. 
  // getProductByIdBE fetches regardless of isEnabled status, which is fine for admin edit form.
  try {
    const { productId } = data;
    if (!productId) {
      throw new functions.https.HttpsError('invalid-argument', 'Product ID is required.');
    }
    const product = await getProductByIdBE(productId);
    if (product) {
      return { success: true, product };
    } else {
      // To align with HttpsError for client-side handling if preferred for not found
      throw new functions.https.HttpsError('not-found', 'Product not found.');
      // return { success: false, error: 'Product not found.' }; // Alternative return
    }
  } catch (error: unknown) {
    console.error("Error in getProductByIdCF (callable):", error);
    if (error instanceof functions.https.HttpsError) throw error;
    const message = error instanceof Error ? error.message : 'Failed to get product.';
    throw new functions.https.HttpsError('internal', message);
  }
});

export const getAllProductsCF = functions.https.onCall(async (data: GetAllProductsOptionsBE | undefined, context) => {
  console.log("(Cloud Function) getAllProductsCF (callable) called with data:", data);
  ensureAdmin(context);
  try {
    // Use data directly as options, or default to empty object if undefined
    const options: GetAllProductsOptionsBE = data || {}; 
    // The admin panel sends isEnabled: undefined to fetch all products (enabled and disabled)
    // It also sends sortBy and sortOrder. Default limit can be applied here or in BE.
    // Example default options if not provided by client, or let BE handle its defaults:
    // const defaultOptions: GetAllProductsOptionsBE = { limit: 20, sortBy: 'createdAt', sortOrder: 'desc' };
    // const finalOptions = { ...defaultOptions, ...options };

    const result = await getAllProductsBE(options); // Pass client options to BE service
    return { success: true, products: result.products, totalCount: result.totalCount, lastVisible: result.lastVisible }; // lastVisible might be needed for pagination
  } catch (error: unknown) {
    console.error("Error in getAllProductsCF (callable):", error);
    if (error instanceof functions.https.HttpsError) throw error;
    const message = error instanceof Error ? error.message : 'Failed to get all products.';
    throw new functions.https.HttpsError('internal', message);
  }
});

export const updateProductCF = functions.https.onCall(async (data: { productId: string; updateData: ProductUpdateData }, context) => {
  console.log("(Cloud Function) updateProductCF called with data:", data);
  ensureAdmin(context);
  try {
    const { productId, updateData } = data;
    if (!productId || !updateData || Object.keys(updateData).length === 0) {
      throw new functions.https.HttpsError('invalid-argument', 'Product ID and valid update data are required.');
    }
    // TODO: Server-side validation of updateData fields
    const updatedProduct = await updateProductBE(productId, updateData);
    return { success: true, product: updatedProduct };
  } catch (error: unknown) {
    console.error("Error in updateProductCF:", error);
    if (error instanceof functions.https.HttpsError) throw error;
    const message = error instanceof Error ? error.message : 'Failed to update product.';
    throw new functions.https.HttpsError('internal', message);
  }
});

export const deleteProductCF = functions.https.onCall(async (data: { productId: string }, context) => {
  console.log("(Cloud Function) deleteProductCF called with data:", data);
  ensureAdmin(context);
  try {
    const { productId } = data;
    if (!productId) {
      throw new functions.https.HttpsError('invalid-argument', 'Product ID is required.');
    }
    await deleteProductBE(productId);
    return { success: true, message: 'Product deleted successfully.' };
  } catch (error: unknown) {
    console.error("Error in deleteProductCF:", error);
    if (error instanceof functions.https.HttpsError) throw error;
    const message = error instanceof Error ? error.message : 'Failed to delete product.';
    throw new functions.https.HttpsError('internal', message);
  }
});
