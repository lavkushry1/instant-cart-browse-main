// src/lib/firebaseAdmin.ts

import * as admin from 'firebase-admin';

// IMPORTANT: 
// 1. Ensure you have your Firebase project's service account key JSON file.
// 2. Replace '../../path/to/your/serviceAccountKey.json' with the correct path to this file.
// 3. For security, it's best to use environment variables for service account details in production,
//    or rely on the Cloud Functions environment to provide credentials automatically.

// Option 1: Using a service account key file (typical for local dev or non-Cloud Function environments)
/*
if (!admin.apps.length) {
  try {
    // const serviceAccount = require('../../path/to/your/serviceAccountKey.json'); // <--- ADJUST THIS PATH
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      // databaseURL: 'https://<YOUR_PROJECT_ID>.firebaseio.com' // If using Realtime Database
    });
    console.log('Firebase Admin SDK initialized successfully using service account key.');
  } catch (error) {
    console.error('Firebase Admin SDK initialization error (service account key):', error);
  }
}
*/

// Option 2: Relying on GOOGLE_APPLICATION_CREDENTIALS or default credentials in Firebase/Google Cloud environment
if (!admin.apps.length) {
  try {
    admin.initializeApp(); // Initializes with default credentials if available (e.g., in Cloud Functions)
    console.log('Firebase Admin SDK initialized successfully (default credentials).');
  } catch (error) {
    console.error('Firebase Admin SDK initialization error (default credentials):', error);
    // Fallback or alternative initialization if needed for local dev without GOOGLE_APPLICATION_CREDENTIALS
    // For example, you might try initializing with a service account key here if default fails and it's a dev environment.
    // Consider: process.exit(1); if initialization is critical and fails.
  }
} else {
  // console.log('Firebase Admin SDK already initialized.');
}

export const db = admin.firestore();
export const auth = admin.auth();
export const storage = admin.storage(); // If using Firebase Storage for uploads
export const adminInstance = admin; // Export the admin instance itself for FieldValue, Timestamp etc.

console.log("Firebase Admin services (db, auth, storage, adminInstance) are now configured.");
