import { db as firestoreClient } from './firebase';
import { functions as functionsClient } from './firebase';
import { auth as authClient } from './firebase';
import { storage as storageClient } from './firebase';
import app from './firebase'; // app is the default export from firebase.ts

// Export them with the names that other files expect, and app as firebaseApp
export {
  app as firebaseApp,
  authClient,
  firestoreClient,
  functionsClient,
  storageClient
}; 