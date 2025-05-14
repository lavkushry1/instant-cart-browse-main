
export interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
  category: string;
  rating: number;
  description: string;
  brand: string;
  inStock: boolean;
  discount?: number;
  features?: string[];
  specifications?: Record<string, string>;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  subcategories: Subcategory[];
}

export interface Subcategory {
  id: number;
  name: string;
  slug: string;
}

export interface FilterOptions {
  categories: string[];
  priceRange: {
    min: number;
    max: number;
  };
  brands: string[];
  sortBy: 'price_low' | 'price_high' | 'rating' | 'newest' | string;
}
