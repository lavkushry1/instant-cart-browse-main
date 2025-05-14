import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Checkbox } from '@/components/ui/checkbox';
import type { CheckedState } from '@radix-ui/react-checkbox';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

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

const ProductFilter = ({ 
  categories, 
  tags, 
  maxPrice, 
  onFilterChange,
  initialFilters 
}: ProductFilterProps) => {
  const [filters, setFilters] = useState<FilterOptions>({
    categories: initialFilters?.categories || [],
    tags: initialFilters?.tags || [],
    priceRange: initialFilters?.priceRange || [0, maxPrice],
    inStock: initialFilters?.inStock || false,
    onSale: initialFilters?.onSale || false
  });
  
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);
  
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
  
  const handlePriceRangeChange = (value: [number, number]) => {
    setFilters(prev => ({
      ...prev,
      priceRange: value
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
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        {/* Active Filters */}
        {activeFiltersCount > 0 && (
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-medium">Active Filters</h3>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 text-xs"
                onClick={clearAllFilters}
              >
                Clear All
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {filters.categories.map(category => (
                <Badge key={`cat-${category}`} variant="outline" className="flex items-center gap-1">
                  {category}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => removeFilter('category', category)}
                  />
                </Badge>
              ))}
              
              {filters.tags.map(tag => (
                <Badge key={`tag-${tag}`} variant="outline" className="flex items-center gap-1">
                  #{tag}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => removeFilter('tag', tag)}
                  />
                </Badge>
              ))}
              
              {(filters.priceRange[0] > 0 || filters.priceRange[1] < maxPrice) && (
                <Badge variant="outline" className="flex items-center gap-1">
                  ₹{filters.priceRange[0]} - ₹{filters.priceRange[1]}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => removeFilter('price')}
                  />
                </Badge>
              )}
              
              {filters.inStock && (
                <Badge variant="outline" className="flex items-center gap-1">
                  In Stock
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => removeFilter('stock')}
                  />
                </Badge>
              )}
              
              {filters.onSale && (
                <Badge variant="outline" className="flex items-center gap-1">
                  On Sale
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => removeFilter('sale')}
                  />
                </Badge>
              )}
            </div>
          </div>
        )}
        
        {/* Filter Accordion */}
        <Accordion type="multiple" defaultValue={["categories", "price"]}>
          {/* Categories */}
          <AccordionItem value="categories">
            <AccordionTrigger className="text-sm font-medium">Categories</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {categories.map(category => (
                  <div key={category} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`category-${category}`} 
                      checked={filters.categories.includes(category)}
                      onCheckedChange={(checked) => handleCategoryChange(category, checked)}
                    />
                    <Label 
                      htmlFor={`category-${category}`}
                      className="text-sm cursor-pointer"
                    >
                      {category}
                    </Label>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
          
          {/* Price Range */}
          <AccordionItem value="price">
            <AccordionTrigger className="text-sm font-medium">Price Range</AccordionTrigger>
            <AccordionContent>
              <div className="px-2 py-4">
                <Slider
                  value={filters.priceRange}
                  min={0}
                  max={maxPrice}
                  step={100}
                  onValueValueChange={handlePriceRangeChange}
                />
                <div className="flex justify-between mt-2 text-sm">
                  <span>₹{filters.priceRange[0]}</span>
                  <span>₹{filters.priceRange[1]}</span>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
          
          {/* Tags */}
          {tags.length > 0 && (
            <AccordionItem value="tags">
              <AccordionTrigger className="text-sm font-medium">Tags</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {tags.map(tag => (
                    <div key={tag} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`tag-${tag}`} 
                        checked={filters.tags.includes(tag)}
                        onCheckedChange={(checked) => handleTagChange(tag, checked)}
                      />
                      <Label 
                        htmlFor={`tag-${tag}`}
                        className="text-sm cursor-pointer"
                      >
                        #{tag}
                      </Label>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          )}
          
          {/* Availability */}
          <AccordionItem value="availability">
            <AccordionTrigger className="text-sm font-medium">Availability</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="in-stock" 
                    checked={filters.inStock}
                    onCheckedChange={handleInStockChange}
                  />
                  <Label 
                    htmlFor="in-stock"
                    className="text-sm cursor-pointer"
                  >
                    In Stock Only
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="on-sale" 
                    checked={filters.onSale}
                    onCheckedChange={handleOnSaleChange}
                  />
                  <Label 
                    htmlFor="on-sale"
                    className="text-sm cursor-pointer"
                  >
                    On Sale
                  </Label>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
};

export default ProductFilter;