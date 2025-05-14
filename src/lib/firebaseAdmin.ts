// src/lib/firebaseAdmin.ts

/*
import * as admin from 'firebase-admin';

// Ensure this path is correct and the service account key file is present at this location.
// It's recommended to use environment variables for service account details in production.
// const serviceAccount = require('../../path/to/your/serviceAccountKey.json'); // Adjust path as needed

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      // credential: admin.credential.cert(serviceAccount),
      // For environments like Cloud Functions, you might not need to manually provide credentials
      // if the function runs with an identity that has appropriate permissions.
      // If process.env.FIREBASE_CONFIG and process.env.GOOGLE_APPLICATION_CREDENTIALS are set (e.g. in Cloud Functions),
      // initializeApp() can be called without arguments.
    });
    console.log('Firebase Admin SDK initialized successfully.');
  } catch (error) {
    console.error('Firebase Admin SDK initialization error:', error);
    // process.exit(1); // Optionally exit if initialization fails critical startup
  }
} else {
  // console.log('Firebase Admin SDK already initialized.');
}

export const db = admin.firestore();
export const auth = admin.auth();
export const storage = admin.storage(); // If using Firebase Storage for uploads
export const adminInstance = admin; // Export the admin instance itself if needed
*/

// Mock implementations for environments where Admin SDK isn't fully set up or for testing
console.warn(
  'Firebase Admin SDK not truly initialized. Using MOCK Firestore/Auth/Storage instances. '
+ 'Uncomment actual initialization in firebaseAdmin.ts for production/real backend.'
);

// Mock Firestore
const mockFirestore = {
  collection: (collectionPath: string) => ({
    doc: (docPath?: string) => ({
      get: async () => {
        console.log(`MOCK Firestore: GET ${collectionPath}/${docPath || '(autoId)'}`);
        return { exists: false, data: () => null, id: docPath || 'mockDocId' };
      },
      set: async (data: any, options?: any) => {
        console.log(`MOCK Firestore: SET ${collectionPath}/${docPath || '(autoId)'} with options ${options ? JSON.stringify(options) : ''}:`, data);
        return Promise.resolve();
      },
      update: async (data: any) => {
        console.log(`MOCK Firestore: UPDATE ${collectionPath}/${docPath || '(autoId)'}:`, data);
        return Promise.resolve();
      },
      delete: async () => {
        console.log(`MOCK Firestore: DELETE ${collectionPath}/${docPath || '(autoId)'}`);
        return Promise.resolve();
      },
      add: async (data: any) => {
        const autoId = `mock_auto_${Date.now()}`;
        console.log(`MOCK Firestore: ADD to ${collectionPath} (generated ID: ${autoId}):`, data);
        return Promise.resolve({ id: autoId, path: `${collectionPath}/${autoId}` });
      },
      // Add other chained methods like where, orderBy, limit, onSnapshot as needed for mock
      where: function(fieldPath: string, opStr: string, value: any) { console.log(`MOCK Firestore Query: WHERE ${fieldPath} ${opStr} ${value}`); return this; },
      orderBy: function(fieldPath: string, directionStr?: string) { console.log(`MOCK Firestore Query: ORDER BY ${fieldPath} ${directionStr || 'asc'}`); return this; },
      limit: function(limit: number) { console.log(`MOCK Firestore Query: LIMIT ${limit}`); return this; },
    }),
    // Add other collection-level methods like where, orderBy, limit, onSnapshot as needed for mock
    where: function(fieldPath: string, opStr: string, value: any) { console.log(`MOCK Firestore Query: WHERE ${fieldPath} ${opStr} ${value}`); return this; },
    orderBy: function(fieldPath: string, directionStr?: string) { console.log(`MOCK Firestore Query: ORDER BY ${fieldPath} ${directionStr || 'asc'}`); return this; },
    limit: function(limit: number) { console.log(`MOCK Firestore Query: LIMIT ${limit}`); return this; },
    // A mock for FieldValue.serverTimestamp()
    FieldValue: { serverTimestamp: () => new Date() /* Mock server timestamp */ },
  }),
  FieldValue: { serverTimestamp: () => new Date() /* Mock server timestamp */ },
  // Add other Firestore top-level methods like batch, runTransaction if needed for mock
};

// Mock Auth
const mockAuth = {
  getUser: async (uid: string) => {
    console.log(`MOCK Auth: GetUser for UID: ${uid}`);
    return { uid, email: 'mock@example.com', disabled: false, emailVerified: true };
  },
  createUser: async (properties: any) => {
    console.log('MOCK Auth: CreateUser with properties:', properties);
    return { uid: `mock_auth_${Date.now()}`, ...properties };
  },
  updateUser: async (uid: string, properties: any) => {
    console.log(`MOCK Auth: UpdateUser for UID ${uid} with properties:`, properties);
    return { uid, ...properties };
  },
  deleteUser: async (uid: string) => {
    console.log(`MOCK Auth: DeleteUser for UID: ${uid}`);
    return Promise.resolve();
  },
  // Add other auth methods like verifyIdToken, createCustomToken as needed for mock
};

// Mock Storage
const mockStorage = {
  bucket: (bucketName?: string) => ({
    file: (filePath: string) => ({
      // Add mock file methods like getSignedUrl, delete, save as needed for mock
      getSignedUrl: async (config: any) => {
        console.log(`MOCK Storage: GetSignedUrl for file: ${filePath} with config:`, config);
        return [`https://mockstorage.example.com/${filePath}?signed=true`];
      },
      delete: async () => {
        console.log(`MOCK Storage: Delete file: ${filePath}`);
        return Promise.resolve();
      }
    }),
  }),
};

export const db = mockFirestore as any; // Cast to any to satisfy Admin SDK types if using strict typing elsewhere
export const auth = mockAuth as any;
export const storage = mockStorage as any;
export const adminInstance = { // Mocking adminInstance for FieldValue if needed
  firestore: {
    FieldValue: { serverTimestamp: () => new Date() },
    Timestamp: { now: () => new Date(), fromDate: (date: Date) => date }
  }
} as any;
