import React, { useState, useEffect, ReactNode } from 'react';
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
import { AuthContext, AuthContextType } from './AuthContextDef';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUser = () => {
      const currentUser = getCurrentUser();
      setUser(currentUser);
      setIsLoading(false);
    };
    loadUser();
  }, []);

  const login = async (credentials: LoginCredentials): Promise<User | null> => {
    const loggedInUser = loginUser(credentials);
    setUser(loggedInUser);
    return loggedInUser;
  };

  const register = async (data: RegisterData): Promise<User | null> => {
    const newUser = registerUser(data);
    setUser(newUser);
    return newUser;
  };

  const logout = () => {
    logoutUser();
    setUser(null);
  };

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

  const contextValue: AuthContextType = {
    user,
    login,
    register,
    logout,
    updateProfile,
    isLoading
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};