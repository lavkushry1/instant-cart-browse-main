// functions/src/api/users.functions.ts

import * as functions from 'firebase-functions';
import {
  upsertUserProfileBE,
  getUserProfileBE,
  updateUserProfileBE,
  deleteUserProfileBE,
  updateUserRolesBE,
  getAllUserProfilesBE, // Added
  UserProfileCreationData, 
  UserProfileUpdateData,
  UserRole,
  GetAllUserProfilesOptionsBE // Added
} from '../../../src/services/userService'; // Adjust path

const ensureAuthenticated = (context: functions.https.CallableContext): string => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated.');
  }
  return context.auth.uid;
};

const ensureAdmin = (context: functions.https.CallableContext): string => {
  ensureAuthenticated(context);
  if (!context.auth || !context.auth.token.admin) { // Assumes 'admin' custom claim
    throw new functions.https.HttpsError('permission-denied', 'User must be an admin.');
  }
  return context.auth.uid;
};

console.log("(Cloud Functions) users.functions.ts: Initializing with LIVE logic...");

export const onUserCreateAuthTriggerCF = functions.auth.user().onCreate(async (user) => {
  console.log(`(Cloud Function Trigger) onUserCreateAuthTriggerCF for UID: ${user.uid}, Email: ${user.email}`);
  try {
    const profileData: Partial<UserProfileCreationData> = {
      email: user.email || '',
      displayName: user.displayName,
      photoURL: user.photoURL,
      phoneNumber: user.phoneNumber,
    };
    await upsertUserProfileBE(user.uid, profileData);
    console.log(`Firestore profile created/synced for new user: ${user.uid}`);
  } catch (error) {
    console.error(`Error in onUserCreateAuthTriggerCF for user ${user.uid}:`, error);
  }
});

export const onUserDeleteAuthTriggerCF = functions.auth.user().onDelete(async (user) => {
  console.log(`(Cloud Function Trigger) onUserDeleteAuthTriggerCF for UID: ${user.uid}`);
  try {
    await deleteUserProfileBE(user.uid);
    console.log(`Firestore profile deleted for user: ${user.uid}`);
  } catch (error) {
    console.error(`Error in onUserDeleteAuthTriggerCF for user ${user.uid}:`, error);
  }
});

export const getUserProfileCF = functions.https.onCall(async (data, context) => {
  console.log("(Cloud Function) getUserProfileCF called.");
  const userId = ensureAuthenticated(context);
  try {
    const userProfile = await getUserProfileBE(userId);
    if (!userProfile) {
      const authUser = context.auth?.token;
      if (authUser && authUser.email) {
          console.warn(`User profile for ${userId} not found. Attempting to create from Auth token.`);
          const freshProfile = await upsertUserProfileBE(userId, {email: authUser.email!, displayName: authUser.name, photoURL: authUser.picture});
          return { success: true, profile: freshProfile };
      }
      throw new functions.https.HttpsError('not-found', 'User profile not found.');
    }
    return { success: true, profile: userProfile };
  } catch (error: any) {
    console.error("Error in getUserProfileCF:", error);
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError('internal', error.message || 'Failed to get user profile.');
  }
});

export const getAllUserProfilesCF = functions.https.onCall(async (data: GetAllUserProfilesOptionsBE | undefined, context) => {
    console.log("(Cloud Function) getAllUserProfilesCF called with data:", data);
    ensureAdmin(context);
    try {
        const options: GetAllUserProfilesOptionsBE = {
            limit: data?.limit || 25,
            startAfter: data?.startAfter,
            sortBy: data?.sortBy || 'createdAt',
            sortOrder: data?.sortOrder || 'desc',
            role: data?.role,
        };
        const result = await getAllUserProfilesBE(options);
        return { success: true, ...result };
    } catch (error: any) {
        console.error("Error in getAllUserProfilesCF:", error);
        if (error instanceof functions.https.HttpsError) throw error;
        throw new functions.https.HttpsError('internal', error.message || 'Failed to get all user profiles.');
    }
});

export const updateUserProfileCF = functions.https.onCall(async (data: UserProfileUpdateData, context) => {
  console.log("(Cloud Function) updateUserProfileCF called with data:", data);
  const userId = ensureAuthenticated(context);
  try {
    if (Object.keys(data).length === 0) {
        throw new functions.https.HttpsError('invalid-argument', 'Update data cannot be empty.');
    }
    const updatedProfile = await updateUserProfileBE(userId, data);
    return { success: true, profile: updatedProfile };
  } catch (error: any) {
    console.error("Error in updateUserProfileCF:", error);
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError('internal', error.message || 'Failed to update user profile.');
  }
});

export const updateUserRolesCF = functions.https.onCall(async (data: { targetUserId: string; roles: UserRole[] }, context) => {
  console.log("(Cloud Function) updateUserRolesCF called with data:", data);
  ensureAdmin(context); 
  try {
    const { targetUserId, roles } = data;
    if (!targetUserId || !roles || !Array.isArray(roles)) {
      throw new functions.https.HttpsError('invalid-argument', 'Target User ID and roles array are required.');
    }
    await updateUserRolesBE(targetUserId, roles);
    return { success: true, message: `Roles updated for user ${targetUserId}.` };
  } catch (error: any) {
    console.error("Error in updateUserRolesCF:", error);
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError('internal', error.message || 'Failed to update user roles.');
  }
});
