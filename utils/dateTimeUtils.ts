import { Language } from './i18n';

/**
 * Maps language codes to their corresponding locale strings for Intl API
 */
export const getLocaleFromLanguage = (language: Language): string => {
  return language === 'en' ? 'en-US' : 'fr-FR';
};

/**
 * Format date and time according to locale
 */
export const formatDateTime = (
  date: Date,
  language: Language,
  options?: {
    includeTime?: boolean;
    dateStyle?: 'full' | 'long' | 'medium' | 'short';
    timeStyle?: 'full' | 'long' | 'medium' | 'short';
  }
): string => {
  const locale = getLocaleFromLanguage(language);

  try {
    if (options?.includeTime) {
      return new Intl.DateTimeFormat(locale, {
        dateStyle: options.dateStyle || 'long',
        timeStyle: options.timeStyle || 'short',
      }).format(date);
    }

    return new Intl.DateTimeFormat(locale, {
      dateStyle: options?.dateStyle || 'long',
    }).format(date);
  } catch (error) {
    console.error('Error formatting date:', error);
    return date.toLocaleString(locale);
  }
};

export const formatDate = (
  date: Date,
  language: Language,
  style: 'full' | 'long' | 'medium' | 'short' = 'long'
): string => {
  return formatDateTime(date, language, { dateStyle: style, includeTime: false });
};

export const formatTime = (
  date: Date,
  language: Language,
  style: 'full' | 'long' | 'medium' | 'short' = 'short'
): string => {
  const locale = getLocaleFromLanguage(language);

  try {
    return new Intl.DateTimeFormat(locale, {
      timeStyle: style,
    }).format(date);
  } catch (error) {
    console.error('Error formatting time:', error);
    return date.toLocaleTimeString(locale);
  }
};
