import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useConsent } from '@/hooks/useConsent';
import { ConsentCategory } from '@/types/tracking';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

const ConsentBanner = () => {
  const { 
    consentSettings, 
    showConsentBanner, 
    acceptAll, 
    rejectAll, 
    updateCategoryConsent, 
    saveConsent, 
    consentedCategories 
  } = useConsent();
  
  const [showCustomizeOptions, setShowCustomizeOptions] = useState(false);
  
  if (!consentSettings || !showConsentBanner) {
    return null;
  }
  
  const getBannerPositionClasses = () => {
    switch (consentSettings.styling?.position) {
      case 'top':
        return 'top-0 left-0 right-0';
      case 'bottom-left':
        return 'bottom-4 left-4 max-w-md';
      case 'bottom-right':
        return 'bottom-4 right-4 max-w-md';
      case 'bottom':
      default:
        return 'bottom-0 left-0 right-0';
    }
  };
  
  const categories: { 
    id: ConsentCategory; 
    title: string; 
    description: string; 
    required: boolean;
  }[] = [
    {
      id: 'necessary',
      title: consentSettings.customText?.categories?.necessary?.title || 'Necessary Cookies',
      description: consentSettings.customText?.categories?.necessary?.description || 
        'These cookies are required for the website to function properly.',
      required: true
    },
    {
      id: 'functional',
      title: consentSettings.customText?.categories?.functional?.title || 'Functional Cookies',
      description: consentSettings.customText?.categories?.functional?.description || 
        'These cookies enable enhanced functionality and personalization.',
      required: consentSettings.requiredCategories.includes('functional')
    },
    {
      id: 'performance',
      title: consentSettings.customText?.categories?.performance?.title || 'Performance Cookies',
      description: consentSettings.customText?.categories?.performance?.description || 
        'These cookies help us understand how visitors interact with our website.',
      required: consentSettings.requiredCategories.includes('performance')
    },
    {
      id: 'targeting',
      title: consentSettings.customText?.categories?.targeting?.title || 'Targeting Cookies',
      description: consentSettings.customText?.categories?.targeting?.description || 
        'These cookies are used to deliver relevant ads and track conversions.',
      required: consentSettings.requiredCategories.includes('targeting')
    },
    {
      id: 'uncategorized',
      title: consentSettings.customText?.categories?.uncategorized?.title || 'Uncategorized Cookies',
      description: consentSettings.customText?.categories?.uncategorized?.description || 
        'These cookies have not been categorized yet.',
      required: consentSettings.requiredCategories.includes('uncategorized')
    }
  ];
  
  return (
    <div 
      className={cn(
        'fixed z-50 p-4 md:p-6 bg-white dark:bg-gray-900 shadow-lg border rounded-lg',
        getBannerPositionClasses(),
        consentSettings.styling?.theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'
      )}
    >
      {!showCustomizeOptions ? (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold">
              {consentSettings.customText?.title || 'Cookie Consent'}
            </h3>
            <p className="mt-2 text-sm opacity-90">
              {consentSettings.customText?.description || 
                'We use cookies to enhance your browsing experience, serve personalized ads or content, and analyze our traffic.'}
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button 
              onClick={acceptAll}
              style={{ 
                backgroundColor: consentSettings.styling?.accentColor || '#2563eb',
                borderColor: consentSettings.styling?.accentColor || '#2563eb' 
              }}
            >
              {consentSettings.customText?.acceptButton || 'Accept All'}
            </Button>
            
            <Button 
              variant="outline" 
              onClick={rejectAll}
            >
              {consentSettings.customText?.rejectButton || 'Reject All'}
            </Button>
            
            <Button 
              variant="ghost" 
              onClick={() => setShowCustomizeOptions(true)}
            >
              {consentSettings.customText?.settingsButton || 'Customize'}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold">
              Customize Cookie Preferences
            </h3>
            <p className="mt-2 text-sm opacity-90">
              Select which cookies you want to accept. Required cookies cannot be disabled.
            </p>
          </div>
          
          <div className="space-y-4">
            {categories.map((category) => (
              <div key={category.id} className="flex items-start gap-3 pb-3 border-b">
                <div className="pt-0.5">
                  <Checkbox 
                    id={`consent-${category.id}`}
                    checked={consentedCategories.includes(category.id)}
                    onCheckedChange={(checked) => {
                      updateCategoryConsent(category.id, !!checked);
                    }}
                    disabled={category.required}
                  />
                </div>
                <div>
                  <Label 
                    htmlFor={`consent-${category.id}`}
                    className="font-medium"
                  >
                    {category.title}
                    {category.required && (
                      <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                        (Required)
                      </span>
                    )}
                  </Label>
                  <p className="text-sm opacity-80 mt-1">
                    {category.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowCustomizeOptions(false)}
            >
              Back
            </Button>
            <Button 
              onClick={saveConsent}
              style={{ 
                backgroundColor: consentSettings.styling?.accentColor || '#2563eb',
                borderColor: consentSettings.styling?.accentColor || '#2563eb' 
              }}
            >
              Save Preferences
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConsentBanner; 