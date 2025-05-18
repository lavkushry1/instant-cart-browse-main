// functions/src/types/adminSettingsBE.ts

// Duplicated from src/services/adminService.ts SiteSettings to satisfy functions/tsconfig.json rootDir

export interface SiteSettingsBE {
    storeName?: string;
    storeDescription?: string;
    storeLogoUrl?: string;
    contactEmail?: string;
    contactPhone?: string;
    address?: string;
    socialLinks?: {
        facebook?: string;
        instagram?: string;
        twitter?: string;
        youtube?: string;
        linkedin?: string;
    };
    maintenanceMode?: boolean;
    currency?: {
        defaultCode?: string; // e.g., "USD"
        supportedCodes?: string[]; // e.g., ["USD", "EUR", "INR"]
    };
    seo?: {
        defaultMetaTitle?: string;
        defaultMetaDescription?: string;
        // other global SEO settings
    };
    analytics?: {
        googleAnalyticsId?: string;
        facebookPixelId?: string;
    };
    themePreferences?: {
        primaryColor?: string;
        secondaryColor?: string;
        fontFamily?: string;
        // other theme options
    };
    paymentGatewayKeys?: {
        stripePublishableKey?: string;
        // Add other payment gateway keys as needed
        paypalClientId?: string;
        razorpayKeyId?: string;
        upiVpa?: string; // For UPI payments
    };
    // Add any other site-wide settings here
    storeTimeZone?: string; // e.g., "America/New_York"
    shippingConfig?: {
        defaultShippingRate?: number;
        freeShippingThreshold?: number;
        supportedCountries?: string[];
    };
    taxConfig?: {
        defaultTaxRate?: number; // Percentage
        isTaxInclusive?: boolean;
    };
} 