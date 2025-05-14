// src/services/categoryService.ts

// Import Firebase Admin resources
import {
  db, // Firestore instance from firebaseAdmin.ts
  adminInstance // For FieldValue, Timestamp etc. from firebaseAdmin.ts
} from '../../lib/firebaseAdmin'; // Adjust path as necessary
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
  createdAt: any; // admin.firestore.Timestamp
  updatedAt: any; // admin.firestore.Timestamp
}

export type CategoryCreationData = Omit<Category, 'id' | 'createdAt' | 'updatedAt' | 'productCount'>;
export type CategoryUpdateData = Partial<Omit<Category, 'id' | 'createdAt' | 'updatedAt' | 'productCount'>>;

console.log(`(Service-Backend) Category Service: Using Firestore collection: ${CATEGORIES_COLLECTION}`);

export const createCategoryBE = async (categoryData: CategoryCreationData): Promise<Category> => {
  console.log('(Service-Backend) createCategoryBE called with:', categoryData);
  const slug = categoryData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
  try {
    const slugCheck = await db.collection(CATEGORIES_COLLECTION).where('slug', '==', slug).limit(1).get();
    if (!slugCheck.empty) {
      throw new Error(`Category slug "${slug}" already exists.`);
    }

    const dataToSave: any = {
      ...categoryData,
      slug,
      productCount: 0,
      isEnabled: categoryData.isEnabled === undefined ? true : categoryData.isEnabled,
      createdAt: adminInstance.firestore.FieldValue.serverTimestamp(),
      updatedAt: adminInstance.firestore.FieldValue.serverTimestamp(),
    };
    Object.keys(dataToSave).forEach(key => dataToSave[key] === undefined && delete dataToSave[key]);

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
    const dataToUpdate: any = { ...categoryData, updatedAt: adminInstance.firestore.FieldValue.serverTimestamp() };
    if (newSlug) {
        // Optional: Check for new slug uniqueness before updating, excluding the current document
        // const slugCheck = await db.collection(CATEGORIES_COLLECTION).where('slug', '==', newSlug).limit(1).get();
        // if (!slugCheck.empty && slugCheck.docs[0].id !== categoryId) {
        //   throw new Error(`Category slug "${newSlug}" already exists for another category.`);
        // }
        dataToUpdate.slug = newSlug;
    }

    Object.keys(dataToUpdate).forEach(key => dataToUpdate[key] === undefined && delete dataToUpdate[key]);
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
    const productsInCategory = await db.collection(PRODUCTS_COLLECTION)
                                       .where('categoryId', '==', categoryId)
                                       .limit(1).get();
    if (!productsInCategory.empty) {
      throw new Error("Cannot delete category: products are still associated with it. Please reassign products first.");
    }
    // TODO: Add logic to handle subcategories. Either disallow deletion if subcategories exist,
    // or delete them recursively (which can be complex and resource-intensive).
    // For now, assumes no subcategories or they are handled manually.

    await db.collection(CATEGORIES_COLLECTION).doc(categoryId).delete();
  } catch (error) {
    console.error(`Error in deleteCategoryBE for ${categoryId}:`, error);
    throw error;
  }
};