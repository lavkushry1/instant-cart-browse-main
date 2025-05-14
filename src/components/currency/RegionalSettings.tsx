import { useState, useEffect } from 'react';
import { useCurrency } from '@/hooks/useCurrency';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { RegionalSettings as RegionalSettingsType } from '@/types/currency';

// Country data for the dropdown
const COUNTRIES = [
  { code: 'US', name: 'United States', currencyCode: 'USD', locale: 'en-US' },
  { code: 'CA', name: 'Canada', currencyCode: 'CAD', locale: 'en-CA' },
  { code: 'GB', name: 'United Kingdom', currencyCode: 'GBP', locale: 'en-GB' },
  { code: 'EU', name: 'European Union', currencyCode: 'EUR', locale: 'en-EU' },
  { code: 'AU', name: 'Australia', currencyCode: 'AUD', locale: 'en-AU' },
  { code: 'JP', name: 'Japan', currencyCode: 'JPY', locale: 'ja-JP' },
  { code: 'IN', name: 'India', currencyCode: 'INR', locale: 'en-IN' },
  { code: 'CN', name: 'China', currencyCode: 'CNY', locale: 'zh-CN' },
  { code: 'BR', name: 'Brazil', currencyCode: 'BRL', locale: 'pt-BR' },
  { code: 'RU', name: 'Russia', currencyCode: 'RUB', locale: 'ru-RU' },
];

interface RegionalSettingsProps {
  className?: string;
  onSave?: (settings: RegionalSettingsType) => void;
}

export const RegionalSettings = ({
  className = '',
  onSave
}: RegionalSettingsProps) => {
  const { regionalSettings, updateRegionalSettings, changeCurrency } = useCurrency();
  const [settings, setSettings] = useState<RegionalSettingsType>(regionalSettings);

  useEffect(() => {
    setSettings(regionalSettings);
  }, [regionalSettings]);

  const handleCountryChange = (countryCode: string) => {
    const country = COUNTRIES.find(c => c.code === countryCode);
    if (country) {
      setSettings({
        ...settings,
        countryCode,
        locale: country.locale,
        currencyCode: country.currencyCode
      });
    }
  };

  const handleTaxRateChange = (value: string) => {
    const taxRate = parseFloat(value);
    if (!isNaN(taxRate)) {
      setSettings({
        ...settings,
        taxRate
      });
    }
  };

  const handleTaxIncludedChange = (included: boolean) => {
    setSettings({
      ...settings,
      taxIncluded: included
    });
  };

  const handleSaveSettings = async () => {
    try {
      // Update regional settings
      updateRegionalSettings(settings);
      
      // Change to the currency for this region
      if (settings.currencyCode) {
        await changeCurrency(settings.currencyCode);
      }
      
      if (onSave) {
        onSave(settings);
      }
      
      toast({
        title: "Regional settings updated",
        description: "Your regional preferences have been saved.",
      });
    } catch (error) {
      console.error('Failed to update regional settings:', error);
      toast({
        title: "Update failed",
        description: "Failed to update regional settings. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Regional Settings</CardTitle>
        <CardDescription>
          Configure your region-specific preferences for currency and taxes
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="country">Country/Region</Label>
            <Select 
              value={settings.countryCode} 
              onValueChange={handleCountryChange}
            >
              <SelectTrigger id="country">
                <SelectValue placeholder="Select your country" />
              </SelectTrigger>
              <SelectContent>
                {COUNTRIES.map((country) => (
                  <SelectItem key={country.code} value={country.code}>
                    {country.name} ({country.currencyCode})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Separator />
          
          <div className="space-y-2">
            <Label htmlFor="locale">Display Language</Label>
            <Select
              value={settings.locale}
              onValueChange={(locale) => setSettings({ ...settings, locale })}
            >
              <SelectTrigger id="locale">
                <SelectValue placeholder="Select display language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en-US">English (US)</SelectItem>
                <SelectItem value="en-GB">English (UK)</SelectItem>
                <SelectItem value="fr-FR">French</SelectItem>
                <SelectItem value="es-ES">Spanish</SelectItem>
                <SelectItem value="de-DE">German</SelectItem>
                <SelectItem value="ja-JP">Japanese</SelectItem>
                <SelectItem value="zh-CN">Chinese (Simplified)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Affects how dates, numbers, and currency values are formatted
            </p>
          </div>
          
          <Separator />
          
          <div className="space-y-2">
            <Label htmlFor="tax-rate">Tax Rate (%)</Label>
            <Input
              id="tax-rate"
              type="number"
              value={settings.taxRate || 0}
              onChange={(e) => handleTaxRateChange(e.target.value)}
              min={0}
              max={100}
              step={0.01}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="tax-included" className="text-base">Prices Include Tax</Label>
              <p className="text-sm text-muted-foreground">
                Whether product prices should include tax by default
              </p>
            </div>
            <Switch
              id="tax-included"
              checked={settings.taxIncluded}
              onCheckedChange={handleTaxIncludedChange}
            />
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleSaveSettings} className="ml-auto">
          Save Settings
        </Button>
      </CardFooter>
    </Card>
  );
}; 