import * as admin from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import {
  firestoreDB as db, 
  // authAdmin as auth, // authAdmin might be needed if interacting with Auth users directly
  adminInstance 
} from '../lib/firebaseAdmin'; 

const USERS_COLLECTION = 'users';
const ADDRESSES_SUBCOLLECTION = 'addresses';

export interface UserProfileAddressBE {
  id?: string; // ID is assigned by Firestore, but can be part of the read object
  name?: string; // Label like 'Home', 'Work'
  street: string; 
  city: string; 
  state: string; 
  zipCode: string; 
  country: string; 
  isDefault?: boolean;
  // Timestamps for address if needed (e.g. createdAt, updatedAt)
  createdAt?: admin.firestore.Timestamp | admin.firestore.FieldValue;
  updatedAt?: admin.firestore.Timestamp | admin.firestore.FieldValue;
}

export type UserRoleBE = 'customer' | 'admin' | 'editor';

export interface UserProfileBE {
  id: string; 
  email: string; 
  displayName?: string; 
  firstName?: string; 
  lastName?: string;
  photoURL?: string; 
  phoneNumber?: string; 
  roles: UserRoleBE[]; 
  addresses?: UserProfileAddressBE[];
  createdAt: admin.firestore.Timestamp; // Firestore admin Timestamp
  updatedAt: admin.firestore.Timestamp; // Firestore admin Timestamp
  lastLoginAt?: admin.firestore.Timestamp; // Firestore admin Timestamp
  preferences?: { theme?: 'light' | 'dark'; newsletterSubscribed?: boolean; };
}

export type UserProfileCreationDataBE = Omit<UserProfileBE, 'id' | 'createdAt' | 'updatedAt' | 'roles' | 'addresses'> & { 
  roles?: UserRoleBE[]; 
};

export type UserProfileUpdateDataBE = Partial<Omit<UserProfileBE, 'id' | 'email' | 'createdAt' | 'updatedAt' | 'roles' | 'addresses'>>;

interface UserProfileWriteData {
    email?: string; 
    displayName?: string;
    firstName?: string;
    lastName?: string;
    photoURL?: string;
    phoneNumber?: string;
    preferences?: { theme?: 'light' | 'dark'; newsletterSubscribed?: boolean; };
    updatedAt: admin.firestore.FieldValue;
    lastLoginAt?: admin.firestore.FieldValue;
    createdAt?: admin.firestore.FieldValue;
    roles?: UserRoleBE[];
}

console.log(`(Service-Backend) User Service BE: Using Firestore collection: ${USERS_COLLECTION}`);

export const upsertUserProfileBE = async (uid: string, profileData: Partial<UserProfileCreationDataBE>): Promise<UserProfileBE> => {
  console.log(`(Service-Backend) upsertUserProfileBE for UID ${uid} with:`, profileData);
  try {
    const userDocRef = db.collection(USERS_COLLECTION).doc(uid);
    const now = adminInstance.firestore.FieldValue.serverTimestamp();
    
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
    
    const onCreationData: Pick<UserProfileWriteData, 'createdAt' | 'roles' | 'email'> = {
        createdAt: now,
        roles: profileData.roles || ['customer'], 
        email: profileData.email,
    };

    await db.runTransaction(async (transaction: admin.firestore.Transaction) => {
      const userDoc = await transaction.get(userDocRef);
      if (!userDoc.exists) {
        transaction.set(userDocRef, { ...dataForFirestore, ...onCreationData });
      } else {
        const { createdAt, roles, ...updateFields } = dataForFirestore; 
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        transaction.update(userDocRef, updateFields as { [key: string]: any });
      }
    });
    const updatedProfileSnap = await userDocRef.get();
    if (!updatedProfileSnap.exists) throw new Error ('User profile not found after upsert');
    return { id: updatedProfileSnap.id, ...updatedProfileSnap.data() } as UserProfileBE;
  } catch (error) {
    console.error(`Error in upsertUserProfileBE for UID ${uid}:`, error);
    throw error;
  }
};

export const addUserAddressBE = async (userId: string, addressData: Omit<UserProfileAddressBE, 'id' | 'createdAt' | 'updatedAt'>): Promise<UserProfileAddressBE> => {
  console.log(`(Service-Backend) addUserAddressBE called for user ${userId} with address:`, addressData);
  try {
    const userRef = db.collection(USERS_COLLECTION).doc(userId);
    const addressesRef = userRef.collection(ADDRESSES_SUBCOLLECTION);
    const batch = db.batch();

    if (addressData.isDefault) {
      const snapshot = await addressesRef.where('isDefault', '==', true).get();
      snapshot.docs.forEach(doc => {
        batch.update(doc.ref, { isDefault: false });
      });
    }

    const newAddressRef = addressesRef.doc(); // Generate ID beforehand
    batch.set(newAddressRef, {
      ...addressData,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    await batch.commit();
    return { ...addressData, id: newAddressRef.id, createdAt: adminInstance.firestore.Timestamp.now(), updatedAt: adminInstance.firestore.Timestamp.now() } as UserProfileAddressBE; // Construct return with ID and placeholder TS
  } catch (error) {
    console.error(`Error in addUserAddressBE for user ${userId}:`, error);
    throw new Error('Failed to add user address.');
  }
};

export const updateUserAddressBE = async (userId: string, addressId: string, addressData: Partial<Omit<UserProfileAddressBE, 'id' | 'createdAt' | 'updatedAt'>>): Promise<UserProfileAddressBE> => {
  console.log(`(Service-Backend) updateUserAddressBE called for user ${userId}, address ${addressId} with data:`, addressData);
  try {
    const userRef = db.collection(USERS_COLLECTION).doc(userId);
    const addressRef = userRef.collection(ADDRESSES_SUBCOLLECTION).doc(addressId);
    const batch = db.batch();

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
      updatedAt: FieldValue.serverTimestamp(),
    });
    await batch.commit();
    const updatedDoc = await addressRef.get();
    if (!updatedDoc.exists) throw new Error('Address not found after update');
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
    const snapshot = await addressesRef.where('isDefault', '==', true).get();
    snapshot.docs.forEach(doc => {
      batch.update(doc.ref, { isDefault: false });
    });
    const newDefaultRef = addressesRef.doc(addressId);
    batch.update(newDefaultRef, { isDefault: true, updatedAt: FieldValue.serverTimestamp() });
    await batch.commit();
  } catch (error) {
    console.error(`Error in setDefaultUserAddressBE for user ${userId}, address ${addressId}:`, error);
    throw new Error('Failed to set default user address.');
  }
};

export const getUserProfileBE = async (userId: string): Promise<UserProfileBE | null> => {
  console.log("(Service-Backend) getUserProfileBE called for user:", userId);
  try {
    const userDoc = await db.collection(USERS_COLLECTION).doc(userId).get();
    if (!userDoc.exists) {
      console.log(`User profile for ${userId} not found.`);
      return null;
    }
    const userData = userDoc.data() as Omit<UserProfileBE, 'addresses'>;
    const addressesSnapshot = await db.collection(USERS_COLLECTION).doc(userId).collection(ADDRESSES_SUBCOLLECTION).orderBy('isDefault', 'desc').orderBy('updatedAt', 'desc').get();
    const addresses: UserProfileAddressBE[] = [];
    addressesSnapshot.forEach(doc => {
      addresses.push({ id: doc.id, ...(doc.data() as Omit<UserProfileAddressBE, 'id'>) });
    });
    return { ...userData, id: userId, addresses }; // Ensure id is part of the returned object for UserProfileBE
  } catch (error) {
    console.error("Error fetching user profile:", error);
    throw new Error('Failed to fetch user profile.');
  }
};

export interface GetAllUserProfilesOptionsBE {
    role?: UserRoleBE;
    limit?: number;
    startAfter?: admin.firestore.DocumentSnapshot; // For pagination with Admin SDK cursors
    sortBy?: 'createdAt' | 'lastLoginAt' | 'email';
    sortOrder?: 'asc' | 'desc';
}

export const getAllUserProfilesBE = async (options: GetAllUserProfilesOptionsBE = {}): Promise<{profiles: UserProfileBE[], lastVisible?: admin.firestore.DocumentSnapshot, totalCount?: number}> => {
    console.log('(Service-Backend) getAllUserProfilesBE with options:', options);
    try {
        let query: admin.firestore.Query = db.collection(USERS_COLLECTION);
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
        const profiles: UserProfileBE[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserProfileBE));
        const lastVisible = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : undefined;
        
        // For total count, we need a separate query without limit/pagination if role filter is applied.
        // This can be expensive. Consider if totalCount is strictly needed for every call.
        let totalCount = undefined;
        if (options.role) {
            const countQuery = db.collection(USERS_COLLECTION).where('roles', 'array-contains', options.role);
            const countSnapshot = await countQuery.count().get();
            totalCount = countSnapshot.data().count;
        } else {
            // Approximating total users without a filter could be done by other means or not provided.
            // For now, if no role filter, totalCount remains undefined as a full count is very expensive.
        }

        return { profiles, lastVisible, totalCount };
    } catch (error) {
        console.error("Error in getAllUserProfilesBE:", error);
        throw error;
    }
};

export const updateUserProfileBE = async (uid: string, profileUpdateData: UserProfileUpdateDataBE): Promise<UserProfileBE> => {
  console.log(`(Service-Backend) updateUserProfileBE for UID ${uid} with:`, profileUpdateData);
  try {
    const userDocRef = db.collection(USERS_COLLECTION).doc(uid);
    const dataToUpdate: Partial<UserProfileWriteData> = {
        ...profileUpdateData,
        updatedAt: adminInstance.firestore.FieldValue.serverTimestamp(),
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await userDocRef.update(dataToUpdate as { [key: string]: any });
    const updatedProfileSnap = await userDocRef.get();
     if (!updatedProfileSnap.exists) throw new Error ('User profile not found after update');
    return { id: updatedProfileSnap.id, ...updatedProfileSnap.data() } as UserProfileBE;
  } catch (error) {
    console.error(`Error in updateUserProfileBE for UID ${uid}:`, error);
    throw error;
  }
};

export const deleteUserProfileBE = async (uid: string): Promise<void> => {
  console.log(`(Service-Backend) deleteUserProfileBE for UID: ${uid}`);
  try {
    // Consider deleting addresses subcollection as well if it exists
    const addressesRef = db.collection(USERS_COLLECTION).doc(uid).collection(ADDRESSES_SUBCOLLECTION);
    const snapshot = await addressesRef.limit(500).get(); // Batch delete if many
    if (!snapshot.empty) {
        const batch = db.batch();
        snapshot.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
    }
    await db.collection(USERS_COLLECTION).doc(uid).delete();
  } catch (error) {
    console.error(`Error deleting user profile for UID ${uid}:`, error);
    throw error;
  }
};

export const updateUserRolesBE = async (uid: string, roles: UserRoleBE[]): Promise<void> => {
  console.log(`(Service-Backend) updateUserRolesBE for UID ${uid} with roles:`, roles);
  try {
    const userDocRef = db.collection(USERS_COLLECTION).doc(uid);
    await userDocRef.update({
      roles: roles,
      updatedAt: adminInstance.firestore.FieldValue.serverTimestamp(),
    });
    // Optional: Update custom claims on Auth user if roles drive auth rules
    // await auth.setCustomUserClaims(uid, { roles: roles });
  } catch (error) {
    console.error(`Error updating roles for UID ${uid}:`, error);
    throw error;
  }
}; 