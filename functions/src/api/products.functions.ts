// functions/src/api/products.functions.ts

import * as functions from 'firebase-functions';
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
  } catch (error: any) {
    console.error("Error in createProductCF:", error);
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError('internal', error.message || 'Failed to create product.');
  }
});

export const getProductByIdCF = functions.https.onRequest(async (req, res) => {
  console.log("(Cloud Function) getProductByIdCF called.");
  try {
    const productId = req.query.id as string;
    if (!productId) {
      res.status(400).send({ success: false, error: 'Product ID is required.' });
      return;
    }
    const product = await getProductByIdBE(productId);
    if (product) {
      res.status(200).send({ success: true, product });
    } else {
      res.status(404).send({ success: false, error: 'Product not found.' });
    }
  } catch (error: any) {
    console.error("Error in getProductByIdCF:", error);
    res.status(500).send({ success: false, error: error.message || 'Failed to get product.' });
  }
});

export const getAllProductsCF = functions.https.onRequest(async (req, res) => {
  console.log("(Cloud Function) getAllProductsCF called with query:", req.query);
  try {
    const options: GetAllProductsOptionsBE = {
      categoryId: req.query.categoryId as string | undefined,
      featured: req.query.featured ? req.query.featured === 'true' : undefined,
      isEnabled: req.query.isEnabled === 'false' ? false : true, // Default to true unless 'false' is specified
      minPrice: req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined,
      maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined,
      sortBy: req.query.sortBy as any || 'createdAt',
      sortOrder: req.query.sortOrder as any || 'desc',
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 20, // Default limit
      // startAfter needs to be handled carefully - it's a Firestore DocumentSnapshot usually passed from client after JSON stringification
      // For a real implementation, you'd need to deserialize this correctly or pass cursor fields.
      // startAfter: req.query.startAfter ? (JSON.parse(req.query.startAfter as string)) : undefined, 
    };
    const result = await getAllProductsBE(options);
    res.status(200).send({ success: true, ...result });
  } catch (error: any) {
    console.error("Error in getAllProductsCF:", error);
    res.status(500).send({ success: false, error: error.message || 'Failed to get all products.' });
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
  } catch (error: any) {
    console.error("Error in updateProductCF:", error);
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError('internal', error.message || 'Failed to update product.');
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
  } catch (error: any) {
    console.error("Error in deleteProductCF:", error);
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError('internal', error.message || 'Failed to delete product.');
  }
});
