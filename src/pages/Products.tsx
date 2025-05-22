import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MainLayout } from '../components/layout/MainLayout';
import ProductCard from '../components/products/ProductCard';
import ProductFilter, { FilterOptions } from '../components/products/ProductFilter';
import { Product as LocalProduct } from '../types/product';
import {
  getProducts as fetchServiceProducts,
  GetAllProductsOptions as ServiceGetAllProductsOptions, 
  Product as ServiceProduct,
  ClientDocumentSnapshot
} from '../services/productService';
import ProductCardSkeleton from '../components/products/ProductCardSkeleton';
import { Button } from '@/components/ui/button';
import { 
  Loader2, 
  ChevronDown, 
  ArrowDownUp, 
  CheckSquare, 
  Filter,
  X,
  ArrowLeft
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
  SheetFooter,
} from "@/components/ui/sheet";

// Helper function to map service product to local client product
const mapServiceProductToLocalProduct = (serviceProduct: ServiceProduct): LocalProduct => {
  const compareAtPrice = serviceProduct.originalPrice ?? serviceProduct.price;
  const discount = serviceProduct.originalPrice && serviceProduct.originalPrice > serviceProduct.price 
    ? Math.round(((serviceProduct.originalPrice - serviceProduct.price) / serviceProduct.originalPrice) * 100) 
    : 0;

  return {
    id: serviceProduct.id,
    name: serviceProduct.name,
    description: serviceProduct.description,
    price: serviceProduct.price,
    images: serviceProduct.images || [],
    stock: serviceProduct.stock,
    tags: serviceProduct.tags || [],
    compareAtPrice: compareAtPrice,
    category: serviceProduct.categoryName || serviceProduct.categoryId, 
    featured: serviceProduct.featured ? 1 : 0, 
    discount: discount,
    createdAt: serviceProduct.createdAt ? serviceProduct.createdAt.toDate().toISOString() : new Date().toISOString(),
    updatedAt: serviceProduct.updatedAt ? serviceProduct.updatedAt.toDate().toISOString() : new Date().toISOString(),
  };
};

const PRODUCTS_PER_PAGE = 16; // Increased number of products per page

// Sort options for Flipkart style
const sortOptions = [
  { value: 'relevance', label: 'Popularity' },
  { value: 'price-low', label: 'Price -- Low to High' },
  { value: 'price-high', label: 'Price -- High to Low' },
  { value: 'newest', label: 'Newest First' },
];

const Products = () => {
  const [searchParams] = useSearchParams();
  const [filteredProducts, setFilteredProducts] = useState<LocalProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasFetchedOnce, setHasFetchedOnce] = useState(false);
  const [lastVisibleDoc, setLastVisibleDoc] = useState<ClientDocumentSnapshot | undefined>(undefined);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [sortBy, setSortBy] = useState('relevance');
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  
  // Mocked or simplified filter options
  const [categories, setCategories] = useState<string[]>([
    'Electronics', 'Clothing', 'Home & Garden', 'Books', 'Sports', 'Toys',
    'Beauty', 'Grocery', 'Appliances', 'Furniture'
  ]);
  const [tags, setTags] = useState<string[]>([
    'New', 'Bestseller', 'Sale', 'Trending', 'Premium'
  ]);
  const [maxPrice, setMaxPrice] = useState(100000);
  
  const categoryParam = searchParams.get('category');
  const searchQueryParam = searchParams.get('search');
  
  const fetchProductsCallback = useCallback(async (options?: ServiceGetAllProductsOptions, isLoadMore = false) => {
    if (isLoadMore) {
      setIsLoadingMore(true);
    } else {
      setLoading(true);
      setFilteredProducts([]);
      setLastVisibleDoc(undefined);
      setHasNextPage(true);
    }
    setError(null);

    try {
      const fetchOptions: ServiceGetAllProductsOptions = {
        ...options,
        isEnabled: true,
        limit: PRODUCTS_PER_PAGE,
      };
      if (categoryParam && !fetchOptions.categoryId) {
        fetchOptions.categoryId = categoryParam;
      }
      if (isLoadMore && lastVisibleDoc) {
        fetchOptions.startAfter = lastVisibleDoc;
      }

      const response = await fetchServiceProducts(fetchOptions);
      let clientProducts = response.products.map(mapServiceProductToLocalProduct);
      
      if (searchQueryParam) {
        const lowerQuery = searchQueryParam.toLowerCase();
        clientProducts = clientProducts.filter(p => 
          p.name.toLowerCase().includes(lowerQuery) || 
          p.description.toLowerCase().includes(lowerQuery) ||
          (p.tags && p.tags.some(t => t.toLowerCase().includes(lowerQuery)))
        );
      }
      
      // Apply client-side sorting
      clientProducts = sortProducts(clientProducts, sortBy);
      
      setFilteredProducts(prevProducts => isLoadMore ? [...prevProducts, ...clientProducts] : clientProducts);
      setLastVisibleDoc(response.lastVisible);
      setHasNextPage(!!response.lastVisible && response.products.length === PRODUCTS_PER_PAGE);

    } catch (err) {
      console.error('Error loading products:', err);
      setError('Failed to load products. Please try again later.');
    } finally {
      if (isLoadMore) {
        setIsLoadingMore(false);
      } else {
        setLoading(false);
        setHasFetchedOnce(true);
      }
    }
  }, [categoryParam, searchQueryParam, lastVisibleDoc, sortBy]);

  // Sort products function
  const sortProducts = (products: LocalProduct[], sortOption: string) => {
    const sortedProducts = [...products];
    
    switch (sortOption) {
      case 'price-low':
        sortedProducts.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        sortedProducts.sort((a, b) => b.price - a.price);
        break;
      case 'newest':
        sortedProducts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      default: // 'relevance' or 'popularity'
        sortedProducts.sort((a, b) => b.featured - a.featured);
        break;
    }
    
    return sortedProducts;
  };

  useEffect(() => {
    fetchProductsCallback({});
  }, [categoryParam, searchQueryParam, fetchProductsCallback]);

  // Re-sort products when sort option changes
  useEffect(() => {
    if (filteredProducts.length > 0 && hasFetchedOnce) {
      const sortedProducts = sortProducts(filteredProducts, sortBy);
      setFilteredProducts(sortedProducts);
    }
  }, [sortBy]);
  
  const handleFilterChange = useCallback(async (filterValues: FilterOptions) => {
    const options: ServiceGetAllProductsOptions = { isEnabled: true };

    if (filterValues.categories.length > 0) {
      options.categoryId = filterValues.categories[0];
    }
    if (filterValues.priceRange) {
      options.minPrice = filterValues.priceRange[0];
      options.maxPrice = filterValues.priceRange[1];
    }
    
    await fetchProductsCallback(options, false);
  }, [fetchProductsCallback]);
  
  const handleLoadMore = () => {
    if (hasNextPage && !isLoadingMore) {
      fetchProductsCallback({ categoryId: categoryParam || undefined }, true);
    }
  };

  const getTitle = () => {
    if (categoryParam) {
      return `${categoryParam.charAt(0).toUpperCase() + categoryParam.slice(1)}`;
    } else if (searchQueryParam) {
      return `Search Results for "${searchQueryParam}"`;
    }
    return 'All Products';
  };
  
  return (
    <MainLayout>
      <div className="bg-flipkart-gray-background min-h-screen">
        {/* Breadcrumb - hidden on mobile */}
        <div className="hidden md:block container pt-3 pb-1">
          <div className="text-flipkart-small text-flipkart-gray-secondary-text">
            Home {categoryParam && '>'} {categoryParam && <span className="text-flipkart-blue">{categoryParam}</span>}
          </div>
        </div>
        
        {/* Title Bar */}
        <div className="bg-white p-4 shadow-sm mb-3">
          <div className="container">
            <div className="flex items-center justify-between">
              <h1 className="text-flipkart-header-md font-medium">
                {getTitle()}
                <span className="text-flipkart-small text-flipkart-gray-secondary-text ml-2">
                  ({filteredProducts.length} {filteredProducts.length === 1 ? 'Product' : 'Products'})
                </span>
              </h1>
            </div>
          </div>
        </div>
        
        <div className="container pb-6">
          <div className="flex flex-col md:flex-row gap-3">
            {/* Desktop Filter Sidebar */}
            <div className="hidden md:block w-1/4">
              <ProductFilter 
                categories={categories}
                tags={tags}
                maxPrice={maxPrice}
                onFilterChange={handleFilterChange}
                initialFilters={{
                  categories: categoryParam ? [categoryParam] : [],
                  tags: [],
                  priceRange: [0, maxPrice],
                  inStock: false,
                  onSale: false
                }}
              />
            </div>
            
            {/* Product Listing Area */}
            <div className="flex-1">
              {/* Sort Bar */}
              <div className="bg-white p-3 mb-3 shadow-sm flex items-center justify-between">
                <div className="font-medium text-flipkart-body">Sort By</div>
                <div className="flex gap-3">
                  {sortOptions.map(option => (
                    <button
                      key={option.value}
                      className={`px-3 py-1 text-flipkart-body ${sortBy === option.value 
                        ? 'text-flipkart-blue font-medium' 
                        : 'text-flipkart-gray-primary-text'}`}
                      onClick={() => setSortBy(option.value)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                
                {/* Mobile Filter Button */}
                <div className="md:hidden">
                  <Sheet open={showMobileFilters} onOpenChange={setShowMobileFilters}>
                    <SheetTrigger asChild>
                      <Button variant="outline" size="sm" className="flex items-center">
                        <Filter className="mr-1 h-4 w-4" />
                        Filters
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-full sm:w-80 p-0">
                      <SheetHeader className="border-b border-flipkart-gray-border h-14 flex items-center px-4">
                        <SheetClose className="absolute left-4 top-4">
                          <X className="h-5 w-5" />
                        </SheetClose>
                        <SheetTitle className="ml-8 text-flipkart-header-sm">Filters</SheetTitle>
                      </SheetHeader>
                      <div className="overflow-y-auto h-[calc(100%-7rem)]">
                        <ProductFilter
                          categories={categories}
                          tags={tags}
                          maxPrice={maxPrice}
                          onFilterChange={handleFilterChange}
                          initialFilters={{
                            categories: categoryParam ? [categoryParam] : [],
                            tags: [],
                            priceRange: [0, maxPrice],
                            inStock: false,
                            onSale: false
                          }}
                        />
                      </div>
                      <SheetFooter className="border-t border-flipkart-gray-border h-14 px-4 flex justify-between">
                        <Button variant="outline" size="lg" className="w-full">RESET</Button>
                        <SheetClose asChild>
                          <Button size="lg" className="w-full bg-flipkart-blue hover:bg-flipkart-blue/90">APPLY</Button>
                        </SheetClose>
                      </SheetFooter>
                    </SheetContent>
                  </Sheet>
                </div>
              </div>
              
              {/* Products Grid */}
              <div className="bg-white shadow-sm p-3">
                {loading && !hasFetchedOnce ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-3">
                    {[...Array(8)].map((_, index) => <ProductCardSkeleton key={index} />)}
                  </div>
                ) : error ? (
                  <div className="text-center py-10">
                    <h2 className="text-flipkart-header-md text-red-500 mb-2">Something went wrong</h2>
                    <p className="text-flipkart-body text-flipkart-gray-secondary-text mb-4">{error}</p>
                    <Button 
                      onClick={() => fetchProductsCallback()} 
                      className="bg-flipkart-blue hover:bg-flipkart-blue/90"
                    >
                      Try Again
                    </Button>
                  </div>
                ) : filteredProducts.length === 0 && !loading ? (
                  <div className="text-center py-10">
                    <p className="text-flipkart-header-sm text-flipkart-gray-primary-text">
                      No products found matching your criteria.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-3">
                    {filteredProducts.map(product => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                )}
                
                {/* Load More Button */}
                {hasNextPage && !loading && filteredProducts.length > 0 && (
                  <div className="mt-6 text-center">
                    <Button 
                      onClick={handleLoadMore} 
                      disabled={isLoadingMore}
                      className="bg-flipkart-blue hover:bg-flipkart-blue/90"
                      size="lg"
                    >
                      {isLoadingMore ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading...</>
                      ) : (
                        'Load More Products'
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Products;
