export interface Currency {
  code: string;       // ISO 4217 currency code (e.g., USD, EUR, GBP)
  name: string;       // Full currency name
  symbol: string;     // Currency symbol (e.g., $, €, £)
  flag?: string;      // Optional flag emoji or image URL
  decimalPlaces: number; // Number of decimal places to display
  exchangeRate: number;  // Exchange rate relative to base currency
  isBaseCurrency?: boolean; // Whether this is the base currency
  isActive: boolean;  // Whether this currency is available for selection
}

export interface ExchangeRateResponse {
  base: string;
  date: string;
  rates: {
    [currencyCode: string]: number;
  }
}

export interface CurrencyDisplayOptions {
  showSymbol: boolean;
  showCode: boolean;
  symbolPosition: 'before' | 'after';
}

export interface CurrencyConversionOptions {
  roundToNearest?: number;
  applyMarkup?: number; // Percentage markup to apply
}

export interface RegionalSettings {
  currencyCode: string;
  countryCode: string;
  locale: string;
  taxRate?: number;
  taxIncluded: boolean;
}

export interface CurrencyState {
  currencies: Currency[];
  activeCurrency: Currency;
  baseCurrency: Currency;
  displayOptions: CurrencyDisplayOptions;
  conversionOptions: CurrencyConversionOptions;
  regionalSettings: RegionalSettings;
  lastUpdated: string | null;
} 