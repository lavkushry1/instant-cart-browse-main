"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteOfferBE = exports.updateOfferBE = exports.getAllOffersBE = exports.getOfferByIdBE = exports.createOfferBE = void 0;
const firebaseAdmin_1 = require("../lib/firebaseAdmin");
const OFFERS_COLLECTION = 'offers';
console.log(`(Service-Backend) Offer Service BE: Using Firestore collection: ${OFFERS_COLLECTION}`);
const createOfferBE = async (offerData) => {
    console.log('(Service-Backend) createOfferBE called with:', offerData);
    try {
        const { validFrom, validTill, ...restOfData } = offerData;
        const dataToSave = {
            ...restOfData,
            validFrom: firebaseAdmin_1.adminInstance.firestore.Timestamp.fromDate(new Date(validFrom)),
            validTill: firebaseAdmin_1.adminInstance.firestore.Timestamp.fromDate(new Date(validTill)),
            createdAt: firebaseAdmin_1.adminInstance.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebaseAdmin_1.adminInstance.firestore.FieldValue.serverTimestamp(),
        };
        const docRef = await firebaseAdmin_1.firestoreDB.collection(OFFERS_COLLECTION).add(dataToSave);
        const newDoc = await docRef.get();
        if (!newDoc.exists) {
            throw new Error('Offer document not found after creation.');
        }
        return { id: newDoc.id, ...newDoc.data() };
    }
    catch (error) {
        console.error("Error in createOfferBE:", error);
        throw error;
    }
};
exports.createOfferBE = createOfferBE;
const getOfferByIdBE = async (offerId) => {
    console.log(`(Service-Backend) getOfferByIdBE for ID: ${offerId}`);
    try {
        const docRef = firebaseAdmin_1.firestoreDB.collection(OFFERS_COLLECTION).doc(offerId);
        const docSnap = await docRef.get();
        if (!docSnap.exists)
            return null;
        return { id: docSnap.id, ...docSnap.data() };
    }
    catch (error) {
        console.error(`Error in getOfferByIdBE for ${offerId}:`, error);
        throw error;
    }
};
exports.getOfferByIdBE = getOfferByIdBE;
const getAllOffersBE = async () => {
    console.log('(Service-Backend) getAllOffersBE called');
    try {
        const snapshot = await firebaseAdmin_1.firestoreDB.collection(OFFERS_COLLECTION).orderBy('priority', 'desc').get();
        if (snapshot.empty)
            return [];
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }
    catch (error) {
        console.error("Error in getAllOffersBE:", error);
        throw error;
    }
};
exports.getAllOffersBE = getAllOffersBE;
const updateOfferBE = async (offerId, offerData) => {
    console.log(`(Service-Backend) updateOfferBE for ID ${offerId} with:`, offerData);
    try {
        const docRef = firebaseAdmin_1.firestoreDB.collection(OFFERS_COLLECTION).doc(offerId);
        const { validFrom, validTill, ...restOfData } = offerData;
        const dataToUpdate = {
            ...restOfData,
            updatedAt: firebaseAdmin_1.adminInstance.firestore.FieldValue.serverTimestamp()
        };
        if (validFrom)
            dataToUpdate.validFrom = firebaseAdmin_1.adminInstance.firestore.Timestamp.fromDate(new Date(validFrom));
        if (validTill)
            dataToUpdate.validTill = firebaseAdmin_1.adminInstance.firestore.Timestamp.fromDate(new Date(validTill));
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await docRef.update(dataToUpdate);
        const updatedDoc = await docRef.get();
        if (!updatedDoc.exists) {
            throw new Error('Offer document not found after update.');
        }
        return { id: updatedDoc.id, ...updatedDoc.data() };
    }
    catch (error) {
        console.error("Error in updateOfferBE for ${offerId}:", error);
        throw error;
    }
};
exports.updateOfferBE = updateOfferBE;
const deleteOfferBE = async (offerId) => {
    console.log(`(Service-Backend) deleteOfferBE for ID: ${offerId}`);
    try {
        await firebaseAdmin_1.firestoreDB.collection(OFFERS_COLLECTION).doc(offerId).delete();
    }
    catch (error) {
        console.error(`Error in deleteOfferBE for ${offerId}:`, error);
        throw error;
    }
};
exports.deleteOfferBE = deleteOfferBE;
//# sourceMappingURL=offerServiceBE.js.map