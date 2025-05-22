import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import React, { useState, useEffect, useCallback, useMemo } from 'react'; // Added useMemo
import { useSearchParams } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import ProductList from '../components/products/ProductList';
import ProductFilter, { FilterOptions } from '../components/products/ProductFilter';
import { Product as LocalProduct } from '../types/product'; // Renamed to avoid conflict
import {
  getProducts as fetchServiceProducts, // Renamed to avoid conflict with component name
  GetAllProductsOptions as ServiceGetAllProductsOptions, 
  Product as ServiceProduct,
  ClientDocumentSnapshot // Import ClientDocumentSnapshot
} from '../services/productService';
import ProductCardSkeleton from '../components/products/ProductCardSkeleton';
import { Button } from '@/components/ui/button'; // Import Button for Load More
import { Loader2 } from 'lucide-react'; // For Load More button loading state
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'; // Import Select

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
    // seo: undefined, // Assuming SEO is handled separately
  };
};

const PRODUCTS_PER_PAGE = 9; // Number of products to load per page/batch

const Products = () => {
  const [searchParams] = useSearchParams();
  const [filteredProducts, setFilteredProducts] = useState<LocalProduct[]>([]);
  const [loading, setLoading] = useState(true); // For initial load and filter changes
  const [isLoadingMore, setIsLoadingMore] = useState(false); // For "Load More" action
  const [error, setError] = useState<string | null>(null);
  const [hasFetchedOnce, setHasFetchedOnce] = useState(false); // To track initial load for skeletons
  const [lastVisibleDoc, setLastVisibleDoc] = useState<ClientDocumentSnapshot | undefined>(undefined);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [sortOption, setSortOption] = useState<string>('name-asc'); // Default sort
  
  // Mocked or simplified filter options - these would ideally come from backend services
  const [categories, setCategories] = useState<string[]>([]); // TODO: Fetch from categoryService
  const [tags, setTags] = useState<string[]>([]); // TODO: Fetch or derive from products
  const [maxPrice, setMaxPrice] = useState(10000); // TODO: Fetch or derive from products
  const [displayedProducts, setDisplayedProducts] = useState<LocalProduct[]>([]); // For sorted/filtered products
  
  const categoryParam = searchParams.get('category');
  const searchQueryParam = searchParams.get('search');
  
  const fetchProductsCallback = useCallback(async (options?: ServiceGetAllProductsOptions, isLoadMore = false) => {
    if (isLoadMore) {
      setIsLoadingMore(true);
    } else {
      setLoading(true);
      // Reset products and pagination for a new fetch/filter
      setFilteredProducts([]); 
      setLastVisibleDoc(undefined);
      setHasNextPage(true); // Assume there's a next page until fetch proves otherwise
    }
    setError(null);

    try {
      const fetchOptions: ServiceGetAllProductsOptions = {
        ...options,
        isEnabled: true, // Default to enabled
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
      
      if (searchQueryParam) { // Apply client-side search after fetching
        const lowerQuery = searchQueryParam.toLowerCase();
        clientProducts = clientProducts.filter(p => 
          p.name.toLowerCase().includes(lowerQuery) || 
          p.description.toLowerCase().includes(lowerQuery) ||
          (p.tags && p.tags.some(t => t.toLowerCase().includes(lowerQuery)))
        );
      }
      
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
  }, [categoryParam, searchQueryParam, lastVisibleDoc]); // Removed fetchProductsCallback from here as it's defined below and causes re-renders

  useEffect(() => {
    // Initial fetch, not loading more, no specific filter options beyond URL params
    fetchProductsCallback({}); 
  }, [categoryParam, searchQueryParam]); // Removed fetchProductsCallback from deps here, it is stable now

  // Sorting logic
  useEffect(() => {
    let sortedProducts = [...filteredProducts];
    switch (sortOption) {
      case 'name-asc':
        sortedProducts.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name-desc':
        sortedProducts.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'price-asc':
        sortedProducts.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        sortedProducts.sort((a, b) => b.price - a.price);
        break;
      default:
        break;
    }
    setDisplayedProducts(sortedProducts);
  }, [sortOption, filteredProducts]);
  
  const handleFilterChange = useCallback(async (filterValues: FilterOptions) => {
    const options: ServiceGetAllProductsOptions = { isEnabled: true };

    if (filterValues.categories.length > 0) {
      options.categoryId = filterValues.categories[0]; 
    }
    if (filterValues.priceRange) {
      options.minPrice = filterValues.priceRange[0];
      options.maxPrice = filterValues.priceRange[1];
    }
    
    // Fetch with new filters, this is a fresh load, not "load more"
    // The fetchProductsCallback will handle resetting products and pagination state (lastVisibleDoc etc.)
    await fetchProductsCallback(options, false);

    // Client-side filtering part is removed from here as fetchProductsCallback now handles 
    // setting filteredProducts directly after server fetch and applying search query.
    // If additional client-side filtering beyond search (like tags, onSale, inStock from the form)
    // is still needed after the paginated fetch, it would need careful re-integration
    // to operate on the current `filteredProducts` state or be part of the options sent to backend if possible.
    // For now, simplifying by assuming most filters map to service options or search.

  }, [fetchProductsCallback]);
  
  const handleLoadMore = () => {
    if (hasNextPage && !isLoadingMore) {
      fetchProductsCallback({ categoryId: categoryParam || undefined }, true);
    }
  };

  const getTitle = () => {
    if (categoryParam) {
      return `${categoryParam.charAt(0).toUpperCase() + categoryParam.slice(1)} Products`;
    } else if (searchQueryParam) {
      return `Search Results: "${searchQueryParam}"`;
    }
    return 'All Products';
  };
  
  return (
    <Layout>
        <div className="container mx-auto py-8 px-4">
          <h1 className="text-3xl font-bold mb-6">{getTitle()}</h1>
          
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Filters sidebar */}
            <div className="lg:col-span-1">
              {/* Sorting Dropdown */}
              <div className="mb-6 bg-white p-4 rounded-lg shadow">
                <label htmlFor="sort-options" className="block text-sm font-medium text-gray-700 mb-2">Sort by</label>
                <Select value={sortOption} onValueChange={setSortOption}>
                  <SelectTrigger id="sort-options">
                    <SelectValue placeholder="Select sort option" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                    <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                    <SelectItem value="price-asc">Price (Low to High)</SelectItem>
                    <SelectItem value="price-desc">Price (High to Low)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

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
            
            {/* Product listing */}
            <div className="lg:col-span-3">
            {loading && !hasFetchedOnce ? (
                // Show Skeletons on initial load
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {[...Array(6)].map((_, index) => <ProductCardSkeleton key={index} />)}
                </div>
            ) : error ? (
               <div className="text-center">
                  <h2 className="text-2xl font-bold text-red-500 mb-2">Oops!</h2>
                  <p className="text-gray-600 mb-4">{error}</p>
                  <button 
                    onClick={() => fetchProductsCallback({}, false)} // Re-fetch on error, ensure not loadMore
                    className="px-4 py-2 bg-brand-teal text-white rounded-md hover:bg-brand-dark"
                  >
                    Try Again
                  </button>
                </div>
            ) : displayedProducts.length === 0 && !loading ? ( // Check displayedProducts here
              <div className="text-center py-10">
                  <p className="text-xl text-gray-600">No products found matching your criteria.</p>
                </div>
              ) : (
                <ProductList 
                title={getTitle()} // This title might be redundant if h1 is already there
                  products={displayedProducts} // Use displayedProducts for rendering
                category={categoryParam || undefined}
                />
              )}
              {hasNextPage && !loading && (
                <div className="mt-8 text-center">
                  <Button 
                    onClick={handleLoadMore} 
                    disabled={isLoadingMore}
                    variant="outline"
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
    </Layout>
  );
};

export default Products;
