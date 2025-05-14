import { createContext } from 'react';
import { Theme, ThemeSettings } from '@/types/theme';

export interface ThemeContextType {
  theme: Theme | null;
  isLoading: boolean;
  applyTheme: (theme: Theme) => void;
  updateThemeSettings: (settings: Partial<ThemeSettings>) => void;
}

export const ThemeContext = createContext<ThemeContextType>({
  theme: null,
  isLoading: true,
  applyTheme: () => {},
  updateThemeSettings: () => {},
});