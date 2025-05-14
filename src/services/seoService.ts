import { SEO } from '@/types/product';
import { PageSEO, GlobalSEO, SitemapSettings, ContentAnalysis } from '@/types/seo';

// Mock data for global SEO settings
let globalSEOSettings: GlobalSEO = {
  id: '1',
  siteName: 'Instant Cart',
  titleTemplate: '%s | Instant Cart',
  defaultTitle: 'Instant Cart - Fast and Easy Online Shopping',
  defaultDescription: 'Shop the latest products at Instant Cart. Fast delivery and secure payments for all your shopping needs.',
  defaultKeywords: ['online shopping', 'ecommerce', 'instant cart', 'fast delivery'],
  defaultOgImage: '/images/og-default.jpg',
  robotsTxt: 'User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /checkout\nSitemap: https://instant-cart.example.com/sitemap.xml',
  googleVerification: 'google-verification-code',
  bingVerification: 'bing-verification-code',
};

// Mock data for sitemap settings
let sitemapSettings: SitemapSettings = {
  id: '1',
  enabled: true,
  excludePaths: ['/admin/*', '/checkout/*', '/account/*'],
  additionalUrls: ['https://instant-cart.example.com/policies/returns', 'https://instant-cart.example.com/policies/shipping'],
  lastGenerated: new Date().toISOString(),
};

// Mock data for page SEO
const pageSEOData: Record<string, PageSEO> = {
  'home': {
    id: 'home',
    path: '/',
    pageType: 'home',
    title: 'Instant Cart - Fast and Easy Online Shopping',
    description: 'Shop the latest products at Instant Cart. Fast delivery and secure payments for all your shopping needs.',
    keywords: ['ecommerce', 'shopping', 'online store'],
    ogImage: '/images/og-home.jpg',
    isIndexable: true,
    lastModified: new Date().toISOString(),
    priority: 1.0,
    changeFrequency: 'daily',
  },
  'products': {
    id: 'products',
    path: '/products',
    pageType: 'page',
    title: 'All Products | Instant Cart',
    description: 'Browse our full catalog of products. Find everything you need in one place.',
    keywords: ['products', 'catalog', 'browse'],
    isIndexable: true,
    lastModified: new Date().toISOString(),
    priority: 0.9,
    changeFrequency: 'daily',
  },
};

// Product SEO cache
const productSEOCache: Record<string, SEO> = {};

/**
 * Get global SEO settings
 */
export const getGlobalSEOSettings = async (): Promise<GlobalSEO> => {
  // Simulate API call
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(globalSEOSettings);
    }, 300);
  });
};

/**
 * Update global SEO settings
 */
export const updateGlobalSEOSettings = async (settings: Partial<GlobalSEO>): Promise<GlobalSEO> => {
  // Simulate API call
  return new Promise((resolve) => {
    setTimeout(() => {
      globalSEOSettings = { ...globalSEOSettings, ...settings };
      resolve(globalSEOSettings);
    }, 300);
  });
};

/**
 * Get sitemap settings
 */
export const getSitemapSettings = async (): Promise<SitemapSettings> => {
  // Simulate API call
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(sitemapSettings);
    }, 300);
  });
};

/**
 * Update sitemap settings
 */
export const updateSitemapSettings = async (settings: Partial<SitemapSettings>): Promise<SitemapSettings> => {
  // Simulate API call
  return new Promise((resolve) => {
    setTimeout(() => {
      sitemapSettings = { ...sitemapSettings, ...settings };
      resolve(sitemapSettings);
    }, 300);
  });
};

/**
 * Generate XML sitemap
 */
export const generateSitemap = async (): Promise<{ success: boolean; lastGenerated: string }> => {
  // Simulate API call for generating sitemap
  return new Promise((resolve) => {
    setTimeout(() => {
      sitemapSettings.lastGenerated = new Date().toISOString();
      resolve({ success: true, lastGenerated: sitemapSettings.lastGenerated });
    }, 1000);
  });
};

/**
 * Get page SEO settings
 */
export const getPageSEO = async (path: string): Promise<PageSEO | null> => {
  // Simulate API call
  return new Promise((resolve) => {
    setTimeout(() => {
      const page = Object.values(pageSEOData).find(p => p.path === path);
      resolve(page || null);
    }, 300);
  });
};

/**
 * Update page SEO settings
 */
export const updatePageSEO = async (pageSEO: PageSEO): Promise<PageSEO> => {
  // Simulate API call
  return new Promise((resolve) => {
    setTimeout(() => {
      pageSEOData[pageSEO.id] = {
        ...pageSEO,
        lastModified: new Date().toISOString()
      };
      resolve(pageSEOData[pageSEO.id]);
    }, 300);
  });
};

/**
 * Get product SEO settings
 */
export const getProductSEO = async (productId: string): Promise<SEO | null> => {
  // Simulate API call
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(productSEOCache[productId] || null);
    }, 300);
  });
};

/**
 * Update product SEO settings
 */
export const updateProductSEO = async (productId: string, seo: SEO): Promise<SEO> => {
  // Simulate API call
  return new Promise((resolve) => {
    setTimeout(() => {
      productSEOCache[productId] = seo;
      resolve(productSEOCache[productId]);
    }, 300);
  });
};

/**
 * Bulk update product SEO settings
 */
export const bulkUpdateProductSEO = async (updates: { productId: string; seo: Partial<SEO> }[]): Promise<boolean> => {
  // Simulate API call
  return new Promise((resolve) => {
    setTimeout(() => {
      updates.forEach(update => {
        if (productSEOCache[update.productId]) {
          productSEOCache[update.productId] = {
            ...productSEOCache[update.productId],
            ...update.seo
          };
        } else {
          productSEOCache[update.productId] = update.seo as SEO;
        }
      });
      resolve(true);
    }, 500);
  });
};

/**
 * Analyze content for SEO
 */
export const analyzeContent = async (content: string, keyword: string): Promise<ContentAnalysis> => {
  // Simulate API call for content analysis
  return new Promise((resolve) => {
    setTimeout(() => {
      // Very simple analysis algorithm (would be more complex in real implementation)
      const wordCount = content.split(/\s+/).length;
      const keywordCount = content.toLowerCase().split(keyword.toLowerCase()).length - 1;
      const keywordDensity = (keywordCount / wordCount) * 100;
      
      let readabilityScore = Math.floor(Math.random() * 30) + 70; // Random score between 70-100
      let suggestions: string[] = [];
      
      if (keywordDensity < 0.5) {
        suggestions.push(`Keyword density is too low (${keywordDensity.toFixed(1)}%). Try to use the keyword more often.`);
      } else if (keywordDensity > 2.5) {
        suggestions.push(`Keyword density is too high (${keywordDensity.toFixed(1)}%). This might be seen as keyword stuffing.`);
      }
      
      if (wordCount < 300) {
        suggestions.push(`Content is too short (${wordCount} words). Consider adding more content for better SEO.`);
        readabilityScore -= 10;
      }
      
      resolve({
        keyword,
        wordCount,
        keywordDensity,
        readabilityScore,
        suggestions
      });
    }, 800);
  });
};

/**
 * Get robots.txt content
 */
export const getRobotsTxt = async (): Promise<string> => {
  // Simulate API call
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(globalSEOSettings.robotsTxt);
    }, 300);
  });
};

/**
 * Update robots.txt content
 */
export const updateRobotsTxt = async (content: string): Promise<boolean> => {
  // Simulate API call
  return new Promise((resolve) => {
    setTimeout(() => {
      globalSEOSettings.robotsTxt = content;
      resolve(true);
    }, 300);
  });
}; 