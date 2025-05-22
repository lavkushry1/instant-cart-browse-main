import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

interface CategoryItem {
  id: string;
  name: string;
  image: string;
  link: string;
}

interface CategoryShowcaseProps {
  title: string;
  viewAllLink?: string;
  categories: CategoryItem[];
}

export const CategoryShowcase = ({ title, viewAllLink, categories }: CategoryShowcaseProps) => {
  return (
    <div className="bg-white rounded-sm shadow-sm mb-3">
      <div className="flex items-center justify-between p-4 border-b border-flipkart-gray-border">
        <h2 className="text-flipkart-header-lg font-medium">{title}</h2>
        {viewAllLink && (
          <Link 
            to={viewAllLink}
            className="flex items-center text-flipkart-blue text-sm font-medium"
          >
            View All
            <ChevronRight className="h-4 w-4 ml-1" />
          </Link>
        )}
      </div>
      
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 p-4">
        {categories.map((category) => (
          <Link 
            key={category.id}
            to={category.link}
            className="flex flex-col items-center text-center hover:text-flipkart-blue transition-colors"
          >
            <div className="w-16 h-16 mb-2">
              <img 
                src={category.image} 
                alt={category.name}
                className="w-full h-full object-contain"
                loading="lazy"
              />
            </div>
            <span className="text-flipkart-small text-flipkart-gray-primary-text">
              {category.name}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
};

// Example usage component with mock data
export const TopCategoriesShowcase = () => {
  const topCategories: CategoryItem[] = [
    {
      id: '1',
      name: 'Mobiles',
      image: 'https://rukminim1.flixcart.com/flap/128/128/image/22fddf3c7da4c4f4.png',
      link: '/category/mobiles'
    },
    {
      id: '2',
      name: 'Fashion',
      image: 'https://rukminim1.flixcart.com/flap/128/128/image/c12afc017e6f24cb.png',
      link: '/category/fashion'
    },
    {
      id: '3',
      name: 'Electronics',
      image: 'https://rukminim1.flixcart.com/flap/128/128/image/69c6589653afdb9a.png',
      link: '/category/electronics'
    },
    {
      id: '4',
      name: 'Home',
      image: 'https://rukminim1.flixcart.com/flap/128/128/image/ab7e2b022a4587dd.jpg',
      link: '/category/home'
    },
    {
      id: '5',
      name: 'Appliances',
      image: 'https://rukminim1.flixcart.com/flap/128/128/image/0ff199d1bd27eb98.png',
      link: '/category/appliances'
    },
    {
      id: '6',
      name: 'Toys',
      image: 'https://rukminim1.flixcart.com/flap/128/128/image/dff3f7adcf3a90c6.png',
      link: '/category/toys'
    },
    {
      id: '7',
      name: 'Beauty',
      image: 'https://rukminim1.flixcart.com/flap/128/128/image/71050627a56b4693.png',
      link: '/category/beauty'
    },
    {
      id: '8',
      name: 'Grocery',
      image: 'https://rukminim1.flixcart.com/flap/128/128/image/29327f40e9c4d26b.png',
      link: '/category/grocery'
    },
  ];

  return (
    <CategoryShowcase 
      title="Top Categories" 
      viewAllLink="/categories"
      categories={topCategories}
    />
  );
}; 