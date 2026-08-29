/**
 * Sync Engine Types
 * 
 * Defines the types and interfaces for the synchronization engine.
 * Handles push, pull, conflict resolution, and sync metadata.
 */

import { AppUserId, TenantId, DeviceId } from '../identity/IdentityTypes';

/**
 * Sync direction
 */
export enum SyncDirection {
  PUSH = 'push',
  PULL = 'pull',
  BIDIRECTIONAL = 'bidirectional'
}

/**
 * Sync state
 */
export enum SyncState {
  IDLE = 'idle',
  SYNCING = 'syncing',
  PAUSED = 'paused',
  ERROR = 'error'
}

/**
 * Sync result
 */
export interface SyncResult {
  success: boolean;
  direction: SyncDirection;
  pushed: number;
  pulled: number;
  conflicts: number;
  errors: string[];
  duration: number;
  timestamp: number;
}

/**
 * Sync configuration
 */
export interface SyncConfig {
  autoSync: boolean;
  syncInterval: number; // milliseconds
  retryInterval: number; // milliseconds
  maxRetries: number;
  batchSize: number;
}

/**
 * Default sync configuration
 */
export const DEFAULT_SYNC_CONFIG: SyncConfig = {
  autoSync: true,
  syncInterval: 30000, // 30 seconds
  retryInterval: 5000, // 5 seconds
  maxRetries: 3,
  batchSize: 50
};

/**
 * Entity sync state
 */
export enum EntitySyncState {
  LOCAL_ONLY = 'LOCAL_ONLY',
  REMOTE_ONLY = 'REMOTE_ONLY',
  SYNCED = 'SYNCED',
  CONFLICT = 'CONFLICT',
  EMPTY = 'EMPTY'
}

/**
 * Conflict resolution strategy
 */
export enum ConflictResolutionStrategy {
  LOCAL_WINS = 'LOCAL_WINS',
  REMOTE_WINS = 'REMOTE_WINS',
  MANUAL = 'MANUAL',
  MERGE = 'MERGE'
}

/**
 * Conflict information
 */
export interface ConflictInfo {
  entityId: string;
  entityType: string;
  localVersion: number;
  remoteVersion: number;
  localData: any;
  remoteData: any;
  conflictType: 'version' | 'delete' | 'field';
  detectedAt: number;
}

/**
 * Sync metadata for tracking sync state
 */
export interface SyncMetadata {
  tenantId: TenantId;
  lastSyncAt: number;
  lastPushAt: number;
  lastPullAt: number;
  pushCount: number;
  pullCount: number;
  conflictCount: number;
  version: number;
}

/**
 * Push service interface
 */
export interface IPushService {
  push(tenantId: string, deviceId: string): Promise<SyncResult>;
}

/**
 * Pull service interface
 */
export interface IPullService {
  pull(tenantId: string, deviceId: string): Promise<SyncResult>;
}

/**
 * Conflict resolver interface
 */
export interface IConflictResolver {
  detectConflicts(localData: any[], remoteData: any[]): ConflictInfo[];
  resolveConflict(conflict: ConflictInfo, strategy: ConflictResolutionStrategy): any;
}

/**
 * Sync engine interface
 */
export interface ISyncEngine {
  start(): Promise<void>;
  stop(): Promise<void>;
  sync(direction?: SyncDirection): Promise<SyncResult>;
  getState(): SyncState;
  getConfig(): SyncConfig;
  setConfig(config: Partial<SyncConfig>): void;
}