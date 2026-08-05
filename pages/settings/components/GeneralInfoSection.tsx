import React, { useState, useEffect } from 'react';
import { Building, BadgeDollarSign, Phone, Mail, MapPin, Settings2, ChevronDown, Lock, Briefcase } from 'lucide-react';
import { StoreSettings } from '../../../types';
import { useLanguage } from '../../../utils/languageContext';
import PhoneInput from '../../../components/PhoneInput';
import { getDialCodeForAppCountry } from '../../../utils/phoneValidation';

interface GeneralInfoSectionProps {
  settings: StoreSettings;
  onChange: (settings: StoreSettings) => void;
}

const GeneralInfoSection: React.FC<GeneralInfoSectionProps> = ({ settings, onChange }) => {
  const { t, country } = useLanguage();
  const [showSection, setShowSection] = useState(true);
  const [phoneDialCode, setPhoneDialCode] = useState(getDialCodeForAppCountry(settings.country || country));

  useEffect(() => {
    setPhoneDialCode(getDialCodeForAppCountry(settings.country || country));
  }, [settings.country, country]);

  return (
    <div className="bg-white p-4 sm:p-6 lg:p-8 rounded-3xl border border-gray-100 shadow-soft space-y-6 lg:space-y-8">
      <button
        type="button"
        onClick={() => setShowSection(!showSection)}
        className="w-full flex items-center justify-between hover:bg-gray-50 p-2 rounded-xl transition-all"
      >
        <div className="flex items-center space-x-3">
          <Building className="w-5 h-5 text-primary" />
          <div className="text-left">
            <p className="text-sm font-bold text-gray-900 uppercase tracking-tighter">{t('settings.generalInfo')}</p>
            <p className="text-[8px] sm:text-[10px] text-gray-400 font-bold uppercase">{t('settings.generalInfoDesc')}</p>
          </div>
        </div>
        <ChevronDown className={`w-5 h-5 text-primary transition-transform duration-300 ${showSection ? 'rotate-180' : ''}`} />
      </button>

      {showSection && (
        <div className="space-y-6 animate-in fade-in slide-in-from-top-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
            <div className="space-y-1">
              <label className="text-[8px] sm:text-[10px] font-bold text-gray-400 uppercase flex items-center">
                <Building className="w-3 h-3 mr-1" /> {t('settings.storeName')}
              </label>
              <input 
                required 
                className="w-full px-4 py-3 bg-gray-50 border rounded-2xl outline-none focus:ring-2 focus:ring-primary transition-all text-sm" 
                value={settings.name || ''} 
                onChange={e => onChange({ ...settings, name: e.target.value })} 
              />
            </div>
            <div className="space-y-1">
              <label className="text-[8px] sm:text-[10px] font-bold text-gray-400 uppercase flex items-center">
                <BadgeDollarSign className="w-3 h-3 mr-1" /> {t('settings.currency')}
              </label>
              <select 
                required 
                className="w-full px-3 py-3 bg-gray-50 border rounded-2xl outline-none focus:ring-2 focus:ring-primary transition-all text-sm" 
                value={settings.currency || ''} 
                onChange={e => onChange({ ...settings, currency: e.target.value })}
              >
                <option value="">{t('form.select')}</option>
                <option value="XAF">FCFA</option>
                <option value="EUR">Euro €</option>
                <option value="USD">Dollar $</option>
                <option value="GBP">Livre £</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[8px] sm:text-[10px] font-bold text-gray-400 uppercase flex items-center">
                <Building className="w-3 h-3 mr-1" /> {t('settings.businessTypeLabel')}
              </label>
              <select
                className="w-full px-3 py-3 bg-gray-50 border rounded-2xl outline-none focus:ring-2 focus:ring-primary transition-all text-sm"
                value={settings.businessType || ''}
                onChange={e => onChange({ ...settings, businessType: e.target.value })}
              >
                <option value="">{t('settings.activityType')}</option>
                <option value="Dépôt de Boisson">{t('settings.activityDepot')}</option>
                <option value="Restaurant">{t('settings.activityRestaurant')}</option>
                <option value="Boutique">{t('settings.activityShop')}</option>
                <option value="Bar">{t('settings.activityBar')}</option>
                <option value="Autre">{t('settings.activityOther')}</option>
              </select>
            </div>
            <div className="space-y-1 sm:col-span-2">
              <label className="text-[8px] sm:text-[10px] font-bold text-gray-400 uppercase flex items-center">
                <Phone className="w-3 h-3 mr-1" /> {t('settings.publicPhone')}
              </label>
              <PhoneInput
                value={settings.publicPhone ?? settings.phone ?? ''}
                dialCode={phoneDialCode}
                onChange={(v) => onChange({ ...settings, publicPhone: v, phone: v })}
                onDialCodeChange={setPhoneDialCode}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[8px] sm:text-[10px] font-bold text-gray-400 uppercase flex items-center">
                <Mail className="w-3 h-3 mr-1" /> {t('settings.publicEmail')}
              </label>
              <input 
                className="w-full px-3 py-3 bg-gray-50 border rounded-2xl outline-none focus:ring-2 focus:ring-primary transition-all text-sm" 
                value={settings.publicEmail ?? settings.email ?? ''} 
                onChange={e => onChange({ ...settings, publicEmail: e.target.value, email: e.target.value })} 
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[8px] sm:text-[10px] font-bold text-gray-400 uppercase flex items-center">
              <MapPin className="w-3 h-3 mr-1" /> {t('settings.address')}
            </label>
            <input 
              className="w-full px-3 py-3 bg-gray-50 border rounded-2xl outline-none focus:ring-2 focus:ring-primary transition-all text-sm" 
              value={settings.address || ''} 
              onChange={e => onChange({ ...settings, address: e.target.value })} 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[8px] sm:text-[10px] font-bold text-gray-400 uppercase flex items-center">
                <Building className="w-3 h-3 mr-1" /> {t('settings.enterpriseTypeLabel')}
              </label>
              <div className="relative">
                <input
                  className="w-full px-3 py-3 bg-gray-100 border border-transparent rounded-2xl outline-none text-sm text-gray-500 cursor-not-allowed"
                  value={settings.enterpriseType ? t(`enterprise.${settings.enterpriseType}`) : t('settings.notDefined')}
                  readOnly
                />
                <Lock className="absolute right-3 top-3.5 w-4 h-4 text-gray-400" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[8px] sm:text-[10px] font-bold text-gray-400 uppercase flex items-center">
                <Briefcase className="w-3 h-3 mr-1" /> {t('settings.activityTypeLabel')}
              </label>
              <div className="relative">
                <input
                  className="w-full px-3 py-3 bg-gray-100 border border-transparent rounded-2xl outline-none text-sm text-gray-500 cursor-not-allowed"
                  value={settings.businessType || t('settings.notDefined')}
                  readOnly
                />
                <Lock className="absolute right-3 top-3.5 w-4 h-4 text-gray-400" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GeneralInfoSection;
