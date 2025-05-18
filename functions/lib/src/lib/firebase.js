"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analytics = exports.storage = exports.functions = exports.db = exports.auth = void 0;
const app_1 = require("firebase/app");
const auth_1 = require("firebase/auth");
const firestore_1 = require("firebase/firestore");
const functions_1 = require("firebase/functions");
const storage_1 = require("firebase/storage");
const analytics_1 = require("firebase/analytics");
// Your web app's Firebase configuration (using environment variables)
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};
// Initialize Firebase
const app = (0, app_1.initializeApp)(firebaseConfig);
// Initialize Firebase services
exports.auth = (0, auth_1.getAuth)(app);
exports.db = (0, firestore_1.getFirestore)(app);
exports.functions = (0, functions_1.getFunctions)(app); // Pass app instance
exports.storage = (0, storage_1.getStorage)(app);
exports.analytics = (0, analytics_1.getAnalytics)(app);
// You can also specify the region for functions if needed, e.g.
// export const functions = getFunctions(app, 'your-region');
exports.default = app;
//# sourceMappingURL=firebase.js.map