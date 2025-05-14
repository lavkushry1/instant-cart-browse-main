import { 
  createContext, 
  useContext, 
  useState, 
  useEffect, 
  ReactNode 
} from 'react';
import { 
  Currency, 
  CurrencyDisplayOptions,
  CurrencyConversionOptions,
  RegionalSettings
} from '@/types/currency';
import * as currencyService from '@/services/currencyService';

interface CurrencyContextType {
  currencies: Currency[];
  activeCurrency: Currency;
  displayOptions: CurrencyDisplayOptions;
  conversionOptions: CurrencyConversionOptions;
  regionalSettings: RegionalSettings;
  loading: boolean;
  error: string | null;
  format: (amount: number) => string;
  convert: (amount: number, fromCurrencyCode?: string) => number;
  changeCurrency: (currencyCode: string) => Promise<void>;
  updateCurrencies: () => Promise<void>;
  updateDisplayOptions: (options: Partial<CurrencyDisplayOptions>) => void;
  updateRegionalSettings: (settings: Partial<RegionalSettings>) => void;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider = ({ children }: { children: ReactNode }) => {
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [activeCurrency, setActiveCurrency] = useState<Currency | null>(null);
  const [displayOptions, setDisplayOptions] = useState<CurrencyDisplayOptions>(
    currencyService.getDisplayOptions()
  );
  const [conversionOptions, setConversionOptions] = useState<CurrencyConversionOptions>({
    roundToNearest: undefined,
    applyMarkup: undefined
  });
  const [regionalSettings, setRegionalSettings] = useState<RegionalSettings>(
    currencyService.getRegionalSettings()
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize currencies on first load
  useEffect(() => {
    const initializeCurrencies = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Load currencies
        const allCurrencies = await currencyService.getAllCurrencies();
        setCurrencies(allCurrencies);
        
        // Set active currency based on saved preference or regional setting
        const storedPreference = localStorage.getItem('preferred-currency');
        const regionCurrency = regionalSettings.currencyCode;
        const preferredCode = storedPreference || regionCurrency || 'USD';
        
        const preferredCurrency = allCurrencies.find(c => c.code === preferredCode);
        if (preferredCurrency) {
          setActiveCurrency(preferredCurrency);
        } else {
          // Fallback to base currency
          setActiveCurrency(allCurrencies.find(c => c.isBaseCurrency) || allCurrencies[0]);
        }
      } catch (err) {
        console.error('Failed to initialize currencies:', err);
        setError('Failed to load currency data');
      } finally {
        setLoading(false);
      }
    };

    initializeCurrencies();
  }, [regionalSettings.currencyCode]);

  /**
   * Format an amount using the active currency and display options
   */
  const format = (amount: number): string => {
    if (!activeCurrency) return '';
    return currencyService.formatCurrency(amount, activeCurrency, displayOptions);
  };

  /**
   * Convert amount from a specified currency to the active currency
   */
  const convert = (amount: number, fromCurrencyCode?: string): number => {
    if (!activeCurrency) return amount;
    
    // If no source currency specified, assume base currency
    const fromCurrency = fromCurrencyCode 
      ? currencies.find(c => c.code === fromCurrencyCode) 
      : currencies.find(c => c.isBaseCurrency);
    
    if (!fromCurrency) return amount;
    
    return currencyService.convertAmount(
      amount, 
      fromCurrency, 
      activeCurrency, 
      conversionOptions
    );
  };

  /**
   * Change the active currency
   */
  const changeCurrency = async (currencyCode: string): Promise<void> => {
    try {
      const newCurrency = currencies.find(c => c.code === currencyCode);
      if (!newCurrency) {
        throw new Error(`Currency ${currencyCode} not found`);
      }
      
      setActiveCurrency(newCurrency);
      
      // Save preference for future visits
      localStorage.setItem('preferred-currency', currencyCode);
    } catch (err) {
      console.error('Failed to change currency:', err);
      setError('Failed to change currency');
      throw err;
    }
  };

  /**
   * Update exchange rates from the API
   */
  const updateCurrencies = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      // Update exchange rates
      const baseCurrency = currencies.find(c => c.isBaseCurrency)?.code || 'USD';
      const updatedCurrencies = await currencyService.updateExchangeRates(baseCurrency);
      setCurrencies(updatedCurrencies);
      
      // Update active currency
      if (activeCurrency) {
        const updatedActive = updatedCurrencies.find(c => c.code === activeCurrency.code);
        if (updatedActive) {
          setActiveCurrency(updatedActive);
        }
      }
    } catch (err) {
      console.error('Failed to update exchange rates:', err);
      setError('Failed to update currency data');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Update display options
   */
  const updateDisplayOptions = (options: Partial<CurrencyDisplayOptions>): void => {
    const newOptions = { ...displayOptions, ...options };
    setDisplayOptions(newOptions);
    currencyService.saveDisplayOptions(newOptions);
  };

  /**
   * Update regional settings
   */
  const updateRegionalSettings = (settings: Partial<RegionalSettings>): void => {
    const newSettings = { ...regionalSettings, ...settings };
    setRegionalSettings(newSettings);
    currencyService.saveRegionalSettings(newSettings);
  };

  // Provide fallback for when context is initializing
  if (!activeCurrency && currencies.length > 0) {
    setActiveCurrency(currencies.find(c => c.isBaseCurrency) || currencies[0]);
  }

  const contextValue: CurrencyContextType = {
    currencies: currencies || [],
    activeCurrency: activeCurrency || {
      code: 'USD',
      name: 'US Dollar',
      symbol: '$',
      decimalPlaces: 2,
      exchangeRate: 1,
      isBaseCurrency: true,
      isActive: true
    },
    displayOptions,
    conversionOptions,
    regionalSettings,
    loading,
    error,
    format,
    convert,
    changeCurrency,
    updateCurrencies,
    updateDisplayOptions,
    updateRegionalSettings
  };

  return (
    <CurrencyContext.Provider value={contextValue}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = (): CurrencyContextType => {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}; 