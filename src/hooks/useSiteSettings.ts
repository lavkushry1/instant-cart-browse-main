// src/hooks/useSiteSettings.ts
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

// Firebase Client SDK imports for Cloud Functions
import { functionsClient } from '@/lib/firebaseClient'; 
import { httpsCallable, HttpsCallable, HttpsCallableResult } from 'firebase/functions'; 
import { SiteSettings } from '@/services/adminService'; // Shared type from backend service

let getSiteSettingsFunction: HttpsCallable<void, HttpsCallableResult<{ success: boolean; settings?: SiteSettings; error?: string }>> | undefined;

if (functionsClient && Object.keys(functionsClient).length > 0) {
  try {
    // Adjust 'admin-getSiteSettingsCF' if your deployed function name is different
    getSiteSettingsFunction = httpsCallable(functionsClient, 'admin-getSiteSettingsCF');
    console.log("useSiteSettings: Live httpsCallable for getSiteSettingsFunction created.");
  } catch (error) {
    console.error("useSiteSettings: Error preparing getSiteSettingsFunction:", error);
    toast.error("Error initializing connection to settings service for useSiteSettings.");
  }
} else {
    console.warn("useSiteSettings: Firebase functions client not available. Site settings will use fallback mock.");
}

// Fallback mock if httpsCallable setup failed or not ready
const callGetSiteSettingsFallbackMock = async (): Promise<HttpsCallableResult<{ success: boolean; settings?: SiteSettings; error?: string; message?: string}>> => {
    console.warn(`Using MOCK for getSiteSettings in useSiteSettings`);
    await new Promise(resolve => setTimeout(resolve, 400)); 
    const storedSettings = localStorage.getItem('adminSiteSettingsMock'); 
    if (storedSettings) return { data: { success: true, settings: JSON.parse(storedSettings) } };
    return { data: { success: true, settings: { storeName: "Default Mock Store from Hook", paymentGatewayKeys: { upiVpa: 'hook-default@upi_mock' } } } };
};

interface UseSiteSettingsReturn {
  settings: SiteSettings | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useSiteSettings = (): UseSiteSettingsReturn => {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = getSiteSettingsFunction 
        ? await getSiteSettingsFunction() 
        : await callGetSiteSettingsFallbackMock();

      if (result.data.success && result.data.settings) {
        setSettings(result.data.settings as SiteSettings);
        // Persist to localStorage for PaymentMethods.tsx to pick up if needed immediately or as fallback
        if(result.data.settings.paymentGatewayKeys?.upiVpa) {
            localStorage.setItem('storeUpiId', result.data.settings.paymentGatewayKeys.upiVpa);
        }
      } else {
        setError(result.data.error || "Failed to load site settings via hook.");
        toast.error(result.data.error || "Failed to load site settings via hook.");
      }
    } catch (err: any) {
      const errorMessage = err.message || 'An unknown error occurred while fetching site settings.';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error("Error in useSiteSettings fetchSettings:", err);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return { settings, isLoading, error, refetch: fetchSettings };
};
