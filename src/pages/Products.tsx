import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import ProductList from '@/components/products/ProductList';
import ProductFilter, { FilterOptions } from '@/components/products/ProductFilter';
import { Product } from '@/types/product';
import { 
  getAllProducts, 
  getProductsByCategory, 
  searchProducts, 
  getAllCategories, 
  getAllTags, 
  getMaxProductPrice,
  getFilteredProducts 
} from '@/services/productService';
import { Loader2 } from 'lucide-react';

const Products = () => {
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [maxPrice, setMaxPrice] = useState(10000);
  
  const category = searchParams.get('category');
  const searchQuery = searchParams.get('search');
  
  // Initial product load
  useEffect(() => {
    async function loadProducts() {
      try {
        setLoading(true);
        
        // Load categories, tags, and max price
        const [allCategories, allTags, maxProductPrice] = await Promise.all([
          getAllCategories(),
          getAllTags(),
          getMaxProductPrice()
        ]);
        
        setCategories(allCategories);
        setTags(allTags);
        setMaxPrice(maxProductPrice);
        
        // Load products based on URL parameters
        let productsData: Product[] = [];
        
        if (category) {
          // Load products by category
          productsData = await getProductsByCategory(category);
        } else if (searchQuery) {
          // Load products matching search query
          productsData = await searchProducts(searchQuery);
        } else {
          // Load all products
          productsData = await getAllProducts();
        }
        
        setProducts(productsData);
        setFilteredProducts(productsData);
        setError(null);
      } catch (error) {
        console.error('Error loading products:', error);
        setError('Failed to load products. Please try again later.');
      } finally {
        setLoading(false);
      }
    }
    
    loadProducts();
  }, [category, searchQuery]);
  
  // Handle filter changes
  const handleFilterChange = async (filters: FilterOptions) => {
    try {
      setLoading(true);
      
      // If we have a category from URL, ensure it's included in the filter
      if (category && !filters.categories.includes(category)) {
        filters.categories = [...filters.categories, category];
      }
      
      // Apply filters to products
      const filtered = await getFilteredProducts(filters);
      setFilteredProducts(filtered);
    } catch (error) {
      console.error('Error applying filters:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const getTitle = () => {
    if (category) {
      return `${category.charAt(0).toUpperCase() + category.slice(1)} Products`;
    } else if (searchQuery) {
      return `Search Results: "${searchQuery}"`;
    }
    return 'All Products';
  };
  
  return (
    <Layout>
      {loading && products.length === 0 ? (
        <div className="container mx-auto py-16 flex justify-center items-center">
          <div className="flex flex-col items-center">
            <Loader2 className="h-12 w-12 animate-spin text-brand-teal" />
            <p className="mt-4 text-gray-500">Loading products...</p>
          </div>
        </div>
      ) : error ? (
        <div className="container mx-auto py-16 flex justify-center items-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-500 mb-2">Oops!</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-brand-teal text-white rounded-md hover:bg-brand-dark"
            >
              Try Again
            </button>
          </div>
        </div>
      ) : (
        <div className="container mx-auto py-8 px-4">
          <h1 className="text-3xl font-bold mb-6">{getTitle()}</h1>
          
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Filters sidebar */}
            <div className="lg:col-span-1">
              <ProductFilter 
                categories={categories}
                tags={tags}
                maxPrice={maxPrice}
                onFilterChange={handleFilterChange}
                initialFilters={{
                  categories: category ? [category] : [],
                  tags: [],
                  priceRange: [0, maxPrice],
                  inStock: false,
                  onSale: false
                }}
              />
            </div>
            
            {/* Product listing */}
            <div className="lg:col-span-3">
              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-brand-teal" />
                </div>
              ) : (
                <ProductList 
                  title={getTitle()}
                  products={filteredProducts}
                  category={category || undefined}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Products;
