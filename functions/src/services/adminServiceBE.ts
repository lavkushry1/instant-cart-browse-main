// functions/src/services/adminServiceBE.ts

import {
  db, // Firestore instance from firebaseAdmin.ts
  adminInstance // For FieldValue, Timestamp etc. from firebaseAdmin.ts
} from '../../lib/firebaseAdmin'; // Corrected path
import { SiteSettings } from '../../../src/services/adminService'; // Import type from src

const ADMIN_SETTINGS_COLLECTION = 'admin_settings';
const SITE_CONFIG_DOC_ID = 'site_config';

console.log(`(Service-Backend) Admin Service BE: Using Firestore doc: ${ADMIN_SETTINGS_COLLECTION}/${SITE_CONFIG_DOC_ID}`);

export const getSiteSettingsBE = async (): Promise<SiteSettings | null> => {
  console.log('(Service-Backend) getSiteSettingsBE called');
  try {
    const settingsDocRef = db.collection(ADMIN_SETTINGS_COLLECTION).doc(SITE_CONFIG_DOC_ID);
    const docSnap = await settingsDocRef.get();
    if (!docSnap.exists) {
      console.log("Site settings document not found. Returning null or consider creating with defaults upon first update.");
      return null; 
    }
    // Cast to SiteSettings from src, but remember backend might have more fields (like updatedAt as Timestamp)
    // The SiteSettings type in src should represent what client expects.
    return docSnap.data() as SiteSettings; 
  } catch (error) {
    console.error("Error in getSiteSettingsBE:", error);
    throw error;
  }
};

// Backend SiteSettings might have server Timestamps, ensure data matches what client SiteSettings expects if returning directly
// Or, transform before sending through CF if types diverge significantly (e.g. Timestamps to strings/numbers)
export const updateSiteSettingsBE = async (settingsData: Partial<SiteSettings>, adminUserId?: string): Promise<SiteSettings> => {
  console.log('(Service-Backend) updateSiteSettingsBE with:', settingsData);
  try {
    const settingsDocRef = db.collection(ADMIN_SETTINGS_COLLECTION).doc(SITE_CONFIG_DOC_ID);
    
    // Construct data to save, including server timestamp
    const dataToUpdate: Partial<SiteSettings> & { updatedAt: FirebaseFirestore.FieldValue; lastUpdatedBy?: string } = {
      ...settingsData,
      updatedAt: adminInstance.firestore.FieldValue.serverTimestamp(),
    };
    if (adminUserId) dataToUpdate.lastUpdatedBy = adminUserId;
    
    // Firestore does not allow 'undefined' values. Clean them up.
    Object.keys(dataToUpdate).forEach(key => {
      const k = key as keyof typeof dataToUpdate;
      if (dataToUpdate[k] === undefined) {
        delete dataToUpdate[k];
      }
    });

    await settingsDocRef.set(dataToUpdate, { merge: true });
    
    const updatedSettingsSnap = await settingsDocRef.get();
    if (!updatedSettingsSnap.exists) {
        throw new Error('Failed to retrieve settings after update. Document may not have been created/updated correctly.');
    }
    // Cast to SiteSettings from src for return type consistency with what client expects
    return updatedSettingsSnap.data() as SiteSettings;

  } catch (error) {
    console.error("Error in updateSiteSettingsBE:", error);
    throw error;
  }
}; 