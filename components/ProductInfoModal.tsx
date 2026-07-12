import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { Product } from '../types';
import CurrencyDisplay from './CurrencyDisplay';
import { useLanguage } from '../utils/languageContext';

interface ProductInfoModalProps {
  product: Product;
  onClose: () => void;
}

/** Fiche produit plein écran, mobile-first, scroll vertical */
const ProductInfoModal: React.FC<ProductInfoModalProps> = ({ product, onClose }) => {
  const { t } = useLanguage();

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex flex-col"
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-info-title"
    >
      <div className="flex-1 flex flex-col bg-white dark:bg-slate-900 sm:max-w-2xl sm:mx-auto sm:my-4 sm:rounded-[2rem] sm:shadow-2xl sm:max-h-[calc(100dvh-2rem)] overflow-hidden w-full h-[100dvh] sm:h-auto">
        <header className="shrink-0 flex items-center justify-between px-4 py-4 border-b border-gray-100 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md z-10">
          <h2 id="product-info-title" className="text-lg font-bold text-gray-900 dark:text-white pr-12 line-clamp-1">
            {product.name}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 sm:top-4 sm:right-4 p-3 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700 shadow-lg transition-all active:scale-95"
            aria-label={t('button.close')}
          >
            <X className="w-6 h-6" strokeWidth={2.5} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar overscroll-contain">
          <div className="aspect-[4/3] sm:aspect-[16/10] bg-slate-100 dark:bg-slate-800 overflow-hidden">
            {product.image ? (
              <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm uppercase tracking-widest font-bold">
                {t('button.noImage')}
              </div>
            )}
          </div>

          <div className="p-5 sm:p-8 space-y-5 pb-10">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">{t('stock.productName')}</p>
              <p className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white mt-1">{product.name}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <InfoCell label={t('stock.sku')} value={product.sku || '—'} />
              <InfoCell label={t('stock.type')} value={product.type || '—'} />
              <InfoCell
                label={t('stock.unitPrice')}
                value={<CurrencyDisplay amount={product.price || 0} from="XAF" />}
                highlight
              />
              <InfoCell
                label={t('stock.purchasePrice')}
                value={<CurrencyDisplay amount={product.purchasePrice || 0} from="XAF" />}
              />
              <InfoCell label={t('stock.currentStock')} value={String(product.stock)} />
              <InfoCell label={t('stock.criticalThreshold')} value={String(product.criticalThreshold ?? 0)} />
            </div>

            <div className="flex flex-wrap gap-2">
              <span
                className={`px-4 py-2 rounded-full text-xs font-bold ${
                  product.active !== false
                    ? 'bg-green-50 text-green-700'
                    : 'bg-gray-100 text-gray-500'
                }`}
              >
                {product.active !== false ? t('stock.active') : t('stock.inactive')}
              </span>
              {product.stock <= (product.criticalThreshold ?? 0) && (
                <span className="px-4 py-2 bg-orange-50 text-orange-700 rounded-full text-xs font-bold">
                  {t('stock.lowStock')}
                </span>
              )}
            </div>

            {product.barcode && (
              <div className="p-4 bg-blue-50 dark:bg-blue-950/40 rounded-2xl border border-blue-100 dark:border-blue-900">
                <p className="text-[10px] uppercase tracking-widest text-blue-700 dark:text-blue-300 font-bold">
                  {t('stock.barcode')}
                </p>
                <p className="mt-2 text-sm font-mono text-gray-800 dark:text-gray-200">{product.barcode}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const InfoCell: React.FC<{
  label: string;
  value: React.ReactNode;
  highlight?: boolean;
}> = ({ label, value, highlight }) => (
  <div className="p-4 bg-gray-50 dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700">
    <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">{label}</p>
    <p className={`mt-2 font-bold text-sm sm:text-base ${highlight ? 'text-blue-600' : 'text-gray-900 dark:text-white'}`}>
      {value}
    </p>
  </div>
);

export default ProductInfoModal;
