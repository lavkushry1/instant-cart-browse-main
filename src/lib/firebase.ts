import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getAnalytics } from "firebase/analytics";

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
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app); // Pass app instance
export const storage = getStorage(app);
export const analytics = getAnalytics(app);

// Connect to emulators if running in development and emulators are on
// It's good practice to check for a specific env variable to enable emulators explicitly
// For example, VITE_USE_FIREBASE_EMULATORS set to "true"
// For now, we'll use import.meta.env.DEV which is true for `npm run dev`
if (import.meta.env.DEV) {
  try {
    console.log('Connecting to Firebase Emulators...');
    connectAuthEmulator(auth, 'http://localhost:9099');
    connectFirestoreEmulator(db, 'localhost', 8080);
    connectFunctionsEmulator(functions, 'localhost', 5001);
    // connectStorageEmulator(storage, 'localhost', 9199); // Uncomment if you start storage emulator
    console.log('Successfully connected to Firebase Emulators.');
  } catch (error) {
    console.error('Error connecting to Firebase emulators:', error);
  }
}

// You can also specify the region for functions if needed, e.g.
// export const functions = getFunctions(app, 'your-region');

export default app; 