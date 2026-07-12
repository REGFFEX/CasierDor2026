import React, { useState, useEffect } from 'react';
import { useLanguage } from '../utils/languageContext';
import { Monitor, Smartphone, Tablet, Globe, Wifi, WifiOff, RefreshCw } from 'lucide-react';

type DeviceType = 'desktop' | 'mobile' | 'tablet' | 'auto';
type OperationMode = 'online' | 'offline' | 'hybrid';

interface SystemConfigProps {
  onConfigChange?: (config: {
    deviceType: DeviceType;
    operationMode: OperationMode;
  }) => void;
}

export const SystemConfig: React.FC<SystemConfigProps> = ({ onConfigChange }) => {
  const { t, language } = useLanguage();
  const [deviceType, setDeviceType] = useState<DeviceType>('auto');
  const [operationMode, setOperationMode] = useState<OperationMode>('hybrid');

  // Détecter automatiquement le type d'appareil
  useEffect(() => {
    const detectDevice = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
      const isTablet = /ipad|android(?!.*mobile)/i.test(userAgent);

      if (isTablet) return 'tablet';
      if (isMobile) return 'mobile';
      return 'desktop';
    };

    if (deviceType === 'auto') {
      const detected = detectDevice();
      // Ne pas changer l'état si l'utilisateur a choisi manuellement
      if (deviceType === 'auto') {
        // On garde 'auto' mais on notifie le parent du device détecté
        onConfigChange?.({ deviceType: detected, operationMode });
      }
    }
  }, [deviceType, operationMode, onConfigChange]);

  // Configurer la langue par défaut selon le pays/navigateur
  useEffect(() => {
    const browserLang = navigator.language || (navigator as any).userLanguage;
    const countryCode = browserLang.split('-')[1]?.toLowerCase() || browserLang.split('_')[1]?.toLowerCase();

    // Logique de détection de la langue par pays
    const countryLanguageMap: Record<string, string> = {
      'fr': 'fr',
      'us': 'en-us',
      'gb': 'en-uk',
      'uk': 'en-uk',
      'es': 'es',
      'de': 'de',
      'it': 'it',
      'pt': 'pt',
      'br': 'pt-br',
      'cn': 'zh-cn',
      'tw': 'zh-tw',
      'jp': 'ja',
      'kr': 'ko',
      'ru': 'ru',
      'sa': 'ar',
      'cg': 'fr',
      'cd': 'fr'
    };

    // La langue est déjà gérée par le LanguageContext, pas besoin de la changer ici
  }, [language]);

  const handleDeviceTypeChange = (type: DeviceType) => {
    setDeviceType(type);
    onConfigChange?.({ deviceType: type, operationMode });
  };

  const handleOperationModeChange = (mode: OperationMode) => {
    setOperationMode(mode);
    onConfigChange?.({ deviceType, operationMode: mode });
  };

  const getDeviceIcon = (type: DeviceType) => {
    switch (type) {
      case 'desktop': return <Monitor className="w-5 h-5" />;
      case 'mobile': return <Smartphone className="w-5 h-5" />;
      case 'tablet': return <Tablet className="w-5 h-5" />;
      case 'auto': return <Globe className="w-5 h-5" />;
      default: return <Monitor className="w-5 h-5" />;
    }
  };

  const getModeIcon = (mode: OperationMode) => {
    switch (mode) {
      case 'online': return <Wifi className="w-5 h-5" />;
      case 'offline': return <WifiOff className="w-5 h-5" />;
      case 'hybrid': return <RefreshCw className="w-5 h-5" />;
      default: return <RefreshCw className="w-5 h-5" />;
    }
  };

  const getDeviceLabel = (type: DeviceType) => {
    switch (type) {
      case 'desktop': return t('device.desktop');
      case 'mobile': return t('device.mobile');
      case 'tablet': return t('device.tablet');
      case 'auto': return t('device.auto');
      default: return type;
    }
  };

  const getModeLabel = (mode: OperationMode) => {
    switch (mode) {
      case 'online': return t('mode.online');
      case 'offline': return t('mode.offline');
      case 'hybrid': return t('mode.hybrid');
      default: return mode;
    }
  };

  const getModeDescription = (mode: OperationMode) => {
    switch (mode) {
      case 'online': return t('mode.online.desc');
      case 'offline': return t('mode.offline.desc');
      case 'hybrid': return t('mode.hybrid.desc');
      default: return '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Configuration du dispositif */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <h3 className="font-bold text-gray-900 mb-4 flex items-center">
          <Monitor className="w-5 h-5 mr-2 text-blue-600" />
          {t('device.title')}
        </h3>
        <p className="text-sm text-gray-600 mb-4">{t('device.description')}</p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(['auto', 'desktop', 'mobile', 'tablet'] as DeviceType[]).map((type) => (
            <button
              key={type}
              onClick={() => handleDeviceTypeChange(type)}
              className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center space-y-2 ${deviceType === type
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 hover:border-gray-300 text-gray-600'
                }`}
            >
              {getDeviceIcon(type)}
              <span className="text-[10px] font-bold uppercase text-center whitespace-normal break-words w-full px-1 mt-1 leading-tight">{getDeviceLabel(type)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Configuration du mode de fonctionnement */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <h3 className="font-bold text-gray-900 mb-4 flex items-center">
          <RefreshCw className="w-5 h-5 mr-2 text-green-600" />
          {t('mode.title')}
        </h3>
        <p className="text-sm text-gray-600 mb-4">{t('mode.description')}</p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {(['online', 'offline', 'hybrid'] as OperationMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => handleOperationModeChange(mode)}
              className={`p-4 rounded-lg border-2 transition-all ${operationMode === mode
                ? 'border-green-500 bg-green-50 text-green-700'
                : 'border-gray-200 hover:border-gray-300 text-gray-600'
                }`}
            >
              <div className="flex items-center space-x-3 mb-2">
                {getModeIcon(mode)}
                <span className="font-bold text-gray-900 dark:text-gray-100 whitespace-normal break-words text-left flex-1">{getModeLabel(mode)}</span>
              </div>
              <p className="text-[10px] text-left leading-tight whitespace-normal break-words text-gray-500 dark:text-gray-400">{getModeDescription(mode)}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Configuration de la langue (affichage uniquement) */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <h3 className="font-bold text-gray-900 mb-4 flex items-center">
          <Globe className="w-5 h-5 mr-2 text-purple-600" />
          {t('settings.language')}
        </h3>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 overflow-hidden">
          <div className="px-3 py-2 bg-purple-50 text-purple-700 rounded-lg text-sm font-bold whitespace-nowrap overflow-hidden text-ellipsis max-w-full">
            {t('settings.currentLanguage')}: {language.toUpperCase()}
          </div>
          <span className="text-[10px] text-gray-500 font-medium italic break-words whitespace-normal leading-tight">
            ({t('settings.syncWithSystem')})
          </span>
        </div>
      </div>
    </div>
  );
};

export default SystemConfig;
