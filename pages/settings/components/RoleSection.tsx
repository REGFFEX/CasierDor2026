import React, { useState } from 'react';
import { UserCog, ChevronDown, Shield, Users } from 'lucide-react';
import { StoreSettings, UserRole } from '../../../types';
import { useLanguage } from '../../../utils/languageContext';

interface RoleSectionProps {
  settings: StoreSettings;
  onChange: (settings: StoreSettings) => void;
}

const RoleSection: React.FC<RoleSectionProps> = ({ settings, onChange }) => {
  const { t } = useLanguage();
  const [showSection, setShowSection] = useState(false);

  return (
    <div className="pt-6 border-t space-y-6">
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => setShowSection(!showSection)}
          className="w-full flex items-center justify-between hover:bg-gray-50 p-3 rounded-2xl transition-all"
        >
          <div className="flex items-center space-x-3">
            <UserCog className="w-5 h-5 text-primary" />
            <div className="text-left">
              <p className="text-sm font-bold text-gray-900 uppercase tracking-tighter">{t('settings.rolePermissions')}</p>
              <p className="text-[8px] sm:text-[10px] text-gray-400 font-bold uppercase">{t('settings.accessConfiguration')}</p>
            </div>
          </div>
          <ChevronDown className={`w-5 h-5 text-primary transition-transform duration-300 ${showSection ? 'rotate-180' : ''}`} />
        </button>

        {showSection && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
            {/* Admin Role Card */}
            <div
              onClick={() => onChange({ ...settings, userRole: UserRole.ADMIN })}
              className={`p-6 rounded-3xl border-2 cursor-pointer transition-all ${settings.userRole === UserRole.ADMIN
                ? 'border-primary bg-primary/5 dark:bg-primary/20 shadow-soft shadow-primary/20'
                : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-primary/50'
                } `}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${settings.userRole === UserRole.ADMIN
                    ? 'bg-primary/20 text-primary'
                    : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300'
                    } `}>
                    <Shield className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-gray-900 dark:text-gray-100 uppercase">{t('user.admin')}</p>
                    <p className="text-[8px] sm:text-[10px] text-gray-500 dark:text-gray-400">{t('settings.adminDesc')}</p>
                  </div>
                </div>
                {settings.userRole === UserRole.ADMIN && (
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                    <span className="text-white text-sm font-bold">✓</span>
                  </div>
                )}
              </div>

              <div className="space-y-3 pt-4 border-t dark:border-slate-700">
                <div className="space-y-1">
                  <label className="text-[8px] sm:text-[10px] font-bold text-gray-400 uppercase">{t('settings.responsibleName')}</label>
                  <input
                    type="text"
                    placeholder={t('settings.adminRolePlaceholder')}
                    value={settings.responsibleDisplayName ?? settings.adminName ?? ''}
                    onChange={(e) => onChange({ ...settings, responsibleDisplayName: e.target.value, adminName: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-700 border dark:border-slate-600 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <ul className="text-[8px] sm:text-[10px] space-y-1 text-gray-600 dark:text-gray-300">
                  <li>{t('settings.permDataExport')}</li>
                  <li>{t('settings.permDataDeletion')}</li>
                  <li>{t('settings.permSystemConfig')}</li>
                  <li>{t('settings.permManagePermissions')}</li>
                </ul>
              </div>
            </div>

            {/* Staff Role Card */}
            <div
              onClick={() => onChange({ ...settings, userRole: UserRole.STAFF })}
              className={`p-6 rounded-3xl border-2 cursor-pointer transition-all ${settings.userRole === UserRole.STAFF
                ? 'border-primary bg-primary/5 dark:bg-primary/20 shadow-soft shadow-primary/20'
                : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-primary/50'
                } `}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${settings.userRole === UserRole.STAFF
                    ? 'bg-primary/20 text-primary'
                    : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300'
                    } `}>
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-gray-900 dark:text-gray-100 uppercase">{t('user.staff')}</p>
                    <p className="text-[8px] sm:text-[10px] text-gray-500 dark:text-gray-400">{t('settings.staffDesc')}</p>
                  </div>
                </div>
                {settings.userRole === UserRole.STAFF && (
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                    <span className="text-white text-sm font-bold">✓</span>
                  </div>
                )}
              </div>

              <div className="space-y-3 pt-4 border-t dark:border-slate-700">
                <div className="space-y-1">
                  <label className="text-[8px] sm:text-[10px] font-bold text-gray-400 uppercase">{t('settings.accessName')}</label>
                  <input
                    type="text"
                    placeholder={t('settings.staffRolePlaceholder')}
                    value={settings.staffName || ''}
                    onChange={(e) => onChange({ ...settings, staffName: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-700 border dark:border-slate-600 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <ul className="text-[8px] sm:text-[10px] space-y-1 text-gray-600 dark:text-gray-300">
                  <li>{t('settings.permViewSales')}</li>
                  <li>{t('settings.permViewStock')}</li>
                  <li>{t('settings.permNoModification')}</li>
                  <li>{t('settings.permNoExport')}</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoleSection;
