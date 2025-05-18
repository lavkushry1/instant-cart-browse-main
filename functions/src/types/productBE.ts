// functions/src/types/productBE.ts

// Duplicated from src/types/product.ts to satisfy functions/tsconfig.json rootDir

export interface ProductBE {
  id: string;
  name: string;
  description: string;
  price: number;
  compareAtPrice: number;
  images: string[];
  category: string; // Should this be categoryId for backend?
  tags: string[];
  stock: number;
  featured: number;
  discount: number;
  // Timestamps in BE are typically admin.firestore.Timestamp, not string.
  // This needs to be aligned with how ProductBE is actually used/stored in Firestore by productServiceBE.
  // For now, keeping as string to match original src/types/product.ts for direct duplication.
  createdAt: string; 
  updatedAt: string;
  seo?: SEOBE;
}

export interface SEOBE {
  title: string;
  description: string;
  keywords: string[];
  canonicalUrl?: string;
  ogImage?: string;
  structuredData?: string;
} 