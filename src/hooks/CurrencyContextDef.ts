import { createContext } from 'react';
import { 
  Currency, 
  CurrencyDisplayOptions,
  CurrencyConversionOptions,
  RegionalSettings
} from '@/types/currency';

export interface CurrencyContextType {
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

export const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);