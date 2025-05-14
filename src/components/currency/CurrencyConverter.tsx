import { useState, useEffect } from 'react';
import { ArrowRight, RefreshCw } from 'lucide-react';
import { useCurrency } from '@/hooks/useCurrency';
import { Currency } from '@/types/currency';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface CurrencyConverterProps {
  defaultAmount?: number;
  className?: string;
  compact?: boolean;
}

export const CurrencyConverter = ({
  defaultAmount = 100,
  className = '',
  compact = false
}: CurrencyConverterProps) => {
  const { currencies, convert } = useCurrency();
  const [amount, setAmount] = useState<number>(defaultAmount);
  const [fromCurrency, setFromCurrency] = useState<string>('USD');
  const [toCurrency, setToCurrency] = useState<string>('EUR');
  const [convertedAmount, setConvertedAmount] = useState<number>(0);
  const [activeCurrencies, setActiveCurrencies] = useState<Currency[]>([]);

  useEffect(() => {
    // Update active currencies when the currencies list changes
    if (currencies && currencies.length > 0) {
      setActiveCurrencies(currencies.filter(c => c.isActive));
    } else {
      setActiveCurrencies([]);
    }
  }, [currencies]);

  useEffect(() => {
    // Perform conversion when any relevant state changes
    handleConvert();
  }, [amount, fromCurrency, toCurrency]);

  const handleConvert = () => {
    const fromCurrencyObj = currencies.find(c => c.code === fromCurrency);
    const toCurrencyObj = currencies.find(c => c.code === toCurrency);
    
    if (fromCurrencyObj && toCurrencyObj) {
      // Convert from source currency to target currency
      const result = convert(amount, fromCurrency);
      setConvertedAmount(result);
    }
  };

  const swapCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  const getSymbol = (currencyCode: string) => {
    return currencies.find(c => c.code === currencyCode)?.symbol || '';
  };

  return (
    <Card className={className}>
      <CardHeader className={compact ? 'pb-2' : ''}>
        <CardTitle className={compact ? 'text-lg' : 'text-xl'}>Currency Converter</CardTitle>
        {!compact && <CardDescription>
          Convert amounts between available currencies
        </CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-col space-y-2">
            <label htmlFor="amount" className="text-sm font-medium">Amount</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                {getSymbol(fromCurrency)}
              </span>
              <Input
                id="amount"
                type="number"
                className="pl-8"
                value={amount}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                min={0}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-[1fr,auto,1fr] items-center gap-2">
            <Select value={fromCurrency} onValueChange={setFromCurrency}>
              <SelectTrigger>
                <SelectValue placeholder="From" />
              </SelectTrigger>
              <SelectContent>
                {activeCurrencies && activeCurrencies.length > 0 ? (
                  activeCurrencies.map((currency) => (
                    <SelectItem key={currency.code} value={currency.code}>
                      {currency.flag && <span className="mr-2">{currency.flag}</span>}
                      {currency.code} - {currency.name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="loading">Loading currencies...</SelectItem>
                )}
              </SelectContent>
            </Select>
            
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={swapCurrencies} 
              className="rounded-full hover:bg-gray-100"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            
            <Select value={toCurrency} onValueChange={setToCurrency}>
              <SelectTrigger>
                <SelectValue placeholder="To" />
              </SelectTrigger>
              <SelectContent>
                {activeCurrencies && activeCurrencies.length > 0 ? (
                  activeCurrencies.map((currency) => (
                    <SelectItem key={currency.code} value={currency.code}>
                      {currency.flag && <span className="mr-2">{currency.flag}</span>}
                      {currency.code} - {currency.name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="loading">Loading currencies...</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          
          <div className="mt-4 pt-4 border-t flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Converted amount</p>
              <p className="text-xl font-bold">
                {getSymbol(toCurrency)} {convertedAmount.toFixed(
                  currencies.find(c => c.code === toCurrency)?.decimalPlaces || 2
                )}
              </p>
            </div>
            
            <div className="text-sm text-gray-500">
              1 {fromCurrency} = {convert(1, fromCurrency).toFixed(4)} {toCurrency}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}; 