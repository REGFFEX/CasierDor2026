/**
 * Contexte React pour la gestion de la langue et du pays
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Language, Country, t as translate, normalizeLanguage, SUPPORTED_COUNTRIES } from './i18n';

interface LanguageContextType {
  language: Language;
  country: Country;
  setLanguage: (lang: Language) => void;
  setCountry: (country: Country) => void;
  t: (key: string, params?: Record<string, any>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const VALID_COUNTRIES = SUPPORTED_COUNTRIES.map((c) => c.code);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('app_language');
    return normalizeLanguage(saved);
  });

  const [country, setCountryState] = useState<Country>(() => {
    const saved = localStorage.getItem('app_country');
    if (saved && VALID_COUNTRIES.includes(saved as Country)) {
      return saved as Country;
    }
    return 'cg';
  });

  useEffect(() => {
    const normalized = normalizeLanguage(language);
    if (normalized !== language) {
      setLanguageState(normalized);
    }
    localStorage.setItem('app_language', normalized);
    localStorage.setItem('app_country', country);
    document.documentElement.lang = normalized;
    document.documentElement.dir = 'ltr';
  }, [language, country]);

  const setLanguage = (lang: Language) => {
    setLanguageState(normalizeLanguage(lang));
  };

  const setCountry = (c: Country) => {
    setCountryState(c);
  };

  const t = (key: string, params?: Record<string, any>): string => {
    return translate(key, language, params);
  };

  return (
    <LanguageContext.Provider value={{ language, country, setLanguage, setCountry, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage doit être utilisé dans LanguageProvider');
  }
  return context;
};
