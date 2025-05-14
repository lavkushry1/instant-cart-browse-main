import { SEO } from './product';

export interface PageSEO extends SEO {
  id: string;
  path: string;
  pageType: 'product' | 'category' | 'page' | 'home';
  entityId?: string; // Product ID or Category ID if applicable
  isIndexable: boolean;
  lastModified: string;
  priority: number; // For sitemap priority (0.0 to 1.0)
  changeFrequency: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
}

export interface GlobalSEO {
  id: string;
  siteName: string;
  titleTemplate: string; // e.g., "%s | Instant Cart"
  defaultTitle: string;
  defaultDescription: string;
  defaultKeywords: string[];
  defaultOgImage: string;
  robotsTxt: string;
  googleVerification?: string;
  bingVerification?: string;
}

export interface SitemapSettings {
  id: string;
  enabled: boolean;
  excludePaths: string[];
  additionalUrls: string[];
  lastGenerated?: string;
}

export interface ContentAnalysis {
  keyword: string;
  wordCount: number;
  keywordDensity: number;
  readabilityScore: number;
  suggestions: string[];
} 