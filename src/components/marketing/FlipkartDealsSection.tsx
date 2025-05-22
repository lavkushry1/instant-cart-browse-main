import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import ProductCard from '../products/ProductCard';
import { Product } from '@/types/product';

interface FlipkartDealsSectionProps {
  title: string;
  subtitle?: string;
  viewAllLink?: string;
  products: Product[];
  bgColor?: string;
  imageUrl?: string;
  loading?: boolean;
}

// This component displays a section with title and products in a carousel style
// Very similar to Flipkart's deals sections
export const FlipkartDealsSection: React.FC<FlipkartDealsSectionProps> = ({
  title,
  subtitle,
  viewAllLink,
  products,
  bgColor = 'bg-white',
  imageUrl,
  loading = false,
}) => {
  return (
    <div className={`${bgColor} rounded-sm shadow-sm mb-4`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-flipkart-gray-border">
        <div className="flex flex-col">
          <h2 className="text-flipkart-header-lg font-medium">{title}</h2>
          {subtitle && (
            <p className="text-flipkart-small text-flipkart-gray-secondary-text mt-0.5">{subtitle}</p>
          )}
        </div>

        {/* Right side - could be image and/or View All link */}
        <div className="flex items-center">
          {imageUrl && (
            <img 
              src={imageUrl} 
              alt={title} 
              className="h-12 mr-4 object-contain"
            />
          )}
          
          {viewAllLink && (
            <Link 
              to={viewAllLink}
              className="flex items-center text-flipkart-blue hover:text-flipkart-blue/90"
            >
              <span className="font-medium">VIEW ALL</span>
              <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          )}
        </div>
      </div>
      
      {/* Products Grid/Carousel */}
      <div className="p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {loading ? (
            // Loading skeleton
            Array(5).fill(0).map((_, index) => (
              <div key={index} className="bg-white p-4 rounded-sm border border-flipkart-gray-border">
                <div className="aspect-square bg-gray-100 mb-3 animate-pulse"></div>
                <div className="h-4 bg-gray-100 w-3/4 mb-2 animate-pulse"></div>
                <div className="h-4 bg-gray-100 w-1/2 animate-pulse"></div>
              </div>
            ))
          ) : (
            // Actual products
            products.slice(0, 5).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default FlipkartDealsSection;
