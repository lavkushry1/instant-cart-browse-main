import { 
  Currency, 
  ExchangeRateResponse, 
  CurrencyConversionOptions, 
  RegionalSettings,
  CurrencyDisplayOptions
} from '@/types/currency';

// Mock data for common currencies
const DEFAULT_CURRENCIES: Currency[] = [
  {
    code: 'USD',
    name: 'US Dollar',
    symbol: '$',
    flag: '🇺🇸',
    decimalPlaces: 2,
    exchangeRate: 1,
    isBaseCurrency: true,
    isActive: true
  },
  {
    code: 'EUR',
    name: 'Euro',
    symbol: '€',
    flag: '🇪🇺',
    decimalPlaces: 2,
    exchangeRate: 0.85,
    isActive: true
  },
  {
    code: 'GBP',
    name: 'British Pound',
    symbol: '£',
    flag: '🇬🇧',
    decimalPlaces: 2,
    exchangeRate: 0.75,
    isActive: true
  },
  {
    code: 'JPY',
    name: 'Japanese Yen',
    symbol: '¥',
    flag: '🇯🇵',
    decimalPlaces: 0,
    exchangeRate: 110.25,
    isActive: true
  },
  {
    code: 'CAD',
    name: 'Canadian Dollar',
    symbol: 'C$',
    flag: '🇨🇦',
    decimalPlaces: 2,
    exchangeRate: 1.25,
    isActive: true
  },
  {
    code: 'AUD',
    name: 'Australian Dollar',
    symbol: 'A$',
    flag: '🇦🇺',
    decimalPlaces: 2,
    exchangeRate: 1.30,
    isActive: true
  },
  {
    code: 'INR',
    name: 'Indian Rupee',
    symbol: '₹',
    flag: '🇮🇳',
    decimalPlaces: 2,
    exchangeRate: 74.5,
    isActive: true
  }
];

// Default regional settings
const DEFAULT_REGIONAL_SETTINGS: RegionalSettings = {
  currencyCode: 'USD',
  countryCode: 'US',
  locale: 'en-US',
  taxRate: 0,
  taxIncluded: false
};

// Default display options
const DEFAULT_DISPLAY_OPTIONS: CurrencyDisplayOptions = {
  showSymbol: true,
  showCode: false,
  symbolPosition: 'before'
};

// Constants
const EXCHANGE_RATE_API_URL = 'https://api.exchangerate-api.com/v4/latest/';
const STORAGE_KEY = 'instant-cart-currency-data';

/**
 * Get all available currencies
 */
export const getAllCurrencies = async (): Promise<Currency[]> => {
  const storedData = localStorage.getItem(STORAGE_KEY);
  if (storedData) {
    const { currencies, lastUpdated } = JSON.parse(storedData);
    
    // Check if data is less than 24 hours old
    const now = new Date();
    const lastUpdate = new Date(lastUpdated);
    const hoursSinceUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60);
    
    if (hoursSinceUpdate < 24) {
      return currencies;
    }
  }
  
  // If no stored data or it's outdated, return default data
  // In a real app, this would fetch from API first
  return DEFAULT_CURRENCIES;
};

/**
 * Fetch exchange rates from API
 */
export const fetchExchangeRates = async (baseCurrency: string = 'USD'): Promise<ExchangeRateResponse | null> => {
  try {
    // In a real app, this would use a real API
    // For the mock, we'll simulate delay but return hardcoded rates
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Mock response
    return {
      base: baseCurrency,
      date: new Date().toISOString().split('T')[0],
      rates: {
        USD: baseCurrency === 'USD' ? 1 : 1 / DEFAULT_CURRENCIES.find(c => c.code === 'USD')!.exchangeRate,
        EUR: baseCurrency === 'EUR' ? 1 : 1 / DEFAULT_CURRENCIES.find(c => c.code === 'EUR')!.exchangeRate,
        GBP: baseCurrency === 'GBP' ? 1 : 1 / DEFAULT_CURRENCIES.find(c => c.code === 'GBP')!.exchangeRate,
        JPY: baseCurrency === 'JPY' ? 1 : 1 / DEFAULT_CURRENCIES.find(c => c.code === 'JPY')!.exchangeRate,
        CAD: baseCurrency === 'CAD' ? 1 : 1 / DEFAULT_CURRENCIES.find(c => c.code === 'CAD')!.exchangeRate,
        AUD: baseCurrency === 'AUD' ? 1 : 1 / DEFAULT_CURRENCIES.find(c => c.code === 'AUD')!.exchangeRate,
        INR: baseCurrency === 'INR' ? 1 : 1 / DEFAULT_CURRENCIES.find(c => c.code === 'INR')!.exchangeRate
      }
    };
    
    // In a real app, we'd do this:
    // const response = await fetch(`${EXCHANGE_RATE_API_URL}${baseCurrency}`);
    // if (!response.ok) throw new Error('Failed to fetch exchange rates');
    // return await response.json();
  } catch (error) {
    console.error('Error fetching exchange rates:', error);
    return null;
  }
};

/**
 * Update currency exchange rates
 */
export const updateExchangeRates = async (baseCurrencyCode: string = 'USD'): Promise<Currency[]> => {
  try {
    const currencies = await getAllCurrencies();
    const exchangeRates = await fetchExchangeRates(baseCurrencyCode);
    
    if (!exchangeRates) {
      return currencies;
    }
    
    const updatedCurrencies = currencies.map(currency => ({
      ...currency,
      exchangeRate: exchangeRates.rates[currency.code] || currency.exchangeRate,
      isBaseCurrency: currency.code === baseCurrencyCode
    }));
    
    // Store updated currencies
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      currencies: updatedCurrencies,
      lastUpdated: new Date().toISOString()
    }));
    
    return updatedCurrencies;
  } catch (error) {
    console.error('Error updating exchange rates:', error);
    return await getAllCurrencies();
  }
};

/**
 * Convert amount from one currency to another
 */
export const convertAmount = (
  amount: number,
  fromCurrency: Currency,
  toCurrency: Currency,
  options?: CurrencyConversionOptions
): number => {
  // Convert to base currency first (if not already base)
  let valueInBaseCurrency;
  if (fromCurrency.isBaseCurrency) {
    valueInBaseCurrency = amount;
  } else {
    valueInBaseCurrency = amount / fromCurrency.exchangeRate;
  }
  
  // Convert from base currency to target currency
  let convertedValue;
  if (toCurrency.isBaseCurrency) {
    convertedValue = valueInBaseCurrency;
  } else {
    convertedValue = valueInBaseCurrency * toCurrency.exchangeRate;
  }
  
  // Apply options if provided
  if (options) {
    // Apply markup if specified
    if (options.applyMarkup) {
      convertedValue *= (1 + options.applyMarkup / 100);
    }
    
    // Round to nearest value if specified
    if (options.roundToNearest) {
      convertedValue = Math.round(convertedValue / options.roundToNearest) * options.roundToNearest;
    }
  }
  
  // Round to the correct number of decimal places
  const factor = Math.pow(10, toCurrency.decimalPlaces);
  return Math.round(convertedValue * factor) / factor;
};

/**
 * Format amount with currency symbol and code
 */
export const formatCurrency = (
  amount: number,
  currency: Currency,
  options: CurrencyDisplayOptions = DEFAULT_DISPLAY_OPTIONS
): string => {
  // Format the number with proper decimal places
  const formattedNumber = amount.toFixed(currency.decimalPlaces);
  
  let result = '';
  
  // Add symbol before if needed
  if (options.showSymbol && options.symbolPosition === 'before') {
    result += currency.symbol;
  }
  
  // Add the number
  result += formattedNumber;
  
  // Add symbol after if needed
  if (options.showSymbol && options.symbolPosition === 'after') {
    result += currency.symbol;
  }
  
  // Add currency code if needed
  if (options.showCode) {
    result += ` ${currency.code}`;
  }
  
  return result;
};

/**
 * Get currency by code
 */
export const getCurrencyByCode = async (currencyCode: string): Promise<Currency | undefined> => {
  const currencies = await getAllCurrencies();
  return currencies.find(currency => currency.code === currencyCode);
};

/**
 * Get active/enabled currencies
 */
export const getActiveCurrencies = async (): Promise<Currency[]> => {
  const currencies = await getAllCurrencies();
  return currencies.filter(currency => currency.isActive);
};

/**
 * Save currency display preferences
 */
export const saveDisplayOptions = (options: CurrencyDisplayOptions): void => {
  const storedData = localStorage.getItem(STORAGE_KEY);
  
  if (storedData) {
    const data = JSON.parse(storedData);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      ...data,
      displayOptions: options
    }));
  } else {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      currencies: DEFAULT_CURRENCIES,
      displayOptions: options,
      lastUpdated: new Date().toISOString()
    }));
  }
};

/**
 * Get currency display options
 */
export const getDisplayOptions = (): CurrencyDisplayOptions => {
  const storedData = localStorage.getItem(STORAGE_KEY);
  
  if (storedData) {
    const { displayOptions } = JSON.parse(storedData);
    return displayOptions || DEFAULT_DISPLAY_OPTIONS;
  }
  
  return DEFAULT_DISPLAY_OPTIONS;
};

/**
 * Save regional settings
 */
export const saveRegionalSettings = (settings: RegionalSettings): void => {
  const storedData = localStorage.getItem(STORAGE_KEY);
  
  if (storedData) {
    const data = JSON.parse(storedData);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      ...data,
      regionalSettings: settings
    }));
  } else {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      currencies: DEFAULT_CURRENCIES,
      regionalSettings: settings,
      lastUpdated: new Date().toISOString()
    }));
  }
};

/**
 * Get regional settings
 */
export const getRegionalSettings = (): RegionalSettings => {
  const storedData = localStorage.getItem(STORAGE_KEY);
  
  if (storedData) {
    const { regionalSettings } = JSON.parse(storedData);
    return regionalSettings || DEFAULT_REGIONAL_SETTINGS;
  }
  
  return DEFAULT_REGIONAL_SETTINGS;
}; 