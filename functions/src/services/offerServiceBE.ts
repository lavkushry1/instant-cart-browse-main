import * as admin from 'firebase-admin';
import {
  firestoreDB as db, // Corrected: use firestoreDB and alias as db
  adminInstance // For FieldValue, Timestamp etc. from firebaseAdmin.ts
} from '../lib/firebaseAdmin';
import { Timestamp as ClientTimestamp } from 'firebase/firestore'; // Corrected: import Timestamp as ClientTimestamp

const OFFERS_COLLECTION = 'offers';

// Shared types - ensure these align with client-side if used directly, or map them.
// For backend, Timestamps should be admin.firestore.Timestamp.
export interface OfferCondition {
    cartValueGreaterThan?: number;
}

export interface OfferBE { // Suffix with BE to distinguish if client type is different
  id: string;
  name: string;
  type: 'product' | 'store' | 'conditional' | 'category';
  discountPercent?: number;
  discountAmount?: number;
  productIds?: string[];
  categoryIds?: string[];
  condition?: OfferCondition;
  validFrom: admin.firestore.Timestamp;
  validTill: admin.firestore.Timestamp;
  priority: number;
  enabled: boolean;
  createdAt: admin.firestore.Timestamp;
  updatedAt: admin.firestore.Timestamp;
}

// For data coming from client (e.g., forms), expect ISO strings for dates
// This type would be used by the Cloud Function marshalling client data.
export type OfferCreationDataFromClient = Omit<OfferBE, 'id' | 'createdAt' | 'updatedAt' | 'validFrom' | 'validTill'> & {
    validFrom: string;
    validTill: string;
};

// For data being written to Firestore during creation
interface OfferWriteData extends Omit<OfferCreationDataFromClient, 'validFrom' | 'validTill'> {
    validFrom: admin.firestore.Timestamp;
    validTill: admin.firestore.Timestamp;
    createdAt: admin.firestore.FieldValue;
    updatedAt: admin.firestore.FieldValue;
}

export type OfferUpdateDataFromClient = Partial<Omit<OfferBE, 'id' | 'createdAt' | 'updatedAt' | 'validFrom' | 'validTill'> & {
    validFrom?: string;
    validTill?: string;
}>;

// For data being written to Firestore during update
interface OfferUpdateWriteData extends Partial<Omit<OfferBE, 'id' | 'createdAt' | 'updatedAt' | 'validFrom' | 'validTill'>> {
    validFrom?: admin.firestore.Timestamp;
    validTill?: admin.firestore.Timestamp;
    updatedAt: admin.firestore.FieldValue;
}


console.log(`(Service-Backend) Offer Service BE: Using Firestore collection: ${OFFERS_COLLECTION}`);

export const createOfferBE = async (offerData: OfferCreationDataFromClient): Promise<OfferBE> => {
  console.log('(Service-Backend) createOfferBE called with:', offerData);
  try {
    const { validFrom, validTill, ...restOfData } = offerData;
    const dataToSave: OfferWriteData = {
      ...restOfData,
      validFrom: adminInstance.firestore.Timestamp.fromDate(new Date(validFrom)),
      validTill: adminInstance.firestore.Timestamp.fromDate(new Date(validTill)),
      createdAt: adminInstance.firestore.FieldValue.serverTimestamp(),
      updatedAt: adminInstance.firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await db.collection(OFFERS_COLLECTION).add(dataToSave);
    const newDoc = await docRef.get();
    if (!newDoc.exists) {
        throw new Error('Offer document not found after creation.');
    }
    return { id: newDoc.id, ...newDoc.data() } as OfferBE;
  } catch (error) {
    console.error("Error in createOfferBE:", error);
    throw error;
  }
};

export const getOfferByIdBE = async (offerId: string): Promise<OfferBE | null> => {
  console.log(`(Service-Backend) getOfferByIdBE for ID: ${offerId}`);
  try {
    const docRef = db.collection(OFFERS_COLLECTION).doc(offerId);
    const docSnap = await docRef.get();
    if (!docSnap.exists) return null;
    return { id: docSnap.id, ...docSnap.data() } as OfferBE;
  } catch (error) {
    console.error(`Error in getOfferByIdBE for ${offerId}:`, error);
    throw error;
  }
};

export const getAllOffersBE = async (): Promise<OfferBE[]> => {
  console.log('(Service-Backend) getAllOffersBE called');
  try {
    const snapshot = await db.collection(OFFERS_COLLECTION).orderBy('priority', 'desc').get();
    if (snapshot.empty) return [];
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as OfferBE));
  } catch (error) {
    console.error("Error in getAllOffersBE:", error);
    throw error;
  }
};

export const updateOfferBE = async (offerId: string, offerData: OfferUpdateDataFromClient): Promise<OfferBE> => {
  console.log(`(Service-Backend) updateOfferBE for ID ${offerId} with:`, offerData);
  try {
    const docRef = db.collection(OFFERS_COLLECTION).doc(offerId);
    const { validFrom, validTill, ...restOfData } = offerData;
    const dataToUpdate: OfferUpdateWriteData = {
         ...restOfData,
         updatedAt: adminInstance.firestore.FieldValue.serverTimestamp()
    };
    if (validFrom) dataToUpdate.validFrom = adminInstance.firestore.Timestamp.fromDate(new Date(validFrom));
    if (validTill) dataToUpdate.validTill = adminInstance.firestore.Timestamp.fromDate(new Date(validTill));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await docRef.update(dataToUpdate as { [key: string]: any });

    const updatedDoc = await docRef.get();
    if (!updatedDoc.exists) {
        throw new Error('Offer document not found after update.');
    }
    return { id: updatedDoc.id, ...updatedDoc.data() } as OfferBE;
  } catch (error) {
    console.error("Error in updateOfferBE for ${offerId}:", error);
    throw error;
  }
};

export const deleteOfferBE = async (offerId: string): Promise<void> => {
  console.log(`(Service-Backend) deleteOfferBE for ID: ${offerId}`);
  try {
    await db.collection(OFFERS_COLLECTION).doc(offerId).delete();
  } catch (error) {
    console.error(`Error in deleteOfferBE for ${offerId}:`, error);
    throw error;
  }
}; 