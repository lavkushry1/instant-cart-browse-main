import { createContext } from 'react';
import { Timestamp as ClientTimestamp, DocumentSnapshot as ClientDocumentSnapshot } from 'firebase/firestore'; // Import ClientTimestamp and ClientDocumentSnapshot

// Define types directly or import from a dedicated shared types file if they grow.
export interface UserAddress {
  id: string; // Document ID from Firestore addresses subcollection
  name?: string; // Label for the address e.g., "Home", "Work"
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault?: boolean;
}

export interface User {
  id: string;
  email: string;
  displayName?: string | null; // Firebase User.displayName can be null
  firstName?: string;
  lastName?: string;
  photoURL?: string | null; // Firebase User.photoURL can be null
  phoneNumber?: string | null; // Firebase User.phoneNumber can be null
  roles: string[]; // e.g., ['customer', 'admin']
  // Optional fields that might come from Firestore profile
  addresses?: UserAddress[]; // Use the detailed UserAddress type
  preferences?: { theme?: 'light' | 'dark'; newsletterSubscribed?: boolean; }; // More specific type
  createdAt?: string | Date | ClientTimestamp | null;   // More specific type
  updatedAt?: string | Date | ClientTimestamp | null;   // More specific type
  lastLoginAt?: string | Date | ClientTimestamp | null; // More specific type
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;       // Maps to displayName
  email: string;
  password: string;
  phone?: string;      // Optional phone number
}

// Type for data passed to the updateProfile function
export interface UpdateUserProfileData extends Partial<Omit<User, 'id' | 'email' | 'createdAt' | 'updatedAt' | 'roles' | 'addresses'>> {
  // Fields that can be directly updated via updateProfile function.
  // displayName, photoURL are handled by Firebase Auth updateProfile.
  // Other fields like firstName, lastName, preferences would be updated in Firestore via CF.
  displayName?: string; 
  firstName?: string; 
  lastName?: string;
  phoneNumber?: string; 
  photoURL?: string;
  preferences?: { theme?: 'light' | 'dark'; newsletterSubscribed?: boolean; };
  // Address updates will be handled by separate functions, not directly via updateUserProfile.
}

// Client-side Order structure (adapt from orderService.ts Order interface)
// Timestamps will likely be strings or Date objects on the client after Firestore conversion.
export interface ClientOrderItem {
    productId: string; productName: string; productImage?: string; quantity: number;
    unitPrice: number; itemDiscount?: number; finalUnitPrice: number; lineItemTotal: number;
}
export type ClientOrderStatus = 
  | 'Pending' | 'Processing' | 'Shipped' | 'Delivered' 
  | 'Cancelled' | 'Refunded' | 'PaymentFailed';

export interface ClientOrder {
  id: string; userId?: string; customerEmail: string; 
  // shippingAddress: OrderAddress; // Re-use UserAddress if compatible, or define ClientOrderAddress
  // billingAddress?: OrderAddress;
  items: ClientOrderItem[]; subtotal: number; cartDiscountAmount: number; 
  shippingCost: number; taxAmount: number; grandTotal: number; 
  // appliedOffers?: Pick<Offer, 'id' | 'name' | 'type' | 'discountPercent' | 'discountAmount'>[]; 
  paymentMethod: string; paymentStatus: 'Pending' | 'Paid' | 'Failed' | 'Refunded';
  transactionId?: string; orderStatus: ClientOrderStatus; trackingNumber?: string;
  shippingCarrier?: string; notes?: string; 
  createdAt: string | Date; // Or number if storing as epoch ms
  updatedAt: string | Date;
  // Include shippingAddress and billingAddress with a compatible client-side Address type
  shippingAddress: UserAddress; // Assuming UserAddress is suitable for display
  billingAddress?: UserAddress;
}

export interface GetUserOrdersResponse {
    orders: ClientOrder[];
    lastVisible?: ClientDocumentSnapshot | null; // More specific type for client-side snapshot
    totalCount?: number;
}

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  token?: string | null;
  roles?: string[];
  isAdmin?: boolean;
  login: (credentials: LoginCredentials) => Promise<User | null>;
  register: (data: RegisterData) => Promise<User | null>;
  logout: () => Promise<void>; // Changed to Promise<void> as signOut is async
  updateProfile: (data: UpdateUserProfileData) => Promise<User | null>; // Corrected signature

  // Address Management Functions
  addAddress: (addressData: Omit<UserAddress, 'id'>) => Promise<UserAddress | null>;
  updateAddress: (addressId: string, addressData: Partial<Omit<UserAddress, 'id'>>) => Promise<UserAddress | null>;
  deleteAddress: (addressId: string) => Promise<boolean>;
  setDefaultAddress: (addressId: string) => Promise<boolean>;

  // Order History
  getUserOrders: (limit?: number, startAfter?: ClientDocumentSnapshot | null) => Promise<GetUserOrdersResponse>; // More specific type for startAfter

  // Wishlist Management
  wishlist: string[]; // Array of product IDs
  getWishlist: () => Promise<string[]>;
  addToWishlist: (productId: string) => Promise<void>;
  removeFromWishlist: (productId: string) => Promise<void>;
  isProductInWishlist: (productId: string) => boolean;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  token: null,
  roles: [],
  isAdmin: false,
  login: async () => null,
  register: async () => null,
  logout: async () => {},
  updateProfile: async () => null,
  // Default implementations for address functions
  addAddress: async () => null,
  updateAddress: async () => null,
  deleteAddress: async () => false,
  setDefaultAddress: async () => false,
  // Default for order history
  getUserOrders: async () => ({ orders: [] }),
  // Default wishlist
  wishlist: [],
  getWishlist: async () => [],
  addToWishlist: async (productId: string) => {},
  removeFromWishlist: async (productId: string) => {},
  isProductInWishlist: (productId: string) => false,
});