/**
 * Dossier racine choisi par l'utilisateur pour archives, exports, clés, etc.
 */

import { getStoreData, setStoreData, STORAGE_KEYS, DEFAULT_SETTINGS } from '../store';
import type { StoreSettings } from '../types';
import { SYSTEM_DIRS, initDirectoryStructure } from './fileManager';

export const STORAGE_SUBFOLDERS = [
  'Archives',
  'Backups',
  'Exports',
  'Receipts',
  'RecoveryKeys',
  'Updates',
] as const;

const LEGACY_KEY = 'casierdor_storage_root';

export function getStorageSettings(): Pick<
  StoreSettings,
  'storageRootPath' | 'storageRootLabel' | 'storageConfigured'
> {
  const s = getStoreData<StoreSettings>(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
  const legacy = localStorage.getItem(LEGACY_KEY);
  return {
    storageRootPath: s.storageRootPath || legacy || undefined,
    storageRootLabel: s.storageRootLabel || s.storageRootPath || legacy || undefined,
    storageConfigured: s.storageConfigured === true || !!legacy,
  };
}

export function isStorageConfigured(): boolean {
  return getStorageSettings().storageConfigured === true;
}

export function saveStorageRoot(label: string, pathHint?: string): StoreSettings {
  const current = getStoreData<StoreSettings>(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
  const updated: StoreSettings = {
    ...current,
    storageRootPath: pathHint || label,
    storageRootLabel: label,
    storageConfigured: true,
    updatedAt: Date.now(),
  };
  setStoreData(STORAGE_KEYS.SETTINGS, updated);
  localStorage.setItem(LEGACY_KEY, label);
  return updated;
}

/** Demande à l'utilisateur de choisir un dossier (navigateur moderne) */
export async function pickStorageDirectory(): Promise<{ label: string; pathHint?: string } | null> {
  try {
    const w = window as Window & {
      showDirectoryPicker?: (options?: any) => Promise<FileSystemDirectoryHandle>;
    };
    if (w.showDirectoryPicker) {
      const handle = await w.showDirectoryPicker({ mode: 'readwrite' });
      await ensureSubfoldersInHandle(handle);
      return { label: handle.name, pathHint: handle.name };
    }
  } catch (e) {
    if ((e as Error).name === 'AbortError') return null;
    console.warn('Directory picker:', e);
  }

  await initDirectoryStructure();
  return { label: SYSTEM_DIRS.MAIN, pathHint: SYSTEM_DIRS.MAIN };
}

async function ensureSubfoldersInHandle(root: FileSystemDirectoryHandle): Promise<void> {
  for (const name of STORAGE_SUBFOLDERS) {
    try {
      await root.getDirectoryHandle(name, { create: true });
    } catch {
      /* ignore */
    }
  }
}

export function getStorageFolderTree(): { root: string; subfolders: readonly string[] } {
  const { storageRootLabel } = getStorageSettings();
  return {
    root: storageRootLabel || SYSTEM_DIRS.MAIN,
    subfolders: STORAGE_SUBFOLDERS,
  };
}
