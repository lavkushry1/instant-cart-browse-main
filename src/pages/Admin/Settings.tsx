import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, ShoppingBag, CreditCard, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

// Firebase Client SDK imports for Cloud Functions
import { functionsClient } from '@/lib/firebaseClient'; 
import { httpsCallable, HttpsCallable, HttpsCallableResult } from 'firebase/functions'; 
import { SiteSettings } from '@/services/adminService'; // Shared type from backend service

let getSiteSettingsFunction: HttpsCallable<void, HttpsCallableResult<{ success: boolean; settings?: SiteSettings; error?: string }>>;
let updateSiteSettingsFunction: HttpsCallable<Partial<SiteSettings>, HttpsCallableResult<{ success: boolean; settings?: SiteSettings; error?: string }>>;

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
const callFallbackMock = async (functionName: string, data?: any): Promise<HttpsCallableResult<{ success: boolean; settings?: any; error?: string; message?: string}>> => {
    console.warn(`Using MOCK for Cloud Function: ${functionName} with data:`, data);
    await new Promise(resolve => setTimeout(resolve, 700)); 
    if (functionName === 'admin-getSiteSettingsCF') {
        const storedSettings = localStorage.getItem('adminSiteSettingsMock'); 
        if (storedSettings) return { data: { success: true, settings: JSON.parse(storedSettings) } };
        return { data: { success: true, settings: { storeName: "Default Mock Store", paymentGatewayKeys: { upiVpa: 'default@upi_mock' } } } };
    }
    if (functionName === 'admin-updateSiteSettingsCF') {
        const currentSettings = JSON.parse(localStorage.getItem('adminSiteSettingsMock') || '{}');
        const updatedData = { ...currentSettings, ...data };
        if (data && data.paymentGatewayKeys) {
            updatedData.paymentGatewayKeys = { ...(currentSettings.paymentGatewayKeys || {}), ...data.paymentGatewayKeys };
        }
        localStorage.setItem('adminSiteSettingsMock', JSON.stringify(updatedData));
        return { data: { success: true, settings: updatedData } };
    }
    return { data: { success: false, error: 'Unknown mock function' } };
};

const AdminSettings = () => {
  const [storeName, setStoreName] = useState('');
  const [storeDescription, setStoreDescription] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [upiId, setUpiId] = useState('');
  const [isSavingGeneral, setIsSavingGeneral] = useState(false);
  const [isSavingUpi, setIsSavingUpi] = useState(false);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);

  const fetchSettings = useCallback(async () => {
    setIsLoadingSettings(true);
    try {
      const result = getSiteSettingsFunction 
        ? await getSiteSettingsFunction() 
        : await callFallbackMock('admin-getSiteSettingsCF');

      if (result.data.success && result.data.settings) {
        const settings = result.data.settings as SiteSettings; // Cast to specific type
        setStoreName(settings.storeName || '');
        setStoreDescription(settings.storeDescription || '');
        setContactEmail(settings.contactEmail || '');
        setContactPhone(settings.contactPhone || '');
        setMaintenanceMode(settings.maintenanceMode || false);
        setUpiId(settings.paymentGatewayKeys?.upiVpa || '');
        if(settings.paymentGatewayKeys?.upiVpa) localStorage.setItem('storeUpiId', settings.paymentGatewayKeys.upiVpa);
      } else {
        toast.error(result.data.error || "Failed to load site settings.");
      }
    } catch (error: any) {
      toast.error(`Failed to load site settings: ${error.message || 'Unknown error'}`);
      console.error("Error loading settings:", error);
    }
    setIsLoadingSettings(false);
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const handleSaveGeneralSettings = async () => {
    setIsSavingGeneral(true);
    const settingsToSave: Partial<SiteSettings> = { storeName, storeDescription, contactEmail, contactPhone, maintenanceMode };
    try {
      const result = updateSiteSettingsFunction 
        ? await updateSiteSettingsFunction(settingsToSave) 
        : await callFallbackMock('admin-updateSiteSettingsCF', settingsToSave);

      if (result.data.success) {
        toast.success("General settings saved successfully!");
        if (result.data.settings) { /* Optionally update state from result */ }
      } else {
        toast.error(result.data.error || "Failed to save general settings.");
      }
    } catch (error: any) {
      toast.error(`Failed to save general settings: ${error.message || 'Unknown error'}`);
    }
    setIsSavingGeneral(false);
  };

  const handleSavePaymentSettings = async () => {
    if (!upiId.trim()) { toast.error("UPI ID cannot be empty."); return; }
    setIsSavingUpi(true);
    const settingsToUpdate: Partial<SiteSettings> = { paymentGatewayKeys: { upiVpa: upiId.trim() } };
    try {
      const result = updateSiteSettingsFunction 
        ? await updateSiteSettingsFunction(settingsToUpdate) 
        : await callFallbackMock('admin-updateSiteSettingsCF', settingsToUpdate);

      if (result.data.success && result.data.settings?.paymentGatewayKeys?.upiVpa) {
        toast.success("UPI ID saved successfully!");
        localStorage.setItem('storeUpiId', result.data.settings.paymentGatewayKeys.upiVpa);
        setUpiId(result.data.settings.paymentGatewayKeys.upiVpa);
      } else {
        toast.error(result.data.error || "Failed to save UPI ID.");
      }
    } catch (error: any) {
      toast.error(`Failed to save UPI ID: ${error.message || 'Unknown error'}`);
      console.error("Error saving UPI ID:", error);
    }
    setIsSavingUpi(false);
  };

  if (isLoadingSettings) return <AdminLayout><div className="p-6 text-center"><Loader2 className="h-6 w-6 animate-spin inline mr-2" />Loading settings...</div></AdminLayout>;

  return (
    <AdminLayout>
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">Settings</h1>
        <Tabs defaultValue="general">
          <TabsList className="mb-6 grid w-full grid-cols-3 md:grid-cols-4 lg:grid-cols-7">
            <TabsTrigger value="general"><Settings className="h-4 w-4 mr-2 inline" />General</TabsTrigger>
            <TabsTrigger value="payments"><CreditCard className="h-4 w-4 mr-2 inline" />Payments</TabsTrigger>
            <TabsTrigger value="store"><ShoppingBag className="h-4 w-4 mr-2 inline" />Store Info</TabsTrigger>
          </TabsList>
          <TabsContent value="general">
            <Card>
              <CardHeader><CardTitle>General Settings</CardTitle><CardDescription>Manage your store's general settings.</CardDescription></CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2"><Label htmlFor="store-name">Store Name</Label><Input id="store-name" value={storeName} onChange={e => setStoreName(e.target.value)} /></div>
                <div className="space-y-2"><Label htmlFor="store-description">Store Description</Label><Textarea id="store-description" value={storeDescription} onChange={e => setStoreDescription(e.target.value)} /></div>
                <div className="space-y-2"><Label htmlFor="contact-email">Contact Email</Label><Input id="contact-email" type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)} /></div>
                <div className="space-y-2"><Label htmlFor="contact-phone">Contact Phone</Label><Input id="contact-phone" type="tel" value={contactPhone} onChange={e => setContactPhone(e.target.value)} /></div>
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
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="store">
            <Card>
              <CardHeader><CardTitle>Store Information</CardTitle><CardDescription>Manage other store-specific details.</CardDescription></CardHeader>
              <CardContent><p className="text-gray-500">Configure shipping, taxes, etc. here.</p></CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminSettings;
