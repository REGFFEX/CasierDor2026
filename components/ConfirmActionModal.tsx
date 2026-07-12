import React, { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useLanguage } from '../utils/languageContext';
import { isStrictConfirmation } from '../utils/confirmPreferences';

export type ConfirmLevel = 1 | 2;

export interface ConfirmActionModalProps {
  open: boolean;
  actionId: string;
  title?: string;
  message: string;
  level?: ConfirmLevel;
  confirmPhrase?: string;
  neverAsk?: boolean;
  onNeverAskChange?: (value: boolean) => void;
  onCancel: () => void;
  /** once = cette fois ; permanent = ne plus demander + exécuter */
  onConfirm: (mode: 'once' | 'permanent') => void;
}

const ConfirmActionModal: React.FC<ConfirmActionModalProps> = ({
  open,
  actionId,
  title,
  message,
  level,
  confirmPhrase,
  neverAsk = false,
  onNeverAskChange,
  onCancel,
  onConfirm,
}) => {
  const { t } = useLanguage();
  const [typed, setTyped] = useState('');
  const strict = level === 2 || isStrictConfirmation(actionId);
  const phrase = (confirmPhrase || t('confirm.typeConfirm')).trim().toUpperCase();
  const canSubmit = !strict || typed.trim().toUpperCase() === phrase;

  useEffect(() => {
    if (open) setTyped('');
  }, [open, actionId]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-4 sm:p-6 max-w-md w-full space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-amber-100 dark:bg-amber-900/40 rounded-xl shrink-0">
            <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="space-y-2 min-w-0">
            <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase">
              {title || t('message.confirm')}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">{message}</p>
          </div>
        </div>

        {strict && (
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase">
              {t('confirm.typeToProceed', { phrase })}
            </label>
            <input
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              className="w-full px-3 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-sm outline-none focus:ring-2 focus:ring-red-500"
              placeholder={phrase}
              autoComplete="off"
            />
          </div>
        )}

        {onNeverAskChange && (
          <div className="flex items-center space-x-3 bg-gray-50 dark:bg-slate-900/50 p-4 rounded-2xl">
            <button
              type="button"
              role="switch"
              aria-checked={neverAsk}
              onClick={() => onNeverAskChange(!neverAsk)}
              className={`w-10 h-6 rounded-full relative transition-colors flex-shrink-0 ${neverAsk ? 'bg-blue-600' : 'bg-gray-300'}`}
            >
              <div className={`absolute top-1 bg-white w-4 h-4 rounded-full transition-all ${neverAsk ? 'left-5' : 'left-1'}`} />
            </button>
            <span className="text-xs font-bold text-gray-600 dark:text-gray-400 select-none">
              {t('confirm.dontAsk')}
            </span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="w-full sm:flex-1 px-4 py-3 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 font-black rounded-2xl hover:bg-gray-200 transition-all text-[10px] uppercase"
          >
            {t('button.cancel')}
          </button>
          {onNeverAskChange && (
            <button
              type="button"
              disabled={!canSubmit}
              onClick={() => onConfirm('permanent')}
              className="w-full sm:flex-1 px-4 py-3 bg-red-600 text-white font-black rounded-2xl hover:bg-red-700 transition-all text-[10px] uppercase disabled:opacity-40"
            >
              {t('confirm.permanently')}
            </button>
          )}
          <button
            type="button"
            disabled={!canSubmit}
            onClick={() => onConfirm('once')}
            className={`w-full sm:flex-1 px-4 py-3 font-black rounded-2xl transition-all text-[10px] uppercase disabled:opacity-40 ${
              onNeverAskChange
                ? 'bg-yellow-400 text-yellow-900 hover:bg-yellow-500'
                : 'bg-red-600 text-white hover:bg-red-700'
            }`}
          >
            {onNeverAskChange ? t('confirm.thisTime') : t('button.confirm')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmActionModal;
