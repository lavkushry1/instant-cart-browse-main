// functions/src/api/admin.functions.ts

import * as functions from 'firebase-functions';
import {
  getSiteSettingsBE,
  updateSiteSettingsBE,
} from '../../../src/services/adminService'; // Adjust path
import { SiteSettings } from '../../../src/services/adminService';

const ensureAdmin = (context: functions.https.CallableContext): string => {
  if (!context.auth || !context.auth.token.admin) { 
    throw new functions.https.HttpsError('permission-denied', 'User must be an admin to perform this action.');
  }
  return context.auth.uid;
};

console.log("(Cloud Functions) admin.functions.ts: Initializing with LIVE logic...");

export const getSiteSettingsCF = functions.https.onRequest(async (req, res) => {
  console.log("(Cloud Function) getSiteSettingsCF called.");
  try {
    const settings = await getSiteSettingsBE();
    if (settings) {
      // Create a deep copy to safely delete sensitive keys
      const publicSettings = JSON.parse(JSON.stringify(settings));
      
      // Remove sensitive information before sending to client
      if (publicSettings.paymentGatewayKeys) {
        // Example: if there were secret keys, they would be removed here.
        // For now, we assume only publishable keys are stored or this entire block might be admin-only.
        // delete publicSettings.paymentGatewayKeys.stripeSecretKey; 
      }
      // Add any other sensitive keys to remove for public view

      res.status(200).send({ success: true, settings: publicSettings });
    } else {
      // If settings are critical and must exist, could return 500 or a specific error.
      // For now, 404 if not found, implying they need to be set up.
      res.status(404).send({ success: false, error: 'Site settings not configured.' });
    }
  } catch (error: any) {
    console.error("Error in getSiteSettingsCF:", error);
    res.status(500).send({ success: false, error: error.message || 'Failed to get site settings.' });
  }
});

export const updateSiteSettingsCF = functions.https.onCall(async (data: Partial<SiteSettings>, context) => {
  console.log("(Cloud Function) updateSiteSettingsCF called with data:", data);
  const adminUserId = ensureAdmin(context);
  try {
    if (Object.keys(data).length === 0) {
        throw new functions.https.HttpsError('invalid-argument', 'Update data cannot be empty.');
    }
    // TODO: Add detailed server-side validation for each field in SiteSettings (e.g., URL formats, valid currency codes etc.)
    const updatedSettings = await updateSiteSettingsBE(data, adminUserId);
    return { success: true, settings: updatedSettings };
  } catch (error: any) {
    console.error("Error in updateSiteSettingsCF:", error);
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError('internal', error.message || 'Failed to update site settings.');
  }
});
