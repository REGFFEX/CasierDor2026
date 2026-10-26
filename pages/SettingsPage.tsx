import React, { useState, useRef, useEffect } from 'react';
import {
  Save, Shield, Bell, Clock, Trash2, RefreshCw, ChevronDown, ChevronRight,
  Download, Upload, Eye, EyeOff, Key, Lock, CheckCircle2, XCircle, ShieldAlert,
  LogOut, Info, AlertTriangle, ShieldCheck, Mail, Phone, MapPin, ExternalLink,
  Globe, ShieldOff, FolderDown, HardDrive, Wrench, Building, Database, UserCog,
  UploadCloud, FileText, FileJson, Loader2, Users, Image, X, Search, AlertCircle,
  Copy, Briefcase, Settings2, Palette, Languages, BadgeDollarSign, Cloud,
  Receipt, ListChecks, Monitor as MonitorIcon, Smartphone, Laptop, KeyRound,
  Package, FileBarChart, Archive, RotateCw,
} from 'lucide-react';
import { getStoreData, setStoreData, STORAGE_KEYS, DEFAULT_SETTINGS, clearAllData } from '../store';
import { StoreSettings, UserRole, EnterpriseType, ActivityType } from '../types';
import {
  downloadFile, requestFilePermissions, safeBackupData, restoreDataFromFile,
  initDirectoryStructure, checkDirectoryStatus, SYSTEM_DIRS,
} from '../utils/fileManager';
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
import SettingsModuleManager from '../components/SettingsModuleManager';
import ConfirmActionModal from '../components/ConfirmActionModal';
import { useConfirmAction } from '../hooks/useConfirmAction';
import { scopeStorageKey } from '../utils/accountStorage';
import { runFullTestDataCleanup } from '../utils/testDataCleanup';
import { normalizeSettingsForSave } from '../utils/companyProfile';
import { ExportService } from '../utils/exportService';
import { ImportService } from '../utils/importService';
import { FileFormat, DocumentType } from '../types/archive';
import { ArchiveService } from '../utils/archiveService';
import { addActivity } from '../store';
import { LogAction } from '../types';

// Sub-sections
import GeneralInfoSection from './settings/components/GeneralInfoSection';
import LogoSection from './settings/components/LogoSection';
import RoleSection from './settings/components/RoleSection';
import LanguageSettings from './settings/components/LanguageSettings';
import AppearanceSettings from './settings/components/AppearanceSettings';
import AuditSettings from './settings/components/AuditSettings';
import ReceiptSettings from './settings/components/ReceiptSettings';

// ─── Section card component for the settings home ───
interface SettingsSectionCardProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  color: string;
  bgColor: string;
  onClick: () => void;
  isAdmin?: boolean;
  hidden?: boolean;
}

const SettingsSectionCard: React.FC<SettingsSectionCardProps> = ({
  icon, title, subtitle, color, bgColor, onClick, isAdmin = true, hidden = false,
}) => {
  if (hidden) return null;
  return (
    <button
      onClick={onClick}
      className="ds-card ds-card-interactive w-full flex items-center gap-4 p-4 text-left"
    >
      <div
        className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
        style={{ background: bgColor }}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm text-[var(--c-text)] truncate">{title}</p>
        <p className="text-xs text-[var(--c-text-3)] truncate">{subtitle}</p>
      </div>
      <ChevronRight className="w-5 h-5 text-[var(--c-text-3)] flex-shrink-0" />
    </button>
  );
};

// ─── Section wrapper (shown when a section is active) ───
const SectionView: React.FC<{
  title: string;
  icon: React.ReactNode;
  onBack: () => void;
  children: React.ReactNode;
  onSave?: () => void;
  saved?: boolean;
}> = ({ title, icon, onBack, children, onSave, saved }) => (
  <div className="space-y-4">
    <div className="flex items-center gap-3">
      <button
        onClick={onBack}
        className="ds-btn ds-btn-ghost ds-btn-sm gap-1.5"
      >
        <ChevronRight className="w-4 h-4 rotate-180" />
        <span>Retour</span>
      </button>
      <div className="flex items-center gap-2">
        {icon}
        <h2 className="ds-page-title">{title}</h2>
      </div>
    </div>
    <div className="ds-card p-5 sm:p-6">
      {children}
    </div>
    {onSave && (
      <button
        onClick={onSave}
        className="ds-btn ds-btn-primary w-full gap-2"
      >
        <Save className="w-5 h-5" />
        <span>{saved ? 'Enregistré ✓' : 'Enregistrer'}</span>
      </button>
    )}
  </div>
);

// ─── Main Settings Page ───
const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { t, language, setLanguage, country, setCountry } = useLanguage();
  const [settings, setSettings] = useState<StoreSettings>(getStoreData(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS));
  const [saved, setSaved] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSection, setActiveSection] = useState<string | null>(null);

  // Security states
  const [authDisabled, setAuthDisabled] = useState(false);
  const [securityMessage, setSecurityMessage] = useState('');
  const [secureAuthForced, setSecureAuthForcedState] = useState(false);
  const [defaultAccountsDisabled, setDefaultAccountsDisabled] = useState({ admin: false, user: false });

  // Encryption states
  const [encryptionConfig, setEncryptionConfig] = useState<EncryptionConfig>({
    enabled: false, algorithm: 'AES', password: '', salt: FileEncryptionManager.generateSalt(),
  });
  const [showPasswordField, setShowPasswordField] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, level: 'weak' as any, feedback: [] as string[] });

  // Update states
  const [updateInfo, setUpdateInfo] = useState<UpdateCheckResult | null>(null);
  const [checkingUpdates, setCheckingUpdates] = useState(false);
  const [showUpdateNotification, setShowUpdateNotification] = useState(false);

  // Download manager
  const [dirStatus, setDirStatus] = useState<Record<string, boolean>>({});
  const [legacyDownloadMode, setLegacyDownloadMode] = useState(() => localStorage.getItem('casierdor_legacy_download') === 'true');

  // Export format
  const [selectedExportFormat, setSelectedExportFormat] = useState<FileFormat>(
    (localStorage.getItem('casierdor_export_format') as FileFormat) || FileFormat.JSON
  );

  // System config
  const [systemConfig, setSystemConfig] = useState({
    deviceType: 'auto' as 'desktop' | 'mobile' | 'tablet' | 'auto',
    operationMode: 'hybrid' as 'online' | 'offline' | 'hybrid',
  });

  const { pending, neverAsk, setNeverAsk, requestConfirm, cancel, confirm } = useConfirmAction();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const jsonImportRef = useRef<HTMLInputElement>(null);
  const { theme, toggleTheme, bgColor, bgImage, setBgColor, setBgImage } = useTheme();
  const isAdmin = settings.userRole === UserRole.ADMIN;

  useEffect(() => {
    setAuthDisabled(localStorage.getItem('auth_disabled') === 'true');
    setSecureAuthForcedState(localStorage.getItem('casierdor_secure_auth_forced') === 'true');
    setDefaultAccountsDisabled({
      admin: localStorage.getItem('casierdor_admin_disabled') === 'true',
      user: localStorage.getItem('casierdor_user_disabled') === 'true',
    });
  }, []);

  useEffect(() => {
    if (isAdmin && UpdateManager.shouldCheckForUpdates()) handleCheckUpdates();
  }, []);

  useEffect(() => {
    const loadDirStatus = async () => {
      const status = await checkDirectoryStatus();
      setDirStatus(status);
    };
    loadDirStatus();
  }, []);

  const handleSave = () => {
    const normalized = normalizeSettingsForSave(settings);
    setStoreData(STORAGE_KEYS.SETTINGS, normalized);
    setSettings(normalized);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  // ─── Handlers (preserved from original) ───
  const handleSecurityToggle = async () => {
    setIsProcessing(true);
    setSecurityMessage(authDisabled ? t('security.preparingAccount') : t('security.disablingSecurity'));
    try {
      await new Promise(r => setTimeout(r, 1000));
      if (authDisabled) {
        localStorage.removeItem('auth_disabled');
        setSecurityMessage(t('security.securityActivated'));
        setAuthDisabled(false);
        setTimeout(() => navigate('/login', { replace: true }), 2000);
      } else {
        localStorage.setItem('auth_disabled', 'true');
        setSecurityMessage(t('security.securityDisabled'));
        setAuthDisabled(true);
        setTimeout(() => window.location.reload(), 2000);
      }
    } catch { setSecurityMessage(t('security.error')); }
    finally {
      setIsProcessing(false);
      setTimeout(() => setSecurityMessage(''), 3000);
    }
  };

  const handleBackupData = async (forLogout = false) => {
    setIsProcessing(true);
    try {
      const hasPermission = await requestFilePermissions();
      if (!hasPermission) { alert(t('settings.permissionsDeniedBackup')); setIsProcessing(false); return; }
      const success = await performFullBackup(forLogout, settings);
      alert(success ? (forLogout ? t('settings.backupSuccessFirstLogout') : t('settings.backupSuccessFull')) : t('settings.backupError'));
    } catch { alert(t('settings.backupErrorGeneric')); }
    finally { setIsProcessing(false); }
  };

  const handleGenericExport = async () => {
    setIsProcessing(true);
    try {
      const allData: Record<string, unknown> = {};
      Object.values(STORAGE_KEYS).forEach(key => {
        const raw = localStorage.getItem(scopeStorageKey(key));
        allData[key] = raw ? JSON.parse(raw) : null;
      });
      await ExportService.exportData([allData], selectedExportFormat, `Kelasi_Export_${new Date().toISOString().slice(0, 10)}`, 'Kelasi Data Export');
      ArchiveService.archiveDocument('admin', DocumentType.EXPORT, `Kelasi_Export_${new Date().toISOString().slice(0, 10)}.${selectedExportFormat.toLowerCase()}`, selectedExportFormat, allData);
    } catch (e) { console.error(e); alert('Erreur lors de l\'export'); }
    finally { setIsProcessing(false); }
  };

  const handleGenericImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsProcessing(true);
    try {
      const formatMap: Record<string, FileFormat> = { json: FileFormat.JSON, xlsx: FileFormat.XLSX, txt: FileFormat.TXT };
      const ext = file.name.split('.').pop()?.toLowerCase() || 'json';
      const format = formatMap[ext] || FileFormat.JSON;
      const result = await ImportService.parseFile(file, format);
      if (result.success && result.data && result.data.length > 0) {
        requestConfirm({
          actionId: 'importDataGeneric',
          message: `Vous allez importer ${result.validRows} enregistrements. Voulez-vous continuer ?`,
          level: 2,
          run: () => {
            if (format === FileFormat.JSON) {
              const content = result.data[0];
              Object.entries(content).forEach(([key, value]) => {
                if (value !== null && value !== undefined) localStorage.setItem(scopeStorageKey(key), JSON.stringify(value));
              });
            } else { alert('Import spécifique pris en charge via le service, mappings à implémenter selon la structure.'); }
            ArchiveService.archiveDocument('admin', DocumentType.IMPORT, file.name, format, result.data);
            try { addActivity({ userName: settings.adminName || 'Admin', action: LogAction.IMPORT, details: `Importation du fichier : ${file.name}`, module: 'IMPORT' }); } catch (e) { console.warn(e); }
            alert('Import terminé avec succès.');
            window.location.reload();
          },
        });
      } else { alert(t('message.invalidFile') + (result.errors.length > 0 ? ': ' + result.errors[0].message : '')); }
    } catch { alert(t('message.invalidFile')); }
    finally { setIsProcessing(false); event.target.value = ''; }
  };

  const handleRestoreData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsProcessing(true);
    try {
      const hasPermission = await requestFilePermissions();
      if (!hasPermission) { alert(t('settings.permissionsDeniedRestore')); setIsProcessing(false); return; }
      const content = await restoreDataFromFile(file);
      if (!content) { alert(t('settings.invalidBackupFile')); setIsProcessing(false); return; }
      requestConfirm({
        actionId: 'restore_backup',
        title: t('settings.restoreWarning') || 'Attention',
        message: t('settings.restoreWarning'),
        level: 2,
        run: () => {
          Object.entries(content).forEach(([key, value]) => { if (value) localStorage.setItem(key, JSON.stringify(value)); });
          alert(t('settings.restoreSuccessRestart'));
          window.location.reload();
        },
      });
    } catch { alert(t('settings.restoreError')); }
    finally { setIsProcessing(false); event.target.value = ''; }
  };

  const handleCheckUpdates = async () => {
    setCheckingUpdates(true);
    try {
      const result = await UpdateManager.checkForUpdates();
      setUpdateInfo(result);
      setShowUpdateNotification(result.hasUpdate);
      alert(result.hasUpdate ? `✓ ${t('settings.versionAvailable', { version: result.latestVersion })}` : `✓ ${t('settings.isUpToDate')}`);
    } catch { alert(`✗ ${t('message.error')}`); }
    finally { setCheckingUpdates(false); }
  };

  const handleInstallUpdate = async () => {
    if (!updateInfo?.hasUpdate) { alert(t('settings.noUpdateAvailable')); return; }
    requestConfirm({
      actionId: 'install_update',
      title: t('settings.updatesTitle') || 'Mise à jour',
      message: t('settings.confirmInstallVersion', { version: updateInfo.latestVersion }),
      run: async () => { try { alert('✓ ' + (await UpdateManager.installUpdate())); } catch { alert(t('settings.installationError')); } },
    });
  };

  const handleToggleEncryption = () => setEncryptionConfig({ ...encryptionConfig, enabled: !encryptionConfig.enabled });
  const handlePasswordChange = (newPassword: string) => {
    setEncryptionConfig({ ...encryptionConfig, password: newPassword });
    setPasswordStrength(FileEncryptionManager.validatePasswordStrength(newPassword));
  };
  const handleAlgorithmChange = (algo: 'AES' | 'DES' | 'SHA256') => setEncryptionConfig({ ...encryptionConfig, algorithm: algo });
  const handleTestEncryption = async () => {
    if (!encryptionConfig.password) { alert(t('settings.enterPassword')); return; }
    try {
      const testData = 'Test Casier d\'Or-Données sensibles';
      const encrypted = FileEncryptionManager.encryptAES(testData, encryptionConfig.password);
      const decrypted = FileEncryptionManager.decryptAES(encrypted, encryptionConfig.password);
      alert(decrypted === testData ? t('settings.encryptionSuccess') : t('settings.decryptionError'));
    } catch (error) { alert(t('settings.testError', { error: error instanceof Error ? error.message : t('message.error') })); }
  };

  const handleRepairFolders = async () => {
    setIsProcessing(true);
    await initDirectoryStructure();
    setDirStatus(await checkDirectoryStatus());
    setIsProcessing(false);
    alert(t('message.success'));
  };

  // ─── Section definitions ───
  const sections = [
    { id: 'general', icon: <Building className="w-5 h-5" />, color: 'text-blue-600', bg: 'rgba(31,79,216,0.10)', title: t('settings.generalInfo'), subtitle: t('settings.generalInfoDesc'), adminOnly: false },
    { id: 'logo', icon: <Image className="w-5 h-5" />, color: 'text-amber-600', bg: 'rgba(245,158,11,0.10)', title: t('settings.logoLabel'), subtitle: t('settings.logoDesc'), adminOnly: false },
    { id: 'role', icon: <UserCog className="w-5 h-5" />, color: 'text-indigo-600', bg: 'rgba(99,102,241,0.10)', title: t('settings.rolePermissions'), subtitle: t('settings.accessConfiguration'), adminOnly: false },
    { id: 'receipt', icon: <Receipt className="w-5 h-5" />, color: 'text-purple-600', bg: 'rgba(147,51,234,0.10)', title: 'Reçus & Tickets', subtitle: 'Configuration des reçus', adminOnly: false },
    { id: 'modules', icon: <ListChecks className="w-5 h-5" />, color: 'text-teal-600', bg: 'rgba(20,184,166,0.10)', title: 'Gestion des Modules', subtitle: 'Activer/désactiver les modules', adminOnly: true },
    { id: 'language', icon: <Languages className="w-5 h-5" />, color: 'text-cyan-600', bg: 'rgba(6,182,212,0.10)', title: 'Langue & Pays', subtitle: 'Langue de l\'application', adminOnly: true },
    { id: 'appearance', icon: <Palette className="w-5 h-5" />, color: 'text-pink-600', bg: 'rgba(236,72,153,0.10)', title: 'Apparence', subtitle: 'Thème clair/sombre, fond', adminOnly: true },
    { id: 'audit', icon: <ShieldCheck className="w-5 h-5" />, color: 'text-green-600', bg: 'rgba(22,163,74,0.10)', title: 'Audit & Traçabilité', subtitle: 'Configuration de l\'audit', adminOnly: true },
    { id: 'security-files', icon: <Lock className="w-5 h-5" />, color: 'text-blue-600', bg: 'rgba(31,79,216,0.10)', title: 'Sécurité des Fichiers', subtitle: 'Chiffrement des exports', adminOnly: true },
    { id: 'security-auth', icon: <Shield className="w-5 h-5" />, color: 'text-red-600', bg: 'rgba(220,38,38,0.10)', title: 'Sécurité & Authentification', subtitle: 'Activer/désactiver l\'auth', adminOnly: true },
    { id: 'data-transfer', icon: <Cloud className="w-5 h-5" />, color: 'text-indigo-600', bg: 'rgba(99,102,241,0.10)', title: 'Sauvegarde & Transfert', subtitle: 'Export, import, restauration', adminOnly: true },
    { id: 'downloads', icon: <FolderDown className="w-5 h-5" />, color: 'text-blue-600', bg: 'rgba(31,79,216,0.10)', title: t('settings.downloadManager'), subtitle: 'Gestion des dossiers', adminOnly: true },
    { id: 'updates', icon: <RefreshCw className="w-5 h-5" />, color: 'text-purple-600', bg: 'rgba(147,51,234,0.10)', title: t('settings.updatesTitle'), subtitle: 'Vérifier les mises à jour', adminOnly: true },
    { id: 'system', icon: <Settings2 className="w-5 h-5" />, color: 'text-gray-600', bg: 'rgba(107,114,128,0.10)', title: 'Configuration Système', subtitle: 'Appareil, mode, langue', adminOnly: true },
    { id: 'maintenance', icon: <Database className="w-5 h-5" />, color: 'text-purple-600', bg: 'rgba(147,51,234,0.10)', title: t('settings.maintenance'), subtitle: 'Nettoyage, données de test', adminOnly: true },
  ];

  const filteredSections = sections.filter(s =>
    (!s.adminOnly || isAdmin) &&
    (!searchQuery || s.title.toLowerCase().includes(searchQuery) || s.subtitle.toLowerCase().includes(searchQuery))
  );

  // ─── Render active section content ───
  const renderSection = (id: string) => {
    const section = sections.find(s => s.id === id)!;
    switch (id) {
      case 'general':
        return <GeneralInfoSection settings={settings} onChange={setSettings} />;
      case 'logo':
        return <LogoSection settings={settings} onChange={setSettings} />;
      case 'role':
        return <RoleSection settings={settings} onChange={setSettings} />;
      case 'receipt':
        return <ReceiptSettings settings={settings} onChange={setSettings} />;
      case 'modules':
        return <SettingsModuleManager settings={settings} onChange={setSettings} />;
      case 'language':
        return <LanguageSettings />;
      case 'appearance':
        return <AppearanceSettings />;
      case 'audit':
        return <AuditSettings settings={settings} onChange={setSettings} />;
      case 'security-files':
        return (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex-1">
                <p className="font-bold text-[var(--c-text)] text-sm">{t('settings.enableEncryption')}</p>
                <p className="text-xs text-[var(--c-text-3)]">{t('settings.encryptionHint')}</p>
              </div>
              <button type="button" onClick={handleToggleEncryption}
                className={`w-16 h-8 rounded-full relative transition-colors flex-shrink-0 ${encryptionConfig.enabled ? 'bg-green-600' : 'bg-gray-300'}`}>
                <div className={`absolute top-1 bg-white w-6 h-6 rounded-full transition-all ${encryptionConfig.enabled ? 'left-9' : 'left-1'}`} />
              </button>
            </div>
            {encryptionConfig.enabled && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-[var(--c-text-2)] flex items-center"><Key className="w-4 h-4 mr-2" />{t('settings.encryptionPassword')}</label>
                  <input type={showPasswordField ? 'text' : 'password'} value={encryptionConfig.password}
                    onChange={e => handlePasswordChange(e.target.value)} placeholder={t('settings.encryptionPasswordPlaceholder')}
                    className="ds-input" />
                  <button type="button" onClick={() => setShowPasswordField(!showPasswordField)}
                    className="text-xs text-[var(--c-brand)] flex items-center gap-1">
                    {showPasswordField ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    {showPasswordField ? t('settings.hide') : t('settings.show')}
                  </button>
                  {encryptionConfig.password && (
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div className={`h-full transition-all ${passwordStrength.score === 0 ? 'bg-red-500 w-1/5' : passwordStrength.score === 1 ? 'bg-orange-500 w-2/5' : passwordStrength.score === 2 ? 'bg-yellow-500 w-3/5' : passwordStrength.score === 3 ? 'bg-lime-500 w-4/5' : 'bg-green-500 w-full'}`} />
                        </div>
                        <span className="text-xs font-bold uppercase text-[var(--c-text-2)]">{passwordStrength.level}</span>
                      </div>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-[var(--c-text-2)] flex items-center"><Lock className="w-4 h-4 mr-2" />{t('settings.encryptionAlgo')}</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['AES', 'DES', 'SHA256'].map(algo => (
                      <button key={algo} type="button" onClick={() => handleAlgorithmChange(algo as any)}
                        className={`py-3 rounded-xl text-xs font-bold uppercase transition-all border ${encryptionConfig.algorithm === algo ? 'bg-[var(--c-brand)] text-white border-[var(--c-brand)]' : 'bg-[var(--c-surface-2)] text-[var(--c-text-2)] border-[var(--c-border)]'}`}>
                        {algo}
                      </button>
                    ))}
                  </div>
                </div>
                <button type="button" onClick={handleTestEncryption}
                  className="ds-btn ds-btn-primary w-full gap-2">
                  <CheckCircle2 className="w-4 h-4" />{t('settings.testEncryption')}
                </button>
              </>
            )}
          </div>
        );
      case 'security-auth':
        return (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex-1">
                <h4 className="font-bold text-[var(--c-text)] text-sm">{authDisabled ? t('settings.enableAuth') : t('settings.disableAuth')}</h4>
                <p className="text-xs text-[var(--c-text-3)]">{authDisabled ? t('settings.authHintDisabled') : t('settings.authHintEnabled')}</p>
              </div>
              <button type="button" onClick={handleSecurityToggle} disabled={isProcessing}
                className={`ds-btn ${authDisabled ? 'ds-btn-primary' : 'ds-btn-danger'} gap-2`}>
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : authDisabled ? <Shield className="w-4 h-4" /> : <ShieldOff className="w-4 h-4" />}
                {authDisabled ? 'Activer' : 'Désactiver'}
              </button>
            </div>
            {securityMessage && (
              <div className={`ds-alert ${securityMessage.includes('succès') ? 'ds-alert-success' : 'ds-alert-info'}`}>
                {securityMessage.includes('succès') ? <CheckCircle2 className="w-4 h-4" /> : <Loader2 className="w-4 h-4 animate-spin" />}
                <span className="text-sm">{securityMessage}</span>
              </div>
            )}
            {!authDisabled && (
              <>
                <div className="flex items-center justify-between pt-4 border-t border-[var(--c-border)]">
                  <div className="flex-1 pr-4">
                    <p className="text-xs font-bold text-[var(--c-text)]">{t('settings.forceAuth')}</p>
                    <p className="text-[10px] text-[var(--c-text-3)] italic">{t('settings.forceAuthHint')}</p>
                  </div>
                  <button type="button" onClick={() => {
                    const v = !secureAuthForced; setSecureAuthForcedState(v);
                    if (v) localStorage.setItem('casierdor_secure_auth_forced', 'true');
                    else localStorage.removeItem('casierdor_secure_auth_forced');
                  }} className={`w-12 h-6 rounded-full relative transition-colors ${secureAuthForced ? 'bg-orange-600' : 'bg-gray-300'}`}>
                    <div className={`absolute top-1 bg-white w-4 h-4 rounded-full transition-all ${secureAuthForced ? 'left-7' : 'left-1'}`} />
                  </button>
                </div>
                {isAdmin && (
                  <div className="space-y-3 pt-4 border-t border-[var(--c-border)]">
                    <p className="text-xs font-bold text-[var(--c-text)] uppercase">{t('settings.defaultAccounts')}</p>
                    <div className="grid grid-cols-2 gap-2">
                      {(['admin', 'user'] as const).map(role => (
                        <button key={role} type="button" onClick={() => {
                          const v = !defaultAccountsDisabled[role];
                          setDefaultAccountsDisabled(prev => ({ ...prev, [role]: v }));
                          localStorage.setItem(`casierdor_${role}_disabled`, v.toString());
                        }} className={`flex items-center justify-between p-3 rounded-xl border ${defaultAccountsDisabled[role] ? 'bg-orange-50 border-orange-200 text-orange-700' : 'bg-green-50 border-green-200 text-green-700'}`}>
                          <span className="text-[10px] font-black uppercase">{role === 'admin' ? 'Admin' : 'User'}</span>
                          {defaultAccountsDisabled[role] ? <ShieldOff className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        );
      case 'data-transfer':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button onClick={() => handleBackupData(false)} disabled={isProcessing}
                className="ds-btn ds-btn-primary gap-2">
                <Download className="w-4 h-4" />{t('settings.backupFull') || 'Sauvegarde complète'}
              </button>
              <button onClick={() => handleBackupData(true)} disabled={isProcessing}
                className="ds-btn ds-btn-secondary gap-2">
                <Upload className="w-4 h-4" />{t('settings.backupForLogout') || 'Sauvegarde + Déconnexion'}
              </button>
              <button onClick={handleGenericExport} disabled={isProcessing}
                className="ds-btn ds-btn-secondary gap-2">
                <FileJson className="w-4 h-4" />Export générique
              </button>
              <button onClick={() => jsonImportRef.current?.click()} disabled={isProcessing}
                className="ds-btn ds-btn-secondary gap-2">
                <UploadCloud className="w-4 h-4" />Import générique
              </button>
              <button onClick={() => fileInputRef.current?.click()} disabled={isProcessing}
                className="ds-btn ds-btn-secondary gap-2">
                <RotateCw className="w-4 h-4" />{t('settings.restoreData') || 'Restaurer'}
              </button>
            </div>
            <input type="file" ref={fileInputRef} onChange={handleRestoreData} accept=".json,.bak" className="hidden" />
            <input type="file" ref={jsonImportRef} onChange={handleGenericImport} accept=".json,.xlsx,.txt" className="hidden" />
            <div className="pt-4 border-t border-[var(--c-border)]">
              <p className="text-xs text-[var(--c-text-3)] mb-2">Format d'export par défaut</p>
              <div className="flex gap-2">
                {([FileFormat.JSON, FileFormat.XLSX, FileFormat.TXT] as FileFormat[]).map(fmt => (
                  <button key={fmt} onClick={() => { setSelectedExportFormat(fmt); localStorage.setItem('casierdor_export_format', fmt); }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all border ${selectedExportFormat === fmt ? 'bg-[var(--c-brand)] text-white border-[var(--c-brand)]' : 'bg-[var(--c-surface-2)] text-[var(--c-text-2)] border-[var(--c-border)]'}`}>
                    {fmt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );
      case 'downloads':
        return (
          <div className="space-y-6">
            <div>
              <h4 className="text-[10px] font-black text-[var(--c-brand)] uppercase tracking-widest mb-4 flex items-center"><HardDrive className="w-3 h-3 mr-2" />{t('settings.dmFolderStatus')}</h4>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries({ 'Main App': dirStatus.main, Downloads: dirStatus.downloads, Backups: dirStatus.backups, Updates: dirStatus.updates }).map(([name, exists]) => (
                  <div key={name} className={`flex items-center justify-between p-3 rounded-xl border ${exists ? 'bg-[var(--c-surface-2)] border-[var(--c-border)] text-[var(--c-text)]' : 'bg-[var(--c-error-bg)] border-[var(--c-error)]/20 text-[var(--c-error)]'}`}>
                    <span className="text-[10px] font-bold uppercase">{name}</span>
                    {exists ? <CheckCircle2 className="w-4 h-4 text-[var(--c-success)]" /> : <XCircle className="w-4 h-4" />}
                  </div>
                ))}
              </div>
            </div>
            <div className="pt-4 border-t border-[var(--c-border)]">
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <h4 className="text-xs font-bold text-[var(--c-text)] mb-1">{t('settings.dmRepair')}</h4>
                  <p className="text-[10px] text-[var(--c-text-3)]">{t('settings.dmRepairInfo')}</p>
                </div>
                <button onClick={handleRepairFolders} disabled={isProcessing} className="ds-btn ds-btn-secondary ds-btn-icon">
                  <Wrench className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="pt-4 border-t border-[var(--c-border)]">
              <label className="flex items-center justify-between cursor-pointer">
                <div className="flex-1">
                  <h4 className="text-xs font-bold text-[var(--c-text)] mb-1">{t('settings.dmAdvanced')}</h4>
                  <p className="text-[10px] text-[var(--c-text-3)]">{t('settings.dmLegacyInfo')}</p>
                </div>
                <div className="relative inline-flex items-center">
                  <input type="checkbox" checked={legacyDownloadMode} onChange={e => { setLegacyDownloadMode(e.target.checked); localStorage.setItem('casierdor_legacy_download', e.target.checked.toString()); }} className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-[var(--c-brand)] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full" />
                </div>
              </label>
            </div>
          </div>
        );
      case 'updates':
        return (
          <div className="space-y-4">
            {updateInfo ? (
              <div className={`ds-alert ${updateInfo.hasUpdate ? 'ds-alert-error' : 'ds-alert-success'}`}>
                {updateInfo.hasUpdate ? <AlertCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                <div>
                  <p className="font-bold text-sm">{updateInfo.hasUpdate ? `Version ${updateInfo.latestVersion} disponible!` : 'Vous êtes à jour!'}</p>
                  <p className="text-xs">Version actuelle: v{updateInfo.currentVersion}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-[var(--c-text-3)]">Cliquez sur "Vérifier" pour voir l'état</p>
            )}
            <div className="grid grid-cols-2 gap-3">
              <button onClick={handleCheckUpdates} disabled={checkingUpdates} className="ds-btn ds-btn-primary gap-2">
                <RefreshCw className={`w-4 h-4 ${checkingUpdates ? 'animate-spin' : ''}`} />{checkingUpdates ? 'Vérification...' : 'Vérifier'}
              </button>
              {updateInfo?.hasUpdate && (
                <button onClick={handleInstallUpdate} className="ds-btn ds-btn-secondary gap-2">
                  <Download className="w-4 h-4" />Installer
                </button>
              )}
            </div>
          </div>
        );
      case 'system':
        return <SystemConfig onConfigChange={c => { setSystemConfig(c); localStorage.setItem('systemConfig', JSON.stringify(c)); }} />;
      case 'maintenance':
        return (
          <div className="space-y-4">
            <p className="text-xs text-[var(--c-text-3)] leading-relaxed">Les archives temporelles (J, S, M, A) sont générées chaque jour à minuit. Seul un Administrateur peut gérer les sauvegardes.</p>
            {isAdmin && (
              <div className="p-4 rounded-2xl border border-amber-100 bg-amber-50/50 space-y-3">
                <p className="text-sm font-bold text-[var(--c-text)]">{t('testData.cleanupTitle')}</p>
                <p className="text-xs text-[var(--c-text-2)]">{t('testData.cleanupDesc')}</p>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={settings.enableTestAccounts === true}
                    onChange={e => setSettings({ ...settings, enableTestAccounts: e.target.checked })}
                    className="rounded accent-blue-600" />
                  {t('testData.enableTestAccounts')}
                </label>
                <button onClick={() => requestConfirm({
                  actionId: 'cleanupTestData', message: t('testData.cleanupConfirm') || 'Confirmer le nettoyage?', level: 2,
                  run: () => { const r = runFullTestDataCleanup(); alert(t('testData.cleanupDone', { products: r.productsRemoved, clients: r.clientsRemoved, users: r.testUsersRemoved })); },
                })} className="ds-btn ds-btn-danger gap-2">
                  <Trash2 className="w-4 h-4" />{t('testData.cleanupBtn') || 'Nettoyer'}
                </button>
              </div>
            )}
            <div className="pt-4 border-t border-[var(--c-border)]">
              <button onClick={() => requestConfirm({
                actionId: 'resetAll', message: t('confirm.resetAll'), level: 2,
                run: () => { clearAllData(); alert(t('message.success')); window.location.reload(); },
              })} className="ds-btn ds-btn-danger w-full gap-2">
                <Trash2 className="w-4 h-4" />{t('settings.resetAllData') || 'Réinitialiser toutes les données'}
              </button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  // ─── Main render ───
  if (activeSection) {
    const section = sections.find(s => s.id === activeSection)!;
    return (
      <div className="space-y-4 overflow-x-hidden max-w-full">
        <SectionView
          title={section.title}
          icon={<div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: section.bg }}>{React.cloneElement(section.icon as React.ReactElement, { className: 'w-4 h-4' })}</div>}
          onBack={() => setActiveSection(null)}
          onSave={['general', 'logo', 'role', 'receipt', 'modules', 'audit'].includes(activeSection) ? handleSave : undefined}
          saved={saved}
        >
          {renderSection(activeSection)}
        </SectionView>
        <ConfirmActionModal open={!!pending} actionId={pending?.actionId ?? ''} message={pending?.message ?? ''} level={pending?.level} neverAsk={neverAsk} onNeverAskChange={setNeverAsk} onCancel={cancel} onConfirm={confirm} />
      </div>
    );
  }

  return (
    <div className="space-y-6 overflow-x-hidden max-w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div className="flex items-center space-x-4">
          <PageBackButton />
          <div>
            <h1 className="ds-page-title">{t('settings.title')}</h1>
            <p className="ds-page-subtitle mt-1">{t('settings.store')}</p>
          </div>
        </div>
        {isAdmin && (
          <div className="flex items-center gap-2 px-3 py-2 bg-[var(--c-success-bg)] border border-[var(--c-success)]/20 rounded-xl text-[var(--c-success)] self-start">
            <ShieldCheck className="w-4 h-4" />
            <span className="text-xs font-bold uppercase">{t('settings.sessionAdmin')}</span>
          </div>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <div className="flex items-center bg-[var(--c-surface-2)] border border-[var(--c-border)] rounded-2xl px-4 py-3 focus-within:ring-2 focus-within:ring-[var(--c-brand)]">
          <Search className="w-5 h-5 text-[var(--c-text-3)]" />
          <input type="text" placeholder={t('action.search') + '...'} value={searchQuery}
            onChange={e => setSearchQuery(e.target.value.toLowerCase())}
            className="flex-1 ml-3 outline-none bg-transparent text-sm placeholder-[var(--c-text-3)]" />
          {searchQuery && <button onClick={() => setSearchQuery('')} className="text-[var(--c-text-3)]"><X className="w-4 h-4" /></button>}
        </div>
      </div>

      {/* Section cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {filteredSections.map(s => (
          <SettingsSectionCard
            key={s.id}
            icon={React.cloneElement(s.icon as React.ReactElement, { className: `w-5 h-5 ${s.color}` })}
            title={s.title}
            subtitle={s.subtitle}
            color={s.color}
            bgColor={s.bg}
            onClick={() => setActiveSection(s.id)}
          />
        ))}
      </div>

      {/* Save bar (always visible for form-based settings) */}
      <div className="flex items-center justify-between gap-4 pt-4 border-t border-[var(--c-border)]">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => setSettings({ ...settings, stockEnabled: !settings.stockEnabled })}
            className={`w-12 h-6 rounded-full relative transition-colors ${settings.stockEnabled ? 'bg-[var(--c-brand)]' : 'bg-gray-300'}`}>
            <div className={`absolute top-1 bg-white w-4 h-4 rounded-full transition-all ${settings.stockEnabled ? 'left-7' : 'left-1'}`} />
          </button>
          <span className="text-[10px] font-bold text-[var(--c-text-3)] uppercase tracking-widest">{t('settings.autoStock')}</span>
        </div>
        <button onClick={handleSave} className="ds-btn ds-btn-primary gap-2">
          <Save className="w-5 h-5" /><span>{saved ? 'Enregistré ✓' : t('button.save')}</span>
        </button>
      </div>

      <ConfirmActionModal open={!!pending} actionId={pending?.actionId ?? ''} message={pending?.message ?? ''} level={pending?.level} neverAsk={neverAsk} onNeverAskChange={setNeverAsk} onCancel={cancel} onConfirm={confirm} />
    </div>
  );
};

export default SettingsPage;
