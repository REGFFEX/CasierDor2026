/**
 * Legacy Compatibility Adapter
 * 
 * Provides compatibility between the new offline-first architecture and the existing system.
 * This adapter allows gradual migration without breaking existing functionality.
 * 
 * IMPORTANT: This is a temporary layer that will be removed once migration is complete.
 */

import { authService } from '../../utils/authService';
import { supabaseAuthService } from '../auth/SupabaseAuthService';
import { userIdentityService } from '../identity/UserIdentityService';
import { deviceIdentityService } from '../identity/DeviceIdentityService';
import { productUseCase } from '../product/ProductUseCase';

/**
 * Authentication mode for compatibility
 */
export enum AuthMode {
  /** Use only legacy local authentication */
  LEGACY_ONLY = 'LEGACY_ONLY',
  /** Use only new Supabase authentication */
  NEW_ONLY = 'NEW_ONLY',
  /** Use both with migration support */
  HYBRID = 'HYBRID'
}

/**
 * Data source mode
 */
export enum DataSourceMode {
  /** Use only legacy localStorage data */
  LEGACY_ONLY = 'LEGACY_ONLY',
  /** Use only new local database */
  NEW_ONLY = 'NEW_ONLY',
  /** Use both with sync (read from new, fallback to legacy) */
  HYBRID = 'HYBRID'
}

/**
 * Compatibility configuration
 */
export interface CompatibilityConfig {
  authMode: AuthMode;
  dataSourceMode: DataSourceMode;
  migrateLegacyData: boolean;
  enableNewFeatures: boolean;
}

/**
 * Default compatibility configuration
 */
const DEFAULT_COMPATIBILITY_CONFIG: CompatibilityConfig = {
  authMode: AuthMode.HYBRID,
  dataSourceMode: DataSourceMode.HYBRID,
  migrateLegacyData: true,
  enableNewFeatures: false // Start with new features disabled
};

class LegacyCompatibilityAdapter {
  private static instance: LegacyCompatibilityAdapter;
  private config: CompatibilityConfig = DEFAULT_COMPATIBILITY_CONFIG;
  private isInitialized: boolean = false;

  private constructor() {}

  static getInstance(): LegacyCompatibilityAdapter {
    if (!LegacyCompatibilityAdapter.instance) {
      LegacyCompatibilityAdapter.instance = new LegacyCompatibilityAdapter();
    }
    return LegacyCompatibilityAdapter.instance;
  }

  /**
   * Initialize the compatibility adapter
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    // Load configuration from localStorage if available
    this.loadConfig();

    // Initialize new systems if needed
    if (this.config.authMode !== AuthMode.LEGACY_ONLY) {
      await supabaseAuthService.initialize();
      await deviceIdentityService.getOrCreateDeviceIdentity();
    }

    if (this.config.dataSourceMode !== AuthMode.LEGACY_ONLY) {
      await productUseCase.initialize();
    }

    this.isInitialized = true;
  }

  /**
   * Get current configuration
   */
  getConfig(): CompatibilityConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<CompatibilityConfig>): void {
    this.config = { ...this.config, ...updates };
    this.saveConfig();
  }

  /**
   * Check if new authentication should be used
   */
  shouldUseNewAuth(): boolean {
    return this.config.authMode === AuthMode.NEW_ONLY || 
           (this.config.authMode === AuthMode.HYBRID && this.config.enableNewFeatures);
  }

  /**
   * Check if new data source should be used
   */
  shouldUseNewDataSource(): boolean {
    return this.config.dataSourceMode === DataSourceMode.NEW_ONLY || 
           (this.config.dataSourceMode === DataSourceMode.HYBRID && this.config.enableNewFeatures);
  }

  /**
   * Migrate legacy user to new system
   */
  async migrateLegacyUser(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Try to find legacy user
      const legacyUser = authService.findUserByEmail(email);
      if (!legacyUser) {
        return { success: false, error: 'Legacy user not found' };
      }

      // Verify password
      const isValid = await authService.verifyPassword(password, legacyUser.password);
      if (!isValid) {
        return { success: false, error: 'Invalid password' };
      }

      // Register with new system
      const registerResult = await supabaseAuthService.register({
        email: legacyUser.email,
        password: password, // Note: In production, this should be handled more securely
        firstName: legacyUser.firstName,
        lastName: legacyUser.lastName,
        companyName: legacyUser.companyName
      });

      if (!registerResult.success) {
        return { success: false, error: registerResult.error };
      }

      // Mark legacy user as migrated
      this.markUserAsMigrated(legacyUser.id);

      return { success: true };
    } catch (error) {
      console.error('Error migrating legacy user:', error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Migrate legacy product data to new system
   */
  async migrateLegacyProducts(): Promise<{ migrated: number; errors: string[] }> {
    if (!this.config.migrateLegacyData) {
      return { migrated: 0, errors: ['Migration disabled in config'] };
    }

    const errors: string[] = [];
    let migrated = 0;

    try {
      // Get legacy products from localStorage
      const legacyProducts = this.getLegacyProducts();
      
      const identity = userIdentityService.getCurrentIdentityMapping();
      if (!identity) {
        return { migrated: 0, errors: ['No active identity for migration'] };
      }

      const device = await deviceIdentityService.getOrCreateDeviceIdentity();

      // Migrate each product
      for (const legacyProduct of legacyProducts) {
        try {
          const result = await productUseCase.createProduct({
            name: legacyProduct.name,
            description: legacyProduct.description,
            price: legacyProduct.price,
            cost: legacyProduct.cost,
            stock: legacyProduct.stock,
            category: legacyProduct.category,
            barcode: legacyProduct.barcode,
            sku: legacyProduct.sku,
            images: legacyProduct.images,
            attributes: legacyProduct.attributes
          });

          if (result.success) {
            migrated++;
            this.markProductAsMigrated(legacyProduct.id);
          } else {
            errors.push(`Failed to migrate product ${legacyProduct.id}: ${result.error}`);
          }
        } catch (error) {
          errors.push(`Error migrating product ${legacyProduct.id}: ${error}`);
        }
      }

      return { migrated, errors };
    } catch (error) {
      errors.push(`Migration failed: ${error}`);
      return { migrated, errors };
    }
  }

  /**
   * Check if user has been migrated
   */
  isUserMigrated(userId: string): boolean {
    try {
      const migratedUsers = JSON.parse(localStorage.getItem('casierdor_migrated_users') || '[]');
      return migratedUsers.includes(userId);
    } catch {
      return false;
    }
  }

  /**
   * Check if product has been migrated
   */
  isProductMigrated(productId: string): boolean {
    try {
      const migratedProducts = JSON.parse(localStorage.getItem('casierdor_migrated_products') || '[]');
      return migratedProducts.includes(productId);
    } catch {
      return false;
    }
  }

  /**
   * Get migration statistics
   */
  getMigrationStats(): {
    totalUsers: number;
    migratedUsers: number;
    totalProducts: number;
    migratedProducts: number;
  } {
    const legacyUsers = this.getLegacyUsers();
    const legacyProducts = this.getLegacyProducts();
    
    const migratedUsers = legacyUsers.filter(u => this.isUserMigrated(u.id)).length;
    const migratedProducts = legacyProducts.filter(p => this.isProductMigrated(p.id)).length;

    return {
      totalUsers: legacyUsers.length,
      migratedUsers,
      totalProducts: legacyProducts.length,
      migratedProducts
    };
  }

  /**
   * Enable new features gradually
   */
  async enableNewFeatures(): Promise<void> {
    // First, ensure critical migrations are complete
    const stats = this.getMigrationStats();
    
    if (stats.totalUsers > 0 && stats.migratedUsers < stats.totalUsers) {
      console.warn('Not all users migrated yet. Proceed with caution.');
    }

    // Update configuration
    this.updateConfig({ enableNewFeatures: true });
    
    // Re-initialize with new configuration
    await this.initialize();
  }

  /**
   * Disable new features (rollback)
   */
  async disableNewFeatures(): Promise<void> {
    this.updateConfig({ enableNewFeatures: false });
    
    // Re-initialize with new configuration
    await this.initialize();
  }

  /**
   * Mark user as migrated
   */
  private markUserAsMigrated(userId: string): void {
    try {
      const migratedUsers = JSON.parse(localStorage.getItem('casierdor_migrated_users') || '[]');
      if (!migratedUsers.includes(userId)) {
        migratedUsers.push(userId);
        localStorage.setItem('casierdor_migrated_users', JSON.stringify(migratedUsers));
      }
    } catch (error) {
      console.error('Error marking user as migrated:', error);
    }
  }

  /**
   * Mark product as migrated
   */
  private markProductAsMigrated(productId: string): void {
    try {
      const migratedProducts = JSON.parse(localStorage.getItem('casierdor_migrated_products') || '[]');
      if (!migratedProducts.includes(productId)) {
        migratedProducts.push(productId);
        localStorage.setItem('casierdor_migrated_products', JSON.stringify(migratedProducts));
      }
    } catch (error) {
      console.error('Error marking product as migrated:', error);
    }
  }

  /**
   * Get legacy users from localStorage
   */
  private getLegacyUsers(): any[] {
    try {
      const stored = localStorage.getItem('casierdor_users');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  /**
   * Get legacy products from localStorage
   */
  private getLegacyProducts(): any[] {
    try {
      const stored = localStorage.getItem('casierdor_products');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  /**
   * Load configuration from localStorage
   */
  private loadConfig(): void {
    try {
      const stored = localStorage.getItem('casierdor_compatibility_config');
      if (stored) {
        this.config = { ...DEFAULT_COMPATIBILITY_CONFIG, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error('Error loading compatibility config:', error);
    }
  }

  /**
   * Save configuration to localStorage
   */
  private saveConfig(): void {
    try {
      localStorage.setItem('casierdor_compatibility_config', JSON.stringify(this.config));
    } catch (error) {
      console.error('Error saving compatibility config:', error);
    }
  }

  /**
   * Reset compatibility adapter (useful for testing)
   */
  reset(): void {
    this.config = DEFAULT_COMPATIBILITY_CONFIG;
    this.isInitialized = false;
    localStorage.removeItem('casierdor_compatibility_config');
  }
}

export const legacyCompatibilityAdapter = LegacyCompatibilityAdapter.getInstance();