import React, { useState } from 'react';
import { Globe, ChevronDown } from 'lucide-react';
import { useLanguage } from '../../../utils/languageContext';
import { SUPPORTED_LANGUAGES, SUPPORTED_COUNTRIES } from '../../../utils/i18n';

const LanguageSettings: React.FC = () => {
  const { t, language, setLanguage, country, setCountry } = useLanguage();
  const [showSection, setShowSection] = useState(false);

  return (
    <div className="pt-6 border-t space-y-6">
      <button
        onClick={() => setShowSection(!showSection)}
        className="w-full flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-700/50 p-3 rounded-2xl transition-all"
      >
        <div className="flex items-center space-x-3">
          <Globe className="w-5 h-5 text-primary" />
          <div className="text-left">
            <p className="text-sm font-bold text-gray-900 uppercase tracking-tighter">{t('settings.languageTranslation')}</p>
            <p className="text-[8px] sm:text-[10px] text-gray-400">{t('settings.languageDesc')}</p>
          </div>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-primary transition-transform duration-300 ${showSection ? 'rotate-180' : ''}`}
        />
      </button>

      {showSection && (
        <div className="space-y-6 pt-4 border-t dark:border-slate-700">
          {/* Sélecteur de Pays */}
          <div className="space-y-3">
            <label className="text-[8px] sm:text-[10px] font-bold text-gray-400 uppercase">{t('settings.country')}</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {SUPPORTED_COUNTRIES.map((c) => (
                <button
                  key={c.code}
                  onClick={() => {
                    setCountry(c.code);
                    if (!c.languages.includes(language)) {
                      setLanguage(c.languages[0] as any);
                    }
                  }}
                  className={`p-3 rounded-2xl border-2 transition-all flex flex-col items-center space-y-1 text-center min-w-0 ${country === c.code
                    ? 'border-primary bg-primary/5 dark:bg-primary/20 shadow-soft shadow-primary/20'
                    : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-primary/50'
                    }`}
                >
                  <span className="text-xl">{c.flag}</span>
                  <p className="text-[8px] font-bold text-gray-900 dark:text-gray-100 leading-tight truncate w-full">{c.name}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Sélecteur de Langue */}
          <div className="space-y-3 pt-4 border-t dark:border-slate-700">
            <label className="text-[8px] sm:text-[10px] font-bold text-gray-400 uppercase">Langue</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {SUPPORTED_LANGUAGES.filter((lang) => {
                const countryConfig = SUPPORTED_COUNTRIES.find(c => c.code === country);
                return countryConfig?.languages.includes(lang.code);
              }).map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => setLanguage(lang.code as any)}
                  className={`p-4 rounded-3xl border-2 transition-all flex flex-col items-center space-y-2 min-w-0 ${language === lang.code
                    ? 'border-primary bg-primary/5 dark:bg-primary/20 shadow-soft shadow-primary/20'
                    : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-primary/50'
                    }`}
                >
                  <span className="text-2xl">{lang.flag}</span>
                  <p className="text-xs font-black text-gray-900 dark:text-gray-100 uppercase truncate w-full tracking-tighter">{lang.name}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LanguageSettings;
