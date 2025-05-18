// src/services/validationService.ts

// This file is for CLIENT-SIDE validation service logic (if any).
// Backend validation logic has been moved to functions/src/services/validationServiceBE.ts

// Client-side functions would call Cloud Functions (e.g., validation-validateZipCodeCF)

export interface ZipCodeValidationResultClient {
  isValid: boolean;
  message?: string;
  correctedZip?: string;
  citySuggestion?: string;
  stateSuggestion?: string;
}

console.log('(Service-Client) Validation Service: Initialized. Backend logic is in BE service.');
