// src/services/userService.ts

import * as admin from 'firebase-admin'; // Import for Timestamp, DocumentSnapshot types
import { FieldValue } from 'firebase-admin/firestore'; // Ensure FieldValue is imported
// Import Firebase Admin resources
import {
  db, 
  auth, 
  adminInstance 
} from '../lib/firebaseAdmin'; // Corrected path
const USERS_COLLECTION = 'users';

export interface UserProfileAddress {
    street: string; city: string; state: string; zipCode: string; country: string; isDefault?: boolean;
}
export type UserRole = 'customer' | 'admin' | 'editor';
export interface UserProfile {
  id: string; email: string; displayName?: string; firstName?: string; lastName?: string;
  photoURL?: string; phoneNumber?: string; roles: UserRole[]; addresses?: UserProfileAddress[];
  createdAt: admin.firestore.Timestamp | admin.firestore.FieldValue;
  updatedAt: admin.firestore.Timestamp | admin.firestore.FieldValue;
  lastLoginAt?: admin.firestore.Timestamp | admin.firestore.FieldValue;
  preferences?: { theme?: 'light' | 'dark'; newsletterSubscribed?: boolean; };
}
export type UserProfileCreationData = Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt' | 'roles'> & { roles?: UserRole[]; };
export type UserProfileUpdateData = Partial<Omit<UserProfile, 'id' | 'email' | 'createdAt' | 'updatedAt' | 'roles'>>;

// Interface for data written during an upsert (create or update portion)
interface UserProfileWriteData {
    email?: string; // Email is usually fixed after creation from auth but can be part of initial profile data
    displayName?: string;
    firstName?: string;
    lastName?: string;
    photoURL?: string;
    phoneNumber?: string;
    preferences?: { theme?: 'light' | 'dark'; newsletterSubscribed?: boolean; };
    updatedAt: admin.firestore.FieldValue;
    lastLoginAt: admin.firestore.FieldValue;
    // For creation within upsert
    createdAt?: admin.firestore.FieldValue;
    roles?: UserRole[];
}

// Interface for data written during a dedicated update operation
interface UserProfileUpdateWriteData extends UserProfileUpdateData {
    updatedAt: admin.firestore.FieldValue;
}

console.log(`(Service-Backend) User Service: Using Firestore collection: ${USERS_COLLECTION}`);

export const upsertUserProfileBE = async (uid: string, profileData: Partial<UserProfileCreationData>): Promise<UserProfile> => {
  console.log(`(Service-Backend) upsertUserProfileBE for UID ${uid} with:`, profileData);
  try {
    const userDocRef = db.collection(USERS_COLLECTION).doc(uid);
    const now = adminInstance.firestore.FieldValue.serverTimestamp();
    
    // Data for both create and update parts of upsert
    const dataForFirestore: UserProfileWriteData = {
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
    const onCreationData: Pick<UserProfileWriteData, 'createdAt' | 'roles' | 'email'> = {
        createdAt: now,
        roles: profileData.roles || ['customer'], 
        email: profileData.email, // Ensure email is part of onCreationData if it's set then
    };

    await db.runTransaction(async (transaction: admin.firestore.Transaction) => {
      const userDoc = await transaction.get(userDocRef);
      if (!userDoc.exists) {
        // Combine general upsert data with creation-specific data
        transaction.set(userDocRef, { ...dataForFirestore, ...onCreationData });
      } else {
        // For update, only apply fields meant for update (excluding createdAt, roles if not changing)
        const { createdAt, roles, ...updateFields } = dataForFirestore; 
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        transaction.update(userDocRef, updateFields as { [key: string]: any }); // Cast for update flexibility
      }
    });
    const updatedProfileSnap = await userDocRef.get();
    if (!updatedProfileSnap.exists) throw new Error ('User profile not found after upsert');
    return { id: updatedProfileSnap.id, ...updatedProfileSnap.data() } as UserProfile;
  } catch (error) {
    console.error(`Error in upsertUserProfileBE for UID ${uid}:`, error);
    throw error;
  }
};

export interface UserProfileAddressBE {
  // Firestore typically generates the ID, so it might not be part of the written data for creation
  name?: string; // Label like 'Home', 'Work'
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault?: boolean;
}

const ADDRESSES_SUBCOLLECTION = 'addresses';

export const addUserAddressBE = async (userId: string, addressData: UserProfileAddressBE): Promise<UserProfileAddressBE & { id: string }> => {
  console.log(`(Service-Backend) addUserAddressBE called for user ${userId} with address:`, addressData);
  try {
    const userRef = db.collection(USERS_COLLECTION).doc(userId);
    const addressesRef = userRef.collection(ADDRESSES_SUBCOLLECTION);

    if (addressData.isDefault) {
      // If adding a new default address, unset other default addresses
      const snapshot = await addressesRef.where('isDefault', '==', true).get();
      const batch = db.batch();
      snapshot.docs.forEach(doc => {
        batch.update(doc.ref, { isDefault: false });
      });
      await batch.commit();
    }

    const newAddressRef = await addressesRef.add({
      ...addressData,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    return { ...addressData, id: newAddressRef.id };
  } catch (error) {
    console.error(`Error in addUserAddressBE for user ${userId}:`, error);
    throw new Error('Failed to add user address.');
  }
};

export const updateUserAddressBE = async (userId: string, addressId: string, addressData: Partial<UserProfileAddressBE>): Promise<UserProfileAddressBE & { id: string }> => {
  console.log(`(Service-Backend) updateUserAddressBE called for user ${userId}, address ${addressId} with data:`, addressData);
  try {
    const userRef = db.collection(USERS_COLLECTION).doc(userId);
    const addressRef = userRef.collection(ADDRESSES_SUBCOLLECTION).doc(addressId);

    if (addressData.isDefault) {
      // If setting this address as default, unset other default addresses
      const addressesColRef = userRef.collection(ADDRESSES_SUBCOLLECTION);
      const snapshot = await addressesColRef.where('isDefault', '==', true).get();
      const batch = db.batch();
      snapshot.docs.forEach(doc => {
        if (doc.id !== addressId) { // Don't unset the one we are about to set
            batch.update(doc.ref, { isDefault: false });
        }
      });
      await batch.commit();
    } else if (addressData.isDefault === false) {
        // Check if this was the only default address, if so, prevent unsetting it unless another is set as default
        // For simplicity in this demo, we allow unsetting. A real app might need more complex logic or a separate setDefaultAddress function.
    }

    await addressRef.update({
      ...addressData,
      updatedAt: FieldValue.serverTimestamp(),
    });
    const updatedDoc = await addressRef.get();
    return { ...(updatedDoc.data() as UserProfileAddressBE), id: addressId };
  } catch (error) {
    console.error(`Error in updateUserAddressBE for user ${userId}, address ${addressId}:`, error);
    throw new Error('Failed to update user address.');
  }
};

export const deleteUserAddressBE = async (userId: string, addressId: string): Promise<void> => {
  console.log(`(Service-Backend) deleteUserAddressBE called for user ${userId}, address ${addressId}`);
  try {
    const userRef = db.collection(USERS_COLLECTION).doc(userId);
    const addressRef = userRef.collection(ADDRESSES_SUBCOLLECTION).doc(addressId);
    
    // Optional: Check if it's the default address and handle (e.g., prevent deletion or set another as default)
    // For this demo, we'll allow deletion.

    await addressRef.delete();
  } catch (error) {
    console.error(`Error in deleteUserAddressBE for user ${userId}, address ${addressId}:`, error);
    throw new Error('Failed to delete user address.');
  }
};

export const setDefaultUserAddressBE = async (userId: string, addressId: string): Promise<void> => {
  console.log(`(Service-Backend) setDefaultUserAddressBE called for user ${userId}, address ${addressId}`);
  try {
    const userRef = db.collection(USERS_COLLECTION).doc(userId);
    const addressesRef = userRef.collection(ADDRESSES_SUBCOLLECTION);

    const batch = db.batch();
    // Unset current default
    const snapshot = await addressesRef.where('isDefault', '==', true).get();
    snapshot.docs.forEach(doc => {
      batch.update(doc.ref, { isDefault: false });
    });

    // Set new default
    const newDefaultRef = addressesRef.doc(addressId);
    batch.update(newDefaultRef, { isDefault: true, updatedAt: FieldValue.serverTimestamp() });

    await batch.commit();
  } catch (error) {
    console.error(`Error in setDefaultUserAddressBE for user ${userId}, address ${addressId}:`, error);
    throw new Error('Failed to set default user address.');
  }
};

export const getUserProfileBE = async (userId: string): Promise<UserProfile | null> => {
  console.log("(Service-Backend) getUserProfileBE called for user:", userId);
  try {
    const userDoc = await db.collection(USERS_COLLECTION).doc(userId).get();
    if (!userDoc.exists) {
      console.log(`User profile for ${userId} not found.`);
      return null;
    }
    const userData = userDoc.data() as UserProfile;
    
    // Fetch addresses
    const addressesSnapshot = await db.collection(USERS_COLLECTION).doc(userId).collection(ADDRESSES_SUBCOLLECTION).orderBy('isDefault', 'desc').orderBy('updatedAt', 'desc').get();
    const addresses: (UserProfileAddressBE & { id: string })[] = [];
    addressesSnapshot.forEach(doc => {
      addresses.push({ id: doc.id, ...(doc.data() as UserProfileAddressBE) });
    });
    userData.addresses = addresses;

    return userData;
  } catch (error) {
    console.error("Error fetching user profile:", error);
    throw new Error('Failed to fetch user profile.');
  }
};

export interface GetAllUserProfilesOptionsBE {
    role?: UserRole;
    limit?: number;
    startAfter?: admin.firestore.DocumentSnapshot;
    sortBy?: 'createdAt' | 'lastLoginAt' | 'email';
    sortOrder?: 'asc' | 'desc';
}

export const getAllUserProfilesBE = async (options: GetAllUserProfilesOptionsBE = {}): Promise<{profiles: UserProfile[], lastVisible?: admin.firestore.DocumentSnapshot, totalCount?: number}> => {
    console.log('(Service-Backend) getAllUserProfilesBE with options:', options);
    try {
        let query: admin.firestore.Query = db.collection(USERS_COLLECTION);
        if (options.role) {
            query = query.where('roles', 'array-contains', options.role);
        }
        const sortBy = options.sortBy || 'createdAt';
        const sortOrder = options.sortOrder || 'desc';
        query = query.orderBy(sortBy, sortOrder);

        if (options.startAfter) query = query.startAfter(options.startAfter);
        if (options.limit) query = query.limit(options.limit);

        const snapshot = await query.get();
        if (snapshot.empty) return { profiles: [], totalCount: 0 };

        const profiles = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserProfile));
        const lastVisible: admin.firestore.DocumentSnapshot | undefined = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : undefined;
        
        return { profiles, lastVisible, totalCount: profiles.length };
    } catch (error) {
        console.error("Error in getAllUserProfilesBE:", error);
        throw error;
    }
};

export const updateUserProfileBE = async (uid: string, profileUpdateData: UserProfileUpdateData): Promise<UserProfile> => {
  console.log(`(Service-Backend) updateUserProfileBE for UID ${uid} with:`, profileUpdateData);
  try {
    const userDocRef = db.collection(USERS_COLLECTION).doc(uid);
    const dataToUpdate: UserProfileUpdateWriteData = {
        ...profileUpdateData, 
        updatedAt: adminInstance.firestore.FieldValue.serverTimestamp() 
    };
    // Object.keys(dataToUpdate).forEach(key => dataToUpdate[key] === undefined && delete dataToUpdate[key]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await userDocRef.update(dataToUpdate as { [key: string]: any }); // Keep cast
    const updatedProfileSnap = await userDocRef.get();
    if (!updatedProfileSnap.exists) throw new Error('User profile not found after update');
    return { id: updatedProfileSnap.id, ...updatedProfileSnap.data() } as UserProfile;
  } catch (error) {
    console.error(`Error in updateUserProfileBE for UID ${uid}:`, error);
    throw error;
  }
};

export const deleteUserProfileBE = async (uid: string): Promise<void> => {
  console.log(`(Service-Backend) deleteUserProfileBE for UID: ${uid}`);
  try {
    await db.collection(USERS_COLLECTION).doc(uid).delete();
    console.log(`Firestore profile for UID ${uid} deleted.`);
    // The Firebase Auth user should be deleted separately via an Auth trigger or admin action.
  } catch (error) {
    console.error(`Error in deleteUserProfileBE for UID ${uid}:`, error);
    throw error;
  }
};

export const updateUserRolesBE = async (uid: string, roles: UserRole[]): Promise<void> => {
    console.log(`(Service-Backend) updateUserRolesBE for UID ${uid} with roles:`, roles);
    try {
        const userDocRef = db.collection(USERS_COLLECTION).doc(uid);
        await userDocRef.update({
            roles: roles,
            updatedAt: adminInstance.firestore.FieldValue.serverTimestamp(),
        });
        // IMPORTANT: For roles to be effective in Firebase security rules (e.g., context.auth.token.roles)
        // AND for immediate effect on the user's ID token, you MUST set custom claims on the Firebase Auth user.
        // await auth.setCustomUserClaims(uid, { roles: roles });
        // console.log(`Custom claims set for user ${uid} with roles:`, roles);
    } catch (error) {
        console.error(`Error in updateUserRolesBE for UID ${uid}:`, error);
        throw error;
    }
};