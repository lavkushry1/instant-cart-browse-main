// functions/src/api/categories.functions.ts

import * as functions from 'firebase-functions/v1';
import {
  createCategoryBE,
  getCategoryBE,
  getAllCategoriesBE,
  updateCategoryBE,
  deleteCategoryBE,
} from '../services/categoryServiceBE'; // Corrected path
import { 
    CategoryCreationDataFromClient, // Corrected type
    CategoryUpdateDataFromClient    // Corrected type
} from '../services/categoryServiceBE'; // Corrected path

const ensureAdmin = (context: functions.https.CallableContext) => {
  if (!context.auth || !context.auth.token.admin) { 
    throw new functions.https.HttpsError('permission-denied', 'User must be an admin to perform this action.');
  }
};

console.log("(Cloud Functions) categories.functions.ts: Initializing with LIVE logic...");

export const createCategoryCF = functions.https.onCall(async (data: CategoryCreationDataFromClient, context) => {
  console.log("(Cloud Function) createCategoryCF called with data:", data);
  ensureAdmin(context);
  try {
    if (!data.name) {
        throw new functions.https.HttpsError('invalid-argument', 'Category name is required.');
    }
    const newCategory = await createCategoryBE(data);
    return { success: true, category: newCategory };
  } catch (error: unknown) {
    console.error("Error in createCategoryCF:", error);
    if (error instanceof functions.https.HttpsError) throw error;
    const message = error instanceof Error ? error.message : 'Failed to create category.';
    throw new functions.https.HttpsError('internal', message);
  }
});

export const getCategoryCF = functions.https.onRequest(async (req, res) => {
  console.log("(Cloud Function) getCategoryCF called.");
  try {
    const idOrSlug = req.query.id as string;
    if (!idOrSlug) {
      res.status(400).send({ success: false, error: 'Category ID or slug is required.' });
      return;
    }
    const category = await getCategoryBE(idOrSlug);
    if (category) {
      res.status(200).send({ success: true, category });
    } else {
      res.status(404).send({ success: false, error: 'Category not found.' });
    }
  } catch (error: unknown) {
    console.error("Error in getCategoryCF:", error);
    const message = error instanceof Error ? error.message : 'Failed to get category.';
    res.status(500).send({ success: false, error: message });
  }
});

// export const getAllCategoriesCF = functions.https.onRequest(async (req, res) => {
//   console.log("(Cloud Function) getAllCategoriesCF called with query:", req.query);
//   try {
//     let parentIdQuery = req.query.parentId as string | undefined | null;
//     if (req.query.parentId === 'null') {
//         parentIdQuery = null;
//     } else if (typeof req.query.parentId === 'string') {
//         parentIdQuery = req.query.parentId;
//     } else {
//         parentIdQuery = undefined; // Fetch all if not specified or not 'null'
//     }
//     const categories = await getAllCategoriesBE(parentIdQuery);
//     res.status(200).send({ success: true, categories });
//   } catch (error: unknown) {
//     console.error("Error in getAllCategoriesCF:", error);
//     const message = error instanceof Error ? error.message : 'Failed to get all categories.';
//     res.status(500).send({ success: false, error: message });
//   }
// });

// Rewritten getAllCategoriesCF as a callable function for Admin use
export const getAllCategoriesCF = functions.https.onCall(async (data, context) => {
  console.log("(Cloud Function) getAllCategoriesCF (callable) called.");
  ensureAdmin(context); // Ensure only admins can call this
  try {
    // Admin panel typically needs all categories for management and hierarchical display
    const categories = await getAllCategoriesBE(); // Fetches all categories
    return { success: true, categories };
  } catch (error: unknown) {
    console.error("Error in getAllCategoriesCF (callable):", error);
    if (error instanceof functions.https.HttpsError) throw error;
    const message = error instanceof Error ? error.message : 'Failed to get all categories.';
    throw new functions.https.HttpsError('internal', message);
  }
});

export const updateCategoryCF = functions.https.onCall(async (data: { categoryId: string; updateData: CategoryUpdateDataFromClient }, context) => {
  console.log("(Cloud Function) updateCategoryCF called with data:", data);
  ensureAdmin(context);
  try {
    const { categoryId, updateData } = data;
    if (!categoryId || !updateData || Object.keys(updateData).length === 0) {
      throw new functions.https.HttpsError('invalid-argument', 'Category ID and valid update data are required.');
    }
    const updatedCategory = await updateCategoryBE(categoryId, updateData);
    return { success: true, category: updatedCategory };
  } catch (error: unknown) {
    console.error("Error in updateCategoryCF:", error);
    if (error instanceof functions.https.HttpsError) throw error;
    const message = error instanceof Error ? error.message : 'Failed to update category.';
    throw new functions.https.HttpsError('internal', message);
  }
});

export const deleteCategoryCF = functions.https.onCall(async (data: { categoryId: string }, context) => {
  console.log("(Cloud Function) deleteCategoryCF called with data:", data);
  ensureAdmin(context);
  try {
    const { categoryId } = data;
    if (!categoryId) {
      throw new functions.https.HttpsError('invalid-argument', 'Category ID is required.');
    }
    await deleteCategoryBE(categoryId);
    return { success: true, message: 'Category deleted successfully.' };
  } catch (error: unknown) {
    console.error("Error in deleteCategoryCF:", error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete category.';
    
    // Check for specific error messages from deleteCategoryBE
    if (error instanceof Error && error.message) {
      if (error.message.includes("products are still associated")) {
        throw new functions.https.HttpsError('failed-precondition', error.message);
      }
      if (error.message.includes("subcategories exist")) {
        throw new functions.https.HttpsError('failed-precondition', error.message); 
      }
    }
    
    // If it's already an HttpsError from ensureAdmin or argument validation, rethrow it
    if (error instanceof functions.https.HttpsError) throw error;
    
    // For other generic errors from deleteCategoryBE or unexpected issues
    throw new functions.https.HttpsError('internal', errorMessage);
  }
});
