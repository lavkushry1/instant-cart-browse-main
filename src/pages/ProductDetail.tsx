import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShoppingCart, Heart, ChevronLeft, Star, Check, AlertCircle } from 'lucide-react';
import { getProductById } from '@/services/productService';
import { getProductSEO } from '@/services/seoService';
import { Product } from '@/types/product';
import { SEO } from '@/types/product';
import { useCart } from '@/hooks/useCart';
import Layout from '@/components/layout/Layout';
import ProductReviews from '@/components/ProductReviews';
import SEOComponent from '@/components/SEO';

const ProductDetail = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [productSEO, setProductSEO] = useState<SEO | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description');
  
  useEffect(() => {
    async function loadProduct() {
      if (!productId) return;
      
      try {
        setLoading(true);
        const [productData, seoData] = await Promise.all([
          getProductById(productId),
          getProductSEO(productId)
        ]);
        
        setProduct(productData);
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
            <div className="relative bg-gray-100 rounded-lg overflow-hidden aspect-square">
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
            </div>
            
            {/* Thumbnail images */}
            {product.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`w-20 h-20 rounded-md overflow-hidden border-2 ${
                      selectedImage === index ? 'border-brand-teal' : 'border-transparent'
                    }`}
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
            
            {/* Action buttons */}
            <div className="flex space-x-3">
            <Button
                className="flex-1"
              onClick={handleAddToCart}
                disabled={product.stock <= 0}
            >
                <ShoppingCart className="mr-2 h-4 w-4" />
                Add to Cart
              </Button>
              <Button 
                variant="secondary" 
                className="flex-1"
                onClick={handleBuyNow}
                disabled={product.stock <= 0}
              >
                Buy Now
              </Button>
              <Button variant="outline" size="icon">
                <Heart className="h-4 w-4" />
            </Button>
            </div>
            
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
          <Tabs 
            defaultValue="description" 
            value={activeTab} 
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="w-full justify-start border-b rounded-none px-4">
            <TabsTrigger value="description">Description</TabsTrigger>
            <TabsTrigger value="specifications">Specifications</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
          </TabsList>
            <TabsContent value="description" className="p-6">
              <div dangerouslySetInnerHTML={{ __html: product.description }} />
            </TabsContent>
            <TabsContent value="specifications" className="p-6">
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
            <TabsContent value="reviews" className="p-6">
              <ProductReviews productId={product.id} productName={product.name} />
          </TabsContent>
        </Tabs>
        </Card>
      </div>
    </Layout>
  );
};

export default ProductDetail;
