import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MainLayout } from '../components/layout/MainLayout';
import { HeroCarousel } from '@/components/marketing/HeroCarousel';
import ProductCard from '@/components/products/ProductCard';
import { FlipkartDealsSection } from '@/components/marketing/FlipkartDealsSection';
import { Product as LocalProductType } from '@/types/product';
import { ArrowRight } from 'lucide-react';
import {
  getProducts as fetchServiceProducts,
  Product as ServiceProduct 
} from '@/services/productService';

// Categories with image URLs for better display
const homeCategories = [
  { id: '1', slug: 'mobiles', name: 'Mobiles', image: 'https://rukminim1.flixcart.com/flap/128/128/image/22fddf3c7da4c4f4.png?q=100' },
  { id: '2', slug: 'fashion', name: 'Fashion', image: 'https://rukminim1.flixcart.com/flap/128/128/image/c12afc017e6f24cb.png?q=100' },
  { id: '3', slug: 'electronics', name: 'Electronics', image: 'https://rukminim1.flixcart.com/flap/128/128/image/69c6589653afdb9a.png?q=100' },
  { id: '4', slug: 'home', name: 'Home & Furniture', image: 'https://rukminim1.flixcart.com/flap/128/128/image/ab7e2b022a4587dd.jpg?q=100' },
  { id: '5', slug: 'appliances', name: 'Appliances', image: 'https://rukminim1.flixcart.com/flap/128/128/image/0ff199d1bd27eb98.png?q=100' },
  { id: '6', slug: 'grocery', name: 'Grocery', image: 'https://rukminim1.flixcart.com/flap/128/128/image/29327f40e9c4d26b.png?q=100' },
  { id: '7', slug: 'toys', name: 'Toys & Baby', image: 'https://rukminim1.flixcart.com/flap/128/128/image/dff3f7adcf3a90c6.png?q=100' },
  { id: '8', slug: 'travel', name: 'Travel', image: 'https://rukminim1.flixcart.com/flap/128/128/image/71050627a56b4693.png?q=100' },
  { id: '9', slug: 'beauty', name: 'Beauty & Personal Care', image: 'https://rukminim1.flixcart.com/flap/128/128/image/db4365bf1389f3f9.jpg?q=100' },
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
      <section className="mb-2">
        <HeroCarousel />
      </section>
      
      {/* Category Icons Grid - Flipkart Style */}
      <section className="bg-white py-3 mb-2 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-4 md:grid-cols-9 gap-2">
            {homeCategories.map((category) => (
              <Link 
                key={category.id} 
                to={`/category/${category.slug}`}
                className="flex flex-col items-center p-1 text-center"
              >
                <div className="w-14 h-14 md:w-16 md:h-16 mb-1 flex items-center justify-center">
                  <img 
                    src={category.image} 
                    alt={category.name} 
                    className="max-w-full max-h-full object-contain"
                    loading="lazy"
                  />
                </div>
                <span className="text-xs md:text-sm text-center line-clamp-2 h-8">
                  {category.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>
      
      {/* Top Offers Section - Flipkart Style */}
      <FlipkartDealsSection
        title="Top Offers"
        subtitle="Best Deals of the Day"
        viewAllLink="/deals"
        products={featuredProducts.filter(p => p.discount > 10)}
        loading={loadingFeatured}
        imageUrl="/public/images/flipkart-plus-icon.png"
      />
      
      {/* Banner Grid - Flipkart Style */}
      <section className="mb-2">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <Link to="/category/electronics" className="block">
              <img 
                src="https://rukminim1.flixcart.com/fk-p-flap/520/280/image/57438dbd5dcd1e34.jpg?q=20" 
                alt="Electronics Sale" 
                className="w-full h-auto rounded-sm"
              />
            </Link>
            <Link to="/category/home" className="block">
              <img 
                src="https://rukminim1.flixcart.com/fk-p-flap/520/280/image/1001a93eaddd2880.jpg?q=20" 
                alt="Home Decor" 
                className="w-full h-auto rounded-sm"
              />
            </Link>
          </div>
        </div>
      </section>
      
      {/* Best Sellers Section */}
      <FlipkartDealsSection
        title="Best Sellers"
        viewAllLink="/products"
        products={featuredProducts.filter(p => p.featured === 1)}
        loading={loadingFeatured}
        bgColor="bg-white"
      />
      
      {/* New Arrivals Section */}
      <FlipkartDealsSection
        title="New Arrivals"
        subtitle="Just Launched Products"
        viewAllLink="/products/new"
        products={featuredProducts.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ).slice(0, 5)}
        loading={loadingFeatured}
        bgColor="bg-white"
      />
      
      {/* Full Width Banner */}
      <section className="mb-2">
        <div className="container mx-auto px-4">
          <Link to="/sale" className="block">
            <img 
              src="https://rukminim1.flixcart.com/fk-p-flap/1600/140/image/d99c9ca6f9219e13.jpg?q=20" 
              alt="Sale Banner" 
              className="w-full h-auto rounded-sm"
            />
          </Link>
        </div>
      </section>
    </MainLayout>
  );
};

export default Home;
