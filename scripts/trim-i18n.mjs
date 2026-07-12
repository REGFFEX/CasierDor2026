import fs from 'fs';

const src = fs.readFileSync('utils/i18n.ts', 'utf8');
const frMatch = src.match(/^\s*fr:\s*\{([\s\S]*?)\n\s*\},\s*\n\s*'en-us':/m);
const enMatch = src.match(/^\s*'en-us':\s*\{([\s\S]*?)\n\s*\},\s*\n\s*'en-uk':/m);
if (!frMatch || !enMatch) {
  console.error('Could not extract fr/en blocks');
  process.exit(1);
}

const header = `/**
 * Système de traduction (français / anglais)
 */

export type Language = 'fr' | 'en';

export type Country = 'fr' | 'cg' | 'cd' | 'us' | 'ca';

export interface LanguageConfig {
  code: Language;
  name: string;
  flag: string;
}

export interface CountryConfig {
  code: Country;
  name: string;
  flag: string;
  languages: Language[];
}

export const SUPPORTED_COUNTRIES: CountryConfig[] = [
  { code: 'fr', name: 'France', flag: '🇫🇷', languages: ['fr', 'en'] },
  { code: 'cg', name: 'Congo-Brazzaville', flag: '🇨🇬', languages: ['fr', 'en'] },
  { code: 'cd', name: 'RDC (Kinshasa)', flag: '🇨🇩', languages: ['fr', 'en'] },
  { code: 'us', name: 'United States', flag: '🇺🇸', languages: ['en', 'fr'] },
  { code: 'ca', name: 'Canada', flag: '🇨🇦', languages: ['fr', 'en'] },
];

export const SUPPORTED_LANGUAGES: LanguageConfig[] = [
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
];

const LEGACY_LANGUAGE_MAP: Record<string, Language> = {
  'en-us': 'en',
  'en-uk': 'en',
  es: 'en',
  'zh-cn': 'en',
  'zh-tw': 'en',
  ja: 'en',
  ru: 'en',
  de: 'en',
  ko: 'en',
  ar: 'en',
  'ln-brazza': 'fr',
  'ln-kinshasa': 'fr',
  kit: 'fr',
  'pt-br': 'en',
  it: 'en',
  pt: 'en',
  nl: 'en',
  sv: 'en',
  no: 'en',
  da: 'en',
  fi: 'en',
  pl: 'en',
  cs: 'en',
  hu: 'en',
  el: 'en',
  tr: 'en',
  uk: 'en',
  hi: 'en',
  ur: 'en',
  bn: 'en',
  id: 'en',
  ms: 'en',
  th: 'en',
  vi: 'en',
  sw: 'en',
};

export function normalizeLanguage(lang: string | null | undefined): Language {
  if (!lang) return 'fr';
  if (lang === 'fr' || lang === 'en') return lang;
  return LEGACY_LANGUAGE_MAP[lang] || 'fr';
}

function humanizeKey(key: string): string {
  const last = key.split('.').pop() || key;
  return last
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_-]/g, ' ')
    .replace(/\\s+/g, ' ')
    .trim()
    .replace(/^\w/, (c) => c.toUpperCase());
}

`;

const frBody = frMatch[1];
const enBody = enMatch[1];

const extraFr = `
    'accounting.addTransaction': 'Nouvelle opération',
    'accounting.form.placeholder.amount': 'Ex: 50000',
    'accounting.form.placeholder.desc': 'Ex: Vente de 50 casiers',
    'stock.productInfo': 'Informations produit',
    'stock.active': 'Actif',
    'stock.inactive': 'Inactif',
    'stock.barcode': 'Code-barres',
    'stock.description': 'Description',
    'stock.noDescription': 'Aucun détail supplémentaire.',
    'button.noImage': 'Sans image',
    'button.clear': 'Effacer',
    'button.back': 'Retour',
`;

const extraEn = `
    'stock.productInfo': 'Product information',
    'stock.active': 'Active',
    'stock.inactive': 'Inactive',
    'stock.barcode': 'Barcode',
    'stock.description': 'Description',
    'stock.noDescription': 'No additional details.',
    'button.noImage': 'No image',
    'button.clear': 'Clear',
    'button.back': 'Back',
`;

const footer = `
  },
};

export const t = (key: string, language: Language = 'fr', params?: Record<string, any>): string => {
  const lang = normalizeLanguage(language);
  const frMap = TRANSLATIONS.fr;
  const enMap = TRANSLATIONS.en;
  let text =
    (lang === 'en' ? enMap[key] : frMap[key]) ||
    frMap[key] ||
    enMap[key];

  if (!text) {
    text = humanizeKey(key);
  }

  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      text = text.replace(new RegExp(\`{{\${k}}}\`, 'g'), String(v));
    });
  }

  return text;
};
`;

const out =
  header +
  'export const TRANSLATIONS: Record<Language, Record<string, string>> = {\n  fr: {' +
  frBody +
  extraFr +
  '\n  },\n  en: {' +
  enBody +
  extraEn +
  footer;

fs.writeFileSync('utils/i18n.ts', out);
console.log('Written utils/i18n.ts', out.length, 'bytes');
