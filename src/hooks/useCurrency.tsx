import { useContext } from 'react';
import { CurrencyContext, CurrencyContextType } from './CurrencyContextDef';

export const useCurrency = (): CurrencyContextType => {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};