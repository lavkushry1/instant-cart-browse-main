import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingCart, Trash, Heart } from 'lucide-react';
import { CartItem } from '@/hooks/useCart';

interface SavedItemsProps {
  savedItems: CartItem[];
  onMoveToCart: (productId: string) => void;
  onRemove: (productId: string) => void;
}

const SavedItems = ({ savedItems, onMoveToCart, onRemove }: SavedItemsProps) => {
  if (savedItems.length === 0) {
    return null;
  }

  return (
    <Card className="mt-8">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl flex items-center">
          <Heart className="w-5 h-5 mr-2 text-brand-teal" />
          Saved For Later ({savedItems.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="divide-y">
          {savedItems.map((item) => (
            <div key={item.id} className="py-4 flex items-center">
              <div className="w-16 h-16 flex-shrink-0 bg-gray-100 rounded overflow-hidden mr-4">
                <img 
                  src={item.product.images[0]} 
                  alt={item.product.name} 
                  className="w-full h-full object-contain p-1"
                />
              </div>
              
              <div className="flex-grow min-w-0">
                <Link to={`/product/${item.id}`} className="font-medium hover:text-brand-teal truncate block">
                  {item.product.name}
                </Link>
                <div className="flex items-baseline mt-1">
                  <span className="font-semibold text-brand-teal">₹{item.product.price}</span>
                  {item.product.compareAtPrice > 0 && (
                    <span className="ml-2 text-sm text-gray-500 line-through">
                      ₹{item.product.compareAtPrice}
                    </span>
                  )}
                  {item.product.discount > 0 && (
                    <span className="ml-2 text-xs text-green-600">
                      {item.product.discount}% off
                    </span>
                  )}
                </div>
                
                <div className="mt-2 text-sm text-gray-500">
                  Quantity: {item.quantity}
                </div>
              </div>
              
              <div className="flex items-center space-x-2 ml-4">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="flex items-center"
                  onClick={() => onMoveToCart(item.id)}
                >
                  <ShoppingCart className="h-4 w-4 mr-1" />
                  Move to Cart
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="text-gray-400 hover:text-red-500"
                  onClick={() => onRemove(item.id)}
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          
          {savedItems.length > 3 && (
            <div className="pt-4 flex justify-end">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-brand-teal"
              >
                View all saved items ({savedItems.length})
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SavedItems; 