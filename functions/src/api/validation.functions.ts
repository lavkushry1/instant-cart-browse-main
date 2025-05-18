// functions/src/api/validation.functions.ts

import * as functions from 'firebase-functions/v1';
import {
  validateZipCodeBE,
  ZipCodeValidationResultBE as ZipCodeValidationResult
} from '../services/validationServiceBE'; // Corrected path

// Optional: Helper to check for authenticated user if certain validations are user-specific
// const ensureAuthenticated = (context: functions.https.CallableContext) => { ... };

console.log("(Cloud Functions) validation.functions.ts: Initializing with LIVE logic...");

interface ValidateZipCodeData {
    zipCode: string;
    countryCode?: string;
}

/**
 * Validates a ZIP code.
 * (Callable Function)
 */
export const validateZipCodeCF = functions.https.onCall(async (data: ValidateZipCodeData, context) => {
  console.log("(Cloud Function) validateZipCodeCF called with data:", data);
  
  // Optional: Check if user is authenticated if validation depends on user context
  // ensureAuthenticated(context);

  try {
    if (!data || !data.zipCode) {
      throw new functions.https.HttpsError('invalid-argument', 'ZIP code is required.');
    }

    const result: ZipCodeValidationResult = await validateZipCodeBE(data.zipCode, data.countryCode);
    
    return { success: true, validationResult: result };

  } catch (error: unknown) {
    console.error("Error in validateZipCodeCF:", error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    const message = error instanceof Error ? error.message : 'Failed to validate ZIP code due to an internal error.';
    // Log the error details for admin review
    functions.logger.error("Internal error in validateZipCodeCF:", { data, error: message });
    throw new functions.https.HttpsError(
      'internal',
      message
    );
  }
});
