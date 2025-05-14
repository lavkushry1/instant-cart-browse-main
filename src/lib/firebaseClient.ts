// src/lib/firebaseClient.ts

import { initializeApp, getApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getFunctions, Functions } from 'firebase/functions';
import { getStorage, FirebaseStorage } from 'firebase/storage';

// Your web app's Firebase configuration
// IMPORTANT: Replace with your actual Firebase project configuration.
// These should ideally be stored in environment variables (e.g., .env.local)
// and prefixed with NEXT_PUBLIC_ (if using Next.js) or REACT_APP_ (if using Create React App).
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "YOUR_API_KEY_HERE",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "your-project-id.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "your-project-id",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "your-project-id.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "YOUR_MESSAGING_SENDER_ID",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "YOUR_APP_ID",
  // measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID // Optional: for Google Analytics
};

let firebaseApp: FirebaseApp;
let authClient: Auth;
let firestoreClient: Firestore;
let functionsClient: Functions;
let storageClient: FirebaseStorage;

if (typeof window !== 'undefined' && !getApps().length) {
  try {
    firebaseApp = initializeApp(firebaseConfig);
    authClient = getAuth(firebaseApp);
    firestoreClient = getFirestore(firebaseApp);
    // Optionally, specify the region for functions if not us-central1
    // functionsClient = getFunctions(firebaseApp, 'your-region'); 
    functionsClient = getFunctions(firebaseApp);
    storageClient = getStorage(firebaseApp);
    console.log("Firebase Client SDK initialized successfully.");
  } catch (error) {
    console.error("Firebase Client SDK Initialization Error:", error);
    // Handle initialization error (e.g., show a message to the user or use fallback mocks)
    // For now, we'll let it proceed, and components using these might fail or use mocks if they check for initialization.
    // Assigning mock objects here if init fails, to prevent app crashes if components expect these exports.
    firebaseApp = {} as FirebaseApp; // Avoid undefined errors
    authClient = {} as Auth;
    firestoreClient = {} as Firestore;
    functionsClient = {} as Functions;
    storageClient = {} as FirebaseStorage;
    console.warn("Firebase Client SDK failed to initialize. Subsequent Firebase calls may fail or use mocks.");
  }
} else if (typeof window !== 'undefined') {
  firebaseApp = getApp();
  authClient = getAuth(firebaseApp);
  firestoreClient = getFirestore(firebaseApp);
  functionsClient = getFunctions(firebaseApp);
  storageClient = getStorage(firebaseApp);
} else {
  // Handle server-side rendering or non-browser environments if necessary
  // For this project, client-side Firebase is primary.
  // If this file is somehow imported server-side where `window` is undefined AND no app is initialized,
  // these will be undefined, which should be handled by the importing modules.
  console.warn("Firebase Client SDK: Non-browser environment or no Firebase app initialized server-side.");
  firebaseApp = {} as FirebaseApp; 
  authClient = {} as Auth;
  firestoreClient = {} as Firestore;
  functionsClient = {} as Functions;
  storageClient = {} as FirebaseStorage;
}

export { firebaseApp, authClient, firestoreClient, functionsClient, storageClient };
