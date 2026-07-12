/**
 * Isolation des données localStorage par compte / établissement
 */

import { STORAGE_KEYS } from '../store';
import type { User } from '../types';

const ACTIVE_SCOPE_KEY = 'casier_active_storage_scope';
const MIGRATED_PREFIX = 'casier_migrated_scope_';

/** Clés jamais préfixées (auth globale, secrets installation) */
const GLOBAL_STORAGE_KEYS = new Set([
  'casierdor_users',
  'casier_auth_user',
  'casier_auth_token',
  'casier_auth_remember',
  'casier_auth_connection_mode',
  'casier_auth_device_type',
  'casier_installation_secret',
  'casier_recent_modules',
  'casier_confirm_prefs',
  'neverAskAgain',
  ACTIVE_SCOPE_KEY,
]);

export function isGlobalStorageKey(key: string): boolean {
  if (GLOBAL_STORAGE_KEYS.has(key)) return true;
  if (key.startsWith(MIGRATED_PREFIX)) return true;
  if (key.startsWith('casierdor_recovery')) return true;
  return false;
}

export function getActiveStorageScope(): string | null {
  return localStorage.getItem(ACTIVE_SCOPE_KEY);
}

export function setActiveStorageScope(scopeId: string | null): void {
  if (scopeId) localStorage.setItem(ACTIVE_SCOPE_KEY, scopeId);
  else localStorage.removeItem(ACTIVE_SCOPE_KEY);
}

/** Clé effective pour lecture/écriture store */
export function scopeStorageKey(baseKey: string): string {
  if (isGlobalStorageKey(baseKey)) return baseKey;
  const scope = getActiveStorageScope();
  if (!scope) return baseKey;
  return `${baseKey}::${scope}`;
}

export function resolveStorageScopeId(user: User): string {
  return user.storageAccountId?.trim() || user.id;
}

/** Copie les données legacy (sans scope) vers le scope du compte, une seule fois */
export function migrateLegacyStoreToScope(scopeId: string): void {
  const flag = `${MIGRATED_PREFIX}${scopeId}`;
  if (localStorage.getItem(flag)) return;

  const prevScope = getActiveStorageScope();
  setActiveStorageScope(scopeId);

  for (const baseKey of Object.values(STORAGE_KEYS)) {
    const scopedKey = `${baseKey}::${scopeId}`;
    if (localStorage.getItem(scopedKey)) continue;

    const legacy = localStorage.getItem(baseKey);
    if (legacy != null) {
      localStorage.setItem(scopedKey, legacy);
    }
  }

  if (prevScope && prevScope !== scopeId) {
    setActiveStorageScope(prevScope);
  } else {
    setActiveStorageScope(scopeId);
  }

  localStorage.setItem(flag, new Date().toISOString());
}

export function activateStorageForUser(user: User): void {
  const scopeId = resolveStorageScopeId(user);
  setActiveStorageScope(scopeId);
  migrateLegacyStoreToScope(scopeId);
}

export function clearActiveStorageScope(): void {
  setActiveStorageScope(null);
}
