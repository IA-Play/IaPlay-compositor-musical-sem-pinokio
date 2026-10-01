import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppLanguage } from '../types';
import { TRANSLATIONS } from '../locales/translations';

interface LanguageContextType {
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within a LanguageProvider');
  return context;
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<AppLanguage>(AppLanguage.PT);

  const detectGeoLanguage = async (): Promise<AppLanguage | null> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 segundos max
      
      const response = await fetch('https://ipapi.co/json/', {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        const country = data.country_code?.toUpperCase();
        if (country) {
          if (['BR', 'PT', 'AO', 'MZ', 'CV', 'GW', 'ST', 'TL'].includes(country)) {
            return AppLanguage.PT;
          }
          if (['ES', 'MX', 'AR', 'CO', 'PE', 'VE', 'CL', 'EC', 'GT', 'BO', 'DO', 'HN', 'PY', 'SV', 'NI', 'CR', 'UY', 'PA', 'GQ'].includes(country)) {
            return AppLanguage.ES;
          }
          return AppLanguage.EN;
        }
      }
    } catch (e) {
      console.warn("Geo-IP detection timed out or failed, falling back to browser language.");
    }
    return null;
  };

  const setLanguage = (lang: AppLanguage) => {
    setLanguageState(lang);
    localStorage.setItem('iaplay_lang', lang);
    document.documentElement.lang = lang;
  };

  useEffect(() => {
    const storedLang = localStorage.getItem('iaplay_lang');
    if (storedLang && Object.values(AppLanguage).includes(storedLang as AppLanguage)) {
      setLanguageState(storedLang as AppLanguage);
      document.documentElement.lang = storedLang;
    } else {
      const detect = async () => {
        const geoLang = await detectGeoLanguage();
        if (geoLang) {
          setLanguage(geoLang);
        } else {
          const browserLang = (navigator.language || (navigator as any).userLanguage || '').split('-')[0].toLowerCase();
          if (browserLang === 'es') {
            setLanguage(AppLanguage.ES);
          } else if (browserLang === 'en') {
            setLanguage(AppLanguage.EN);
          } else {
            setLanguage(AppLanguage.PT);
          }
        }
      };
      detect();
    }
  }, []);

  const t = (key: string): string => {
    const keys = key.split('.');
    
    // 1. Try selected language
    let value: any = TRANSLATIONS[language];
    for (const k of keys) {
      value = value?.[k];
      if (value === undefined || value === null) break;
    }
    if (value !== undefined && value !== null && typeof value === 'string') return value;

    // 2. Fallback to Portuguese (default author language)
    let fallbackPt: any = TRANSLATIONS[AppLanguage.PT];
    for (const k of keys) {
      fallbackPt = fallbackPt?.[k];
      if (fallbackPt === undefined || fallbackPt === null) break;
    }
    if (fallbackPt !== undefined && fallbackPt !== null && typeof fallbackPt === 'string') return fallbackPt;

    // 3. Fallback to English
    let fallbackEn: any = TRANSLATIONS[AppLanguage.EN];
    for (const k of keys) {
      fallbackEn = fallbackEn?.[k];
      if (fallbackEn === undefined || fallbackEn === null) break;
    }
    if (fallbackEn !== undefined && fallbackEn !== null && typeof fallbackEn === 'string') return fallbackEn;

    return key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};