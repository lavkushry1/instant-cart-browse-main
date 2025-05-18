// functions/src/api/offers.functions.ts

import * as functions from 'firebase-functions/v1';
import {
  createOfferBE,
  getOfferByIdBE,
  getAllOffersBE,
  updateOfferBE,
  deleteOfferBE,
} from '../services/offerServiceBE'; // Corrected path to backend service
import { 
    OfferCreationDataFromClient, // Corrected type import
    OfferUpdateDataFromClient    // Corrected type import
} from '../services/offerServiceBE'; // Corrected path for types

// Helper to check for admin role (example, adapt to your auth setup)
const ensureAdmin = (context: functions.https.CallableContext) => {
  // In a real app, set a custom claim 'admin' to true on the user's auth token for admin users.
  // This check assumes such a claim exists.
  if (!context.auth || !context.auth.token.admin) { 
    throw new functions.https.HttpsError(
      'permission-denied',
      'User must be an admin to perform this action.'
    );
  }
};

console.log("(Cloud Functions) offers.functions.ts: Initializing with LIVE logic...");

export const createOfferCF = functions.https.onCall(async (data: OfferCreationDataFromClient, context) => {
  console.log("(Cloud Function) createOfferCF called with data:", data);
  ensureAdmin(context); 
  try {
    // TODO: Add server-side validation for 'data' using a library like Zod or Joi
    if (!data.name || !data.type || !data.validFrom || !data.validTill || data.priority === undefined) {
      throw new functions.https.HttpsError('invalid-argument', 'Required fields are missing or invalid.');
    }
    const newOffer = await createOfferBE(data);
    return { success: true, offer: newOffer };
  } catch (error: unknown) {
    console.error("Error in createOfferCF:", error);
    if (error instanceof functions.https.HttpsError) throw error;
    const message = error instanceof Error ? error.message : 'Failed to create offer.';
    throw new functions.https.HttpsError('internal', message);
  }
});

export const getOfferByIdCF = functions.https.onRequest(async (req, res) => {
  console.log("(Cloud Function) getOfferByIdCF called.");
  try {
    const offerId = req.query.id as string;
    if (!offerId) {
      res.status(400).send({ success: false, error: 'Offer ID is required.' });
      return;
    }
    const offer = await getOfferByIdBE(offerId);
    if (offer) {
      res.status(200).send({ success: true, offer });
    } else {
      res.status(404).send({ success: false, error: 'Offer not found.' });
    }
  } catch (error: unknown) {
    console.error("Error in getOfferByIdCF:", error);
    const message = error instanceof Error ? error.message : 'Failed to get offer.';
    res.status(500).send({ success: false, error: message });
  }
});

export const getAllOffersCF = functions.https.onRequest(async (req, res) => {
  console.log("(Cloud Function) getAllOffersCF called.");
  try {
    // TODO: Add pagination, filtering (e.g. by enabled status for public view) from req.query if needed
    const offers = await getAllOffersBE();
    res.status(200).send({ success: true, offers });
  } catch (error: unknown) {
    console.error("Error in getAllOffersCF:", error);
    const message = error instanceof Error ? error.message : 'Failed to get all offers.';
    res.status(500).send({ success: false, error: message });
  }
});

export const getAllOffersAdminCF = functions.https.onCall(async (_data, context) => {
  console.log("(Cloud Function) getAllOffersAdminCF called.");
  ensureAdmin(context);
  try {
    const offers = await getAllOffersBE();
    return { success: true, offers };
  } catch (error: unknown) {
    console.error("Error in getAllOffersAdminCF:", error);
    if (error instanceof functions.https.HttpsError) throw error;
    const message = error instanceof Error ? error.message : 'Failed to get all offers for admin.';
    throw new functions.https.HttpsError('internal', message);
  }
});

export const updateOfferCF = functions.https.onCall(async (data: { offerId: string; updateData: OfferUpdateDataFromClient }, context) => {
  console.log("(Cloud Function) updateOfferCF called with data:", data);
  ensureAdmin(context);
  try {
    const { offerId, updateData } = data;
    if (!offerId || !updateData || Object.keys(updateData).length === 0) {
      throw new functions.https.HttpsError('invalid-argument', 'Offer ID and valid update data are required.');
    }
    // TODO: Add server-side validation for 'updateData'
    const updatedOffer = await updateOfferBE(offerId, updateData);
    return { success: true, offer: updatedOffer };
  } catch (error: unknown) {
    console.error("Error in updateOfferCF:", error);
    if (error instanceof functions.https.HttpsError) throw error;
    const message = error instanceof Error ? error.message : 'Failed to update offer.';
    throw new functions.https.HttpsError('internal', message);
  }
});

export const deleteOfferCF = functions.https.onCall(async (data: { offerId: string }, context) => {
  console.log("(Cloud Function) deleteOfferCF called with data:", data);
  ensureAdmin(context);
  try {
    const { offerId } = data;
    if (!offerId) {
      throw new functions.https.HttpsError('invalid-argument', 'Offer ID is required.');
    }
    await deleteOfferBE(offerId);
    return { success: true, message: 'Offer deleted successfully.' };
  } catch (error: unknown) {
    console.error("Error in deleteOfferCF:", error);
    if (error instanceof functions.https.HttpsError) throw error;
    const message = error instanceof Error ? error.message : 'Failed to delete offer.';
    throw new functions.https.HttpsError('internal', message);
  }
});
