import React, { useState } from 'react';
import { FileText, ChevronDown, Check } from 'lucide-react';
import { StoreSettings } from '../../../types';
import { useLanguage } from '../../../utils/languageContext';

interface ReceiptSettingsProps {
  settings: StoreSettings;
  onChange: (settings: StoreSettings) => void;
}

const ReceiptSettings: React.FC<ReceiptSettingsProps> = ({ settings, onChange }) => {
  const { t } = useLanguage();
  const [showSection, setShowSection] = useState(false);
  const currentTemplate = settings.receiptTemplate || 'pro_color';

  const templates = [
    {
      id: 'pro_color',
      name: 'Reçu Professionnel Couleur',
      desc: 'Mise en page moderne, branding couleur premium RDS.',
      preview: '🔵'
    },
    {
      id: 'pro_bw',
      name: 'Reçu Professionnel Noir & Blanc',
      desc: 'Optimisé pour imprimantes laser standards, économique.',
      preview: '⚪'
    },
    {
      id: 'thermal_pro',
      name: 'Reçu Thermique Professionnel',
      desc: 'Format compact (58mm/80mm) pour imprimantes de caisse.',
      preview: '📟'
    }
  ];

  return (
    <div className="pt-6 border-t space-y-6">
      <button
        type="button"
        onClick={() => setShowSection(!showSection)}
        className="w-full flex items-center justify-between hover:bg-gray-50 p-3 rounded-2xl transition-all"
      >
        <div className="flex items-center space-x-3">
          <FileText className="w-5 h-5 text-emerald-600" />
          <div className="text-left">
            <p className="text-sm font-bold text-gray-900 uppercase tracking-tighter">Format des Reçus / Tickets</p>
            <p className="text-[8px] sm:text-[10px] text-gray-400 font-bold uppercase">Choix du type de reçu à imprimer</p>
          </div>
        </div>
        <ChevronDown className={`w-5 h-5 text-emerald-600 transition-transform duration-300 ${showSection ? 'rotate-180' : ''}`} />
      </button>

      {showSection && (
        <div className="space-y-4 pt-4 border-t dark:border-slate-700 animate-in fade-in slide-in-from-top-2">
          <p className="text-xs text-gray-500 leading-relaxed mb-2">
            Choisissez le format de ticket qui correspond le mieux à votre équipement d'impression.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {templates.map((tpl) => (
              <div
                key={tpl.id}
                onClick={() => onChange({ ...settings, receiptTemplate: tpl.id as any })}
                className={`p-5 rounded-3xl border-2 cursor-pointer transition-all flex flex-col justify-between h-40 ${
                  currentTemplate === tpl.id
                    ? 'border-emerald-600 bg-emerald-50/20 shadow-soft'
                    : 'border-gray-250 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-emerald-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">{tpl.preview}</span>
                    {currentTemplate === tpl.id && (
                      <span className="p-1 rounded-full bg-emerald-600 text-white">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-black text-gray-900 dark:text-gray-100 leading-snug">{tpl.name}</h4>
                  <p className="text-[10px] text-gray-500 mt-1 leading-normal">{tpl.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReceiptSettings;
