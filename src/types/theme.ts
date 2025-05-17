export interface Theme {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  isActive: boolean;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  settings: ThemeSettings;
}

export interface ThemeSettings {
  // Colors
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  linkColor: string;
  buttonColor: string;
  buttonTextColor: string;
  headerBackgroundColor: string;
  footerBackgroundColor: string;
  
  // Typography
  headingFont: string;
  bodyFont: string;
  fontSize: {
    base: string;
    h1: string;
    h2: string;
    h3: string;
    h4: string;
    h5: string;
    small: string;
  };
  
  // Layout
  containerWidth: string;
  borderRadius: string;
  cardShadow: string;
  
  // Header Settings
  headerLayout: 'default' | 'centered' | 'minimal';
  showSearchInHeader: boolean;
  showCartInHeader: boolean;
  
  // Footer Settings
  footerLayout: 'default' | 'minimal' | 'expanded';
  showSocialInFooter: boolean;
  showNewsletterInFooter: boolean;
  footerLinks: {
    title: string;
    items: Array<{ text: string; url: string; }>;
  }[];
  
  // Homepage Layout
  homepageLayout: HomepageLayoutSettings;
  
  // Product Page Settings
  productPageLayout: 'default' | 'gallery' | 'fullwidth';
  productImageSize: 'small' | 'medium' | 'large';
  showRelatedProducts: boolean;
  
  // Mobile Settings
  mobileBreakpoint: string;
  mobileMenuStyle: 'drawer' | 'dropdown';
  
  // Custom CSS
  customCSS: string;
}

export interface HomepageLayoutSettings {
  sections: HomepageSection[];
}

// Define settings interfaces for each section type
export interface HeroSettings {
  imageUrl: string;
  heading: string;
  subheading: string;
  buttonText: string;
  buttonLink: string;
  overlayColor: string;
  overlayOpacity: number;
  height: 'small' | 'medium' | 'large' | 'fullscreen';
  textAlignment: 'left' | 'center' | 'right';
}

export interface FeaturedProductsSettings {
  title: string;
  productIds: string[];
  displayStyle: 'grid' | 'carousel';
  numberOfProducts: number;
  showPrice: boolean;
  showRating: boolean;
}

export interface CategoriesSettings {
  title: string;
  categoryIds: string[];
  displayStyle: 'grid' | 'list' | 'carousel';
  showProductCount: boolean;
}

export interface BannerSettings {
  imageUrl: string;
  linkUrl?: string;
  height?: 'auto' | 'fixed'; // Example, adjust as needed
  fullWidth?: boolean;
}

export interface TestimonialsSettings {
  title: string;
  testimonials: Array<{ quote: string; author: string; source?: string; avatarUrl?: string; }>;
  displayStyle: 'carousel' | 'grid';
}

export interface NewsletterSettings {
  title: string;
  description?: string;
  placeholderText?: string;
  submitButtonText?: string;
}

export interface CustomSectionSettings {
  htmlContent?: string;
  scriptSrc?: string; 
  // Or more generally
  config?: Record<string, unknown>; 
}

// Base interface for common section properties
interface BaseHomepageSection {
  id: string;
  title: string;
  subtitle?: string;
  visible: boolean;
}

// Discriminated union for HomepageSection
export type HomepageSection = 
  | (BaseHomepageSection & { type: 'hero'; settings: HeroSettings; })
  | (BaseHomepageSection & { type: 'featured-products'; settings: FeaturedProductsSettings; })
  | (BaseHomepageSection & { type: 'categories'; settings: CategoriesSettings; })
  | (BaseHomepageSection & { type: 'banner'; settings: BannerSettings; })
  | (BaseHomepageSection & { type: 'testimonials'; settings: TestimonialsSettings; })
  | (BaseHomepageSection & { type: 'newsletter'; settings: NewsletterSettings; })
  | (BaseHomepageSection & { type: 'custom'; settings: CustomSectionSettings; });

export interface SeasonalTheme {
  id: string;
  name: string;
  description: string;
  themeId: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  overrideSettings: Partial<ThemeSettings>;
} 