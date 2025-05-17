import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '@/components/layout/AdminLayout';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'react-hot-toast';
import { Theme, SeasonalTheme } from '@/types/theme';
import {
  getAllThemes,
  getActiveTheme,
  activateTheme,
  updateThemeSettings,
  saveTheme,
  getAllSeasonalThemes,
  saveSeasonalTheme,
  activateSeasonalTheme,
  deactivateSeasonalTheme,
} from '@/services/themeService';
import {
  Check,
  Eye,
  PaintBucket,
  Calendar,
  Sparkles,
  Palette,
  Type,
  Layout,
  Smartphone,
  Code,
  Save,
  Trash2,
  Plus,
} from 'lucide-react';

// Color picker component from local UI library
const ColorPicker = ({ value, onChange }: { value: string; onChange: (value: string) => void }) => {
  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-10 h-10 rounded cursor-pointer"
      />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="font-mono"
      />
    </div>
  );
};

const ThemeSettings = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('themes');
  const [themes, setThemes] = useState<Theme[]>([]);
  const [selectedThemeId, setSelectedThemeId] = useState<string>('');
  const [selectedTheme, setSelectedTheme] = useState<Theme | null>(null);
  const [activeThemeId, setActiveThemeId] = useState<string>('');
  const [seasonalThemes, setSeasonalThemes] = useState<SeasonalTheme[]>([]);
  const [selectedSeasonalTheme, setSelectedSeasonalTheme] = useState<SeasonalTheme | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState('colors');

  // Load themes and active theme
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [allThemes, active, allSeasonalThemes] = await Promise.all([
          getAllThemes(),
          getActiveTheme(),
          getAllSeasonalThemes(),
        ]);

        setThemes(allThemes);
        setActiveThemeId(active.id);
        setSeasonalThemes(allSeasonalThemes);

        // Select the active theme by default
        if (active && !selectedThemeId) {
          setSelectedThemeId(active.id);
          setSelectedTheme(active);
        }
      } catch (error) {
        console.error('Error loading theme data:', error);
        toast.error('Failed to load themes');
      }
    };

    fetchData();
  }, [selectedThemeId]);

  // Handle theme selection
  const handleThemeSelect = (themeId: string) => {
    const theme = themes.find((t) => t.id === themeId);
    setSelectedThemeId(themeId);
    setSelectedTheme(theme || null);
    setActiveSettingsTab('colors');
  };

  // Handle activating a theme
  const handleActivateTheme = async () => {
    if (!selectedThemeId) return;

    try {
      const activatedTheme = await activateTheme(selectedThemeId);
      setActiveThemeId(activatedTheme.id);
      toast.success(`Theme "${activatedTheme.name}" activated`);
    } catch (error) {
      console.error('Error activating theme:', error);
      toast.error('Failed to activate theme');
    }
  };

  // Handle saving theme changes
  const handleSaveTheme = async () => {
    if (!selectedTheme) return;

    setIsSaving(true);
    try {
      await updateThemeSettings(selectedTheme.id, selectedTheme.settings);
      toast.success('Theme settings saved');
    } catch (error) {
      console.error('Error saving theme:', error);
      toast.error('Failed to save theme');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle updating theme settings
  const handleSettingChange = (category: string, key: string, value: string | boolean) => {
    if (!selectedTheme) return;

    // Handle nested properties
    if (category === 'fontSize') {
      setSelectedTheme({
        ...selectedTheme,
        settings: {
          ...selectedTheme.settings,
          fontSize: {
            ...selectedTheme.settings.fontSize,
            [key]: value,
          },
        },
      });
    } else {
      setSelectedTheme({
        ...selectedTheme,
        settings: {
          ...selectedTheme.settings,
          [key]: value,
        },
      });
    }
  };

  // Render theme cards
  const renderThemeCards = () => {
    return themes.map((theme) => (
      <Card
        key={theme.id}
        className={`cursor-pointer transition-all hover:shadow-md ${
          selectedThemeId === theme.id ? 'ring-2 ring-primary' : ''
        }`}
        onClick={() => handleThemeSelect(theme.id)}
      >
        <div className="relative aspect-video overflow-hidden rounded-t-lg">
          <img
            src={theme.thumbnail}
            alt={theme.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/placeholder.svg';
            }}
          />
          {theme.id === activeThemeId && (
            <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center">
              <Check className="w-3 h-3 mr-1" />
              Active
            </div>
          )}
        </div>
        <CardContent className="p-4">
          <h3 className="font-medium text-lg">{theme.name}</h3>
          <p className="text-sm text-muted-foreground">{theme.description}</p>
        </CardContent>
      </Card>
    ));
  };

  // Render settings tabs based on the active settings tab
  const renderSettingsContent = () => {
    if (!selectedTheme) return null;

    const { settings } = selectedTheme;

    switch (activeSettingsTab) {
      case 'colors':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium">Colors</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="primaryColor">Primary Color</Label>
                <ColorPicker
                  value={settings.primaryColor}
                  onChange={(value) => handleSettingChange('colors', 'primaryColor', value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="secondaryColor">Secondary Color</Label>
                <ColorPicker
                  value={settings.secondaryColor}
                  onChange={(value) => handleSettingChange('colors', 'secondaryColor', value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="accentColor">Accent Color</Label>
                <ColorPicker
                  value={settings.accentColor}
                  onChange={(value) => handleSettingChange('colors', 'accentColor', value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="backgroundColor">Background Color</Label>
                <ColorPicker
                  value={settings.backgroundColor}
                  onChange={(value) => handleSettingChange('colors', 'backgroundColor', value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="textColor">Text Color</Label>
                <ColorPicker
                  value={settings.textColor}
                  onChange={(value) => handleSettingChange('colors', 'textColor', value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="buttonColor">Button Color</Label>
                <ColorPicker
                  value={settings.buttonColor}
                  onChange={(value) => handleSettingChange('colors', 'buttonColor', value)}
                />
              </div>
            </div>
          </div>
        );

      case 'typography':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium">Typography</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="headingFont">Heading Font</Label>
                <Input
                  id="headingFont"
                  value={settings.headingFont}
                  onChange={(e) => handleSettingChange('typography', 'headingFont', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bodyFont">Body Font</Label>
                <Input
                  id="bodyFont"
                  value={settings.bodyFont}
                  onChange={(e) => handleSettingChange('typography', 'bodyFont', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fontSizeBase">Base Font Size</Label>
                <Input
                  id="fontSizeBase"
                  value={settings.fontSize.base}
                  onChange={(e) => handleSettingChange('fontSize', 'base', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fontSizeH1">H1 Font Size</Label>
                <Input
                  id="fontSizeH1"
                  value={settings.fontSize.h1}
                  onChange={(e) => handleSettingChange('fontSize', 'h1', e.target.value)}
                />
              </div>
            </div>
          </div>
        );

      case 'layout':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium">Layout</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="containerWidth">Container Width</Label>
                <Input
                  id="containerWidth"
                  value={settings.containerWidth}
                  onChange={(e) => handleSettingChange('layout', 'containerWidth', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="borderRadius">Border Radius</Label>
                <Input
                  id="borderRadius"
                  value={settings.borderRadius}
                  onChange={(e) => handleSettingChange('layout', 'borderRadius', e.target.value)}
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="headerLayout">Header Layout</Label>
                <Select
                  value={settings.headerLayout}
                  onValueChange={(value) => handleSettingChange('layout', 'headerLayout', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select header layout" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default</SelectItem>
                    <SelectItem value="centered">Centered</SelectItem>
                    <SelectItem value="minimal">Minimal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );

      case 'custom-css':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Custom CSS</h3>
            <p className="text-sm text-muted-foreground">
              Add custom CSS to further customize your theme. This will be added to the global styles.
            </p>
            <Textarea
              value={settings.customCSS}
              onChange={(e) => handleSettingChange('customCSS', 'customCSS', e.target.value)}
              className="font-mono text-sm"
              rows={15}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <AdminLayout>
      <div className="container py-10">
        <h1 className="text-3xl font-bold mb-6">Theme Management</h1>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="themes">Themes</TabsTrigger>
            <TabsTrigger value="seasonal">Seasonal Themes</TabsTrigger>
          </TabsList>

          {/* Themes Tab */}
          <TabsContent value="themes">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {renderThemeCards()}
            </div>

            {selectedTheme && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>{selectedTheme.name}</CardTitle>
                    <CardDescription>
                      Customize the appearance of your store
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedThemeId !== activeThemeId && (
                      <Button onClick={handleActivateTheme}>
                        <Check className="mr-2 h-4 w-4" />
                        Activate Theme
                      </Button>
                    )}
                    <Button variant="outline" onClick={() => setIsPreviewMode(!isPreviewMode)}>
                      <Eye className="mr-2 h-4 w-4" />
                      {isPreviewMode ? 'Exit Preview' : 'Preview'}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <Tabs value={activeSettingsTab} onValueChange={setActiveSettingsTab}>
                    <TabsList className="mb-6">
                      <TabsTrigger value="colors">
                        <Palette className="h-4 w-4 mr-2" />
                        Colors
                      </TabsTrigger>
                      <TabsTrigger value="typography">
                        <Type className="h-4 w-4 mr-2" />
                        Typography
                      </TabsTrigger>
                      <TabsTrigger value="layout">
                        <Layout className="h-4 w-4 mr-2" />
                        Layout
                      </TabsTrigger>
                      <TabsTrigger value="custom-css">
                        <Code className="h-4 w-4 mr-2" />
                        Custom CSS
                      </TabsTrigger>
                    </TabsList>

                    <div className="space-y-8">{renderSettingsContent()}</div>
                  </Tabs>
                </CardContent>
                <CardFooter className="flex justify-end">
                  <Button onClick={handleSaveTheme} disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            )}
          </TabsContent>

          {/* Seasonal Themes Tab */}
          <TabsContent value="seasonal">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-medium">Seasonal Themes</h2>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Seasonal Theme
                </Button>
              </div>

              {seasonalThemes.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {seasonalThemes.map((theme) => (
                    <Card key={theme.id}>
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <Sparkles className="h-5 w-5 mr-2 text-primary" />
                          {theme.name}
                          {theme.isActive && (
                            <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                              Active
                            </span>
                          )}
                        </CardTitle>
                        <CardDescription>{theme.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-center text-sm">
                            <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                            <span>
                              {new Date(theme.startDate).toLocaleDateString()} to{' '}
                              {new Date(theme.endDate).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex items-center text-sm">
                            <PaintBucket className="h-4 w-4 mr-2 text-muted-foreground" />
                            <span>Based on: {theme.themeId}</span>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="flex justify-end gap-2">
                        {theme.isActive ? (
                          <Button variant="outline" onClick={() => deactivateSeasonalTheme(theme.id)}>
                            Deactivate
                          </Button>
                        ) : (
                          <Button onClick={() => activateSeasonalTheme(theme.id)}>
                            <Sparkles className="h-4 w-4 mr-2" />
                            Activate
                          </Button>
                        )}
                        <Button variant="outline">
                          Edit
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="p-8 text-center">
                  <p className="text-muted-foreground">No seasonal themes added yet.</p>
                  <Button className="mt-4">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Seasonal Theme
                  </Button>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default ThemeSettings; 