"use strict";
// functions/src/api/admin.functions.ts
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
exports.updateSiteSettingsCF = exports.getSiteSettingsCF = void 0;
const functions = __importStar(require("firebase-functions/v1"));
const adminServiceBE_1 = require("../services/adminServiceBE");
const ensureAdmin = (context) => {
    if (!context.auth || !context.auth.token.admin) {
        throw new functions.https.HttpsError('permission-denied', 'User must be an admin to perform this action.');
    }
    return context.auth.uid;
};
console.log("(Cloud Functions) admin.functions.ts: Initializing with LIVE logic...");
exports.getSiteSettingsCF = functions.https.onCall(async (data, context) => {
    console.log("(Cloud Function) getSiteSettingsCF (onCall) called.");
    ensureAdmin(context); // Ensure the caller is an admin
    try {
        const settings = await (0, adminServiceBE_1.getSiteSettingsBE)();
        if (settings) {
            // Potentially filter sensitive keys before sending to client, though ensureAdmin should protect access
            // For example, if SiteSettings included more sensitive keys than upiVpa:
            // const clientSafeSettings = { ...settings };
            // delete clientSafeSettings.someSensitiveKey;
            return { success: true, settings: settings };
        }
        else {
            // It's okay if settings are not found, client might use defaults or prompt for setup
            return { success: true, settings: null }; // Or return an empty object / specific status
        }
    }
    catch (error) {
        console.error("Error in getSiteSettingsCF (onCall):", error);
        if (error instanceof functions.https.HttpsError)
            throw error;
        const message = error instanceof Error ? error.message : 'Failed to get site settings.';
        throw new functions.https.HttpsError('internal', message);
    }
});
exports.updateSiteSettingsCF = functions.https.onCall(async (data, context) => {
    console.log("(Cloud Function) updateSiteSettingsCF called with data:", data);
    const adminUserId = ensureAdmin(context);
    try {
        if (Object.keys(data).length === 0) {
            throw new functions.https.HttpsError('invalid-argument', 'Update data cannot be empty.');
        }
        const updatedSettings = await (0, adminServiceBE_1.updateSiteSettingsBE)(data, adminUserId);
        return { success: true, settings: updatedSettings };
    }
    catch (error) {
        console.error("Error in updateSiteSettingsCF:", error);
        if (error instanceof functions.https.HttpsError)
            throw error;
        const message = error instanceof Error ? error.message : 'Failed to update site settings.';
        throw new functions.https.HttpsError('internal', message);
    }
});
//# sourceMappingURL=admin.functions.js.map