// src/services/adminService.ts

// Import Firebase Admin resources
import {
  db, // Firestore instance from firebaseAdmin.ts
  adminInstance // For FieldValue, Timestamp etc. from firebaseAdmin.ts
} from '../../lib/firebaseAdmin'; // Adjust path as necessary
const ADMIN_SETTINGS_COLLECTION = 'admin_settings';
const SITE_CONFIG_DOC_ID = 'site_config';

import { Timestamp as ClientTimestamp } from 'firebase/firestore';

export interface SiteSettings {
    storeName?: string; storeLogoUrl?: string; contactEmail?: string; contactPhone?: string; address?: string;
    socialMediaLinks?: { facebook?: string; instagram?: string; twitter?: string; };
    currency?: { defaultCode: string; supportedCodes?: string[]; };
    paymentGatewayKeys?: { stripePublishableKey?: string; /* more gateways */ };
    seoDefaults?: { metaTitle?: string; metaDescription?: string; };
    themePreferences?: { primaryColor?: string; secondaryColor?: string; fontFamily?: string; };
    trackingIds?: { googleAnalyticsId?: string; facebookPixelId?: string; };
    maintenanceMode?: boolean; lastUpdatedBy?: string; updatedAt?: any; // admin.firestore.Timestamp
}

console.log(`(Service-Backend) Admin Service: Using Firestore doc: ${ADMIN_SETTINGS_COLLECTION}/${SITE_CONFIG_DOC_ID}`);

export const getSiteSettingsBE = async (): Promise<SiteSettings | null> => {
  console.log('(Service-Backend) getSiteSettingsBE called');
  try {
    const settingsDocRef = db.collection(ADMIN_SETTINGS_COLLECTION).doc(SITE_CONFIG_DOC_ID);
    const docSnap = await settingsDocRef.get();
    if (!docSnap.exists) {
      console.log("Site settings document not found. Returning null or consider creating with defaults upon first update.");
      return null; 
    }
    return docSnap.data() as SiteSettings;
  } catch (error) {
    console.error("Error in getSiteSettingsBE:", error);
    throw error;
  }
};

export const updateSiteSettingsBE = async (settingsData: Partial<SiteSettings>, adminUserId?: string): Promise<SiteSettings> => {
  console.log('(Service-Backend) updateSiteSettingsBE with:', settingsData);
  try {
    const settingsDocRef = db.collection(ADMIN_SETTINGS_COLLECTION).doc(SITE_CONFIG_DOC_ID);
    const dataToUpdate: Partial<SiteSettings> & { updatedAt: any; lastUpdatedBy?: string } = {
      ...settingsData,
      updatedAt: adminInstance.firestore.FieldValue.serverTimestamp(),
    };
    if (adminUserId) dataToUpdate.lastUpdatedBy = adminUserId;
    
    Object.keys(dataToUpdate).forEach(key => (dataToUpdate as any)[key] === undefined && delete (dataToUpdate as any)[key]);

    // Use set with merge:true to create the document if it doesn't exist, or update if it does.
    await settingsDocRef.set(dataToUpdate, { merge: true });
    
    const updatedSettingsSnap = await settingsDocRef.get();
    if (!updatedSettingsSnap.exists) {
        // This should ideally not happen if set with merge worked.
        throw new Error('Failed to retrieve settings after update. Document may not have been created/updated correctly.');
    }
    return updatedSettingsSnap.data() as SiteSettings;

  } catch (error) {
    console.error("Error in updateSiteSettingsBE:", error);
    throw error;
  }
};