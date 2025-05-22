import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ProductCard } from './ProductCard';
import { Product } from '@/types/product';

interface ProductShowcaseProps {
  title: string;
  viewAllLink?: string;
  products: Product[];
  backgroundImage?: string;
}

export const ProductShowcase = ({ 
  title, 
  viewAllLink, 
  products,
  backgroundImage
}: ProductShowcaseProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const scroll = (direction: 'left' | 'right') => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    const scrollAmount = container.clientWidth * 0.8;
    
    if (direction === 'left') {
      container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    } else {
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const handleScroll = () => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    const isAtStart = container.scrollLeft === 0;
    const isAtEnd = container.scrollLeft + container.clientWidth >= container.scrollWidth - 10;
    
    setShowLeftArrow(!isAtStart);
    setShowRightArrow(!isAtEnd);
  };

  return (
    <div className="bg-white rounded-sm shadow-sm mb-3 relative">
      {/* Header */}
      <div 
        className="flex items-center justify-between p-4 border-b border-flipkart-gray-border"
        style={backgroundImage ? {
          background: `url(${backgroundImage}) no-repeat right top`,
          backgroundSize: 'contain'
        } : {}}
      >
        <h2 className="text-flipkart-header-lg font-medium">{title}</h2>
        {viewAllLink && (
          <Link 
            to={viewAllLink}
            className="flex items-center bg-flipkart-blue text-white px-4 py-1.5 rounded-sm text-sm font-medium"
          >
            View All
          </Link>
        )}
      </div>
      
      {/* Products Carousel */}
      <div className="relative">
        {/* Left Arrow */}
        {showLeftArrow && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-white shadow-md w-10 h-10 rounded-full flex items-center justify-center"
            aria-label="Scroll left"
          >
            <ChevronLeft className="h-6 w-6 text-flipkart-gray-primary-text" />
          </button>
        )}
        
        {/* Products Container */}
        <div 
          ref={containerRef}
          className="flex overflow-x-auto py-4 px-4 scrollbar-hide"
          onScroll={handleScroll}
        >
          {products.map((product) => (
            <div 
              key={product.id} 
              className="min-w-[200px] w-[200px] md:min-w-[220px] md:w-[220px] px-2"
            >
              <ProductCard product={product} />
            </div>
          ))}
        </div>
        
        {/* Right Arrow */}
        {showRightArrow && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 bg-white shadow-md w-10 h-10 rounded-full flex items-center justify-center"
            aria-label="Scroll right"
          >
            <ChevronRight className="h-6 w-6 text-flipkart-gray-primary-text" />
          </button>
        )}
      </div>
      
      {/* Optional bottom section for deals timer, etc. */}
    </div>
  );
};

// Add CSS for hiding scrollbar
const style = document.createElement('style');
style.textContent = `
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
`;
document.head.appendChild(style); 