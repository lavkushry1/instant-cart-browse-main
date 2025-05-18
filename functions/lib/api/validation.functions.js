"use strict";
// functions/src/api/validation.functions.ts
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
exports.validateZipCodeCF = void 0;
const functions = __importStar(require("firebase-functions/v1"));
const validationServiceBE_1 = require("../services/validationServiceBE"); // Corrected path
// Optional: Helper to check for authenticated user if certain validations are user-specific
// const ensureAuthenticated = (context: functions.https.CallableContext) => { ... };
console.log("(Cloud Functions) validation.functions.ts: Initializing with LIVE logic...");
/**
 * Validates a ZIP code.
 * (Callable Function)
 */
exports.validateZipCodeCF = functions.https.onCall(async (data, context) => {
    console.log("(Cloud Function) validateZipCodeCF called with data:", data);
    // Optional: Check if user is authenticated if validation depends on user context
    // ensureAuthenticated(context);
    try {
        if (!data || !data.zipCode) {
            throw new functions.https.HttpsError('invalid-argument', 'ZIP code is required.');
        }
        const result = await (0, validationServiceBE_1.validateZipCodeBE)(data.zipCode, data.countryCode);
        return { success: true, validationResult: result };
    }
    catch (error) {
        console.error("Error in validateZipCodeCF:", error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        const message = error instanceof Error ? error.message : 'Failed to validate ZIP code due to an internal error.';
        // Log the error details for admin review
        functions.logger.error("Internal error in validateZipCodeCF:", { data, error: message });
        throw new functions.https.HttpsError('internal', message);
    }
});
//# sourceMappingURL=validation.functions.js.map