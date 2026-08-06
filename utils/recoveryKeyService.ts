/**
 * Service haut niveau — clés de récupération
 */

import {
  createRecoveryKeyFile,
  parseRecoveryKeyFile,
  hashRecoveryKeyForStorage,
  verifyRecoveryKeyAgainstStorage,
  migrateRecoveryConfigIfNeeded,
  validateRecoveryKeyChecksum,
  generateRecoveryKey,
  ensureInstallationSecret,
  CRYPTO_CONSTANTS,
  type RecoveryFilePayload,
} from './cryptoVault';
import { isLockedRecoveryKeyFile } from './cryptoVault';
import { getStoreData, setStoreData, STORAGE_KEYS, DEFAULT_SETTINGS } from '../store';
import { RecoveryConfig, StoreSettings } from '../types';
import { authService } from './authService';
import { getRecoverySecurityPrefs } from './recoverySecurityPrefs';

export type LoadRecoveryKeyResult = {
  recoveryKey?: string;
  needsFilePassword?: boolean;
  requiresManualEntry?: boolean;
  fileLoaded?: boolean;
};

const LAST_KEY_PATH_KEY = 'casierdor_last_key_save_hint';

export { generateRecoveryKey, validateRecoveryKeyChecksum, CRYPTO_CONSTANTS };

export async function registerRecoveryKey(
  recoveryKey: string,
  method: 'key' | 'both' = 'key'
): Promise<RecoveryConfig> {
  const admin = authService.findPrimaryAdmin();
  const accountId = admin?.id || 'default-account';
  const hashed = await hashRecoveryKeyForStorage(recoveryKey, accountId);

  const config: RecoveryConfig = {
    method,
    ...hashed,
    keyUsedAt: undefined,
  };

  const settings = getStoreData<StoreSettings>(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
  setStoreData(STORAGE_KEYS.SETTINGS, {
    ...settings,
    recoveryConfig: config,
    updatedAt: Date.now(),
  });

  return config;
}

export async function validateRecoveryKey(recoveryKey: string): Promise<boolean> {
  const settings = getStoreData<StoreSettings>(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
  const config = settings.recoveryConfig;
  if (!config) return false;
  if (config.keyUsedAt) return false;

  const admin = authService.findPrimaryAdmin();
  const accountId = admin?.id || 'default-account';

  const migrated = await migrateRecoveryConfigIfNeeded(config, accountId);
  if (migrated !== config && migrated) {
    setStoreData(STORAGE_KEYS.SETTINGS, { ...settings, recoveryConfig: migrated });
  }

  const active = migrated || config;

  if (active.keyHash && active.keySalt) {
    if (!validateRecoveryKeyChecksum(recoveryKey) && recoveryKey.includes('CDOR')) {
      return false;
    }
    return verifyRecoveryKeyAgainstStorage(recoveryKey, accountId, active.keyHash, active.keySalt);
  }

  if (active.key) {
    const norm = recoveryKey.replace(/[\s-]/g, '').toUpperCase();
    const stored = active.key.replace(/[\s-]/g, '').toUpperCase();
    return norm.includes(stored) || stored.includes(norm);
  }

  return false;
}

export async function rotateRecoveryKey(
  newRecoveryKey: string,
  method: 'key' | 'both' | 'email' = 'key'
): Promise<RecoveryConfig> {
  const settings = getStoreData<StoreSettings>(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
  const admin = authService.findPrimaryAdmin();
  const accountId = admin?.id || 'default-account';
  const hashed = await hashRecoveryKeyForStorage(newRecoveryKey, accountId);

  const config: RecoveryConfig = {
    method: settings.recoveryConfig?.method || method,
    ...hashed,
  };

  setStoreData(STORAGE_KEYS.SETTINGS, {
    ...settings,
    recoveryConfig: config,
    updatedAt: Date.now(),
  });

  return config;
}

export async function saveRecoveryKeyFile(
  recoveryKey: string,
  method?: string,
  filePassword?: string
): Promise<boolean> {
  const admin = authService.findPrimaryAdmin();
  const payload: RecoveryFilePayload = {
    accountId: admin?.id || 'default-account',
    emailHint: admin?.email ? admin.email.replace(/(.{2}).*(@.*)/, '$1***$2') : '***',
    issuedAt: Date.now(),
    keyVersion: CRYPTO_CONSTANTS.RECOVERY_FILE_VERSION,
    method: method || 'key',
  };

  const prefs = getRecoverySecurityPrefs();
  const pwd = prefs.useKeyFilePassword ? filePassword : undefined;
  if (prefs.useKeyFilePassword && (!pwd || pwd.length < 4)) {
    return false;
  }

  const content = await createRecoveryKeyFile(payload, recoveryKey, pwd);
  const filename = `casierdor-recovery-${(admin?.email || 'account').replace(/[@.]/g, '_')}.key`;

  const picker = (window as { showSaveFilePicker?: (opts: unknown) => Promise<FileSystemFileHandle> }).showSaveFilePicker;
  if (typeof picker === 'function') {
    try {
      const handle = await picker({
        suggestedName: filename,
        types: [{ description: "Casier d'Or Recovery Key", accept: { 'application/json': ['.key'] } }],
      });
      const writable = await handle.createWritable();
      await writable.write(content);
      await writable.close();
      localStorage.setItem(LAST_KEY_PATH_KEY, handle.name || filename);
      return true;
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') return false;
      console.warn('showSaveFilePicker failed, falling back to classic download', err);
      // Fallback
    }
  }

  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  localStorage.setItem(LAST_KEY_PATH_KEY, filename);
  return true;
}

export async function loadRecoveryKeyFromFile(
  content: string,
  filePassword?: string
): Promise<LoadRecoveryKeyResult> {
  const prefs = getRecoverySecurityPrefs();

  if (isLockedRecoveryKeyFile(content) && !filePassword) {
    return { needsFilePassword: true, fileLoaded: true };
  }

  const parsed = await parseRecoveryKeyFile(content, filePassword);
  if (parsed.needsFilePassword) {
    return { needsFilePassword: true, fileLoaded: true };
  }

  if (!parsed.recoveryKey) {
    return { fileLoaded: true };
  }

  if (prefs.requireManualKeyAfterUpload) {
    return { requiresManualEntry: true, fileLoaded: true };
  }

  return { recoveryKey: parsed.recoveryKey, fileLoaded: true };
}

export { getRecoverySecurityPrefs, setRecoverySecurityPrefs } from './recoverySecurityPrefs';

export function getLastKeySaveHint(): string | null {
  return localStorage.getItem(LAST_KEY_PATH_KEY);
}

export function getUserDisplayName(user?: {
  firstName?: string;
  lastName?: string;
  name?: string;
  displayName?: string;
} | null): string {
  if (!user) return '';
  if (user.displayName) return user.displayName;
  if (user.firstName) {
    return user.lastName ? `${user.firstName} ${user.lastName}` : user.firstName;
  }
  return user.name || '';
}

/** Migration au démarrage de l'app */
export async function runSecurityMigration(): Promise<void> {
  ensureInstallationSecret();

  const settings = getStoreData<StoreSettings>(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
  if (!settings.recoveryConfig?.key) return;

  const admin = authService.findPrimaryAdmin();
  const accountId = admin?.id || 'default-account';
  const migrated = await migrateRecoveryConfigIfNeeded(settings.recoveryConfig, accountId);
  if (migrated && migrated !== settings.recoveryConfig) {
    setStoreData(STORAGE_KEYS.SETTINGS, { ...settings, recoveryConfig: migrated, updatedAt: Date.now() });
  }
}
