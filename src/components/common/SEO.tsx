import React, { useEffect } from 'react';
import { useSiteConfig } from '../../context/SiteConfigContext.js';

export interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string[];
  ogType?: 'website' | 'article';
  ogImage?: string;
}

export const SEO: React.FC<SEOProps> = ({
  title,
  description,
  keywords,
  ogType = 'website',
  ogImage,
}) => {
  const { siteName, siteTagline, description: defaultDesc } = useSiteConfig();

  useEffect(() => {
    // 1. Dynamic Page Title
    const formattedTitle = title
      ? `${title} | ${siteName}`
      : `${siteName} - ${siteTagline}`;
    document.title = formattedTitle;

    // Helper to set or create meta tag
    const setMetaTag = (selector: string, attrName: string, attrVal: string, content: string) => {
      let element = document.querySelector(selector);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attrName, attrVal);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    const activeDescription = description || defaultDesc;

    // 2. Standard Meta Tags
    setMetaTag('meta[name="description"]', 'name', 'description', activeDescription);
    if (keywords && keywords.length > 0) {
      setMetaTag('meta[name="keywords"]', 'name', 'keywords', keywords.join(', '));
    }

    // 3. Open Graph (Social Sharing)
    setMetaTag('meta[property="og:title"]', 'property', 'og:title', formattedTitle);
    setMetaTag('meta[property="og:description"]', 'property', 'og:description', activeDescription);
    setMetaTag('meta[property="og:site_name"]', 'property', 'og:site_name', siteName);
    setMetaTag('meta[property="og:type"]', 'property', 'og:type', ogType);
    setMetaTag('meta[property="og:url"]', 'property', 'og:url', window.location.href);
    if (ogImage) {
      setMetaTag('meta[property="og:image"]', 'property', 'og:image', ogImage);
    }

    // 4. Twitter Cards
    setMetaTag('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image');
    setMetaTag('meta[name="twitter:title"]', 'name', 'twitter:title', formattedTitle);
    setMetaTag('meta[name="twitter:description"]', 'name', 'twitter:description', activeDescription);
  }, [title, description, keywords, ogType, ogImage, siteName, siteTagline, defaultDesc]);

  return null;
};
