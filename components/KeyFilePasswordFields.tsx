import React from 'react';
import { Lock } from 'lucide-react';
import { useLanguage } from '../utils/languageContext';

interface KeyFilePasswordFieldsProps {
  password: string;
  confirm: string;
  onPasswordChange: (v: string) => void;
  onConfirmChange: (v: string) => void;
}

const KeyFilePasswordFields: React.FC<KeyFilePasswordFieldsProps> = ({
  password,
  confirm,
  onPasswordChange,
  onConfirmChange,
}) => {
  const { t } = useLanguage();
  const mismatch = confirm.length > 0 && password !== confirm;

  return (
    <div className="space-y-3 p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
      <p className="text-xs font-bold text-blue-800 dark:text-blue-200">{t('auth.useKeyFilePassword')}</p>
      <div>
        <label className="text-xs text-gray-600 dark:text-gray-400">{t('auth.keyFilePassword')}</label>
        <div className="relative mt-1">
          <Lock className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input
            type="password"
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            placeholder={t('auth.keyFilePasswordPlaceholder')}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white"
            minLength={4}
          />
        </div>
      </div>
      <div>
        <label className="text-xs text-gray-600 dark:text-gray-400">{t('auth.keyFilePasswordConfirm')}</label>
        <input
          type="password"
          value={confirm}
          onChange={(e) => onConfirmChange(e.target.value)}
          className={`w-full mt-1 px-3 py-2 text-sm border rounded-lg dark:bg-slate-700 dark:text-white ${
            mismatch ? 'border-red-400' : 'border-gray-300 dark:border-slate-600'
          }`}
          minLength={4}
        />
      </div>
    </div>
  );
};

export default KeyFilePasswordFields;
