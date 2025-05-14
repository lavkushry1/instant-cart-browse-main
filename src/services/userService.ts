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
    await db.runTransaction(async (transaction: admin.firestore.Transaction) => {
      const userDoc = await transaction.get(userDocRef);
      if (!userDoc.exists) {
        transaction.set(userDocRef, { ...dataForFirestore, ...onCreationData });
      } else {
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
    if (!docSnap.exists) return null;
    return { id: docSnap.id, ...docSnap.data() } as UserProfile;
  } catch (error) {
    console.error(`Error in getUserProfileBE for UID ${uid}:`, error);
    throw error;
  }
};

export interface GetAllUserProfilesOptionsBE {
    role?: UserRole;
    limit?: number;
    startAfter?: any; // Firestore DocumentSnapshot
    sortBy?: 'createdAt' | 'lastLoginAt' | 'email';
    sortOrder?: 'asc' | 'desc';
}

export const getAllUserProfilesBE = async (options: GetAllUserProfilesOptionsBE = {}): Promise<{profiles: UserProfile[], lastVisible?: any, totalCount?: number}> => {
    console.log('(Service-Backend) getAllUserProfilesBE with options:', options);
    try {
        let query: admin.firestore.Query = db.collection(USERS_COLLECTION);
        if (options.role) {
            query = query.where('roles', 'array-contains', options.role);
        }
        const sortBy = options.sortBy || 'createdAt';
        const sortOrder = options.sortOrder || 'desc';
        query = query.orderBy(sortBy, sortOrder);

        // Count for pagination (example, might need adjustment based on actual Admin SDK capabilities/performance)
        // let totalCount: number | undefined;
        // const countQuery = query; // This needs to be the query BEFORE pagination for an accurate total
        // try {
        //     const totalSnapshot = await countQuery.count().get(); // If .count() is available and performant
        //     totalCount = totalSnapshot.data().count;
        // } catch (e) { console.warn("Count query for users failed or not supported:", e); }

        if (options.startAfter) query = query.startAfter(options.startAfter);
        if (options.limit) query = query.limit(options.limit);

        const snapshot = await query.get();
        if (snapshot.empty) return { profiles: [], totalCount: 0 };

        const profiles = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserProfile));
        const lastVisible = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : undefined;
        
        return { profiles, lastVisible, totalCount: profiles.length }; // totalCount is approximated here
    } catch (error) {
        console.error("Error in getAllUserProfilesBE:", error);
        throw error;
    }
};

export const updateUserProfileBE = async (uid: string, profileUpdateData: UserProfileUpdateData): Promise<UserProfile> => {
  console.log(`(Service-Backend) updateUserProfileBE for UID ${uid} with:`, profileUpdateData);
  try {
    const userDocRef = db.collection(USERS_COLLECTION).doc(uid);
    const dataToUpdate: any = { ...profileUpdateData, updatedAt: adminInstance.firestore.FieldValue.serverTimestamp() };
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