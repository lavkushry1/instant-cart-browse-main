import React, { useState } from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Heart, ShoppingCart, Filter, Sliders } from 'lucide-react';
import { Product } from '@/types/product';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/hooks/useCart';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface ProductListProps {
  title?: string;
  products: Product[];
  category?: string;
}

const ProductList = ({ title = 'All Products', products, category }: ProductListProps) => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [sortBy, setSortBy] = useState('featured');
  const [displayProducts, setDisplayProducts] = useState<Product[]>(products);
  const [showFilters, setShowFilters] = useState(false);
  
  // Apply sorting whenever products or sortBy changes
  React.useEffect(() => {
    let result = [...products];
    
    // Apply sorting
    switch (sortBy) {
      case 'price-low':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'name':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'newest':
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      default: // 'featured'
        result.sort((a, b) => b.featured - a.featured);
        break;
    }
    
    setDisplayProducts(result);
  }, [products, sortBy]);
  
  const handleAddToCart = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent navigation when clicking add to cart
    addToCart(product);
  };
  
  const handleProductClick = (productId: string) => {
    navigate(`/product/${productId}`);
  };
  
  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-3">
        <div>
          <h2 className="text-xl font-medium">{title}</h2>
          <p className="text-sm text-gray-500">{products.length} products</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Sort on mobile */}
          <div className="sm:hidden flex-1">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  <div className="flex items-center">
                    <Sliders className="h-4 w-4 mr-2" />
                    Sort & Filter
                  </div>
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[90vh]">
                <SheetHeader>
                  <SheetTitle>Sort & Filter</SheetTitle>
                  <SheetDescription>
                    Customize your product view
                  </SheetDescription>
                </SheetHeader>
                <div className="py-4">
                  <h3 className="text-sm font-medium mb-3">Sort By</h3>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      { label: 'Featured', value: 'featured' },
                      { label: 'Price: Low to High', value: 'price-low' },
                      { label: 'Price: High to Low', value: 'price-high' },
                      { label: 'Name', value: 'name' },
                      { label: 'Newest', value: 'newest' },
                    ].map(option => (
                      <Button
                        key={option.value}
                        variant={sortBy === option.value ? "default" : "outline"}
                        className="justify-start"
                        onClick={() => {
                          setSortBy(option.value);
                        }}
                      >
                        {option.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
          
          {/* Sort on desktop */}
          <div className="hidden sm:block">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="featured">Featured</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="newest">Newest</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      
      {/* Product Grid */}
      {displayProducts.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {displayProducts.map((product) => (
            <Card 
              key={product.id} 
              className="overflow-hidden h-full flex flex-col cursor-pointer border-none sm:border shadow-sm hover:shadow-md transition-shadow"
              onClick={() => handleProductClick(product.id)}
            >
              <div className="relative h-36 sm:h-48">
                <img 
                  src={product.images[0]} 
                  alt={product.name} 
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                {product.discount > 0 && (
                  <Badge className="absolute top-2 right-2 bg-red-500">
                    {product.discount}% OFF
                  </Badge>
                )}
                {product.stock <= 0 && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <span className="text-white font-bold text-sm sm:text-lg">OUT OF STOCK</span>
                  </div>
                )}
              </div>
              
              <CardContent className="flex-grow pt-3 px-3 sm:pt-4 sm:px-4">
                <h3 className="font-medium text-sm sm:text-lg mb-1 line-clamp-1">
                  {product.name}
                </h3>
                <p className="text-gray-500 text-xs sm:text-sm mb-1 sm:mb-2">{product.category}</p>
                <div className="flex items-baseline gap-2">
                  <span className="font-bold text-sm sm:text-lg">₹{product.price}</span>
                  {product.compareAtPrice > 0 && (
                    <span className="text-gray-400 line-through text-xs sm:text-sm">
                      ₹{product.compareAtPrice}
                    </span>
                  )}
                </div>
              </CardContent>
              
              <CardFooter className="border-t pt-2 sm:pt-4 px-3 sm:px-4">
                <div className="w-full flex gap-2">
                  <Button 
                    className="flex-grow text-xs sm:text-sm py-1 sm:py-2 h-auto"
                    onClick={(e) => handleAddToCart(product, e)}
                    disabled={product.stock <= 0}
                  >
                    <ShoppingCart size={14} className="mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Add to Cart</span>
                    <span className="sm:hidden">Add</span>
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-10 sm:w-10" onClick={(e) => e.stopPropagation()}>
                    <Heart size={16} />
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <h3 className="text-xl font-medium mb-2">No products found</h3>
          <p className="text-gray-500">Try adjusting your filters</p>
        </div>
      )}
    </div>
  );
};

export default ProductList; 