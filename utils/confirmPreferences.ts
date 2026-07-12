/**
 * Préférences de confirmation d'actions sensibles
 */

export interface ConfirmPreferences {
  /** Désactiver toutes les confirmations (admin uniquement en UI) */
  globalDisabled?: boolean;
  /** actionId → ne plus demander */
  neverAskAgain?: string[];
  /** actionId nécessitant saisie « CONFIRMER » */
  strictActions?: string[];
}

const PREFS_KEY = 'casier_confirm_prefs';
const LEGACY_NEVER_KEY = 'neverAskAgain';

export function loadConfirmPreferences(): ConfirmPreferences {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (raw) return JSON.parse(raw) as ConfirmPreferences;
    const legacy = localStorage.getItem(LEGACY_NEVER_KEY);
    if (legacy) {
      return { neverAskAgain: JSON.parse(legacy) as string[] };
    }
  } catch {
    /* ignore */
  }
  return {};
}

export function saveConfirmPreferences(prefs: ConfirmPreferences): void {
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  if (prefs.neverAskAgain) {
    localStorage.setItem(LEGACY_NEVER_KEY, JSON.stringify(prefs.neverAskAgain));
  }
}

export function shouldSkipConfirmation(actionId: string, prefs?: ConfirmPreferences): boolean {
  const p = prefs ?? loadConfirmPreferences();
  if (p.globalDisabled) return true;
  return (p.neverAskAgain ?? []).includes(actionId);
}

export function isStrictConfirmation(actionId: string, prefs?: ConfirmPreferences): boolean {
  const p = prefs ?? loadConfirmPreferences();
  const strict = new Set([
    'resetAll',
    'restoreData',
    'importJson',
    'disableModule',
    ...(p.strictActions ?? []),
  ]);
  return strict.has(actionId);
}

export function setNeverAskAgain(actionId: string, enabled: boolean): ConfirmPreferences {
  const prefs = loadConfirmPreferences();
  const set = new Set(prefs.neverAskAgain ?? []);
  if (enabled) set.add(actionId);
  else set.delete(actionId);
  const next = { ...prefs, neverAskAgain: Array.from(set) };
  saveConfirmPreferences(next);
  return next;
}
