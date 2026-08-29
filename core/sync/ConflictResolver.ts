/**
 * Conflict Resolver
 * 
 * Implements conflict detection and resolution for offline-first synchronization.
 * Uses version-based optimistic concurrency control.
 */

import {
  ConflictInfo,
  ConflictResolutionStrategy,
  IConflictResolver
} from './SyncTypes';
import { LocalProduct } from '../database/DatabaseSchema';

class ConflictResolver implements IConflictResolver {
  /**
   * Detect conflicts between local and remote data
   */
  detectConflicts(localData: any[], remoteData: any[]): ConflictInfo[] {
    const conflicts: ConflictInfo[] = [];
    const remoteMap = new Map(remoteData.map(item => [item.id, item]));

    for (const localItem of localData) {
      const remoteItem = remoteMap.get(localItem.id);

      if (!remoteItem) {
        // Local-only item, no conflict
        continue;
      }

      // Check version conflict
      if (localItem.version !== remoteItem.version) {
        conflicts.push({
          entityId: localItem.id,
          entityType: this.getEntityType(localItem),
          localVersion: localItem.version,
          remoteVersion: remoteItem.version,
          localData: localItem,
          remoteData: remoteItem,
          conflictType: 'version',
          detectedAt: Date.now()
        });
      }
    }

    return conflicts;
  }

  /**
   * Resolve a conflict using the specified strategy
   */
  resolveConflict(conflict: ConflictInfo, strategy: ConflictResolutionStrategy): any {
    switch (strategy) {
      case ConflictResolutionStrategy.LOCAL_WINS:
        return this.resolveLocalWins(conflict);

      case ConflictResolutionStrategy.REMOTE_WINS:
        return this.resolveRemoteWins(conflict);

      case ConflictResolutionStrategy.MANUAL:
        return this.prepareManualResolution(conflict);

      case ConflictResolutionStrategy.MERGE:
        return this.mergeConflict(conflict);

      default:
        throw new Error(`Unknown conflict resolution strategy: ${strategy}`);
    }
  }

  /**
   * Resolve conflict by keeping local version
   */
  private resolveLocalWins(conflict: ConflictInfo): any {
    return {
      ...conflict.localData,
      version: Math.max(conflict.localVersion, conflict.remoteVersion) + 1,
      conflictResolved: true,
      resolutionStrategy: ConflictResolutionStrategy.LOCAL_WINS
    };
  }

  /**
   * Resolve conflict by keeping remote version
   */
  private resolveRemoteWins(conflict: ConflictInfo): any {
    return {
      ...conflict.remoteData,
      version: Math.max(conflict.localVersion, conflict.remoteVersion) + 1,
      conflictResolved: true,
      resolutionStrategy: ConflictResolutionStrategy.REMOTE_WINS
    };
  }

  /**
   * Prepare conflict for manual resolution
   */
  private prepareManualResolution(conflict: ConflictInfo): any {
    return {
      ...conflict.localData,
      _conflict: {
        local: conflict.localData,
        remote: conflict.remoteData,
        localVersion: conflict.localVersion,
        remoteVersion: conflict.remoteVersion,
        detectedAt: conflict.detectedAt
      },
      syncStatus: 'conflict'
    };
  }

  /**
   * Attempt to merge conflicting data
   */
  private mergeConflict(conflict: ConflictInfo): any {
    const local = conflict.localData;
    const remote = conflict.remoteData;

    // For products, we can merge certain fields
    if (this.getEntityType(local) === 'product') {
      return this.mergeProductFields(local, remote);
    }

    // Default merge: prefer remote for timestamps, local for content
    return {
      ...local,
      ...remote,
      version: Math.max(conflict.localVersion, conflict.remoteVersion) + 1,
      conflictResolved: true,
      resolutionStrategy: ConflictResolutionStrategy.MERGE
    };
  }

  /**
   * Merge product-specific fields intelligently
   */
  private mergeProductFields(local: LocalProduct, remote: LocalProduct): LocalProduct {
    const merged: LocalProduct = {
      ...local,
      // Prefer most recent values for critical fields
      name: remote.updatedAt > local.updatedAt ? remote.name : local.name,
      price: remote.updatedAt > local.updatedAt ? remote.price : local.price,
      stock: remote.updatedAt > local.updatedAt ? remote.stock : local.stock,
      // Use most recent version
      version: Math.max(local.version, remote.version) + 1,
      // Keep most recent timestamps
      updatedAt: Math.max(local.updatedAt, remote.updatedAt),
      // Merge arrays if present
      images: this.mergeArrays(local.images, remote.images),
      attributes: this.mergeObjects(local.attributes, remote.attributes),
      // Mark as conflict resolved
      syncStatus: 'synced',
      conflictResolved: true,
      resolutionStrategy: ConflictResolutionStrategy.MERGE
    };

    return merged;
  }

  /**
   * Merge arrays, combining unique elements
   */
  private mergeArrays(local: any[] | undefined, remote: any[] | undefined): any[] {
    if (!local && !remote) return [];
    if (!local) return remote || [];
    if (!remote) return local;

    const combined = [...local, ...remote];
    const unique = Array.from(new Set(combined));
    return unique;
  }

  /**
   * Merge objects, combining properties
   */
  private mergeObjects(local: any | undefined, remote: any | undefined): any {
    if (!local && !remote) return {};
    if (!local) return remote || {};
    if (!remote) return local;

    return { ...local, ...remote };
  }

  /**
   * Determine entity type from data structure
   */
  private getEntityType(data: any): string {
    if (data.barcode || data.sku || data.cost !== undefined) {
      return 'product';
    }
    if (data.phone || data.address) {
      return 'client';
    }
    if (data.total || data.paymentMethod) {
      return 'sale';
    }
    return 'unknown';
  }
}

export const conflictResolver = new ConflictResolver();