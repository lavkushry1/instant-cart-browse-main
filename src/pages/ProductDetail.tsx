import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShoppingCart, Heart, ChevronLeft, Star, Check, AlertCircle, ChevronRight } from 'lucide-react';
import { getProductByIdBE } from '@/services/productService';
import { getProductSEO } from '@/services/seoService';
import { Product } from '@/types/product';
import { SEO } from '@/types/product';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { 
  getGuestWishlist, 
  addToGuestWishlist, 
  removeFromGuestWishlist, 
  isProductInGuestWishlist 
} from '@/lib/localStorageUtils';
import Layout from '@/components/layout/Layout';
import ProductReviews from '@/components/ProductReviews';
import SEOComponent from '@/components/SEO';

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
  
  useEffect(() => {
    async function loadProduct() {
      if (!productId) return;
      
      try {
        setLoading(true);
        const [productDataBE, seoData] = await Promise.all([
          getProductByIdBE(productId),
          getProductSEO(productId)
        ]);
        
        if (productDataBE) {
          // Map Backend Product to Client Product type
          const clientProduct: Product = {
            ...productDataBE,
            id: productDataBE.id, // ensure id is passed
            name: productDataBE.name,
            description: productDataBE.description,
            price: productDataBE.price,
            images: productDataBE.images,
            stock: productDataBE.stock,
            tags: productDataBE.tags || [],
            // Fields causing type error - provide defaults or map from BE type
            compareAtPrice: productDataBE.originalPrice ?? productDataBE.price, // Map originalPrice or default
            category: productDataBE.categoryName || productDataBE.categoryId, // Map categoryName or categoryId
            discount: 0, // Default discount, as it's not in BE product
            featured: productDataBE.featured ? 1 : 0, // Coerce boolean to number, or default
            // Convert Timestamps to string representations (e.g., ISO string)
            createdAt: productDataBE.createdAt && typeof (productDataBE.createdAt as any).toDate === 'function' ? (productDataBE.createdAt as any).toDate().toISOString() : new Date().toISOString(),
            updatedAt: productDataBE.updatedAt && typeof (productDataBE.updatedAt as any).toDate === 'function' ? (productDataBE.updatedAt as any).toDate().toISOString() : new Date().toISOString(),
            // seo can remain optional or be mapped if seoData is meant to be part of product object
          };
          setProduct(clientProduct);
        } else {
          setProduct(null);
        }
        setProductSEO(seoData);
      } catch (error) {
        console.error('Failed to load product:', error);
        // Navigate to 404 page if product not found
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
    // This effect should also run if the product.id changes or auth state changes.
  }, [isAuthenticated, product]); // Added product to dependencies

  const handleAddToCart = () => {
    if (!product) return;
    addToCart(product, quantity);
  };

  const handleBuyNow = () => {
    handleAddToCart();
    navigate('/checkout');
  };
  
  const incrementQuantity = () => {
    if (product && quantity < product.stock) {
      setQuantity(prev => prev + 1);
    }
  };
  
  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };
  
  const handleNextImage = () => {
    if (product && product.images.length > 0) {
      setSelectedImage((prevIndex) => (prevIndex + 1) % product.images.length);
    }
  };

  const handlePrevImage = () => {
    if (product && product.images.length > 0) {
      setSelectedImage((prevIndex) => (prevIndex - 1 + product.images.length) % product.images.length);
    }
  };
  
  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto py-16 px-4">
          <div className="flex flex-col items-center justify-center">
            <div className="animate-spin w-12 h-12 border-4 border-brand-teal border-t-transparent rounded-full"></div>
            <p className="mt-4 text-gray-500">Loading product details...</p>
          </div>
        </div>
      </Layout>
    );
  }
  
  if (!product) {
    return (
      <Layout>
        <div className="container mx-auto py-16 px-4">
          <div className="flex flex-col items-center justify-center">
            <AlertCircle className="w-16 h-16 text-red-500" />
            <h2 className="mt-4 text-2xl font-bold">Product Not Found</h2>
            <p className="mt-2 text-gray-500">
              The product you're looking for doesn't exist or has been removed.
            </p>
            <Button 
              className="mt-6"
              onClick={() => navigate('/')}
            >
                Continue Shopping
              </Button>
          </div>
        </div>
      </Layout>
    );
  }
  
  // Determine current wishlist status for the button
  const currentlyInWishlist = isAuthenticated ? isProductInWishlist(product.id) : isInGuestWishlistLocal;
  const wishlistButtonText = currentlyInWishlist ? 'Remove from Wishlist' : 'Add to Wishlist';
  const wishlistButtonClasses = `flex-shrink-0 w-full sm:w-auto border-gray-300 ${
    currentlyInWishlist 
      ? 'text-red-500 hover:bg-red-50 border-red-300 hover:border-red-400' 
      : 'text-gray-700 hover:bg-gray-100'
  }`;
  const heartIconClasses = `mr-2 h-5 w-5 ${currentlyInWishlist ? 'fill-red-500' : ''}`;

  return (
    <Layout>
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
      
      <div className="container mx-auto py-8 px-4">
        {/* Breadcrumb */}
        <div className="flex items-center mb-6 text-sm">
          <button 
            onClick={() => navigate(-1)} 
            className="flex items-center text-gray-500 hover:text-brand-teal"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </button>
          <span className="mx-2 text-gray-500">/</span>
          <button 
            onClick={() => navigate('/')} 
            className="text-gray-500 hover:text-brand-teal"
          >
            Home
          </button>
          <span className="mx-2 text-gray-500">/</span>
          <button 
            onClick={() => navigate(`/category/${product.category}`)} 
            className="text-gray-500 hover:text-brand-teal"
          >
            {product.category}
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="relative bg-gray-100 rounded-lg overflow-hidden aspect-square group">
              <img
                src={product.images[selectedImage]} 
                alt={product.name}
                className="w-full h-full object-cover"
              />
              {product.discount > 0 && (
                <Badge className="absolute top-4 right-4 bg-red-500">
                  {product.discount}% OFF
                </Badge>
              )}
              {product.images.length > 1 && (
                <>
                  <Button 
                    variant="outline"
                    size="icon"
                    className="absolute top-1/2 left-2 -translate-y-1/2 z-10 bg-white/50 hover:bg-white/80 opacity-0 group-hover:opacity-100 transition-opacity rounded-full"
                    onClick={handlePrevImage}
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </Button>
                  <Button 
                    variant="outline"
                    size="icon"
                    className="absolute top-1/2 right-2 -translate-y-1/2 z-10 bg-white/50 hover:bg-white/80 opacity-0 group-hover:opacity-100 transition-opacity rounded-full"
                    onClick={handleNextImage}
                    aria-label="Next image"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </Button>
                </>
              )}
            </div>
            
            {product.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`w-20 h-20 rounded-md overflow-hidden border-2 ${
                      selectedImage === index ? 'border-brand-teal' : 'border-transparent'
                    } focus:outline-none focus:ring-2 focus:ring-brand-teal focus:ring-offset-2`}
                    aria-label={`View image ${index + 1}`}
                >
                  <img
                      src={image} 
                      alt={`${product.name} thumbnail ${index + 1}`} 
                      className="w-full h-full object-cover"
                  />
                  </button>
              ))}
            </div>
            )}
          </div>
          
          {/* Product Details */}
          <div className="space-y-6">
          <div>
              <h1 className="text-3xl font-bold">{product.name}</h1>
              <div className="flex items-center space-x-2 mt-1">
              <div className="flex">
                  {[1, 2, 3, 4, 5].map(star => (
                    <Star 
                      key={star}
                      className={`h-4 w-4 ${star <= 4 ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                    />
                  ))}
                </div>
                <span className="text-sm text-gray-500">(24 reviews)</span>
              </div>
            </div>
            
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-bold">₹{product.price}</span>
              {product.compareAtPrice > 0 && (
                <span className="text-xl text-gray-400 line-through">₹{product.compareAtPrice}</span>
              )}
              {product.discount > 0 && (
                <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Save {product.discount}%</Badge>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="font-medium">Availability:</span>
              {product.stock > 0 ? (
                <span className="text-green-600 flex items-center">
                  <Check className="h-4 w-4 mr-1" />
                  In Stock ({product.stock} items)
                </span>
              ) : (
                <span className="text-red-500 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  Out of Stock
                </span>
              )}
            </div>
            
            {/* Quantity selector */}
            <div className="space-y-2">
              <label className="font-medium">Quantity:</label>
              <div className="flex items-center space-x-2">
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={decrementQuantity}
                  disabled={quantity <= 1}
                >
                  -
                </Button>
                <span className="w-12 text-center">{quantity}</span>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={incrementQuantity}
                  disabled={product.stock <= quantity}
                >
                  +
                </Button>
              </div>
            </div>
            
            {/* Action Buttons */}
            {product.stock > 0 && (
              <div className="flex flex-col sm:flex-row gap-3 mt-6">
                <Button 
                  size="lg" 
                  className="flex-1 bg-brand-teal hover:bg-brand-teal-dark"
                  onClick={handleAddToCart}
                >
                  <ShoppingCart className="mr-2 h-5 w-5" /> Add to Cart
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  className="flex-1 border-brand-teal text-brand-teal hover:bg-brand-teal-lightest hover:text-brand-teal-dark"
                  onClick={handleBuyNow}
                >
                  Buy Now
                </Button>
                
                {/* Wishlist Button - Modified for guest functionality */}
                {product && ( // Ensure product is loaded before rendering button
                  <Button 
                    size="lg" 
                    variant={"outline"}
                    className={wishlistButtonClasses}
                    onClick={() => {
                      if (!product) return; // Should not happen if button is rendered
                      if (isAuthenticated) {
                        isProductInWishlist(product.id) 
                          ? removeFromWishlist(product.id) 
                          : addToWishlist(product.id);
                      } else {
                        // Guest wishlist logic
                        if (isInGuestWishlistLocal) {
                          removeFromGuestWishlist(product.id);
                          setIsInGuestWishlistLocal(false);
                        } else {
                          addToGuestWishlist(product.id);
                          setIsInGuestWishlistLocal(true);
                        }
                      }
                    }}
                    aria-label={wishlistButtonText}
                  >
                    <Heart className={heartIconClasses} /> 
                    {wishlistButtonText}
                  </Button>
                )}
              </div>
            )}
            
            {/* Product tags */}
            <div className="flex flex-wrap gap-2">
              {product.tags.map(tag => (
                <Badge 
                  key={tag} 
                  variant="outline" 
                  className="text-gray-600 cursor-pointer hover:bg-gray-100"
                  onClick={() => navigate(`/tag/${tag}`)}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </div>
        
        {/* Product description and additional info */}
        <Card className="mt-12">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-8">
            <TabsList>
              <TabsTrigger value="description">Description</TabsTrigger>
              <TabsTrigger value="specifications">Specifications</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
            </TabsList>
            <TabsContent value="description" className="mt-4 prose max-w-none dark:prose-invert">
              <div dangerouslySetInnerHTML={{ __html: product.description }} />
            </TabsContent>
            <TabsContent value="specifications" className="mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                <div className="border-b pb-2">
                  <p className="text-sm text-gray-500">Category</p>
                  <p className="font-medium">{product.category}</p>
                </div>
                <div className="border-b pb-2">
                  <p className="text-sm text-gray-500">Brand</p>
                  <p className="font-medium">Instant Cart</p>
                </div>
                <div className="border-b pb-2">
                  <p className="text-sm text-gray-500">Stock</p>
                  <p className="font-medium">{product.stock} items</p>
                </div>
                <div className="border-b pb-2">
                  <p className="text-sm text-gray-500">SKU</p>
                  <p className="font-medium">IC-{product.id}</p>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="reviews" className="mt-4">
              {product && productId && (
                <ProductReviews productId={productId} productName={product.name} />
              )}
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </Layout>
  );
};

export default ProductDetail;
