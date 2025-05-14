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
      const publicSettings = JSON.parse(JSON.stringify(settings));
      if (publicSettings.paymentGatewayKeys) {
        // delete publicSettings.paymentGatewayKeys.stripeSecretKey; 
      }
      res.status(200).send({ success: true, settings: publicSettings });
    } else {
      res.status(404).send({ success: false, error: 'Site settings not configured.' });
    }
  } catch (error: unknown) {
    console.error("Error in getSiteSettingsCF:", error);
    const message = error instanceof Error ? error.message : 'Failed to get site settings.';
    res.status(500).send({ success: false, error: message });
  }
});

export const updateSiteSettingsCF = functions.https.onCall(async (data: Partial<SiteSettings>, context) => {
  console.log("(Cloud Function) updateSiteSettingsCF called with data:", data);
  const adminUserId = ensureAdmin(context);
  try {
    if (Object.keys(data).length === 0) {
        throw new functions.https.HttpsError('invalid-argument', 'Update data cannot be empty.');
    }
    const updatedSettings = await updateSiteSettingsBE(data, adminUserId);
    return { success: true, settings: updatedSettings };
  } catch (error: unknown) {
    console.error("Error in updateSiteSettingsCF:", error);
    if (error instanceof functions.https.HttpsError) throw error;
    const message = error instanceof Error ? error.message : 'Failed to update site settings.';
    throw new functions.https.HttpsError('internal', message);
  }
});
