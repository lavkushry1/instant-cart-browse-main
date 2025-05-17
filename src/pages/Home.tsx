import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import ProductGrid from '../components/products/ProductGrid';
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
  { id: '1', slug: 'electronics', name: 'Electronics', subcategories: { length: 5 } },
  { id: '2', slug: 'fashion', name: 'Fashion', subcategories: { length: 8 } },
  { id: '3', slug: 'home-garden', name: 'Home & Garden', subcategories: { length: 12 } },
  { id: '4', slug: 'sports', name: 'Sports & Outdoors', subcategories: { length: 6 } },
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
    // seo: undefined, // Assuming SEO is handled separately
  };
};

const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState<LocalProductType[]>([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);
  // const [categories, setCategories] = useState<any[]>(mockCategories); // Using mock categories

  useEffect(() => {
    const loadFeaturedProducts = async () => {
      setLoadingFeatured(true);
      try {
        const response = await fetchServiceProducts({ featured: true, limit: 4, isEnabled: true });
        const mappedProducts = response.products.map(mapServiceProductToLocalHomeProduct);
        setFeaturedProducts(mappedProducts);
      } catch (error) {
        console.error("Failed to fetch featured products:", error);
        // Optionally set an error state to display a message
      } finally {
        setLoadingFeatured(false);
      }
    };
    loadFeaturedProducts();
  }, []);

  return (
    <Layout>
      {/* Hero Banner */}
      <section className="relative bg-gradient-to-r from-brand-light to-white overflow-hidden">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 mb-8 md:mb-0">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
                Shop the Latest Trends
              </h1>
              <p className="text-lg md:text-xl mb-6 text-gray-700">
                Discover amazing products at unbeatable prices. From electronics to fashion, we've got you covered.
              </p>
              <div className="flex space-x-4">
                <Link to="/products">
                  <Button className="bg-brand-teal hover:bg-brand-dark text-white px-8 py-6 rounded-md text-lg">
                    Shop Now
                  </Button>
                </Link>
                <Link to="/deals">
                  <Button variant="outline" className="border-brand-teal text-brand-teal hover:bg-brand-light px-8 py-6 rounded-md text-lg">
                    View Deals
                  </Button>
                </Link>
              </div>
            </div>
            <div className="md:w-1/2 relative">
              <img 
                src="https://images.unsplash.com/photo-1488590528505-98d2b5aba04b" 
                alt="Featured product" 
                className="rounded-lg shadow-lg max-w-full mx-auto"
              />
            </div>
          </div>
        </div>
      </section>
      
      {/* Multi-Currency Feature */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <CurrencyDemo />
        </div>
      </section>
      
      {/* Categories */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold">Shop by Category</h2>
            <Link to="/products" className="text-brand-teal hover:underline flex items-center">
              <span>View All</span>
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {mockCategories.map((category) => (
              <Link 
                key={category.id} 
                to={`/products?category=${category.slug}`} // Updated link to use query param for category page
                className="transform transition-transform hover:-translate-y-1 hover:shadow-md"
              >
                <div className="bg-white rounded-lg shadow p-6 text-center h-full flex flex-col justify-center items-center">
                  <h3 className="font-medium text-lg mb-2">{category.name}</h3>
                  <p className="text-sm text-gray-500">
                    {category.subcategories.length} Subcategories
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
      
      {/* Featured Products */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold">Featured Products</h2>
            <Link to="/products" className="text-brand-teal hover:underline flex items-center">
              <span>View All</span>
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
          
          <ProductGrid products={featuredProducts} loading={loadingFeatured} />
        </div>
      </section>
      
      {/* Deals Banner */}
      <section className="py-12 bg-gradient-to-r from-brand-dark to-brand-teal text-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="mb-6 md:mb-0">
              <h2 className="text-2xl md:text-3xl font-bold mb-2">Special Offers</h2>
              <p className="text-lg opacity-90">
                Save up to 50% off on selected items!
              </p>
            </div>
            <Link to="/deals">
              <Button className="bg-white text-brand-teal hover:bg-gray-100">
                View All Deals
              </Button>
            </Link>
          </div>
        </div>
      </section>
      
      {/* Why Choose Us */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">Why Choose Us</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6 rounded-lg border border-gray-100 hover:shadow-md transition-shadow">
              <div className="inline-block p-4 bg-brand-light rounded-full mb-4">
                <svg className="w-8 h-8 text-brand-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Quality Products</h3>
              <p className="text-gray-600">
                We ensure that all our products meet the highest quality standards before they reach you.
              </p>
            </div>
            
            <div className="text-center p-6 rounded-lg border border-gray-100 hover:shadow-md transition-shadow">
              <div className="inline-block p-4 bg-brand-light rounded-full mb-4">
                <svg className="w-8 h-8 text-brand-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Fast Delivery</h3>
              <p className="text-gray-600">
                We process and ship your orders quickly, so you can enjoy your purchases as soon as possible.
              </p>
            </div>
            
            <div className="text-center p-6 rounded-lg border border-gray-100 hover:shadow-md transition-shadow">
              <div className="inline-block p-4 bg-brand-light rounded-full mb-4">
                <svg className="w-8 h-8 text-brand-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Secure Payments</h3>
              <p className="text-gray-600">
                Your payment information is always secure with our encrypted payment processing system.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Newsletter */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Subscribe to Our Newsletter</h2>
            <p className="text-gray-600 mb-6">
              Stay updated with our latest products, special offers, and promotions.
            </p>
            <form className="flex flex-col md:flex-row gap-4">
              <input
                type="email"
                placeholder="Your email address"
                className="flex-grow px-4 py-3 rounded-md border focus:outline-none focus:ring-2 focus:ring-brand-teal"
                required
              />
              <Button type="submit" className="bg-brand-teal hover:bg-brand-dark text-white">
                Subscribe
              </Button>
            </form>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Home;
