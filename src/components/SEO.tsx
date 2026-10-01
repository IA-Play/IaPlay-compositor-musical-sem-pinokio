import React, { useEffect } from 'react';
import { getSystemSettings } from '../services/settingsService';
import { useLanguage } from '../contexts/LanguageContext';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
}

export const SEO: React.FC<SEOProps> = ({ title, description, keywords }) => {
  const settings = getSystemSettings();
  const { language } = useLanguage();
  
  const localizedSettings = settings.seo?.[language] || settings.seo?.['pt'] || { title: settings.seoTitle, description: settings.seoDescription };

  const siteTitle = title ? `${title} | IAPLAY` : localizedSettings.title;
  const siteDesc = description || localizedSettings.description;
  
  useEffect(() => {
    document.title = siteTitle;
    document.documentElement.lang = language;
    
    // Helper to update meta tags
    const updateMeta = (name: string, content: string) => {
      let element = document.querySelector(`meta[name="${name}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute('name', name);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    updateMeta('description', siteDesc);
    if (keywords) updateMeta('keywords', keywords);

    // Schema.org JSON-LD
    const schemaData = {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "IAPLAY",
      "inLanguage": language,
      "applicationCategory": "MultimediaApplication",
      "operatingSystem": "Web",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "BRL",
        "description": "3 Days Free Trial"
      },
      "description": siteDesc,
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.9",
        "ratingCount": "1250"
      }
    };

    let script = document.querySelector('#seo-schema');
    if (!script) {
      script = document.createElement('script');
      script.id = 'seo-schema';
      script.setAttribute('type', 'application/ld+json');
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(schemaData);

  }, [siteTitle, siteDesc, keywords, language]);

  return null;
};