"use strict";
// functions/src/services/validationServiceBE.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateZipCodeBE = void 0;
// This service would contain backend logic for various validations.
// For now, it will focus on ZIP code validation.
// Import Firebase Admin resources if needed for more complex validation (e.g., against a DB of valid ZIPs)
/*
import {
  firestoreDB as db, // Use firestoreDB aliased as db
  adminInstance
} from '@/lib/firebaseAdmin';
const VALID_ZIP_CODES_COLLECTION = 'valid_zip_codes'; // Example collection
*/
console.log("(Service-Backend) Validation Service BE: Initializing...");
const validateZipCodeBE = async (zipCode, countryCode = 'IN') => {
    console.log(`(Service-Backend) validateZipCodeBE called for ZIP: ${zipCode}, Country: ${countryCode}`);
    if (countryCode === 'IN') {
        if (zipCode.startsWith('9')) {
            return {
                isValid: false,
                message: `Sorry, we currently do not service ZIP code ${zipCode}. Please try a different address.`,
            };
        }
        if (!/^\d{6}$/.test(zipCode)) {
            return {
                isValid: false,
                message: `Invalid Indian PIN code format. Should be 6 digits.`
            };
        }
    }
    return {
        isValid: true,
        message: 'ZIP code appears valid.',
    };
};
exports.validateZipCodeBE = validateZipCodeBE;
//# sourceMappingURL=validationServiceBE.js.map