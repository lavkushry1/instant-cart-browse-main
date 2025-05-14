import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Theme, ThemeSettings } from '@/types/theme';
import { getActiveTheme } from '@/services/themeService';

interface ThemeContextType {
  theme: Theme | null;
  isLoading: boolean;
  applyTheme: (theme: Theme) => void;
  updateThemeSettings: (settings: Partial<ThemeSettings>) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: null,
  isLoading: true,
  applyTheme: () => {},
  updateThemeSettings: () => {},
});

export const useTheme = () => useContext(ThemeContext);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setTheme] = useState<Theme | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const activeTheme = await getActiveTheme();
        setTheme(activeTheme);
      } catch (error) {
        console.error('Failed to load theme:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTheme();
  }, []);

  useEffect(() => {
    if (!theme) return;

    // Apply theme settings to the document
    applyThemeToDocument(theme);

  }, [theme]);

  const applyTheme = (newTheme: Theme) => {
    setTheme(newTheme);
  };

  const updateThemeSettings = (settings: Partial<ThemeSettings>) => {
    if (!theme) return;
    
    setTheme({
      ...theme,
      settings: {
        ...theme.settings,
        ...settings
      }
    });
  };

  // Apply theme settings to document
  const applyThemeToDocument = (theme: Theme) => {
    const { settings } = theme;
    const root = document.documentElement;
    
    // Apply colors
    root.style.setProperty('--primary', settings.primaryColor);
    root.style.setProperty('--secondary', settings.secondaryColor);
    root.style.setProperty('--accent', settings.accentColor);
    root.style.setProperty('--background', settings.backgroundColor);
    root.style.setProperty('--text', settings.textColor);
    root.style.setProperty('--link', settings.linkColor);
    root.style.setProperty('--button', settings.buttonColor);
    root.style.setProperty('--button-text', settings.buttonTextColor);
    root.style.setProperty('--header-bg', settings.headerBackgroundColor);
    root.style.setProperty('--footer-bg', settings.footerBackgroundColor);
    
    // Apply typography
    root.style.setProperty('--heading-font', settings.headingFont);
    root.style.setProperty('--body-font', settings.bodyFont);
    root.style.setProperty('--font-size-base', settings.fontSize.base);
    root.style.setProperty('--font-size-h1', settings.fontSize.h1);
    root.style.setProperty('--font-size-h2', settings.fontSize.h2);
    root.style.setProperty('--font-size-h3', settings.fontSize.h3);
    root.style.setProperty('--font-size-h4', settings.fontSize.h4);
    root.style.setProperty('--font-size-h5', settings.fontSize.h5);
    root.style.setProperty('--font-size-small', settings.fontSize.small);
    
    // Apply layout settings
    root.style.setProperty('--container-width', settings.containerWidth);
    root.style.setProperty('--border-radius', settings.borderRadius);
    root.style.setProperty('--card-shadow', settings.cardShadow);
    root.style.setProperty('--mobile-breakpoint', settings.mobileBreakpoint);
    
    // Apply custom CSS
    let styleEl = document.getElementById('theme-custom-css');
    
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'theme-custom-css';
      document.head.appendChild(styleEl);
    }
    
    styleEl.textContent = settings.customCSS || '';
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isLoading,
        applyTheme,
        updateThemeSettings,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}; 