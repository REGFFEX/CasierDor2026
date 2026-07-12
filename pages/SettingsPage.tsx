import React, { useState, useRef, useEffect } from 'react';
import { Save, Languages, Palette, Settings2, Shield, Bell, Clock, Layout, Trash2, Smartphone, Monitor as MonitorIcon, Laptop, RefreshCw, ChevronDown, Plus, Download, Upload, Eye, EyeOff, Key, Lock, CheckCircle2, XCircle, ShieldAlert, LogOut, Info, AlertTriangle, ShieldCheck, Mail, Phone, MapPin, ExternalLink, Globe, ShieldOff, FolderDown, HardDrive, Wrench, Building, BadgeDollarSign, Database, UserCog, UploadCloud, FileText, FileJson, Loader2, DollarSign, Users, Image, X, Search, AlertCircle, Copy, Briefcase } from 'lucide-react';
import { getStoreData, setStoreData, STORAGE_KEYS, DEFAULT_SETTINGS, clearAllData } from '../store';
import { StoreSettings, UserRole, EnterpriseType, ActivityType } from '../types';
import { downloadFile, requestFilePermissions, safeBackupData, restoreDataFromFile, initDirectoryStructure, checkDirectoryStatus, SYSTEM_DIRS } from '../utils/fileManager';
import { requestMediaPermission } from '../utils/permissionManager';
import { SUPPORTED_CURRENCIES, DEFAULT_CURRENCY } from '../constants';
import { getExchangeRates } from '../utils/currencyConverter';
import { useTheme } from '../utils/themeContext';
import { useLanguage } from '../utils/languageContext';
import { SUPPORTED_LANGUAGES, SUPPORTED_COUNTRIES } from '../utils/i18n';
import { FileEncryptionManager, EncryptionConfig } from '../utils/fileEncryption';
import UpdateManager, { UpdateCheckResult } from '../utils/updateManager';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/authContext';
import { performFullBackup } from '../utils/backupUtils';
import { authService } from '../utils/authService';
import SystemConfig from '../components/SystemConfig';
import PageBackButton from '../components/PageBackButton';
import SettingsCollapsibleSection from '../components/SettingsCollapsibleSection';
import { getDialCodeForAppCountry } from '../utils/phoneValidation';
import PhoneInput from '../components/PhoneInput';
import { normalizeSettingsForSave } from '../utils/companyProfile';
import SettingsModuleManager from '../components/SettingsModuleManager';
import ConfirmActionModal from '../components/ConfirmActionModal';
import { useConfirmAction } from '../hooks/useConfirmAction';
import { scopeStorageKey } from '../utils/accountStorage';
import { runFullTestDataCleanup } from '../utils/testDataCleanup';

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { t, language, setLanguage, country, setCountry } = useLanguage();
  const [settings, setSettings] = useState<StoreSettings>(getStoreData(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS));
  const [phoneDialCode, setPhoneDialCode] = useState(getDialCodeForAppCountry(settings.country || country));
  const [saved, setSaved] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showLanguageSection, setShowLanguageSection] = useState(true);
  const [showAppearanceSection, setShowAppearanceSection] = useState(true);
  const [showAdvancedSection, setShowAdvancedSection] = useState(false);
  const [showFileSecuritySection, setShowFileSecuritySection] = useState(false);
  const [showAuthSecuritySection, setShowAuthSecuritySection] = useState(false);
  const [authDisabled, setAuthDisabled] = useState(false);
  const [securityMessage, setSecurityMessage] = useState('');
  const [showUpdateSection, setShowUpdateSection] = useState(false);
  const [showSyncSection, setShowSyncSection] = useState(false);
  const [showDownloadSection, setShowDownloadSection] = useState(false);
  const [dirStatus, setDirStatus] = useState<Record<string, boolean>>({});
  const [legacyDownloadMode, setLegacyDownloadMode] = useState(() =>
    localStorage.getItem('casierdor_legacy_download') === 'true'
  );
  const { pending, neverAsk, setNeverAsk, requestConfirm, cancel, confirm } = useConfirmAction();
  const [showAuditSection, setShowAuditSection] = useState(false);
  const [showMaintenanceSection, setShowMaintenanceSection] = useState(false);
  const [showDataTransferSection, setShowDataTransferSection] = useState(false);
  const [showGeneralSection, setShowGeneralSection] = useState(true);
  const [showLogoSection, setShowLogoSection] = useState(false);
  const [showRoleSection, setShowRoleSection] = useState(false);
  const [showExchangeRateSection, setShowExchangeRateSection] = useState(false);
  const [showSystemConfigSection, setShowSystemConfigSection] = useState(false);
  const [systemConfig, setSystemConfig] = useState({
    deviceType: 'auto' as 'desktop' | 'mobile' | 'tablet' | 'auto',
    operationMode: 'hybrid' as 'online' | 'offline' | 'hybrid'
  });

  // États pour les comptes par défaut et secure auth persistence
  const [defaultAccountsDisabled, setDefaultAccountsDisabled] = useState({
    admin: false,
    user: false
  });
  const [secureAuthForced, setSecureAuthForcedState] = useState(false);

  useEffect(() => {
    setAuthDisabled(localStorage.getItem('auth_disabled') === 'true');
    setSecureAuthForcedState(localStorage.getItem('casierdor_secure_auth_forced') === 'true');

    // Charger l'état des comptes par défaut (simulé ici via localStorage pour la persistence simple de l'état UI)
    const adminDisabled = localStorage.getItem('casierdor_admin_disabled') === 'true';
    const userDisabled = localStorage.getItem('casierdor_user_disabled') === 'true';
    setDefaultAccountsDisabled({ admin: adminDisabled, user: userDisabled });
  }, []);

  const handleSecurityToggle = async () => {
    setIsProcessing(true);
    setSecurityMessage(authDisabled ? t('security.preparingAccount') : t('security.disablingSecurity'));

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (authDisabled) {
        localStorage.removeItem('auth_disabled');
        setSecurityMessage(t('security.securityActivated'));
        setAuthDisabled(false);
        // Redirection après un court délai pour voir le message
        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 2000);
      } else {
        localStorage.setItem('auth_disabled', 'true');
        setSecurityMessage(t('security.securityDisabled'));
        setAuthDisabled(true);
        // Recharger la page pour appliquer les changements
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
    } catch (error) {
      setSecurityMessage(t('security.error'));
    } finally {
      setIsProcessing(false);
      setTimeout(() => setSecurityMessage(''), 3000);
    }
  };

  // Sécurité des fichiers
  const [encryptionConfig, setEncryptionConfig] = useState<EncryptionConfig>({
    enabled: false,
    algorithm: 'AES',
    password: '',
    salt: FileEncryptionManager.generateSalt()
  });
  const [showPasswordField, setShowPasswordField] = useState(false);
  const [importPassword, setImportPassword] = useState('');
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, level: 'weak' as any, feedback: [] as string[] });

  // Mises à jour
  const [updateInfo, setUpdateInfo] = useState<UpdateCheckResult | null>(null);
  const [checkingUpdates, setCheckingUpdates] = useState(false);
  const [showUpdateNotification, setShowUpdateNotification] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const jsonImportRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bgImageInputRef = useRef<HTMLInputElement>(null);
  const { theme, toggleTheme, bgColor, bgImage, setBgColor, setBgImage } = useTheme();

  const isAdmin = settings.userRole === UserRole.ADMIN;

  // Vérifier les mises à jour au montage
  useEffect(() => {
    if (isAdmin && UpdateManager.shouldCheckForUpdates()) {
      handleCheckUpdates();
    }
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = normalizeSettingsForSave(settings);
    setStoreData(STORAGE_KEYS.SETTINGS, normalized);
    setSettings(normalized);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      // Ne plus recharger automatiquement-laisser l'utilisateur voir le message
    }, 1500);
  };

  const handleBackupData = async (forLogout: boolean = false) => {
    setIsProcessing(true);
    try {
      // Vérifier les permissions
      const hasPermission = await requestFilePermissions();
      if (!hasPermission) {
        alert(t('settings.permissionsDeniedBackup'));
        setIsProcessing(false);
        return;
      }

      // Utiliser la fonction de sauvegarde partagée
      const success = await performFullBackup(forLogout, settings);

      if (success) {
        if (forLogout) {
          alert(t('settings.backupSuccessFirstLogout'));
        } else {
          alert(t('settings.backupSuccessFull'));
        }
      } else {
        alert(t('settings.backupError'));
      }

    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      alert(t('settings.backupErrorGeneric'));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExportJson = () => {
    const allData: Record<string, unknown> = {};
    Object.values(STORAGE_KEYS).forEach((key) => {
      const raw = localStorage.getItem(scopeStorageKey(key));
      allData[key] = raw ? JSON.parse(raw) : null;
    });
    const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${t('settings.exportJson')}_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJson = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = JSON.parse(e.target?.result as string) as Record<string, unknown>;
        requestConfirm({
          actionId: 'importJson',
          message: t('confirm.importAllData'),
          level: 2,
          run: () => {
            Object.entries(content).forEach(([key, value]) => {
              if (value !== null && value !== undefined) {
                localStorage.setItem(scopeStorageKey(key), JSON.stringify(value));
              }
            });
            window.location.reload();
          },
        });
      } catch {
        alert(t('message.invalidFile'));
      }
      event.target.value = '';
    };
    reader.readAsText(file);
  };

  const handleRestoreData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      // Vérifier les permissions
      const hasPermission = await requestFilePermissions();
      if (!hasPermission) {
        alert(t('settings.permissionsDeniedRestore'));
        setIsProcessing(false);
        return;
      }

      const content = await restoreDataFromFile(file);
      if (!content) {
        alert(t('settings.invalidBackupFile'));
        setIsProcessing(false);
        return;
      }

      if (confirm(t('settings.restoreWarning'))) {
        Object.entries(content).forEach(([key, value]) => {
          if (value) {
            localStorage.setItem(key, JSON.stringify(value));
          }
        });
        alert(t('settings.restoreSuccessRestart'));
        window.location.reload();
      }
    } catch (error) {
      console.error('Erreur restauration:', error);
      alert(t('settings.restoreError'));
    } finally {
      setIsProcessing(false);
      // Réinitialiser l'input
      event.target.value = '';
    }
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Vérifier que c'est une image
    if (!file.type.startsWith('image/')) {
      alert(t('settings.selectValidImage'));
      return;
    }

    // Vérifier la taille (max 8MB)
    const MAX_SIZE = 8 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      alert(t('settings.logoSizeError', { size: (file.size / 1024 / 1024).toFixed(2) }));
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result as string;

      // Demander la permission média avant de traiter
      try {
        const permission = await requestMediaPermission();
        if (permission.status !== 'GRANTED' && permission.status !== 'UNAVAILABLE') {
          alert(t('settings.mediaPermissionDenied'));
          return;
        }
      } catch (error) {
        console.warn('Erreur vérification permission média:', error);
        // Continuer même si la permission échoue (web)
      }

      setSettings({
        ...settings,
        logo: base64,
        logoFileName: file.name
      });
    };
    reader.readAsDataURL(file);

    // Réinitialiser l'input
    event.target.value = '';
  };

  const handleRemoveLogo = () => {
    setSettings({
      ...settings,
      logo: undefined,
      logoFileName: undefined
    });
  };

  const handleActionWithConfirmation = (
    actionType: string,
    action: () => void,
    messageKey: 'confirm.resetAll' | 'confirm.restoreData' = 'confirm.restoreData'
  ) => {
    requestConfirm({
      actionId: actionType,
      message: t(messageKey),
      level: actionType === 'resetAll' ? 2 : 2,
      run: action,
    });
  };

  // Charger le statut des dossiers
  useEffect(() => {
    const loadDirStatus = async () => {
      const status = await checkDirectoryStatus();
      setDirStatus(status);
    };
    loadDirStatus();
  }, []);

  const handleRepairFolders = async () => {
    setIsProcessing(true);
    const success = await initDirectoryStructure();
    const status = await checkDirectoryStatus();
    setDirStatus(status);
    setIsProcessing(false);
    if (success) {
      alert(t('message.success'));
    }
  };

  // Handlers sécurité des fichiers
  const handleToggleEncryption = () => {
    setEncryptionConfig({
      ...encryptionConfig,
      enabled: !encryptionConfig.enabled
    });
  };

  const handlePasswordChange = (newPassword: string) => {
    setEncryptionConfig({
      ...encryptionConfig,
      password: newPassword
    });

    // Vérifier la force du mot de passe
    const strength = FileEncryptionManager.validatePasswordStrength(newPassword);
    setPasswordStrength(strength);
  };

  const handleAlgorithmChange = (algo: 'AES' | 'DES' | 'SHA256') => {
    setEncryptionConfig({
      ...encryptionConfig,
      algorithm: algo
    });
  };

  const handleTestEncryption = async () => {
    if (!encryptionConfig.password) {
      alert(t('settings.enterPassword'));
      return;
    }

    try {
      const testData = 'Test Casier d\'Or-Données sensibles';
      const encrypted = FileEncryptionManager.encryptAES(testData, encryptionConfig.password);
      const decrypted = FileEncryptionManager.decryptAES(encrypted, encryptionConfig.password);

      if (decrypted === testData) {
        alert(t('settings.encryptionSuccess'));
      } else {
        alert(t('settings.decryptionError'));
      }
    } catch (error) {
      alert(t('settings.testError', { error: error instanceof Error ? error.message : t('message.error') }));
    }
  };

  // Handlers mises à jour
  const handleCheckUpdates = async () => {
    setCheckingUpdates(true);
    try {
      const result = await UpdateManager.checkForUpdates();
      setUpdateInfo(result);
      setShowUpdateNotification(result.hasUpdate);

      if (result.hasUpdate) {
        alert(`✓ ${t('settings.versionAvailable', { version: result.latestVersion })}`);
      } else {
        alert(`✓ ${t('settings.isUpToDate')}`);
      }
    } catch (error) {
      alert(`✗ ${t('message.error')}`);
      console.error(error);
    } finally {
      setCheckingUpdates(false);
    }
  };

  const handleInstallUpdate = async () => {
    if (!updateInfo?.hasUpdate) {
      alert(t('settings.noUpdateAvailable'));
      return;
    }

    if (window.confirm(t('settings.confirmInstallVersion', { version: updateInfo.latestVersion }))) {
      try {
        const result = await UpdateManager.installUpdate();
        alert('✓ ' + result);
        // En production, on redémarrerait l'app ici
      } catch (error) {
        alert(t('settings.installationError'));
        console.error(error);
      }
    }
  };

  // Fonction pour filtrer les sections par recherche
  const isVisible = (keywords: string[]): boolean => {
    if (!searchQuery) return true;
    return keywords.some(k => k.toLowerCase().includes(searchQuery));
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div className="flex items-center space-x-4">
          <PageBackButton />
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{t('settings.title')}</h1>
            <p className="text-xs sm:text-sm text-gray-500">{t('settings.store')}</p>
          </div>
        </div>
        {isAdmin && (
          <div className="flex items-center space-x-2 px-3 py-2 bg-green-50 border border-green-100 rounded-xl text-green-700 self-start sm:self-auto">
            <ShieldCheck className="w-4 h-4" />
            <span className="text-xs font-black uppercase tracking-tighter whitespace-nowrap">{t('settings.sessionAdmin')}</span>
          </div>
        )}
      </div>

      {/* Barre de recherche */}
      <div className="relative mb-6">
        <div className="flex items-center bg-white border border-gray-200 rounded-2xl px-4 py-3 focus-within:ring-2 focus-within:ring-blue-500">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder={t('action.search') + ' ' + t('settings.title').toLowerCase() + '...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value.toLowerCase())}
            className="flex-1 ml-3 outline-none bg-transparent text-sm placeholder-gray-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
        <div className="xl:col-span-2">
          <form onSubmit={handleSave} className="bg-white p-4 sm:p-6 lg:p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6 lg:space-y-8">
            <button
              type="button"
              onClick={() => setShowGeneralSection(!showGeneralSection)}
              className="w-full flex items-center justify-between hover:bg-gray-50 p-2 rounded-xl transition-all"
            >
              <div className="flex items-center space-x-3">
                <Building className="w-5 h-5 text-blue-600" />
                <div className="text-left">
                  <p className="text-sm font-bold text-gray-900 uppercase tracking-tighter">{t('settings.generalInfo')}</p>
                  <p className="text-[8px] sm:text-[10px] text-gray-400 font-bold uppercase">{t('settings.generalInfoDesc')}</p>
                </div>
              </div>
              <ChevronDown className={`w-5 h-5 text-blue-600 transition-transform duration-300 ${showGeneralSection ? 'rotate-180' : ''}`} />
            </button>

            {showGeneralSection && (
              <div className="space-y-6 animate-in fade-in slide-in-from-top-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
                  <div className="space-y-1">
                    <label className="text-[8px] sm:text-[10px] font-bold text-gray-400 uppercase flex items-center">
                      <Building className="w-3 h-3 mr-1" /> {t('settings.storeName')}
                    </label>
                    <input required className="w-full px-4 py-3 bg-gray-50 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm" value={settings.name} onChange={e => setSettings({ ...settings, name: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] sm:text-[10px] font-bold text-gray-400 uppercase flex items-center">
                      <BadgeDollarSign className="w-3 h-3 mr-1" /> {t('settings.currency')}
                    </label>
                    <select required className="w-full px-3 py-3 bg-gray-50 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm" value={settings.currency} onChange={e => setSettings({ ...settings, currency: e.target.value })}>
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
                      className="w-full px-3 py-3 bg-gray-50 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                      value={settings.businessType || ''}
                      onChange={e => setSettings({ ...settings, businessType: e.target.value })}
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
                      onChange={(v) => setSettings({ ...settings, publicPhone: v, phone: v })}
                      onDialCodeChange={setPhoneDialCode}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] sm:text-[10px] font-bold text-gray-400 uppercase flex items-center">
                      <Mail className="w-3 h-3 mr-1" /> {t('settings.publicEmail')}
                    </label>
                    <input className="w-full px-3 py-3 bg-gray-50 border rounded-xl outline-none text-sm" value={settings.publicEmail ?? settings.email ?? ''} onChange={e => setSettings({ ...settings, publicEmail: e.target.value, email: e.target.value })} />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[8px] sm:text-[10px] font-bold text-gray-400 uppercase flex items-center">
                    <MapPin className="w-3 h-3 mr-1" /> {t('settings.address')}
                  </label>
                  <input className="w-full px-3 py-3 bg-gray-50 border rounded-xl outline-none text-sm" value={settings.address} onChange={e => setSettings({ ...settings, address: e.target.value })} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[8px] sm:text-[10px] font-bold text-gray-400 uppercase flex items-center">
                      <Building className="w-3 h-3 mr-1" /> {t('settings.enterpriseTypeLabel')}
                    </label>
                    <div className="relative">
                      <input
                        className="w-full px-3 py-3 bg-gray-100 border border-transparent rounded-xl outline-none text-sm text-gray-500 cursor-not-allowed"
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
                        className="w-full px-3 py-3 bg-gray-100 border border-transparent rounded-xl outline-none text-sm text-gray-500 cursor-not-allowed"
                        value={settings.businessType || t('settings.notDefined')}
                        readOnly
                      />
                      <Lock className="absolute right-3 top-3.5 w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      const mainSettingsElement = document.getElementById('main-settings');
                      if (mainSettingsElement) mainSettingsElement.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                  >
                    <Settings2 className="w-3 h-3" />
                    {t('settings.modify')}
                  </button>
                </div>
              </div>
            )}

            {/* Logo Section */}
            <div className="pt-6 border-t">
              <button
                type="button"
                onClick={() => setShowLogoSection(!showLogoSection)}
                className="w-full flex items-center justify-between hover:bg-gray-50 p-3 rounded-lg transition-all"
              >
                <div className="flex items-center space-x-3">
                  <Image className="w-5 h-5 text-amber-600" />
                  <div className="text-left">
                    <p className="text-sm font-bold text-gray-900 uppercase tracking-tighter">{t('settings.logoLabel')}</p>
                    <p className="text-[8px] sm:text-[10px] text-gray-400 font-bold uppercase">{t('settings.logoDesc')}</p>
                  </div>
                </div>
                <ChevronDown className={`w-5 h-5 text-amber-600 transition-transform duration-300 ${showLogoSection ? 'rotate-180' : ''}`} />
              </button>

              {showLogoSection && (
                <div className="pt-6 space-y-6 animate-in fade-in slide-in-from-top-2">
                  <div className="space-y-3">
                    {settings.logo ? (
                      <div className="relative bg-gray-50 border-2 border-dashed border-amber-300 rounded-3xl p-6 flex flex-col items-center justify-center space-y-3">
                        <div className="w-32 h-32 rounded-full overflow-hidden ring-4 ring-white shadow-xl mx-auto">
                          <img src={settings.logo} alt="Logo" className="w-full h-full object-cover" />
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-bold text-gray-900">{t('settings.currentLogo')}</p>
                          <p className="text-xs text-gray-500">{settings.logoFileName}</p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <button
                            type="button"
                            onClick={() => logoInputRef.current?.click()}
                            className="flex-1 px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg transition-all text-sm"
                          >
                            {t('settings.changeLogo')}
                          </button>
                          <button
                            type="button"
                            onClick={handleRemoveLogo}
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
                        className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-2xl p-8 flex flex-col items-center justify-center space-y-3 cursor-pointer hover:border-amber-400 hover:bg-amber-50/50 transition-colors"
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
                      onChange={handleLogoUpload}
                      accept="image/*"
                      className="hidden"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="pt-6 border-t space-y-6">
              {/* Rôle Utilisateur-Role Card Selector */}
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={() => setShowRoleSection(!showRoleSection)}
                  className="w-full flex items-center justify-between hover:bg-gray-50 p-3 rounded-lg transition-all"
                >
                  <div className="flex items-center space-x-3">
                    <UserCog className="w-5 h-5 text-purple-600" />
                    <div className="text-left">
                      <p className="text-sm font-bold text-gray-900 uppercase tracking-tighter">{t('settings.rolePermissions')}</p>
                      <p className="text-[8px] sm:text-[10px] text-gray-400 font-bold uppercase">{t('settings.accessConfiguration')}</p>
                    </div>
                  </div>
                  <ChevronDown className={`w-5 h-5 text-purple-600 transition-transform duration-300 ${showRoleSection ? 'rotate-180' : ''}`} />
                </button>

                {showRoleSection && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                    {/* Admin Role Card */}
                    <div
                      onClick={() => setSettings({ ...settings, userRole: UserRole.ADMIN })}
                      className={`p-6 rounded-2xl border-2 cursor-pointer transition-all ${settings.userRole === UserRole.ADMIN
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/20 shadow-lg shadow-purple-200 dark:shadow-purple-900'
                        : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-purple-300 dark:hover:border-purple-700'
                        } `}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${settings.userRole === UserRole.ADMIN
                            ? 'bg-purple-200 dark:bg-purple-900 text-purple-700 dark:text-purple-300'
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
                          <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center">
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
                            onChange={(e) => setSettings({ ...settings, responsibleDisplayName: e.target.value, adminName: e.target.value })}
                            className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-700 border dark:border-slate-600 rounded-lg text-sm outline-none focus:ring-2 focus:ring-purple-500"
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
                      onClick={() => setSettings({ ...settings, userRole: UserRole.STAFF })}
                      className={`p-6 rounded-2xl border-2 cursor-pointer transition-all ${settings.userRole === UserRole.STAFF
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20 shadow-lg shadow-blue-200 dark:shadow-blue-900'
                        : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-blue-300 dark:hover:border-blue-700'
                        } `}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${settings.userRole === UserRole.STAFF
                            ? 'bg-blue-200 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
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
                          <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
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
                            onChange={(e) => setSettings({ ...settings, staffName: e.target.value })}
                            className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-700 border dark:border-slate-600 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
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

              {isAdmin && (
                <SettingsModuleManager settings={settings} onChange={setSettings} />
              )}

              {/* Sélecteur de Langue & Pays-Admin Only */}
              {isAdmin && (
                <div className="pt-6 border-t space-y-6">
                  {/* En-tête avec bouton de plier/déplier */}
                  <button
                    onClick={() => setShowLanguageSection(!showLanguageSection)}
                    className="w-full flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-700/50 p-3 rounded-lg transition-all"
                  >
                    <div className="flex items-center space-x-3">
                      <Globe className="w-5 h-5 text-blue-600" />
                      <div className="text-left">
                        <p className="text-sm font-bold text-gray-900 uppercase tracking-tighter">{t('settings.languageTranslation')}</p>
                        <p className="text-[8px] sm:text-[10px] text-gray-400">{t('settings.languageDesc')}</p>
                      </div>
                    </div>
                    <ChevronDown
                      className={`w-5 h-5 text-blue-600 transition-transform duration-300 ${showLanguageSection ? 'rotate-180' : ''
                        } `}
                    />
                  </button>

                  {/* Contenu pliable/dépliable */}
                  {showLanguageSection && (
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
                                // Si la langue actuelle n'est pas disponible pour ce pays, changer la langue
                                if (!c.languages.includes(language)) {
                                  setLanguage(c.languages[0]);
                                }
                              }}
                              className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center space-y-1 text-center min-w-0 ${country === c.code
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20 shadow-md shadow-blue-200'
                                : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-blue-300'
                                } `}
                            >
                              <span className="text-xl">{c.flag}</span>
                              <p className="text-[8px] font-bold text-gray-900 dark:text-gray-100 leading-tight truncate w-full">{c.name}</p>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Sélecteur de Langue (filtrée par pays) */}
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
                              className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center space-y-2 min-w-0 ${language === lang.code
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20 shadow-lg shadow-blue-200'
                                : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-blue-300'
                                } `}
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
              )}

              {/* Thème et Fond d'écran-Admin Only */}
              {isAdmin && (
                <div className="pt-6 border-t space-y-6">
                  {/* En-tête avec bouton de plier/déplier */}
                  <button
                    onClick={() => setShowAppearanceSection(!showAppearanceSection)}
                    className="w-full flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-700/50 p-3 rounded-lg transition-all"
                  >
                    <div className="flex items-center space-x-3">
                      <Palette className="w-5 h-5 text-pink-600" />
                      <div className="text-left">
                        <p className="text-sm font-bold text-gray-900 uppercase tracking-tighter">{t('settings.appearance')}</p>
                        <p className="text-[8px] sm:text-[10px] text-gray-400">{t('settings.appearanceDesc')}</p>
                      </div>
                    </div>
                    <ChevronDown
                      className={`w-5 h-5 text-pink-600 transition-transform duration-300 ${showAppearanceSection ? 'rotate-180' : ''
                        } `}
                    />
                  </button>

                  {/* Contenu pliable/dépliable */}
                  {showAppearanceSection && (
                    <div className="space-y-6 pt-4 border-t dark:border-slate-700">
                      {/* Sélecteur de Thème */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {[
                          { id: 'light', label: 'Clair', icon: '☀️', desc: 'Blanc/Bleu' },
                          { id: 'dark', label: 'Sombre', icon: '🌙', desc: 'Noir/Gris' },
                          { id: 'gray', label: 'Gris', icon: '🔲', desc: 'Pâle/Eco' }
                        ].map(t => (
                          <button
                            key={t.id}
                            onClick={() => toggleTheme()}
                            className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center space-y-2 min-w-0 ${theme === t.id
                              ? 'border-pink-500 bg-pink-50 dark:bg-pink-950/20 shadow-lg shadow-pink-200'
                              : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-pink-300'
                              } `}
                          >
                            <span className="text-2xl">{t.icon}</span>
                            <p className="text-xs font-black text-gray-900 dark:text-gray-100 uppercase">{t.label}</p>
                            <p className="text-[9px] text-gray-500 dark:text-gray-400 truncate w-full">{t.desc}</p>
                          </button>
                        ))}
                      </div>

                      {/* Couleur de Fond */}
                      <div className="space-y-3 pt-4 border-t dark:border-slate-700">
                        <label className="text-[8px] sm:text-[10px] font-bold text-gray-400 uppercase flex items-center">
                          <Palette className="w-3 h-3 mr-2" /> Couleur de Fond
                        </label>
                        {/* Container avec scroll horizontal LIMITÉ */}
                        <div className="overflow-x-auto max-w-full">
                          <div className="flex gap-2 items-center min-w-min pb-2">
                            <input
                              type="color"
                              value={bgColor}
                              onChange={(e) => setBgColor(e.target.value)}
                              className="w-16 h-10 rounded-lg cursor-pointer border border-gray-300 dark:border-slate-600 flex-shrink-0"
                            />
                            <input
                              type="text"
                              value={bgColor}
                              onChange={(e) => setBgColor(e.target.value)}
                              className="w-32 px-3 py-2 bg-gray-50 dark:bg-slate-700 border dark:border-slate-600 rounded-lg text-xs font-mono outline-none focus:ring-2 focus:ring-pink-500 flex-shrink-0"
                              placeholder="#FFFFFF"
                            />
                            <button
                              onClick={() => setBgColor('#FFFFFF')}
                              className="px-4 py-2 bg-gray-100 dark:bg-slate-700 text-xs font-bold rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 whitespace-nowrap flex-shrink-0 transition-all"
                            >
                              Réinitialiser
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Image de Fond */}
                      <div className="space-y-3 pt-4 border-t dark:border-slate-700">
                        <label className="text-[8px] sm:text-[10px] font-bold text-gray-400 uppercase flex items-center">
                          <Image className="w-3 h-3 mr-2" /> Image de Fond (Max 8MB)
                        </label>
                        {bgImage && (
                          <div className="relative w-full h-32 rounded-lg overflow-hidden border border-gray-200 dark:border-slate-600">
                            <img src={bgImage} alt="Fond" className="w-full h-full object-cover" />
                            <button
                              onClick={() => setBgImage(null)}
                              className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-lg hover:bg-red-600"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                        <button
                          onClick={() => bgImageInputRef.current?.click()}
                          className="w-full px-4 py-3 border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-lg hover:border-pink-500 transition-all flex items-center justify-center space-x-2 text-sm font-bold text-gray-600 dark:text-gray-300"
                        >
                          <Image className="w-4 h-4" />
                          <span>{bgImage ? 'Changer l\'image' : 'Ajouter une image'}</span>
                        </button>
                        <input
                          ref={bgImageInputRef}
                          type="file"
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              // Vérifier la taille max (8MB = 8388608 bytes)
                              const MAX_SIZE = 8 * 1024 * 1024;
                              if (file.size > MAX_SIZE) {
                                alert(`L'image doit faire moins de 8MB. Taille actuelle: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
                                return;
                              }
                              try {
                                const reader = new FileReader();
                                reader.onload = (event) => {
                                  const result = event.target?.result as string;
                                  setBgImage(result);
                                };
                                reader.readAsDataURL(file);
                              } catch (error) {
                                alert(t('settings.imageLoadError'));
                              }
                            }
                          }}
                          className="hidden"
                        />
                        <p className="text-[9px] text-gray-400">Formats: JPG, PNG, WebP | Max 8MB</p>
                      </div >
                    </div >
                  )}
                </div >
              )}

              {/* Section Audit et Corbeille */}
              {isAdmin && (
                <div className="pt-6 border-t space-y-6">
                  <button
                    type="button"
                    onClick={() => setShowAuditSection(!showAuditSection)}
                    className="w-full flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-700/50 p-3 rounded-lg transition-all"
                  >
                    <div className="flex items-center space-x-3">
                      <Database className="w-5 h-5 text-indigo-600" />
                      <div className="text-left">
                        <p className="text-sm font-bold text-gray-900 uppercase tracking-tighter">Audit & Corbeille</p>
                        <p className="text-[8px] sm:text-[10px] text-gray-400">{t('settings.auditDescription')}</p>
                      </div>
                    </div>
                    <ChevronDown className={`w-5 h-5 text-indigo-600 transition-transform duration-300 ${showAuditSection ? 'rotate-180' : ''}`} />
                  </button>

                  {showAuditSection && (
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
                            value={settings.trashRetentionDays}
                            onChange={e => setSettings({ ...settings, trashRetentionDays: parseInt(e.target.value) || 30 })}
                            className="w-full px-4 py-3 bg-gray-50 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
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
                              onClick={() => setSettings({ ...settings, enableActivityLogging: !settings.enableActivityLogging })}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.enableActivityLogging ? 'bg-indigo-600' : 'bg-gray-200'}`}
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
              )}

              {/* Sections pliables et Actions finales */}
              <div className="space-y-6">
                {/* Section Sécurité des Fichiers */}
                <div className={`${!isVisible(['sécurité', 'chiffrement', 'password', 'mot de passe', 'fichier']) ? 'hidden' : ''}`}>
                  <button
                    type="button"
                    onClick={() => setShowFileSecuritySection(!showFileSecuritySection)}
                    className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-blue-100/50 dark:from-slate-800 dark:to-slate-900 border border-blue-200 dark:border-slate-700 rounded-2xl hover:border-blue-400 transition-all mb-4"
                  >
                    <div className="flex items-center space-x-3">
                      <Lock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      <span className="font-bold text-gray-900 dark:text-white">🔒 {t('settings.securityFiles')}</span>
                    </div>
                    <ChevronDown className={`w-5 h-5 text-blue-600 transition-transform ${showFileSecuritySection ? 'rotate-180' : ''}`} />
                  </button>

                  {showFileSecuritySection && (
                    <div className="mt-4 bg-blue-50 dark:bg-slate-800/50 border border-blue-200 dark:border-slate-700 rounded-2xl p-6 space-y-4">
                      {/* Activation du chiffrement */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex-1">
                          <p className="font-bold text-gray-900 dark:text-gray-100 text-sm">{t('settings.enableEncryption')}</p>
                          <p className="text-xs text-gray-500">{t('settings.encryptionHint')}</p>
                        </div>
                        <button
                          type="button"
                          onClick={handleToggleEncryption}
                          className={`w-16 h-8 rounded-full relative transition-colors flex-shrink-0 ${encryptionConfig.enabled ? 'bg-green-600' : 'bg-gray-300'}`}
                        >
                          <div className={`absolute top-1 bg-white w-6 h-6 rounded-full transition-all ${encryptionConfig.enabled ? 'left-9' : 'left-1'}`} />
                        </button>
                      </div>

                      {encryptionConfig.enabled && (
                        <>
                          {/* Mot de passe */}
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center">
                              <Key className="w-4 h-4 mr-2" />
                              {t('settings.encryptionPassword')}
                            </label>
                            <input
                              type={showPasswordField ? 'text' : 'password'}
                              value={encryptionConfig.password}
                              onChange={(e) => handlePasswordChange(e.target.value)}
                              placeholder={t('settings.encryptionPasswordPlaceholder')}
                              className="w-full px-4 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPasswordField(!showPasswordField)}
                              className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
                            >
                              {showPasswordField ? <EyeOff className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
                              {showPasswordField ? t('settings.hide') : t('settings.show')}
                            </button>

                            {/* Indicateur de force */}
                            {encryptionConfig.password && (
                              <div className="space-y-2">
                                <div className="flex items-center space-x-2">
                                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full transition-all ${passwordStrength.score === 0 ? 'bg-red-500 w-1/5' :
                                        passwordStrength.score === 1 ? 'bg-orange-500 w-2/5' :
                                          passwordStrength.score === 2 ? 'bg-yellow-500 w-3/5' :
                                            passwordStrength.score === 3 ? 'bg-lime-500 w-4/5' :
                                              'bg-green-500 w-full'
                                        }`}
                                    />
                                  </div>
                                  <span className={`text-xs font-bold uppercase ${passwordStrength.level === 'weak' ? 'text-red-600' :
                                    passwordStrength.level === 'fair' ? 'text-orange-600' :
                                      passwordStrength.level === 'good' ? 'text-yellow-600' :
                                        passwordStrength.level === 'strong' ? 'text-lime-600' :
                                          'text-green-600'
                                    }`}>
                                    {passwordStrength.level.toUpperCase()}
                                  </span>
                                </div>
                                {passwordStrength.feedback.length > 0 && (
                                  <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                                    {passwordStrength.feedback.map((key, i) => (
                                      <li key={i}>• {t(key)}</li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Sélection algorithme */}
                          <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center">
                              <Lock className="w-4 h-4 mr-2 flex-shrink-0" />
                              {t('settings.encryptionAlgo')}
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                              {['AES', 'DES', 'SHA256'].map((algo) => (
                                <button
                                  key={algo}
                                  type="button"
                                  onClick={() => handleAlgorithmChange(algo as any)}
                                  className={`py-3 px-4 rounded-lg text-xs font-bold uppercase transition-all border min-w-[80px] ${encryptionConfig.algorithm === algo
                                    ? 'bg-blue-600 text-white border-blue-600'
                                    : 'bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-slate-600 hover:border-blue-400'
                                    }`}
                                >
                                  {algo}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Bouton test */}
                          <button
                            type="button"
                            onClick={handleTestEncryption}
                            className="w-full py-3 px-4 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-all text-sm flex items-center justify-center space-x-2 min-h-[48px]"
                          >
                            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate">{t('settings.testEncryption')}</span>
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Section Sécurité */}
                <div className={`${!isVisible(['sécurité', 'security', 'auth', 'authentification']) ? 'hidden' : ''}`}>
                  <button
                    type="button"
                    onClick={() => setShowAuthSecuritySection(!showAuthSecuritySection)}
                    className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-red-50 to-red-100/50 dark:from-slate-800 dark:to-slate-900 border border-red-200 dark:border-slate-700 rounded-2xl hover:border-red-400 transition-all"
                  >
                    <div className="flex items-center space-x-3">
                      {authDisabled ? (
                        <ShieldOff className="w-5 h-5 text-red-600 dark:text-red-400" />
                      ) : (
                        <Shield className="w-5 h-5 text-green-600 dark:text-green-400" />
                      )}
                      <span className="font-bold text-gray-900 dark:text-white">
                        {authDisabled ? `🔐 ${t('settings.authDisabled')}` : `🛡️ ${t('settings.authEnabled')}`}
                      </span>
                    </div>
                    <ChevronDown className={`w-5 h-5 text-red-600 transition-transform ${showAuthSecuritySection ? 'rotate-180' : ''}`} />
                  </button>

                  {showAuthSecuritySection && (
                    <div className="mt-4 bg-red-50 dark:bg-slate-800/50 border border-red-200 dark:border-slate-700 rounded-2xl p-6 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-900 dark:text-gray-100 text-sm">
                            {authDisabled ? t('settings.enableAuth') : t('settings.disableAuth')}
                          </h4>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {authDisabled
                              ? t('settings.authHintDisabled')
                              : t('settings.authHintEnabled')
                            }
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={handleSecurityToggle}
                          disabled={isProcessing}
                          className={`px-6 py-3 rounded-lg font-medium transition-all flex items-center justify-center space-x-2 min-w-[120px] min-h-[48px] flex-shrink-0 ${authDisabled
                            ? 'bg-green-500 hover:bg-green-600 text-white'
                            : 'bg-red-500 hover:bg-red-600 text-white'
                            } disabled:opacity-50`}
                        >
                          {isProcessing ? (
                            <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
                          ) : authDisabled ? (
                            <Shield className="w-4 h-4 flex-shrink-0" />
                          ) : (
                            <ShieldOff className="w-4 h-4 flex-shrink-0" />
                          )}
                          <span className="truncate">{authDisabled ? t('button.add') : t('button.delete')}</span>
                        </button>
                      </div>

                      {securityMessage && (
                        <div className={`p-3 rounded-lg ${securityMessage.includes('succès')
                          ? 'bg-green-100 border border-green-300 text-green-800'
                          : 'bg-blue-100 border border-blue-300 text-blue-800'
                          }`}>
                          <div className="flex items-center space-x-2">
                            {securityMessage.includes('succès') ? (
                              <CheckCircle2 className="w-4 h-4" />
                            ) : (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            )}
                            <span className="text-sm">{securityMessage}</span>
                          </div>
                        </div>
                      )}

                      <div className="text-xs text-gray-500 dark:text-gray-400 bg-white dark:bg-slate-700 p-3 rounded-lg">
                        <p className="font-semibold mb-1">⚠️ {t('settings.importantInfo')}</p>
                        <ul className="space-y-1">
                          <li>• {authDisabled ? 'L\'activation' : 'La désactivation'} prendra effet immédiatement</li>
                          <li>• {authDisabled ? 'Vous devrez vous reconnecter' : 'Tous les utilisateurs auront accès'}</li>
                          <li>• Cette action peut être inversée à tout moment</li>
                        </ul>
                      </div>

                      {/* Options de sécurité supplémentaires */}
                      {!authDisabled && (
                        <div className="space-y-4 pt-4 border-t border-red-100">
                          {/* Synchronisation des Comptes de Test - Placé ici pour la cohérence admin */}
                          {isAdmin && (
                            <div className="space-y-3">
                              <p className="text-xs font-bold text-gray-900 dark:text-gray-100 uppercase tracking-tighter flex items-center gap-2">
                                <RefreshCw className="w-3.5 h-3.5 text-emerald-600" />
                                {t('settings.syncTitle') || 'Outils de Synchronisation'}
                              </p>
                              <div className="flex flex-col sm:flex-row items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-800 rounded-xl gap-3">
                                <div className="flex-1">
                                  <p className="text-[10px] font-bold text-emerald-800 dark:text-emerald-400">{t('settings.syncAccounts') || 'Synchroniser les comptes de test'}</p>
                                  <p className="text-[9px] text-emerald-600 dark:text-emerald-500">{t('settings.syncAccountsDesc') || 'Restaurer Admin & User par défaut'}</p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setIsProcessing(true);
                                    setTimeout(() => {
                                      authService.syncTestAccounts();
                                      setIsProcessing(false);
                                      alert(t('settings.testAccountsSynced'));
                                    }, 1000);
                                  }}
                                  disabled={isProcessing}
                                  className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[10px] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                  {isProcessing ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                                  {t('button.sync') || 'Synchroniser'}
                                </button>
                              </div>
                            </div>
                          )}

                          <div className="flex items-center justify-between">
                            <div className="flex-1 pr-4">
                              <p className="text-xs font-bold text-gray-900 dark:text-gray-100">{t('settings.forceAuth')}</p>
                              <p className="text-[10px] text-gray-500 italic">{t('settings.forceAuthHint')}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const newValue = !secureAuthForced;
                                setSecureAuthForcedState(newValue);
                                if (newValue) localStorage.setItem('casierdor_secure_auth_forced', 'true');
                                else localStorage.removeItem('casierdor_secure_auth_forced');
                              }}
                              className={`w-12 h-6 rounded-full relative transition-colors ${secureAuthForced ? 'bg-orange-600' : 'bg-gray-300'}`}
                            >
                              <div className={`absolute top-1 bg-white w-4 h-4 rounded-full transition-all ${secureAuthForced ? 'left-7' : 'left-1'}`} />
                            </button>
                          </div>

                          <div className="space-y-3">
                            <p className="text-xs font-bold text-gray-900 dark:text-gray-100 uppercase tracking-tighter">{t('settings.defaultAccounts')}</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  const newValue = !defaultAccountsDisabled.admin;
                                  setDefaultAccountsDisabled(prev => ({ ...prev, admin: newValue }));
                                  localStorage.setItem('casierdor_admin_disabled', newValue.toString());
                                  alert(`Compte Administrateur système ${newValue ? 'désactivé' : 'activé'}`);
                                }}
                                className={`flex items-center justify-between p-3 rounded-xl border ${defaultAccountsDisabled.admin ? 'bg-orange-50 border-orange-200 text-orange-700' : 'bg-green-50 border-green-200 text-green-700'}`}
                              >
                                <span className="text-[10px] font-black uppercase">Admin (@casierdor.app)</span>
                                {defaultAccountsDisabled.admin ? <ShieldOff className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  const newValue = !defaultAccountsDisabled.user;
                                  setDefaultAccountsDisabled(prev => ({ ...prev, user: newValue }));
                                  localStorage.setItem('casierdor_user_disabled', newValue.toString());
                                  alert(`Compte Utilisateur système ${newValue ? 'désactivé' : 'activé'}`);
                                }}
                                className={`flex items-center justify-between p-3 rounded-xl border ${defaultAccountsDisabled.user ? 'bg-orange-50 border-orange-200 text-orange-700' : 'bg-green-50 border-green-200 text-green-700'}`}
                              >
                                <span className="text-[10px] font-black uppercase">User (@casierdor.app)</span>
                                {defaultAccountsDisabled.user ? <ShieldOff className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Section Gestion des Téléchargements */}
                {isAdmin && (
                  <div className={`${!isVisible(['télécharger', 'download', 'gestion', 'fichier', 'dossier']) ? 'hidden' : ''} mb-4`}>
                    <button
                      type="button"
                      onClick={() => setShowDownloadSection(!showDownloadSection)}
                      className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-blue-100/50 dark:from-slate-800 dark:to-slate-900 border border-blue-200 dark:border-slate-700 rounded-2xl hover:border-blue-400 transition-all"
                    >
                      <div className="flex items-center space-x-3">
                        <FolderDown className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        <span className="font-bold text-gray-900 dark:text-white">📥 {t('settings.downloadManager')}</span>
                      </div>
                      <ChevronDown className={`w-5 h-5 text-blue-600 transition-transform ${showDownloadSection ? 'rotate-180' : ''}`} />
                    </button>

                    {showDownloadSection && (
                      <div className="mt-4 bg-blue-50 dark:bg-slate-800/50 border border-blue-200 dark:border-slate-700 rounded-2xl p-6 space-y-6">
                        {/* État des dossiers */}
                        <div>
                          <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-4 flex items-center">
                            <HardDrive className="w-3 h-3 mr-2" />
                            {t('settings.dmFolderStatus')}
                          </h4>
                          <div className="grid grid-cols-2 gap-3">
                            {Object.entries({
                              'Main App': dirStatus.main,
                              'Downloads': dirStatus.downloads,
                              'Backups': dirStatus.backups,
                              'Updates': dirStatus.updates
                            }).map(([name, exists]) => (
                              <div key={name} className={`flex items-center justify-between p-3 rounded-xl border ${exists ? 'bg-white border-blue-100 text-blue-900' : 'bg-red-50 border-red-100 text-red-600'} dark:bg-slate-900`}>
                                <span className="text-[10px] font-bold uppercase">{name}</span>
                                {exists ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4" />}
                              </div>
                            ))}
                          </div>
                          <p className="text-[9px] text-gray-500 mt-3 font-medium italic">
                            * {t('settings.dmPathInfo')}
                          </p>
                        </div>

                        {/* Outils de réparation */}
                        <div className="pt-4 border-t border-blue-100 dark:border-slate-700">
                          <div className="flex items-start space-x-4">
                            <div className="flex-1">
                              <h4 className="text-xs font-bold text-gray-900 dark:text-white capitalize mb-1">{t('settings.dmRepair')}</h4>
                              <p className="text-[10px] text-gray-500">{t('settings.dmRepairInfo')}</p>
                            </div>
                            <button
                              type="button"
                              onClick={handleRepairFolders}
                              disabled={isProcessing}
                              className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-black shadow-lg shadow-blue-200 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                            >
                              <Wrench className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Mode Compatibilité */}
                        <div className="pt-4 border-t border-blue-100 dark:border-slate-700">
                          <label className="flex items-center justify-between cursor-pointer group">
                            <div className="flex-1">
                              <h4 className="text-xs font-bold text-gray-900 dark:text-white capitalize mb-1">{t('settings.dmAdvanced')}</h4>
                              <p className="text-[10px] text-gray-500">{t('settings.dmLegacyInfo')}</p>
                            </div>
                            <div className="relative inline-flex items-center">
                              <input
                                type="checkbox"
                                checked={legacyDownloadMode}
                                onChange={(e) => {
                                  setLegacyDownloadMode(e.target.checked);
                                  localStorage.setItem('casierdor_legacy_download', e.target.checked.toString());
                                }}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </div>
                          </label>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Section Mises à Jour */}
                {isAdmin && (
                  <div className={`${!isVisible(['mise', 'à', 'jour', 'update', 'version']) ? 'hidden' : ''}`}>
                    <button
                      type="button"
                      onClick={() => setShowUpdateSection(!showUpdateSection)}
                      className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-purple-100/50 dark:from-slate-800 dark:to-slate-900 border border-purple-200 dark:border-slate-700 rounded-2xl hover:border-purple-400 transition-all"
                    >
                      <div className="flex items-center space-x-3">
                        <RefreshCw className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        <span className="font-bold text-gray-900 dark:text-white">🔄 {t('settings.updatesTitle')}</span>
                        {showUpdateNotification && (
                          <span className="ml-2 px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-full animate-pulse">
                            {t('settings.newUpdate')}
                          </span>
                        )}
                      </div>
                      <ChevronDown className={`w-5 h-5 text-purple-600 transition-transform ${showUpdateSection ? 'rotate-180' : ''}`} />
                    </button>

                    {showUpdateSection && (
                      <div className="mt-4 bg-purple-50 dark:bg-slate-800/50 border border-purple-200 dark:border-slate-700 rounded-2xl p-6 space-y-4">
                        {updateInfo ? (
                          <>
                            <div className={`p-3 rounded-lg ${updateInfo.hasUpdate ? 'bg-red-100 border border-red-300' : 'bg-green-100 border border-green-300'}`}>
                              <div className="flex items-center space-x-2">
                                {updateInfo.hasUpdate ? (
                                  <>
                                    <AlertCircle className="w-5 h-5 text-red-600" />
                                    <div>
                                      <p className="font-bold text-red-900">Version {updateInfo.latestVersion} disponible!</p>
                                      <p className="text-xs text-red-700">Vous avez: v{updateInfo.currentVersion}</p>
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                                    <div>
                                      <p className="font-bold text-green-900">Vous êtes à jour!</p>
                                      <p className="text-xs text-green-700">Version: v{updateInfo.currentVersion}</p>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>

                            {updateInfo.updateInfo?.description && (
                              <div className="space-y-2">
                                <p className="text-sm font-bold text-gray-700 dark:text-gray-300">📝 Description</p>
                                <div className="bg-white dark:bg-slate-700 p-3 rounded-lg text-xs text-gray-600 dark:text-gray-400 max-h-40 overflow-y-auto border border-gray-200 dark:border-slate-600">
                                  {updateInfo.updateInfo.description}
                                </div>
                              </div>
                            )}

                            <p className="text-xs text-gray-500">
                              Dernière vérification: {updateInfo.lastChecked.toLocaleString()}
                            </p>
                          </>
                        ) : (
                          <p className="text-sm text-gray-600 dark:text-gray-400">Cliquez sur "Vérifier les mises à jour" pour voir l'état</p>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <button
                            type="button"
                            onClick={handleCheckUpdates}
                            disabled={checkingUpdates}
                            className="py-3 px-4 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-all text-sm flex items-center justify-center space-x-2 min-h-[48px]"
                          >
                            <RefreshCw className={`w-4 h-4 ${checkingUpdates ? 'animate-spin' : ''} flex-shrink-0`} />
                            <span className="truncate">{checkingUpdates ? 'Vérification...' : 'Vérifier'}</span>
                          </button>

                          {updateInfo?.hasUpdate && (
                            <button
                              type="button"
                              onClick={handleInstallUpdate}
                              className="py-3 px-4 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-all text-sm flex items-center justify-center space-x-2 min-h-[48px]"
                            >
                              <Download className="w-4 h-4 flex-shrink-0" />
                              <span className="truncate">Installer</span>
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Barre d'action finale */}
                <div className="pt-4 border-t dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center space-x-3 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => setSettings({ ...settings, stockEnabled: !settings.stockEnabled })}
                      className={`w-12 h-6 rounded-full relative transition-colors ${settings.stockEnabled ? 'bg-blue-600' : 'bg-gray-300'}`}
                    >
                      <div className={`absolute top-1 bg-white w-4 h-4 rounded-full transition-all ${settings.stockEnabled ? 'left-7' : 'left-1'}`} />
                    </button>
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{t('settings.autoStock')}</span>
                  </div>

                  <button
                    type="submit"
                    className="min-w-fit w-full sm:w-auto flex items-center justify-center space-x-2 px-10 py-4 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all hover:-translate-y-1 active:translate-y-0 overflow-hidden"
                  >
                    <Save className="w-5 h-5 flex-shrink-0" />
                    <span className="whitespace-normal break-words leading-tight">{saved ? t('message.success') : t('button.save')}</span>
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>

        <div className="space-y-6">
          {/* Configuration Système */}
          <div className={`w-full ${!isVisible(['configuration', 'systeme', 'device', 'mode', 'langue']) ? 'hidden' : ''} bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm`}>
            <button
              type="button"
              onClick={() => setShowSystemConfigSection(!showSystemConfigSection)}
              className="w-full flex items-center justify-between hover:bg-gray-50 p-2 rounded-xl transition-all"
            >
              <div className="flex items-center space-x-3">
                <Settings2 className="w-5 h-5 text-gray-600" />
                <div className="text-left">
                  <p className="text-sm font-bold text-gray-900 uppercase tracking-tighter">Configuration Système</p>
                  <p className="text-[8px] sm:text-[10px] text-gray-400 font-bold uppercase">Appareil, Mode et Langue</p>
                </div>
              </div>
              <ChevronDown className={`w-5 h-5 text-gray-600 transition-transform duration-300 ${showSystemConfigSection ? 'rotate-180' : ''}`} />
            </button>

            {showSystemConfigSection && (
              <div className="pt-4 animate-in fade-in slide-in-from-top-2">
                <SystemConfig
                  onConfigChange={(config) => {
                    setSystemConfig(config);
                    localStorage.setItem('systemConfig', JSON.stringify(config));
                  }}
                />
              </div>
            )}
          </div>

          {/* Maintenance */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-4">
            <button
              type="button"
              onClick={() => setShowMaintenanceSection(!showMaintenanceSection)}
              className="w-full flex items-center justify-between hover:bg-gray-50 p-2 rounded-xl transition-all"
            >
              <h2 className="font-bold flex items-center text-gray-900 uppercase text-sm tracking-tight">
                <Database className="w-5 h-5 mr-2 text-purple-600" />
                {t('settings.maintenance')}
              </h2>
              <ChevronDown className={`w-5 h-5 text-purple-600 transition-transform ${showMaintenanceSection ? 'rotate-180' : ''}`} />
            </button>

            {showMaintenanceSection && (
              <div className="space-y-4 pt-2 animate-in fade-in slide-in-from-top-2">
                <p className="text-xs text-gray-500 leading-relaxed">Les archives temporelles (J, S, M, A) sont générées chaque jour à minuit. Seul un Administrateur peut gérer les sauvegardes.</p>

                {isAdmin && (
                  <div className="p-4 rounded-2xl border border-amber-100 bg-amber-50/50 space-y-3">
                    <p className="text-sm font-bold text-gray-900">{t('testData.cleanupTitle')}</p>
                    <p className="text-xs text-gray-600">{t('testData.cleanupDesc')}</p>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={settings.enableTestAccounts === true}
                        onChange={(e) => setSettings({ ...settings, enableTestAccounts: e.target.checked })}
                        className="rounded accent-blue-600"
                      />
                      {t('testData.enableTestAccounts')}
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        handleActionWithConfirmation('cleanupTestData', () => {
                          const r = runFullTestDataCleanup();
                          alert(
                            t('testData.cleanupDone', {
                              products: r.productsRemoved,
                              clients: r.clientsRemoved,
                              users: r.testUsersRemoved,
                            })
                          );
                        })
                      }
                      className="w-full py-3 px-4 bg-amber-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-700"
                    >
                      {t('testData.cleanupTitle')}
                    </button>
                  </div>
                )}

                <div className="pt-4 space-y-3">
                  {isAdmin && (
                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={() => handleBackupData()}
                        disabled={isProcessing}
                        className="min-w-fit flex-1 sm:flex-initial py-4 px-6 text-blue-600 bg-blue-50 rounded-2xl text-[8px] sm:text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center border border-blue-100 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
                      >
                        <Download className="w-4 h-4 flex-shrink-0 mr-2" />
                        <span className="whitespace-normal break-words text-center leading-tight">
                          {isProcessing ? 'Sauvegarde...' : 'Sauvegarder'}
                        </span>
                      </button>

                      <button
                        onClick={() => handleActionWithConfirmation('restoreData', () => fileInputRef.current?.click())}
                        disabled={isProcessing}
                        className="min-w-fit flex-1 sm:flex-initial py-4 px-6 text-purple-600 bg-purple-50 rounded-2xl text-[8px] sm:text-[10px] font-black uppercase tracking-widest hover:bg-purple-600 hover:text-white transition-all flex items-center justify-center border border-purple-100 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
                      >
                        {isProcessing ? <Loader2 className="w-4 h-4 animate-spin flex-shrink-0 mr-2" /> : <UploadCloud className="w-4 h-4 flex-shrink-0 mr-2" />}
                        <span className="whitespace-normal break-words text-center leading-tight">
                          {isProcessing ? 'Restauration...' : t('settings.restore')}
                        </span>
                      </button>
                    </div>
                  )}

                  <button
                    onClick={() => {
                      if (confirm('Voulez-vous sauvegarder les données avant de vous déconnecter?\n\nCela créera une sauvegarde complète et vous redirigera vers la page de connexion.')) {
                        handleBackupData(true).then(() => {
                          setTimeout(() => {
                            logout().then(() => {
                              navigate('/login');
                            });
                          }, 2000);
                        });
                      }
                    }}
                    disabled={isProcessing}
                    className="w-full py-4 px-6 text-orange-600 bg-orange-50 rounded-2xl text-[8px] sm:text-[10px] font-black uppercase tracking-widest hover:bg-orange-600 hover:text-white transition-all flex items-center justify-center border border-orange-100 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
                  >
                    <LogOut className="w-4 h-4 flex-shrink-0 mr-2" />
                    <span className="whitespace-normal break-words text-center leading-tight">
                      {isProcessing ? 'Sauvegarde et déconnexion...' : 'Sauvegarder et Déconnecter'}
                    </span>
                  </button>

                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleRestoreData}
                    accept=".json"
                    className="hidden"
                  />

                  <button
                    onClick={() => handleActionWithConfirmation('resetAll', clearAllData, 'confirm.resetAll')}
                    disabled={!isAdmin}
                    className="w-full py-4 px-6 text-red-500 bg-red-50 rounded-2xl text-[8px] sm:text-[10px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all flex items-center justify-center border border-red-100 disabled:opacity-50 overflow-hidden"
                  >
                    <Trash2 className="w-4 h-4 flex-shrink-0 mr-2" />
                    <span className="whitespace-normal break-words text-center leading-tight">{t('settings.resetAll')}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Sauvegarde & transfert JSON */}
          <SettingsCollapsibleSection
            hidden={!isVisible(['import', 'export', 'json', 'données', 'data', 'transfer', 'sauvegarde'])}
            open={showDataTransferSection}
            onToggle={() => setShowDataTransferSection(!showDataTransferSection)}
            title={t('settings.dataTransfer')}
            subtitle={t('settings.dataTransferDesc')}
            icon={FileJson}
            accent="cyan"
          >
            <p className="text-xs text-gray-500 leading-relaxed mb-4">{t('settings.dataTransferHint')}</p>
            <label className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-100 mb-4 cursor-pointer">
              <span className="text-sm font-bold text-gray-700">{t('dashboard.shortcutsToggle')}</span>
              <input
                type="checkbox"
                checked={settings.showDashboardShortcuts !== false}
                onChange={(e) => setSettings({ ...settings, showDashboardShortcuts: e.target.checked })}
                className="w-5 h-5 rounded accent-blue-600"
              />
            </label>
            {isAdmin ? (
              <div className="flex flex-col sm:flex-row flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleExportJson}
                  className="flex-1 min-w-[160px] py-4 px-5 bg-cyan-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-cyan-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-200/50"
                >
                  <Download className="w-5 h-5 shrink-0" />
                  {t('settings.exportJson')}
                </button>
                <button
                  type="button"
                  onClick={() => handleActionWithConfirmation('restoreData', () => jsonImportRef.current?.click())}
                  className="flex-1 min-w-[160px] py-4 px-5 bg-white border-2 border-cyan-200 text-cyan-700 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-cyan-50 transition-all flex items-center justify-center gap-2"
                >
                  <UploadCloud className="w-5 h-5 shrink-0" />
                  {t('settings.importJson')}
                </button>
                <input
                  ref={jsonImportRef}
                  type="file"
                  accept=".json,application/json"
                  className="hidden"
                  onChange={handleImportJson}
                />
              </div>
            ) : (
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-xl p-3">
                {t('settings.sessionAdmin')}
              </p>
            )}
          </SettingsCollapsibleSection>

          {/* Taux de Change */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-4">
            <button
              type="button"
              onClick={() => setShowExchangeRateSection(!showExchangeRateSection)}
              className="w-full flex items-center justify-between hover:bg-gray-50 p-2 rounded-xl transition-all"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-gray-900 text-sm">Taux de Change 2026</h3>
                  <p className="text-[8px] sm:text-[10px] text-gray-400 uppercase font-bold">Base: {settings.currency}</p>
                </div>
              </div>
              <ChevronDown className={`w-5 h-5 text-emerald-600 transition-transform duration-300 ${showExchangeRateSection ? 'rotate-180' : ''}`} />
            </button>

            {showExchangeRateSection && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-4 animate-in fade-in slide-in-from-top-2">
                {(() => {
                  const rates = getExchangeRates(settings.currency || DEFAULT_CURRENCY);
                  return Object.entries(rates)
                    .filter(([code]) => code !== (settings.currency || DEFAULT_CURRENCY))
                    .slice(0, 6)
                    .map(([code, rate]) => (
                      <div key={code} className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-200 rounded-xl p-3">
                        <p className="text-[8px] sm:text-[10px] font-bold text-emerald-900 uppercase tracking-wide">{code}</p>
                        <p className="text-xs font-black text-emerald-700 whitespace-nowrap overflow-x-auto scrollbar-hide">{rate.toFixed(4)}</p>
                      </div>
                    ));
                })()}
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmActionModal
        open={!!pending}
        actionId={pending?.actionId ?? 'action'}
        message={pending?.message ?? ''}
        level={pending?.level}
        neverAsk={neverAsk}
        onNeverAskChange={setNeverAsk}
        onCancel={cancel}
        onConfirm={confirm}
      />
    </div>
  );
};

export default SettingsPage;
