// src/services/userService.ts

// This file is for CLIENT-SIDE user service logic.
// Backend logic has been moved to functions/src/services/userServiceBE.ts

// Client-side User type (example, should align with AuthContextDef.ts or similar)
// import { Timestamp as ClientTimestamp } from 'firebase/firestore';

export interface UserAddressClient {
  id?: string; // Optional if Firestore generates it and it's added after creation
  name?: string; 
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault?: boolean;
  // createdAt?: ClientTimestamp | string; // client-friendly timestamp
  // updatedAt?: ClientTimestamp | string;
  }

export type UserRoleClient = 'customer' | 'admin' | 'editor';

export interface UserProfileClient {
  id: string; 
  email: string; 
  displayName?: string; 
  firstName?: string; 
  lastName?: string;
  photoURL?: string; 
  phoneNumber?: string; 
  roles?: UserRoleClient[]; 
  addresses?: UserAddressClient[];
  // createdAt?: ClientTimestamp | string;
  // updatedAt?: ClientTimestamp | string;
  // lastLoginAt?: ClientTimestamp | string;
  preferences?: { theme?: 'light' | 'dark'; newsletterSubscribed?: boolean; };
}

// Client-side functions would call Cloud Functions (users-getUserProfile, users-updateUserProfileCF etc.)
// These are usually handled by an AuthProvider or similar context that uses firebase functions.httpsCallable

console.log('(Service-Client) User Service: Initialized. Backend logic is in BE service.');