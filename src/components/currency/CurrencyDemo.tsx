import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ExternalLink } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CurrencySelector } from './CurrencySelector';
import { CurrencyConverter } from './CurrencyConverter';
import { CurrencyPrice } from './CurrencyPrice';
import { useCurrency } from '@/hooks/useCurrency';
import { Currency } from '@/types/currency';

export const CurrencyDemo = () => {
  const { currencies, activeCurrency, changeCurrency } = useCurrency();
  const [featuredCurrencies, setFeaturedCurrencies] = useState<Currency[]>([]);
  const sampleProducts = [
    { name: 'Wireless Headphones', price: 99.99, currency: 'USD' },
    { name: 'Smart Watch', price: 249.99, currency: 'USD' },
    { name: 'Wireless Charger', price: 39.99, currency: 'USD' },
  ];

  useEffect(() => {
    // Get a subset of currencies to showcase
    const featured = currencies
      .filter(c => ['USD', 'EUR', 'GBP', 'JPY', 'AUD'].includes(c.code))
      .sort((a, b) => a.code.localeCompare(b.code));
    setFeaturedCurrencies(featured);
  }, [currencies]);

  const handleCurrencyClick = (currencyCode: string) => {
    changeCurrency(currencyCode);
  };

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-12">
        <motion.h2 
          className="text-3xl font-bold mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Shop in Your Preferred Currency
        </motion.h2>
        <motion.p 
          className="text-lg text-muted-foreground max-w-3xl mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          Instantly switch between multiple currencies with real-time exchange rates
        </motion.p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
        {/* Currency Showcase */}
        <Card>
          <CardHeader>
            <CardTitle>Currency Selector</CardTitle>
            <CardDescription>Choose from {currencies.filter(c => c.isActive).length} available currencies</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-8">
              <p className="text-sm font-medium mb-2">Currently Viewing In:</p>
              <div className="flex items-center bg-muted p-3 rounded-md">
                {activeCurrency.flag && (
                  <span className="text-2xl mr-2">{activeCurrency.flag}</span>
                )}
                <div>
                  <p className="font-medium">{activeCurrency.name}</p>
                  <p className="text-sm text-muted-foreground">{activeCurrency.code} - {activeCurrency.symbol}</p>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-sm font-medium mb-2">Quick Select:</p>
              <div className="flex flex-wrap gap-2">
                {featuredCurrencies.map(currency => (
                  <Button
                    key={currency.code}
                    variant={currency.code === activeCurrency.code ? "default" : "outline"} 
                    size="sm"
                    className="flex items-center"
                    onClick={() => handleCurrencyClick(currency.code)}
                  >
                    {currency.flag && <span className="mr-1">{currency.flag}</span>}
                    {currency.code}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium mb-2">All Currencies:</p>
              <CurrencySelector showLabel />
            </div>
          </CardContent>
        </Card>

        {/* Product Price Display */}
        <Card>
          <CardHeader>
            <CardTitle>Automatic Price Conversion</CardTitle>
            <CardDescription>Prices automatically convert to your selected currency</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sampleProducts.map((product, index) => (
                <div key={index} className="flex justify-between items-center p-3 border rounded-md">
                  <span className="font-medium">{product.name}</span>
                  <div className="text-right">
                    <div className="text-lg font-bold">
                      <CurrencyPrice amount={product.price} originalCurrency={product.currency} />
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Original: {product.currency} {product.price}
                    </div>
                  </div>
                </div>
              ))}
              
              <div className="border-t pt-4 mt-6">
                <p className="text-sm font-medium mb-3">Exchange rate (1 {activeCurrency.code}):</p>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  {featuredCurrencies
                    .filter(c => c.code !== activeCurrency.code)
                    .slice(0, 3)
                    .map(currency => (
                      <div key={currency.code} className="flex justify-between">
                        <span>{currency.code}:</span>
                        <span>{(currency.exchangeRate / activeCurrency.exchangeRate).toFixed(4)}</span>
                      </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Currency Converter */}
      <div className="max-w-md mx-auto">
        <CurrencyConverter />
      </div>

      <div className="text-center mt-12">
        <Button variant="outline" className="flex items-center mx-auto">
          <ExternalLink className="mr-2 h-4 w-4" />
          Learn more about our multi-currency support
        </Button>
      </div>
    </div>
  );
}; 