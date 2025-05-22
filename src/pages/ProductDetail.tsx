import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ShoppingCart, 
  Heart, 
  Star, 
  Check, 
  AlertCircle, 
  Package,
  Share2,
  Zap,
  ArrowLeftRight,
  Truck,
  ChevronDown
} from 'lucide-react';
import { getProductById } from '../services/productService';
import { getProductSEO } from '../services/seoService';
import { Product } from '../types/product';
import { SEO } from '../types/product';
import { useCart } from '../hooks/useCart';
import { useAuth } from '../hooks/useAuth';
import { 
  getGuestWishlist, 
  addToGuestWishlist, 
  removeFromGuestWishlist, 
  isProductInGuestWishlist 
} from '../lib/localStorageUtils';
import { MainLayout } from '../components/layout/MainLayout';
import SEOComponent from '../components/SEO';

const ProductDetail = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { 
    isAuthenticated, 
    addToWishlist, 
    removeFromWishlist, 
    isProductInWishlist 
  } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [productSEO, setProductSEO] = useState<SEO | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description');
  const [isInGuestWishlistLocal, setIsInGuestWishlistLocal] = useState(false);
  
  // Mock data for ratings that would come from an API in a real app
  const ratings = {
    average: 4.3,
    total: 1246,
    distribution: [
      { stars: 5, count: 815, percentage: 65 },
      { stars: 4, count: 267, percentage: 21 },
      { stars: 3, count: 92, percentage: 7 },
      { stars: 2, count: 43, percentage: 4 },
      { stars: 1, count: 29, percentage: 3 },
    ]
  };
  
  // Mock data for specifications that would come from an API in a real app
  const specifications = [
    { 
      category: 'General',
      items: [
        { key: 'Brand', value: 'Apple' },
        { key: 'Model', value: 'iPhone 13' },
        { key: 'Color', value: 'Midnight Blue' },
        { key: 'Warranty', value: '1 Year' },
      ]
    },
    {
      category: 'Technical',
      items: [
        { key: 'Processor', value: 'A15 Bionic' },
        { key: 'RAM', value: '4 GB' },
        { key: 'Storage', value: '128 GB' },
        { key: 'Battery', value: '3240 mAh' },
      ]
    }
  ];
  
  // Mock similar products that would come from an API in a real app
  const similarProducts = [
    { id: 'sim1', name: 'iPhone 12', price: 699, discount: 10, image: '/placeholder-iphone-12.jpg' },
    { id: 'sim2', name: 'iPhone 14', price: 899, discount: 5, image: '/placeholder-iphone-14.jpg' },
    { id: 'sim3', name: 'Samsung Galaxy S22', price: 799, discount: 15, image: '/placeholder-s22.jpg' }
  ];
  
  useEffect(() => {
    async function loadProduct() {
      if (!productId) return;
      
      try {
        setLoading(true);
        const [productDataBE, seoData] = await Promise.all([
          getProductById(productId),
          getProductSEO(productId)
        ]);
        
        if (productDataBE) {
          // Map Backend Product to Client Product type
          const clientProduct: Product = {
            ...productDataBE,
            id: productDataBE.id,
            name: productDataBE.name,
            description: productDataBE.description,
            price: productDataBE.price,
            images: productDataBE.images,
            stock: productDataBE.stock,
            tags: productDataBE.tags || [],
            compareAtPrice: productDataBE.originalPrice ?? productDataBE.price,
            category: productDataBE.categoryName || productDataBE.categoryId,
            discount: productDataBE.originalPrice 
              ? Math.round(((productDataBE.originalPrice - productDataBE.price) / productDataBE.originalPrice) * 100)
              : 0,
            featured: productDataBE.featured ? 1 : 0,
            createdAt: productDataBE.createdAt && typeof productDataBE.createdAt.toDate === 'function' 
              ? productDataBE.createdAt.toDate().toISOString() 
              : new Date().toISOString(),
            updatedAt: productDataBE.updatedAt && typeof productDataBE.updatedAt.toDate === 'function' 
              ? productDataBE.updatedAt.toDate().toISOString() 
              : new Date().toISOString(),
          };
          setProduct(clientProduct);
        } else {
          setProduct(null);
        }
        setProductSEO(seoData);
      } catch (error) {
        console.error('Failed to load product:', error);
        navigate('/not-found');
      } finally {
        setLoading(false);
      }
    }

    loadProduct();
  }, [productId, navigate]);

  useEffect(() => {
    if (!isAuthenticated && product) {
      setIsInGuestWishlistLocal(isProductInGuestWishlist(product.id));
    }
  }, [isAuthenticated, product]);

  const handleAddToCart = () => {
    if (!product) return;
    addToCart(product, quantity);
  };

  const handleBuyNow = () => {
    handleAddToCart();
    navigate('/checkout');
  };
  
  const handleWishlistToggle = () => {
    if (!product) return;
    
    if (isAuthenticated) {
      if (isProductInWishlist(product.id)) {
        removeFromWishlist(product.id);
      } else {
        addToWishlist(product.id);
      }
    } else {
      if (isInGuestWishlistLocal) {
        removeFromGuestWishlist(product.id);
        setIsInGuestWishlistLocal(false);
      } else {
        addToGuestWishlist(product.id);
        setIsInGuestWishlistLocal(true);
      }
    }
  };
  
  const handleImageSelect = (index: number) => {
    setSelectedImage(index);
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="bg-flipkart-gray-background py-4">
          <div className="container mx-auto">
            <div className="bg-white p-6 rounded shadow flex flex-col items-center justify-center">
              <div className="animate-spin w-12 h-12 border-4 border-flipkart-blue border-t-transparent rounded-full"></div>
              <p className="mt-4 text-flipkart-gray-secondary-text">Loading product details...</p>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }
  
  if (!product) {
    return (
      <MainLayout>
        <div className="bg-flipkart-gray-background py-4">
          <div className="container mx-auto">
            <div className="bg-white p-6 rounded shadow flex flex-col items-center justify-center">
              <AlertCircle className="w-16 h-16 text-red-500" />
              <h2 className="mt-4 text-flipkart-header-md font-medium">Product Not Found</h2>
              <p className="mt-2 text-flipkart-gray-secondary-text">
                The product you're looking for doesn't exist or has been removed.
              </p>
              <Button 
                className="mt-6 bg-flipkart-blue hover:bg-flipkart-blue/90"
                onClick={() => navigate('/products')}
              >
                Continue Shopping
              </Button>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }
  
  // Determine current wishlist status
  const currentlyInWishlist = isAuthenticated ? isProductInWishlist(product.id) : isInGuestWishlistLocal;

  return (
    <MainLayout>
      {/* Add SEO component with product data */}
      {product && (
        <SEOComponent
          title={productSEO?.title || product.name}
          description={productSEO?.description || product.description.substring(0, 160)}
          keywords={productSEO?.keywords || product.tags}
          ogImage={productSEO?.ogImage || product.images[0]}
          canonicalUrl={productSEO?.canonicalUrl}
        />
      )}
      
      <div className="bg-flipkart-gray-background py-2">
        <div className="container mx-auto">
          {/* Breadcrumb */}
          <div className="text-flipkart-small text-flipkart-gray-secondary-text pb-2">
            <span className="hover:text-flipkart-blue cursor-pointer" onClick={() => navigate('/')}>Home</span>
            <span className="mx-1">›</span>
            <span className="hover:text-flipkart-blue cursor-pointer" onClick={() => navigate(`/products/${product.category}`)}>
              {product.category}
            </span>
            <span className="mx-1">›</span>
            <span className="text-flipkart-gray-primary-text">{product.name}</span>
          </div>

          {/* Product Details Container */}
          <div className="bg-white p-4 md:grid md:grid-cols-12 gap-4 shadow-sm">
            {/* Image Gallery - 5 columns on desktop */}
            <div className="md:col-span-5 sticky">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Thumbnails - Visible on desktop */}
                <div className="hidden md:flex flex-col gap-2 order-1">
                  {product.images.map((img, idx) => (
                    <div 
                      key={idx} 
                      onClick={() => handleImageSelect(idx)}
                      className={`w-16 h-16 border-2 cursor-pointer ${idx === selectedImage 
                        ? 'border-flipkart-blue' 
                        : 'border-flipkart-gray-border'}`}
                    >
                      <img 
                        src={img} 
                        alt={`${product.name} - view ${idx + 1}`}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  ))}
                </div>
                
                {/* Main Image */}
                <div className="flex-1 relative mb-4 md:mb-0 order-2">
                  <div className="aspect-square bg-white flex justify-center items-center border border-flipkart-gray-border p-4">
                    <img 
                      src={product.images[selectedImage]} 
                      alt={product.name}
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                  
                  {/* Action buttons below image */}
                  <div className="flex mt-4 gap-3">
                    <Button 
                      onClick={handleAddToCart}
                      className="flex-1 gap-2 bg-flipkart-orange hover:bg-flipkart-orange/90 text-white font-medium"
                    >
                      <ShoppingCart className="h-4 w-4" /> ADD TO CART
                    </Button>
                    <Button 
                      onClick={handleBuyNow}
                      className="flex-1 gap-2 bg-flipkart-blue hover:bg-flipkart-blue/90 text-white font-medium"
                    >
                      <Zap className="h-4 w-4" /> BUY NOW
                    </Button>
                  </div>
                </div>
                
                {/* Mobile Thumbnails - Horizontal Scroll */}
                <div className="md:hidden flex gap-2 overflow-x-auto order-1 pb-2">
                  {product.images.map((img, idx) => (
                    <div 
                      key={idx} 
                      onClick={() => handleImageSelect(idx)}
                      className={`flex-shrink-0 w-16 h-16 border-2 ${idx === selectedImage 
                        ? 'border-flipkart-blue' 
                        : 'border-gray-200'}`}
                    >
                      <img 
                        src={img} 
                        alt={`${product.name} - view ${idx + 1}`}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Product Info - 7 columns on desktop */}
            <div className="md:col-span-7 mt-4 md:mt-0">
              {/* Product Title & Highlights */}
              <h1 className="text-flipkart-header-lg font-medium mb-1">{product.name}</h1>
              
              {/* Ratings */}
              <div className="flex items-center gap-2 mb-1">
                <div className="flex items-center bg-green-600 text-white text-xs px-1.5 py-0.5 rounded">
                  <span className="font-medium">{ratings.average}</span>
                  <Star className="h-3 w-3 ml-0.5 fill-current" />
                </div>
                <span className="text-flipkart-small text-flipkart-gray-secondary-text">
                  {ratings.total.toLocaleString()} ratings
                </span>
                {product.featured === 1 && (
                  <span className="flex items-center text-flipkart-small text-flipkart-blue font-medium">
                    <img 
                      src="/flipkart-assured.png" 
                      alt="Flipkart Assured"
                      className="h-4 mr-1"
                    />
                    Flipkart Assured
                  </span>
                )}
              </div>
              
              {/* Special offers */}
              {product.discount > 0 && (
                <div className="text-flipkart-green text-flipkart-small font-medium mb-1">
                  Special Price
                </div>
              )}
              
              {/* Price */}
              <div className="flex items-end gap-2 mb-1">
                <span className="text-[28px] font-medium">₹{product.price}</span>
                {product.compareAtPrice > product.price && (
                  <span className="text-flipkart-gray-secondary-text line-through text-flipkart-body">
                    ₹{product.compareAtPrice}
                  </span>
                )}
                {product.discount > 0 && (
                  <span className="text-flipkart-green text-flipkart-body font-medium">
                    {product.discount}% off
                  </span>
                )}
              </div>
              
              {/* Available offers */}
              <div className="mb-4">
                <h3 className="text-flipkart-body font-medium mb-2">Available offers</h3>
                <ul className="space-y-2">
                  <li className="flex items-start text-flipkart-body">
                    <span className="text-flipkart-green font-semibold mr-2 mt-0.5">⚡</span>
                    <span>
                      <strong className="font-medium">Bank Offer</strong> 5% Cashback on Flipkart Axis Bank Card
                    </span>
                  </li>
                  <li className="flex items-start text-flipkart-body">
                    <span className="text-flipkart-green font-semibold mr-2 mt-0.5">⚡</span>
                    <span>
                      <strong className="font-medium">Partner Offer</strong> Sign up for Flipkart Pay Later
                    </span>
                  </li>
                </ul>
              </div>
              
              {/* Delivery */}
              <div className="mb-4">
                <div className="flex items-start gap-6 py-3 border-t border-flipkart-gray-border">
                  <span className="text-flipkart-body text-flipkart-gray-secondary-text w-20">Delivery</span>
                  <div>
                    <div className="flex items-center mb-2">
                      <input 
                        type="text" 
                        placeholder="Enter delivery pincode" 
                        className="text-flipkart-body border-b border-flipkart-gray-border focus:outline-none focus:border-flipkart-blue pb-1 w-40"
                      />
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-flipkart-blue hover:bg-transparent p-0 pl-2 h-auto"
                      >
                        Check
                      </Button>
                    </div>
                    <div className="flex items-center text-flipkart-body">
                      <Truck className="h-4 w-4 mr-2 text-flipkart-gray-secondary-text" />
                      Typically delivered in 3-5 days
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Highlights & Seller */}
              <div className="flex flex-col md:flex-row gap-6">
                {/* Highlights */}
                <div className="flex items-start gap-6 py-3 border-t border-flipkart-gray-border">
                  <span className="text-flipkart-body text-flipkart-gray-secondary-text w-20">Highlights</span>
                  <ul className="list-disc pl-4 text-flipkart-body space-y-1">
                    {product.tags.slice(0, 5).map((tag, idx) => (
                      <li key={idx}>{tag}</li>
                    ))}
                  </ul>
                </div>
                
                {/* Seller */}
                <div className="flex items-start gap-6 py-3 border-t border-flipkart-gray-border">
                  <span className="text-flipkart-body text-flipkart-gray-secondary-text w-20">Seller</span>
                  <div className="text-flipkart-body">
                    <div className="flex items-center">
                      <span className="text-flipkart-blue font-medium">SuperComNet</span>
                      <div className="ml-2 flex items-center bg-green-600 text-white text-xs px-1.5 py-0.5 rounded">
                        <span className="font-medium">4.8</span>
                        <Star className="h-3 w-3 ml-0.5 fill-current" />
                      </div>
                    </div>
                    <ul className="mt-2 space-y-1">
                      <li className="flex items-center">
                        <Check className="h-4 w-4 mr-1 text-gray-600" /> 7 day seller replacement
                      </li>
                      <li className="flex items-center">
                        <Check className="h-4 w-4 mr-1 text-gray-600" /> GST invoice available
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
              
              {/* Share and Compare buttons */}
              <div className="flex gap-6 mt-4 border-t border-flipkart-gray-border pt-4">
                <Button
                  variant="ghost"
                  onClick={handleWishlistToggle}
                  className={`p-0 hover:bg-transparent ${currentlyInWishlist ? 'text-red-500' : 'text-flipkart-gray-secondary-text'}`}
                >
                  <Heart className={`h-5 w-5 mr-2 ${currentlyInWishlist ? 'fill-red-500' : ''}`} />
                  SAVE
                </Button>
                <Button
                  variant="ghost"
                  className="p-0 hover:bg-transparent text-flipkart-gray-secondary-text"
                >
                  <Share2 className="h-5 w-5 mr-2" />
                  SHARE
                </Button>
                <Button
                  variant="ghost"
                  className="p-0 hover:bg-transparent text-flipkart-gray-secondary-text"
                >
                  <ArrowLeftRight className="h-5 w-5 mr-2" />
                  COMPARE
                </Button>
              </div>
            </div>
          </div>
          
          {/* Product Specifications */}
          <div className="bg-white mt-3 p-4 shadow-sm">
            <h2 className="text-flipkart-header-md font-medium mb-4">Specifications</h2>
            
            <div className="divide-y divide-flipkart-gray-border">
              {specifications.map((specGroup, idx) => (
                <div key={idx} className="py-4">
                  <h3 className="text-flipkart-header-sm font-medium mb-3">{specGroup.category}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2">
                    {specGroup.items.map((spec, specIdx) => (
                      <div key={specIdx} className="flex">
                        <span className="text-flipkart-gray-secondary-text text-flipkart-body w-40">{spec.key}</span>
                        <span className="text-flipkart-body">{spec.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2 text-flipkart-blue border-flipkart-blue hover:bg-transparent"
            >
              READ MORE
            </Button>
          </div>
          
          {/* Product Description */}
          <div className="bg-white mt-3 p-4 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-flipkart-header-md font-medium">Product Description</h2>
              <Button 
                variant="outline" 
                size="sm" 
                className="text-flipkart-blue border-flipkart-blue hover:bg-transparent hidden md:inline-flex"
              >
                READ MORE
              </Button>
            </div>
            
            <div className="text-flipkart-body">
              <p className="line-clamp-3 md:line-clamp-none">
                {product.description}
              </p>
            </div>
            
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2 text-flipkart-blue border-flipkart-blue hover:bg-transparent md:hidden"
            >
              READ MORE
            </Button>
          </div>
          
          {/* Rating & Reviews */}
          <div className="bg-white mt-3 p-4 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-flipkart-header-md font-medium">Ratings & Reviews</h2>
              <Button 
                variant="outline" 
                size="sm" 
                className="text-flipkart-blue border-flipkart-blue hover:bg-transparent"
              >
                Rate Product
              </Button>
            </div>
            
            <div className="flex flex-col md:flex-row gap-6">
              {/* Rating Summary */}
              <div className="md:w-60 p-4 bg-gray-50 rounded">
                <div className="flex flex-col items-center">
                  <div className="flex items-center text-xl font-bold mb-1">
                    {ratings.average}
                    <Star className="h-4 w-4 ml-1 text-green-600 fill-current" />
                  </div>
                  <div className="text-sm text-gray-500 mb-4">
                    {ratings.total.toLocaleString()} ratings
                  </div>
                  
                  <div className="w-full space-y-1">
                    {ratings.distribution.map((item) => (
                      <div key={item.stars} className="flex items-center">
                        <div className="text-sm w-12">
                          {item.stars}
                          <Star className="h-3 w-3 inline-block ml-0.5 text-gray-400 fill-current" />
                        </div>
                        <div className="flex-1 mx-2 bg-gray-200 rounded-full h-2">
                          <div 
                            className="h-2 bg-green-500 rounded-full" 
                            style={{ width: `${item.percentage}%` }}
                          ></div>
                        </div>
                        <div className="text-sm w-8 text-gray-500">
                          {item.count}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Reviews List Preview */}
              <div className="flex-1">
                {/* Just showing a placeholder for now */}
                <div className="border-b border-flipkart-gray-border pb-4 mb-4">
                  <div className="flex items-center mb-2">
                    <div className="flex items-center bg-green-600 text-white text-xs px-1.5 py-0.5 rounded">
                      <span className="font-medium">5</span>
                      <Star className="h-3 w-3 ml-0.5 fill-current" />
                    </div>
                    <span className="ml-2 text-flipkart-body font-medium">Perfect Product!</span>
                  </div>
                  <p className="text-flipkart-body mb-2">
                    This is an amazing product with great quality and value. Highly recommended!
                  </p>
                  <div className="flex items-center text-flipkart-small text-flipkart-gray-secondary-text">
                    <span className="mr-4">John D.</span>
                    <span>Verified Purchase</span>
                  </div>
                </div>
                
                <Button 
                  variant="outline" 
                  className="text-flipkart-blue border-flipkart-blue hover:bg-transparent"
                  size="sm"
                >
                  READ ALL REVIEWS
                </Button>
              </div>
            </div>
          </div>
          
          {/* Similar Products */}
          <div className="bg-white mt-3 p-4 shadow-sm">
            <h2 className="text-flipkart-header-md font-medium mb-4">Similar Products</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              {similarProducts.map(item => (
                <div key={item.id} className="border border-flipkart-gray-border p-2 rounded">
                  <div className="aspect-square flex items-center justify-center mb-2">
                    <img 
                      src={item.image || "https://placehold.co/200x200?text=Product"} 
                      alt={item.name}
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                  <div className="text-center">
                    <h3 className="text-flipkart-body font-medium mb-1 line-clamp-1">{item.name}</h3>
                    <div className="flex justify-center items-center gap-1">
                      <span className="font-medium">₹{item.price}</span>
                      {item.discount > 0 && (
                        <span className="text-flipkart-green text-flipkart-small">
                          {item.discount}% off
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default ProductDetail;
