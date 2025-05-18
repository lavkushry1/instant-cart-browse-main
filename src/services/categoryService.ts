// src/services/categoryService.ts

// This file is for CLIENT-SIDE category service logic.
// Backend logic has been moved to functions/src/services/categoryServiceBE.ts

// Example: If you need a client-side type (adjust as per actual client needs)
// import { Timestamp as ClientTimestamp } from 'firebase/firestore';

export interface CategoryClient {
  id: string; 
  name: string;
  slug: string; 
  description?: string;
  imageUrl?: string;
  parentId?: string | null; 
  productCount?: number; 
  isEnabled: boolean;
  // createdAt?: ClientTimestamp; // Or string/number representation
  // updatedAt?: ClientTimestamp; // Or string/number representation
}

// Client-side functions for categories would typically call Cloud Functions.
// For example:
// import { functionsClient } from '../lib/firebaseClient';
// import { httpsCallable } from 'firebase/functions';

// export const getAllCategoriesClient = async () => {
//   if (!functionsClient) throw new Error('Firebase functions not initialized');
//   const getAllCategoriesCF = httpsCallable(functionsClient, 'categories-getAllCategoriesCF');
//   try {
//     const result = await getAllCategoriesCF();
//     return result.data as { success: boolean; categories?: CategoryClient[] }; // Adjust return type
//   } catch (error) {
//     console.error("Error calling getAllCategoriesCF:", error);
//     throw error;
//   }
// };

console.log('(Service-Client) Category Service: Initialized. Backend logic is in BE service.');