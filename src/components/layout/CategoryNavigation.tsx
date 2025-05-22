import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import './category-navigation.css';

interface Category {
  name: string;
  icon: string;
  path: string;
  megaMenu?: {
    sections: {
      title: string;
      items: { name: string; path: string }[];
    }[];
    featuredImage?: string;
  };
}

export const CategoryNavigation = () => {
  // Mock categories for Flipkart-style navigation
  const categories: Category[] = [
    {
      name: "Electronics",
      icon: "📱",
      path: "/category/electronics",
      megaMenu: {
        sections: [
          {
            title: "Mobiles",
            items: [
              { name: "iPhone", path: "/category/electronics/mobiles/iphone" },
              { name: "Samsung", path: "/category/electronics/mobiles/samsung" },
              { name: "OnePlus", path: "/category/electronics/mobiles/oneplus" },
              { name: "Xiaomi", path: "/category/electronics/mobiles/xiaomi" },
              { name: "Realme", path: "/category/electronics/mobiles/realme" },
              { name: "POCO", path: "/category/electronics/mobiles/poco" },
              { name: "Vivo", path: "/category/electronics/mobiles/vivo" },
              { name: "Oppo", path: "/category/electronics/mobiles/oppo" },
            ]
          },
          {
            title: "Laptops",
            items: [
              { name: "Gaming Laptops", path: "/category/electronics/laptops/gaming" },
              { name: "Business Laptops", path: "/category/electronics/laptops/business" },
              { name: "MacBooks", path: "/category/electronics/laptops/macbooks" },
              { name: "Budget", path: "/category/electronics/laptops/budget" },
              { name: "Thin & Light", path: "/category/electronics/laptops/thin-light" },
              { name: "2-in-1 Laptops", path: "/category/electronics/laptops/convertible" },
              { name: "Chromebooks", path: "/category/electronics/laptops/chromebooks" },
            ]
          },
          {
            title: "Audio",
            items: [
              { name: "Bluetooth Headphones", path: "/category/electronics/audio/bluetooth-headphones" },
              { name: "Wireless Earbuds", path: "/category/electronics/audio/wireless-earbuds" },
              { name: "Soundbars", path: "/category/electronics/audio/soundbars" },
              { name: "Bluetooth Speakers", path: "/category/electronics/audio/bluetooth-speakers" },
              { name: "Home Theatre", path: "/category/electronics/audio/home-theatre" },
              { name: "Gaming Headsets", path: "/category/electronics/audio/gaming-headsets" },
            ]
          },
          {
            title: "Cameras",
            items: [
              { name: "DSLR", path: "/category/electronics/cameras/dslr" },
              { name: "Mirrorless", path: "/category/electronics/cameras/mirrorless" },
              { name: "Action Cameras", path: "/category/electronics/cameras/action" },
              { name: "Security Cameras", path: "/category/electronics/cameras/security" },
            ]
          },
          {
            title: "Computer Accessories",
            items: [
              { name: "Monitors", path: "/category/electronics/computer-accessories/monitors" },
              { name: "Keyboards", path: "/category/electronics/computer-accessories/keyboards" },
              { name: "Mouse", path: "/category/electronics/computer-accessories/mouse" },
              { name: "Printers", path: "/category/electronics/computer-accessories/printers" },
              { name: "Storage", path: "/category/electronics/computer-accessories/storage" },
              { name: "Networking", path: "/category/electronics/computer-accessories/networking" },
            ]
          },
        ],
        featuredImage: "/images/electronics-featured.jpg"
      }
    },
    {
      name: "Fashion",
      icon: "👕",
      path: "/category/fashion",
      megaMenu: {
        sections: [
          {
            title: "Men's Fashion",
            items: [
              { name: "T-shirts", path: "/category/fashion/mens/t-shirts" },
              { name: "Jeans", path: "/category/fashion/mens/jeans" },
              { name: "Shirts", path: "/category/fashion/mens/shirts" },
              { name: "Suits", path: "/category/fashion/mens/suits" },
              { name: "Trousers", path: "/category/fashion/mens/trousers" },
              { name: "Ethnic Wear", path: "/category/fashion/mens/ethnic-wear" },
              { name: "Innerwear", path: "/category/fashion/mens/innerwear" },
            ]
          },
          {
            title: "Women's Fashion",
            items: [
              { name: "Dresses", path: "/category/fashion/womens/dresses" },
              { name: "Tops", path: "/category/fashion/womens/tops" },
              { name: "Jeans", path: "/category/fashion/womens/jeans" },
              { name: "Sarees", path: "/category/fashion/womens/sarees" },
              { name: "Kurtas & Suits", path: "/category/fashion/womens/kurtas-suits" },
              { name: "Lingerie", path: "/category/fashion/womens/lingerie" },
              { name: "Lehengas", path: "/category/fashion/womens/lehengas" },
            ]
          },
          {
            title: "Footwear",
            items: [
              { name: "Men's Shoes", path: "/category/fashion/footwear/mens" },
              { name: "Women's Shoes", path: "/category/fashion/footwear/womens" },
              { name: "Sports Shoes", path: "/category/fashion/footwear/sports" },
              { name: "Casual Shoes", path: "/category/fashion/footwear/casual" },
              { name: "Sandals & Floaters", path: "/category/fashion/footwear/sandals" },
              { name: "Flip Flops", path: "/category/fashion/footwear/flip-flops" },
            ]
          },
          {
            title: "Accessories",
            items: [
              { name: "Watches", path: "/category/fashion/accessories/watches" },
              { name: "Sunglasses", path: "/category/fashion/accessories/sunglasses" },
              { name: "Belts", path: "/category/fashion/accessories/belts" },
              { name: "Backpacks", path: "/category/fashion/accessories/backpacks" },
              { name: "Handbags", path: "/category/fashion/accessories/handbags" },
              { name: "Wallets", path: "/category/fashion/accessories/wallets" },
            ]
          },
        ],
        featuredImage: "/images/fashion-featured.jpg"
      }
    },
    {
      name: "Home",
      icon: "🏠",
      path: "/category/home",
      megaMenu: {
        sections: [
          {
            title: "Furniture",
            items: [
              { name: "Sofas", path: "/category/home/furniture/sofas" },
              { name: "Beds", path: "/category/home/furniture/beds" },
              { name: "Tables", path: "/category/home/furniture/tables" },
              { name: "Chairs", path: "/category/home/furniture/chairs" },
              { name: "Wardrobes", path: "/category/home/furniture/wardrobes" },
              { name: "TV Units", path: "/category/home/furniture/tv-units" },
            ]
          },
          {
            title: "Kitchen & Dining",
            items: [
              { name: "Cookware", path: "/category/home/kitchen/cookware" },
              { name: "Tableware", path: "/category/home/kitchen/tableware" },
              { name: "Kitchen Storage", path: "/category/home/kitchen/storage" },
              { name: "Kitchen Tools", path: "/category/home/kitchen/tools" },
              { name: "Gas Stoves", path: "/category/home/kitchen/gas-stoves" },
              { name: "Water Purifiers", path: "/category/home/kitchen/water-purifiers" },
            ]
          },
          {
            title: "Home Decor",
            items: [
              { name: "Clocks", path: "/category/home/decor/clocks" },
              { name: "Mirrors", path: "/category/home/decor/mirrors" },
              { name: "Wall Decor", path: "/category/home/decor/wall-decor" },
              { name: "Plants & Planters", path: "/category/home/decor/plants-planters" },
              { name: "Showpieces", path: "/category/home/decor/showpieces" },
            ]
          },
          {
            title: "Home Furnishing",
            items: [
              { name: "Bedsheets", path: "/category/home/furnishing/bedsheets" },
              { name: "Curtains", path: "/category/home/furnishing/curtains" },
              { name: "Cushions & Covers", path: "/category/home/furnishing/cushions" },
              { name: "Blankets", path: "/category/home/furnishing/blankets" },
              { name: "Towels", path: "/category/home/furnishing/towels" },
            ]
          },
        ],
        featuredImage: "/images/home-featured.jpg"
      }
    },
    {
      name: "Appliances",
      icon: "🧰",
      path: "/category/appliances",
      megaMenu: {
        sections: [
          {
            title: "Television",
            items: [
              { name: "Smart TVs", path: "/category/appliances/television/smart" },
              { name: "32 Inch TVs", path: "/category/appliances/television/32-inch" },
              { name: "43 Inch TVs", path: "/category/appliances/television/43-inch" },
              { name: "55 Inch TVs", path: "/category/appliances/television/55-inch" },
              { name: "OLED TVs", path: "/category/appliances/television/oled" },
            ]
          },
          {
            title: "Washing Machines",
            items: [
              { name: "Fully Automatic", path: "/category/appliances/washing-machines/fully-automatic" },
              { name: "Semi Automatic", path: "/category/appliances/washing-machines/semi-automatic" },
              { name: "Top Load", path: "/category/appliances/washing-machines/top-load" },
              { name: "Front Load", path: "/category/appliances/washing-machines/front-load" },
            ]
          },
          {
            title: "Air Conditioners",
            items: [
              { name: "Split ACs", path: "/category/appliances/air-conditioners/split" },
              { name: "Window ACs", path: "/category/appliances/air-conditioners/window" },
              { name: "Inverter ACs", path: "/category/appliances/air-conditioners/inverter" },
              { name: "1 Ton ACs", path: "/category/appliances/air-conditioners/1-ton" },
              { name: "1.5 Ton ACs", path: "/category/appliances/air-conditioners/1.5-ton" },
            ]
          },
          {
            title: "Refrigerators",
            items: [
              { name: "Single Door", path: "/category/appliances/refrigerators/single-door" },
              { name: "Double Door", path: "/category/appliances/refrigerators/double-door" },
              { name: "Side by Side", path: "/category/appliances/refrigerators/side-by-side" },
              { name: "Convertible", path: "/category/appliances/refrigerators/convertible" },
            ]
          },
        ],
        featuredImage: "/images/appliances-featured.jpg"
      }
    },
    {
      name: "Toys & Baby",
      icon: "🧸",
      path: "/category/toys-baby"
    },
    {
      name: "Sports",
      icon: "⚽",
      path: "/category/sports"
    },
    {
      name: "Beauty",
      icon: "💄",
      path: "/category/beauty"
    },
    {
      name: "2-Wheelers",
      icon: "🛵",
      path: "/category/two-wheelers"
    },
    {
      name: "Flights",
      icon: "✈️",
      path: "/category/flights"
    },
    {
      name: "Grocery",
      icon: "🛒",
      path: "/category/grocery"
    },
  ];

  return (
    <nav className="bg-white shadow-sm border-b border-flipkart-gray-border mt-14">
      <div className="container px-4">
        {/* Desktop Category Navigation */}
        <div className="hidden md:flex items-center h-10 overflow-x-auto">
          {categories.slice(0, 7).map((category, index) => (
            <div key={index} className="relative group">
              <Link
                to={category.path}
                className="flex flex-col items-center px-4 h-10 hover:text-flipkart-blue whitespace-nowrap"
              >
                <div className="flex items-center h-full">
                  <span className="text-flipkart-body text-flipkart-gray-primary-text group-hover:text-flipkart-blue font-medium">
                    {category.name}
                  </span>
                  {category.megaMenu && (
                    <ChevronDown className="h-3 w-3 ml-1 text-gray-500 group-hover:text-flipkart-blue" />
                  )}
                </div>
              </Link>
              
              {/* Mega Menu Dropdown */}
              {category.megaMenu && (
                <div className="absolute left-0 w-full min-w-[800px] bg-white shadow-lg rounded-b-md z-50 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-opacity duration-200 top-10">
                  <div className="grid grid-cols-5 p-4 gap-6">
                    {category.megaMenu.sections.map((section, sectionIndex) => (
                      <div key={sectionIndex} className="col-span-1">
                        <h4 className="text-flipkart-body font-medium text-flipkart-blue mb-3 pb-1 border-b border-gray-100">
                          {section.title}
                        </h4>
                        <ul className="space-y-2">
                          {section.items.map((item, itemIndex) => (
                            <li key={itemIndex} className="text-flipkart-small">
                              <Link 
                                to={item.path} 
                                className="text-flipkart-gray-primary-text hover:text-flipkart-blue"
                              >
                                {item.name}
                              </Link>
                            </li>
                          ))}
                          <li className="pt-1">
                            <Link 
                              to={`/category/${category.name.toLowerCase()}`}
                              className="text-flipkart-blue text-flipkart-small font-medium"
                            >
                              View All
                            </Link>
                          </li>
                        </ul>
                      </div>
                    ))}
                    {category.megaMenu.featuredImage && (
                      <div className="col-span-1">
                        <img 
                          src={category.megaMenu.featuredImage} 
                          alt={`${category.name} featured`}
                          className="w-full h-48 object-cover rounded-md"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = "https://via.placeholder.com/200x250?text=Coming+Soon";
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
          
          {/* More Dropdown */}
          {categories.length > 7 && (
            <div className="relative group">
              <Link
                to="#"
                className="flex items-center px-4 h-10 hover:text-flipkart-blue whitespace-nowrap"
              >
                <span className="text-flipkart-body text-flipkart-gray-primary-text group-hover:text-flipkart-blue font-medium">
                  More
                </span>
                <ChevronDown className="h-3 w-3 ml-1 text-gray-500 group-hover:text-flipkart-blue" />
              </Link>
              
              <div className="absolute right-0 w-48 bg-white shadow-lg rounded-b-md z-50 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-opacity duration-200 top-10">
                <div className="p-2">
                  {categories.slice(7).map((category, index) => (
                    <Link
                      key={index}
                      to={category.path}
                      className="flex items-center px-3 py-2 text-flipkart-small text-flipkart-gray-primary-text hover:text-flipkart-blue hover:bg-gray-50"
                    >
                      <span className="mr-2">{category.icon}</span>
                      {category.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Mobile Category Navigation */}
        <div className="md:hidden flex items-center h-12 overflow-x-auto hide-scrollbar py-1">
          {categories.map((category, index) => (
            <Link
              key={index}
              to={category.path}
              className="flex flex-col items-center px-3 min-w-[60px]"
            >
              <span className="text-lg mb-0.5">{category.icon}</span>
              <span className="text-flipkart-small text-flipkart-gray-primary-text whitespace-nowrap">
                {category.name}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default CategoryNavigation; 