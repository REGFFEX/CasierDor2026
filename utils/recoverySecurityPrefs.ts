import { getStoreData, setStoreData, STORAGE_KEYS, DEFAULT_SETTINGS } from '../store';
import { RecoverySecurityPrefs, StoreSettings } from '../types';

const DEFAULT_PREFS: RecoverySecurityPrefs = {
  requireManualKeyAfterUpload: false,
  useKeyFilePassword: false,
};

export function getRecoverySecurityPrefs(): RecoverySecurityPrefs {
  const settings = getStoreData<StoreSettings>(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
  return { ...DEFAULT_PREFS, ...settings.recoverySecurityPrefs };
}

export function setRecoverySecurityPrefs(prefs: Partial<RecoverySecurityPrefs>): RecoverySecurityPrefs {
  const settings = getStoreData<StoreSettings>(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
  const merged = { ...DEFAULT_PREFS, ...settings.recoverySecurityPrefs, ...prefs };
  setStoreData(STORAGE_KEYS.SETTINGS, {
    ...settings,
    recoverySecurityPrefs: merged,
    updatedAt: Date.now(),
  });
  return merged;
}
