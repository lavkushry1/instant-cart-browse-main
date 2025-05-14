// functions/src/index.ts

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
import * as validationFunctions from './api/validation.functions'; // Added

export const offers = { ...offersFunctions };
export const products = { ...productsFunctions };
export const categories = { ...categoriesFunctions };
export const orders = { ...ordersFunctions };
export const users = { ...usersFunctions }; 
export const reviews = { ...reviewsFunctions };
export const admin = { ...adminSettingsFunctions }; 
export const cart = { ...cartFunctions };
export const validation = { ...validationFunctions }; // Added for export

console.log("Firebase Functions index.ts: All function groups configured for export.");

// Auth Triggers from users.functions.ts are exported directly if needed by Firebase deploy
// e.g. export const onUserCreateAuth = usersFunctions.onUserCreateAuthTriggerCF;
// However, Firebase CLI usually discovers them if they are top-level exports from the main index or grouped.
// For grouped exports like `export const users = { ...usersFunctions }`, ensure your Firebase CLI deployment
// correctly interprets these as triggers. Often, triggers are exported at the top level of index.ts:
// export const onUserCreateAuthTrigger = usersFunctions.onUserCreateAuthTriggerCF;
// export const onUserDeleteAuthTrigger = usersFunctions.onUserDeleteAuthTriggerCF;
