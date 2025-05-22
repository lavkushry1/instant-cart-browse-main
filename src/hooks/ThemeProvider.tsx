import React, { useState, useEffect, ReactNode, useCallback } from 'react'; // Added useCallback
import { Theme, ThemeSettings } from '@/types/theme';
import { getActiveTheme } from '@/services/themeService';
import { ThemeContext, ThemeContextType } from './ThemeContextDef';
import { SiteSettings } from '@/services/adminService'; // For SiteSettings type
import { functionsClient } from '@/lib/firebaseClient'; // For functions client
import { httpsCallable, HttpsCallableResult } from 'firebase/functions'; // For HttpsCallable

// Define the direct response structure from callable functions
interface SiteSettingsResponse { success: boolean; settings?: SiteSettings; error?: string; message?: string; }

let getSiteSettingsFunctionGlobal: HttpsCallable<void, SiteSettingsResponse> | undefined;
if (functionsClient && Object.keys(functionsClient).length > 0) {
  try {
    getSiteSettingsFunctionGlobal = httpsCallable(functionsClient, 'admin-getSiteSettingsCF');
  } catch (error) {
    console.error("ThemeProvider: Error preparing getSiteSettingsCF:", error);
  }
}

const fallbackGetSiteSettingsGlobal = async (): Promise<SiteSettingsResponse> => {
    console.warn("ThemeProvider: Using MOCK for getSiteSettingsCF");
    await new Promise(resolve => setTimeout(resolve, 100));
    const storedSettings = localStorage.getItem('adminSiteSettingsMock'); // Check if admin saved something
    if (storedSettings) {
        try {
            const parsed = JSON.parse(storedSettings);
            // Ensure structure matches SiteSettings, especially themePreferences
            if (parsed.themePreferences) {
                 return { success: true, settings: parsed as SiteSettings };
            }
        } catch (e) { console.error("Error parsing stored mock settings", e); }
    }
    // Fallback to very basic defaults if nothing relevant in localStorage
    return { 
        success: true, 
        settings: { 
            themePreferences: { 
                primaryColor: '#007bff', // Default blue
                secondaryColor: '#6c757d', // Default gray
                fontFamily: 'Inter, sans-serif' // Default font
            } 
        } as SiteSettings 
    };
};


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
  const [siteSettingsThemePrefs, setSiteSettingsThemePrefs] = useState<SiteSettings['themePreferences'] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSiteSettingsLoading, setIsSiteSettingsLoading] = useState(true);

  const fetchBaseTheme = useCallback(async () => {
    try {
      const activeTheme = await getActiveTheme(); // Fetches the base theme structure
      setTheme(activeTheme);
    } catch (error) {
      console.error('Failed to load base theme:', error);
      // Optionally set a very basic fallback theme here
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchSiteSettingsTheme = useCallback(async () => {
    setIsSiteSettingsLoading(true);
    try {
      const result = getSiteSettingsFunctionGlobal
        ? (await getSiteSettingsFunctionGlobal()).data
        : await fallbackGetSiteSettingsGlobal();

      if (result.success && result.settings?.themePreferences) {
        setSiteSettingsThemePrefs(result.settings.themePreferences);
      } else {
        console.warn("No theme preferences found in site settings or error loading them.");
        // Use fallback defaults if not found in site settings from admin
        setSiteSettingsThemePrefs({ 
            primaryColor: '#3B82F6', // Default blue from Tailwind
            secondaryColor: '#6B7280', // Default gray from Tailwind
            fontFamily: 'Inter, system-ui, Avenir, Helvetica, Arial, sans-serif'
        });
      }
    } catch (error) {
      console.error('Failed to load site settings theme preferences:', error);
      setSiteSettingsThemePrefs({ // Fallback on error
        primaryColor: '#3B82F6', 
        secondaryColor: '#6B7280',
        fontFamily: 'Inter, system-ui, Avenir, Helvetica, Arial, sans-serif'
      });
    } finally {
      setIsSiteSettingsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBaseTheme();
    fetchSiteSettingsTheme(); // Fetch site settings in parallel or sequentially
  }, [fetchBaseTheme, fetchSiteSettingsTheme]);

  useEffect(() => {
    if (theme && siteSettingsThemePrefs && !isLoading && !isSiteSettingsLoading) {
      const mergedSettings: ThemeSettings = {
        ...theme.settings,
        primaryColor: siteSettingsThemePrefs.primaryColor || theme.settings.primaryColor,
        secondaryColor: siteSettingsThemePrefs.secondaryColor || theme.settings.secondaryColor,
        // Assuming fontFamily from site settings should override both body and heading for simplicity
        bodyFont: siteSettingsThemePrefs.fontFamily || theme.settings.bodyFont,
        headingFont: siteSettingsThemePrefs.fontFamily || theme.settings.headingFont,
        // Other settings like accentColor, backgroundColor etc., remain from the base theme
        // unless also overridden by siteSettings if that functionality is added later.
      };
      applyThemeToDocument({ ...theme, settings: mergedSettings });
    } else if (theme && !siteSettingsThemePrefs && !isLoading && !isSiteSettingsLoading) {
      // If site settings theme prefs are not available after loading, apply base theme
      applyThemeToDocument(theme);
    }
    // If only siteSettingsThemePrefs are available (no base theme loaded, highly unlikely for a good UX)
    // one might consider applying a very minimal theme based just on those.
    // For now, we prioritize the base theme structure and override with site settings.

  }, [theme, siteSettingsThemePrefs, isLoading, isSiteSettingsLoading]);


  const applyTheme = (newTheme: Theme) => { // This might be less relevant if site settings dictate theme
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