
import { useState } from 'react';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { FilterOptions } from '@/types';

interface FilterSidebarProps {
  categories: string[];
  brands: string[];
  priceRange: { min: number; max: number };
  onFilterChange: (filters: FilterOptions) => void;
  initialFilters: FilterOptions;
}

const FilterSidebar = ({
  categories,
  brands,
  priceRange,
  onFilterChange,
  initialFilters,
}: FilterSidebarProps) => {
  const [filters, setFilters] = useState<FilterOptions>(initialFilters);
  const [priceValues, setPriceValues] = useState([
    initialFilters.priceRange.min,
    initialFilters.priceRange.max,
  ]);

  const handleCategoryChange = (category: string) => {
    const newCategories = filters.categories.includes(category)
      ? filters.categories.filter((c) => c !== category)
      : [...filters.categories, category];

    const newFilters = {
      ...filters,
      categories: newCategories,
    };

    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleBrandChange = (brand: string) => {
    const newBrands = filters.brands.includes(brand)
      ? filters.brands.filter((b) => b !== brand)
      : [...filters.brands, brand];

    const newFilters = {
      ...filters,
      brands: newBrands,
    };

    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handlePriceChange = (value: number[]) => {
    setPriceValues(value);
    
    // Update filters and trigger change only when user stops sliding
    const newFilters = {
      ...filters,
      priceRange: {
        min: value[0],
        max: value[1],
      },
    };
    
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleSortChange = (sortBy: FilterOptions['sortBy']) => {
    const newFilters = {
      ...filters,
      sortBy,
    };
    
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleClearAll = () => {
    const resetFilters = {
      categories: [],
      brands: [],
      priceRange: { min: priceRange.min, max: priceRange.max },
      sortBy: 'newest',
    };
    
    setPriceValues([priceRange.min, priceRange.max]);
    setFilters(resetFilters);
    onFilterChange(resetFilters);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Filters</h2>
        <button
          onClick={handleClearAll}
          className="text-sm text-brand-teal hover:underline"
        >
          Clear All
        </button>
      </div>
      
      {/* Price Range */}
      <div>
        <h3 className="font-medium mb-3">Price Range</h3>
        <div className="px-2">
          <Slider
            defaultValue={priceValues}
            min={priceRange.min}
            max={priceRange.max}
            step={10}
            value={priceValues}
            onValueChange={handlePriceChange}
            className="mb-4"
          />
          <div className="flex items-center justify-between mt-2 text-sm">
            <span>${priceValues[0]}</span>
            <span>${priceValues[1]}</span>
          </div>
        </div>
      </div>
      
      {/* Categories */}
      <div>
        <h3 className="font-medium mb-3">Categories</h3>
        <ul className="space-y-2">
          {categories.map((category) => (
            <li key={category} className="flex items-center">
              <Checkbox
                id={`category-${category}`}
                checked={filters.categories.includes(category)}
                onCheckedChange={() => handleCategoryChange(category)}
              />
              <label
                htmlFor={`category-${category}`}
                className="ml-2 text-sm capitalize"
              >
                {category.replace('-', ' ')}
              </label>
            </li>
          ))}
        </ul>
      </div>
      
      {/* Brands */}
      <div>
        <h3 className="font-medium mb-3">Brands</h3>
        <ul className="space-y-2">
          {brands.map((brand) => (
            <li key={brand} className="flex items-center">
              <Checkbox
                id={`brand-${brand}`}
                checked={filters.brands.includes(brand)}
                onCheckedChange={() => handleBrandChange(brand)}
              />
              <label
                htmlFor={`brand-${brand}`}
                className="ml-2 text-sm"
              >
                {brand}
              </label>
            </li>
          ))}
        </ul>
      </div>
      
      {/* Sort By */}
      <div>
        <h3 className="font-medium mb-3">Sort By</h3>
        <ul className="space-y-2">
          <li>
            <label className="inline-flex items-center">
              <input
                type="radio"
                className="form-radio text-brand-teal"
                name="sortBy"
                checked={filters.sortBy === 'newest'}
                onChange={() => handleSortChange('newest')}
              />
              <span className="ml-2 text-sm">Newest</span>
            </label>
          </li>
          <li>
            <label className="inline-flex items-center">
              <input
                type="radio"
                className="form-radio text-brand-teal"
                name="sortBy"
                checked={filters.sortBy === 'price_low'}
                onChange={() => handleSortChange('price_low')}
              />
              <span className="ml-2 text-sm">Price: Low to High</span>
            </label>
          </li>
          <li>
            <label className="inline-flex items-center">
              <input
                type="radio"
                className="form-radio text-brand-teal"
                name="sortBy"
                checked={filters.sortBy === 'price_high'}
                onChange={() => handleSortChange('price_high')}
              />
              <span className="ml-2 text-sm">Price: High to Low</span>
            </label>
          </li>
          <li>
            <label className="inline-flex items-center">
              <input
                type="radio"
                className="form-radio text-brand-teal"
                name="sortBy"
                checked={filters.sortBy === 'rating'}
                onChange={() => handleSortChange('rating')}
              />
              <span className="ml-2 text-sm">Top Rated</span>
            </label>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default FilterSidebar;
