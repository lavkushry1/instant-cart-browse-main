// functions/src/api/admin.functions.ts

import * as functions from 'firebase-functions/v1';
import {
  getSiteSettingsBE,
  updateSiteSettingsBE,
} from '../services/adminServiceBE';
import { SiteSettings } from '../../../src/services/adminService';

const ensureAdmin = (context: functions.https.CallableContext): string => {
  if (!context.auth || !context.auth.token.admin) { 
    throw new functions.https.HttpsError('permission-denied', 'User must be an admin to perform this action.');
  }
  return context.auth.uid;
};

console.log("(Cloud Functions) admin.functions.ts: Initializing with LIVE logic...");

export const getSiteSettingsCF = functions.https.onCall(async (data, context) => {
  console.log("(Cloud Function) getSiteSettingsCF (onCall) called.");
  ensureAdmin(context); // Ensure the caller is an admin
  try {
    const settings = await getSiteSettingsBE();
    if (settings) {
      // Potentially filter sensitive keys before sending to client, though ensureAdmin should protect access
      // For example, if SiteSettings included more sensitive keys than upiVpa:
      // const clientSafeSettings = { ...settings };
      // delete clientSafeSettings.someSensitiveKey;
      return { success: true, settings: settings };
    } else {
      // It's okay if settings are not found, client might use defaults or prompt for setup
      return { success: true, settings: null }; // Or return an empty object / specific status
    }
  } catch (error: unknown) {
    console.error("Error in getSiteSettingsCF (onCall):", error);
    if (error instanceof functions.https.HttpsError) throw error;
    const message = error instanceof Error ? error.message : 'Failed to get site settings.';
    throw new functions.https.HttpsError('internal', message);
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
