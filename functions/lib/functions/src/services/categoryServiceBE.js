"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCategoryBE = exports.updateCategoryBE = exports.getAllCategoriesBE = exports.getCategoryBE = exports.createCategoryBE = void 0;
const firebaseAdmin_1 = require("@/lib/firebaseAdmin"); // Use path alias
const CATEGORIES_COLLECTION = 'categories';
const PRODUCTS_COLLECTION = 'products'; // For checking product associations
console.log(`(Service-Backend) Category Service BE: Using Firestore collection: ${CATEGORIES_COLLECTION}`);
const createCategoryBE = async (categoryData) => {
    console.log('(Service-Backend) createCategoryBE called with:', categoryData);
    const slug = categoryData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
    try {
        const slugCheck = await firebaseAdmin_1.firestoreDB.collection(CATEGORIES_COLLECTION).where('slug', '==', slug).limit(1).get();
        if (!slugCheck.empty) {
            throw new Error(`Category slug "${slug}" already exists.`);
        }
        const dataToSave = {
            ...categoryData,
            name: categoryData.name, // Ensure name is explicitly part of dataToSave if not in spread
            description: categoryData.description,
            parentId: categoryData.parentId,
            imageUrl: categoryData.imageUrl,
            slug,
            productCount: 0, // Default value
            isEnabled: categoryData.isEnabled === undefined ? true : categoryData.isEnabled,
            createdAt: firebaseAdmin_1.adminInstance.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebaseAdmin_1.adminInstance.firestore.FieldValue.serverTimestamp(),
        };
        const docRef = await firebaseAdmin_1.firestoreDB.collection(CATEGORIES_COLLECTION).add(dataToSave);
        const newDoc = await docRef.get();
        if (!newDoc.exists) {
            throw new Error('Category document not found after creation');
        }
        return { id: newDoc.id, ...newDoc.data() };
    }
    catch (error) {
        console.error("Error in createCategoryBE:", error);
        throw error;
    }
};
exports.createCategoryBE = createCategoryBE;
const getCategoryBE = async (idOrSlug) => {
    console.log(`(Service-Backend) getCategoryBE for: ${idOrSlug}`);
    try {
        let docSnap;
        if (idOrSlug.length === 20 && /^[a-zA-Z0-9]+$/.test(idOrSlug)) {
            const docRefById = firebaseAdmin_1.firestoreDB.collection(CATEGORIES_COLLECTION).doc(idOrSlug);
            docSnap = await docRefById.get();
        }
        if (!docSnap || !docSnap.exists) {
            const queryBySlug = firebaseAdmin_1.firestoreDB.collection(CATEGORIES_COLLECTION).where('slug', '==', idOrSlug).limit(1);
            const snapshotBySlug = await queryBySlug.get();
            if (!snapshotBySlug.empty) {
                docSnap = snapshotBySlug.docs[0];
            }
        }
        if (!docSnap || !docSnap.exists)
            return null;
        return { id: docSnap.id, ...docSnap.data() };
    }
    catch (error) {
        console.error(`Error in getCategoryBE for ${idOrSlug}:`, error);
        throw error;
    }
};
exports.getCategoryBE = getCategoryBE;
const getAllCategoriesBE = async (parentId) => {
    console.log(`(Service-Backend) getAllCategoriesBE called ${parentId !== undefined ? 'for parentId: ' + parentId : 'for all/top-level'}`);
    try {
        let query = firebaseAdmin_1.firestoreDB.collection(CATEGORIES_COLLECTION);
        if (parentId === null) {
            query = query.where('parentId', '==', null);
        }
        else if (typeof parentId === 'string' && parentId.length > 0) {
            query = query.where('parentId', '==', parentId);
        }
        const snapshot = await query.orderBy('name', 'asc').get();
        if (snapshot.empty)
            return [];
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }
    catch (error) {
        console.error("Error in getAllCategoriesBE:", error);
        throw error;
    }
};
exports.getAllCategoriesBE = getAllCategoriesBE;
const updateCategoryBE = async (categoryId, categoryData) => {
    console.log(`(Service-Backend) updateCategoryBE for ID ${categoryId} with:`, categoryData);
    const newSlug = categoryData.name ? categoryData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '') : undefined;
    try {
        const docRef = firebaseAdmin_1.firestoreDB.collection(CATEGORIES_COLLECTION).doc(categoryId);
        const dataToUpdate = {
            name: categoryData.name,
            description: categoryData.description,
            imageUrl: categoryData.imageUrl,
            parentId: categoryData.parentId,
            isEnabled: categoryData.isEnabled,
            updatedAt: firebaseAdmin_1.adminInstance.firestore.FieldValue.serverTimestamp()
        };
        if (newSlug) {
            dataToUpdate.slug = newSlug;
        }
        await docRef.update(dataToUpdate);
        const updatedDoc = await docRef.get();
        if (!updatedDoc.exists) {
            throw new Error('Category document not found after update.');
        }
        return { id: updatedDoc.id, ...updatedDoc.data() };
    }
    catch (error) {
        console.error(`Error in updateCategoryBE for ${categoryId}:`, error);
        throw error;
    }
};
exports.updateCategoryBE = updateCategoryBE;
const deleteCategoryBE = async (categoryId) => {
    console.log(`(Service-Backend) deleteCategoryBE for ID: ${categoryId}`);
    try {
        const productsInCategory = await firebaseAdmin_1.firestoreDB.collection(PRODUCTS_COLLECTION)
            .where('categoryId', '==', categoryId)
            .limit(1).get();
        if (!productsInCategory.empty) {
            throw new Error("Cannot delete category: products are still associated with it. Please reassign products first.");
        }
        const subcategories = await firebaseAdmin_1.firestoreDB.collection(CATEGORIES_COLLECTION)
            .where('parentId', '==', categoryId)
            .limit(1).get();
        if (!subcategories.empty) {
            throw new Error("Cannot delete category: subcategories exist. Please delete or reassign subcategories first.");
        }
        await firebaseAdmin_1.firestoreDB.collection(CATEGORIES_COLLECTION).doc(categoryId).delete();
    }
    catch (error) {
        console.error(`Error in deleteCategoryBE for ${categoryId}:`, error);
        throw error;
    }
};
exports.deleteCategoryBE = deleteCategoryBE;
//# sourceMappingURL=categoryServiceBE.js.map