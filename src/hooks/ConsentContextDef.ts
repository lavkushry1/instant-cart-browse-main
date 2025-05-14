import { createContext } from 'react';
import { ConsentCategory, ConsentSettings } from '@/types/tracking';

export interface ConsentContextType {
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

export const ConsentContext = createContext<ConsentContextType>({
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