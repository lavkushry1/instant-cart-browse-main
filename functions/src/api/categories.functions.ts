// functions/src/api/categories.functions.ts

import * as functions from 'firebase-functions';
import {
  createCategoryBE,
  getCategoryBE,
  getAllCategoriesBE,
  updateCategoryBE,
  deleteCategoryBE,
} from '../../../src/services/categoryService'; // Adjust path
import { CategoryCreationData, CategoryUpdateData } from '../../../src/services/categoryService';

const ensureAdmin = (context: functions.https.CallableContext) => {
  if (!context.auth || !context.auth.token.admin) { 
    throw new functions.https.HttpsError('permission-denied', 'User must be an admin to perform this action.');
  }
};

console.log("(Cloud Functions) categories.functions.ts: Initializing with LIVE logic...");

export const createCategoryCF = functions.https.onCall(async (data: CategoryCreationData, context) => {
  console.log("(Cloud Function) createCategoryCF called with data:", data);
  ensureAdmin(context);
  try {
    if (!data.name) {
        throw new functions.https.HttpsError('invalid-argument', 'Category name is required.');
    }
    const newCategory = await createCategoryBE(data);
    return { success: true, category: newCategory };
  } catch (error: any) {
    console.error("Error in createCategoryCF:", error);
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError('internal', error.message || 'Failed to create category.');
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
  } catch (error: any) {
    console.error("Error in getCategoryCF:", error);
    res.status(500).send({ success: false, error: error.message || 'Failed to get category.' });
  }
});

export const getAllCategoriesCF = functions.https.onRequest(async (req, res) => {
  console.log("(Cloud Function) getAllCategoriesCF called with query:", req.query);
  try {
    let parentIdQuery = req.query.parentId as string | undefined | null;
    if (req.query.parentId === 'null') {
        parentIdQuery = null;
    } else if (typeof req.query.parentId === 'string') {
        parentIdQuery = req.query.parentId;
    } else {
        parentIdQuery = undefined; // Fetch all if not specified or not 'null'
    }
    const categories = await getAllCategoriesBE(parentIdQuery);
    res.status(200).send({ success: true, categories });
  } catch (error: any) {
    console.error("Error in getAllCategoriesCF:", error);
    res.status(500).send({ success: false, error: error.message || 'Failed to get all categories.' });
  }
});

export const updateCategoryCF = functions.https.onCall(async (data: { categoryId: string; updateData: CategoryUpdateData }, context) => {
  console.log("(Cloud Function) updateCategoryCF called with data:", data);
  ensureAdmin(context);
  try {
    const { categoryId, updateData } = data;
    if (!categoryId || !updateData || Object.keys(updateData).length === 0) {
      throw new functions.https.HttpsError('invalid-argument', 'Category ID and valid update data are required.');
    }
    const updatedCategory = await updateCategoryBE(categoryId, updateData);
    return { success: true, category: updatedCategory };
  } catch (error: any) {
    console.error("Error in updateCategoryCF:", error);
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError('internal', error.message || 'Failed to update category.');
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
  } catch (error: any) {
    console.error("Error in deleteCategoryCF:", error);
    if (error.message && error.message.includes("products are still associated")) {
        throw new functions.https.HttpsError('failed-precondition', error.message);
    }
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError('internal', error.message || 'Failed to delete category.');
  }
});
