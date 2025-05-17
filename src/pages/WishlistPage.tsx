import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';
import { Product as ServiceProduct, getProductById } from '@/services/productService';
import { Product as ClientProduct } from '@/types/product';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Trash2, ShoppingCart, HeartCrack, Info } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Timestamp as ClientTimestamp } from 'firebase/firestore';
import { 
  getGuestWishlist, 
  removeFromGuestWishlist as removeFromLocalStorageGuestWishlist,
  isProductInGuestWishlist 
} from '@/lib/localStorageUtils';

const WishlistPage = () => {
  const { isAuthenticated, wishlist: authWishlist, removeFromWishlist: removeFromAuthWishlist, isLoading: isAuthLoading } = useAuth();
  const { addToCart } = useCart();
  const [wishlistProducts, setWishlistProducts] = useState<ClientProduct[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const navigate = useNavigate();

  // State for guest wishlist IDs
  const [guestWishlistIds, setGuestWishlistIds] = useState<string[]>([]);

  // Memoized map function
  const mapServiceProductToClientProduct = useCallback((serviceProduct: ServiceProduct): ClientProduct => {
    return {
      id: serviceProduct.id,
      name: serviceProduct.name,
      description: serviceProduct.description,
      price: serviceProduct.price,
      compareAtPrice: serviceProduct.originalPrice ?? serviceProduct.price,
      images: serviceProduct.images || [],
      category: serviceProduct.categoryName || serviceProduct.categoryId || 'Unknown',
      tags: serviceProduct.tags || [],
      stock: serviceProduct.stock || 0,
      featured: serviceProduct.featured ? 1 : 0,
      discount: 0, 
      createdAt: serviceProduct.createdAt instanceof ClientTimestamp ? serviceProduct.createdAt.toDate().toISOString() : new Date().toISOString(),
      updatedAt: serviceProduct.updatedAt instanceof ClientTimestamp ? serviceProduct.updatedAt.toDate().toISOString() : new Date().toISOString(),
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated && !isAuthLoading) {
      // Load guest wishlist from local storage if not authenticated
      setGuestWishlistIds(getGuestWishlist());
    }
  }, [isAuthenticated, isAuthLoading]);

  useEffect(() => {
    const fetchProducts = async (productIds: string[]) => {
      if (productIds.length > 0) {
        setIsLoadingProducts(true);
        try {
          const productPromises = productIds.map(productId => getProductById(productId));
          const resolvedServiceProducts = await Promise.all(productPromises);
          const mappedProducts = resolvedServiceProducts
            .filter(p => p !== null)
            .map(p => mapServiceProductToClientProduct(p as ServiceProduct));
          setWishlistProducts(mappedProducts);
        } catch (error) {
          console.error("Error fetching wishlist products:", error);
          toast.error('Could not load wishlist items.');
          setWishlistProducts([]);
        } finally {
          setIsLoadingProducts(false);
        }
      } else {
        setWishlistProducts([]);
      }
    };

    if (isAuthenticated) {
      fetchProducts(authWishlist);
    } else if (!isAuthLoading) { // Only fetch for guest if auth is not loading
      fetchProducts(guestWishlistIds);
    }
  }, [isAuthenticated, authWishlist, guestWishlistIds, isAuthLoading, mapServiceProductToClientProduct]);

  const handleRemoveFromWishlist = async (productId: string) => {
    if (isAuthenticated) {
      try {
        await removeFromAuthWishlist(productId);
        toast.success('Item removed from wishlist.');
        // Auth wishlist updates via context, triggering re-fetch by dependency change
      } catch (error) {
        toast.error('Failed to remove item from wishlist.');
      }
    } else {
      // Guest wishlist
      const updatedGuestIds = removeFromLocalStorageGuestWishlist(productId);
      setGuestWishlistIds(updatedGuestIds); // This will trigger the useEffect to re-fetch products
      toast.success('Item removed from your guest wishlist.');
    }
  };

  const handleAddToCart = (product: ClientProduct) => {
    if (!product) return;
    try {
      addToCart(product, 1);
      toast.success(`${product.name} added to cart!`);
    } catch (error) {
      console.error("Error adding to cart from wishlist:", error);
      toast.error('Failed to add item to cart.');
    }
  };
  
  // Loading state for initial auth check or when products are being fetched
  if (isAuthLoading || isLoadingProducts) {
    return (
      <>
        <Header />
        <main className="container mx-auto py-10 min-h-[calc(100vh-12rem)] flex items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
          <p className="ml-4 text-lg">Loading your wishlist...</p>
        </main>
        <Footer />
      </>
    );
  }

  // If not authenticated and wishlist is empty
  if (!isAuthenticated && wishlistProducts.length === 0) {
    return (
      <>
        <Header />
        <main className="container mx-auto py-10 min-h-[calc(100vh-12rem)] flex flex-col items-center justify-center text-center">
          <HeartCrack className="w-24 h-24 text-gray-400 mb-6" />
          <h1 className="text-2xl font-semibold mb-3">Your Wishlist is Empty</h1>
          <p className="text-gray-600 mb-6">Looks like you haven't added anything to your wishlist yet. <br/>Start exploring and save your favorites!</p>
          <Button asChild className="bg-blue-600 hover:bg-blue-700">
            <Link to="/">Start Shopping</Link>
          </Button>
        </main>
        <Footer />
      </>
    );
  }

  // If authenticated and wishlist is empty
  if (isAuthenticated && wishlistProducts.length === 0) {
     return (
      <>
        <Header />
        <main className="container mx-auto py-10 min-h-[calc(100vh-12rem)] flex flex-col items-center justify-center text-center">
          <HeartCrack className="w-24 h-24 text-gray-400 mb-6" />
          <h1 className="text-2xl font-semibold mb-3">Your Wishlist is Empty</h1>
          <p className="text-gray-600 mb-6">Looks like you haven't added anything to your wishlist yet. <br/>Start exploring and save your favorites!</p>
          <Button asChild className="bg-blue-600 hover:bg-blue-700">
            <Link to="/">Start Shopping</Link>
          </Button>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="container mx-auto py-10">
        {!isAuthenticated && wishlistProducts.length > 0 && (
          <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 mb-6 rounded-md" role="alert">
            <div className="flex">
              <div className="py-1"><Info className="h-6 w-6 text-blue-500 mr-3"/></div>
              <div>
                <p className="font-bold">This is your guest wishlist.</p>
                <p className="text-sm">Items here are stored temporarily. <Link to="/login" className="font-medium underline hover:text-blue-800">Log in</Link> or <Link to="/register" className="font-medium underline hover:text-blue-800">create an account</Link> to save them permanently!</p>
              </div>
            </div>
          </div>
        )}
        <h1 className="text-3xl font-bold mb-8 text-center">
          {isAuthenticated ? 'My Wishlist' : 'Guest Wishlist'} ({wishlistProducts.length})
        </h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {wishlistProducts.map((product) => (
            <Card key={product.id} className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-200">
              <CardHeader className="p-0 relative">
                {product.images && product.images.length > 0 && (
                  <img 
                    src={product.images[0]} 
                    alt={product.name} 
                    className="w-full h-56 object-cover" 
                  />
                )}
              </CardHeader>
              <CardContent className="p-4 flex flex-col flex-grow">
                <CardTitle className="text-lg font-semibold mb-1 h-12 overflow-hidden">{product.name}</CardTitle>
                <CardDescription className="text-2xl font-bold text-blue-600 mb-3">
                  ${product.price.toFixed(2)}
                </CardDescription>
              </CardContent>
              <CardFooter className="p-4 border-t mt-auto flex flex-col space-y-2">
                <Button 
                  variant="outline"
                  className="w-full flex items-center justify-center border-blue-600 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                  onClick={() => handleAddToCart(product)}
                  aria-label={`Add ${product.name} to cart`}
                  disabled={product.stock === 0} // Disable if out of stock
                >
                  {product.stock === 0 ? 'Out of Stock' : <><ShoppingCart className="h-4 w-4 mr-2" /> Add to Cart</>}
                </Button>
                <Button 
                  variant="ghost" 
                  className="w-full flex items-center justify-center text-red-500 hover:bg-red-50 hover:text-red-600" 
                  onClick={() => handleRemoveFromWishlist(product.id)}
                  aria-label={`Remove ${product.name} from wishlist`}
                >
                  <Trash2 className="h-4 w-4 mr-2" /> Remove
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
};

export default WishlistPage; 