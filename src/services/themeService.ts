import { Theme, ThemeSettings, SeasonalTheme } from '@/types/theme';

// Default themes
const defaultThemes: Theme[] = [
  {
    id: 'default',
    name: 'Default',
    description: 'The default store theme with a clean, modern design.',
    thumbnail: '/themes/default.jpg',
    isActive: true,
    isDefault: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    settings: {
      // Colors
      primaryColor: '#2563eb', // Blue
      secondaryColor: '#16a34a', // Green
      accentColor: '#f59e0b', // Amber
      backgroundColor: '#ffffff',
      textColor: '#1f2937',
      linkColor: '#2563eb',
      buttonColor: '#2563eb',
      buttonTextColor: '#ffffff',
      headerBackgroundColor: '#ffffff',
      footerBackgroundColor: '#f3f4f6',
      
      // Typography
      headingFont: 'Inter, sans-serif',
      bodyFont: 'Inter, sans-serif',
      fontSize: {
        base: '16px',
        h1: '2.25rem',
        h2: '1.875rem',
        h3: '1.5rem',
        h4: '1.25rem',
        h5: '1.125rem',
        small: '0.875rem',
      },
      
      // Layout
      containerWidth: '1280px',
      borderRadius: '0.5rem',
      cardShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
      
      // Header Settings
      headerLayout: 'default',
      showSearchInHeader: true,
      showCartInHeader: true,
      
      // Footer Settings
      footerLayout: 'default',
      showSocialInFooter: true,
      showNewsletterInFooter: true,
      footerLinks: [
        {
          title: 'Shop',
          items: [
            { text: 'All Products', url: '/products' },
            { text: 'New Arrivals', url: '/products?sort=newest' },
            { text: 'Best Sellers', url: '/products?sort=bestselling' },
            { text: 'Deals', url: '/deals' },
          ]
        },
        {
          title: 'About',
          items: [
            { text: 'Our Story', url: '/about' },
            { text: 'Blog', url: '/blog' },
            { text: 'Testimonials', url: '/testimonials' },
            { text: 'Contact Us', url: '/contact' },
          ]
        },
        {
          title: 'Support',
          items: [
            { text: 'FAQs', url: '/faqs' },
            { text: 'Shipping', url: '/shipping' },
            { text: 'Returns', url: '/returns' },
            { text: 'Track Order', url: '/track-order' },
          ]
        }
      ],
      
      // Homepage Layout
      homepageLayout: {
        sections: [
          {
            id: 'hero',
            type: 'hero',
            title: 'Hero Section',
            visible: true,
            settings: {
              imageUrl: '/images/hero-default.jpg',
              heading: 'Welcome to Instant Cart',
              subheading: 'Shop the latest products with fast delivery',
              buttonText: 'Shop Now',
              buttonLink: '/products',
              overlayColor: '#000000',
              overlayOpacity: 0.3,
              height: 'large',
              textAlignment: 'center',
            }
          },
          {
            id: 'featured-products',
            type: 'featured-products',
            title: 'Featured Products',
            subtitle: 'Check out our most popular items',
            visible: true,
            settings: {
              title: 'Featured Products',
              productIds: [],
              displayStyle: 'carousel',
              numberOfProducts: 8,
              showPrice: true,
              showRating: true,
            }
          },
          {
            id: 'categories',
            type: 'categories',
            title: 'Shop by Category',
            visible: true,
            settings: {
              displayStyle: 'grid',
              categoriesShown: []
            }
          }
        ]
      },
      
      // Product Page Settings
      productPageLayout: 'default',
      productImageSize: 'medium',
      showRelatedProducts: true,
      
      // Mobile Settings
      mobileBreakpoint: '768px',
      mobileMenuStyle: 'drawer',
      
      // Custom CSS
      customCSS: '',
    }
  },
  {
    id: 'dark',
    name: 'Dark Mode',
    description: 'A sleek dark theme that\'s easy on the eyes.',
    thumbnail: '/themes/dark.jpg',
    isActive: false,
    isDefault: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    settings: {
      // Colors
      primaryColor: '#3b82f6', // Blue
      secondaryColor: '#10b981', // Green
      accentColor: '#f59e0b', // Amber
      backgroundColor: '#111827',
      textColor: '#f3f4f6',
      linkColor: '#3b82f6',
      buttonColor: '#3b82f6',
      buttonTextColor: '#ffffff',
      headerBackgroundColor: '#1f2937',
      footerBackgroundColor: '#1f2937',
      
      // Typography
      headingFont: 'Inter, sans-serif',
      bodyFont: 'Inter, sans-serif',
      fontSize: {
        base: '16px',
        h1: '2.25rem',
        h2: '1.875rem',
        h3: '1.5rem',
        h4: '1.25rem',
        h5: '1.125rem',
        small: '0.875rem',
      },
      
      // Layout
      containerWidth: '1280px',
      borderRadius: '0.5rem',
      cardShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.3), 0 1px 2px 0 rgba(0, 0, 0, 0.2)',
      
      // Header Settings
      headerLayout: 'default',
      showSearchInHeader: true,
      showCartInHeader: true,
      
      // Footer Settings
      footerLayout: 'default',
      showSocialInFooter: true,
      showNewsletterInFooter: true,
      footerLinks: [
        {
          title: 'Shop',
          items: [
            { text: 'All Products', url: '/products' },
            { text: 'New Arrivals', url: '/products?sort=newest' },
            { text: 'Best Sellers', url: '/products?sort=bestselling' },
            { text: 'Deals', url: '/deals' },
          ]
        },
        {
          title: 'About',
          items: [
            { text: 'Our Story', url: '/about' },
            { text: 'Blog', url: '/blog' },
            { text: 'Testimonials', url: '/testimonials' },
            { text: 'Contact Us', url: '/contact' },
          ]
        },
        {
          title: 'Support',
          items: [
            { text: 'FAQs', url: '/faqs' },
            { text: 'Shipping', url: '/shipping' },
            { text: 'Returns', url: '/returns' },
            { text: 'Track Order', url: '/track-order' },
          ]
        }
      ],
      
      // Homepage Layout
      homepageLayout: {
        sections: [
          {
            id: 'hero',
            type: 'hero',
            title: 'Hero Section',
            visible: true,
            settings: {
              imageUrl: '/images/hero-dark.jpg',
              heading: 'Welcome to Instant Cart',
              subheading: 'Shop the latest products with fast delivery',
              buttonText: 'Shop Now',
              buttonLink: '/products',
              overlayColor: '#000000',
              overlayOpacity: 0.5,
              height: 'large',
              textAlignment: 'center',
            }
          },
          {
            id: 'featured-products',
            type: 'featured-products',
            title: 'Featured Products',
            subtitle: 'Check out our most popular items',
            visible: true,
            settings: {
              title: 'Featured Products',
              productIds: [],
              displayStyle: 'carousel',
              numberOfProducts: 8,
              showPrice: true,
              showRating: true,
            }
          },
          {
            id: 'categories',
            type: 'categories',
            title: 'Shop by Category',
            visible: true,
            settings: {
              displayStyle: 'grid',
              categoriesShown: []
            }
          }
        ]
      },
      
      // Product Page Settings
      productPageLayout: 'default',
      productImageSize: 'medium',
      showRelatedProducts: true,
      
      // Mobile Settings
      mobileBreakpoint: '768px',
      mobileMenuStyle: 'drawer',
      
      // Custom CSS
      customCSS: '',
    }
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'A minimalist theme focused on product display.',
    thumbnail: '/themes/minimal.jpg',
    isActive: false,
    isDefault: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    settings: {
      // Colors
      primaryColor: '#111827', // Dark Gray
      secondaryColor: '#4b5563', // Medium Gray
      accentColor: '#ef4444', // Red
      backgroundColor: '#ffffff',
      textColor: '#111827',
      linkColor: '#111827',
      buttonColor: '#111827',
      buttonTextColor: '#ffffff',
      headerBackgroundColor: '#ffffff',
      footerBackgroundColor: '#f9fafb',
      
      // Typography
      headingFont: 'DM Sans, sans-serif',
      bodyFont: 'DM Sans, sans-serif',
      fontSize: {
        base: '16px',
        h1: '2rem',
        h2: '1.5rem',
        h3: '1.25rem',
        h4: '1.125rem',
        h5: '1rem',
        small: '0.875rem',
      },
      
      // Layout
      containerWidth: '1200px',
      borderRadius: '0.25rem',
      cardShadow: 'none',
      
      // Header Settings
      headerLayout: 'minimal',
      showSearchInHeader: true,
      showCartInHeader: true,
      
      // Footer Settings
      footerLayout: 'minimal',
      showSocialInFooter: true,
      showNewsletterInFooter: false,
      footerLinks: [
        {
          title: 'Shop',
          items: [
            { text: 'All Products', url: '/products' },
            { text: 'New Arrivals', url: '/products?sort=newest' },
            { text: 'Best Sellers', url: '/products?sort=bestselling' },
          ]
        },
        {
          title: 'Info',
          items: [
            { text: 'About', url: '/about' },
            { text: 'Contact', url: '/contact' },
            { text: 'Returns', url: '/returns' },
          ]
        },
      ],
      
      // Homepage Layout
      homepageLayout: {
        sections: [
          {
            id: 'hero',
            type: 'hero',
            title: 'Hero Section',
            visible: true,
            settings: {
              imageUrl: '/images/hero-minimal.jpg',
              heading: 'Instant Cart',
              subheading: 'Simplified shopping experience',
              buttonText: 'Shop Now',
              buttonLink: '/products',
              overlayColor: '#ffffff',
              overlayOpacity: 0.1,
              height: 'medium',
              textAlignment: 'left',
            }
          },
          {
            id: 'featured-products',
            type: 'featured-products',
            title: 'Featured Products',
            subtitle: '',
            visible: true,
            settings: {
              title: 'Featured',
              productIds: [],
              displayStyle: 'grid',
              numberOfProducts: 6,
              showPrice: true,
              showRating: false,
            }
          }
        ]
      },
      
      // Product Page Settings
      productPageLayout: 'gallery',
      productImageSize: 'large',
      showRelatedProducts: true,
      
      // Mobile Settings
      mobileBreakpoint: '768px',
      mobileMenuStyle: 'dropdown',
      
      // Custom CSS
      customCSS: '',
    }
  }
];

// Default seasonal themes
const defaultSeasonalThemes: SeasonalTheme[] = [
  {
    id: 'winter-holiday',
    name: 'Winter Holiday',
    description: 'Festive winter holiday theme with snow effects and holiday colors.',
    themeId: 'default',
    startDate: new Date(new Date().getFullYear(), 11, 1).toISOString(), // December 1
    endDate: new Date(new Date().getFullYear(), 11, 31).toISOString(), // December 31
    isActive: false,
    overrideSettings: {
      primaryColor: '#0f766e', // Teal
      accentColor: '#dc2626', // Red
      customCSS: `
        .hero-section {
          background-image: url('/images/winter-hero.jpg');
          background-size: cover;
          position: relative;
        }
        .hero-section::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-image: url('/images/snowflakes.png');
          pointer-events: none;
          z-index: 1;
        }
      `
    }
  },
  {
    id: 'summer-sale',
    name: 'Summer Sale',
    description: 'Bright and vibrant summer theme for seasonal promotions.',
    themeId: 'default',
    startDate: new Date(new Date().getFullYear(), 5, 1).toISOString(), // June 1
    endDate: new Date(new Date().getFullYear(), 7, 31).toISOString(), // August 31
    isActive: false,
    overrideSettings: {
      primaryColor: '#f59e0b', // Amber
      accentColor: '#3b82f6', // Blue
      customCSS: `
        .hero-section {
          background-image: url('/images/summer-hero.jpg');
          background-size: cover;
        }
        .promo-banner {
          background: linear-gradient(to right, #f59e0b, #d97706);
          color: white;
          padding: 0.5rem 1rem;
          text-align: center;
          font-weight: bold;
        }
      `
    }
  }
];

// In-memory storage
let themes = [...defaultThemes];
let seasonalThemes = [...defaultSeasonalThemes];
let activeTheme = themes.find(theme => theme.isActive) || themes[0];

/**
 * Get all available themes
 */
export const getAllThemes = async (): Promise<Theme[]> => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(themes);
    }, 300);
  });
};

/**
 * Get a theme by ID
 */
export const getThemeById = async (id: string): Promise<Theme | null> => {
  return new Promise(resolve => {
    setTimeout(() => {
      const theme = themes.find(t => t.id === id);
      resolve(theme || null);
    }, 300);
  });
};

/**
 * Get the active theme
 */
export const getActiveTheme = async (): Promise<Theme> => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(activeTheme);
    }, 300);
  });
};

/**
 * Activate a theme
 */
export const activateTheme = async (id: string): Promise<Theme> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const theme = themes.find(t => t.id === id);
      
      if (!theme) {
        reject(new Error(`Theme with ID ${id} not found`));
        return;
      }
      
      // Update all themes' active status
      themes = themes.map(t => ({
        ...t,
        isActive: t.id === id
      }));
      
      activeTheme = theme;
      activeTheme.isActive = true;
      
      resolve(activeTheme);
    }, 300);
  });
};

/**
 * Update theme settings
 */
export const updateThemeSettings = async (id: string, settings: Partial<ThemeSettings>): Promise<Theme> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const themeIndex = themes.findIndex(t => t.id === id);
      
      if (themeIndex === -1) {
        reject(new Error(`Theme with ID ${id} not found`));
        return;
      }
      
      // Update theme settings
      themes[themeIndex] = {
        ...themes[themeIndex],
        settings: {
          ...themes[themeIndex].settings,
          ...settings
        },
        updatedAt: new Date().toISOString()
      };
      
      // If this is the active theme, update the active theme reference
      if (themes[themeIndex].isActive) {
        activeTheme = themes[themeIndex];
      }
      
      resolve(themes[themeIndex]);
    }, 300);
  });
};

/**
 * Save a new theme or update an existing one
 */
export const saveTheme = async (theme: Partial<Theme> & { id: string }): Promise<Theme> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const themeIndex = themes.findIndex(t => t.id === theme.id);
      
      if (themeIndex === -1) {
        // Create new theme
        const newTheme: Theme = {
          id: theme.id,
          name: theme.name || 'New Theme',
          description: theme.description || '',
          thumbnail: theme.thumbnail || '/themes/default.jpg',
          isActive: theme.isActive || false,
          isDefault: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          settings: theme.settings || { ...defaultThemes[0].settings }
        };
        
        themes.push(newTheme);
        
        if (newTheme.isActive) {
          // Update other themes' active status
          themes = themes.map(t => ({
            ...t,
            isActive: t.id === newTheme.id
          }));
          
          activeTheme = newTheme;
        }
        
        resolve(newTheme);
      } else {
        // Update existing theme
        const updatedTheme: Theme = {
          ...themes[themeIndex],
          ...theme,
          updatedAt: new Date().toISOString()
        };
        
        themes[themeIndex] = updatedTheme;
        
        if (updatedTheme.isActive) {
          // Update other themes' active status
          themes = themes.map(t => ({
            ...t,
            isActive: t.id === updatedTheme.id
          }));
          
          activeTheme = updatedTheme;
        }
        
        resolve(updatedTheme);
      }
    }, 300);
  });
};

/**
 * Delete a theme
 */
export const deleteTheme = async (id: string): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const themeIndex = themes.findIndex(t => t.id === id);
      
      if (themeIndex === -1) {
        reject(new Error(`Theme with ID ${id} not found`));
        return;
      }
      
      // Cannot delete the default theme
      if (themes[themeIndex].isDefault) {
        reject(new Error('Cannot delete the default theme'));
        return;
      }
      
      // Cannot delete the active theme
      if (themes[themeIndex].isActive) {
        reject(new Error('Cannot delete the active theme. Please activate another theme first.'));
        return;
      }
      
      // Remove theme
      themes = themes.filter(t => t.id !== id);
      
      resolve(true);
    }, 300);
  });
};

/**
 * SEASONAL THEMES
 */

/**
 * Get all seasonal themes
 */
export const getAllSeasonalThemes = async (): Promise<SeasonalTheme[]> => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(seasonalThemes);
    }, 300);
  });
};

/**
 * Get a seasonal theme by ID
 */
export const getSeasonalThemeById = async (id: string): Promise<SeasonalTheme | null> => {
  return new Promise(resolve => {
    setTimeout(() => {
      const theme = seasonalThemes.find(t => t.id === id);
      resolve(theme || null);
    }, 300);
  });
};

/**
 * Save a seasonal theme
 */
export const saveSeasonalTheme = async (theme: Partial<SeasonalTheme> & { id: string }): Promise<SeasonalTheme> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // Check if base theme exists
      if (theme.themeId && !themes.find(t => t.id === theme.themeId)) {
        reject(new Error(`Base theme with ID ${theme.themeId} not found`));
        return;
      }
      
      const themeIndex = seasonalThemes.findIndex(t => t.id === theme.id);
      
      if (themeIndex === -1) {
        // Create new seasonal theme
        const newTheme: SeasonalTheme = {
          id: theme.id,
          name: theme.name || 'New Seasonal Theme',
          description: theme.description || '',
          themeId: theme.themeId || 'default',
          startDate: theme.startDate || new Date().toISOString(),
          endDate: theme.endDate || new Date(new Date().setDate(new Date().getDate() + 30)).toISOString(), // 30 days from now
          isActive: theme.isActive || false,
          overrideSettings: theme.overrideSettings || {}
        };
        
        seasonalThemes.push(newTheme);
        resolve(newTheme);
      } else {
        // Update existing seasonal theme
        const updatedTheme: SeasonalTheme = {
          ...seasonalThemes[themeIndex],
          ...theme
        };
        
        seasonalThemes[themeIndex] = updatedTheme;
        resolve(updatedTheme);
      }
    }, 300);
  });
};

/**
 * Activate a seasonal theme
 */
export const activateSeasonalTheme = async (id: string): Promise<SeasonalTheme> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const themeIndex = seasonalThemes.findIndex(t => t.id === id);
      
      if (themeIndex === -1) {
        reject(new Error(`Seasonal theme with ID ${id} not found`));
        return;
      }
      
      // Deactivate all other seasonal themes
      seasonalThemes = seasonalThemes.map(t => ({
        ...t,
        isActive: t.id === id
      }));
      
      // Apply the seasonal theme overrides to the base theme
      const seasonalTheme = seasonalThemes[themeIndex];
      const baseThemeIndex = themes.findIndex(t => t.id === seasonalTheme.themeId);
      
      if (baseThemeIndex === -1) {
        reject(new Error(`Base theme with ID ${seasonalTheme.themeId} not found`));
        return;
      }
      
      // Activate the base theme first
      activateTheme(seasonalTheme.themeId).then(() => {
        // Then apply the seasonal overrides
        updateThemeSettings(seasonalTheme.themeId, seasonalTheme.overrideSettings).then(() => {
          resolve(seasonalTheme);
        }).catch(reject);
      }).catch(reject);
    }, 300);
  });
};

/**
 * Deactivate a seasonal theme
 */
export const deactivateSeasonalTheme = async (id: string): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const themeIndex = seasonalThemes.findIndex(t => t.id === id);
      
      if (themeIndex === -1) {
        reject(new Error(`Seasonal theme with ID ${id} not found`));
        return;
      }
      
      // Only deactivate if this theme is currently active
      if (seasonalThemes[themeIndex].isActive) {
        seasonalThemes[themeIndex].isActive = false;
        
        // Restore the base theme without overrides
        const baseThemeId = seasonalThemes[themeIndex].themeId;
        activateTheme(baseThemeId).then(() => {
          resolve(true);
        }).catch(reject);
      } else {
        resolve(false);
      }
    }, 300);
  });
};

/**
 * Delete a seasonal theme
 */
export const deleteSeasonalTheme = async (id: string): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const themeIndex = seasonalThemes.findIndex(t => t.id === id);
      
      if (themeIndex === -1) {
        reject(new Error(`Seasonal theme with ID ${id} not found`));
        return;
      }
      
      // Cannot delete an active seasonal theme
      if (seasonalThemes[themeIndex].isActive) {
        reject(new Error('Cannot delete an active seasonal theme. Please deactivate it first.'));
        return;
      }
      
      // Remove seasonal theme
      seasonalThemes = seasonalThemes.filter(t => t.id !== id);
      
      resolve(true);
    }, 300);
  });
}; 