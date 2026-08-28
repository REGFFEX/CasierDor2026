export type PlanCode = 'FREE' | 'PRO' | 'BUSINESS' | 'BUSINESS_PRO' | 'ENTERPRISE';

export interface Entitlements {
  maxUsers: number;
  maxStores: number;
  maxStorageMB: number;
  features: {
    offlineFirst: boolean;
    cloudSync: boolean;
    cloudBackup: boolean;
    advancedReports: boolean;
    publicStore: boolean;
    collaboration: boolean;
    advancedPermissions: boolean;
  };
}

const FREE_ENTITLEMENTS: Entitlements = {
  maxUsers: 1,
  maxStores: 1,
  maxStorageMB: 10, // Stockage très limité pour les settings
  features: {
    offlineFirst: true,
    cloudSync: false,
    cloudBackup: false,
    advancedReports: false,
    publicStore: false,
    collaboration: false,
    advancedPermissions: false,
  }
};

const PRO_ENTITLEMENTS: Entitlements = {
  maxUsers: 3,
  maxStores: 1,
  maxStorageMB: 500,
  features: {
    offlineFirst: true,
    cloudSync: true,
    cloudBackup: true,
    advancedReports: true,
    publicStore: true,
    collaboration: false,
    advancedPermissions: false,
  }
};

const BUSINESS_ENTITLEMENTS: Entitlements = {
  maxUsers: 15,
  maxStores: 3,
  maxStorageMB: 5000, // 5 GB
  features: {
    offlineFirst: true,
    cloudSync: true,
    cloudBackup: true,
    advancedReports: true,
    publicStore: true,
    collaboration: true,
    advancedPermissions: true,
  }
};

export class LicenseEngine {
  
  /**
   * Retourne les entitlements calculés pour un utilisateur/tenant donné
   * En mode offline pur (sans licence synchronisée), on fallback sur FREE
   */
  static getEntitlements(currentPlanCode: PlanCode = 'FREE'): Entitlements {
    switch (currentPlanCode) {
      case 'PRO':
        return PRO_ENTITLEMENTS;
      case 'BUSINESS':
      case 'BUSINESS_PRO':
      case 'ENTERPRISE':
        return BUSINESS_ENTITLEMENTS; // A adapter ultérieurement pour différencier
      case 'FREE':
      default:
        return FREE_ENTITLEMENTS;
    }
  }

  /**
   * Vérifie si l'utilisateur a atteint la limite d'une entité
   */
  static checkLimit(currentPlanCode: PlanCode, metric: keyof Omit<Entitlements, 'features'>, currentValue: number): boolean {
    const limits = this.getEntitlements(currentPlanCode);
    return currentValue >= limits[metric];
  }

  /**
   * Vérifie si une fonctionnalité est débloquée
   */
  static hasFeature(currentPlanCode: PlanCode, feature: keyof Entitlements['features']): boolean {
    const limits = this.getEntitlements(currentPlanCode);
    return limits.features[feature];
  }
}
