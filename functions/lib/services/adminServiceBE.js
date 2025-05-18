"use strict";
// functions/src/services/adminServiceBE.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateSiteSettingsBE = exports.getSiteSettingsBE = void 0;
const firebaseAdmin_1 = require("../lib/firebaseAdmin"); // Corrected relative path
const ADMIN_SETTINGS_COLLECTION = 'admin_settings';
const SITE_CONFIG_DOC_ID = 'site_config';
console.log(`(Service-Backend) Admin Service BE: Using Firestore doc: ${ADMIN_SETTINGS_COLLECTION}/${SITE_CONFIG_DOC_ID}`);
const getSiteSettingsBE = async () => {
    console.log('(Service-Backend) getSiteSettingsBE called');
    try {
        const settingsDocRef = firebaseAdmin_1.firestoreDB.collection(ADMIN_SETTINGS_COLLECTION).doc(SITE_CONFIG_DOC_ID);
        const docSnap = await settingsDocRef.get();
        if (!docSnap.exists) {
            console.log("Site settings document not found. Returning null or consider creating with defaults upon first update.");
            return null;
        }
        // Cast to SiteSettings from src, but remember backend might have more fields (like updatedAt as Timestamp)
        // The SiteSettings type in src should represent what client expects.
        return docSnap.data();
    }
    catch (error) {
        console.error("Error in getSiteSettingsBE:", error);
        throw error;
    }
};
exports.getSiteSettingsBE = getSiteSettingsBE;
// Backend SiteSettings might have server Timestamps, ensure data matches what client SiteSettings expects if returning directly
// Or, transform before sending through CF if types diverge significantly (e.g. Timestamps to strings/numbers)
const updateSiteSettingsBE = async (settingsData, adminUserId) => {
    console.log('(Service-Backend) updateSiteSettingsBE with:', settingsData);
    try {
        const settingsDocRef = firebaseAdmin_1.firestoreDB.collection(ADMIN_SETTINGS_COLLECTION).doc(SITE_CONFIG_DOC_ID);
        // Construct data to save, including server timestamp
        const dataToUpdate = {
            ...settingsData,
            updatedAt: firebaseAdmin_1.adminInstance.firestore.FieldValue.serverTimestamp(),
        };
        if (adminUserId)
            dataToUpdate.lastUpdatedBy = adminUserId;
        // Firestore does not allow 'undefined' values. Clean them up.
        Object.keys(dataToUpdate).forEach(key => {
            const k = key;
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
        return updatedSettingsSnap.data();
    }
    catch (error) {
        console.error("Error in updateSiteSettingsBE:", error);
        throw error;
    }
};
exports.updateSiteSettingsBE = updateSiteSettingsBE;
//# sourceMappingURL=adminServiceBE.js.map