import React, { useMemo } from 'react';
import { ChevronDown } from 'lucide-react';
import { useLanguage } from '../utils/languageContext';
import CountryFlagIcon from './CountryFlagIcon';
import {
  PHONE_DIAL_OPTIONS,
  validatePhoneNumber,
  formatPhoneMessage,
  getDialCodeForAppCountry,
  type PhoneDialCode,
} from '../utils/phoneValidation';

interface PhoneInputProps {
  value: string;
  dialCode?: PhoneDialCode | string;
  onChange: (localNumber: string) => void;
  onDialCodeChange?: (dial: PhoneDialCode) => void;
  placeholder?: string;
  className?: string;
  showHint?: boolean;
  disabled?: boolean;
  id?: string;
}

const PhoneInput: React.FC<PhoneInputProps> = ({
  value,
  dialCode: dialCodeProp,
  onChange,
  onDialCodeChange,
  placeholder,
  className = '',
  showHint = true,
  disabled = false,
  id,
}) => {
  const { t, country: appCountry } = useLanguage();
  const dialCode = (dialCodeProp || getDialCodeForAppCountry(appCountry)) as PhoneDialCode;

  const dialOption = PHONE_DIAL_OPTIONS.find((o) => o.dial === dialCode) || PHONE_DIAL_OPTIONS[0];

  const validation = useMemo(
    () => (value.trim() ? validatePhoneNumber(value, dialCode) : null),
    [value, dialCode]
  );

  const hintText = t(dialOption.hintKey);

  return (
    <div className={`space-y-1 ${className}`}>
      <div className="flex gap-2">
        <div className="relative flex items-center shrink-0">
          <CountryFlagIcon iso2={dialOption.iso2} size={22} className="absolute left-2 z-10 pointer-events-none" />
          <select
            value={dialCode}
            disabled={disabled}
            onChange={(e) => onDialCodeChange?.(e.target.value as PhoneDialCode)}
            className="appearance-none pl-9 pr-7 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-sm font-semibold text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer min-w-[108px]"
            aria-label={t('form.country')}
          >
            {PHONE_DIAL_OPTIONS.map((opt) => (
              <option key={opt.dial} value={opt.dial}>
                {opt.dial}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2 pointer-events-none" />
        </div>
        <input
          id={id}
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          disabled={disabled}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || hintText}
          className={`flex-1 min-w-0 px-4 py-3 bg-gray-50 dark:bg-slate-700 border rounded-xl outline-none focus:ring-2 focus:ring-blue-400 dark:text-white text-sm ${
            validation && !validation.valid ? 'border-amber-400' : 'border-gray-200 dark:border-slate-600'
          }`}
        />
      </div>
      {showHint && <p className="text-[10px] text-gray-400 px-1">{hintText}</p>}
      {validation && value.trim() && (
        <p
          className={`text-[10px] font-semibold px-1 ${
            validation.valid ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'
          }`}
        >
          {formatPhoneMessage(validation, t)}
        </p>
      )}
    </div>
  );
};

export default PhoneInput;
