import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getPageSEO } from '@/services/seoService';
import { PageSEO } from '@/types/seo';
import { SEOProps } from './seoTypes';

const SEO: React.FC<SEOProps> = ({ 
  title, 
  description, 
  keywords, 
  ogImage,
  canonicalUrl,
  noindex = false 
}) => {
  const location = useLocation();
  const [pageSEO, setPageSEO] = React.useState<PageSEO | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  useEffect(() => {
    const loadPageSEO = async () => {
      setIsLoading(true);
      try {
        const pageData = await getPageSEO(location.pathname);
        setPageSEO(pageData);
      } catch (error) {
        console.error('Error loading page SEO data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPageSEO();
  }, [location.pathname]);

  useEffect(() => {
    // Skip if still loading
    if (isLoading) return;

    // Determine what values to use (props have priority over fetched data)
    const finalTitle = title || (pageSEO?.title) || document.title;
    const finalDescription = description || (pageSEO?.description) || '';
    const finalKeywords = keywords || (pageSEO?.keywords) || [];
    const finalOgImage = ogImage || (pageSEO?.ogImage) || '';
    const finalCanonicalUrl = canonicalUrl || (pageSEO?.canonicalUrl) || window.location.href;
    const finalNoindex = noindex || (pageSEO?.isIndexable === false);

    // Set document title
    document.title = finalTitle;

    // Clean up any existing meta tags we might have added
    const existingMetaTags = document.querySelectorAll('meta[data-seo="true"]');
    existingMetaTags.forEach(tag => tag.remove());

    // Clean up any existing canonical link
    const existingCanonical = document.querySelector('link[rel="canonical"]');
    if (existingCanonical) {
      existingCanonical.remove();
    }

    // Add meta description
    if (finalDescription) {
      const metaDescription = document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      metaDescription.setAttribute('content', finalDescription);
      metaDescription.setAttribute('data-seo', 'true');
      document.head.appendChild(metaDescription);
    }

    // Add meta keywords
    if (finalKeywords.length > 0) {
      const metaKeywords = document.createElement('meta');
      metaKeywords.setAttribute('name', 'keywords');
      metaKeywords.setAttribute('content', finalKeywords.join(', '));
      metaKeywords.setAttribute('data-seo', 'true');
      document.head.appendChild(metaKeywords);
    }

    // Add robots meta tag if needed
    if (finalNoindex) {
      const metaRobots = document.createElement('meta');
      metaRobots.setAttribute('name', 'robots');
      metaRobots.setAttribute('content', 'noindex, nofollow');
      metaRobots.setAttribute('data-seo', 'true');
      document.head.appendChild(metaRobots);
    }

    // Add Open Graph tags
    const ogTags = [
      { property: 'og:title', content: finalTitle },
      { property: 'og:description', content: finalDescription },
      { property: 'og:url', content: window.location.href },
      { property: 'og:type', content: 'website' }
    ];

    if (finalOgImage) {
      ogTags.push({ property: 'og:image', content: finalOgImage });
    }

    ogTags.forEach(tag => {
      if (tag.content) {
        const metaTag = document.createElement('meta');
        metaTag.setAttribute('property', tag.property);
        metaTag.setAttribute('content', tag.content);
        metaTag.setAttribute('data-seo', 'true');
        document.head.appendChild(metaTag);
      }
    });

    // Add Twitter Card tags
    const twitterTags = [
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: finalTitle },
      { name: 'twitter:description', content: finalDescription },
    ];

    if (finalOgImage) {
      twitterTags.push({ name: 'twitter:image', content: finalOgImage });
    }

    twitterTags.forEach(tag => {
      if (tag.content) {
        const metaTag = document.createElement('meta');
        metaTag.setAttribute('name', tag.name);
        metaTag.setAttribute('content', tag.content);
        metaTag.setAttribute('data-seo', 'true');
        document.head.appendChild(metaTag);
      }
    });

    // Add canonical URL
    if (finalCanonicalUrl) {
      const canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      canonicalLink.setAttribute('href', finalCanonicalUrl);
      document.head.appendChild(canonicalLink);
    }

    // Clean up function
    return () => {
      // Remove meta tags when component unmounts
      const tagsToRemove = document.querySelectorAll('meta[data-seo="true"]');
      tagsToRemove.forEach(tag => tag.remove());

      // Remove canonical link
      const canonicalToRemove = document.querySelector('link[rel="canonical"]');
      if (canonicalToRemove) {
        canonicalToRemove.remove();
      }
    };
  }, [
    isLoading,
    title,
    description,
    keywords,
    ogImage,
    canonicalUrl,
    noindex,
    pageSEO
  ]);

  // This component doesn't render anything visible
  return null;
};

// eslint-disable-next-line react-refresh/only-export-components
export default SEO; 