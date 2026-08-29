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
import GeneralInfoSection from './settings/components/GeneralInfoSection';
import LogoSection from './settings/components/LogoSection';
import RoleSection from './settings/components/RoleSection';
import LanguageSettings from './settings/components/LanguageSettings';
import AppearanceSettings from './settings/components/AppearanceSettings';
import AuditSettings from './settings/components/AuditSettings';
import ReceiptSettings from './settings/components/ReceiptSettings';
import { ExportService } from '../utils/exportService';
import { ImportService } from '../utils/importService';
import { FileFormat, DocumentType } from '../types/archive';
import { ArchiveService } from '../utils/archiveService';
import { addActivity } from '../store';
import { LogAction } from '../types';

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
  const [selectedExportFormat, setSelectedExportFormat] = useState<FileFormat>(
    (localStorage.getItem('casierdor_export_format') as FileFormat) || FileFormat.JSON
  );

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

  const handleGenericExport = async () => {
    setIsProcessing(true);
    try {
      const allData: Record<string, unknown> = {};
      Object.values(STORAGE_KEYS).forEach((key) => {
        const raw = localStorage.getItem(scopeStorageKey(key));
        allData[key] = raw ? JSON.parse(raw) : null;
      });

      await ExportService.exportData(
        [allData], // Wrap in array as service expects an array of objects
        selectedExportFormat,
        `Kelasi_Export_${new Date().toISOString().slice(0, 10)}`,
        'Kelasi Data Export'
      );
      
      // Save archive record of the export
      ArchiveService.archiveDocument(
        'admin', 
        DocumentType.EXPORT, 
        `Kelasi_Export_${new Date().toISOString().slice(0, 10)}.${selectedExportFormat.toLowerCase()}`, 
        selectedExportFormat, 
        allData
      );
      
    } catch (e) {
      console.error(e);
      alert('Erreur lors de l\'export');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGenericImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      const formatMap: Record<string, FileFormat> = {
        'json': FileFormat.JSON,
        'xlsx': FileFormat.XLSX,
        'txt': FileFormat.TXT
      };
      const ext = file.name.split('.').pop()?.toLowerCase() || 'json';
      const format = formatMap[ext] || FileFormat.JSON;

      const result = await ImportService.parseFile(file, format);
      if (result.success && result.data && result.data.length > 0) {
        requestConfirm({
          actionId: 'importDataGeneric',
          message: `Vous allez importer ${result.validRows} enregistrements. Voulez-vous continuer ?`,
          level: 2,
          run: () => {
            // For a generic import, we assume it's a full store dump if it's JSON, 
            // otherwise it needs a specific mapping. We'll handle basic JSON full import here
            // to maintain backward compatibility.
            if (format === FileFormat.JSON) {
              const content = result.data[0];
              Object.entries(content).forEach(([key, value]) => {
                if (value !== null && value !== undefined) {
                  localStorage.setItem(scopeStorageKey(key), JSON.stringify(value));
                }
              });
            } else {
               // Logique d'import métier spécifique (produits, etc.)
               alert('Import spécifique pris en charge via le service, mappings à implémenter selon la structure.');
            }
            
            // Archiver l'import
            ArchiveService.archiveDocument(
              'admin', 
              DocumentType.IMPORT, 
              file.name, 
              format, 
              result.data
            );

            try {
              addActivity({
                userName: settings.adminName || 'Admin',
                action: LogAction.IMPORT,
                details: `Importation du fichier : ${file.name}`,
                module: 'IMPORT'
              });
            } catch (e) {
               console.warn(e);
            }
            
            alert('Import terminé avec succès.');
            window.location.reload();
          },
        });
      } else {
        alert(t('message.invalidFile') + (result.errors.length > 0 ? ': ' + result.errors[0].message : ''));
      }
    } catch (e) {
       console.error(e);
       alert(t('message.invalidFile'));
    } finally {
       setIsProcessing(false);
       event.target.value = '';
    }
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

      requestConfirm({
        actionId: 'restore_backup',
        title: t('settings.restoreWarning') || 'Attention',
        message: t('settings.restoreWarning'),
        level: 2,
        run: () => {
          Object.entries(content).forEach(([key, value]) => {
            if (value) {
              localStorage.setItem(key, JSON.stringify(value));
            }
          });
          alert(t('settings.restoreSuccessRestart'));
          window.location.reload();
        }
      });
    } catch (error) {
      console.error('Erreur restauration:', error);
      alert(t('settings.restoreError'));
    } finally {
      setIsProcessing(false);
      event.target.value = '';
    }
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
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

      try {
        const permission = await requestMediaPermission();
        if (permission.status !== 'GRANTED' && permission.status !== 'UNAVAILABLE') {
          alert(t('settings.mediaPermissionDenied'));
          return;
        }
      } catch (error) {
        console.warn('Erreur vérification permission média:', error);
      }

      setSettings({
        ...settings,
        logo: base64,
        logoFileName: file.name
      });
    };
    reader.readAsDataURL(file);

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

    requestConfirm({
      actionId: 'install_update',
      title: t('settings.updatesTitle') || 'Mise à jour',
      message: t('settings.confirmInstallVersion', { version: updateInfo.latestVersion }),
      run: async () => {
        try {
          const result = await UpdateManager.installUpdate();
          alert('✓ ' + result);
          // En production, on redémarrerait l'app ici
        } catch (error) {
          alert(t('settings.installationError'));
          console.error(error);
        }
      }
    });
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
          <form onSubmit={handleSave} className="space-y-6">
            <GeneralInfoSection settings={settings} onChange={setSettings} />

            <LogoSection settings={settings} onChange={setSettings} />

            <RoleSection settings={settings} onChange={setSettings} />

            <ReceiptSettings settings={settings} onChange={setSettings} />

            {isAdmin && (
              <SettingsModuleManager settings={settings} onChange={setSettings} />
            )}

            {isAdmin && (
              <LanguageSettings />
            )}

            {isAdmin && (
              <AppearanceSettings />
            )}

            {isAdmin && (
              <AuditSettings settings={settings} onChange={setSettings} />
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
                        <div className="flex items-center gap-2">
                          {authDisabled ? <Lock className="w-5 h-5 text-gray-500" /> : <ShieldCheck className="w-5 h-5 text-green-500" />}
                          {authDisabled ? t('settings.authDisabled') : t('settings.authEnabled')}
                        </div>
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
                        <p className="font-semibold mb-1 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-yellow-500" /> {t('settings.importantInfo')}
                        </p>
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
                        <span className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                          <RefreshCw className="w-4 h-4" /> {t('settings.updatesTitle')}
                        </span>
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
                      if (window.confirm('Voulez-vous sauvegarder les données avant de vous déconnecter?\n\nCela créera une sauvegarde complète et vous redirigera vers la page de connexion.')) {
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
                      {isProcessing ? t('settings.backupInProgress', 'Sauvegarde...') : t('settings.backupAndLogout', 'Sauvegarder et Déconnecter')}
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
              <div className="flex flex-col sm:flex-row flex-wrap gap-3 items-center">
                <select
                  value={selectedExportFormat}
                  onChange={(e) => {
                    const val = e.target.value as FileFormat;
                    setSelectedExportFormat(val);
                    localStorage.setItem('casierdor_export_format', val);
                  }}
                  className="px-4 py-4 rounded-2xl border border-gray-200 bg-white text-sm font-bold shadow-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
                >
                  <option value={FileFormat.JSON}>Format JSON</option>
                  <option value={FileFormat.XLSX}>Format Excel (XLSX)</option>
                  <option value={FileFormat.TXT}>Format Texte (TXT)</option>
                  <option value={FileFormat.PDF}>Format PDF</option>
                  <option value={FileFormat.ZIP}>Archive (ZIP)</option>
                </select>
                
                <button
                  type="button"
                  onClick={handleGenericExport}
                  disabled={isProcessing}
                  className="btn-3d flex-1 min-w-[160px] py-4 px-5 bg-cyan-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-cyan-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-200/50 disabled:opacity-50"
                >
                  {isProcessing ? <Loader2 className="w-5 h-5 shrink-0 animate-spin" /> : <Download className="w-5 h-5 shrink-0" />}
                  {t('settings.btnExport', 'Exporter')}
                </button>
                <button
                  type="button"
                  onClick={() => handleActionWithConfirmation('restoreData', () => jsonImportRef.current?.click())}
                  disabled={isProcessing}
                  className="btn-3d flex-1 min-w-[160px] py-4 px-5 bg-white border-2 border-cyan-200 text-cyan-700 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-cyan-50 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <UploadCloud className="w-5 h-5 shrink-0" />
                  {t('settings.btnImport', 'Importer')}
                </button>
                <input
                  ref={jsonImportRef}
                  type="file"
                  accept=".json,application/json,.xlsx,.txt"
                  className="hidden"
                  onChange={handleGenericImport}
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
