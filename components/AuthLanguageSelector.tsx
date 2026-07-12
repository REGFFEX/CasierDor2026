import React, { useState, useEffect, useId, useCallback } from 'react';

import { ChevronDown, Check } from 'lucide-react';

import {

  SUPPORTED_COUNTRIES,

  SUPPORTED_LANGUAGES,

  Country,

  Language,

  normalizeLanguage,

  LANGUAGE_FLAG_ISO,

} from '../utils/i18n';

import { getStoreData, setStoreData, STORAGE_KEYS, DEFAULT_SETTINGS } from '../store';

import { StoreSettings } from '../types';

import { useLanguage } from '../utils/languageContext';

import CountryFlagIcon from './CountryFlagIcon';



interface AuthLanguageSelectorProps {

  onSync?: () => void;

  /** @deprecated Sync automatique — bouton masqué par défaut */

  showSyncButton?: boolean;

}



const AuthLanguageSelector: React.FC<AuthLanguageSelectorProps> = ({

  onSync,

  showSyncButton = false,

}) => {

  const { t, language: contextLanguage, country: contextCountry, setLanguage, setCountry } = useLanguage();

  const settings = getStoreData<StoreSettings>(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);



  const [selectedCountry, setSelectedCountry] = useState<string>(contextCountry || settings.country || 'cg');

  const [selectedLanguage, setSelectedLanguage] = useState<string>(

    normalizeLanguage(contextLanguage || settings.language || 'fr')

  );

  const [appliedFlash, setAppliedFlash] = useState(false);



  const countrySelectId = useId();

  const languageSelectId = useId();



  useEffect(() => {

    setSelectedCountry(contextCountry || settings.country || 'cg');

    setSelectedLanguage(normalizeLanguage(contextLanguage || settings.language || 'fr'));

  }, [contextCountry, contextLanguage, settings.country, settings.language]);



  const applyLocale = useCallback(

    (countryCode: string, langCode: string) => {

      const normalizedLang = normalizeLanguage(langCode);

      const updatedSettings: StoreSettings = {

        ...getStoreData(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS),

        country: countryCode,

        language: normalizedLang,

        updatedAt: Date.now(),

      };

      setStoreData(STORAGE_KEYS.SETTINGS, updatedSettings);

      setLanguage(normalizedLang);

      setCountry(countryCode as Country);

      localStorage.setItem('app_language', normalizedLang);

      localStorage.setItem('app_country', countryCode);



      setAppliedFlash(true);

      setTimeout(() => setAppliedFlash(false), 1800);

      onSync?.();

    },

    [setLanguage, setCountry, onSync]

  );



  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {

    const newCountryCode = e.target.value;

    setSelectedCountry(newCountryCode);



    const countryCfg = SUPPORTED_COUNTRIES.find((c) => c.code === newCountryCode);

    let newLang = selectedLanguage as Language;

    if (countryCfg && !countryCfg.languages.includes(newLang)) {

      newLang = countryCfg.defaultLanguage;

      setSelectedLanguage(newLang);

    } else if (countryCfg) {

      newLang = countryCfg.defaultLanguage;

      setSelectedLanguage(newLang);

    }



    applyLocale(newCountryCode, newLang);

  };



  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {

    const newLang = normalizeLanguage(e.target.value);

    setSelectedLanguage(newLang);



    const countryCfg = SUPPORTED_COUNTRIES.find((c) => c.code === selectedCountry);

    if (countryCfg && !countryCfg.languages.includes(newLang)) {

      const fallbackCountry = SUPPORTED_COUNTRIES.find((c) => c.languages.includes(newLang));

      if (fallbackCountry) {

        setSelectedCountry(fallbackCountry.code);

        applyLocale(fallbackCountry.code, newLang);

        return;

      }

    }



    applyLocale(selectedCountry, newLang);

  };



  const currentCountryConfig = SUPPORTED_COUNTRIES.find((c) => c.code === selectedCountry);

  const availableLanguages = SUPPORTED_LANGUAGES.filter((l) =>

    currentCountryConfig?.languages.includes(l.code)

  );



  const selectClass =

    'text-xs font-semibold bg-transparent outline-none appearance-none cursor-pointer dark:text-white pr-6 min-w-0 max-w-[140px] truncate';



  return (

    <div className="flex flex-col items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-500">

      <div className="flex items-center gap-1 bg-white/70 dark:bg-slate-800/80 backdrop-blur-md p-1.5 rounded-2xl border border-gray-100 dark:border-slate-600 shadow-sm">

        {/* Pays */}

        <div className="relative flex items-center gap-1.5 px-2 py-1.5 hover:bg-gray-50 dark:hover:bg-slate-700 rounded-xl transition-colors">

          {currentCountryConfig && (

            <CountryFlagIcon iso2={currentCountryConfig.iso2} size={24} />

          )}

          <select

            id={countrySelectId}

            value={selectedCountry}

            onChange={handleCountryChange}

            className={selectClass}

            aria-label={t('form.country')}

          >

            {SUPPORTED_COUNTRIES.map((c) => (

              <option key={c.code} value={c.code}>

                {t(`country.${c.code}`)}

              </option>

            ))}

          </select>

          <ChevronDown className="w-3 h-3 text-gray-400 absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none" />

        </div>



        <div className="w-px h-6 bg-gray-200 dark:bg-slate-600" />



        {/* Langue */}

        <div className="relative flex items-center gap-1.5 px-2 py-1.5 hover:bg-gray-50 dark:hover:bg-slate-700 rounded-xl transition-colors">

          <CountryFlagIcon iso2={LANGUAGE_FLAG_ISO[selectedLanguage as Language] || 'gb'} size={24} />

          <select

            id={languageSelectId}

            value={selectedLanguage}

            onChange={handleLanguageChange}

            className={`${selectClass} uppercase`}

            aria-label={t('auth.selectLanguage')}

          >

            {availableLanguages.map((l) => (

              <option key={l.code} value={l.code}>

                {t(`language.${l.code}`)}

              </option>

            ))}

          </select>

          <ChevronDown className="w-3 h-3 text-gray-400 absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none" />

        </div>

      </div>



      {appliedFlash && (

        <p className="text-[10px] font-bold text-green-600 dark:text-green-400 flex items-center gap-1 animate-in fade-in">

          <Check className="w-3 h-3" />

          {t('auth.localeApplied')}

        </p>

      )}



      {showSyncButton && (

        <button type="button" onClick={() => applyLocale(selectedCountry, selectedLanguage)} className="text-[10px] text-blue-600">

          {t('auth.syncLanguage')}

        </button>

      )}

    </div>

  );

};



export default AuthLanguageSelector;


