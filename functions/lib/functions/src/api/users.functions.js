"use strict";
// functions/src/api/users.functions.ts
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setDefaultUserAddressCF = exports.deleteUserAddressCF = exports.updateUserAddressCF = exports.addUserAddressCF = exports.updateUserRolesCF = exports.updateUserProfileCF = exports.getAllUserProfilesCF = exports.getUserProfileCF = exports.onUserDeleteAuthTriggerCF = exports.onUserCreateAuthTriggerCF = void 0;
const functions = __importStar(require("firebase-functions/v1"));
const userServiceBE_1 = require("../services/userServiceBE");
const ensureAuthenticated = (context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated.');
    }
    return context.auth.uid;
};
const ensureAdmin = (context) => {
    ensureAuthenticated(context);
    if (!context.auth || !context.auth.token.admin) { // Assumes 'admin' custom claim
        throw new functions.https.HttpsError('permission-denied', 'User must be an admin.');
    }
    return context.auth.uid;
};
console.log("(Cloud Functions) users.functions.ts: Initializing with LIVE logic...");
exports.onUserCreateAuthTriggerCF = functions.auth.user().onCreate(async (user) => {
    console.log(`(Cloud Function Trigger) onUserCreateAuthTriggerCF for UID: ${user.uid}, Email: ${user.email}`);
    try {
        const profileData = {
            email: user.email || '',
            displayName: user.displayName,
            photoURL: user.photoURL,
            phoneNumber: user.phoneNumber,
        };
        await (0, userServiceBE_1.upsertUserProfileBE)(user.uid, profileData);
        console.log(`Firestore profile created/synced for new user: ${user.uid}`);
    }
    catch (error) {
        console.error(`Error in onUserCreateAuthTriggerCF for user ${user.uid}:`, error);
    }
});
exports.onUserDeleteAuthTriggerCF = functions.auth.user().onDelete(async (user) => {
    console.log(`(Cloud Function Trigger) onUserDeleteAuthTriggerCF for UID: ${user.uid}`);
    try {
        await (0, userServiceBE_1.deleteUserProfileBE)(user.uid);
        console.log(`Firestore profile deleted for user: ${user.uid}`);
    }
    catch (error) {
        console.error(`Error in onUserDeleteAuthTriggerCF for user ${user.uid}:`, error);
    }
});
exports.getUserProfileCF = functions.https.onCall(async (data, context) => {
    console.log("(Cloud Function) getUserProfileCF called.");
    const userId = ensureAuthenticated(context);
    try {
        const userProfile = await (0, userServiceBE_1.getUserProfileBE)(userId);
        if (!userProfile) {
            const authUser = context.auth?.token;
            if (authUser && authUser.email) {
                console.warn(`User profile for ${userId} not found. Attempting to create from Auth token.`);
                const freshProfile = await (0, userServiceBE_1.upsertUserProfileBE)(userId, { email: authUser.email, displayName: authUser.name, photoURL: authUser.picture });
                return { success: true, profile: freshProfile };
            }
            throw new functions.https.HttpsError('not-found', 'User profile not found.');
        }
        return { success: true, profile: userProfile };
    }
    catch (error) {
        console.error("Error in getUserProfileCF:", error);
        if (error instanceof functions.https.HttpsError)
            throw error;
        const message = error instanceof Error ? error.message : 'Failed to get user profile.';
        throw new functions.https.HttpsError('internal', message);
    }
});
exports.getAllUserProfilesCF = functions.https.onCall(async (data, context) => {
    console.log("(Cloud Function) getAllUserProfilesCF called with data:", data);
    ensureAdmin(context);
    try {
        const options = {
            limit: data?.limit || 25,
            startAfter: data?.startAfter,
            sortBy: data?.sortBy || 'createdAt',
            sortOrder: data?.sortOrder || 'desc',
            role: data?.role,
        };
        const result = await (0, userServiceBE_1.getAllUserProfilesBE)(options);
        return { success: true, ...result };
    }
    catch (error) {
        console.error("Error in getAllUserProfilesCF:", error);
        if (error instanceof functions.https.HttpsError)
            throw error;
        const message = error instanceof Error ? error.message : 'Failed to get all user profiles.';
        throw new functions.https.HttpsError('internal', message);
    }
});
exports.updateUserProfileCF = functions.https.onCall(async (data, context) => {
    console.log("(Cloud Function) updateUserProfileCF called with data:", data);
    const userId = ensureAuthenticated(context);
    try {
        if (Object.keys(data).length === 0) {
            throw new functions.https.HttpsError('invalid-argument', 'Update data cannot be empty.');
        }
        const updatedProfile = await (0, userServiceBE_1.updateUserProfileBE)(userId, data);
        return { success: true, profile: updatedProfile };
    }
    catch (error) {
        console.error("Error in updateUserProfileCF:", error);
        if (error instanceof functions.https.HttpsError)
            throw error;
        const message = error instanceof Error ? error.message : 'Failed to update user profile.';
        throw new functions.https.HttpsError('internal', message);
    }
});
exports.updateUserRolesCF = functions.https.onCall(async (data, context) => {
    console.log("(Cloud Function) updateUserRolesCF called with data:", data);
    ensureAdmin(context);
    try {
        const { targetUserId, roles } = data;
        if (!targetUserId || !roles || !Array.isArray(roles)) {
            throw new functions.https.HttpsError('invalid-argument', 'Target User ID and roles array are required.');
        }
        await (0, userServiceBE_1.updateUserRolesBE)(targetUserId, roles);
        return { success: true, message: `Roles updated for user ${targetUserId}.` };
    }
    catch (error) {
        console.error("Error in updateUserRolesCF:", error);
        if (error instanceof functions.https.HttpsError)
            throw error;
        const message = error instanceof Error ? error.message : 'Failed to update user roles.';
        throw new functions.https.HttpsError('internal', message);
    }
});
exports.addUserAddressCF = functions.https.onCall(async (data, context) => {
    console.log("(Cloud Function) addUserAddressCF called with data:", data);
    const userId = ensureAuthenticated(context);
    try {
        const newAddress = await (0, userServiceBE_1.addUserAddressBE)(userId, data);
        return { success: true, address: newAddress };
    }
    catch (error) {
        console.error("Error in addUserAddressCF:", error);
        const message = error instanceof Error ? error.message : 'Failed to add address.';
        throw new functions.https.HttpsError('internal', message);
    }
});
exports.updateUserAddressCF = functions.https.onCall(async (data, context) => {
    console.log("(Cloud Function) updateUserAddressCF called with data:", data);
    const userId = ensureAuthenticated(context);
    try {
        const { addressId, addressData } = data;
        if (!addressId || !addressData || Object.keys(addressData).length === 0) {
            throw new functions.https.HttpsError('invalid-argument', 'Address ID and update data are required.');
        }
        const updatedAddress = await (0, userServiceBE_1.updateUserAddressBE)(userId, addressId, addressData);
        return { success: true, address: updatedAddress };
    }
    catch (error) {
        console.error("Error in updateUserAddressCF:", error);
        const message = error instanceof Error ? error.message : 'Failed to update address.';
        throw new functions.https.HttpsError('internal', message);
    }
});
exports.deleteUserAddressCF = functions.https.onCall(async (data, context) => {
    console.log("(Cloud Function) deleteUserAddressCF called with data:", data);
    const userId = ensureAuthenticated(context);
    try {
        const { addressId } = data;
        if (!addressId) {
            throw new functions.https.HttpsError('invalid-argument', 'Address ID is required.');
        }
        await (0, userServiceBE_1.deleteUserAddressBE)(userId, addressId);
        return { success: true, message: 'Address deleted successfully.' };
    }
    catch (error) {
        console.error("Error in deleteUserAddressCF:", error);
        const message = error instanceof Error ? error.message : 'Failed to delete address.';
        throw new functions.https.HttpsError('internal', message);
    }
});
exports.setDefaultUserAddressCF = functions.https.onCall(async (data, context) => {
    console.log("(Cloud Function) setDefaultUserAddressCF called with data:", data);
    const userId = ensureAuthenticated(context);
    try {
        const { addressId } = data;
        if (!addressId) {
            throw new functions.https.HttpsError('invalid-argument', 'Address ID is required.');
        }
        await (0, userServiceBE_1.setDefaultUserAddressBE)(userId, addressId);
        // It's good practice to return the updated user profile (with new default address) or at least all addresses
        // For now, just success. Client should refetch profile or manage state optimistically.
        return { success: true, message: 'Default address set successfully.' };
    }
    catch (error) {
        console.error("Error in setDefaultUserAddressCF:", error);
        const message = error instanceof Error ? error.message : 'Failed to set default address.';
        throw new functions.https.HttpsError('internal', message);
    }
});
//# sourceMappingURL=users.functions.js.map