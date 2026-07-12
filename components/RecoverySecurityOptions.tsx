import React from 'react';
import { Shield } from 'lucide-react';
import { useLanguage } from '../utils/languageContext';
import { getRecoverySecurityPrefs, setRecoverySecurityPrefs } from '../utils/recoverySecurityPrefs';

interface RecoverySecurityOptionsProps {
  compact?: boolean;
  onChange?: () => void;
}

const RecoverySecurityOptions: React.FC<RecoverySecurityOptionsProps> = ({ compact, onChange }) => {
  const { t } = useLanguage();
  const prefs = getRecoverySecurityPrefs();

  const toggle = (key: 'requireManualKeyAfterUpload' | 'useKeyFilePassword') => {
    setRecoverySecurityPrefs({ [key]: !prefs[key] });
    onChange?.();
  };

  return (
    <div
      className={`rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50/80 dark:bg-slate-800/50 ${
        compact ? 'p-3 space-y-2' : 'p-4 space-y-3'
      }`}
    >
      <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wide">
        <Shield className="w-4 h-4 text-blue-500" />
        {t('auth.recoverySecurityOptionsTitle')}
      </div>
      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
        {t('auth.recoverySecurityOptionsHint')}
      </p>

      <label className="flex items-start gap-3 cursor-pointer group">
        <input
          type="checkbox"
          checked={!!prefs.requireManualKeyAfterUpload}
          onChange={() => toggle('requireManualKeyAfterUpload')}
          className="mt-0.5 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white">
          {t('auth.requireManualKeyAfterUpload')}
        </span>
      </label>

      <label className="flex items-start gap-3 cursor-pointer group">
        <input
          type="checkbox"
          checked={!!prefs.useKeyFilePassword}
          onChange={() => toggle('useKeyFilePassword')}
          className="mt-0.5 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white">
          {t('auth.useKeyFilePassword')}
        </span>
      </label>
    </div>
  );
};

export default RecoverySecurityOptions;
