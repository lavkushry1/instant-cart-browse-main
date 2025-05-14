import React, { useState, useEffect, ReactNode } from 'react';
import { Theme, ThemeSettings } from '@/types/theme';
import { getActiveTheme } from '@/services/themeService';
import { ThemeContext, ThemeContextType } from './ThemeContextDef';

// Helper function (kept with Provider as it directly manipulates document based on theme state)
const applyThemeToDocument = (theme: Theme) => {
  const { settings } = theme;
  const root = document.documentElement;
  
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
  
  root.style.setProperty('--heading-font', settings.headingFont);
  root.style.setProperty('--body-font', settings.bodyFont);
  root.style.setProperty('--font-size-base', settings.fontSize.base);
  root.style.setProperty('--font-size-h1', settings.fontSize.h1);
  root.style.setProperty('--font-size-h2', settings.fontSize.h2);
  root.style.setProperty('--font-size-h3', settings.fontSize.h3);
  root.style.setProperty('--font-size-h4', settings.fontSize.h4);
  root.style.setProperty('--font-size-h5', settings.fontSize.h5);
  root.style.setProperty('--font-size-small', settings.fontSize.small);
  
  root.style.setProperty('--container-width', settings.containerWidth);
  root.style.setProperty('--border-radius', settings.borderRadius);
  root.style.setProperty('--card-shadow', settings.cardShadow);
  root.style.setProperty('--mobile-breakpoint', settings.mobileBreakpoint);
  
  let styleEl = document.getElementById('theme-custom-css');
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = 'theme-custom-css';
    document.head.appendChild(styleEl);
  }
  styleEl.textContent = settings.customCSS || '';
};

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
    applyThemeToDocument(theme);
  }, [theme]);

  const applyTheme = (newTheme: Theme) => {
    setTheme(newTheme);
  };

  const updateThemeSettings = (settings: Partial<ThemeSettings>) => {
    if (!theme) return;
    setTheme(prevTheme => prevTheme ? { // Added null check for prevTheme
      ...prevTheme,
      settings: {
        ...prevTheme.settings,
        ...settings
      }
    } : null);
  };

  const contextValue: ThemeContextType = {
    theme,
    isLoading,
    applyTheme,
    updateThemeSettings,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};