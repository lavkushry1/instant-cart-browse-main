"use strict";
// src/services/userService.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserRolesBE = exports.deleteUserProfileBE = exports.updateUserProfileBE = exports.getAllUserProfilesBE = exports.getUserProfileBE = exports.setDefaultUserAddressBE = exports.deleteUserAddressBE = exports.updateUserAddressBE = exports.addUserAddressBE = exports.upsertUserProfileBE = void 0;
const firestore_1 = require("firebase-admin/firestore"); // Ensure FieldValue is imported
// Import Firebase Admin resources
const firebaseAdmin_1 = require("../lib/firebaseAdmin"); // Corrected path
const USERS_COLLECTION = 'users';
console.log(`(Service-Backend) User Service: Using Firestore collection: ${USERS_COLLECTION}`);
const upsertUserProfileBE = async (uid, profileData) => {
    console.log(`(Service-Backend) upsertUserProfileBE for UID ${uid} with:`, profileData);
    try {
        const userDocRef = firebaseAdmin_1.db.collection(USERS_COLLECTION).doc(uid);
        const now = firebaseAdmin_1.adminInstance.firestore.FieldValue.serverTimestamp();
        // Data for both create and update parts of upsert
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
        // Data specific to creation part of upsert
        const onCreationData = {
            createdAt: now,
            roles: profileData.roles || ['customer'],
            email: profileData.email, // Ensure email is part of onCreationData if it's set then
        };
        await firebaseAdmin_1.db.runTransaction(async (transaction) => {
            const userDoc = await transaction.get(userDocRef);
            if (!userDoc.exists) {
                // Combine general upsert data with creation-specific data
                transaction.set(userDocRef, { ...dataForFirestore, ...onCreationData });
            }
            else {
                // For update, only apply fields meant for update (excluding createdAt, roles if not changing)
                const { createdAt, roles, ...updateFields } = dataForFirestore;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                transaction.update(userDocRef, updateFields); // Cast for update flexibility
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
const ADDRESSES_SUBCOLLECTION = 'addresses';
const addUserAddressBE = async (userId, addressData) => {
    console.log(`(Service-Backend) addUserAddressBE called for user ${userId} with address:`, addressData);
    try {
        const userRef = firebaseAdmin_1.db.collection(USERS_COLLECTION).doc(userId);
        const addressesRef = userRef.collection(ADDRESSES_SUBCOLLECTION);
        if (addressData.isDefault) {
            // If adding a new default address, unset other default addresses
            const snapshot = await addressesRef.where('isDefault', '==', true).get();
            const batch = firebaseAdmin_1.db.batch();
            snapshot.docs.forEach(doc => {
                batch.update(doc.ref, { isDefault: false });
            });
            await batch.commit();
        }
        const newAddressRef = await addressesRef.add({
            ...addressData,
            createdAt: firestore_1.FieldValue.serverTimestamp(),
            updatedAt: firestore_1.FieldValue.serverTimestamp(),
        });
        return { ...addressData, id: newAddressRef.id };
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
        const userRef = firebaseAdmin_1.db.collection(USERS_COLLECTION).doc(userId);
        const addressRef = userRef.collection(ADDRESSES_SUBCOLLECTION).doc(addressId);
        if (addressData.isDefault) {
            // If setting this address as default, unset other default addresses
            const addressesColRef = userRef.collection(ADDRESSES_SUBCOLLECTION);
            const snapshot = await addressesColRef.where('isDefault', '==', true).get();
            const batch = firebaseAdmin_1.db.batch();
            snapshot.docs.forEach(doc => {
                if (doc.id !== addressId) { // Don't unset the one we are about to set
                    batch.update(doc.ref, { isDefault: false });
                }
            });
            await batch.commit();
        }
        else if (addressData.isDefault === false) {
            // Check if this was the only default address, if so, prevent unsetting it unless another is set as default
            // For simplicity in this demo, we allow unsetting. A real app might need more complex logic or a separate setDefaultAddress function.
        }
        await addressRef.update({
            ...addressData,
            updatedAt: firestore_1.FieldValue.serverTimestamp(),
        });
        const updatedDoc = await addressRef.get();
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
        const userRef = firebaseAdmin_1.db.collection(USERS_COLLECTION).doc(userId);
        const addressRef = userRef.collection(ADDRESSES_SUBCOLLECTION).doc(addressId);
        // Optional: Check if it's the default address and handle (e.g., prevent deletion or set another as default)
        // For this demo, we'll allow deletion.
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
        const userRef = firebaseAdmin_1.db.collection(USERS_COLLECTION).doc(userId);
        const addressesRef = userRef.collection(ADDRESSES_SUBCOLLECTION);
        const batch = firebaseAdmin_1.db.batch();
        // Unset current default
        const snapshot = await addressesRef.where('isDefault', '==', true).get();
        snapshot.docs.forEach(doc => {
            batch.update(doc.ref, { isDefault: false });
        });
        // Set new default
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
        const userDoc = await firebaseAdmin_1.db.collection(USERS_COLLECTION).doc(userId).get();
        if (!userDoc.exists) {
            console.log(`User profile for ${userId} not found.`);
            return null;
        }
        const userData = userDoc.data();
        // Fetch addresses
        const addressesSnapshot = await firebaseAdmin_1.db.collection(USERS_COLLECTION).doc(userId).collection(ADDRESSES_SUBCOLLECTION).orderBy('isDefault', 'desc').orderBy('updatedAt', 'desc').get();
        const addresses = [];
        addressesSnapshot.forEach(doc => {
            addresses.push({ id: doc.id, ...doc.data() });
        });
        userData.addresses = addresses;
        return userData;
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
        let query = firebaseAdmin_1.db.collection(USERS_COLLECTION);
        if (options.role) {
            query = query.where('roles', 'array-contains', options.role);
        }
        const sortBy = options.sortBy || 'createdAt';
        const sortOrder = options.sortOrder || 'desc';
        query = query.orderBy(sortBy, sortOrder);
        if (options.startAfter)
            query = query.startAfter(options.startAfter);
        if (options.limit)
            query = query.limit(options.limit);
        const snapshot = await query.get();
        if (snapshot.empty)
            return { profiles: [], totalCount: 0 };
        const profiles = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const lastVisible = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : undefined;
        return { profiles, lastVisible, totalCount: profiles.length };
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
        const userDocRef = firebaseAdmin_1.db.collection(USERS_COLLECTION).doc(uid);
        const dataToUpdate = {
            ...profileUpdateData,
            updatedAt: firebaseAdmin_1.adminInstance.firestore.FieldValue.serverTimestamp()
        };
        // Object.keys(dataToUpdate).forEach(key => dataToUpdate[key] === undefined && delete dataToUpdate[key]);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await userDocRef.update(dataToUpdate); // Keep cast
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
        await firebaseAdmin_1.db.collection(USERS_COLLECTION).doc(uid).delete();
        console.log(`Firestore profile for UID ${uid} deleted.`);
        // The Firebase Auth user should be deleted separately via an Auth trigger or admin action.
    }
    catch (error) {
        console.error(`Error in deleteUserProfileBE for UID ${uid}:`, error);
        throw error;
    }
};
exports.deleteUserProfileBE = deleteUserProfileBE;
const updateUserRolesBE = async (uid, roles) => {
    console.log(`(Service-Backend) updateUserRolesBE for UID ${uid} with roles:`, roles);
    try {
        const userDocRef = firebaseAdmin_1.db.collection(USERS_COLLECTION).doc(uid);
        await userDocRef.update({
            roles: roles,
            updatedAt: firebaseAdmin_1.adminInstance.firestore.FieldValue.serverTimestamp(),
        });
        // IMPORTANT: For roles to be effective in Firebase security rules (e.g., context.auth.token.roles)
        // AND for immediate effect on the user's ID token, you MUST set custom claims on the Firebase Auth user.
        // await auth.setCustomUserClaims(uid, { roles: roles });
        // console.log(`Custom claims set for user ${uid} with roles:`, roles);
    }
    catch (error) {
        console.error(`Error in updateUserRolesBE for UID ${uid}:`, error);
        throw error;
    }
};
exports.updateUserRolesBE = updateUserRolesBE;
//# sourceMappingURL=userService.js.map