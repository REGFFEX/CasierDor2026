import React, { useState } from 'react';
import { Database, ChevronDown, Trash2, Clock } from 'lucide-react';
import { StoreSettings } from '../../../types';
import { useLanguage } from '../../../utils/languageContext';

interface AuditSettingsProps {
  settings: StoreSettings;
  onChange: (settings: StoreSettings) => void;
}

const AuditSettings: React.FC<AuditSettingsProps> = ({ settings, onChange }) => {
  const { t } = useLanguage();
  const [showSection, setShowSection] = useState(false);

  return (
    <div className="pt-6 border-t space-y-6">
      <button
        type="button"
        onClick={() => setShowSection(!showSection)}
        className="w-full flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-700/50 p-3 rounded-2xl transition-all"
      >
        <div className="flex items-center space-x-3">
          <Database className="w-5 h-5 text-indigo-600" />
          <div className="text-left">
            <p className="text-sm font-bold text-gray-900 uppercase tracking-tighter">Audit & Corbeille</p>
            <p className="text-[8px] sm:text-[10px] text-gray-400">{t('settings.auditDescription')}</p>
          </div>
        </div>
        <ChevronDown className={`w-5 h-5 text-indigo-600 transition-transform duration-300 ${showSection ? 'rotate-180' : ''}`} />
      </button>

      {showSection && (
        <div className="space-y-6 pt-4 border-t dark:border-slate-700 animate-in fade-in slide-in-from-top-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1.5">
                <Trash2 className="w-3.5 h-3.5" /> Rétention Corbeille (Jours)
              </label>
              <input
                type="number"
                min="1"
                max="365"
                value={settings.trashRetentionDays ?? 30}
                onChange={e => onChange({ ...settings, trashRetentionDays: parseInt(e.target.value) || 30 })}
                className="w-full px-4 py-3 bg-gray-50 border rounded-2xl outline-none focus:ring-2 focus:ring-primary text-sm"
              />
              <p className="text-[9px] text-gray-400 italic">Nombre de jours avant suppression définitive automatique.</p>
            </div>
            <div className="space-y-2 flex flex-col justify-center">
              <label className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Log d'Activités
              </label>
              <div className="flex items-center gap-3 py-2">
                <button
                  type="button"
                  onClick={() => onChange({ ...settings, enableActivityLogging: !settings.enableActivityLogging })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.enableActivityLogging ? 'bg-primary' : 'bg-gray-200'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.enableActivityLogging ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
                <span className="text-xs font-bold text-gray-700">
                  {settings.enableActivityLogging ? 'Activé' : 'Désactivé'}
                </span>
              </div>
              <p className="text-[9px] text-gray-400 italic">Enregistre les créations, modifications et suppressions.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditSettings;
