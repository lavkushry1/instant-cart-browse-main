"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserRolesBE = exports.deleteUserProfileBE = exports.updateUserProfileBE = exports.getAllUserProfilesBE = exports.getUserProfileBE = exports.setDefaultUserAddressBE = exports.deleteUserAddressBE = exports.updateUserAddressBE = exports.addUserAddressBE = exports.upsertUserProfileBE = void 0;
const firestore_1 = require("firebase-admin/firestore");
const firebaseAdmin_1 = require("../lib/firebaseAdmin");
const USERS_COLLECTION = 'users';
const ADDRESSES_SUBCOLLECTION = 'addresses';
console.log(`(Service-Backend) User Service BE: Using Firestore collection: ${USERS_COLLECTION}`);
const upsertUserProfileBE = async (uid, profileData) => {
    console.log(`(Service-Backend) upsertUserProfileBE for UID ${uid} with:`, profileData);
    try {
        const userDocRef = firebaseAdmin_1.firestoreDB.collection(USERS_COLLECTION).doc(uid);
        const now = firebaseAdmin_1.adminInstance.firestore.FieldValue.serverTimestamp();
        const dataForFirestore = {
            email: profileData.email,
            displayName: profileData.displayName,
            firstName: profileData.firstName,
            lastName: profileData.lastName,
            photoURL: profileData.photoURL,
            phoneNumber: profileData.phoneNumber,
            preferences: profileData.preferences || {},
            updatedAt: now,
            lastLoginAt: now,
        };
        const onCreationData = {
            createdAt: now,
            roles: profileData.roles || ['customer'],
            email: profileData.email,
        };
        await firebaseAdmin_1.firestoreDB.runTransaction(async (transaction) => {
            const userDoc = await transaction.get(userDocRef);
            if (!userDoc.exists) {
                transaction.set(userDocRef, { ...dataForFirestore, ...onCreationData });
            }
            else {
                const { createdAt, roles, ...updateFields } = dataForFirestore;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                transaction.update(userDocRef, updateFields);
            }
        });
        const updatedProfileSnap = await userDocRef.get();
        if (!updatedProfileSnap.exists)
            throw new Error('User profile not found after upsert');
        return { id: updatedProfileSnap.id, ...updatedProfileSnap.data() };
    }
    catch (error) {
        console.error(`Error in upsertUserProfileBE for UID ${uid}:`, error);
        throw error;
    }
};
exports.upsertUserProfileBE = upsertUserProfileBE;
const addUserAddressBE = async (userId, addressData) => {
    console.log(`(Service-Backend) addUserAddressBE called for user ${userId} with address:`, addressData);
    try {
        const userRef = firebaseAdmin_1.firestoreDB.collection(USERS_COLLECTION).doc(userId);
        const addressesRef = userRef.collection(ADDRESSES_SUBCOLLECTION);
        const batch = firebaseAdmin_1.firestoreDB.batch();
        if (addressData.isDefault) {
            const snapshot = await addressesRef.where('isDefault', '==', true).get();
            snapshot.docs.forEach(doc => {
                batch.update(doc.ref, { isDefault: false });
            });
        }
        const newAddressRef = addressesRef.doc(); // Generate ID beforehand
        batch.set(newAddressRef, {
            ...addressData,
            createdAt: firestore_1.FieldValue.serverTimestamp(),
            updatedAt: firestore_1.FieldValue.serverTimestamp(),
        });
        await batch.commit();
        return { ...addressData, id: newAddressRef.id, createdAt: firebaseAdmin_1.adminInstance.firestore.Timestamp.now(), updatedAt: firebaseAdmin_1.adminInstance.firestore.Timestamp.now() }; // Construct return with ID and placeholder TS
    }
    catch (error) {
        console.error(`Error in addUserAddressBE for user ${userId}:`, error);
        throw new Error('Failed to add user address.');
    }
};
exports.addUserAddressBE = addUserAddressBE;
const updateUserAddressBE = async (userId, addressId, addressData) => {
    console.log(`(Service-Backend) updateUserAddressBE called for user ${userId}, address ${addressId} with data:`, addressData);
    try {
        const userRef = firebaseAdmin_1.firestoreDB.collection(USERS_COLLECTION).doc(userId);
        const addressRef = userRef.collection(ADDRESSES_SUBCOLLECTION).doc(addressId);
        const batch = firebaseAdmin_1.firestoreDB.batch();
        if (addressData.isDefault === true) {
            const addressesColRef = userRef.collection(ADDRESSES_SUBCOLLECTION);
            const snapshot = await addressesColRef.where('isDefault', '==', true).get();
            snapshot.docs.forEach(doc => {
                if (doc.id !== addressId) {
                    batch.update(doc.ref, { isDefault: false });
                }
            });
        }
        batch.update(addressRef, {
            ...addressData,
            updatedAt: firestore_1.FieldValue.serverTimestamp(),
        });
        await batch.commit();
        const updatedDoc = await addressRef.get();
        if (!updatedDoc.exists)
            throw new Error('Address not found after update');
        return { ...updatedDoc.data(), id: addressId };
    }
    catch (error) {
        console.error(`Error in updateUserAddressBE for user ${userId}, address ${addressId}:`, error);
        throw new Error('Failed to update user address.');
    }
};
exports.updateUserAddressBE = updateUserAddressBE;
const deleteUserAddressBE = async (userId, addressId) => {
    console.log(`(Service-Backend) deleteUserAddressBE called for user ${userId}, address ${addressId}`);
    try {
        const userRef = firebaseAdmin_1.firestoreDB.collection(USERS_COLLECTION).doc(userId);
        const addressRef = userRef.collection(ADDRESSES_SUBCOLLECTION).doc(addressId);
        await addressRef.delete();
    }
    catch (error) {
        console.error(`Error in deleteUserAddressBE for user ${userId}, address ${addressId}:`, error);
        throw new Error('Failed to delete user address.');
    }
};
exports.deleteUserAddressBE = deleteUserAddressBE;
const setDefaultUserAddressBE = async (userId, addressId) => {
    console.log(`(Service-Backend) setDefaultUserAddressBE called for user ${userId}, address ${addressId}`);
    try {
        const userRef = firebaseAdmin_1.firestoreDB.collection(USERS_COLLECTION).doc(userId);
        const addressesRef = userRef.collection(ADDRESSES_SUBCOLLECTION);
        const batch = firebaseAdmin_1.firestoreDB.batch();
        const snapshot = await addressesRef.where('isDefault', '==', true).get();
        snapshot.docs.forEach(doc => {
            batch.update(doc.ref, { isDefault: false });
        });
        const newDefaultRef = addressesRef.doc(addressId);
        batch.update(newDefaultRef, { isDefault: true, updatedAt: firestore_1.FieldValue.serverTimestamp() });
        await batch.commit();
    }
    catch (error) {
        console.error(`Error in setDefaultUserAddressBE for user ${userId}, address ${addressId}:`, error);
        throw new Error('Failed to set default user address.');
    }
};
exports.setDefaultUserAddressBE = setDefaultUserAddressBE;
const getUserProfileBE = async (userId) => {
    console.log("(Service-Backend) getUserProfileBE called for user:", userId);
    try {
        const userDoc = await firebaseAdmin_1.firestoreDB.collection(USERS_COLLECTION).doc(userId).get();
        if (!userDoc.exists) {
            console.log(`User profile for ${userId} not found.`);
            return null;
        }
        const userData = userDoc.data();
        const addressesSnapshot = await firebaseAdmin_1.firestoreDB.collection(USERS_COLLECTION).doc(userId).collection(ADDRESSES_SUBCOLLECTION).orderBy('isDefault', 'desc').orderBy('updatedAt', 'desc').get();
        const addresses = [];
        addressesSnapshot.forEach(doc => {
            addresses.push({ id: doc.id, ...doc.data() });
        });
        return { ...userData, id: userId, addresses }; // Ensure id is part of the returned object for UserProfileBE
    }
    catch (error) {
        console.error("Error fetching user profile:", error);
        throw new Error('Failed to fetch user profile.');
    }
};
exports.getUserProfileBE = getUserProfileBE;
const getAllUserProfilesBE = async (options = {}) => {
    console.log('(Service-Backend) getAllUserProfilesBE with options:', options);
    try {
        let query = firebaseAdmin_1.firestoreDB.collection(USERS_COLLECTION);
        if (options.role) {
            query = query.where('roles', 'array-contains', options.role);
        }
        const sortBy = options.sortBy || 'createdAt';
        const sortOrder = options.sortOrder || 'desc';
        query = query.orderBy(sortBy, sortOrder);
        if (options.startAfter) {
            query = query.startAfter(options.startAfter);
        }
        const limit = options.limit || 25;
        query = query.limit(limit);
        const snapshot = await query.get();
        const profiles = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const lastVisible = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : undefined;
        // For total count, we need a separate query without limit/pagination if role filter is applied.
        // This can be expensive. Consider if totalCount is strictly needed for every call.
        let totalCount = undefined;
        if (options.role) {
            const countQuery = firebaseAdmin_1.firestoreDB.collection(USERS_COLLECTION).where('roles', 'array-contains', options.role);
            const countSnapshot = await countQuery.count().get();
            totalCount = countSnapshot.data().count;
        }
        else {
            // Approximating total users without a filter could be done by other means or not provided.
            // For now, if no role filter, totalCount remains undefined as a full count is very expensive.
        }
        return { profiles, lastVisible, totalCount };
    }
    catch (error) {
        console.error("Error in getAllUserProfilesBE:", error);
        throw error;
    }
};
exports.getAllUserProfilesBE = getAllUserProfilesBE;
const updateUserProfileBE = async (uid, profileUpdateData) => {
    console.log(`(Service-Backend) updateUserProfileBE for UID ${uid} with:`, profileUpdateData);
    try {
        const userDocRef = firebaseAdmin_1.firestoreDB.collection(USERS_COLLECTION).doc(uid);
        const dataToUpdate = {
            ...profileUpdateData,
            updatedAt: firebaseAdmin_1.adminInstance.firestore.FieldValue.serverTimestamp(),
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await userDocRef.update(dataToUpdate);
        const updatedProfileSnap = await userDocRef.get();
        if (!updatedProfileSnap.exists)
            throw new Error('User profile not found after update');
        return { id: updatedProfileSnap.id, ...updatedProfileSnap.data() };
    }
    catch (error) {
        console.error(`Error in updateUserProfileBE for UID ${uid}:`, error);
        throw error;
    }
};
exports.updateUserProfileBE = updateUserProfileBE;
const deleteUserProfileBE = async (uid) => {
    console.log(`(Service-Backend) deleteUserProfileBE for UID: ${uid}`);
    try {
        // Consider deleting addresses subcollection as well if it exists
        const addressesRef = firebaseAdmin_1.firestoreDB.collection(USERS_COLLECTION).doc(uid).collection(ADDRESSES_SUBCOLLECTION);
        const snapshot = await addressesRef.limit(500).get(); // Batch delete if many
        if (!snapshot.empty) {
            const batch = firebaseAdmin_1.firestoreDB.batch();
            snapshot.docs.forEach(doc => batch.delete(doc.ref));
            await batch.commit();
        }
        await firebaseAdmin_1.firestoreDB.collection(USERS_COLLECTION).doc(uid).delete();
    }
    catch (error) {
        console.error(`Error deleting user profile for UID ${uid}:`, error);
        throw error;
    }
};
exports.deleteUserProfileBE = deleteUserProfileBE;
const updateUserRolesBE = async (uid, roles) => {
    console.log(`(Service-Backend) updateUserRolesBE for UID ${uid} with roles:`, roles);
    try {
        const userDocRef = firebaseAdmin_1.firestoreDB.collection(USERS_COLLECTION).doc(uid);
        await userDocRef.update({
            roles: roles,
            updatedAt: firebaseAdmin_1.adminInstance.firestore.FieldValue.serverTimestamp(),
        });
        // Optional: Update custom claims on Auth user if roles drive auth rules
        // await auth.setCustomUserClaims(uid, { roles: roles });
    }
    catch (error) {
        console.error(`Error updating roles for UID ${uid}:`, error);
        throw error;
    }
};
exports.updateUserRolesBE = updateUserRolesBE;
//# sourceMappingURL=userServiceBE.js.map