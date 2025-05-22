import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, ShoppingBag, CreditCard, Loader2, Shield, Truck, Percent, Mail } from 'lucide-react'; // Added Truck, Percent, Mail
import { toast } from 'sonner';
import AdminCardDetails from '@/components/checkout/AdminCardDetails';

// Firebase Client SDK imports for Cloud Functions
import { functionsClient } from '@/lib/firebaseClient'; 
import { httpsCallable, HttpsCallable, HttpsCallableResult } from 'firebase/functions'; 
import { SiteSettings } from '@/services/adminService'; // Shared type from backend service

// Define the direct response structure from callable functions
interface SiteSettingsResponse { success: boolean; settings?: SiteSettings; error?: string; message?: string; }

let getSiteSettingsFunction: HttpsCallable<void, SiteSettingsResponse> | undefined;
let updateSiteSettingsFunction: HttpsCallable<Partial<SiteSettings>, SiteSettingsResponse> | undefined;

if (functionsClient && Object.keys(functionsClient).length > 0) { // Check if functionsClient is not the empty mock
  try {
    // Assumes functions are exported as `admin.getSiteSettingsCF` etc. from functions/src/index.ts
    // Adjust "admin-getSiteSettingsCF" if your deployed function name is different (e.g. "admin.getSiteSettingsCF")
    getSiteSettingsFunction = httpsCallable(functionsClient, 'admin-getSiteSettingsCF');
    updateSiteSettingsFunction = httpsCallable(functionsClient, 'admin-updateSiteSettingsCF');
    console.log("AdminSettings: Live httpsCallable references created.");
  } catch (error) {
    console.error("AdminSettings: Error preparing httpsCallable functions with live client:", error);
    toast.error("Error initializing connection to settings service.");
  }
} else {
    console.warn("AdminSettings: Firebase functions client not available or mocked. Using fallback mocks for API calls.");
}

// Fallback mock if httpsCallable setup failed or not ready
const callFallbackMock = async (functionName: string, data?: Partial<SiteSettings>): Promise<SiteSettingsResponse> => {
    console.warn(`Using MOCK for Cloud Function: ${functionName} with data:`, data);
    await new Promise(resolve => setTimeout(resolve, 700)); 
    if (functionName === 'admin-getSiteSettingsCF') {
        const storedSettings = localStorage.getItem('adminSiteSettingsMock'); 
        if (storedSettings) return { success: true, settings: JSON.parse(storedSettings) };
        return { success: true, settings: { storeName: "Default Mock Store", paymentGatewayKeys: { upiVpa: 'default@upi_mock' } } };
    }
    if (functionName === 'admin-updateSiteSettingsCF') {
        const currentSettingsJSON = localStorage.getItem('adminSiteSettingsMock');
        const currentSettings = currentSettingsJSON ? JSON.parse(currentSettingsJSON) : {};
        const updatedData = { ...currentSettings, ...data };
        if (data && data.paymentGatewayKeys) {
            updatedData.paymentGatewayKeys = { ...(currentSettings.paymentGatewayKeys || {}), ...data.paymentGatewayKeys };
        }
        localStorage.setItem('adminSiteSettingsMock', JSON.stringify(updatedData));
        return { success: true, settings: updatedData };
    }
    return { success: false, error: 'Unknown mock function' };
};

const AdminSettings = () => {
  const [storeName, setStoreName] = useState('');
  const [storeDescription, setStoreDescription] = useState('');
  const [storeLogoUrl, setStoreLogoUrl] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [facebookUrl, setFacebookUrl] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [twitterUrl, setTwitterUrl] = useState('');
  const [primaryThemeColor, setPrimaryThemeColor] = useState('');
  const [secondaryThemeColor, setSecondaryThemeColor] = useState('');
  const [themeFontFamily, setThemeFontFamily] = useState('');
  const [defaultCurrencyCode, setDefaultCurrencyCode] = useState('INR');
  const [supportedCurrencyCodes, setSupportedCurrencyCodes] = useState('');
  const [defaultMetaTitle, setDefaultMetaTitle] = useState('');
  const [defaultMetaDescription, setDefaultMetaDescription] = useState('');
  const [googleAnalyticsId, setGoogleAnalyticsId] = useState('');
  const [facebookPixelId, setFacebookPixelId] = useState('');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [upiId, setUpiId] = useState('');
  const [isSavingGeneral, setIsSavingGeneral] = useState(false);
  const [isSavingStoreInfo, setIsSavingStoreInfo] = useState(false);
  const [isSavingUpi, setIsSavingUpi] = useState(false);
  const [isSavingShippingTax, setIsSavingShippingTax] = useState(false);
  const [isSavingNotifications, setIsSavingNotifications] = useState(false);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [showStoredCards, setShowStoredCards] = useState(false);

  // Shipping settings
  const [defaultShippingRate, setDefaultShippingRate] = useState<number | string>(''); // Allow string for empty input
  const [freeShippingThreshold, setFreeShippingThreshold] = useState<number | string>('');

  // Tax settings
  const [defaultTaxRate, setDefaultTaxRate] = useState<number | string>('');
  const [pricesIncludeTax, setPricesIncludeTax] = useState(false);

  // Notification settings
  const [notifyOrderConfirmation, setNotifyOrderConfirmation] = useState(true);
  const [notifyShippingUpdate, setNotifyShippingUpdate] = useState(true);
  const [notifyPasswordReset, setNotifyPasswordReset] = useState(true);


  const fetchSettings = useCallback(async () => {
    setIsLoadingSettings(true);
    try {
      const result = getSiteSettingsFunction 
        ? (await getSiteSettingsFunction()).data
        : await callFallbackMock('admin-getSiteSettingsCF');

      if (result.success && result.settings) {
        const settings = result.settings as SiteSettings; // Cast to specific type
        setStoreName(settings.storeName || '');
        setStoreDescription(settings.storeDescription || '');
        setStoreLogoUrl(settings.storeLogoUrl || '');
        setContactEmail(settings.contactEmail || '');
        setContactPhone(settings.contactPhone || '');
        setFacebookUrl(settings.socialMediaLinks?.facebook || '');
        setInstagramUrl(settings.socialMediaLinks?.instagram || '');
        setTwitterUrl(settings.socialMediaLinks?.twitter || '');
        setPrimaryThemeColor(settings.themePreferences?.primaryColor || '');
        setSecondaryThemeColor(settings.themePreferences?.secondaryColor || '');
        setThemeFontFamily(settings.themePreferences?.fontFamily || '');
        setDefaultCurrencyCode(settings.currency?.defaultCode || 'INR');
        setSupportedCurrencyCodes(settings.currency?.supportedCodes?.join(', ') || '');
        setDefaultMetaTitle(settings.seoDefaults?.metaTitle || '');
        setDefaultMetaDescription(settings.seoDefaults?.metaDescription || '');
        setGoogleAnalyticsId(settings.trackingIds?.googleAnalyticsId || '');
        setFacebookPixelId(settings.trackingIds?.facebookPixelId || '');
        setMaintenanceMode(settings.maintenanceMode || false);
        setUpiId(settings.paymentGatewayKeys?.upiVpa || '');
        if(settings.paymentGatewayKeys?.upiVpa) localStorage.setItem('storeUpiId', settings.paymentGatewayKeys.upiVpa);

        // Load shipping settings
        setDefaultShippingRate(settings.shipping?.defaultRate ?? '');
        setFreeShippingThreshold(settings.shipping?.freeShippingThreshold ?? '');

        // Load tax settings
        setDefaultTaxRate(settings.tax?.defaultRate ?? '');
        setPricesIncludeTax(settings.tax?.pricesIncludeTax || false);

        // Load notification settings
        setNotifyOrderConfirmation(settings.notifications?.orderConfirmation === undefined ? true : settings.notifications.orderConfirmation);
        setNotifyShippingUpdate(settings.notifications?.shippingUpdate === undefined ? true : settings.notifications.shippingUpdate);
        setNotifyPasswordReset(settings.notifications?.passwordReset === undefined ? true : settings.notifications.passwordReset);

      } else {
        toast.error(result.error || "Failed to load site settings.");
      }
    } catch (error: unknown) {
      let message = 'Unknown error';
      if (error instanceof Error) {
        message = error.message;
      }
      toast.error(`Failed to load site settings: ${message}`);
      console.error("Error loading settings:", error);
    }
    setIsLoadingSettings(false);
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const handleSaveGeneralSettings = async () => {
    setIsSavingGeneral(true);
    const settingsToSave: Partial<SiteSettings> = {
      storeName,
      storeDescription,
      storeLogoUrl,
      contactEmail,
      contactPhone,
      socialMediaLinks: {
        facebook: facebookUrl,
        instagram: instagramUrl,
        twitter: twitterUrl,
      },
      themePreferences: {
        primaryColor: primaryThemeColor,
        secondaryColor: secondaryThemeColor,
        fontFamily: themeFontFamily,
      },
      maintenanceMode
    };
    try {
      const result = updateSiteSettingsFunction 
        ? (await updateSiteSettingsFunction(settingsToSave)).data
        : await callFallbackMock('admin-updateSiteSettingsCF', settingsToSave);

      if (result.success) {
        toast.success("General settings saved successfully!");
        if (result.settings) {
            setStoreName(result.settings.storeName || '');
            setStoreDescription(result.settings.storeDescription || '');
            setStoreLogoUrl(result.settings.storeLogoUrl || '');
            setContactEmail(result.settings.contactEmail || '');
            setContactPhone(result.settings.contactPhone || '');
            setFacebookUrl(result.settings.socialMediaLinks?.facebook || '');
            setInstagramUrl(result.settings.socialMediaLinks?.instagram || '');
            setTwitterUrl(result.settings.socialMediaLinks?.twitter || '');
            setPrimaryThemeColor(result.settings.themePreferences?.primaryColor || '');
            setSecondaryThemeColor(result.settings.themePreferences?.secondaryColor || '');
            setThemeFontFamily(result.settings.themePreferences?.fontFamily || '');
            setMaintenanceMode(result.settings.maintenanceMode || false);
        }
      } else {
        toast.error(result.error || "Failed to save general settings.");
      }
    } catch (error: unknown) {
      let message = 'Unknown error';
      if (error instanceof Error) {
        message = error.message;
      }
      toast.error(`Failed to save general settings: ${message}`);
    }
    setIsSavingGeneral(false);
  };

  const handleSaveStoreInfoSettings = async () => {
    setIsSavingStoreInfo(true);
    const settingsToSave: Partial<SiteSettings> = {
      currency: { 
        defaultCode: defaultCurrencyCode.toUpperCase(),
        supportedCodes: supportedCurrencyCodes.split(',').map(code => code.trim().toUpperCase()).filter(code => code)
      },
      seoDefaults: {
        metaTitle: defaultMetaTitle,
        metaDescription: defaultMetaDescription,
      },
      trackingIds: {
        googleAnalyticsId: googleAnalyticsId,
        facebookPixelId: facebookPixelId,
      }
    };
    try {
      const result = updateSiteSettingsFunction
        ? (await updateSiteSettingsFunction(settingsToSave)).data
        : await callFallbackMock('admin-updateSiteSettingsCF', settingsToSave);

      if (result.success) {
        toast.success("Store info settings saved successfully!");
        if (result.settings?.currency) {
            setDefaultCurrencyCode(result.settings.currency.defaultCode);
            setSupportedCurrencyCodes(result.settings.currency.supportedCodes?.join(', ') || '');
        }
        if (result.settings?.seoDefaults) {
          setDefaultMetaTitle(result.settings.seoDefaults.metaTitle || '');
          setDefaultMetaDescription(result.settings.seoDefaults.metaDescription || '');
        }
        if (result.settings?.trackingIds) {
          setGoogleAnalyticsId(result.settings.trackingIds.googleAnalyticsId || '');
          setFacebookPixelId(result.settings.trackingIds.facebookPixelId || '');
        }
      } else {
        toast.error(result.error || "Failed to save store info settings.");
      }
    } catch (error: unknown) {
      let message = 'Unknown error';
      if (error instanceof Error) message = error.message;
      toast.error(`Failed to save store info settings: ${message}`);
    }
    setIsSavingStoreInfo(false);
  };

  const handleSavePaymentSettings = async () => {
    if (!upiId.trim()) { toast.error("UPI ID cannot be empty."); return; }
    setIsSavingUpi(true);
    const settingsToUpdate: Partial<SiteSettings> = { paymentGatewayKeys: { upiVpa: upiId.trim() } };
    try {
      const result = updateSiteSettingsFunction 
        ? (await updateSiteSettingsFunction(settingsToUpdate)).data
        : await callFallbackMock('admin-updateSiteSettingsCF', settingsToUpdate);

      if (result.success && result.settings?.paymentGatewayKeys?.upiVpa) {
        toast.success("UPI ID saved successfully!");
        localStorage.setItem('storeUpiId', result.settings.paymentGatewayKeys.upiVpa);
        setUpiId(result.settings.paymentGatewayKeys.upiVpa);
      } else {
        toast.error(result.error || "Failed to save UPI ID.");
      }
    } catch (error: unknown) {
      let message = 'Unknown error';
      if (error instanceof Error) {
        message = error.message;
      }
      toast.error(`Failed to save UPI ID: ${message}`);
      console.error("Error saving UPI ID:", error);
    }
    setIsSavingUpi(false);
  };

  const handleSaveShippingTaxSettings = async () => {
    setIsSavingShippingTax(true);
    const settingsToSave: Partial<SiteSettings> = {
      shipping: {
        defaultRate: Number(defaultShippingRate) || 0,
        freeShippingThreshold: Number(freeShippingThreshold) || 0,
      },
      tax: {
        defaultRate: Number(defaultTaxRate) || 0,
        pricesIncludeTax: pricesIncludeTax,
      },
    };
    try {
      const result = updateSiteSettingsFunction
        ? (await updateSiteSettingsFunction(settingsToSave)).data
        : await callFallbackMock('admin-updateSiteSettingsCF', settingsToSave);
      
      if (result.success) {
        toast.success("Shipping & Tax settings saved!");
        if (result.settings) {
            setDefaultShippingRate(result.settings.shipping?.defaultRate ?? '');
            setFreeShippingThreshold(result.settings.shipping?.freeShippingThreshold ?? '');
            setDefaultTaxRate(result.settings.tax?.defaultRate ?? '');
            setPricesIncludeTax(result.settings.tax?.pricesIncludeTax || false);
        }
      } else {
        toast.error(result.error || "Failed to save Shipping & Tax settings.");
      }
    } catch (error: unknown) {
      let message = 'Unknown error';
      if (error instanceof Error) message = error.message;
      toast.error(`Failed to save Shipping & Tax settings: ${message}`);
    }
    setIsSavingShippingTax(false);
  };

  const handleSaveNotificationSettings = async () => {
    setIsSavingNotifications(true);
    const settingsToSave: Partial<SiteSettings> = {
      notifications: {
        orderConfirmation: notifyOrderConfirmation,
        shippingUpdate: notifyShippingUpdate,
        passwordReset: notifyPasswordReset,
      },
    };
    try {
      const result = updateSiteSettingsFunction
        ? (await updateSiteSettingsFunction(settingsToSave)).data
        : await callFallbackMock('admin-updateSiteSettingsCF', settingsToSave);

      if (result.success) {
        toast.success("Notification settings saved!");
        if (result.settings?.notifications) {
            setNotifyOrderConfirmation(result.settings.notifications.orderConfirmation === undefined ? true : result.settings.notifications.orderConfirmation);
            setNotifyShippingUpdate(result.settings.notifications.shippingUpdate === undefined ? true : result.settings.notifications.shippingUpdate);
            setNotifyPasswordReset(result.settings.notifications.passwordReset === undefined ? true : result.settings.notifications.passwordReset);
        }
      } else {
        toast.error(result.error || "Failed to save Notification settings.");
      }
    } catch (error: unknown) {
      let message = 'Unknown error';
      if (error instanceof Error) message = error.message;
      toast.error(`Failed to save Notification settings: ${message}`);
    }
    setIsSavingNotifications(false);
  };


  if (isLoadingSettings) return <AdminLayout><div className="p-6 text-center"><Loader2 className="h-6 w-6 animate-spin inline mr-2" />Loading settings...</div></AdminLayout>;

  return (
    <AdminLayout>
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">Settings</h1>
        <Tabs defaultValue="general">
          <TabsList className="mb-6 grid w-full grid-cols-3 md:grid-cols-5 lg:grid-cols-7"> {/* Adjusted grid-cols for more tabs */}
            <TabsTrigger value="general"><Settings className="h-4 w-4 mr-2 inline" />General</TabsTrigger>
            <TabsTrigger value="payments"><CreditCard className="h-4 w-4 mr-2 inline" />Payments</TabsTrigger>
            <TabsTrigger value="store"><ShoppingBag className="h-4 w-4 mr-2 inline" />Store Info</TabsTrigger>
            <TabsTrigger value="shipping_tax"><Truck className="h-4 w-4 mr-2 inline" />Shipping & Tax</TabsTrigger>
            <TabsTrigger value="notifications"><Mail className="h-4 w-4 mr-2 inline" />Notifications</TabsTrigger>
          </TabsList>
          <TabsContent value="general">
            <Card>
              <CardHeader><CardTitle>General Settings</CardTitle><CardDescription>Manage your store's general information and theme.</CardDescription></CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2"><Label htmlFor="store-name">Store Name</Label><Input id="store-name" value={storeName} onChange={e => setStoreName(e.target.value)} /></div>
                <div className="space-y-2"><Label htmlFor="store-logo-url">Store Logo URL</Label><Input id="store-logo-url" type="url" placeholder="https://example.com/logo.png" value={storeLogoUrl} onChange={e => setStoreLogoUrl(e.target.value)} /></div>
                <div className="space-y-2"><Label htmlFor="store-description">Store Description</Label><Textarea id="store-description" value={storeDescription} onChange={e => setStoreDescription(e.target.value)} /></div>
                <div className="space-y-2"><Label htmlFor="contact-email">Contact Email</Label><Input id="contact-email" type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)} /></div>
                <div className="space-y-2"><Label htmlFor="contact-phone">Contact Phone</Label><Input id="contact-phone" type="tel" value={contactPhone} onChange={e => setContactPhone(e.target.value)} /></div>
                <h4 className="text-md font-medium pt-4 border-t">Social Media Links</h4>
                <div className="space-y-2"><Label htmlFor="facebook-url">Facebook URL</Label><Input id="facebook-url" type="url" placeholder="https://facebook.com/yourpage" value={facebookUrl} onChange={e => setFacebookUrl(e.target.value)} /></div>
                <div className="space-y-2"><Label htmlFor="instagram-url">Instagram URL</Label><Input id="instagram-url" type="url" placeholder="https://instagram.com/yourprofile" value={instagramUrl} onChange={e => setInstagramUrl(e.target.value)} /></div>
                <div className="space-y-2"><Label htmlFor="twitter-url">Twitter URL</Label><Input id="twitter-url" type="url" placeholder="https://twitter.com/yourhandle" value={twitterUrl} onChange={e => setTwitterUrl(e.target.value)} /></div>
                <h4 className="text-md font-medium pt-4 border-t">Theme Settings</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="primary-color">Primary Color</Label>
                    <Input id="primary-color" type="text" placeholder="#RRGGBB" value={primaryThemeColor} onChange={e => setPrimaryThemeColor(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="secondary-color">Secondary Color</Label>
                    <Input id="secondary-color" type="text" placeholder="#RRGGBB" value={secondaryThemeColor} onChange={e => setSecondaryThemeColor(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="font-family">Font Family</Label>
                  <Input id="font-family" type="text" placeholder="e.g., Inter, Roboto, Arial" value={themeFontFamily} onChange={e => setThemeFontFamily(e.target.value)} />
                </div>
                <div className="flex items-center justify-between"><div className="space-y-0.5"><Label htmlFor="maintenance-mode">Maintenance Mode</Label><div className="text-sm text-gray-500">Temporarily take store offline.</div></div><Switch id="maintenance-mode" checked={maintenanceMode} onCheckedChange={setMaintenanceMode} /></div>
                <Button onClick={handleSaveGeneralSettings} disabled={isSavingGeneral}>{isSavingGeneral ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Save General Settings</Button>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="payments">
            <Card>
              <CardHeader><CardTitle>Payment Gateway Settings</CardTitle><CardDescription>Configure your payment options.</CardDescription></CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4 p-4 border rounded-md">
                  <h3 className="text-lg font-medium">UPI QR Code Settings</h3>
                  <div className="space-y-2">
                    <Label htmlFor="upi-id">Store UPI ID (VPA)</Label>
                    <Input id="upi-id" placeholder="yourname@upi" value={upiId} onChange={(e) => setUpiId(e.target.value)} />
                    <p className="text-xs text-gray-500">This UPI ID will be used to generate QR codes for payment.</p>
                  </div>
                  <Button onClick={handleSavePaymentSettings} disabled={isSavingUpi}>{isSavingUpi ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Save UPI ID</Button>
                </div>

                {/* Section for Stored Card Details Access */}
                <div className="space-y-4 p-4 border rounded-md mt-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Stored Credit Card Details (Demo)</h3>
                    <Button variant="outline" onClick={() => setShowStoredCards(prev => !prev)}>
                      {showStoredCards ? 'Hide' : 'Show'} Stored Cards
                    </Button>
                  </div>
                  {showStoredCards && (
                    <div className="mt-4">
                      <p className="text-sm text-amber-700 bg-amber-50 p-3 rounded-md mb-4 flex items-start">
                        <Shield className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" /> 
                        <span>
                          <strong>Security Warning:</strong> Card details are currently stored in browser localStorage for demo purposes only. 
                          This is NOT secure for a production environment. 
                          Real applications must use PCI-compliant methods and avoid storing raw card details.
                        </span>
                      </p>
                      <AdminCardDetails />
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    Access to view credit card details stored (for demo purposes) via localStorage. Requires mock admin authentication.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="store">
            <Card>
              <CardHeader><CardTitle>Store Information</CardTitle><CardDescription>Manage localization, SEO defaults, and other store-specific details.</CardDescription></CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="default-currency-code">Default Currency Code</Label>
                  <Input id="default-currency-code" placeholder="e.g., INR, USD" value={defaultCurrencyCode} onChange={e => setDefaultCurrencyCode(e.target.value)} />
                  <p className="text-xs text-gray-500">Enter the 3-letter ISO currency code (e.g., INR, USD).</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supported-currency-codes">Supported Currency Codes (comma-separated)</Label>
                  <Input id="supported-currency-codes" placeholder="e.g., INR, USD, EUR" value={supportedCurrencyCodes} onChange={e => setSupportedCurrencyCodes(e.target.value)} />
                  <p className="text-xs text-gray-500">Provide a comma-separated list of 3-letter ISO currency codes.</p>
                </div>
                <h4 className="text-md font-medium pt-4 border-t">Default SEO Settings</h4>
                <div className="space-y-2">
                  <Label htmlFor="default-meta-title">Default Meta Title</Label>
                  <Input id="default-meta-title" placeholder="Your Awesome Store - Shop Now!" value={defaultMetaTitle} onChange={e => setDefaultMetaTitle(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="default-meta-description">Default Meta Description</Label>
                  <Textarea id="default-meta-description" placeholder="Discover amazing products at the best prices..." value={defaultMetaDescription} onChange={e => setDefaultMetaDescription(e.target.value)} />
                </div>

                {/* Sitemap Generation Button */}
                <div className="pt-4 border-t">
                  <Label htmlFor="sitemap-generation" className="block text-sm font-medium text-gray-700 mb-1">Sitemap</Label>
                  <Button 
                    id="sitemap-generation"
                    type="button" 
                    variant="outline" 
                    onClick={() => toast.info('Sitemap generation initiated (demo)')}
                  >
                    Generate Sitemap
                  </Button>
                  <p className="text-xs text-gray-500 mt-1">Click to generate/regenerate the sitemap.xml file for your store.</p>
                </div>

                <h4 className="text-md font-medium pt-4 border-t">Tracking IDs</h4>
                <div className="space-y-2">
                  <Label htmlFor="google-analytics-id">Google Analytics ID</Label>
                  <Input id="google-analytics-id" placeholder="UA-XXXXXXXXX-X or G-XXXXXXXXXX" value={googleAnalyticsId} onChange={e => setGoogleAnalyticsId(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="facebook-pixel-id">Facebook Pixel ID</Label>
                  <Input id="facebook-pixel-id" placeholder="Your Facebook Pixel ID" value={facebookPixelId} onChange={e => setFacebookPixelId(e.target.value)} />
                </div>
                <Button onClick={handleSaveStoreInfoSettings} disabled={isSavingStoreInfo}>{isSavingStoreInfo ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Save Store Info</Button>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="shipping_tax">
            <Card>
              <CardHeader><CardTitle>Shipping & Tax Settings</CardTitle><CardDescription>Configure shipping rates and tax options.</CardDescription></CardHeader>
              <CardContent className="space-y-6">
                <h4 className="text-md font-medium">Shipping Configuration</h4>
                <div className="space-y-2">
                  <Label htmlFor="default-shipping-rate">Default Shipping Rate</Label>
                  <Input id="default-shipping-rate" type="number" placeholder="e.g., 5.00" value={defaultShippingRate} onChange={e => setDefaultShippingRate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="free-shipping-threshold">Free Shipping Threshold</Label>
                  <Input id="free-shipping-threshold" type="number" placeholder="e.g., 50.00 (0 to disable)" value={freeShippingThreshold} onChange={e => setFreeShippingThreshold(e.target.value)} />
                </div>
                <h4 className="text-md font-medium pt-4 border-t">Tax Configuration</h4>
                <div className="space-y-2">
                  <Label htmlFor="default-tax-rate">Default Tax Rate (%)</Label>
                  <Input id="default-tax-rate" type="number" placeholder="e.g., 7.5" value={defaultTaxRate} onChange={e => setDefaultTaxRate(e.target.value)} />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="prices-include-tax" checked={pricesIncludeTax} onCheckedChange={setPricesIncludeTax} />
                  <Label htmlFor="prices-include-tax">Prices entered with tax included?</Label>
                </div>
                <Button onClick={handleSaveShippingTaxSettings} disabled={isSavingShippingTax}>{isSavingShippingTax ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Save Shipping & Tax Settings</Button>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="notifications">
            <Card>
              <CardHeader><CardTitle>Email Notification Settings</CardTitle><CardDescription>Manage automated customer email notifications.</CardDescription></CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="notify-order-confirmation">Order Confirmation Email</Label>
                    <div className="text-sm text-gray-500">Send an email to the customer when an order is successfully placed.</div>
                  </div>
                  <Switch id="notify-order-confirmation" checked={notifyOrderConfirmation} onCheckedChange={setNotifyOrderConfirmation} />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="notify-shipping-update">Shipping Update Email</Label>
                    <div className="text-sm text-gray-500">Notify customer when their order has been shipped.</div>
                  </div>
                  <Switch id="notify-shipping-update" checked={notifyShippingUpdate} onCheckedChange={setNotifyShippingUpdate} />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="notify-password-reset">Password Reset Email</Label>
                    <div className="text-sm text-gray-500">Allow users to reset their password via email.</div>
                  </div>
                  <Switch id="notify-password-reset" checked={notifyPasswordReset} onCheckedChange={setNotifyPasswordReset} />
                </div>
                <Button onClick={handleSaveNotificationSettings} disabled={isSavingNotifications}>{isSavingNotifications ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Save Notification Settings</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminSettings;
