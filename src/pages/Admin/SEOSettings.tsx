import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { toast } from 'react-hot-toast';
import { 
  getGlobalSEOSettings, 
  updateGlobalSEOSettings, 
  getSitemapSettings, 
  updateSitemapSettings, 
  generateSitemap,
  getRobotsTxt,
  updateRobotsTxt
} from '@/services/seoService';
import { GlobalSEO, SitemapSettings } from '@/types/seo';
import { Badge } from '@/components/ui/badge';
import { Save, Plus, RefreshCw, FileCode, DownloadCloud } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

const SEOSettings = () => {
  const [activeTab, setActiveTab] = useState('global');
  const [globalSettings, setGlobalSettings] = useState<GlobalSEO>({
    id: '',
    siteName: '',
    titleTemplate: '',
    defaultTitle: '',
    defaultDescription: '',
    defaultKeywords: [],
    defaultOgImage: '',
    robotsTxt: ''
  });
  const [sitemapSettings, setSitemapSettings] = useState<SitemapSettings>({
    id: '',
    enabled: true,
    excludePaths: [],
    additionalUrls: [],
    lastGenerated: ''
  });
  const [robotsTxt, setRobotsTxt] = useState('');
  const [newKeyword, setNewKeyword] = useState('');
  const [newExcludePath, setNewExcludePath] = useState('');
  const [newAdditionalUrl, setNewAdditionalUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingSitemap, setIsGeneratingSitemap] = useState(false);

  // Load settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const [global, sitemap, robots] = await Promise.all([
          getGlobalSEOSettings(),
          getSitemapSettings(),
          getRobotsTxt()
        ]);
        
        setGlobalSettings(global);
        setSitemapSettings(sitemap);
        setRobotsTxt(robots);
      } catch (error) {
        console.error('Error loading SEO settings:', error);
        toast.error('Failed to load SEO settings');
      }
    };
    
    loadSettings();
  }, []);

  // Handle input changes for global settings
  const handleGlobalInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setGlobalSettings(prev => ({ ...prev, [name]: value }));
  };

  // Handle adding a keyword
  const handleAddKeyword = () => {
    if (newKeyword.trim() && !globalSettings.defaultKeywords.includes(newKeyword.trim())) {
      setGlobalSettings(prev => ({
        ...prev,
        defaultKeywords: [...prev.defaultKeywords, newKeyword.trim()]
      }));
      setNewKeyword('');
    }
  };

  // Handle removing a keyword
  const handleRemoveKeyword = (keywordToRemove: string) => {
    setGlobalSettings(prev => ({
      ...prev,
      defaultKeywords: prev.defaultKeywords.filter(keyword => keyword !== keywordToRemove)
    }));
  };

  // Handle adding exclude path
  const handleAddExcludePath = () => {
    if (newExcludePath.trim() && !sitemapSettings.excludePaths.includes(newExcludePath.trim())) {
      setSitemapSettings(prev => ({
        ...prev,
        excludePaths: [...prev.excludePaths, newExcludePath.trim()]
      }));
      setNewExcludePath('');
    }
  };

  // Handle removing exclude path
  const handleRemoveExcludePath = (pathToRemove: string) => {
    setSitemapSettings(prev => ({
      ...prev,
      excludePaths: prev.excludePaths.filter(path => path !== pathToRemove)
    }));
  };

  // Handle adding additional URL
  const handleAddAdditionalUrl = () => {
    if (newAdditionalUrl.trim() && !sitemapSettings.additionalUrls.includes(newAdditionalUrl.trim())) {
      setSitemapSettings(prev => ({
        ...prev,
        additionalUrls: [...prev.additionalUrls, newAdditionalUrl.trim()]
      }));
      setNewAdditionalUrl('');
    }
  };

  // Handle removing additional URL
  const handleRemoveAdditionalUrl = (urlToRemove: string) => {
    setSitemapSettings(prev => ({
      ...prev,
      additionalUrls: prev.additionalUrls.filter(url => url !== urlToRemove)
    }));
  };

  // Handle sitemap enabled toggle
  const handleSitemapEnabledChange = (enabled: boolean) => {
    setSitemapSettings(prev => ({
      ...prev,
      enabled
    }));
  };

  // Handle robots.txt change
  const handleRobotsTxtChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setRobotsTxt(e.target.value);
  };

  // Handle generating sitemap
  const handleGenerateSitemap = async () => {
    setIsGeneratingSitemap(true);
    try {
      const result = await generateSitemap();
      if (result.success) {
        setSitemapSettings(prev => ({
          ...prev,
          lastGenerated: result.lastGenerated
        }));
        toast.success('Sitemap generated successfully');
      }
    } catch (error) {
      console.error('Error generating sitemap:', error);
      toast.error('Failed to generate sitemap');
    } finally {
      setIsGeneratingSitemap(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      // Save settings based on active tab
      if (activeTab === 'global') {
        await updateGlobalSEOSettings(globalSettings);
        toast.success('Global SEO settings saved');
      } else if (activeTab === 'sitemap') {
        await updateSitemapSettings(sitemapSettings);
        toast.success('Sitemap settings saved');
      } else if (activeTab === 'robots') {
        await updateRobotsTxt(robotsTxt);
        toast.success('Robots.txt saved');
      }
    } catch (error) {
      console.error('Error saving SEO settings:', error);
      toast.error('Failed to save SEO settings');
    } finally {
      setIsSaving(false);
    }
  };

  // Format date string
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Never';
    
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <AdminLayout>
      <div className="container py-10">
        <h1 className="text-3xl font-bold mb-6">SEO Management</h1>
        
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>SEO Settings</CardTitle>
              <CardDescription>
                Configure your store's search engine optimization settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-6">
                  <TabsTrigger value="global">Global SEO</TabsTrigger>
                  <TabsTrigger value="sitemap">Sitemap</TabsTrigger>
                  <TabsTrigger value="robots">Robots.txt</TabsTrigger>
                </TabsList>
                
                {/* Global SEO Settings */}
                <TabsContent value="global" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="siteName">Site Name</Label>
                    <Input
                      id="siteName"
                      name="siteName"
                      value={globalSettings.siteName}
                      onChange={handleGlobalInputChange}
                      placeholder="Instant Cart"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="titleTemplate">Title Template</Label>
                    <Input
                      id="titleTemplate"
                      name="titleTemplate"
                      value={globalSettings.titleTemplate}
                      onChange={handleGlobalInputChange}
                      placeholder="%s | Instant Cart"
                    />
                    <p className="text-xs text-muted-foreground">
                      Use %s where the page title should be inserted
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="defaultTitle">Default Title</Label>
                    <Input
                      id="defaultTitle"
                      name="defaultTitle"
                      value={globalSettings.defaultTitle}
                      onChange={handleGlobalInputChange}
                      placeholder="Instant Cart - Fast and Easy Online Shopping"
                    />
                    <p className="text-xs text-muted-foreground">
                      Used when no specific title is provided
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="defaultDescription">Default Description</Label>
                    <Textarea
                      id="defaultDescription"
                      name="defaultDescription"
                      value={globalSettings.defaultDescription}
                      onChange={handleGlobalInputChange}
                      placeholder="Shop the latest products at Instant Cart. Fast delivery and secure payments."
                      rows={3}
                    />
                    <p className="text-xs text-muted-foreground">
                      Recommended: 120-160 characters. Current: {globalSettings.defaultDescription.length} characters
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="defaultKeywords">Default Keywords</Label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {globalSettings.defaultKeywords.map(keyword => (
                        <Badge key={keyword} variant="secondary" className="gap-1">
                          {keyword}
                          <button
                            type="button"
                            className="ml-1 text-gray-500 hover:text-gray-700"
                            onClick={() => handleRemoveKeyword(keyword)}
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        id="newKeyword"
                        value={newKeyword}
                        onChange={(e) => setNewKeyword(e.target.value)}
                        placeholder="Add keyword"
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddKeyword())}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleAddKeyword}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="defaultOgImage">Default Open Graph Image URL</Label>
                    <Input
                      id="defaultOgImage"
                      name="defaultOgImage"
                      value={globalSettings.defaultOgImage}
                      onChange={handleGlobalInputChange}
                      placeholder="https://instant-cart.example.com/images/og-default.jpg"
                    />
                    <p className="text-xs text-muted-foreground">
                      Image to display when sharing on social media (1200×630 pixels recommended)
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                    <div className="space-y-2">
                      <Label htmlFor="googleVerification">Google Site Verification</Label>
                      <Input
                        id="googleVerification"
                        name="googleVerification"
                        value={globalSettings.googleVerification || ''}
                        onChange={handleGlobalInputChange}
                        placeholder="Google verification code"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="bingVerification">Bing Site Verification</Label>
                      <Input
                        id="bingVerification"
                        name="bingVerification"
                        value={globalSettings.bingVerification || ''}
                        onChange={handleGlobalInputChange}
                        placeholder="Bing verification code"
                      />
                    </div>
                  </div>
                </TabsContent>
                
                {/* Sitemap Settings */}
                <TabsContent value="sitemap" className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="sitemapEnabled"
                      checked={sitemapSettings.enabled}
                      onCheckedChange={handleSitemapEnabledChange}
                    />
                    <Label htmlFor="sitemapEnabled">Enable XML Sitemap</Label>
                  </div>
                  
                  <div className="p-4 bg-gray-50 rounded-md mt-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-medium">Sitemap Status</h3>
                        <p className="text-sm text-muted-foreground">
                          Last generated: {formatDate(sitemapSettings.lastGenerated)}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleGenerateSitemap}
                          disabled={!sitemapSettings.enabled || isGeneratingSitemap}
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          {isGeneratingSitemap ? 'Generating...' : 'Generate Sitemap'}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          disabled={!sitemapSettings.lastGenerated}
                        >
                          <DownloadCloud className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2 mt-6">
                    <Label>Excluded Paths</Label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {sitemapSettings.excludePaths.map(path => (
                        <Badge key={path} variant="secondary" className="gap-1">
                          {path}
                          <button
                            type="button"
                            className="ml-1 text-gray-500 hover:text-gray-700"
                            onClick={() => handleRemoveExcludePath(path)}
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        value={newExcludePath}
                        onChange={(e) => setNewExcludePath(e.target.value)}
                        placeholder="/path/to/exclude/*"
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddExcludePath())}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleAddExcludePath}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Paths to exclude from the sitemap. Use * for wildcards, e.g., /admin/*
                    </p>
                  </div>
                  
                  <div className="space-y-2 mt-6">
                    <Label>Additional URLs</Label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {sitemapSettings.additionalUrls.map(url => (
                        <Badge key={url} variant="secondary" className="gap-1">
                          {url}
                          <button
                            type="button"
                            className="ml-1 text-gray-500 hover:text-gray-700"
                            onClick={() => handleRemoveAdditionalUrl(url)}
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        value={newAdditionalUrl}
                        onChange={(e) => setNewAdditionalUrl(e.target.value)}
                        placeholder="https://instant-cart.example.com/path"
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddAdditionalUrl())}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleAddAdditionalUrl}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Additional URLs to include in the sitemap that aren't automatically discovered
                    </p>
                  </div>
                </TabsContent>
                
                {/* Robots.txt Editor */}
                <TabsContent value="robots" className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="robotsTxt">
                        <div className="flex items-center">
                          <FileCode className="h-4 w-4 mr-2" />
                          robots.txt
                        </div>
                      </Label>
                    </div>
                    <Textarea
                      id="robotsTxt"
                      value={robotsTxt}
                      onChange={handleRobotsTxtChange}
                      rows={15}
                      className="font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground">
                      The robots.txt file tells search engines which pages they can and cannot index
                    </p>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
            
            <CardFooter className="flex justify-end">
              <Button type="submit" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Settings
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </div>
    </AdminLayout>
  );
};

export default SEOSettings; 