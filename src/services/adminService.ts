// src/services/adminService.ts

// This file should primarily export types for frontend consumption if it's in src/.
// Backend logic using firebase-admin has been moved to functions/src/services/adminServiceBE.ts

// import { Timestamp as ClientTimestamp } from 'firebase/firestore'; // Keep if SiteSettings uses ClientTimestamp

export interface SiteSettings {
    storeName?: string; 
    storeDescription?: string;
    storeLogoUrl?: string; 
    contactEmail?: string; 
    contactPhone?: string; 
    address?: string;
    socialMediaLinks?: { 
        facebook?: string; 
        instagram?: string; 
        twitter?: string; 
    };
    currency?: { 
        defaultCode: string; 
        supportedCodes?: string[]; 
    };
    paymentGatewayKeys?: { 
        stripePublishableKey?: string; 
        upiVpa?: string; // upiVpa is used by frontend
        // Potentially other public keys, but no secret keys
    };
    seoDefaults?: { 
        metaTitle?: string; 
        metaDescription?: string; 
    };
    themePreferences?: { 
        primaryColor?: string; 
        secondaryColor?: string; 
        fontFamily?: string; 
    };
    trackingIds?: { 
        googleAnalyticsId?: string; 
        facebookPixelId?: string; 
    };
    maintenanceMode?: boolean; 
    // lastUpdatedBy?: string; // Potentially sensitive or not needed by client
    // updatedAt?: any; // Type from firebase-admin, not for client direct use. Client can receive as string/number.
}

// If ClientTimestamp was used in SiteSettings, ensure it's correctly typed for client, e.g., string | number | Date
// For example, if updatedAt was to be exposed and was a Firestore Timestamp:
// updatedAt?: string | number; // Representing a timestamp that client can parse