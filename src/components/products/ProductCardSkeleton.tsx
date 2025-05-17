import React from 'react';

const ProductCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl shadow-md p-4 m-2 flex flex-col items-stretch max-w-xs animate-pulse">
      {/* Image Placeholder */}
      <div className="w-full h-48 bg-gray-300 rounded-lg mb-3"></div>
      
      {/* Title Placeholder */}
      <div className="h-5 bg-gray-300 rounded w-3/4 mx-auto mb-2"></div>
      <div className="h-5 bg-gray-300 rounded w-1/2 mx-auto mb-3"></div>
      
      <div className="mt-auto"> {/* Pushes price and button to the bottom */}
        {/* Price Placeholder */}
        <div className="flex items-baseline justify-center mb-3">
          <div className="h-7 bg-gray-300 rounded w-1/3"></div>
          <div className="h-4 bg-gray-300 rounded w-1/4 ml-2"></div>
        </div>

        {/* Button Placeholder */}
        <div className="w-full h-10 bg-gray-300 rounded-lg"></div>
      </div>
    </div>
  );
};

export default ProductCardSkeleton; 