/**
 * Registre des modules / routes de l'application
 */

import type { NavigationItem } from '../constants';

export type AppModuleId =
  | 'dashboard'
  | 'sales'
  | 'products'
  | 'clients'
  | 'history'
  | 'stock'
  | 'accounting'
  | 'replenishment'
  | 'stats'
  | 'activity'
  | 'trash'
  | 'users'
  | 'settings'
  | 'about'
  | 'legal'
  | 'privacy';

/** Modules toujours visibles (non désactivables) */
export const CORE_MODULE_IDS: AppModuleId[] = ['dashboard', 'settings'];

const PATH_TO_MODULE: Record<string, AppModuleId> = {
  '/': 'dashboard',
  '/dashboard': 'dashboard',
  '/new-sale': 'sales',
  '/products': 'products',
  '/clients': 'clients',
  '/history': 'history',
  '/stock': 'stock',
  '/accounting': 'accounting',
  '/replenishment': 'replenishment',
  '/stats': 'stats',
  '/activity': 'activity',
  '/trash': 'trash',
  '/users': 'users',
  '/settings': 'settings',
  '/about': 'about',
  '/legal': 'legal',
  '/privacy': 'privacy',
};

export function pathToModuleId(path: string): AppModuleId | null {
  const normalized = path.split('?')[0].replace(/\/$/, '') || '/';
  return PATH_TO_MODULE[normalized] ?? null;
}

export function isModuleDisabled(moduleId: AppModuleId, disabledModules?: string[]): boolean {
  if (CORE_MODULE_IDS.includes(moduleId)) return false;
  return (disabledModules ?? []).includes(moduleId);
}

export function filterNavigationItems(
  items: NavigationItem[],
  disabledModules?: string[]
): NavigationItem[] {
  return items.filter((item) => {
    const id = item.id ?? pathToModuleId(item.path);
    if (!id) return true;
    return !isModuleDisabled(id, disabledModules);
  });
}

const RECENT_MODULES_KEY = 'casier_recent_modules';
const MAX_RECENT = 8;

export function trackModuleVisit(path: string): void {
  const id = pathToModuleId(path);
  if (!id || id === 'dashboard' || id === 'settings') return;

  try {
    const raw = localStorage.getItem(RECENT_MODULES_KEY);
    const list: AppModuleId[] = raw ? JSON.parse(raw) : [];
    const next = [id, ...list.filter((m) => m !== id)].slice(0, MAX_RECENT);
    localStorage.setItem(RECENT_MODULES_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

export function getRecentModuleIds(): AppModuleId[] {
  try {
    const raw = localStorage.getItem(RECENT_MODULES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export const ALL_MODULE_IDS: AppModuleId[] = [
  'dashboard',
  'sales',
  'products',
  'clients',
  'history',
  'stock',
  'accounting',
  'replenishment',
  'stats',
  'activity',
  'trash',
  'users',
  'settings',
  'about',
  'legal',
  'privacy',
];

export function moduleIdToPath(moduleId: AppModuleId): string {
  const entry = Object.entries(PATH_TO_MODULE).find(([, id]) => id === moduleId);
  return entry?.[0] ?? '/';
}
