import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Search as SearchIcon, SlidersHorizontal, X, ArrowRight } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import ProductList from '@/components/products/ProductList';
import { Product } from '@/types/product';
import { getAllProducts } from '@/services/productService';
import { Badge } from '@/components/ui/badge';

const Search = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  
  const [query, setQuery] = useState(initialQuery);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [onSaleOnly, setOnSaleOnly] = useState(false);
  const [activeFilters, setActiveFilters] = useState(0);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [popularSearches] = useState(['Smartphones', 'Headphones', 'Laptops', 'Watches', 'Cameras']);
  
  // Load all products and extract categories
  useEffect(() => {
    const fetchProducts = async () => {
      const allProducts = await getAllProducts();
      setProducts(allProducts);
      
      // Extract unique categories
      const uniqueCategories = [...new Set(allProducts.map(product => product.category))];
      setCategories(uniqueCategories);
      
      // Find min and max price for range slider
      const prices = allProducts.map(product => product.price);
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      setPriceRange([minPrice, maxPrice]);
    };
    
    fetchProducts();
    
    // Load recent searches from localStorage
    const savedSearches = localStorage.getItem('recentSearches');
    if (savedSearches) {
      setRecentSearches(JSON.parse(savedSearches));
    }
  }, []);
  
  // Filter products when query or filters change
  useEffect(() => {
    if (!products.length) return;
    
    let result = [...products];
    
    // Apply search query
    if (query) {
      const searchTerms = query.toLowerCase().split(' ');
      result = result.filter(product => {
        const searchText = `${product.name} ${product.description} ${product.category}`.toLowerCase();
        return searchTerms.every(term => searchText.includes(term));
      });
    }
    
    // Apply category filter
    if (selectedCategories.length > 0) {
      result = result.filter(product => selectedCategories.includes(product.category));
    }
    
    // Apply price range filter
    result = result.filter(
      product => product.price >= priceRange[0] && product.price <= priceRange[1]
    );
    
    // Apply in-stock filter
    if (inStockOnly) {
      result = result.filter(product => product.stock > 0);
    }
    
    // Apply on-sale filter
    if (onSaleOnly) {
      result = result.filter(product => product.discount > 0);
    }
    
    setFilteredProducts(result);
    
    // Count active filters
    let count = 0;
    if (selectedCategories.length > 0) count++;
    if (priceRange[0] > 0 || priceRange[1] < 10000) count++;
    if (inStockOnly) count++;
    if (onSaleOnly) count++;
    setActiveFilters(count);
    
  }, [query, products, selectedCategories, priceRange, inStockOnly, onSaleOnly]);
  
  // Handle search submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (query.trim()) {
      // Update URL
      setSearchParams({ q: query.trim() });
      
      // Save to recent searches
      if (!recentSearches.includes(query.trim())) {
        const updatedSearches = [query.trim(), ...recentSearches.slice(0, 4)];
        setRecentSearches(updatedSearches);
        localStorage.setItem('recentSearches', JSON.stringify(updatedSearches));
      }
    }
  };
  
  // Quick search click
  const handleQuickSearch = (term: string) => {
    setQuery(term);
    setSearchParams({ q: term });
    
    // Save to recent searches
    if (!recentSearches.includes(term)) {
      const updatedSearches = [term, ...recentSearches.slice(0, 4)];
      setRecentSearches(updatedSearches);
      localStorage.setItem('recentSearches', JSON.stringify(updatedSearches));
    }
  };
  
  // Handle category selection
  const handleCategoryChange = (category: string) => {
    setSelectedCategories(prev => {
      if (prev.includes(category)) {
        return prev.filter(c => c !== category);
      } else {
        return [...prev, category];
      }
    });
  };
  
  // Clear all filters
  const clearFilters = () => {
    setSelectedCategories([]);
    setPriceRange([0, 10000]);
    setInStockOnly(false);
    setOnSaleOnly(false);
  };
  
  // Clear specific filter
  const removeFilter = (type: string, value?: string) => {
    switch (type) {
      case 'category':
        if (value) {
          setSelectedCategories(prev => prev.filter(c => c !== value));
        }
        break;
      case 'price':
        setPriceRange([0, 10000]);
        break;
      case 'inStock':
        setInStockOnly(false);
        break;
      case 'onSale':
        setOnSaleOnly(false);
        break;
      default:
        break;
    }
  };
  
  return (
    <Layout>
      <div className="container mx-auto px-4 py-4 md:py-8">
        <div className="mb-6">
          <form onSubmit={handleSearch} className="relative">
            <Input
              type="text"
              placeholder="Search for products..."
              className="pr-10 text-base h-12"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <Button 
              type="submit" 
              size="icon" 
              className="absolute right-0 top-0 h-12 w-12"
              disabled={!query.trim()}
            >
              <SearchIcon size={20} />
            </Button>
          </form>
          
          {/* Quick search suggestions */}
          {!query && (
            <div className="mt-6">
              {recentSearches.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium mb-2">Recent Searches</h3>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((term, index) => (
                      <Badge 
                        key={`recent-${index}`} 
                        variant="outline"
                        className="cursor-pointer hover:bg-gray-100"
                        onClick={() => handleQuickSearch(term)}
                      >
                        {term}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              <div>
                <h3 className="text-sm font-medium mb-2">Popular Searches</h3>
                <div className="flex flex-wrap gap-2">
                  {popularSearches.map((term, index) => (
                    <Badge 
                      key={`popular-${index}`} 
                      variant="outline"
                      className="cursor-pointer hover:bg-gray-100"
                      onClick={() => handleQuickSearch(term)}
                    >
                      {term}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Active filters */}
        {activeFilters > 0 && (
          <div className="mb-4 flex flex-wrap gap-2 items-center">
            <span className="text-sm font-medium">Active Filters:</span>
            
            {selectedCategories.map(category => (
              <Badge key={category} className="bg-gray-100 text-gray-800 cursor-pointer" onClick={() => removeFilter('category', category)}>
                {category} <X size={14} className="ml-1" />
              </Badge>
            ))}
            
            {(priceRange[0] > 0 || priceRange[1] < 10000) && (
              <Badge className="bg-gray-100 text-gray-800 cursor-pointer" onClick={() => removeFilter('price')}>
                ₹{priceRange[0]} - ₹{priceRange[1]} <X size={14} className="ml-1" />
              </Badge>
            )}
            
            {inStockOnly && (
              <Badge className="bg-gray-100 text-gray-800 cursor-pointer" onClick={() => removeFilter('inStock')}>
                In Stock <X size={14} className="ml-1" />
              </Badge>
            )}
            
            {onSaleOnly && (
              <Badge className="bg-gray-100 text-gray-800 cursor-pointer" onClick={() => removeFilter('onSale')}>
                On Sale <X size={14} className="ml-1" />
              </Badge>
            )}
            
            <Button variant="link" size="sm" onClick={clearFilters} className="h-auto py-0">
              Clear All
            </Button>
          </div>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Filters - Mobile */}
          <div className="lg:hidden mb-4">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="w-full mb-4">
                  <SlidersHorizontal className="mr-2 h-4 w-4" />
                  Filter Products
                  {activeFilters > 0 && (
                    <Badge className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center">
                      {activeFilters}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[90vh]">
                <SheetHeader>
                  <SheetTitle>Filters</SheetTitle>
                </SheetHeader>
                
                <div className="py-4 overflow-auto h-full">
                  {/* Categories */}
                  <div className="mb-6">
                    <h3 className="text-sm font-medium mb-3">Categories</h3>
                    <div className="space-y-2">
                      {categories.map(category => (
                        <div key={category} className="flex items-center space-x-2">
                          <Checkbox 
                            id={`category-${category}`} 
                            checked={selectedCategories.includes(category)}
                            onCheckedChange={() => handleCategoryChange(category)}
                          />
                          <Label htmlFor={`category-${category}`} className="text-sm cursor-pointer">
                            {category}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Price Range */}
                  <div className="mb-6">
                    <h3 className="text-sm font-medium mb-3">Price Range</h3>
                    <div className="px-2">
                      <Slider
                        defaultValue={priceRange}
                        min={0}
                        max={10000}
                        step={100}
                        value={priceRange}
                        onValueChange={(value) => setPriceRange(value as [number, number])}
                        className="mb-6"
                      />
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>₹{priceRange[0]}</span>
                      <span>₹{priceRange[1]}</span>
                    </div>
                  </div>
                  
                  {/* Availability */}
                  <div className="mb-6">
                    <h3 className="text-sm font-medium mb-3">Availability</h3>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="in-stock" 
                          checked={inStockOnly}
                          onCheckedChange={(checked) => setInStockOnly(!!checked)}
                        />
                        <Label htmlFor="in-stock" className="text-sm cursor-pointer">
                          In Stock Only
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="on-sale" 
                          checked={onSaleOnly}
                          onCheckedChange={(checked) => setOnSaleOnly(!!checked)}
                        />
                        <Label htmlFor="on-sale" className="text-sm cursor-pointer">
                          On Sale
                        </Label>
                      </div>
                    </div>
                  </div>
                  
                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t">
                    <Button className="w-full">
                      Apply Filters
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
          
          {/* Filters - Desktop */}
          <div className="hidden lg:block lg:col-span-3">
            <div className="bg-white p-4 rounded-lg border">
              <h2 className="font-bold text-lg mb-4">Filters</h2>
              
              {/* Categories */}
              <div className="mb-6">
                <h3 className="text-sm font-medium mb-3">Categories</h3>
                <div className="space-y-2">
                  {categories.map(category => (
                    <div key={category} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`desktop-category-${category}`} 
                        checked={selectedCategories.includes(category)}
                        onCheckedChange={() => handleCategoryChange(category)}
                      />
                      <Label htmlFor={`desktop-category-${category}`} className="text-sm cursor-pointer">
                        {category}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Price Range */}
              <div className="mb-6">
                <h3 className="text-sm font-medium mb-3">Price Range</h3>
                <div className="px-2">
                  <Slider
                    defaultValue={priceRange}
                    min={0}
                    max={10000}
                    step={100}
                    value={priceRange}
                    onValueChange={(value) => setPriceRange(value as [number, number])}
                    className="mb-6"
                  />
                </div>
                <div className="flex justify-between text-sm">
                  <span>₹{priceRange[0]}</span>
                  <span>₹{priceRange[1]}</span>
                </div>
              </div>
              
              {/* Availability */}
              <div className="mb-6">
                <h3 className="text-sm font-medium mb-3">Availability</h3>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="desktop-in-stock" 
                      checked={inStockOnly}
                      onCheckedChange={(checked) => setInStockOnly(!!checked)}
                    />
                    <Label htmlFor="desktop-in-stock" className="text-sm cursor-pointer">
                      In Stock Only
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="desktop-on-sale" 
                      checked={onSaleOnly}
                      onCheckedChange={(checked) => setOnSaleOnly(!!checked)}
                    />
                    <Label htmlFor="desktop-on-sale" className="text-sm cursor-pointer">
                      On Sale
                    </Label>
                  </div>
                </div>
              </div>
              
              {activeFilters > 0 && (
                <Button variant="outline" size="sm" onClick={clearFilters} className="w-full">
                  Clear All Filters
                </Button>
              )}
            </div>
          </div>
          
          {/* Product Results */}
          <div className="lg:col-span-9">
            {filteredProducts.length > 0 ? (
              <ProductList 
                title={query ? `Results for "${query}"` : "All Products"} 
                products={filteredProducts} 
              />
            ) : (
              <div className="text-center py-16 border rounded-md">
                <h3 className="text-xl font-medium mb-2">No products found</h3>
                <p className="text-gray-500 mb-4">Try adjusting your search or filters</p>
                <Button variant="outline" onClick={clearFilters}>
                  Clear All Filters
                </Button>
              </div>
            )}
            
            {/* Search behavior hint */}
            {query && (
              <div className="mt-6 text-sm text-gray-500 text-center">
                <p>Showing results for "{query}"</p>
                <p>Not what you're looking for? Try using different keywords.</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Recommended searches - shown when few results */}
        {filteredProducts.length > 0 && filteredProducts.length < 5 && (
          <div className="mt-8">
            <h3 className="font-medium mb-3">You might also like:</h3>
            <div className="flex flex-wrap gap-2">
              {popularSearches.map((term, index) => (
                <div 
                  key={`recommend-${index}`}
                  className="border rounded-md p-3 cursor-pointer hover:border-brand-teal transition-colors"
                  onClick={() => handleQuickSearch(term)}
                >
                  <p className="text-sm font-medium mb-1">{term}</p>
                  <ArrowRight size={16} className="text-gray-400" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Search; 