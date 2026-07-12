import React, { useState } from 'react';
import { LayoutGrid, ChevronDown } from 'lucide-react';
import { getNavigationItems } from '../constants';
import { StoreSettings } from '../types';
import { useLanguage } from '../utils/languageContext';
import {
  CORE_MODULE_IDS,
  type AppModuleId,
  isModuleDisabled,
} from '../utils/modules';
import ConfirmActionModal from './ConfirmActionModal';
import { useConfirmAction } from '../hooks/useConfirmAction';

interface SettingsModuleManagerProps {
  settings: StoreSettings;
  onChange: (settings: StoreSettings) => void;
}

const SettingsModuleManager: React.FC<SettingsModuleManagerProps> = ({ settings, onChange }) => {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const { pending, neverAsk, setNeverAsk, requestConfirm, cancel, confirm } = useConfirmAction();

  const navItems = getNavigationItems(t);
  const disabled = settings.disabledModules ?? [];

  const toggleModule = (moduleId: AppModuleId, enable: boolean) => {
    if (CORE_MODULE_IDS.includes(moduleId)) return;

    if (!enable) {
      requestConfirm({
        actionId: 'disableModule',
        title: t('modules.disableTitle'),
        message: t('modules.disableMessage', { name: t(`modules.${moduleId}`) }),
        level: 2,
        run: () => {
          const next = [...(settings.disabledModules ?? []), moduleId];
          onChange({ ...settings, disabledModules: next });
        },
      });
      return;
    }

    onChange({
      ...settings,
      disabledModules: disabled.filter((id) => id !== moduleId),
    });
  };

  return (
    <>
      <div className="pt-6 border-t">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="w-full flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-800 p-3 rounded-lg transition-all"
        >
          <div className="flex items-center space-x-3">
            <LayoutGrid className="w-5 h-5 text-indigo-600" />
            <div className="text-left">
              <p className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-tighter">
                {t('modules.title')}
              </p>
              <p className="text-[8px] sm:text-[10px] text-gray-400 font-bold uppercase">
                {t('modules.subtitle')}
              </p>
            </div>
          </div>
          <ChevronDown className={`w-5 h-5 text-indigo-600 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>

        {open && (
          <div className="mt-4 space-y-2 animate-in fade-in">
            {navItems.map((item) => {
              const id = item.id!;
              const isCore = CORE_MODULE_IDS.includes(id);
              const active = !isModuleDisabled(id, disabled);
              return (
                <div
                  key={id}
                  className="flex items-center justify-between p-3 rounded-xl border border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800/50"
                >
                  <div>
                    <p className="text-sm font-bold text-gray-800 dark:text-gray-100">{item.label}</p>
                    {isCore && (
                      <p className="text-[9px] text-gray-400 uppercase font-bold">{t('modules.alwaysOn')}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    disabled={isCore}
                    onClick={() => toggleModule(id, !active)}
                    className={`w-12 h-7 rounded-full relative transition-colors ${
                      active ? 'bg-green-500' : 'bg-gray-300'
                    } ${isCore ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div
                      className={`absolute top-1 bg-white w-5 h-5 rounded-full shadow transition-all ${
                        active ? 'left-6' : 'left-1'
                      }`}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ConfirmActionModal
        open={!!pending}
        actionId={pending?.actionId ?? 'disableModule'}
        title={pending?.title}
        message={pending?.message ?? ''}
        level={pending?.level}
        neverAsk={neverAsk}
        onNeverAskChange={setNeverAsk}
        onCancel={cancel}
        onConfirm={confirm}
      />
    </>
  );
};

export default SettingsModuleManager;
