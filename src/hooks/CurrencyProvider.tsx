import React, { 
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
import { CurrencyContext, CurrencyContextType } from './CurrencyContextDef';

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

  useEffect(() => {
    const initializeCurrencies = async () => {
      try {
        setLoading(true);
        setError(null);
        const allCurrencies = await currencyService.getAllCurrencies();
        setCurrencies(allCurrencies);
        const storedPreference = localStorage.getItem('preferred-currency');
        const regionCurrency = regionalSettings.currencyCode;
        const preferredCode = storedPreference || regionCurrency || 'USD';
        const preferredCurrency = allCurrencies.find(c => c.code === preferredCode);
        if (preferredCurrency) {
          setActiveCurrency(preferredCurrency);
        } else {
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

  const format = (amount: number): string => {
    if (!activeCurrency) return '';
    return currencyService.formatCurrency(amount, activeCurrency, displayOptions);
  };

  const convert = (amount: number, fromCurrencyCode?: string): number => {
    if (!activeCurrency) return amount;
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

  const changeCurrency = async (currencyCode: string): Promise<void> => {
    try {
      const newCurrency = currencies.find(c => c.code === currencyCode);
      if (!newCurrency) {
        throw new Error(`Currency ${currencyCode} not found`);
      }
      setActiveCurrency(newCurrency);
      localStorage.setItem('preferred-currency', currencyCode);
    } catch (err) {
      console.error('Failed to change currency:', err);
      setError('Failed to change currency');
      throw err;
    }
  };

  const updateCurrencies = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const baseCurrency = currencies.find(c => c.isBaseCurrency)?.code || 'USD';
      const updatedCurrencies = await currencyService.updateExchangeRates(baseCurrency);
      setCurrencies(updatedCurrencies);
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

  const updateDisplayOptions = (options: Partial<CurrencyDisplayOptions>): void => {
    const newOptions = { ...displayOptions, ...options };
    setDisplayOptions(newOptions);
    currencyService.saveDisplayOptions(newOptions);
  };

  const updateRegionalSettings = (settings: Partial<RegionalSettings>): void => {
    const newSettings = { ...regionalSettings, ...settings };
    setRegionalSettings(newSettings);
    currencyService.saveRegionalSettings(newSettings);
  };

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