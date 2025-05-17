// src/hooks/useSiteSettings.ts
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

// Firebase Client SDK imports for Cloud Functions
import { functionsClient } from '@/lib/firebaseClient'; 
import { httpsCallable, HttpsCallable, HttpsCallableResult } from 'firebase/functions'; 
import { SiteSettings } from '@/services/adminService'; // Shared type from backend service

// Define the expected direct JSON response from the Cloud Function
interface GetSiteSettingsResponse {
  success: boolean;
  settings?: SiteSettings;
  error?: string;
  message?: string; // Optional, from fallback
}

let getSiteSettingsFunction: HttpsCallable<void, GetSiteSettingsResponse> | undefined;

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
const callGetSiteSettingsFallbackMock = async (): Promise<GetSiteSettingsResponse> => {
    console.warn(`Using MOCK for getSiteSettings in useSiteSettings`);
    await new Promise(resolve => setTimeout(resolve, 400)); 
    const storedSettings = localStorage.getItem('adminSiteSettingsMock'); 
    if (storedSettings) return { success: true, settings: JSON.parse(storedSettings) };
    return { success: true, settings: { storeName: "Default Mock Store from Hook", paymentGatewayKeys: { upiVpa: 'hook-default@upi_mock' } } };
};

interface UseSiteSettingsReturn {
  settings: SiteSettings | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useSiteSettings = (): UseSiteSettingsReturn => {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [error, setError] = useState<string | null>(null); // Reverted from any
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      let responseData: GetSiteSettingsResponse;
      if (getSiteSettingsFunction) {
        const result: HttpsCallableResult<GetSiteSettingsResponse> = await getSiteSettingsFunction();
        responseData = result.data;
      } else {
        responseData = await callGetSiteSettingsFallbackMock();
      }

      if (responseData.success && responseData.settings) {
        setSettings(responseData.settings as SiteSettings);
        // Persist to localStorage for PaymentMethods.tsx to pick up if needed immediately or as fallback
        if(responseData.settings.paymentGatewayKeys?.upiVpa) {
            localStorage.setItem('storeUpiId', responseData.settings.paymentGatewayKeys.upiVpa);
        }
      } else {
        setError(responseData.error || responseData.message || "Failed to load site settings via hook.");
        toast.error(responseData.error || responseData.message || "Failed to load site settings via hook.");
      }
    } catch (err: unknown) {
      let errorMessage = 'An unknown error occurred while fetching site settings.';
      if (err instanceof Error) {
        errorMessage = err.message;
      }
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
