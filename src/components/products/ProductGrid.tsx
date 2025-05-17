import { useState, useEffect } from 'react';
import ProductCard from './ProductCard';
import { Product } from '@/types/product';
import ProductCardSkeleton from './ProductCardSkeleton';

interface ProductGridProps {
  products: Product[];
  loading?: boolean;
}

const ProductGrid = ({ products, loading = false }: ProductGridProps) => {
  const [animatedProducts, setAnimatedProducts] = useState<Product[]>([]);

  // Stagger animation of product cards appearing
  useEffect(() => {
    if (!loading && products.length > 0) {
      const timer = setTimeout(() => {
        setAnimatedProducts(products);
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [products, loading]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, index) => (
          <ProductCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (products.length === 0 && !loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="text-5xl mb-4">😢</div>
        <h3 className="text-2xl font-semibold mb-2">No products found</h3>
        <p className="text-gray-500">Try adjusting your search or filter criteria</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {animatedProducts.map((product, index) => (
        <div 
          key={product.id} 
          className="animate-fade-in" 
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <ProductCard product={{
            id: product.id,
            imageUrl: product.images && product.images.length > 0 ? product.images[0] : 'placeholder.svg', // Use first image or a placeholder
            title: product.name,         
            price: product.price,
            outOfStock: product.stock <= 0,
            categoryId: product.category, // Assuming local product.category can map to categoryId
            // originalDiscount: product.discount, // If ProductCard needs to show a base discount from product data
          }} />
        </div>
      ))}
    </div>
  );
};

export default ProductGrid;
