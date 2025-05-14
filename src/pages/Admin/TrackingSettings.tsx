import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle, Trash2, AlertCircle, CheckCircle, Code, BarChart } from 'lucide-react';
import { 
  TrackingScript, 
  ConsentSettings, 
  ScriptPerformanceReport,
  TrackingScriptType,
  ScriptLocation,
  ScriptLoadType,
  TriggerType,
  ConsentCategory
} from '@/types/tracking';
import { 
  getAllTrackingScripts, 
  getTrackingScriptById, 
  saveTrackingScript, 
  deleteTrackingScript, 
  toggleTrackingScript,
  getConsentSettings,
  updateConsentSettings,
  getPerformanceReports
} from '@/services/trackingService';
import AdminLayout from '@/components/layout/AdminLayout';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

const TrackingSettings = () => {
  // State
  const [activeTab, setActiveTab] = useState('scripts');
  const [scripts, setScripts] = useState<TrackingScript[]>([]);
  const [consent, setConsent] = useState<ConsentSettings | null>(null);
  const [reports, setReports] = useState<ScriptPerformanceReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentScript, setCurrentScript] = useState<Partial<TrackingScript> & { id: string }>({
    id: '',
    name: '',
    description: '',
    isEnabled: false,
    scriptType: 'custom',
    location: 'head',
    loadType: 'async',
    content: '',
    triggerType: 'immediate',
    consentCategory: 'uncategorized'
  });

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [scriptsData, consentData, reportsData] = await Promise.all([
          getAllTrackingScripts(),
          getConsentSettings(),
          getPerformanceReports()
        ]);
        
        setScripts(scriptsData);
        setConsent(consentData);
        setReports(reportsData);
      } catch (error) {
        console.error('Error loading tracking data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Handlers
  const handleScriptToggle = async (id: string, isEnabled: boolean) => {
    try {
      await toggleTrackingScript(id, isEnabled);
      setScripts(prevScripts => 
        prevScripts.map(script => 
          script.id === id ? { ...script, isEnabled } : script
        )
      );
    } catch (error) {
      console.error('Error toggling script:', error);
    }
  };

  const handleDeleteScript = async (id: string) => {
    try {
      await deleteTrackingScript(id);
      setScripts(prevScripts => prevScripts.filter(script => script.id !== id));
    } catch (error) {
      console.error('Error deleting script:', error);
    }
  };

  const handleCreateOrUpdateScript = async () => {
    try {
      const updatedScript = await saveTrackingScript(currentScript);
      
      setScripts(prevScripts => {
        const exists = prevScripts.some(script => script.id === updatedScript.id);
        if (exists) {
          return prevScripts.map(script => 
            script.id === updatedScript.id ? updatedScript : script
          );
        } else {
          return [...prevScripts, updatedScript];
        }
      });
      
      setIsDialogOpen(false);
      resetCurrentScript();
    } catch (error) {
      console.error('Error saving script:', error);
    }
  };

  const handleEditScript = (script: TrackingScript) => {
    setCurrentScript({ ...script });
    setIsDialogOpen(true);
  };

  const handleNewScript = () => {
    resetCurrentScript();
    // Generate a unique ID
    setCurrentScript(prev => ({ ...prev, id: `script-${Date.now()}` }));
    setIsDialogOpen(true);
  };

  const resetCurrentScript = () => {
    setCurrentScript({
      id: '',
      name: '',
      description: '',
      isEnabled: false,
      scriptType: 'custom',
      location: 'head',
      loadType: 'async',
      content: '',
      triggerType: 'immediate',
      consentCategory: 'uncategorized'
    });
  };

  const handleConsentSettingsUpdate = async (settings: Partial<ConsentSettings>) => {
    if (!consent) return;
    
    try {
      const updatedSettings = await updateConsentSettings({
        ...consent,
        ...settings
      });
      
      setConsent(updatedSettings);
    } catch (error) {
      console.error('Error updating consent settings:', error);
    }
  };

  // Render helpers
  const getScriptTypeLabel = (type: TrackingScriptType) => {
    switch (type) {
      case 'google-analytics': return 'Google Analytics';
      case 'facebook-pixel': return 'Facebook Pixel';
      case 'google-tag-manager': return 'Google Tag Manager';
      case 'custom': return 'Custom Script';
      default: return type;
    }
  };

  const getScriptLocationLabel = (location: ScriptLocation) => {
    switch (location) {
      case 'head': return 'Head';
      case 'body-start': return 'Body Start';
      case 'body-end': return 'Body End';
      default: return location;
    }
  };

  return (
    <AdminLayout>
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Tracking Code Integration</h1>
          <p className="text-gray-500">
            Manage tracking scripts, consent settings, and monitor performance
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="scripts">Tracking Scripts</TabsTrigger>
            <TabsTrigger value="consent">Consent Settings</TabsTrigger>
            <TabsTrigger value="performance">Performance Monitoring</TabsTrigger>
          </TabsList>
          
          {/* Tracking Scripts Tab */}
          <TabsContent value="scripts">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold">Tracking Scripts</h2>
              <Button onClick={handleNewScript}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add New Script
              </Button>
            </div>
            
            {scripts.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center p-8">
                  <Code className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Tracking Scripts</h3>
                  <p className="text-gray-500 text-center mb-4">
                    You haven't added any tracking scripts yet. Add your first tracking script to start collecting analytics data.
                  </p>
                  <Button onClick={handleNewScript}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Tracking Script
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {scripts.map(script => (
                  <Card key={script.id} className={`border-l-4 ${script.isEnabled ? 'border-l-green-500' : 'border-l-gray-300'}`}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="mb-1">{script.name}</CardTitle>
                          <CardDescription>{script.description}</CardDescription>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Label htmlFor={`toggle-${script.id}`} className="sr-only">
                            Enable script
                          </Label>
                          <Switch
                            id={`toggle-${script.id}`}
                            checked={script.isEnabled}
                            onCheckedChange={(checked) => handleScriptToggle(script.id, checked)}
                          />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-3 gap-4 text-sm mb-4">
                        <div>
                          <span className="block text-gray-500 mb-1">Type</span>
                          <Badge variant="outline">{getScriptTypeLabel(script.scriptType)}</Badge>
                        </div>
                        <div>
                          <span className="block text-gray-500 mb-1">Location</span>
                          <Badge variant="outline">{getScriptLocationLabel(script.location)}</Badge>
                        </div>
                        <div>
                          <span className="block text-gray-500 mb-1">Consent Category</span>
                          <Badge variant="outline" className="capitalize">{script.consentCategory}</Badge>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 mt-4">
                        <Button variant="outline" onClick={() => handleEditScript(script)}>
                          Edit Script
                        </Button>
                        <Button variant="destructive" onClick={() => handleDeleteScript(script.id)}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
            
            {/* Script Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {currentScript.id ? `Edit ${currentScript.name}` : 'Add New Tracking Script'}
                  </DialogTitle>
                  <DialogDescription>
                    Configure your tracking script details below.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="script-name">Script Name</Label>
                      <Input
                        id="script-name"
                        value={currentScript.name}
                        onChange={(e) => setCurrentScript({ ...currentScript, name: e.target.value })}
                        placeholder="Google Analytics 4"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="script-type">Script Type</Label>
                      <Select
                        value={currentScript.scriptType}
                        onValueChange={(value) => setCurrentScript({ ...currentScript, scriptType: value as TrackingScriptType })}
                      >
                        <SelectTrigger id="script-type">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="google-analytics">Google Analytics</SelectItem>
                          <SelectItem value="facebook-pixel">Facebook Pixel</SelectItem>
                          <SelectItem value="google-tag-manager">Google Tag Manager</SelectItem>
                          <SelectItem value="custom">Custom Script</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="script-description">Description</Label>
                    <Input
                      id="script-description"
                      value={currentScript.description}
                      onChange={(e) => setCurrentScript({ ...currentScript, description: e.target.value })}
                      placeholder="Tracking for website analytics"
                    />
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="script-location">Location</Label>
                      <Select
                        value={currentScript.location}
                        onValueChange={(value) => setCurrentScript({ ...currentScript, location: value as ScriptLocation })}
                      >
                        <SelectTrigger id="script-location">
                          <SelectValue placeholder="Select location" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="head">Head</SelectItem>
                          <SelectItem value="body-start">Body Start</SelectItem>
                          <SelectItem value="body-end">Body End</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="script-load">Load Type</Label>
                      <Select
                        value={currentScript.loadType}
                        onValueChange={(value) => setCurrentScript({ ...currentScript, loadType: value as ScriptLoadType })}
                      >
                        <SelectTrigger id="script-load">
                          <SelectValue placeholder="Select load type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sync">Synchronous</SelectItem>
                          <SelectItem value="async">Asynchronous</SelectItem>
                          <SelectItem value="defer">Defer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="script-trigger">Trigger Type</Label>
                      <Select
                        value={currentScript.triggerType}
                        onValueChange={(value) => setCurrentScript({ ...currentScript, triggerType: value as TriggerType })}
                      >
                        <SelectTrigger id="script-trigger">
                          <SelectValue placeholder="Select trigger" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="immediate">Immediate</SelectItem>
                          <SelectItem value="on-consent">On Consent</SelectItem>
                          <SelectItem value="on-event">On Event</SelectItem>
                          <SelectItem value="conditional">Conditional</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="script-category">Consent Category</Label>
                    <Select
                      value={currentScript.consentCategory}
                      onValueChange={(value) => setCurrentScript({ ...currentScript, consentCategory: value as ConsentCategory })}
                    >
                      <SelectTrigger id="script-category">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="necessary">Necessary</SelectItem>
                        <SelectItem value="functional">Functional</SelectItem>
                        <SelectItem value="performance">Performance</SelectItem>
                        <SelectItem value="targeting">Targeting</SelectItem>
                        <SelectItem value="uncategorized">Uncategorized</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="script-content">Script Content</Label>
                    <Textarea
                      id="script-content"
                      value={currentScript.content}
                      onChange={(e) => setCurrentScript({ ...currentScript, content: e.target.value })}
                      placeholder="<!-- Paste your script code here -->"
                      className="font-mono text-sm"
                      rows={8}
                    />
                  </div>
                  
                  {currentScript.triggerType === 'conditional' && (
                    <div className="space-y-2">
                      <Label htmlFor="trigger-condition">Trigger Condition</Label>
                      <Input
                        id="trigger-condition"
                        value={currentScript.triggerCondition || ''}
                        onChange={(e) => setCurrentScript({ ...currentScript, triggerCondition: e.target.value })}
                        placeholder="window.innerWidth > 768"
                      />
                      <p className="text-xs text-gray-500">
                        JavaScript condition that evaluates to true/false to determine when to load the script
                      </p>
                    </div>
                  )}
                </div>
                
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="button" onClick={handleCreateOrUpdateScript}>
                    {currentScript.id && scripts.some(s => s.id === currentScript.id) 
                      ? 'Update Script' 
                      : 'Add Script'
                    }
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>
          
          {/* Consent Settings Tab */}
          <TabsContent value="consent">
            {consent && (
              <div className="space-y-8">
                <Card>
                  <CardHeader>
                    <CardTitle>Cookie Consent Banner</CardTitle>
                    <CardDescription>
                      Configure how the cookie consent banner appears to your users
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="consent-enabled" className="text-base font-medium">Enable Consent Banner</Label>
                          <p className="text-sm text-gray-500">
                            Show a cookie consent banner to users when they visit your site
                          </p>
                        </div>
                        <Switch
                          id="consent-enabled"
                          checked={consent.isEnabled}
                          onCheckedChange={(checked) => handleConsentSettingsUpdate({ isEnabled: checked })}
                        />
                      </div>
                      
                      <div className="pt-2">
                        <Label htmlFor="consent-mode" className="mb-2 block">Consent Mode</Label>
                        <Select
                          value={consent.mode}
                          onValueChange={(value) => handleConsentSettingsUpdate({ mode: value as 'opt-in' | 'opt-out' })}
                        >
                          <SelectTrigger id="consent-mode">
                            <SelectValue placeholder="Select mode" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="opt-in">Opt-in (GDPR Compliant)</SelectItem>
                            <SelectItem value="opt-out">Opt-out</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-gray-500 mt-1">
                          {consent.mode === 'opt-in' 
                            ? 'Cookies are blocked until the user gives consent (recommended for EU users)'
                            : 'Cookies are allowed until the user opts out (less privacy-focused)'}
                        </p>
                      </div>
                      
                      <div className="pt-2">
                        <Label htmlFor="cookie-expiration" className="mb-2 block">Cookie Expiration</Label>
                        <div className="flex items-center space-x-2">
                          <Input
                            id="cookie-expiration"
                            type="number"
                            min="1"
                            max="365"
                            value={consent.cookieExpiration}
                            onChange={(e) => handleConsentSettingsUpdate({ 
                              cookieExpiration: parseInt(e.target.value) || 365 
                            })}
                            className="w-24"
                          />
                          <span>days</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          How long until the user's consent expires and they need to be asked again
                        </p>
                      </div>
                      
                      <div className="pt-2">
                        <fieldset className="border rounded-md p-4">
                          <legend className="text-sm font-medium px-2">Required Categories</legend>
                          <div className="space-y-2">
                            {['necessary', 'functional', 'performance', 'targeting', 'uncategorized'].map((category) => (
                              <div key={category} className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  id={`required-${category}`}
                                  checked={consent.requiredCategories.includes(category as ConsentCategory)}
                                  onChange={(e) => {
                                    const newCategories = e.target.checked
                                      ? [...consent.requiredCategories, category as ConsentCategory]
                                      : consent.requiredCategories.filter(c => c !== category);
                                    
                                    // Always keep "necessary" as required
                                    if (!newCategories.includes('necessary')) {
                                      newCategories.push('necessary');
                                    }
                                    
                                    handleConsentSettingsUpdate({ requiredCategories: newCategories });
                                  }}
                                  disabled={category === 'necessary'} // "necessary" is always required
                                  className="rounded border-gray-300"
                                />
                                <Label 
                                  htmlFor={`required-${category}`}
                                  className={`capitalize ${category === 'necessary' ? 'opacity-60' : ''}`}
                                >
                                  {category}
                                </Label>
                              </div>
                            ))}
                          </div>
                          <p className="text-xs text-gray-500 mt-2">
                            Required categories cannot be rejected by users. "Necessary" cookies are always required.
                          </p>
                        </fieldset>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Banner Appearance</CardTitle>
                    <CardDescription>
                      Customize how the consent banner looks to your users
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="banner-position" className="mb-2 block">Banner Position</Label>
                          <Select
                            value={consent.styling?.position || 'bottom'}
                            onValueChange={(value) => handleConsentSettingsUpdate({ 
                              styling: { ...consent.styling, position: value as any } 
                            })}
                          >
                            <SelectTrigger id="banner-position">
                              <SelectValue placeholder="Select position" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="bottom">Bottom</SelectItem>
                              <SelectItem value="top">Top</SelectItem>
                              <SelectItem value="bottom-left">Bottom Left</SelectItem>
                              <SelectItem value="bottom-right">Bottom Right</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label htmlFor="banner-theme" className="mb-2 block">Banner Theme</Label>
                          <Select
                            value={consent.styling?.theme || 'light'}
                            onValueChange={(value) => handleConsentSettingsUpdate({ 
                              styling: { ...consent.styling, theme: value as 'light' | 'dark' } 
                            })}
                          >
                            <SelectTrigger id="banner-theme">
                              <SelectValue placeholder="Select theme" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="light">Light</SelectItem>
                              <SelectItem value="dark">Dark</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="accent-color" className="mb-2 block">Accent Color</Label>
                        <div className="flex items-center space-x-2">
                          <Input
                            id="accent-color"
                            type="color"
                            value={consent.styling?.accentColor || '#2563eb'}
                            onChange={(e) => handleConsentSettingsUpdate({ 
                              styling: { ...consent.styling, accentColor: e.target.value } 
                            })}
                            className="w-12 h-8 p-1"
                          />
                          <Input
                            type="text"
                            value={consent.styling?.accentColor || '#2563eb'}
                            onChange={(e) => handleConsentSettingsUpdate({ 
                              styling: { ...consent.styling, accentColor: e.target.value } 
                            })}
                            className="w-36"
                            placeholder="#2563eb"
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Banner Text</CardTitle>
                    <CardDescription>
                      Customize the text displayed in the consent banner
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="banner-title" className="mb-2 block">Banner Title</Label>
                        <Input
                          id="banner-title"
                          value={consent.customText?.title || 'Cookie Consent'}
                          onChange={(e) => handleConsentSettingsUpdate({ 
                            customText: { ...consent.customText, title: e.target.value } 
                          })}
                          placeholder="Cookie Consent"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="banner-description" className="mb-2 block">Banner Description</Label>
                        <Textarea
                          id="banner-description"
                          value={consent.customText?.description || ''}
                          onChange={(e) => handleConsentSettingsUpdate({ 
                            customText: { ...consent.customText, description: e.target.value } 
                          })}
                          placeholder="We use cookies to enhance your browsing experience..."
                          rows={3}
                        />
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="accept-button" className="mb-2 block">Accept Button</Label>
                          <Input
                            id="accept-button"
                            value={consent.customText?.acceptButton || 'Accept All'}
                            onChange={(e) => handleConsentSettingsUpdate({ 
                              customText: { ...consent.customText, acceptButton: e.target.value } 
                            })}
                            placeholder="Accept All"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="reject-button" className="mb-2 block">Reject Button</Label>
                          <Input
                            id="reject-button"
                            value={consent.customText?.rejectButton || 'Reject All'}
                            onChange={(e) => handleConsentSettingsUpdate({ 
                              customText: { ...consent.customText, rejectButton: e.target.value } 
                            })}
                            placeholder="Reject All"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="settings-button" className="mb-2 block">Settings Button</Label>
                          <Input
                            id="settings-button"
                            value={consent.customText?.settingsButton || 'Customize'}
                            onChange={(e) => handleConsentSettingsUpdate({ 
                              customText: { ...consent.customText, settingsButton: e.target.value } 
                            })}
                            placeholder="Customize"
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
          
          {/* Performance Monitoring Tab */}
          <TabsContent value="performance">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Script Performance Overview</CardTitle>
                  <CardDescription>
                    Monitor the performance impact of your tracking scripts
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {reports.length === 0 ? (
                    <div className="text-center py-8">
                      <BarChart className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium mb-2">No Performance Data</h3>
                      <p className="text-gray-500 max-w-md mx-auto">
                        Performance data will be collected as users interact with your site.
                        Enable scripts and check back later for insights.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {reports.map((report) => {
                        // Find the script for this report
                        const script = scripts.find(s => s.id === report.scriptId);
                        
                        if (!script) return null;
                        
                        // Calculate a color based on impact score
                        const getImpactColor = (score: number) => {
                          if (score <= 3) return 'text-green-500';
                          if (score <= 7) return 'text-amber-500';
                          return 'text-red-500';
                        };
                        
                        return (
                          <div key={`${report.scriptId}-${report.date}`} className="border-b pb-4 last:border-b-0 last:pb-0">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h4 className="font-medium">{script.name}</h4>
                                <p className="text-sm text-gray-500">{new Date(report.date).toLocaleString()}</p>
                              </div>
                              <Badge className={getImpactColor(report.impactScore)}>
                                Impact: {report.impactScore}/10
                              </Badge>
                            </div>
                            
                            <div className="grid md:grid-cols-2 gap-4 mt-4">
                              <div>
                                <div className="flex justify-between text-sm mb-1">
                                  <span>Load Time</span>
                                  <span>{report.loadTime}ms</span>
                                </div>
                                <Progress value={(report.loadTime / 1000) * 100} max={100} className="h-2" />
                              </div>
                              
                              <div>
                                <div className="flex justify-between text-sm mb-1">
                                  <span>Execution Time</span>
                                  <span>{report.executionTime}ms</span>
                                </div>
                                <Progress value={(report.executionTime / 500) * 100} max={100} className="h-2" />
                              </div>
                            </div>
                            
                            {report.errors.length > 0 && (
                              <div className="mt-4">
                                <Alert variant="destructive">
                                  <AlertCircle className="h-4 w-4" />
                                  <AlertTitle>Script Errors</AlertTitle>
                                  <AlertDescription>
                                    <ul className="list-disc pl-5 mt-2 text-sm">
                                      {report.errors.map((error, idx) => (
                                        <li key={idx}>{error.message}</li>
                                      ))}
                                    </ul>
                                  </AlertDescription>
                                </Alert>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Performance Guidelines</CardTitle>
                  <CardDescription>
                    Best practices for optimal tracking script performance
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                      <div>
                        <h4 className="font-medium">Use Asynchronous Loading</h4>
                        <p className="text-sm text-gray-500">
                          Use async or defer attributes to prevent scripts from blocking page rendering.
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                      <div>
                        <h4 className="font-medium">Minimize Script Size</h4>
                        <p className="text-sm text-gray-500">
                          Reduce the size of your scripts to improve loading time. Use minified versions when available.
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                      <div>
                        <h4 className="font-medium">Consolidate Trackers</h4>
                        <p className="text-sm text-gray-500">
                          Consider using a tag manager to reduce multiple script requests.
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                      <div>
                        <h4 className="font-medium">Load Scripts at the Right Time</h4>
                        <p className="text-sm text-gray-500">
                          Use conditional or on-event loading to only load scripts when needed.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default TrackingSettings;