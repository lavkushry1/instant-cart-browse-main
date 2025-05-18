import * as admin from 'firebase-admin';
import {
  firestoreDB as db,
  adminInstance
} from '../lib/firebaseAdmin'; // Corrected relative path

const CATEGORIES_COLLECTION = 'categories';
const PRODUCTS_COLLECTION = 'products'; // For checking product associations

export interface CategoryBE { // Renamed to avoid conflict if a client Category type exists
  id: string; 
  name: string;
  slug: string; 
  description?: string;
  imageUrl?: string;
  parentId?: string | null; 
  productCount?: number; 
  isEnabled: boolean;
  createdAt: admin.firestore.Timestamp; // Uses admin Timestamp
  updatedAt: admin.firestore.Timestamp; // Uses admin Timestamp
}

// For data coming from client (e.g., forms)
export type CategoryCreationDataFromClient = Omit<CategoryBE, 'id' | 'createdAt' | 'updatedAt' | 'productCount' | 'slug'> & {
  // isEnabled could be optional if defaulted on backend
  isEnabled?: boolean; 
};

export type CategoryUpdateDataFromClient = Partial<Omit<CategoryBE, 'id' | 'createdAt' | 'updatedAt' | 'productCount'>>;

// Interface for the data structure being saved to Firestore for creation
interface CategoryWriteData extends Omit<CategoryCreationDataFromClient, 'isEnabled'> {
  slug: string;
  productCount: number;
  isEnabled: boolean; 
  createdAt: admin.firestore.FieldValue;
  updatedAt: admin.firestore.FieldValue;
}

console.log(`(Service-Backend) Category Service BE: Using Firestore collection: ${CATEGORIES_COLLECTION}`);

export const createCategoryBE = async (categoryData: CategoryCreationDataFromClient): Promise<CategoryBE> => {
  console.log('(Service-Backend) createCategoryBE called with:', categoryData);
  const slug = categoryData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
  try {
    const slugCheck = await db.collection(CATEGORIES_COLLECTION).where('slug', '==', slug).limit(1).get();
    if (!slugCheck.empty) {
      throw new Error(`Category slug "${slug}" already exists.`);
    }

    const dataToSave: CategoryWriteData = {
      ...categoryData,
      name: categoryData.name, // Ensure name is explicitly part of dataToSave if not in spread
      description: categoryData.description,
      parentId: categoryData.parentId,
      imageUrl: categoryData.imageUrl,
      slug,
      productCount: 0, // Default value
      isEnabled: categoryData.isEnabled === undefined ? true : categoryData.isEnabled,
      createdAt: adminInstance.firestore.FieldValue.serverTimestamp(),
      updatedAt: adminInstance.firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await db.collection(CATEGORIES_COLLECTION).add(dataToSave);
    const newDoc = await docRef.get();
    if (!newDoc.exists) {
        throw new Error('Category document not found after creation');
    }
    return { id: newDoc.id, ...newDoc.data() } as CategoryBE;
  } catch (error) {
    console.error("Error in createCategoryBE:", error);
    throw error;
  }
};

export const getCategoryBE = async (idOrSlug: string): Promise<CategoryBE | null> => {
  console.log(`(Service-Backend) getCategoryBE for: ${idOrSlug}`);
  try {
    let docSnap: admin.firestore.DocumentSnapshot | undefined;
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
    return { id: docSnap.id, ...docSnap.data() } as CategoryBE;
  } catch (error) {
    console.error(`Error in getCategoryBE for ${idOrSlug}:`, error);
    throw error;
  }
};

export const getAllCategoriesBE = async (parentId?: string | null): Promise<CategoryBE[]> => {
  console.log(`(Service-Backend) getAllCategoriesBE called ${parentId !== undefined ? 'for parentId: ' + parentId : 'for all/top-level'}`);
  try {
    let query: admin.firestore.Query = db.collection(CATEGORIES_COLLECTION);
    if (parentId === null) { 
        query = query.where('parentId', '==', null);
    } else if (typeof parentId === 'string' && parentId.length > 0) { 
        query = query.where('parentId', '==', parentId);
    }
    
    const snapshot = await query.orderBy('name', 'asc').get();
    if (snapshot.empty) return [];
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CategoryBE));
  } catch (error) {
    console.error("Error in getAllCategoriesBE:", error);
    throw error;
  }
};

export const updateCategoryBE = async (categoryId: string, categoryData: CategoryUpdateDataFromClient): Promise<CategoryBE> => {
  console.log(`(Service-Backend) updateCategoryBE for ID ${categoryId} with:`, categoryData);
  const newSlug = categoryData.name ? categoryData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '') : undefined;
  try {
    const docRef = db.collection(CATEGORIES_COLLECTION).doc(categoryId);
    // Define a type for the update payload, ensuring updatedAt is FieldValue
    type CategoryUpdatePayload = Partial<Omit<CategoryBE, 'id' | 'createdAt' | 'updatedAt' | 'productCount'> & { slug?: string }> & { 
        updatedAt: admin.firestore.FieldValue 
    };

    const dataToUpdate: CategoryUpdatePayload = {
         name: categoryData.name,
         description: categoryData.description,
         imageUrl: categoryData.imageUrl,
         parentId: categoryData.parentId,
         isEnabled: categoryData.isEnabled,
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
    return { id: updatedDoc.id, ...updatedDoc.data() } as CategoryBE;
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