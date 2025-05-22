import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';

// Mock category data - in a real app, this would come from an API or backend
const categories = [
  {
    id: 'electronics',
    name: 'Electronics',
    icon: '📱',
    megaMenu: {
      mainCategories: [
        { name: 'Mobiles', url: '/category/mobiles' },
        { name: 'Laptops', url: '/category/laptops' },
        { name: 'Televisions', url: '/category/televisions' },
        { name: 'Cameras', url: '/category/cameras' },
      ],
      subCategories: [
        { 
          title: 'Mobile Phones',
          items: [
            { name: 'iPhone', url: '/category/mobiles/iphone' },
            { name: 'Samsung', url: '/category/mobiles/samsung' },
            { name: 'OnePlus', url: '/category/mobiles/oneplus' },
          ]
        },
        { 
          title: 'Mobile Accessories',
          items: [
            { name: 'Cases & Covers', url: '/category/mobile-accessories/cases' },
            { name: 'Power Banks', url: '/category/mobile-accessories/power-banks' },
            { name: 'Chargers', url: '/category/mobile-accessories/chargers' },
          ]
        },
        { 
          title: 'Laptops',
          items: [
            { name: 'Gaming Laptops', url: '/category/laptops/gaming' },
            { name: 'Business Laptops', url: '/category/laptops/business' },
            { name: 'Thin & Light', url: '/category/laptops/thin-light' },
          ]
        },
      ],
      featured: {
        image: 'https://via.placeholder.com/200x300',
        title: 'New iPhone',
        url: '/category/mobiles/iphone'
      }
    }
  },
  {
    id: 'fashion',
    name: 'Fashion',
    icon: '👕',
    megaMenu: {
      mainCategories: [
        { name: 'Men\'s Fashion', url: '/category/mens-fashion' },
        { name: 'Women\'s Fashion', url: '/category/womens-fashion' },
        { name: 'Kids Fashion', url: '/category/kids-fashion' },
      ],
      subCategories: [
        { 
          title: 'Men\'s Top Wear',
          items: [
            { name: 'T-Shirts', url: '/category/mens-fashion/t-shirts' },
            { name: 'Shirts', url: '/category/mens-fashion/shirts' },
          ]
        },
        { 
          title: 'Men\'s Bottom Wear',
          items: [
            { name: 'Jeans', url: '/category/mens-fashion/jeans' },
            { name: 'Trousers', url: '/category/mens-fashion/trousers' },
          ]
        },
        { 
          title: 'Women\'s Top Wear',
          items: [
            { name: 'Tops', url: '/category/womens-fashion/tops' },
            { name: 'Kurtis', url: '/category/womens-fashion/kurtis' },
          ]
        },
      ],
      featured: {
        image: 'https://via.placeholder.com/200x300',
        title: 'Summer Collection',
        url: '/category/fashion/summer-collection'
      }
    }
  },
  {
    id: 'appliances',
    name: 'Appliances',
    icon: '🏠',
  },
  {
    id: 'beauty',
    name: 'Beauty',
    icon: '💄',
  },
  {
    id: 'home',
    name: 'Home & Furniture',
    icon: '🛋️',
  },
  {
    id: 'grocery',
    name: 'Grocery',
    icon: '🛒',
  },
  {
    id: 'toys',
    name: 'Toys',
    icon: '🧸',
  },
  {
    id: 'sports',
    name: 'Sports',
    icon: '⚽',
  },
  {
    id: 'flights',
    name: 'Flights',
    icon: '✈️',
  },
];

export const CategoryNav = () => {
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  
  // Function to handle mouse enter
  const handleMouseEnter = (categoryId: string) => {
    setHoveredCategory(categoryId);
  };
  
  // Function to handle mouse leave
  const handleMouseLeave = () => {
    setHoveredCategory(null);
  };
  
  // Find the hovered category
  const activeCategoryData = categories.find(cat => cat.id === hoveredCategory);

  return (
    <nav className="bg-white border-b border-flipkart-gray-border w-full shadow-sm" 
      onMouseLeave={handleMouseLeave}
    >
      <div className="container mx-auto">
        {/* Desktop Navigation */}
        <div className="hidden md:flex">
          <ul className="flex items-center">
            {categories.map((category) => (
              <li 
                key={category.id}
                className="relative py-3 px-4"
                onMouseEnter={() => handleMouseEnter(category.id)}
              >
                <Link 
                  to={`/category/${category.id}`}
                  className="flex flex-col items-center gap-1"
                >
                  <span className="text-2xl">{category.icon}</span>
                  <div className="flex items-center">
                    <span className="text-flipkart-small text-flipkart-gray-primary-text whitespace-nowrap">
                      {category.name}
                    </span>
                    {category.megaMenu && (
                      <ChevronDown className="ml-1 h-3 w-3" />
                    )}
                  </div>
                </Link>
                
                {/* Mega Menu */}
                {category.megaMenu && hoveredCategory === category.id && (
                  <div 
                    className="absolute left-0 top-full w-screen bg-white shadow-lg z-20 border-t border-flipkart-gray-border"
                    style={{ marginLeft: '-50%' }}
                  >
                    <div className="container mx-auto flex p-4">
                      {/* Main Categories */}
                      <div className="w-60 border-r border-flipkart-gray-border pr-4">
                        <ul>
                          {category.megaMenu.mainCategories.map((mainCat) => (
                            <li key={mainCat.name}>
                              <Link 
                                to={mainCat.url}
                                className="block py-2 text-flipkart-body font-medium hover:text-flipkart-blue"
                              >
                                {mainCat.name}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      {/* Sub Categories */}
                      <div className="flex-1 px-4">
                        <div className="grid grid-cols-3 gap-4">
                          {category.megaMenu.subCategories.map((subCat) => (
                            <div key={subCat.title} className="mb-4">
                              <h4 className="text-flipkart-body font-medium mb-2">{subCat.title}</h4>
                              <ul>
                                {subCat.items.map((item) => (
                                  <li key={item.name}>
                                    <Link 
                                      to={item.url}
                                      className="block py-1 text-flipkart-small text-flipkart-gray-secondary-text hover:text-flipkart-blue"
                                    >
                                      {item.name}
                                    </Link>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {/* Featured Item */}
                      {category.megaMenu.featured && (
                        <div className="w-60 pl-4">
                          <Link to={category.megaMenu.featured.url}>
                            <img 
                              src={category.megaMenu.featured.image} 
                              alt={category.megaMenu.featured.title}
                              className="w-full h-auto rounded-sm"
                            />
                            <p className="mt-2 text-flipkart-body text-center">
                              {category.megaMenu.featured.title}
                            </p>
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
        
        {/* Mobile Navigation - Horizontally Scrollable */}
        <div className="md:hidden overflow-x-auto whitespace-nowrap py-2 px-4 scrollbar-hide">
          <ul className="flex items-center">
            {categories.map((category) => (
              <li key={category.id} className="flex-shrink-0 mr-4 last:mr-0">
                <Link 
                  to={`/category/${category.id}`}
                  className="flex flex-col items-center gap-1"
                >
                  <span className="text-xl">{category.icon}</span>
                  <span className="text-flipkart-small text-flipkart-gray-primary-text">
                    {category.name.length > 10 ? `${category.name.slice(0, 8)}...` : category.name}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </nav>
  );
}; 