import React, { useRef, useState } from 'react';
import { Image, ChevronDown, X } from 'lucide-react';
import { StoreSettings } from '../../../types';
import { useLanguage } from '../../../utils/languageContext';
import { requestMediaPermission } from '../../../utils/permissionManager';

interface LogoSectionProps {
  settings: StoreSettings;
  onChange: (settings: StoreSettings) => void;
}

const LogoSection: React.FC<LogoSectionProps> = ({ settings, onChange }) => {
  const { t } = useLanguage();
  const [showSection, setShowSection] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const buildingInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (
    event: React.ChangeEvent<HTMLInputElement>,
    fieldKey: 'logo' | 'buildingImage',
    fileNameKey?: 'logoFileName'
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert(t('settings.selectValidImage'));
      return;
    }

    const MAX_SIZE = 20 * 1024 * 1024; // Augmenté de 8MB à 20MB
    if (file.size > MAX_SIZE) {
      alert(t('settings.logoSizeError', { size: (file.size / 1024 / 1024).toFixed(2) }));
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result as string;
      const updates: any = { [fieldKey]: base64 };
      if (fileNameKey) updates[fileNameKey] = file.name;
      
      onChange({
        ...settings,
        ...updates
      });
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const handleRemoveLogo = () => {
    onChange({
      ...settings,
      logo: undefined,
      logoFileName: undefined
    });
  };

  return (
    <div className="pt-6 border-t">
      <button
        type="button"
        onClick={() => setShowSection(!showSection)}
        className="w-full flex items-center justify-between hover:bg-gray-50 p-3 rounded-lg transition-all"
      >
        <div className="flex items-center space-x-3">
          <Image className="w-5 h-5 text-amber-600" />
          <div className="text-left">
            <p className="text-sm font-bold text-gray-900 uppercase tracking-tighter">{t('settings.logoLabel')}</p>
            <p className="text-[8px] sm:text-[10px] text-gray-400 font-bold uppercase">{t('settings.logoDesc')}</p>
          </div>
        </div>
        <ChevronDown className={`w-5 h-5 text-amber-600 transition-transform duration-300 ${showSection ? 'rotate-180' : ''}`} />
      </button>

      {showSection && (
        <div className="pt-6 space-y-6 animate-in fade-in slide-in-from-top-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Logo Entreprise */}
            <div className="space-y-3">
              <h3 className="font-bold text-gray-700 text-sm">Logo Principal</h3>
              {settings.logo ? (
                <div className="relative bg-gray-50 border-2 border-dashed border-amber-300 rounded-3xl p-6 flex flex-col items-center justify-center space-y-3">
                  <div className="w-32 h-32 rounded-full overflow-hidden ring-4 ring-white shadow-xl mx-auto flex items-center justify-center bg-white">
                    <img src={settings.logo} alt="Logo" className="max-w-full max-h-full object-contain" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-gray-900">{t('settings.currentLogo')}</p>
                    <p className="text-xs text-gray-500">{settings.logoFileName}</p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 w-full">
                    <button
                      type="button"
                      onClick={() => logoInputRef.current?.click()}
                      className="flex-1 px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg transition-all text-sm"
                    >
                      {t('settings.changeLogo')}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveLogo()}
                      className="flex-1 px-3 py-2 bg-red-100 hover:bg-red-200 text-red-600 font-bold rounded-lg transition-all text-sm flex items-center justify-center space-x-1"
                    >
                      <X className="w-4 h-4" />
                      <span>{t('settings.removeLogo')}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => logoInputRef.current?.click()}
                  className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-2xl p-8 flex flex-col items-center justify-center space-y-3 cursor-pointer hover:border-amber-400 hover:bg-amber-50/50 transition-colors h-full min-h-[200px]"
                >
                  <Image className="w-12 h-12 text-gray-300" />
                  <div className="text-center">
                    <p className="text-sm font-bold text-gray-600">{t('settings.noLogoTitle')}</p>
                    <p className="text-xs text-gray-500">{t('settings.noLogoDesc')}</p>
                  </div>
                </div>
              )}
              <input
                type="file"
                ref={logoInputRef}
                onChange={(e) => handleImageUpload(e, 'logo', 'logoFileName')}
                accept="image/*"
                className="hidden"
              />
            </div>

            {/* Photo du Bâtiment */}
            <div className="space-y-3">
              <h3 className="font-bold text-gray-700 text-sm">Photo du Bâtiment / Dépôt</h3>
              {settings.buildingImage ? (
                <div className="relative bg-gray-50 border-2 border-dashed border-blue-300 rounded-3xl p-6 flex flex-col items-center justify-center space-y-3">
                  <div className="w-full h-32 rounded-xl overflow-hidden ring-4 ring-white shadow-xl mx-auto bg-white flex items-center justify-center">
                    <img src={settings.buildingImage} alt="Building" className="w-full h-full object-cover" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-gray-900">Photo actuelle</p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 w-full">
                    <button
                      type="button"
                      onClick={() => buildingInputRef.current?.click()}
                      className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-all text-sm"
                    >
                      Changer
                    </button>
                    <button
                      type="button"
                      onClick={() => onChange({ ...settings, buildingImage: undefined })}
                      className="flex-1 px-3 py-2 bg-red-100 hover:bg-red-200 text-red-600 font-bold rounded-lg transition-all text-sm flex items-center justify-center space-x-1"
                    >
                      <X className="w-4 h-4" />
                      <span>Retirer</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => buildingInputRef.current?.click()}
                  className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-2xl p-8 flex flex-col items-center justify-center space-y-3 cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-colors h-full min-h-[200px]"
                >
                  <Image className="w-12 h-12 text-gray-300" />
                  <div className="text-center">
                    <p className="text-sm font-bold text-gray-600">Ajouter une photo</p>
                    <p className="text-xs text-gray-500">Affichée sur le tableau de bord</p>
                  </div>
                </div>
              )}
              <input
                type="file"
                ref={buildingInputRef}
                onChange={(e) => handleImageUpload(e, 'buildingImage')}
                accept="image/*"
                className="hidden"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LogoSection;
