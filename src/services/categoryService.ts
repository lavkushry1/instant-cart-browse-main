// src/services/categoryService.ts

import * as admin from 'firebase-admin'; // Import for Timestamp type
// Import Firebase Admin resources
import {
  db, // Firestore instance from firebaseAdmin.ts
  adminInstance // For FieldValue, Timestamp etc. from firebaseAdmin.ts
} from '../lib/firebaseAdmin'; // Corrected path
const CATEGORIES_COLLECTION = 'categories';
const PRODUCTS_COLLECTION = 'products'; // For checking product associations

export interface Category {
  id: string; 
  name: string;
  slug: string; 
  description?: string;
  imageUrl?: string;
  parentId?: string | null; 
  productCount?: number; 
  isEnabled: boolean;
  createdAt: admin.firestore.Timestamp | admin.firestore.FieldValue; // Corrected type
  updatedAt: admin.firestore.Timestamp | admin.firestore.FieldValue; // Corrected type
}

export type CategoryCreationData = Omit<Category, 'id' | 'createdAt' | 'updatedAt' | 'productCount' | 'slug'>;
export type CategoryUpdateData = Partial<Omit<Category, 'id' | 'createdAt' | 'updatedAt' | 'productCount'>>;

// Interface for the data structure being saved to Firestore for creation
interface CategoryWriteData extends CategoryCreationData {
  slug: string;
  productCount: number;
  isEnabled: boolean; // isEnabled is part of CategoryCreationData but explicitly ensuring it here
  createdAt: admin.firestore.FieldValue;
  updatedAt: admin.firestore.FieldValue;
}

console.log(`(Service-Backend) Category Service: Using Firestore collection: ${CATEGORIES_COLLECTION}`);

export const createCategoryBE = async (categoryData: CategoryCreationData): Promise<Category> => {
  console.log('(Service-Backend) createCategoryBE called with:', categoryData);
  const slug = categoryData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
  try {
    const slugCheck = await db.collection(CATEGORIES_COLLECTION).where('slug', '==', slug).limit(1).get();
    if (!slugCheck.empty) {
      throw new Error(`Category slug "${slug}" already exists.`);
    }

    const dataToSave: CategoryWriteData = {
      ...categoryData,
      slug,
      productCount: 0, // Default value
      isEnabled: categoryData.isEnabled === undefined ? true : categoryData.isEnabled,
      createdAt: adminInstance.firestore.FieldValue.serverTimestamp(),
      updatedAt: adminInstance.firestore.FieldValue.serverTimestamp(),
    };
    // Object.keys(dataToSave).forEach(key => dataToSave[key] === undefined && delete dataToSave[key]); // Not strictly needed with strong types

    const docRef = await db.collection(CATEGORIES_COLLECTION).add(dataToSave);
    const newDoc = await docRef.get();
    if (!newDoc.exists) {
        throw new Error('Category document not found after creation');
    }
    return { id: newDoc.id, ...newDoc.data() } as Category;
  } catch (error) {
    console.error("Error in createCategoryBE:", error);
    throw error;
  }
};

export const getCategoryBE = async (idOrSlug: string): Promise<Category | null> => {
  console.log(`(Service-Backend) getCategoryBE for: ${idOrSlug}`);
  try {
    let docSnap: admin.firestore.DocumentSnapshot | undefined;
    // Basic check for Firestore ID format (20 alphanumeric chars)
    if (idOrSlug.length === 20 && /^[a-zA-Z0-9]+$/.test(idOrSlug)) { 
        const docRefById = db.collection(CATEGORIES_COLLECTION).doc(idOrSlug);
        docSnap = await docRefById.get();
    }
    
    if (!docSnap || !docSnap.exists) {
        const queryBySlug = db.collection(CATEGORIES_COLLECTION).where('slug', '==', idOrSlug).limit(1);
        const snapshotBySlug = await queryBySlug.get();
        if (!snapshotBySlug.empty) {
            docSnap = snapshotBySlug.docs[0];
        }
    }

    if (!docSnap || !docSnap.exists) return null;
    return { id: docSnap.id, ...docSnap.data() } as Category;
  } catch (error) {
    console.error(`Error in getCategoryBE for ${idOrSlug}:`, error);
    throw error;
  }
};

export const getAllCategoriesBE = async (parentId?: string | null): Promise<Category[]> => {
  console.log(`(Service-Backend) getAllCategoriesBE called ${parentId !== undefined ? 'for parentId: ' + parentId : 'for all/top-level'}`);
  try {
    let query: admin.firestore.Query = db.collection(CATEGORIES_COLLECTION);
    if (parentId === null) { 
        query = query.where('parentId', '==', null);
    } else if (typeof parentId === 'string' && parentId.length > 0) { 
        query = query.where('parentId', '==', parentId);
    }
    // If parentId is undefined, all categories are fetched (can be numerous)
    
    const snapshot = await query.orderBy('name', 'asc').get();
    if (snapshot.empty) return [];
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
  } catch (error) {
    console.error("Error in getAllCategoriesBE:", error);
    throw error;
  }
};

export const updateCategoryBE = async (categoryId: string, categoryData: CategoryUpdateData): Promise<Category> => {
  console.log(`(Service-Backend) updateCategoryBE for ID ${categoryId} with:`, categoryData);
  const newSlug = categoryData.name ? categoryData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '') : undefined;
  try {
    const docRef = db.collection(CATEGORIES_COLLECTION).doc(categoryId);
    const dataToUpdate: Partial<Omit<Category, 'id' | 'createdAt' | 'productCount'> & {updatedAt: admin.firestore.FieldValue}> = {
         ...categoryData,
         updatedAt: adminInstance.firestore.FieldValue.serverTimestamp() 
    };
    if (newSlug) {
        dataToUpdate.slug = newSlug;
    }

    await docRef.update(dataToUpdate);
    const updatedDoc = await docRef.get();
    if (!updatedDoc.exists) {
        throw new Error('Category document not found after update.');
    }
    return { id: updatedDoc.id, ...updatedDoc.data() } as Category;
  } catch (error) {
    console.error(`Error in updateCategoryBE for ${categoryId}:`, error);
    throw error;
  }
};

export const deleteCategoryBE = async (categoryId: string): Promise<void> => {
  console.log(`(Service-Backend) deleteCategoryBE for ID: ${categoryId}`);
  try {
    // Check 1: Products associated with this category
    const productsInCategory = await db.collection(PRODUCTS_COLLECTION)
                                       .where('categoryId', '==', categoryId)
                                       .limit(1).get();
    if (!productsInCategory.empty) {
      throw new Error("Cannot delete category: products are still associated with it. Please reassign products first.");
    }

    // Check 2: Subcategories associated with this category
    const subcategories = await db.collection(CATEGORIES_COLLECTION)
                                  .where('parentId', '==', categoryId)
                                  .limit(1).get();
    if (!subcategories.empty) {
      throw new Error("Cannot delete category: subcategories exist. Please delete or reassign subcategories first.");
    }

    await db.collection(CATEGORIES_COLLECTION).doc(categoryId).delete();
  } catch (error) {
    console.error(`Error in deleteCategoryBE for ${categoryId}:`, error);
    throw error;
  }
};