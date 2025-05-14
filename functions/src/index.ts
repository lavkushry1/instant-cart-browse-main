// functions/src/index.ts

/**
 * Main entry point for Firebase Cloud Functions.
 */

// Ensure Firebase Admin SDK is initialized. The import itself handles this if structured correctly.
// The path `../../src/lib/firebaseAdmin` assumes that `functions/src` is one level down from `src/lib`.
// If your `firebaseAdmin.ts` is inside `src/functions/lib` then path would be `./lib/firebaseAdmin`
// For this project, `firebaseAdmin.ts` is in `src/lib` and functions are in `functions/src`
// This relative path might be an issue depending on how Firebase deploys or if `src` is not a parent of `functions`.
// Typically, `firebaseAdmin.ts` would be part of the functions source, e.g., `functions/src/lib/firebaseAdmin.ts`
// or the functions rely on Admin SDK auto-initialization in the Cloud Functions environment.

// Assuming firebaseAdmin.ts is correctly placed for Cloud Functions context or auto-init is used.
// If `firebaseAdmin.ts` is in `../../src/lib/firebaseAdmin`, it implies a monorepo structure where `functions` is a package.
// Let's assume for now that admin initialization is handled within the cloud environment or a shared lib accessible to functions.

console.log("Firebase Functions index.ts: Initializing and exporting function groups...");

// Import and re-export function groups
import * as offersFunctions from './api/offers.functions';
import * as productsFunctions from './api/products.functions';
import * as categoriesFunctions from './api/categories.functions';
import * as ordersFunctions from './api/orders.functions';
import * as usersFunctions from './api/users.functions';
import * as reviewsFunctions from './api/reviews.functions';
import * as adminSettingsFunctions from './api/admin.functions';
import * as cartFunctions from './api/cart.functions';

export const offers = { ...offersFunctions };
export const products = { ...productsFunctions };
export const categories = { ...categoriesFunctions };
export const orders = { ...ordersFunctions };
export const users = { ...usersFunctions }; // Contains auth triggers and callables
export const reviews = { ...reviewsFunctions };
export const admin = { ...adminSettingsFunctions }; // Renamed to avoid conflict with firebase-admin instance
export const cart = { ...cartFunctions };

console.log("Firebase Functions index.ts: All function groups configured for export.");

// If any function is an HTTP onRequest type and needs to be exported directly (not grouped):
// export const someHttpFunction = productsFunctions.someSpecificHttpFunction;

// Auth Triggers are typically exported directly if not grouped:
// export const onUserCreate = usersFunctions.onUserCreateAuthTriggerCF;
// export const onUserDelete = usersFunctions.onUserDeleteAuthTriggerCF;
// Grouping them under 'users' like above also works for deployment, 
// Firebase CLI will pick them up if they are of the correct trigger type.

// Example of directly exporting a specific trigger if preferred:
// export const firestoreUserCreateTrigger = usersFunctions.onUserCreateAuthTriggerCF;
// export const firestoreUserDeleteTrigger = usersFunctions.onUserDeleteAuthTriggerCF;
