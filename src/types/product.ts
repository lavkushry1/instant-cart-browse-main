export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  compareAtPrice: number;
  images: string[];
  category: string;
  tags: string[];
  stock: number;
  featured: number;
  discount: number;
  createdAt: string;
  updatedAt: string;
  seo?: SEO;
}

export interface SEO {
  title: string;
  description: string;
  keywords: string[];
  canonicalUrl?: string;
  ogImage?: string;
  structuredData?: string;
} 