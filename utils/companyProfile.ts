/**
 * Profil entreprise unifié — source unique pour l'affichage dans l'app
 */

import { getStoreData, STORAGE_KEYS, DEFAULT_SETTINGS } from '../store';
import { StoreSettings, User } from '../types';
import type { Language } from './i18n';

export interface CompanyProfile {
  companyName: string;
  logo?: string;
  buildingImage?: string;
  publicEmail: string;
  publicPhone: string;
  publicPhones: string[];
  address: string;
  businessType: string;
  responsibleDisplayName: string;
  currency: string;
}

export function resolveCompanyProfile(
  settings?: StoreSettings | null,
  user?: User | null
): CompanyProfile {
  const s = settings ?? getStoreData<StoreSettings>(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);

  const responsible =
    s.responsibleDisplayName?.trim() ||
    s.adminName?.trim() ||
    user?.displayName?.trim() ||
    (user?.firstName
      ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ''}`.trim()
      : '') ||
    user?.name?.trim() ||
    '';

  const publicEmail = (s.publicEmail || s.email || '').trim();
  const phones = (s.publicPhones?.filter(Boolean) ?? []).map((p) => p.trim());
  const legacyPhone = (s.publicPhone || s.phone || '').trim();
  const publicPhone = phones[0] || legacyPhone;
  const publicPhones = phones.length > 0 ? phones : legacyPhone ? [legacyPhone] : [];

  const businessType =
    s.businessType === 'other' && s.customActivityType?.trim()
      ? s.customActivityType.trim()
      : s.businessType?.trim() || '';

  return {
    companyName: s.name?.trim() || "Casier d'Or",
    logo: s.logo,
    buildingImage: s.buildingImage,
    publicEmail,
    publicPhone,
    publicPhones,
    address: s.address?.trim() || '',
    businessType,
    responsibleDisplayName: responsible,
    currency: s.currency || 'XAF',
  };
}

/** Nom pour journaux d'activité / audit */
export function getActivityUserName(settings?: StoreSettings | null, user?: User | null): string {
  const profile = resolveCompanyProfile(settings, user);
  return profile.responsibleDisplayName || 'Système';
}

export function getBusinessTypeLabel(
  t: (key: string) => string,
  businessType?: string,
  language: Language = 'fr'
): string {
  if (!businessType) return '';
  const normalized = businessType.toLowerCase().replace(/\s+/g, '');
  const keyMap: Record<string, string> = {
    depot: 'enum.activityType.depot',
    'dépôtdeboisson': 'enum.activityType.depot',
    retail: 'enum.activityType.retail',
    wholesale: 'enum.activityType.wholesale',
    service: 'enum.activityType.service',
  };
  const key = keyMap[normalized] || `enum.activityType.${normalized}`;
  const translated = t(key);
  if (translated !== key) return translated;
  return businessType;
}

/** Normalise les champs legacy avant sauvegarde settings */
export function normalizeSettingsForSave(settings: StoreSettings): StoreSettings {
  const responsible =
    settings.responsibleDisplayName?.trim() || settings.adminName?.trim() || '';
  const publicEmail = (settings.publicEmail || settings.email || '').trim();
  const phones = (settings.publicPhones?.filter(Boolean) ?? []).map((p) => p.trim());
  const legacyPhone = (settings.publicPhone || settings.phone || '').trim();
  const publicPhone = phones[0] || legacyPhone;
  const publicPhones = phones.length > 0 ? phones : legacyPhone ? [legacyPhone] : [];

  return {
    ...settings,
    responsibleDisplayName: responsible,
    adminName: responsible,
    publicEmail,
    publicPhone,
    publicPhones,
    email: publicEmail,
    phone: publicPhone,
    updatedAt: Date.now(),
  };
}

export function useCompanyProfileFromStore(user?: User | null): CompanyProfile {
  const settings = getStoreData<StoreSettings>(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
  return resolveCompanyProfile(settings, user);
}
