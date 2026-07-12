import React, { useMemo } from 'react';
import { TrendingUp, ArrowRight, Info } from 'lucide-react';
import { getExchangeRates, convert } from '../utils/currencyConverter';

/**
 * Composant d'affichage des taux de change
 * Affiche tous les taux relatifs à une devise de base
 */

interface ExchangeRateDisplayProps {
  baseCurrency?: string;
  className?: string;
}

const ExchangeRateDisplay: React.FC<ExchangeRateDisplayProps> = ({
  baseCurrency = 'XAF',
  className = ''
}) => {
  const rates = useMemo(() => getExchangeRates(baseCurrency), [baseCurrency]);

  const currencyNames: Record<string, string> = {
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

  const currencySymbols: Record<string, string> = {
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

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start space-x-3">
        <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-900">
          <p className="font-semibold">Taux de change 2026</p>
          <p className="text-xs opacity-75 mt-1">1 {baseCurrency} équivaut à...</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {Object.entries(rates).map(([currency, rate]) => {
          if (currency === baseCurrency || currency === 'FCFA') return null;

          return (
            <div
              key={currency}
              className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all"
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase">
                    {currency}
                  </p>
                  <p className="text-sm text-gray-600 font-medium">
                    {currencyNames[currency] || currency}
                  </p>
                </div>
                <span className="text-2xl font-black text-gray-300">
                  {currencySymbols[currency] || currency}
                </span>
              </div>
              <div className="pt-3 border-t border-gray-100">
                <p className="text-lg font-bold text-gray-900">
                  {(rate as number) > 10 
                    ? (rate as number).toFixed(0)
                    : (rate as number).toFixed(4)
                  }
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  1 {baseCurrency} = {(rate as number).toFixed(4)} {currencySymbols[currency]}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Conversion Example */}
      <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-3">
        <p className="text-sm font-semibold text-green-900 flex items-center">
          <TrendingUp className="w-4 h-4 mr-2" />
          Exemple de conversion
        </p>
        <div className="bg-white rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">1000 {baseCurrency}</span>
            <ArrowRight className="w-4 h-4 text-green-600" />
            <span className="font-bold text-gray-900">
              {convert(1000, baseCurrency, 'EUR').toLocaleString('fr-FR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })} €
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">1000 {baseCurrency}</span>
            <ArrowRight className="w-4 h-4 text-green-600" />
            <span className="font-bold text-gray-900">
              {convert(1000, baseCurrency, 'USD').toLocaleString('fr-FR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })} $
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExchangeRateDisplay;
