"use strict";
// src/services/validationService.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateZipCodeBE = void 0;
// This service would contain backend logic for various validations.
// For now, it will focus on ZIP code validation.
// Import Firebase Admin resources if needed for more complex validation (e.g., against a DB of valid ZIPs)
/*
import {
  db,
  adminInstance
} from '../../lib/firebaseAdmin';
const VALID_ZIP_CODES_COLLECTION = 'valid_zip_codes'; // Example collection
*/
console.log("(Service-Backend) Validation Service: Initializing...");
/**
 * Validates a ZIP code against backend logic/database.
 * For this demo, it implements the rule: ZIP codes starting with '9' are invalid.
 * A real implementation might check against a DB of serviceable ZIP codes, city/state consistency, etc.
 * @param {string} zipCode - The ZIP code to validate.
 * @param {string} [countryCode='IN'] - Optional country code for country-specific validation.
 * @returns {Promise<ZipCodeValidationResult>} Validation result.
 */
const validateZipCodeBE = async (zipCode, countryCode = 'IN') => {
    console.log(`(Service-Backend) validateZipCodeBE called for ZIP: ${zipCode}, Country: ${countryCode}`);
    // Simple demo validation: ZIPs starting with '9' are invalid for IN (as per original requirement snippet)
    // This would be much more complex in a real system, possibly checking against a database.
    if (countryCode === 'IN') { // Example country-specific logic
        if (zipCode.startsWith('9')) {
            return {
                isValid: false,
                message: `Sorry, we currently do not service ZIP code ${zipCode}. Please try a different address.`,
            };
        }
        // Add more checks for format, length specific to India if needed
        if (!/^\d{6}$/.test(zipCode)) {
            return {
                isValid: false,
                message: `Invalid Indian PIN code format. Should be 6 digits.`
            };
        }
    }
    // Add other country validations here or general validations
    // If no invalid conditions met, assume valid for this demo
    return {
        isValid: true,
        message: 'ZIP code appears valid.',
    };
};
exports.validateZipCodeBE = validateZipCodeBE;
//# sourceMappingURL=validationService.js.map