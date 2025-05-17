import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK if not already initialized
// This is idempotent, so it's safe to call multiple times across different function files
// if they all import this module.
if (admin.apps.length === 0) {
  admin.initializeApp();
}

export const firestoreDB = admin.firestore();
export const authAdmin = admin.auth();
export const storageAdmin = admin.storage(); // For admin operations on storage if needed

// You can also export admin.firestore.Timestamp if needed frequently elsewhere
export const Timestamp = admin.firestore.Timestamp;

export const adminInstance = admin; // Export the whole admin namespace if needed

console.log('(Firebase Admin) SDK Initialized in firebaseAdmin.ts'); 