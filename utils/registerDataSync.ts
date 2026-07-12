/**
 * Synchronisation unique : inscription → settings + utilisateur responsable
 */

import { getStoreData, setStoreData, STORAGE_KEYS, DEFAULT_SETTINGS } from '../store';
import { RegisterData, StoreSettings, User, UserRole } from '../types';
export interface RegisterSyncInput {
  form: RegisterData;
  user: User;
}

export function syncRegisterDataToStore({ form }: RegisterSyncInput): StoreSettings {
  const current = getStoreData<StoreSettings>(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
  const displayName = `${form.firstName.trim()} ${form.lastName.trim()}`.trim();
  const phones = (form.publicPhones ?? []).map((p) => p.trim()).filter(Boolean);
  const primaryPhone = phones[0] || form.publicPhone?.trim() || form.phone?.trim() || '';
  const activity =
    form.activityType === 'other' && form.customActivityType?.trim()
      ? form.customActivityType.trim()
      : form.activityType || current.businessType;
  const enterprise =
    form.enterpriseType === 'other' && form.customEnterpriseType?.trim()
      ? form.customEnterpriseType.trim()
      : form.enterpriseType;

  const updated: StoreSettings = {
    ...current,
    name: form.companyName?.trim() || current.name,
    businessType: activity,
    customActivityType: form.customActivityType?.trim(),
    customEnterpriseType: form.customEnterpriseType?.trim(),
    enterpriseType: enterprise,
    address: form.address?.trim() || current.address,
    currency: form.currency || current.currency,
    logo: form.logo || current.logo,
    buildingImage: form.buildingImage || current.buildingImage,
    publicEmail: form.publicEmail?.trim() || form.email.trim(),
    publicPhone: primaryPhone,
    publicPhones: phones.length ? phones : primaryPhone ? [primaryPhone] : [],
    email: form.publicEmail?.trim() || form.email.trim(),
    phone: primaryPhone,
    responsibleDisplayName: displayName,
    adminName: displayName,
    userRole: UserRole.ADMIN,
    updatedAt: Date.now(),
  };

  setStoreData(STORAGE_KEYS.SETTINGS, updated);
  return updated;
}
