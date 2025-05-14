// src/services/userService.ts

// Import Firebase Admin resources
import {
  db, // Firestore instance from firebaseAdmin.ts
  auth, // Auth instance from firebaseAdmin.ts
  adminInstance // For FieldValue, Timestamp etc. from firebaseAdmin.ts
} from '../../lib/firebaseAdmin'; // Adjust path as necessary
const USERS_COLLECTION = 'users';

export interface UserProfileAddress {
    street: string; city: string; state: string; zipCode: string; country: string; isDefault?: boolean;
}
export type UserRole = 'customer' | 'admin' | 'editor';
export interface UserProfile {
  id: string; email: string; displayName?: string; firstName?: string; lastName?: string;
  photoURL?: string; phoneNumber?: string; roles: UserRole[]; addresses?: UserProfileAddress[];
  createdAt: any; updatedAt: any; lastLoginAt?: any;
  preferences?: { theme?: 'light' | 'dark'; newsletterSubscribed?: boolean; };
}
export type UserProfileCreationData = Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt' | 'roles'> & { roles?: UserRole[]; };
export type UserProfileUpdateData = Partial<Omit<UserProfile, 'id' | 'email' | 'createdAt' | 'updatedAt' | 'roles'>>;

console.log(`(Service-Backend) User Service: Using Firestore collection: ${USERS_COLLECTION}`);

export const upsertUserProfileBE = async (uid: string, profileData: Partial<UserProfileCreationData>): Promise<UserProfile> => {
  console.log(`(Service-Backend) upsertUserProfileBE for UID ${uid} with:`, profileData);
  try {
    const userDocRef = db.collection(USERS_COLLECTION).doc(uid);
    const now = adminInstance.firestore.FieldValue.serverTimestamp();
    
    const dataForFirestore: any = {
        // Ensure email is always present and sourced reliably (e.g. from Auth user record during creation)
        email: profileData.email, 
        displayName: profileData.displayName,
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        photoURL: profileData.photoURL,
        phoneNumber: profileData.phoneNumber,
        preferences: profileData.preferences || {},
        updatedAt: now, // This will be set on update, and also initially if merged.
        lastLoginAt: now, // Update last login time on upsert
    };

    // Data to be set only upon creation of the document
    const onCreationData = {
        createdAt: now,
        roles: profileData.roles || ['customer'], // Default role
        email: profileData.email, // ensure email is set on create too
    };

    // Atomically create if not exists, or update if exists.
    // set with {merge: true} will create or overwrite specified fields.
    // To only set `createdAt` and `roles` on actual creation, a transaction is more robust.
    await db.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userDocRef);
      if (!userDoc.exists) {
        // Document does not exist, create it with initial fields
        transaction.set(userDocRef, { ...dataForFirestore, ...onCreationData });
      } else {
        // Document exists, update it (createdAt and roles from onCreationData will not be applied here)
        transaction.update(userDocRef, dataForFirestore);
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

export const getUserProfileBE = async (uid: string): Promise<UserProfile | null> => {
  console.log(`(Service-Backend) getUserProfileBE for UID: ${uid}`);
  try {
    const userDocRef = db.collection(USERS_COLLECTION).doc(uid);
    const docSnap = await userDocRef.get();
    if (!docSnap.exists) {
        // Optionally, if an auth user exists but no Firestore profile, create one.
        // This can be useful for migrating users or handling edge cases.
        /* try {
            const authUser = await auth.getUser(uid);
            if (authUser && authUser.email) {
               console.log(`User profile for ${uid} not found in Firestore, attempting to create from Auth info...`);
               return upsertUserProfileBE(uid, { email: authUser.email!, displayName: authUser.displayName, photoURL: authUser.photoURL });
            }
        } catch (authError) {
            console.warn(`Auth user ${uid} not found while trying to auto-create profile:`, authError);
        } */
        return null;
    }
    return { id: docSnap.id, ...docSnap.data() } as UserProfile;
  } catch (error) {
    console.error(`Error in getUserProfileBE for UID ${uid}:`, error);
    throw error;
  }
};

export const updateUserProfileBE = async (uid: string, profileUpdateData: UserProfileUpdateData): Promise<UserProfile> => {
  console.log(`(Service-Backend) updateUserProfileBE for UID ${uid} with:`, profileUpdateData);
  try {
    const userDocRef = db.collection(USERS_COLLECTION).doc(uid);
    const dataToUpdate: any = {
      ...profileUpdateData,
      updatedAt: adminInstance.firestore.FieldValue.serverTimestamp(),
    };
    Object.keys(dataToUpdate).forEach(key => dataToUpdate[key] === undefined && delete dataToUpdate[key]);

    await userDocRef.update(dataToUpdate);
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
    // It's crucial to delete the Auth user as well, usually before or after this Firestore delete.
    // This function assumes Auth user deletion is handled by the caller or an Auth trigger.
    // await auth.deleteUser(uid); // If called from an admin context not an auth trigger.
    await db.collection(USERS_COLLECTION).doc(uid).delete();
    console.log(`Firestore profile for UID ${uid} deleted.`);
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
        // For roles to be effective in Firebase security rules via `auth.token.roles`,
        // you MUST set custom claims on the Firebase Auth user.
        // await auth.setCustomUserClaims(uid, { roles });
        // console.log(`Custom claims set for user ${uid} with roles:`, roles);
    } catch (error) {
        console.error(`Error in updateUserRolesBE for UID ${uid}:`, error);
        throw error;
    }
};