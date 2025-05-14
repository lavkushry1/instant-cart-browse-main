import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { 
  User, 
  LoginCredentials, 
  RegisterData, 
  loginUser, 
  registerUser, 
  logoutUser, 
  getCurrentUser,
  updateUserProfile
} from '@/services/userService';

interface AuthContextType {
  user: User | null;
  login: (credentials: LoginCredentials) => Promise<User | null>;
  register: (data: RegisterData) => Promise<User | null>;
  logout: () => void;
  updateProfile: (userId: string, data: Partial<User>) => Promise<User | null>;
  isLoading: boolean;
}

// Create context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  login: async () => null,
  register: async () => null,
  logout: () => {},
  updateProfile: async () => null,
  isLoading: true
});

// Provider component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing user on mount
  useEffect(() => {
    const loadUser = () => {
      const currentUser = getCurrentUser();
      setUser(currentUser);
      setIsLoading(false);
    };

    loadUser();
  }, []);

  // Login function
  const login = async (credentials: LoginCredentials): Promise<User | null> => {
    const loggedInUser = loginUser(credentials);
    setUser(loggedInUser);
    return loggedInUser;
  };

  // Register function
  const register = async (data: RegisterData): Promise<User | null> => {
    const newUser = registerUser(data);
    setUser(newUser);
    return newUser;
  };

  // Logout function
  const logout = () => {
    logoutUser();
    setUser(null);
  };

  // Update profile
  const updateProfile = async (
    userId: string, 
    data: Partial<Omit<User, 'id' | 'email' | 'createdAt'>>
  ): Promise<User | null> => {
    const updatedUser = updateUserProfile(userId, data);
    if (updatedUser && user && user.id === userId) {
      setUser(updatedUser);
    }
    return updatedUser;
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        login, 
        register, 
        logout, 
        updateProfile, 
        isLoading 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Hook for using the auth context
export const useAuth = () => useContext(AuthContext); 