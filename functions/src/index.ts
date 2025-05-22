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
import * as wishlistFunctions from './api/wishlist.functions'; // Added for wishlist
import * as savedItemsFunctions from './api/savedItems.functions'; // Added for saved items
import * as analyticsFunctions from './api/analytics.functions'; // Added for analytics

export const offers = { ...offersFunctions };
export const products = { ...productsFunctions };
export const categories = { ...categoriesFunctions };
export const orders = { ...ordersFunctions };
export const reviews = { ...reviewsFunctions };
export const admin = { ...adminSettingsFunctions }; 
export const cart = { ...cartFunctions };
export const validation = { ...validationFunctions }; // Added for export
export const wishlist = { ...wishlistFunctions }; // Added for wishlist export
export const savedItems = { ...savedItemsFunctions }; // Added for saved items export
export const analytics = { ...analyticsFunctions }; // Added for analytics export

// Export all user related functions under 'users' namespace
export const users = {
    onUserCreateAuthTrigger: usersFunctions.onUserCreateAuthTriggerCF,
    onUserDeleteAuthTrigger: usersFunctions.onUserDeleteAuthTriggerCF,
    getUserProfile: usersFunctions.getUserProfileCF,
    getAllUserProfiles: usersFunctions.getAllUserProfilesCF,
    updateUserProfile: usersFunctions.updateUserProfileCF,
    updateUserRoles: usersFunctions.updateUserRolesCF,
    // New Address Management Functions
    addUserAddress: usersFunctions.addUserAddressCF,
    updateUserAddress: usersFunctions.updateUserAddressCF,
    deleteUserAddress: usersFunctions.deleteUserAddressCF,
    setDefaultUserAddress: usersFunctions.setDefaultUserAddressCF,
};

console.log("Firebase Functions index.ts: All function groups configured for export.");

// Auth Triggers from users.functions.ts are exported directly if needed by Firebase deploy
// e.g. export const onUserCreateAuth = usersFunctions.onUserCreateAuthTriggerCF;
// However, Firebase CLI usually discovers them if they are top-level exports from the main index or grouped.
// For grouped exports like `export const users = { ...usersFunctions }`, ensure your Firebase CLI deployment
// correctly interprets these as triggers. Often, triggers are exported at the top level of index.ts:
// export const onUserCreateAuthTrigger = usersFunctions.onUserCreateAuthTriggerCF;
// export const onUserDeleteAuthTrigger = usersFunctions.onUserDeleteAuthTriggerCF;
