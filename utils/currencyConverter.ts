/**
 * Système de conversion monétaire réelle - 2026
 * TOUS les montants doivent passer par cette fonction
 * Taux de change fixes en vigueur en 2026
 * Devise de référence: XAF (Franc CFA)
 */

// ========== TAUX DE CHANGE FIXES 2026 ==========
// Base: 1 unité de chaque devise en XAF
const EXCHANGE_RATES_TO_XAF: Record<string, number> = {
  'XAF': 1,
  'FCFA': 1,
  'EUR': 655.957,      // 1 EUR = 655,957 XAF
  'USD': 559.996,      // 1 USD = 559,996 XAF
  'GBP': 747.070,      // 1 GBP = 747,070 XAF
  'CHF': 696.189,      // 1 CHF = 696,189 XAF
  'CAD': 405.042,      // 1 CAD = 405,042 XAF
  'JPY': 3.5798,       // 1 JPY = 3,5798 XAF
  'CNY': 79.396,       // 1 CNY = 79,396 XAF
};

// Symboles des devises
const CURRENCY_SYMBOLS: Record<string, string> = {
  'XAF': 'FCFA',
  'FCFA': 'FCFA',
  'EUR': '€',
  'USD': '$',
  'GBP': '£',
  'CHF': '₣',
  'CAD': 'C$',
  'JPY': '¥',
  'CNY': '¥',
};

// Noms complets des devises
const CURRENCY_NAMES: Record<string, string> = {
  'XAF': 'Franc CFA',
  'FCFA': 'Franc CFA',
  'EUR': 'Euro',
  'USD': 'Dollar américain',
  'GBP': 'Livre sterling',
  'CHF': 'Franc suisse',
  'CAD': 'Dollar canadien',
  'JPY': 'Yen japonais',
  'CNY': 'Yuan chinois',
};

// Historique des taux (pour cohérence des rapports passés)
interface ExchangeRateHistory {
  date: number;
  rates: Record<string, number>;
}

let exchangeRateHistory: ExchangeRateHistory[] = [
  {
    date: new Date('2026-01-01').getTime(),
    rates: EXCHANGE_RATES_TO_XAF,
  }
];

// ========== FONCTION CENTRALISÉE DE CONVERSION ==========

/**
 * ⭐ FONCTION PRINCIPALE - Convert
 * TOUS les montants d'argent de l'app doivent passer par cette fonction
 * 
 * @param amount - Montant à convertir
 * @param fromCurrency - Devise source (code: 'EUR', 'USD', etc.)
 * @param toCurrency - Devise cible
 * @param decimals - Nombre de décimales (défaut: 2)
 * @returns Montant converti
 * 
 * @example
 * // Convertir 500 XAF en EUR
 * const euros = convert(500, 'XAF', 'EUR');
 * // Résultat: 0.762 EUR
 * 
 * // Convertir 100 EUR en XAF
 * const fcfa = convert(100, 'EUR', 'XAF');
 * // Résultat: 65595.7 FCFA
 */
export const convert = (
  amount: number,
  fromCurrency: string = 'XAF',
  toCurrency: string = 'XAF',
  decimals: number = 2
): number => {
  // Normaliser les codes devise
  const from = fromCurrency.toUpperCase();
  const to = toCurrency.toUpperCase();

  // Si devises identiques
  if (from === to) {
    return parseFloat(amount.toFixed(decimals));
  }

  // Vérifier existence des devises
  if (!EXCHANGE_RATES_TO_XAF[from]) {
    console.warn(`⚠️ Devise source inconnue: ${from}, utilisation XAF par défaut`);
    return amount;
  }

  if (!EXCHANGE_RATES_TO_XAF[to]) {
    console.warn(`⚠️ Devise cible inconnue: ${to}, utilisation XAF par défaut`);
    return amount;
  }

  // CONVERSION:
  // 1. Convertir montant source → XAF
  const amountInXAF = amount * EXCHANGE_RATES_TO_XAF[from];
  
  // 2. Convertir XAF → devise cible
  const converted = amountInXAF / EXCHANGE_RATES_TO_XAF[to];

  // Retourner avec nombre de décimales spécifié
  return parseFloat(converted.toFixed(decimals));
};

/**
 * Convertit une valeur d'une devise à une autre (ancien nom - compatible)
 * @deprecated Utiliser convert() à la place
 */
export const convertCurrency = (
  amount: number,
  fromCurrency: string,
  toCurrency: string
): number => {
  return convert(amount, fromCurrency, toCurrency);
};

// ========== FORMATAGE ET AFFICHAGE ==========

/**
 * Formate un montant avec sa devise
 * UTILISER CETTE FONCTION POUR TOUS LES AFFICHAGES DE PRIX
 * 
 * @example
 * formatMoney(1500.5, 'EUR');  // "1 500,50 €"
 * formatMoney(655957, 'XAF');  // "655 957 FCFA"
 */
export const formatMoney = (
  amount: number,
  currency: string = 'XAF',
  decimals: number = 2
): string => {
  const curr = currency.toUpperCase();
  const symbol = CURRENCY_SYMBOLS[curr] || curr;
  
  const formatted = amount.toLocaleString('fr-FR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  
  return `${formatted} ${symbol}`;
};

/**
 * Formate un montant convertit
 * Combine convert + formatMoney
 * 
 * @example
 * formatConvertedMoney(500, 'XAF', 'EUR');  // "0,76 €"
 */
export const formatConvertedMoney = (
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  decimals: number = 2
): string => {
  const converted = convert(amount, fromCurrency, toCurrency, decimals);
  return formatMoney(converted, toCurrency, decimals);
};

/**
 * Formate un montant avec sa devise (ancien nom - compatible)
 * @deprecated Utiliser formatMoney() à la place
 */
export const formatCurrency = (
  amount: number,
  currency: string,
  decimals: number = 2
): string => {
  return formatMoney(amount, currency, decimals);
};

// ========== UTILITAIRES ==========

/**
 * Obtient le symbole d'une devise
 */
export const getCurrencySymbol = (currency: string): string => {
  return CURRENCY_SYMBOLS[currency.toUpperCase()] || currency;
};

/**
 * Obtient le nom d'une devise
 */
export const getCurrencyName = (currency: string): string => {
  return CURRENCY_NAMES[currency.toUpperCase()] || currency;
};

/**
 * Obtient tous les taux de change pour une devise donnée
 * 
 * @example
 * getExchangeRates('EUR');
 * // { XAF: 655.957, USD: 1.171, GBP: 0.878, ... }
 */
export const getExchangeRates = (baseCurrency: string = 'XAF'): Record<string, number> => {
  const base = baseCurrency.toUpperCase();
  const baseRate = EXCHANGE_RATES_TO_XAF[base];

  if (!baseRate) {
    console.warn(`Devise inconnue: ${base}`);
    return {};
  }

  const rates: Record<string, number> = {};

  Object.entries(EXCHANGE_RATES_TO_XAF).forEach(([currency, rate]) => {
    rates[currency] = baseRate / rate;
  });

  return rates;
};

/**
 * Retourne un objet avec taux de base pour toutes les devises
 * Utile pour affichage des taux réels
 */
export const getAllBaseRates = (): Record<string, number> => {
  return { ...EXCHANGE_RATES_TO_XAF };
};

/**
 * Met à jour les taux de change (mise à jour manuelle)
 * Historise l'ancien taux
 */
export const updateExchangeRates = (newRates: Record<string, number>): void => {
  // Sauvegarder l'ancien taux dans l'historique
  exchangeRateHistory.push({
    date: Date.now(),
    rates: { ...EXCHANGE_RATES_TO_XAF },
  });

  // Appliquer les nouveaux taux
  Object.entries(newRates).forEach(([currency, rate]) => {
    if (EXCHANGE_RATES_TO_XAF[currency.toUpperCase()]) {
      EXCHANGE_RATES_TO_XAF[currency.toUpperCase()] = rate;
    }
  });

  console.log('✅ Taux de change mis à jour');
};

/**
 * Obtient l'historique des taux de change
 */
export const getExchangeRateHistory = (): ExchangeRateHistory[] => {
  return exchangeRateHistory;
};

/**
 * Obtient le taux pour une date spécifique (pour cohérence rapports)
 */
export const getRateForDate = (date: Date, currency: string): number => {
  const timestamp = date.getTime();
  
  // Trouver le taux le plus proche antérieur à la date
  const relevantHistory = exchangeRateHistory
    .filter(h => h.date <= timestamp)
    .sort((a, b) => b.date - a.date);

  if (relevantHistory.length === 0) {
    return EXCHANGE_RATES_TO_XAF[currency.toUpperCase()];
  }

  return relevantHistory[0].rates[currency.toUpperCase()];
};

/**
 * Convertit un montant en utilisant les taux d'une date spécifique
 * Utilisé pour les rapports historiques
 */
export const convertWithHistoricalRate = (
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  date: Date
): number => {
  const fromRate = getRateForDate(date, fromCurrency);
  const toRate = getRateForDate(date, toCurrency);

  const amountInXAF = amount * fromRate;
  return amountInXAF / toRate;
};
