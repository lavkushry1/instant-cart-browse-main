import { useState, useEffect } from 'react';
import { Check, ChevronsUpDown, Banknote } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useCurrency } from '@/hooks/useCurrency';
import { Currency } from '@/types/currency';

interface CurrencySelectorProps {
  position?: 'navbar' | 'sidebar' | 'footer';
  showLabel?: boolean;
  minWidth?: string;
}

export const CurrencySelector = ({
  position = 'navbar',
  showLabel = false,
  minWidth = "200px"
}: CurrencySelectorProps) => {
  const { currencies, activeCurrency, changeCurrency, loading } = useCurrency();
  const [open, setOpen] = useState(false);
  const [activeCurrencies, setActiveCurrencies] = useState<Currency[]>([]);

  useEffect(() => {
    // Filter only active currencies, ensure we have a valid array
    if (currencies && currencies.length > 0) {
      setActiveCurrencies(currencies.filter(c => c.isActive));
    } else {
      setActiveCurrencies([]);
    }
  }, [currencies]);

  const handleCurrencyChange = async (currencyCode: string) => {
    await changeCurrency(currencyCode);
    setOpen(false);
  };

  if (loading || !activeCurrency || activeCurrencies.length === 0) {
    return (
      <Button variant="outline" size="sm" disabled className="h-9 w-[60px]">
        <Banknote className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label="Select currency"
          className={cn(
            "flex items-center justify-between",
            position === 'navbar' ? 'h-9' : '',
            minWidth ? `min-w-[${minWidth}]` : ''
          )}
        >
          {activeCurrency.flag && <span className="mr-1">{activeCurrency.flag}</span>}
          {showLabel ? (
            <span>{activeCurrency.code} - {activeCurrency.name}</span>
          ) : (
            <span>{activeCurrency.code}</span>
          )}
          <ChevronsUpDown className="ml-1 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0">
        {activeCurrencies && activeCurrencies.length > 0 ? (
          <Command>
            <CommandInput placeholder="Search currency..." />
            <CommandEmpty>No currency found.</CommandEmpty>
            <CommandGroup>
              {activeCurrencies.map((currency) => (
                <CommandItem
                  key={currency.code}
                  value={currency.code}
                  onSelect={handleCurrencyChange}
                  className="cursor-pointer"
                >
                  <div className="flex items-center">
                    {currency.flag && <span className="mr-2">{currency.flag}</span>}
                    <span>{currency.code} - {currency.name}</span>
                  </div>
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4",
                      activeCurrency.code === currency.code ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        ) : (
          <div className="p-4 text-center">Loading currencies...</div>
        )}
      </PopoverContent>
    </Popover>
  );
}; 