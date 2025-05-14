export interface TrackingScript {
  id: string;
  name: string;
  description: string;
  isEnabled: boolean;
  scriptType: TrackingScriptType;
  location: ScriptLocation;
  loadType: ScriptLoadType;
  content: string;
  triggerType: TriggerType;
  triggerCondition?: string;
  attributes?: Record<string, string>;
  consentCategory: ConsentCategory;
  createdAt: string;
  updatedAt: string;
}

export type TrackingScriptType = 
  | 'google-analytics' 
  | 'facebook-pixel' 
  | 'google-tag-manager' 
  | 'custom';

export type ScriptLocation = 'head' | 'body-start' | 'body-end';

export type ScriptLoadType = 'sync' | 'async' | 'defer';

export type TriggerType = 'immediate' | 'on-consent' | 'on-event' | 'conditional';

export type ConsentCategory = 'necessary' | 'functional' | 'performance' | 'targeting' | 'uncategorized';

export interface ConsentSettings {
  id: string;
  isEnabled: boolean;
  mode: 'opt-in' | 'opt-out';
  requiredCategories: ConsentCategory[];
  cookieExpiration: number; // in days
  customText?: {
    title?: string;
    description?: string;
    acceptButton?: string;
    rejectButton?: string;
    settingsButton?: string;
    categories?: Record<ConsentCategory, {
      title?: string;
      description?: string;
    }>;
  };
  styling?: {
    position: 'bottom' | 'top' | 'bottom-left' | 'bottom-right';
    theme: 'light' | 'dark';
    accentColor?: string;
  };
}

export interface ScriptPerformanceReport {
  scriptId: string;
  loadTime: number; // in milliseconds
  executionTime: number; // in milliseconds
  impactScore: number; // 1-10 score of performance impact
  date: string;
  errors: ScriptError[];
}

export interface ScriptError {
  message: string;
  timestamp: string;
  stackTrace?: string;
} 