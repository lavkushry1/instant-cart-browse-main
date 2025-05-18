"use strict";
// functions/src/index.ts
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
exports.users = exports.analytics = exports.savedItems = exports.wishlist = exports.validation = exports.cart = exports.admin = exports.reviews = exports.orders = exports.categories = exports.products = exports.offers = void 0;
console.log("Firebase Functions index.ts: Initializing and exporting function groups...");
// Import and re-export function groups
const offersFunctions = __importStar(require("./api/offers.functions"));
const productsFunctions = __importStar(require("./api/products.functions"));
const categoriesFunctions = __importStar(require("./api/categories.functions"));
const ordersFunctions = __importStar(require("./api/orders.functions"));
const usersFunctions = __importStar(require("./api/users.functions"));
const reviewsFunctions = __importStar(require("./api/reviews.functions"));
const adminSettingsFunctions = __importStar(require("./api/admin.functions"));
const cartFunctions = __importStar(require("./api/cart.functions"));
const validationFunctions = __importStar(require("./api/validation.functions")); // Added
const wishlistFunctions = __importStar(require("./api/wishlist.functions")); // Added for wishlist
const savedItemsFunctions = __importStar(require("./api/savedItems.functions")); // Added for saved items
const analyticsFunctions = __importStar(require("./api/analytics.functions")); // Added for analytics
exports.offers = { ...offersFunctions };
exports.products = { ...productsFunctions };
exports.categories = { ...categoriesFunctions };
exports.orders = { ...ordersFunctions };
exports.reviews = { ...reviewsFunctions };
exports.admin = { ...adminSettingsFunctions };
exports.cart = { ...cartFunctions };
exports.validation = { ...validationFunctions }; // Added for export
exports.wishlist = { ...wishlistFunctions }; // Added for wishlist export
exports.savedItems = { ...savedItemsFunctions }; // Added for saved items export
exports.analytics = { ...analyticsFunctions }; // Added for analytics export
// Export all user related functions under 'users' namespace
exports.users = {
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
//# sourceMappingURL=index.js.map