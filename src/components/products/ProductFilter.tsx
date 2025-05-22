import React, { useState, useEffect } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Checkbox } from '@/components/ui/checkbox';
import type { CheckedState } from '@radix-ui/react-checkbox';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { X, ChevronDown } from 'lucide-react';

interface ProductFilterProps {
  categories: string[];
  tags: string[];
  maxPrice: number;
  onFilterChange: (filters: FilterOptions) => void;
  initialFilters?: FilterOptions;
}

export interface FilterOptions {
  categories: string[];
  tags: string[];
  priceRange: [number, number];
  inStock: boolean;
  onSale: boolean;
}

// Brands mock data for Flipkart-style filters
const mockBrands = [
  "Apple", "Samsung", "OnePlus", "Dell", "HP", "Adidas", "Nike", 
  "Puma", "Levi's", "Zara", "H&M", "Titan", "Fossil", "Sony"
];

// Customer ratings mock data for Flipkart-style filters
const customerRatings = [
  { value: '4', label: '4★ & above' },
  { value: '3', label: '3★ & above' },
  { value: '2', label: '2★ & above' },
  { value: '1', label: '1★ & above' }
];

// Availability options
const availabilityOptions = [
  { value: 'instock', label: 'Exclude Out of Stock' },
];

// Discount options
const discountOptions = [
  { value: '10', label: '10% or more' },
  { value: '20', label: '20% or more' },
  { value: '30', label: '30% or more' },
  { value: '40', label: '40% or more' },
  { value: '50', label: '50% or more' },
  { value: '60', label: '60% or more' },
  { value: '70', label: '70% or more' },
];

const ProductFilter = ({ 
  categories, 
  tags, 
  maxPrice, 
  onFilterChange,
  initialFilters 
}: ProductFilterProps) => {
  const [filters, setFilters] = useState<FilterOptions>(() => {
    const defaultPriceRange: [number, number] = [0, maxPrice];
    return {
      categories: initialFilters?.categories || [],
      tags: initialFilters?.tags || [],
      priceRange: initialFilters?.priceRange || defaultPriceRange,
      inStock: initialFilters?.inStock || false,
      onSale: initialFilters?.onSale || false
    };
  });
  
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);
  const [showMoreBrands, setShowMoreBrands] = useState(false);
  
  // Update active filters count whenever filters change
  useEffect(() => {
    let count = 0;
    if (filters.categories.length > 0) count++;
    if (filters.tags.length > 0) count++;
    if (filters.priceRange[0] > 0 || filters.priceRange[1] < maxPrice) count++;
    if (filters.inStock) count++;
    if (filters.onSale) count++;
    
    setActiveFiltersCount(count);
  }, [filters, maxPrice]);
  
  // Notify parent component when filters change
  useEffect(() => {
    onFilterChange(filters);
  }, [filters, onFilterChange]);
  
  const handleCategoryChange = (category: string, checked: CheckedState) => {
    const isChecked = checked === true;
    setFilters(prev => ({
      ...prev,
      categories: isChecked 
        ? [...prev.categories, category] 
        : prev.categories.filter(c => c !== category)
    }));
  };
  
  const handleTagChange = (tag: string, checked: CheckedState) => {
    const isChecked = checked === true;
    setFilters(prev => ({
      ...prev,
      tags: isChecked 
        ? [...prev.tags, tag] 
        : prev.tags.filter(t => t !== tag)
    }));
  };
  
  const handlePriceRangeChange = (value: number[]) => {
    setFilters(prev => ({
      ...prev,
      priceRange: [value[0], value[1]] as [number, number]
    }));
  };
  
  const handleInStockChange = (checked: CheckedState) => {
    const isChecked = checked === true;
    setFilters(prev => ({
      ...prev,
      inStock: isChecked
    }));
  };
  
  const handleOnSaleChange = (checked: CheckedState) => {
    const isChecked = checked === true;
    setFilters(prev => ({
      ...prev,
      onSale: isChecked
    }));
  };
  
  const clearAllFilters = () => {
    setFilters({
      categories: [],
      tags: [],
      priceRange: [0, maxPrice],
      inStock: false,
      onSale: false
    });
  };
  
  const removeFilter = (type: 'category' | 'tag' | 'price' | 'stock' | 'sale', value?: string) => {
    switch (type) {
      case 'category':
        setFilters(prev => ({
          ...prev,
          categories: prev.categories.filter(c => c !== value)
        }));
        break;
      case 'tag':
        setFilters(prev => ({
          ...prev,
          tags: prev.tags.filter(t => t !== value)
        }));
        break;
      case 'price':
        setFilters(prev => ({
          ...prev,
          priceRange: [0, maxPrice]
        }));
        break;
      case 'stock':
        setFilters(prev => ({
          ...prev,
          inStock: false
        }));
        break;
      case 'sale':
        setFilters(prev => ({
          ...prev,
          onSale: false
        }));
        break;
    }
  };
  
  return (
    <div className="overflow-hidden bg-white">
      {/* Filters Title */}
      <div className="p-4 border-b border-flipkart-gray-border">
        <div className="flex justify-between items-center">
          <h2 className="text-flipkart-header-sm text-flipkart-gray-primary-text">Filters</h2>
          {activeFiltersCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 text-xs text-flipkart-blue hover:bg-transparent hover:text-blue-600"
              onClick={clearAllFilters}
            >
              CLEAR ALL
            </Button>
          )}
        </div>
      </div>
      
      <div className="divide-y divide-flipkart-gray-border">
        {/* Categories Section */}
        <div className="p-4">
          <h3 className="text-flipkart-body font-medium mb-3">CATEGORIES</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {categories.map(category => (
              <div key={category} className="flex items-center space-x-2">
                <Checkbox 
                  id={`category-${category}`} 
                  checked={filters.categories.includes(category)}
                  onCheckedChange={(checked: CheckedState) => handleCategoryChange(category, checked)}
                  className="text-flipkart-blue border-flipkart-gray-border"
                />
                <Label 
                  htmlFor={`category-${category}`}
                  className="text-flipkart-body cursor-pointer text-flipkart-gray-primary-text"
                >
                  {category}
                </Label>
              </div>
            ))}
          </div>
        </div>
        
        {/* Price Range */}
        <div className="p-4">
          <h3 className="text-flipkart-body font-medium mb-4">PRICE</h3>
          <Slider
            className="mb-6"
            value={[filters.priceRange[0], filters.priceRange[1]]}
            min={0}
            max={maxPrice}
            step={100}
            onValueChange={handlePriceRangeChange}
          />
          <div className="flex items-center justify-between">
            <div className="flex items-center border border-flipkart-gray-border rounded p-1 text-sm">
              <span className="text-gray-400 mr-1">₹</span>
              <input 
                type="number" 
                className="w-14 outline-none text-sm" 
                value={filters.priceRange[0]}
                onChange={(e) => setFilters(prev => ({ 
                  ...prev, 
                  priceRange: [parseInt(e.target.value) || 0, prev.priceRange[1]] 
                }))}
                min={0}
              />
            </div>
            <span className="text-gray-400">to</span>
            <div className="flex items-center border border-flipkart-gray-border rounded p-1 text-sm">
              <span className="text-gray-400 mr-1">₹</span>
              <input 
                type="number" 
                className="w-14 outline-none text-sm" 
                value={filters.priceRange[1]}
                onChange={(e) => setFilters(prev => ({ 
                  ...prev, 
                  priceRange: [prev.priceRange[0], parseInt(e.target.value) || maxPrice] 
                }))}
                max={maxPrice}
              />
            </div>
          </div>
        </div>
        
        {/* Brand Section */}
        <div className="p-4">
          <h3 className="text-flipkart-body font-medium mb-3">BRAND</h3>
          <div className="relative">
            <input 
              type="text"
              placeholder="Search Brand"
              className="border border-flipkart-gray-border rounded w-full p-2 mb-3 text-sm"
            />
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {mockBrands
              .slice(0, showMoreBrands ? mockBrands.length : 6)
              .map(brand => (
                <div key={brand} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`brand-${brand}`}
                    className="text-flipkart-blue border-flipkart-gray-border"
                  />
                  <Label 
                    htmlFor={`brand-${brand}`}
                    className="text-flipkart-body cursor-pointer text-flipkart-gray-primary-text"
                  >
                    {brand}
                  </Label>
                </div>
              ))
            }
          </div>
          {mockBrands.length > 6 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="mt-2 h-7 text-xs text-flipkart-blue hover:bg-transparent hover:text-blue-600 p-0"
              onClick={() => setShowMoreBrands(!showMoreBrands)}
            >
              {showMoreBrands ? 'Show Less' : 'Show More'}
              <ChevronDown className={`ml-1 h-4 w-4 transition-transform ${showMoreBrands ? 'rotate-180' : ''}`} />
            </Button>
          )}
        </div>
        
        {/* Customer Ratings */}
        <div className="p-4">
          <h3 className="text-flipkart-body font-medium mb-3">CUSTOMER RATINGS</h3>
          <div className="space-y-2">
            {customerRatings.map(rating => (
              <div key={rating.value} className="flex items-center space-x-2">
                <Checkbox 
                  id={`rating-${rating.value}`}
                  className="text-flipkart-blue border-flipkart-gray-border"
                />
                <Label 
                  htmlFor={`rating-${rating.value}`}
                  className="text-flipkart-body cursor-pointer text-flipkart-gray-primary-text"
                >
                  {rating.label}
                </Label>
              </div>
            ))}
          </div>
        </div>
        
        {/* Availability Options */}
        <div className="p-4">
          <h3 className="text-flipkart-body font-medium mb-3">AVAILABILITY</h3>
          <div className="space-y-2">
            {availabilityOptions.map(option => (
              <div key={option.value} className="flex items-center space-x-2">
                <Checkbox 
                  id={`availability-${option.value}`}
                  className="text-flipkart-blue border-flipkart-gray-border"
                  checked={filters.inStock}
                  onCheckedChange={handleInStockChange}
                />
                <Label 
                  htmlFor={`availability-${option.value}`}
                  className="text-flipkart-body cursor-pointer text-flipkart-gray-primary-text"
                >
                  {option.label}
                </Label>
              </div>
            ))}
          </div>
        </div>
        
        {/* Discount */}
        <div className="p-4">
          <h3 className="text-flipkart-body font-medium mb-3">DISCOUNT</h3>
          <div className="space-y-2">
            {discountOptions.map(discount => (
              <div key={discount.value} className="flex items-center space-x-2">
                <Checkbox 
                  id={`discount-${discount.value}`}
                  className="text-flipkart-blue border-flipkart-gray-border"
                  checked={filters.onSale && parseInt(discount.value) === 10} // Just for the demo
                  onCheckedChange={discount.value === "10" ? handleOnSaleChange : undefined}
                />
                <Label 
                  htmlFor={`discount-${discount.value}`}
                  className="text-flipkart-body cursor-pointer text-flipkart-gray-primary-text"
                >
                  {discount.label}
                </Label>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductFilter;
