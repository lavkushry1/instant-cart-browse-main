import React from 'react';

interface Category {
  id: string;
  name: string;
  iconUrl: string;
}

interface CategoryGridProps {
  categories: Category[];
}

const CategoryGrid: React.FC<CategoryGridProps> = ({ categories }) => {
  return (
    <div className="p-3">
      <h2 className="text-xl font-semibold mb-3 text-gray-800">Categories</h2>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
        {categories.map((category) => (
          <div
            key={category.id}
            className="bg-white rounded-2xl shadow-md p-3 flex flex-col items-center justify-center aspect-square hover:shadow-lg transition-shadow duration-150 ease-in-out cursor-pointer"
          >
            <img src={category.iconUrl} alt={category.name} className="w-12 h-12 mb-2 object-contain" loading="lazy" />
            <p className="text-sm text-center text-gray-700">{category.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CategoryGrid;
