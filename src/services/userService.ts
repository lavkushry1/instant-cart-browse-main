import { toast } from "react-hot-toast";

// Types
export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  createdAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

export interface Address {
  id: string;
  name: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault: boolean;
}

// Local storage keys
const USER_KEY = 'instant-cart-user';
const USERS_DB_KEY = 'instant-cart-users';

/**
 * Register a new user
 * @param userData - User registration data
 * @returns User object if successful, null if failed
 */
export const registerUser = (userData: RegisterData): User | null => {
  try {
    // Check if user already exists
    const existingUsers = JSON.parse(localStorage.getItem(USERS_DB_KEY) || '[]');
    const userExists = existingUsers.some((user: User) => user.email === userData.email);
    
    if (userExists) {
      toast.error('A user with this email already exists');
      return null;
    }
    
    // Create new user
    const newUser: User = {
      id: crypto.randomUUID(),
      email: userData.email,
      name: userData.name,
      phone: userData.phone,
      createdAt: new Date().toISOString()
    };
    
    // Store in users database (localStorage)
    const updatedUsers = [...existingUsers, 
      {
        ...newUser,
        password: userData.password // In a real app, password would be hashed
      }
    ];
    localStorage.setItem(USERS_DB_KEY, JSON.stringify(updatedUsers));
    
    // Set as current user (without password)
    localStorage.setItem(USER_KEY, JSON.stringify(newUser));
    
    toast.success('Registration successful!');
    return newUser;
  } catch (error) {
    console.error('Registration error:', error);
    toast.error('Failed to register. Please try again.');
    return null;
  }
};

/**
 * Log in a user
 * @param credentials - Login credentials
 * @returns User object if successful, null if failed
 */
export const loginUser = (credentials: LoginCredentials): User | null => {
  try {
    const { email, password } = credentials;
    const users = JSON.parse(localStorage.getItem(USERS_DB_KEY) || '[]');
    
    // Find matching user
    const user = users.find((u: any) => 
      u.email === email && u.password === password
    );
    
    if (!user) {
      toast.error('Invalid email or password');
      return null;
    }
    
    // Store user in local storage (without password)
    const { password: _, ...userWithoutPassword } = user;
    localStorage.setItem(USER_KEY, JSON.stringify(userWithoutPassword));
    
    toast.success('Login successful!');
    return userWithoutPassword;
  } catch (error) {
    console.error('Login error:', error);
    toast.error('Failed to log in. Please try again.');
    return null;
  }
};

/**
 * Log out the current user
 */
export const logoutUser = (): void => {
  localStorage.removeItem(USER_KEY);
  toast.success('You have been logged out');
};

/**
 * Get the current logged-in user
 * @returns User object if logged in, null if not
 */
export const getCurrentUser = (): User | null => {
  try {
    const userJson = localStorage.getItem(USER_KEY);
    return userJson ? JSON.parse(userJson) : null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

/**
 * Update user profile
 * @param userId - User ID
 * @param updatedData - Updated user data
 * @returns Updated user object if successful, null if failed
 */
export const updateUserProfile = (
  userId: string, 
  updatedData: Partial<Omit<User, 'id' | 'email' | 'createdAt'>>
): User | null => {
  try {
    // Get users database
    const users = JSON.parse(localStorage.getItem(USERS_DB_KEY) || '[]');
    
    // Find user index
    const userIndex = users.findIndex((u: User) => u.id === userId);
    
    if (userIndex === -1) {
      toast.error('User not found');
      return null;
    }
    
    // Update user data
    const updatedUser = {
      ...users[userIndex],
      ...updatedData
    };
    
    // Save back to database
    users[userIndex] = updatedUser;
    localStorage.setItem(USERS_DB_KEY, JSON.stringify(users));
    
    // Update current user if it's the same user
    const currentUser = getCurrentUser();
    if (currentUser && currentUser.id === userId) {
      const { password: _, ...userWithoutPassword } = updatedUser;
      localStorage.setItem(USER_KEY, JSON.stringify(userWithoutPassword));
    }
    
    toast.success('Profile updated successfully');
    return updatedUser;
  } catch (error) {
    console.error('Error updating profile:', error);
    toast.error('Failed to update profile. Please try again.');
    return null;
  }
};

/**
 * Update user password
 * @param userId - User ID
 * @param currentPassword - Current password for verification
 * @param newPassword - New password to set
 * @returns Boolean indicating success
 */
export const updateUserPassword = (
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    try {
      // Get users database
      const users = JSON.parse(localStorage.getItem(USERS_DB_KEY) || '[]');
      
      // Find user
      const userIndex = users.findIndex((u: any) => u.id === userId);
      
      if (userIndex === -1) {
        toast.error('User not found');
        reject(new Error('User not found'));
        return;
      }
      
      // Verify current password
      if (users[userIndex].password !== currentPassword) {
        toast.error('Current password is incorrect');
        reject(new Error('Current password is incorrect'));
        return;
      }
      
      // Update password
      users[userIndex].password = newPassword;
      
      // Save back to database
      localStorage.setItem(USERS_DB_KEY, JSON.stringify(users));
      
      resolve(true);
    } catch (error) {
      console.error('Error updating password:', error);
      reject(error);
    }
  });
};

/**
 * Add a new address to user's address book
 * @param userId - User ID
 * @param addressData - Address data
 * @returns The added address with ID if successful, null if failed
 */
export const addUserAddress = (
  userId: string, 
  addressData: Omit<Address, 'id'>
): Promise<Address | null> => {
  return new Promise((resolve, reject) => {
    try {
      // Create new address with ID
      const newAddress: Address = {
        ...addressData,
        id: crypto.randomUUID(),
      };
      
      // Get existing addresses
      const addressesKey = `user-addresses-${userId}`;
      const existingAddresses = JSON.parse(localStorage.getItem(addressesKey) || '[]');
      
      // If this is the first address or marked as default, ensure it's set as default
      if (existingAddresses.length === 0 || newAddress.isDefault) {
        newAddress.isDefault = true;
        
        // If setting as default, update all other addresses
        const updatedAddresses = existingAddresses.map((addr: Address) => ({
          ...addr,
          isDefault: false
        }));
        
        // Save all addresses with new one
        localStorage.setItem(addressesKey, JSON.stringify([...updatedAddresses, newAddress]));
      } else {
        // Add to existing addresses
        localStorage.setItem(addressesKey, JSON.stringify([...existingAddresses, newAddress]));
      }
      
      resolve(newAddress);
    } catch (error) {
      console.error('Error adding address:', error);
      reject(error);
    }
  });
};

/**
 * Delete an address from user's address book
 * @param userId - User ID
 * @param addressId - Address ID to delete
 * @returns Boolean indicating success
 */
export const deleteUserAddress = (
  userId: string,
  addressId: string
): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    try {
      // Get existing addresses
      const addressesKey = `user-addresses-${userId}`;
      const addresses = JSON.parse(localStorage.getItem(addressesKey) || '[]');
      
      // Find address
      const addressIndex = addresses.findIndex((a: Address) => a.id === addressId);
      
      if (addressIndex === -1) {
        reject(new Error('Address not found'));
        return;
      }
      
      // Check if this is the default address
      const isDefault = addresses[addressIndex].isDefault;
      
      // Remove the address
      const updatedAddresses = addresses.filter((a: Address) => a.id !== addressId);
      
      // If we removed the default address and there are other addresses, set a new default
      if (isDefault && updatedAddresses.length > 0) {
        updatedAddresses[0].isDefault = true;
      }
      
      // Save updated addresses
      localStorage.setItem(addressesKey, JSON.stringify(updatedAddresses));
      
      resolve(true);
    } catch (error) {
      console.error('Error deleting address:', error);
      reject(error);
    }
  });
};

/**
 * Get user order history
 * @param userId - User ID
 * @returns Array of orders for the user
 */
export const getUserOrders = (userId: string): any[] => {
  try {
    // In a real app, this would fetch from a backend API
    // For demo, we'll just read from localStorage
    const ordersJson = localStorage.getItem('userOrders') || '{}';
    const allOrders = JSON.parse(ordersJson);
    
    return allOrders[userId] || [];
  } catch (error) {
    console.error('Error fetching user orders:', error);
    return [];
  }
}; 