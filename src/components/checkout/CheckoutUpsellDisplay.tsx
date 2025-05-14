// src/components/checkout/CheckoutUpsellDisplay.tsx
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';

// Mock product type, replace with your actual Product type if different
export interface UpsellProduct {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  imageUrl: string;
  description?: string;
  isFree?: boolean; // To highlight free items
  discountLabel?: string; // e.g., "50% OFF" or "Special Offer"
}

// Mock data for upsell products
const mockUpsellProducts: UpsellProduct[] = [
  {
    id: 'upsell-prod-1',
    name: 'Premium Gift Wrapping',
    price: 5.00,
    imageUrl: '/placeholder.svg', // Replace with actual image path or use a placeholder component
    description: 'Have your items beautifully gift-wrapped.',
    discountLabel: 'SPECIAL'
  },
  {
    id: 'upsell-prod-2',
    name: 'Express Delivery Upgrade',
    price: 10.00,
    imageUrl: '/placeholder.svg',
    description: 'Get your order delivered faster.',
  },
  {
    id: 'upsell-prod-3',
    name: 'Free Sample: New Organic Tea',
    price: 0.00,
    originalPrice: 2.00,
    imageUrl: '/placeholder.svg',
    description: 'Try a free sample of our latest organic tea blend.',
    isFree: true,
  },
  {
    id: 'upsell-prod-4',
    name: 'Extended Warranty (1 Year)',
    price: 15.00,
    imageUrl: '/placeholder.svg',
    description: 'Protect your purchase with an extended warranty.',
    discountLabel: 'SAVE $5',
    originalPrice: 20.00
  }
];

interface CheckoutUpsellDisplayProps {
  // Callback to add an upsell item to the main cart
  // The parent component (Checkout.tsx) will handle the actual cart update logic.
  onAddUpsellToCart: (product: UpsellProduct) => void;
  // You might also want to pass in current cart items to avoid offering already added upsells
  // currentCartItems: any[]; 
}

const CheckoutUpsellDisplay: React.FC<CheckoutUpsellDisplayProps> = ({ onAddUpsellToCart }) => {
  const [upsells, setUpsells] = useState<UpsellProduct[]>(mockUpsellProducts);
  const [isLoading, setIsLoading] = useState(false); // For future API calls if needed

  // In a real app, you might fetch these upsell offers based on cart content or user profile.
  // useEffect(() => {
  //   const fetchUpsells = async () => {
  //     setIsLoading(true);
  //     // const fetchedUpsells = await getUpsellOffersAPI(currentCartItems);
  //     // setUpsells(fetchedUpsells);
  //     setIsLoading(false);
  //   };
  //   fetchUpsells();
  // }, [/* currentCartItems */]);

  const handleAddClick = (product: UpsellProduct) => {
    toast.success(`${product.name} added to your order!`);
    onAddUpsellToCart(product);
    // Optional: Disable button or change its state after adding
  };

  if (isLoading) {
    return <div className="p-4 text-center">Loading special offers...</div>;
  }

  if (!upsells.length) {
    return null; // Don't render anything if no upsells are available
  }

  return (
    <div className="my-8">
      <h2 className="text-2xl font-semibold mb-4 text-gray-800">Special Offers For You</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {upsells.map((product) => (
          <Card key={product.id} className="flex flex-col overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="p-0">
              <div className="aspect-[4/3] bg-gray-100">
                <img 
                  src={product.imageUrl} 
                  alt={product.name} 
                  className="w-full h-full object-cover" 
                  onError={(e) => (e.currentTarget.src = '/placeholder.svg')} // Fallback image
                />
              </div>
            </CardHeader>
            <CardContent className="p-4 flex-grow">
              <h3 className="text-md font-semibold text-gray-700 mb-1 truncate" title={product.name}>{product.name}</h3>
              {product.description && (
                <p className="text-xs text-gray-500 mb-2 line-clamp-2">{product.description}</p>
              )}
              <div className="flex items-baseline gap-2 mb-2">
                <p className={`font-bold ${product.isFree ? 'text-green-600' : 'text-gray-800'} text-lg`}>
                  {product.isFree ? 'FREE' : `₹${product.price.toFixed(2)}`}
                </p>
                {product.originalPrice && product.price < product.originalPrice && (
                  <p className="text-sm text-gray-400 line-through">
                    ₹{product.originalPrice.toFixed(2)}
                  </p>
                )}
              </div>
              {product.discountLabel && (
                 <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700">{product.discountLabel}</span>
              )}
            </CardContent>
            <CardFooter className="p-4 pt-0">
              <Button 
                size="sm" 
                className="w-full bg-green-500 hover:bg-green-600 text-white"
                onClick={() => handleAddClick(product)}
              >
                <PlusCircle size={16} className="mr-2" />
                Add to Order
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default CheckoutUpsellDisplay;
