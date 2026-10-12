import { getStoreData, STORAGE_KEYS, DEFAULT_SETTINGS } from '../store';
import { StoreSettings } from '../types';

export type PlanType = 'FREE' | 'PRO' | 'BUSINESS' | 'BUSINESS_PRO' | 'ENTERPRISE';

export interface Entitlements {
  maxProducts: number;
  maxUsers: number;
  maxStores: number;
  cloudSyncEnabled: boolean;
  cloudBackupEnabled: boolean;
  advancedReportsEnabled: boolean;
  publicStoreEnabled: boolean;
  collaborationEnabled: boolean;
}

const PLAN_LIMITS: Record<PlanType, Entitlements> = {
  FREE: {
    maxProducts: 100,
    maxUsers: 1,
    maxStores: 1,
    cloudSyncEnabled: false,
    cloudBackupEnabled: false,
    advancedReportsEnabled: false,
    publicStoreEnabled: false,
    collaborationEnabled: false
  },
  PRO: {
    maxProducts: 1000,
    maxUsers: 3,
    maxStores: 1,
    cloudSyncEnabled: true,
    cloudBackupEnabled: true,
    advancedReportsEnabled: true,
    publicStoreEnabled: true,
    collaborationEnabled: false
  },
  BUSINESS: {
    maxProducts: 5000,
    maxUsers: 10,
    maxStores: 3,
    cloudSyncEnabled: true,
    cloudBackupEnabled: true,
    advancedReportsEnabled: true,
    publicStoreEnabled: true,
    collaborationEnabled: true
  },
  BUSINESS_PRO: {
    maxProducts: Infinity,
    maxUsers: 50,
    maxStores: 10,
    cloudSyncEnabled: true,
    cloudBackupEnabled: true,
    advancedReportsEnabled: true,
    publicStoreEnabled: true,
    collaborationEnabled: true
  },
  ENTERPRISE: {
    maxProducts: Infinity,
    maxUsers: Infinity,
    maxStores: Infinity,
    cloudSyncEnabled: true,
    cloudBackupEnabled: true,
    advancedReportsEnabled: true,
    publicStoreEnabled: true,
    collaborationEnabled: true
  }
};

/**
 * Récupère le plan actuel de l'entreprise.
 * À terme, ceci viendra du Token JWT ou de la table Supabase `Subscription`.
 * Pour le moment (MVP), on lit dans les paramètres locaux.
 */
export const getCurrentPlan = (): PlanType => {
  try {
    const settings = getStoreData<StoreSettings>(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
    const plan = (settings as any).activePlan || (settings as any).recommendedPlan || 'FREE';
    return plan as PlanType;
  } catch {
    return 'FREE';
  }
};

/**
 * Récupère les entitlements (capacités) associés au plan actuel.
 * C'est la fonction clé pour remplacer les anciens 'if plan === PRO' !
 */
export const getEntitlements = (): Entitlements => {
  const plan = getCurrentPlan();
  return PLAN_LIMITS[plan] || PLAN_LIMITS.FREE;
};

/**
 * Vérifie si l'utilisateur a atteint sa limite de produits.
 * @param currentCount Le nombre actuel de produits créés
 */
export const canCreateProduct = (currentCount: number): boolean => {
  const limits = getEntitlements();
  return currentCount < limits.maxProducts;
};

/**
 * Vérifie si la synchronisation Cloud est autorisée pour ce plan.
 */
export const isCloudSyncEnabled = (): boolean => {
  return getEntitlements().cloudSyncEnabled;
};
