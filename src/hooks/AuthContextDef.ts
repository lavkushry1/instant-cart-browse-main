import { createContext } from 'react';
import { User, LoginCredentials, RegisterData } from '@/services/userService';

export interface AuthContextType {
  user: User | null;
  login: (credentials: LoginCredentials) => Promise<User | null>;
  register: (data: RegisterData) => Promise<User | null>;
  logout: () => void;
  updateProfile: (userId: string, data: Partial<User>) => Promise<User | null>;
  isLoading: boolean;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  login: async () => null,
  register: async () => null,
  logout: () => {},
  updateProfile: async () => null,
  isLoading: true
});