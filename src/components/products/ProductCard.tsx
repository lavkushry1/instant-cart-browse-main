import React from 'react';

interface ProductCardProps {
  imageUrl: string;
  title: string;
  price: number;
  discount?: number;
  outOfStock?: boolean;
}

const ProductCard: React.FC<ProductCardProps> = ({
  imageUrl,
  title,
  price,
  discount,
  outOfStock,
}) => {
  return (
    <div className="bg-white rounded-2xl shadow-md p-3 m-2 flex flex-col items-center max-w-xs">
      <img src={imageUrl} alt={title} className="w-full h-48 object-cover rounded-lg mb-2" loading="lazy" />
      <h3 className="text-lg font-semibold text-gray-800 mb-1 text-center">{title}</h3>
      <div className="flex items-center mb-2">
        <p className={`text-xl font-bold ${outOfStock ? 'text-gray-400' : 'text-blue-600'}`}>
          ${price.toFixed(2)}
        </p>
        {discount && !outOfStock && (
          <p className="text-sm text-gray-500 line-through ml-2">
            ${(price / (1 - discount / 100)).toFixed(2)}
          </p>
        )}
      </div>
      {discount && !outOfStock && (
        <p className="text-xs text-green-500 mb-2">{discount}% off</p>
      )}
      {outOfStock && (
        <p className="text-sm text-red-500 font-semibold mb-2">Out of Stock</p>
      )}
      {!outOfStock && (
        <button className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg w-full transition duration-150 ease-in-out transform hover:scale-105">
          Add to Cart
        </button>
      )}
    </div>
  );
};

export default ProductCard;
