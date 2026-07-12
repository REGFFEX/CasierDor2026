import React from 'react';
import { convert, formatMoney } from '../utils/currencyConverter';

/**
 * ⭐ COMPOSANT UNIVERSEL POUR AFFICHER LES PRIX
 * 
 * Chaque fois qu'on affiche un montant d'argent, utiliser ce composant!
 * Il convertit automatiquement depuis la devise source vers la devise cible.
 * 
 * @example
 * // Afficher 500 XAF convertis en EUR
 * <CurrencyDisplay amount={500} from="XAF" />
 * 
 * // Afficher 1500 EUR avec classe personnalisée
 * <CurrencyDisplay amount={1500} from="EUR" className="font-bold text-green-600" />
 * 
 * // Obtenir juste la valeur sans formatage
 * <CurrencyDisplay amount={500} from="XAF" showFormat={false} />
 */

interface CurrencyDisplayProps {
  /** Montant à afficher */
  amount: number;

  /** Devise source (défaut: XAF) */
  from?: string;

  /** Devise cible - si pas spécifiée, utilise currentCurrency du contexte */
  to?: string;

  /** Nombre de décimales (défaut: 2) */
  decimals?: number;

  /** Classes CSS additionnelles */
  className?: string;

  /** Afficher formaté ou juste le nombre */
  showFormat?: boolean;

  /** Ajouter la devise après le montant */
  showSymbol?: boolean;

  /** Couleur du texte selon le montant (vert si positif, rouge si négatif) */
  colorize?: boolean;

  /** Afficher les devises secondaires (EUR, USD) en petit */
  showSecondary?: boolean;
}

const CurrencyDisplay: React.FC<CurrencyDisplayProps> = ({
  amount,
  from = 'XAF',
  to,
  decimals = 2,
  className = '',
  showFormat = true,
  showSymbol = true,
  colorize = false,
  showSecondary = false,
}) => {
  // Récupérer la devise cible du localStorage si pas spécifiée
  const targetCurrency = to || (
    typeof window !== 'undefined'
      ? localStorage.getItem('selectedCurrency') || 'XAF'
      : 'XAF'
  );

  // Convertir le montant principal
  const converted = convert(amount, from, targetCurrency, decimals);

  // Déterminer la classe de couleur
  let colorClass = '';
  if (colorize) {
    if (converted > 0) {
      colorClass = 'text-green-600 dark:text-green-400';
    } else if (converted < 0) {
      colorClass = 'text-red-600 dark:text-red-400';
    }
  }

  // Formater le montant principal
  let displayValue: string;
  if (showFormat) {
    displayValue = formatMoney(converted, targetCurrency, decimals);
  } else if (showSymbol) {
    const formatted = converted.toLocaleString('fr-FR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
    const symbol = getSymbol(targetCurrency);
    displayValue = `${formatted} ${symbol}`;
  } else {
    displayValue = converted.toLocaleString('fr-FR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  }

  // Calculer les devises secondaires (EUR, USD) si demandé
  // Seulement si la devise principale n'est pas déjà EUR ou USD
  let secondaryDisplay = null;
  if (showSecondary) {
    const secondaries = [];

    if (targetCurrency !== 'EUR') {
      const valEUR = convert(amount, from, 'EUR', 2);
      secondaries.push(`${valEUR.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €`);
    }

    if (targetCurrency !== 'USD') {
      const valUSD = convert(amount, from, 'USD', 2);
      secondaries.push(`${valUSD.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} $`);
    }

    if (secondaries.length > 0) {
      secondaryDisplay = (
        <span className="text-[10px] text-gray-400 font-normal ml-1.5 opacity-80">
          ({secondaries.join(' / ')})
        </span>
      );
    }
  }

  return (
    <span className={`${colorClass} ${className} inline-flex items-baseline flex-wrap`}>
      <span className="whitespace-nowrap">{displayValue}</span>
      {secondaryDisplay}
    </span>
  );
};

/**
 * Obtient le symbole d'une devise
 */
const getSymbol = (currency: string): string => {
  const symbols: Record<string, string> = {
    'XAF': 'FCFA', 'FCFA': 'FCFA',
    'EUR': '€', 'USD': '$', 'GBP': '£',
    'CHF': '₣', 'CAD': 'C$', 'JPY': '¥', 'CNY': '¥',
  };
  return symbols[currency.toUpperCase()] || currency;
};

export default CurrencyDisplay;
