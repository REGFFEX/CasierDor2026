/**
 * Sync Engine V2
 * 
 * Main synchronization engine for offline-first architecture.
 * Coordinates push, pull, conflict resolution, and sync metadata.
 * This is a new implementation that coexists with the old sync engine
 * until migration is complete.
 */

import {
  SyncDirection,
  SyncState,
  SyncResult,
  SyncConfig,
  DEFAULT_SYNC_CONFIG,
  EntitySyncState,
  ISyncEngine
} from './SyncTypes';
import { outboxService } from './OutboxService';
import { conflictResolver } from './ConflictResolver';
import { databaseFactory } from '../database/DatabaseFactory';
import { IDatabase } from '../database/DatabaseTypes';
import { LocalProduct, OutboxEntry, SyncMetadata as DBSyncMetadata } from '../database/DatabaseSchema';
import { deviceIdentityService } from '../identity/DeviceIdentityService';
import { userIdentityService } from '../identity/UserIdentityService';

class SyncEngine implements ISyncEngine {
  private static instance: SyncEngine;
  private state: SyncState = SyncState.IDLE;
  private config: SyncConfig = DEFAULT_SYNC_CONFIG;
  private database: IDatabase | null = null;
  private syncInterval: number | null = null;
  private currentSync: Promise<SyncResult> | null = null;

  private constructor() {}

  static getInstance(): SyncEngine {
    if (!SyncEngine.instance) {
      SyncEngine.instance = new SyncEngine();
    }
    return SyncEngine.instance;
  }

  /**
   * Initialize the sync engine
   */
  async initialize(): Promise<void> {
    this.database = await databaseFactory.getDatabase();
    await outboxService.initialize();
  }

  /**
   * Start automatic synchronization
   */
  async start(): Promise<void> {
    if (this.state === SyncState.SYNCING) {
      return;
    }

    await this.initialize();
    this.state = SyncState.SYNCING;

    if (this.config.autoSync) {
      this.startAutoSync();
    }
  }

  /**
   * Stop automatic synchronization
   */
  async stop(): Promise<void> {
    this.state = SyncState.PAUSED;
    
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }

    // Wait for current sync to complete
    if (this.currentSync) {
      await this.currentSync;
    }

    this.state = SyncState.IDLE;
  }

  /**
   * Perform synchronization
   */
  async sync(direction: SyncDirection = SyncDirection.BIDIRECTIONAL): Promise<SyncResult> {
    if (this.currentSync) {
      return this.currentSync;
    }

    this.currentSync = this.performSync(direction);
    
    try {
      const result = await this.currentSync;
      return result;
    } finally {
      this.currentSync = null;
    }
  }

  /**
   * Get current sync state
   */
  getState(): SyncState {
    return this.state;
  }

  /**
   * Get current sync configuration
   */
  getConfig(): SyncConfig {
    return { ...this.config };
  }

  /**
   * Update sync configuration
   */
  setConfig(config: Partial<SyncConfig>): void {
    this.config = { ...this.config, ...config };
    
    // Restart auto-sync if configuration changed
    if (this.state === SyncState.SYNCING && this.config.autoSync) {
      this.stop();
      this.start();
    }
  }

  /**
   * Perform the actual synchronization
   */
  private async performSync(direction: SyncDirection): Promise<SyncResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    let pushed = 0;
    let pulled = 0;
    let conflicts = 0;

    try {
      const identity = userIdentityService.getCurrentIdentityMapping();
      if (!identity) {
        throw new Error('No active identity for sync');
      }

      const device = await deviceIdentityService.getOrCreateDeviceIdentity();

      if (direction === SyncDirection.PUSH || direction === SyncDirection.BIDIRECTIONAL) {
        const pushResult = await this.push(identity.tenantId, device.deviceId);
        pushed = pushResult.pushed;
        errors.push(...pushResult.errors);
      }

      if (direction === SyncDirection.PULL || direction === SyncDirection.BIDIRECTIONAL) {
        const pullResult = await this.pull(identity.tenantId, device.deviceId);
        pulled = pullResult.pulled;
        conflicts = pullResult.conflicts;
        errors.push(...pullResult.errors);
      }

      // Update sync metadata
      await this.updateSyncMetadata(identity.tenantId, {
        lastSyncAt: Date.now(),
        lastPushAt: direction === SyncDirection.PUSH || direction === SyncDirection.BIDIRECTIONAL ? Date.now() : undefined,
        lastPullAt: direction === SyncDirection.PULL || direction === SyncDirection.BIDIRECTIONAL ? Date.now() : undefined,
        pushCount: pushed,
        pullCount: pulled,
        conflictCount: conflicts
      });

      return {
        success: errors.length === 0,
        direction,
        pushed,
        pulled,
        conflicts,
        errors,
        duration: Date.now() - startTime,
        timestamp: Date.now()
      };

    } catch (error) {
      errors.push(String(error));
      this.state = SyncState.ERROR;
      
      return {
        success: false,
        direction,
        pushed,
        pulled,
        conflicts,
        errors,
        duration: Date.now() - startTime,
        timestamp: Date.now()
      };
    }
  }

  /**
   * Push local mutations to remote
   */
  private async push(tenantId: string, deviceId: string): Promise<SyncResult> {
    const errors: string[] = [];
    let pushed = 0;

    try {
      // Get pending mutations from outbox
      const pendingMutations = await outboxService.getPendingMutations(tenantId);

      for (const mutation of pendingMutations) {
        try {
          await outboxService.markAsProcessing(mutation.mutationId);
          
          // Process the mutation based on entity type
          const success = await this.processMutation(mutation);
          
          if (success) {
            await outboxService.markAsCompleted(mutation.mutationId);
            pushed++;
          } else {
            await outboxService.markAsFailed(mutation.mutationId, 'Failed to process mutation');
          }
        } catch (error) {
          await outboxService.markAsFailed(mutation.mutationId, String(error));
          errors.push(`Mutation ${mutation.mutationId} failed: ${error}`);
        }
      }

      return {
        success: errors.length === 0,
        direction: SyncDirection.PUSH,
        pushed,
        pulled: 0,
        conflicts: 0,
        errors,
        duration: 0,
        timestamp: Date.now()
      };

    } catch (error) {
      errors.push(`Push failed: ${error}`);
      return {
        success: false,
        direction: SyncDirection.PUSH,
        pushed,
        pulled: 0,
        conflicts: 0,
        errors,
        duration: 0,
        timestamp: Date.now()
      };
    }
  }

  /**
   * Pull remote changes to local
   */
  private async pull(tenantId: string, deviceId: string): Promise<SyncResult> {
    const errors: string[] = [];
    let pulled = 0;
    let conflicts = 0;

    try {
      // For now, we'll implement a basic pull for products
      // This will be enhanced with full delta sync later
      const localProducts = await this.getLocalProducts(tenantId);
      const remoteProducts = await this.getRemoteProducts(tenantId);

      // Detect conflicts
      const conflictInfos = conflictResolver.detectConflicts(localProducts, remoteProducts);
      conflicts = conflictInfos.length;

      // Process remote products
      for (const remoteProduct of remoteProducts) {
        const localProduct = localProducts.find(p => p.id === remoteProduct.id);

        if (!localProduct) {
          // New remote product, pull it
          await this.saveRemoteProduct(remoteProduct);
          pulled++;
        } else if (localProduct.version < remoteProduct.version) {
          // Remote is newer, pull it (unless there's a conflict)
          const hasConflict = conflictInfos.some(c => c.entityId === remoteProduct.id);
          if (!hasConflict) {
            await this.saveRemoteProduct(remoteProduct);
            pulled++;
          }
        }
      }

      return {
        success: errors.length === 0,
        direction: SyncDirection.PULL,
        pushed: 0,
        pulled,
        conflicts,
        errors,
        duration: 0,
        timestamp: Date.now()
      };

    } catch (error) {
      errors.push(`Pull failed: ${error}`);
      return {
        success: false,
        direction: SyncDirection.PULL,
        pushed: 0,
        pulled: 0,
        conflicts: 0,
        errors,
        duration: 0,
        timestamp: Date.now()
      };
    }
  }

  /**
   * Process a single mutation from the outbox
   */
  private async processMutation(mutation: OutboxEntry): Promise<boolean> {
    // This will be implemented with actual Supabase operations
    // For now, it's a placeholder that simulates success
    console.log('Processing mutation:', mutation.mutationId, mutation.operation, mutation.entityType);
    
    // TODO: Implement actual Supabase push operations
    // This will involve calling Supabase client based on entity type and operation
    
    return true; // Simulate success for now
  }

  /**
   * Get local products from database
   */
  private async getLocalProducts(tenantId: string): Promise<LocalProduct[]> {
    if (!this.database) {
      await this.initialize();
    }

    const result = await this.database!.query<LocalProduct>('products', [
      { field: 'tenantId', operator: 'eq', value: tenantId }
    ]);

    return result.data;
  }

  /**
   * Get remote products from Supabase
   */
  private async getRemoteProducts(tenantId: string): Promise<LocalProduct[]> {
    // TODO: Implement actual Supabase pull operations
    // For now, return empty array
    return [];
  }

  /**
   * Save a remote product to local database
   */
  private async saveRemoteProduct(product: LocalProduct): Promise<void> {
    if (!this.database) {
      await this.initialize();
    }

    const existing = await this.database!.getById<LocalProduct>('products', product.id);
    if (existing) {
      await this.database!.update('products', product.id, product);
    } else {
      await this.database!.insert('products', product);
    }
  }

  /**
   * Update sync metadata in database
   */
  private async updateSyncMetadata(tenantId: string, updates: Partial<DBSyncMetadata>): Promise<void> {
    if (!this.database) {
      await this.initialize();
    }

    const key = `sync_${tenantId}`;
    const existing = await this.database!.getById<DBSyncMetadata>('sync_metadata', key);

    const metadata: DBSyncMetadata = existing ? {
      ...existing,
      ...updates,
      updatedAt: Date.now()
    } : {
      key,
      tenantId,
      value: updates,
      updatedAt: Date.now()
    };

    if (existing) {
      await this.database!.update('sync_metadata', key, metadata);
    } else {
      await this.database!.insert('sync_metadata', metadata);
    }
  }

  /**
   * Start automatic sync interval
   */
  private startAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = window.setInterval(() => {
      if (this.state === SyncState.SYNCING && !this.currentSync) {
        this.sync().catch(error => {
          console.error('Auto-sync failed:', error);
        });
      }
    }, this.config.syncInterval);
  }

  /**
   * Perform initial sync after login
   */
  async performInitialSync(): Promise<SyncResult> {
    const identity = userIdentityService.getCurrentIdentityMapping();
    if (!identity) {
      throw new Error('No active identity for initial sync');
    }

    // Check remote state vs local state
    const localCount = await this.getLocalProducts(identity.tenantId).then(p => p.length);
    const remoteCount = await this.getRemoteProducts(identity.tenantId).then(p => p.length);

    const syncState = this.determineSyncState(localCount, remoteCount);

    // Perform appropriate sync based on state
    let direction: SyncDirection;
    switch (syncState) {
      case EntitySyncState.LOCAL_ONLY:
        direction = SyncDirection.PUSH;
        break;
      case EntitySyncState.REMOTE_ONLY:
        direction = SyncDirection.PULL;
        break;
      case EntitySyncState.SYNCED:
        direction = SyncDirection.BIDIRECTIONAL;
        break;
      case EntitySyncState.CONFLICT:
        direction = SyncDirection.BIDIRECTIONAL;
        break;
      default:
        direction = SyncDirection.BIDIRECTIONAL;
    }

    return this.sync(direction);
  }

  /**
   * Determine sync state based on local and remote counts
   */
  private determineSyncState(localCount: number, remoteCount: number): EntitySyncState {
    if (localCount === 0 && remoteCount === 0) {
      return EntitySyncState.EMPTY;
    }
    if (localCount > 0 && remoteCount === 0) {
      return EntitySyncState.LOCAL_ONLY;
    }
    if (localCount === 0 && remoteCount > 0) {
      return EntitySyncState.REMOTE_ONLY;
    }
    return EntitySyncState.SYNCED;
  }
}

export const syncEngine = SyncEngine.getInstance();