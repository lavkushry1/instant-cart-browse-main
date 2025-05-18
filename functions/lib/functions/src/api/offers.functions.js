"use strict";
// functions/src/api/offers.functions.ts
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
exports.deleteOfferCF = exports.updateOfferCF = exports.getAllOffersAdminCF = exports.getAllOffersCF = exports.getOfferByIdCF = exports.createOfferCF = void 0;
const functions = __importStar(require("firebase-functions/v1"));
const offerServiceBE_1 = require("../services/offerServiceBE"); // Corrected path to backend service
// Helper to check for admin role (example, adapt to your auth setup)
const ensureAdmin = (context) => {
    // In a real app, set a custom claim 'admin' to true on the user's auth token for admin users.
    // This check assumes such a claim exists.
    if (!context.auth || !context.auth.token.admin) {
        throw new functions.https.HttpsError('permission-denied', 'User must be an admin to perform this action.');
    }
};
console.log("(Cloud Functions) offers.functions.ts: Initializing with LIVE logic...");
exports.createOfferCF = functions.https.onCall(async (data, context) => {
    console.log("(Cloud Function) createOfferCF called with data:", data);
    ensureAdmin(context);
    try {
        // TODO: Add server-side validation for 'data' using a library like Zod or Joi
        if (!data.name || !data.type || !data.validFrom || !data.validTill || data.priority === undefined) {
            throw new functions.https.HttpsError('invalid-argument', 'Required fields are missing or invalid.');
        }
        const newOffer = await (0, offerServiceBE_1.createOfferBE)(data);
        return { success: true, offer: newOffer };
    }
    catch (error) {
        console.error("Error in createOfferCF:", error);
        if (error instanceof functions.https.HttpsError)
            throw error;
        const message = error instanceof Error ? error.message : 'Failed to create offer.';
        throw new functions.https.HttpsError('internal', message);
    }
});
exports.getOfferByIdCF = functions.https.onRequest(async (req, res) => {
    console.log("(Cloud Function) getOfferByIdCF called.");
    try {
        const offerId = req.query.id;
        if (!offerId) {
            res.status(400).send({ success: false, error: 'Offer ID is required.' });
            return;
        }
        const offer = await (0, offerServiceBE_1.getOfferByIdBE)(offerId);
        if (offer) {
            res.status(200).send({ success: true, offer });
        }
        else {
            res.status(404).send({ success: false, error: 'Offer not found.' });
        }
    }
    catch (error) {
        console.error("Error in getOfferByIdCF:", error);
        const message = error instanceof Error ? error.message : 'Failed to get offer.';
        res.status(500).send({ success: false, error: message });
    }
});
exports.getAllOffersCF = functions.https.onRequest(async (req, res) => {
    console.log("(Cloud Function) getAllOffersCF called.");
    try {
        // TODO: Add pagination, filtering (e.g. by enabled status for public view) from req.query if needed
        const offers = await (0, offerServiceBE_1.getAllOffersBE)();
        res.status(200).send({ success: true, offers });
    }
    catch (error) {
        console.error("Error in getAllOffersCF:", error);
        const message = error instanceof Error ? error.message : 'Failed to get all offers.';
        res.status(500).send({ success: false, error: message });
    }
});
exports.getAllOffersAdminCF = functions.https.onCall(async (_data, context) => {
    console.log("(Cloud Function) getAllOffersAdminCF called.");
    ensureAdmin(context);
    try {
        const offers = await (0, offerServiceBE_1.getAllOffersBE)();
        return { success: true, offers };
    }
    catch (error) {
        console.error("Error in getAllOffersAdminCF:", error);
        if (error instanceof functions.https.HttpsError)
            throw error;
        const message = error instanceof Error ? error.message : 'Failed to get all offers for admin.';
        throw new functions.https.HttpsError('internal', message);
    }
});
exports.updateOfferCF = functions.https.onCall(async (data, context) => {
    console.log("(Cloud Function) updateOfferCF called with data:", data);
    ensureAdmin(context);
    try {
        const { offerId, updateData } = data;
        if (!offerId || !updateData || Object.keys(updateData).length === 0) {
            throw new functions.https.HttpsError('invalid-argument', 'Offer ID and valid update data are required.');
        }
        // TODO: Add server-side validation for 'updateData'
        const updatedOffer = await (0, offerServiceBE_1.updateOfferBE)(offerId, updateData);
        return { success: true, offer: updatedOffer };
    }
    catch (error) {
        console.error("Error in updateOfferCF:", error);
        if (error instanceof functions.https.HttpsError)
            throw error;
        const message = error instanceof Error ? error.message : 'Failed to update offer.';
        throw new functions.https.HttpsError('internal', message);
    }
});
exports.deleteOfferCF = functions.https.onCall(async (data, context) => {
    console.log("(Cloud Function) deleteOfferCF called with data:", data);
    ensureAdmin(context);
    try {
        const { offerId } = data;
        if (!offerId) {
            throw new functions.https.HttpsError('invalid-argument', 'Offer ID is required.');
        }
        await (0, offerServiceBE_1.deleteOfferBE)(offerId);
        return { success: true, message: 'Offer deleted successfully.' };
    }
    catch (error) {
        console.error("Error in deleteOfferCF:", error);
        if (error instanceof functions.https.HttpsError)
            throw error;
        const message = error instanceof Error ? error.message : 'Failed to delete offer.';
        throw new functions.https.HttpsError('internal', message);
    }
});
//# sourceMappingURL=offers.functions.js.map