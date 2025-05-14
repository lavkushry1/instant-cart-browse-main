import { TrackingScript, ConsentSettings, ScriptPerformanceReport, ConsentCategory, ScriptLocation } from '@/types/tracking';

// Default tracking scripts
const defaultScripts: TrackingScript[] = [
  {
    id: 'ga4',
    name: 'Google Analytics 4',
    description: 'Google Analytics 4 tracking script',
    isEnabled: false,
    scriptType: 'google-analytics',
    location: 'head',
    loadType: 'async',
    content: `<!-- Google Analytics GA4 -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-EXAMPLE"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-EXAMPLE');
</script>`,
    triggerType: 'on-consent',
    consentCategory: 'performance',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'fb-pixel',
    name: 'Facebook Pixel',
    description: 'Facebook Pixel for conversion tracking',
    isEnabled: false,
    scriptType: 'facebook-pixel',
    location: 'head',
    loadType: 'async',
    content: `<!-- Facebook Pixel Code -->
<script>
  !function(f,b,e,v,n,t,s)
  {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};
  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
  n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];
  s.parentNode.insertBefore(t,s)}(window, document,'script',
  'https://connect.facebook.net/en_US/fbevents.js');
  fbq('init', 'EXAMPLE');
  fbq('track', 'PageView');
</script>
<noscript><img height="1" width="1" style="display:none"
  src="https://www.facebook.com/tr?id=EXAMPLE&ev=PageView&noscript=1"
/></noscript>
<!-- End Facebook Pixel Code -->`,
    triggerType: 'on-consent',
    consentCategory: 'targeting',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'gtm',
    name: 'Google Tag Manager',
    description: 'Google Tag Manager container',
    isEnabled: false,
    scriptType: 'google-tag-manager',
    location: 'head',
    loadType: 'async',
    content: `<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-EXAMPLE');</script>
<!-- End Google Tag Manager -->`,
    triggerType: 'immediate',
    consentCategory: 'necessary',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

// Default consent settings
const defaultConsentSettings: ConsentSettings = {
  id: 'default',
  isEnabled: true,
  mode: 'opt-in',
  requiredCategories: ['necessary'],
  cookieExpiration: 365,
  customText: {
    title: 'Cookie Consent',
    description: 'We use cookies to enhance your browsing experience, serve personalized ads or content, and analyze our traffic. By clicking "Accept All", you consent to our use of cookies.',
    acceptButton: 'Accept All',
    rejectButton: 'Reject All',
    settingsButton: 'Customize',
    categories: {
      necessary: {
        title: 'Necessary Cookies',
        description: 'These cookies are required for the website to function properly. They cannot be turned off.'
      },
      functional: {
        title: 'Functional Cookies',
        description: 'These cookies enable enhanced functionality and personalization.'
      },
      performance: {
        title: 'Performance Cookies',
        description: 'These cookies help us understand how visitors interact with our website.'
      },
      targeting: {
        title: 'Targeting Cookies',
        description: 'These cookies are used to deliver relevant ads and track conversions.'
      },
      uncategorized: {
        title: 'Uncategorized Cookies',
        description: 'These cookies have not been categorized yet.'
      }
    }
  },
  styling: {
    position: 'bottom',
    theme: 'light',
    accentColor: '#2563eb'
  }
};

// In-memory storage
let trackingScripts = [...defaultScripts];
let consentSettings: ConsentSettings = { ...defaultConsentSettings };
let performanceReports: ScriptPerformanceReport[] = [];

/**
 * Get all tracking scripts
 */
export const getAllTrackingScripts = async (): Promise<TrackingScript[]> => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(trackingScripts);
    }, 300);
  });
};

/**
 * Get a tracking script by ID
 */
export const getTrackingScriptById = async (id: string): Promise<TrackingScript | null> => {
  return new Promise(resolve => {
    setTimeout(() => {
      const script = trackingScripts.find(s => s.id === id);
      resolve(script || null);
    }, 300);
  });
};

/**
 * Create or update a tracking script
 */
export const saveTrackingScript = async (script: Partial<TrackingScript> & { id: string }): Promise<TrackingScript> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const scriptIndex = trackingScripts.findIndex(s => s.id === script.id);
      
      if (scriptIndex === -1) {
        // Create new script
        const newScript: TrackingScript = {
          id: script.id,
          name: script.name || 'New Script',
          description: script.description || '',
          isEnabled: script.isEnabled ?? false,
          scriptType: script.scriptType || 'custom',
          location: script.location || 'head',
          loadType: script.loadType || 'async',
          content: script.content || '',
          triggerType: script.triggerType || 'immediate',
          triggerCondition: script.triggerCondition,
          attributes: script.attributes,
          consentCategory: script.consentCategory || 'uncategorized',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        trackingScripts.push(newScript);
        resolve(newScript);
      } else {
        // Update existing script
        const updatedScript: TrackingScript = {
          ...trackingScripts[scriptIndex],
          ...script,
          updatedAt: new Date().toISOString()
        };
        
        trackingScripts[scriptIndex] = updatedScript;
        resolve(updatedScript);
      }
    }, 300);
  });
};

/**
 * Delete a tracking script
 */
export const deleteTrackingScript = async (id: string): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const scriptIndex = trackingScripts.findIndex(s => s.id === id);
      
      if (scriptIndex === -1) {
        reject(new Error(`Tracking script with ID ${id} not found`));
        return;
      }
      
      // Remove script
      trackingScripts = trackingScripts.filter(s => s.id !== id);
      
      resolve(true);
    }, 300);
  });
};

/**
 * Toggle a tracking script's enabled status
 */
export const toggleTrackingScript = async (id: string, isEnabled: boolean): Promise<TrackingScript> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const scriptIndex = trackingScripts.findIndex(s => s.id === id);
      
      if (scriptIndex === -1) {
        reject(new Error(`Tracking script with ID ${id} not found`));
        return;
      }
      
      // Update script
      trackingScripts[scriptIndex] = {
        ...trackingScripts[scriptIndex],
        isEnabled,
        updatedAt: new Date().toISOString()
      };
      
      resolve(trackingScripts[scriptIndex]);
    }, 300);
  });
};

/**
 * Get consent settings
 */
export const getConsentSettings = async (): Promise<ConsentSettings> => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(consentSettings);
    }, 300);
  });
};

/**
 * Update consent settings
 */
export const updateConsentSettings = async (settings: Partial<ConsentSettings>): Promise<ConsentSettings> => {
  return new Promise(resolve => {
    setTimeout(() => {
      consentSettings = {
        ...consentSettings,
        ...settings
      };
      
      resolve(consentSettings);
    }, 300);
  });
};

/**
 * Get script performance reports
 */
export const getPerformanceReports = async (scriptId?: string): Promise<ScriptPerformanceReport[]> => {
  return new Promise(resolve => {
    setTimeout(() => {
      if (scriptId) {
        resolve(performanceReports.filter(report => report.scriptId === scriptId));
      } else {
        resolve(performanceReports);
      }
    }, 300);
  });
};

/**
 * Get all enabled tracking scripts for a given consent category
 */
export const getEnabledScripts = async (consentCategories: ConsentCategory[] = []): Promise<TrackingScript[]> => {
  return new Promise(resolve => {
    setTimeout(() => {
      const enabledScripts = trackingScripts.filter(script => {
        return script.isEnabled && (
          // Include if it's in the necessary category or in one of the consented categories
          script.consentCategory === 'necessary' || consentCategories.includes(script.consentCategory)
        );
      });
      
      resolve(enabledScripts);
    }, 300);
  });
};

/**
 * Generate tracking script HTML for embedding
 */
export const generateScriptTags = async (consentCategories: ConsentCategory[]): Promise<Record<ScriptLocation, string>> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      getEnabledScripts(consentCategories).then(enabledScripts => {
        // Group scripts by location
        const scriptsByLocation: Record<ScriptLocation, string> = {
          'head': '',
          'body-start': '',
          'body-end': ''
        };
        
        // Generate HTML for each script
        enabledScripts.forEach(script => {
          scriptsByLocation[script.location] += `${script.content}
`;
        });
        
        resolve(scriptsByLocation);
      });
    }, 300);
  });
};

/**
 * Record script performance metrics
 */
export const recordScriptPerformance = async (report: Omit<ScriptPerformanceReport, 'date'>): Promise<ScriptPerformanceReport> => {
  return new Promise(resolve => {
    setTimeout(() => {
      const newReport: ScriptPerformanceReport = {
        ...report,
        date: new Date().toISOString()
      };
      
      performanceReports.push(newReport);
      
      // Keep only the last 100 reports
      if (performanceReports.length > 100) {
        performanceReports = performanceReports.slice(-100);
      }
      
      resolve(newReport);
    }, 300);
  });
}; 