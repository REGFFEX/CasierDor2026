/**
 * Core Module - Offline-First Multi-Device Architecture
 * 
 * This is the main entry point for the new offline-first data layer.
 * Exports all core services and types for the new architecture.
 * 
 * IMPORTANT: This new system coexists with the old system during migration.
 * Do not remove old services until migration is complete and validated.
 */

// Identity services
export * from './identity/IdentityTypes';
export { deviceIdentityService } from './identity/DeviceIdentityService';
export { userIdentityService } from './identity/UserIdentityService';

// Database services
export * from './database/DatabaseTypes';
export { IndexedDBDatabase } from './database/IndexedDBDatabase';
export { databaseFactory } from './database/DatabaseFactory';
export * from './database/DatabaseSchema';

// Sync services
export * from './sync/OutboxTypes';
export { outboxService } from './sync/OutboxService';
export * from './sync/SyncTypes';
export { syncEngine } from './sync/SyncEngine';
export { conflictResolver } from './sync/ConflictResolver';

// Product services (pilot module)
export * from './product/ProductTypes';
export { productRepository } from './product/ProductRepository';
export { productUseCase } from './product/ProductUseCase';

// Auth services
export { supabaseAuthService } from './auth/SupabaseAuthService';

// Compatibility services
export * from './compatibility/LegacyCompatibilityAdapter';
export { legacyCompatibilityAdapter } from './compatibility/LegacyCompatibilityAdapter';

/**
 * Initialize the entire core system
 * Call this once during app initialization
 */
export async function initializeCoreSystem(): Promise<void> {
  // Initialize compatibility adapter first
  await legacyCompatibilityAdapter.initialize();
  
  // Initialize identity services
  await deviceIdentityService.getOrCreateDeviceIdentity();
  
  // Initialize database
  await databaseFactory.getDatabase();
  
  // Initialize sync services
  await outboxService.initialize();
  await syncEngine.initialize();
  
  // Initialize product use case
  await productUseCase.initialize();
  
  // Initialize auth service
  await supabaseAuthService.initialize();
}

/**
 * Get system status
 */
export async function getSystemStatus(): Promise<{
  database: boolean;
  identity: boolean;
  sync: boolean;
  auth: boolean;
  compatibility: {
    authMode: string;
    dataSourceMode: string;
    enableNewFeatures: boolean;
  };
}> {
  try {
    const db = await databaseFactory.getDatabase();
    const identity = userIdentityService.getCurrentIdentityMapping() !== null;
    const sync = syncEngine.getState() !== 'error';
    const auth = supabaseAuthService.isAuthenticated();
    const compatibilityConfig = legacyCompatibilityAdapter.getConfig();

    return {
      database: db.isReady(),
      identity,
      sync,
      auth,
      compatibility: {
        authMode: compatibilityConfig.authMode,
        dataSourceMode: compatibilityConfig.dataSourceMode,
        enableNewFeatures: compatibilityConfig.enableNewFeatures
      }
    };
  } catch (error) {
    console.error('Error getting system status:', error);
    return {
      database: false,
      identity: false,
      sync: false,
      auth: false,
      compatibility: {
        authMode: 'UNKNOWN',
        dataSourceMode: 'UNKNOWN',
        enableNewFeatures: false
      }
    };
  }
}