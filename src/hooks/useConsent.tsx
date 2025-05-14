import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ConsentCategory, ConsentSettings } from '@/types/tracking';
import { getConsentSettings, updateConsentSettings } from '@/services/trackingService';

interface ConsentContextType {
  consentSettings: ConsentSettings | null;
  consented: boolean;
  consentedCategories: ConsentCategory[];
  showConsentBanner: boolean;
  acceptAll: () => void;
  rejectAll: () => void;
  updateCategoryConsent: (category: ConsentCategory, consented: boolean) => void;
  saveConsent: () => void;
  closeConsentBanner: () => void;
}

const ConsentContext = createContext<ConsentContextType>({
  consentSettings: null,
  consented: false,
  consentedCategories: [],
  showConsentBanner: false,
  acceptAll: () => {},
  rejectAll: () => {},
  updateCategoryConsent: () => {},
  saveConsent: () => {},
  closeConsentBanner: () => {},
});

export const useConsent = () => useContext(ConsentContext);

interface ConsentProviderProps {
  children: ReactNode;
}

// Cookie utilities
const setCookie = (name: string, value: string, days: number) => {
  const expirationDate = new Date();
  expirationDate.setDate(expirationDate.getDate() + days);
  document.cookie = `${name}=${value};expires=${expirationDate.toUTCString()};path=/;SameSite=Lax`;
};

const getCookie = (name: string): string | null => {
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [cookieName, cookieValue] = cookie.trim().split('=');
    if (cookieName === name) {
      return cookieValue;
    }
  }
  return null;
};

export const ConsentProvider: React.FC<ConsentProviderProps> = ({ children }) => {
  const [consentSettings, setConsentSettings] = useState<ConsentSettings | null>(null);
  const [consentedCategories, setConsentedCategories] = useState<ConsentCategory[]>(['necessary']);
  const [consented, setConsented] = useState<boolean>(false);
  const [showConsentBanner, setShowConsentBanner] = useState<boolean>(false);
  const [initialized, setInitialized] = useState<boolean>(false);

  // Load consent settings and check for existing consent cookie
  useEffect(() => {
    const initializeConsent = async () => {
      try {
        // Get consent settings from server/service
        const settings = await getConsentSettings();
        setConsentSettings(settings);

        // Check if the user has already consented
        const consentCookie = getCookie('cookieConsent');
        
        if (consentCookie) {
          try {
            const parsedConsent = JSON.parse(decodeURIComponent(consentCookie));
            
            if (parsedConsent.consented) {
              setConsented(true);
              setConsentedCategories(parsedConsent.categories || ['necessary']);
              setShowConsentBanner(false);
            } else {
              setShowConsentBanner(true);
            }
          } catch (error) {
            // Invalid cookie format, show the banner
            setShowConsentBanner(true);
          }
        } else {
          // No consent cookie found, show the banner
          setShowConsentBanner(true);
        }

        setInitialized(true);
      } catch (error) {
        console.error('Error initializing consent settings:', error);
      }
    };

    if (!initialized) {
      initializeConsent();
    }
  }, [initialized]);

  // Accept all cookie categories
  const acceptAll = () => {
    if (!consentSettings) return;
    
    const allCategories: ConsentCategory[] = [
      'necessary',
      'functional',
      'performance',
      'targeting',
      'uncategorized'
    ];
    
    setConsentedCategories(allCategories);
    setConsented(true);
    setShowConsentBanner(false);
    
    // Save to cookie
    const consentData = {
      consented: true,
      categories: allCategories,
      timestamp: new Date().toISOString()
    };
    
    setCookie('cookieConsent', encodeURIComponent(JSON.stringify(consentData)), consentSettings.cookieExpiration);
  };

  // Reject all optional cookie categories
  const rejectAll = () => {
    if (!consentSettings) return;
    
    const necessaryOnly: ConsentCategory[] = ['necessary'];
    
    setConsentedCategories(necessaryOnly);
    setConsented(true);
    setShowConsentBanner(false);
    
    // Save to cookie
    const consentData = {
      consented: true,
      categories: necessaryOnly,
      timestamp: new Date().toISOString()
    };
    
    setCookie('cookieConsent', encodeURIComponent(JSON.stringify(consentData)), consentSettings.cookieExpiration);
  };

  // Update consent for a specific category
  const updateCategoryConsent = (category: ConsentCategory, consent: boolean) => {
    if (category === 'necessary') return; // Cannot toggle necessary cookies
    
    setConsentedCategories(prevCategories => {
      if (consent) {
        return [...prevCategories, category].filter((c, i, arr) => arr.indexOf(c) === i); // Unique categories
      } else {
        return prevCategories.filter(c => c !== category);
      }
    });
  };

  // Save current consent settings
  const saveConsent = () => {
    if (!consentSettings) return;
    
    setConsented(true);
    setShowConsentBanner(false);
    
    // Save to cookie
    const consentData = {
      consented: true,
      categories: consentedCategories,
      timestamp: new Date().toISOString()
    };
    
    setCookie('cookieConsent', encodeURIComponent(JSON.stringify(consentData)), consentSettings.cookieExpiration);
  };

  // Close the consent banner without saving (used when user navigates away)
  const closeConsentBanner = () => {
    setShowConsentBanner(false);
  };

  return (
    <ConsentContext.Provider
      value={{
        consentSettings,
        consented,
        consentedCategories,
        showConsentBanner,
        acceptAll,
        rejectAll,
        updateCategoryConsent,
        saveConsent,
        closeConsentBanner,
      }}
    >
      {children}
    </ConsentContext.Provider>
  );
}; 