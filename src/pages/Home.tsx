import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MainLayout } from '../components/layout/MainLayout';
import { HeroCarousel } from '@/components/marketing/HeroCarousel';
import ProductCard from '@/components/products/ProductCard';
import { Product as LocalProductType } from '@/types/product';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { CurrencyDemo } from '@/components/currency/CurrencyDemo';
import {
  getProducts as fetchServiceProducts,
  Product as ServiceProduct 
} from '@/services/productService';

// Mock categories for now, replace with dynamic fetching later
const mockCategories = [
  { id: '1', slug: 'electronics', name: 'Electronics', icon: '📱' },
  { id: '2', slug: 'fashion', name: 'Fashion', icon: '👕' },
  { id: '3', slug: 'appliances', name: 'Appliances', icon: '🏠' },
  { id: '4', slug: 'beauty', name: 'Beauty', icon: '💄' },
  { id: '5', slug: 'home', name: 'Home & Furniture', icon: '🛋️' },
  { id: '6', slug: 'grocery', name: 'Grocery', icon: '🛒' },
  { id: '7', slug: 'toys', name: 'Toys', icon: '🧸' },
  { id: '8', slug: 'sports', name: 'Sports', icon: '⚽' },
];

const mapServiceProductToLocalHomeProduct = (serviceProduct: ServiceProduct): LocalProductType => {
  const compareAtPrice = serviceProduct.originalPrice ?? serviceProduct.price;
  const discount = serviceProduct.originalPrice && serviceProduct.originalPrice > serviceProduct.price 
    ? Math.round(((serviceProduct.originalPrice - serviceProduct.price) / serviceProduct.originalPrice) * 100) 
    : 0;

  return {
    id: serviceProduct.id,
    name: serviceProduct.name,
    description: serviceProduct.description,
    price: serviceProduct.price,
    images: serviceProduct.images && serviceProduct.images.length > 0 ? serviceProduct.images : ['placeholder.svg'],
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

const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState<LocalProductType[]>([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);

  useEffect(() => {
    const loadFeaturedProducts = async () => {
      setLoadingFeatured(true);
      try {
        const response = await fetchServiceProducts({ featured: true, limit: 8, isEnabled: true });
        const mappedProducts = response.products.map(mapServiceProductToLocalHomeProduct);
        setFeaturedProducts(mappedProducts);
      } catch (error) {
        console.error("Failed to fetch featured products:", error);
      } finally {
        setLoadingFeatured(false);
      }
    };
    loadFeaturedProducts();
  }, []);

  return (
    <MainLayout>
      {/* Hero Carousel */}
      <section className="mb-4">
        <HeroCarousel />
      </section>
      
      {/* Category Icons Grid */}
      <section className="py-4 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-4 md:grid-cols-8 gap-4">
            {mockCategories.map((category) => (
              <Link 
                key={category.id} 
                to={`/category/${category.slug}`}
                className="flex flex-col items-center p-2"
              >
                <div className="w-16 h-16 rounded-full bg-flipkart-gray-background flex items-center justify-center mb-2">
                  <span className="text-2xl">{category.icon}</span>
                </div>
                <span className="text-flipkart-small text-center text-flipkart-gray-primary-text">
                  {category.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>
      
      {/* Deal Sections & Product Carousels */}
      <section className="py-4 bg-white mt-4">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-flipkart-header-md">Top Offers</h2>
            <Link to="/products" className="text-flipkart-blue text-flipkart-body flex items-center">
              <span>VIEW ALL</span>
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {loadingFeatured ? (
              // Loading skeleton
              Array(5).fill(0).map((_, index) => (
                <div key={index} className="bg-white p-2 border border-flipkart-gray-border">
                  <div className="aspect-square bg-gray-100 mb-2 animate-pulse"></div>
                  <div className="h-4 bg-gray-100 mb-2 animate-pulse"></div>
                  <div className="h-4 bg-gray-100 w-1/2 animate-pulse"></div>
                </div>
              ))
            ) : (
              // Product cards
              featuredProducts.slice(0, 5).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))
            )}
          </div>
        </div>
      </section>
      
      {/* Banner Grid */}
      <section className="py-4 bg-white mt-4">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-flipkart-gray-background h-40 md:h-60 rounded flex items-center justify-center">
              <span className="text-flipkart-header-md">Banner 1</span>
            </div>
            <div className="bg-flipkart-gray-background h-40 md:h-60 rounded flex items-center justify-center">
              <span className="text-flipkart-header-md">Banner 2</span>
            </div>
          </div>
        </div>
      </section>
      
      {/* Another Product Carousel */}
      <section className="py-4 bg-white mt-4">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-flipkart-header-md">Best Sellers</h2>
            <Link to="/products" className="text-flipkart-blue text-flipkart-body flex items-center">
              <span>VIEW ALL</span>
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {loadingFeatured ? (
              // Loading skeleton
              Array(5).fill(0).map((_, index) => (
                <div key={index} className="bg-white p-2 border border-flipkart-gray-border">
                  <div className="aspect-square bg-gray-100 mb-2 animate-pulse"></div>
                  <div className="h-4 bg-gray-100 mb-2 animate-pulse"></div>
                  <div className="h-4 bg-gray-100 w-1/2 animate-pulse"></div>
                </div>
              ))
            ) : (
              // Product cards
              featuredProducts.slice(0, 5).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))
            )}
          </div>
        </div>
      </section>
    </MainLayout>
  );
};

export default Home;
