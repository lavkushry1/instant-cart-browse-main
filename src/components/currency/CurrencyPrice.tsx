import { useCurrency } from '@/hooks/useCurrency';

interface CurrencyPriceProps {
  amount: number;
  originalCurrency?: string;
  className?: string;
}

export const CurrencyPrice = ({
  amount,
  originalCurrency,
  className = ''
}: CurrencyPriceProps) => {
  const { format, convert } = useCurrency();
  
  // Convert amount if an original currency is specified
  const finalAmount = originalCurrency
    ? convert(amount, originalCurrency)
    : amount;
  
  return (
    <span className={className}>{format(finalAmount)}</span>
  );
}; 