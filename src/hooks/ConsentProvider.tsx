import React, { useState, useEffect, ReactNode } from 'react';
import { ConsentCategory, ConsentSettings } from '@/types/tracking';
import { getConsentSettings } from '@/services/trackingService'; // updateConsentSettings is not used in provider
import { ConsentContext, ConsentContextType } from './ConsentContextDef';

// Cookie utilities (moved here for now)
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

interface ConsentProviderProps {
  children: ReactNode;
}

export const ConsentProvider: React.FC<ConsentProviderProps> = ({ children }) => {
  const [consentSettings, setConsentSettings] = useState<ConsentSettings | null>(null);
  const [consentedCategories, setConsentedCategories] = useState<ConsentCategory[]>(['necessary']);
  const [consented, setConsented] = useState<boolean>(false);
  const [showConsentBanner, setShowConsentBanner] = useState<boolean>(false);
  const [initialized, setInitialized] = useState<boolean>(false);

  useEffect(() => {
    const initializeConsent = async () => {
      try {
        const settings = await getConsentSettings();
        setConsentSettings(settings);
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
            setShowConsentBanner(true);
          }
        } else {
          setShowConsentBanner(true);
        }
        setInitialized(true);
      } catch (error) {
        console.error('Error initializing consent settings:', error);
        // Optionally show banner or default to necessary if settings load fails
        setShowConsentBanner(true); 
        setInitialized(true); // Mark as initialized to prevent re-runs
      }
    };

    if (!initialized) {
      initializeConsent();
    }
  }, [initialized]);

  const acceptAll = () => {
    if (!consentSettings) return;
    const allCategories: ConsentCategory[] = consentSettings.categories.map(c => c.id as ConsentCategory);
    setConsentedCategories(['necessary', ...allCategories.filter(c => c !== 'necessary')]);
    setConsented(true);
    setShowConsentBanner(false);
    const consentData = {
      consented: true,
      categories: ['necessary', ...allCategories.filter(c => c !== 'necessary')],
      timestamp: new Date().toISOString()
    };
    setCookie('cookieConsent', encodeURIComponent(JSON.stringify(consentData)), consentSettings.cookieExpiration);
  };

  const rejectAll = () => {
    if (!consentSettings) return;
    const necessaryOnly: ConsentCategory[] = ['necessary'];
    setConsentedCategories(necessaryOnly);
    setConsented(true);
    setShowConsentBanner(false);
    const consentData = {
      consented: true,
      categories: necessaryOnly,
      timestamp: new Date().toISOString()
    };
    setCookie('cookieConsent', encodeURIComponent(JSON.stringify(consentData)), consentSettings.cookieExpiration);
  };

  const updateCategoryConsent = (category: ConsentCategory, consent: boolean) => {
    if (category === 'necessary') return;
    setConsentedCategories(prevCategories => {
      const newCategories = consent 
        ? [...new Set([...prevCategories, category])] 
        : prevCategories.filter(c => c !== category);
      return newCategories;
    });
  };

  const saveConsent = () => {
    if (!consentSettings) return;
    setConsented(true);
    setShowConsentBanner(false);
    const consentData = {
      consented: true,
      categories: consentedCategories,
      timestamp: new Date().toISOString()
    };
    setCookie('cookieConsent', encodeURIComponent(JSON.stringify(consentData)), consentSettings.cookieExpiration);
  };

  const closeConsentBanner = () => {
    setShowConsentBanner(false);
  };

  const contextValue: ConsentContextType = {
    consentSettings,
    consented,
    consentedCategories,
    showConsentBanner,
    acceptAll,
    rejectAll,
    updateCategoryConsent,
    saveConsent,
    closeConsentBanner,
  };

  return (
    <ConsentContext.Provider value={contextValue}>
      {children}
    </ConsentContext.Provider>
  );
};